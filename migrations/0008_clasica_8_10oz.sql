-- Colección clásica: 8 oz por L420 y 10 oz por L600 (Cinnamon, Lavender, Vanilla, Orquid, Cedarwood, Eucalyptus).
UPDATE variants SET label = '8 oz', price_cents = 42000 WHERE sort = 1 AND product_id IN (1,2,3,4,5,6);
UPDATE variants SET label = '10 oz', price_cents = 60000 WHERE sort = 2 AND product_id IN (1,2,3,4,5,6);
UPDATE sections SET blurb = 'Frasco de 8 oz por L420 o de 10 oz por L600.' WHERE id = 11;
