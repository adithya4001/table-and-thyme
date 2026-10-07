USE table_thyme;
SHOW TABLES;
SELECT id, name, category, price, stock, available FROM menu_items ORDER BY id;
SELECT id, status, seats, zone FROM restaurant_tables ORDER BY id;
SELECT id, dining_table_id, order_type, customer, status, created_at FROM orders ORDER BY id DESC;
SELECT oi.order_id, oi.name, oi.quantity, oi.unit_price,
       oi.quantity * oi.unit_price AS line_total
FROM order_items oi ORDER BY oi.order_id DESC, oi.id;
SELECT id, order_id, subtotal, discount, tax_amount, total, payment_status, payment_method, paid_at
FROM bills ORDER BY id DESC;
-- Only paid bills contribute to revenue. Repeated payment requests do not add rows.
SELECT COUNT(*) AS paid_orders, COALESCE(SUM(total),0) AS paid_revenue
FROM bills WHERE payment_status='PAID';
-- Historical price snapshot vs current menu price:
SELECT oi.order_id, oi.name, oi.unit_price AS ordered_price, m.price AS current_menu_price
FROM order_items oi JOIN menu_items m ON m.id=oi.menu_item_id;
