import { colorsByName, fromLottieColor, type LottieColor } from '@lordicon/utils-lottie';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Player } from './player.ts';
import { container, lockIcon } from './testing/icon.ts';

afterEach(() => document.body.replaceChildren());

/** The colour the renderer draws with, read from the animation itself. */
function rendered(player: Player, name: string): string {
    const control = player.controls.find((c) => c.type === 'color' && c.name === name)!;
    const value = control.path
        .split('.')
        .reduce(
            (object, key) => (object as Record<string, unknown>)?.[key],
            player.renderer as unknown,
        );
    return fromLottieColor(value as LottieColor);
}

describe('colors', () => {
    it('reads the icon’s own colours', () => {
        const player = new Player(container(), lockIcon());
        expect(player.defaultColors).toEqual({ primary: '#121331', secondary: '#08a88a' });
        expect(player.colors.primary).toBe('#121331');
        expect(Object.keys(player.colors)).toEqual(['primary', 'secondary']);
        expect({ ...player.colors }).toEqual({ primary: '#121331', secondary: '#08a88a' });
        expect('primary' in player.colors).toBe(true);
        expect('tertiary' in player.colors).toBe(false);
    });

    it('sets one colour, puts it back, and replaces them all', () => {
        const player = new Player(container(), lockIcon());
        const refresh = vi.fn();
        player.addEventListener('refresh', refresh);

        player.colors.primary = 'red';
        expect(player.colors.primary).toBe('#ff0000');
        expect(rendered(player, 'primary')).toBe('#ff0000');

        delete player.colors.primary;
        expect(rendered(player, 'primary')).toBe('#121331');

        player.colors = { secondary: '#00f' };
        expect(player.colors.primary).toBe('#121331');
        expect(rendered(player, 'secondary')).toBe('#0000ff');

        player.colors = null;
        expect(rendered(player, 'secondary')).toBe('#08a88a');
        expect(refresh).toHaveBeenCalledTimes(4);
    });

    it('takes colours before init and draws them once it runs', () => {
        const box = container();
        const player = new Player(
            box,
            lockIcon(),
            { colors: { primary: 'red' } },
            {
                autoInit: false,
            },
        );
        player.colors.secondary = '#000';
        player.init();

        const drawn = [...box.querySelectorAll('path')].map(
            (path) => path.getAttribute('stroke') ?? path.getAttribute('fill'),
        );
        expect(drawn).toContain('rgb(255,0,0)');
        expect(rendered(player, 'primary')).toBe('#ff0000');
        expect(rendered(player, 'secondary')).toBe('#000000');
    });

    it('keeps the icon’s own colours in controls whatever is set', () => {
        const player = new Player(container(), lockIcon());
        player.colors.primary = 'red';
        const primary = player.controls.find((c) => c.type === 'color' && c.name === 'primary')!;
        expect(fromLottieColor(primary.value as LottieColor)).toBe('#121331');
    });

    it('recolours by the icon’s own colours', () => {
        const player = new Player(container(), lockIcon());
        player.colors = colorsByName(player.defaultColors, { '#121331': 'red' });
        expect(rendered(player, 'primary')).toBe('#ff0000');
        expect(rendered(player, 'secondary')).toBe('#08a88a');
    });

    it('ignores a value that is not a colour, and a name the icon does not have', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const player = new Player(container(), lockIcon());
        player.colors.primary = 'nope';
        player.colors.tertiary = 'red';
        expect(player.colors.primary).toBe('#121331');
        expect(player.colors.tertiary).toBeUndefined();
        expect(warn).toHaveBeenCalledOnce();
        warn.mockRestore();
    });
});

describe('stroke', () => {
    it('reads the icon’s width and sets another', () => {
        const player = new Player(container(), lockIcon());
        expect(player.stroke).toBe(2);
        player.stroke = 'bold';
        expect(player.stroke).toBe(3);
        player.stroke = null;
        expect(player.stroke).toBe(2);
    });
});

describe('properties', () => {
    it('reads and replaces colours, stroke and state together', () => {
        const player = new Player(container(), lockIcon(), { stroke: 1, state: 'hover-locked' });
        expect(player.properties).toEqual({
            colors: { primary: '#121331', secondary: '#08a88a' },
            stroke: 1,
            state: 'hover-locked',
        });

        player.properties = { colors: { primary: 'red' } };
        expect(player.properties).toEqual({
            colors: { primary: '#ff0000', secondary: '#08a88a' },
            stroke: 2,
            state: 'morph-unlocked',
        });
    });
});
