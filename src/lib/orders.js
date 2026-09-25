import crypto from "node:crypto";

function orderNumber() {
  return `SGCB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function createOrder(db, details, requested) {
  const quantities = new Map(requested.slice(0, 30).map((item) => [String(item.productId), Math.max(1, Math.min(99, Number.parseInt(item.quantity, 10) || 1))]));
  if (!details.customerName || !details.phone || !details.delivery || !quantities.size) {
    const error = new Error("Заполните контакты и добавьте доступные товары.");
    error.status = 422;
    throw error;
  }

  return db.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: [...quantities.keys()] }, published: true, stock: { gt: 0 } } });
    if (products.length !== quantities.size || products.some((product) => quantities.get(product.id) > product.stock)) {
      const error = new Error("Один из товаров закончился или доступен в меньшем количестве. Обновите корзину.");
      error.status = 409;
      throw error;
    }
    const items = products.map((product) => ({ productId: product.id, productName: product.name, price: product.price, quantity: quantities.get(product.id) }));
    const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const order = await tx.order.create({
      data: { ...details, number: orderNumber(), total, items: { create: items }, statusEvents: { create: { status: "NEW" } } },
      include: { items: true },
    });
    for (const item of items) {
      const updated = await tx.product.updateMany({ where: { id: item.productId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
      if (updated.count !== 1) {
        const error = new Error("Один из товаров только что закончился. Обновите корзину и повторите заказ.");
        error.status = 409;
        throw error;
      }
    }
    return order;
  });
}

export async function notifyTelegram(config, order) {
  if (!config.telegramBotToken || !config.telegramChatId) return;
  const items = order.items.map((item) => `${item.quantity} × ${item.productName} — ${Number(item.price) * item.quantity} ₽`).join("\n");
  const text = [`Новый заказ ${order.number}`, `Клиент: ${order.customerName}`, `Телефон: ${order.phone}`, `Доставка: ${order.delivery}`, "", items, "", `Итого: ${Number(order.total)} ₽`].join("\n");
  await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: config.telegramChatId, text }) }).catch((error) => console.error("Telegram notification failed", error));
}
