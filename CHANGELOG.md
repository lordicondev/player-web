# Changelog

## 2.0.0

The player is an `EventTarget`, frames are absolute, and every playback goes through one
`play(options)` that returns a promise. Built on `@lordicon/utils-lottie` 2.

### Migrating from 1.x

| 1.x                                      | 2.0                                                     |
| ---------------------------------------- | ------------------------------------------------------- |
| `playFromStart()`                        | `play({ from: 'start' })`: restarts the loaded segment  |
| `seekToStart()`, `seekToEnd()`           | `seek('start')`, `seek('end')`                          |
| `switchSegment(segment)`                 | `segment = segment`                                     |
| `switchSegment()`                        | `segment = null`: back to the state, not the whole file |
| `availableStates`                        | `states`                                                |
| `lottieInstance`                         | `renderer`, typed as `Renderer`                         |
| `lottieProperties`                       | `controls`                                              |
| `frame = n`                              | `seek(n)`, with an absolute frame                       |
| `player.frame / player.frameCount`       | `progress`                                              |
| `const off = addEventListener(name, fn)` | `removeEventListener(name, fn)`, or `{ signal }`        |
| `removeEventListener(name)`              | `removeEventListener(name, fn)`                         |
| `complete` for each round of a loop      | `loop`                                                  |

### Changed

- **Frames are absolute.** `frame` and `seek()` counted from the start of the loaded segment;
  now they use the frames of the icon's markers. Code that added or subtracted the segment's
  start should use `progress`, or drop the arithmetic.
- A state's segment ends at `tm + dr + 1`, so its last frame plays.
- `play()` returns a promise: `true` when the animation plays to its end, `false` when
  something cuts it short. `readyPromise` gives `true`, or `false` when `destroy()` comes
  first.
- `state` reads `null`, not `''`, when the whole file plays.
- `init()` and `destroy()` can run more than once, and a destroyed player throws nothing.
- Colours, stroke, state, speed, direction and loop can be set before `init()`.
- Icons without markers (the old format), and their `scale` and `axis`, are not supported.

### Added

- `play({ state, segment, from, reverse })`, `seek('start' | 'end')`, `progress`.
- `currentState`, the state as an object; `defaultColors` and `readyPromise`.
- Events `loop` and `destroy`; `detail` on `complete` and `loop`.
- `{ copy: false }` to give the renderer the data without a copy.
- The state helpers of `@lordicon/utils-lottie` and `colorsByName`, re-exported.
