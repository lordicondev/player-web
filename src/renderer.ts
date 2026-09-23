import lottie from '@lordicon/internal';
import type { PlaybackDirection, Segment } from './types.ts';

/**
 * The animation the player drives: the part of the bundled `@lordicon/internal` renderer it
 * relies on. `player.renderer` gives it for what the player does not cover.
 */
export interface Renderer {
    /** The first frame of the loaded segment. */
    readonly firstFrame: number;
    /** Frames in the loaded segment. */
    readonly totalFrames: number;
    /** The frame on screen, counted from `firstFrame`. */
    readonly currentFrame: number;
    readonly isLoaded: boolean;
    readonly isPaused: boolean;
    readonly playSpeed: number;
    readonly playDirection: number;
    loop: boolean | number;
    /** What draws the frames; `renderFrame(null)` draws the current one again. */
    readonly renderer: { renderFrame(frame: number | null): void };
    play(): void;
    pause(): void;
    /** Shows a frame, counted from `firstFrame`, and pauses. */
    goToAndStop(frame: number, isFrame: true): void;
    setSegment(start: number, end: number): void;
    setSpeed(speed: number): void;
    setDirection(direction: PlaybackDirection): void;
    destroy(): void;
    addEventListener(
        name: 'complete' | 'loopComplete' | 'enterFrame' | 'config_ready',
        callback: () => void,
    ): () => void;
}

/**
 * The one place that knows the renderer counts frames from the start of the loaded
 * segment. Everything else in the player uses absolute frames.
 */
export function createAnimation(
    container: HTMLElement,
    data: object,
    segment: Segment | null,
): Renderer {
    return lottie.loadAnimation({
        container,
        animationData: data,
        loop: false,
        autoplay: false,
        initialSegment: segment ?? undefined,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true,
            hideOnTransparent: true,
        },
    });
}

/** The loaded segment, `[start, end)`. */
export function segmentOf(animation: Renderer): Segment {
    return [animation.firstFrame, animation.firstFrame + animation.totalFrames];
}

/** The frame on screen, absolute. */
export function frameOf(animation: Renderer): number {
    return animation.firstFrame + animation.currentFrame;
}

/** The last frame the segment reaches: its end is exclusive. */
export function lastFrame(animation: Renderer): number {
    return animation.firstFrame + animation.totalFrames - 1;
}

/** Shows an absolute frame, clamped to the loaded segment, and pauses. */
export function seekTo(animation: Renderer, frame: number): void {
    const relative = Math.min(Math.max(frame - animation.firstFrame, 0), animation.totalFrames - 1);
    animation.goToAndStop(relative, true);
}

/** Loads a segment and rests on the frame playback in `direction` would start from. */
export function loadSegment(
    animation: Renderer,
    segment: Segment,
    direction: PlaybackDirection,
): void {
    animation.setSegment(segment[0], segment[1]);
    seekTo(animation, direction > 0 ? segment[0] : segment[1] - 1);
}
