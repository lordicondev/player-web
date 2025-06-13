import { Player, Stroke } from '../src';
import { loadIcon, randomHexColor } from './utils';

const data = await loadIcon('coins');

const iconElement = document.querySelector('.icon') as HTMLElement;
const buttonsElement = document.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;

const player = new Player(
    iconElement,
    data,
    {
        colors: {
            primary: 'red',
            secondary: 'blue',
        },
        stroke: 3,
        state: 'hover-spending',
    }
);

// player.play();

buttonsElement.forEach(buttonElement => {
    const type: 'play' | 'colors' | 'stroke' | 'state' = buttonElement.dataset.type as any;

    buttonElement.addEventListener('click', () => {
        if (type === 'play') {
            if (!player.playing) {
                player.playFromStart();
            }
        }

        if (type === 'colors') {
            if (Math.random() < 0.5) {
                player.colors.secondary = randomHexColor();
            } else {
                player.colors.primary = randomHexColor();
            }
        } else if (type === 'stroke') {
            player.stroke = (Math.floor(Math.random() * 3) + 1) as Stroke; // Random stroke between 1 and 3
        } else if (type === 'state') {
            const availableStates = player.availableStates;
            const currentStateIndex = availableStates.findIndex(state => state.name === player.state);
            const nextStateIndex = (currentStateIndex + 1) % availableStates.length;
            player.state = availableStates[nextStateIndex].name;
        }
    });
});
