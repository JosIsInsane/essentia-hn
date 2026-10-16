import { HttpError } from './http';

/**
 * Ventana fija: cuenta golpes por (bucket, inicio de ventana en segundos).
 * Lanza 429 al pasar el límite.
 */
export async function rateLimit(db: D1Database, bucket: string, limit: number, windowSec: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const window = now - (now % windowSec);
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (bucket, window, hits) VALUES (?1, ?2, 1)
       ON CONFLICT (bucket, window) DO UPDATE SET hits = hits + 1
       RETURNING hits`,
    )
    .bind(bucket, window)
    .first<{ hits: number }>();
  if ((row?.hits ?? 0) > limit) {
    throw new HttpError(429, 'Demasiados intentos. Espera unos minutos e intenta de nuevo.');
  }
}

/** Borra ventanas de hace más de un día. */
export async function pruneRateLimits(db: D1Database): Promise<void> {
  const cutoff = Math.floor(Date.now() / 1000) - 86400;
  await db.prepare('DELETE FROM rate_limits WHERE window < ?1').bind(cutoff).run();
}
