/** 40000 -> "L400"; 12550 -> "L125.50". Precios en centavos de lempira. */
export function lempiras(cents: number): string {
  const whole = Math.trunc(cents / 100);
  const frac = Math.abs(cents % 100);
  const base = 'L' + whole.toLocaleString('en-US');
  return frac === 0 ? base : `${base}.${String(frac).padStart(2, '0')}`;
}
