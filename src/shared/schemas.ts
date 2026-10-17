import { z } from 'zod';
import { clean } from './text';

// Mensajes de error en español.
z.config(z.locales.es());

const line = (min: number, max: number, msg?: string) =>
  z.string().transform((s) => clean(s)).pipe(z.string().min(min, msg).max(max, msg));
const block = (max: number) =>
  z.string().transform((s) => clean(s, true)).pipe(z.string().max(max));
const id = z.number().int().positive().max(2_147_483_647);

/* ---------- Pedido público ---------- */

export const orderItemSchema = z.object({
  productId: id,
  variantId: id,
  scent: line(0, 40).default(''),
  qty: z.number().int().min(1).max(20),
}).strict();

export const orderSchema = z
  .object({
    items: z.array(orderItemSchema).min(1).max(30),
    name: line(2, 80, 'Escribe tu nombre (2 a 80 letras)'),
    phone: z
      .string()
      .transform((s) => s.replace(/[\s\-().]/g, ''))
      .pipe(z.string().regex(/^\+?\d{8,15}$/, 'Escribe un número de 8 dígitos, ej. 9563-2609')),
    delivery: z.enum(['envio', 'retiro']),
    city: line(0, 60).default(''),
    address: block(240).default(''),
    payment: z.enum(['transferencia', 'efectivo']),
    notes: block(500).default(''),
    website: z.string().max(0).default(''), // trampa para bots: debe ir vacío
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict()
  .superRefine((o, ctx) => {
    if (o.delivery === 'envio') {
      if (o.city.length < 2) ctx.addIssue({ code: 'custom', path: ['city'], message: 'Escribe la ciudad o colonia' });
      if (o.address.length < 5) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Escribe la dirección de entrega' });
    }
  });
export type OrderInput = z.infer<typeof orderSchema>;

/* ---------- Admin ---------- */

export const loginSchema = z.object({ password: z.string().min(1).max(200) }).strict();

const dateOrNull = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .or(z.literal('').transform(() => null));

export const sectionSchema = z
  .object({
    parentId: id.nullable(),
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,59}$/, 'Solo minúsculas, números y guiones'),
    name: line(1, 80),
    blurb: block(300).default(''),
    active: z.boolean(),
    startsOn: dateOrNull.default(null),
    endsOn: dateOrNull.default(null),
    tone: z.enum(['cream', 'wine', 'blush', 'amber']),
  })
  .strict()
  .refine((s) => !s.startsOn || !s.endsOn || s.startsOn <= s.endsOn, {
    path: ['endsOn'],
    message: 'La fecha final va después de la inicial',
  });
export type SectionInput = z.infer<typeof sectionSchema>;

export const imageRef = z.string().regex(/^(static:[a-z0-9-]{1,60}|r2:[a-f0-9]{32}\.(jpg|png|webp))?$/);

export const productSchema = z
  .object({
    sectionId: id,
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,59}$/, 'Solo minúsculas, números y guiones'),
    name: line(1, 80),
    subtitle: line(0, 120).default(''),
    description: block(600).default(''),
    labelColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    image: imageRef,
    imageAlt: line(0, 200).default(''),
    scents: z.array(line(1, 40)).max(12).default([]),
    tags: line(0, 200).default(''),
    featured: z.boolean(),
    active: z.boolean(),
    variants: z
      .array(
        z.object({
          id: id.optional(),
          label: line(1, 40),
          priceCents: z.number().int().min(0).max(10_000_000),
          active: z.boolean().default(true),
        }),
      )
      .min(1)
      .max(8),
  })
  .strict();
export type ProductInput = z.infer<typeof productSchema>;

export const slideSchema = z
  .object({
    image: imageRef.refine((s) => s !== '', 'Sube una foto'),
    imageAlt: line(0, 200).default(''),
    title: line(0, 60).default(''),
    productId: id.nullable().default(null),
    active: z.boolean(),
  })
  .strict();
export type SlideInput = z.infer<typeof slideSchema>;

export const reorderSchema = z
  .object({ kind: z.enum(['sections', 'products', 'slides']), ids: z.array(id).min(1).max(500) })
  .strict();

export const settingsSchema = z
  .object({
    whatsapp: z.string().regex(/^\d{8,15}$/, 'Solo números con código de país, ej. 50495632609'),
    instagram: z.string().regex(/^[A-Za-z0-9._]{1,30}$/),
    announcement: line(0, 120),
    heroSection: z.string().regex(/^[a-z0-9-]{0,60}$/),
    deliveryNote: line(0, 200),
    ordersOpen: z.boolean(),
  })
  .strict();
export type SettingsInput = z.infer<typeof settingsSchema>;

export const orderUpdateSchema = z
  .object({
    status: z.enum(['nuevo', 'confirmado', 'listo', 'entregado', 'cancelado']),
    adminNotes: block(1000).default(''),
  })
  .strict();
