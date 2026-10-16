# Publicar en Cloudflare

Todo esto cabe en el plan gratis de Cloudflare.

## 1. Crear los recursos (una sola vez)

```bash
npx wrangler login
npx wrangler d1 create essentia            # copia el database_id
npx wrangler r2 bucket create essentia-images
npx wrangler pages project create essentia --production-branch main
```

Pega el `database_id` en `wrangler.toml` (en `[[d1_databases]]`) y haz commit.

## 2. Base de datos

```bash
npm run db:migrate:remote
```

Después, GitHub Actions corre las migraciones nuevas en cada push a `main`.

## 3. Contraseña del panel

```bash
npm run hash-password
npx wrangler pages secret put ADMIN_PASSWORD_HASH --project-name essentia
```

Usa una frase larga (12+ caracteres). Para cambiarla, repite estos dos pasos: las sesiones abiertas siguen hasta que vencen (12 h); para cerrarlas todas ya, borra la tabla `admin_sessions`:

```bash
npx wrangler d1 execute essentia --remote --command "DELETE FROM admin_sessions"
```

## 4. GitHub

En el repo, **Settings → Secrets and variables → Actions**, agrega:

- `CLOUDFLARE_API_TOKEN`: token con permisos *Cloudflare Pages: Edit* y *D1: Edit* (nada más).
- `CLOUDFLARE_ACCOUNT_ID`: el id de la cuenta.

Crea los entornos `production` y `preview` en **Settings → Environments**. En `production` conviene pedir aprobación para publicar y limitarlo a la rama `main`.

Protege `main`: **Settings → Branches** → exigir PR y que pase **CI**.

## 5. Recomendado antes de abrir al público

1. **Cloudflare Access en `/admin`** (Zero Trust → Access → Applications): pide un código por correo antes de ver el panel. Es gratis hasta 50 personas y suma una segunda capa a la contraseña. Protege `/admin*` y `/api/admin*`.
2. **Turnstile** (anti-bots en pedidos): crea un widget, pon la llave pública en `TURNSTILE_SITE_KEY` en `wrangler.toml` y la secreta con `npx wrangler pages secret put TURNSTILE_SECRET`.
3. **Dominio propio**: Pages → Custom domains. Luego activa *Always Use HTTPS* y *HSTS* en SSL/TLS.
4. **Reglas de WAF / rate limiting** de Cloudflare sobre `/api/orders` y `/api/admin/login` como respaldo de los límites que ya tiene el código.
5. **Respaldos**: D1 guarda 30 días de historial (Time Travel). Para restaurar: `npx wrangler d1 time-travel restore essentia --timestamp <fecha>`.
