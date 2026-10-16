export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ASSETS: Fetcher;
  ADMIN_PASSWORD_HASH?: string;
  TIMEZONE_OFFSET_MINUTES?: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
}

export type Fn<P extends string = never> = PagesFunction<Env, P>;
