import { frameGeometry, frameSvg } from './frames.js';
import { esc, fitFrame, gradientDef, round2, screenImage, type BoxSpec, type Template, type TemplateContext } from './shared.js';

/**
 * "aurora" — dark diagonal gradient canvas, bold headline top-left,
 * device floating center-bottom, soft accent glow. Best for dark apps.
 */
export const aurora: Template = {
  id: 'aurora',

  metrics(size) {
    const headline: BoxSpec = { sizePx: size.width * 0.05, boxWidthPx: size.width * 0.84, kind: 'bold' };
    const subtext: BoxSpec = { sizePx: size.width * 0.03, boxWidthPx: size.width * 0.84, kind: 'regular' };
    return { headline, subtext };
  },

  render(ctx: TemplateContext): string {
    const { device, size, orientation, caption, colors, shotPng, fontFamily } = ctx;
    const W = size.width;
    const H = size.height;
    const m = this.metrics(size);
    const fr = fitFrame(device, orientation, W * 0.74, H * 0.58, W / 2, H * 0.34);
    const real = frameGeometry(device, fr.x, fr.y, fr.w, fr.h, orientation);
    const shot = screenImage(real, shotPng);
    const glowR = W * 0.55;

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${gradientDef('bg', colors.background)}
    ${shot.defs}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${round2(W * 0.9)}" cy="${round2(H * 0.06)}" r="${round2(glowR)}" fill="${colors.accent}" opacity="0.10"/>
  <text x="${round2(W * 0.09)}" y="${round2(H * 0.155)}" font-family="${esc(fontFamily)}" font-weight="bold" font-size="${round2(m.headline.sizePx)}" fill="${colors.text}">${esc(caption.headline)}</text>
  ${caption.subtext ? `<text x="${round2(W * 0.09)}" y="${round2(H * 0.155 + m.headline.sizePx * 1.55)}" font-family="${esc(fontFamily)}" font-size="${round2(m.subtext.sizePx)}" fill="${colors.text}" opacity="0.82">${esc(caption.subtext)}</text>` : ''}
  <g>
    ${frameSvg(device, real)}
    ${shot.body}
  </g>
</svg>`;
  },
};
