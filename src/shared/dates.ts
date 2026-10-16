/** Fecha local YYYY-MM-DD según el desfase de zona (minutos). Honduras = -360. */
export function localDate(now: Date, offsetMinutes: number): string {
  return new Date(now.getTime() + offsetMinutes * 60_000).toISOString().slice(0, 10);
}

/** Una sección se ve si está activa y hoy cae dentro de su ventana (inclusive). */
export function isLive(
  s: { active: number | boolean; starts_on: string | null; ends_on: string | null },
  today: string,
): boolean {
  if (!s.active) return false;
  if (s.starts_on && today < s.starts_on) return false;
  if (s.ends_on && today > s.ends_on) return false;
  return true;
}
