import { allocation, followersFromSearch, dailyAverage } from './allocation.js';
import * as analytics from './analytics.js';
const $=selector=>document.querySelector(selector);
const privacy=$('#privacy-dialog'),banner=$('#consent-banner');
let allocationSeen=false;
const slider=$('#monthly-allocation');
slider.value=followersFromSearch(location.search)??allocation.default;
function renderAllocation(){
  const n=Number(slider.value),lang=document.documentElement.lang;
  $('#monthly-total').textContent=new Intl.NumberFormat(lang).format(n);
  $('#daily-total').textContent=dailyAverage(n,lang);
  slider.setAttribute('aria-valuetext',n+' · '+$('#allocation-formula').textContent+': '+dailyAverage(n,lang));
  $('#allocation-cta').href='/inflory/'+document.documentElement.dataset.locale+'/apply/?followers='+n;
  document.querySelectorAll('[data-language]').forEach(link=>link.href=languageUrl(link.dataset.language));
}
slider.addEventListener('input',renderAllocation);
slider.addEventListener('change',()=>{
  const url=languageUrl(document.documentElement.dataset.locale);url.hash=location.hash;history.replaceState(null,'',url);
  analytics.track('select_quantity',{monthly_followers:Number(slider.value)});
});
window.addEventListener('pageshow',renderAllocation);
document.querySelectorAll('[data-apply]').forEach(link=>link.addEventListener('click',()=>{
  analytics.track('cta_click',{placement:link.dataset.placement,monthly_followers:Number(slider.value)});
}));
document.querySelectorAll('[data-privacy], #privacy-open').forEach(button=>button.addEventListener('click',()=>privacy.showModal()));
document.querySelectorAll('[data-close-privacy]').forEach(button=>button.addEventListener('click',()=>privacy.close()));
privacy.addEventListener('click',event=>{
  const box=privacy.getBoundingClientRect();
  if(event.target===privacy && (event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom))privacy.close();
});
document.querySelectorAll('[data-track]').forEach(link=>link.addEventListener('click',()=>analytics.track('cta_click',{action:link.dataset.track,placement:link.dataset.placement})));
document.querySelectorAll('[data-faq]').forEach(details=>details.addEventListener('toggle',()=>{if(details.open)analytics.track('faq_open',{faq_id:details.dataset.faq});}));
function observeAllocation(){const rect=$('#allocation').getBoundingClientRect();if(rect.top<innerHeight && rect.bottom>0 && !allocationSeen)allocationSeen=analytics.track('view_allocation');}
const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)observeAllocation();});observer.observe($('#allocation'));
async function enable(){banner.hidden=true;await analytics.grant();observeAllocation();}
if(analytics.ready){if(analytics.readChoice()==='granted')enable().catch(()=>{});else if(analytics.readChoice()!=='denied')banner.hidden=false;}
$('#consent-allow').addEventListener('click',()=>enable().catch(()=>{banner.hidden=false;}));
$('#consent-deny').addEventListener('click',()=>{analytics.deny();banner.hidden=true;});
$('#analytics-settings').addEventListener('click',()=>{if(analytics.ready)banner.hidden=false;else privacy.showModal();});
function languageUrl(language){
  const url=new URL('/inflory/'+language+'/',location.origin),source=new URLSearchParams(location.search);
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content']){const value=source.get(key);if(value && /^[a-zA-Z0-9_-]{1,64}$/.test(value))url.searchParams.set(key,value);}
  url.searchParams.set('followers',slider.value);
  if(['#plans','#allocation','#about'].includes(location.hash))url.hash=location.hash;
  return url;
}
function changeLanguage(language){try{localStorage.setItem('inflory-language',language);}catch{}analytics.track('language_change',{to_language:language});location.assign(languageUrl(language));}
$('#language-select').addEventListener('change',event=>changeLanguage(event.target.value));
document.querySelectorAll('[data-language]').forEach(link=>{
  link.href=languageUrl(link.dataset.language).href;
  link.addEventListener('click',event=>{if(event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();changeLanguage(link.dataset.language);});
});

renderAllocation();
