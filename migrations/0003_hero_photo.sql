-- La calabaza blanca en vertical luce mejor en la llama de portada.
UPDATE products SET image = 'static:pumpkin-white', image_alt = 'Velas en calabazas de cerámica blanca sobre una charola de ratán', sort = 1 WHERE slug = 'calabaza-ceramica';
UPDATE products SET sort = 2 WHERE slug = 'pumpkin-collection';
