import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { addressLine } from "../lib/address.js";
import { asyncHandler } from "../lib/async-handler.js";
import { cleanText } from "../lib/format.js";
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
    const orders = await db.order.findMany({ where: { userId: req.user.id }, include: { items: true }, orderBy: { createdAt: "desc" } });
    res.render("account", { title: "Мои заказы — SGCB", description: "История заказов SGCB", section: "orders", orders });
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
