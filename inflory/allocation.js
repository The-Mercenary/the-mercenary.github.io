export const allocation = Object.freeze({min:10,max:3000,default:100,days:30});
export function parseFollowers(value) {
  if(typeof value!=='string' || !/^\d{1,4}$/.test(value))return null;
  const n=Number(value);
  return Number.isInteger(n)&&n>=allocation.min&&n<=allocation.max?n:null;
}
export function followersFromSearch(search) {
  const values=new URLSearchParams(search).getAll('followers');
  return values.length===1?parseFollowers(values[0]):null;
}
export function dailyAverage(n,locale) {
  return new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(n/allocation.days);
}
