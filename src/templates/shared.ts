import type { Caption } from '../i18n.js';
import type { DeviceSpec, Orientation } from '../spec.js';

export interface CanvasSize {
  width: number;
  height: number;
}

export interface TemplateColors {
  background: string[];
  text: string;
  accent: string;
}

export interface TemplateContext {
  device: DeviceSpec;
  size: CanvasSize;
  orientation: Orientation;
  caption: Caption;
  colors: TemplateColors;
  /** Raw app screenshot PNG bytes */
  shotPng: Buffer;
  fontFamily: string;
}

export interface BoxSpec {
  sizePx: number;
  boxWidthPx: number;
  kind: 'regular' | 'bold';
}

export interface Template {
  id: string;
  /** Text metrics for overflow warnings, derived from the same fractions used in render(). */
  metrics(size: CanvasSize): { headline: BoxSpec; subtext: BoxSpec };
  /** Returns a complete SVG document at exactly size px. */
  render(ctx: TemplateContext): string;
}

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function gradientDef(id: string, stops: string[]): string {
  const safe = stops.filter((s) => /^#[0-9a-fA-F]{6}$/.test(s));
  const list = safe.length >= 2 ? safe : ['#0b1f3a', '#143d66'];
  const step = 100 / (list.length - 1);
  const stopEls = list.map((c, i) => `<stop offset="${round2(i * step)}%" stop-color="${c}"/>`).join('');
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">${stopEls}</linearGradient>`;
}

/**
 * Fit a device frame into a bounding box. The frame keeps the device's
 * PORTRAIT aspect; in landscape orientation the aspect is swapped.
 */
export function fitFrame(
  device: DeviceSpec,
  orientation: Orientation,
  boxW: number,
  boxH: number,
  centerX: number,
  topY: number,
): { x: number; y: number; w: number; h: number } {
  const aspect = orientation === 'landscape' ? device.height / device.width : device.width / device.height;
  let w = boxW;
  let h = w / aspect;
  if (h > boxH) {
    h = boxH;
    w = h * aspect;
  }
  return { x: round2(centerX - w / 2), y: round2(topY), w: round2(w), h: round2(h) };
}

let clipCounter = 0;

/** Screenshot image element clipped to the frame's screen area (slice = cover). */
export function screenImage(geo: { screen: { x: number; y: number; w: number; h: number; r: number } }, shotPng: Buffer): { defs: string; body: string } {
  const id = `scr${++clipCounter}`;
  const s = geo.screen;
  const b64 = shotPng.toString('base64');
  return {
    defs: `<clipPath id="${id}"><rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.r}"/></clipPath>`,
    body: `<image x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})" href="data:image/png;base64,${b64}" xlink:href="data:image/png;base64,${b64}"/>`,
  };
}
