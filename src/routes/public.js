import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.js";

const infoPages = {
  delivery: ["Доставка и оплата", "Отправляем заказы по всей России транспортными компаниями и курьерскими службами. Стоимость и срок рассчитываются менеджером после подтверждения заказа. Доступны онлайн-оплата и безналичный расчёт для организаций."],
  returns: ["Возврат и обмен", "Товар надлежащего качества можно вернуть или обменять в сроки, установленные законодательством РФ, при сохранении упаковки и товарного вида. Для начала возврата свяжитесь с менеджером."],
  questions: ["Вопросы", "Нужна помощь с подбором автохимии, оборудования или плёнки PPF? Напишите нам в Telegram или позвоните — специалист уточнит задачу и предложит подходящий комплект."],
  privacy: ["Политика конфиденциальности", "Мы используем контактные данные только для обработки заказов, обратной связи и подписки, если пользователь дал на неё согласие. Данные не передаются третьим лицам, кроме служб, необходимых для выполнения заказа."],
  about: ["О компании", "SGCB — профессиональные решения для детейлинга и ухода за автомобилем. Мы поставляем автохимию, микрофибру, инструменты, оборудование и защитные плёнки для студий и частных мастеров."],
};

export function publicRoutes(db) {
  const router = Router();

  router.get("/", asyncHandler(async (req, res) => {
    const [categories, products, articles] = await Promise.all([
      db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      db.product.findMany({ where: { published: true }, include: { category: true }, orderBy: { createdAt: "asc" }, take: 12 }),
      db.article.findMany({ where: { type: "BLOG", published: true }, include: { _count: { select: { likes: true, comments: { where: { status: "VISIBLE" } } } } }, orderBy: { publishedAt: "desc" }, take: 3 }),
    ]);
    res.render("home", { title: "SGCB — профессиональные товары для детейлинга", description: "Профессиональная автохимия, оборудование, микрофибра и защитные плёнки SGCB с доставкой по России.", categories, products, articles });
  }));

  router.get("/catalog/:slug", asyncHandler(async (req, res) => {
    const category = await db.category.findUnique({
      where: { slug: req.params.slug },
      include: { products: { where: { published: true }, orderBy: { createdAt: "asc" } } },
    });
    if (!category) return res.status(404).render("error", { title: "Категория не найдена", status: 404, message: "Проверьте адрес категории или вернитесь в каталог." });
    const description = category.description || `${category.name} SGCB для профессионального детейлинга и ухода за автомобилем с доставкой по России.`;
    res.render("category", { title: `${category.name} SGCB — купить с доставкой по России`, description, category });
  }));

  router.get("/product/:slug", asyncHandler(async (req, res) => {
    const product = await db.product.findFirst({ where: { slug: req.params.slug, published: true }, include: { category: true } });
    if (!product) return res.status(404).render("error", { title: "Товар не найден", status: 404, message: "Такого товара нет или он снят с публикации." });
    const relatedInCategory = await db.product.findMany({ where: { published: true, categoryId: product.categoryId, id: { not: product.id } }, take: 3 });
    const relatedFallback = relatedInCategory.length < 3 ? await db.product.findMany({ where: { published: true, id: { notIn: [product.id, ...relatedInCategory.map((item) => item.id)] } }, orderBy: { createdAt: "asc" }, take: 3 - relatedInCategory.length }) : [];
    const related = [...relatedInCategory, ...relatedFallback];
    const gallery = Array.isArray(product.images) && product.images.length ? product.images : [product.image];
    res.render("product", { title: `${product.name} — купить SGCB`, description: product.description, product, related, gallery });
  }));

  for (const [path, type, heading, lead] of [
    ["blog", "BLOG", "Блог об уходе за автомобилем", "Понятные инструкции, профессиональные приёмы и подбор оборудования для стабильного результата."],
    ["news", "NEWS", "Новости мира детейлинга", "Новые продукты SGCB, события индустрии, обучение и важные обновления компании."],
  ]) {
    router.get(`/${path}`, asyncHandler(async (req, res) => {
      const articles = await db.article.findMany({ where: { type, published: true }, include: { _count: { select: { likes: true, comments: { where: { status: "VISIBLE" } } } } }, orderBy: { publishedAt: "desc" } });
      res.render("content-list", { title: `${heading} — SGCB`, description: lead, heading, lead, type: path, articles });
    }));

    router.get(`/${path}/:slug`, asyncHandler(async (req, res) => {
      const article = await db.article.findFirst({
        where: { slug: req.params.slug, type, published: true },
        include: {
          product: true,
          comments: { where: { status: "VISIBLE" }, include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
          _count: { select: { likes: true, comments: { where: { status: "VISIBLE" } } } },
        },
      });
      if (!article) return res.status(404).render("error", { title: "Материал не найден", status: 404, message: "Проверьте ссылку или вернитесь к списку материалов." });
      const [related, userLike] = await Promise.all([
        db.article.findMany({ where: { type, published: true, id: { not: article.id } }, orderBy: { publishedAt: "desc" }, take: 2 }),
        req.user ? db.like.findUnique({ where: { userId_articleId: { userId: req.user.id, articleId: article.id } } }) : null,
      ]);
      res.render("article", { title: `${article.title} — SGCB`, description: article.description, article, related, liked: Boolean(userLike), contentType: path });
    }));
  }

  router.get("/info/:page", (req, res) => {
    const page = infoPages[req.params.page];
    if (!page) return res.status(404).render("error", { title: "Страница не найдена", status: 404, message: "Проверьте адрес страницы." });
    res.render("info", { title: `${page[0]} — SGCB`, description: page[1], heading: page[0], text: page[1] });
  });

  return router;
}
