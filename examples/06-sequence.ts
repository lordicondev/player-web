import { Player, type IconData } from '../src/index.ts';

const container = document.querySelector<HTMLElement>('#icon')!;
const log = document.querySelector<HTMLElement>('#log')!;

const data: IconData = await (await fetch('/icons/coins.json')).json();
const player = new Player(container, data);
let run = 0;

document.querySelector('#run')!.addEventListener('click', async () => {
    const id = ++run;

    for (const state of ['in-reveal', 'hover-jump', 'hover-spending']) {
        const finished = await player.play({ state });
        log.textContent += `run ${id}, ${state}: ${finished ? 'finished' : 'cut short'}\n`;
        if (!finished) return;
    }
});
