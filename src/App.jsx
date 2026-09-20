import { useEffect, useMemo, useState } from "react";
import {
  Article,
  ArrowLeft,
  ArrowRight,
  CaretDown,
  ChatCircle,
  Check,
  Clock,
  Copy,
  CreditCard,
  Diamond,
  EnvelopeSimple,
  Gauge,
  Headset,
  Heart,
  MagnifyingGlass,
  MapPin,
  Minus,
  Newspaper,
  Package,
  PaperPlaneTilt,
  Phone,
  PlayCircle,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  ThumbsUp,
  Trash,
  Truck,
  X,
} from "@phosphor-icons/react";

const siteBase = import.meta.env.BASE_URL.replace(/\/$/, "");
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const currentAppPath = () => {
  const pathname = window.location.pathname;
  if (siteBase && pathname.startsWith(siteBase)) return pathname.slice(siteBase.length) || "/";
  return pathname;
};

const money = { format: (value) => `${new Intl.NumberFormat("ru-RU").format(Number(value))} ₽` };

const products = [
  {
    id: "drying-towel",
    brand: "SGCB",
    name: "Сушащее полотенце G1500",
    short: "Полотенце G1500",
    price: 4990,
    image: assetUrl("assets/drying-towel.png"),
    category: "Микрофибра",
    reviews: 124,
    sku: "DL-1500-GR",
    description: "Двустороннее микрофибровое полотенце быстро впитывает воду и не оставляет разводов на кузове.",
    specs: [["Размер", "60 × 90 см"], ["Плотность", "1500 г/м²"], ["Материал", "Микрофибра"], ["Цвет", "Графит"]],
  },
  {
    id: "detailing-bucket",
    brand: "SGCB",
    name: "Ведро для мойки Detailing Lab 20L",
    short: "Ведро Detailing Lab 20L",
    price: 2990,
    image: assetUrl("assets/detailing-bucket.png"),
    category: "Оборудование для детейлинга",
    reviews: 98,
    sku: "DL-BKT-20",
    description: "Прочное ведро с герметичной крышкой для безопасной и удобной ручной мойки автомобиля.",
    specs: [["Объём", "20 л"], ["Материал", "HDPE-пластик"], ["Крышка", "Герметичная"], ["Цвет", "Синий"]],
  },
  {
    id: "wash-mitt",
    brand: "SGCB",
    name: "Варежка для мойки Carp Gliles Shine",
    short: "Варежка Carp Gliles Shine",
    price: 1990,
    image: assetUrl("assets/wash-mitt.png"),
    category: "Экстерьер",
    reviews: 76,
    sku: "DL-MITT-BL",
    description: "Мягкая варежка из шенилловой микрофибры бережно снимает загрязнения и сохраняет лакокрасочное покрытие.",
    specs: [["Материал", "Микрофибра"], ["Тип ворса", "Шенилл"], ["Размер", "24 × 18 см"], ["Цвет", "Синий"]],
  },
  {
    id: "polishing-machine",
    brand: "SGCB",
    name: "Полировальная машинка DA15",
    short: "Полировальная машинка DA15",
    price: 24990,
    image: assetUrl("assets/polishing-machine.png"),
    category: "Машинки для полировки",
    reviews: 54,
    sku: "SGCB-DA15",
    description: "Эксцентриковая полировальная машинка для безопасной коррекции лака и профессиональной работы в детейлинг-центре.",
    specs: [["Ход эксцентрика", "15 мм"], ["Мощность", "1000 Вт"], ["Подложка", "125 мм"], ["Гарантия", "12 месяцев"]],
  },
  {
    id: "interior-brushes",
    brand: "SGCB",
    name: "Набор кистей для интерьера",
    short: "Набор кистей для интерьера",
    price: 3490,
    image: assetUrl("assets/interior-brushes.png"),
    category: "Интерьер",
    reviews: 112,
    sku: "SGCB-BRUSH-5",
    description: "Пять мягких кистей разных размеров для безопасной очистки дефлекторов, кнопок, швов и других сложных зон салона.",
    specs: [["Количество", "5 шт."], ["Материал ворса", "Синтетика"], ["Рукоять", "Пластик"], ["Назначение", "Интерьер"]],
  },
  {
    id: "ppf-film",
    brand: "SGCB",
    name: "Защитная плёнка PPF Clear Pro",
    short: "Плёнка PPF Clear Pro",
    price: 89900,
    image: assetUrl("assets/ppf-film.png"),
    category: "Защитные плёнки PPF",
    reviews: 93,
    sku: "SGCB-PPF-15",
    description: "Прозрачная полиуретановая плёнка с самовосстанавливающимся верхним слоем для защиты кузова от сколов и царапин.",
    specs: [["Ширина", "1,52 м"], ["Длина", "15 м"], ["Толщина", "190 мкм"], ["Гарантия", "7 лет"]],
  },
];

const categories = [
  { title: "Экстерьер", image: assetUrl("assets/wash-mitt.png") },
  { title: "Интерьер", image: assetUrl("assets/interior-brushes.png") },
  { title: "Машинки для полировки", image: assetUrl("assets/polishing-machine.png") },
  { title: "Микрофибра", image: assetUrl("assets/drying-towel.png") },
  { title: "Оборудование для детейлинга", image: assetUrl("assets/detailing-bucket.png") },
  { title: "Защитные плёнки PPF", image: assetUrl("assets/ppf-film.png") },
];

const benefits = [
  { icon: Truck, text: "Быстрая доставка по всей России" },
  { icon: ShieldCheck, text: "Только проверенные бренды" },
  { icon: Headset, text: "Поддержка и консультации" },
];

const heroFeatures = [
  { icon: Diamond, title: "Проверенное", text: "качество" },
  { icon: Truck, title: "Быстрая", text: "доставка" },
  { icon: ShieldCheck, title: "Удобная", text: "оплата" },
  { icon: Headset, title: "Поможем", text: "с выбором" },
];

const steps = [
  { icon: MagnifyingGlass, n: "01", title: "Выбираете товары", text: "Находите нужную автохимию и оборудование" },
  { icon: ShoppingCart, n: "02", title: "Оформляете заказ", text: "Добавляете товары в корзину" },
  { icon: CreditCard, n: "03", title: "Подтверждаете", text: "Указываете данные для связи" },
  { icon: Package, n: "04", title: "Получаете заказ", text: "Доставим по России или подготовим самовывоз" },
];

const articles = [
  {
    type: "blog", slug: "kak-vybrat-vedro-dlya-moyki", title: "Как выбрать ведро для безопасной мойки автомобиля",
    description: "Разбираем объём, сепаратор и крышку — и объясняем, почему правильное ведро помогает сохранить лак.",
    date: "18 сентября 2026", readTime: "6 минут", image: assetUrl("assets/detailing-bucket.png"), productId: "detailing-bucket",
    sections: [
      ["Почему обычного ведра недостаточно", "При контактной мойке частицы песка оседают на дне. Защитная решётка не даёт варежке снова собрать абразив и вернуть его на кузов."],
      ["Оптимальный объём", "Для легкового автомобиля удобнее всего ведро на 18–20 литров: воды хватает на весь цикл, а ёмкость остаётся мобильной."],
      ["Что ещё пригодится", "Используйте метод двух вёдер: одно с шампунем, второе — для ополаскивания варежки. Герметичная крышка упростит перевозку воды и химии."],
    ],
  },
  {
    type: "blog", slug: "mikrofibra-bez-razvodov", title: "Микрофибра без разводов: плотность, ворс и уход",
    description: "Как подобрать полотенце для сушки, стёкол и интерьера и продлить срок его службы.",
    date: "15 сентября 2026", readTime: "5 минут", image: assetUrl("assets/drying-towel.png"), productId: "drying-towel",
    sections: [["Плотность имеет значение", "Для бесконтактной сушки выбирайте плотную микрофибру с мягким двусторонним ворсом."], ["Правильная стирка", "Стирайте изделия отдельно, без кондиционера и отбеливателя, при температуре до 40 °C."], ["Хранение", "После полного высыхания храните микрофибру в закрытом чистом контейнере."]],
  },
  {
    type: "blog", slug: "podgotovka-k-polirovke", title: "Подготовка кузова к полировке: пошаговый чек-лист",
    description: "От глубокой мойки и деконтаминации до маскировки — основа предсказуемого результата.",
    date: "10 сентября 2026", readTime: "8 минут", image: assetUrl("assets/polishing-machine.png"), productId: "polishing-machine",
    sections: [["Очистка поверхности", "Удалите дорожную плёнку, металлические вкрапления и битум."], ["Диагностика", "Осмотрите лак под направленным светом и измерьте толщину покрытия."], ["Тестовый участок", "Начните с мягкой комбинации круга и пасты, постепенно повышая абразивность."]],
  },
  {
    type: "news", slug: "sgcb-russia-delivery", title: "SGCB расширяет доставку профессиональных товаров по России",
    description: "Оборудование, автохимия и расходные материалы теперь отправляются во все регионы России.",
    date: "19 сентября 2026", readTime: "3 минуты", image: assetUrl("assets/hero-auto.png"), productId: "wash-mitt",
    sections: [["Больше регионов", "Мы подключили федеральные транспортные службы и ускорили обработку заказов для детейлинг-центров."], ["Помощь с подбором", "Специалисты помогут сформировать набор под задачи студии, автомойки или частного мастера."], ["Оптовые поставки", "Для профессиональных клиентов доступны комплексные поставки и персональные условия."]],
  },
  {
    type: "news", slug: "novaya-liniya-ppf", title: "Новая линейка защитных плёнок PPF Clear Pro",
    description: "Высокая прозрачность, гидрофобный верхний слой и гарантия до семи лет.",
    date: "12 сентября 2026", readTime: "4 минуты", image: assetUrl("assets/ppf-film.png"), productId: "ppf-film",
    sections: [["Чистая оптика", "Обновлённый клеевой слой сохраняет прозрачность и облегчает позиционирование материала."], ["Самовосстановление", "Мелкие царапины на верхнем слое затягиваются под действием тепла."], ["Для сложных элементов", "Эластичность плёнки позволяет работать с бамперами, зеркалами и деталями сложной формы."]],
  },
  {
    type: "news", slug: "detailing-training-vladimir", title: "Практический день для детейлеров во Владимире",
    description: "Демонстрации полировки, ухода за интерьером и установки PPF на реальном автомобиле.",
    date: "5 сентября 2026", readTime: "3 минуты", image: assetUrl("assets/promo-detailing.png"), productId: "polishing-machine",
    sections: [["Живые демонстрации", "Технологи покажут полный цикл подготовки поверхности и подбора связки пасты с кругом."], ["Ответы экспертов", "Участники смогут разобрать рабочие ситуации и протестировать оборудование SGCB."], ["Регистрация", "Количество мест ограничено — следите за обновлениями в разделе новостей и Telegram."]],
  },
];

const infoPages = {
  delivery: { title: "Доставка и оплата", text: "Отправляем заказы по всей России транспортными компаниями и курьерскими службами. Стоимость и срок рассчитываются менеджером после подтверждения заказа. Доступны онлайн-оплата и безналичный расчёт для организаций." },
  returns: { title: "Возврат и обмен", text: "Товар надлежащего качества можно вернуть или обменять в сроки, установленные законодательством РФ, при сохранении упаковки и товарного вида. Для начала возврата свяжитесь с менеджером." },
  questions: { title: "Вопросы", text: "Нужна помощь с подбором автохимии, оборудования или плёнки PPF? Напишите нам в Telegram или позвоните — специалист уточнит задачу и предложит подходящий комплект." },
  privacy: { title: "Политика конфиденциальности", text: "Мы используем контактные данные только для обработки заказов, обратной связи и подписки, если пользователь дал на неё согласие. Данные не передаются третьим лицам, кроме служб, необходимых для выполнения заказа." },
  about: { title: "О компании", text: "SGCB — профессиональные решения для детейлинга и ухода за автомобилем. Мы поставляем автохимию, микрофибру, инструменты, оборудование и защитные плёнки для студий и частных мастеров." },
};

function Brand({ onHome }) {
  return (
    <button className="brand" onClick={onHome} aria-label="SGCB — на главную">
      <span className="brand-mark"><Gauge size={34} weight="fill" /></span>
      <span><b>SGCB<span> PRO</span></b><small>PROFESSIONAL DETAILING</small></span>
    </button>
  );
}

function Rating({ reviews }) {
  return (
    <div className="rating" aria-label={`Рейтинг 5 из 5, ${reviews} отзывов`}>
      <span>{[0, 1, 2, 3, 4].map((value) => <Star key={value} size={12} weight="fill" />)}</span>
      <small>({reviews})</small>
    </div>
  );
}

function Header({ cartCount, onCart, onHome, navigate }) {
  return (
    <>
      <div className="benefit-bar">
        <div className="layout-container benefit-bar-inner">
          {benefits.map(({ icon: Icon, text }) => (
            <div className="benefit" key={text}><Icon size={20} weight="duotone" /><span>{text}</span></div>
          ))}
          <button className="location"><MapPin size={14} weight="fill" /> Россия <CaretDown size={11} /></button>
        </div>
      </div>
      <header className="header">
        <div className="layout-container header-inner">
          <Brand onHome={onHome} />
          <nav aria-label="Основная навигация">
            <button onClick={() => navigate("/#catalog")}>Каталог <CaretDown size={12} /></button>
            <button onClick={() => navigate("/#categories")}>Категории <CaretDown size={12} /></button>
            <button onClick={() => navigate("/blog")}>Блог</button>
            <button onClick={() => navigate("/news")}>Новости</button>
            <button onClick={() => navigate("/#contacts")}>Контакты</button>
          </nav>
          <div className="header-actions">
            <button aria-label="Избранное"><Heart size={28} /></button>
            <button aria-label={`Корзина, товаров: ${cartCount}`} className="cart-action" onClick={onCart}>
              <ShoppingCart size={30} /><span>{cartCount}</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

function ProductCard({ product, addToCart, openProduct }) {
  return (
    <article className="product-card">
      <button className="wish" aria-label={`Добавить ${product.short} в избранное`}><Heart size={18} /></button>
      <button className="product-link" onClick={() => openProduct(product.id)}>
        <img src={product.image} alt={product.name} />
        <span className="product-brand">{product.brand}</span>
        <h3>{product.name}</h3>
      </button>
      <Rating reviews={product.reviews} />
      <div className="product-bottom">
        <b>{money.format(product.price)}</b>
        <button onClick={() => addToCart(product)} aria-label={`Добавить ${product.short} в корзину`}><ShoppingCart size={18} weight="bold" /></button>
      </div>
    </article>
  );
}

function ArticleCard({ item, navigate }) {
  const label = item.type === "blog" ? "Блог" : "Новости";
  return (
    <article className="article-card">
      <button className="article-card-image" onClick={() => navigate(`/${item.type}/${item.slug}`)} aria-label={`Открыть: ${item.title}`}>
        <img src={item.image} alt="" />
      </button>
      <div className="article-card-body">
        <span className="article-kind">{label}</span>
        <button className="article-title" onClick={() => navigate(`/${item.type}/${item.slug}`)}><h3>{item.title}</h3></button>
        <p>{item.description}</p>
        <div><span>{item.date}</span><span>{item.readTime}</span></div>
      </div>
    </article>
  );
}

function Footer({ navigate }) {
  return (
    <footer id="contacts">
      <div className="footer-main">
        <div className="layout-container footer-main-inner">
          <div className="footer-brand"><Brand onHome={() => navigate("/")} /><p>Профессиональная автохимия, оборудование и аксессуары SGCB для детейлинг-центров, автомоек и частных мастеров.</p></div>
          <div><h3>Каталог</h3><button onClick={() => navigate("/#catalog")}>Автохимия</button><button onClick={() => navigate("/#catalog")}>Инструмент</button><button onClick={() => navigate("/#catalog")}>Аксессуары</button><button onClick={() => navigate("/#catalog")}>Оборудование</button><button onClick={() => navigate("/#catalog")}>Защитные плёнки</button></div>
          <div><h3>Покупателю</h3><button onClick={() => navigate("/info/delivery")}>Доставка и оплата</button><button onClick={() => navigate("/info/questions")}>Вопросы</button><button onClick={() => navigate("/info/returns")}>Возврат и обмен</button><button onClick={() => navigate("/info/privacy")}>Политика конфиденциальности</button><button onClick={() => navigate("/info/about")}>О компании</button></div>
          <div className="contacts"><h3>Контакты</h3><p><Phone size={16} /><a href="tel:+79807519996">+7 980 751-99-96 · телефон / MAX</a></p><p><PaperPlaneTilt size={16} /><a href="https://t.me/CEO_ALLSTARS" target="_blank" rel="noreferrer">Telegram: @CEO_ALLSTARS</a></p><p><EnvelopeSimple size={16} /><a href="mailto:allstars-import@yandex.ru">allstars-import@yandex.ru</a></p><p><MapPin size={16} /> г. Владимир, пр-т Строителей, 9Б</p><p><Clock size={16} /> Ежедневно: 10:00–21:00</p></div>
        </div>
      </div>
      <div className="footer-bottom"><div className="layout-container footer-bottom-inner"><span>© 2026 SGCB Russia. Все права защищены.</span><button onClick={() => navigate("/info/privacy")}>Политика конфиденциальности</button></div></div>
    </footer>
  );
}

function HomePage({ addToCart, openProduct, navigate }) {
  const [tab, setTab] = useState("Хиты продаж");
  return (
    <>
      <section className="hero" aria-labelledby="hero-title" style={{ backgroundImage: `url("${assetUrl("assets/hero-auto.png")}")` }}>
        <div className="layout-container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">SGCB — профессиональный детейлинг</p>
            <h1 id="hero-title">ТОВАРЫ<br /><span>ДЛЯ ДЕТЕЙЛИНГА</span><br />И УХОДА ЗА АВТО</h1>
            <p className="hero-lead">Автохимия, микрофибра, оборудование<br />и защитные плёнки для безупречного результата</p>
          </div>
          <img className="hero-badge" src={assetUrl("assets/hero-badge.png")} alt="Чистый авто больше, чем просто внешность" />
          <div className="hero-features">
            {heroFeatures.map(({ icon: Icon, title, text }) => (
              <div className="hero-feature" key={title}><Icon size={30} weight="duotone" /><span><b>{title}</b><small>{text}</small></span></div>
            ))}
          </div>
        </div>
      </section>

      <main className="content">
        <div className="layout-container content-inner"><section className="how" id="how">
          <div className="section-heading"><h2>КАК СДЕЛАТЬ ПОКУПКУ?</h2><p>Простой и понятный процесс от выбора до получения</p></div>
          <div className="steps">
            {steps.map(({ icon: Icon, n, title, text }, index) => (
              <div className="step-wrap" key={n}><article className="step"><div className="step-icon"><Icon size={28} /></div><div><span className="step-number">{n}</span><h3>{title}</h3><p>{text}</p></div></article>{index < steps.length - 1 && <ArrowRight className="step-arrow" size={22} />}</div>
            ))}
          </div>
        </section>

        <section className="categories" id="categories">
          <div className="section-title-row"><h2>КАТЕГОРИИ ТОВАРОВ</h2><button onClick={() => navigate("/#catalog")}>Смотреть все категории <ArrowRight size={18} /></button></div>
          <div className="category-grid">
            {categories.map((category) => <button className="category-card" key={category.title} onClick={() => navigate("/#catalog")}><img src={category.image} alt="" /><span>{category.title}</span></button>)}
          </div>
        </section>

        <section className="products" id="catalog">
          <div className="products-heading"><h2>ПОПУЛЯРНЫЕ ТОВАРЫ</h2><div className="tabs" role="tablist" aria-label="Подборки товаров">{["Хиты продаж", "Новинки", "Акции"].map((name) => <button key={name} role="tab" aria-selected={tab === name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name}</button>)}</div><button className="see-all" onClick={() => setTab("Хиты продаж")}>Смотреть все <ArrowRight size={18} /></button></div>
          <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} addToCart={addToCart} openProduct={openProduct} />)}</div>
        </section>

        <section className="knowledge" aria-labelledby="knowledge-title">
          <div className="section-title-row"><div><h2 id="knowledge-title">ПОЛЕЗНОЕ О ДЕТЕЙЛИНГЕ</h2><p>Практические статьи и новости индустрии</p></div><button onClick={() => navigate("/blog")}>Все статьи <ArrowRight size={18} /></button></div>
          <div className="article-grid">{articles.slice(0, 3).map((item) => <ArticleCard key={item.slug} item={item} navigate={navigate} />)}</div>
        </section>

        <button className="promo campaign-promo" onClick={() => navigate("/#catalog")} aria-label="Профессиональные инструменты SGCB для детейлинг-студий">
          <img src={assetUrl("assets/sgcb-tools-banner.jpg")} alt="Профессиональные инструменты SGCB для детейлинг-студий" />
        </button>
        </div>
      </main>
    </>
  );
}

function ProductPage({ product, addToCart, navigate, openProduct }) {
  const [qty, setQty] = useState(1);
  if (!product) return <main className="not-found"><h1>Товар не найден</h1><button onClick={() => navigate("/")}><ArrowLeft /> Вернуться в каталог</button></main>;
  const related = products.filter((item) => item.id !== product.id).slice(0, 3);
  return (
    <main className="product-page layout-container">
      <div className="breadcrumbs"><button onClick={() => navigate("/")}>Главная</button><span>/</span><button onClick={() => navigate("/#catalog")}>Каталог</button><span>/</span><span>{product.short}</span></div>
      <div className="product-detail">
        <div className="product-gallery"><img src={product.image} alt={product.name} /></div>
        <section className="product-info">
          <span className="product-brand">{product.brand}</span>
          <h1>{product.name}</h1>
          <div className="product-meta"><Rating reviews={product.reviews} /><span>Артикул: {product.sku}</span></div>
          <p className="detail-description">{product.description}</p>
          <div className="stock"><Check size={17} weight="bold" /> В наличии</div>
          <div className="buy-box"><strong>{money.format(product.price)}</strong><div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Уменьшить количество"><Minus size={16} /></button><span>{qty}</span><button onClick={() => setQty(qty + 1)} aria-label="Увеличить количество"><Plus size={16} /></button></div><button className="add-detail" onClick={() => addToCart(product, qty)}><ShoppingCart size={21} weight="bold" /> Добавить в корзину</button></div>
          <div className="detail-benefits"><div><Truck size={24} /><span><b>Доставка по России</b><small>Срок рассчитает менеджер</small></span></div><div><ShieldCheck size={24} /><span><b>Гарантия качества</b><small>Возврат в течение 14 дней</small></span></div></div>
        </section>
      </div>
      <section className="product-description"><div><h2>О товаре</h2><p>{product.description}</p></div><div><h2>Характеристики</h2><dl>{product.specs.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></div></section>
      <section className="related"><div className="section-title-row"><h2>С этим товаром покупают</h2><button onClick={() => navigate("/#catalog")}>Весь каталог <ArrowRight size={18} /></button></div><div className="related-grid">{related.map((item) => <ProductCard key={item.id} product={item} addToCart={addToCart} openProduct={openProduct} />)}</div></section>
    </main>
  );
}

function ContentHub({ type, navigate }) {
  const isBlog = type === "blog";
  const list = articles.filter((item) => item.type === type);
  return (
    <main className="content-hub layout-container">
      <div className="breadcrumbs"><button onClick={() => navigate("/")}>Главная</button><span>/</span><span>{isBlog ? "Блог" : "Новости"}</span></div>
      <header className="hub-heading">
        <span>{isBlog ? <Article size={24} /> : <Newspaper size={24} />}{isBlog ? "Практика и технологии" : "События и обновления"}</span>
        <h1>{isBlog ? "Блог об уходе за автомобилем" : "Новости мира детейлинга"}</h1>
        <p>{isBlog ? "Понятные инструкции, профессиональные приёмы и подбор оборудования для стабильного результата." : "Новые продукты SGCB, события индустрии, обучение и важные обновления компании."}</p>
      </header>
      <div className="article-grid hub-grid">{list.map((item) => <ArticleCard key={item.slug} item={item} navigate={navigate} />)}</div>
    </main>
  );
}

function ArticlePage({ item, navigate, openProduct, addToCart }) {
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([{ name: "Александр", text: "Полезный материал, особенно про безопасную мойку. Спасибо!" }]);
  const [subscribed, setSubscribed] = useState(false);
  const [shared, setShared] = useState(false);
  const linkedProduct = products.find((product) => product.id === item?.productId);

  useEffect(() => {
    if (!item) return undefined;
    const previousTitle = document.title;
    document.title = `${item.title} — SGCB`;
    let description = document.querySelector('meta[name="description"]');
    const createdDescription = !description;
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    const previousDescription = description.content;
    description.content = item.description;
    const schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.dataset.articleSchema = "true";
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": item.type === "news" ? "NewsArticle" : "Article",
      headline: item.title,
      description: item.description,
      image: new URL(item.image, window.location.origin).href,
      datePublished: "2026-09-20",
      author: { "@type": "Organization", name: "SGCB Russia" },
      publisher: { "@type": "Organization", name: "SGCB Russia" },
    });
    document.head.appendChild(schema);
    return () => {
      document.title = previousTitle;
      if (createdDescription) description.remove(); else description.content = previousDescription;
      schema.remove();
    };
  }, [item]);

  if (!item) return <main className="not-found"><h1>Материал не найден</h1><button onClick={() => navigate("/")}><ArrowLeft /> На главную</button></main>;

  async function shareArticle() {
    const data = { title: item.title, text: item.description, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      setShared(false);
    }
  }

  function addComment(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("comment") || "").trim();
    const name = String(form.get("name") || "Гость").trim();
    if (!text) return;
    setComments((current) => [...current, { name, text }]);
    event.currentTarget.reset();
  }

  const related = articles.filter((article) => article.type === item.type && article.slug !== item.slug).slice(0, 2);
  return (
    <main className="article-page">
      <article>
        <header className="article-hero">
          <div className="layout-container">
            <div className="breadcrumbs light"><button onClick={() => navigate("/")}>Главная</button><span>/</span><button onClick={() => navigate(`/${item.type}`)}>{item.type === "blog" ? "Блог" : "Новости"}</button><span>/</span><span>Материал</span></div>
            <span className="article-kind">{item.type === "blog" ? "Практика" : "Новости SGCB"}</span>
            <h1>{item.title}</h1>
            <p>{item.description}</p>
            <div className="article-meta"><span>{item.date}</span><span>{item.readTime} на чтение</span></div>
          </div>
        </header>
        <div className="article-layout layout-container">
          <div className="article-main">
            <figure className="article-cover"><img src={item.image} alt={item.title} /></figure>
            {item.sections.map(([title, text], index) => <section key={title}><h2>{title}</h2><p>{text}</p>{index === 0 && <blockquote>Профессиональный результат начинается с правильного процесса и подходящих инструментов.</blockquote>}</section>)}
            <section className="video-block" aria-label="Видео к статье">
              <div className="video-poster" style={{ backgroundImage: `linear-gradient(rgba(2, 10, 19, .3), rgba(2, 10, 19, .72)), url("${assetUrl("assets/sgcb-tools-banner.jpg")}")` }}><PlayCircle size={62} weight="duotone" /><span>Видеоразбор от технолога SGCB</span><small>Медиаблок готов для публикации видео</small></div>
            </section>
            {linkedProduct && <aside className="article-product"><img src={linkedProduct.image} alt={linkedProduct.name} /><div><span>Товар из статьи</span><h3>{linkedProduct.name}</h3><p>{linkedProduct.description}</p><strong>{money.format(linkedProduct.price)}</strong></div><div><button onClick={() => openProduct(linkedProduct.id)}>Подробнее</button><button className="primary" onClick={() => addToCart(linkedProduct)}><ShoppingCart size={18} /> В корзину</button></div></aside>}
            <div className="article-actions"><button className={liked ? "active" : ""} onClick={() => setLiked(!liked)}><ThumbsUp size={20} weight={liked ? "fill" : "regular"} /> {liked ? "Понравилось" : "Нравится"}</button><button onClick={shareArticle}>{shared ? <Check size={20} /> : <Copy size={20} />}{shared ? "Ссылка скопирована" : "Поделиться"}</button></div>
            <section className="comments"><div className="section-title-row"><h2>Комментарии</h2><span>{comments.length}</span></div>{comments.map((comment, index) => <article key={`${comment.name}-${index}`}><span>{comment.name.slice(0, 1).toUpperCase()}</span><div><b>{comment.name}</b><p>{comment.text}</p></div></article>)}<form onSubmit={addComment}><div><label>Имя<input name="name" maxLength="50" placeholder="Ваше имя" required /></label><label>Комментарий<textarea name="comment" maxLength="500" placeholder="Поделитесь мнением" required /></label></div><button><ChatCircle size={18} /> Отправить</button></form></section>
          </div>
          <aside className="article-sidebar"><div className="subscribe-card"><PaperPlaneTilt size={30} /><h2>Полезное — на почту</h2><p>Новые статьи и инструкции без спама.</p>{subscribed ? <div className="subscribe-success"><Check size={20} /> Вы подписаны</div> : <form onSubmit={(event) => { event.preventDefault(); setSubscribed(true); }}><input type="email" required placeholder="E-mail" aria-label="E-mail для подписки" /><button>Подписаться</button></form>}</div><div className="related-articles"><h2>Похожие материалы</h2>{related.map((article) => <button key={article.slug} onClick={() => navigate(`/${article.type}/${article.slug}`)}><img src={article.image} alt="" /><span><b>{article.title}</b><small>{article.readTime}</small></span></button>)}</div></aside>
        </div>
      </article>
    </main>
  );
}

function InfoPage({ page, navigate }) {
  if (!page) return <main className="not-found"><h1>Страница не найдена</h1><button onClick={() => navigate("/")}><ArrowLeft /> На главную</button></main>;
  return <main className="info-page layout-container"><div className="breadcrumbs"><button onClick={() => navigate("/")}>Главная</button><span>/</span><span>{page.title}</span></div><section><span>SGCB Russia</span><h1>{page.title}</h1><p>{page.text}</p><button onClick={() => navigate("/#contacts")}>Связаться с нами <ArrowRight size={19} /></button></section></main>;
}

function CartDrawer({ cart, setCart, close, beginCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const update = (id, qty) => setCart(cart.map((item) => item.id === id ? { ...item, qty: Math.max(1, qty) } : item));
  return (
    <div className="overlay" onMouseDown={close}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-head"><div><span>Ваш заказ</span><h2 id="cart-title">Корзина</h2></div><button onClick={close} aria-label="Закрыть корзину"><X size={24} /></button></div>
        {cart.length === 0 ? <div className="empty-cart"><ShoppingCart size={56} weight="thin" /><h3>Корзина пока пуста</h3><p>Добавьте товары из каталога</p><button onClick={close}>Перейти к покупкам</button></div> : <>
          <div className="cart-lines">{cart.map((item) => <article className="cart-line" key={item.id}><img src={item.image} alt="" /><div><h3>{item.short}</h3><span>{money.format(item.price)}</span><div className="qty small"><button onClick={() => update(item.id, item.qty - 1)}><Minus /></button><span>{item.qty}</span><button onClick={() => update(item.id, item.qty + 1)}><Plus /></button></div></div><button className="remove" onClick={() => setCart(cart.filter((line) => line.id !== item.id))} aria-label={`Удалить ${item.short}`}><Trash size={18} /></button></article>)}</div>
          <div className="cart-summary"><div><span>Товары</span><span>{money.format(total)}</span></div><div><span>Доставка</span><span>уточнит менеджер</span></div><div className="total"><b>Итого</b><strong>{money.format(total)}</strong></div><button onClick={beginCheckout}>Оформить заказ <ArrowRight size={20} /></button></div>
        </>}
      </aside>
    </div>
  );
}

function CheckoutModal({ cart, close, onSuccess }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  async function submit(event) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          delivery: form.get("delivery"),
          comment: form.get("comment"),
          items: cart.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
          total,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Не удалось отправить заказ");
      setStatus("sent");
      window.setTimeout(onSuccess, 1400);
    } catch (requestError) {
      setStatus("error");
      setError(requestError.message);
    }
  }

  return (
    <div className="overlay checkout-overlay" onMouseDown={close}>
      <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-head"><div><span>Остался один шаг</span><h2 id="checkout-title">Оформление заказа</h2></div><button onClick={close} aria-label="Закрыть"><X size={24} /></button></div>
        {status === "sent" ? <div className="success"><span><Check size={38} weight="bold" /></span><h3>Заявка отправлена</h3><p>Менеджер скоро свяжется с вами.</p></div> : <form onSubmit={submit}>
          <div className="order-summary-mini"><span>{cart.reduce((sum, item) => sum + item.qty, 0)} товара на сумму</span><strong>{money.format(total)}</strong></div>
          <label>Ваше имя<input name="name" autoComplete="name" required maxLength="80" placeholder="Алексей" /></label>
          <label>Телефон<input name="phone" type="tel" autoComplete="tel" required maxLength="32" placeholder="+7 900 000-00-00" /></label>
          <label>Способ получения<select name="delivery" defaultValue="Доставка по России"><option>Доставка по России</option><option>Самовывоз во Владимире</option></select></label>
          <label>Комментарий <span>(необязательно)</span><textarea name="comment" maxLength="600" placeholder="Например, марка и модель автомобиля" /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="submit-order" disabled={status === "sending"}>{status === "sending" ? "Отправляем…" : "Отправить заявку"} <ArrowRight size={20} /></button>
          <p className="consent">Нажимая кнопку, вы соглашаетесь на обработку данных.</p>
        </form>}
      </section>
    </div>
  );
}

export function App() {
  const [path, setPath] = useState(currentAppPath());
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const onPop = () => setPath(currentAppPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!cartOpen && !checkoutOpen) return undefined;
    const onKey = (event) => { if (event.key === "Escape") { setCartOpen(false); setCheckoutOpen(false); } };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKey);
    return () => { document.body.classList.remove("modal-open"); window.removeEventListener("keydown", onKey); };
  }, [cartOpen, checkoutOpen]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const currentProduct = path.startsWith("/product/") ? products.find((item) => item.id === path.split("/").filter(Boolean)[1]) : null;
  const routeParts = path.split("/").filter(Boolean);
  const contentType = ["blog", "news"].includes(routeParts[0]) ? routeParts[0] : null;
  const currentArticle = contentType && routeParts[1] ? articles.find((item) => item.type === contentType && item.slug === routeParts[1]) : null;
  const currentInfo = routeParts[0] === "info" ? infoPages[routeParts[1]] : null;

  function navigate(nextPath) {
    const [pathname, hash] = nextPath.split("#");
    const browserPath = `${siteBase}${pathname}${hash ? `#${hash}` : ""}` || "/";
    if (currentAppPath() !== pathname) window.history.pushState({}, "", browserPath);
    else if (hash) window.history.replaceState({}, "", browserPath);
    setPath(pathname);
    window.setTimeout(() => {
      if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  }

  function addToCart(product, qty = 1) {
    setCart((current) => current.some((item) => item.id === product.id) ? current.map((item) => item.id === product.id ? { ...item, qty: item.qty + qty } : item) : [...current, { ...product, qty }]);
    setToast(`${product.short} — в корзине`);
    window.setTimeout(() => setToast(""), 1800);
  }

  function openProduct(id) { navigate(`/product/${id}`); }
  function finishOrder() { setCheckoutOpen(false); setCart([]); }

  let pageContent;
  if (path.startsWith("/product/")) pageContent = <ProductPage product={currentProduct} addToCart={addToCart} navigate={navigate} openProduct={openProduct} />;
  else if (contentType && routeParts[1]) pageContent = <ArticlePage key={currentArticle?.slug || path} item={currentArticle} addToCart={addToCart} navigate={navigate} openProduct={openProduct} />;
  else if (contentType) pageContent = <ContentHub type={contentType} navigate={navigate} />;
  else if (path.startsWith("/info/")) pageContent = <InfoPage page={currentInfo} navigate={navigate} />;
  else pageContent = <HomePage addToCart={addToCart} openProduct={openProduct} navigate={navigate} />;

  return (
    <div className="page" id="top">
      <div className="site-shell">
        <Header cartCount={cartCount} onCart={() => setCartOpen(true)} onHome={() => navigate("/")} navigate={navigate} />
        {pageContent}
        <Footer navigate={navigate} />
      </div>
      {cartOpen && <CartDrawer cart={cart} setCart={setCart} close={() => setCartOpen(false)} beginCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />}
      {checkoutOpen && <CheckoutModal cart={cart} close={() => setCheckoutOpen(false)} onSuccess={finishOrder} />}
      {toast && <div className="toast"><Check size={18} weight="bold" /> {toast}</div>}
    </div>
  );
}
