UPDATE "Product"
SET "seoDescription" = 'Купить защитную плёнку PPF Clear Pro SGCB для оклейки кузова. Прозрачная защита лакокрасочного покрытия от сколов и царапин, доставка по России и Беларуси.'
WHERE "slug" = 'ppf-film'
  AND "name" = 'Защитная плёнка PPF Clear Pro'
  AND "seoDescription" IS NULL;
