import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile,stat,mkdir } from 'node:fs/promises';
import { resolve,extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../',import.meta.url));
const shots=resolve(root,'.qa/inflory/screenshots');await mkdir(shots,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'};
const server=createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root))throw Error();if((await stat(file)).isDirectory())file=resolve(file,'index.html');res.writeHead(200,{'Content-Type':types[extname(file)]||'text/plain'});res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/snap/bin/chromium',headless:true,args:['--no-sandbox']});
let checks=0;
try{
 const ctx=await browser.newContext({reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 await ctx.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();external.push(route.request().url());return route.abort();});
 for(const locale of ['en','ko','ja','zh-hans'])for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:960});await page.goto(`${origin}/inflory/${locale}/`);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('link[hreflang]').count(),5);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.locator('#interest-dialog').count(),0);
  assert.equal(await page.locator('[data-plan-card],.plan-price').count(),0);
  assert.equal(await page.locator('[data-apply]').count(),1);
  assert.equal(await page.locator('#monthly-allocation').inputValue(),'100');
  assert.equal(await page.locator('#daily-total').textContent(),'3.33');
  await page.locator('#monthly-allocation').focus();
  await page.keyboard.press('Home');assert.equal(await page.locator('#monthly-allocation').inputValue(),'10');
  assert.equal(await page.locator('#daily-total').textContent(),'0.33');
  await page.keyboard.press('End');assert.equal(await page.locator('#monthly-allocation').inputValue(),'3000');
  assert.equal(await page.locator('#daily-total').textContent(),'100');
  await page.locator('#monthly-allocation').evaluate(el=>{el.value='237';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await page.locator('#daily-total').textContent(),'7.9');
  if(width===390||width===1440)await page.locator('#allocation').screenshot({path:`${shots}/allocation-${locale}-${width}.png`});
  await page.locator('#allocation-cta').click();await page.waitForURL('**/apply/?followers=237');
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('#app-quantity').inputValue(),'237');
  assert.equal(await page.locator('#launch-consent').isChecked(),false);
  assert.equal(await page.locator('#application-submit').isDisabled(),true);
  assert.equal(await page.locator('#app-country option').count(),250);
  assert.equal(await page.locator('[data-platform]').count(),5);
  assert.equal(await page.locator('[name=monthly_followers]').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${locale}/${width} overflow`);
  if(width===390||width===1440)await page.screenshot({path:`${shots}/apply-${locale}-${width}.png`,fullPage:true});
  checks++;console.log(`PASS ${locale}/${width}: landing → application, country list, defaults, responsive`);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[],'No third-party requests before submission');
 await ctx.close();
 for(const locale of ['en','ko','ja','zh-hans'])for(const optin of [false,true]){
  const context=await browser.newContext({reducedMotion:'reduce'}),p=await context.newPage();let post;
  await context.route('https://formsubmit.co/**',async route=>{
    assert.equal(route.request().method(),'POST');
    post=new URLSearchParams(route.request().postData());
    await route.fulfill({status:303,headers:{Location:`${origin}/inflory/${locale}/thanks/`},body:''});
  });
  await p.goto(`${origin}/inflory/${locale}/apply/`);
  await p.locator('#app-name').fill(' ');await p.locator('#app-email').fill('invalid');await p.locator('#app-country').selectOption('KR');
  assert.equal(await p.locator('#application-submit').isDisabled(),true);
  assert.ok(await p.locator('#name-error').textContent());assert.ok(await p.locator('#email-error').textContent());
  await p.locator('#app-name').fill('QA 다국어 テスト 测试');await p.locator('#app-email').fill('qa@example.com');
  await p.locator('#app-quantity').fill('237');await p.locator('#privacy-agreed').check();
  assert.equal(await p.locator('#application-submit').isDisabled(),true,'Platform is required');
  await p.locator('#platform-picker summary').click();
  await p.locator('[data-platform=instagram]').check();await p.locator('[data-platform=youtube]').check();
  assert.equal(await p.locator('#application-submit').isDisabled(),false,'Opt-in must NOT be required');
  await p.locator('#privacy-agreed').uncheck();assert.equal(await p.locator('#application-submit').isDisabled(),true);
  await p.locator('#privacy-agreed').check();
  if(optin)await p.locator('#launch-consent').check();
  await p.locator('#application-submit').click();await p.waitForURL('**/thanks/');
  assert.equal(post.get('launch_email_consent'),optin?'yes':'no');
  assert.equal(post.get('platform_instagram'),'yes');assert.equal(post.get('platform_youtube'),'yes');assert.equal(post.has('platform_x'),false);
  assert.equal(post.get('monthly_followers'),'237');assert.equal(post.get('residence_country'),'KR');assert.equal(post.get('language'),locale);
  assert.equal(post.get('privacy_acknowledged'),'yes');assert.equal(post.get('_next'),`https://themercenary.org/inflory/${locale}/thanks/`);
  assert.equal(post.has('_captcha'),false,'Keep provider CAPTCHA enabled');assert.equal(post.has('_autoresponse'),false,'Do not email applicant automatically');
  assert.ok(post.get('submitted_at_utc'));assert.ok(post.get('retention_review_due'));assert.ok(post.get('launch_consent_text'));assert.ok(post.get('privacy_notice_text'));
  assert.equal(await p.locator('meta[name=robots]').getAttribute('content'),'noindex,follow');
  assert.equal(await p.evaluate(()=>Object.values({...localStorage,...sessionStorage}).some(v=>v.includes('qa@example.com'))),false);
  await context.close();checks++;
 }
 // No success screen is rendered locally when the provider/network fails.
 {
  const c=await browser.newContext(),p=await c.newPage();let count=0;
  await c.route('https://formsubmit.co/**',r=>{count++;return r.abort('failed');});
  await p.goto(`${origin}/inflory/en/apply/`);await p.locator('#app-name').fill('QA');await p.locator('#app-email').fill('qa@example.com');await p.locator('#app-country').selectOption('US');await p.locator('#platform-picker summary').click();await p.locator('[data-platform=other]').check();await p.locator('#app-quantity').fill('3000');await p.locator('#privacy-agreed').check();await p.locator('#application-submit').click();
  await p.waitForTimeout(300);assert.equal(count,1);assert.equal(p.url().includes('/thanks/'),false);await c.close();checks++;
 }
 {
  const c=await browser.newContext({locale:'ja-JP'}),p=await c.newPage();await p.goto(`${origin}/inflory/`);await p.waitForURL('**/inflory/ja/');await p.locator('[data-apply]').first().click();await p.waitForURL('**/ja/apply/?followers=100');await p.selectOption('#application-language','zh-hans');await p.waitForURL('**/zh-hans/apply/?followers=100');await c.close();checks++;
 }
 // Strict query parsing, exact handoff, invalid edits and back/language continuity.
 {
  const c=await browser.newContext({reducedMotion:'reduce'}),p=await c.newPage();
  for(const value of ['9','3001','-10','100.5','1e3','NaN','100&followers=200']){
    await p.goto(origin+'/inflory/en/apply/?followers='+value);
    assert.equal(await p.locator('#app-quantity').inputValue(),'100','bad query defaults safely: '+value);
    checks++;
  }
  for(const n of [10,100,237,3000]){
    await p.goto(origin+'/inflory/en/?followers='+n);
    assert.equal(await p.locator('#monthly-allocation').inputValue(),String(n));
    await p.selectOption('#language-select','ko');await p.waitForURL('**/ko/?followers='+n);
    await p.locator('#allocation-cta').click();await p.waitForURL('**/apply/?followers='+n);
    assert.equal(await p.locator('#app-quantity').inputValue(),String(n));
    await p.locator('#app-quantity').fill(String(n===3000?2999:n+1));
    await p.selectOption('#application-language','ja');await p.waitForURL('**/ja/apply/?followers='+(n===3000?2999:n+1));
    assert.equal(await p.locator('#app-quantity').inputValue(),String(n===3000?2999:n+1));
    await p.locator('[data-return-allocation]').click();await p.waitForURL('**/ja/?followers='+(n===3000?2999:n+1)+'#allocation');
    checks++;
  }
  await p.goto(origin+'/inflory/en/apply/?followers=237');
  for(const bad of ['','9','3001','23.7']){
    await p.locator('#app-quantity').fill(bad);
    assert.equal(await p.locator('#application-submit').isDisabled(),true);
    assert.ok(await p.locator('#quantity-error').textContent());
    checks++;
  }
  await p.locator('#application-range').focus();await p.keyboard.press('End');
  assert.equal(await p.locator('#app-quantity').inputValue(),'3000');
  assert.equal(await p.locator('#application-daily').textContent(),'100');
  await p.goto(origin+'/inflory/en/?followers=237');await p.locator('#allocation-cta').click();await p.goBack();
  assert.equal(await p.locator('#monthly-allocation').inputValue(),'237');
  checks++;await c.close();
 }
 console.log(`PASS ${checks} scenarios. All submission requests mocked; zero applicant emails sent by QA.`);
}finally{await browser.close();server.close();}
