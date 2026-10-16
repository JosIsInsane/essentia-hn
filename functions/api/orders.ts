import type { Env, Fn } from '../../server/env';
import { assertSameOrigin, clientIp, HttpError, json, readJson } from '../../server/http';
import { rateLimit } from '../../server/ratelimit';
import { loadSettings, today } from '../../server/catalog';
import { orderSchema } from '../../src/shared/schemas';
import { OrderError, orderCode, priceOrder, whatsappText, whatsappUrl, type PriceRow } from '../../src/shared/order';
import { isLive } from '../../src/shared/dates';

async function verifyTurnstile(env: Env, token: string | undefined, ip: string): Promise<void> {
  if (!env.TURNSTILE_SECRET) return;
  if (!token) throw new HttpError(400, 'Confirma que no eres un robot.');
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const out = (await res.json()) as { success?: boolean };
  if (!out.success) throw new HttpError(400, 'No pudimos confirmar que no eres un robot. Intenta de nuevo.');
}

interface Row {
  variant_id: number; variant_label: string; price_cents: number; variant_active: number;
  product_id: number; product_name: string; scents: string; product_active: number; section_id: number;
}

/** Lee precios y disponibilidad desde la base; nunca del navegador. */
async function priceRows(env: Env, variantIds: number[]): Promise<Map<number, PriceRow>> {
  const unique = [...new Set(variantIds)];
  const marks = unique.map((_, i) => `?${i + 1}`).join(',');
  const [items, sections] = await env.DB.batch([
    env.DB.prepare(
      `SELECT v.id AS variant_id, v.label AS variant_label, v.price_cents, v.active AS variant_active,
              p.id AS product_id, p.name AS product_name, p.scents, p.active AS product_active, p.section_id
         FROM variants v JOIN products p ON p.id = v.product_id
        WHERE v.id IN (${marks})`,
    ).bind(...unique),
    env.DB.prepare('SELECT id, parent_id, active, starts_on, ends_on FROM sections'),
  ]);
  const secs = (sections?.results ?? []) as { id: number; parent_id: number | null; active: number; starts_on: string | null; ends_on: string | null }[];
  const byId = new Map(secs.map((s) => [s.id, s]));
  const day = today(env);
  const sectionLive = (id: number): boolean => {
    let cur = byId.get(id);
    for (let d = 0; cur && d < 8; d++) {
      if (!isLive(cur, day)) return false;
      cur = cur.parent_id === null ? undefined : byId.get(cur.parent_id);
    }
    return true;
  };
  const map = new Map<number, PriceRow>();
  for (const r of (items?.results ?? []) as Row[]) {
    let scents: string[] = [];
    try { scents = JSON.parse(r.scents) as string[]; } catch { /* sin aromas */ }
    map.set(r.variant_id, {
      variantId: r.variant_id, variantLabel: r.variant_label, priceCents: r.price_cents,
      productId: r.product_id, productName: r.product_name, scents,
      orderable: !!r.variant_active && !!r.product_active && sectionLive(r.section_id),
    });
  }
  return map;
}

export const onRequestPost: Fn = async ({ request, env }) => {
  assertSameOrigin(request);
  const ip = clientIp(request);
  await rateLimit(env.DB, `order:${ip}`, 5, 600);   // 5 pedidos por IP cada 10 min
  await rateLimit(env.DB, 'order:all', 300, 3600); // tope general por hora

  const input = await readJson(request, orderSchema);
  const settings = await loadSettings(env.DB, env);
  if (!settings.ordersOpen) throw new HttpError(503, 'Por ahora no estamos tomando pedidos en línea. Escríbenos por WhatsApp.');
  await verifyTurnstile(env, input.turnstileToken, ip);

  let priced;
  try {
    priced = priceOrder(input.items, await priceRows(env, input.items.map((i) => i.variantId)));
  } catch (e) {
    if (e instanceof OrderError) throw new HttpError(409, e.message);
    throw e;
  }

  const code = orderCode(crypto.getRandomValues(new Uint8Array(6)));
  const city = input.delivery === 'envio' ? input.city : '';
  const address = input.delivery === 'envio' ? input.address : '';
  // Un solo batch = una transacción: o se guarda todo el pedido o nada.
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO orders (code, customer_name, phone, delivery, city, address, payment, notes, total_cents)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
    ).bind(code, input.name, input.phone, input.delivery, city, address, input.payment, input.notes, priced.totalCents),
    ...priced.lines.map((l) =>
      env.DB.prepare(
        `INSERT INTO order_items (order_id, product_id, product_name, variant_label, scent, unit_cents, qty)
         VALUES ((SELECT id FROM orders WHERE code = ?1), ?2, ?3, ?4, ?5, ?6, ?7)`,
      ).bind(code, l.productId, l.productName, l.variantLabel, l.scent, l.unitCents, l.qty),
    ),
  ]);

  const text = whatsappText({ code, name: input.name, delivery: input.delivery, city, address, payment: input.payment, notes: input.notes, ...priced });
  return json(
    { code, totalCents: priced.totalCents, lines: priced.lines, whatsappUrl: whatsappUrl(settings.whatsapp, text) },
    { status: 201 },
  );
};
