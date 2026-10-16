-- Cliente confirmó: Home Spray chico es de 90 ml (L80).
UPDATE variants SET label = '90 ml' WHERE product_id = (SELECT id FROM products WHERE slug = 'home-spray');
UPDATE products SET subtitle = 'Aromatizante de hogar, 90 ml' WHERE slug = 'home-spray';
