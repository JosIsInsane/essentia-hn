import type { Fn } from '../../../server/env';
import { HttpError, json } from '../../../server/http';
import { audit } from '../../../server/session';

const MAX = 4 * 1024 * 1024;

/** Detecta el tipo por los primeros bytes, no por el nombre ni lo que diga el navegador. */
function sniff(b: Uint8Array): { ext: 'jpg' | 'png' | 'webp'; type: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: 'png', type: 'image/png' };
  const riff = String.fromCharCode(...b.slice(0, 4));
  const webp = String.fromCharCode(...b.slice(8, 12));
  if (riff === 'RIFF' && webp === 'WEBP') return { ext: 'webp', type: 'image/webp' };
  return null;
}

export const onRequestPost: Fn = async ({ request, env }) => {
  const len = Number(request.headers.get('Content-Length') ?? '0');
  if (len > MAX + 64 * 1024) throw new HttpError(413, 'La foto pesa más de 4 MB. Redúcela e intenta de nuevo.');
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new HttpError(400, 'Falta la foto.');
  if (file.size > MAX) throw new HttpError(413, 'La foto pesa más de 4 MB. Redúcela e intenta de nuevo.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) throw new HttpError(415, 'Solo se aceptan fotos JPG, PNG o WebP.');
  const id = [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, '0')).join('');
  const key = `${id}.${kind.ext}`;
  await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: kind.type, cacheControl: 'public, max-age=31536000, immutable' } });
  await audit(env.DB, request, 'image_upload', key);
  return json({ image: `r2:${key}` }, { status: 201 });
};
