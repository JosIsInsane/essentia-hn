import { useEffect, useState } from 'react';
import type { StoreSettings } from '../shared/types';
import type { AdminSection } from '../shared/admin-types';
import { AdminError, api } from './api';
import { Field, Switch } from './ui';

type S = Omit<StoreSettings, 'turnstileSiteKey'>;

export function SettingsPage({ sections, toast }: { sections: AdminSection[]; toast: (m: string) => void }) {
  const [s, setS] = useState<S | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<StoreSettings>('GET', '/api/admin/settings')
      .then(({ turnstileSiteKey: _k, ...rest }) => setS(rest))
      .catch((e: unknown) => setError(e instanceof AdminError ? e.message : 'No se pudieron cargar los ajustes.'));
  }, []);
  if (!s) return error ? <p className="alert">{error}</p> : <p className="muted">Cargando…</p>;
  const up = <K extends keyof S>(k: K, v: S[K]) => setS({ ...s, [k]: v });

  async function save() {
    setBusy(true);
    setError('');
    setFields({});
    try {
      await api('PUT', '/api/admin/settings', s);
      toast('Ajustes guardados');
    } catch (e) {
      if (e instanceof AdminError) { setError(e.message); setFields(e.fields); } else setError('No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head"><div><h1>Ajustes</h1><p>Datos de contacto, aviso de arriba y pedidos en línea.</p></div></div>
      {error && <p className="alert" role="alert">{error}</p>}
      <div className="card stack" style={{ maxWidth: 680 }}>
        <Switch checked={s.ordersOpen} onChange={(v) => up('ordersOpen', v)} label="Recibir pedidos en la página" />
        <p className="small muted" style={{ margin: 0 }}>Si lo apagas, el carrito manda a la gente directo a WhatsApp.</p>
        <Field id="st-wa" label="WhatsApp de la tienda" hint="Con código de país y sin espacios, ej. 50495632609" error={fields.whatsapp}>
          <input id="st-wa" inputMode="numeric" value={s.whatsapp} onChange={(e) => up('whatsapp', e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Field id="st-ig" label="Usuario de Instagram" hint="Sin @" error={fields.instagram}>
          <input id="st-ig" value={s.instagram} onChange={(e) => up('instagram', e.target.value.replace(/^@/, ''))} />
        </Field>
        <Field id="st-ann" label="Aviso de arriba" hint="Vacío para no mostrar nada." error={fields.announcement}>
          <input id="st-ann" value={s.announcement} maxLength={120} onChange={(e) => up('announcement', e.target.value)} />
        </Field>
        <Field id="st-hero" label="Sección de portada" hint="Su producto destacado sale en la llama de arriba." error={fields.heroSection}>
          <select id="st-hero" value={s.heroSection} onChange={(e) => up('heroSection', e.target.value)}>
            {sections.filter((x) => x.parentId === null).map((x) => <option key={x.id} value={x.slug}>{x.name}{x.live ? '' : ' (oculta hoy)'}</option>)}
          </select>
        </Field>
        <Field id="st-del" label="Nota de envío" hint="Se muestra en el carrito." error={fields.deliveryNote}>
          <input id="st-del" value={s.deliveryNote} maxLength={200} onChange={(e) => up('deliveryNote', e.target.value)} />
        </Field>
        <div><button type="button" className="btn primary" onClick={save} disabled={busy}>{busy ? 'Guardando…' : 'Guardar ajustes'}</button></div>
      </div>
    </>
  );
}
