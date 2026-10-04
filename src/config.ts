import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { DEVICES, getDevice, type Orientation } from './spec.js';

export const TEMPLATE_IDS = ['aurora', 'studio', 'mono'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export interface BuildConfig {
  template: TemplateId;
  devices: string[];
  orientation: Orientation;
  locales: string[];
  /** Directory containing raw PNG screenshots (stem = screen key) */
  input: string;
  /** Output directory */
  out: string;
  /** Gradient stops (2+) or single flat color for the background */
  background: string[];
  text: string;
  accent: string;
  /** Optional explicit subset/order of screens; default = intersection across locale files */
  screens?: string[];
  /** Optional font-family override for SVG text */
  fontFamily?: string;
  /** Directory holding locales/<code>.json; default = <config dir>/../locales relative to config file */
  localesDir: string;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function fail(msg: string): never {
  throw new Error(`Invalid config: ${msg}`);
}

function isStr(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

export function parseConfig(raw: unknown, configDir: string): BuildConfig {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) fail('top level must be a YAML mapping');
  const o = raw as Record<string, unknown>;

  const template = o.template;
  if (!isStr(template) || !(TEMPLATE_IDS as readonly string[]).includes(template))
    fail(`template must be one of: ${TEMPLATE_IDS.join(', ')} (got ${JSON.stringify(template)})`);

  const devices = o.devices;
  if (!Array.isArray(devices) || devices.length === 0) fail('devices must be a non-empty list');
  for (const d of devices) {
    if (!isStr(d)) fail(`devices entries must be strings (got ${JSON.stringify(d)})`);
    getDevice(d); // throws on unknown id
  }

  const orientation = o.orientation ?? 'portrait';
  if (orientation !== 'portrait' && orientation !== 'landscape')
    fail(`orientation must be "portrait" or "landscape" (got ${JSON.stringify(o.orientation)})`);

  const locales = o.locales;
  if (!Array.isArray(locales) || locales.length === 0) fail('locales must be a non-empty list');
  for (const l of locales) if (!isStr(l)) fail(`locales entries must be strings (got ${JSON.stringify(l)})`);

  const input = o.input;
  if (!isStr(input)) fail('input must be a path string');
  const out = o.out;
  if (!isStr(out)) fail('out must be a path string');

  const colors = (o.colors ?? {}) as Record<string, unknown>;
  const background = colors.background;
  if (!Array.isArray(background) || background.length === 0 || !background.every(isStr))
    fail('colors.background must be a non-empty list of hex colors');
  for (const c of background) if (!HEX_RE.test(c)) fail(`colors.background entry "${c}" is not #RRGGBB`);
  const text = isStr(colors.text) ? colors.text : '#ffffff';
  const accent = isStr(colors.accent) ? colors.accent : '#5ac8fa';
  if (!HEX_RE.test(text)) fail(`colors.text "${text}" is not #RRGGBB`);
  if (!HEX_RE.test(accent)) fail(`colors.accent "${accent}" is not #RRGGBB`);

  let screens: string[] | undefined;
  if (o.screens !== undefined) {
    if (!Array.isArray(o.screens) || o.screens.length === 0 || !o.screens.every(isStr))
      fail('screens, if given, must be a non-empty list of strings');
    screens = o.screens as string[];
  }

  let fontFamily: string | undefined;
  if (o.fontFamily !== undefined) {
    if (!isStr(o.fontFamily)) fail('fontFamily must be a string');
    fontFamily = o.fontFamily;
  }

  const localesDir = isStr(o.localesDir) ? o.localesDir : path.join(configDir, '..', 'locales');

  return {
    template: template as TemplateId,
    devices: devices as string[],
    orientation,
    locales: locales as string[],
    input: path.resolve(configDir, input),
    out: path.resolve(configDir, out),
    background: background as string[],
    text,
    accent,
    screens,
    fontFamily,
    localesDir: path.resolve(configDir, localesDir),
  };
}

export function loadConfig(configPath: string): BuildConfig {
  const abs = path.resolve(configPath);
  if (!fs.existsSync(abs)) throw new Error(`Config file not found: ${abs}`);
  let rawText: string;
  try {
    rawText = fs.readFileSync(abs, 'utf8');
  } catch (e) {
    throw new Error(`Could not read config ${abs}: ${(e as Error).message}`);
  }
  let raw: unknown;
  try {
    raw = YAML.parse(rawText);
  } catch (e) {
    throw new Error(`Config is not valid YAML: ${(e as Error).message}`);
  }
  return parseConfig(raw, path.dirname(abs));
}

export function knownDeviceIds(): string[] {
  return DEVICES.map((d) => d.id);
}
