import type { Catalog } from '../src/shared/types';
import { loadPublicCatalog } from './catalog';
import type { Env } from './env';
import { SITE_URL } from '../src/shared/seo';

// Caché en el borde de Cloudflare: los cambios del admin se ven en un minuto o menos.
const TTL = 60;
// La llave debe ser del mismo dominio para que Cloudflare la guarde; nunca se pide como página.
const KEY = `${SITE_URL}/__cache/catalog-v1`;

/** Catálogo público, leído de la caché de Cloudflare o de la base. */
export async function cachedCatalog(env: Env, waitUntil: (p: Promise<unknown>) => void): Promise<Catalog> {
  const cache = caches.default;
  const hit = await cache.match(KEY);
  if (hit) return hit.json<Catalog>();
  const catalog = await loadPublicCatalog(env.DB, env);
  const res = new Response(JSON.stringify(catalog), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${TTL}` },
  });
  waitUntil(cache.put(KEY, res));
  return catalog;
}

/** Borra el catálogo de la caché (en el centro de datos de quien edita) para que el cambio se vea ya. */
export async function purgeCatalog(): Promise<void> {
  await caches.default.delete(KEY);
}
