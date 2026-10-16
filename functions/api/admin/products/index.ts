import type { Fn } from '../../../../server/env';
import { json, readJson } from '../../../../server/http';
import { checkSection, uniqueGuard, variantStatements } from '../../../../server/admin';
import { audit } from '../../../../server/session';
import { productSchema } from '../../../../src/shared/schemas';

export const onRequestPost: Fn = async ({ request, env }) => {
  const p = await readJson(request, productSchema);
  await checkSection(env.DB, p.sectionId);
  const row = await uniqueGuard(
    env.DB.prepare(
      `INSERT INTO products (section_id, slug, name, subtitle, description, label_color, image, image_alt,
                             scents, tags, featured, active, sort)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
               (SELECT COALESCE(MAX(sort), 0) + 1 FROM products WHERE section_id = ?1))
       RETURNING id`,
    )
      .bind(p.sectionId, p.slug, p.name, p.subtitle, p.description, p.labelColor, p.image, p.imageAlt,
        JSON.stringify(p.scents), p.tags, p.featured ? 1 : 0, p.active ? 1 : 0)
      .first<{ id: number }>(),
  );
  if (!row) throw new Error('product insert failed');
  const fresh = { ...p, variants: p.variants.map(({ id: _drop, ...v }) => v) };
  await env.DB.batch(await variantStatements(env.DB, row.id, fresh));
  await audit(env.DB, request, 'product_create', p.slug);
  return json({ id: row.id }, { status: 201 });
};
