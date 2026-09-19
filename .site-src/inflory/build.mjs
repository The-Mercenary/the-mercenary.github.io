import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { locales } from './content.mjs';
import { waitlist } from './waitlist-content.mjs';
import { waitlistPage } from './waitlist-page.mjs';
import { allocationCopy } from './allocation-copy.mjs';
import { allocation, dailyAverage } from '../../inflory/allocation.js';
import { config } from '../../inflory/config.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const base = config.canonicalUrl;
const labels = { en: 'English', ko: '한국어', ja: '日本語', 'zh-hans': '简体中文' };
const identifierNotice = {
  en: 'Google Analytics uses cookie-based online identifiers. Usage data is not guaranteed anonymous.',
  ko: 'Google Analytics는 쿠키 기반 온라인 식별자를 사용합니다. 이용 데이터는 완전한 익명이 아닐 수 있습니다.',
  ja: 'Google AnalyticsはCookieに基づくオンライン識別子を使用します。利用データが完全に匿名になるわけではありません。',
  'zh-hans': 'Google Analytics会使用基于Cookie的在线标识符。使用数据并非完全匿名。'
};
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const lines = value => value.map(escape).join('<br>');
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const arrow = '<span aria-hidden="true">↗</span>';
const mark = '<svg class="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 23V9h7v14M20 23V9h7v14M5 16h22m-7-12 7 5-7 5" stroke="currentColor" stroke-width="3"/></svg>';



function page(key, isRoot = false) {
  const w = waitlist[key], a = allocationCopy[key];
  const t = {...locales[key], title:a.title, description:a.description, heroCta:a.explore, steps:a.steps, nav:[a.nav,locales[key].nav[1],a.explore], closingCta:a.explore, closingNote:w.ctaNote,
    planCta:w.ctaPlan, noScript:w.noScript, privacyTitle:w.privacyTitle,
    faq:locales[key].faq.map((entry,i)=>i===0?[entry[0],w.faq]:i===3?[entry[0],a.faq]:entry),
    privacy:[[w.noticeTitle,w.notice],['INFLORY',w.countPurpose],['Google Analytics',w.analyticsNotice]]};
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
<link rel="stylesheet" href="/inflory/style.css"><link rel="stylesheet" href="/inflory/allocation.css">
<meta property="og:type" content="website"><meta property="og:locale" content="${t.ogLocale}"><meta property="og:site_name" content="INFLORY">
<meta property="og:title" content="${escape(t.title)}"><meta property="og:description" content="${escape(t.description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${base}assets/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="INFLORY — Influence, in rhythm.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(t.title)}"><meta name="twitter:description" content="${escape(t.description)}"><meta name="twitter:image" content="${base}assets/og.png">
<script type="application/ld+json">${json({'@context':'https://schema.org','@type':'WebPage', '@id':`${url}#webpage`,url,name:t.title,description:t.description,inLanguage:t.lang,isPartOf:{'@type':'WebSite',name:'The Mercenary',url:'https://themercenary.org/'}})}</script>
${isRoot ? '<script src="/inflory/locale-router.js"></script>' : ''}
<script type="module" src="/inflory/app.js"></script>
</head>
<body>
<a class="skip-link" href="#main">${escape(t.skip)}</a>
<header class="site-header wrap"><a class="brand" href="/inflory/${key}/" aria-label="${escape(t.home)}">${mark}<span>inflory<span class="brand-dot">.</span></span></a><nav aria-label="${escape(t.navigation)}"><a class="nav-plans" href="#allocation">${escape(t.nav[0])}</a><a class="nav-how" href="#about">${escape(t.nav[1])}</a><label class="language-control"><span class="sr-only">${escape(t.language)}</span><select id="language-select" aria-label="${escape(t.language)}">${Object.entries(labels).map(([k,label]) => `<option value="${k}" ${k===key?'selected':''}>${label}</option>`).join('')}</select></label><a class="header-cta" href="#allocation">${escape(t.nav[2])} ${arrow}</a></nav></header>
<main id="main">
<section class="hero wrap" aria-labelledby="hero-title"><div class="hero-copy"><p class="eyebrow"><span class="small-dot" aria-hidden="true"></span> INSTAGRAM, AT YOUR PACE</p><h1 id="hero-title">${escape(t.hero[0])}<br><span class="serif-word">${escape(t.hero[1])}</span></h1><p class="hero-description">${lines(t.heroDescription)}</p><a class="button button-green hero-button" href="#allocation" data-track="explore_allocation" data-placement="hero">${escape(t.heroCta)} ${arrow}</a><p class="quiet-note">${escape(t.heroNote)}</p></div>
<div class="calendar-art" role="img" aria-label="${escape(t.calendarLabel)}"><div class="calendar-top"><span>THE MONTHLY EDITION</span>${mark}</div><div class="calendar-title"><span>${lines(t.calendar)}</span><span class="calendar-number">30<span>DAYS</span></span></div><div class="weekdays" aria-hidden="true">${['M','T','W','T','F','S','S'].map(s=>`<span>${s}</span>`).join('')}</div><ol class="calendar-days" aria-hidden="true">${Array.from({length:30},(_,i)=>{const d=i+1;return `<li class="${d===30?'day-ring':d%6===3?'day-fill':d%6===0?'day-light':''}">${d}</li>`;}).join('')}</ol><div class="calendar-foot"><span><i aria-hidden="true"></i> ${escape(t.calendarLegend)}</span><span>CONCEPT 01</span></div><div class="calendar-caption">${escape(t.calendarNote)}</div></div></section>
<div class="edition-strip"><div class="wrap"><span>INFLUENCE × DELIVERY</span><span>${escape(t.strip)}</span><span>BY THE MERCENARY ${arrow}</span></div></div>
<section class="allocation-section wrap" id="allocation" aria-labelledby="allocation-title"><span id="plans" class="legacy-anchor" aria-hidden="true"></span><div class="allocation-intro"><p class="eyebrow">A MONTH, AT YOUR PACE</p><h2 id="allocation-title">${lines(a.heading)}</h2><p>${escape(a.intro)}</p><span class="allocation-edition">01 — YOUR MONTHLY RHYTHM</span></div><div class="allocation-panel"><label for="monthly-allocation" class="allocation-label">${escape(a.monthly)}</label><div class="allocation-total"><output id="monthly-total" for="monthly-allocation" aria-live="off">100</output><span>${escape(a.unit)}</span></div><input id="monthly-allocation" class="quantity-slider" type="range" min="${allocation.min}" max="${allocation.max}" step="1" value="${allocation.default}" aria-label="${escape(a.rangeLabel)}" aria-describedby="allocation-formula allocation-note"><div class="slider-extents" aria-hidden="true"><span>10</span><span>3,000</span></div><div class="daily-estimate"><div><span>${escape(a.daily)}</span><small id="allocation-formula">${escape(a.formula)}</small></div><p><output id="daily-total" for="monthly-allocation" aria-live="off">${dailyAverage(allocation.default,t.lang)}</output><span>${escape(a.perDay)}</span></p></div><a class="button button-green allocation-cta" id="allocation-cta" data-apply data-placement="allocation" href="/inflory/${key}/apply/?followers=100">${escape(a.cta)} ${arrow}</a><p class="allocation-next">${escape(a.ctaNote)}</p><p class="allocation-disclaimer" id="allocation-note">${escape(a.note)}</p></div></section>
<section class="how-section wrap" id="about" aria-labelledby="how-title"><div class="section-head"><div><p class="eyebrow">A LITTLE, ALONG THE WAY</p><h2 id="how-title">${lines(t.howTitle)}</h2></div><span class="planned-label">${escape(t.plannedLabel)}</span></div><ol class="steps">${t.steps.map(([title,...body],i)=>`<li><span class="step-no">0${i+1} / ${['SELECT','DISTRIBUTE','CONTINUE'][i]}</span><h3>${escape(title)}</h3><p>${lines(body)}</p></li>`).join('')}</ol></section>
<section class="faq-section wrap" aria-labelledby="faq-title"><div><p class="eyebrow">BEFORE WE BEGIN</p><h2 id="faq-title">${lines(t.faqTitle)}</h2></div><div class="faq-list">${t.faq.map(([q,a],i)=>`<details data-faq="${i+1}"><summary>${escape(q)}<span aria-hidden="true">+</span></summary><p>${escape(a)}</p></details>`).join('')}</div></section>
<section class="closing-section"><div class="wrap closing-inner"><div><p class="eyebrow">YOUR NEXT MONTH, IN MOTION</p><h2>${lines(t.closing)}</h2></div><div class="closing-action"><a class="button button-cream" href="#allocation">${escape(t.closingCta)} ${arrow}</a><p>${escape(t.closingNote)}</p></div></div></section><div class="disclosure wrap"><p>${escape(t.disclosure)}</p></div></main>
<footer class="site-footer wrap"><a class="brand footer-brand" href="/inflory/${key}/">inflory.</a><span>© 2026 <a href="https://themercenary.org/">The Mercenary</a></span><div><button type="button" id="privacy-open">${escape(t.privacyLink)}</button><button type="button" id="analytics-settings">${escape(t.settings)}</button></div></footer><nav class="language-links wrap" aria-label="${escape(t.language)}">${languageLinks}</nav>
<noscript><div class="noscript wrap">${escape(t.noScript)}</div></noscript>
<dialog id="privacy-dialog" class="privacy-dialog" aria-labelledby="privacy-title"><button class="dialog-close" type="button" data-close-privacy aria-label="${escape(t.close)}">×</button><h2 id="privacy-title">${escape(t.privacyTitle)}</h2><p>${escape(t.operator)}</p>${t.privacy.map(([h,p])=>`<h3>${escape(h)}</h3><p>${escape(p)}</p>`).join('')}<p>${escape(identifierNotice[key])} <a href="https://formsubmit.co/privacy.pdf" target="_blank" rel="noopener noreferrer">${escape(w.providerPrivacy)} ↗</a> <a href="mailto:themercenary@duck.com?subject=INFLORY%20unsubscribe">${escape(w.withdraw)}</a></p><p><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">${escape(t.googlePrivacy)} ↗</a></p><button class="button button-outline" type="button" data-close-privacy>${escape(t.confirm)}</button></dialog>
<aside class="consent-banner" id="consent-banner" aria-label="${escape(t.settings)}" hidden><div><strong>${escape(t.consentTitle)}</strong><p>${escape(t.consentText)} <button class="text-button" type="button" data-privacy>${escape(t.more)}</button></p></div><div class="consent-actions"><button type="button" id="consent-deny">${escape(t.deny)}</button><button type="button" id="consent-allow">${escape(t.allow)}</button></div></aside>
</body></html>`;
}

await writeFile(`${root}inflory/index.html`, page('en', true));
for (const key of Object.keys(locales)) {
  await mkdir(`${root}inflory/${key}`, {recursive:true});
  await writeFile(`${root}inflory/${key}/index.html`, page(key));
  for (const route of ['apply','thanks']) {
    await mkdir(`${root}inflory/${key}/${route}`, {recursive:true});
    await writeFile(`${root}inflory/${key}/${route}/index.html`, waitlistPage(key,route==='thanks'));
  }
}
// A project-scoped sitemap does not replace the parent site's SEO configuration.
const alternateXml = Object.entries(locales).map(([k,t])=>`<xhtml:link rel="alternate" hreflang="${t.lang}" href="${base}${k}/"/>`).join('')+`<xhtml:link rel="alternate" hreflang="x-default" href="${base}"/>`;
await writeFile(`${root}inflory/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${Object.keys(locales).map(k=>`<url><loc>${base}${k}/</loc>${alternateXml}</url>`).join('')}</urlset>\n`);
console.log('Built English fallback + 4 localized pages and sitemap.');
