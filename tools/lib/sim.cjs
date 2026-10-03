// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 FireBall1725
// Loads the site's simulator (tools/vendor/pixelbar.js) in Node with a stub DOM, so previews use its real drawing code.
// sim(names) returns those top-level names from inside it.
const fs = require("fs"), path = require("path");
const V = path.join(__dirname, "..", "vendor");
let cache = null;
module.exports = names => {
  if (cache) return cache;
  let src = fs.readFileSync(path.join(V, "pixelbar.js"), "utf8");
  src = src.replace(/^import \{ makeEditor \}.*$/m, "const makeEditor=()=>({setValue(){},relint(){}});");
  const v2 = fs.readFileSync(path.join(V, "v2schema.js"), "utf8");
  src = src.replace(/^import \{ problem as v2problem.*$/m, v2.slice(v2.indexOf("export function route"), v2.indexOf("const NAME_RE")).replace("export ", "") + "const v2route=route,v2problem=()=>null;");
  src = src.replace(/\}\)\(\);\s*$/, "globalThis.__T={" + names.join(",") + "};})();");
  const mk = () => { const f = function () {}; return new Proxy(f, { get: (t, k) => k === Symbol.toPrimitive ? (() => 0) : k === Symbol.iterator ? function* () {} : k === "length" ? 0 : k === "then" ? undefined : (Object.prototype.hasOwnProperty.call(t, k) && k !== "prototype" ? t[k] : (t[k] = mk())), set: (t, k, v) => { t[k] = v; return true; }, apply: () => mk(), construct: () => mk() }); };
  const P = mk();
  for (const [k, v] of Object.entries({ window: P, document: P, location: { hash: "", search: "" }, localStorage: P, requestAnimationFrame: () => 0, matchMedia: P, devicePixelRatio: 1, innerWidth: 1400, innerHeight: 900, ResizeObserver: function () { return P; }, IntersectionObserver: function () { return P; }, getComputedStyle: P, navigator: P, performance: { now: () => 0 } }))
    Object.defineProperty(globalThis, k, { value: v, writable: true, configurable: true });
  (0, eval)(src);
  cache = globalThis.__T;
  return cache;
};
