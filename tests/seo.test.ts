import { describe, expect, it } from 'vitest';
import { absoluteImage, scriptJson, structuredData } from '../src/shared/seo';
import { SITE_CSP } from '../server/site-headers';
import type { Catalog } from '../src/shared/types';
import headers from '../public/_headers?raw';

const product = (id: number, name: string, prices: number[]) => ({
  id, slug: name.toLowerCase(), name, subtitle: 'sub', description: '', labelColor: '#000', image: 'static:x', imageAlt: '',
  scents: [], tags: '', featured: false, variants: prices.map((p, i) => ({ id: id * 10 + i, label: `${i}`, priceCents: p })),
});

const catalog: Catalog = {
  sections: [{
    id: 1, slug: 'velas', name: 'Velas', blurb: '', tone: 'cream', products: [],
    children: [{ id: 2, slug: 'clasica', name: 'Clásica', blurb: '', tone: 'cream', products: [product(1, 'Cinnamon', [28000, 60000])], children: [] }],
  }, {
    id: 3, slug: 'acc', name: 'Accesorios', blurb: '', tone: 'cream', products: [product(2, 'Encendedor', [15000])], children: [],
  }],
  slides: [],
  settings: { whatsapp: '50495632609', instagram: 'essentiaa.hn', announcement: '', heroSection: '', deliveryNote: '', ordersOpen: true, turnstileSiteKey: '' },
};

describe('structuredData', () => {
  const graph = (structuredData(catalog) as { '@graph': Record<string, any>[] })['@graph'];
  it('tienda con teléfono, Instagram y rango de precios', () => {
    expect(graph[0]).toMatchObject({ '@type': 'Store', telephone: '+50495632609', priceRange: 'L150 - L600' });
    expect(graph[0]!.sameAs).toEqual(['https://www.instagram.com/essentiaa.hn']);
  });
  it('un producto por cada uno, con la sección de arriba como categoría', () => {
    expect(graph.slice(1).map((p) => p.name)).toEqual(['Cinnamon', 'Encendedor']);
    expect(graph[1]!.category).toBe('Velas');
  });
  it('varios tamaños -> AggregateOffer; uno -> Offer, en lempiras', () => {
    expect(graph[1]!.offers).toMatchObject({ '@type': 'AggregateOffer', lowPrice: '280.00', highPrice: '600.00', priceCurrency: 'HNL' });
    expect(graph[2]!.offers).toMatchObject({ '@type': 'Offer', price: '150.00' });
  });
});

describe('absoluteImage', () => {
  it('fotos del catálogo y subidas', () => {
    expect(absoluteImage('static:cinnamon')).toBe('https://essentiahn.com/catalogo/cinnamon-960.webp');
    expect(absoluteImage('r2:abc.jpg')).toBe('https://essentiahn.com/img/abc.jpg');
  });
});

describe('scriptJson', () => {
  it('no deja cerrar el <script> desde un texto del catálogo', () => {
    const out = scriptJson({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});

describe('cabeceras', () => {
  it('la CSP de functions/index.ts es la misma de public/_headers', () => {
    const site = headers.split(/\n(?=\/)/).find((b: string) => b.startsWith('/*'))!;
    expect(site).toContain(`Content-Security-Policy: ${SITE_CSP}`);
  });
});
