import { Player } from '../src';
import { loadIcon } from './utils';

const data = await loadIcon('lock');

const iconElement = document.querySelector('.icon') as HTMLElement;
const frameElement = document.getElementById('frame') as HTMLElement;

const player = new Player(
    iconElement,
    data,
    {
        state: 'morph-unlocked',
    },
    {
        autoInit: false, // Prevent auto-initialization
    },
);


player.addEventListener('ready', () => {
    player.play();
});

player.addEventListener('complete', () => {
    setTimeout(() => {
        player.direction *= -1;
        player.play();
    }, 500);
});

player.addEventListener('frame', () => {
    frameElement.textContent = `Frame: ${Math.round(player.frame)}`;
});

player.init();