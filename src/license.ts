/**
 * License-key hook (v1).
 *
 * v1 ships WITHOUT enforcement by default: the CLI only checks a license when
 * `--license-key` is passed. Live providers are implemented (lemonsqueezy,
 * gumroad) but require the owner's seller account details (endpoint / product
 * id) — see the handoff list in README.md. v1.1 turns enforcement on by
 * default; the sales copy discloses this timeline.
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
  /** Required in live mode for lemonsqueezy, e.g. https://api.lemonsqueezy.com/v1/licenses */
  endpoint?: string;
  /** Live validation provider. lemonsqueezy = POST <endpoint>/validate {license_key}.
   *  gumroad = POST https://api.gumroad.com/v2/licenses/verify (endpoint override for tests). */
  provider?: 'lemonsqueezy' | 'gumroad';
  /** gumroad only: your product id or permalink (required in gumroad live mode). */
  productId?: string;
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

  // live mode
  const provider = opts.provider ?? 'lemonsqueezy';
  if (provider === 'gumroad') {
    if (!opts.productId) {
      throw new Error(
        'Gumroad live validation requires --license-product-id (your Gumroad product id or permalink). ' +
          'Keys are verified against api.gumroad.com/v2/licenses/verify.',
      );
    }
    const base = (opts.endpoint ?? 'https://api.gumroad.com').replace(/\/$/, '');
    const fetcher = opts.fetcher ?? (globalThis.fetch as unknown as LicenseOptions['fetcher']);
    if (!fetcher) throw new Error('No fetch implementation available for live license validation');
    const res = await fetcher(`${base}/v2/licenses/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ product_id: opts.productId, license_key: key }).toString(),
    });
    if (!res.ok) return { valid: false, detail: 'gumroad verify request failed (non-2xx)' };
    const data = (await res.json()) as {
      success?: boolean;
      message?: string;
      purchase?: { product_name?: string; email?: string; refunded?: boolean; disputed?: boolean };
    };
    const p = data.purchase;
    if (data.success === true && p && !p.refunded && !p.disputed) {
      return {
        valid: true,
        detail: `gumroad: valid purchase of "${p.product_name ?? 'product'}" (${p.email ?? 'buyer email hidden'})`,
      };
    }
    return { valid: false, detail: `gumroad: ${data.message ?? 'license invalid or purchase refunded/disputed'}` };
  }

  if (!opts.endpoint) {
    throw new Error(
      'Live license validation is not wired yet: no endpoint configured. ' +
        'The human owner must create the seller account, then set --license-endpoint ' +
        '(Lemon Squeezy) or --license-provider gumroad --license-product-id <id>.',
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
