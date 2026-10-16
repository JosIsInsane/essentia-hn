# Essentia · Ash & Aroma

Tienda en línea de Essentia: catálogo de velas de soya, velas decorativas y aromatizantes, con búsqueda, carrito, pedidos que llegan a un panel y se confirman por WhatsApp.

**Estado:** borrador. Los textos, precios y fotos salen del catálogo Fall Season 2026 y de lo que mandó Essentia el 16 de octubre.

## Qué tiene

- **Tienda** (`/`): catálogo por secciones y subsecciones, buscador sin acentos (atajo `/`), barra que marca dónde estás, ficha de cada producto con tamaño y aroma, carrito y pedido. Al terminar, el cliente manda el pedido por WhatsApp con un código (`ESS-XXXXXX`).
- **Modo vela** ("Apagar la luz"): tema nocturno con la llama de la portada encendida. Se recuerda por visitante y respeta el modo oscuro del celular.
- **Panel** (`/admin`): pedidos con estados, catálogo (encender/apagar secciones, fechas de temporada, orden, productos, precios, fotos) y ajustes (WhatsApp, aviso, portada, pedidos en línea sí/no).

## Cómo está hecho

| Parte | Tecnología |
|---|---|
| Sitio y panel | React 19 + TypeScript + Vite, CSS propio, fuentes Fraunces y Jost servidas desde el mismo sitio |
| API | Cloudflare Pages Functions (`functions/`), validación con zod |
| Base de datos | Cloudflare D1 (SQLite), migraciones en `migrations/` |
| Fotos subidas | Cloudflare R2, servidas por `/img/<id>` |
| CI/CD | GitHub Actions: pruebas, auditoría de dependencias, CodeQL y despliegue a Cloudflare |

```
src/site      tienda pública
src/admin     panel /admin
src/shared    tipos, validación, precios y mensajes (lo usan tienda, panel y API)
server/       lógica de la API: sesiones, contraseña, límites, catálogo
functions/    rutas de la API (cada archivo es una ruta)
migrations/   esquema y catálogo inicial
public/       fotos del catálogo (WebP), cabeceras de seguridad, robots
tests/        pruebas (vitest)
```

## Trabajar en local

Requiere Node 22.

```bash
npm install
cp .dev.vars.example .dev.vars
npm run hash-password            # pega el resultado en .dev.vars
npm run db:migrate:local         # crea la base local con el catálogo
npm run preview                  # http://localhost:8788  y  /admin
```

Otros comandos: `npm test`, `npm run typecheck`, `npm run check` (todo junto).

## Publicar

Ver [docs/DEPLOY.md](docs/DEPLOY.md). Resumen: crear D1 y R2 en Cloudflare, poner el id de D1 en `wrangler.toml`, guardar la contraseña como secreto y los secretos de GitHub; cada push a `main` publica.

## Seguridad

Ver [SECURITY.md](SECURITY.md) para el detalle de cómo se protege la tienda y la auditoría hecha.

## Pendiente de confirmar con Essentia

- Precio de **Tulip Fields** (está cargado a L400 y apagado).
- **Pumpkin Collection**: el catálogo dice 8 oz por L420, pero la foto nueva dice 7 oz. Está cargado como 8 oz.
- Tamaño del **Home Spray pequeño** (L80) y si sus aromas son los mismos 6 del grande.
- Zonas y costo de envío (la nota del carrito se cambia en Ajustes).
- Fechas reales de la temporada de otoño (cargada del 1 sep al 30 nov 2026).
- Dominio propio (por ahora sería `essentia.pages.dev`).
