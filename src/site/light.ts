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

/** Cambia la luz con un revelado circular que sale del interruptor (si el navegador lo permite). */
export function switchLight(next: Light, origin: { x: number; y: number }, commit: (l: Light) => void): void {
  const run = () => { applyLight(next); commit(next); };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (!doc.startViewTransition || reduced()) { run(); return; }
  const { x, y } = origin;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = doc.startViewTransition(() => flushSync(run));
  t.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 1100, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => { /* sin animación */ });
}
