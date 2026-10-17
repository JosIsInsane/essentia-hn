-- Coconut: Colección clásica, 4 oz por L280.
INSERT INTO products (section_id, slug, name, subtitle, description, label_color, image, image_alt, scents, tags, featured, active, sort)
VALUES (11, 'coconut', 'Coconut', 'Vela de soya en frasco con tapa de bambú', '', '#8A6A3B', 'static:coconut',
  'Vela Essentia Coconut en frasco de vidrio con tapa de bambú junto a un coco abierto', '[]', 'coco coconut', 0, 1, 9);
INSERT INTO variants (product_id, label, price_cents, sort) VALUES ((SELECT id FROM products WHERE slug = 'coconut'), '4 oz', 28000, 1);
