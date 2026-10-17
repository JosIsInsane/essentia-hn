import type { Fn } from '../../../../server/env';
import { HttpError, json, parseId, readJson } from '../../../../server/http';
import { checkProduct } from '../../../../server/admin';
import { audit } from '../../../../server/session';
import { slideSchema } from '../../../../src/shared/schemas';

export const onRequestPut: Fn<'id'> = async ({ request, env, params }) => {
  const id = parseId(params.id);
  const s = await readJson(request, slideSchema);
  await checkProduct(env.DB, s.productId);
  const res = await env.DB.prepare(
    `UPDATE hero_slides SET image = ?2, image_alt = ?3, title = ?4, product_id = ?5, active = ?6, updated_at = datetime('now') WHERE id = ?1`,
  ).bind(id, s.image, s.imageAlt, s.title, s.productId, s.active ? 1 : 0).run();
  if (!res.meta.changes) throw new HttpError(404, 'Foto no encontrada.');
  await audit(env.DB, request, 'slide_update', `${id} active=${s.active}`);
  return json({ ok: true });
};

export const onRequestDelete: Fn<'id'> = async ({ request, env, params }) => {
  const id = parseId(params.id);
  await env.DB.prepare('DELETE FROM hero_slides WHERE id = ?1').bind(id).run();
  await audit(env.DB, request, 'slide_delete', String(id));
  return json({ ok: true });
};
