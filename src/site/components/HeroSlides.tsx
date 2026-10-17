import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '../../shared/types';
import { lempiras } from '../../shared/money';
import { imageAttrs } from '../images';

const MS = 5200;

/** Portada: fotos de los productos destacados en un arco, con fundido y zoom lento. */
export function HeroSlides({ products, onOpen }: { products: Product[]; onOpen: (p: Product) => void }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false); // pausa del usuario (botón)
  const [hold, setHold] = useState(false); // pausa temporal (hover, foco, pestaña oculta)
  const touch = useRef<number | null>(null);
  const n = products.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused || hold) return;
    const t = setTimeout(() => go(1), MS);
    return () => clearTimeout(t);
  }, [i, n, paused, hold, go]);

  useEffect(() => {
    const vis = () => setHold(document.hidden);
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);

  const p = products[i % Math.max(n, 1)];
  if (!p) return null;
  const price = Math.min(...p.variants.map((v) => v.priceCents));
  const running = n > 1 && !paused && !hold;

  return (
    <section
      className="slides"
      aria-roledescription="carrusel"
      aria-label="Productos destacados"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHold(false); }}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }}
    >
      <div
        className="slides-arch"
        onTouchStart={(e) => { touch.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touch.current) - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <div className="slides-frame">
          {products.map((s, k) => (
            <button
              key={s.id}
              type="button"
              className="slide"
              data-on={k === i % n || undefined}
              tabIndex={k === i % n ? 0 : -1}
              aria-hidden={k !== i % n}
              aria-label={`Ver ${s.name}`}
              onClick={() => onOpen(s)}
            >
              <img
                {...imageAttrs(s.image)}
                sizes="(max-width: 860px) 82vw, 440px"
                alt={s.imageAlt}
                width={440}
                height={550}
                loading={k === 0 ? 'eager' : 'lazy'}
                fetchPriority={k === 0 ? 'high' : 'auto'}
                decoding="async"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="slides-foot">
        <p className="slides-cap" aria-live={running ? 'off' : 'polite'}>
          <span className="slides-name">{p.name}</span>
          <span className="slides-price">desde {lempiras(price)}</span>
        </p>
        {n > 1 && (
          <div className="slides-ctrl">
            <div className="slides-bars" role="group" aria-label="Elegir foto">
              {products.map((s, k) => (
                <button
                  key={s.id}
                  type="button"
                  className="sl-bar"
                  aria-label={`Foto ${k + 1} de ${n}: ${s.name}`}
                  aria-current={k === i || undefined}
                  data-state={k < i ? 'done' : k === i ? (running ? 'run' : 'full') : undefined}
                  style={{ '--ms': `${MS}ms` } as React.CSSProperties}
                  onClick={() => setI(k)}
                >
                  <span key={k === i ? `${i}-${running}` : k} />
                </button>
              ))}
            </div>
            <button type="button" className="slides-pause" onClick={() => setPaused((v) => !v)} aria-label={paused ? 'Reanudar fotos' : 'Pausar fotos'}>
              {paused ? (
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5z" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" fill="currentColor" /></svg>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
