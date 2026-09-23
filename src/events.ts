import type { PlaybackDirection, Segment } from './types.ts';

/** What finished: the segment, which way it played, and the state it belongs to. */
export type CompleteDetail = {
    segment: Segment;
    direction: PlaybackDirection;
    state: string | null;
};

export interface PlayerEventMap {
    /** The animation is created and can be played. */
    ready: Event;
    /** A segment played to its end (or, backwards, to its start). */
    complete: CustomEvent<CompleteDetail>;
    /** A round of a looping segment ended; the next one starts at once. */
    loop: CustomEvent<CompleteDetail>;
    /** A frame was rendered. */
    frame: Event;
    /** Colours or stroke changed and were rendered. */
    refresh: Event;
    /** The player was destroyed. */
    destroy: Event;
}
