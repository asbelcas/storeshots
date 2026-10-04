/**
 * License-key hook (v1).
 *
 * v1 ships WITHOUT any real network validation wired in: the CLI only checks a
 * license when `--license-key` is passed, and the default "live" mode throws a
 * clear "not wired yet" error. Wiring the real Lemon Squeezy (or Gumroad)
 * endpoint happens AFTER the human owner creates the seller account — see the
 * handoff list in README.md.
 *
 * The `fake` mode exists purely for tests and CI: a deterministic local
 * checksum format (SS1-XXXX-XXXX-XXXX) so the check can be exercised with
 * zero network access.
 */

export interface LicenseResult {
  valid: boolean;
  detail: string;
}

export interface LicenseOptions {
  mode: 'fake' | 'live';
  /** Required in live mode, e.g. https://api.lemonsqueezy.com/v1/licenses */
  endpoint?: string;
  /** Injectable transport (tests pass a stub; never hit the network). */
  fetcher?: (url: string, init?: Record<string, unknown>) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function checksum(body: string): string {
  let sum = 0;
  for (const ch of body) sum = (sum + ch.charCodeAt(0)) * 31;
  return String(sum % 10000).padStart(4, '0');
}

/** Deterministic fake-mode key for tests/demo: derive the check group from 12 body chars. */
export function makeFakeKey(body: string): string {
  const clean = body.toUpperCase().replace(/[^A-Z2-7]/g, '').padEnd(12, 'A').slice(0, 12);
  const g = [clean.slice(0, 4), clean.slice(4, 8), clean.slice(8, 12)];
  return `SS1-${g[0]}-${g[1]}-${g[2]}-${checksum(clean)}`;
}

export async function validateLicense(key: string, opts: LicenseOptions): Promise<LicenseResult> {
  if (opts.mode === 'fake') {
    const m = /^SS1-([A-Z2-7]{4})-([A-Z2-7]{4})-([A-Z2-7]{4})-(\d{4})$/.exec(key.trim().toUpperCase());
    if (!m) return { valid: false, detail: 'fake mode: key does not match SS1-XXXX-XXXX-XXXX-NNNN' };
    const body = m[1] + m[2] + m[3];
    const ok = checksum(body) === m[4];
    return ok
      ? { valid: true, detail: 'fake mode: checksum OK (local self-check only — not proof of purchase)' }
      : { valid: false, detail: 'fake mode: checksum mismatch (tampered or mistyped key)' };
  }

  // live mode — intentionally NOT functional in v1 until the owner account exists.
  if (!opts.endpoint) {
    throw new Error(
      'Live license validation is not wired yet: no endpoint configured. ' +
        'The human owner must create the Lemon Squeezy account, then set --license-endpoint ' +
        '(see README handoff list). No real validation happens in v1 builds.',
    );
  }
  const fetcher = opts.fetcher ?? (globalThis.fetch as unknown as LicenseOptions['fetcher']);
  if (!fetcher) throw new Error('No fetch implementation available for live license validation');
  const res = await fetcher(`${opts.endpoint.replace(/\/$/, '')}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ license_key: key }),
  });
  if (!res.ok) return { valid: false, detail: 'license endpoint request failed (non-2xx)' };
  const data = (await res.json()) as { valid?: boolean; error?: string };
  return { valid: data.valid === true, detail: data.valid === true ? 'license valid' : `license invalid: ${data.error ?? 'unknown'}` };
}
