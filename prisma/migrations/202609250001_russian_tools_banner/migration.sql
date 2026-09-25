-- Existing catalog and news entries store asset URLs in PostgreSQL.
-- Move them to the new URL so browsers do not reuse the cached English banner.
UPDATE "Product"
SET "image" = replace("image", '/assets/sgcb-tools-banner.jpg', '/assets/sgcb-tools-banner-ru.jpg')
WHERE "image" LIKE '%/assets/sgcb-tools-banner.jpg%';

UPDATE "Category"
SET "image" = replace("image", '/assets/sgcb-tools-banner.jpg', '/assets/sgcb-tools-banner-ru.jpg')
WHERE "image" LIKE '%/assets/sgcb-tools-banner.jpg%';

UPDATE "Product"
SET "images" = replace("images"::text, '/assets/sgcb-tools-banner.jpg', '/assets/sgcb-tools-banner-ru.jpg')::jsonb
WHERE "images" IS NOT NULL
  AND "images"::text LIKE '%/assets/sgcb-tools-banner.jpg%';

UPDATE "Article"
SET "heroImage" = replace("heroImage", '/assets/sgcb-tools-banner.jpg', '/assets/sgcb-tools-banner-ru.jpg')
WHERE "heroImage" LIKE '%/assets/sgcb-tools-banner.jpg%';
