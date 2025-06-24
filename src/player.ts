import lottie, { AnimationConfig } from '@lordicon/internal';
import { ColorMap, EventHandler, EventName, IconProperties, IconState, LegacyIconProperties, LottieAnimationInstance, LottieData, LottieProperty, PlaybackDirection, Stroke } from './interfaces';
import { extractLottieProperties, resetLottieProperties, tupleColorToHex, updateLottieProperties } from './lottie';
import { parseStroke } from './parsers';
import { deepClone, get, isNil, set } from './utils';

/**
 * LottieOptions type represents the configuration options for the Lottie player.
 */
export type LottieOptions = Omit<AnimationConfig, 'container'>;

/**
 * Default options used by the Player.
 * These options are passed to the underlying Lottie player.
 */
const DEFAULT_LOTTIE_WEB_OPTIONS: Omit<AnimationConfig, 'container'> = {
    loop: false,
    autoplay: false,
    rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
        progressiveLoad: true,
        hideOnTransparent: true,
    },
}

/**
 * Supported state flags for icons.
 * Currently only 'default' is supported.
 */
const SUPPORTED_STATE_FLAGS = ['default'];

/**
 * Creates a Proxy for convenient color manipulation.
 * Allows direct access to color properties by name.
 * 
 * Example:
 *   player.colors.primary = '#ff0000';
 *   delete player.colors.secondary;
 */
function createColorsProxy(this: Player) {
    return new Proxy<Player>(this, {
        set: (target, property, value, _receiver): boolean => {
            if (typeof property === 'string') {
                if (value) {
                    updateLottieProperties(
                        this.lottieInstance,
                        this.lottieProperties.filter(c => c.type === 'color' && c.name === property),
                        value,
                    );
                } else {
                    resetLottieProperties(
                        this.lottieInstance,
                        this.lottieProperties.filter(c => c.type === 'color' && c.name === property),
                    );
                }
                target.refresh();
            }
            return true;
        },
        get: (target, property, _receiver) => {
            for (const current of target.lottieProperties) {
                if (current.type == 'color' && typeof property === 'string' && property == current.name) {
                    const data = get(this.lottieInstance, current.path);
                    if (data) {
                        return tupleColorToHex(data);
                    }
                }
            }
            return undefined;
        },
        deleteProperty: (target, property) => {
            if (typeof property === 'string') {
                resetLottieProperties(
                    this.lottieInstance,
                    this.lottieProperties.filter(c => c.type === 'color' && c.name === property),
                );
                target.refresh();
            }
            return true;
        },
        ownKeys: (target) => {
            return target.lottieProperties.filter(c => c.type == 'color').map(c => c.name);
        },
        has: (target, property) => {
            for (const current of target.lottieProperties) {
                if (current.type == 'color' && typeof property === 'string' && property == current.name) {
                    return true;
                }
            }
            return false;
        },
        getOwnPropertyDescriptor: (_target) => {
            return {
                enumerable: true,
                configurable: true,
            };
        },
    });
}

/**
 * Player class for controlling and customizing Lottie-based icons.
 */
export class Player {
    protected _container: HTMLElement;
    protected _iconData: any;
    protected _initialProperties: IconProperties & LegacyIconProperties;
    protected _lottieInstance?: LottieAnimationInstance;
    protected _ready: boolean = false;
    protected _colorsProxy?: any;
    protected _direction: PlaybackDirection = 1;
    protected _speed: number = 1;
    protected _lottieProperties?: LottieProperty[];
    protected _eventHandlers: any = {};

    protected _state?: IconState;
    protected _availableStates: IconState[];

    /**
     * Creates a new Player instance.
     * @param container The DOM element where the animation will be rendered.
     * @param data Lottie animation data.
     * @param properties Initial icon properties (colors, stroke, state, etc.).
     * @param options Additional options (e.g., autoInit).
     */
    constructor(
        container: HTMLElement,
        data: LottieData,
        properties?: IconProperties & LegacyIconProperties,
        options: { autoInit?: boolean } = { autoInit: true },
    ) {
        this._container = container;
        this._iconData = data;
        this._initialProperties = properties || {};

        // Parse available states from Lottie markers.
        this._availableStates = (data.markers || []).map((c: any) => {
            const parts: string[] = c.cm.split(':');

            const newState: IconState = {
                time: c.tm,
                duration: c.dr,
                name: '',
                default: false,
                params: [],
            };

            // Read state flags from the first part of the marker name.
            while (SUPPORTED_STATE_FLAGS.includes(parts[0])) {
                switch (parts[0]) {
                    case 'default':
                        newState.default = true;
                        break;
                    default:
                        throw new Error(`Unsupported state flag: ${parts[0]}`);
                }

                parts.shift();
            }

            // Parse state name and parameters from the remaining parts.
            newState.name = parts[0];
            newState.params = parts.slice(1, parts.length);

            // Set initial state if it matches, or use default if not specified.
            if (newState.name === this._initialProperties.state) {
                this._state = newState;
            } else if (newState.default && isNil(this._initialProperties.state)) {
                this._state = newState;
            }

            return newState;
        }).filter((c: IconState) => c.duration > 0);

        // Handle new and legacy icon files.
        if (this._availableStates.length) {
            // Remove unsupported stroke values.
            if (this._initialProperties.stroke && ![1, 2, 3, 'light', 'regular', 'bold'].includes(this._initialProperties.stroke)) {
                delete this._initialProperties.stroke;
            }

            // Fallback to default state if initial is invalid.
            if (this._initialProperties.state && !this._state) {
                this._state = this._availableStates.filter(c => c.default)[0];
            }
        }

        // Legacy icon file support (no markers).
        if (!this._availableStates.length) {
            // Clone data before modifying.
            this._iconData = deepClone(this._iconData);

            // Extract customizable properties.
            const properties = extractLottieProperties(this._iconData, { lottieInstance: false });

            // Set initial state for legacy icons.
            if (properties && this._initialProperties.state) {
                const name = `state-${this._initialProperties.state.toLowerCase()}`;
                updateLottieProperties(
                    this._iconData,
                    properties.filter(c => c.name.startsWith('state-')),
                    0,
                );
                updateLottieProperties(
                    this._iconData,
                    properties.filter(c => c.name === name),
                    1,
                );
            }

            // Set initial stroke for legacy icons.
            if (properties && this._initialProperties.stroke) {
                const property = properties.filter(c => c.name === 'stroke')[0];
                if (property) {
                    const ratio = property.value / 50;
                    const value = (this._initialProperties.stroke as number) * ratio;
                    set(this._iconData, property.path, value);
                }
            }

            // Set initial scale for legacy icons.
            if (properties && this._initialProperties.scale) {
                const property = properties.filter(c => c.name === 'scale')[0];
                if (property) {
                    const ratio = property.value / 50;
                    const value = (this._initialProperties.scale as number) * ratio;
                    set(this._iconData, property.path, value);
                }
            }

            // Set initial axis for legacy icons.
            if (properties && this._initialProperties.axisX && this._initialProperties.axisY) {
                const property = properties.filter(c => c.name === 'axis')[0];
                if (property) {
                    const ratio = ((property.value[0] + property.value[1]) / 2) / 50;
                    set(this._iconData, property.path + '.0', (this._initialProperties.axisX as number) * ratio);
                    set(this._iconData, property.path + '.1', (this._initialProperties.axisY as number) * ratio);
                }
            }
        }

        // Automatically initialize if requested.
        if (options.autoInit) {
            this.init();
        }
    }

    /**
     * Initializes the player and connects it to the DOM element.
     * Throws an error if already initialized.
     */
    init() {
        if (this._lottieInstance) {
            throw new Error('Already connected player!');
        }

        const fixedParams: any = {};
        const initialOptions: LottieOptions = {};

        // Set initial segment if state is defined.
        if (this._state) {
            initialOptions.initialSegment = [this._state.time, this._state.time + this._state.duration + 1];
        }

        // Adjust animation time for icons with states.
        if (this._availableStates.length) {
            const firstState = this._availableStates[0];
            const lastState = this._availableStates[this._availableStates.length - 1];

            fixedParams.ip = firstState.time;
            fixedParams.op = lastState.time + lastState.duration + 1;
        }

        // Load the Lottie animation.
        this._lottieInstance = lottie.loadAnimation({
            ...DEFAULT_LOTTIE_WEB_OPTIONS,
            ...initialOptions,
            container: this._container,
            animationData: Object.assign(deepClone(this._iconData), fixedParams),
        });

        // Set initial colors and stroke if provided.
        if (this._initialProperties.colors) {
            this.colors = this._initialProperties.colors;
        }

        if (this._initialProperties.stroke) {
            this.stroke = this._initialProperties.stroke;
        }

        // Register event listeners for animation lifecycle.
        this._lottieInstance.addEventListener('complete', () => {
            this.triggerEvent('complete');
        });

        this._lottieInstance.addEventListener('loopComplete', () => {
            this.triggerEvent('complete');
        });

        this._lottieInstance.addEventListener('enterFrame', () => {
            this.triggerEvent('frame');
        });

        // Mark as ready when loaded.
        if (this._lottieInstance.isLoaded) {
            this._ready = true;
            this.triggerEvent('ready');
        } else {
            this._lottieInstance.addEventListener('config_ready', () => {
                this._ready = true;
                this.triggerEvent('ready');
            });
        }
    }

    /**
     * Destroys the player and releases all resources.
     * Throws an error if not initialized.
     */
    destroy() {
        if (!this._lottieInstance) {
            throw new Error('Not connected player!');
        }

        this._ready = false;

        this._lottieInstance.destroy();
        this._lottieInstance = undefined;

        this._colorsProxy = undefined;
        this._lottieProperties = undefined;
    }

    /**
     * Registers an event listener for a player event.
     * @param name Event name (e.g., 'complete', 'frame', 'ready').
     * @param handler Handler function to call when the event is triggered.
     * @returns Function to remove the listener.
     */
    addEventListener(
        name: EventName,
        handler: EventHandler,
    ): () => void {
        if (!this._eventHandlers[name]) {
            this._eventHandlers[name] = [];
        }
        this._eventHandlers[name].push(handler);

        return () => {
            this.removeEventListener(name, handler);
        };
    }

    /**
     * Removes an event listener for a player event.
     * @param name Event name.
     * @param handler Handler function to remove. If not provided, removes all handlers for the event.
     */
    removeEventListener(
        name: EventName,
        handler?: EventHandler,
    ) {
        if (!handler) {
            this._eventHandlers[name] = null;
        } else if (this._eventHandlers[name]) {
            let i = 0;
            let len = this._eventHandlers[name].length;
            while (i < len) {
                if (this._eventHandlers[name][i] === handler) {
                    this._eventHandlers[name].splice(i, 1);
                    i -= 1;
                    len -= 1;
                }
                i += 1;
            }
            if (!this._eventHandlers[name].length) {
                this._eventHandlers[name] = null;
            }
        }
    }

    /**
     * Triggers a player event and invokes all registered callbacks.
     * @param name Event name.
     * @param args Optional arguments to pass to the callbacks.
     */
    protected triggerEvent(
        name: EventName,
        args?: any,
    ) {
        if (this._eventHandlers[name]) {
            const callbacks = this._eventHandlers[name];
            for (let i = 0; i < callbacks.length; i += 1) {
                callbacks[i](args);
            }
        }
    }

    /**
     * Forces a re-render of the animation.
     */
    protected refresh() {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        this._lottieInstance.renderer.renderFrame(null);

        this.triggerEvent('refresh');
    }

    /**
     * Starts playing the animation from the current frame.
     * Note: If the animation is finished, it cannot be played again from the last frame.
     */
    play() {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        this._lottieInstance.setDirection(this._direction);
        this._lottieInstance.play();
    }

    /**
     * Plays the animation from the beginning of the current state or from the start if no state is set.
     */
    playFromStart() {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        this._lottieInstance.setDirection(1);
        if (this._state) {
            this._lottieInstance.playSegments([this._state.time, this._state.time + this._state.duration + 1], true);
        } else {
            this._lottieInstance.goToAndPlay(0);
        }
    }

    /**
     * Pauses the animation at the current frame.
     */
    pause() {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        this._lottieInstance.pause();
    }

    /**
     * Stop the animation.
     */
    stop() {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        this._lottieInstance.stop();
    }

    /**
     * Moves the animation to a specific frame and stops.
     * @param frame Frame number to seek to.
     */
    seek(frame: number) {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        this._lottieInstance.goToAndStop(frame, true);
    }

    /**
     * Moves the animation to the first frame and stops.
     */
    seekToStart() {
        this.seek(0);
    }

    /**
     * Moves the animation to the last frame and stops.
     */
    seekToEnd() {
        this.seek(Math.max(0, this.frameCount));
    }

    /**
     * Sets the animation segment to play.
     * If no segment is provided, resets to the default segment.
     * @param segment Optional segment as [start, end] frame numbers.
     */
    switchSegment(segment?: [number, number]) {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        if (segment) {
            this._lottieInstance.setSegment(segment[0], segment[1]);
        } else {
            this._lottieInstance.resetSegments(true);
        }

        this._lottieInstance.goToAndStop(0, true);
    }

    /**
     * Sets multiple icon properties at once. 
     * Any property not provided will be reset to its default value.
     * @param properties Properties to assign.
     */
    set properties(properties: IconProperties) {
        this.colors = properties.colors || null;
        this.stroke = properties.stroke || null;
        this.state = properties.state || null;
    }

    /**
     * Gets the current icon properties (colors, stroke, state).
     * @returns The current properties.
     */
    get properties(): IconProperties {
        const result: IconProperties = {};

        if (this.lottieProperties.filter(c => c.type === 'color').length) {
            result.colors = { ...this.colors };
        }

        if (this.lottieProperties.filter(c => c.name === 'stroke' || c.name === 'stroke-layers').length) {
            result.stroke = this.stroke!;
        }

        if (this._availableStates.length) {
            result.state = this.state!;
        }

        return result;
    }

    /**
     * Sets all customizable colors at once. 
     * Pass null to reset all colors to default.
     * @param colors Color map or null.
     */
    set colors(colors: ColorMap | null) {
        resetLottieProperties(
            this._lottieInstance,
            this.lottieProperties.filter(c => c.type === 'color'),
        );

        if (colors) {
            for (const [key, value] of Object.entries(colors)) {
                updateLottieProperties(
                    this._lottieInstance,
                    this.lottieProperties.filter(c => c.type === 'color' && c.name === key),
                    value,
                );
            }
        }

        this.refresh();
    }

    /**
     * Provides a proxy for reading or updating individual colors by name.
     * 
     * Example:
     *   player.colors.primary = '#ff0000';
     *   delete player.colors.secondary;
     */
    get colors(): ColorMap {
        if (!this._colorsProxy) {
            this._colorsProxy = createColorsProxy.call(this);
        }

        return this._colorsProxy;
    }

    /**
     * Sets the stroke width for the icon.
     * Pass null to reset to default.
     * @param stroke Stroke value or null.
     */
    set stroke(stroke: Stroke | null) {
        resetLottieProperties(
            this._lottieInstance,
            this.lottieProperties.filter(c => c.name === 'stroke' || c.name === 'stroke-layers'),
        );

        const newStroke = parseStroke(stroke!);

        if (newStroke) {
            updateLottieProperties(
                this._lottieInstance,
                this.lottieProperties.filter(c => c.name === 'stroke' || c.name === 'stroke-layers'),
                newStroke,
            );
        }

        this.refresh();
    }

    /**
     * Gets the current stroke width of the icon.
     * @returns Stroke value or null if not set.
     */
    get stroke(): Stroke | null {
        const property = this.lottieProperties.filter(c => c.name === 'stroke' || c.name === 'stroke-layers')[0];

        if (property) {
            let value = +get(this._lottieInstance, property.path);

            return parseStroke(value) || null;
        }

        return null;
    }

    /**
     * Sets the current state (animation segment) of the icon.
     * If the state does not exist, falls back to the default state.
     * @param state State name or null for default.
     */
    set state(state: string | null) {
        if (!this._lottieInstance) throw new Error('Player not initialized');
        if (state === this.state) {
            return;
        }

        const isPlaying = this.playing;

        this._state = undefined;

        if (isNil(state)) {
            this._state = this._availableStates.filter(c => c.default)[0];
        } else if (state) {
            this._state = this._availableStates.filter(c => c.name === state)[0];

            if (!this._state) {
                this._state = this._availableStates.filter(c => c.default)[0];
            }
        }

        this.switchSegment(
            this._state ? [this._state.time, this._state.time + this._state.duration + 1] : undefined,
        )

        if (isPlaying) {
            this.pause();
            this.play();
        }
    }

    /**
     * Gets the current state (animation segment) of the icon.
     * @returns State name or null if not set.
     */
    get state(): string | null {
        if (this._state) {
            return this._state.name;
        }

        return '';
    }

    /**
     * Sets the playback speed of the animation.
     * @param speed Playback speed (1 = normal).
     */
    set speed(speed: number) {
        this._speed = speed;
        this._lottieInstance?.setSpeed(speed);
    }

    /**
     * Gets the current playback speed.
     * @returns Playback speed.
     */
    get speed() {
        return this._speed;
    }

    /**
     * Sets the playback direction.
     * @param direction 1 for forward, -1 for reverse.
     */
    set direction(direction: PlaybackDirection) {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        this._direction = direction;
        this._lottieInstance.setDirection(direction);
    }

    /**
     * Gets the current playback direction.
     * @returns Playback direction.
     */
    get direction() {
        return this._direction;
    }

    /**
     * Enables or disables looping of the animation.
     * @param loop True to loop, false otherwise.
     */
    set loop(loop: boolean) {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        this._lottieInstance.loop = loop;
    }

    /**
     * Gets whether the animation is set to loop.
     * @returns True if looping, false otherwise.
     */
    get loop() {
        if (!this._lottieInstance) throw new Error('Player not initialized');
        return this._lottieInstance.loop ? true : false;
    }

    /**
     * Sets the current frame of the animation.
     * @param frame Frame number.
     */
    set frame(frame: number) {
        this.seek(Math.max(0, Math.min(this.frameCount, frame)));
    }

    /**
     * Gets the current frame of the animation.
     * @returns Current frame number.
     */
    get frame() {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        return this._lottieInstance.currentFrame;
    }

    /**
     * Gets the list of available states for the icon.
     * @returns Array of available states.
     */
    get availableStates() {
        return this._availableStates;
    }

    /**
     * Returns true if the animation is currently playing.
     */
    get playing() {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        return !this._lottieInstance.isPaused;
    }

    /**
     * Returns true if the player is ready for interaction.
     */
    get ready() {
        return this._ready;
    }

    /**
     * Gets the total number of frames in the animation.
     * @returns Frame count.
     */
    get frameCount() {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        return this._lottieInstance.getDuration(true) - 1;
    }

    /**
     * Gets the current segment of the animation as [start, end] frame numbers.
     * @returns Segment as [start, end].
     */
    get segment(): [number, number] {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        return [
            this._lottieInstance.firstFrame,
            this._lottieInstance.firstFrame + this._lottieInstance.totalFrames,
        ];
    }

    /**
     * Gets the duration of the animation in seconds.
     * @returns Duration in seconds.
     */
    get duration() {
        if (!this._lottieInstance) throw new Error('Player not initialized');

        return this._lottieInstance.getDuration(false);
    }

    /**
     * Provides access to the underlying Lottie player instance.
     * @returns LottieAnimationInstance.
     */
    get lottieInstance() {
        return this._lottieInstance;
    }

    /**
     * Gets all customizable properties for the icon.
     * @returns Array of LottieProperty.
     */
    get lottieProperties(): LottieProperty[] {
        if (!this._lottieProperties) {
            this._lottieProperties = extractLottieProperties(this._iconData, { lottieInstance: true });

            // legacy icon file support (without markers)
            if (!this._availableStates.length && this._lottieProperties) {
                this._lottieProperties = this._lottieProperties.filter(c => c.name !== 'scale' && c.name !== 'axis' && c.name !== 'stroke' && !c.name.startsWith('state-'));
            }
        }

        return this._lottieProperties || [];
    }
}