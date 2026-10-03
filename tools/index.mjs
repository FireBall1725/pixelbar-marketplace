// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// Builds what Home Assistant reads, into one folder (the dist branch): index.json with every item in full (its messages, or an
// plugin's params and a plugin theme's manifest), and each plugin compiled to <slug>.wasm. CI runs it on every merge to main.
//   node tools/index.mjs [out dir]
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fingerprint, isPlugin, listItems, sourceOf } from "./lib/items.mjs";
import { loadAnim } from "./lib/anim.mjs";

const out = process.argv[2] || "dist", ROOT = resolve(new URL("..", import.meta.url).pathname);
mkdirSync(out, { recursive: true });
const items = await Promise.all(listItems().map(async d => {
  const it = JSON.parse(readFileSync(join(d, "item.json"), "utf8")), [, kind, slug] = d.split("/");
  const row = { kind, slug, title: it.title, description: it.description || "", author: it.author, license: it.license, tags: it.tags || [], fingerprint: fingerprint(d, it) };
  if (isPlugin(it)) {
    execFileSync(join(ROOT, "sdk/build.sh"), [join(d, sourceOf(it)), join(out, slug + ".wasm")], { stdio: "pipe" });
    row.wasm = slug + ".wasm"; row.params = it.params || {};
    // A theme's manifest (its title, colours and parts) goes in the index, so Home Assistant can build its controls before fetching the .wasm.
    if (kind === "theme") row.manifest = (await loadAnim(readFileSync(join(out, slug + ".wasm")), {})).manifest;
  } else row.msgs = it.msgs.map(m => ({ topic: m.topic, payload: m.payload }));
  return row;
}));
writeFileSync(join(out, "index.json"), JSON.stringify({ version: 1, built: new Date().toISOString(), items }, null, 2) + "\n");
console.log(`${out}/index.json: ${items.length} item${items.length === 1 ? "" : "s"}`);
