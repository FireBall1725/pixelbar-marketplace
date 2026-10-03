// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// Runs an animation's .wasm the way the display will: each frame starts black, the API draws with the site's own
// framebuffer and PixelBar font, and the notification's words and colours come from params.
import { performance } from "node:perf_hooks";
import sim from "./sim.cjs";

export const SIM_NAMES = ["FB", "drawLook", "F5", "fitText", "soundNotes", "rtttlHead", "notesStrip"];
const dec = new TextDecoder(), enc = new TextEncoder();
const rgb = c => [(c >> 16) & 255, (c >> 8) & 255, c & 255];

export async function loadAnim(bytes, params = {}) {
  const T = sim(SIM_NAMES);
  let fb, mem;
  const str = (p, n) => dec.decode(new Uint8Array(mem.buffer, p, n));
  const fit = s => T.fitText(s, T.F5, false);
  const pb = {
    px: (x, y, c, a) => fb.px(x, y, rgb(c), a / 255),
    rect: (x, y, w, h, c, a) => fb.rect(x, y, w, h, rgb(c), a / 255),
    text: (p, n, x, y, c, size, outline) => { const s = fit(str(p, n)), sc = size === 2 ? 2 : 1; if (outline) fb.textO(T.F5, s, x, y, rgb(c), sc); else fb.text(T.F5, s, x, y, rgb(c), sc); return fb.tw(T.F5, s, sc); },
    text_width: (p, n, size) => fb.tw(T.F5, fit(str(p, n)), size === 2 ? 2 : 1),
    param: (kp, kn, bp, cap) => {
      const v = params[str(kp, kn)];
      if (typeof v !== "string" || cap < 1) return -1;
      const b = enc.encode(v).subarray(0, cap - 1), out = new Uint8Array(mem.buffer, bp, b.length + 1);
      out.set(b); out[b.length] = 0; return b.length;
    },
    color: i => { const c = (params.colors || [])[i]; return typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c) ? parseInt(c.slice(1), 16) : -1; },
  };
  const { instance } = await WebAssembly.instantiate(bytes, { pb });
  mem = instance.exports.memory;
  let started = false;
  return {
    T,
    /* Draws frame t into the framebuffer f (W x 32) and gives back how long the animation's own code took, in ms. */
    frame(f, t) {
      fb = f; fb.noClip(); fb.clear();
      if (!started) { started = true; if (instance.exports.init) instance.exports.init(f.W, 32); }
      const a = performance.now(); instance.exports.frame(t, f.W, 32); return performance.now() - a;
    },
  };
}
