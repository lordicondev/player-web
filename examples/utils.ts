export async function loadIcon(name: string) {
    const response = await fetch(`/icons/${name}.json`);
    return await response.json();
}

export function randomHexColor() {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return `#${randomColor.padStart(6, '0')}`;
}