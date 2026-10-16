import { lempiras } from './money';
import type { PricedLine } from './types';
import type { OrderInput } from './schemas';

/** Fila que el servidor lee de la base para cada variante pedida. */
export interface PriceRow {
  variantId: number;
  variantLabel: string;
  priceCents: number;
  productId: number;
  productName: string;
  scents: string[];
  orderable: boolean; // producto, variante y sección activos y vigentes
}

export class OrderError extends Error {}

/**
 * Calcula el pedido SOLO con precios de la base. Lo que manda el navegador
 * (precio, nombre) no se usa: solo ids, aroma y cantidad.
 */
export function priceOrder(items: OrderInput['items'], rows: Map<number, PriceRow>): { lines: PricedLine[]; totalCents: number } {
  const merged = new Map<string, PricedLine>();
  for (const it of items) {
    const row = rows.get(it.variantId);
    if (!row || row.productId !== it.productId || !row.orderable) {
      throw new OrderError('Uno de los productos ya no está disponible. Revisa tu carrito.');
    }
    let scent = '';
    if (row.scents.length > 0) {
      if (!row.scents.includes(it.scent)) throw new OrderError(`Elige un aroma para ${row.productName}.`);
      scent = it.scent;
    }
    const key = `${it.variantId}|${scent}`;
    const prev = merged.get(key);
    const qty = (prev?.qty ?? 0) + it.qty;
    if (qty > 50) throw new OrderError('Para pedidos grandes escríbenos por WhatsApp.');
    merged.set(key, {
      productId: row.productId,
      productName: row.productName,
      variantLabel: row.variantLabel,
      scent,
      unitCents: row.priceCents,
      qty,
    });
  }
  const lines = [...merged.values()];
  const totalCents = lines.reduce((t, l) => t + l.unitCents * l.qty, 0);
  return { lines, totalCents };
}

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // sin 0/O, 1/I/L

export function orderCode(random: Uint8Array): string {
  let s = '';
  for (const b of random.slice(0, 6)) s += ALPHABET[b % ALPHABET.length];
  return `ESS-${s}`;
}

export interface MessageOrder {
  code: string;
  name: string;
  delivery: 'envio' | 'retiro';
  city: string;
  address: string;
  payment: 'transferencia' | 'efectivo';
  notes: string;
  lines: PricedLine[];
  totalCents: number;
}

/** Texto del pedido para abrir WhatsApp ya escrito. */
export function whatsappText(o: MessageOrder): string {
  const out = [`Hola Essentia, quiero hacer este pedido (${o.code}):`, ''];
  for (const l of o.lines) {
    const scent = l.scent ? ` (${l.scent})` : '';
    out.push(`• ${l.qty} × ${l.productName}${scent}, ${l.variantLabel}: ${lempiras(l.unitCents * l.qty)}`);
  }
  out.push('', `Total: ${lempiras(o.totalCents)} sin envío`, `Nombre: ${o.name}`);
  out.push(o.delivery === 'envio' ? `Entrega: envío a ${o.city}, ${o.address}` : 'Entrega: paso a retirar');
  out.push(`Pago: ${o.payment === 'transferencia' ? 'transferencia' : 'efectivo'}`);
  if (o.notes) out.push(`Notas: ${o.notes}`);
  return out.join('\n');
}

export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
