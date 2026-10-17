import { useEffect, useRef, useState } from 'react';
import { Bulb } from './Icons';

const HINT_KEY = 'essentia:lamp-hint';

/** Interruptor de luz: perilla que se desliza, foco que se apaga y llama que se enciende. */
export function LightSwitch({ off, onToggle }: { off: boolean; onToggle: (origin: { x: number; y: number }) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(HINT_KEY) === '1'; } catch { /* sin almacenamiento */ }
    if (seen) return;
    const show = setTimeout(() => setHint(true), 1800);
    const hide = setTimeout(() => setHint(false), 11000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  const click = () => {
    setHint(false);
    try { localStorage.setItem(HINT_KEY, '1'); } catch { /* ignorar */ }
    const r = ref.current?.getBoundingClientRect();
    onToggle({ x: r ? r.left + r.width / 2 : innerWidth / 2, y: r ? r.top + r.height / 2 : 0 });
  };

  return (
    <div className="lamp-wrap">
      <button ref={ref} type="button" className={`lamp${hint ? ' nudge' : ''}`} aria-pressed={off} onClick={click}>
        <span className="lamp-track" aria-hidden="true">
          <span className="lamp-knob">
            <Bulb className="k-bulb" />
            <svg viewBox="0 0 24 24" className="k-flame" aria-hidden="true">
              <path d="M12 2c1.6 2.3 4.6 4.7 4.6 8.4a4.6 4.6 0 0 1-9.2 0C7.4 6.7 10.4 4.3 12 2Z" fill="currentColor" />
            </svg>
          </span>
        </span>
        <span className="lt-text">{off ? 'Encender la luz' : 'Apagar la luz'}</span>
      </button>
      {hint && !off && <span className="lamp-hint" aria-hidden="true">Prueba apagar la luz</span>}
    </div>
  );
}
