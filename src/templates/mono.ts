import { frameGeometry, frameSvg } from './frames.js';
import { esc, fitFrame, round2, screenImage, type BoxSpec, type Template, type TemplateContext } from './shared.js';

/**
 * "mono" — split editorial layout: solid canvas, accent bar + left-aligned
 * headline/subtext on the left, device on the right. Best for pro/tooling apps
 * with SHORT punchy copy — the text column is deliberately narrow (0.38W).
 */
export const mono: Template = {
  id: 'mono',

  metrics(size) {
    const headline: BoxSpec = { sizePx: size.width * 0.048, boxWidthPx: size.width * 0.38, kind: 'bold' };
    const subtext: BoxSpec = { sizePx: size.width * 0.026, boxWidthPx: size.width * 0.38, kind: 'regular' };
    return { headline, subtext };
  },

  render(ctx: TemplateContext): string {
    const { device, size, orientation, caption, colors, shotPng, fontFamily } = ctx;
    const W = size.width;
    const H = size.height;
    const m = this.metrics(size);
    const textX = W * 0.08;
    const fr = fitFrame(device, orientation, W * 0.4, H * 0.6, W * 0.725, H * 0.24);
    const real = frameGeometry(device, fr.x, fr.y, fr.w, fr.h, orientation);
    const shot = screenImage(real, shotPng);
    const layers = frameSvg(device, real);
    const bg = colors.background[0] ?? '#111214';

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${shot.defs}
  </defs>
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="${round2(W * 0.055)}" y="${round2(H * 0.36)}" width="${round2(W * 0.012)}" height="${round2(H * 0.2)}" rx="${round2(W * 0.006)}" fill="${colors.accent}"/>
  <text x="${round2(textX)}" y="${round2(H * 0.42)}" font-family="${esc(fontFamily)}" font-weight="bold" font-size="${round2(m.headline.sizePx)}" fill="${colors.text}">${esc(caption.headline)}</text>
  ${caption.subtext ? `<text x="${round2(textX)}" y="${round2(H * 0.42 + m.headline.sizePx * 1.5)}" font-family="${esc(fontFamily)}" font-size="${round2(m.subtext.sizePx)}" fill="${colors.text}" opacity="0.78">${esc(caption.subtext)}</text>` : ''}
  <g>
    ${layers.below}
    ${shot.body}
    ${layers.above}
  </g>
</svg>`;
  },
};
