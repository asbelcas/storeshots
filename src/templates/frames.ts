import type { DeviceSpec, Orientation } from '../spec.js';

/**
 * Original, programmatically drawn device frames (no third-party assets).
 * A frame is an outer rounded-rect bezel; the screen area insets by the bezel.
 * Ornamentation (dynamic island, home button, punch hole) is per device class
 * and moves to the correct edges in portrait vs landscape.
 */

export interface FrameGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
  screen: { x: number; y: number; w: number; h: number; r: number };
  radius: number;
  bezel: number;
  orientation: Orientation;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function frameGeometry(
  device: DeviceSpec,
  x: number,
  y: number,
  w: number,
  h: number,
  orientation: Orientation,
): FrameGeometry {
  const m = Math.min(w, h);
  let bezel: number;
  let radius: number;
  switch (device.id) {
    case 'iphone55':
      bezel = m * 0.075;
      radius = m * 0.16;
      break;
    case 'ipad13':
      bezel = m * 0.06;
      radius = m * 0.09;
      break;
    case 'android-phone':
    case 'android-tablet':
      bezel = m * 0.032;
      radius = m * 0.055;
      break;
    default: // iphone69 / iphone65
      bezel = m * 0.04;
      radius = m * 0.13;
  }
  const screenR = Math.max(radius - bezel * 0.9, m * 0.01);
  return {
    x: round2(x),
    y: round2(y),
    w: round2(w),
    h: round2(h),
    radius: round2(radius),
    bezel: round2(bezel),
    orientation,
    screen: {
      x: round2(x + bezel),
      y: round2(y + bezel),
      w: round2(w - bezel * 2),
      h: round2(h - bezel * 2),
      r: round2(screenR),
    },
  };
}

/**
 * Layered frame rendering: `below` = bezel body + screen cutout (drawn BEFORE
 * the screenshot), `above` = ornaments (drawn AFTER, on top of the screenshot)
 * plus the bezel stroke (drawn last so the screenshot never covers the rim).
 * The caller inlines the clipped screenshot image between the two groups.
 */
export interface FrameLayers {
  below: string;
  above: string;
}

/** Bezel + ornamentation SVG groups. The caller embeds the screenshot between them. */
export function frameSvg(device: DeviceSpec, geo: FrameGeometry): FrameLayers {
  const parts: string[] = [];
  const ornaments: string[] = [];
  const { x, y, w, h, radius, bezel, orientation } = geo;
  const s = geo.screen;
  const portrait = orientation === 'portrait';
  const sw = portrait ? s.w : s.h; // "width" along the device's long axis is s.h in landscape

  // body
  parts.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="#0d0d10"/>`,
  );
  // screen cutout (opaque; screenshot is drawn on top by the caller)
  parts.push(`<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.r}" fill="#000000"/>`);

  if (device.id === 'iphone69' || device.id === 'iphone65') {
    // dynamic island: top-center (portrait) or left-center (landscape)
    const pw = sw * 0.29;
    const ph = Math.max(Math.min(w, h) * 0.011, 6);
    const ix = portrait ? s.x + (s.w - pw) / 2 : s.x + h * 0.014;
    const iy = portrait ? s.y + h * 0.014 : s.y + (s.h - pw) / 2;
    ornaments.push(
      portrait
        ? `<rect x="${round2(ix)}" y="${round2(iy)}" width="${round2(pw)}" height="${round2(ph)}" rx="${round2(ph / 2)}" fill="#0d0d10"/>`
        : `<rect x="${round2(ix)}" y="${round2(iy)}" width="${round2(ph)}" height="${round2(pw)}" rx="${round2(ph / 2)}" fill="#0d0d10"/>`,
    );
    // home indicator: bottom-center (portrait) or right-center (landscape)
    const iw = sw * 0.34;
    const ih = Math.max(Math.min(w, h) * 0.006, 4);
    const hx = portrait ? s.x + (s.w - iw) / 2 : s.x + s.w - Math.min(w, h) * 0.02 - ih;
    const hy = portrait ? s.y + s.h - Math.min(w, h) * 0.02 - ih : s.y + (s.h - iw) / 2;
    ornaments.push(
      portrait
        ? `<rect x="${round2(hx)}" y="${round2(hy)}" width="${round2(iw)}" height="${round2(ih)}" rx="${round2(ih / 2)}" fill="#3a3a42"/>`
        : `<rect x="${round2(hx)}" y="${round2(hy)}" width="${round2(ih)}" height="${round2(iw)}" rx="${round2(ih / 2)}" fill="#3a3a42"/>`,
    );
  } else if (device.id === 'iphone55') {
    // classic home button: bottom bezel (portrait) or right bezel (landscape)
    const cr = bezel * 0.42;
    const cx = portrait ? x + w / 2 : x + w - bezel / 2;
    const cy = portrait ? y + h - bezel / 2 : y + h / 2;
    ornaments.push(
      `<circle cx="${round2(cx)}" cy="${round2(cy)}" r="${round2(cr)}" fill="none" stroke="#34343c" stroke-width="${round2(Math.max(bezel * 0.1, 2))}"/>`,
    );
  } else if (device.id === 'ipad13') {
    const iw = sw * 0.16;
    const ih = Math.max(Math.min(w, h) * 0.005, 4);
    const hx = portrait ? s.x + (s.w - iw) / 2 : s.x + s.w - Math.min(w, h) * 0.018 - ih;
    const hy = portrait ? s.y + s.h - Math.min(w, h) * 0.018 - ih : s.y + (s.h - iw) / 2;
    ornaments.push(
      portrait
        ? `<rect x="${round2(hx)}" y="${round2(hy)}" width="${round2(iw)}" height="${round2(ih)}" rx="${round2(ih / 2)}" fill="#3a3a42"/>`
        : `<rect x="${round2(hx)}" y="${round2(hy)}" width="${round2(ih)}" height="${round2(iw)}" rx="${round2(ih / 2)}" fill="#3a3a42"/>`,
    );
  } else {
    // android: punch-hole camera + nav pill
    const pr = Math.max(Math.min(w, h) * 0.012, 5);
    const px = portrait ? s.x + s.w / 2 : s.x + Math.min(w, h) * 0.018 + pr;
    const py = portrait ? s.y + Math.min(w, h) * 0.018 + pr : s.y + s.h / 2;
    ornaments.push(`<circle cx="${round2(px)}" cy="${round2(py)}" r="${round2(pr)}" fill="#0d0d10" stroke="#26262c" stroke-width="1.5"/>`);
    const nw = sw * 0.2;
    const nh = Math.max(Math.min(w, h) * 0.006, 4);
    const nx = portrait ? s.x + (s.w - nw) / 2 : s.x + s.w - Math.min(w, h) * 0.02 - nh;
    const ny = portrait ? s.y + s.h - Math.min(w, h) * 0.02 - nh : s.y + (s.h - nw) / 2;
    ornaments.push(
      portrait
        ? `<rect x="${round2(nx)}" y="${round2(ny)}" width="${round2(nw)}" height="${round2(nh)}" rx="${round2(nh / 2)}" fill="#3a3a42"/>`
        : `<rect x="${round2(nx)}" y="${round2(ny)}" width="${round2(nh)}" height="${round2(nw)}" rx="${round2(nh / 2)}" fill="#3a3a42"/>`,
    );
  }

  // rim stroke on top of everything
  ornaments.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="none" stroke="#34343c" stroke-width="${round2(Math.max(bezel * 0.16, 1.5))}"/>`,
  );

  return {
    below: parts.join('\n    '),
    above: ornaments.join('\n    '),
  };
}
