// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// The PR check: validates the items a pull request adds or changes, renders their previews and writes the comment.
//   node tools/check-pr.mjs <changed paths file> <out dir> [base ref, default origin/main]
// PR_AUTHOR in the environment is the pull request's author: a new item goes under their own name unless they're a maintainer.
// out/ gets the preview files, comment.md (with {{BASE}} where the posting workflow puts the previews branch address, {{SITE}} the previews site's page, {{PAGE}} its link),
// and result.json. Exits 1 when an item has a problem, after writing everything, so the comment still goes up.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { check, crossCheck, nextId } from "./validate.mjs";
import { preview } from "./preview.mjs";
import { MAINTAINERS, compareVersions, fingerprint, fingerprintOf, isPlugin, listItems, partsOf, readRetired, sourceOf } from "./lib/items.mjs";

const [, , changedFile, out = "out", base = "origin/main"] = process.argv;
const AUTHOR = process.env.PR_AUTHOR || "";
mkdirSync(out, { recursive: true });
const changed = readFileSync(changedFile, "utf8").split("\n").map(s => s.trim()).filter(Boolean);
const dirs = [...new Set(changed.filter(p => p.startsWith("items/") && p.split("/").length >= 5).map(p => p.split("/").slice(0, 4).join("/")))];
const all = listItems(), seen = new Map(), cross = crossCheck(all), retired = readRetired();
for (const d of all) if (!dirs.includes(d)) { try { seen.set(fingerprint(d, JSON.parse(readFileSync(join(d, "item.json"), "utf8"))), d); } catch { /* not ours to check */ } }

/* What main has, by id: each item's folder, its item.json and its fingerprint, read out of git. Items from before ids have none and are skipped. */
const git = (...a) => { try { return execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; } };
const onBase = new Map();
for (const f of (git("ls-tree", "-r", "--name-only", base, "--", "items") || "").split("\n").filter(f => f.endsWith("/item.json"))) {
  let item; try { item = JSON.parse(git("show", `${base}:${f}`)); } catch { continue; }
  if (!Number.isInteger(item.id)) continue;
  const dir = f.slice(0, -"/item.json".length), src = isPlugin(item) ? git("show", `${base}:${dir}/${sourceOf(item)}`) : null;
  onBase.set(item.id, { dir, item, fp: fingerprintOf(item, src) });
}
const headIds = new Map();
for (const d of all) { try { const it = JSON.parse(readFileSync(join(d, "item.json"), "utf8")); if (Number.isInteger(it.id)) headIds.set(it.id, d); } catch { /* checked below */ } }
let free = nextId([...onBase.keys(), ...[...headIds.keys()]], retired);
const issued = Math.max(0, ...onBase.keys(), ...retired.map(r => r.id));

/* Id and version rules against main: an item keeps its id and kind, its version never goes back, and a change raises it. */
function againstBase(d, item) {
  const say = [], { ns } = partsOf(d);
  if (!Number.isInteger(item.id)) { say.push(`Give it "id": ${free++} (the next free number).`); return say; }
  const b = onBase.get(item.id);
  if (b) {
    if (b.item.kind !== item.kind) say.push(`id ${item.id} is ${b.dir} on main, a ${b.item.kind}; an item's kind can't change.`);
    if (typeof item.version === "string" && typeof b.item.version === "string") {
      const c = compareVersions(item.version, b.item.version);
      if (c < 0) say.push(`"version" went back from ${b.item.version} to ${item.version}.`);
      else if (c === 0 && fingerprint(d, item) !== b.fp) say.push(`It changed, so raise "version" above ${b.item.version}.`);
    }
  } else {
    if (item.id <= issued) say.push(`id ${item.id} was already issued; a new item takes "id": ${free++}.`);
    if (AUTHOR && !MAINTAINERS.includes(AUTHOR) && ns !== AUTHOR.toLowerCase()) say.push(`New items from @${AUTHOR} go in items/${item.kind}/${AUTHOR.toLowerCase()}/.`);
  }
  return say;
}

const rows = [], blocks = [], kinds = new Set(), flags = new Set();
let bad = 0;
// An item gone from main's ids has to be in retired.json, so its number is never handed out again and its build stays up.
const gone = [...onBase.entries()].filter(([id]) => !headIds.has(id) && !retired.some(r => r.id === id));
for (const [id, b] of gone) {
  bad++; rows.push(`| \`${b.dir}\` | ${b.item.kind} | ✗ removed |`);
  blocks.push(`### ${b.item.title}\n\`${b.dir}\`\n\n- It was removed, so add it to retired.json: \`{ "id": ${id}, "name": "${partsOf(b.dir).name}", "kind": "${b.item.kind}", "reason": "..." }\`.`);
}
if (!dirs.length && !gone.length) blocks.push("This pull request doesn't add or change any items, so there's nothing to preview.");
for (const d of dirs) {
  if (!existsSync(d)) { if (!gone.some(([, b]) => b.dir === d)) rows.push(`| \`${d}\` | | removed or moved |`); continue; }
  const r = check(d, seen), title = r.item && r.item.title ? r.item.title : d;
  if (r.item) {
    const extra = againstBase(d, r.item);   // a missing id gets the exact number to use, in place of the general rule
    if (!Number.isInteger(r.item.id)) r.problems = r.problems.filter(p => !p.startsWith('"id"'));
    r.problems.push(...(cross.get(d) || []), ...extra);
  }
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
  const moved = onBase.get(r.item.id), was = moved && moved.dir !== d ? `, moved from \`${moved.dir}\`` : "";
  const lines = [`### ${title}`, `\`${d}\` by @${r.item.author}, ${r.item.license}, id ${r.item.id}, version ${r.item.version}${was}`, ""];
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
