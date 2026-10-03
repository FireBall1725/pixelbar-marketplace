# Writing a PixelBar animation

An animation is one C file. It's compiled to WebAssembly, and the same `.wasm` runs in the Marketplace preview and on the display. It takes over the whole strip when a notification plays it: `W` LEDs wide (128 on the smallest bar, 640 on the largest) by 32 tall, redrawn every frame.

It can only call the drawing functions in `pixelbar.h`. It can't read files, reach the network or see anything about your home beyond the words and colours the notification hands it.

> **Where this stands:** the Marketplace previews run animations today. The display firmware's support is in progress, so an animation you write now is ready for it, but it won't play on a bar yet.

![Hearts on a 256 LED strip](examples/hearts/hearts.gif)

The Hearts example at medium size, as the Marketplace previews it. On the widest strip it looks like this:

![Hearts at 640 LEDs](examples/hearts/hearts-xxl.png)

## Quick start

You need clang and `wasm-ld`. On macOS, Xcode's clang plus `brew install lld`; on Debian or Ubuntu, `apt install clang lld`.

```sh
cp sdk/examples/hearts/hearts.c my-anim.c
sdk/build.sh my-anim.c                      # writes my-anim.wasm
```

To preview it, put it in an item folder and render it:

```sh
mkdir -p items/animation/my-anim
cp my-anim.c items/animation/my-anim/anim.c
# write items/animation/my-anim/item.json (below), then:
node tools/preview.mjs items/animation/my-anim previews
```

That writes `previews/my-anim.gif` (6 seconds on a 256 LED strip) and `previews/my-anim-xxl.png` (one frame at 640), and prints how long a frame took.

```json
{
  "kind": "animation",
  "title": "My animation",
  "description": "What it draws.",
  "author": "your-github-username",
  "license": "CC-BY-4.0",
  "source": "anim.c",
  "params": { "title": "HAPPY BIRTHDAY", "message": "SAM", "colors": ["#FF7C45", "#48C28A"] }
}
```

`params` is only for the preview: it's the title, message and colours a notification would send.

## The smallest animation

```c
#include "pixelbar.h"

void frame(float t, int w, int h) {
  int x = (int)(t * 40) % w;              /* 40 LEDs a second, wrapping */
  pb_rect(x, 12, 6, 8, 0xFF7C45, 255);
  PB_TEXT("HELLO", 4, 4, 0xFFFFFF, 1, 1);
}
```

Every frame starts black, so you draw the whole picture each time from `t`, the seconds since the animation started. Work things out from `t` rather than keeping state between frames: the display may skip frames, and the picture should still be right.

## What you write

| Function | When it runs |
| --- | --- |
| `void frame(float t, int w, int h)` | Every frame. Required. `h` is always 32. |
| `void init(int w, int h)` | Once, before the first frame. Optional: fill a table, seed a random generator. |

## What the display gives you

| Function | What it does |
| --- | --- |
| `pb_px(x, y, rgb, alpha)` | One pixel, blended over what's there. `alpha` 255 covers it, 128 is half. Off the strip is ignored. |
| `pb_rect(x, y, w, h, rgb, alpha)` | A filled rectangle, blended the same way. |
| `pb_text(s, len, x, y, rgb, size, outline)` | Text in PixelBar's 5 x 7 font: accents, Cyrillic, Greek and symbols like ★ ♥ ↑ included. `size` 1 or 2. `outline` 1 adds a dark edge so it reads over anything. Drawn as written. Gives back its width. |
| `pb_text_width(s, len, size)` | How wide that text would be, without drawing it. |
| `pb_param(key, key_len, buf, cap)` | The notification's `"title"`, `"message"` or `"detail"`, copied into `buf`. Gives back its length, or -1 when it wasn't sent. |
| `pb_color(i)` | The notification's `colors[i]` as `0xRRGGBB`, or -1 past the end. |

Colours are `0xRRGGBB` throughout. `PB_TEXT(s, x, y, rgb, size, outline)` and `PB_PARAM(key, buf)` save writing the lengths out.

## Helpers in pixelbar.h

There's no C library, so the header carries what animations usually need:

| Helper | Gives you |
| --- | --- |
| `pb_sin(x)`, `pb_cos(x)` | Sine and cosine in radians, good to about 0.001 |
| `pb_hash(n)` | The same number from 0 to 1 every time for the same `n`: for placing things so they don't jump between frames |
| `pb_rand(&seed)` | A small random generator you seed yourself |
| `pb_hsv(h, s, v)` | A colour from hue in degrees and saturation and value from 0 to 1 |
| `pb_mix(a, b, k)` | Between colours `a` and `b`, `k` from 0 to 1 |
| `pb_bounce(p)` | The bounce the built-in animations drop their titles in with |
| `pb_floor`, `pb_fract`, `pb_clamp`, `pb_strlen`, `pb_rgb` | The small things |

## How the Hearts example works

[`examples/hearts/hearts.c`](examples/hearts/hearts.c) is about 60 lines and shows the patterns most animations need:

- **Many things that move without state.** Each heart's speed, sway and start come from `pb_hash(i * 3)`, `pb_hash(i * 7)` and `pb_hash(i * 11)`, so heart 12 is always in the same place at the same `t`.
- **Looping.** `pb_fract((t * speed + start) / (h + 8))` takes each heart from below the strip to above it and round again.
- **The notification's colours,** with defaults when it sends none.
- **A title that fits.** It uses size 2 on strips 256 wide and up when the title fits, otherwise size 1, and drops in with `pb_bounce` over the first 0.7 seconds.
- **A message that fades in** after 0.9 seconds, under the title.

## Limits

| Limit | Value |
| --- | --- |
| Memory | 64 KB in all, including an 8 KB stack |
| Source | 64 KB |
| Frame time | Keep it light: aim for well under 2 ms a frame on the display at 640 wide |

The display is far slower than your computer. In a test on the ESP32-S3, fireworks with a few rockets of 16 sparks each and a title took 1.7 ms a frame at 640 wide; 512 confetti pieces with colour maths for each took 37 ms, too slow for a smooth picture. The preview's frame time comes from your computer and includes the host's own text drawing, so it's good for comparing two versions of your animation, not for judging the display.

What keeps it fast:

- Work out per-column or per-row values once a frame, not per pixel.
- Use `pb_px` for points and `pb_rect` for areas. One `pb_rect` beats a hundred `pb_px` calls.
- Keep floating-point division and `pb_sin` out of loops over every pixel. A 256-entry table filled in `init` does the same job for a fraction of the cost.

## Sending it in

Commit `items/animation/<name>/anim.c` and `item.json`, and open a pull request. Don't commit the `.wasm`: CI builds it from your source, so what runs is always what was reviewed. The pull request comment shows the GIF, the still, the compiled size and the frame time.
