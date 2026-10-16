import type { Fn } from '../../../server/env';
import { json, readJson } from '../../../server/http';
import { loadSettings } from '../../../server/catalog';
import { audit } from '../../../server/session';
import { settingsSchema } from '../../../src/shared/schemas';

export const onRequestGet: Fn = async ({ env }) => json(await loadSettings(env.DB, env));

export const onRequestPut: Fn = async ({ request, env }) => {
  const s = await readJson(request, settingsSchema);
  const pairs: [string, string][] = [
    ['whatsapp', s.whatsapp], ['instagram', s.instagram], ['announcement', s.announcement],
    ['hero_section', s.heroSection], ['delivery_note', s.deliveryNote], ['orders_open', s.ordersOpen ? '1' : '0'],
  ];
  await env.DB.batch(
    pairs.map(([k, v]) =>
      env.DB.prepare('INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT (key) DO UPDATE SET value = excluded.value').bind(k, v),
    ),
  );
  await audit(env.DB, request, 'settings_update');
  return json({ ok: true });
};
