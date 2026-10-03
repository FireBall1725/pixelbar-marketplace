// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 FireBall1725
// The marketplace's items: one folder per item, items/<kind>/<slug>/item.json, plus anim.c for an animation.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const KINDS = ["notification", "card", "sensor", "theme", "sound", "picture", "animation"];
export const LICENSES = ["CC-BY-4.0", "CC-BY-SA-4.0", "CC0-1.0", "MIT"];
export const MAX_BYTES = 64 * 1024;

export function listItems(root = "items") {
  const out = [];
  for (const kind of existsSync(root) ? readdirSync(root) : []) {
    const kd = join(root, kind);
    if (!statSync(kd).isDirectory()) continue;
    for (const slug of readdirSync(kd)) if (statSync(join(kd, slug)).isDirectory()) out.push(join(kd, slug));
  }
  return out.sort();
}
/* The times an example stamps fresh each time (since, until, expires) don't make two items different. */
const TIMES = ["since", "until", "expires"];
const norm = v => Array.isArray(v) ? v.map(norm) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().filter(k => !TIMES.includes(k)).map(k => [k, norm(v[k])])) : v;
/* What makes an item the same as another: its messages, or an animation's source with spaces squeezed out. */
export function fingerprint(dir, item) {
  const body = item.kind === "animation" ? readFileSync(join(dir, item.source || "anim.c"), "utf8").replace(/\s+/g, " ").trim()
    : JSON.stringify(norm((item.msgs || []).map(m => ({ topic: m.topic, payload: m.payload }))));
  return createHash("sha256").update(item.kind + "\n" + body).digest("hex").slice(0, 16);
}
