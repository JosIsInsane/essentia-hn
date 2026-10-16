/** Ref de imagen -> atributos <img>. 'static:x' usa /catalogo/x-480|960.webp; 'r2:key' usa /img/key. */
export function imageAttrs(ref: string): { src: string; srcSet?: string } {
  if (ref.startsWith('static:')) {
    const base = `/catalogo/${ref.slice(7)}`;
    return { src: `${base}-960.webp`, srcSet: `${base}-480.webp 480w, ${base}-960.webp 960w` };
  }
  if (ref.startsWith('r2:')) return { src: `/img/${ref.slice(3)}` };
  return { src: '/catalogo/logo-480.webp' };
}
