import type { Fn } from '../../../../server/env';
import { HttpError, json, parseId, readJson } from '../../../../server/http';
import { checkSection, uniqueGuard, variantStatements } from '../../../../server/admin';
import { audit } from '../../../../server/session';
import { productSchema } from '../../../../src/shared/schemas';

export const onRequestPut: Fn<'id'> = async ({ request, env, params }) => {
  const id = parseId(params.id);
  const p = await readJson(request, productSchema);
  const exists = await env.DB.prepare('SELECT id FROM products WHERE id = ?1').bind(id).first();
  if (!exists) throw new HttpError(404, 'Producto no encontrado.');
  await checkSection(env.DB, p.sectionId);
  const update = env.DB.prepare(
    `UPDATE products SET section_id = ?2, slug = ?3, name = ?4, subtitle = ?5, description = ?6,
            label_color = ?7, image = ?8, image_alt = ?9, scents = ?10, tags = ?11, featured = ?12,
            active = ?13, updated_at = datetime('now')
      WHERE id = ?1`,
  ).bind(id, p.sectionId, p.slug, p.name, p.subtitle, p.description, p.labelColor, p.image, p.imageAlt,
    JSON.stringify(p.scents), p.tags, p.featured ? 1 : 0, p.active ? 1 : 0);
  // Todo en una transacción: datos del producto y sus variantes.
  await uniqueGuard(env.DB.batch([update, ...(await variantStatements(env.DB, id, p))]));
  await audit(env.DB, request, 'product_update', `${id} ${p.slug} active=${p.active}`);
  return json({ ok: true });
};

export const onRequestDelete: Fn<'id'> = async ({ request, env, params }) => {
  const id = parseId(params.id);
  // Los pedidos guardan copia del nombre y precio, así que borrar no los afecta.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM variants WHERE product_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM products WHERE id = ?1').bind(id),
  ]);
  await audit(env.DB, request, 'product_delete', String(id));
  return json({ ok: true });
};
