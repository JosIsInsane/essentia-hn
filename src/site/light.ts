import { flushSync } from 'react-dom';

// "Apaga la luz": tema nocturno con la vela encendida. Se recuerda por visitante.
export type Light = 'on' | 'off';
const KEY = 'essentia:light';

export function initialLight(): Light {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'on' || saved === 'off') return saved;
  } catch { /* sin almacenamiento */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'off' : 'on';
}

export function applyLight(l: Light): void {
  document.documentElement.dataset.light = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignorar */ }
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Cambia la luz con un fundido suave (sin destellos) y enciende o apaga la llama de la portada.
 * Usa View Transitions; si el navegador no las tiene, el cambio es directo y solo se anima la llama.
 */
export function switchLight(next: Light, commit: (l: Light) => void): void {
  const root = document.documentElement;
  const run = () => { applyLight(next); commit(next); };
  try { if (!reduced()) navigator.vibrate?.(10); } catch { /* sin vibración */ }
  const flame = () => {
    root.dataset.flame = next === 'off' ? 'ignite' : 'snuff';
    setTimeout(() => { delete root.dataset.flame; }, 3000);
  };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition) {
    doc.startViewTransition(() => { flushSync(run); flame(); });
  } else {
    run();
    flame();
  }
}
