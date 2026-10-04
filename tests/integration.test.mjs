import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';
import sharp from 'sharp';

const run = promisify(execFile);
const REPO = resolve(new URL('..', import.meta.url).pathname);
const CLI = join(REPO, 'dist/cli.js');
const CONFIG = join(REPO, 'examples/storeshots.config.yaml');

const EXPECTED_DIMS = {
  iphone69: [1320, 2868],
  'android-phone': [1080, 1920],
};
const SCREENS = ['home', 'settings', 'stats']; // sorted intersection, 01/02/03 prefixed
const LOCALES = ['de', 'en'];

async function buildInto(outDir) {
  return run(process.execPath, [CLI, 'build', '--config', CONFIG, '--out', outDir], {
    cwd: REPO,
  });
}

test('CLI build on synthetic inputs: exit 0, 12 PNGs, exact spec dims, 3 per locale', async () => {
  const out = mkdtempSync(join(tmpdir(), 'storeshots-e2e-'));
  const { stdout, stderr } = await buildInto(out);
  assert.match(stdout, /Built 12 screenshot/);
  assert.match(stderr, /overflow/, 'expected the deliberately long German settings headline to warn');
  assert.match(stderr, /de\/iphone69\/settings/);

  for (const [device, [w, h]] of Object.entries(EXPECTED_DIMS)) {
    for (const locale of LOCALES) {
      const dir = join(out, device, locale);
      assert.ok(existsSync(dir), `${dir} missing`);
      const files = readdirSync(dir).filter((f) => f.endsWith('.png'));
      assert.equal(files.length, SCREENS.length, `${device}/${locale} count`);
      for (let i = 0; i < SCREENS.length; i++) {
        const expectedName = `${String(i + 1).padStart(2, '0')}-${SCREENS[i]}.png`;
        assert.ok(files.includes(expectedName), `${device}/${locale}/${expectedName} missing (got ${files})`);
        const meta = await sharp(readFileSync(join(dir, expectedName))).metadata();
        assert.equal(meta.width, w, `${device} width`);
        assert.equal(meta.height, h, `${device} height`);
      }
    }
  }
});

test('builds are deterministic (identical bytes across runs)', async () => {
  const a = mkdtempSync(join(tmpdir(), 'storeshots-det-a-'));
  const b = mkdtempSync(join(tmpdir(), 'storeshots-det-b-'));
  await buildInto(a);
  await buildInto(b);
  const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
  for (const device of Object.keys(EXPECTED_DIMS)) {
    for (const locale of LOCALES) {
      for (const f of readdirSync(join(a, device, locale))) {
        assert.equal(hash(join(a, device, locale, f)), hash(join(b, device, locale, f)), `${device}/${locale}/${f} differs`);
      }
    }
  }
});

test('CLI fails cleanly on a bad config (exit 1, error on stderr)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'storeshots-bad-'));
  const cfg = join(dir, 'bad.yaml');
  mkdirSync(dir, { recursive: true });
  const { writeFileSync } = await import('node:fs');
  writeFileSync(cfg, 'template: [broken\n');
  await assert.rejects(
    () => run(process.execPath, [CLI, 'build', '--config', cfg]),
    (e) => {
      assert.equal(e.code, 1);
      assert.match(e.stderr, /not valid YAML/);
      return true;
    },
  );
});
