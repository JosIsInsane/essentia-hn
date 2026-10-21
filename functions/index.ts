import type { Fn } from '../server/env';
import { cachedCatalog } from '../server/catalog-cache';
import { SITE_CSP } from '../server/site-headers';
import { scriptJson, structuredData } from '../src/shared/seo';

const CANONICAL_HOST = 'essentiahn.com';

/**
 * La tienda (/): mete el catálogo y los datos para Google dentro del HTML.
 * Así la página no espera a /api/catalog y Google ve los productos aunque no pueda leer /api.
 * Si algo falla, entrega la página normal y el navegador pide el catálogo como antes.
 */
export const onRequest: Fn = async ({ request, env, next, waitUntil }) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();
  const url = new URL(request.url);
  if (url.hostname === `www.${CANONICAL_HOST}`) {
    url.hostname = CANONICAL_HOST;
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  const page = await env.ASSETS.fetch(new URL('/', url));
  const headers = new Headers(page.headers);
  // Las cabeceras de public/_headers no aplican a respuestas de funciones: se ponen aquí.
  headers.set('Content-Security-Policy', SITE_CSP);
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.delete('ETag');
  if (!page.ok || !(headers.get('Content-Type') ?? '').includes('text/html')) return page;

  let data = '';
  try {
    const catalog = await cachedCatalog(env, waitUntil);
    data =
      `<script type="application/ld+json">${scriptJson(structuredData(catalog))}</script>` +
      `<script type="application/json" id="catalog-data">${scriptJson(catalog)}</script>`;
  } catch (e) {
    console.error('catalog inline', e instanceof Error ? e.stack : e);
  }

  const res = new Response(page.body, { status: page.status, headers });
  if (!data) return res;
  return new HTMLRewriter().on('head', { element: (el) => { el.append(data, { html: true }); } }).transform(res);
};
