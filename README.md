# Lordicon Web Player

A lightweight and flexible player for seamlessly embedding, controlling, and customizing animated [Lordicon](https://lordicon.com/) icons in any web application.

## Features

- ✨ Simple API for controlling Lottie-based icon animations
- 📦 Supports Lordicon icon files
- 🎨 Easy customization of colors, stroke, and animation state
- 🔔 Event system for reacting to animation lifecycle 
- 🛡️ TypeScript support

## Installation

```sh
npm install @lordicon/web
```

## Usage

> **Note:**  
> This repository contains an `examples` directory with a rich collection of usage examples and integration scenarios.  
> Feel free to explore it for more advanced use cases and inspiration!

### Basic Example

```js
import { Player } from '@lordicon/web';

const container = document.getElementById('icon');
const data = /* Lottie JSON data */;

const player = new Player(container, data, {
    colors: {
        primary: '#ff0000',
        secondary: '#0000ff',
    },
    stroke: 2,
    state: 'in-reveal',
});

player.play();
```

### Customizing Properties

You can update properties at any time:

```js
player.colors.primary = '#00ff00';
player.stroke = 3;
player.state = 'hover-jump';
```

Or set multiple at once (all unspecified properties will be reset to their default values):

```js
player.properties = {
    colors: { primary: '#123456' },
    stroke: 1,
    state: 'hover-jump',
};
```

### Events

Register event listeners:

```js
player.addEventListener('complete', () => {
    console.log('Animation completed!');
});
```

Supported events: 

- `ready` – Fired when the player is initialized and ready to use.
- `complete` – Fired when the animation finishes playing.
- `frame` – Fired on each frame update.
- `refresh` –  Fired when the player is refreshed, for example, after icon customization.

## API

Player

__Constructor__

```ts
new Player(container, data, properties, options)
```

- `container` - The DOM element where the player will be rendered.
- `data` - The animation data in Lottie JSON format. You can download it from [Lordicon](https://lordicon.com/).
- `properties` - *(Optional)* Initial icon properties such as colors, stroke width, animation state, etc.  

    Example:  
    ```js
    {
        colors: { primary: '#ff0000' },
        stroke: 2,
        state: 'in-reveal'
    }
    ```
- `options` - *(Optional)* Additional options. By default, the player is automatically initialized and ready to use immediately.

    Example: 
    ```js
    {
        autoInit: true
    }
    ```

__Methods__

- `init()`: Initialize the player (called automatically by default).
- `destroy()`: Destroy the player and release resources.
- `play()`: Play animation.
- `playFromStart()`: Play from the beginning of the current state.
- `pause()`: Pause animation.
- `stop()`: Stop animation.
- `seek(frame)`: Go to specific frame.
- `seekToStart()`: Move to the first frame and stop.
- `seekToEnd()`: Move to the last frame and stop.
- `switchSegment(segment)`: Sets the animation segment to play.

__Properties__

- `colors`: Proxy for color manipulation (e.g., player.colors.primary = '#fff').
- `stroke`: Stroke width (number or preset).
- `state`: Current animation state (string).
- `speed`: Playback speed.
- `direction`: Playback direction (1 or -1).
- `loop`: Looping (boolean).
- `frame`: Current frame (number).
- `playing`: Whether animation is playing (boolean).
- `ready`: Whether player is ready (boolean).
- `availableStates`: List of available states.
- `frameCount`: Total number of frames in the animation (number).
- `duration`: Duration of the animation in seconds (number).
- `properties`: Get or set multiple properties at once. Setter: Any property not provided will be reset to its default value (overwrites all properties). Getter: Returns the current properties object.
- `segment`: Gets the current segment of the animation as [start, end] frame numbers.
- `lottieInstance`: Access to the underlying internal Lottie player instance.
- `lottieProperties`: Array of customizable properties for the icon.

__Events__

- `addEventListener(name, handler)`: Register event handler. Supported event names: `'ready'`, `'complete'`, `'frame'`, `'refresh'`.
- `removeEventListener(name, handler?)`: Remove event handler(s).