// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// Renders an item's preview the way the Marketplace shows it: an animated GIF on a medium (256 LED) strip, a still at
// XXL (640), a big LED view of a picture, the notes of a sound. Plugins are compiled from their C first. A theme also gets
// the moderation sweep: every part off, then each part on alone, so nothing can hide behind the others.
//   node tools/preview.mjs items/<kind>/<slug> [out dir]     prints a JSON summary of what it wrote
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { execFileSync } from "node:child_process";
import { basename, join, resolve } from "node:path";
import sim from "./lib/sim.cjs";
import { SIM_NAMES, loadAnim } from "./lib/anim.mjs";
import { builtinParts, sweep } from "./lib/parts.mjs";
import { isPlugin, sourceOf } from "./lib/items.mjs";
import { gif, leds, png } from "./lib/image.mjs";
import { synth, wav } from "./lib/audio.mjs";
import { video } from "./lib/video.mjs";

const NOW = new Date("2026-10-03T14:25:00"), FPS = 15, SECONDS = 6, ROOT = resolve(new URL("..", import.meta.url).pathname);

export async function preview(dir, out) {
  const item = JSON.parse(readFileSync(join(dir, "item.json"), "utf8")), slug = basename(resolve(dir)), T = sim(SIM_NAMES);
  mkdirSync(out, { recursive: true });
  const res = { slug, kind: item.kind, title: item.title, files: [], notes: null, ms: null, audio: null, video: null };
  const strip = (W, draw) => { const fb = new T.FB(W, 32); draw(fb); return leds(fb.d, W, 32, 3); };
  const anim = async (W, frames, draw) => { const fs = []; for (let i = 0; i < frames; i++) fs.push(await draw(i / FPS, W)); return fs; };

  const SWEEP_SECONDS = 3;
  if (item.kind === "animation") {
    const src = join(dir, sourceOf(item)), wasm = join(out, slug + ".wasm");
    execFileSync(join(ROOT, "sdk/build.sh"), [src, wasm], { stdio: "pipe" });
    const bytes = readFileSync(wasm), params = item.params || {}, m = (await loadAnim(bytes, params)).manifest;
    // An animation's manifest is optional; one that declares parts gets the same sweep a theme does.
    if (m && m.error) throw new Error(`The animation's manifest didn't parse: ${m.error}`);
    if (m && m.kind !== "animation") throw new Error('An animation\'s manifest needs "kind": "animation".');
    if (m && m.parts && (typeof m.parts !== "object" || Array.isArray(m.parts))) throw new Error('The manifest\'s "parts" is an object keyed by part name.');
    const render = async (W, seconds, parts) => { const a = await loadAnim(bytes, { ...params, parts }), fb = new T.FB(W, 32), frames = []; let ms = 0; for (let i = 0; i < FPS * seconds; i++) { ms += a.frame(fb, i / FPS); frames.push(leds(fb.d, W, 32, 3)); } return { frames, ms: ms / (FPS * seconds) }; };
    const d256 = await render(256, SECONDS, params.parts), d640 = await render(640, SECONDS, params.parts);
    gif(join(out, slug + ".gif"), d256.frames, FPS); res.files.push(slug + ".gif");
    png(join(out, slug + "-xxl.png"), d640.frames[Math.round(FPS * 1.5)]); res.files.push(slug + "-xxl.png");
    res.ms = +d640.ms.toFixed(3); res.wasm_bytes = bytes.length;
    if (m) res.manifest = m;
    if (m && m.parts) { res.sweep = []; for (const c of sweep(Object.keys(m.parts))) { const f = `${slug}-${c.name}.gif`; gif(join(out, f), (await render(256, SWEEP_SECONDS, c.parts)).frames, FPS); res.files.push(f); res.sweep.push(f); } }
    return res;
  }
  if (item.kind === "theme" && isPlugin(item)) {
    const src = join(dir, sourceOf(item)), wasm = join(out, slug + ".wasm");
    execFileSync(join(ROOT, "sdk/build.sh"), [src, wasm], { stdio: "pipe" });
    const bytes = readFileSync(wasm), params = item.params || {}, probe = await loadAnim(bytes, params), m = probe.manifest;
    if (!m || m.error) throw new Error(`The theme's manifest didn't parse: ${m ? m.error : "manifest() is missing"}`);
    if (m.api !== 2 || m.kind !== "theme") throw new Error('The manifest needs "api": 2 and "kind": "theme".');
    if (typeof m.title !== "string" || !m.title.trim()) throw new Error('The manifest needs a "title".');
    if (m.parts && (typeof m.parts !== "object" || Array.isArray(m.parts))) throw new Error('The manifest\'s "parts" is an object keyed by part name.');
    res.manifest = m; res.wasm_bytes = bytes.length; res.sweep = [];
    const render = async (W, seconds, parts) => { const a = await loadAnim(bytes, { ...params, parts }), fb = new T.FB(W, 32), frames = []; let ms = 0; for (let i = 0; i < FPS * seconds; i++) { const t0 = performance.now(); a.bg(fb, i / FPS); ms += performance.now() - t0; frames.push(leds(fb.d, W, 32, 3)); } return { frames, ms: ms / frames.length }; };
    const d256 = await render(256, SECONDS, params.parts), d640 = await render(640, SECONDS, params.parts);
    gif(join(out, slug + ".gif"), d256.frames, FPS); res.files.push(slug + ".gif");
    png(join(out, slug + "-xxl.png"), d640.frames[Math.round(FPS * 1.5)]); res.files.push(slug + "-xxl.png");
    res.ms = +d640.ms.toFixed(3);
    for (const c of sweep(Object.keys(m.parts || {}))) { const f = `${slug}-${c.name}.gif`; gif(join(out, f), (await render(256, SWEEP_SECONDS, c.parts)).frames, FPS); res.files.push(f); res.sweep.push(f); }
    return res;
  }
  if (item.kind === "sound") {
    const m = item.msgs[0], p = m.payload, spec = p.rtttl ? { rtttl: p.rtttl } : { steps: p.steps }, notes = T.soundNotes(spec);
    res.notes = { count: notes.filter(x => x.f).length, seconds: +notes.reduce((a, x) => a + x.d, 0).toFixed(2), names: notes.map(x => x.name) };
    png(join(out, slug + ".png"), strip(256, fb => T.notesStrip(fb, { W: 256, H: 32, t: 0 }, { title: item.title, notes: res.notes.names, at: -1 })));
    res.files.push(slug + ".png");
    // The tune to listen to, and a video of the notes lighting up as it plays when ffmpeg is about.
    wav(join(out, slug + ".wav"), synth(notes)); res.audio = slug + ".wav";
    const starts = []; let acc = 0; for (const n of notes) { starts.push(acc); acc += n.d; }
    const o = { title: `Playing ${item.title}`, notes: res.notes.names, at: -1 }, total = acc + 0.6;
    const frames = []; for (let i = 0; i < Math.ceil(total * FPS); i++) { const t = i / FPS; let at = -1; for (let k = 0; k < notes.length; k++) if (t >= starts[k] && t < starts[k] + notes[k].d) at = k; o.at = at; o.title = at >= 0 ? `Playing ${item.title}` : item.title; frames.push(strip(256, fb => T.notesStrip(fb, { W: 256, H: 32, t }, o))); }
    const mp4 = video(join(out, slug + ".mp4"), frames, FPS, join(out, slug + ".wav"));
    if (mp4) res.video = slug + ".mp4";
    res.files.push(res.audio); if (res.video) res.files.push(res.video);
    return res;
  }
  if (item.kind === "picture") {
    const p = item.msgs[0].payload, bin = Buffer.from(p.data, "base64"), d = new Float32Array(p.w * p.h * 3);
    for (let i = 0; i < p.w * p.h; i++) { const v = (bin[i * 2] << 8) | bin[i * 2 + 1]; d[i * 3] = ((v >> 11) & 31) * 255 / 31; d[i * 3 + 1] = ((v >> 5) & 63) * 255 / 63; d[i * 3 + 2] = (v & 31) * 255 / 31; }
    png(join(out, slug + ".png"), leds(d, p.w, p.h, 10)); res.files.push(slug + ".png");
  }
  // Notifications, cards, sensors, themes and pictures as the Marketplace's strip draws them.
  const look = item.kind === "theme" ? (({ theme, parts }) => ({ theme, parts }))(item.msgs.find(m => /\/theme$/.test(m.topic)).payload) : { msgs: item.msgs };
  const draw = (t, W) => { const d = { W, fb: new T.FB(W, 32), present() {}, ...look }; T.drawLook(d, t, NOW); return leds(d.fb.d, W, 32, 3); };
  const one = { W: 256, fb: new T.FB(256, 32), present() {}, ...look }, frames = [];
  for (let i = 0; i < FPS * SECONDS; i++) { T.drawLook(one, i / FPS, NOW); frames.push(leds(one.fb.d, 256, 32, 3)); }
  gif(join(out, slug + ".gif"), frames, FPS); res.files.push(slug + ".gif");
  png(join(out, slug + "-xxl.png"), draw(1.5, 640)); res.files.push(slug + "-xxl.png");
  if (item.kind === "theme") {
    res.sweep = [];
    for (const c of sweep(builtinParts(look.theme))) {
      const d = { W: 256, fb: new T.FB(256, 32), present() {}, theme: look.theme, parts: c.parts }, fr = [];
      for (let i = 0; i < FPS * SWEEP_SECONDS; i++) { T.drawLook(d, i / FPS, NOW); fr.push(leds(d.fb.d, 256, 32, 3)); }
      const f = `${slug}-${c.name}.gif`; gif(join(out, f), fr, FPS); res.files.push(f); res.sweep.push(f);
    }
  }
  return res;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2], out = process.argv[3] || "previews";
  if (!dir || !existsSync(join(dir, "item.json"))) { console.error("usage: node tools/preview.mjs items/<kind>/<slug> [out dir]"); process.exit(2); }
  console.log(JSON.stringify(await preview(dir, out), null, 2));
}
