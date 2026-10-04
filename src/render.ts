import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { BuildConfig } from './config.js';
import { svgFontFamily } from './fonts.js';
import { loadLocale, overflows, resolveScreens, type Caption, type LocaleCaptions } from './i18n.js';
import { getDevice, sizeFor } from './spec.js';
import { getTemplate } from './templates/index.js';

export interface BuildResult {
  written: string[];
  warnings: string[];
  total: number;
  out: string;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * Render every device x locale x screen combination.
 * Guarantees: output PNGs are byte-verified against the spec table dimensions
 * (a mismatch throws). Text overflow never fails the build — it warns.
 */
export async function build(config: BuildConfig): Promise<BuildResult> {
  const template = getTemplate(config.template);

  if (!fs.existsSync(config.input) || !fs.statSync(config.input).isDirectory())
    throw new Error(`Input directory not found: ${config.input}`);

  const perLocale = new Map<string, LocaleCaptions>();
  for (const code of config.locales) perLocale.set(code, loadLocale(config.localesDir, code));
  const screens = resolveScreens(perLocale, config.screens);
  if (screens.length === 0)
    throw new Error('No screens to render: no screen keys are shared by every requested locale');

  // Load raw screenshots once
  const shots = new Map<string, Buffer>();
  for (const key of screens) {
    const p = path.join(config.input, `${key}.png`);
    if (!fs.existsSync(p))
      throw new Error(`Missing input screenshot for screen "${key}": expected ${p}`);
    shots.set(key, fs.readFileSync(p));
  }

  const fontFamily = svgFontFamily(config.fontFamily);
  const warnings: string[] = [];
  const written: string[] = [];

  for (const deviceId of config.devices) {
    const device = getDevice(deviceId);
    const size = sizeFor(device, config.orientation);
    const textMetrics = template.metrics(size);

    for (const locale of config.locales) {
      const captions = perLocale.get(locale)!;
      for (let i = 0; i < screens.length; i++) {
        const key = screens[i];
        const caption: Caption = captions[key];
        if (!caption) throw new Error(`Locale ${locale} has no caption for screen "${key}"`);

        // overflow warnings (warn, never crash)
        if (overflows(caption.headline, textMetrics.headline.sizePx, textMetrics.headline.boxWidthPx, textMetrics.headline.kind))
          warnings.push(`${locale}/${deviceId}/${key}: headline likely overflows the "${template.id}" text box (${Math.round(textMetrics.headline.boxWidthPx)}px) — shorten or it may clip`);
        if (caption.subtext && overflows(caption.subtext, textMetrics.subtext.sizePx, textMetrics.subtext.boxWidthPx, textMetrics.subtext.kind))
          warnings.push(`${locale}/${deviceId}/${key}: subtext likely overflows the "${template.id}" text box (${Math.round(textMetrics.subtext.boxWidthPx)}px)`);

        const svg = template.render({
          device,
          size,
          orientation: config.orientation,
          caption,
          colors: { background: config.background, text: config.text, accent: config.accent },
          shotPng: shots.get(key)!,
          fontFamily,
        });

        const png = await sharp(Buffer.from(svg), { density: 72 }).png().toBuffer();

        // hard guarantee: exact spec dimensions
        const meta = await sharp(png).metadata();
        if (meta.width !== size.width || meta.height !== size.height)
          throw new Error(`Render violated spec: ${deviceId} emitted ${meta.width}x${meta.height}, expected ${size.width}x${size.height}`);

        const rel = path.join(deviceId, locale, `${pad2(i + 1)}-${key}.png`);
        const outPath = path.join(config.out, rel);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, png);
        written.push(rel);
      }
    }
  }

  return { written, warnings, total: written.length, out: config.out };
}
