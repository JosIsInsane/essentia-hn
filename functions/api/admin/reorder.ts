import type { Fn } from '../../../server/env';
import { json, readJson } from '../../../server/http';
import { audit } from '../../../server/session';
import { reorderSchema } from '../../../src/shared/schemas';

// Recibe los ids en el orden nuevo y guarda sort = posición.
export const onRequestPost: Fn = async ({ request, env }) => {
  const { kind, ids } = await readJson(request, reorderSchema);
  const table = kind === 'sections' ? 'sections' : kind === 'slides' ? 'hero_slides' : 'products'; // lista cerrada, no viene del usuario
  await env.DB.batch(ids.map((id, i) => env.DB.prepare(`UPDATE ${table} SET sort = ?2 WHERE id = ?1`).bind(id, i + 1)));
  await audit(env.DB, request, 'reorder', `${kind}: ${ids.join(',')}`);
  return json({ ok: true });
};
