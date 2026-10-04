import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const opentype: any = require('opentype.js');

type FontKind = 'regular' | 'bold';

const CANDIDATES: Record<FontKind, string[]> = {
  regular: [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  ],
  bold: [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  ],
};

const cache = new Map<FontKind, any | null>();
let familyName: string | null = null;

function loadFont(kind: FontKind): any | null {
  if (cache.has(kind)) return cache.get(kind) ?? null;
  let font: any | null = null;
  for (const p of CANDIDATES[kind]) {
    if (fs.existsSync(p)) {
      try {
        font = opentype.loadSync(p);
        if (familyName === null) familyName = font.getEnglishName('fontFamily') ?? 'DejaVu Sans';
        break;
      } catch {
        font = null;
      }
    }
  }
  cache.set(kind, font);
  return font;
}

/**
 * Font family name to reference in generated SVG. Falls back to a generic
 * sans-serif stack when no measurable font file is installed (rendering then
 * relies on the OS fontconfig fallback; measurement falls back to a heuristic).
 */
export function svgFontFamily(override?: string): string {
  if (override) return override;
  loadFont('regular');
  return familyName ?? 'sans-serif';
}

/**
 * Advance-width of `text` at `sizePx`, using the real font metrics when a
 * measurable TTF is installed (DejaVu Sans on this box), else a conservative
 * sans heuristic (~0.62 em/char). Deterministic and offline.
 */
export function measureText(text: string, sizePx: number, kind: FontKind = 'regular'): number {
  const font = loadFont(kind);
  if (!font) return sizePx * 0.62 * [...text].length;
  let adv = 0;
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    adv += glyph.advanceWidth ?? font.unitsPerEm;
  }
  return (adv * sizePx) / font.unitsPerEm;
}
