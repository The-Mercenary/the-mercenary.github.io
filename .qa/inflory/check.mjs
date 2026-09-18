import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root=fileURLToPath(new URL('../../',import.meta.url));
const shots=resolve(root,'.qa/inflory/screenshots');
await mkdir(shots,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.xml':'application/xml'};
const server=createServer(async(req,res)=>{
  try {
    let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root))throw new Error('Invalid path');
    if((await stat(file)).isDirectory())file=resolve(file,'index.html');
    res.writeHead(200,{'Content-Type':types[extname(file)]||'text/plain'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/snap/bin/chromium',headless:true,args:['--no-sandbox']});
let checks=0;
try {
  const ctx=await browser.newContext({reducedMotion:'reduce'});
  const errors=[];
  const page=await ctx.newPage();page.on('pageerror',error=>errors.push(error.message));
  for(const locale of ['en','ko','ja','zh-hans'])for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:960});
    await page.goto(`${origin}/inflory/${locale}/`);
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('link[hreflang]').count(),5);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),`https://themercenary.org/inflory/${locale}/`);
    const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0 && (r.right>innerWidth+1 || r.left < -1) && getComputedStyle(e).position!=='fixed';}).map(e=>`${e.tagName}.${e.className}`)}));
    assert.ok(overflow.scroll<=width,`${locale}/${width}: ${JSON.stringify(overflow)}`);
    await page.locator('[data-plan="rhythm"]').click();
    assert.equal(await page.locator('input[value=rhythm]').isChecked(),true);
    assert.equal(await page.locator('.submit-interest').isDisabled(),true);
    assert.equal(await page.locator('#interest-success').isVisible(),false);
    assert.ok(await page.locator('#interest-status').textContent());
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#interest-dialog').isVisible(),false);
    if(width===390 || width===1440) {
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:`${shots}/${locale}-${width}.png`,fullPage:true});
      if(locale==='en')await page.screenshot({path:`${shots}/en-${width}-hero.png`});
    }
    checks++;console.log(`PASS ${locale} ${width}px, SEO + pending CTA + no overflow`);
  }
  assert.deepEqual(errors,[]);
  for(const [locale,expected] of [['ko-KR','ko'],['ja-JP','ja'],['zh-TW','zh-hans'],['de-DE','en']]) {
    const lc=await browser.newContext({locale});const p=await lc.newPage();
    await p.goto(`${origin}/inflory/?utm_source=qa&email=private@example.com#plans`);
    await p.waitForURL(`**/inflory/${expected}/?utm_source=qa#plans`);
    await p.selectOption('#language-select','en');await p.waitForURL('**/inflory/en/?utm_source=qa#plans');
    await p.goto(`${origin}/inflory/`);await p.waitForURL('**/inflory/en/');
    await lc.close();checks++;
  }
  console.log('PASS locale negotiation, explicit preference, safe campaign parameters');
  // Produce original type-and-calendar Open Graph artwork, not an AI stock image.
  await page.setViewportSize({width:1200,height:630});await page.goto(`${origin}/inflory/en/`);
  await page.setContent(`<html><head><link rel="stylesheet" href="${origin}/inflory/style.css"><style>body{width:1200px;height:630px;padding:65px 80px;display:flex;justify-content:space-between;align-items:center;overflow:hidden}.og-brand{font-weight:750;font-size:35px;letter-spacing:-2px;margin-bottom:54px}h1{font-size:96px;margin-bottom:25px}p{font-size:18px;color:#626c61}.og-art{width:365px;height:455px;background:#e7ece0;border:1px solid #c8d2c0;padding:32px;transform:rotate(3deg)}.og-top{font-size:11px;letter-spacing:2px;border-bottom:1px solid #b8c8af;padding-bottom:22px}.og-number{font:140px Georgia;margin:28px 0 10px;letter-spacing:-8px}.og-dots{display:grid;grid-template-columns:repeat(7,1fr);gap:13px}.og-dots i{width:22px;height:22px;border-radius:50%;background:#c2d0b7}.og-dots i:nth-child(4n){background:#123f33}.og-bottom{font-size:11px;letter-spacing:2px;margin-top:26px}</style></head><body><div><div class="og-brand">inflory.</div><h1>Influence,<br><span class="serif-word" style="font-family:Georgia;font-style:italic">in rhythm.</span></h1><p>A little, throughout the month.</p><p style="font-size:11px;letter-spacing:2px;margin-top:37px">MONTHLY PLANS · PRE-LAUNCH CONCEPT</p></div><div class="og-art"><div class="og-top">THE MONTHLY EDITION</div><div class="og-number">30<span style="font:12px sans-serif;letter-spacing:2px"> DAYS</span></div><div class="og-dots">${'<i></i>'.repeat(28)}</div><div class="og-bottom">INFLUENCE × DELIVERY</div></div></body></html>`);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:resolve(root,'inflory/assets/og.png')});
  await ctx.close();

  // Production-origin simulation with ALL requests intercepted. No live GA hits.
  async function mock(mode='success') {
    const ctx=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});
    const external=[];
    await ctx.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.hostname==='themercenary.org') {
        const response=await ctx.request.get(origin+url.pathname+url.search);
        let body=await response.body();
        if(url.pathname.endsWith('/config.js'))body=Buffer.from(body.toString().replace("gaMeasurementId: ''","gaMeasurementId: 'G-TESTONLY00'"));
        await route.fulfill({response,body});
      }else if(url.hostname==='www.googletagmanager.com') {
        external.push(url.href);
        if(mode==='blocked')await route.abort('blockedbyclient');
        else await route.fulfill({contentType:'text/javascript',body:`window.__events=[];window.gtag=function(...args){window.__events.push(args);if(args[0]==='event'&&args[2]?.event_callback)${mode==='timeout'?'void 0':'setTimeout(args[2].event_callback,30)'};};`});
      } else {external.push(url.href);await route.abort();}
    });
    const page=await ctx.newPage();await page.goto('https://themercenary.org/inflory/en/?utm_source=qa&email=private@example.com');
    return {ctx,page,external};
  }
  {
    const {ctx,page,external}=await mock();
    assert.equal(external.length,0,'No network to Google before consent');
    await page.locator('#consent-deny').click();
    await page.locator('[data-plan=rhythm]').click();
    assert.equal(external.length,0);
    await page.locator('input[name=measurement_consent]').check();
    await page.locator('.submit-interest').click();
    await page.locator('#interest-success').waitFor({state:'visible'});
    assert.equal(external.length,1);
    let events=await page.evaluate(()=>window.__events);
    assert.equal(events.filter(e=>e[1]==='interest_submit').length,1);
    assert.equal(events.find(e=>e[1]==='interest_submit')[2].plan_id,'rhythm');
    assert.equal(events.filter(e=>e[1]==='page_view').length,1);
    assert.equal(JSON.stringify(events).includes('private@example.com'),false);
    assert.equal(events.filter(e=>e[1]==='cta_click').length,0,'No backfilled pre-consent events');
    await page.locator('#interest-success button').click();
    await page.locator('[data-plan=start]').click();assert.equal(await page.locator('.submit-interest').isDisabled(),true);
    await page.keyboard.press('Escape');
    await page.locator('#analytics-settings').click();await page.locator('#consent-deny').click();
    const count=await page.evaluate(()=>window.__events.length);
    await page.locator('[data-plan=presence]').click();
    assert.equal(await page.evaluate(()=>window.__events.length),count,'No events after withdrawal');
    await ctx.close();checks++;
  }
  for(const mode of ['blocked','timeout']) {
    const {ctx,page}=await mock(mode);
    await page.locator('#consent-deny').click();await page.locator('[data-plan=start]').click();
    await page.locator('input[name=measurement_consent]').check();await page.locator('.submit-interest').click();
    await page.waitForFunction(()=>!document.querySelector('.submit-interest').disabled,{},{timeout:15000});
    assert.equal(await page.locator('#interest-success').isVisible(),false);
    assert.match(await page.locator('#interest-status').textContent(),/connect|connection|try again|complete/i);
    await ctx.close();checks++;
  }
  console.log(`PASS ${checks} scenarios; consent gating, anonymous interest, no false success, duplicate suppression, withdrawal, blocked/timeout. No real GA calls.`);
}finally {await browser.close();server.close();}
