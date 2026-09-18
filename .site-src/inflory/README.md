# INFLORY — pre-launch concept

Published destination: https://themercenary.org/inflory/ in `The-Mercenary/the-mercenary.github.io`.
Local isolated checkout: `/home/chungbok/Projects/Alpha-System/inflory-site`.
Do not deploy unrelated modifications from `/home/chungbok/Projects/The-Mercenary`.

## What this is / is not

A static, four-language concept test for proposed 30-day distributed Instagram follower subscriptions. Proposed prices: Start $19 / 100, Rhythm $49 / 300, Presence $99 / 700, all USD per month. Prices, taxes, supply quality, retention, and launch are not validated. INFLORY is a provisional brand, not trademark clearance.

No follower fulfillment, payments, account credentials, email contacts, or launch notifications. No fake testimonials, demand figures, organic-growth claims, or retention/account-safety guarantees. The page explains third-party supply and platform-policy risks. Demand signals do not validate the service's permissibility or economics.

**GA4 is NOT activated:** `inflory/config.js` has an empty `gaMeasurementId`. The interest modal works for browsing, but submission is visibly unavailable. There is no fallback that pretends to save a signup. Do not drive a paid acquisition test until collection is connected and verified.

## Build and local checks

```sh
node .site-src/inflory/build.mjs
npm ci --prefix .qa/inflory
node .qa/inflory/check.mjs
```

Node 22+, Chromium (`CHROMIUM_PATH` override, default `/snap/bin/chromium`). QA starts and closes a local server. It tests 320/390/768/1440px in all four languages, canonical/hreflang, language routing, selection, missing configuration, consent, blocked/timeout handling, duplicate suppression, and withdrawal. Analytics tests intercept every request; **no production analytics calls**. Screenshots are local and ignored by Git.

Sources: `content.mjs` (translations), `build.mjs` (static HTML generator). Runtime: `inflory/app.js`, `analytics.js`, `locale-router.js`, `config.js`, `style.css`. No framework/build dependency at runtime. Generated HTML is committed and served by GitHub Pages. Do not edit only the generated HTML.

Self-hosted font: modified, renamed **Inflory Sans**, a subset derived from [Pretendard v1.3.9](https://github.com/orioncactus/pretendard/tree/v1.3.9); OFL copyright/license at `inflory/assets/OFL-Pretendard.txt`. Japanese and Chinese use the device's CJK sans-serif fallback where the font lacks glyphs. No external font CDN is required by visitors. To regenerate after adding Korean copy, download the pinned upstream variable WOFF2 to `.qa/inflory/font-source/PretendardVariable.woff2`, install `fonttools[woff]` in an isolated environment, and run `subset-font.py`. Open Graph art is original HTML/CSS rendered by the QA script, not downloaded stock art.

## Activate a new GA4 property

1. Create a separate GA4 property, e.g. `INFLORY — Prelaunch`. Suggested reporting timezone: Asia/Seoul; currency: USD. Create a **Web** stream for `https://themercenary.org`, named `INFLORY landing` (subdirectory routing is in the page code).
2. Copy the stream's **Measurement ID**, beginning `G-`, into `inflory/config.js` → `gaMeasurementId`. This is a public tag ID, NOT the numeric property ID or an API secret. Never commit OAuth tokens or service-account keys.
3. Disable enhanced measurement for this stream initially. This app manually emits page views and events, and sanitizes URL/referrer fields. Do not add a second GTM/gtag snippet. Keep Google Signals and advertising features off; review data retention (suggested initial setting: 2 months), operator/contact details, regional consent and disclosure requirements before active collection. This implementation is not a legal compliance certification.
4. Re-run QA, deploy config, then verify **real** events in GA4 Realtime / DebugView. Mock tests do not confirm receipt in a real property. Consent must precede any Google script loading. Rejection or content blocking means no measurement and no interest submission.
5. Mark `interest_submit` as a **key event**, preferably once per session. This is a preference signal, not a purchase or verified email lead. The browser suppresses repeats within the same tab session, not across devices or determined duplicates.
6. Create event-scoped custom dimensions for `plan_id`, `page_language`, `platform`, `refill_interest`, `placement`, `experiment_id`, `experiment_version`. Optionally create custom metrics for `plan_price_usd` and `plan_quantity` (do not treat as revenue).
7. Register the sitemap in Search Console for the verified domain or URL-prefix property: `https://themercenary.org/inflory/sitemap.xml`. No Search Console account action has been performed automatically.

Official references: [GA4 custom events](https://developers.google.com/analytics/devguides/collection/ga4/events), [localized page annotations](https://developers.google.com/search/docs/specialty/international/localized-versions), [locale-adaptive pages](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages).

## Measurement and interpretation

Events: `page_view`, `landing_view`, `view_plans`, `cta_click`, `select_plan`, `interest_open`, `interest_form_ready`, `interest_submit`, `faq_open`, `language_change`.

- CTA rate: sessions with `cta_click` / sessions with `landing_view` in the same consented cohort and time range.
- Interest rate: sessions with `interest_submit` / sessions with `landing_view` in the same cohort. Also report counts, acquisition source, language, chosen plan, and refill interest.
- These denominators are **measured, consenting sessions**, not all actual visitors. GA4 alone cannot determine total page views including declined/blocked visitors. Do not divide raw event counts and call that a user conversion rate.
- If a visitor grants consent only inside the form, earlier clicks are not backfilled. `interest_form_ready` records the now-observable state. Use an open funnel; do not require every prior step or pretend it is a fully observed user journey. Conversion rates are subject to consent-selection bias.
- No contact fields are collected, but GA4 uses online/cookie identifiers. This is **not guaranteed anonymous** data. No names/emails/handles/passwords in event parameters. UTM values are restricted to 64 ASCII letters/digits/underscore/hyphen; operators must still never put personal data in campaign values. Referrer is reduced to origin, arbitrary query fields and hashes are omitted from measurement.
- A `gtag` event callback confirms client-side processing only, **not durable server storage**. Ad blocking/network loss may lose responses; retry after a timeout can duplicate an already-processed event. Use GA4 session-based counts conservatively. A contact waitlist later requires a separate consented form and reliable server-side storage.
- Mainland China and other networks may block Google services. Simplified Chinese translation does not guarantee local GA4 accessibility. If that market matters, choose a separately reviewed first-party collection backend before running the experiment.
- Sample campaign: `/inflory/?utm_source=instagram&utm_medium=organic&utm_campaign=prelaunch_v1&utm_content=bio`. Country is not inferred from selected language; browser language is only an interface preference.

## Language and SEO behavior

Neutral `/inflory/` renders English HTML then negotiates a supported browser language. Explicit `/en/`, `/ko/`, `/ja/`, `/zh-hans/` URLs do not redirect. Choice is saved locally. Unsupported languages default to English; Chinese variants are offered the available Simplified Chinese edition. No IP geolocation. Native-language footer links remain crawlable and usable without JavaScript.

Four self-canonical static documents, reciprocal `hreflang` plus x-default, localized title/description/Open Graph metadata, one H1 per page, WebPage JSON-LD, project sitemap, root robots sitemap discovery. Root fallback canonical points to English to avoid duplicate content. No fabricated Product/Offer/review structured data. These are technical SEO foundations, not a ranking/indexing guarantee.

## Scope / release checks

Only add `inflory/`, `.site-src/inflory/`, `.qa/inflory/` source files, and the previously absent root `robots.txt`. Exclude QA node_modules, font tooling, screenshots, raw font downloads. Parent home, existing CSS/assets/CNAME remain unchanged. Use a non-forced fast-forward update after checking the current remote parent. Verify deployed language URLs/assets and config separately from local QA.

Brand direction: quiet editorial typography, dark royal green `#123f33`, warm paper `#f7f7f0`, a typographic 30-day calendar. The supplied Imweb collection URL returned HTTP 403 to research access; no claim of exact theme cloning. A manual native-speaker copy review remains advisable before paid campaigns.
