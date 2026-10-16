import type { Fn } from '../../../server/env';
import { json } from '../../../server/http';
import { destroySession } from '../../../server/session';

export const onRequestPost: Fn = async ({ request, env }) => {
  const cookie = await destroySession(env.DB, request);
  return json({ ok: true }, { headers: { 'Set-Cookie': cookie } });
};
