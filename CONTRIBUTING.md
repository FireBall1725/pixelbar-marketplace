# Contributing

Thanks for sharing what you made. Each item is one folder, `items/<kind>/<name>/`, with an `item.json`. The folder name is lowercase letters, digits and `-`, 2 to 41 characters, and it's how the item is known.

## item.json

```json
{
  "kind": "theme",
  "title": "Snowy Christmas",
  "description": "The Christmas scene with twice the snow and a bigger snowman.",
  "author": "your-github-username",
  "license": "CC-BY-4.0",
  "tags": ["christmas", "snow"],
  "msgs": [
    { "topic": "pixelbar/all/theme", "payload": { "v": 2, "theme": "christmas", "parts": { "snow": { "amount": 200 }, "snowman": { "size": 120 } } } }
  ]
}
```

| Field | Rules |
| --- | --- |
| `kind` | Matches the folder: `notification`, `card`, `sensor`, `theme`, `sound`, `picture` or `animation` |
| `title` | Up to 60 characters |
| `description` | Optional, up to 300 characters |
| `author` | Your GitHub username |
| `license` | `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC0-1.0` or `MIT` |
| `tags` | Optional, up to 5 lowercase words |
| `msgs` | 1 to 8 messages, each `{ "topic", "payload" }`, every topic starting `pixelbar/all/` |

The whole file stays under 64 KB. The easiest way to get the messages right is to build the item in Home Assistant's Catalogue and copy its JSON.

## What each kind carries

| Kind | Messages |
| --- | --- |
| `notification` | A notification, `pixelbar/all/notify/<key>`, plus any data it uses |
| `card` | A box message with the card, `pixelbar/all/box/<name>` |
| `sensor` | A box message and the data it shows, `pixelbar/all/data/<key>`, with example values |
| `theme` | One theme message, `pixelbar/all/theme`, a built-in theme with its parts tuned; or no messages and `theme.c`, a whole scene of your own built with the SDK (see [the plugin guide](sdk/README.md#writing-a-theme)) |
| `sound` | One saved tune, `pixelbar/all/asset/sound/<name>`, as `rtttl` or `steps` |
| `picture` | One picture, `pixelbar/all/asset/image/<name>`, up to 64 x 32 in rgb565 |
| `animation` | No messages: `anim.c` is the item, plus optional `params` (the `title`, `message` and `colors` the preview plays it with). See [the plugin guide](sdk/README.md) |

## What gets turned away

- Anything you didn't make or don't have the rights to share. A melody from a song is the composer's, so an RTTTL version of a chart hit doesn't belong here; a tune you wrote does.
- Pictures of real people.
- Logos drawn as pictures. A club's colours, nickname or crest in a goal animation is fine; the display already carries the crests for its goal screen.
- Personal details: names, addresses, phone numbers, plates.
- Copies of something already here. The check compares messages and plugin source, so a renamed copy is caught.

The licence you pick applies to everything in your folder. CC-BY-4.0 is the default suggestion: anyone can use and change it, and your name stays on it.

## Before you push

```sh
npm ci
node tools/validate.mjs items/<kind>/<name>
node tools/preview.mjs items/<kind>/<name> previews    # look at previews/<name>.gif
```

A plugin you can also watch live: open the built `.wasm` on the site's Demo or in Home Assistant's Marketplace tab ("Open a .wasm you built"); it reloads each time you rebuild it.

The pull request runs the same checks and posts the previews as a comment. Fix anything it lists, push again, and the comment updates.
