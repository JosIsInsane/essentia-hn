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

/** Cambia la luz con un fundido suave (View Transitions); si no hay soporte, el cambio es directo. */
export function switchLight(next: Light, commit: (l: Light) => void): void {
  const run = () => { applyLight(next); commit(next); };
  try { if (!reduced()) navigator.vibrate?.(10); } catch { /* sin vibración */ }
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition) doc.startViewTransition(() => flushSync(run));
  else run();
}
