# Application release QA — 2026-09-19

26 Chromium / Playwright scenarios passed with node .qa/inflory/forms-check.mjs.

- 16 locale/viewport combinations: en, ko, ja, zh-hans × 320, 390, 768, 1440px. Landing CTA navigates to its localized form; plan quantity is preserved; 249 country/region options; five platform checkboxes; seven exclusive volume ranges; no horizontal overflow.
- 8 submission cases: every language with optional launch-email consent both unchecked and checked. Invalid name/email, missing platform or missing privacy acknowledgement prevents submission. Two platforms and exactly one range serialize correctly. No CAPTCHA disabling and no applicant auto-response fields.
- 1 provider network-failure case: no false success/return page.
- 1 browser-language entry and manual form-language switch.
- All QA POST requests intercepted; no applicant emails sent. No third-party request from form before submission. No applicant fields stored by application code. Korean mobile and English desktop screenshots visually reviewed.

Separate live integration checks: one synthetic activation request initially returned activation-required. The operator confirmed activation. One subsequent labeled test returned HTTP 200, success="true", message="The form was submitted successfully." The operator explicitly confirmed receipt of that test email. This verifies provider acceptance and operator-reported mailbox delivery using the documented AJAX API, not a manual end-to-end completion of the native browser CAPTCHA. Both tests are excluded from demand metrics and launch lists.

Local validation is not server-side enforcement: the public static endpoint can be posted to directly. Provider CAPTCHA/honeypot handle basic spam; treat all incoming fields as untrusted. Return-page access is not proof of a submission. Email ownership, delivery, provider localization, legal compliance and unsubscribe processing are not certified by these tests.

Prior no-contact modal release is superseded; use the current form check entrypoint.
