# Spooky Christmas

The built-in Spooky Christmas theme as a plugin: a night sky, a huge moon behind a spiral hill, bats, gravestones, a bent fence, jack-o'-lanterns in Santa hats, striped gifts and snow. `theme.c` draws the same LEDs as the JavaScript scene in the site simulator, so it doubles as the test that the SDK's theme API is complete.

## Build

```sh
sh sdk/build.sh sdk/examples/spooky-christmas/theme.c sdk/examples/spooky-christmas/theme.wasm
```

About 9 KB of WebAssembly. It needs clang and wasm-ld (the `lld` package), nothing else.

## Compare it with the built-in

```sh
node tools/test/plugin-compare.mjs sdk/examples/spooky-christmas/theme.wasm spooky_christmas
```

That draws both versions at every strip width, a spread of times and part settings (all on, each part off, each part at double amount, speed and size) and lists any LED that differs by more than one step. At full brightness they match. The faint case (a theme behind a faint sky) differs on purpose: the simulator blends each primitive at half alpha, while the plugin host draws the scene at full brightness and dims the result, which looks the same from the couch.

## How a theme plugin differs from an animation

- **`manifest()`** is required. It names the theme, its banner words and colours, and lists its parts with the fields each takes (`amount`, `speed`, `size`, how many `colors`) and a one-line description. Home Assistant builds the part controls from it, and the Marketplace renders one preview per part.
- **Parts come from the theme message.** `PB_ON("moon")`, `PB_NUM("moon", "size", 100)` and `PB_COLOR("moon", 0, -1)` give back what the user set, or the default you pass. A part with colours set replaces the whole default list, so count the set colours before indexing.
- **`pb_hero_x()`** is where the centrepiece goes (the moon and hill here). The host moves it clear of a notification's words, so draw around it rather than at a fixed column.
- **The host applies brightness.** Draw at full strength; faint skies and night dimming are the host's job. An animation starts from a black strip every frame; a theme does too, and the cards are drawn over it.
- **Exact maths.** `pb_hashd`, `pb_sind`, `pb_cosd` and `pb_powd` are the host's own double-precision functions, so a port lands every particle where the original does. The float helpers in `pixelbar.h` are cheaper when that doesn't matter.
