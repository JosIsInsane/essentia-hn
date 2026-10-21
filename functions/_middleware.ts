import type { Fn } from '../server/env';
import { errorResponse } from '../server/http';

// Corre antes de toda función (/, /api/*, /img/*). Atrapa errores y pone cabeceras seguras.
export const onRequest: Fn = async (ctx) => {
  let res: Response;
  try {
    res = await ctx.next();
  } catch (e) {
    res = errorResponse(e);
  }
  const out = new Response(res.body, res);
  const h = out.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  if (!h.has('Referrer-Policy')) h.set('Referrer-Policy', 'no-referrer');
  h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  h.set('Cross-Origin-Resource-Policy', 'same-origin');
  h.set('X-Frame-Options', 'DENY');
  if (!h.has('Content-Security-Policy')) h.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  return out;
};
