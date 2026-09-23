import { Player, type IconData } from '../src/index.ts';

const container = document.querySelector<HTMLElement>('#icon')!;
const progress = document.querySelector<HTMLInputElement>('#progress')!;
const loop = document.querySelector<HTMLInputElement>('#loop')!;
const speed = document.querySelector<HTMLSelectElement>('#speed')!;
const info = document.querySelector<HTMLElement>('#info')!;

const data: IconData = await (await fetch('/icons/coins.json')).json();
const player = new Player(container, data, { state: 'loop-spin' });

/** Shows where the player is. Runs on every frame and after each control. */
function showPlayback(): void {
    progress.value = String(player.progress);
    info.textContent = [
        `playing: ${player.playing}`,
        `frame: ${Math.round(player.frame)} of [${player.segment.join(', ')})`,
        `direction: ${player.direction}, speed: ${player.speed}, loop: ${player.loop}`,
    ].join('\n');
}

player.addEventListener('frame', showPlayback);

document.querySelector('#play')!.addEventListener('click', () => {
    player.play();
    showPlayback();
});

document.querySelector('#pause')!.addEventListener('click', () => {
    player.pause();
    showPlayback();
});

document.querySelector('#stop')!.addEventListener('click', () => {
    player.stop();
    showPlayback();
});

// progress runs from 0 to 1 over the loaded segment; setting it seeks and pauses.
progress.addEventListener('input', () => {
    player.progress = Number(progress.value);
    showPlayback();
});

loop.addEventListener('change', () => {
    player.loop = loop.checked;
    showPlayback();
});

speed.addEventListener('change', () => {
    player.speed = Number(speed.value);
    showPlayback();
});

// Mid-play the animation turns around; otherwise the next play() goes the other way.
document.querySelector('#direction')!.addEventListener('click', () => {
    player.direction = player.direction > 0 ? -1 : 1;
    showPlayback();
});

showPlayback();
