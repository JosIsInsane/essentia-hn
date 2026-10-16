import { useSyncExternalStore } from 'react';

export interface CartLine {
  productId: number;
  variantId: number;
  scent: string;
  qty: number;
}

const KEY = 'essentia:cart:v1';
const MAX_QTY = 20;
let lines: CartLine[] = load();
const subs = new Set<() => void>();

function valid(x: unknown): x is CartLine {
  const l = x as CartLine;
  return !!l && Number.isInteger(l.productId) && Number.isInteger(l.variantId) && typeof l.scent === 'string'
    && l.scent.length <= 40 && Number.isInteger(l.qty) && l.qty >= 1 && l.qty <= MAX_QTY;
}

function load(): CartLine[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter(valid).slice(0, 30) : [];
  } catch {
    return [];
  }
}

function commit(next: CartLine[]): void {
  lines = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignorar */ }
  subs.forEach((f) => f());
}

const same = (a: CartLine, b: Omit<CartLine, 'qty'>) => a.variantId === b.variantId && a.scent === b.scent;

export const cart = {
  add(item: CartLine) {
    const i = lines.findIndex((l) => same(l, item));
    if (i === -1) commit([...lines, { ...item, qty: Math.min(item.qty, MAX_QTY) }].slice(0, 30));
    else commit(lines.map((l, j) => (j === i ? { ...l, qty: Math.min(l.qty + item.qty, MAX_QTY) } : l)));
  },
  setQty(key: Omit<CartLine, 'qty'>, qty: number) {
    if (qty < 1) return cart.remove(key);
    commit(lines.map((l) => (same(l, key) ? { ...l, qty: Math.min(qty, MAX_QTY) } : l)));
  },
  remove(key: Omit<CartLine, 'qty'>) {
    commit(lines.filter((l) => !same(l, key)));
  },
  clear() {
    commit([]);
  },
  /** Quita líneas cuyo producto o variante ya no existe en el catálogo. */
  prune(isValid: (l: CartLine) => boolean) {
    const next = lines.filter(isValid);
    if (next.length !== lines.length) commit(next);
  },
};

export function useCart(): CartLine[] {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => lines,
  );
}

export const MAX_LINE_QTY = MAX_QTY;
