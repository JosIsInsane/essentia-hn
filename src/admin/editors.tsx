import { useEffect, useState } from 'react';
import type { AdminProduct, AdminSection } from '../shared/admin-types';
import type { Tone } from '../shared/types';
import { slugify } from '../shared/text';
import { AdminError, api } from './api';
import { Field, Modal, Switch } from './ui';
import { imageAttrs } from '../site/images';

/* ---------- Sección ---------- */

export interface SectionDraft {
  id?: number;
  parentId: number | null;
  slug: string;
  name: string;
  blurb: string;
  active: boolean;
  startsOn: string | null;
  endsOn: string | null;
  tone: Tone;
}

export const sectionBody = (s: SectionDraft) => ({
  parentId: s.parentId, slug: s.slug, name: s.name, blurb: s.blurb, active: s.active,
  startsOn: s.startsOn || null, endsOn: s.endsOn || null, tone: s.tone,
});

const TONES: { value: Tone; label: string }[] = [
  { value: 'cream', label: 'Crema' },
  { value: 'wine', label: 'Vino' },
  { value: 'blush', label: 'Rosa' },
  { value: 'amber', label: 'Ámbar' },
];

export function SectionEditor({ draft, sections, onClose, onSaved }: {
  draft: SectionDraft | null; sections: AdminSection[]; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const [s, setS] = useState<SectionDraft | null>(draft);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setS(draft); setFields({}); setError(''); }, [draft]);
  if (!s) return <Modal open={false} title="" onClose={onClose}>{null}</Modal>;

  const tops = sections.filter((x) => x.parentId === null && x.id !== s.id);
  const up = <K extends keyof SectionDraft>(k: K, v: SectionDraft[K]) => setS({ ...s, [k]: v });

  async function save() {
    if (!s) return;
    setBusy(true);
    setError('');
    try {
      if (s.id) await api('PUT', `/api/admin/sections/${s.id}`, sectionBody(s));
      else await api('POST', '/api/admin/sections', sectionBody(s));
      onSaved(s.id ? 'Sección guardada' : 'Sección creada');
    } catch (e) {
      if (e instanceof AdminError) { setError(e.message); setFields(e.fields); } else setError('No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!s?.id || !confirm(`¿Borrar la sección “${s.name}”? Esto no se puede deshacer.`)) return;
    try {
      await api('DELETE', `/api/admin/sections/${s.id}`);
      onSaved('Sección borrada');
    } catch (e) {
      setError(e instanceof AdminError ? e.message : 'No se pudo borrar.');
    }
  }

  return (
    <Modal open title={s.id ? `Editar ${s.name}` : 'Nueva sección'} onClose={onClose}
      footer={<>
        {s.id ? <button type="button" className="btn danger" onClick={remove}>Borrar</button> : <span />}
        <div className="row">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn primary" onClick={save} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </>}>
      {error && <p className="alert" role="alert">{error}</p>}
      <div className="grid2">
        <Field id="s-name" label="Nombre" error={fields.name}>
          <input id="s-name" value={s.name} maxLength={80}
            onChange={(e) => setS({ ...s, name: e.target.value, slug: s.id ? s.slug : slugify(e.target.value) })} />
        </Field>
        <Field id="s-slug" label="Dirección (slug)" hint="Aparece en el enlace: #s-otono" error={fields.slug}>
          <input id="s-slug" value={s.slug} maxLength={60} onChange={(e) => up('slug', e.target.value)} />
        </Field>
      </div>
      <Field id="s-blurb" label="Texto corto" hint="Se muestra junto al título. Opcional." error={fields.blurb}>
        <textarea id="s-blurb" value={s.blurb} maxLength={300} onChange={(e) => up('blurb', e.target.value)} />
      </Field>
      <div className="grid2">
        <Field id="s-parent" label="Va dentro de" error={fields.parentId}>
          <select id="s-parent" value={s.parentId ?? ''} onChange={(e) => up('parentId', e.target.value ? Number(e.target.value) : null)}>
            <option value="">Ninguna (sección principal)</option>
            {tops.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field id="s-tone" label="Color de fondo">
          <select id="s-tone" value={s.tone} onChange={(e) => up('tone', e.target.value as Tone)}>
            {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid2">
        <Field id="s-start" label="Visible desde" hint="Vacío = desde ya" error={fields.startsOn}>
          <input id="s-start" type="date" value={s.startsOn ?? ''} onChange={(e) => up('startsOn', e.target.value || null)} />
        </Field>
        <Field id="s-end" label="Visible hasta" hint="Vacío = sin fecha de fin" error={fields.endsOn}>
          <input id="s-end" type="date" value={s.endsOn ?? ''} onChange={(e) => up('endsOn', e.target.value || null)} />
        </Field>
      </div>
      <Switch checked={s.active} onChange={(v) => up('active', v)} label="Sección encendida" />
    </Modal>
  );
}

/* ---------- Producto ---------- */

export type ProductDraft = Omit<AdminProduct, 'id' | 'sort'> & { id?: number };

export const productBody = (p: ProductDraft) => ({
  sectionId: p.sectionId, slug: p.slug, name: p.name, subtitle: p.subtitle, description: p.description,
  labelColor: p.labelColor, image: p.image, imageAlt: p.imageAlt, scents: p.scents, tags: p.tags,
  featured: p.featured, active: p.active,
  variants: p.variants.map((v) => ({ ...(v.id > 0 ? { id: v.id } : {}), label: v.label, priceCents: v.priceCents, active: v.active })),
});

let tempId = -1;

export function ProductEditor({ draft, sections, onClose, onSaved }: {
  draft: ProductDraft | null; sections: AdminSection[]; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const [p, setP] = useState<ProductDraft | null>(draft);
  const [scentText, setScentText] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    setP(draft);
    setScentText(draft?.scents.join(', ') ?? '');
    setFields({});
    setError('');
  }, [draft]);
  if (!p) return <Modal open={false} title="" onClose={onClose}>{null}</Modal>;

  const up = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => setP({ ...p, [k]: v });
  const setVariant = (i: number, patch: Partial<ProductDraft['variants'][number]>) =>
    up('variants', p.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const byParent = (id: number | null) => sections.filter((s) => s.parentId === id);

  async function upload(file: File) {
    if (!p) return;
    if (file.size > 4 * 1024 * 1024) { setError('La foto pesa más de 4 MB. Redúcela e intenta de nuevo.'); return; }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api<{ image: string }>('POST', '/api/admin/upload', fd);
      setP((cur) => (cur ? { ...cur, image: res.image } : cur));
    } catch (e) {
      setError(e instanceof AdminError ? e.message : 'No se pudo subir la foto.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!p) return;
    const scents = scentText.split(',').map((x) => x.trim()).filter(Boolean);
    const body = productBody({ ...p, scents });
    setBusy(true);
    setError('');
    try {
      if (p.id) await api('PUT', `/api/admin/products/${p.id}`, body);
      else await api('POST', '/api/admin/products', body);
      onSaved(p.id ? 'Producto guardado' : 'Producto creado');
    } catch (e) {
      if (e instanceof AdminError) { setError(e.message); setFields(e.fields); } else setError('No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!p?.id || !confirm(`¿Borrar “${p.name}”? Si solo quieres esconderlo, mejor apágalo.`)) return;
    try {
      await api('DELETE', `/api/admin/products/${p.id}`);
      onSaved('Producto borrado');
    } catch (e) {
      setError(e instanceof AdminError ? e.message : 'No se pudo borrar.');
    }
  }

  const img = imageAttrs(p.image);
  return (
    <Modal open title={p.id ? `Editar ${p.name}` : 'Nuevo producto'} onClose={onClose}
      footer={<>
        {p.id ? <button type="button" className="btn danger" onClick={remove}>Borrar</button> : <span />}
        <div className="row">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn primary" onClick={save} disabled={busy || uploading}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </>}>
      {error && <p className="alert" role="alert">{error}</p>}
      <div className="row" style={{ alignItems: 'flex-start', gap: 18 }}>
        <img className="thumb" src={img.src} alt="" />
        <div className="stack" style={{ flex: 1, minWidth: 220 }}>
          <Field id="p-file" label="Foto" hint="JPG, PNG o WebP de hasta 4 MB. Mejor vertical (4:5).">
            <input id="p-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }} />
          </Field>
          <Field id="p-alt" label="Descripción de la foto" hint="Para lectores de pantalla: qué se ve en la foto." error={fields.imageAlt}>
            <input id="p-alt" value={p.imageAlt} maxLength={200} onChange={(e) => up('imageAlt', e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="grid2">
        <Field id="p-name" label="Nombre" error={fields.name}>
          <input id="p-name" value={p.name} maxLength={80} onChange={(e) => setP({ ...p, name: e.target.value, slug: p.id ? p.slug : slugify(e.target.value) })} />
        </Field>
        <Field id="p-slug" label="Slug" error={fields.slug}>
          <input id="p-slug" value={p.slug} maxLength={60} onChange={(e) => up('slug', e.target.value)} />
        </Field>
      </div>
      <Field id="p-sub" label="Subtítulo" hint="Línea corta bajo el nombre, ej. “Canela”." error={fields.subtitle}>
        <input id="p-sub" value={p.subtitle} maxLength={120} onChange={(e) => up('subtitle', e.target.value)} />
      </Field>
      <Field id="p-desc" label="Descripción" hint="Las notas del aroma. Opcional." error={fields.description}>
        <textarea id="p-desc" value={p.description} maxLength={600} onChange={(e) => up('description', e.target.value)} />
      </Field>
      <div className="grid2">
        <Field id="p-sec" label="Sección" error={fields.sectionId}>
          <select id="p-sec" value={p.sectionId} onChange={(e) => up('sectionId', Number(e.target.value))}>
            {byParent(null).map((top) => (
              <optgroup key={top.id} label={top.name}>
                <option value={top.id}>{top.name}</option>
                {byParent(top.id).map((c) => <option key={c.id} value={c.id}>{top.name} › {c.name}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field id="p-color" label="Color de la etiqueta" error={fields.labelColor}>
          <input id="p-color" type="color" value={p.labelColor} onChange={(e) => up('labelColor', e.target.value)} />
        </Field>
      </div>
      <Field id="p-scents" label="Aromas a elegir" hint="Separados por comas. Vacío si el producto ya trae su aroma." error={fields.scents}>
        <input id="p-scents" value={scentText} onChange={(e) => setScentText(e.target.value)} placeholder="Vainilla, Canela, Lavanda" />
      </Field>
      <Field id="p-tags" label="Palabras para la búsqueda" hint="Ej. regalo, floral, carro." error={fields.tags}>
        <input id="p-tags" value={p.tags} maxLength={200} onChange={(e) => up('tags', e.target.value)} />
      </Field>
      <div className="field">
        <span className="lbl">Tamaños y precios (lempiras)</span>
        <div className="variants">
          {p.variants.map((v, i) => (
            <div className="variant" key={v.id}>
              <input aria-label={`Tamaño ${i + 1}`} value={v.label} maxLength={40} placeholder="7 oz" onChange={(e) => setVariant(i, { label: e.target.value })} />
              <PriceInput label={`Precio ${i + 1}`} cents={v.priceCents} onChange={(c) => setVariant(i, { priceCents: c })} />
              <Switch checked={v.active} onChange={(x) => setVariant(i, { active: x })} label="Activo" />
              <button type="button" className="icon" aria-label={`Quitar tamaño ${i + 1}`} disabled={p.variants.length === 1}
                onClick={() => up('variants', p.variants.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
        {fields.variants && <span className="err">{fields.variants}</span>}
        <div><button type="button" className="btn small" disabled={p.variants.length >= 8}
          onClick={() => up('variants', [...p.variants, { id: tempId--, label: '', priceCents: 0, active: true }])}>Agregar tamaño</button></div>
      </div>
      <div className="row" style={{ gap: 24 }}>
        <Switch checked={p.active} onChange={(v) => up('active', v)} label="Visible en la tienda" />
        <Switch checked={p.featured} onChange={(v) => up('featured', v)} label="Destacado (portada)" />
      </div>
    </Modal>
  );
}

/** Precio en lempiras: se puede borrar todo y escribir de nuevo; al salir se ordena el formato. */
function PriceInput({ label, cents, onChange }: { label: string; cents: number; onChange: (c: number) => void }) {
  const fmt = (c: number) => (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2));
  const [text, setText] = useState(fmt(cents));
  useEffect(() => {
    // Si el valor cambia desde afuera (otro producto), se sincroniza; si es el mismo número, se respeta lo escrito.
    setText((t) => (Math.round((parseFloat(t.replace(',', '.')) || 0) * 100) === cents ? t : fmt(cents)));
  }, [cents]);
  return (
    <span className="price-input">
      <span aria-hidden="true">L</span>
      <input aria-label={label} type="text" inputMode="decimal" autoComplete="off" value={text} placeholder="0"
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d.,]/g, '').slice(0, 9);
          if ((t.match(/[.,]/g) ?? []).length > 1) return;
          setText(t);
          onChange(Math.round((parseFloat(t.replace(',', '.')) || 0) * 100));
        }}
        onBlur={() => setText(fmt(cents))} />
    </span>
  );
}

export function newProduct(sectionId: number): ProductDraft {
  return {
    sectionId, slug: '', name: '', subtitle: '', description: '', labelColor: '#650f23', image: '', imageAlt: '',
    scents: [], tags: '', featured: false, active: true, variants: [{ id: tempId--, label: 'Unidad', priceCents: 0, active: true }],
  };
}
