import type { Fn } from '../../../../server/env';
import { HttpError, json, parseId, readJson } from '../../../../server/http';
import { audit } from '../../../../server/session';
import { orderUpdateSchema } from '../../../../src/shared/schemas';
import type { AdminOrder } from '../../../../src/shared/admin-types';

interface OrderRow {
  id: number; code: string; status: AdminOrder['status']; customer_name: string; phone: string;
  delivery: AdminOrder['delivery']; total_cents: number; created_at: string; city: string; address: string;
  payment: AdminOrder['payment']; notes: string; admin_notes: string;
}
interface ItemRow { product_name: string; variant_label: string; scent: string; unit_cents: number; qty: number }

export const onRequestGet: Fn<'id'> = async ({ env, params }) => {
  const id = parseId(params.id);
  const [o, items] = await env.DB.batch([
    env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(id),
    env.DB.prepare('SELECT product_name, variant_label, scent, unit_cents, qty FROM order_items WHERE order_id = ?1 ORDER BY id').bind(id),
  ]);
  const r = o?.results[0] as OrderRow | undefined;
  if (!r) throw new HttpError(404, 'Pedido no encontrado.');
  const order: AdminOrder = {
    id: r.id, code: r.code, status: r.status, customerName: r.customer_name, phone: r.phone,
    delivery: r.delivery, totalCents: r.total_cents, createdAt: r.created_at,
    city: r.city, address: r.address, payment: r.payment, notes: r.notes, adminNotes: r.admin_notes,
    items: ((items?.results ?? []) as ItemRow[]).map((i) => ({
      productName: i.product_name, variantLabel: i.variant_label, scent: i.scent, unitCents: i.unit_cents, qty: i.qty,
    })),
  };
  return json(order);
};

export const onRequestPatch: Fn<'id'> = async ({ request, env, params }) => {
  const id = parseId(params.id);
  const u = await readJson(request, orderUpdateSchema);
  const res = await env.DB.prepare("UPDATE orders SET status = ?2, admin_notes = ?3, updated_at = datetime('now') WHERE id = ?1")
    .bind(id, u.status, u.adminNotes)
    .run();
  if (!res.meta.changes) throw new HttpError(404, 'Pedido no encontrado.');
  await audit(env.DB, request, 'order_update', `${id} -> ${u.status}`);
  return json({ ok: true });
};
