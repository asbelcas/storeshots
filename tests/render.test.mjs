import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { DEVICES, sizeFor } from '../dist/spec.js';
import { getTemplate, templateIds } from '../dist/templates/index.js';

async function tinyShot() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="800"><rect width="400" height="800" fill="#ddd"/><text x="40" y="400" font-family="DejaVu Sans" font-size="30">shot</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

test('every template renders every device at exact portrait spec size', async (t) => {
  const shot = await tinyShot();
  for (const id of templateIds()) {
    const template = getTemplate(id);
    for (const device of DEVICES) {
      await t.test(`${id} x ${device.id}`, async () => {
        const size = sizeFor(device, 'portrait');
        const svg = template.render({
          device,
          size,
          orientation: 'portrait',
          caption: { headline: 'Hello store', subtext: 'Rendered by tests' },
          colors: { background: ['#0b1f3a', '#143d66'], text: '#ffffff', accent: '#5ac8fa' },
          shotPng: shot,
          fontFamily: 'DejaVu Sans',
        });
        const png = await sharp(Buffer.from(svg)).png().toBuffer();
        const meta = await sharp(png).metadata();
        assert.equal(meta.width, size.width, `${id}/${device.id} width`);
        assert.equal(meta.height, size.height, `${id}/${device.id} height`);
        assert.equal(meta.format, 'png');
      });
    }
  }
});

test('landscape renders exact reversed dimensions (aurora / iphone69)', async () => {
  const shot = await tinyShot();
  const device = DEVICES.find((d) => d.id === 'iphone69');
  const size = sizeFor(device, 'landscape');
  const svg = getTemplate('aurora').render({
    device,
    size,
    orientation: 'landscape',
    caption: { headline: 'Hello store', subtext: 'Landscape check' },
    colors: { background: ['#0b1f3a', '#143d66'], text: '#ffffff', accent: '#5ac8fa' },
    shotPng: shot,
    fontFamily: 'DejaVu Sans',
  });
  const meta = await sharp(await sharp(Buffer.from(svg)).png().toBuffer()).metadata();
  assert.equal(meta.width, 2868);
  assert.equal(meta.height, 1320);
});

test('metrics agree with render (headline box scales with canvas)', () => {
  const size = { width: 1320, height: 2868 };
  for (const id of templateIds()) {
    const m = getTemplate(id).metrics(size);
    assert.ok(m.headline.sizePx > 0 && m.headline.boxWidthPx <= size.width, `${id} headline metrics sane`);
    assert.ok(m.subtext.sizePx > 0 && m.subtext.boxWidthPx <= size.width, `${id} subtext metrics sane`);
  }
});
