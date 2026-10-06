// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// Builds what Home Assistant reads, into one folder (the dist branch): index.json with every item in full (its messages, or a
// plugin's params and a plugin theme's manifest), and each plugin compiled to wasm/<id>/<version>.wasm. CI runs it on every merge to main.
//   node tools/index.mjs [out dir] [--keep <the previous dist folder>]
// --keep carries the builds already published over, so every version of every item (retired ones too) stays downloadable.
// A published version is never rebuilt: the bytes behind wasm/<id>/<version>.wasm don't change once they're out.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { compareVersions, fingerprint, isPlugin, listItems, partsOf, readRetired, sourceOf } from "./lib/items.mjs";
import { nextId } from "./validate.mjs";
import { loadAnim } from "./lib/anim.mjs";

const args = process.argv.slice(2), keep = args.includes("--keep") ? args.splice(args.indexOf("--keep"), 2)[1] : null;
const out = args[0] || "dist", ROOT = resolve(new URL("..", import.meta.url).pathname);
mkdirSync(join(out, "wasm"), { recursive: true });
if (keep && existsSync(join(keep, "wasm"))) cpSync(join(keep, "wasm"), join(out, "wasm"), { recursive: true });

const sha256 = f => createHash("sha256").update(readFileSync(f)).digest("hex");
/* Every published version of an id, oldest first, with each build's hash. */
const versionsOf = id => {
  const d = join(out, "wasm", String(id));
  return (existsSync(d) ? readdirSync(d) : []).filter(f => f.endsWith(".wasm")).map(f => f.slice(0, -5))
    .sort(compareVersions).map(v => ({ version: v, wasm: `wasm/${id}/${v}.wasm`, sha256: sha256(join(d, v + ".wasm")) }));
};

const dirs = listItems(), slugs = dirs.map(d => partsOf(d).slug);
const items = await Promise.all(dirs.map(async d => {
  const it = JSON.parse(readFileSync(join(d, "item.json"), "utf8")), { kind, ns, slug, name } = partsOf(d);
  const row = { id: it.id, name, kind, namespace: ns, slug, path: d, version: it.version, title: it.title, description: it.description || "",
    author: it.author, license: it.license, tags: it.tags || [], fingerprint: fingerprint(d, it) };
  if (isPlugin(it)) {
    const wasm = join(out, "wasm", String(it.id), it.version + ".wasm");
    mkdirSync(join(out, "wasm", String(it.id)), { recursive: true });
    if (!existsSync(wasm)) execFileSync(join(ROOT, "sdk/build.sh"), [join(d, sourceOf(it)), wasm], { stdio: "pipe" });
    row.wasm = `wasm/${it.id}/${it.version}.wasm`; row.sha256 = sha256(wasm); row.versions = versionsOf(it.id); row.params = it.params || {};
    // The name readers used before ids (mp:<slug>, <slug>.wasm) stays served while no other item shares the slug.
    if (slugs.filter(s => s === slug).length === 1) { copyFileSync(wasm, join(out, slug + ".wasm")); row.legacy = slug + ".wasm"; }
    // A plugin's manifest (its title, colours and parts) goes in the index, so Home Assistant can build its controls before fetching the .wasm.
    const m = (await loadAnim(readFileSync(wasm), {})).manifest;
    if (m && !m.error) row.manifest = m;
  } else row.msgs = it.msgs.map(m => ({ topic: m.topic, payload: m.payload }));
  return row;
}));
const retired = readRetired().map(r => ({ ...r, versions: versionsOf(r.id) }));
writeFileSync(join(out, "index.json"), JSON.stringify({ version: 2, built: new Date().toISOString(), next_id: nextId(items.map(i => i.id)),
  items, retired }, null, 2) + "\n");
console.log(`${out}/index.json: ${items.length} item${items.length === 1 ? "" : "s"}, ${retired.length} retired`);
