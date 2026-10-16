import type { Catalog, Product, Section, StoreSettings, Tone } from '../src/shared/types';
import type { AdminCatalog, AdminProduct, AdminSection } from '../src/shared/admin-types';
import { isLive, localDate } from '../src/shared/dates';
import type { Env } from './env';

interface SectionRow {
  id: number; parent_id: number | null; slug: string; name: string; blurb: string; sort: number;
  active: number; starts_on: string | null; ends_on: string | null; tone: Tone;
}
interface ProductRow {
  id: number; section_id: number; slug: string; name: string; subtitle: string; description: string;
  label_color: string; image: string; image_alt: string; scents: string; tags: string;
  featured: number; active: number; sort: number;
}
interface VariantRow { id: number; product_id: number; label: string; price_cents: number; active: number; sort: number }

export function today(env: Env): string {
  return localDate(new Date(), Number(env.TIMEZONE_OFFSET_MINUTES ?? '-360'));
}

function parseScents(s: string): string[] {
  try {
    const v: unknown = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function rows(db: D1Database) {
  const [s, p, v] = await db.batch([
    db.prepare('SELECT * FROM sections ORDER BY sort, id'),
    db.prepare('SELECT * FROM products ORDER BY sort, id'),
    db.prepare('SELECT * FROM variants ORDER BY sort, id'),
  ]);
  return {
    sections: (s?.results ?? []) as SectionRow[],
    products: (p?.results ?? []) as ProductRow[],
    variants: (v?.results ?? []) as VariantRow[],
  };
}

/** Secciones visibles hoy: la sección y todas sus madres deben estar vivas. */
function liveIds(sections: SectionRow[], day: string): Set<number> {
  const byId = new Map(sections.map((s) => [s.id, s]));
  const live = new Set<number>();
  for (const s of sections) {
    let cur: SectionRow | undefined = s;
    let ok = true;
    for (let depth = 0; cur && depth < 8; depth++) {
      if (!isLive(cur, day)) { ok = false; break; }
      cur = cur.parent_id === null ? undefined : byId.get(cur.parent_id);
    }
    if (ok) live.add(s.id);
  }
  return live;
}

export async function loadSettings(db: D1Database, env: Env): Promise<StoreSettings> {
  const res = await db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
  const m = new Map(res.results.map((r) => [r.key, r.value]));
  return {
    whatsapp: m.get('whatsapp') ?? '',
    instagram: m.get('instagram') ?? '',
    announcement: m.get('announcement') ?? '',
    heroSection: m.get('hero_section') ?? '',
    deliveryNote: m.get('delivery_note') ?? '',
    ordersOpen: m.get('orders_open') !== '0',
    turnstileSiteKey: env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY ? env.TURNSTILE_SITE_KEY : '',
  };
}

export async function loadPublicCatalog(db: D1Database, env: Env): Promise<Catalog> {
  const day = today(env);
  const [{ sections, products, variants }, settings] = await Promise.all([rows(db), loadSettings(db, env)]);
  const live = liveIds(sections, day);

  const varsBy = new Map<number, Product['variants']>();
  for (const v of variants) {
    if (!v.active) continue;
    const list = varsBy.get(v.product_id) ?? [];
    list.push({ id: v.id, label: v.label, priceCents: v.price_cents });
    varsBy.set(v.product_id, list);
  }

  const prodsBy = new Map<number, Product[]>();
  for (const p of products) {
    const vs = varsBy.get(p.id);
    if (!p.active || !live.has(p.section_id) || !vs?.length) continue;
    const list = prodsBy.get(p.section_id) ?? [];
    list.push({
      id: p.id, slug: p.slug, name: p.name, subtitle: p.subtitle, description: p.description,
      labelColor: p.label_color, image: p.image, imageAlt: p.image_alt, scents: parseScents(p.scents),
      tags: p.tags, featured: !!p.featured, variants: vs,
    });
    prodsBy.set(p.section_id, list);
  }

  const build = (parentId: number | null, depth: number): Section[] =>
    depth > 2
      ? []
      : sections
          .filter((s) => s.parent_id === parentId && live.has(s.id))
          .map((s) => ({
            id: s.id, slug: s.slug, name: s.name, blurb: s.blurb, tone: s.tone,
            products: prodsBy.get(s.id) ?? [],
            children: build(s.id, depth + 1),
          }))
          .filter((s) => s.products.length > 0 || s.children.length > 0);

  return { sections: build(null, 0), settings };
}

export async function loadAdminCatalog(db: D1Database, env: Env): Promise<AdminCatalog> {
  const day = today(env);
  const { sections, products, variants } = await rows(db);
  const live = liveIds(sections, day);
  const adminSections: AdminSection[] = sections.map((s) => ({
    id: s.id, parentId: s.parent_id, slug: s.slug, name: s.name, blurb: s.blurb, sort: s.sort,
    active: !!s.active, startsOn: s.starts_on, endsOn: s.ends_on, tone: s.tone, live: live.has(s.id),
  }));
  const adminProducts: AdminProduct[] = products.map((p) => ({
    id: p.id, sectionId: p.section_id, slug: p.slug, name: p.name, subtitle: p.subtitle,
    description: p.description, labelColor: p.label_color, image: p.image, imageAlt: p.image_alt,
    scents: parseScents(p.scents), tags: p.tags, featured: !!p.featured, active: !!p.active, sort: p.sort,
    variants: variants
      .filter((v) => v.product_id === p.id)
      .map((v) => ({ id: v.id, label: v.label, priceCents: v.price_cents, active: !!v.active })),
  }));
  return { today: day, sections: adminSections, products: adminProducts };
}
