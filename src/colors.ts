import {
    resetControls,
    resolveColor,
    updateControls,
    type ColorMap,
    type IconControl,
} from '@lordicon/utils-lottie';
import type { Renderer } from './renderer.ts';

/**
 * The icon's colours: the ones it comes with and the ones set on the player. Works before
 * the animation exists; `apply()` writes the result into it.
 */
export class Palette {
    readonly defaults: Readonly<ColorMap>;
    #controls: IconControl[];
    #overrides: ColorMap = {};

    constructor(controls: IconControl[], defaults: ColorMap) {
        this.#controls = controls.filter((control) => control.type === 'color');
        this.defaults = Object.freeze({ ...defaults });
    }

    get names(): string[] {
        return Object.keys(this.defaults);
    }

    get(name: string): string | undefined {
        return this.#overrides[name] ?? this.defaults[name];
    }

    /** Sets one colour; `null` or `undefined` puts the icon's own back. */
    set(name: string, value: string | null | undefined): void {
        if (!(name in this.defaults)) return;

        if (value === null || value === undefined) {
            delete this.#overrides[name];
            return;
        }

        const color = resolveColor(value);
        if (color) this.#overrides[name] = color;
        else console.warn(`@lordicon/web: "${value}" is not a colour`);
    }

    /** Replaces every override; `null` puts all the icon's own colours back. */
    replace(colors: ColorMap | null | undefined): void {
        this.#overrides = {};
        for (const [name, value] of Object.entries(colors ?? {})) this.set(name, value);
    }

    apply(animation: Renderer): void {
        resetControls(animation, this.#controls);

        for (const [name, color] of Object.entries(this.#overrides)) {
            const controls = this.#controls.filter((control) => control.name === name);
            updateControls(animation, controls, color);
        }
    }

    /**
     * `player.colors`: reads and writes single colours by name. `onChange` runs after every
     * write so the player can render.
     */
    proxy(onChange: () => void): ColorMap {
        return new Proxy({} as ColorMap, {
            get: (_target, name) => (typeof name === 'string' ? this.get(name) : undefined),
            set: (_target, name, value) => {
                if (typeof name === 'string') {
                    this.set(name, value);
                    onChange();
                }
                return true;
            },
            deleteProperty: (_target, name) => {
                if (typeof name === 'string') {
                    this.set(name, null);
                    onChange();
                }
                return true;
            },
            has: (_target, name) => typeof name === 'string' && name in this.defaults,
            ownKeys: () => this.names,
            getOwnPropertyDescriptor: (_target, name) =>
                typeof name === 'string' && name in this.defaults
                    ? {
                          enumerable: true,
                          configurable: true,
                          writable: true,
                          value: this.get(name),
                      }
                    : undefined,
        });
    }
}
