import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeFakeKey, validateLicense } from '../dist/license.js';

test('fake mode: a generated key validates', async () => {
  const key = makeFakeKey('TESTBODY1234');
  const res = await validateLicense(key, { mode: 'fake' });
  assert.equal(res.valid, true);
});

test('fake mode: tampered checksum is rejected', async () => {
  const key = makeFakeKey('TESTBODY1234');
  const tampered = key.slice(0, -4) + '0000';
  const res = await validateLicense(tampered, { mode: 'fake' });
  assert.equal(res.valid, false);
  assert.match(res.detail, /checksum mismatch/);
});

test('fake mode: malformed key is rejected', async () => {
  const res = await validateLicense('not-a-key', { mode: 'fake' });
  assert.equal(res.valid, false);
});

test('live mode without endpoint throws "not wired yet" (v1 default)', async () => {
  await assert.rejects(() => validateLicense('SS1-AAAA-BBBB-CCCC-1234', { mode: 'live' }), /not wired yet/);
});

test('live mode uses the injected transport with a Lemon-Squeezy-style shape (stub, no network)', async () => {
  const calls = [];
  const stub = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, json: async () => ({ valid: true }) };
  };
  const res = await validateLicense('KEY-123', {
    mode: 'live',
    endpoint: 'https://api.lemonsqueezy.test/v1/licenses/',
    fetcher: stub,
  });
  assert.equal(res.valid, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.lemonsqueezy.test/v1/licenses/validate');
  assert.equal(calls[0].init.method, 'POST');
  assert.match(calls[0].init.body, /KEY-123/);
});
