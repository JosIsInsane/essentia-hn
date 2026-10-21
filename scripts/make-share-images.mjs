// Genera los íconos (iPhone/Android) y la imagen para compartir en redes.
// Uso: node scripts/make-share-images.mjs   (se corre a mano; el resultado va en public/)
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const WINE = '#650f23';
const svg = await readFile('public/favicon.svg');

// Íconos cuadrados sin esquinas transparentes: iOS y Android ponen su propia máscara.
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  await sharp(svg, { density: 72 * (size / 64) * 1.2 })
    .resize(size, size)
    .flatten({ background: WINE })
    .png()
    .toFile(`public/${name}`);
}

// Imagen para WhatsApp, Facebook e Instagram: 1200x630 en JPG (no todos aceptan WebP).
await sharp('public/catalogo/pumpkin-white-960.webp')
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('public/og.jpg');

console.log('Listo: public/apple-touch-icon.png, icon-192.png, icon-512.png, og.jpg');
