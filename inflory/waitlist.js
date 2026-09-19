// Intentionally no analytics import: never send application data to GA or storage.
const copy=JSON.parse(document.getElementById('form-copy').textContent);
const locale=document.documentElement.dataset.locale;
const selector=document.getElementById('application-language');
selector.addEventListener('change',()=>{
  const language=selector.value;
  if(!['en','ko','ja','zh-hans'].includes(language))return;
  try{localStorage.setItem('inflory-language',language);}catch{}
  const route=location.pathname.includes('/thanks/')?'thanks':'apply';
  const target=new URL(`/inflory/${language}/${route}/`,location.origin);
  const plan=new URLSearchParams(location.search).get('plan');
  if(['start','rhythm','presence'].includes(plan))target.searchParams.set('plan',plan);
  location.assign(target);
});
const form=document.getElementById('application-form');
if(form) {
  const name=form.elements.namedItem('name'),email=form.elements.namedItem('email'),country=form.elements.namedItem('residence_country');
  const platforms=[...form.querySelectorAll('[data-platform]')];
  const quantity=[...form.querySelectorAll('[name=monthly_followers]')];
  const privacy=document.getElementById('privacy-agreed');
  const optin=document.getElementById('launch-consent');
  const button=document.getElementById('application-submit');
  const status=document.getElementById('application-status');
  const picker=document.getElementById('platform-picker');
  let sending=false;
  const touched=new Set();
  const ids=new Map([[name,'name'],[email,'email'],[country,'country'],[privacy,'privacy'],...platforms.map(p=>[p,'platforms']),...quantity.map(q=>[q,'quantity'])]);
  function validate(showAll=false) {
    const nameOk=name.value.trim().length>=1 && name.value.trim().length<=80 && !/[<>\u0000-\u001f\u007f]/u.test(name.value);
    const emailOk=email.value.trim().length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    const selected=platforms.filter(input=>input.checked);
    const errors={name:!nameOk,email:!emailOk,country:!country.value || ![...country.options].some(o=>o.value===country.value),platforms:!selected.length,quantity:!quantity.some(q=>q.checked),privacy:!privacy.checked};
    name.setCustomValidity(errors.name?copy.errors.name:'');
    email.setCustomValidity(errors.email?copy.errors.email:'');
    country.setCustomValidity(errors.country?copy.errors.country:'');
    platforms[0].setCustomValidity(errors.platforms?copy.errors.platforms:'');
    quantity[0].setCustomValidity(errors.quantity?copy.errors.quantity:'');
    privacy.setCustomValidity(errors.privacy?copy.errors.privacy:'');
    for(const [id,invalid] of Object.entries(errors)){
      document.getElementById(`${id}-error`).textContent=invalid&&(showAll||touched.has(id))?copy.errors[id]:'';
      for(const [element,group] of ids)if(group===id)element.setAttribute('aria-invalid',String(invalid&&(showAll||touched.has(id))));
    }
    document.getElementById('platform-count').textContent=selected.length?copy.selected.replace('{count}',selected.length):copy.platformPlaceholder;
    const valid=!Object.values(errors).some(Boolean) && form.checkValidity();
    button.disabled=!valid || sending;
    status.textContent=sending?copy.sending:valid?'':copy.errors.summary;
    return valid;
  }
  form.noValidate=true; // Localized field errors replace browser-language popups.
  form.addEventListener('input',event=>{if(ids.has(event.target))touched.add(ids.get(event.target));validate();});
  form.addEventListener('change',event=>{if(ids.has(event.target))touched.add(ids.get(event.target));validate();});
  form.addEventListener('focusout',event=>{if(ids.has(event.target))touched.add(ids.get(event.target));validate();});
  const plan=new URLSearchParams(location.search).get('plan');
  if(['start','rhythm','presence'].includes(plan)){
    form.elements.selected_plan.value=plan;
    form.elements.monthly_followers.value={start:'51-100',rhythm:'101-300',presence:'501-1000'}[plan];
  }
  form.addEventListener('submit',event=>{
    if(sending){event.preventDefault();return;}
    if(!validate(true)){
      event.preventDefault();
      if(!platforms.some(p=>p.checked))picker.open=true;
      form.querySelector('[aria-invalid=true]')?.focus();return;
    }
    if(form.elements._honey.value){event.preventDefault();return;}
    name.value=name.value.trim();email.value=email.value.trim();
    const now=new Date(),review=new Date(now);review.setUTCFullYear(review.getUTCFullYear()+1);
    form.elements.submitted_at_utc.value=now.toISOString();form.elements.retention_review_due.value=review.toISOString();
    form.elements.launch_email_consent.value=optin.checked?'yes':'no';
    form.elements.residence_country_label.value=country.selectedOptions[0].textContent;
    sending=true;validate();
    // Native HTTPS POST preserves provider reCAPTCHA. No _captcha=false or autoresponse.
    // Do not mark submission complete before the provider's own confirmation.
  });
  window.addEventListener('pageshow',()=>{sending=false;validate();});
  validate();
}
