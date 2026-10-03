// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// previews.pixelbar.fireball1725.ca: the Marketplace's pull request previews as pages you can watch and listen to.
// The files live on the repo's previews branch (written by the Post previews workflow); this Worker reads them with a
// token, since the repo is private, and serves them with the right types so sounds play in the browser.
//   /            every pull request that has previews
//   /pr-12/      that pull request's previews: GIFs, stills, a player for each sound
//   /pr-12/x.mp4 one file

const TYPES = { gif: "image/gif", png: "image/png", wav: "audio/wav", mp4: "video/mp4", md: "text/markdown; charset=utf-8" };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Only GET.", { status: 405 });
    const m = /^\/(?:(pr-\d+)\/?([A-Za-z0-9._-]+)?)?$/.exec(url.pathname);
    if (!m) return new Response("Not here.", { status: 404 });
    const [, pr, file] = m;
    // Cached by address alone, whole files only; a byte range is cut from the whole below, the way media players ask.
    const cache = caches.default, key = new Request(url.toString(), { method: "GET" });
    let res = await cache.match(key);
    if (!res) {
      if (!pr) res = await index(env);
      else if (!file) res = await page(env, pr);
      else res = await raw(env, pr, file);
      if (!res.ok) return res;
      // Files change when a pull request is pushed again, so nothing is kept long.
      res = new Response(await res.arrayBuffer(), res);
      res.headers.set("Cache-Control", "public, max-age=60");
      ctx.waitUntil(cache.put(key, res.clone()));
    }
    return ranged(request, res);
  },
};

/* A 206 for a Range request (what <video> and <audio> send), else the whole thing. */
async function ranged(request, res) {
  const r = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("Range") || "");
  const all = await res.arrayBuffer(), n = all.byteLength, h = new Headers(res.headers);
  h.set("Accept-Ranges", "bytes");
  if (!r || n === 0) { h.set("Content-Length", String(n)); return new Response(request.method === "HEAD" ? null : all, { status: res.status, headers: h }); }
  let a = r[1] === "" ? Math.max(0, n - +r[2]) : +r[1], b = r[1] !== "" && r[2] !== "" ? Math.min(+r[2], n - 1) : n - 1;
  if (a > b || a >= n) { h.set("Content-Range", `bytes */${n}`); return new Response(null, { status: 416, headers: h }); }
  h.set("Content-Range", `bytes ${a}-${b}/${n}`); h.set("Content-Length", String(b - a + 1));
  return new Response(request.method === "HEAD" ? null : all.slice(a, b + 1), { status: 206, headers: h });
}

const gh = (env, path, accept = "application/vnd.github+json") => fetch(`https://api.github.com${path}`, {
  headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: accept, "User-Agent": "pixelbar-previews", "X-GitHub-Api-Version": "2022-11-28" },
});

async function listing(env, path) {
  const r = await gh(env, `/repos/${env.REPO}/contents/${path}?ref=${env.BRANCH}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  const d = await r.json();
  return Array.isArray(d) ? d : null;
}

async function index(env) {
  const dirs = (await listing(env, "")) || [];
  const prs = dirs.filter(d => d.type === "dir" && /^pr-\d+$/.test(d.name)).map(d => +d.name.slice(3)).sort((a, b) => b - a);
  return html("PixelBar Marketplace previews", `<h1>Marketplace previews</h1>
    <p>What each open pull request would add, drawn by the PixelBar simulator.</p>
    <ul>${prs.map(n => `<li><a href="/pr-${n}/">Pull request #${n}</a> · <a href="https://github.com/${esc(env.REPO)}/pull/${n}">on GitHub</a></li>`).join("") || "<li>None yet.</li>"}</ul>`);
}

async function page(env, pr) {
  const files = await listing(env, pr);
  if (!files) return new Response("No previews for that pull request.", { status: 404 });
  const names = files.map(f => f.name).sort(), n = pr.slice(3);
  // One block per item: its GIF, still, and for a sound its video and audio, grouped by the file's stem.
  const stem = f => f.replace(/-xxl\.png$/, "").replace(/\.[a-z0-9]+$/, "");
  const items = [...new Set(names.map(stem))];
  const block = s => {
    const has = ext => names.find(f => f === `${s}.${ext}`), xxl = has("xxl") || names.find(f => f === `${s}-xxl.png`);
    const parts = [];
    if (has("mp4")) parts.push(`<video controls preload="metadata" src="/${pr}/${s}.mp4"></video>`);
    if (has("gif")) parts.push(`<img src="/${pr}/${s}.gif" alt="${esc(s)} on a 256 LED strip">`);
    if (has("png") && !has("mp4")) parts.push(`<img src="/${pr}/${s}.png" alt="${esc(s)}">`);
    if (xxl) parts.push(`<img class="xxl" src="/${pr}/${xxl}" alt="${esc(s)} at 640 LEDs">`);
    if (has("wav")) parts.push(`<audio controls preload="metadata" src="/${pr}/${s}.wav"></audio> <a href="/${pr}/${s}.wav" download>WAV</a>`);
    return `<section><h2>${esc(s)}</h2>${parts.join("")}</section>`;
  };
  return html(`Pull request #${n} previews`, `<p><a href="/">All previews</a> · <a href="https://github.com/${esc(env.REPO)}/pull/${n}">Pull request #${n} on GitHub</a></p>
    <h1>Pull request #${n}</h1>${items.map(block).join("")}`);
}

async function raw(env, pr, file) {
  const ext = file.split(".").pop().toLowerCase(), type = TYPES[ext];
  if (!type) return new Response("Not a preview file.", { status: 404 });
  const r = await fetch(`https://raw.githubusercontent.com/${env.REPO}/${env.BRANCH}/${pr}/${file}`, { headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, "User-Agent": "pixelbar-previews" } });
  if (r.status === 404) return new Response("No such file.", { status: 404 });
  if (!r.ok) return new Response(`GitHub said ${r.status}.`, { status: 502 });
  return new Response(r.body, { headers: { "Content-Type": type } });
}

function html(title, body) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>
:root{color-scheme:dark}body{margin:0;padding:24px 16px;background:#0b0d12;color:#e8e6e3;font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin-inline:auto}
a{color:#7cc4ff}h1{font-weight:500;font-size:22px}h2{font-weight:500;font-size:16px;margin:28px 0 8px}
section{padding:12px;border:1px solid #232733;border-radius:10px;background:#11141b}
img,video{display:block;max-width:100%;height:auto;margin:8px 0;image-rendering:pixelated;border-radius:6px;background:#05070c}
audio{display:inline-block;vertical-align:middle;margin:8px 8px 8px 0}
</style></head><body>${body}</body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
