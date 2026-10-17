import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '../../shared/types';
import { imageAttrs } from '../images';

/** Una foto de la portada: un producto destacado o una foto solo de portada. */
export interface Slide {
  key: string;
  image: string;
  alt: string;
  title: string;
  sub: string;
  product?: Product;
}

const MS = 5200;

/** Portada: fotos de los productos destacados en un arco, con fundido y zoom lento. */
export function HeroSlides({ slides, onOpen }: { slides: Slide[]; onOpen: (p: Product) => void }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false); // pausa del usuario (botón)
  const [hold, setHold] = useState(false); // pausa temporal (hover, foco, pestaña oculta)
  const touch = useRef<number | null>(null);
  const n = slides.length;
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

  const at = i % Math.max(n, 1);
  const cur = slides[at];
  if (!cur) return null;
  const running = n > 1 && !paused && !hold;

  return (
    <section
      className="slides"
      aria-roledescription="carrusel"
      aria-label="Fotos destacadas"
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
          {slides.map((s, k) => {
            const on = k === at;
            const img = (
              <img
                {...imageAttrs(s.image)}
                sizes="(max-width: 860px) 82vw, 440px"
                alt={s.product ? '' : s.alt}
                width={440}
                height={550}
                loading={k === 0 ? 'eager' : 'lazy'}
                fetchPriority={k === 0 ? 'high' : 'auto'}
                decoding="async"
              />
            );
            const product = s.product;
            return product ? (
              <button key={s.key} type="button" className="slide" data-on={on || undefined} tabIndex={on ? 0 : -1}
                aria-hidden={!on} aria-label={`Ver ${s.title}. ${s.alt}`} onClick={() => onOpen(product)}>
                {img}
              </button>
            ) : (
              <div key={s.key} className="slide" data-on={on || undefined} aria-hidden={!on} data-static>
                {img}
              </div>
            );
          })}
        </div>
      </div>

      <div className="slides-foot">
        <p className="slides-cap" aria-live={running ? 'off' : 'polite'}>
          {cur.title && <span className="slides-name">{cur.title}</span>}
          {cur.sub && <span className="slides-price">{cur.sub}</span>}
        </p>
        {n > 1 && (
          <div className="slides-ctrl">
            <div className="slides-bars" role="group" aria-label="Elegir foto">
              {slides.map((s, k) => (
                <button
                  key={s.key}
                  type="button"
                  className="sl-bar"
                  aria-label={`Foto ${k + 1} de ${n}${s.title ? `: ${s.title}` : ''}`}
                  aria-current={k === at || undefined}
                  data-state={k < at ? 'done' : k === at ? (running ? 'run' : 'full') : undefined}
                  style={{ '--ms': `${MS}ms` } as React.CSSProperties}
                  onClick={() => setI(k)}
                >
                  <span key={k === at ? `${at}-${running}` : k} />
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
