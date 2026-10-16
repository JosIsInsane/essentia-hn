import type { Fn } from '../../../../server/env';
import { json, readJson } from '../../../../server/http';
import { checkParent, uniqueGuard } from '../../../../server/admin';
import { audit } from '../../../../server/session';
import { sectionSchema } from '../../../../src/shared/schemas';

export const onRequestPost: Fn = async ({ request, env }) => {
  const s = await readJson(request, sectionSchema);
  await checkParent(env.DB, s.parentId);
  const row = await uniqueGuard(
    env.DB.prepare(
      `INSERT INTO sections (parent_id, slug, name, blurb, active, starts_on, ends_on, tone, sort)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,
               (SELECT COALESCE(MAX(sort), 0) + 1 FROM sections WHERE parent_id IS ?1))
       RETURNING id`,
    )
      .bind(s.parentId, s.slug, s.name, s.blurb, s.active ? 1 : 0, s.startsOn, s.endsOn, s.tone)
      .first<{ id: number }>(),
  );
  await audit(env.DB, request, 'section_create', s.slug);
  return json({ id: row?.id }, { status: 201 });
};
