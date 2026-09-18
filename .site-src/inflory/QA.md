# Release QA — 2026-09-19

Local Chromium + Playwright: 23 automated scenarios passed.

- 16 combinations: en / ko / ja / zh-hans × 320 / 390 / 768 / 1440px. One H1, canonical, five alternate-language links, no document horizontal overflow, correct selected plan, unavailable submission without GA, Escape closes dialog.
- 4 locale cases: ko-KR, ja-JP, zh-TW → available Simplified Chinese, de-DE → English. Manual English selection survives another neutral entry. Safe UTM preserved; unrelated email query discarded.
- 3 isolated analytics cases: consent + client callback, Google script blocked, callback timeout. No Google request before consent; no backfilled pre-consent clicks; no submitted success on missing/failed configuration; per-tab repeat suppression; event transmission stops after withdrawal. All external requests intercepted: zero real GA test traffic.
- Desktop English/Korean, mobile English/Japanese and original 1200×630 share image visually inspected. Local screenshots generated for each locale at 390 and 1440px.
- Runtime dependencies: self-hosted static JS/CSS, 91KB-class OFL font subset and approximately 60KB OG image. No external font request or tracking script before consent.

Not verified: real GA4 receipt or reporting (no measurement ID), Search Console ownership/indexing, native-speaker editorial approval, Safari/iOS-specific rendering, real demand, supply quality, legality/platform permission, unit economics, trademark availability. This release is a concept preview, not a live subscription business or contact waitlist.

Reproduce: `node .qa/inflory/check.mjs`. This check regenerates the OG image. Build translated HTML first with `node .site-src/inflory/build.mjs`.
