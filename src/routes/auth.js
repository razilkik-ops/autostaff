import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { asyncHandler } from "../lib/async-handler.js";
import { cleanText, normalizeEmail, safeReturnTo } from "../lib/format.js";
import { createSession, destroySession, hashPassword, verifyPassword } from "../lib/security.js";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false });

export function authRoutes(db, config) {
  const router = Router();

  router.get("/register", (req, res) => {
    if (req.user) return res.redirect("/");
    res.render("auth", { title: "Регистрация — SGCB", description: "Создайте аккаунт SGCB", mode: "register", returnTo: safeReturnTo(req.query.returnTo) });
  });

  router.post("/register", authLimiter, asyncHandler(async (req, res) => {
    if (req.user) return res.redirect("/");
    const name = cleanText(req.body.name, 80);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const returnTo = safeReturnTo(req.body.returnTo);
    if (name.length < 2 || !email.includes("@") || password.length < 8) {
      return res.status(422).render("auth", { title: "Регистрация — SGCB", description: "Создайте аккаунт SGCB", mode: "register", returnTo, formError: "Укажите имя, корректный e-mail и пароль не короче 8 символов." });
    }
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) return res.status(409).render("auth", { title: "Регистрация — SGCB", description: "Создайте аккаунт SGCB", mode: "register", returnTo, formError: "Аккаунт с таким e-mail уже существует." });
    const user = await db.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
    await createSession(db, res, user.id, config);
    res.redirect(returnTo);
  }));

  router.get("/login", (req, res) => {
    if (req.user) return res.redirect("/");
    res.render("auth", { title: "Вход — SGCB", description: "Войдите в аккаунт SGCB", mode: "login", returnTo: safeReturnTo(req.query.returnTo) });
  });

  router.post("/login", authLimiter, asyncHandler(async (req, res) => {
    if (req.user) return res.redirect("/");
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const returnTo = safeReturnTo(req.body.returnTo);
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).render("auth", { title: "Вход — SGCB", description: "Войдите в аккаунт SGCB", mode: "login", returnTo, formError: "Неверный e-mail или пароль." });
    }
    await createSession(db, res, user.id, config);
    res.redirect(returnTo);
  }));

  router.post("/logout", asyncHandler(async (req, res) => {
    await destroySession(db, req, res, config);
    res.redirect("/");
  }));

  return router;
}
