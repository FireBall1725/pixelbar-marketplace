// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// The PR check: validates the items a pull request adds or changes, renders their previews and writes the comment.
//   node tools/check-pr.mjs <changed paths file> <out dir>
// out/ gets the preview files, comment.md (with {{BASE}} where the posting workflow puts the previews branch address, {{SITE}} the previews site's page, {{PAGE}} its link),
// and result.json. Exits 1 when an item has a problem, after writing everything, so the comment still goes up.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { check } from "./validate.mjs";
import { preview } from "./preview.mjs";
import { fingerprint, listItems } from "./lib/items.mjs";

const [, , changedFile, out = "out"] = process.argv;
mkdirSync(out, { recursive: true });
const changed = readFileSync(changedFile, "utf8").split("\n").map(s => s.trim()).filter(Boolean);
const dirs = [...new Set(changed.filter(p => p.startsWith("items/")).map(p => p.split("/").slice(0, 3).join("/")))].filter(d => d.split("/").length === 3);
const all = listItems(), seen = new Map();
for (const d of all) if (!dirs.includes(d)) { try { seen.set(fingerprint(d, JSON.parse(readFileSync(join(d, "item.json"), "utf8"))), d); } catch { /* not ours to check */ } }

const rows = [], blocks = [], kinds = new Set(), flags = new Set();
let bad = 0;
if (!dirs.length) blocks.push("This pull request doesn't add or change any items, so there's nothing to preview.");
for (const d of dirs) {
  if (!existsSync(d)) { rows.push(`| \`${d}\` | | removed |`); continue; }
  const r = check(d, seen), title = r.item && r.item.title ? r.item.title : d;
  if (r.item && r.item.kind) kinds.add(r.item.kind);
  for (const f of r.flags || []) flags.add(f);
  if (r.problems.length) {
    bad++; rows.push(`| \`${d}\` | ${r.item ? r.item.kind : ""} | ✗ ${r.problems.length} problem${r.problems.length > 1 ? "s" : ""} |`);
    blocks.push(`### ${title}\n\`${d}\`\n\n${r.problems.map(p => `- ${p}`).join("\n")}`);
    continue;
  }
  let p;
  try { p = await preview(d, out); } catch (e) { bad++; rows.push(`| \`${d}\` | ${r.item.kind} | ✗ didn't render |`); blocks.push(`### ${title}\n\`${d}\`\n\n- The preview failed: ${String(e.message || e).split("\n")[0]}`); continue; }
  rows.push(`| \`${d}\` | ${r.item.kind} | ✓ |`);
  const lines = [`### ${title}`, `\`${d}\` by @${r.item.author}, ${r.item.license}`, ""];
  if (r.item.description) lines.push(`> ${r.item.description}`, "");
  const sweep = new Set(p.sweep || []);
  for (const f of p.files) if (/\.(gif|png)$/.test(f) && !sweep.has(f)) lines.push(`![${f}]({{BASE}}/${f})`);
  // The moderation sweep: every part off, then each part on its own, folded away under the main preview.
  if (sweep.size) lines.push("", "<details><summary>Each part on its own, and each option</summary>", "", ...[...sweep].map(f => `**${f.replace(/^.*?-(off|only-)/, "$1").replace(/\.gif$/, "").replace(/^only-/, "")}**  \n![${f}]({{BASE}}/${f})`), "", "</details>");
  if (p.manifest) lines.push("", `${p.kind === "theme" ? "Theme plugin" : "Animation"}: ${Object.keys(p.manifest.parts || {}).length} parts (${Object.keys(p.manifest.parts || {}).join(", ")}), compiled to ${p.wasm_bytes} bytes.`);
  if (p.notes) {
    lines.push("", `${p.notes.count} notes, ${p.notes.seconds} s: \`${p.notes.names.join(" ")}\``);
    // GitHub plays only what's uploaded through its own editor, so these point at the previews site ({{SITE}}), which streams them; without one they're downloads from the branch.
    const hear = [p.video ? `[▶ Watch and listen]({{SITE}}/${p.video})` : null, p.audio ? `[Listen (WAV)]({{SITE}}/${p.audio})` : null].filter(Boolean);
    if (hear.length) lines.push("", hear.join(" · "));
  }
  if (p.ms != null) lines.push("", `Compiled to ${p.wasm_bytes} bytes. ${p.ms} ms a frame at 640 wide in V8; the display runs slower, so keep it light.`);
  if (r.flags.includes("pictures")) lines.push("", "**Has pictures:** check them before merging.");
  blocks.push(lines.join("\n"));
}
const ok = bad === 0;
writeFileSync(join(out, "comment.md"), ["<!-- pixelbar-preview -->", `## ${ok ? "✓ Ready for review" : "✗ Needs changes"}`, "", "{{PAGE}}", "| Item | Kind | Check |", "| --- | --- | --- |", ...rows, "", ...blocks.flatMap(b => [b, ""])].join("\n"));
// kinds and flags become labels on the pull request (post.yml).
writeFileSync(join(out, "result.json"), JSON.stringify({ ok, items: dirs.length, problems: bad, labels: [...[...kinds].map(k => `kind:${k}`), ...(flags.has("pictures") ? ["has pictures"] : []), ...(ok ? [] : ["needs changes"])] }));
console.log(readFileSync(join(out, "comment.md"), "utf8"));
process.exit(ok ? 0 : 1);
