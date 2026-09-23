import { Player, type IconData } from '../src/index.ts';

const container = document.querySelector<HTMLElement>('#icon')!;
const frames = document.querySelector<HTMLElement>('#frames')!;
const log = document.querySelector<HTMLElement>('#log')!;

const data: IconData = await (await fetch('/icons/lock.json')).json();
let player: Player | null = null;
let count = 0;

function write(line: string): void {
    log.textContent = `${line}\n${log.textContent}`;
}

function create(): void {
    if (player) return;
    player = new Player(container, data, { state: 'hover-locked' });

    // `ready` has fired already; a listener added later still gets it.
    player.addEventListener('ready', () => write('ready'));
    player.addEventListener('complete', (event) =>
        write(`complete ${JSON.stringify(event.detail)}`),
    );
    player.addEventListener('loop', (event) => write(`loop ${JSON.stringify(event.detail)}`));
    player.addEventListener('refresh', () => write('refresh'));
    player.addEventListener('destroy', () => write('destroy'));
    player.addEventListener('frame', () => (frames.textContent = `frames: ${++count}`));
}

document.querySelector('#play')!.addEventListener('click', () => player?.play({ from: 'start' }));
document
    .querySelector('#reverse')!
    .addEventListener('click', () => player?.play({ reverse: true }));
document.querySelector('#loop')!.addEventListener('click', () => {
    if (player) player.loop = !player.loop;
});
document.querySelector('#color')!.addEventListener('click', () => {
    if (player) player.colors.primary = player.colors.primary === '#ff0000' ? '#121331' : 'red';
});
document.querySelector('#destroy')!.addEventListener('click', () => {
    player?.destroy();
    player = null;
});
document.querySelector('#create')!.addEventListener('click', create);

create();
