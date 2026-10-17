import { useEffect } from 'react';

/** Con la luz apagada, la luz de la vela sigue al cursor (o al dedo) y el resto de la página se oscurece. */
export function Candlelight({ off }: { off: boolean }) {
  useEffect(() => {
    if (!off) return;
    const root = document.documentElement;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let tx = innerWidth / 2, ty = innerHeight * 0.32, x = tx, y = ty, raf = 0;
    const paint = () => { root.style.setProperty('--mx', `${x}px`); root.style.setProperty('--my', `${y}px`); };
    const tick = () => {
      x += (tx - x) * 0.1;
      y += (ty - y) * 0.1;
      paint();
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      if (still) { x = tx; y = ty; paint(); } else if (!raf) raf = requestAnimationFrame(tick);
    };
    paint();
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', move, { passive: true });
    return () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerdown', move);
      cancelAnimationFrame(raf);
    };
  }, [off]);

  return (
    <>
      <div className="candle-vignette" aria-hidden="true" />
      <div className="candle-glow" aria-hidden="true" />
    </>
  );
}
