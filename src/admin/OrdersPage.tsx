import { useCallback, useEffect, useState } from 'react';
import type { AdminOrder, AdminOrderSummary } from '../shared/admin-types';
import { ORDER_STATUSES, type OrderStatus } from '../shared/types';
import { lempiras } from '../shared/money';
import { AdminError, api } from './api';

const LABEL: Record<OrderStatus, string> = { nuevo: 'Nuevo', confirmado: 'Confirmado', listo: 'Listo', entregado: 'Entregado', cancelado: 'Cancelado' };
const when = (s: string) => new Date(s.replace(' ', 'T') + 'Z').toLocaleString('es-HN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Tegucigalpa' });

export function OrdersPage({ toast, onCounts }: { toast: (m: string) => void; onCounts: (n: number) => void }) {
  const [filter, setFilter] = useState<OrderStatus | ''>('nuevo');
  const [list, setList] = useState<AdminOrderSummary[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sel, setSel] = useState<AdminOrder | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams({ page: String(page), ...(filter ? { status: filter } : {}) });
      const r = await api<{ orders: AdminOrderSummary[]; hasMore: boolean; counts: Record<string, number> }>('GET', `/api/admin/orders?${q}`);
      setList(r.orders);
      setHasMore(r.hasMore);
      setCounts(r.counts);
      onCounts(r.counts.nuevo ?? 0);
    } catch (e) {
      setError(e instanceof AdminError ? e.message : 'No se pudieron cargar los pedidos.');
    }
  }, [filter, page, onCounts]);
  useEffect(() => { void load(); }, [load]);

  async function open(id: number) {
    try {
      setSel(await api<AdminOrder>('GET', `/api/admin/orders/${id}`));
    } catch (e) {
      setError(e instanceof AdminError ? e.message : 'No se pudo abrir el pedido.');
    }
  }

  async function save(status: OrderStatus, adminNotes: string) {
    if (!sel) return;
    try {
      await api('PATCH', `/api/admin/orders/${sel.id}`, { status, adminNotes });
      setSel({ ...sel, status, adminNotes });
      toast(`Pedido ${sel.code}: ${LABEL[status].toLowerCase()}`);
      await load();
    } catch (e) {
      setError(e instanceof AdminError ? e.message : 'No se pudo guardar.');
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <>
      <div className="page-head">
        <div><h1>Pedidos</h1><p>Los pedidos de la página llegan aquí. Confírmalos con el cliente por WhatsApp.</p></div>
        <button type="button" className="btn" onClick={() => void load()}>Actualizar</button>
      </div>
      {error && <p className="alert" role="alert">{error}</p>}
      <div className="chips" role="group" aria-label="Filtrar por estado">
        <button type="button" className="chip" aria-pressed={filter === ''} onClick={() => { setFilter(''); setPage(0); }}>Todos ({total})</button>
        {ORDER_STATUSES.map((s) => (
          <button key={s} type="button" className="chip" aria-pressed={filter === s} onClick={() => { setFilter(s); setPage(0); }}>
            {LABEL[s]} ({counts[s] ?? 0})
          </button>
        ))}
      </div>
      <div className="split">
        <div className="card table-wrap" style={{ padding: 0 }}>
          {list.length === 0 ? (
            <p className="muted" style={{ padding: 18, margin: 0 }}>No hay pedidos {filter ? `en “${LABEL[filter]}”` : 'todavía'}.</p>
          ) : (
            <table>
              <thead><tr><th>Código</th><th>Cliente</th><th>Fecha</th><th className="num">Total</th></tr></thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} aria-selected={sel?.id === o.id} tabIndex={0} onClick={() => void open(o.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void open(o.id); } }}>
                    <td><strong>{o.code}</strong><br /><span className={`pill ${o.status}`}>{LABEL[o.status]}</span></td>
                    <td>{o.customerName}<br /><span className="small muted">{o.delivery === 'envio' ? 'Envío' : 'Retiro'}</span></td>
                    <td className="small">{when(o.createdAt)}</td>
                    <td className="num">{lempiras(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(page > 0 || hasMore) && (
            <div className="row" style={{ padding: 12, justifyContent: 'space-between' }}>
              <button type="button" className="btn small" disabled={page === 0} onClick={() => setPage(page - 1)}>Anteriores</button>
              <button type="button" className="btn small" disabled={!hasMore} onClick={() => setPage(page + 1)}>Siguientes</button>
            </div>
          )}
        </div>
        {sel ? <OrderDetail key={sel.id} order={sel} onSave={save} /> : <div className="card muted">Elige un pedido para ver el detalle.</div>}
      </div>
    </>
  );
}

function OrderDetail({ order, onSave }: { order: AdminOrder; onSave: (s: OrderStatus, notes: string) => Promise<void> }) {
  const [status, setStatus] = useState(order.status);
  const [notes, setNotes] = useState(order.adminNotes);
  const phone = order.phone.replace(/\D/g, '');
  const wa = `https://wa.me/${phone.length === 8 ? '504' + phone : phone}?text=${encodeURIComponent(`Hola ${order.customerName}, te escribimos de Essentia sobre tu pedido ${order.code}.`)}`;
  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>{order.code}</h2>
        <span className={`pill ${order.status}`}>{LABEL[order.status]}</span>
      </div>
      <p className="small muted" style={{ margin: 0 }}>{when(order.createdAt)}</p>
      <table>
        <tbody>
          {order.items.map((i, n) => (
            <tr key={n} style={{ cursor: 'default' }}>
              <td>{i.qty} × {i.productName}<br /><span className="small muted">{[i.variantLabel, i.scent].filter(Boolean).join(' · ')}</span></td>
              <td className="num">{lempiras(i.unitCents * i.qty)}</td>
            </tr>
          ))}
          <tr style={{ cursor: 'default' }}><td><strong>Total sin envío</strong></td><td className="num"><strong>{lempiras(order.totalCents)}</strong></td></tr>
        </tbody>
      </table>
      <div className="small">
        <p style={{ margin: '0 0 4px' }}><strong>{order.customerName}</strong> · {order.phone}</p>
        <p style={{ margin: '0 0 4px' }}>{order.delivery === 'envio' ? `Envío a ${order.city}: ${order.address}` : 'Pasa a retirar'}</p>
        <p style={{ margin: '0 0 4px' }}>Pago: {order.payment}</p>
        {order.notes && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>Notas: {order.notes}</p>}
      </div>
      <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">Escribirle por WhatsApp</a>
      <div className="field">
        <label htmlFor="o-status">Estado</label>
        <select id="o-status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="o-notes">Notas internas</label>
        <textarea id="o-notes" value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} placeholder="Pago recibido, hora de entrega…" />
      </div>
      <button type="button" className="btn primary" onClick={() => void onSave(status, notes)}>Guardar</button>
    </div>
  );
}
