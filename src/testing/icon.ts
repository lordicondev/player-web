import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { IconData } from '../types.ts';

/**
 * The lock icon from the examples: in-reveal [0, 121), hover-locked [130, 191),
 * morph-unlocked [200, 261) (default), hover-unlocked [270, 331), at 60 fps.
 */
export function lockIcon(): IconData {
    const path = resolve(import.meta.dirname, '../../examples/icons/lock.json');
    return JSON.parse(readFileSync(path, 'utf8'));
}

export function container(): HTMLElement {
    const element = document.createElement('div');
    document.body.append(element);
    return element;
}
