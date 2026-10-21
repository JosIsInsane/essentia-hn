# Seguridad

## Reportar un problema

Escribe a josue1235k@gmail.com con el detalle. No abras un issue público.

## Cómo se protege la tienda

| Riesgo | Qué hace el sistema |
|---|---|
| Alguien cambia precios desde el navegador | El servidor ignora todo menos ids, aroma y cantidad. Precio, nombre y disponibilidad se leen de la base. Campos extra se rechazan (`.strict()`). |
| Pedir algo apagado o fuera de temporada | Se revisa que producto, tamaño y sección (y su sección madre) estén encendidos y dentro de fechas el día de hoy, hora de Honduras. |
| Inyección SQL | Todas las consultas usan parámetros. Las dos únicas partes armadas a mano son un nombre de tabla de una lista cerrada y los `?1,?2…` de una lista de ids validados. |
| XSS | React escapa todo el texto. CSP estricta sin scripts en línea (solo propios, Turnstile y Cloudflare Web Analytics; el catálogo que va dentro de la página es JSON que no se ejecuta y se escapa `<`); en `/admin` además `require-trusted-types-for 'script'`. No se usa `innerHTML`. |
| Fotos maliciosas | Solo admin puede subir. Se revisa el tipo por los primeros bytes (JPG, PNG, WebP; nunca SVG), máximo 4 MB, nombre aleatorio. Se sirven con `nosniff` y `CSP: sandbox`. |
| CSRF | Cookie `SameSite=Strict` y toda petición que cambia datos debe traer `Origin` del mismo sitio (y `Sec-Fetch-Site: same-origin` si el navegador lo manda). |
| Robo de sesión | Cookie `__Host-`, `HttpOnly`, `Secure`, 12 h. La base guarda solo el hash SHA-256 del token; cerrar sesión la borra. |
| Adivinar la contraseña | PBKDF2-SHA256 con 100 000 vueltas y sal; comparación en tiempo constante. 5 intentos por IP cada 15 min y 50 en total. Cada intento queda en `audit_log`. |
| Spam de pedidos | 5 pedidos por IP cada 10 min, 300 por hora en total, campo trampa para bots y Turnstile opcional. Límite de 64 KB por petición. |
| Datos en un solo paso | Pedido y sus líneas se guardan en una transacción: o todo o nada. |
| Clickjacking | `frame-ancestors 'none'` y `X-Frame-Options: DENY`. |
| Errores que filtran detalles | El cliente recibe mensajes genéricos; el detalle solo va al log de Cloudflare. |
| Indexar el panel | `/admin` y `/api` fuera de `robots.txt`, `noindex` y `no-store`. |
| Dependencias | Pocas dependencias, versiones fijas, `npm audit` en CI, Dependabot y CodeQL semanal. |
| Secretos | Ningún secreto en el repo. `.dev.vars` está en `.gitignore`. Contraseña y Turnstile van como secretos de Cloudflare. |

## Auditoría del 16 de octubre de 2026

Revisión de código y pruebas contra el servidor local (`wrangler pages dev`):

- Pedido válido: precio y texto de WhatsApp correctos. ✅
- Pedido sin `Origin` o con `Origin` ajeno: 403. ✅
- Precio inyectado en una línea: 422. ✅
- Tamaño de un producto pedido con id de otro producto: 409. ✅
- Producto apagado: 409. ✅
- Aroma que no existe o faltante: 409. ✅
- `Content-Type` distinto de JSON: 415. ✅
- Sexto pedido seguido desde la misma IP: 429. ✅
- Panel sin sesión: 401. Cookie reusada después de cerrar sesión: 401. ✅
- Sexto intento de login: 429. ✅
- HTML disfrazado de `.jpg` y SVG con script: 415. ✅
- Nombre de foto con `../`: 404. ✅
- `kind` inyectado en reordenar: 422. ✅
- Imagen `javascript:` en un producto: 422. ✅
- Subsección dentro de subsección, slug repetido, fechas al revés: rechazados con mensaje claro. ✅
- `npm audit`: 0 vulnerabilidades. Búsqueda de `innerHTML`, `eval`, `new Function`: ninguno. ✅
- Tienda en 390 px: sin scroll horizontal ni errores en consola. ✅

### Riesgos que quedan

- **Una sola contraseña para el panel.** Recomendado: poner Cloudflare Access delante de `/admin` (ver `docs/DEPLOY.md`).
- **Cambiar la contraseña no cierra sesiones abiertas.** Hay que borrar `admin_sessions` (comando en `docs/DEPLOY.md`).
- **Datos personales.** Los pedidos guardan nombre, teléfono y dirección. Conviene acordar con la tienda cuánto tiempo guardarlos y borrar los viejos.
- **Turnstile está apagado** hasta que se configuren las llaves.
