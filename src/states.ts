import { defaultState, type IconState } from '@lordicon/utils-lottie';

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
