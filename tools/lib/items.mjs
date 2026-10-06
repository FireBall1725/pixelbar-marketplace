// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// The marketplace's items: one folder per item, items/<kind>/<namespace>/<slug>/item.json, plus the C source of a plugin
// (an animation, or a theme with "source"). An item's name is <namespace>/<slug>; its id is a number that never changes or gets reused.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

export const KINDS = ["notification", "card", "sensor", "theme", "sound", "picture", "animation"];
export const LICENSES = ["CC-BY-4.0", "CC-BY-SA-4.0", "CC0-1.0", "MIT"];
export const MAX_BYTES = 64 * 1024;
/* Namespaces only these GitHub accounts may publish under, besides their own: pixelbar/ is for official items. */
export const OFFICIAL = "pixelbar", MAINTAINERS = ["FireBall1725"];
export const SEMVER = /^(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})$/;

const dirs = d => existsSync(d) ? readdirSync(d).filter(n => statSync(join(d, n)).isDirectory()) : [];
export function listItems(root = "items") {
  const out = [];
  for (const kind of dirs(root)) for (const ns of dirs(join(root, kind))) for (const slug of dirs(join(root, kind, ns))) out.push(join(root, kind, ns, slug));
  return out.sort();
}
/* kind, namespace and slug from an item's folder, and its name. */
export function partsOf(dir) {
  const [kind, ns, slug] = dir.split(sep).slice(-3);
  return { kind, ns, slug, name: `${ns}/${slug}` };
}
/* "1.2.3" -> comparable: negative when a is older than b. */
export function compareVersions(a, b) {
  const x = a.split(".").map(Number), y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}
/* Items taken out of the marketplace: their ids stay issued forever, and their builds stay on the dist branch. */
export function readRetired(file = "retired.json") {
  if (!existsSync(file)) return [];
  const r = JSON.parse(readFileSync(file, "utf8"));
  return Array.isArray(r) ? r : [];
}
/* The times an example stamps fresh each time (since, until, expires) don't make two items different. */
const TIMES = ["since", "until", "expires"];
const norm = v => Array.isArray(v) ? v.map(norm) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().filter(k => !TIMES.includes(k)).map(k => [k, norm(v[k])])) : v;
/* An item built from C: every animation, and a theme that carries "source" instead of messages. */
export const isPlugin = item => item.kind === "animation" || (item.kind === "theme" && item.source != null);
export const sourceOf = item => item.source || (item.kind === "theme" ? "theme.c" : "anim.c");
/* What makes an item the same as another: its messages, or a plugin's source with spaces squeezed out. */
export function fingerprint(dir, item) {
  return fingerprintOf(item, isPlugin(item) ? readFileSync(join(dir, sourceOf(item)), "utf8") : null);
}
/* The same, from an item and its plugin source as text (for items read out of git rather than from disk). */
export function fingerprintOf(item, source) {
  const body = isPlugin(item) ? String(source || "").replace(/\s+/g, " ").trim()
    : JSON.stringify(norm((item.msgs || []).map(m => ({ topic: m.topic, payload: m.payload }))));
  return createHash("sha256").update(item.kind + "\n" + body).digest("hex").slice(0, 16);
}
