/**
 * One playback started by `play()`. Its promise resolves `true` when the segment plays to
 * its end and `false` when something else takes over first. It never rejects.
 */
export class Run {
    readonly promise: Promise<boolean>;
    #resolve!: (completed: boolean) => void;

    constructor() {
        this.promise = new Promise((resolve) => (this.#resolve = resolve));
    }

    settle(completed: boolean): void {
        this.#resolve(completed);
    }
}
