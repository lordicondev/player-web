import { Player, splitSegment, stateSegment, type IconData } from '../src/index.ts';

/** Each click goes to the second look, or back to the first. */
function toggleMorph(container: HTMLElement, data: IconData, name: string): void {
    const player = new Player(container, data, { state: name });
    const morph = player.currentState!;
    const halves = splitSegment(morph); // null without a ratio
    let on = false;

    container.addEventListener('click', () => {
        on = !on;
        if (halves) player.play({ segment: on ? halves[0] : halves[1] });
        else player.play({ segment: stateSegment(morph), reverse: !on });
    });
}

const select: IconData = await (await fetch('/icons/morph-select.json')).json();
const lock: IconData = await (await fetch('/icons/lock.json')).json();

toggleMorph(document.querySelector('#with-ratio')!, select, 'morph-select');
toggleMorph(document.querySelector('#without-ratio')!, lock, 'morph-unlocked');
