/**
 * Icon animation data in Lottie JSON format.
 * This player is optimized for icons from [Lordicon](https://lordicon.com/).
 */
export type LottieData = any;

/**
 * Represents a single Lottie animation instance from `@lordicon/internal`.
 * Contains the current state and methods for controlling playback.
 */
export type LottieAnimationInstance = {
    name: string;
    isLoaded: boolean;
    currentFrame: number;
    currentRawFrame: number;
    firstFrame: number;
    totalFrames: number;
    frameRate: number;
    frameMult: number;
    playSpeed: number;
    playDirection: number;
    playCount: number;
    isPaused: boolean;
    autoplay: boolean;
    loop: boolean | number;
    renderer: any;
    animationID: string;
    assetsPath: string;
    timeCompleted: number;
    segmentPos: number;
    isSubframeEnabled: boolean;
    segments: FrameSegment | FrameSegment[];
    play(name?: string): void;
    stop(name?: string): void;
    togglePause(name?: string): void;
    destroy(name?: string): void;
    pause(name?: string): void;
    goToAndStop(value: number | string, isFrame?: boolean, name?: string): void;
    goToAndPlay(value: number | string, isFrame?: boolean, name?: string): void;
    includeLayers(data: any): void;
    setSegment(init: number, end: number): void;
    resetSegments(forceFlag: boolean): void;
    hide(): void;
    show(): void;
    resize(): void;
    setSpeed(speed: number): void;
    setDirection(direction: PlaybackDirection): void;
    setLoop(isLooping: boolean): void;
    playSegments(segments: FrameSegment | FrameSegment[], forceFlag?: boolean): void;
    setSubframe(useSubFrames: boolean): void;
    getDuration(inFrames?: boolean): number;
    triggerEvent(name: string, args: any): void;
    addEventListener(name: string, callback: any): () => void;
    removeEventListener(name: string, callback?: any): void;
};

/**
 * Supported property types for Lottie animations.
 */
export type LottiePropertyType = 'color' | 'slider' | 'point' | 'checkbox' | 'feature';

/**
 * Describes a property found in the animation.
 */
export interface LottieProperty {
    name: string;
    path: string;
    type: LottiePropertyType;
    value: any;
}

/**
 * Supported stroke weights for icons.
 */
export type Stroke = 1 | 2 | 3 | 'light' | 'regular' | 'bold';

/**
 * RGB color tuple in Lottie format: [r, g, b].
 */
export type RgbTuple = [number, number, number];

/**
 * RGB color as an object.
 */
export interface RgbColor {
    r: number;
    g: number;
    b: number;
}

/**
 * Object storing multiple named colors.
 * 
 * Example:
 * {
 *     primary: 'red',
 *     secondary: '#ff0000',
 * }
 */
export interface ColorMap {
    [key: string]: string;
}

/**
 * Animation segment as a tuple: [startFrame, endFrame].
 */
export type FrameSegment = [number, number];

/**
 * Animation playback direction: 1 (forward) or -1 (backward).
 */
export type PlaybackDirection = 1 | -1;

/**
 * Supported player event names.
 */
export type EventName = 'ready' | 'complete' | 'frame' | 'refresh';

/**
 * Player event callback type.
 */
export type EventHandler = () => void;

/**
 * Properties for legacy icons.
 */
export interface LegacyIconProperties {
    /**
     * Scale for legacy icons.
     */
    scale?: number;

    /**
     * Axis x for legacy icons.
     */
    axisX?: number;

    /**
     * Axis y for legacy icons.
     */
    axisY?: number;
}

/**
 * Properties for customizing icons.
 * 
 * Example:
 * {
 *     stroke: 'bold',
 *     colors: {
 *         primary: 'red',
 *     },
 * }
 */
export interface IconProperties {
    /**
     * State (motion type) of the icon. States allow switching between multiple animations built into a single icon file.
     */
    state?: string;

    /**
     * Colors.
     */
    colors?: ColorMap;

    /**
     * Stroke.
     */
    stroke?: Stroke;
}

/**
 * Details of a single animation state.
 */
export interface IconState {
    name: string;
    time: number;
    duration: number;
    params: string[];
    default?: boolean;
}
