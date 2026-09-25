import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Player } from './player.ts';
import type { PlayOptions } from './types.ts';
import { useClock } from './testing/clock.ts';
import { container, lockIcon } from './testing/icon.ts';

let clock: ReturnType<typeof useClock>;
beforeEach(() => (clock = useClock()));
afterEach(() => {
    clock.restore();
    document.body.replaceChildren();
});

/** A hover-locked player: segment [130, 191), 61 frames at 60 fps, about a second. */
function mount(state = 'hover-locked') {
    return clock.track(new Player(container(), lockIcon(), { state }));
}

describe('play', () => {
    it('plays the segment and resolves true at its end', async () => {
        const player = mount();
        const complete = vi.fn();
        player.addEventListener('complete', (event) => complete(event.detail));

        const done = player.play();
        clock.advance(1100);

        await expect(done).resolves.toBe(true);
        expect(player.frame).toBe(190);
        expect(complete).toHaveBeenCalledWith({
            segment: [130, 191],
            direction: 1,
            state: 'hover-locked',
        });
    });

    it('starts over once the segment has finished', async () => {
        const player = mount();
        player.play();
        clock.advance(1100);

        const again = player.play();
        expect(player.frame).toBe(130);
        clock.advance(1100);
        await expect(again).resolves.toBe(true);
    });

    it('loads a state and plays it from the start', () => {
        const player = mount();
        player.play({ state: 'hover-unlocked' });

        expect(player.state).toBe('hover-unlocked');
        expect(player.segment).toEqual([270, 331]);
        expect(player.frame).toBe(270);
        expect(player.playing).toBe(true);
    });

    it('plays a segment backwards from its end', async () => {
        const player = mount();
        const complete = vi.fn();
        player.addEventListener('complete', (event) => complete(event.detail.direction));

        const done = player.play({ segment: [200, 231], reverse: true });
        expect(player.direction).toBe(-1);
        expect(player.frame).toBe(230);

        clock.advance(600);
        await expect(done).resolves.toBe(true);
        expect(player.frame).toBe(200);
        expect(complete).toHaveBeenCalledWith(-1);
    });

    it('restarts from the start mid-play with from: start', () => {
        const player = mount();
        player.play();
        clock.advance(500);
        expect(player.frame).toBeGreaterThan(150);

        player.play({ from: 'start' });
        expect(player.frame).toBe(130);
    });

    it('resolves false when another playback takes over', async () => {
        const player = mount();
        const first = player.play();
        clock.advance(200);
        const second = player.play({ state: 'hover-unlocked' });

        await expect(first).resolves.toBe(false);
        clock.advance(1100);
        await expect(second).resolves.toBe(true);
    });

    it('keeps the promise through a pause and resumes where it was', async () => {
        const player = mount();
        const first = player.play();
        clock.advance(300);
        player.pause();
        const at = player.frame;
        clock.advance(300);
        expect(player.frame).toBe(at);

        const resumed = player.play();
        expect(resumed).toBe(first);
        clock.advance(1100);
        await expect(first).resolves.toBe(true);
    });

    it('completes once per play, and can start over from the handler', async () => {
        const player = mount();
        let rounds = 0;
        player.addEventListener('complete', () => {
            rounds++;
            if (rounds < 3) player.play({ from: 'start' });
        });

        player.play();
        clock.advance(3500);
        expect(rounds).toBe(3);
        expect(player.playing).toBe(false);
    });

    it('plays backwards from the end after direction = -1', async () => {
        const player = mount();
        const complete = vi.fn();
        player.addEventListener('complete', (event) => complete(event.detail.direction));
        player.seek('end');
        player.direction = -1;

        const done = player.play();
        clock.advance(1100);
        await expect(done).resolves.toBe(true);
        expect(player.frame).toBe(130);
        expect(complete).toHaveBeenCalledWith(-1);
    });

    it('turns around mid-play when the direction changes', async () => {
        const player = mount();
        const done = player.play();
        clock.advance(300);
        player.direction = -1;
        clock.advance(600);

        await expect(done).resolves.toBe(true);
        expect(player.frame).toBe(130);
    });
});

describe('stop and seek', () => {
    it('stops on the first frame and settles', async () => {
        const player = mount();
        const done = player.play();
        clock.advance(300);
        player.stop();

        await expect(done).resolves.toBe(false);
        expect(player.frame).toBe(130);
        expect(player.playing).toBe(false);
    });

    it('seeks absolute frames within the segment', () => {
        const player = mount();
        player.seek(150);
        expect(player.frame).toBe(150);
        player.seek(999);
        expect(player.frame).toBe(190);
        player.seek('start');
        expect(player.frame).toBe(130);
        player.seek('end');
        expect(player.frame).toBe(190);
    });

    it('seeks to the end of the state, not of the file', () => {
        const player = mount('in-reveal');
        player.seek('end');
        expect(player.frame).toBe(120);

        player.state = 'hover-unlocked';
        player.seek('end');
        expect(player.frame).toBe(330);
    });

    it('reads and sets progress', () => {
        const player = mount();
        player.progress = 0.5;
        expect(player.frame).toBe(160);
        expect(player.progress).toBe(0.5);
        player.progress = 2;
        expect(player.frame).toBe(190);
    });
});

describe('segment and state', () => {
    it('loads a segment and rests on its first frame; null goes back to the state', async () => {
        const player = mount();
        const done = player.play();
        player.segment = [140, 161];

        await expect(done).resolves.toBe(false);
        expect(player.frame).toBe(140);
        expect(player.playing).toBe(false);

        player.segment = null;
        expect(player.segment).toEqual([130, 191]);
    });

    it('plays a set segment from its start', async () => {
        const player = mount();
        player.segment = [140, 161];

        const done = player.play();
        expect(player.frame).toBe(140);
        clock.advance(500);
        await expect(done).resolves.toBe(true);
        expect(player.frame).toBe(160);
    });

    it('keeps playing through a state change', () => {
        const player = mount();
        player.play();
        clock.advance(300);
        player.state = 'hover-unlocked';

        expect(player.segment).toEqual([270, 331]);
        expect(player.frame).toBe(270);
        expect(player.playing).toBe(true);
    });

    it('resolves the state name: default, whole file, unknown', () => {
        const player = mount();
        player.state = null;
        expect(player.state).toBe('morph-unlocked');
        player.state = '*';
        expect(player.state).toBeNull();
        expect(player.segment).toEqual([0, 331]);
        player.state = 'nope';
        expect(player.state).toBe('morph-unlocked');
        expect(player.currentState).toEqual({
            name: 'morph-unlocked',
            time: 200,
            duration: 60,
            params: [],
            default: true,
        });
        player.state = '*';
        expect(player.currentState).toBeNull();
        expect(player.states.map((state) => state.name)).toContain('in-reveal');
    });

    it('counts frames and seconds', () => {
        const player = mount();
        expect(player.frameCount).toBe(61);
        expect(player.duration).toBeCloseTo(61 / 60);
        player.speed = 2;
        expect(player.duration).toBeCloseTo(61 / 120);
    });
});

describe('a file without markers', () => {
    /** The lock icon without its markers: the file's own frames, [200, 260). */
    function bare() {
        return clock.track(new Player(container(), { ...lockIcon(), markers: [] }));
    }

    it('plays the whole file', async () => {
        const player = bare();
        expect(player.states).toEqual([]);
        expect(player.state).toBeNull();
        expect(player.segment).toEqual([200, 260]);
        expect(player.frameCount).toBe(60);

        const done = player.play({ from: 'start' });
        clock.advance(1100);
        await expect(done).resolves.toBe(true);
        expect(player.frame).toBe(259);
    });

    it('goes back to the whole file for no state, the whole file, and no segment', async () => {
        const player = bare();

        const done = player.play({ state: null });
        expect(player.segment).toEqual([200, 260]);
        expect(player.frame).toBe(200);
        clock.advance(1100);
        await expect(done).resolves.toBe(true);

        player.state = '*';
        expect(player.segment).toEqual([200, 260]);

        player.segment = [210, 221];
        player.segment = null;
        expect(player.segment).toEqual([200, 260]);
    });

    it('scrubs through the whole file', () => {
        const player = bare();
        player.progress = 0.5;
        expect(player.frame).toBeCloseTo(229.5);
        player.seek('end');
        expect(player.frame).toBe(259);
    });
});

describe('loop', () => {
    it('ends each round with loop, not complete, until stopped', async () => {
        const player = mount();
        const loops = vi.fn();
        const complete = vi.fn();
        player.addEventListener('loop', loops);
        player.addEventListener('complete', complete);
        player.loop = true;

        const done = player.play();
        clock.advance(2500);
        expect(loops.mock.calls.length).toBeGreaterThanOrEqual(2);
        expect(complete).not.toHaveBeenCalled();

        player.stop();
        await expect(done).resolves.toBe(false);
    });
});

describe('destroy', () => {
    it('sends no events afterwards', () => {
        const player = mount();
        const events = vi.fn();
        for (const name of ['frame', 'complete', 'loop', 'refresh'] as const) {
            player.addEventListener(name, events);
        }
        player.play();
        player.destroy();
        player.colors.primary = 'red';
        clock.advance(1100);
        expect(events).not.toHaveBeenCalled();
    });

    it('leaves other players playing', async () => {
        const first = mount();
        const second = mount();
        first.play();
        const done = second.play();
        clock.advance(300);
        first.destroy();
        clock.advance(900);
        await expect(done).resolves.toBe(true);
    });
});

describe('subclassing', () => {
    it('routes every playback through play()', () => {
        const seen: PlayOptions[] = [];

        class Zoned extends Player {
            play(options: PlayOptions = {}): Promise<boolean> {
                seen.push(options);
                return super.play(options);
            }
        }

        const player = clock.track(new Zoned(container(), lockIcon(), { state: 'hover-locked' }));
        player.play();
        player.state = 'hover-unlocked';

        expect(seen).toEqual([{}, { from: 'start', reverse: false }]);
    });
});

describe('before init', () => {
    it('plays nothing and throws nothing', async () => {
        const player = new Player(container(), lockIcon(), null, { autoInit: false });
        await expect(player.play()).resolves.toBe(false);
        expect(() => {
            player.seek(10);
            player.stop();
            player.pause();
            player.progress = 0.5;
            player.segment = [0, 10];
        }).not.toThrow();
        expect(player.segment).toEqual([200, 261]);
    });
});
