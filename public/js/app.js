const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || "";
const cartKey = "sgcb_cart_v1";
let cart = [];

try {
  const saved = JSON.parse(localStorage.getItem(cartKey) || "[]");
  if (Array.isArray(saved)) cart = saved;
} catch {
  cart = [];
}

const money = (value) => `${new Intl.NumberFormat("ru-RU").format(Number(value))} ₽`;
const cartOverlay = document.querySelector("[data-cart-overlay]");
const checkoutOverlay = document.querySelector("[data-checkout-overlay]");

function persistCart() {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  renderCart();
}

function showToast(message) {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 2200);
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((item) => { item.textContent = String(count); });
  const lines = document.querySelector("[data-cart-lines]");
  const summary = document.querySelector("[data-cart-summary]");
  if (!lines || !summary) return;
  lines.replaceChildren();
  if (!cart.length) {
    const empty = document.createElement("div");
    empty.className = "empty-cart";
    const title = document.createElement("h3");
    title.textContent = "Корзина пока пуста";
    const text = document.createElement("p");
    text.textContent = "Добавьте товары из каталога";
    empty.append(title, text);
    lines.append(empty);
    summary.classList.add("hidden");
    return;
  }
  summary.classList.remove("hidden");
  for (const item of cart) {
    const line = document.createElement("article");
    line.className = "cart-line";
    const image = document.createElement("img");
    image.src = item.image;
    image.alt = "";
    const body = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.name;
    const price = document.createElement("span");
    price.textContent = money(item.price);
    const qty = document.createElement("div");
    qty.className = "qty small";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.addEventListener("click", () => updateQuantity(item.productId, item.quantity - 1));
    const amount = document.createElement("span");
    amount.textContent = String(item.quantity);
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.addEventListener("click", () => updateQuantity(item.productId, item.quantity + 1));
    qty.append(minus, amount, plus);
    body.append(title, price, qty);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Удалить ${item.name}`);
    remove.addEventListener("click", () => { cart = cart.filter((lineItem) => lineItem.productId !== item.productId); persistCart(); });
    line.append(image, body, remove);
    lines.append(line);
  }
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalNode = document.querySelector("[data-cart-total]");
  if (totalNode) totalNode.textContent = money(total);
}

function updateQuantity(productId, quantity) {
  if (quantity < 1) cart = cart.filter((item) => item.productId !== productId);
  else cart = cart.map((item) => item.productId === productId ? { ...item, quantity: Math.min(99, quantity) } : item);
  persistCart();
}

document.addEventListener("click", (event) => {
  const add = event.target.closest(".add-to-cart");
  if (add) {
    const product = { productId: add.dataset.productId, name: add.dataset.productName, price: Number(add.dataset.productPrice), image: add.dataset.productImage, quantity: 1 };
    const existing = cart.find((item) => item.productId === product.productId);
    if (existing) existing.quantity += 1;
    else cart.push(product);
    persistCart();
    showToast(`${product.name} — в корзине`);
  }
  if (event.target.closest("[data-cart-open]")) cartOverlay?.classList.remove("hidden");
  if (event.target.closest("[data-cart-close]") || event.target === cartOverlay) cartOverlay?.classList.add("hidden");
  if (event.target.closest("[data-checkout-open]")) { cartOverlay?.classList.add("hidden"); checkoutOverlay?.classList.remove("hidden"); }
  if (event.target.closest("[data-checkout-close]") || event.target === checkoutOverlay) checkoutOverlay?.classList.add("hidden");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { cartOverlay?.classList.add("hidden"); checkoutOverlay?.classList.add("hidden"); }
});

document.querySelector("[data-checkout-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button");
  const error = form.querySelector("[data-checkout-error]");
  button.disabled = true;
  error.classList.add("hidden");
  const data = Object.fromEntries(new FormData(form));
  data.items = cart.map(({ productId, quantity }) => ({ productId, quantity }));
  try {
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json", "x-csrf-token": csrfToken }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Не удалось оформить заказ.");
    cart = [];
    persistCart();
    form.reset();
    checkoutOverlay.classList.add("hidden");
    showToast(`Заказ ${result.number} принят`);
  } catch (requestError) {
    error.textContent = requestError.message;
    error.classList.remove("hidden");
  } finally {
    button.disabled = false;
  }
});

const articlePage = document.querySelector("[data-article-id]");
document.querySelector("[data-like-button]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const response = await fetch(`/api/articles/${articlePage.dataset.articleId}/like`, { method: "POST", headers: { "content-type": "application/json", "x-csrf-token": csrfToken }, body: "{}" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Не удалось изменить лайк.");
    button.classList.toggle("active", result.liked);
    button.querySelector("span:first-child").textContent = result.liked ? "♥" : "♡";
    button.querySelector("[data-like-label]").textContent = result.liked ? "Понравилось" : "Нравится";
    button.querySelector("[data-like-count]").textContent = String(result.count);
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
});

document.querySelector("[data-comment-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const body = String(new FormData(form).get("body") || "").trim();
  const error = form.querySelector("[data-comment-error]");
  error.classList.add("hidden");
  try {
    const response = await fetch(`/api/articles/${articlePage.dataset.articleId}/comments`, { method: "POST", headers: { "content-type": "application/json", "x-csrf-token": csrfToken }, body: JSON.stringify({ body }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Не удалось отправить комментарий.");
    const article = document.createElement("article");
    const avatar = document.createElement("span");
    avatar.textContent = result.author.slice(0, 1).toUpperCase();
    const content = document.createElement("div");
    const author = document.createElement("b");
    author.textContent = result.author;
    const text = document.createElement("p");
    text.textContent = result.body;
    content.append(author, text);
    article.append(avatar, content);
    document.querySelector("[data-comment-list]").append(article);
    const count = document.querySelector("[data-comment-count]");
    count.textContent = String(Number(count.textContent) + 1);
    form.reset();
  } catch (requestError) {
    error.textContent = requestError.message;
    error.classList.remove("hidden");
  }
});

document.querySelector("[data-share-button]")?.addEventListener("click", async () => {
  try {
    if (navigator.share) await navigator.share({ title: document.title, url: location.href });
    else await navigator.clipboard.writeText(location.href);
    showToast("Ссылка готова для отправки");
  } catch {}
});

document.querySelector("[data-subscribe-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const email = String(new FormData(form).get("email") || "");
  const message = form.querySelector("[data-subscribe-message]");
  const response = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json", "x-csrf-token": csrfToken }, body: JSON.stringify({ email }) });
  const result = await response.json();
  message.textContent = response.ok ? "Вы подписаны" : result.error;
  message.classList.remove("hidden");
  if (response.ok) form.querySelector("input").disabled = true;
});

renderCart();
