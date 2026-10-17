import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Catalog, Product, Section } from '../shared/types';
import { lempiras } from '../shared/money';
import { getCatalog } from './api';
import { cart, useCart } from './cart';
import { applyLight, initialLight, switchLight, type Light } from './light';
import { countProducts, filterSections } from './search';
import { CatalogNav } from './components/CatalogNav';
import { CartDialog, type Index } from './components/CartDialog';
import { FlameDefs, FlameFrame } from './components/Flame';
import { Bag, WhatsApp } from './components/Icons';
import { LightSwitch } from './components/LightSwitch';
import { ProductDialog } from './components/ProductDialog';
import { SectionView } from './components/SectionView';

function buildIndex(sections: Section[]): Index {
  const product = new Map<number, Product>();
  const variant: Index['variant'] = new Map();
  const walk = (list: Section[]) => {
    for (const s of list) {
      for (const p of s.products) {
        product.set(p.id, p);
        for (const v of p.variants) variant.set(v.id, { product: p, variant: v });
      }
      walk(s.children);
    }
  };
  walk(sections);
  return { product, variant };
}

function heroPick(c: Catalog): { section?: Section; product?: Product } {
  const section = c.sections.find((s) => s.slug === c.settings.heroSection) ?? c.sections[0];
  const all = section ? [...section.products, ...section.children.flatMap((x) => x.products)] : [];
  return { section, product: all.find((p) => p.featured) ?? all[0] };
}

export function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('q')?.slice(0, 60) ?? '');
  const [open, setOpen] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [light, setLight] = useState<Light>(initialLight);
  const [active, setActive] = useState('');
  const [activeSub, setActiveSub] = useState('');
  const [bump, setBump] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const lines = useCart();

  const load = useCallback(() => {
    setFailed(false);
    getCatalog().then(setCatalog, () => setFailed(true));
  }, []);
  useEffect(load, [load]);
  useEffect(() => applyLight(light), [light]);

  const index = useMemo(() => buildIndex(catalog?.sections ?? []), [catalog]);
  const shown = useMemo(() => (catalog ? filterSections(catalog.sections, query) : []), [catalog, query]);
  const hero = useMemo(() => (catalog ? heroPick(catalog) : {}), [catalog]);

  // Al cargar: quita del carrito lo que ya no existe y salta al ancla si la hay.
  useEffect(() => {
    if (!catalog) return;
    cart.prune((l) => index.variant.get(l.variantId)?.product.id === l.productId);
    if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
  }, [catalog, index]);

  // Guarda la búsqueda en la URL para poder compartirla.
  useEffect(() => {
    const url = new URL(location.href);
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }, [query]);

  // "/" enfoca la búsqueda.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  // Marca en la barra la sección y subsección que se están viendo.
  useEffect(() => {
    if (!shown.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          if (el.dataset.spy) setActive(el.dataset.spy);
          if (el.dataset.spySub) setActiveSub(el.dataset.spySub);
        }
      },
      { rootMargin: '-150px 0px -55% 0px' },
    );
    document.querySelectorAll('[data-spy],[data-spy-sub]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shown]);

  const added = useCallback(() => {
    setBump(true);
    setTimeout(() => setBump(false), 450);
  }, []);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((t, l) => t + (index.variant.get(l.variantId)?.variant.priceCents ?? 0) * l.qty, 0);
  const s = catalog?.settings;
  const found = countProducts(shown);
  const lightOff = light === 'off';

  return (
    <>
      <a className="skip" href="#catalogo">Saltar al catálogo</a>
      <FlameDefs />
      {s?.announcement && <p className="announce">{s.announcement}</p>}

      <header className="hero">
        <div className="embers" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} style={{ '--x': `${(i * 37 + 8) % 100}%`, '--d': `${7 + (i * 3) % 6}s`, '--delay': `${-((i * 5) % 9)}s`, '--s': `${2 + (i % 3)}px` } as React.CSSProperties} />
          ))}
        </div>
        <div className="wrap top-row">
          <a className="brand" href="/" aria-label="Essentia Ash & Aroma, inicio">
            <span className="brand-name">Essentia</span>
            <span className="brand-sub">Ash &amp; Aroma</span>
          </a>
          <div className="top-actions">
            <LightSwitch off={lightOff} onToggle={() => switchLight(lightOff ? 'on' : 'off', setLight)} />
          </div>
        </div>
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">Hecho a mano en Honduras</p>
            <h1>Los pequeños momentos merecen sentirse especiales</h1>
            <p className="hero-lead">
              Velas de cera de soya 100% naturales con fragancias libres de ftalatos, para llenar tu espacio de calma, calidez y bienestar.
            </p>
            <div className="hero-actions">
              <a className="btn btn-gold" href="#catalogo">Ver el catálogo</a>
              {s?.whatsapp && (
                <a className="btn btn-line" href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <WhatsApp /> Escribirnos
                </a>
              )}
            </div>
            <ul className="hero-proof" aria-label="Lo que nos distingue">
              <li>Cera de soya natural</li>
              <li>Artesanal, hecha en Honduras</li>
              <li>Pides aquí, coordinas por WhatsApp</li>
            </ul>
          </div>
          {hero.product && (
            <FlameFrame
              image={hero.product.image}
              alt={hero.product.imageAlt}
              caption={`${hero.product.name} · ${lempiras(Math.min(...hero.product.variants.map((v) => v.priceCents)))}`}
            />
          )}
        </div>
      </header>

      <section className="ritual" aria-labelledby="ritual-h">
        <div className="wrap">
          <p className="eyebrow">Nuestra esencia</p>
          <h2 id="ritual-h">Más que velas, creamos pequeños rituales</h2>
          <ol className="ritual-list">
            <li><span className="ritual-n" aria-hidden="true">01</span><h3>Una pausa</h3><p>Al final del día, enciende una vela y deja que el aroma baje el ritmo.</p></li>
            <li><span className="ritual-n" aria-hidden="true">02</span><h3>Un instante contigo</h3><p>Un momento de conexión contigo misma, sin prisa y sin pantallas.</p></li>
            <li><span className="ritual-n" aria-hidden="true">03</span><h3>Tu espacio, tu lugar</h3><p>El placer de disfrutar tu casa con luz, aroma y calma.</p></li>
          </ol>
          <a className="btn btn-wine" href="#catalogo">Encuentra tu aroma</a>
        </div>
      </section>

      <main id="catalogo" tabIndex={-1}>
        {catalog && (
          <CatalogNav sections={shown} active={active} activeSub={activeSub} query={query} onQuery={setQuery} inputRef={searchRef} />
        )}

        {!catalog && !failed && <div className="wrap skeleton" aria-busy="true" aria-label="Cargando catálogo">{[0, 1, 2, 3].map((i) => <div key={i} />)}</div>}

        {failed && (
          <div className="empty">
            <h2>No pudimos cargar el catálogo</h2>
            <p>Revisa tu conexión e intenta de nuevo. También puedes escribirnos directo por WhatsApp.</p>
            <button type="button" className="btn btn-wine" onClick={load}>Intentar de nuevo</button>
          </div>
        )}

        {catalog && query && (
          <p className="wrap results-note" role="status">
            {found === 0 ? 'Sin resultados' : <><strong>{found}</strong> {found === 1 ? 'producto' : 'productos'}</>} para “{query}”
          </p>
        )}

        {catalog && shown.length === 0 && query && (
          <div className="empty">
            <h2>No encontramos “{query}”</h2>
            <p>Prueba con otro aroma, como canela o lavanda, o pregúntanos si lo tenemos.</p>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-line" onClick={() => setQuery('')}>Ver todo</button>
              {s?.whatsapp && (
                <a className="btn btn-wine" href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(`Hola Essentia, ¿tienen ${query}?`)}`} target="_blank" rel="noopener noreferrer">
                  Preguntar por WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {shown.map((sec) => <SectionView key={sec.id} section={sec} onOpen={setOpen} />)}
      </main>

      {s && (
        <section className="contact" aria-labelledby="contact-h">
          <div className="wrap">
            <h2 id="contact-h">¿Buscas un regalo? Te ayudamos a elegir</h2>
            <p>Cuéntanos para quién es y te recomendamos un aroma. Respondemos por WhatsApp.</p>
            <div className="hero-actions">
              <a className="btn btn-gold" href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer"><WhatsApp /> Escribirnos</a>
              {s.instagram && <a className="btn btn-line" href={`https://www.instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer">@{s.instagram}</a>}
            </div>
          </div>
        </section>
      )}

      <footer>
        <div className="wrap">
          <span>Essentia · Ash &amp; Aroma</span>
          <span>Velas de soya, velas decorativas y aromatizantes</span>
          <span>© {new Date().getFullYear()} Essentia</span>
        </div>
      </footer>

      {catalog && (
        <button type="button" className={`fab${bump ? ' bump' : ''}`} onClick={() => setCartOpen(true)} aria-label={`Ver pedido: ${count} productos, ${lempiras(total)}`}>
          <Bag />
          <span aria-hidden="true">{count > 0 ? lempiras(total) : 'Tu pedido'}</span>
          {count > 0 && <span className="count" aria-hidden="true">{count}</span>}
        </button>
      )}
      <p className="sr-only" aria-live="polite">{count > 0 ? `${count} productos en tu pedido` : ''}</p>

      <ProductDialog product={open} onClose={() => setOpen(null)} onAdded={added} />
      {catalog && <CartDialog open={cartOpen} onClose={() => setCartOpen(false)} index={index} settings={catalog.settings} />}
    </>
  );
}
