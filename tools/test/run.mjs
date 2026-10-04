// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// Checks the checker: good items of every kind pass and render, broken ones fail with the right reason.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { check } from "../validate.mjs";
import { preview } from "../preview.mjs";

const T = join(tmpdir(), "pbm-test"), out = process.argv[2] || join(T, "out");
rmSync(T, { recursive: true, force: true });
const mk = (kind, slug, item) => { const d = join(T, "items", kind, slug); mkdirSync(d, { recursive: true }); writeFileSync(join(d, "item.json"), JSON.stringify({ kind, author: "FireBall1725", license: "CC-BY-4.0", ...item })); return d; };
const img = (() => { const w = 8, h = 8, b = Buffer.alloc(w * h * 2); for (let i = 0; i < w * h; i++) { const v = (i % 3 === 0) ? 0xF800 : (i % 3 === 1) ? 0x07E0 : 0x001F; b[i * 2] = v >> 8; b[i * 2 + 1] = v & 255; } return { v: 2, w, h, format: "rgb565", data: b.toString("base64") }; })();
const good = {
  notification: mk("notification", "front-door", { title: "Front door", msgs: [{ topic: "pixelbar/all/notify/front_door", payload: { v: 2, tier: "alert", sound: "chime", card: { card: "text", icon: "door", title: "FRONT DOOR", message: "OPENED" } } }] }),
  card: mk("card", "big-clock", { title: "Big clock", msgs: [{ topic: "pixelbar/all/box/main", payload: { v: 2, cards: [{ card: "clock" }] } }] }),
  sensor: mk("sensor", "outside", { title: "Outside", msgs: [{ topic: "pixelbar/all/data/outside_temperature", payload: { v: 2, value: 12.4, unit: "°C" } }, { topic: "pixelbar/all/box/main", payload: { v: 2, cards: [{ card: "temperature", data: "outside_temperature", label: "OUTSIDE" }] } }] }),
  theme: mk("theme", "snowy-christmas", { title: "Snowy Christmas", msgs: [{ topic: "pixelbar/all/theme", payload: { v: 2, theme: "christmas", parts: { snow: { amount: 200 }, snowman: { size: 120 } } } }] }),
  sound: mk("sound", "doorbell", { title: "Doorbell", msgs: [{ topic: "pixelbar/all/asset/sound/doorbell", payload: { v: 2, rtttl: "doorbell:d=4,o=5,b=100:e6,2c.6" } }] }),
  picture: mk("picture", "test-card", { title: "Test card", msgs: [{ topic: "pixelbar/all/asset/image/test_card", payload: img }] }),
};
const bad = {
  "wrong field": [mk("notification", "bad-field", { title: "X", msgs: [{ topic: "pixelbar/all/notify/x", payload: { v: 2, tier: "alert", card: { card: "text", title: "X", colour: "#fff" } } }] }), /isn't a field/],
  "display topic": [mk("card", "bad-topic", { title: "X", msgs: [{ topic: "pixelbar/kitchen/box/main", payload: { v: 2, cards: [{ card: "clock" }] } }] }), /starts pixelbar\/all/],
  "no licence": [mk("theme", "no-license", { title: "X", license: "GPL", msgs: [{ topic: "pixelbar/all/theme", payload: { v: 2, theme: "christmas" } }] }), /license/],
  "kind mismatch": [mk("sound", "wrong-kind", { kind: "picture", title: "X", msgs: [{ topic: "pixelbar/all/asset/sound/x", payload: { v: 2, rtttl: "x:d=4,o=5,b=100:c" } }] }), /items\/sound/],
  "duplicate": [mk("card", "big-clock-2", { title: "Copy", msgs: [{ topic: "pixelbar/all/box/main", payload: { v: 2, cards: [{ card: "clock" }] } }] }), /same as/],
};
let fail = 0;
const seen = new Map();
for (const [k, d] of Object.entries(good)) { const r = check(d, seen); if (r.problems.length) { fail++; console.log(`✗ good ${k}: ${r.problems.join(" | ")}`); continue; } const p = await preview(d, out); console.log(`✓ good ${k} → ${p.files.join(", ")}${p.notes ? `  notes ${p.notes.names.join(" ")}` : ""}`); }
for (const [k, [d, re]] of Object.entries(bad)) { const r = check(d, seen); const ok = r.problems.some(p => re.test(p)); if (!ok) fail++; console.log(`${ok ? "✓" : "✗"} bad ${k}: ${r.problems.join(" | ") || "(passed!)"}`); }
console.log(fail ? `${fail} failed` : "all good"); process.exit(fail ? 1 : 0);
