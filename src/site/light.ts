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

/** Centro de la llama de la portada (o del centro de la pantalla si no se ve). */
function flameSpot(): { x: number; y: number } {
  const el = document.querySelector('.flame-frame');
  const r = el?.getBoundingClientRect();
  if (r && r.bottom > 0 && r.top < innerHeight) return { x: r.left + r.width / 2, y: Math.min(Math.max(r.top + r.height * 0.4, 0), innerHeight) };
  return { x: innerWidth / 2, y: innerHeight * 0.45 };
}

/**
 * Apagar: la luz parpadea como foco viejo, todo queda negro, y la llama se enciende con un resplandor que crece.
 * Encender: un destello cálido de luz que invade la pantalla. Funciona en cualquier navegador (sin View Transitions).
 */
export function switchLight(next: Light, commit: (l: Light) => void): void {
  const run = () => { applyLight(next); commit(next); };
  if (reduced()) { run(); return; }
  const dark = next === 'off';
  const fx = document.createElement('div');
  fx.className = `light-fx ${dark ? 'to-dark' : 'to-light'}`;
  fx.setAttribute('aria-hidden', 'true');
  let bloom: HTMLElement | null = null;
  if (dark) {
    const { x, y } = flameSpot();
    bloom = document.createElement('div');
    bloom.className = 'fx-bloom';
    bloom.style.left = `${x}px`;
    bloom.style.top = `${y}px`;
    fx.append(bloom);
  }
  document.body.append(fx);
  try { navigator.vibrate?.(dark ? [14, 70, 26] : 12); } catch { /* sin vibración */ }

  const total = dark ? 1900 : 800;
  const swap = dark ? 700 : 260;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const anim = fx.animate(
    dark
      ? [
          { opacity: 0, offset: 0 }, { opacity: 0.85, offset: 0.05 }, { opacity: 0.1, offset: 0.09 },
          { opacity: 1, offset: 0.14 }, { opacity: 0.45, offset: 0.19 }, { opacity: 1, offset: 0.25 },
          { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 1 },
        ]
      : [{ opacity: 0, offset: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0, offset: 1 }],
    { duration: total, easing: dark ? 'linear' : 'ease-out', fill: 'forwards' },
  );
  bloom?.animate(
    [
      { transform: 'translate(-50%, -50%) scale(0.05)', opacity: 0, offset: 0 },
      { transform: 'translate(-50%, -50%) scale(0.05)', opacity: 0, offset: 0.34 },
      { transform: 'translate(-50%, -50%) scale(0.22)', opacity: 1, offset: 0.42 },
      { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0.9, offset: 1 },
    ],
    { duration: total, easing: ease, fill: 'forwards' },
  );
  setTimeout(run, swap);
  anim.finished.then(() => fx.remove(), () => fx.remove());
  setTimeout(() => fx.remove(), total + 400);
}
