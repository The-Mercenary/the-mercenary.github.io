import { config } from './config.js';

export const ready = /^G-[A-Z0-9]{6,20}$/.test(config.gaMeasurementId) && location.hostname === 'themercenary.org';
const key = 'inflory-analytics-consent-v1';
let choice;
try { choice = localStorage.getItem(key); } catch {}
let permitted = ready && choice === 'granted';
let loading;
let initialized = false;
let landingSent = false;
const readChoice = () => choice;
export { readChoice };
export const hasConsent = () => permitted;
const save = value => { choice = value; try { localStorage.setItem(key,value); } catch {} };
const safeLocation = () => {
  const url = new URL(location.origin + location.pathname);
  const source = new URLSearchParams(location.search);
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content']) {
    const value = source.get(key);
    if (value && /^[a-zA-Z0-9_-]{1,64}$/.test(value)) url.searchParams.set(key,value);
  }
  return url.href;
};
const safeReferrer = () => { try { return new URL(document.referrer).origin; } catch { return ''; } };
const shared = () => ({experiment_id:config.experimentId,experiment_version:config.experimentVersion,page_language:document.documentElement.dataset.locale});

async function load() {
  if (!ready || !permitted) throw new Error('Analytics unavailable or consent denied');
  if (initialized) return;
  if (loading) return loading;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
  window[`ga-disable-${config.gaMeasurementId}`] = false;
  window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  loading = new Promise((resolve,reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.gaMeasurementId}`;
    let finished = false;
    const fail = () => { if(finished)return; finished=true; clearTimeout(timer); script.remove(); loading=undefined; reject(new Error('Analytics load failed')); };
    const timer = setTimeout(fail,8000);
    script.onerror = fail;
    script.onload = () => {
      if(finished)return;
      if(!permitted){fail();return;}
      finished=true; clearTimeout(timer);
      window.gtag('js',new Date());
      window.gtag('consent','update',{analytics_storage:'granted'});
      window.gtag('config',config.gaMeasurementId,{
        send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,
        cookie_prefix:'inflory',cookie_path:'/inflory/',cookie_domain:'none',cookie_expires:5184000,
        page_location:safeLocation(),page_referrer:safeReferrer(),...shared()
      });
      initialized=true; resolve();
    };
    document.head.append(script);
  });
  return loading;
}

export async function grant() {
  if(!ready)throw new Error('Analytics not configured');
  permitted=true;save('granted');
  window[`ga-disable-${config.gaMeasurementId}`]=false;
  await load();
  if(!permitted)throw new Error('Consent withdrawn');
  window.gtag('consent','update',{analytics_storage:'granted'});
  if(!landingSent) {
    landingSent=true;
    track('page_view',{page_location:safeLocation(),page_referrer:safeReferrer()});
    track('landing_view');
  }
}

export function deny() {
  permitted=false;save('denied');
  if(ready)window[`ga-disable-${config.gaMeasurementId}`]=true;
  // Do not touch the corporate site's GA cookies or other projects' preferences.
  for(const entry of document.cookie.split(';')) {
    const name=entry.split('=')[0].trim();
    if(name.startsWith('inflory_')) document.cookie=`${name}=; Max-Age=0; Path=/inflory/; SameSite=Lax; Secure`;
  }
}

export function track(name, params={}) {
  if(!ready || !permitted || !initialized)return false;
  window.gtag('event',name,{...shared(),...params,send_to:config.gaMeasurementId});
  return true;
}

export async function submitInterest(params) {
  await grant();
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('No analytics delivery callback')),7000);
    track('interest_submit',{...params,event_callback:()=>{
      clearTimeout(timeout);
      if(permitted)resolve();else reject(new Error('Consent withdrawn'));
    }});
    // This callback means client-side processing completed, NOT durable storage.
    // A real waitlist requires its own consented, server-acknowledged database.
  });
}
