import { HttpError } from './http';

export const COOKIE = '__Host-ess_admin';
const TTL_SEC = 12 * 60 * 60; // 12 horas

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(text: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

/** Crea sesión: el navegador guarda el token, la base solo su hash. */
export async function createSession(db: D1Database, ip: string): Promise<string> {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?1').bind(now),
    db
      .prepare('INSERT INTO admin_sessions (token_hash, expires_at, created_at, ip) VALUES (?1, ?2, ?3, ?4)')
      .bind(await sha256(token), now + TTL_SEC, now, ip),
  ]);
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${TTL_SEC}`;
}

export async function requireSession(db: D1Database, request: Request): Promise<void> {
  const token = readCookie(request, COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new HttpError(401, 'Inicia sesión.');
  const row = await db
    .prepare('SELECT expires_at FROM admin_sessions WHERE token_hash = ?1')
    .bind(await sha256(token))
    .first<{ expires_at: number }>();
  if (!row || row.expires_at < Math.floor(Date.now() / 1000)) throw new HttpError(401, 'Tu sesión venció. Inicia sesión de nuevo.');
}

export async function destroySession(db: D1Database, request: Request): Promise<string> {
  const token = readCookie(request, COOKIE);
  if (token) await db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?1').bind(await sha256(token)).run();
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function audit(db: D1Database, request: Request, action: string, detail = ''): Promise<void> {
  await db
    .prepare('INSERT INTO audit_log (action, detail, ip) VALUES (?1, ?2, ?3)')
    .bind(action, detail.slice(0, 500), request.headers.get('CF-Connecting-IP') ?? '')
    .run();
}
