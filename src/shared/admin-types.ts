import type { OrderStatus, Tone } from './types';

export interface AdminSection {
  id: number;
  parentId: number | null;
  slug: string;
  name: string;
  blurb: string;
  sort: number;
  active: boolean;
  startsOn: string | null;
  endsOn: string | null;
  tone: Tone;
  live: boolean; // visible hoy (activa, en fechas y su sección madre también)
}

export interface AdminVariant {
  id: number;
  label: string;
  priceCents: number;
  active: boolean;
}

export interface AdminProduct {
  id: number;
  sectionId: number;
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
  active: boolean;
  sort: number;
  variants: AdminVariant[];
}

export interface AdminSlide {
  id: number;
  image: string;
  imageAlt: string;
  title: string;
  productId: number | null;
  active: boolean;
  sort: number;
}

export interface AdminCatalog {
  today: string;
  slides: AdminSlide[];
  sections: AdminSection[];
  products: AdminProduct[];
}

export interface AdminOrderSummary {
  id: number;
  code: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  delivery: 'envio' | 'retiro';
  totalCents: number;
  createdAt: string;
}

export interface AdminOrder extends AdminOrderSummary {
  city: string;
  address: string;
  payment: 'transferencia' | 'efectivo';
  notes: string;
  adminNotes: string;
  items: { productName: string; variantLabel: string; scent: string; unitCents: number; qty: number }[];
}
