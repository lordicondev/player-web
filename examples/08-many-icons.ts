import { Player, type IconData } from '../src/index.ts';

const tiles = document.querySelector<HTMLElement>('#tiles')!;
const count = document.querySelector<HTMLElement>('#count')!;

// Three files, fetched once and shared: a player copies the data it is given.
const icons: IconData[] = [
    await (await fetch('/icons/coins.json')).json(),
    await (await fetch('/icons/lock.json')).json(),
    await (await fetch('/icons/morph-select.json')).json(),
];

const players = new Map<HTMLElement, Player>();

// A player for each tile on screen, none for the others.
const observer = new IntersectionObserver(
    (entries) => {
        for (const entry of entries) {
            const container = entry.target as HTMLElement;
            const player = players.get(container);

            if (entry.isIntersecting && !player) {
                const data = icons[Number(container.dataset.index) % icons.length];
                players.set(container, new Player(container, data));
            } else if (!entry.isIntersecting && player) {
                player.destroy();
                players.delete(container);
            }
        }
        count.textContent = `players: ${players.size} for ${tiles.children.length} icons`;
    },
    { root: tiles, rootMargin: '100px' },
);

for (let index = 0; index < 300; index++) {
    const container = document.createElement('div');
    container.className = 'icon';
    container.dataset.index = String(index);
    container.addEventListener('pointerenter', () => players.get(container)?.play());
    tiles.append(container);
    observer.observe(container);
}
