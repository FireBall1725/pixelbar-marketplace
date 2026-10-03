// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// Compares a plugin theme with a built-in one, LED by LED: node tools/test/plugin-compare.mjs <plugin.wasm> <theme key>
// Runs every strip width, a spread of times and part settings (all on, each part off, each part sized), and reports the LEDs that differ.
import { readFileSync } from "node:fs";
import { loadAnim } from "../lib/anim.mjs";

const [wasm, key] = process.argv.slice(2);
if (!wasm || !key) { console.error("usage: plugin-compare.mjs <plugin.wasm> <theme key>"); process.exit(2); }
const bytes = readFileSync(wasm);
const probe = await loadAnim(bytes, {});
const { T } = probe, built = T.THEMES[key];
if (!built) { console.error(`no built-in theme ${key}`); process.exit(2); }
const partNames = Object.keys((probe.manifest && probe.manifest.parts) || {});
/* Times a float32 holds exactly, so the plugin's float t is the simulator's t. */
const TIMES = [0, 0.25, 1.5, 3.3125, 7.75, 12.5, 33.0625];
const configs = [{ name: "all on", parts: undefined }, { name: "faint", parts: undefined, faint: true }];
for (const p of partNames) configs.push({ name: `${p} off`, parts: { [p]: { on: false } } });
for (const p of partNames) configs.push({ name: `${p} x2`, parts: { [p]: { amount: 200, speed: 150, size: 200 } } });
let bad = 0, cases = 0, faint = 0;
for (const W of [128, 256, 384, 640]) for (const cfg of configs) {
  const plug = await loadAnim(bytes, { parts: cfg.parts });
  for (const t of TIMES) {
    const S = { W, H: 32, t, parts: cfg.parts, faint: cfg.faint }, a = new T.FB(W, 32), b = new T.FB(W, 32);
    built.bg(a, S, cfg.faint ? 0.5 : 1);
    b.noClip(); b.clear(); plug.plug.bg(b, S, cfg.faint ? 0.5 : 1);
    let n = 0, worst = 0, where = "";
    for (let i = 0; i < a.d.length; i++) { const d = Math.abs(Math.round(a.d[i]) - Math.round(b.d[i])); if (d > 1) { n++; if (d > worst) { worst = d; where = `(${Math.floor(i / 3) % W},${Math.floor(i / 3 / W)})`; } } }
    // Faint is informational: the built-in blends each shape at half alpha over a half-bright sky, while the host dims the plugin's finished frame, so layers stack differently.
    if (cfg.faint) { if (n) faint++; continue; }
    cases++;
    if (n) { bad++; console.log(`W=${W} t=${t} ${cfg.name}: ${n} channels differ, worst ${worst} at ${where}`); }
  }
}
console.log(bad ? `${bad} of ${cases} frames differ` : `all ${cases} frames match`);
if (faint) console.log(`(${faint} faint frames differ, as the host dims plugins differently from the built-ins)`);
process.exit(bad ? 1 : 0);
