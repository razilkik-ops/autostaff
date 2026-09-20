import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { config } from "../src/config.js";
import { prisma } from "../src/db.js";

function updateCookies(jar, response) {
  for (const value of response.headers.getSetCookie()) {
    const [cookie] = value.split(";");
    const [name, ...rest] = cookie.split("=");
    jar.set(name, rest.join("="));
  }
}

function cookieHeader(jar) {
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

function csrfFrom(html) {
  const match = html.match(/<meta name="csrf-token" content="([^"]+)"/);
  assert.ok(match, "страница должна содержать CSRF-токен");
  return match[1];
}

async function request(baseUrl, jar, path, options = {}) {
  const headers = new Headers(options.headers);
  if (jar.size) headers.set("cookie", cookieHeader(jar));
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...options, headers });
  updateCookies(jar, response);
  return response;
}

test("регистрация, сессия, лайки, комментарии, заказ и админ-доступ работают с PostgreSQL", async (t) => {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `integration-${unique}@example.test`;
  const categorySlug = `test-category-${unique}`;
  const jar = new Map();
  let createdUser;
  let createdOrder;
  let createdCategory;
  const article = await prisma.article.findFirst({ where: { published: true }, orderBy: { createdAt: "asc" } });
  const product = await prisma.product.findFirst({ where: { published: true, stock: { gt: 1 } }, orderBy: { createdAt: "asc" } });
  assert.ok(article, "перед тестом выполните npm run db:seed");
  assert.ok(product, "перед тестом выполните npm run db:seed");

  const app = createApp({ db: prisma, config: { ...config, isProduction: false } });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });

  t.after(async () => {
    await prisma.like.deleteMany({ where: { user: { email } } });
    await prisma.comment.deleteMany({ where: { user: { email } } });
    await prisma.session.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    if (createdOrder) await prisma.order.deleteMany({ where: { id: createdOrder.id } });
    if (createdOrder) await prisma.product.update({ where: { id: product.id }, data: { stock: { increment: 2 } } });
    if (createdCategory) await prisma.category.deleteMany({ where: { id: createdCategory.id } });
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  const registerPage = await request(baseUrl, jar, "/register");
  assert.equal(registerPage.status, 200);
  const csrf = csrfFrom(await registerPage.text());

  const registerBody = new URLSearchParams({
    _csrf: csrf,
    name: "Тестовый пользователь",
    email,
    password: "Integration-Password-2026!",
    returnTo: `/blog/${article.slug}`,
  });
  const registration = await request(baseUrl, jar, "/register", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: registerBody,
  });
  assert.equal(registration.status, 302);
  assert.equal(registration.headers.get("location"), `/blog/${article.slug}`);
  createdUser = await prisma.user.findUnique({ where: { email } });
  assert.ok(createdUser);
  assert.notEqual(createdUser.passwordHash, "Integration-Password-2026!");

  const articlePage = await request(baseUrl, jar, `/blog/${article.slug}`);
  assert.equal(articlePage.status, 200);
  const articleHtml = await articlePage.text();
  assert.match(articleHtml, /data-like-button/);
  assert.match(articleHtml, /data-comment-form/);

  const like = await request(baseUrl, jar, `/api/articles/${article.id}/like`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrf },
    body: "{}",
  });
  assert.equal(like.status, 200);
  assert.equal((await like.json()).liked, true);
  assert.equal(await prisma.like.count({ where: { userId: createdUser.id, articleId: article.id } }), 1);

  const unlike = await request(baseUrl, jar, `/api/articles/${article.id}/like`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrf },
    body: "{}",
  });
  assert.equal(unlike.status, 200);
  assert.equal((await unlike.json()).liked, false);
  assert.equal(await prisma.like.count({ where: { userId: createdUser.id, articleId: article.id } }), 0);

  const commentText = `Проверка комментария ${unique}`;
  const comment = await request(baseUrl, jar, `/api/articles/${article.id}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrf },
    body: JSON.stringify({ body: commentText }),
  });
  assert.equal(comment.status, 201);
  assert.equal((await comment.json()).body, commentText);

  const logout = await request(baseUrl, jar, "/logout", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ _csrf: csrf }),
  });
  assert.equal(logout.status, 302);

  const login = await request(baseUrl, jar, "/login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ _csrf: csrf, email, password: "Integration-Password-2026!", returnTo: `/blog/${article.slug}` }),
  });
  assert.equal(login.status, 302);
  assert.equal(login.headers.get("location"), `/blog/${article.slug}`);

  const order = await request(baseUrl, jar, "/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrf },
    body: JSON.stringify({
      customerName: "Тестовый пользователь",
      phone: "+7 900 000-00-00",
      email,
      delivery: "Самовывоз во Владимире",
      items: [{ productId: product.id, quantity: 2, price: 1 }],
    }),
  });
  assert.equal(order.status, 201);
  const orderResult = await order.json();
  createdOrder = await prisma.order.findUnique({ where: { number: orderResult.number }, include: { items: true } });
  assert.equal(Number(createdOrder.total), Number(product.price) * 2, "цена должна браться из БД, а не из браузера");
  assert.equal((await prisma.product.findUnique({ where: { id: product.id } })).stock, product.stock - 2, "остаток должен списываться внутри транзакции");

  const forbidden = await request(baseUrl, jar, "/admin");
  assert.equal(forbidden.status, 403);

  await prisma.user.update({ where: { id: createdUser.id }, data: { role: "ADMIN" } });
  const admin = await request(baseUrl, jar, "/admin");
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /Обзор магазина/);

  const createCategory = await request(baseUrl, jar, "/admin/categories", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ _csrf: csrf, name: "Тестовая категория", slug: categorySlug, sortOrder: "999" }),
  });
  assert.equal(createCategory.status, 302);
  createdCategory = await prisma.category.findUnique({ where: { slug: categorySlug } });
  assert.ok(createdCategory, "администратор должен создавать категории каталога");

  const anonymousJar = new Map();
  const anonymousPage = await request(baseUrl, anonymousJar, `/blog/${article.slug}`);
  const anonymousCsrf = csrfFrom(await anonymousPage.text());
  const anonymousLike = await request(baseUrl, anonymousJar, `/api/articles/${article.id}/like`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": anonymousCsrf },
    body: "{}",
  });
  assert.equal(anonymousLike.status, 401);
});
