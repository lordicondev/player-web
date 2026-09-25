# Lordicon Web Player

Plays an animated [Lordicon](https://lordicon.com/) icon from JavaScript, in any element: its
states, colours and stroke.

```sh
npm install @lordicon/web
```

```js
import { Player } from '@lordicon/web';

const data = await (await fetch('/icons/lock.json')).json();
const player = new Player(container, data);

container.addEventListener('pointerenter', () => player.play());
```

`data` is the icon's Lottie JSON. The icon plays its default state, usually a hover.

## States

An icon holds several animations, its states: `in-reveal`, `hover-jump`, `morph-unlocked`.

```js
player.states; // [{ name: 'in-reveal', time: 0, duration: 120, ... }, ...]
player.play({ state: 'in-reveal' }); // load a state and play it from its start
player.state = 'hover-jump'; // or only load it
player.currentState; // { name: 'hover-jump', time: 160, ... }, for the helpers below
player.state = '*'; // the whole file
```

A morph goes to a second look and back. With a ratio in its marker (`morph-select:0.5`) the
state is two animations in a row, the way there and the way back, so play one half at a time:
`play({ state })` would play both, and `reverse` would run both backwards. Without a ratio,
the state is the way there, and the way back is the same frames played backwards:

```js
import { splitSegment, stateSegment } from '@lordicon/web';

player.state = 'morph-select';
const morph = player.currentState;
const halves = splitSegment(morph); // null without a ratio

if (halves) player.play({ segment: on ? halves[0] : halves[1] });
else player.play({ segment: stateSegment(morph), reverse: !on });
```

## Colours and stroke

```js
player.colors.primary = 'red'; // any hex value or CSS colour name
delete player.colors.primary; // the icon's own again
player.colors = { secondary: '#08a88a' }; // replace them all; null resets
player.stroke = 'bold'; // 'light', 'regular', 'bold', or 1, 2, 3; null resets
```

To swap one of the icon's colours wherever it is used, whatever its name:

```js
import { colorsByName } from '@lordicon/web';

player.colors = colorsByName(player.defaultColors, { '#121331': '#ffffff' });
```

State, colours and stroke can also be given to the constructor:
`new Player(container, data, { state: 'hover-jump', colors: { primary: 'red' }, stroke: 3 })`.

## Playback

```js
player.pause();
player.stop(); // back to the first frame
player.seek('end'); // a frame, 'start' or 'end', and pause
player.progress = 0.5; // halfway
player.loop = true;
player.speed = 2;
player.direction = -1; // backwards

player.play({ from: 'start' }); // restart
player.play({ reverse: true }); // backwards, from the end
player.play({ segment: [130, 191] }); // some frames
```

`play()` returns a promise: `true` when the animation plays to its end, `false` when
something cuts it short: another `play()` with options, `stop()`, a new state, `destroy()`.
It never rejects.

```js
if (await player.play({ state: 'in-reveal' })) player.play({ state: 'hover-jump' });
```

## Events

```js
player.addEventListener('complete', (event) => {
    const { segment, direction, state } = event.detail;
});
```

| Event      | When                                                                 |
| ---------- | -------------------------------------------------------------------- |
| `ready`    | The animation exists. A listener added later still gets it.          |
| `complete` | The animation played to its end, or its start when backwards.        |
| `loop`     | A round of a looping animation ended; `complete` does not fire then. |
| `frame`    | A frame was drawn.                                                   |
| `refresh`  | Colours or stroke changed.                                           |
| `destroy`  | `destroy()` ran.                                                     |

The player is an `EventTarget`: `{ once: true }` and `{ signal }` work.

## Many icons on a page

A player holds an animation and a copy of the icon data. With many icons on a page, create a
player when its icon comes into view and destroy it when the icon leaves:

```js
const player = new Player(container, data, null, { autoInit: false });

player.init(); // when the icon is needed
player.destroy(); // when it is not
```

- `autoInit: false` leaves rendering to `init()`. What is set before applies then.
- `destroy()` empties the container. Keep one player per container: destroy the old one
  before creating the next.
- `init()` and `destroy()` can run more than once; a destroyed player does nothing.
- `{ copy: false }` skips the copy of `data` when it was fetched for this player alone; the
  renderer then changes it.

## API

`new Player(container, data, properties?, options?)`, with `properties`
`{ state, colors, stroke }` and `options` `{ autoInit, copy }`.

| Member                                | What it does                                                            |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `play(options?)`                      | Plays. `{ state, segment, from: 'start', reverse }`.                    |
| `pause()`                             | Pauses where it is.                                                     |
| `stop()`                              | Pauses on the first frame.                                              |
| `seek(frame)`                         | Shows a frame, `'start'` or `'end'`, and pauses.                        |
| `init()`, `destroy()`                 | Create and remove the animation.                                        |
| `ready`, `readyPromise`               | Ready now; a promise of `true` when ready, `false` if destroyed first.  |
| `playing`                             | Whether it plays.                                                       |
| `state`                               | The state's name. `null` sets the default one, `'*'` the whole file.    |
| `currentState`                        | The state as an object, `null` for the whole file.                      |
| `states`                              | The icon's states.                                                      |
| `segment`                             | The loaded frames, `[start, end)`. `null` goes back to the state's.     |
| `frame`                               | The frame on screen.                                                    |
| `frameCount`, `frameRate`, `duration` | Frames in the segment, frames per second, seconds at the current speed. |
| `progress`                            | 0 to 1 through the segment. Setting it seeks.                           |
| `direction`, `speed`, `loop`          | How it plays: `1` or `-1`, `1` by default, `false` by default.          |
| `colors`, `defaultColors`             | The colours by name; the icon's own.                                    |
| `stroke`                              | `1`, `2` or `3`; null when the icon has no stroke setting.              |
| `properties`                          | State, colours and stroke at once. What is left out resets.             |
| `renderer`, `controls`                | The animation and its effect controls, for what the player lacks.       |

Also exported, from `@lordicon/utils-lottie`: `findState`, `defaultState`, `stateType`,
`stateSegment`, `stateRatio`, `splitSegment`, `stateEndFrame`, `colorsByName`,
`parseColors`, `parseStroke`, `resolveColor`, `strokeName`, `isIconData`.

## Details

**Frames** are absolute, as in the icon's markers: a state at frame 130 starts at `130`,
whatever is loaded. A state's segment is `[tm, tm + dr + 1)`: its last keyframes sit on
`tm + dr`, and that frame has to play for the state to reach its final pose. The last frame
of a segment is `segment[1] - 1`.

**`play()` without options** resumes where the icon is, and starts over once the segment has
finished. With options it starts a new playback, and the previous promise gets `false`.

**The default state** plays when none is given; `null` or an unknown name picks it too.
An icon without one plays the whole file, from its first state to the end of its last. A file
without markers has no states, and plays its own frames, `ip` to `op`.

**Subclassing.** Every playback goes through `play()`, a state change during play included,
so overriding that one method wraps them all.

**Before `init()`**, `state`, `speed`, `direction`, `loop`, colours and stroke can be set;
they apply when it runs. `play()` resolves `false`.

## Upgrading

What changed from 1.x, and what to write instead: [CHANGELOG.md](CHANGELOG.md).

## Development

```sh
npm install
npm start          # the examples
npm test           # Vitest, on the real renderer in happy-dom
npm run check      # types, lint, formatting
npm run build
```

## License

MIT
