import fs from 'node:fs';
import path from 'node:path';
import { measureText } from './fonts.js';

export interface Caption {
  headline: string;
  subtext?: string;
}

export type LocaleCaptions = Record<string, Caption>;

/** Load locales/<code>.json into { screenKey: caption } */
export function loadLocale(localesDir: string, code: string): LocaleCaptions {
  const p = path.join(localesDir, `${code}.json`);
  if (!fs.existsSync(p)) throw new Error(`Locale file not found: ${p}`);
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    throw new Error(`Locale file ${p} is not valid JSON: ${(e as Error).message}`);
  }
  const screens = (raw as Record<string, unknown>)?.screens;
  if (typeof screens !== 'object' || screens === null)
    throw new Error(`Locale file ${p} must contain a "screens" object`);
  const out: LocaleCaptions = {};
  for (const [key, val] of Object.entries(screens as Record<string, unknown>)) {
    const v = val as Record<string, unknown>;
    if (typeof v?.headline !== 'string' || v.headline.length === 0)
      throw new Error(`Locale ${p}: screen "${key}" needs a non-empty string "headline"`);
    out[key] = { headline: v.headline, subtext: typeof v.subtext === 'string' ? v.subtext : undefined };
  }
  return out;
}

/**
 * Screens to render = keys present in EVERY requested locale (intersection),
 * so each locale yields a complete, uploadable set. Deterministic: sorted.
 */
export function resolveScreens(perLocale: Map<string, LocaleCaptions>, requestedOrder?: string[]): string[] {
  const codes = [...perLocale.keys()];
  if (codes.length === 0) return [];
  const [first, ...rest] = codes;
  let common = Object.keys(perLocale.get(first)!);
  for (const c of rest) {
    const keys = new Set(Object.keys(perLocale.get(c)!));
    common = common.filter((k) => keys.has(k));
  }
  if (requestedOrder) {
    const missing = requestedOrder.filter((s) => !common.includes(s));
    if (missing.length > 0)
      throw new Error(`screens not present in all locales: ${missing.join(', ')}`);
    return requestedOrder;
  }
  return common.sort();
}

/** True if `text` at `sizePx` exceeds `boxWidthPx` (measured with real font metrics). */
export function overflows(text: string, sizePx: number, boxWidthPx: number, kind: 'regular' | 'bold' = 'bold'): boolean {
  return measureText(text, sizePx, kind) > boxWidthPx;
}
