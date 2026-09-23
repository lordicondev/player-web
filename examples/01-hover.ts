import { Player, type IconData } from '../src/index.ts';

for (const container of document.querySelectorAll<HTMLElement>('[data-icon]')) {
    const data: IconData = await (await fetch(`/icons/${container.dataset.icon}.json`)).json();
    const player = new Player(container, data);

    // play() resumes, and starts over once the state has finished, so hovering again
    // mid-play does not restart it.
    container.addEventListener('pointerenter', () => player.play());
}
