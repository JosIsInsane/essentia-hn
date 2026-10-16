import { describe, expect, it } from 'vitest';
import { orderCode, priceOrder, whatsappText, whatsappUrl, OrderError, type PriceRow } from '../src/shared/order';
import { orderSchema } from '../src/shared/schemas';
import { lempiras } from '../src/shared/money';

const rows = new Map<number, PriceRow>([
  [1, { variantId: 1, variantLabel: '7 oz', priceCents: 40000, productId: 10, productName: 'Cinnamon', scents: [], orderable: true }],
  [2, { variantId: 2, variantLabel: 'Unidad', priceCents: 18000, productId: 11, productName: 'Teddy Bear', scents: ['Vainilla', 'Canela'], orderable: true }],
  [3, { variantId: 3, variantLabel: '8 oz', priceCents: 42000, productId: 12, productName: 'Pumpkin', scents: [], orderable: false }],
]);

describe('priceOrder', () => {
  it('usa el precio de la base y suma bien', () => {
    const r = priceOrder([{ productId: 10, variantId: 1, scent: '', qty: 2 }, { productId: 11, variantId: 2, scent: 'Canela', qty: 1 }], rows);
    expect(r.totalCents).toBe(98000);
    expect(r.lines).toHaveLength(2);
  });
  it('junta líneas repetidas', () => {
    const r = priceOrder([{ productId: 10, variantId: 1, scent: '', qty: 2 }, { productId: 10, variantId: 1, scent: '', qty: 3 }], rows);
    expect(r.lines[0]!.qty).toBe(5);
  });
  it('ignora el aroma si el producto no tiene aromas', () => {
    const r = priceOrder([{ productId: 10, variantId: 1, scent: 'inventado', qty: 1 }], rows);
    expect(r.lines[0]!.scent).toBe('');
  });
  it('rechaza aroma que no existe', () => {
    expect(() => priceOrder([{ productId: 11, variantId: 2, scent: 'Fresa', qty: 1 }], rows)).toThrow(OrderError);
  });
  it('rechaza producto apagado o fuera de temporada', () => {
    expect(() => priceOrder([{ productId: 12, variantId: 3, scent: '', qty: 1 }], rows)).toThrow(OrderError);
  });
  it('rechaza variante de otro producto (manipulación)', () => {
    expect(() => priceOrder([{ productId: 11, variantId: 1, scent: '', qty: 1 }], rows)).toThrow(OrderError);
  });
  it('rechaza más de 50 de lo mismo', () => {
    expect(() => priceOrder(Array.from({ length: 3 }, () => ({ productId: 10, variantId: 1, scent: '', qty: 20 })), rows)).toThrow(OrderError);
  });
});

describe('orderSchema', () => {
  const ok = { items: [{ productId: 1, variantId: 1, qty: 1 }], name: 'Ana', phone: '9563-2609', delivery: 'retiro', payment: 'efectivo' };
  it('acepta un pedido válido y limpia el teléfono', () => {
    const r = orderSchema.parse(ok);
    expect(r.phone).toBe('95632609');
  });
  it('pide dirección si es envío', () => {
    expect(orderSchema.safeParse({ ...ok, delivery: 'envio' }).success).toBe(false);
  });
  it('rechaza campos extra como precio', () => {
    expect(orderSchema.safeParse({ ...ok, totalCents: 1 }).success).toBe(false);
  });
  it('rechaza la trampa para bots llena', () => {
    expect(orderSchema.safeParse({ ...ok, website: 'spam' }).success).toBe(false);
  });
  it('quita caracteres de control', () => {
    const r = orderSchema.parse({ ...ok, name: 'Ana\u0000‮ Ruiz' });
    expect(r.name).toBe('Ana Ruiz');
  });
  it('rechaza cantidades raras', () => {
    expect(orderSchema.safeParse({ ...ok, items: [{ productId: 1, variantId: 1, qty: 0 }] }).success).toBe(false);
    expect(orderSchema.safeParse({ ...ok, items: [{ productId: 1, variantId: 1, qty: 1.5 }] }).success).toBe(false);
  });
});

describe('mensajes', () => {
  it('formatea lempiras', () => {
    expect(lempiras(40000)).toBe('L400');
    expect(lempiras(123450)).toBe('L1,234.50');
  });
  it('código sin letras confusas', () => {
    const c = orderCode(new Uint8Array([0, 1, 2, 3, 4, 255]));
    expect(c).toMatch(/^ESS-[2-9A-HJ-NP-Z]{6}$/);
  });
  it('arma el texto y escapa la URL de WhatsApp', () => {
    const text = whatsappText({ code: 'ESS-ABC234', name: 'Ana & Co', delivery: 'retiro', city: '', address: '', payment: 'efectivo', notes: '', lines: [{ productId: 1, productName: 'Cinnamon', variantLabel: '7 oz', scent: '', unitCents: 40000, qty: 2 }], totalCents: 80000 });
    expect(text).toContain('2 × Cinnamon, 7 oz: L800');
    const url = whatsappUrl('504 9563-2609', text);
    expect(url.startsWith('https://wa.me/50495632609?text=')).toBe(true);
    expect(url).not.toContain('&C');
  });
});
