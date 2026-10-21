import type { Fn } from '../../server/env';
import { json } from '../../server/http';
import { cachedCatalog } from '../../server/catalog-cache';

export const onRequestGet: Fn = async ({ env, waitUntil }) => {
  const catalog = await cachedCatalog(env, waitUntil);
  // Caché corto: los cambios del admin se ven en un minuto o menos.
  return json(catalog, { headers: { 'Cache-Control': 'public, max-age=30' } });
};
