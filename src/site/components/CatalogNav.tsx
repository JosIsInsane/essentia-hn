import { useEffect, useRef, type RefObject } from 'react';
import type { Section } from '../../shared/types';
import { Close, Lens } from './Icons';
import { secId } from './SectionView';

interface Props {
  sections: Section[];
  active: string;
  activeSub: string;
  query: string;
  onQuery: (q: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function CatalogNav({ sections, active, activeSub, query, onQuery, inputRef }: Props) {
  const current = sections.find((s) => s.slug === active);
  const tabs = useRef<HTMLDivElement>(null);
  const subs = useRef<HTMLDivElement>(null);
  // Mantiene visible la pestaña activa cuando la barra se desliza de lado (celular).
  useEffect(() => {
    for (const box of [tabs.current, subs.current]) {
      const el = box?.querySelector<HTMLElement>('[aria-current="true"]');
      if (box && el) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
    }
  }, [active, activeSub]);
  return (
    <nav className="bar" aria-label="Catálogo">
      <div className="wrap">
        <div className="bar-row">
          <div className="search" role="search">
            <label htmlFor="q" className="sr-only">Buscar en el catálogo</label>
            <Lens className="lens" />
            <input
              id="q" ref={inputRef} type="search" value={query} autoComplete="off" spellCheck={false}
              placeholder="Busca un aroma o producto" maxLength={60}
              onChange={(e) => onQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') onQuery(''); }}
            />
            {query ? (
              <button type="button" className="clear" onClick={() => { onQuery(''); inputRef.current?.focus(); }} aria-label="Borrar búsqueda"><Close /></button>
            ) : (
              <kbd aria-hidden="true">/</kbd>
            )}
          </div>
          <div className="tabs" ref={tabs}>
            {sections.map((s) => (
              <a key={s.id} className="tab" href={`#${secId(s)}`} aria-current={s.slug === active ? 'true' : undefined}>{s.name}</a>
            ))}
          </div>
        </div>
        {current && current.children.length > 0 && (
          <div className="subtabs" ref={subs} aria-label={`Partes de ${current.name}`}>
            {current.children.map((c) => (
              <a key={c.id} className="chip" href={`#${secId(c, current)}`} aria-current={`${current.slug}/${c.slug}` === activeSub ? 'true' : undefined}>
                {c.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
