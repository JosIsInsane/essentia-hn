// CSP de la tienda. Debe ser igual a la de "/*" en public/_headers (lo revisa tests/seo.test.ts).
// Cloudflare: Turnstile (anti-bots) y Web Analytics.
export const SITE_CSP =
  "default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'; upgrade-insecure-requests";
