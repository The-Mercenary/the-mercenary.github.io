import { config } from './config.js';
import * as analytics from './analytics.js';
const $=selector=>document.querySelector(selector);
const privacy=$('#privacy-dialog'),banner=$('#consent-banner');
let plansSeen=false;
document.querySelectorAll('[data-apply]').forEach(link=>link.addEventListener('click',()=>{
  const id=link.dataset.plan,p=config.plans[id];
  analytics.track('cta_click',{placement:link.dataset.placement,...(p?{plan_id:id,plan_price_usd:p.price,plan_quantity:p.followers,currency:'USD'}:{})});
}));
document.querySelectorAll('[data-privacy], #privacy-open').forEach(button=>button.addEventListener('click',()=>privacy.showModal()));
document.querySelectorAll('[data-close-privacy]').forEach(button=>button.addEventListener('click',()=>privacy.close()));
privacy.addEventListener('click',event=>{
  const box=privacy.getBoundingClientRect();
  if(event.target===privacy && (event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom))privacy.close();
});
document.querySelectorAll('[data-track]').forEach(link=>link.addEventListener('click',()=>analytics.track('cta_click',{action:link.dataset.track,placement:link.dataset.placement})));
document.querySelectorAll('[data-faq]').forEach(details=>details.addEventListener('toggle',()=>{if(details.open)analytics.track('faq_open',{faq_id:details.dataset.faq});}));
function observePlans(){const rect=$('#plans').getBoundingClientRect();if(rect.top<innerHeight && rect.bottom>0 && !plansSeen)plansSeen=analytics.track('view_plans');}
const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)observePlans();});observer.observe($('#plans'));
async function enable(){banner.hidden=true;await analytics.grant();observePlans();}
if(analytics.ready){if(analytics.readChoice()==='granted')enable().catch(()=>{});else if(analytics.readChoice()!=='denied')banner.hidden=false;}
$('#consent-allow').addEventListener('click',()=>enable().catch(()=>{banner.hidden=false;}));
$('#consent-deny').addEventListener('click',()=>{analytics.deny();banner.hidden=true;});
$('#analytics-settings').addEventListener('click',()=>{if(analytics.ready)banner.hidden=false;else privacy.showModal();});
function languageUrl(language){
  const url=new URL('/inflory/'+language+'/',location.origin),source=new URLSearchParams(location.search);
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content']){const value=source.get(key);if(value && /^[a-zA-Z0-9_-]{1,64}$/.test(value))url.searchParams.set(key,value);}
  if(['#plans','#about'].includes(location.hash))url.hash=location.hash;
  return url;
}
function changeLanguage(language){try{localStorage.setItem('inflory-language',language);}catch{}analytics.track('language_change',{to_language:language});location.assign(languageUrl(language));}
$('#language-select').addEventListener('change',event=>changeLanguage(event.target.value));
document.querySelectorAll('[data-language]').forEach(link=>{
  link.href=languageUrl(link.dataset.language).href;
  link.addEventListener('click',event=>{if(event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();changeLanguage(link.dataset.language);});
});
