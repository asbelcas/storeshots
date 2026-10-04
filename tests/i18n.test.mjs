import assert from 'node:assert/strict';
import { test } from 'node:test';
import { overflows, loadLocale, resolveScreens } from '../dist/i18n.js';
import { measureText } from '../dist/fonts.js';

const LOCALES = new URL('../locales/', import.meta.url).pathname;

test('en, de, es locale files parse and share the same screen keys', () => {
  const en = loadLocale(LOCALES, 'en');
  const de = loadLocale(LOCALES, 'de');
  const es = loadLocale(LOCALES, 'es');
  for (const m of [de, es]) assert.deepEqual(Object.keys(m).sort(), Object.keys(en).sort());
  assert.ok(en.home.headline.length > 0);
});

test('missing locale file throws a clear error', () => {
  assert.throws(() => loadLocale(LOCALES, 'fr'), /Locale file not found/);
});

test('locale file without a screens object throws', async () => {
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'storeshots-loc-'));
  writeFileSync(join(dir, 'en.json'), JSON.stringify({ hello: 'world' }));
  assert.throws(() => loadLocale(dir, 'en'), /must contain a "screens" object/);
});

test('resolveScreens intersects keys across locales', () => {
  const a = new Map([
    ['en', { x: { headline: 'a' }, y: { headline: 'b' }, z: { headline: 'c' } }],
    ['de', { y: { headline: 'b' }, x: { headline: 'a' } }],
  ]);
  assert.deepEqual(resolveScreens(a), ['x', 'y']);
});

test('resolveScreens honors requested order and rejects unknown screens', () => {
  const a = new Map([
    ['en', { x: { headline: 'a' }, y: { headline: 'b' } }],
    ['de', { x: { headline: 'a' }, y: { headline: 'b' } }],
  ]);
  assert.deepEqual(resolveScreens(a, ['y', 'x']), ['y', 'x']);
  assert.throws(() => resolveScreens(a, ['nope']), /not present in all locales/);
});

test('overflow detection: long text warns, short text does not', () => {
  const box = 500;
  const size = 40;
  assert.equal(overflows('short', size, box), false);
  assert.equal(overflows('Dies ist eine ausgesprochen lange und unhandliche Überschrift für eine kleine Box', size, box), true);
});

test('measureText is deterministic and scales linearly', () => {
  const a = measureText('Hello', 100, 'bold');
  const b = measureText('Hello', 100, 'bold');
  const c = measureText('Hello', 200, 'bold');
  assert.equal(a, b);
  assert.ok(Math.abs(c / a - 2) < 0.001, 'width should double when size doubles');
  assert.ok(a > 0);
});

test('demo copy: only the deliberately long German settings headline overflows aurora', () => {
  const size = { width: 1320, height: 2868 };
  const box = 1320 * 0.84;
  const headlineSize = 1320 * 0.05;
  const de = loadLocale(LOCALES, 'de');
  const en = loadLocale(LOCALES, 'en');
  assert.equal(overflows(en.home.headline, headlineSize, box), false);
  assert.equal(overflows(de.home.headline, headlineSize, box), false);
  assert.equal(overflows(de.settings.headline, headlineSize, box), true);
  void size;
});
