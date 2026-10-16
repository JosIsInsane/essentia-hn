import type { Product, Section } from '../shared/types';
import { fold } from '../shared/text';

/** Texto donde buscamos: nombre, subtítulo, descripción, aromas, etiquetas y sección. */
export function haystack(p: Product, trail: string[]): string {
  return fold([p.name, p.subtitle, p.description, p.scents.join(' '), p.tags, ...trail].join(' '));
}

/** Todas las palabras deben aparecer (en cualquier orden). Vacío = todo. */
export function matches(p: Product, trail: string[], query: string): boolean {
  const words = fold(query).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const text = haystack(p, trail);
  return words.every((w) => text.includes(w));
}

/** Devuelve el árbol solo con lo que coincide, sin secciones vacías. */
export function filterSections(sections: Section[], query: string, trail: string[] = []): Section[] {
  const out: Section[] = [];
  for (const s of sections) {
    const t = [...trail, s.name];
    const products = s.products.filter((p) => matches(p, t, query));
    const children = filterSections(s.children, query, t);
    if (products.length || children.length) out.push({ ...s, products, children });
  }
  return out;
}

export function countProducts(sections: Section[]): number {
  return sections.reduce((n, s) => n + s.products.length + countProducts(s.children), 0);
}
