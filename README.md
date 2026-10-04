# PixelBar Marketplace

Notifications, cards, sensors, themes, sounds, pictures and animations for [PixelBar](https://pixelbar.fireball1725.ca), made by the people who use it. Home Assistant's PixelBar integration lists what's here in its Marketplace tab, and anything you pick goes into your Catalogue.

Contributions come in as pull requests, and every pull request gets checked and previewed before anyone reviews it.

## What's in here

| Path | What it holds |
| --- | --- |
| `items/<kind>/<name>/` | One folder per item: `item.json`, plus the C source of an animation or a plugin theme |
| `dist` branch | What Home Assistant reads: `index.json` with every item, plus each plugin compiled, rebuilt on every merge |
| `sdk/` | The plugin SDK: `pixelbar.h`, a build script, the Hearts animation, the Spooky Christmas theme and [the guide](sdk/README.md) |
| `tools/` | The checks, the preview renderer and the index builder |
| `tools/vendor/` | The site's simulator and v2 schemas, copied in so previews and checks match the display |
| `worker/` | The previews site, where a pull request's sounds play in the browser ([setup](worker/README.md)) |

![The Hearts example animation](sdk/examples/hearts/hearts.gif)

The kinds are `notification`, `card`, `sensor`, `theme`, `sound`, `picture` and `animation`. [CONTRIBUTING.md](CONTRIBUTING.md) has the format of each.

## Adding something

From Home Assistant, the Share button on a Catalogue item signs you in to GitHub and opens the pull request for you.

By hand, add a folder under `items/` and open a pull request. Before you push, run the same checks CI runs:

```sh
npm ci
node tools/validate.mjs items/theme/my-theme
node tools/preview.mjs items/theme/my-theme previews
```

## What happens to a pull request

**Check items** runs on every pull request that touches `items/`. It checks each item's fields, checks every message against the display's own schemas, makes sure it isn't a copy of something already here, compiles animations and plugin themes from their C source and renders previews: an animated GIF on a 256 LED strip and a still at 640. A theme also gets a sweep, every part off and then each part on alone, so nothing can hide behind the rest.

**Post previews** then puts the GIFs, stills, WAVs and MP4s on the `previews` branch and keeps one comment on the pull request up to date with them, so reviewers see what the item draws without installing it. GitHub won't play a linked sound inline, so the comment also links the item's page on the previews site, where sounds play in the browser. The check never gets write access or secrets; only the posting step does, and it never runs the pull request's code.

Merging to `main` rebuilds the `dist` branch: `index.json` with every item in full (a plugin theme's manifest included) and each plugin compiled to `.wasm`. Home Assistant reads it through jsDelivr at `https://cdn.jsdelivr.net/gh/FireBall1725/pixelbar-marketplace@dist/`.

## Keeping the copied site files current

The checks and previews use the site's simulator and schemas from `tools/vendor/`. After the site changes, refresh them and commit:

```sh
tools/vendor.sh            # copies from ~/Repos/pixelbar-site (or SITE=path)
node tools/test/run.mjs    # good items of every kind pass, broken ones fail for the right reason
```

## Licences

Each item carries its own licence in its `item.json`. The tools here are under the [PolyForm Noncommercial License 1.0.0](LICENSE), like the rest of PixelBar: free for personal use, no selling without permission. The SDK in `sdk/` is [MIT](sdk/LICENSE), so an animation that includes `pixelbar.h` can use any licence on the list. Contributors agree to the [CLA](CLA.md) once, on their first pull request. The PixelBar name and logo are covered in [TRADEMARK.md](TRADEMARK.md).
