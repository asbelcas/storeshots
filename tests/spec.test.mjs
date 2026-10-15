import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEVICES, getDevice, sizeFor, validateSpecTable } from '../dist/spec.js';

const EXPECTED = {
  iphone69: [1320, 2868],
  iphone65: [1284, 2778],
  iphone55: [1242, 2208],
  ipad13: [2064, 2752],
  'android-phone': [1080, 1920],
  'android-tablet': [1080, 1920],
};

test('spec table is internally consistent', () => {
  assert.deepEqual(validateSpecTable(), []);
});

test('spec table matches the verified 2026 sizes (see SPEC-SIZES.md)', () => {
  for (const d of DEVICES) {
    assert.ok(EXPECTED[d.id], `unexpected device in table: ${d.id}`);
    assert.equal(d.width, EXPECTED[d.id][0], `${d.id} width`);
    assert.equal(d.height, EXPECTED[d.id][1], `${d.id} height`);
  }
  assert.equal(DEVICES.length, Object.keys(EXPECTED).length, 'device count drifted');
});

test('landscape reverses dimensions for every device', () => {
  for (const d of DEVICES) {
    const s = sizeFor(d, 'landscape');
    assert.equal(s.width, d.height, `${d.id} landscape width`);
    assert.equal(s.height, d.width, `${d.id} landscape height`);
  }
});

test('portrait sizeFor returns table values', () => {
  for (const d of DEVICES) {
    const s = sizeFor(d, 'portrait');
    assert.equal(s.width, d.width);
    assert.equal(s.height, d.height);
  }
});

test('google play devices respect the 320-3840 side bounds', () => {
  for (const d of DEVICES.filter((x) => x.store === 'googleplay')) {
    for (const side of [d.width, d.height]) {
      assert.ok(side >= 320 && side <= 3840, `${d.id} side ${side} out of bounds`);
    }
  }
});

test('device ids are unique and getDevice throws on unknown', () => {
  const ids = DEVICES.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.throws(() => getDevice('nokia-3310'), /Unknown device id/);
});

test('android-tablet was re-verified against Play large-screens spec 2026-10-15', () => {
  const t = getDevice('android-tablet');
  assert.equal(t.verify, undefined);
  assert.equal(t.width, 1080);
  assert.equal(t.height, 1920);
  assert.equal(getDevice('iphone69').verify, undefined);
});
