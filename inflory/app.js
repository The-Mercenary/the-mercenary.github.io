import { config } from './config.js';
import * as analytics from './analytics.js';

const $ = selector => document.querySelector(selector);
const copy = JSON.parse($('#ui-copy').textContent);
const dialog = $('#interest-dialog');
const privacy = $('#privacy-dialog');
const form = $('#interest-form');
const status = $('#interest-status');
const submit = $('.submit-interest');
const banner = $('#consent-banner');
const sessionKey = `inflory-interest-${config.experimentVersion}`;
let submitted=false;
try { submitted=sessionStorage.getItem(sessionKey)==='sent'; } catch {}
let busy=false;
let placement='header';
let plansSeen=false;
const paramsFor = id => {
  const p=config.plans[id];
  return p?{plan_id:id,plan_price_usd:p.price,plan_quantity:p.followers,currency:'USD'}:{};
};
const update = () => {
  submit.disabled=!analytics.ready || busy || submitted;
  status.textContent=!analytics.ready?copy.pending:submitted?copy.duplicate:'';
};
update();

document.querySelectorAll('[data-open-interest]').forEach(button=>button.addEventListener('click',()=>{
  placement=button.dataset.placement;
  const id=button.dataset.plan;
  if(config.plans[id])form.elements.plan.value=id;
  form.elements.measurement_consent.checked=analytics.hasConsent();
  $('#interest-form-content').hidden=false;
  $('#interest-success').hidden=true;
  update();dialog.showModal();
  analytics.track('cta_click',{placement,...paramsFor(id)});
  if(id)analytics.track('select_plan',paramsFor(id));
  analytics.track('interest_open',{placement,...paramsFor(id)});
}));
document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
document.querySelectorAll('[data-privacy], #privacy-open').forEach(button=>button.addEventListener('click',()=>privacy.showModal()));
document.querySelectorAll('[data-close-privacy]').forEach(button=>button.addEventListener('click',()=>privacy.close()));
for(const modal of [dialog,privacy])modal.addEventListener('click',event=>{
  if(event.target!==modal)return;
  const box=modal.getBoundingClientRect();
  if(event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom)modal.close();
});
document.querySelectorAll('[data-track]').forEach(link=>link.addEventListener('click',()=>analytics.track('cta_click',{action:link.dataset.track,placement:link.dataset.placement})));
form.elements.plan.forEach(input=>input.addEventListener('change',()=>analytics.track('select_plan',paramsFor(input.value))));
document.querySelectorAll('[data-faq]').forEach(details=>details.addEventListener('toggle',()=>{
  if(details.open)analytics.track('faq_open',{faq_id:details.dataset.faq});
}));

function observePlans() {
  const rect=$('#plans').getBoundingClientRect();
  if(rect.top<innerHeight && rect.bottom>0 && !plansSeen)plansSeen=analytics.track('view_plans');
}
const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)observePlans();},{threshold:0});
observer.observe($('#plans'));
async function enable() {
  banner.hidden=true;
  await analytics.grant();observePlans();
}
if(analytics.ready) {
  if(analytics.readChoice()==='granted')enable().catch(()=>{});
  else if(analytics.readChoice()!=='denied')banner.hidden=false;
}
$('#consent-allow').addEventListener('click',()=>enable().catch(()=>{banner.hidden=false;}));
$('#consent-deny').addEventListener('click',()=>{analytics.deny();banner.hidden=true;form.elements.measurement_consent.checked=false;});
$('#analytics-settings').addEventListener('click',()=>{
  if(analytics.ready)banner.hidden=false;
  else {privacy.showModal();}
});

form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!analytics.ready || busy || submitted)return;
  if(!form.reportValidity())return;
  const data=new FormData(form), id=data.get('plan'), platform=data.get('platform');
  if(!Object.hasOwn(config.plans,id) || !['instagram','youtube','tiktok'].includes(platform)){status.textContent=copy.invalid;return;}
  if(!data.has('measurement_consent')){status.textContent=copy.consentRequired;return;}
  busy=true;submit.disabled=true;status.textContent=copy.sending;banner.hidden=true;
  try {
    await analytics.grant();observePlans();
    // When consent was given inside the form, record the currently observable state,
    // not a fabricated earlier click or pre-consent browsing history.
    analytics.track('interest_form_ready',{placement,...paramsFor(id)});
    await analytics.submitInterest({...paramsFor(id),platform,refill_interest:data.has('refill')?'yes':'no',placement});
    submitted=true;
    try {sessionStorage.setItem(sessionKey,'sent');} catch {}
    $('#interest-form-content').hidden=true;
    $('#interest-success').hidden=false;
    $('#success-detail').textContent=copy.successDetail.replace('{plan}',config.plans[id].name).replace('{platform}',form.elements.platform.selectedOptions[0].textContent);
    $('#interest-success button').focus();
  } catch {status.textContent=copy.error;}
  finally {busy=false;submit.disabled=submitted || !analytics.ready;}
});

function languageUrl(language) {
  const url=new URL(`/inflory/${language}/`,location.origin);
  const source=new URLSearchParams(location.search);
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content']) {
    const value=source.get(key);
    if(value && /^[a-zA-Z0-9_-]{1,64}$/.test(value))url.searchParams.set(key,value);
  }
  if(['#plans','#about'].includes(location.hash))url.hash=location.hash;
  return url;
}
const changeLanguage=language=>{
  try{localStorage.setItem('inflory-language',language);}catch{}
  analytics.track('language_change',{to_language:language});
  location.assign(languageUrl(language));
};
$('#language-select').addEventListener('change',event=>changeLanguage(event.target.value));
document.querySelectorAll('[data-language]').forEach(link=>{
  link.href=languageUrl(link.dataset.language).href;
  link.addEventListener('click',event=>{
    if(event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    event.preventDefault();changeLanguage(link.dataset.language);
  });
});
