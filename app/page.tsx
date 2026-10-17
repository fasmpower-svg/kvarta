import LeadForm from "./components/LeadForm";
import OrderButton from "./components/OrderButton";

const products = [
  {
    img: "/img/p-ethiopia.jpg",
    alt: "Пуровер V60",
    name: "Эфиопия Иргачеффе",
    note: "цветочный, бергамот · светлая обжарка",
    price: "32 BYN",
    order: "Эфиопия Иргачеффе, 250 г",
    h: 875,
  },
  {
    img: "/img/p-colombia.jpg",
    alt: "Зёрна кофе крупным планом",
    name: "Колумбия Уила",
    note: "карамель, красное яблоко",
    price: "29 BYN",
    order: "Колумбия Уила, 250 г",
    h: 467,
  },
  {
    img: "/img/p-brazil.jpg",
    alt: "Эспрессо",
    name: "Бразилия Серрадо",
    note: "орех, шоколад · под эспрессо",
    price: "26 BYN",
    order: "Бразилия Серрадо, 250 г",
    h: 409,
  },
  {
    img: "/img/p-drip.jpg",
    alt: "Дрип-пакеты",
    name: "Дрип-пакеты",
    note: "ассорти · 10 штук",
    price: "18 BYN",
    order: "Дрип-пакеты, ассорти (10 шт)",
    h: 1050,
  },
];

export default function Home() {
  return (
    <>
      <link rel="preload" as="image" href="/img/hero.jpg" fetchPriority="high" />
      <header className="site">
        <div className="wrap top">
          <div className="word">Кварта</div>
          <nav>
            <a href="#assortment">Ассортимент</a>
            <a href="#sub">Подписка</a>
            <a href="#delivery">Доставка</a>
            <a href="#contact">Заявка</a>
          </nav>
        </div>
      </header>

      <main>
      <div className="wrap">
        <div className="hero">
          <div>
            <h1>
              Кофе на <em>1–3 день</em> после обжарки
            </h1>
            <p>
              Небольшая мастерская на Короля, 9. Обжариваем свежую партию каждый
              четверг и развозим по Минску по пятницам — без склада и лишнего
              времени в мешке.
            </p>
            <a className="btn" href="#contact">
              Оставить заявку
            </a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="heroimg"
            src="/img/hero.jpg"
            alt="Обжарка зерна в барабане"
            width={1200}
            height={800}
            fetchPriority="high"
          />
        </div>

        <div className="facts">
          <div className="fact">
            <div className="k">20 пачек</div>
            <div className="v">столько выходит из одной обжарки — 5 кг зерна</div>
          </div>
          <div className="fact">
            <div className="k">2019</div>
            <div className="v">год, с которого мы обжариваем</div>
          </div>
          <div className="fact">
            <div className="k">1–3 дня</div>
            <div className="v">от обжарки до вашей кухни</div>
          </div>
        </div>
      </div>

      <section id="about" className="alt">
        <div className="wrap about">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/who.jpg" alt="Аня и Дмитрий в мастерской" width={1000} height={666} loading="lazy" />
          <div>
            <h2>Аня и Дмитрий, обжариваем с 2019</h2>
            <p>
              Начали с одной барабанной машины и мешка зелёного зерна. Оба
              работали в кофейнях, поэтому знаем, как обидно открывать пачку,
              которая пролежала на складе полгода.
            </p>
            <p>
              Обжариваем маленькими партиями по 5 кг: ровно столько, чтобы
              развезти свежим.
            </p>
            <p>
              Поэтому на пачке — дата обжарки, а не абстрактный срок годности.
            </p>
          </div>
        </div>
      </section>

      <section id="assortment">
        <div className="wrap">
          <div className="sec-head">
            <h2>Зерно этой недели</h2>
            <p>Обновляем по четвергам, цена за 250 г. Не нашли своё — напишите, подберём.</p>
          </div>
          <div className="products">
            {products.map((p) => (
              <div className="p" key={p.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="thumbImg"
                  src={p.img}
                  alt={p.alt}
                  width={700}
                  height={p.h}
                  loading="lazy"
                />
                <h3>{p.name}</h3>
                <div className="note">{p.note}</div>
                <div className="row">
                  <span className="price">{p.price}</span>
                  <OrderButton className="add" interest="one-time" order={p.order}>
                    заказать →
                  </OrderButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sub" className="alt">
        <div className="wrap">
          <div className="subcard">
            <div className="lft">
              <h2>Две пачки раз в месяц</h2>
              <ul>
                <li>Состав собираем под ваш вкус</li>
                <li>Каждый месяц — другое зерно</li>
                <li>Доставка по Минску бесплатно</li>
                <li>Пропустить или отменить — в один клик</li>
              </ul>
            </div>
            <div className="rgt">
              <div className="price">54 BYN</div>
              <div className="per">в месяц · 2 × 250 г</div>
              <OrderButton className="btn2" interest="subscription">
                Оформить подписку
              </OrderButton>
            </div>
          </div>
        </div>
      </section>

      <section id="delivery">
        <div className="wrap">
          <div className="two">
            <div className="panel">
              <h3>Самовывоз</h3>
              <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>Минск, ул. Короля, 9</p>
              <div className="big">
                Пн–пт 8:00–20:00
                <br />
                Сб–вс 10:00–18:00
              </div>
            </div>
            <div className="panel">
              <h3>Доставка по Минску</h3>
              <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>Развозим по пятницам</p>
              <div className="big">От 50 BYN — бесплатно, ниже — 5 BYN</div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="alt">
        <div className="wrap">
          <div className="contact">
            <div>
              <h2 style={{ fontSize: "clamp(28px,4vw,40px)", margin: "0 0 12px" }}>
                Оставьте номер — перезвоним
              </h2>
              <p style={{ color: "var(--muted)" }}>
                Оформим разовый заказ или подписку. Работаем в рабочие часы.
              </p>
              <div className="clist" style={{ marginTop: "24px" }}>
                <div className="row">
                  <span>Телефон</span>
                  <span>+375 (29) 000-00-00</span>
                </div>
                <div className="row">
                  <span>Адрес</span>
                  <span>ул. Короля, 9</span>
                </div>
                <div className="row">
                  <span>Instagram</span>
                  <span>@kvarta.coffee</span>
                </div>
              </div>
            </div>
            <LeadForm />
          </div>
        </div>
      </section>
      </main>

      <footer className="site">
        <div className="wrap top" style={{ height: "auto" }}>
          <div className="word" style={{ fontSize: "16px" }}>
            Кварта
          </div>
          <div>Минск · с 2019 · обжариваем по четвергам</div>
        </div>
      </footer>
    </>
  );
}
