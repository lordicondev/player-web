import { Player } from '../src';
import { loadIcon } from './utils';

const data = await loadIcon('coins');

const iconElement = document.querySelector('.icon') as HTMLElement;

const player = new Player(
    iconElement,
    data,
);

player.play();