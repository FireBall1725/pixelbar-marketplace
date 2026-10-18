// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// Starts an item: the folder, an item.json with a fresh id, and a starting point for its messages or source.
//   node tools/new-item.mjs <kind> <name> [github username]
// The username defaults to the one `gh` is signed in as. The new item passes tools/validate.mjs as it is, so edit it from there.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { KINDS, newId } from "./lib/items.mjs";
import { check } from "./validate.mjs";

/* The smallest valid messages of each kind, to replace with your own. */
const MSGS = {
  notification: [{ topic: "pixelbar/all/notify/example", payload: { v: 2, tier: "alert", card: { card: "text", title: "EXAMPLE" } } }],
  card: [{ topic: "pixelbar/all/box/main", payload: { v: 2, cards: [{ card: "clock" }] } }],
  sensor: [{ topic: "pixelbar/all/data/example_temperature", payload: { v: 2, value: 12.4, unit: "°C" } },
    { topic: "pixelbar/all/box/main", payload: { v: 2, cards: [{ card: "temperature", data: "example_temperature", label: "EXAMPLE" }] } }],
  theme: [{ topic: "pixelbar/all/theme", payload: { v: 2, theme: "christmas" } }],
  sound: [{ topic: "pixelbar/all/asset/sound/example", payload: { v: 2, rtttl: "example:d=4,o=5,b=100:c,e,g" } }],
};

const [kind, slug, who] = process.argv.slice(2);
if (!KINDS.includes(kind) || !slug) {
  console.error(`usage: node tools/new-item.mjs <${KINDS.join("|")}> <name> [github username]`);
  process.exit(2);
}
if (kind === "picture") { console.error("A picture carries image data: build it in Home Assistant's Catalogue and paste its JSON into item.json."); process.exit(2); }
let login = who;
if (!login) try { login = execFileSync("gh", ["api", "user", "-q", ".login"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { /* asked for below */ }
if (!login) { console.error("Whose item is it? Add your GitHub username: node tools/new-item.mjs <kind> <name> <username>"); process.exit(2); }

const dir = join("items", kind, login.toLowerCase(), slug);
if (existsSync(dir)) { console.error(`${dir} already exists.`); process.exit(1); }
mkdirSync(dir, { recursive: true });
const title = slug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
const item = { kind, id: newId(), version: "1.0.0", title, description: "", author: login, license: kind === "animation" ? "MIT" : "CC-BY-4.0", tags: [] };
if (kind === "animation") {
  item.source = "anim.c";
  item.params = { title: "TITLE", message: "MESSAGE", colors: ["#FF5078", "#FF96BE", "#E12850"] };
  copyFileSync(join("sdk", "examples", "hearts", "hearts.c"), join(dir, "anim.c"));
} else item.msgs = MSGS[kind];
writeFileSync(join(dir, "item.json"), JSON.stringify(item, null, 2) + "\n");

const r = check(dir);
console.log(`${dir}/item.json, id ${item.id}`);
if (r.problems.length) { console.log("It doesn't pass yet:"); r.problems.forEach(p => console.log(`  ${p}`)); }
else console.log(`It passes node tools/validate.mjs ${dir}. Edit it, then preview with: node tools/preview.mjs ${dir} previews`);
