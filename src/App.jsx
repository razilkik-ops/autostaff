import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  Check,
  Clock,
  CreditCard,
  Diamond,
  EnvelopeSimple,
  Gauge,
  Headset,
  Heart,
  MagnifyingGlass,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Trash,
  Truck,
  Wrench,
  X,
} from "@phosphor-icons/react";

const siteBase = import.meta.env.BASE_URL.replace(/\/$/, "");
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const currentAppPath = () => {
  const pathname = window.location.pathname;
  if (siteBase && pathname.startsWith(siteBase)) return pathname.slice(siteBase.length) || "/";
  return pathname;
};

const money = { format: (value) => `${Number(value).toFixed(2)} BYN` };

const products = [
  {
    id: "drying-towel",
    brand: "DetailCore",
    name: "Сушащее полотенце G1500",
    short: "Полотенце G1500",
    price: 69,
    image: assetUrl("assets/drying-towel.png"),
    category: "Автокосметика",
    reviews: 124,
    sku: "DL-1500-GR",
    description: "Двустороннее микрофибровое полотенце быстро впитывает воду и не оставляет разводов на кузове.",
    specs: [["Размер", "60 × 90 см"], ["Плотность", "1500 г/м²"], ["Материал", "Микрофибра"], ["Цвет", "Графит"]],
  },
  {
    id: "detailing-bucket",
    brand: "DetailCore",
    name: "Ведро для мойки Detailing Lab 20L",
    short: "Ведро Detailing Lab 20L",
    price: 49,
    image: assetUrl("assets/detailing-bucket.png"),
    category: "Автокосметика",
    reviews: 98,
    sku: "DL-BKT-20",
    description: "Прочное ведро с герметичной крышкой для безопасной и удобной ручной мойки автомобиля.",
    specs: [["Объём", "20 л"], ["Материал", "HDPE-пластик"], ["Крышка", "Герметичная"], ["Цвет", "Синий"]],
  },
  {
    id: "wash-mitt",
    brand: "DetailCore",
    name: "Варежка для мойки Carp Gliles Shine",
    short: "Варежка Carp Gliles Shine",
    price: 32,
    image: assetUrl("assets/wash-mitt.png"),
    category: "Автокосметика",
    reviews: 76,
    sku: "DL-MITT-BL",
    description: "Мягкая варежка из шенилловой микрофибры бережно снимает загрязнения и сохраняет лакокрасочное покрытие.",
    specs: [["Материал", "Микрофибра"], ["Тип ворса", "Шенилл"], ["Размер", "24 × 18 см"], ["Цвет", "Синий"]],
  },
  {
    id: "brake-disc",
    brand: "RoadPro",
    name: "Тормозной диск Brembo Sport",
    short: "Тормозной диск Sport",
    price: 289,
    image: assetUrl("assets/brake-disc.png"),
    category: "Тормозная система",
    reviews: 54,
    sku: "RP-BRK-284",
    description: "Вентилируемый тормозной диск со спортивным суппортом для уверенного торможения в городе и на трассе.",
    specs: [["Диаметр", "284 мм"], ["Тип", "Вентилируемый"], ["Материал", "Чугун"], ["Ось", "Передняя"]],
  },
  {
    id: "led-bulb",
    brand: "LumaTech",
    name: "Светодиодные лампы X-tremeVision H7",
    short: "Лампы X-tremeVision H7",
    price: 129,
    image: assetUrl("assets/led-bulb.png"),
    category: "Автосвет",
    reviews: 112,
    sku: "LT-LED-H7",
    description: "Яркие LED-лампы с точной светотеневой границей и эффективным охлаждением для хорошей видимости ночью.",
    specs: [["Цоколь", "H7"], ["Температура", "6000 K"], ["Мощность", "35 Вт"], ["Комплект", "2 шт."]],
  },
  {
    id: "battery",
    brand: "VoltCore",
    name: "Аккумулятор Blue Dynamic 60Ah",
    short: "Аккумулятор Blue Dynamic",
    price: 259,
    image: assetUrl("assets/battery.png"),
    category: "Аккумуляторы",
    reviews: 93,
    sku: "VC-B60-EU",
    description: "Надёжный аккумулятор с увеличенным пусковым током для стабильного запуска двигателя в любую погоду.",
    specs: [["Емкость", "60 А·ч"], ["Пусковой ток", "540 A"], ["Полярность", "Обратная"], ["Гарантия", "24 месяца"]],
  },
];

const categories = [
  { title: "Тормозная система", image: assetUrl("assets/brake-disc.png") },
  { title: "Фильтры", image: assetUrl("assets/oil-filter.png") },
  { title: "Подвеска", image: assetUrl("assets/suspension.png") },
  { title: "Автокосметика", image: assetUrl("assets/detailing-bucket.png") },
  { title: "Автосвет", image: assetUrl("assets/led-bulb.png") },
  { title: "Аккумуляторы", image: assetUrl("assets/battery.png") },
];

const benefits = [
  { icon: Truck, text: "Быстрая доставка по Беларуси" },
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
  { icon: MagnifyingGlass, n: "01", title: "Выбираете товары", text: "Находите нужные запчасти и аксессуары" },
  { icon: ShoppingCart, n: "02", title: "Оформляете заказ", text: "Добавляете товары в корзину" },
  { icon: CreditCard, n: "03", title: "Подтверждаете", text: "Указываете данные для связи" },
  { icon: Package, n: "04", title: "Получаете заказ", text: "Доставим по Беларуси или подготовим самовывоз" },
];

function Brand({ onHome }) {
  return (
    <button className="brand" onClick={onHome} aria-label="DriveLab — на главную">
      <span className="brand-mark"><Gauge size={34} weight="fill" /></span>
      <span><b>Drive<span>Lab</span></b><small>АВТОТОВАРЫ И ЗАПЧАСТИ</small></span>
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
          <button className="location"><MapPin size={14} weight="fill" /> Минск <CaretDown size={11} /></button>
        </div>
      </div>
      <header className="header">
        <div className="layout-container header-inner">
          <Brand onHome={onHome} />
          <nav aria-label="Основная навигация">
            <button onClick={() => navigate("/#catalog")}>Каталог <CaretDown size={12} /></button>
            <button onClick={() => navigate("/#categories")}>Категории <CaretDown size={12} /></button>
            <button onClick={() => navigate("/#how")}>Как купить</button>
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

function Footer({ navigate }) {
  return (
    <footer id="contacts">
      <div className="footer-main">
        <div className="layout-container footer-main-inner">
          <div className="footer-brand"><Brand onHome={() => navigate("/")} /><p>Надёжные автотовары и запчасти для вашего автомобиля. Качество. Сервис. Движение вперёд.</p></div>
          <div><h3>Каталог</h3><button onClick={() => navigate("/#catalog")}>Запчасти</button><button onClick={() => navigate("/#catalog")}>Автокосметика</button><button onClick={() => navigate("/#catalog")}>Инструменты</button><button onClick={() => navigate("/#catalog")}>Аксессуары</button></div>
          <div><h3>Покупателю</h3><button>Доставка и оплата</button><button>Возврат и обмен</button><button>Вопросы</button><button onClick={() => navigate("/#contacts")}>Контакты</button></div>
          <div className="contacts"><h3>Контакты</h3><p><Phone size={16} /> +375 29 123-45-67</p><p><EnvelopeSimple size={16} /> info@drivelab.by</p><p><MapPin size={16} /> г. Минск, ул. Примерная, 1</p><p><Clock size={16} /> Пн–Пт: 9:00–18:00</p></div>
        </div>
      </div>
      <div className="footer-bottom"><div className="layout-container footer-bottom-inner"><span>© 2026 DriveLab. Все права защищены.</span><span>Политика конфиденциальности</span></div></div>
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
            <p className="eyebrow">Автотовары для тех, кто движется вперёд</p>
            <h1 id="hero-title">ЗАБОТА<br />О ВАШЕМ<br /><span>АВТОМОБИЛЕ</span></h1>
            <p className="hero-lead">Качественные автотовары, запчасти<br />и аксессуары от надёжных производителей</p>
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

        <section className="promo" style={{ backgroundImage: `url("${assetUrl("assets/promo-detailing.png")}")` }}>
          <div><span>ПРОФЕССИОНАЛЬНАЯ</span><h2>АВТОКОСМЕТИКА</h2><p>Безупречный результат в каждой детали</p></div>
          <span className="promo-visual" aria-hidden="true" />
          <ul><li><Diamond size={23} /> Профессиональное качество</li><li><ShieldCheck size={23} /> Проверенные составы</li><li><Truck size={23} /> Для истинных автолюбителей</li></ul>
        </section>
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
          <div className="detail-benefits"><div><Truck size={24} /><span><b>Доставка по Беларуси</b><small>1–3 рабочих дня</small></span></div><div><ShieldCheck size={24} /><span><b>Гарантия качества</b><small>Возврат в течение 14 дней</small></span></div></div>
        </section>
      </div>
      <section className="product-description"><div><h2>О товаре</h2><p>{product.description}</p></div><div><h2>Характеристики</h2><dl>{product.specs.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></div></section>
      <section className="related"><div className="section-title-row"><h2>С этим товаром покупают</h2><button onClick={() => navigate("/#catalog")}>Весь каталог <ArrowRight size={18} /></button></div><div className="related-grid">{related.map((item) => <ProductCard key={item.id} product={item} addToCart={addToCart} openProduct={openProduct} />)}</div></section>
    </main>
  );
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
          <label>Телефон<input name="phone" type="tel" autoComplete="tel" required maxLength="32" placeholder="+375 29 000-00-00" /></label>
          <label>Способ получения<select name="delivery" defaultValue="Доставка по Беларуси"><option>Доставка по Беларуси</option><option>Самовывоз в Минске</option></select></label>
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

  return (
    <div className="page" id="top">
      <div className="site-shell">
        <Header cartCount={cartCount} onCart={() => setCartOpen(true)} onHome={() => navigate("/")} navigate={navigate} />
        {path.startsWith("/product/") ? <ProductPage product={currentProduct} addToCart={addToCart} navigate={navigate} openProduct={openProduct} /> : <HomePage addToCart={addToCart} openProduct={openProduct} navigate={navigate} />}
        <Footer navigate={navigate} />
      </div>
      {cartOpen && <CartDrawer cart={cart} setCart={setCart} close={() => setCartOpen(false)} beginCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />}
      {checkoutOpen && <CheckoutModal cart={cart} close={() => setCheckoutOpen(false)} onSuccess={finishOrder} />}
      {toast && <div className="toast"><Check size={18} weight="bold" /> {toast}</div>}
    </div>
  );
}
