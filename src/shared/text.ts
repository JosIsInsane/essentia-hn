/** Minúsculas, sin acentos ni signos: "Piña Orquídea" -> "pina orquidea". */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Quita caracteres de control (deja salto de línea si allowNewlines). */
export function clean(s: string, allowNewlines = false): string {
  const re = allowNewlines ? /[\u0000-\u0009\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g : /[\u0000-\u001F\u007F​-‏‪-‮⁦-⁩]/g;
  return s.replace(re, '').trim();
}

export function slugify(s: string): string {
  return fold(s).replace(/ñ/g, 'n').replace(/\s+/g, '-').slice(0, 60);
}
