import type { Fn } from '../../../../server/env';
import { json, readJson } from '../../../../server/http';
import { checkProduct } from '../../../../server/admin';
import { audit } from '../../../../server/session';
import { slideSchema } from '../../../../src/shared/schemas';

export const onRequestPost: Fn = async ({ request, env }) => {
  const s = await readJson(request, slideSchema);
  await checkProduct(env.DB, s.productId);
  const row = await env.DB.prepare(
    `INSERT INTO hero_slides (image, image_alt, title, product_id, active, sort)
     VALUES (?1, ?2, ?3, ?4, ?5, (SELECT COALESCE(MAX(sort), 0) + 1 FROM hero_slides)) RETURNING id`,
  ).bind(s.image, s.imageAlt, s.title, s.productId, s.active ? 1 : 0).first<{ id: number }>();
  await audit(env.DB, request, 'slide_create', String(row?.id ?? ''));
  return json({ id: row?.id }, { status: 201 });
};
