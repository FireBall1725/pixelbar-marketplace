# PixelBar Marketplace

Notifications, cards, sensors, themes, sounds, pictures and animations for [PixelBar](https://pixelbar.fireball1725.ca), made by the people who use it. Home Assistant's PixelBar integration lists what's here in its Marketplace tab, and anything you pick goes into your Catalogue.

The repo is private while it's set up. Contributions come in as pull requests, and every pull request gets checked and previewed before anyone reviews it.

## What's in here

| Path | What it holds |
| --- | --- |
| `items/<kind>/<name>/` | One folder per item: `item.json`, plus `anim.c` for an animation |
| `index.json` | The list Home Assistant reads, rebuilt on every merge |
| `sdk/` | The animation SDK: `pixelbar.h`, a build script, the Hearts example and [its guide](sdk/README.md) |
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

**Check items** runs on every pull request that touches `items/`. It checks each item's fields, checks every message against the display's own schemas, makes sure it isn't a copy of something already here, compiles animations from their C source and renders previews: an animated GIF on a 256 LED strip and a still at 640.

**Post previews** then puts the GIFs, stills, WAVs and MP4s on the `previews` branch and keeps one comment on the pull request up to date with them, so reviewers see what the item draws without installing it. GitHub won't play a linked sound inline, so the comment also links the item's page on the previews site, where sounds play in the browser. The check never gets write access or secrets; only the posting step does, and it never runs the pull request's code.

Merging to `main` rebuilds `index.json`.

## Keeping the copied site files current

The checks and previews use the site's simulator and schemas from `tools/vendor/`. After the site changes, refresh them and commit:

```sh
tools/vendor.sh            # copies from ~/Repos/pixelbar-site (or SITE=path)
node tools/test/run.mjs    # good items of every kind pass, broken ones fail for the right reason
```

## Licences

Each item carries its own licence in its `item.json`. The tools are AGPL-3.0, like the rest of PixelBar (`LICENSE`). The SDK in `sdk/` is MIT (`sdk/LICENSE`), so an animation that includes `pixelbar.h` can use any licence on the list.
