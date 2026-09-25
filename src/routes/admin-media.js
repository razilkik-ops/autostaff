import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAdmin } from "../lib/security.js";

const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public/uploads");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  fileFilter(req, file, callback) {
    callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
}).single("photo");
const uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false });

function imageExtension(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return "jpg";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export function adminMediaRoutes() {
  const router = Router();
  router.post("/admin/media", requireAdmin, uploadLimiter, (req, res, next) => {
    upload(req, res, (error) => {
      if (!error) return next();
      res.status(422).json({ error: error.code === "LIMIT_FILE_SIZE" ? "Файл не должен превышать 5 МБ." : "Не удалось загрузить изображение." });
    });
  }, asyncHandler(async (req, res) => {
    const extension = req.file && imageExtension(req.file.buffer);
    if (!extension || req.file.mimetype !== { jpg: "image/jpeg", png: "image/png", webp: "image/webp" }[extension]) {
      return res.status(422).json({ error: "Загрузите JPEG, PNG или WebP до 5 МБ." });
    }
    await mkdir(uploadsDirectory, { recursive: true });
    const filename = `${crypto.randomUUID()}.${extension}`;
    await writeFile(path.join(uploadsDirectory, filename), req.file.buffer, { flag: "wx" });
    res.status(201).json({ url: `/uploads/${filename}` });
  }));
  return router;
}
