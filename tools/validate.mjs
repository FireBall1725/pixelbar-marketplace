// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// Checks items before they're merged: the fields every item needs, each message against the display's own schemas,
// what each kind must carry, size limits, ids and names, and that nothing is already in the marketplace.
//   node tools/validate.mjs [item dirs...]   (all items when none are given) exits 1 on any problem
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { problem, route } from "./lib/schema.mjs";
import { KINDS, LICENSES, MAINTAINERS, MAX_BYTES, OFFICIAL, SEMVER, fingerprint, isPlugin, listItems, partsOf, readRetired, sourceOf } from "./lib/items.mjs";

const SLUG = /^(?=[a-z0-9-]*[a-z])[a-z0-9][a-z0-9-]{1,40}$/, LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/, TAG = /^[a-z0-9-]{2,24}$/, NS = /^[a-z0-9](?:[a-z0-9-]{0,38})$/;
/* What each kind must hold, by the routes of its messages. */
const NEEDS = {
  notification: [ms => ms.some(r => r.kind === "notify"), "a notification message (pixelbar/all/notify/<key>)"],
  card: [ms => ms.some(r => r.kind === "box"), "a box message with its card (pixelbar/all/box/<name>)"],
  sensor: [ms => ms.some(r => r.kind === "box") && ms.some(r => r.kind === "data"), "a box message and the data it shows (pixelbar/all/data/<key>)"],
  theme: [ms => ms.length === 1 && ms[0].kind === "theme", "one theme message (pixelbar/all/theme)"],
  sound: [ms => ms.length === 1 && ms[0].kind === "sound", "one saved sound (pixelbar/all/asset/sound/<name>)"],
  picture: [ms => ms.length === 1 && ms[0].kind === "image", "one picture (pixelbar/all/asset/image/<name>)"],
};

export function check(dir, seen = new Map()) {
  const out = [], say = m => out.push(m), { kind, ns, slug } = partsOf(dir), file = join(dir, "item.json");
  if (!KINDS.includes(kind)) say(`"${kind}" isn't a kind: items go in items/<${KINDS.join("|")}>/<your GitHub username>/<name>/.`);
  if (!NS.test(ns)) say(`The folder "${ns}" should be your GitHub username in lowercase: items/${kind}/<username>/${slug}/.`);
  if (!SLUG.test(slug)) say(`The folder name "${slug}" should be lowercase letters, digits and -, 2 to 41 long, with at least one letter (a number on its own reads as an id).`);
  if (!existsSync(file)) { say("item.json is missing."); return { problems: out }; }
  if (statSync(file).size > MAX_BYTES) say("item.json is over 64 KB.");
  let item;
  try { item = JSON.parse(readFileSync(file, "utf8")); } catch (e) { say(`item.json isn't valid JSON: ${e.message}`); return { problems: out }; }
  if (item.kind !== kind) say(`"kind" is "${item.kind}" but the item is in items/${kind}/.`);
  if (typeof item.title !== "string" || !item.title.trim() || item.title.length > 60) say('"title" is required, up to 60 characters.');
  if (item.description != null && (typeof item.description !== "string" || item.description.length > 300)) say('"description" is up to 300 characters.');
  if (typeof item.author !== "string" || !LOGIN.test(item.author)) say('"author" is your GitHub username.');
  else if (ns !== item.author.toLowerCase() && !(ns === OFFICIAL && MAINTAINERS.includes(item.author)))
    say(`The item is in items/${kind}/${ns}/, but its author is ${item.author}: it goes in items/${kind}/${item.author.toLowerCase()}/${slug}/.`);
  if (!Number.isInteger(item.id) || item.id < 1) say('"id" is the item\'s number, a whole number from 1: the pull request check says which one to use.');
  if (typeof item.version !== "string" || !SEMVER.test(item.version)) say('"version" is three numbers like "1.0.0": raise it whenever you change the item.');
  if (!LICENSES.includes(item.license)) say(`"license" must be one of: ${LICENSES.join(", ")}.`);
  if (item.tags != null && (!Array.isArray(item.tags) || item.tags.length > 5 || item.tags.some(t => !TAG.test(t)))) say('"tags" is up to five lowercase words (letters, digits and -).');
  const allowed = new Set(["kind", "id", "version", "title", "description", "author", "license", "tags", "msgs", "source", "params"]);
  for (const k of Object.keys(item)) if (!allowed.has(k)) say(`"${k}" isn't a field of an item.`);
  const flags = [];
  if (isPlugin(item)) {
    const src = join(dir, sourceOf(item)), what = kind === "theme" ? "theme" : "animation";
    if (item.msgs) say(`A plugin ${what} has no messages: its source is the item.`);
    if (!existsSync(src)) say(`The ${what}'s source (${sourceOf(item)}) is missing.`);
    else if (statSync(src).size > MAX_BYTES) say(`The ${what}'s source is over 64 KB.`);
    if (item.params != null && typeof item.params !== "object") say(kind === "theme" ? '"params" holds the parts the preview shows it with.' : '"params" holds the title, message and colors the preview plays it with.');
  } else if (KINDS.includes(kind)) {
    if (!Array.isArray(item.msgs) || item.msgs.length < 1 || item.msgs.length > 8) say('"msgs" is one to eight messages: { "topic": ..., "payload": ... }.');
    else {
      const routes = [];
      item.msgs.forEach((m, i) => {
        if (!m || typeof m.topic !== "string") { say(`msgs[${i}] needs a topic.`); return; }
        if (!/^pixelbar\/all\//.test(m.topic)) say(`msgs[${i}]: shared items send to every display, so the topic starts pixelbar/all/.`);
        const p = problem(m.topic, m.payload ?? null);
        if (p) say(`msgs[${i}] (${m.topic}): ${p}`);
        const r = route(m.topic); if (r) routes.push(r);
        if (r && r.kind === "image" && kind !== "picture") flags.push("pictures");
        if (m.payload && JSON.stringify(m.payload).includes('"data"') && /images/.test(JSON.stringify(m.payload))) flags.push("pictures");
      });
      if (NEEDS[kind] && !NEEDS[kind][0](routes)) say(`A ${kind} needs ${NEEDS[kind][1]}.`);
    }
  }
  if (!out.length) {
    const fp = fingerprint(dir, item);
    if (seen.has(fp)) say(`It's the same as ${seen.get(fp)}.`); else seen.set(fp, dir);
  }
  return { item, problems: out, flags: [...new Set(flags)] };
}

/* Across every item: no two share an id or a name, and no id belongs to a retired item. Gives a map of folder -> problems. */
export function crossCheck(all = listItems(), retired = readRetired()) {
  const out = new Map(), say = (d, m) => out.set(d, [...(out.get(d) || []), m]), byId = new Map(), byName = new Map();
  for (const d of all) {
    let item; try { item = JSON.parse(readFileSync(join(d, "item.json"), "utf8")); } catch { continue; }
    const { name } = partsOf(d);
    if (Number.isInteger(item.id)) {
      if (byId.has(item.id)) say(d, `id ${item.id} is already ${byId.get(item.id)}'s.`); else byId.set(item.id, d);
      const r = retired.find(x => x.id === item.id);
      if (r) say(d, `id ${item.id} belonged to ${r.name}, which was retired; ids are never reused.`);
    }
    if (byName.has(name)) say(d, `${name} is already the name of ${byName.get(name)}: names are unique across kinds.`); else byName.set(name, d);
  }
  return out;
}
/* The number a new item gets: one past every id ever issued, retired ones included. */
export function nextId(ids, retired = readRetired()) {
  return Math.max(0, ...ids, ...retired.map(r => r.id)) + 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const all = listItems(), targets = process.argv.length > 2 ? process.argv.slice(2) : all, seen = new Map(), cross = crossCheck(all);
  // Everything already merged counts for duplicates; the items being checked are compared last.
  for (const d of all) if (!targets.includes(d)) { try { const it = JSON.parse(readFileSync(join(d, "item.json"), "utf8")); seen.set(fingerprint(d, it), d); } catch { /* checked when it's a target */ } }
  let bad = 0;
  for (const d of targets) {
    const r = check(d, seen), problems = [...r.problems, ...(cross.get(d) || [])];
    if (problems.length) { bad++; console.log(`✗ ${d}`); problems.forEach(p => console.log(`    ${p}`)); } else console.log(`✓ ${d}`);
  }
  process.exit(bad ? 1 : 0);
}
