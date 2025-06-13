import { Player } from '../src';
import { loadIcon } from './utils';

function refreshButton() {
    if (player.playing) {
        buttonElement.textContent = 'Pause';
    } else {
        buttonElement.textContent = 'Play';
    }
}

const data = await loadIcon('lock');

const iconElement = document.querySelector('.icon') as HTMLElement;
const seekElement = document.getElementById('seek') as HTMLInputElement;
const loopElement = document.getElementById('loop') as HTMLInputElement;
const buttonElement = document.getElementById('play-pause') as HTMLButtonElement;

const player = new Player(
    iconElement,
    data,
    {
        state: 'hover-locked',
    },
);

player.addEventListener('frame', () => {
    seekElement.value = player.frame.toString();
});

player.addEventListener('complete', () => {
    refreshButton();
});

seekElement.setAttribute('max', '' + (player.frameCount - 1));

seekElement.addEventListener('input', () => {
    player.seek(+seekElement.value);
    refreshButton();
});

loopElement.addEventListener('change', () => {
    player.loop = loopElement.checked;
});

buttonElement.addEventListener('click', () => {
    if (player.playing) {
        player.pause();
    } else {
        if (player.frame === player.frameCount) {
            player.playFromStart();
        } else {
            player.play();
        }
    }

    refreshButton();
});

player.play();
