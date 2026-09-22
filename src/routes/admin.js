import { Router } from "express";
import slugify from "slugify";
import { asyncHandler } from "../lib/async-handler.js";
import { cleanText, parseImages, parseSpecs } from "../lib/format.js";
import { requireAdmin } from "../lib/security.js";

const bool = (value) => value === "on" || value === "true" || value === true;
const slug = (value) => slugify(cleanText(value, 180), { lower: true, strict: true, locale: "ru" });

function articleData(body, userId, existing = null) {
  const published = bool(body.published);
  return {
    type: body.type === "NEWS" ? "NEWS" : "BLOG",
    title: cleanText(body.title, 180),
    slug: slug(body.slug || body.title),
    description: cleanText(body.description, 500),
    body: cleanText(body.body, 30000),
    heroImage: cleanText(body.heroImage, 500) || "/assets/sgcb-tools-banner.jpg",
    videoUrl: cleanText(body.videoUrl, 500) || null,
    published,
    publishedAt: published ? existing?.publishedAt || new Date() : null,
    productId: body.productId || null,
    authorId: userId,
  };
}

function productData(body) {
  const image = cleanText(body.image, 500) || "/assets/detailing-bucket.png";
  return {
    name: cleanText(body.name, 180),
    shortName: cleanText(body.shortName || body.name, 120),
    slug: slug(body.slug || body.name),
    brand: cleanText(body.brand, 80) || "SGCB",
    sku: cleanText(body.sku, 80).toUpperCase(),
    description: cleanText(body.description, 3000),
    price: Math.max(0, Number(body.price) || 0),
    image,
    images: parseImages(body.images, image),
    stock: Math.max(0, Number.parseInt(body.stock, 10) || 0),
    published: bool(body.published),
    specs: parseSpecs(body.specs),
    categoryId: body.categoryId,
  };
}

export function adminRoutes(db) {
  const router = Router();
  router.use("/admin", requireAdmin);

  router.get("/admin", asyncHandler(async (req, res) => {
    const [products, articles, users, orders, comments] = await Promise.all([
      db.product.count(), db.article.count(), db.user.count(), db.order.count({ where: { status: "NEW" } }), db.comment.count(),
    ]);
    res.render("admin/dashboard", { title: "Панель управления — SGCB", description: "Администрирование SGCB", counts: { products, articles, users, orders, comments } });
  }));

  router.get("/admin/products", asyncHandler(async (req, res) => {
    const products = await db.product.findMany({ include: { category: true }, orderBy: { updatedAt: "desc" } });
    res.render("admin/products", { title: "Каталог — SGCB Admin", description: "Управление каталогом", products });
  }));

  router.get("/admin/products/new", asyncHandler(async (req, res) => {
    const categories = await db.category.findMany({ orderBy: { name: "asc" } });
    res.render("admin/product-form", { title: "Новый товар — SGCB Admin", description: "Создание товара", product: null, categories, formError: null });
  }));

  router.post("/admin/products", asyncHandler(async (req, res) => {
    const data = productData(req.body);
    if (!data.name || !data.slug || !data.sku || !data.categoryId) {
      const categories = await db.category.findMany({ orderBy: { name: "asc" } });
      return res.status(422).render("admin/product-form", { title: "Новый товар — SGCB Admin", description: "Создание товара", product: { ...data, specs: data.specs }, categories, formError: "Заполните название, slug, артикул и категорию." });
    }
    await db.product.create({ data });
    res.redirect("/admin/products?success=Товар создан");
  }));

  router.get("/admin/products/:id/edit", asyncHandler(async (req, res) => {
    const [product, categories] = await Promise.all([db.product.findUnique({ where: { id: req.params.id } }), db.category.findMany({ orderBy: { name: "asc" } })]);
    if (!product) return res.status(404).render("error", { title: "Товар не найден", status: 404, message: "Товар уже удалён." });
    res.render("admin/product-form", { title: "Редактирование товара — SGCB Admin", description: "Редактирование товара", product, categories, formError: null });
  }));

  router.post("/admin/products/:id", asyncHandler(async (req, res) => {
    await db.product.update({ where: { id: req.params.id }, data: productData(req.body) });
    res.redirect("/admin/products?success=Товар обновлён");
  }));

  router.post("/admin/products/:id/delete", asyncHandler(async (req, res) => {
    await db.product.delete({ where: { id: req.params.id } });
    res.redirect("/admin/products?success=Товар удалён");
  }));

  router.get("/admin/categories", asyncHandler(async (req, res) => {
    const categories = await db.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    res.render("admin/categories", { title: "Категории — SGCB Admin", description: "Управление категориями", categories });
  }));

  router.post("/admin/categories", asyncHandler(async (req, res) => {
    await db.category.create({ data: { name: cleanText(req.body.name, 120), slug: slug(req.body.slug || req.body.name), description: cleanText(req.body.description, 500) || null, image: cleanText(req.body.image, 500) || null, sortOrder: Number.parseInt(req.body.sortOrder, 10) || 0 } });
    res.redirect("/admin/categories?success=Категория создана");
  }));

  router.post("/admin/categories/:id", asyncHandler(async (req, res) => {
    await db.category.update({ where: { id: req.params.id }, data: { name: cleanText(req.body.name, 120), slug: slug(req.body.slug || req.body.name), description: cleanText(req.body.description, 500) || null, image: cleanText(req.body.image, 500) || null, sortOrder: Number.parseInt(req.body.sortOrder, 10) || 0 } });
    res.redirect("/admin/categories?success=Категория обновлена");
  }));

  router.post("/admin/categories/:id/delete", asyncHandler(async (req, res) => {
    const count = await db.product.count({ where: { categoryId: req.params.id } });
    if (count) return res.redirect("/admin/categories?error=Сначала перенесите товары из категории");
    await db.category.delete({ where: { id: req.params.id } });
    res.redirect("/admin/categories?success=Категория удалена");
  }));

  router.get("/admin/articles", asyncHandler(async (req, res) => {
    const articles = await db.article.findMany({ include: { _count: { select: { likes: true, comments: true } } }, orderBy: { updatedAt: "desc" } });
    res.render("admin/articles", { title: "Материалы — SGCB Admin", description: "Управление блогом и новостями", articles });
  }));

  router.get("/admin/articles/new", asyncHandler(async (req, res) => {
    const products = await db.product.findMany({ orderBy: { name: "asc" } });
    res.render("admin/article-form", { title: "Новый материал — SGCB Admin", description: "Создание материала", article: null, products, formError: null });
  }));

  router.post("/admin/articles", asyncHandler(async (req, res) => {
    const data = articleData(req.body, req.user.id);
    if (!data.title || !data.slug || !data.description || !data.body) {
      const products = await db.product.findMany({ orderBy: { name: "asc" } });
      return res.status(422).render("admin/article-form", { title: "Новый материал — SGCB Admin", description: "Создание материала", article: data, products, formError: "Заполните название, описание и текст." });
    }
    await db.article.create({ data });
    res.redirect("/admin/articles?success=Материал создан");
  }));

  router.get("/admin/articles/:id/edit", asyncHandler(async (req, res) => {
    const [article, products] = await Promise.all([db.article.findUnique({ where: { id: req.params.id } }), db.product.findMany({ orderBy: { name: "asc" } })]);
    if (!article) return res.status(404).render("error", { title: "Материал не найден", status: 404, message: "Материал уже удалён." });
    res.render("admin/article-form", { title: "Редактирование материала — SGCB Admin", description: "Редактирование материала", article, products, formError: null });
  }));

  router.post("/admin/articles/:id", asyncHandler(async (req, res) => {
    const existing = await db.article.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).render("error", { title: "Материал не найден", status: 404, message: "Материал уже удалён." });
    await db.article.update({ where: { id: req.params.id }, data: articleData(req.body, req.user.id, existing) });
    res.redirect("/admin/articles?success=Материал обновлён");
  }));

  router.post("/admin/articles/:id/delete", asyncHandler(async (req, res) => {
    await db.article.delete({ where: { id: req.params.id } });
    res.redirect("/admin/articles?success=Материал удалён");
  }));

  router.get("/admin/comments", asyncHandler(async (req, res) => {
    const comments = await db.comment.findMany({ include: { user: true, article: true }, orderBy: { createdAt: "desc" }, take: 200 });
    res.render("admin/comments", { title: "Комментарии — SGCB Admin", description: "Модерация комментариев", comments });
  }));

  router.post("/admin/comments/:id/toggle", asyncHandler(async (req, res) => {
    const comment = await db.comment.findUnique({ where: { id: req.params.id } });
    if (comment) await db.comment.update({ where: { id: comment.id }, data: { status: comment.status === "VISIBLE" ? "HIDDEN" : "VISIBLE" } });
    res.redirect("/admin/comments?success=Статус комментария изменён");
  }));

  router.post("/admin/comments/:id/delete", asyncHandler(async (req, res) => {
    await db.comment.delete({ where: { id: req.params.id } });
    res.redirect("/admin/comments?success=Комментарий удалён");
  }));

  router.get("/admin/orders", asyncHandler(async (req, res) => {
    const orders = await db.order.findMany({ include: { items: true, user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
    res.render("admin/orders", { title: "Заказы — SGCB Admin", description: "Управление заказами", orders });
  }));

  router.post("/admin/orders/:id/status", asyncHandler(async (req, res) => {
    const status = ["NEW", "PROCESSING", "COMPLETED", "CANCELLED"].includes(req.body.status) ? req.body.status : "NEW";
    await db.order.update({ where: { id: req.params.id }, data: { status } });
    res.redirect("/admin/orders?success=Статус заказа обновлён");
  }));

  return router;
}
