/* Only the neutral entry URL negotiates language; localized URLs never redirect. */
(() => {
  const allowed = ['en', 'ko', 'ja', 'zh-hans'];
  let selected;
  try { selected = localStorage.getItem('inflory-language'); } catch {}
  const normalize = language => {
    const tag = language.toLowerCase();
    if (tag.startsWith('ko')) return 'ko';
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('zh')) return 'zh-hans';
    if (tag.startsWith('en')) return 'en';
    return null;
  };
  if (!allowed.includes(selected)) selected = (navigator.languages || [navigator.language]).map(normalize).find(Boolean) || 'en';
  const url = new URL(`/inflory/${selected}/`, location.origin);
  const params = new URLSearchParams(location.search);
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content']) {
    const value = params.get(key);
    if (value && /^[a-zA-Z0-9_-]{1,64}$/.test(value)) url.searchParams.set(key,value);
  }
  const counts=params.getAll('followers');
  if(counts.length===1 && /^\d{1,4}$/.test(counts[0]) && Number(counts[0])>=10 && Number(counts[0])<=3000)url.searchParams.set('followers',String(Number(counts[0])));
  if (['#plans','#allocation','#about'].includes(location.hash)) url.hash=location.hash;
  location.replace(url.href);
})();
