import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { loadConfig } from '../dist/config.js';

const REPO = resolve(new URL('..', import.meta.url).pathname);

function tmpConfig(yamlText) {
  const dir = mkdtempSync(join(tmpdir(), 'storeshots-cfg-'));
  const p = join(dir, 'config.yaml');
  writeFileSync(p, yamlText);
  return p;
}

const VALID = `
template: aurora
devices: [iphone69, android-phone]
locales: [en, de]
input: ./in
out: ./out
colors:
  background: ["#0b1f3a", "#143d66"]
  text: "#ffffff"
  accent: "#5ac8fa"
`;

test('example config loads and resolves paths relative to its own directory', () => {
  const c = loadConfig(join(REPO, 'examples/storeshots.config.yaml'));
  assert.equal(c.template, 'aurora');
  assert.deepEqual(c.devices, ['iphone69', 'android-phone']);
  assert.deepEqual(c.locales, ['en', 'de']);
  assert.equal(c.input, join(REPO, 'examples/input'));
  assert.equal(c.out, join(REPO, 'examples/output'));
  assert.equal(c.localesDir, join(REPO, 'locales'));
  assert.equal(c.orientation, 'portrait');
});

test('valid minimal config parses with defaults', () => {
  const c = loadConfig(tmpConfig(VALID));
  assert.equal(c.orientation, 'portrait');
  assert.equal(c.text, '#ffffff');
});

test('missing config file throws', () => {
  assert.throws(() => loadConfig('/nonexistent/storeshots.yaml'), /Config file not found/);
});

test('invalid YAML throws', () => {
  const p = tmpConfig('template: [unclosed');
  assert.throws(() => loadConfig(p), /not valid YAML/);
});

test('unknown template throws', () => {
  const p = tmpConfig(VALID.replace('template: aurora', 'template: hologram'));
  assert.throws(() => loadConfig(p), /template must be one of/);
});

test('unknown device throws with known-id list', () => {
  const p = tmpConfig(VALID.replace('[iphone69, android-phone]', '[iphoneXX]'));
  assert.throws(() => loadConfig(p), /Unknown device id "iphoneXX"/);
});

test('empty devices list throws', () => {
  const p = tmpConfig(VALID.replace('[iphone69, android-phone]', '[]'));
  assert.throws(() => loadConfig(p), /devices must be a non-empty list/);
});

test('bad orientation throws', () => {
  const p = tmpConfig(`${VALID}\norientation: diagonal\n`);
  assert.throws(() => loadConfig(p), /orientation must be/);
});

test('empty locales list throws', () => {
  const p = tmpConfig(VALID.replace('locales: [en, de]', 'locales: []'));
  assert.throws(() => loadConfig(p), /locales must be a non-empty list/);
});

test('bad hex color throws', () => {
  const p = tmpConfig(VALID.replace('#0b1f3a', 'darkblue'));
  assert.throws(() => loadConfig(p), /not #RRGGBB/);
});

test('missing out throws', () => {
  const p = tmpConfig(VALID.replace('out: ./out\n', ''));
  assert.throws(() => loadConfig(p), /out must be a path string/);
});
