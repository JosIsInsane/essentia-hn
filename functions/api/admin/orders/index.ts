import type { Fn } from '../../../../server/env';
import { json } from '../../../../server/http';
import { ORDER_STATUSES, type OrderStatus } from '../../../../src/shared/types';
import type { AdminOrderSummary } from '../../../../src/shared/admin-types';

interface Row { id: number; code: string; status: OrderStatus; customer_name: string; phone: string; delivery: 'envio' | 'retiro'; total_cents: number; created_at: string }

export const onRequestGet: Fn = async ({ request, env }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const page = Math.max(0, Math.min(1000, Number(url.searchParams.get('page') ?? '0') || 0));
  const filter = status && (ORDER_STATUSES as string[]).includes(status) ? status : null;
  const res = await env.DB.prepare(
    `SELECT id, code, status, customer_name, phone, delivery, total_cents, created_at
       FROM orders WHERE (?1 IS NULL OR status = ?1)
      ORDER BY created_at DESC, id DESC LIMIT 51 OFFSET ?2`,
  )
    .bind(filter, page * 50)
    .all<Row>();
  const orders: AdminOrderSummary[] = res.results.slice(0, 50).map((r) => ({
    id: r.id, code: r.code, status: r.status, customerName: r.customer_name, phone: r.phone,
    delivery: r.delivery, totalCents: r.total_cents, createdAt: r.created_at,
  }));
  const counts = await env.DB.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all<{ status: string; n: number }>();
  return json({ orders, hasMore: res.results.length > 50, counts: Object.fromEntries(counts.results.map((c) => [c.status, c.n])) });
};
