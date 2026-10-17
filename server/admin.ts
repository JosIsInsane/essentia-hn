import type { ProductInput } from '../src/shared/schemas';
import { HttpError } from './http';

/** Convierte choques de UNIQUE (slug repetido) en un error claro. */
export async function uniqueGuard<T>(p: Promise<T>, what = 'slug'): Promise<T> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof Error && /UNIQUE/i.test(e.message)) {
      throw new HttpError(409, `Ese ${what} ya existe. Usa otro.`, { slug: 'Ya existe' });
    }
    throw e;
  }
}

/** Solo dos niveles: sección y subsección. */
export async function checkParent(db: D1Database, parentId: number | null, selfId?: number): Promise<void> {
  if (parentId === null) return;
  if (parentId === selfId) throw new HttpError(422, 'Una sección no puede estar dentro de sí misma.');
  const parent = await db.prepare('SELECT parent_id FROM sections WHERE id = ?1').bind(parentId).first<{ parent_id: number | null }>();
  if (!parent) throw new HttpError(422, 'La sección madre no existe.');
  if (parent.parent_id !== null) throw new HttpError(422, 'Solo se permite un nivel de subsecciones.');
  if (selfId !== undefined) {
    const kids = await db.prepare('SELECT COUNT(*) AS n FROM sections WHERE parent_id = ?1').bind(selfId).first<{ n: number }>();
    if ((kids?.n ?? 0) > 0) throw new HttpError(422, 'Esta sección tiene subsecciones; no puede ir dentro de otra.');
  }
}


export async function checkSection(db: D1Database, sectionId: number): Promise<void> {
  const s = await db.prepare('SELECT id FROM sections WHERE id = ?1').bind(sectionId).first();
  if (!s) throw new HttpError(422, 'La sección no existe.', { sectionId: 'Elige una sección' });
}

/** Sentencias para dejar las variantes del producto igual a la lista enviada. */
export async function variantStatements(db: D1Database, productId: number, p: ProductInput): Promise<D1PreparedStatement[]> {
  const existing = await db.prepare('SELECT id FROM variants WHERE product_id = ?1').bind(productId).all<{ id: number }>();
  const own = new Set(existing.results.map((r) => r.id));
  const keep = new Set<number>();
  const out: D1PreparedStatement[] = [];
  p.variants.forEach((v, i) => {
    if (v.id !== undefined) {
      if (!own.has(v.id)) throw new HttpError(422, 'Variante no válida.');
      keep.add(v.id);
      out.push(
        db.prepare('UPDATE variants SET label = ?2, price_cents = ?3, active = ?4, sort = ?5 WHERE id = ?1')
          .bind(v.id, v.label, v.priceCents, v.active ? 1 : 0, i + 1),
      );
    } else {
      out.push(
        db.prepare('INSERT INTO variants (product_id, label, price_cents, active, sort) VALUES (?1, ?2, ?3, ?4, ?5)')
          .bind(productId, v.label, v.priceCents, v.active ? 1 : 0, i + 1),
      );
    }
  });
  for (const id of own) if (!keep.has(id)) out.push(db.prepare('DELETE FROM variants WHERE id = ?1').bind(id));
  return out;
}

export async function checkProduct(db: D1Database, productId: number | null): Promise<void> {
  if (productId === null) return;
  const p = await db.prepare('SELECT id FROM products WHERE id = ?1').bind(productId).first();
  if (!p) throw new HttpError(422, 'El producto no existe.', { productId: 'Elige un producto' });
}
