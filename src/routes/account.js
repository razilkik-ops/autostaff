import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { addressLine } from "../lib/address.js";
import { asyncHandler } from "../lib/async-handler.js";
import { cleanText, safeReturnTo } from "../lib/format.js";
import { createOrder, notifyTelegram } from "../lib/orders.js";
import { parseBirthDate } from "../lib/profile.js";
import { createSession, hashPassword, requireUser, verifyPassword } from "../lib/security.js";

const passwordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });
const addressFields = (body) => ({
  label: cleanText(body.label, 40),
  recipient: cleanText(body.recipient, 80),
  phone: cleanText(body.phone, 32),
  city: cleanText(body.city, 60),
  street: cleanText(body.street, 100),
  apartment: cleanText(body.apartment, 30) || null,
  postalCode: cleanText(body.postalCode, 12) || null,
});
const message = (value) => encodeURIComponent(value);

export function accountRoutes(db, config) {
  const router = Router();

  router.get("/api/account/addresses", requireUser, asyncHandler(async (req, res) => {
    const addresses = await db.address.findMany({ where: { userId: req.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
    res.json(addresses.map((address) => ({ id: address.id, label: address.label, recipient: address.recipient, phone: address.phone, line: addressLine(address), isDefault: address.isDefault })));
  }));

  router.use("/account", requireUser);
  router.get("/account", (req, res) => res.redirect("/account/orders"));

  router.get("/account/orders", asyncHandler(async (req, res) => {
    const orders = await db.order.findMany({ where: { userId: req.user.id }, include: { items: { include: { product: { select: { slug: true, published: true } }, review: true } }, statusEvents: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" } });
    res.render("account", { title: "Мои заказы — SGCB", description: "История заказов SGCB", section: "orders", orders });
  }));

  router.post("/account/orders/:id/repeat", asyncHandler(async (req, res) => {
    const previous = await db.order.findFirst({ where: { id: req.params.id, userId: req.user.id }, include: { items: true } });
    if (!previous) return res.status(404).render("error", { title: "Заказ не найден", status: 404, message: "Заказ не найден." });
    if (previous.items.some((item) => !item.productId)) return res.redirect(`/account/orders?error=${message("Один из товаров больше не доступен. Создайте новый заказ через каталог.")}`);
    try {
      const order = await createOrder(db, { userId: req.user.id, customerName: previous.customerName, phone: previous.phone, email: previous.email, delivery: previous.delivery, comment: previous.comment }, previous.items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
      await notifyTelegram(config, order);
      res.redirect(`/account/orders?success=${message(`Повторный заказ № ${order.number} создан по актуальным ценам.`)}`);
    } catch (error) {
      if (error.status === 409) return res.redirect(`/account/orders?error=${message(error.message)}`);
      throw error;
    }
  }));

  router.post("/account/orders/:orderId/items/:itemId/review", asyncHandler(async (req, res) => {
    const rating = Number(req.body.rating);
    const body = cleanText(req.body.body, 1000);
    const back = "/account/orders";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || body.length < 10) return res.redirect(`${back}?error=${message("Поставьте оценку от 1 до 5 и напишите отзыв не короче 10 символов.")}`);
    const item = await db.orderItem.findFirst({ where: { id: req.params.itemId, orderId: req.params.orderId, order: { userId: req.user.id, status: "DELIVERED" } }, include: { review: true } });
    if (!item) return res.status(403).render("error", { title: "Отзыв недоступен", status: 403, message: "Отзыв можно оставить после получения своего заказа." });
    if (item.review) return res.redirect(`${back}?error=${message("Для этого товара из заказа отзыв уже оставлен.")}`);
    await db.productReview.create({ data: { userId: req.user.id, orderItemId: item.id, productId: item.productId, rating, body } });
    res.redirect(`${back}?success=${message("Спасибо! Ваш отзыв опубликован.")}`);
  }));

  router.get("/account/favorites", asyncHandler(async (req, res) => {
    const favorites = await db.favorite.findMany({ where: { userId: req.user.id, product: { published: true } }, include: { product: true }, orderBy: { createdAt: "desc" } });
    res.render("account", { title: "Избранное — SGCB", description: "Сохранённые товары SGCB", section: "favorites", favorites });
  }));

  router.post("/account/favorites/:productId", asyncHandler(async (req, res) => {
    const product = await db.product.findFirst({ where: { id: req.params.productId, published: true }, select: { id: true } });
    if (!product) return res.status(404).render("error", { title: "Товар не найден", status: 404, message: "Товар не найден." });
    const key = { userId_productId: { userId: req.user.id, productId: product.id } };
    const existing = await db.favorite.findUnique({ where: key });
    if (existing) await db.favorite.delete({ where: key });
    else await db.favorite.create({ data: { userId: req.user.id, productId: product.id } });
    res.redirect(safeReturnTo(req.body.returnTo, "/account/favorites"));
  }));

  router.get("/account/addresses", asyncHandler(async (req, res) => {
    const addresses = await db.address.findMany({ where: { userId: req.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
    res.render("account", { title: "Мои адреса — SGCB", description: "Адреса доставки SGCB", section: "addresses", addresses, addressLine });
  }));

  router.post("/account/addresses", asyncHandler(async (req, res) => {
    const data = addressFields(req.body);
    if (!data.label || !data.recipient || !data.phone || !data.city || !data.street) return res.redirect(`/account/addresses?error=${message("Заполните название, получателя, телефон, город и адрес.")}`);
    const count = await db.address.count({ where: { userId: req.user.id } });
    if (count >= 10) return res.redirect(`/account/addresses?error=${message("Можно сохранить не более 10 адресов.")}`);
    await db.$transaction(async (tx) => {
      const makeDefault = count === 0 || req.body.isDefault === "on";
      if (makeDefault) await tx.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
      await tx.address.create({ data: { ...data, userId: req.user.id, isDefault: makeDefault } });
    });
    res.redirect(`/account/addresses?success=${message("Адрес сохранён")}`);
  }));

  router.post("/account/addresses/:id", asyncHandler(async (req, res) => {
    const address = await db.address.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!address) return res.status(404).render("error", { title: "Адрес не найден", status: 404, message: "Адрес не найден." });
    const data = addressFields(req.body);
    if (!data.label || !data.recipient || !data.phone || !data.city || !data.street) return res.redirect(`/account/addresses?error=${message("Заполните обязательные поля адреса.")}`);
    await db.$transaction(async (tx) => {
      const makeDefault = req.body.isDefault === "on";
      if (makeDefault) await tx.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
      await tx.address.update({ where: { id: address.id }, data: { ...data, isDefault: address.isDefault || makeDefault } });
    });
    res.redirect(`/account/addresses?success=${message("Адрес обновлён")}`);
  }));

  router.post("/account/addresses/:id/delete", asyncHandler(async (req, res) => {
    const address = await db.address.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!address) return res.status(404).render("error", { title: "Адрес не найден", status: 404, message: "Адрес не найден." });
    await db.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: address.id } });
      if (address.isDefault) {
        const next = await tx.address.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: "asc" } });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
    res.redirect(`/account/addresses?success=${message("Адрес удалён")}`);
  }));

  router.get("/account/settings", (req, res) => {
    res.render("account", { title: "Настройки — SGCB", description: "Настройки аккаунта SGCB", section: "settings" });
  });

  router.post("/account/settings/profile", asyncHandler(async (req, res) => {
    const name = cleanText(req.body.name, 80);
    const phone = cleanText(req.body.phone, 32);
    const birthDate = parseBirthDate(req.body.birthDate);
    if (name.length < 2 || phone.length < 7 || !birthDate) return res.redirect(`/account/settings?error=${message("Укажите ФИО, телефон и корректную дату рождения.")}`);
    await db.user.update({ where: { id: req.user.id }, data: { name, phone, birthDate } });
    res.redirect(`/account/settings?success=${message("Данные профиля сохранены")}`);
  }));

  router.post("/account/settings/password", passwordLimiter, asyncHandler(async (req, res) => {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const renderError = (formError) => res.status(422).render("account", { title: "Настройки — SGCB", description: "Настройки аккаунта SGCB", section: "settings", formError });
    if (newPassword.length < 8 || newPassword.length > 128 || newPassword !== confirmPassword) return renderError("Новый пароль должен содержать 8–128 символов и совпадать с подтверждением.");
    if (!(await verifyPassword(currentPassword, req.user.passwordHash))) return renderError("Текущий пароль указан неверно.");
    if (await verifyPassword(newPassword, req.user.passwordHash)) return renderError("Новый пароль должен отличаться от текущего.");
    await db.user.update({ where: { id: req.user.id }, data: { passwordHash: await hashPassword(newPassword) } });
    await db.session.deleteMany({ where: { userId: req.user.id } });
    await createSession(db, res, req.user.id, config);
    res.redirect(`/account/settings?success=${message("Пароль изменён. Остальные сеансы завершены.")}`);
  }));

  return router;
}
