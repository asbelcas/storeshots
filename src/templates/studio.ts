import { frameGeometry, frameSvg } from './frames.js';
import { esc, fitFrame, round2, screenImage, type BoxSpec, type Template, type TemplateContext } from './shared.js';

/**
 * "studio" — light flat canvas, centered headline + subtext up top,
 * device centered with a soft floor shadow. Best for friendly/consumer apps.
 */
export const studio: Template = {
  id: 'studio',

  metrics(size) {
    const headline: BoxSpec = { sizePx: size.width * 0.05, boxWidthPx: size.width * 0.86, kind: 'bold' };
    const subtext: BoxSpec = { sizePx: size.width * 0.028, boxWidthPx: size.width * 0.86, kind: 'regular' };
    return { headline, subtext };
  },

  render(ctx: TemplateContext): string {
    const { device, size, orientation, caption, colors, shotPng, fontFamily } = ctx;
    const W = size.width;
    const H = size.height;
    const m = this.metrics(size);
    const fr = fitFrame(device, orientation, W * 0.7, H * 0.56, W / 2, H * 0.36);
    const real = frameGeometry(device, fr.x, fr.y, fr.w, fr.h, orientation);
    const shot = screenImage(real, shotPng);
    const layers = frameSvg(device, real);
    const bg = colors.background[0] ?? '#f5f7fa';
    const ink = colors.text;

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="floor" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${round2(W * 0.02)}"/></filter>
    ${shot.defs}
  </defs>
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <text x="${round2(W / 2)}" y="${round2(H * 0.13)}" text-anchor="middle" font-family="${esc(fontFamily)}" font-weight="bold" font-size="${round2(m.headline.sizePx)}" fill="${ink}">${esc(caption.headline)}</text>
  ${caption.subtext ? `<text x="${round2(W / 2)}" y="${round2(H * 0.13 + m.headline.sizePx * 1.5)}" text-anchor="middle" font-family="${esc(fontFamily)}" font-size="${round2(m.subtext.sizePx)}" fill="${ink}" opacity="0.75">${esc(caption.subtext)}</text>` : ''}
  <ellipse cx="${round2(W / 2)}" cy="${round2(real.y + real.h + H * 0.015)}" rx="${round2(real.w * 0.52)}" ry="${round2(H * 0.012)}" fill="#000000" opacity="0.18" filter="url(#floor)"/>
  <g>
    ${layers.below}
    ${shot.body}
    ${layers.above}
  </g>
</svg>`;
  },
};
