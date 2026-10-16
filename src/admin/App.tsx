import { useCallback, useEffect, useState } from 'react';
import type { AdminCatalog } from '../shared/admin-types';
import { api, setUnauthorizedHandler } from './api';
import { CatalogPage } from './CatalogPage';
import { Login } from './Login';
import { OrdersPage } from './OrdersPage';
import { SettingsPage } from './SettingsPage';

type Tab = 'catalogo' | 'pedidos' | 'ajustes';
const TABS: { id: Tab; label: string }[] = [
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'ajustes', label: 'Ajustes' },
];

export function App() {
  const [auth, setAuth] = useState<'checking' | 'in' | 'out'>('checking');
  const [tab, setTab] = useState<Tab>(() => {
    const h = location.hash.slice(1);
    return TABS.some((t) => t.id === h) ? (h as Tab) : 'pedidos';
  });
  const [catalog, setCatalog] = useState<AdminCatalog | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [newCount, setNewCount] = useState(0);

  useEffect(() => { setUnauthorizedHandler(() => setAuth('out')); }, []);
  useEffect(() => {
    api('GET', '/api/admin/me').then(() => setAuth('in'), () => setAuth('out'));
  }, []);

  const reload = useCallback(async () => {
    setCatalog(await api<AdminCatalog>('GET', '/api/admin/catalog'));
  }, []);
  useEffect(() => { if (auth === 'in') void reload().catch(() => {}); }, [auth, reload]);
  useEffect(() => { history.replaceState(null, '', `#${tab}`); }, [tab]);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(''), 3000);
  }, []);

  async function logout() {
    await api('POST', '/api/admin/logout').catch(() => {});
    setAuth('out');
  }

  if (auth === 'checking') return null;
  if (auth === 'out') return <Login onDone={() => setAuth('in')} />;

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">Essentia<small>Panel</small></div>
        <nav aria-label="Panel">
          {TABS.map((t) => (
            <button key={t.id} type="button" aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'pedidos' && newCount > 0 && <span className="badge" aria-label={`${newCount} nuevos`}>{newCount}</span>}
            </button>
          ))}
        </nav>
        <div className="grow" />
        <a href="/" target="_blank" rel="noopener">Ver la tienda</a>
        <button type="button" className="out" onClick={logout}>Cerrar sesión</button>
      </aside>
      <main className="main">
        {tab === 'pedidos' && <OrdersPage toast={toast} onCounts={setNewCount} />}
        {tab === 'catalogo' && (catalog ? <CatalogPage data={catalog} reload={reload} toast={toast} /> : <p className="muted">Cargando…</p>)}
        {tab === 'ajustes' && (catalog ? <SettingsPage sections={catalog.sections} toast={toast} /> : <p className="muted">Cargando…</p>)}
      </main>
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}
