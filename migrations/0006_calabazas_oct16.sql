-- Foto principal de otoño: las calabazas de cerámica de colores. Y calabazas de cera (L150).
UPDATE products SET image = 'static:pumpkin-ceramic', image_alt = 'Cuatro velas en calabazas de cerámica de colores sobre un mantel tejido, con tijeras doradas', sort = 1 WHERE slug = 'calabaza-ceramica';
UPDATE products SET sort = 2 WHERE slug = 'pumpkin-collection';
INSERT INTO products (section_id, slug, name, subtitle, description, label_color, image, image_alt, scents, tags, featured, active, sort)
VALUES (2, 'calabaza-cera', 'Calabaza de cera', 'Vela con forma de calabaza', '', '#B5541A', 'static:pumpkin-wax',
  'Seis velas de cera en forma de calabaza, naranjas y blancas, encendidas sobre una tela crema',
  '[]', 'calabaza cera otono naranja blanca', 0, 1, 3);
INSERT INTO variants (product_id, label, price_cents, sort)
VALUES ((SELECT id FROM products WHERE slug = 'calabaza-cera'), 'Unidad', 15000, 1);
