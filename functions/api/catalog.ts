import type { Fn } from '../../server/env';
import { json } from '../../server/http';
import { loadPublicCatalog } from '../../server/catalog';

export const onRequestGet: Fn = async ({ env }) => {
  const catalog = await loadPublicCatalog(env.DB, env);
  // Caché corto: los cambios del admin se ven en un minuto o menos.
  return json(catalog, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
};
