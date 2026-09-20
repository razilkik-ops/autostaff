import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "sgcb_session";
const CSRF_COOKIE = "sgcb_csrf";

function wantsJson(req) {
  return req.originalUrl.startsWith("/api/") || req.is("application/json") || req.accepts(["json", "html"]) === "json";
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return index === -1 ? [part, ""] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function cookieOptions(config, { httpOnly = true, maxAge } = {}) {
  return {
    httpOnly,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  };
}

export function createCsrfToken(secret) {
  const nonce = crypto.randomBytes(24).toString("base64url");
  return `${nonce}.${sign(nonce, secret)}`;
}

export function verifyCsrfToken(token, secret) {
  const [nonce, signature] = String(token || "").split(".");
  return Boolean(nonce && signature && safeEqual(signature, sign(nonce, secret)));
}

export function csrfMiddleware(config) {
  return (req, res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    let token = cookies[CSRF_COOKIE];
    if (!verifyCsrfToken(token, config.sessionSecret)) {
      token = createCsrfToken(config.sessionSecret);
      res.cookie(CSRF_COOKIE, token, cookieOptions(config, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }));
    }
    req.csrfToken = token;
    res.locals.csrfToken = token;
    next();
  };
}

export function requireCsrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const supplied = req.body?._csrf || req.get("x-csrf-token");
  if (!supplied || !safeEqual(supplied, req.csrfToken)) {
    if (wantsJson(req)) return res.status(403).json({ error: "Страница устарела. Обновите её и повторите действие." });
    return res.status(403).render("error", { title: "Запрос отклонён", status: 403, message: "Страница устарела. Обновите её и повторите действие." });
  }
  next();
}

export function sessionMiddleware(db, config) {
  return async (req, res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    req.user = null;
    req.sessionToken = token || null;
    if (!token) {
      res.locals.user = null;
      return next();
    }
    try {
      const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
      if (!session || session.expiresAt <= new Date()) {
        if (session) await db.session.delete({ where: { id: session.id } }).catch(() => {});
        res.clearCookie(SESSION_COOKIE, cookieOptions(config));
      } else {
        req.user = session.user;
      }
      res.locals.user = req.user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export async function createSession(db, res, userId, config) {
  const token = crypto.randomBytes(32).toString("base64url");
  const maxAge = 1000 * 60 * 60 * 24 * config.sessionDays;
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + maxAge) } });
  res.cookie(SESSION_COOKIE, token, cookieOptions(config, { maxAge }));
}

export async function destroySession(db, req, res, config) {
  if (req.sessionToken) await db.session.deleteMany({ where: { tokenHash: hashToken(req.sessionToken) } });
  res.clearCookie(SESSION_COOKIE, cookieOptions(config));
}

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function requireUser(req, res, next) {
  if (req.user) return next();
  if (wantsJson(req)) return res.status(401).json({ error: "Войдите в аккаунт, чтобы продолжить." });
  return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
  if (req.user.role !== "ADMIN") return res.status(403).render("error", { title: "Нет доступа", status: 403, message: "Эта страница доступна только администратору." });
  next();
}
