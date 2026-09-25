export function formatMoney(value) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(value))} ₽`;
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function articlePath(article) {
  return `/${String(article.type).toLowerCase()}/${article.slug}`;
}

export function paragraphs(value) {
  return String(value || "").split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
}

export function cleanText(value, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function normalizeEmail(value) {
  return cleanText(value, 254).toLowerCase();
}

export function safeReturnTo(value, fallback = "/") {
  const result = String(value || "");
  return result.startsWith("/") && !result.startsWith("//") ? result : fallback;
}

export function parseSpecs(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.split(":"))
    .filter((parts) => parts.length > 1)
    .map(([name, ...rest]) => [name.trim(), rest.join(":").trim()])
    .filter(([name, specValue]) => name && specValue)
    .slice(0, 30);
}

export function specsToText(value) {
  if (!Array.isArray(value)) return "";
  return value.map(([name, specValue]) => `${name}: ${specValue}`).join("\n");
}

export function parseImages(value, fallback = "") {
  const images = String(value || "")
    .split("\n")
    .map((item) => cleanText(item, 500))
    .filter(Boolean);
  if (!images.length && fallback) images.push(fallback);
  return [...new Set(images)].slice(0, 8);
}

export function imagesToText(value, fallback = "") {
  const images = Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  return [...new Set(images.length ? images : fallback ? [fallback] : [])].join("\n");
}
