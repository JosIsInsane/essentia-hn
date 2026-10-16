export type Tone = 'cream' | 'wine' | 'blush' | 'amber';

export interface Variant {
  id: number;
  label: string;
  priceCents: number;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  labelColor: string;
  image: string;
  imageAlt: string;
  scents: string[];
  tags: string;
  featured: boolean;
  variants: Variant[];
}

export interface Section {
  id: number;
  slug: string;
  name: string;
  blurb: string;
  tone: Tone;
  products: Product[];
  children: Section[];
}

export interface StoreSettings {
  whatsapp: string;
  instagram: string;
  announcement: string;
  heroSection: string;
  deliveryNote: string;
  ordersOpen: boolean;
  turnstileSiteKey: string;
}

export interface Catalog {
  sections: Section[];
  settings: StoreSettings;
}

export type OrderStatus = 'nuevo' | 'confirmado' | 'listo' | 'entregado' | 'cancelado';
export const ORDER_STATUSES: OrderStatus[] = ['nuevo', 'confirmado', 'listo', 'entregado', 'cancelado'];

export interface PricedLine {
  productId: number;
  productName: string;
  variantLabel: string;
  scent: string;
  unitCents: number;
  qty: number;
}
