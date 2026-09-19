# INFLORY — pre-launch application
Public site: https://themercenary.org/inflory/ · Repository: The-Mercenary/the-mercenary.github.io.
Isolated checkout: /home/chungbok/Projects/Alpha-System/inflory-site.
Keep the corporate homepage and the dirty checkout at /home/chungbok/Projects/The-Mercenary unchanged.

## Current flow
Landing CTA → /inflory/{en|ko|ja|zh-hans}/apply/ → native HTTPS POST to FormSubmit → provider security check → localized /thanks/.
This is a real contact application, replacing the original no-contact GA4 interest modal. The site still does not fulfill followers or take payments.

Required: name (trimmed, 1–80 characters), ISO residence country/region, syntactically valid email (max 254), at least one platform, exactly one monthly quantity range, processing acknowledgement. Platforms: Facebook Page / Instagram / YouTube / X / Other; multiple checked entries use separate payload keys. Monthly ranges: 10–50, 51–100, 101–300, 301–500, 501–1,000, 1,001–3,000, 3,001+. These are a total across platforms, not promised deliveries.

Launch notification consent is OPTIONAL, unchecked by default, independent of the required fields and GA. All applications go to the operator; only launch_email_consent=yes can be considered for a later notification. There is no auto-reply, applicant campaign sender, paid subscription, or automatic unsubscribe database in this release.

## Email activation and delivery
Recipient: themercenary@duck.com through FormSubmit. No SMTP or private API keys in static code. Provider CAPTCHA remains enabled; do not add _captcha=false. A honeypot adds a simple spam signal. The submitter may temporarily see a provider-owned security page whose language is controlled by FormSubmit, not our translations.

On 2026-09-19, a synthetic setup request initially returned activation-required. The operator then confirmed clicking Activate Form. One subsequent labeled test returned HTTP 200, success="true", message="The form was submitted successfully." The provider now accepts delivery requests. Actual final mailbox arrival is a separate check; the assistant has no inbox access and has asked the operator to confirm. Exclude both setup tests from demand and launch-email lists. Do not start acquisition until inbox receipt is confirmed.

After submit we do not display a local success before provider handling. The return page states that it cannot verify mailbox delivery. Native POST network/provider failures remain provider/browser errors; browser Back allows retry. Resubmission may duplicate messages, so deduplicate by normalized email and keep the latest consent record; do not count setup tests.

## Data handling and launch-email operation
Fields and consent wording/version are delivered in the message, with client-generated submission time and a retention review date. These are self-reported records, not tamper-proof audit evidence. Personal fields are never in URLs, analytics events, source control, or application-managed local/session storage. The browser may still offer its own autocomplete.

Our operator retention policy shown on the form is at most 12 months or earlier deletion request. This is an OPERATOR WORKFLOW, not an automatic deletion service: review the retention_review_due field, delete expired applications from the forwarding mailbox and other copies, and process access/correction/deletion requests. FormSubmit separately documents 30-day archives. The notice identifies FormSubmit, cross-border processing possibility, and the Duck forwarding mailbox. Provider processing locations, transfer safeguards and contractual requirements need review for the actual target jurisdictions before scaled collection. No blanket global legal-compliance claim is made.

Opt-out route: email themercenary@duck.com, including the mailto link on every form/return page. It is a REQUEST processed by the operator, not an instant server-side unsubscribe action. Before sending any launch email:
- include ONLY explicit yes consents, excluding setup tests, withdrawals, duplicates and unverified/abusive entries;
- confirm email ownership or use a suitable double-opt-in email platform before bulk campaigns;
- include clear sender identity, applicable business address and advertising disclosures, and a working reply-to withdrawal mechanism;
- include localized unsubscribe-by-reply text, process opt-outs promptly and maintain suppression so deleted/withdrawn recipients are not reimported;
- do not imply that this form alone implements a campaign or an automatic one-click unsubscribe system.

Official references: https://formsubmit.co/documentation (activation, CAPTCHA, redirect, 30-day archive), https://formsubmit.co/privacy.pdf (processing policy), https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business (US commercial email opt-out obligations; other jurisdictions differ).

## Analytics and SEO
GA4 remains unconfigured in inflory/config.js. Landing consent/click/page events remain available after a G-ID is supplied. Application and return pages intentionally do not import analytics.js or load Google Analytics, even if landing consent exists. Email registration does NOT depend on analytics consent or a G-ID.
Legacy interest_submit events are retired: do not equate a CTA click with a registered applicant. Use received and deduplicated operator messages for application counts; this release does not establish user-level joins to GA.
Landing pages retain locale canonical/hreflang, WebPage metadata, sitemap, social image and browser-language selection. Application/return pages are noindex,follow and are not in the sitemap. Explicit language selection is supported; form inputs are deliberately not persisted between languages.

## Build and QA
Run:
```sh
node .site-src/inflory/build.mjs
npm ci --prefix .qa/inflory
node .qa/inflory/check.mjs
```
Node 22+, Chromium (/snap/bin/chromium; CHROMIUM_PATH override).
26 browser scenarios: four languages × four widths, validation, multiselect, optional opt-in both states, payload metadata, native POST redirect, error path, no external requests before submit, language routing. Submission requests are intercepted; these tests send no applicant emails.
Sources: content.mjs (base landing copy), waitlist-content.mjs (form copy and landing overrides), countries.mjs (ISO code snapshot), build.mjs + waitlist-page.mjs (static generators).
Runtime: app.js for landing; waitlist.js and waitlist.css for forms. Generated HTML is committed.

Fonts: modified OFL-licensed Inflory Sans subset derived from Pretendard v1.3.9. Retained license in assets/OFL-Pretendard.txt. Rebuild with subset-font.py after source copy changes; requires pinned upstream font in .qa/inflory/font-source and isolated fonttools[woff]. Original share artwork remains unchanged. Do not publish .qa node_modules, screenshots, font-env or downloaded font sources.
