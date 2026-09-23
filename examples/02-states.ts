import { Player, stateType, type IconData } from '../src/index.ts';

const container = document.querySelector<HTMLElement>('#icon')!;
const buttons = document.querySelector<HTMLElement>('#states')!;
const info = document.querySelector<HTMLElement>('#info')!;

const data: IconData = await (await fetch('/icons/coins.json')).json();
const player = new Player(container, data);

function showState(): void {
    const state = player.state ?? 'null, the whole file';
    info.textContent = `state: ${state}\nsegment: [${player.segment.join(', ')})`;
}

// player.states lists the icon's states: a button for each, and one for the whole file.
for (const state of [...player.states.map((s) => s.name), '*']) {
    const button = document.createElement('button');
    button.textContent = state === '*' ? '* whole file' : `${state} (${stateType(state)})`;
    button.addEventListener('click', () => {
        player.play({ state });
        showState();
    });
    buttons.append(button);
}

showState();
