import type { Fn } from '../../../server/env';
import { clientIp, HttpError, json, readJson } from '../../../server/http';
import { pruneRateLimits, rateLimit } from '../../../server/ratelimit';
import { verifyPassword } from '../../../server/password';
import { audit, createSession } from '../../../server/session';
import { loginSchema } from '../../../src/shared/schemas';

export const onRequestPost: Fn = async ({ request, env }) => {
  const ip = clientIp(request);
  await rateLimit(env.DB, `login:${ip}`, 5, 900);   // 5 intentos por IP cada 15 min
  await rateLimit(env.DB, 'login:all', 50, 900);    // tope general contra ataques repartidos
  const { password } = await readJson(request, loginSchema);
  if (!env.ADMIN_PASSWORD_HASH) throw new HttpError(503, 'Falta configurar la contraseña del admin.');
  const ok = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);
  if (!ok) {
    await audit(env.DB, request, 'login_fail');
    throw new HttpError(401, 'Contraseña incorrecta.');
  }
  const cookie = await createSession(env.DB, ip);
  await audit(env.DB, request, 'login');
  await pruneRateLimits(env.DB);
  return json({ ok: true }, { headers: { 'Set-Cookie': cookie } });
};
