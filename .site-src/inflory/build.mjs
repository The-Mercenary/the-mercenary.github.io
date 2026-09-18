import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { locales } from './content.mjs';
import { config } from '../../inflory/config.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const base = config.canonicalUrl;
const labels = { en: 'English', ko: '한국어', ja: '日本語', 'zh-hans': '简体中文' };
const identifierNotice = {
  en: 'Google Analytics uses cookie-based online identifiers. Not collecting contact details does not make all usage data anonymous.',
  ko: 'Google Analytics는 쿠키 기반 온라인 식별자를 사용합니다. 연락처를 받지 않더라도 모든 이용 데이터가 완전히 익명인 것은 아닙니다.',
  ja: 'Google AnalyticsはCookieに基づくオンライン識別子を使用します。連絡先を集めなくても、すべての利用データが完全に匿名になるわけではありません。',
  'zh-hans': 'Google Analytics会使用基于Cookie的在线标识符。不收集联系方式并不意味着所有使用数据都完全匿名。'
};
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const lines = value => value.map(escape).join('<br>');
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const arrow = '<span aria-hidden="true">↗</span>';
const mark = '<svg class="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 23V9h7v14M20 23V9h7v14M5 16h22m-7-12 7 5-7 5" stroke="currentColor" stroke-width="3"/></svg>';
const plans = Object.entries(config.plans);
const format = (str, params) => Object.entries(params).reduce((s, [key, val]) => s.replaceAll(`{${key}}`, val), str);

function page(key, isRoot = false) {
  const t = locales[key];
  const url = `${base}${key}/`;
  const alternate = Object.entries(locales).map(([k, value]) => `<link rel="alternate" hreflang="${value.lang}" href="${base}${k}/">`).join('\n');
  const languageLinks = Object.entries(labels).map(([k, label]) => `<a href="/inflory/${k}/" lang="${locales[k].lang}" hreflang="${locales[k].lang}" data-language="${k}" ${k === key ? 'aria-current="page"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="${t.lang}" data-locale="${key}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#123f33">
<title>${escape(t.title)}</title><meta name="description" content="${escape(t.description)}">
<meta name="robots" content="index,follow,max-image-preview:large"><meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="canonical" href="${url}">${alternate}<link rel="alternate" hreflang="x-default" href="${base}">
<link rel="icon" type="image/svg+xml" href="/inflory/assets/mark.svg">
<link rel="preload" href="/inflory/assets/pretendard-subset.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/inflory/style.css">
<meta property="og:type" content="website"><meta property="og:locale" content="${t.ogLocale}"><meta property="og:site_name" content="INFLORY">
<meta property="og:title" content="${escape(t.title)}"><meta property="og:description" content="${escape(t.description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${base}assets/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="INFLORY — Influence, in rhythm.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(t.title)}"><meta name="twitter:description" content="${escape(t.description)}"><meta name="twitter:image" content="${base}assets/og.png">
<script type="application/ld+json">${json({'@context':'https://schema.org','@type':'WebPage', '@id':`${url}#webpage`,url,name:t.title,description:t.description,inLanguage:t.lang,isPartOf:{'@type':'WebSite',name:'The Mercenary',url:'https://themercenary.org/'}})}</script>
${isRoot ? '<script src="/inflory/locale-router.js"></script>' : ''}
<script type="application/json" id="ui-copy">${json({...t.ui,successDetail:t.successDetail})}</script>
<script type="module" src="/inflory/app.js"></script>
</head>
<body>
<a class="skip-link" href="#main">${escape(t.skip)}</a>
<header class="site-header wrap"><a class="brand" href="/inflory/${key}/" aria-label="${escape(t.home)}">${mark}<span>inflory<span class="brand-dot">.</span></span></a><nav aria-label="${escape(t.navigation)}"><a class="nav-plans" href="#plans">${escape(t.nav[0])}</a><a class="nav-how" href="#about">${escape(t.nav[1])}</a><label class="language-control"><span class="sr-only">${escape(t.language)}</span><select id="language-select" aria-label="${escape(t.language)}">${Object.entries(labels).map(([k,label]) => `<option value="${k}" ${k===key?'selected':''}>${label}</option>`).join('')}</select></label><button class="header-cta" type="button" data-open-interest data-placement="header">${escape(t.nav[2])} ${arrow}</button></nav></header>
<main id="main">
<section class="hero wrap" aria-labelledby="hero-title"><div class="hero-copy"><p class="eyebrow"><span class="small-dot" aria-hidden="true"></span> INSTAGRAM, AT YOUR PACE</p><h1 id="hero-title">${escape(t.hero[0])}<br><span class="serif-word">${escape(t.hero[1])}</span></h1><p class="hero-description">${lines(t.heroDescription)}</p><a class="button button-green hero-button" href="#plans" data-track="explore_plans" data-placement="hero">${escape(t.heroCta)} ${arrow}</a><p class="quiet-note">${escape(t.heroNote)}</p></div>
<div class="calendar-art" role="img" aria-label="${escape(t.calendarLabel)}"><div class="calendar-top"><span>THE MONTHLY EDITION</span>${mark}</div><div class="calendar-title"><span>${lines(t.calendar)}</span><span class="calendar-number">30<span>DAYS</span></span></div><div class="weekdays" aria-hidden="true">${['M','T','W','T','F','S','S'].map(s=>`<span>${s}</span>`).join('')}</div><ol class="calendar-days" aria-hidden="true">${Array.from({length:30},(_,i)=>{const d=i+1;return `<li class="${d===30?'day-ring':d%6===3?'day-fill':d%6===0?'day-light':''}">${d}</li>`;}).join('')}</ol><div class="calendar-foot"><span><i aria-hidden="true"></i> ${escape(t.calendarLegend)}</span><span>CONCEPT 01</span></div><div class="calendar-caption">${escape(t.calendarNote)}</div></div></section>
<div class="edition-strip"><div class="wrap"><span>INFLUENCE × DELIVERY</span><span>${escape(t.strip)}</span><span>BY THE MERCENARY ${arrow}</span></div></div>
<section class="plans-section wrap" id="plans" aria-labelledby="plans-title"><div class="section-head"><div><p class="eyebrow">FIND YOUR RHYTHM</p><h2 id="plans-title">${lines(t.plansTitle)}</h2></div><p class="section-note">${lines(t.plansNote)}</p></div><div class="plans-grid">${plans.map(([id,p],i)=>`<article class="plan ${i===1?'plan-featured':''}" data-plan-card="${id}"><div class="plan-top"><span class="plan-index">0${i+1}</span><span class="plan-caption">${escape(t.captions[i])}</span></div><h3>${p.name}</h3><p class="plan-summary">${escape(t.summaries[i])}</p><p class="plan-quantity">${p.followers}<span>${escape(t.quantitySuffix)}</span></p><p class="plan-price"><strong>$${p.price}</strong> USD <span>${escape(t.monthSuffix)}</span></p><div class="plan-divider"></div><ul>${[t.benefits[0],t.benefits[1],t.benefits[i===0?2:3]].map(x=>`<li>${escape(x)}</li>`).join('')}</ul><button type="button" class="button ${i===1?'button-cream':'button-outline'}" data-open-interest data-plan="${id}" data-placement="plan">${escape(format(t.planCta,{plan:p.name}))} ${arrow}</button></article>`).join('')}</div><p class="pricing-note">${escape(t.pricingNote)}</p></section>
<section class="how-section wrap" id="about" aria-labelledby="how-title"><div class="section-head"><div><p class="eyebrow">A LITTLE, ALONG THE WAY</p><h2 id="how-title">${lines(t.howTitle)}</h2></div><span class="planned-label">${escape(t.plannedLabel)}</span></div><ol class="steps">${t.steps.map(([title,...body],i)=>`<li><span class="step-no">0${i+1} / ${['SELECT','DISTRIBUTE','CONTINUE'][i]}</span><h3>${escape(title)}</h3><p>${lines(body)}</p></li>`).join('')}</ol></section>
<section class="faq-section wrap" aria-labelledby="faq-title"><div><p class="eyebrow">BEFORE WE BEGIN</p><h2 id="faq-title">${lines(t.faqTitle)}</h2></div><div class="faq-list">${t.faq.map(([q,a],i)=>`<details data-faq="${i+1}"><summary>${escape(q)}<span aria-hidden="true">+</span></summary><p>${escape(a)}</p></details>`).join('')}</div></section>
<section class="closing-section"><div class="wrap closing-inner"><div><p class="eyebrow">YOUR NEXT MONTH, IN MOTION</p><h2>${lines(t.closing)}</h2></div><div class="closing-action"><button type="button" class="button button-cream" data-open-interest data-placement="footer">${escape(t.closingCta)} ${arrow}</button><p>${escape(t.closingNote)}</p></div></div></section><div class="disclosure wrap"><p>${escape(t.disclosure)}</p></div></main>
<footer class="site-footer wrap"><a class="brand footer-brand" href="/inflory/${key}/">inflory.</a><span>© 2026 <a href="https://themercenary.org/">The Mercenary</a></span><div><button type="button" id="privacy-open">${escape(t.privacyLink)}</button><button type="button" id="analytics-settings">${escape(t.settings)}</button></div></footer><nav class="language-links wrap" aria-label="${escape(t.language)}">${languageLinks}</nav>
<noscript><div class="noscript wrap">${escape(t.noScript)}</div></noscript>
<dialog id="interest-dialog" class="interest-dialog" aria-labelledby="interest-title"><button class="dialog-close" type="button" data-close-dialog aria-label="${escape(t.close)}">×</button><div id="interest-form-content"><p class="eyebrow">A SMALL SIGNAL, A GOOD START</p><h2 id="interest-title">${lines(t.formTitle)}</h2><p class="dialog-intro">${lines(t.formIntro)}</p><form id="interest-form"><fieldset class="plan-options"><legend>${escape(t.planLegend)}</legend>${plans.map(([id,p],i)=>`<label><input type="radio" name="plan" value="${id}" ${i===0?'required':''}><span>${p.name}<small>${escape(format(t.formPrice,p))} USD</small></span></label>`).join('')}</fieldset><div class="form-row"><label for="platform">${escape(t.platformLabel)}</label><select id="platform" name="platform">${['instagram','youtube','tiktok'].map((v,i)=>`<option value="${v}">${escape(t.platformOptions[i])}</option>`).join('')}</select></div><label class="checkbox-row refill-option"><input type="checkbox" name="refill"><span>${escape(t.refill)}</span></label><label class="checkbox-row consent-row"><input type="checkbox" name="measurement_consent" required><span>${escape(t.consent)} <button type="button" class="text-button" data-privacy>${escape(t.more)}</button></span></label><p class="form-status" id="interest-status" role="status" aria-live="polite"></p><button class="button button-green submit-interest" type="submit" disabled>${escape(t.formSubmit)} ${arrow}</button><p class="form-small">${escape(t.formFine)}</p></form></div><div id="interest-success" hidden><div class="success-mark" aria-hidden="true">↗</div><p class="eyebrow">THANK YOU FOR YOUR SIGNAL</p><h2>${lines(t.successTitle)}</h2><p id="success-detail"></p><p class="dialog-intro">${lines(t.successText)}</p><button class="button button-green" type="button" data-close-dialog>${escape(t.successButton)} ${arrow}</button></div></dialog>
<dialog id="privacy-dialog" class="privacy-dialog" aria-labelledby="privacy-title"><button class="dialog-close" type="button" data-close-privacy aria-label="${escape(t.close)}">×</button><h2 id="privacy-title">${escape(t.privacyTitle)}</h2><p>${escape(t.operator)}</p>${t.privacy.map(([h,p])=>`<h3>${escape(h)}</h3><p>${escape(p)}</p>`).join('')}<p>${escape(identifierNotice[key])}</p><p><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">${escape(t.googlePrivacy)} ↗</a></p><button class="button button-outline" type="button" data-close-privacy>${escape(t.confirm)}</button></dialog>
<aside class="consent-banner" id="consent-banner" aria-label="${escape(t.settings)}" hidden><div><strong>${escape(t.consentTitle)}</strong><p>${escape(t.consentText)} <button class="text-button" type="button" data-privacy>${escape(t.more)}</button></p></div><div class="consent-actions"><button type="button" id="consent-deny">${escape(t.deny)}</button><button type="button" id="consent-allow">${escape(t.allow)}</button></div></aside>
</body></html>`;
}

await writeFile(`${root}inflory/index.html`, page('en', true));
for (const key of Object.keys(locales)) {
  await mkdir(`${root}inflory/${key}`, {recursive:true});
  await writeFile(`${root}inflory/${key}/index.html`, page(key));
}
// A project-scoped sitemap does not replace the parent site's SEO configuration.
const alternateXml = Object.entries(locales).map(([k,t])=>`<xhtml:link rel="alternate" hreflang="${t.lang}" href="${base}${k}/"/>`).join('')+`<xhtml:link rel="alternate" hreflang="x-default" href="${base}"/>`;
await writeFile(`${root}inflory/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${Object.keys(locales).map(k=>`<url><loc>${base}${k}/</loc>${alternateXml}</url>`).join('')}</urlset>\n`);
console.log('Built English fallback + 4 localized pages and sitemap.');
