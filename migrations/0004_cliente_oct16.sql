-- Datos que mandó Essentia el 16 oct 2026.

-- Aromatizante de hogar: el pequeño (L80) y el grande de 250 ml (L160).
UPDATE products SET name = 'Home Spray', subtitle = 'Aromatizante de hogar', image = 'static:home-spray',
  image_alt = 'Tres aromatizantes Essentia apilados: Velvet Berries, Lavender y Vanilla', sort = 1
  WHERE slug = 'home-spray';
UPDATE variants SET label = 'Frasco', price_cents = 8000 WHERE product_id = (SELECT id FROM products WHERE slug = 'home-spray');

INSERT INTO products (section_id, slug, name, subtitle, description, label_color, image, image_alt, scents, tags, featured, active, sort)
VALUES (41, 'home-spray-grande', 'Home Spray grande', 'Aromatizante de hogar, 250 ml', '', '#5B3E8C', 'static:home-spray-grande',
  'Tres aromatizantes grandes de 250 ml: Vanilla, Velvet Berries y Lavender',
  '["Lavanda","Vainilla","Frambuesa","Coco","Eucalipto","Fresa"]', 'spray aromatizante casa ropa grande 250ml', 0, 1, 2);
INSERT INTO variants (product_id, label, price_cents, sort)
VALUES ((SELECT id FROM products WHERE slug = 'home-spray-grande'), '250 ml', 16000, 1);

-- Cuidado personal: hand sanitizer.
INSERT INTO sections (id, parent_id, slug, name, blurb, sort, tone) VALUES
  (5, NULL, 'cuidado', 'Cuidado personal', 'Para llevar en la cartera o la mochila.', 5, 'blush');
INSERT INTO products (section_id, slug, name, subtitle, description, label_color, image, image_alt, scents, tags, featured, active, sort)
VALUES (5, 'hand-sanitizer', 'Hand Sanitizer', 'Gel aromático con gancho', '', '#4F6E8C', 'static:hand-sanitizer',
  'Cinco hand sanitizers Essentia con tapas de colores y gancho',
  '["Piña","Vainilla","Manzana","Menta","Black Sea","Lavanda"]', 'gel antibacterial manos sanitizer llavero', 0, 1, 1);
INSERT INTO variants (product_id, label, price_cents, sort)
VALUES ((SELECT id FROM products WHERE slug = 'hand-sanitizer'), 'Unidad', 12000, 1);

-- Foto nueva de los tres frascos de otoño y notas de cada etiqueta.
UPDATE products SET image_alt = 'Tres frascos ámbar: Pumpkin Spice, Pumpkin Pie y Pumpkin Chai',
  description = 'Pumpkin Spice: notas tostadas de canela, nuez moscada y clavo con crema de mantequilla y calabaza. Pumpkin Pie y Pumpkin Chai: calabaza, especias y un toque de vainilla y caramelo.'
  WHERE slug = 'pumpkin-collection';
