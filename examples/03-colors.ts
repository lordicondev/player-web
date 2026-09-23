import { colorsByName, Player, type IconData, type Stroke } from '../src/index.ts';

const container = document.querySelector<HTMLElement>('#icon')!;
const figure = document.querySelector<HTMLElement>('#figure')!;
const primary = document.querySelector<HTMLInputElement>('#primary')!;
const secondary = document.querySelector<HTMLInputElement>('#secondary')!;
const stroke = document.querySelector<HTMLSelectElement>('#stroke')!;
const output = document.querySelector<HTMLElement>('#properties')!;

const data: IconData = await (await fetch('/icons/lock.json')).json();
const player = new Player(container, data, { state: 'hover-locked' });

container.addEventListener('pointerenter', () => player.play());

primary.addEventListener('input', () => (player.colors.primary = primary.value));
secondary.addEventListener('input', () => (player.colors.secondary = secondary.value));
stroke.addEventListener('change', () => (player.stroke = Number(stroke.value) as Stroke));

// colorsByName finds which of the icon's colours is #121331, whatever its name.
document.querySelector('#swap')!.addEventListener('click', () => {
    figure.style.background = '#121331';
    player.colors = colorsByName(player.defaultColors, { '#121331': '#ffffff' });
});

document.querySelector('#reset')!.addEventListener('click', () => {
    figure.style.background = '';
    player.colors = null;
    player.stroke = null;
});

// `refresh` follows every change of colours or stroke.
function showProperties(): void {
    primary.value = player.colors.primary;
    secondary.value = player.colors.secondary;
    stroke.value = String(player.stroke);
    output.textContent = `player.properties = ${JSON.stringify(player.properties, null, 4)}`;
}

player.addEventListener('refresh', showProperties);
showProperties();
