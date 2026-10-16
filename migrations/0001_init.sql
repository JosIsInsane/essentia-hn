-- Esquema base de Essentia. Precios en centavos de lempira (L400 = 40000).

CREATE TABLE sections (
  id          INTEGER PRIMARY KEY,
  parent_id   INTEGER REFERENCES sections(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  blurb       TEXT NOT NULL DEFAULT '',
  sort        INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  starts_on   TEXT,            -- YYYY-MM-DD, NULL = sin límite
  ends_on     TEXT,            -- YYYY-MM-DD, NULL = sin límite
  tone        TEXT NOT NULL DEFAULT 'cream' CHECK (tone IN ('cream', 'wine', 'blush', 'amber')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sections_parent ON sections(parent_id, sort);

CREATE TABLE products (
  id           INTEGER PRIMARY KEY,
  section_id   INTEGER NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  subtitle     TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  label_color  TEXT NOT NULL DEFAULT '#650F23',
  image        TEXT NOT NULL DEFAULT '',   -- 'static:<base>' o 'r2:<key>'
  image_alt    TEXT NOT NULL DEFAULT '',
  scents       TEXT NOT NULL DEFAULT '[]', -- JSON: aromas a elegir
  tags         TEXT NOT NULL DEFAULT '',   -- palabras extra para la búsqueda
  featured     INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  active       INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sort         INTEGER NOT NULL DEFAULT 0,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_products_section ON products(section_id, sort);

CREATE TABLE variants (
  id          INTEGER PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,              -- '7 oz', '2 unidades', 'Unidad'
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sort        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_variants_product ON variants(product_id, sort);

CREATE TABLE orders (
  id              INTEGER PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'nuevo'
                  CHECK (status IN ('nuevo', 'confirmado', 'listo', 'entregado', 'cancelado')),
  customer_name   TEXT NOT NULL,
  phone           TEXT NOT NULL,
  delivery        TEXT NOT NULL CHECK (delivery IN ('envio', 'retiro')),
  city            TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  payment         TEXT NOT NULL CHECK (payment IN ('transferencia', 'efectivo')),
  notes           TEXT NOT NULL DEFAULT '',
  total_cents     INTEGER NOT NULL,
  admin_notes     TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_orders_status ON orders(status, created_at DESC);

CREATE TABLE order_items (
  id            INTEGER PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INTEGER,
  product_name  TEXT NOT NULL,   -- copia: el pedido no cambia si el producto cambia
  variant_label TEXT NOT NULL,
  scent         TEXT NOT NULL DEFAULT '',
  unit_cents    INTEGER NOT NULL,
  qty           INTEGER NOT NULL CHECK (qty BETWEEN 1 AND 50)
);
CREATE INDEX idx_items_order ON order_items(order_id);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Sesiones de admin: guardamos solo el hash SHA-256 del token.
CREATE TABLE admin_sessions (
  token_hash  TEXT PRIMARY KEY,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  ip          TEXT NOT NULL DEFAULT ''
);

-- Límites de uso (login, pedidos) por ventana de tiempo.
CREATE TABLE rate_limits (
  bucket     TEXT NOT NULL,
  window     INTEGER NOT NULL,
  hits       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window)
);

CREATE TABLE audit_log (
  id         INTEGER PRIMARY KEY,
  at         TEXT NOT NULL DEFAULT (datetime('now')),
  action     TEXT NOT NULL,
  detail     TEXT NOT NULL DEFAULT '',
  ip         TEXT NOT NULL DEFAULT ''
);
