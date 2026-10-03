// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// Builds what Home Assistant reads, into one folder (the dist branch): index.json with every item in full (its messages, or an
// animation's params), and each animation compiled to <slug>.wasm. CI runs it on every merge to main.
//   node tools/index.mjs [out dir]
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fingerprint, listItems } from "./lib/items.mjs";

const out = process.argv[2] || "dist", ROOT = resolve(new URL("..", import.meta.url).pathname);
mkdirSync(out, { recursive: true });
const items = listItems().map(d => {
  const it = JSON.parse(readFileSync(join(d, "item.json"), "utf8")), [, kind, slug] = d.split("/");
  const row = { kind, slug, title: it.title, description: it.description || "", author: it.author, license: it.license, tags: it.tags || [], fingerprint: fingerprint(d, it) };
  if (kind === "animation") {
    execFileSync(join(ROOT, "sdk/build.sh"), [join(d, it.source || "anim.c"), join(out, slug + ".wasm")], { stdio: "pipe" });
    row.wasm = slug + ".wasm"; row.params = it.params || {};
  } else row.msgs = it.msgs.map(m => ({ topic: m.topic, payload: m.payload }));
  return row;
});
writeFileSync(join(out, "index.json"), JSON.stringify({ version: 1, built: new Date().toISOString(), items }, null, 2) + "\n");
console.log(`${out}/index.json: ${items.length} item${items.length === 1 ? "" : "s"}`);
