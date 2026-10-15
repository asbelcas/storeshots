/**
 * Store screenshot size specification, as of SPEC_VERSION.
 * Sources and verification status: see SPEC-SIZES.md.
 * All sizes are PORTRAIT (width x height). Landscape reverses them.
 */

export type Store = 'appstore' | 'googleplay';
export type Orientation = 'portrait' | 'landscape';

export interface DeviceSpec {
  /** Config-facing id */
  id: string;
  /** Human label */
  label: string;
  store: Store;
  /** Portrait width in px */
  width: number;
  /** Portrait height in px */
  height: number;
  /** false = optional in 2026 (covered by a larger class via store auto-scaling, or store has no hard requirement) */
  required: boolean;
  /** true = size is best-effort, re-verify against the store before shipping a real release */
  verify?: boolean;
  note?: string;
}

export const SPEC_VERSION = '2026-10-15';

export const DEVICES: DeviceSpec[] = [
  {
    id: 'iphone69',
    label: 'iPhone 6.9" (17 Pro Max / 16 Pro Max)',
    store: 'appstore',
    width: 1320,
    height: 2868,
    required: true,
    note: 'Canonical 6.9-inch set; App Store Connect scales it down to 6.7/6.5/6.3/6.1-inch listings.',
  },
  {
    id: 'iphone65',
    label: 'iPhone 6.5" (11 Pro Max / XS Max)',
    store: 'appstore',
    width: 1284,
    height: 2778,
    required: false,
    note: 'Optional in 2026: the 6.9-inch set auto-scales to this class.',
  },
  {
    id: 'iphone55',
    label: 'iPhone 5.5" (8 Plus, legacy)',
    store: 'appstore',
    width: 1242,
    height: 2208,
    required: false,
    note: 'Legacy class; only needed if you still support the 4.7-inch App Store listing.',
  },
  {
    id: 'ipad13',
    label: 'iPad 13" (M4/M5 Pro)',
    store: 'appstore',
    width: 2064,
    height: 2752,
    required: true,
    note: 'Canonical iPad set; scales to smaller iPads. Only needed if the app supports iPad.',
  },
  {
    id: 'android-phone',
    label: 'Android phone (recommended size)',
    store: 'googleplay',
    width: 1080,
    height: 1920,
    required: true,
    note: 'Google Play general rule (verified 2026-10-15): min side 320 px, max side 3840 px, max no more than 2x the min. 1080x1920 satisfies the 9:16-portrait recommendation (>=4 shots at >=1080px) for featuring eligibility.',
  },
  {
    id: 'android-tablet',
    label: 'Android tablet (large screens: tablet/Chromebook slot)',
    store: 'googleplay',
    width: 1080,
    height: 1920,
    required: false,
    note: 'Google Play large-screens spec (verified 2026-10-15): 9:16 portrait / 16:9 landscape, sides 1080-7680 px, minimum 4 screenshots for the tablet slot. Earlier 1200x1920 (5:8) canvas was off-spec and was corrected.',
  },
];

const byId = new Map(DEVICES.map((d) => [d.id, d]));

export function getDevice(id: string): DeviceSpec {
  const d = byId.get(id);
  if (!d) throw new Error(`Unknown device id "${id}". Known: ${DEVICES.map((x) => x.id).join(', ')}`);
  return d;
}

export function sizeFor(device: DeviceSpec, orientation: Orientation): { width: number; height: number } {
  return orientation === 'landscape'
    ? { width: device.height, height: device.width }
    : { width: device.width, height: device.height };
}

/**
 * Structural integrity check over the table itself. Returns a list of problems
 * (empty = table is internally consistent). Used by tests and `doctor`.
 */
export function validateSpecTable(): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const d of DEVICES) {
    if (seen.has(d.id)) problems.push(`duplicate device id: ${d.id}`);
    seen.add(d.id);
    if (!Number.isInteger(d.width) || !Number.isInteger(d.height) || d.width <= 0 || d.height <= 0)
      problems.push(`${d.id}: non-positive/non-integer size ${d.width}x${d.height}`);
    if (d.width >= d.height) problems.push(`${d.id}: table stores PORTRAIT sizes (width must be < height)`);
    if (d.store === 'googleplay') {
      for (const side of [d.width, d.height]) {
        if (side < 320 || side > 3840) problems.push(`${d.id}: Google Play side ${side} outside 320-3840`);
      }
    }
  }
  return problems;
}
