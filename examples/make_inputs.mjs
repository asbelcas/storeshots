/**
 * Generates synthetic raw app screenshots into examples/input/ so the whole
 * pipeline is reproducible offline. No external assets: colored rects + text
 * drawn via SVG -> sharp. Deterministic (fixed palette, no RNG).
 *
 * Usage: node examples/make_inputs.mjs
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'input');
mkdirSync(outDir, { recursive: true });

const W = 1170;
const H = 2532;

const C = {
  bg: '#f6f8fb',
  ink: '#16233a',
  sub: '#5b6b82',
  card: '#ffffff',
  accent: '#2f6df6',
  accent2: '#20b389',
  line: '#e3e8f0',
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function statusBar() {
  return `
  <rect x="0" y="0" width="${W}" height="120" fill="${C.card}"/>
  <text x="60" y="78" font-family="DejaVu Sans" font-size="40" font-weight="bold" fill="${C.ink}">9:41</text>
  <rect x="980" y="52" width="34" height="34" rx="8" fill="${C.ink}"/>
  <rect x="1030" y="52" width="34" height="34" rx="8" fill="${C.ink}"/>
  <rect x="1080" y="52" width="46" height="34" rx="10" fill="none" stroke="${C.ink}" stroke-width="6"/>`;
}

function appBar(title) {
  return `
  <text x="60" y="205" font-family="DejaVu Sans" font-size="58" font-weight="bold" fill="${C.ink}">${esc(title)}</text>`;
}

function card(y, h) {
  return `<rect x="60" y="${y}" width="${W - 120}" height="${h}" rx="28" fill="${C.card}" stroke="${C.line}" stroke-width="2"/>`;
}

function row(y, label, value, color = C.accent) {
  return `
  ${card(y, 150)}
  <circle cx="140" cy="${y + 75}" r="34" fill="${color}" opacity="0.9"/>
  <text x="210" y="${y + 92}" font-family="DejaVu Sans" font-size="42" fill="${C.ink}">${esc(label)}</text>
  <text x="${W - 100}" y="${y + 92}" text-anchor="end" font-family="DejaVu Sans" font-size="42" font-weight="bold" fill="${C.sub}">${esc(value)}</text>`;
}

async function make(name, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${statusBar()}
  ${body}
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(join(outDir, `${name}.png`));
  console.log(`wrote input/${name}.png`);
}

// screen 1: home — list of habits
await make('home', `
  ${appBar('Today')}
  ${row(280, 'Morning run', 'done', C.accent2)}
  ${row(470, 'Read 20 pages', '12/20')}
  ${row(660, 'Ship v1.2', 'today')}
  ${row(850, 'Meditate', 'done', C.accent2)}
  ${row(1040, 'Water plants', '6:00 pm')}
  <rect x="60" y="1280" width="${W - 120}" height="170" rx="85" fill="${C.accent}"/>
  <text x="${W / 2}" y="1382" text-anchor="middle" font-family="DejaVu Sans" font-size="52" font-weight="bold" fill="#ffffff">+ Add new</text>
`);

// screen 2: stats — bar chart
await make('stats', `
  ${appBar('Progress')}
  ${card(280, 900)}
  ${[0.35, 0.55, 0.45, 0.75, 0.6, 0.9, 0.7]
    .map((v, i) => {
      const bw = 90;
      const gap = (W - 240 - bw * 7) / 6;
      const x = 120 + i * (bw + gap);
      const bh = v * 640;
      return `<rect x="${x}" y="${1090 - bh}" width="${bw}" height="${bh}" rx="20" fill="${i === 5 ? C.accent2 : C.accent}"/>`;
    })
    .join('\n  ')}
  <text x="90" y="1260" font-family="DejaVu Sans" font-size="38" fill="${C.sub}">Mon — Sun</text>
  ${row(1300, 'Current streak', '6 days', C.accent2)}
  ${row(1490, 'Completed', '142', C.accent2)}
`);

// screen 3: settings — toggles
await make('settings', `
  ${appBar('Settings')}
  ${row(280, 'Reminders', 'on', C.accent2)}
  ${row(470, 'Weekend mode', 'off')}
  ${row(660, 'Sync across devices', 'on', C.accent2)}
  ${row(850, 'Export data', '')}
  ${row(1040, 'Privacy policy', '')}
  <text x="60" y="1360" font-family="DejaVu Sans" font-size="36" fill="${C.sub}">Local-first. No account needed.</text>
`);

console.log('done');
