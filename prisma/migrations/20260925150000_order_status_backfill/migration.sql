-- Preserve the last known status for orders created before status history was introduced.
INSERT INTO "OrderStatusEvent" ("id", "orderId", "status", "createdAt")
SELECT md5(random()::text || clock_timestamp()::text || "id"), "id", "status", "updatedAt"
FROM "Order" AS orders
WHERE NOT EXISTS (SELECT 1 FROM "OrderStatusEvent" AS events WHERE events."orderId" = orders."id");
