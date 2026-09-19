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
  await page.locator('[data-plan=rhythm]').click();await page.waitForURL('**/apply/?plan=rhythm');
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('input[value="101-300"]').isChecked(),true);
  assert.equal(await page.locator('#launch-consent').isChecked(),false);
  assert.equal(await page.locator('#application-submit').isDisabled(),true);
  assert.equal(await page.locator('#app-country option').count(),250);
  assert.equal(await page.locator('[data-platform]').count(),5);
  assert.equal(await page.locator('[name=monthly_followers]').count(),7);
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
  await p.locator('input[value="301-500"]').check();await p.locator('#privacy-agreed').check();
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
  assert.equal(post.get('monthly_followers'),'301-500');assert.equal(post.get('residence_country'),'KR');assert.equal(post.get('language'),locale);
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
  await p.goto(`${origin}/inflory/en/apply/`);await p.locator('#app-name').fill('QA');await p.locator('#app-email').fill('qa@example.com');await p.locator('#app-country').selectOption('US');await p.locator('#platform-picker summary').click();await p.locator('[data-platform=other]').check();await p.locator('input[value="3001+"]').check();await p.locator('#privacy-agreed').check();await p.locator('#application-submit').click();
  await p.waitForTimeout(300);assert.equal(count,1);assert.equal(p.url().includes('/thanks/'),false);await c.close();checks++;
 }
 {
  const c=await browser.newContext({locale:'ja-JP'}),p=await c.newPage();await p.goto(`${origin}/inflory/`);await p.waitForURL('**/inflory/ja/');await p.locator('[data-apply]').first().click();await p.waitForURL('**/ja/apply/');await p.selectOption('#application-language','zh-hans');await p.waitForURL('**/zh-hans/apply/');await c.close();checks++;
 }
 console.log(`PASS ${checks} scenarios. All submission requests mocked; zero applicant emails sent by QA.`);
}finally{await browser.close();server.close();}
