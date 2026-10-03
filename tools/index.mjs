// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 FireBall1725
// Builds index.json, the list Home Assistant reads: every item's details, where it is, and a fingerprint for duplicates.
//   node tools/index.mjs [out file]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fingerprint, listItems } from "./lib/items.mjs";
const items = listItems().map(d => {
  const it = JSON.parse(readFileSync(join(d, "item.json"), "utf8")), [, kind, slug] = d.split("/");
  return { kind, slug, path: d, title: it.title, description: it.description || "", author: it.author, license: it.license, tags: it.tags || [], fingerprint: fingerprint(d, it) };
});
writeFileSync(process.argv[2] || "index.json", JSON.stringify({ version: 1, items }, null, 2) + "\n");
console.log(`index.json: ${items.length} item${items.length === 1 ? "" : "s"}`);
