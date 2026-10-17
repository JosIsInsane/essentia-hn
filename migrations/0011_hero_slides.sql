-- Fotos de la portada que no son productos de la tienda. Los productos "Destacado" siguen saliendo solos.
CREATE TABLE hero_slides (
  id          INTEGER PRIMARY KEY,
  image       TEXT NOT NULL,              -- 'static:<base>' o 'r2:<key>'
  image_alt   TEXT NOT NULL DEFAULT '',
  title       TEXT NOT NULL DEFAULT '',   -- texto bajo la foto (opcional)
  product_id  INTEGER,                    -- al tocar la foto abre este producto (opcional)
  active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sort        INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
