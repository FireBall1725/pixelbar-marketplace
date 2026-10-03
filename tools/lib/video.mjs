// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 FireBall1725
// Frames plus a WAV to an MP4 (H.264 and AAC) through ffmpeg, so a sound can be heard and seen in one file. Gives back
// the path, or null when ffmpeg isn't installed.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function haveFfmpeg() { return spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0; }

export function video(path, frames, fps, wavPath) {
  if (!haveFfmpeg() || !frames.length) return null;
  const dir = mkdtempSync(join(tmpdir(), "pbm-video-")), { w, h } = frames[0];
  // raw RGB frames in one file; even dimensions, since H.264 needs them
  const W = w + (w % 2), H = h + (h % 2), buf = Buffer.alloc(W * H * 3 * frames.length);
  frames.forEach((f, k) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (y * w + x) * 4, d = (k * W * H + y * W + x) * 3; buf[d] = f.rgba[s]; buf[d + 1] = f.rgba[s + 1]; buf[d + 2] = f.rgba[s + 2]; } });
  const raw = join(dir, "frames.rgb"); writeFileSync(raw, buf);
  try {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(fps), "-i", raw, "-i", wavPath,
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", path], { stdio: "pipe" });
    return path;
  } catch (e) { return null; } finally { rmSync(dir, { recursive: true, force: true }); }
}
