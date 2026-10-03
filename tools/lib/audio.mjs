// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// A sound as the buzzer plays it, written to a WAV: square waves at each note's pitch with the simulator's envelope
// (a 10 ms rise, then a fade to silence over the note), so the file sounds like the preview in Home Assistant.
import { writeFileSync } from "node:fs";

export const RATE = 22050;
/* notes: { f (Hz, 0 for a rest), d (seconds), on (seconds it sounds) }. Gives back 16-bit mono samples. */
export function synth(notes) {
  const total = notes.reduce((a, n) => a + n.d, 0) + 0.1, out = new Int16Array(Math.ceil(total * RATE));
  let at = 0;
  for (const n of notes) {
    if (n.f > 0) {
      const start = Math.round(at * RATE), len = Math.round((n.on || n.d) * RATE), rise = Math.round(0.01 * RATE);
      for (let i = 0; i < len && start + i < out.length; i++) {
        // the simulator ramps gain from 0.0001 to 0.06 in 10 ms, then back down to 0.0001 by the end of the note
        const g = i < rise ? Math.pow(600, i / rise) * 0.0001 : 0.06 * Math.pow(0.0001 / 0.06, (i - rise) / Math.max(1, len - rise));
        const sq = Math.sin(2 * Math.PI * n.f * i / RATE) >= 0 ? 1 : -1;
        out[start + i] = Math.round(sq * g * 0.9 * 32767 / 0.06 * 0.5);
      }
    }
    at += n.d;
  }
  return out;
}
export function wav(path, samples) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) b.writeInt16LE(samples[i], 44 + i * 2);
  writeFileSync(path, b);
}
