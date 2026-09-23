import { vi } from 'vitest';
import type { Player } from '../player.ts';

/**
 * Fakes timers and animation frames so `advance(ms)` moves the renderer on. `track()` a
 * player to have it destroyed before the clock goes back: the renderer runs one shared
 * frame loop, which stalls for the next test if it is cut off while an icon still plays.
 */
export function useClock() {
    const players: Player[] = [];
    vi.useFakeTimers();

    return {
        advance: (ms: number) => vi.advanceTimersByTime(ms),
        track: <T extends Player>(player: T): T => {
            players.push(player);
            return player;
        },
        restore: () => {
            for (const player of players.splice(0)) player.destroy();
            vi.advanceTimersByTime(50);
            vi.useRealTimers();
        },
    };
}
