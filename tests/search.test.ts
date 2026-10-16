import { describe, expect, it } from 'vitest';
import { filterSections, countProducts } from '../src/site/search';
import { fold } from '../src/shared/text';
import { isLive, localDate } from '../src/shared/dates';
import type { Product, Section } from '../src/shared/types';

const p = (id: number, name: string, extra: Partial<Product> = {}): Product => ({
  id, slug: name, name, subtitle: '', description: '', labelColor: '#000000', image: '', imageAlt: '',
  scents: [], tags: '', featured: false, variants: [{ id, label: 'u', priceCents: 100 }], ...extra,
});
const tree: Section[] = [
  { id: 1, slug: 'velas', name: 'Velas', blurb: '', tone: 'cream', products: [], children: [
    { id: 11, slug: 'clasica', name: 'Clásica', blurb: '', tone: 'cream', children: [], products: [p(1, 'Cinnamon', { subtitle: 'Canela' }), p(2, 'Orquid', { description: 'sal marina' })] },
  ] },
  { id: 4, slug: 'aroma', name: 'Aromatizantes', blurb: '', tone: 'cream', children: [], products: [p(3, 'Aroma Drive', { scents: ['Piña', 'Cereza'] })] },
];

describe('búsqueda', () => {
  it('ignora acentos y mayúsculas', () => {
    expect(fold('Piña ORQUÍDEA')).toBe('pina orquidea');
    expect(countProducts(filterSections(tree, 'pina'))).toBe(1); // sin tilde también encuentra
    expect(countProducts(filterSections(tree, 'PIÑA'))).toBe(1);
    expect(countProducts(filterSections(tree, 'clasica'))).toBe(2);
  });
  it('busca en descripción y aromas', () => {
    expect(countProducts(filterSections(tree, 'marina'))).toBe(1);
    expect(countProducts(filterSections(tree, 'cereza'))).toBe(1);
  });
  it('todas las palabras deben coincidir', () => {
    expect(countProducts(filterSections(tree, 'canela velas'))).toBe(1);
    expect(countProducts(filterSections(tree, 'canela carro'))).toBe(0);
  });
  it('quita secciones vacías', () => {
    const r = filterSections(tree, 'drive');
    expect(r.map((s) => s.slug)).toEqual(['aroma']);
  });
  it('vacío devuelve todo', () => {
    expect(countProducts(filterSections(tree, '  '))).toBe(3);
  });
});

describe('rotación por fechas', () => {
  it('respeta la ventana de fechas', () => {
    const s = { active: 1, starts_on: '2026-09-01', ends_on: '2026-11-30' };
    expect(isLive(s, '2026-08-31')).toBe(false);
    expect(isLive(s, '2026-09-01')).toBe(true);
    expect(isLive(s, '2026-11-30')).toBe(true);
    expect(isLive(s, '2026-12-01')).toBe(false);
    expect(isLive({ ...s, active: 0 }, '2026-10-01')).toBe(false);
  });
  it('usa la hora de Honduras', () => {
    // 2026-10-17 03:00 UTC = 16 de octubre 21:00 en Honduras
    expect(localDate(new Date('2026-10-17T03:00:00Z'), -360)).toBe('2026-10-16');
  });
});
