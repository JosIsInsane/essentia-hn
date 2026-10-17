// Íconos de trazo propio, en línea con el logo (línea fina, puntas redondas).
type P = { className?: string };
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const Lens = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
);
export const Close = ({ className }: P) => (
  <svg viewBox="0 0 24 24" width="20" height="20" className={className} aria-hidden="true" {...base}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Bag = ({ className }: P) => (
  <svg viewBox="0 0 24 24" width="22" height="22" className={className} aria-hidden="true" {...base}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const Check = ({ className }: P) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...base}><circle cx="24" cy="24" r="21" /><path d="m15 25 6 6 12-13" /></svg>
);
export const WhatsApp = ({ className }: P) => (
  <svg viewBox="0 0 24 24" width="20" height="20" className={className} aria-hidden="true" {...base}><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2L9 9.5Z" /></svg>
);
/** Vela del interruptor de luz: la llama interior se apaga con la luz encendida. */
export const Candle = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
    <path d="M12 2.5c1.4 2 3 3.6 3 5.7a3 3 0 0 1-6 0c0-2.1 1.6-3.7 3-5.7Z" />
    <path className="flame-core" d="M12 6.2c.6.9 1.2 1.6 1.2 2.4a1.2 1.2 0 0 1-2.4 0c0-.8.6-1.5 1.2-2.4Z" fill="currentColor" stroke="none" />
    <path d="M7.5 13.5h9v8h-9z" />
  </svg>
);

/** Foco encendido: el símbolo de "luz prendida" del interruptor. */
export const Bulb = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
    <path d="M9 17.5h6M10 20.5h4M12 2.5a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 2.5Z" />
  </svg>
);
