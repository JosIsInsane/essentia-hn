import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void };
  }
}

let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile'));
    document.head.appendChild(s);
  });
  return loading;
}

/** Verificación anti-bots de Cloudflare. Solo se carga si hay llave configurada. */
export function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (t: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id = '';
    let alive = true;
    loadScript()
      .then(() => {
        if (!alive || !box.current || !window.turnstile) return;
        id = window.turnstile.render(box.current, {
          sitekey: siteKey,
          language: 'es',
          callback: onToken,
          'expired-callback': () => onToken(''),
        });
      })
      .catch(() => onToken(''));
    return () => {
      alive = false;
      if (id) window.turnstile?.remove(id);
    };
  }, [siteKey, onToken]);
  return <div ref={box} className="turnstile" />;
}
