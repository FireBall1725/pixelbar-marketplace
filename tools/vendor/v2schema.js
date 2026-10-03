// Protocol v2: which schema a topic uses, and a check that turns schema errors into one readable line.
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import common from '../../public/schema/v2/common.schema.json';
import card from '../../public/schema/v2/card.schema.json';
import data from '../../public/schema/v2/data.schema.json';
import box from '../../public/schema/v2/box.schema.json';
import layout from '../../public/schema/v2/layout.schema.json';
import notify from '../../public/schema/v2/notify.schema.json';
import weather from '../../public/schema/v2/weather.schema.json';
import theme from '../../public/schema/v2/theme.schema.json';
import state from '../../public/schema/v2/state.schema.json';
import settings from '../../public/schema/v2/settings.schema.json';
import image from '../../public/schema/v2/image.schema.json';
import sound from '../../public/schema/v2/sound.schema.json';
import info from '../../public/schema/v2/info.schema.json';
import event from '../../public/schema/v2/event.schema.json';
import firmware from '../../public/schema/v2/firmware.schema.json';
import update from '../../public/schema/v2/update.schema.json';
import telemetry from '../../public/schema/v2/telemetry.schema.json';

export const SCHEMAS = { common, card, data, box, layout, notify, weather, theme, state, settings, image, sound, info, event, firmware, update, telemetry };
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
addFormats(ajv);
for (const s of Object.values(SCHEMAS)) ajv.addSchema(s);
const check = name => ajv.getSchema(`https://pixelbar.fireball1725.ca/schema/v2/${name}.schema.json`);

/* The topic decides the schema. "target" is all or a display name; "name" is the key, box name or asset id. */
export function route(topic) {
  let m = /^pixelbar\/([a-z0-9_-]+)\/(data|box|notify)\/([^/]+)$/.exec(topic);
  if (m) return { target: m[1], kind: m[2], name: m[3] };
  m = /^pixelbar\/all\/asset\/(image|sound)\/([^/]+)$/.exec(topic);
  if (m) return { target: 'all', kind: m[1], name: m[2] };
  m = /^pixelbar\/([a-z0-9_-]+)\/(layout|weather|theme|state|settings|info|event|status|update|telemetry)$/.exec(topic);
  if (m) return { target: m[1], kind: m[2], name: '' };
  m = /^pixelbar\/all\/(firmware)$/.exec(topic);
  if (m) return { target: m[1], kind: m[2], name: '' };
  return null;
}

const NAME_RE = { data: /^[a-z0-9_][a-z0-9_.-]{0,63}$/, box: /^[a-z0-9_-]{1,32}$/, notify: /^[A-Za-z0-9_-]{1,48}$/, image: /^[a-z0-9_-]{1,32}$/, sound: /^[a-z0-9_-]{1,32}$/ };
const FROM_DISPLAY = ['info', 'event', 'status', 'telemetry'];

/* Returns null when the message is fine, or the first problem as a sentence that names the field. */
export function problem(topic, payload) {
  const r = route(topic);
  if (!r) return 'The topic should look like pixelbar/all/notify/<key>, pixelbar/all/data/<key>, pixelbar/all/box/<name> or pixelbar/<display>/layout.';
  if (FROM_DISPLAY.includes(r.kind)) return `The display publishes ${r.kind} itself; nothing sends it.`;
  if (r.kind === 'layout' && r.target === 'all') return 'A layout is per display: pixelbar/<display>/layout, because widths depend on the size.';
  if (NAME_RE[r.kind] && !NAME_RE[r.kind].test(r.name)) return `"${r.name}" can't be a ${r.kind === 'data' ? 'data key' : r.kind + ' name'}: use lowercase letters, digits, _ and -${r.kind === 'data' ? ' and dots' : ''}.`;
  if (payload === null) return null;
  const v = check(r.kind);
  if (v(payload)) return null;
  return describe(v.errors);
}

/* Ajv reports every branch it tried; keep the most specific error and say it plainly. */
function describe(errors) {
  const real = errors.filter(e => e.keyword !== 'if' && !(e.keyword === 'oneOf' && errors.some(o => o.instancePath.startsWith(e.instancePath) && o !== e)));
  const e = real.sort((a, b) => b.instancePath.length - a.instancePath.length)[0] || errors[0];
  const at = e.instancePath ? e.instancePath.slice(1).replace(/\/(\d+)(?=\/|$)/g, '[$1]').replace(/\//g, '.') : '';
  const field = n => (at ? at + '.' : '') + n;
  switch (e.keyword) {
    case 'required': return `"${field(e.params.missingProperty)}" is required.`;
    case 'additionalProperties': return `"${field(e.params.additionalProperty)}" isn't a field here.`;
    case 'unevaluatedProperties': return `"${field(e.params.unevaluatedProperty)}" isn't a field ${at ? 'here' : 'on this message'}.`;
    case 'enum': return `"${at}" must be one of: ${e.params.allowedValues.join(', ')}.`;
    case 'const': return `"${at}" must be ${JSON.stringify(e.params.allowedValue)}.`;
    case 'pattern': return at.endsWith('color') || /colors\[\d+\]$/.test(at) ? `"${at}" must be a colour as #RRGGBB.` : `"${at}" isn't in the right form.`;
    case 'format': return `"${at}" must be a time like 2026-10-01T07:05:00-04:00.`;
    case 'type': return `"${at}" must be ${e.params.type === 'integer' ? 'a whole number' : 'a ' + e.params.type}.`;
    case 'not': return at ? `"${at}" isn't allowed here.` : 'A card takes data or entity, not both.';
    default: return `${at ? '"' + at + '" ' : ''}${e.message}.`;
  }
}
