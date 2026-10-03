// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 FireBall1725
// The display's own message check (the site's v2schema.js, vendored), with the schemas read from tools/vendor.
import { readFileSync, readdirSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
const dir = new URL("../vendor/", import.meta.url);
const S = {};
for (const f of readdirSync(new URL("schema/v2/", dir))) S[f.replace(".schema.json", "")] = JSON.parse(readFileSync(new URL("schema/v2/" + f, dir), "utf8"));
const src = readFileSync(new URL("v2schema.js", dir), "utf8").replace(/^import .*$/gm, "").replace(/^export /gm, "");
export const { route, problem } = new Function("Ajv2020", "addFormats", ...Object.keys(S), src + "\nreturn { route, problem };")(Ajv2020, addFormats, ...Object.values(S));
