import { Player } from '../src';
import { loadIcon } from './utils';

const data = await loadIcon('coins');

const iconElement = document.querySelector('.icon') as HTMLElement;
const selectElement = document.querySelector('select') as HTMLSelectElement;

const player = new Player(
    iconElement,
    data,
);

const availableStates = player.availableStates;
availableStates.forEach((state) => {
    const option = document.createElement('option');
    option.value = state.name;
    option.textContent = state.name;
    selectElement.appendChild(option);
});

selectElement.addEventListener('change', (event) => {
    const selectedState = (event.target as HTMLSelectElement).value;
    player.state = selectedState;

    player.playFromStart();
});

// Set the initial state to the default state
selectElement.value = availableStates.find(state => state.default)?.name!;
player.play();