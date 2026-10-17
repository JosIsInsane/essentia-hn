-- Colección clásica con los 4 tamaños (4 oz L280, 7 oz L400, 8 oz L420, 10 oz L600). Coconut pasa a Limited Collection.
UPDATE variants SET sort = sort + 2 WHERE product_id IN (1,2,3,4,5,6);
INSERT INTO variants (product_id, label, price_cents, sort) SELECT id, '4 oz', 28000, 1 FROM products WHERE id IN (1,2,3,4,5,6);
INSERT INTO variants (product_id, label, price_cents, sort) SELECT id, '7 oz', 40000, 2 FROM products WHERE id IN (1,2,3,4,5,6);
UPDATE sections SET blurb = '4 oz L280 · 7 oz L400 · 8 oz L420 · 10 oz L600.' WHERE id = 11;
UPDATE products SET section_id = 6, sort = 2 WHERE slug = 'coconut';
