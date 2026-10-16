import { useState } from 'react';
import type { AdminCatalog, AdminProduct, AdminSection } from '../shared/admin-types';
import { lempiras } from '../shared/money';
import { imageAttrs } from '../site/images';
import { AdminError, api } from './api';
import { newProduct, productBody, ProductEditor, sectionBody, SectionEditor, type ProductDraft, type SectionDraft } from './editors';
import { fmtDate, Switch } from './ui';

function statusOf(s: AdminSection, parent: AdminSection | undefined, today: string): { cls: string; text: string } {
  if (s.live) return { cls: 'live', text: s.endsOn ? `Visible hasta el ${fmtDate(s.endsOn)}` : 'Visible hoy' };
  if (!s.active) return { cls: 'off', text: 'Apagada' };
  if (s.startsOn && today < s.startsOn) return { cls: 'sched', text: `Aparece el ${fmtDate(s.startsOn)}` };
  if (s.endsOn && today > s.endsOn) return { cls: 'off', text: `Terminó el ${fmtDate(s.endsOn)}` };
  if (parent && !parent.live) return { cls: 'off', text: `Oculta porque “${parent.name}” está oculta` };
  return { cls: 'off', text: 'Oculta' };
}

function move<T extends { id: number }>(list: T[], id: number, dir: -1 | 1): number[] | null {
  const i = list.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return null;
  const ids = list.map((x) => x.id);
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  return ids;
}

export function CatalogPage({ data, reload, toast }: { data: AdminCatalog; reload: () => Promise<void>; toast: (m: string) => void }) {
  const [sec, setSec] = useState<SectionDraft | null>(null);
  const [prod, setProd] = useState<ProductDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const children = (id: number | null) => data.sections.filter((s) => s.parentId === id);
  const productsOf = (id: number) => data.products.filter((p) => p.sectionId === id);
  const byId = new Map(data.sections.map((s) => [s.id, s]));

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

  const saveSection = (s: AdminSection, patch: Partial<SectionDraft>, ok: string) =>
    run(() => api('PUT', `/api/admin/sections/${s.id}`, sectionBody({ ...s, ...patch })), ok);
  const saveProduct = (p: AdminProduct, patch: Partial<AdminProduct>, ok: string) =>
    run(() => api('PUT', `/api/admin/products/${p.id}`, productBody({ ...p, ...patch })), ok);
  const reorder = (kind: 'sections' | 'products', ids: number[] | null) =>
    ids && run(() => api('POST', '/api/admin/reorder', { kind, ids }), 'Orden guardado');

  const saved = async (msg: string) => {
    setSec(null);
    setProd(null);
    await reload();
    toast(msg);
  };

  const sectionRow = (s: AdminSection, siblings: AdminSection[], child = false) => {
    const st = statusOf(s, s.parentId ? byId.get(s.parentId) : undefined, data.today);
    return (
      <div className={`sec-row${child ? ' child' : ''}`}>
        <Switch checked={s.active} disabled={busy} onChange={(v) => saveSection(s, { active: v }, v ? `${s.name} encendida` : `${s.name} apagada`)}
          label="Encendida" />
        <div>
          <div className="sec-name">{s.name}</div>
          <div className="sec-meta">
            <span className={`status ${st.cls}`}>{st.text}</span>
            {(productsOf(s.id).length > 0 || children(s.id).length === 0) && (
              <span>{productsOf(s.id).filter((p) => p.active).length} de {productsOf(s.id).length} productos visibles</span>
            )}
          </div>
          <div className="dates" style={{ marginTop: 8 }}>
            <label className="small muted" htmlFor={`from-${s.id}`}>Desde</label>
            <input key={`from-${s.id}-${s.startsOn}`} id={`from-${s.id}`} type="date" defaultValue={s.startsOn ?? ''} disabled={busy}
              onBlur={(e) => { const v = e.target.value || null; if (v !== s.startsOn) void saveSection(s, { startsOn: v }, 'Fecha guardada'); }} />
            <label className="small muted" htmlFor={`to-${s.id}`}>hasta</label>
            <input key={`to-${s.id}-${s.endsOn}`} id={`to-${s.id}`} type="date" defaultValue={s.endsOn ?? ''} disabled={busy}
              onBlur={(e) => { const v = e.target.value || null; if (v !== s.endsOn) void saveSection(s, { endsOn: v }, 'Fecha guardada'); }} />
          </div>
        </div>
        <div className="tools">
          <button type="button" className="icon" aria-label={`Subir ${s.name}`} disabled={busy || siblings[0]?.id === s.id} onClick={() => reorder('sections', move(siblings, s.id, -1))}>↑</button>
          <button type="button" className="icon" aria-label={`Bajar ${s.name}`} disabled={busy || siblings.at(-1)?.id === s.id} onClick={() => reorder('sections', move(siblings, s.id, 1))}>↓</button>
          <button type="button" className="btn small" onClick={() => setSec({ ...s })}>Editar</button>
        </div>
      </div>
    );
  };

  const products = (s: AdminSection) => {
    const list = productsOf(s.id);
    return (
      <div className="plist">
        {list.map((p) => {
          const prices = p.variants.filter((v) => v.active).map((v) => `${v.label} ${lempiras(v.priceCents)}`).join(' · ');
          return (
            <div className="prow" key={p.id}>
              <img src={imageAttrs(p.image).src} alt="" className={p.active ? '' : 'dim'} loading="lazy" />
              <div className={p.active ? '' : 'dim'}>
                <div className="name">{p.name}{p.featured ? ' ★' : ''}</div>
                <div className="small muted">{prices || 'Sin precio activo'}</div>
              </div>
              <Switch checked={p.active} disabled={busy} onChange={(v) => saveProduct(p, { active: v }, v ? `${p.name} visible` : `${p.name} oculto`)} label="Visible" />
              <div className="tools">
                <button type="button" className="icon" aria-label={`Subir ${p.name}`} disabled={busy || list[0]?.id === p.id} onClick={() => reorder('products', move(list, p.id, -1))}>↑</button>
                <button type="button" className="icon" aria-label={`Bajar ${p.name}`} disabled={busy || list.at(-1)?.id === p.id} onClick={() => reorder('products', move(list, p.id, 1))}>↓</button>
                <button type="button" className="btn small" onClick={() => setProd({ ...p })}>Editar</button>
              </div>
            </div>
          );
        })}
        <div className="prow" style={{ gridTemplateColumns: '1fr' }}>
          <div><button type="button" className="btn small" onClick={() => setProd(newProduct(s.id))}>Agregar producto en {s.name}</button></div>
        </div>
      </div>
    );
  };

  const tops = children(null);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Catálogo</h1>
          <p>Enciende o apaga secciones, ponles fechas y ordena lo que se ve en la tienda. Hoy es {fmtDate(data.today)}.</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setSec({ parentId: null, slug: '', name: '', blurb: '', active: false, startsOn: null, endsOn: null, tone: 'cream' })}>
          Nueva sección
        </button>
      </div>
      {error && <p className="alert" role="alert">{error}</p>}
      {tops.map((t) => {
        const kids = children(t.id);
        return (
          <div className="sec" key={t.id}>
            {sectionRow(t, tops)}
            {productsOf(t.id).length > 0 || kids.length === 0 ? products(t) : null}
            {kids.map((k) => (
              <div key={k.id}>
                {sectionRow(k, kids, true)}
                {products(k)}
              </div>
            ))}
          </div>
        );
      })}
      <SectionEditor draft={sec} sections={data.sections} onClose={() => setSec(null)} onSaved={saved} />
      <ProductEditor draft={prod} sections={data.sections} onClose={() => setProd(null)} onSaved={saved} />
    </>
  );
}
