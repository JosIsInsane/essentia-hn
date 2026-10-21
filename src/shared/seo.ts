import type { Catalog, Product, Section } from './types';

export const SITE_URL = 'https://essentiahn.com';

/** Ref de imagen -> URL absoluta de la foto grande (para Google y redes). */
export function absoluteImage(ref: string): string {
  if (ref.startsWith('static:')) return `${SITE_URL}/catalogo/${ref.slice(7)}-960.webp`;
  if (ref.startsWith('r2:')) return `${SITE_URL}/img/${ref.slice(3)}`;
  return `${SITE_URL}/catalogo/logo-960.webp`;
}

const price = (cents: number) => (cents / 100).toFixed(2);

function offers(p: Product) {
  const cents = p.variants.map((v) => v.priceCents);
  const base = { priceCurrency: 'HNL', availability: 'https://schema.org/InStock', seller: { '@id': `${SITE_URL}/#store` } };
  if (cents.length === 1) return { '@type': 'Offer', price: price(cents[0]!), ...base };
  return { '@type': 'AggregateOffer', lowPrice: price(Math.min(...cents)), highPrice: price(Math.max(...cents)), offerCount: cents.length, ...base };
}

/** Datos estructurados (schema.org) de la tienda y sus productos, para resultados de Google. */
export function structuredData(c: Catalog): object {
  const products: object[] = [];
  const all: number[] = [];
  const walk = (list: Section[], top?: string) => {
    for (const s of list) {
      for (const p of s.products) {
        all.push(...p.variants.map((v) => v.priceCents));
        products.push({
          '@type': 'Product',
          '@id': `${SITE_URL}/#p-${p.slug}`,
          name: p.name,
          description: p.description || p.subtitle || s.blurb || p.name,
          image: absoluteImage(p.image),
          category: top ?? s.name,
          brand: { '@type': 'Brand', name: 'Essentia' },
          offers: offers(p),
        });
      }
      walk(s.children, top ?? s.name);
    }
  };
  walk(c.sections);

  const { whatsapp, instagram } = c.settings;
  const store: Record<string, unknown> = {
    '@type': 'Store',
    '@id': `${SITE_URL}/#store`,
    name: 'Essentia · Ash & Aroma',
    url: `${SITE_URL}/`,
    description: 'Velas de soya, velas decorativas y aromatizantes hechos a mano en Honduras. Pedidos por WhatsApp.',
    image: `${SITE_URL}/og.jpg`,
    logo: `${SITE_URL}/icon-512.png`,
    address: { '@type': 'PostalAddress', addressCountry: 'HN' },
    areaServed: { '@type': 'Country', name: 'Honduras' },
    currenciesAccepted: 'HNL',
    paymentAccepted: 'Transferencia, Efectivo',
  };
  if (whatsapp) store.telephone = `+${whatsapp}`;
  if (instagram) store.sameAs = [`https://www.instagram.com/${instagram}`];
  if (all.length) store.priceRange = `L${Math.min(...all) / 100} - L${Math.max(...all) / 100}`;

  return { '@context': 'https://schema.org', '@graph': [store, ...products] };
}

/** JSON listo para ir dentro de <script>: sin "<" ni separadores de línea que corten el HTML. */
export function scriptJson(data: unknown): string {
  return JSON.stringify(data).replace(/[<\u2028\u2029]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}
