import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  ["Экстерьер", "eksterer", "/assets/wash-mitt.png"],
  ["Интерьер", "interer", "/assets/interior-brushes.png"],
  ["Машинки для полировки", "polirovalnye-mashinki", "/assets/polishing-machine.png"],
  ["Микрофибра", "mikrofibra", "/assets/drying-towel.png"],
  ["Оборудование для детейлинга", "oborudovanie", "/assets/detailing-bucket.png"],
  ["Защитные плёнки PPF", "ppf", "/assets/ppf-film.png"],
];

const products = [
  { slug: "drying-towel", category: "mikrofibra", name: "Сушащее полотенце G1500", shortName: "Полотенце G1500", sku: "SGCB-TWL-1500", price: 4990, image: "/assets/drying-towel.png", stock: 24, description: "Двустороннее микрофибровое полотенце быстро впитывает воду и не оставляет разводов на кузове.", specs: [["Размер", "60 × 90 см"], ["Плотность", "1500 г/м²"], ["Материал", "Микрофибра"], ["Цвет", "Графит"]] },
  { slug: "detailing-bucket", category: "oborudovanie", name: "Ведро для мойки Detailing Lab 20L", shortName: "Ведро Detailing Lab 20L", sku: "SGCB-BKT-20", price: 2990, image: "/assets/detailing-bucket.png", stock: 18, description: "Прочное ведро с герметичной крышкой для безопасной и удобной ручной мойки автомобиля.", specs: [["Объём", "20 л"], ["Материал", "HDPE-пластик"], ["Крышка", "Герметичная"], ["Цвет", "Синий"]] },
  { slug: "wash-mitt", category: "eksterer", name: "Варежка для мойки Carp Gliles Shine", shortName: "Варежка Carp Gliles Shine", sku: "SGCB-MITT-BL", price: 1990, image: "/assets/wash-mitt.png", stock: 40, description: "Мягкая варежка из шенилловой микрофибры бережно снимает загрязнения и сохраняет лакокрасочное покрытие.", specs: [["Материал", "Микрофибра"], ["Тип ворса", "Шенилл"], ["Размер", "24 × 18 см"], ["Цвет", "Синий"]] },
  { slug: "polishing-machine", category: "polirovalnye-mashinki", name: "Полировальная машинка DA15", shortName: "Полировальная машинка DA15", sku: "SGCB-DA15", price: 24990, image: "/assets/polishing-machine.png", stock: 7, description: "Эксцентриковая полировальная машинка для безопасной коррекции лака и профессиональной работы в детейлинг-центре.", specs: [["Ход эксцентрика", "15 мм"], ["Мощность", "1000 Вт"], ["Подложка", "125 мм"], ["Гарантия", "12 месяцев"]] },
  { slug: "interior-brushes", category: "interer", name: "Набор кистей для интерьера", shortName: "Кисти для интерьера", sku: "SGCB-BRUSH-5", price: 3490, image: "/assets/interior-brushes.png", stock: 32, description: "Пять мягких кистей разных размеров для безопасной очистки дефлекторов, кнопок, швов и других сложных зон салона.", specs: [["Количество", "5 шт."], ["Материал ворса", "Синтетика"], ["Рукоять", "Пластик"], ["Назначение", "Интерьер"]] },
  { slug: "ppf-film", category: "ppf", name: "Защитная плёнка PPF Clear Pro", shortName: "Плёнка PPF Clear Pro", sku: "SGCB-PPF-15", price: 89900, image: "/assets/ppf-film.png", stock: 5, description: "Прозрачная полиуретановая плёнка с самовосстанавливающимся верхним слоем для защиты кузова от сколов и царапин.", specs: [["Ширина", "1,52 м"], ["Длина", "15 м"], ["Толщина", "190 мкм"], ["Гарантия", "7 лет"]] },
];

const articles = [
  { type: "BLOG", slug: "kak-vybrat-vedro-dlya-moyki", title: "Как выбрать ведро для безопасной мойки автомобиля", description: "Разбираем объём, сепаратор и крышку — и объясняем, почему правильное ведро помогает сохранить лак.", heroImage: "/assets/detailing-bucket.png", product: "detailing-bucket", body: "Почему обычного ведра недостаточно\nПри контактной мойке частицы песка оседают на дне. Защитная решётка не даёт варежке снова собрать абразив и вернуть его на кузов.\n\nОптимальный объём\nДля легкового автомобиля удобнее всего ведро на 18–20 литров: воды хватает на весь цикл, а ёмкость остаётся мобильной.\n\nЧто ещё пригодится\nИспользуйте метод двух вёдер: одно с шампунем, второе — для ополаскивания варежки. Герметичная крышка упростит перевозку воды и химии." },
  { type: "BLOG", slug: "mikrofibra-bez-razvodov", title: "Микрофибра без разводов: плотность, ворс и уход", description: "Как подобрать полотенце для сушки, стёкол и интерьера и продлить срок его службы.", heroImage: "/assets/drying-towel.png", product: "drying-towel", body: "Плотность имеет значение\nДля бесконтактной сушки выбирайте плотную микрофибру с мягким двусторонним ворсом.\n\nПравильная стирка\nСтирайте изделия отдельно, без кондиционера и отбеливателя, при температуре до 40 °C.\n\nХранение\nПосле полного высыхания храните микрофибру в закрытом чистом контейнере." },
  { type: "BLOG", slug: "podgotovka-k-polirovke", title: "Подготовка кузова к полировке: пошаговый чек-лист", description: "От глубокой мойки и деконтаминации до маскировки — основа предсказуемого результата.", heroImage: "/assets/polishing-machine.png", product: "polishing-machine", body: "Очистка поверхности\nУдалите дорожную плёнку, металлические вкрапления и битум.\n\nДиагностика\nОсмотрите лак под направленным светом и измерьте толщину покрытия.\n\nТестовый участок\nНачните с мягкой комбинации круга и пасты, постепенно повышая абразивность." },
  { type: "NEWS", slug: "sgcb-russia-delivery", title: "SGCB расширяет доставку профессиональных товаров по России", description: "Оборудование, автохимия и расходные материалы теперь отправляются во все регионы России.", heroImage: "/assets/hero-auto.png", product: "wash-mitt", body: "Больше регионов\nМы подключили федеральные транспортные службы и ускорили обработку заказов для детейлинг-центров.\n\nПомощь с подбором\nСпециалисты помогут сформировать набор под задачи студии, автомойки или частного мастера.\n\nОптовые поставки\nДля профессиональных клиентов доступны комплексные поставки и персональные условия." },
  { type: "NEWS", slug: "novaya-liniya-ppf", title: "Новая линейка защитных плёнок PPF Clear Pro", description: "Высокая прозрачность, гидрофобный верхний слой и гарантия до семи лет.", heroImage: "/assets/ppf-film.png", product: "ppf-film", body: "Чистая оптика\nОбновлённый клеевой слой сохраняет прозрачность и облегчает позиционирование материала.\n\nСамовосстановление\nМелкие царапины на верхнем слое затягиваются под действием тепла.\n\nДля сложных элементов\nЭластичность плёнки позволяет работать с бамперами, зеркалами и деталями сложной формы." },
  { type: "NEWS", slug: "detailing-training-vladimir", title: "Практический день для детейлеров во Владимире", description: "Демонстрации полировки, ухода за интерьером и установки PPF на реальном автомобиле.", heroImage: "/assets/sgcb-tools-banner.jpg", product: "polishing-machine", body: "Живые демонстрации\nТехнологи покажут полный цикл подготовки поверхности и подбора связки пасты с кругом.\n\nОтветы экспертов\nУчастники смогут разобрать рабочие ситуации и протестировать оборудование SGCB.\n\nРегистрация\nКоличество мест ограничено — следите за обновлениями в разделе новостей и Telegram." },
];

async function main() {
  const categoryMap = new Map();
  for (const [name, slug, image] of categories) {
    const category = await prisma.category.upsert({ where: { slug }, update: { name, image }, create: { name, slug, image, sortOrder: categoryMap.size } });
    categoryMap.set(slug, category);
  }

  const productMap = new Map();
  for (const product of products) {
    const { category, ...data } = product;
    const saved = await prisma.product.upsert({
      where: { slug: data.slug },
      update: { ...data, categoryId: categoryMap.get(category).id },
      create: { ...data, categoryId: categoryMap.get(category).id },
    });
    productMap.set(saved.slug, saved);
  }

  let admin = null;
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (process.env.ADMIN_PASSWORD.length < 10) throw new Error("ADMIN_PASSWORD must contain at least 10 characters");
    admin = await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL.toLowerCase() },
      update: { name: process.env.ADMIN_NAME || "Администратор", role: "ADMIN" },
      create: { name: process.env.ADMIN_NAME || "Администратор", email: process.env.ADMIN_EMAIL.toLowerCase(), passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: "ADMIN" },
    });
  }

  for (const article of articles) {
    const { product, ...data } = article;
    await prisma.article.upsert({
      where: { slug: data.slug },
      update: { ...data, published: true, publishedAt: new Date(), productId: productMap.get(product)?.id, authorId: admin?.id },
      create: { ...data, published: true, publishedAt: new Date(), productId: productMap.get(product)?.id, authorId: admin?.id },
    });
  }
}

main().then(() => console.log("Seed completed")).finally(() => prisma.$disconnect());
