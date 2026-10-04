# SPEC-SIZES.md — store screenshot size table (v1)

Built into `src/spec.ts` as `SPEC_VERSION = '2026-10'`. Sources checked 2026-10-04 via web search; per-value confidence noted. Apple auto-scaling rule (2026): uploading the largest display in each device family (6.9" iPhone, 13" iPad) covers the smaller classes, so only canonical classes are marked required.

## App Store (App Store Connect)

| device id | class | portrait | landscape | required in v1 table | notes |
|---|---|---|---|---|---|
| iphone69 | iPhone 6.9" | 1320 x 2868 | 2868 x 1320 | yes | Canonical. Also accepted in the 6.9" bucket: 1290x2796, 1260x2736 (same aspect). |
| iphone65 | iPhone 6.5" | 1284 x 2778 | 2778 x 1284 | no (optional) | Also accepted: 1242x2688. Auto-scaled from the 6.9" set in 2026. |
| iphone55 | iPhone 5.5" | 1242 x 2208 | 2208 x 1242 | no (legacy) | Only relevant for old 4.7" listings. |
| ipad13 | iPad 13" | 2064 x 2752 | 2752 x 2064 | yes (if iPad app) | Canonical iPad set; also accepted: 2048x2732. Scales to smaller iPads. |

Not included (2026): iPhone 6.3" class (1179x2556 / 1206x2622) — covered by the 6.9" set via auto-scaling; Mac, Apple TV, Apple Watch, Vision Pro classes (roadmap).

## Google Play

| device id | slot | size | status |
|---|---|---|---|
| android-phone | Phone screenshots | 1080 x 1920 (portrait) / 1920 x 1080 (landscape) | recommended size; Play accepts any side 320-3840 px; min 2 screenshots; short side >= 1080 required for featuring |
| android-tablet | Tablet screenshots | 1200 x 1920 | **VERIFY-BEFORE-LAUNCH** — Play mandates no exact tablet size (>= 1080 short side for featuring). 1200x1920 is a common 16:10 tablet canvas; confirm against Play Console the week of release. |

Not included: feature graphic 1024 x 500 (separate asset, not a screenshot — roadmap).

## Sources (all accessed 2026-10-04)

- https://shotlingo.com/blog/app-store-screenshot-sizes-complete-guide-2026/ (2026-09-05) — 2026 iPhone/iPad tables incl. 6.9" 1320x2868.
- https://www.applaunchflow.com/app-store-screenshot-sizes (2026-09-13) — "Every 2026 App Store screenshot size: 6.9" 1320x2868, 6.7" 1290x2796, 6.5" 1284x2778, 13" iPad 2064x2752".
- https://screenfast.app/blog/app-store-screenshot-sizes-2026 (2026-08-15) — 6.9" bucket accepts 1260x2736 / 1290x2796 / 1320x2868; 1290x2796 safe default.
- https://screenhance.com/blog/app-store-screenshots-that-convert (2026-08-31) — full 2026 class table (6.9"/6.5"/6.3"/6.1"/5.5", iPad).
- https://visualmodo.com/app-screenshot-workflow-guide/ (2026-09-28) — "upload the 6.9-inch set at 1320x2868 / 1290x2796 / 1260x2736 ... iPad 2064x2752 or 2048x2732".
- https://playmockup.com/blog/app-store-screenshot-sizes-iphone-2026 (2026-07-21) — "in 2026 you only need the largest display per family".
- https://catdoes.com/blog/play-store-screenshot-size (2026-09-30) — Play phone 1080x1920 recommended.
- https://studio.adalo.com/blog/google-play-screenshot-sizes (2026-08-05) — Play accepts any side 320-3840 px.
- https://appradar.com/blog/android-app-screenshot-sizes-and-guidelines-for-google-play (2026-07-24) — featuring: >= 4 screenshots at >= 1080 px short side.

## Re-verification checklist before a real release

1. Apple App Store Connect help → current screenshot size list (Apple changes required sizes most years).
2. Google Play Console → graphic assets specs for phone/tablet.
3. `android-tablet` row above (flagged in the table with `verify: true`; the CLI spec table carries the same flag).
