import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { cleanText, normalizeEmail } from "../lib/format.js";
import { addressLine } from "../lib/address.js";
import { createOrder, notifyTelegram } from "../lib/orders.js";
import { requireUser } from "../lib/security.js";

export function interactionRoutes(db, config) {
  const router = Router();

  router.post("/api/articles/:id/like", requireUser, asyncHandler(async (req, res) => {
    const article = await db.article.findFirst({ where: { id: req.params.id, published: true }, select: { id: true } });
    if (!article) return res.status(404).json({ error: "Статья не найдена." });
    const key = { userId_articleId: { userId: req.user.id, articleId: article.id } };
    const existing = await db.like.findUnique({ where: key });
    if (existing) await db.like.delete({ where: key });
    else await db.like.create({ data: { userId: req.user.id, articleId: article.id } });
    const count = await db.like.count({ where: { articleId: article.id } });
    res.json({ liked: !existing, count });
  }));

  router.post("/api/articles/:id/comments", requireUser, asyncHandler(async (req, res) => {
    const body = cleanText(req.body.body, 1000);
    if (body.length < 2) return res.status(422).json({ error: "Комментарий слишком короткий." });
    const article = await db.article.findFirst({ where: { id: req.params.id, published: true }, select: { id: true } });
    if (!article) return res.status(404).json({ error: "Статья не найдена." });
    const comment = await db.comment.create({ data: { body, userId: req.user.id, articleId: article.id }, include: { user: { select: { name: true } } } });
    res.status(201).json({ id: comment.id, body: comment.body, author: comment.user.name, createdAt: comment.createdAt });
  }));

  router.post("/api/subscribe", asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    if (!email.includes("@")) return res.status(422).json({ error: "Укажите корректный e-mail." });
    await db.subscriber.upsert({ where: { email }, update: { active: true }, create: { email } });
    res.json({ ok: true });
  }));

  router.post("/api/orders", asyncHandler(async (req, res) => {
    const customerName = cleanText(req.body.customerName, 80);
    const phone = cleanText(req.body.phone, 32);
    const email = normalizeEmail(req.body.email);
    let delivery = cleanText(req.body.delivery, 120);
    if (req.body.addressId) {
      if (!req.user || delivery !== "Доставка по России") return res.status(422).json({ error: "Сохранённый адрес доступен только для доставки в аккаунте." });
      const address = await db.address.findFirst({ where: { id: String(req.body.addressId), userId: req.user.id } });
      if (!address) return res.status(422).json({ error: "Выберите свой сохранённый адрес." });
      delivery = cleanText(`Доставка: ${addressLine(address)}`, 250);
    } else if (delivery === "Доставка по России") {
      const deliveryAddress = cleanText(req.body.deliveryAddress, 220);
      if (deliveryAddress.length < 8) return res.status(422).json({ error: "Укажите адрес доставки или выберите сохранённый адрес." });
      delivery = `Доставка: ${deliveryAddress}`;
    }
    const comment = cleanText(req.body.comment, 600);
    const requested = Array.isArray(req.body.items) ? req.body.items : [];
    if (!email.includes("@")) return res.status(422).json({ error: "Укажите корректный e-mail." });
    const order = await createOrder(db, { userId: req.user?.id, customerName, phone, email, delivery, comment: comment || null }, requested);
    await notifyTelegram(config, order);
    res.status(201).json({ ok: true, number: order.number });
  }));

  return router;
}
