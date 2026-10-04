// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// Frames as pictures: each LED drawn as a lit square with a dark gap, the way the panel looks, then PNG or animated GIF.
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;

/* RGB floats 0..255 (the simulator's framebuffer), W x H, to an RGBA image k pixels per LED. Unlit LEDs stay faintly visible. */
export function leds(d, W, H, k = 3) {
  const w = W * k, h = H * k, out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4, gap = k > 2 && (x % k === k - 1 || y % k === k - 1);
    if (gap) { out[o + 3] = 255; continue; }
    const i = ((y / k | 0) * W + (x / k | 0)) * 3, r = Math.min(255, d[i]), g = Math.min(255, d[i + 1]), b = Math.min(255, d[i + 2]), lit = r + g + b > 9;
    out[o] = lit ? r : 16; out[o + 1] = lit ? g : 18; out[o + 2] = lit ? b : 24; out[o + 3] = 255;
  }
  return { w, h, rgba: out };
}

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
export function png(path, { w, h, rgba }) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const hd = Buffer.alloc(13); hd.writeUInt32BE(w, 0); hd.writeUInt32BE(h, 4); hd[8] = 8; hd[9] = 6;
  writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", hd), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
}
/* Frames of one size to an animated GIF at fps frames a second, looping. */
export function gif(path, frames, fps) {
  const g = GIFEncoder();
  for (const f of frames) { const pal = quantize(f.rgba, 256, { format: "rgb565" }); g.writeFrame(applyPalette(f.rgba, pal, "rgb565"), f.w, f.h, { palette: pal, delay: Math.round(1000 / fps) }); }
  g.finish(); writeFileSync(path, g.bytes());
}
