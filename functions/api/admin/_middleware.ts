import type { Fn } from '../../../server/env';
import { assertSameOrigin } from '../../../server/http';
import { requireSession } from '../../../server/session';

// Todo /api/admin/* pide mismo origen; todo menos login pide sesión.
export const onRequest: Fn = async ({ request, env, next }) => {
  assertSameOrigin(request);
  const path = new URL(request.url).pathname;
  if (path !== '/api/admin/login') await requireSession(env.DB, request);
  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', 'no-store');
  out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return out;
};
