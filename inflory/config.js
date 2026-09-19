// Public configuration only. Never put an API secret or a Google access token here.
export const config = Object.freeze({
  gaMeasurementId: '',
  canonicalUrl: 'https://themercenary.org/inflory/',
  experimentId: 'inflory-prelaunch-2026-09',
  experimentVersion: 'v2-contact-application',
  plans: Object.freeze({
    start: { name: 'Start', price: 19, followers: 100 },
    rhythm: { name: 'Rhythm', price: 49, followers: 300 },
    presence: { name: 'Presence', price: 99, followers: 700 }
  })
});
