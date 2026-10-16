import type { Catalog, PricedLine } from '../shared/types';

export class ApiError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, string> = {}) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, credentials: 'same-origin' });
  } catch {
    throw new ApiError('No hay conexión. Revisa tu internet e intenta de nuevo.', 0);
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> };
  if (!res.ok) throw new ApiError(body.error ?? 'Algo falló. Intenta de nuevo.', res.status, body.fields ?? {});
  return body as T;
}

export const getCatalog = () => call<Catalog>('/api/catalog');

export interface OrderResult { code: string; totalCents: number; lines: PricedLine[]; whatsappUrl: string }

export const placeOrder = (body: unknown) =>
  call<OrderResult>('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
