import path from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import express from "express";
import helmet from "helmet";
import methodOverride from "method-override";
import { config as defaultConfig } from "./config.js";
import { articlePath, formatDate, formatDateTime, formatMoney, paragraphs, specsToText } from "./lib/format.js";
import { csrfMiddleware, requireCsrf, sessionMiddleware } from "./lib/security.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { interactionRoutes } from "./routes/interactions.js";
import { publicRoutes } from "./routes/public.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function createApp({ db, config = defaultConfig }) {
  const app = express();
  if (config.isProduction) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.set("views", path.join(root, "src", "views"));
  app.set("view engine", "ejs");

  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
        connectSrc: ["'self'"],
      },
    },
  }));
  app.use(compression());
  app.use(express.json({ limit: "200kb" }));
  app.use(express.urlencoded({ extended: false, limit: "200kb" }));
  app.use(methodOverride("_method"));
  app.use(express.static(path.join(root, "public"), { maxAge: config.isProduction ? "7d" : 0, index: false }));
  app.get("/styles/app.css", (req, res) => res.sendFile(path.join(root, "src", "styles.css")));

  app.use(csrfMiddleware(config));
  app.use(sessionMiddleware(db, config));
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.query = req.query;
    res.locals.formatMoney = formatMoney;
    res.locals.formatDate = formatDate;
    res.locals.formatDateTime = formatDateTime;
    res.locals.articlePath = articlePath;
    res.locals.paragraphs = paragraphs;
    res.locals.specsToText = specsToText;
    res.locals.siteUrl = config.appUrl;
    next();
  });
  app.use(requireCsrf);

  app.get("/health", async (req, res, next) => {
    try {
      await db.$queryRawUnsafe("SELECT 1");
      res.json({ status: "ok" });
    } catch (error) {
      next(error);
    }
  });

  app.use(authRoutes(db, config));
  app.use(interactionRoutes(db, config));
  app.use(adminRoutes(db));
  app.use(publicRoutes(db));

  app.use((req, res) => res.status(404).render("error", { title: "Страница не найдена", description: "Страница не найдена", status: 404, message: "Проверьте адрес или вернитесь на главную." }));
  app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return next(error);
    const status = error.status || 500;
    if (req.originalUrl.startsWith("/api/") || req.is("application/json") || req.accepts(["json", "html"]) === "json") return res.status(status).json({ error: status === 500 ? "Внутренняя ошибка сервера." : error.message });
    res.status(status).render("error", { title: "Ошибка", description: "Ошибка", status, message: status === 500 ? "Не удалось выполнить запрос. Попробуйте ещё раз." : error.message });
  });

  return app;
}
