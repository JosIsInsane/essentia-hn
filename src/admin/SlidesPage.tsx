import { useState } from 'react';
import type { AdminCatalog, AdminSlide } from '../shared/admin-types';
import { imageAttrs } from '../site/images';
import { AdminError, api } from './api';
import { Field, Modal, Switch } from './ui';

type Draft = Omit<AdminSlide, 'id' | 'sort'> & { id?: number };
const blank = (): Draft => ({ image: '', imageAlt: '', title: '', productId: null, active: true });
const body = (d: Draft) => ({ image: d.image, imageAlt: d.imageAlt, title: d.title, productId: d.productId, active: d.active });

function SlideEditor({ draft, data, onClose, onSaved }: {
  draft: Draft | null; data: AdminCatalog; onClose: () => void; onSaved: (m: string) => void;
}) {
  const [d, setD] = useState<Draft | null>(draft);
  const [seen, setSeen] = useState(draft);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  if (draft !== seen) { setSeen(draft); setD(draft); setFields({}); setError(''); }
  if (!d) return <Modal open={false} title="" onClose={onClose}>{null}</Modal>;

  const up = <K extends keyof Draft>(k: K, v: Draft[K]) => setD({ ...d, [k]: v });
  const name = new Map(data.sections.map((s) => [s.id, s.name]));

  async function upload(file: File) {
    if (file.size > 4 * 1024 * 1024) { setError('La foto pesa más de 4 MB. Redúcela e intenta de nuevo.'); return; }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api<{ image: string }>('POST', '/api/admin/upload', fd);
      setD((cur) => (cur ? { ...cur, image: res.image } : cur));
    } catch (e) {
      setError(e instanceof AdminError ? e.message : 'No se pudo subir la foto.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!d) return;
    setBusy(true);
    setError('');
    setFields({});
    try {
      if (d.id) await api('PUT', `/api/admin/slides/${d.id}`, body(d));
      else await api('POST', '/api/admin/slides', body(d));
      onSaved(d.id ? 'Foto guardada' : 'Foto agregada');
    } catch (e) {
      if (e instanceof AdminError) { setError(e.message); setFields(e.fields); } else setError('No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!d?.id || !confirm('¿Quitar esta foto de la portada? Si solo quieres esconderla, mejor apágala.')) return;
    try {
      await api('DELETE', `/api/admin/slides/${d.id}`);
      onSaved('Foto quitada');
    } catch (e) {
      setError(e instanceof AdminError ? e.message : 'No se pudo quitar.');
    }
  }

  return (
    <Modal open title={d.id ? 'Editar foto de portada' : 'Nueva foto de portada'} onClose={onClose}
      footer={<>
        {d.id ? <button type="button" className="btn danger" onClick={remove}>Quitar</button> : <span />}
        <div className="row">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn primary" onClick={save} disabled={busy || uploading}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </>}>
      {error && <p className="alert" role="alert">{error}</p>}
      <div className="row" style={{ alignItems: 'flex-start', gap: 18 }}>
        {d.image ? <img className="thumb" src={imageAttrs(d.image).src} alt="" /> : <div className="thumb" aria-hidden="true" />}
        <div className="stack" style={{ flex: 1, minWidth: 220 }}>
          <Field id="s-file" label="Foto" hint="JPG, PNG o WebP de hasta 4 MB. Mejor vertical (4:5)." error={fields.image}>
            <input id="s-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }} />
          </Field>
          <Field id="s-alt" label="Descripción de la foto" hint="Para lectores de pantalla: qué se ve en la foto." error={fields.imageAlt}>
            <input id="s-alt" value={d.imageAlt} maxLength={200} onChange={(e) => up('imageAlt', e.target.value)} />
          </Field>
        </div>
      </div>
      <Field id="s-title" label="Texto bajo la foto" hint="Opcional, ej. “Nueva colección”." error={fields.title}>
        <input id="s-title" value={d.title} maxLength={60} onChange={(e) => up('title', e.target.value)} />
      </Field>
      <Field id="s-prod" label="Al tocar la foto" hint="Opcional: abre este producto." error={fields.productId}>
        <select id="s-prod" value={d.productId ?? ''} onChange={(e) => up('productId', e.target.value ? Number(e.target.value) : null)}>
          <option value="">No abre nada</option>
          {data.products.map((p) => (
            <option key={p.id} value={p.id}>{name.get(p.sectionId) ?? ''} › {p.name}</option>
          ))}
        </select>
      </Field>
      <Switch checked={d.active} onChange={(v) => up('active', v)} label="Visible en la portada" />
    </Modal>
  );
}

export function SlidesPage({ data, reload, toast }: { data: AdminCatalog; reload: () => Promise<void>; toast: (m: string) => void }) {
  const [edit, setEdit] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const featured = data.products.filter((p) => p.featured && p.active);
  const list = data.slides;
  const pname = new Map(data.products.map((p) => [p.id, p.name]));

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await reload();
      toast(ok);
    } catch (e) {
      setError(e instanceof AdminError ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }
  const move = (id: number, dir: -1 | 1) => {
    const i = list.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const ids = list.map((x) => x.id);
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    void run(() => api('POST', '/api/admin/reorder', { kind: 'slides', ids }), 'Orden guardado');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Portada</h1>
          <p>Las fotos que van pasando arriba en la tienda. Primero salen los productos marcados “Destacado” y después las fotos de esta lista.</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setEdit(blank())}>Agregar foto</button>
      </div>
      {error && <p className="alert" role="alert">{error}</p>}

      <div className="sec" style={{ marginBottom: 18 }}>
        <div className="sec-row" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <div>
            <div className="sec-name">Productos destacados ({featured.length})</div>
            <div className="sec-meta">Salen solos. Para quitar uno, apaga “Destacado” en su ficha del Catálogo.</div>
          </div>
        </div>
        <div className="plist">
          {featured.length === 0 && <p className="small muted" style={{ margin: 0, padding: '10px 16px' }}>Ninguno por ahora.</p>}
          {featured.map((p) => (
            <div className="prow" key={p.id} style={{ gridTemplateColumns: '56px minmax(0, 1fr)' }}>
              <img src={imageAttrs(p.image).src} alt="" loading="lazy" />
              <div className="name">{p.name} ★</div>
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <div className="sec-row" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <div>
            <div className="sec-name">Fotos solo de portada ({list.length})</div>
            <div className="sec-meta">No aparecen en el catálogo.</div>
          </div>
        </div>
        <div className="plist">
          {list.length === 0 && <p className="small muted" style={{ margin: 0, padding: '10px 16px' }}>Todavía no hay. Usa “Agregar foto”.</p>}
          {list.map((s) => (
            <div className="prow" key={s.id}>
              <img src={imageAttrs(s.image).src} alt="" className={s.active ? '' : 'dim'} loading="lazy" />
              <div className={s.active ? '' : 'dim'}>
                <div className="name">{s.title || 'Sin texto'}</div>
                <div className="small muted">{s.productId ? `Abre: ${pname.get(s.productId) ?? 'producto borrado'}` : 'No abre nada'}</div>
              </div>
              <Switch checked={s.active} disabled={busy} label="Visible"
                onChange={(v) => run(() => api('PUT', `/api/admin/slides/${s.id}`, body({ ...s, active: v })), v ? 'Foto visible' : 'Foto oculta')} />
              <div className="tools">
                <button type="button" className="icon" aria-label="Subir" disabled={busy || list[0]?.id === s.id} onClick={() => move(s.id, -1)}>↑</button>
                <button type="button" className="icon" aria-label="Bajar" disabled={busy || list.at(-1)?.id === s.id} onClick={() => move(s.id, 1)}>↓</button>
                <button type="button" className="btn small" onClick={() => setEdit({ ...s })}>Editar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SlideEditor draft={edit} data={data} onClose={() => setEdit(null)}
        onSaved={async (m) => { setEdit(null); await reload(); toast(m); }} />
    </>
  );
}
