export class AdminError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, string> = {}) {
    super(message);
  }
}

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (f: () => void) => { onUnauthorized = f; };

export async function api<T>(method: string, url: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, credentials: 'same-origin', headers: {} };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.body = JSON.stringify(body);
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new AdminError('Sin conexión. Revisa tu internet.', 0);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> };
  if (res.status === 401 && url !== '/api/admin/login') onUnauthorized();
  if (!res.ok) throw new AdminError(data.error ?? 'Algo falló.', res.status, data.fields ?? {});
  return data as T;
}
