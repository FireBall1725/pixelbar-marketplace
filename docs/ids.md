# Item ids, names and versions

Every Marketplace item has three handles: a permanent id (a UUID), a readable name, and a version. People write the name, stored setups and devices keep the id, and the version says which build you get. Before October 2026 an item was known only by its folder name, so whoever picked `football` first owned that word for good, and renaming an item broke everything that pointed at it.

## Names

An item lives in `items/<kind>/<namespace>/<slug>/`, and its name is `<namespace>/<slug>`, for example `fireball1725/football`.

- The namespace is the author's GitHub username in lowercase. The check refuses an item whose folder doesn't match its `author`, and a new item from a pull request has to go under the pull request author's own name.
- `pixelbar/` is kept for official items, and only maintainers can publish there. Nothing uses it yet.
- The slug is lowercase letters, digits and `-`, 2 to 41 characters.
- A name is unique across kinds: there can't be an animation and a sound both called `fireball1725/beep`.
- Two people can both have a `football`. Renaming or moving an item is fine, because anything stored points at the id, not the name.

## Ids

The id is a version 4 UUID in `item.json`, lowercase with hyphens, for example `3888a1f4-ca24-4795-89ad-52d5935f6a2a`. It never changes and is never given to another item, even after the first one is retired.

- The author makes it. `node tools/new-item.mjs <kind> <name>` creates the folder with a fresh id already in `item.json`; `node -e "console.log(crypto.randomUUID())"` makes one by hand. Leave `id` out and the pull request check prints one to paste in.
- There's no counter, so two pull requests can't collide on a number and `main` doesn't need to hand anything out. The check fails a new item whose id is already in the index or in `retired.json`.
- An id belongs to the item that first merged it. The check fails a pull request that gives an id from `main` to an item in a different namespace or of a different kind, so nobody can take over another author's identity by copying their id.
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
  { "id": "0d6c3f0e-5a47-4a58-8d52-6a3f0b8c9e11", "name": "someone/old-clock", "kind": "card", "reason": "replaced by someone/clock" }
]
```

A retired item drops out of the Marketplace list, but its id stays issued and its builds stay on `dist`, so anything that already uses it keeps working. Taking a build down for legal reasons or abuse is a separate, manual step.

## The dist branch

Merging to `main` rebuilds `dist`. `index.json` is version 2:

| Field | What it holds |
| --- | --- |
| `items[]` | Every item: `id`, `name`, `kind`, `namespace`, `slug`, `path`, `version`, `title`, `description`, `author`, `license`, `tags`, `fingerprint`, and its `msgs`, or for a plugin `wasm`, `sha256`, `versions`, `params` and `manifest` |
| `items[].versions` | Every published build of a plugin, oldest first: `version`, `wasm`, `sha256` |
| `retired[]` | Every retired item, with the builds it had |

A plugin's latest build is `items[].wasm`, for example `wasm/3888a1f4-ca24-4795-89ad-52d5935f6a2a/1.0.0.wasm`, next to its SHA-256.

## Pointing at an item

| Form | Example | Use it for |
| --- | --- | --- |
| `mp:<namespace>/<slug>` | `mp:fireball1725/football` | Typing by hand, automations people read, the demo and the pickers |
| `mp:<id>` | `mp:3888a1f4-ca24-4795-89ad-52d5935f6a2a` | Devices and anything saved, so a rename can't break it |
| `mp:<id>@<version>` | `mp:3888a1f4-ca24-4795-89ad-52d5935f6a2a@1.0.0` | Pinning one build |
| `mp:<namespace>/<slug>@<version>` | `mp:fireball1725/football@1.0.0` | Pinning one build by name |

A bare `mp:<slug>` doesn't resolve. A name or an id is the only way in, and the two can't be confused: a name has a `/` in it and a UUID never does.

Tools that save a setup turn the name into the id when they save, and show the name again when they load it.

## Add-ons that need an item

An add-on on the I2C bus names the items it needs in its handshake, as an id and the lowest version it works with: "item 3888a1f4-..., 1.0.0 or newer". The bar then:

1. Uses the build it already has, when it's new enough.
2. Otherwise asks Home Assistant's PixelBar integration to fetch it from `dist`. The display never downloads anything itself.
3. Or takes a copy the add-on carries, sent over the serial link, but only when its SHA-256 matches a published build of that id and version.

After that the add-on sends small commands to the item ("play 3888a1f4-..., event goal"), never pixels.

## Signing (planned)

CI will sign each build with a PixelBar key, and the bar will run only signed builds. Developers testing their own unpublished plugins turn on a developer mode on their bar, which also runs unsigned builds. Until signing lands, the SHA-256 in `index.json` is what ties a build to the Marketplace.

## The first items

The items that were here before ids get these UUIDs:

| id | Name | Was |
| --- | --- | --- |
| `76ee33d9-4e35-4b4e-9a1c-9321d96d737c` | `fireball1725/hearts` | `items/animation/hearts` |
| `77661eed-e894-4d98-99e3-60d54c1ceeb6` | `fireball1725/spooky-christmas` | `items/theme/spooky-christmas` |
| `c78ebdea-1b4f-4a01-bcde-a74128b189c2` | `fireball1725/west-ham-bubbles` | `items/animation/west-ham-bubbles` |
| `3888a1f4-ca24-4795-89ad-52d5935f6a2a` | `fireball1725/football` | `items/animation/football` |

They all start at version 1.0.0. They briefly had the numbers 1 to 4. Nothing outside the author's own setup used those, so the numbers and the old `mp:<slug>` names are dropped rather than kept as aliases.
