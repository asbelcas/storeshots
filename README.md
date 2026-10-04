# storeshots

**Test:** `npm install && npm test` — builds the TypeScript and runs the full suite (spec integrity, config parsing + error cases, per-template render dimensions, i18n overflow, license hook, end-to-end CLI integration). Must exit 0.

**Demo:** `npm run demo` — generates synthetic raw screenshots, then renders a real set: 2 device classes × 2 locales × 3 screens = 12 PNGs into `examples/output/`.

Turn raw app screenshots into store-ready App Store + Google Play sets from one YAML config. Offline, deterministic, CI-friendly.

## What it does

- Reads a YAML config (device classes, template, captions per locale, colors).
- Loads raw PNG screenshots from an input dir (file stem = screen key).
- Emits one PNG per device × locale × screen, at exactly the store-required dimensions (built-in 2026 spec table, see SPEC-SIZES.md).
- Frames each screenshot in a programmatically drawn device bezel (no third-party assets), with headline/subtext captions from locale JSON files.
- Warns (never crashes) when caption text likely overflows the template text box, using real font metrics.
- Self-checks every emitted PNG against the spec table; a dimension mismatch is a hard error.

## Install

Requires Node.js >= 20.

```bash
npm install
npm run build        # compiles src/ -> dist/
node dist/cli.js --help
```

## Quickstart

```bash
node examples/make_inputs.mjs                                   # synthetic raw screenshots -> examples/input/
node dist/cli.js build --config examples/storeshots.config.yaml # -> examples/output/
```

Sample layout produced:

```
examples/output/
  iphone69/          # 1320x2868 PNGs
    en/01-home.png 01-settings.png 01->02,03...
    de/...
  android-phone/     # 1080x1920 PNGs
    en/...  de/...
```

Files are numbered so upload order in App Store Connect / Play Console matches alphabetical order.

## Config reference

```yaml
template: aurora            # aurora | studio | mono
orientation: portrait       # portrait | landscape
devices: [iphone69, android-phone, ipad13]
locales: [en, de, es]       # locales/<code>.json must exist
input: ./input              # raw screenshots: <key>.png
out: ./output
colors:
  background: ["#0b1f3a", "#143d66"]  # 1 = flat, 2+ = gradient
  text: "#ffffff"
  accent: "#5ac8fa"
# optional:
# screens: [home, stats]    # subset + explicit order (default: key intersection of all locales, sorted)
# fontFamily: "My Font"     # override auto-detected font
# localesDir: ./locales     # default: <config dir>/../locales
```

Relative paths resolve against the config file's directory. Locale JSON (`locales/de.json`):

```json
{ "screens": { "home": { "headline": "...", "subtext": "..." } } }
```

Screens rendered = keys present in **every** requested locale, so each locale is a complete uploadable set.

CLI flags: `--config <file>` (required), `--out <dir>` (override), `--verbose` (log each file), `--license-key` / `--license-mode fake|live` / `--license-endpoint <url>` (see License hook).

## Store-spec coverage (v1)

| device id | store | portrait size | status |
|---|---|---|---|
| iphone69 | App Store | 1320x2868 | canonical 6.9" set (scales down to 6.7/6.5/6.3/6.1) |
| iphone65 | App Store | 1284x2778 | optional (auto-scaled) |
| iphone55 | App Store | 1242x2208 | optional legacy |
| ipad13 | App Store | 2064x2752 | canonical iPad set |
| android-phone | Google Play | 1080x1920 | recommended size (Play accepts 320-3840) |
| android-tablet | Google Play | 1200x1920 | VERIFY-BEFORE-LAUNCH (see SPEC-SIZES.md) |

Full detail + sources: SPEC-SIZES.md. Landscape supported for all classes (dimensions reversed, frames/orientation-aware).

## Templates

Three original layouts (device frames are drawn programmatically — no copied assets):

- **aurora** — dark gradient canvas, headline top-left, device center-bottom, accent glow.
- **studio** — light flat canvas, centered headline + device with soft floor shadow.
- **mono** — split editorial layout: accent bar + headline left, device right (use short copy — narrow text column).

## Limitations (honest)

- Templates: 3. No per-screen template mixing in one run.
- Captions are single-line; long text warns but is not auto-wrapped or auto-shrunk.
- Renders text with system fonts (DejaVu on Linux; set `fontFamily` for your machine). No font bundling yet.
- No app preview videos, no Google Play feature graphic (1024x500), no Apple Watch / Mac / TV / Vision classes.
- No auto-translation — you write each locale's copy.
- Device frames are stylized vector bezels, not photoreal device photography.

## License hook

`src/license.ts` validates license keys. v1 ships with a `fake` mode (deterministic local checksum, for tests/CI only) and a `live` mode that is intentionally **not wired**: it throws until an endpoint is configured. No real validation happens in v1 builds; the CLI only checks a license if you pass `--license-key`.

## Handoff: what a human must do later

1. Create the Lemon Squeezy (or Gumroad) seller account; wire the real license endpoint into `src/license.ts` live mode (`--license-endpoint`), and make the CLI enforce the key for paid builds.
2. Update the copyright line in LICENSE and pick the public repo name/homepage before publishing.
3. Re-verify the `android-tablet` size and Apple's current size list the week of release (SPEC-SIZES.md flags what to check).
4. Record a demo GIF for the README; publish repo; list the product; run the distribution plan from the kill-or-commit memo.

## Roadmap

- Google Play feature graphic + Apple Watch/Mac classes.
- Template mixing per screen, multi-line captions, auto-fit shrink.
- Bundled fonts for pixel-identical output across machines.
- Claude Code / Cursor skill file bundling (per distribution plan).
- More templates (6+), photoreal frame option.

License: FSL-1.1-MIT (see LICENSE) — readable source today, MIT two years after each release.
