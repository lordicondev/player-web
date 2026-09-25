import {
    defaultState,
    stateSegment,
    type IconData,
    type IconState,
    type Segment,
} from '@lordicon/utils-lottie';

/**
 * The state a name asks for: `null` or an unknown name is the default state, `'*'` is none
 * (the whole file). Null when there is no such state.
 */
export function resolveState(
    states: IconState[],
    name: string | null | undefined,
): IconState | null {
    if (name === '*') return null;

    return states.find((state) => state.name === name) ?? defaultState(states);
}

/**
 * What plays without a state: from the first state to the end of the last, or the file's own
 * frames, `[ip, op)`, when it has no markers.
 */
export function wholeFileOf(data: IconData, states: IconState[]): Segment {
    const first = states[0];
    const last = states[states.length - 1];
    return first && last ? [first.time, stateSegment(last)[1]] : [data.ip, data.op];
}
