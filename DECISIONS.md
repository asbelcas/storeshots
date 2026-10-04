# DECISIONS.md — tested-v1

Date: 2026-10-04.

## Stack: kept the memo's Node.js + TypeScript + sharp (no switch)

- `sharp@0.33.5`, `yaml@2.5.1`, `opentype.js@1.3.4` (all exact-pinned); `typescript@5.6.3`, `@types/node@20.16.10` (dev, exact-pinned).
- sharp's prebuilt libvips installed from npm in ~11 s and passed an SVG-text render smoke test on the first try, so the Python/Pillow fallback was never needed. All deps come from the npm registry — no native compilation on this box.
- `opentype.js` is an addition to the memo's sketch: overflow warnings would be dishonest without real font metrics. It is pure JS (no native code), loads the same DejaVu Sans TTF that librsvg uses to render the SVG, so measured width matches rendered width. If no measurable font is installed it degrades to a conservative heuristic rather than failing.

## Repo license: FSL-1.1-MIT

This is a paid product with a public repo (source as marketing, per the kill-or-commit memo). FSL-1.1-MIT keeps the source readable while prohibiting competitors from repackaging the tool as a competing service; every release auto-converts to MIT on its second anniversary. PolyForm-Noncommercial was the alternative, but it blocks the exact buyer we want (commercial indie devs using it for their paid apps).

## Design decisions

- **Config-relative paths**: `input`, `out`, `localesDir` resolve against the config file's directory, not cwd — configs behave the same from CI, scripts, and manual runs.
- **Screens = intersection of locale keys**: guarantees every locale is a complete uploadable set; no half-localized listings. Optional `screens:` list overrides subset and order.
- **Overflow = warn, never crash** (per deliverable). Warnings name device/locale/screen and the box width. German demo copy intentionally includes one too-long headline so the warning path is exercised in the shipped example.
- **Runtime self-check**: every emitted PNG is re-opened and compared to the spec table; mismatch throws. The spec guarantee is enforced in the product, not just in tests.
- **Determinism**: no RNG, no timestamps; an integration test renders the same config twice and byte-compares all 12 PNGs.
- **Landscape support** shipped for all device classes (frames are orientation-aware: ornaments move to the correct edges) — small extra surface, big store-realism win, covered by tests.
- **License hook**: `fake` mode is a deterministic checksum over the `SS1-XXXX-XXXX-XXXX-NNNN` shape — tests and CI can exercise the code path with zero network. `live` mode has the Lemon-Squeezy-style POST shape (`{endpoint}/validate`, injectable transport) but deliberately throws "not wired yet" until the human owner creates the seller account. Nothing in v1 validates purchases at runtime.
- **Numbered output** (`01-home.png`): upload order in the store consoles follows the numbers.

## Known deviations from the memo's build sketch

- Sketch said "~6 original launch templates"; v1 ships 3 (quality over breadth, per deliverable scope). Roadmap covers the rest.
- Sketch positioned the npm tarball + license enforcement as v1; v1 keeps the CLI unlicensed-by-default and adds enforcement as a handoff step, so the public repo stays honest and self-contained.
