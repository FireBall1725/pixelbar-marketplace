// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// Runs a plugin's .wasm through the site simulator's own plugin host (loadPlugin in pixelbar.js), so previews here match the
// site, Home Assistant and the display. params is the notification or theme it plays with: { title, message, detail, colors, parts, night }.
import { performance } from "node:perf_hooks";
import sim from "./sim.cjs";

export const SIM_NAMES = ["FB", "drawLook", "F5", "fitText", "soundNotes", "rtttlHead", "notesStrip", "loadPlugin", "addPluginTheme", "THEMES", "hash"];

export async function loadAnim(bytes, params = {}) {
  const T = sim(SIM_NAMES), plug = await T.loadPlugin(bytes, params);
  return {
    T, manifest: plug.manifest, plug,
    /* Draws frame t into the framebuffer f (W x 32): black first, then the plugin. Gives back the plugin's own time in ms. */
    frame(f, t) { const a = performance.now(); plug.frame(f, t); return performance.now() - a; },
    /* Draws it as a theme's sky: parts and night come from params, k is the brightness. */
    bg(f, t, k = 1) { f.noClip(); f.clear(); plug.bg(f, { W: f.W, H: 32, t, parts: params.parts, night: params.night, hx: params.hx }, k); },
  };
}
