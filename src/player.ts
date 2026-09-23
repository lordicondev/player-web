import {
    defaultColors,
    readControls,
    readStates,
    stateSegment,
    type ColorMap,
    type IconProperties,
    type IconState,
    type IconControl,
    type Segment,
    type Stroke,
} from '@lordicon/utils-lottie';
import { Palette } from './colors.ts';
import type { CompleteDetail, PlayerEventMap } from './events.ts';
import {
    createAnimation,
    frameOf,
    lastFrame,
    loadSegment,
    seekTo,
    segmentOf,
    type Renderer,
} from './renderer.ts';
import { Run } from './run.ts';
import { resolveState } from './states.ts';
import { StrokeWidth } from './stroke.ts';
import type {
    IconData,
    InitialProperties,
    PlaybackDirection,
    PlayerOptions,
    PlayOptions,
} from './types.ts';

/**
 * Plays a Lordicon icon in a container: its states, segments, colours and stroke.
 *
 *     const player = new Player(container, data, { state: 'hover-jump' });
 *     await player.play();
 *
 * Frames are absolute, as in the icon's markers. Every playback goes through `play()`, so a
 * subclass that overrides it sees all of them.
 */
export class Player extends EventTarget {
    readonly #container: HTMLElement;
    readonly #states: IconState[];
    readonly #controls: IconControl[];
    readonly #palette: Palette;
    readonly #stroke: StrokeWidth;
    readonly #frameRate: number;
    readonly #copy: boolean;
    readonly #ready: Promise<boolean>;
    #resolveReady!: (ready: boolean) => void;

    /** The icon data until `init()` hands it to the renderer. */
    #data: IconData | null;
    #animation: Renderer | null = null;
    #destroyed = false;

    #state: IconState | null;
    #direction: PlaybackDirection = 1;
    #speed = 1;
    #loop = false;
    #run: Run | null = null;
    #colors: ColorMap | null = null;

    constructor(
        container: HTMLElement,
        data: IconData,
        properties?: InitialProperties,
        options: PlayerOptions = {},
    ) {
        super();
        const { autoInit = true, copy = true } = options;

        this.#container = container;
        this.#data = data;
        this.#copy = copy;
        this.#frameRate = data.fr || 30;
        this.#states = readStates(data);
        this.#state = resolveState(this.#states, properties?.state);
        this.#controls = readControls(data, { renderer: true });
        this.#palette = new Palette(this.#controls, defaultColors(data));
        this.#stroke = new StrokeWidth(this.#controls);
        this.#palette.replace(properties?.colors);
        this.#stroke.set(properties?.stroke);
        this.#ready = new Promise((resolve) => (this.#resolveReady = resolve));

        if (autoInit) this.init();
    }

    // Lifecycle

    /** Creates the animation in the container. Does nothing the second time, or after `destroy()`. */
    init(): void {
        if (this.#animation || this.#destroyed || !this.#data) return;

        const data = this.#copy ? structuredClone(this.#data) : this.#data;
        this.#data = null;

        // Without a state, the file plays from its first state to its last.
        if (this.#states.length) {
            data.ip = this.#states[0].time;
            data.op = stateSegment(this.#states[this.#states.length - 1])[1];
        }

        const animation = createAnimation(this.#container, data, this.#segmentOfState());
        this.#animation = animation;

        animation.setSpeed(this.#speed);
        animation.setDirection(this.#direction);
        animation.loop = this.#loop;
        this.#palette.apply(animation);
        this.#stroke.apply(animation);
        animation.renderer.renderFrame(null);

        animation.addEventListener('complete', () => this.#complete());
        animation.addEventListener('loopComplete', () =>
            this.dispatchEvent(new CustomEvent('loop', { detail: this.#detail() })),
        );
        animation.addEventListener('enterFrame', () => this.dispatchEvent(new Event('frame')));

        if (animation.isLoaded) this.#becomeReady();
        else animation.addEventListener('config_ready', () => this.#becomeReady());
    }

    /** Removes the animation and settles a pending `play()`. Safe to call more than once. */
    destroy(): void {
        if (this.#destroyed) return;
        this.#destroyed = true;

        this.#settle(false);
        this.#resolveReady(false);
        this.#animation?.destroy();
        this.#animation = null;
        this.#data = null;
        this.dispatchEvent(new Event('destroy'));
    }

    /** True once the animation exists and can be played. */
    get ready(): boolean {
        return this.#animation !== null && this.#animation.isLoaded;
    }

    /** Resolves `true` when the player is ready, `false` when `destroy()` comes first. */
    get readyPromise(): Promise<boolean> {
        return this.#ready;
    }

    #becomeReady(): void {
        this.#resolveReady(true);
        this.dispatchEvent(new Event('ready'));
    }

    // Playback

    /**
     * Plays. Without options it resumes where the icon is, and starts over from the other end
     * once the segment has finished. Resolves `true` when the segment plays to its end,
     * `false` when another playback, `stop()` or a new state or segment takes over first.
     *
     *     player.play({ state: 'hover-jump' });
     *     player.play({ segment: [130, 191], reverse: true });
     *     await player.play({ from: 'start' });
     */
    play(options: PlayOptions = {}): Promise<boolean> {
        const animation = this.#animation;
        if (!animation) return Promise.resolve(false);

        const { state, segment, from, reverse } = options;
        const fresh =
            state !== undefined ||
            segment !== undefined ||
            from !== undefined ||
            reverse !== undefined;

        if (state !== undefined) this.#state = resolveState(this.#states, state);

        if (fresh) {
            this.#settle(false);
            this.#direction = reverse ? -1 : 1;
            animation.setDirection(this.#direction);
            const target =
                segment ??
                (state !== undefined ? (this.#segmentOfState() ?? this.#wholeFile()) : null) ??
                segmentOf(animation);
            loadSegment(animation, target, this.#direction);
        } else if (this.#atEnd()) {
            this.#settle(false);
            seekTo(animation, this.#direction > 0 ? animation.firstFrame : lastFrame(animation));
        }

        this.#run ??= new Run();
        animation.play();
        return this.#run.promise;
    }

    /** Pauses on the current frame. A pending `play()` stays pending. */
    pause(): void {
        this.#animation?.pause();
    }

    /** Pauses on the first frame of the segment. */
    stop(): void {
        const animation = this.#animation;
        if (!animation) return;

        this.#settle(false);
        seekTo(animation, animation.firstFrame);
    }

    /** Shows a frame of the loaded segment (absolute, or its first or last) and pauses. */
    seek(frame: number | 'start' | 'end'): void {
        const animation = this.#animation;
        if (!animation) return;

        if (frame === 'start') seekTo(animation, animation.firstFrame);
        else if (frame === 'end') seekTo(animation, lastFrame(animation));
        else seekTo(animation, frame);
    }

    get playing(): boolean {
        return this.#animation ? !this.#animation.isPaused : false;
    }

    /** Where playback is in the segment, 0 to 1. Setting it seeks. */
    get progress(): number {
        const animation = this.#animation;
        if (!animation) return 0;

        const span = animation.totalFrames - 1;
        return span > 0 ? (frameOf(animation) - animation.firstFrame) / span : 0;
    }

    set progress(value: number) {
        const animation = this.#animation;
        if (!animation) return;

        const span = animation.totalFrames - 1;
        seekTo(animation, animation.firstFrame + Math.min(Math.max(value, 0), 1) * span);
    }

    #atEnd(): boolean {
        const animation = this.#animation!;
        const frame = frameOf(animation);
        return this.#direction > 0 ? frame >= lastFrame(animation) : frame <= animation.firstFrame;
    }

    #complete(): void {
        const detail = this.#detail();
        this.#settle(true);
        this.dispatchEvent(new CustomEvent('complete', { detail }));
    }

    #settle(completed: boolean): void {
        this.#run?.settle(completed);
        this.#run = null;
    }

    #detail(): CompleteDetail {
        return { segment: this.segment, direction: this.#direction, state: this.state };
    }

    // What plays

    /** The state name, or null when the whole file plays. `null` sets the default state. */
    get state(): string | null {
        return this.#state?.name ?? null;
    }

    set state(name: string | null) {
        const next = resolveState(this.#states, name);
        if (next === this.#state) return;

        this.#state = next;
        const animation = this.#animation;
        if (!animation) return;

        const playing = this.playing;
        this.#settle(false);
        loadSegment(animation, this.#segmentOfState() ?? this.#wholeFile(), this.#direction);
        if (playing) void this.play({ from: 'start', reverse: this.#direction < 0 });
    }

    /** The state as an object, for the state helpers: `splitSegment(player.currentState)`. */
    get currentState(): IconState | null {
        return this.#state;
    }

    /** The icon's states, from its markers. */
    get states(): IconState[] {
        return this.#states;
    }

    /**
     * The loaded segment, `[start, end)` in absolute frames. Setting it loads it and pauses
     * on its first frame; `null` goes back to the state's segment.
     */
    get segment(): Segment {
        if (this.#animation) return segmentOf(this.#animation);
        return this.#segmentOfState() ?? this.#wholeFile();
    }

    set segment(segment: Segment | null) {
        const animation = this.#animation;
        if (!animation) return;

        this.#settle(false);
        this.direction = 1;
        loadSegment(animation, segment ?? this.#segmentOfState() ?? this.#wholeFile(), 1);
    }

    /** The frame on screen, absolute. */
    get frame(): number {
        return this.#animation ? frameOf(this.#animation) : this.segment[0];
    }

    /** Frames in the segment. The last one is `segment[1] - 1`. */
    get frameCount(): number {
        const [start, end] = this.segment;
        return end - start;
    }

    get frameRate(): number {
        return this.#frameRate;
    }

    /** How long the segment plays, in seconds, at the current speed. */
    get duration(): number {
        return this.frameCount / this.#frameRate / Math.abs(this.#speed || 1);
    }

    #segmentOfState(): Segment | null {
        return this.#state ? stateSegment(this.#state) : null;
    }

    /** From the first state to the end of the last. */
    #wholeFile(): Segment {
        const first = this.#states[0];
        const last = this.#states[this.#states.length - 1];
        return first && last ? [first.time, stateSegment(last)[1]] : [0, 0];
    }

    // How it plays

    /** 1 forwards, -1 backwards. Changing it mid-play turns the animation around. */
    get direction(): PlaybackDirection {
        return this.#direction;
    }

    set direction(direction: PlaybackDirection) {
        this.#direction = direction;
        this.#animation?.setDirection(direction);
    }

    get speed(): number {
        return this.#speed;
    }

    set speed(speed: number) {
        this.#speed = speed;
        this.#animation?.setSpeed(speed);
    }

    /** Plays the segment over and over; each round ends with a `loop` event. */
    get loop(): boolean {
        return this.#loop;
    }

    set loop(loop: boolean) {
        this.#loop = loop;
        if (this.#animation) this.#animation.loop = loop;
    }

    // Looks

    /**
     * The icon's colours by name. Set one (`player.colors.primary = 'red'`), put one back
     * (`delete player.colors.primary`), or replace them all (`player.colors = { ... }`).
     */
    get colors(): ColorMap {
        this.#colors ??= this.#palette.proxy(() => this.#refresh());
        return this.#colors;
    }

    set colors(colors: ColorMap | null) {
        this.#palette.replace(colors);
        this.#refresh();
    }

    /** The colours the icon comes with. */
    get defaultColors(): Readonly<ColorMap> {
        return this.#palette.defaults;
    }

    /** 1 (light), 2 (regular) or 3 (bold); null when the icon has no stroke setting. */
    get stroke(): Stroke | null {
        return this.#stroke.get();
    }

    set stroke(stroke: Stroke | null) {
        this.#stroke.set(stroke);
        this.#refresh();
    }

    /** Colours, stroke and state at once. What is left out goes back to the icon's own. */
    get properties(): IconProperties {
        const properties: IconProperties = {};
        if (this.#palette.names.length) properties.colors = { ...this.colors };
        const stroke = this.stroke;
        if (stroke !== null) properties.stroke = stroke;
        if (this.state !== null) properties.state = this.state;
        return properties;
    }

    set properties(properties: IconProperties) {
        this.#palette.replace(properties.colors);
        this.#stroke.set(properties.stroke);
        this.#refresh();
        this.state = properties.state ?? null;
    }

    #refresh(): void {
        const animation = this.#animation;
        if (!animation) return;

        this.#palette.apply(animation);
        this.#stroke.apply(animation);
        animation.renderer.renderFrame(null);
        this.dispatchEvent(new Event('refresh'));
    }

    // Low level

    /** The animation, for what the player does not cover. Null before `init()` and after `destroy()`. */
    get renderer(): Renderer | null {
        return this.#animation;
    }

    /** The icon's effect controls (colours, stroke), with paths into `renderer`. */
    get controls(): IconControl[] {
        return this.#controls;
    }

    // Typed events

    addEventListener<K extends keyof PlayerEventMap>(
        type: K,
        listener: (this: Player, event: PlayerEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
    ): void {
        super.addEventListener(type, listener, options);

        // `ready` may have fired in the constructor, before anyone could listen.
        if (type === 'ready' && listener && this.ready) this.#replayReady(listener, options);
    }

    removeEventListener<K extends keyof PlayerEventMap>(
        type: K,
        listener: (this: Player, event: PlayerEventMap[K]) => void,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions,
    ): void {
        super.removeEventListener(type, listener, options);
    }

    #replayReady(
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void {
        const signal = typeof options === 'object' ? options.signal : undefined;

        queueMicrotask(() => {
            if (signal?.aborted) return;

            const event = new Event('ready');
            if (typeof listener === 'function') listener.call(this, event);
            else listener.handleEvent(event);

            if (typeof options === 'object' && options.once) {
                super.removeEventListener('ready', listener, options);
            }
        });
    }
}
