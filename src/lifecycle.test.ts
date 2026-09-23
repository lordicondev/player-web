import { afterEach, describe, expect, it, vi } from 'vitest';
import { Player } from './player.ts';
import { container, lockIcon } from './testing/icon.ts';

afterEach(() => document.body.replaceChildren());

describe('lifecycle', () => {
    it('renders in the constructor by default', async () => {
        const box = container();
        const player = new Player(box, lockIcon());

        expect(player.ready).toBe(true);
        expect(box.querySelector('svg')).not.toBeNull();
        await expect(player.readyPromise).resolves.toBe(true);
    });

    it('waits for init() with autoInit off, and applies what was set before', () => {
        const box = container();
        const player = new Player(box, lockIcon(), { state: 'hover-locked' }, { autoInit: false });
        player.speed = 3;
        player.direction = -1;
        player.loop = true;
        player.colors.primary = 'red';
        expect(box.querySelector('svg')).toBeNull();
        expect(player.ready).toBe(false);

        player.init();
        const animation = player.renderer!;
        expect(animation.playSpeed).toBe(3);
        expect(animation.playDirection).toBe(-1);
        expect(animation.loop).toBe(true);
        expect(player.segment).toEqual([130, 191]);
        expect(player.colors.primary).toBe('#ff0000');
    });

    it('does nothing on a second init()', () => {
        const box = container();
        const player = new Player(box, lockIcon());
        player.init();
        expect(box.querySelectorAll('svg')).toHaveLength(1);
    });

    it('replays ready to a listener that comes late', async () => {
        const player = new Player(container(), lockIcon());
        const late = vi.fn();
        const aborted = vi.fn();
        const controller = new AbortController();

        player.addEventListener('ready', late, { once: true });
        player.addEventListener('ready', aborted, { signal: controller.signal });
        controller.abort();
        await Promise.resolve();

        expect(late).toHaveBeenCalledOnce();
        expect(aborted).not.toHaveBeenCalled();
    });

    it('can be destroyed twice, empties the container and settles a pending play', async () => {
        const box = container();
        const player = new Player(box, lockIcon());
        const destroyed = vi.fn();
        player.addEventListener('destroy', destroyed);
        const pending = player.play();

        player.destroy();
        player.destroy();

        expect(destroyed).toHaveBeenCalledOnce();
        expect(box.querySelector('svg')).toBeNull();
        expect(player.ready).toBe(false);
        await expect(pending).resolves.toBe(false);
        await expect(player.play()).resolves.toBe(false);
        expect(() => player.seek('end')).not.toThrow();
    });

    it('takes null for properties and starts on the default state', () => {
        const player = new Player(container(), lockIcon(), null);
        expect(player.state).toBe('morph-unlocked');
        expect(player.ready).toBe(true);
    });

    it('settles readyPromise with false when destroyed before init', async () => {
        const player = new Player(container(), lockIcon(), null, { autoInit: false });
        player.destroy();
        player.init();

        await expect(player.readyPromise).resolves.toBe(false);
        expect(player.renderer).toBeNull();
    });

    it('lets a new player use the container once the old one is destroyed', () => {
        const box = container();
        new Player(box, lockIcon()).destroy();
        const player = new Player(box, lockIcon());

        expect(player.ready).toBe(true);
        expect(box.querySelectorAll('svg')).toHaveLength(1);
    });

    it('copies the data unless told not to', () => {
        const kept = lockIcon();
        new Player(container(), kept, { state: 'hover-locked' });
        expect(kept.ip).toBe(200);

        const given = lockIcon();
        new Player(container(), given, { state: 'hover-locked' }, { copy: false });
        expect(given.ip).toBe(0);
    });
});
