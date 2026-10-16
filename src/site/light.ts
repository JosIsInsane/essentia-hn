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
