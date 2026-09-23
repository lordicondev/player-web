import {
    parseStroke,
    resetControls,
    updateControls,
    type IconControl,
    type Stroke,
} from '@lordicon/utils-lottie';
import type { Renderer } from './renderer.ts';

const NAMES = ['stroke', 'stroke-layers'];

/** The icon's stroke width: 1 (light), 2 (regular) or 3 (bold), when the icon has one. */
export class StrokeWidth {
    #controls: IconControl[];
    #value: 1 | 2 | 3 | null = null;

    constructor(controls: IconControl[]) {
        this.#controls = controls.filter((control) => NAMES.includes(control.name));
    }

    get(): Stroke | null {
        const [control] = this.#controls;
        if (!control) return null;
        return this.#value ?? (control.type === 'feature' ? parseStroke(control.value) : null);
    }

    /** `null` puts the icon's own width back. */
    set(value: Stroke | null | undefined): void {
        this.#value = value === null || value === undefined ? null : parseStroke(value);
    }

    apply(animation: Renderer): void {
        resetControls(animation, this.#controls);
        if (this.#value) updateControls(animation, this.#controls, this.#value);
    }
}
