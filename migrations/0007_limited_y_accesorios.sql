-- Limited Collection (Mango & Gardenia) y Accesorios (encendedor eléctrico).
INSERT INTO sections (id, parent_id, slug, name, blurb, sort, tone) VALUES
  (5, NULL, 'limited', 'Limited Collection', 'Aromas nuevos en edición limitada.', 5, 'blush'),
  (6, NULL, 'accesorios', 'Accesorios', 'Para encender y disfrutar tus velas.', 6, 'cream');

INSERT INTO products (section_id, slug, name, subtitle, description, label_color, image, image_alt, scents, tags, featured, active, sort)
VALUES
 (5, 'mango-gardenia', 'Mango & Gardenia', 'Vela de soya, nuevo aroma', '', '#C9871F', 'static:mango-gardenia',
  'Vela Essentia Mango & Gardenia en frasco esmerilado junto a un mango y gardenias', '[]', 'mango gardenia limited nuevo', 1, 1, 1),
 (6, 'encendedor-electrico', 'Encendedor eléctrico', 'Recargable, cuello flexible', '', '#650F23', 'static:lighter',
  'Encendedor eléctrico de cuello flexible encendiendo una vela Essentia', '[]', 'encendedor electrico accesorio fosforo', 0, 1, 1);

INSERT INTO variants (product_id, label, price_cents, sort) VALUES
 ((SELECT id FROM products WHERE slug = 'mango-gardenia'), '7 oz', 40000, 1),
 ((SELECT id FROM products WHERE slug = 'mango-gardenia'), '4 oz', 28000, 2),
 ((SELECT id FROM products WHERE slug = 'encendedor-electrico'), 'Unidad', 15000, 1);
