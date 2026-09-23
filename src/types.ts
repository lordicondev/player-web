import type { IconProperties, Segment } from '@lordicon/utils-lottie';

export type {
    ColorMap,
    IconControl,
    IconData,
    IconProperties,
    IconState,
    Segment,
    StateType,
    Stroke,
} from '@lordicon/utils-lottie';

/** 1 plays forwards, -1 backwards. */
export type PlaybackDirection = 1 | -1;

/** What `play()` should play. Without options it resumes where the icon is. */
export type PlayOptions = {
    /** Load this state first. `null` is the default state. */
    state?: string | null;
    /** Load this segment first, `[start, end)` in absolute frames. */
    segment?: Segment;
    /** Start from the beginning of the loaded segment instead of resuming. */
    from?: 'start';
    /** Play backwards, from the end. */
    reverse?: boolean;
};

export type PlayerOptions = {
    /** Create the animation in the constructor. Default `true`; otherwise call `init()`. */
    autoInit?: boolean;
    /**
     * Give the renderer a copy of the data. Default `true`. Pass `false` when the data is
     * yours alone (fetched for this player): the renderer changes it.
     */
    copy?: boolean;
};

/** The constructor's second argument: icon properties to start with. */
export type InitialProperties = IconProperties | null | undefined;
