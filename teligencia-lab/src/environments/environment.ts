/*
 * Production environment — Lab Portal (Feature 001).
 * Real values injected at deploy time. Publishable keys only;
 * never put secret keys or service-role keys in any frontend bundle.
 */
export const environment = {
  production: true,
  clerkPublishableKey: 'pk_live_<replace-at-deploy>',
  apiBaseUrl: 'https://api.teligencia.app/api/v1'
};
