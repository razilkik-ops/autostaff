const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" },
});

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function cleanText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

async function submitOrder(request, env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json({ error: "Telegram пока не настроен. Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID." }, 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Неверный формат заказа." }, 400);
  }

  const name = cleanText(payload.name, 80);
  const phone = cleanText(payload.phone, 32);
  const delivery = cleanText(payload.delivery, 80);
  const comment = cleanText(payload.comment, 600);
  const items = Array.isArray(payload.items) ? payload.items.slice(0, 30).map((item) => ({
    id: cleanText(item.id, 80),
    name: cleanText(item.name, 180),
    price: Number(item.price),
    qty: Math.max(1, Math.min(99, Number.parseInt(item.qty, 10) || 1)),
  })).filter((item) => item.id && item.name && Number.isFinite(item.price) && item.price >= 0) : [];

  if (!name || !phone || !delivery || items.length === 0) {
    return json({ error: "Заполните имя, телефон и добавьте хотя бы один товар." }, 400);
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const lines = items.map((item, index) => `${index + 1}. <b>${escapeHtml(item.name)}</b>\n   ${item.qty} × ${item.price.toFixed(2)} BYN`);
  const message = [
    "🚙 <b>Новый заказ DriveLab</b>",
    "",
    `<b>Клиент:</b> ${escapeHtml(name)}`,
    `<b>Телефон:</b> ${escapeHtml(phone)}`,
    `<b>Получение:</b> ${escapeHtml(delivery)}`,
    "",
    "<b>Состав заказа:</b>",
    ...lines,
    "",
    `<b>Итого:</b> ${total.toFixed(2)} BYN`,
    comment ? `\n<b>Комментарий:</b> ${escapeHtml(comment)}` : "",
  ].filter(Boolean).join("\n");

  try {
    const telegramFetch = typeof env.TELEGRAM_FETCH === "function" ? env.TELEGRAM_FETCH : fetch;
    const telegramResponse = await telegramFetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message, parse_mode: "HTML" }),
    });

    if (!telegramResponse.ok) {
      console.error("Telegram order delivery failed", telegramResponse.status);
      return json({ error: "Сервис заказов временно недоступен. Попробуйте ещё раз." }, 502);
    }

    return json({ ok: true });
  } catch (error) {
    console.error("Telegram order delivery error", error);
    return json({ error: "Не удалось связаться с сервисом заказов." }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/order" && request.method === "POST") {
      return submitOrder(request, env);
    }

    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
