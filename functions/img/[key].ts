import type { Fn } from '../../server/env';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

// Sirve fotos subidas desde el admin. Nombre validado: solo las que creamos nosotros.
export const onRequestGet: Fn<'key'> = async ({ env, params }) => {
  const key = Array.isArray(params.key) ? params.key[0] : params.key;
  const m = key?.match(/^[a-f0-9]{32}\.(jpg|png|webp)$/);
  if (!key || !m) return new Response('No encontrado', { status: 404 });
  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response('No encontrado', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'Content-Type': TYPES[m[1]!]!,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cross-Origin-Resource-Policy': 'same-origin',
      ETag: obj.httpEtag,
    },
  });
};
