import type { Fn } from '../../../../server/env';
import { HttpError, json, parseId, readJson } from '../../../../server/http';
import { checkParent, uniqueGuard } from '../../../../server/admin';
import { audit } from '../../../../server/session';
import { sectionSchema } from '../../../../src/shared/schemas';

export const onRequestPut: Fn<'id'> = async ({ request, env, params }) => {
  const id = parseId(params.id);
  const s = await readJson(request, sectionSchema);
  await checkParent(env.DB, s.parentId, id);
  const res = await uniqueGuard(
    env.DB.prepare(
      `UPDATE sections SET parent_id = ?2, slug = ?3, name = ?4, blurb = ?5, active = ?6,
              starts_on = ?7, ends_on = ?8, tone = ?9, updated_at = datetime('now')
        WHERE id = ?1`,
    )
      .bind(id, s.parentId, s.slug, s.name, s.blurb, s.active ? 1 : 0, s.startsOn, s.endsOn, s.tone)
      .run(),
  );
  if (!res.meta.changes) throw new HttpError(404, 'Sección no encontrada.');
  await audit(env.DB, request, 'section_update', `${id} ${s.slug} active=${s.active}`);
  return json({ ok: true });
};

export const onRequestDelete: Fn<'id'> = async ({ request, env, params }) => {
  const id = parseId(params.id);
  const used = await env.DB.prepare(
    'SELECT (SELECT COUNT(*) FROM products WHERE section_id = ?1) + (SELECT COUNT(*) FROM sections WHERE parent_id = ?1) AS n',
  )
    .bind(id)
    .first<{ n: number }>();
  if ((used?.n ?? 0) > 0) throw new HttpError(409, 'Mueve o borra primero sus productos y subsecciones. Si solo quieres ocultarla, desactívala.');
  await env.DB.prepare('DELETE FROM sections WHERE id = ?1').bind(id).run();
  await audit(env.DB, request, 'section_delete', String(id));
  return json({ ok: true });
};
