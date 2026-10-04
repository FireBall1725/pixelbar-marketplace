// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// A theme's parts, for the preview sweep: a plugin theme lists them in its manifest, a built-in one in the display's theme schema.
import { readFileSync } from "node:fs";

let schema = null;
/* The part keys of a built-in theme, from the branch of theme.schema.json that names it. */
export function builtinParts(key) {
  schema = schema || JSON.parse(readFileSync(new URL("../vendor/schema/v2/theme.schema.json", import.meta.url), "utf8"));
  for (const b of schema.allOf || []) {
    const t = b.if && b.if.properties && b.if.properties.theme, keys = t ? (t.enum || (t.const ? [t.const] : [])) : [];
    if (keys.includes(key) && b.then && b.then.properties && b.then.properties.parts) return Object.keys(b.then.properties.parts.properties || {});
  }
  return [];
}
/* The part settings the moderation sweep renders: everything off, then each part on alone. */
export function sweep(parts) {
  const off = Object.fromEntries(parts.map(p => [p, { on: false }]));
  return [{ name: "off", parts: off }, ...parts.map(p => ({ name: `only-${p}`, parts: { ...off, [p]: { on: true } } }))];
}
