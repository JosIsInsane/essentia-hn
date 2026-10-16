import type { ZodType } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) {
    return json({ error: e.message, fields: e.fields }, { status: e.status });
  }
  console.error('unhandled', e instanceof Error ? e.stack : e);
  return json({ error: 'Algo falló de nuestro lado. Intenta de nuevo en un momento.' }, { status: 500 });
}

const MAX_BODY = 64 * 1024;

/** Lee JSON con límite de tamaño y lo valida con zod. */
export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const type = request.headers.get('Content-Type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Formato no soportado.');
  const len = Number(request.headers.get('Content-Length') ?? '0');
  if (len > MAX_BODY) throw new HttpError(413, 'La solicitud es muy grande.');
  const text = await request.text();
  if (text.length > MAX_BODY) throw new HttpError(413, 'La solicitud es muy grande.');
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Datos no válidos.');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_';
      fields[key] ??= issue.message;
    }
    throw new HttpError(422, 'Revisa los datos marcados.', fields);
  }
  return parsed.data;
}

export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
}

/** Bloquea peticiones que cambian datos si no vienen de este mismo sitio (CSRF). */
export function assertSameOrigin(request: Request): void {
  if (request.method === 'GET' || request.method === 'HEAD') return;
  const origin = request.headers.get('Origin');
  const self = new URL(request.url).origin;
  if (!origin || origin !== self) throw new HttpError(403, 'Origen no permitido.');
  const site = request.headers.get('Sec-Fetch-Site');
  if (site && site !== 'same-origin') throw new HttpError(403, 'Origen no permitido.');
}

export function parseId(v: string | string[] | undefined): number {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s || !/^\d{1,10}$/.test(s)) throw new HttpError(404, 'No encontrado.');
  return Number(s);
}
