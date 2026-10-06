# Item ids, names and versions

Every Marketplace item has three handles: a permanent number (its id), a readable name, and a version. Devices and add-ons point at the id, people read the name, and the version says which build you get. Before October 2026 an item was known only by its folder name, so whoever picked `football` first owned that word for good, and renaming an item broke everything that pointed at it.

## Names

An item lives in `items/<kind>/<namespace>/<slug>/`, and its name is `<namespace>/<slug>`, for example `fireball1725/football`.

- The namespace is the author's GitHub username in lowercase. The check refuses an item whose folder doesn't match its `author`, and a new item from a pull request has to go under the pull request author's own name.
- `pixelbar/` is kept for official items, and only maintainers can publish there. Nothing uses it yet.
- The slug is lowercase letters, digits and `-`, 2 to 41 characters.
- A name is unique across kinds: there can't be an animation and a sound both called `fireball1725/beep`.
- Two people can both have a `football`. Renaming or moving an item is fine, because nothing that matters points at the name.

## Ids

The id is a whole number in `item.json`, from 1 up. It never changes and is never given to another item, even after the first one is retired.

- A new item takes the next free number: one more than every id ever issued, retired ones included. Leave `id` out and the pull request check tells you which number to use.
- `main` only takes pull requests that are up to date with it, so if two open pull requests pick the same number, the second one's check fails once the first is merged. Take the new number it gives you.
- An item keeps its id and its kind for good. Moving it to another folder keeps the id.

## Versions

`version` is three numbers, `major.minor.patch`, starting at `1.0.0`.

- Raise it whenever the item changes. The check compares the item with what's on `main` and fails when the messages or the source changed but the version didn't, or when the version went down.
- A published version never changes. Its build sits at `wasm/<id>/<version>.wasm` on the `dist` branch and is never rebuilt, so the bytes behind a version stay the same even when the SDK changes. A fix to the SDK reaches an item when its version is raised.
- Every published version stays downloadable, so a device that asks for version 1.2.0 gets it even after 2.0.0 is out.

## Retiring an item

Deleting an item's folder isn't enough on its own: add it to `retired.json` in the same pull request, or the check fails.

```json
[
  { "id": 7, "name": "someone/old-clock", "kind": "card", "reason": "replaced by someone/clock" }
]
```

A retired item drops out of the Marketplace list, but its id stays issued and its builds stay on `dist`, so anything that already uses it keeps working. Taking a build down for legal reasons or abuse is a separate, manual step.

## The dist branch

Merging to `main` rebuilds `dist`. `index.json` is now version 2:

| Field | What it holds |
| --- | --- |
| `next_id` | The number the next new item gets |
| `items[]` | Every item: `id`, `name`, `kind`, `namespace`, `slug`, `path`, `version`, `title`, `description`, `author`, `license`, `tags`, `fingerprint`, and its `msgs`, or for a plugin `wasm`, `sha256`, `versions`, `params` and `manifest` |
| `items[].versions` | Every published build of a plugin, oldest first: `version`, `wasm`, `sha256` |
| `retired[]` | Every retired item, with the builds it had |

A plugin's latest build is `items[].wasm`, for example `wasm/4/1.0.0.wasm`, next to its SHA-256. While no other item shares its slug, the same build is also copied to `<slug>.wasm`, the file readers fetched before ids.

## Pointing at an item

| Form | Example | Use it for |
| --- | --- | --- |
| `mp:<id>` | `mp:4` | Devices, add-ons, anything stored |
| `mp:<namespace>/<slug>` | `mp:fireball1725/football` | Typing by hand, automations people read |
| `mp:<id>@<version>` | `mp:4@1.0.0` | Pinning one build |
| `mp:<slug>` | `mp:football` | Older setups; works only while the slug is unique |

## Add-ons that need an item

An add-on on the I2C bus names the items it needs in its handshake, as an id and the lowest version it works with: "item 4, 1.0.0 or newer". The bar then:

1. Uses the build it already has, when it's new enough.
2. Otherwise asks Home Assistant's PixelBar integration to fetch it from `dist`. The display never downloads anything itself.
3. Or takes a copy the add-on carries, sent over the serial link, but only when its SHA-256 matches a published build of that id and version.

After that the add-on sends small commands to the item ("play 4, event goal"), never pixels.

## Signing (planned)

CI will sign each build with a PixelBar key, and the bar will run only signed builds. Developers testing their own unpublished plugins turn on a developer mode on their bar, which also runs unsigned builds. Until signing lands, the SHA-256 in `index.json` is what ties a build to the Marketplace.

## The first items

The items that were here before ids got numbers in the order they were added:

| id | Name | Was |
| --- | --- | --- |
| 1 | `fireball1725/hearts` | `items/animation/hearts` |
| 2 | `fireball1725/spooky-christmas` | `items/theme/spooky-christmas` |
| 3 | `fireball1725/west-ham-bubbles` | `items/animation/west-ham-bubbles` |
| 4 | `fireball1725/football` | `items/animation/football` |

They all start at version 1.0.0, and their old `mp:<slug>` names keep working.
