import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAiWidget } from "@/components/ai/AiAssistantWidget";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { apiClient } from "@/services/api/client";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
};

const valueCards = [
  {
    icon: ShieldCheck,
    title: "Профессиональный ассортимент",
    text: "Только понятные формулы и сильные позиции, которые уместно рекомендовать клиенту.",
  },
  {
    icon: Stethoscope,
    title: "Экспертная консультация",
    text: "Подбор ухода встроен в опыт покупки и не выглядит отдельным демонстрационным модулем.",
  },
  {
    icon: Truck,
    title: "Деликатный сервис",
    text: "Упаковка, доставка и сопровождение собраны в спокойный premium-сценарий без визуального шума.",
  },
];

const editorialImages = {
  heroPrimary:
    "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=1200&q=80",
  heroSecondary:
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80",
  heroDetail:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
  b2b:
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
};

export default function Home() {
  const { openWidget } = useAiWidget();

  const { data: featured = [] } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => apiClient.entities.Product.filter({ featured: true }, "-created_date", 4),
    initialData: [],
  });
  const { data: newArrivals = [] } = useQuery({
    queryKey: ["new-products"],
    queryFn: () => apiClient.entities.Product.filter({ new_arrival: true }, "-created_date", 4),
    initialData: [],
  });
  const { data: bestsellers = [] } = useQuery({
    queryKey: ["bestsellers"],
    queryFn: () => apiClient.entities.Product.filter({ bestseller: true }, "-created_date", 4),
    initialData: [],
  });

  const featuredShelf = featured.length > 0 ? featured : newArrivals.slice(0, 4);
  const bestsellerShelf = bestsellers.length > 0 ? bestsellers : featured.slice(0, 4);

  return (
    <div className="overflow-x-hidden">
      <section className="relative isolate overflow-hidden border-b border-[#EEE2D6] bg-[#FBF7F1] pb-16 pt-10 lg:pb-20">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="hero-marble-backdrop absolute right-[-8%] top-10 h-[82%] w-[64%] rounded-[3rem] blur-[0.3px]" />
          <div className="absolute left-[-80px] top-24 h-72 w-72 rounded-full bg-[#F3E3D7]/55 blur-[95px]" />
          <div className="absolute right-[-30px] top-14 h-72 w-72 rounded-full bg-[#EEE1CA]/55 blur-[100px]" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl gap-12 px-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-12">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="z-10 flex flex-col justify-center pt-14"
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/85 bg-white/78 px-4 py-2 shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C8A36E]" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                профессиональный уход • брендовая витрина
              </span>
            </div>

            <h1 className="mt-7 max-w-3xl font-serif text-[3rem] font-medium leading-[0.94] text-stone md:text-[4.15rem] lg:text-[4.7rem]">
              Профессиональный уход
              <br />
              <span className="gold-shimmer">с деликатной подачей</span>
              <br />
              настоящего бренда
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-8 text-stone/78">
              YUVEMA объединяет каталог, консультацию и B2B-сервис в спокойный и эстетичный
              продуктовый опыт, которому хочется доверять и в который хочется возвращаться.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="px-7 text-[11px] uppercase tracking-[0.18em]">
                <Link to="/catalog">
                  Перейти в каталог
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="px-7 text-[11px] uppercase tracking-[0.18em]"
                onClick={() => openWidget({ mode: "consultation", reset: true })}
              >
                Нужна консультация
              </Button>
            </div>

            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                { title: "Караганда", text: siteConfig.location },
                { title: "Подбор в чате", text: "Консультация, продажа и персональный уход" },
                { title: "B2B", text: "Для клиник, специалистов и партнёров бренда" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.45rem] border border-white/80 bg-white/84 px-5 py-4 shadow-soft"
                >
                  <p className="font-serif text-[1.45rem] leading-none text-stone">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-stone/72">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#EDE1D4] bg-white/88 p-3 shadow-soft-lg lg:hidden">
              <div className="hero-marble-card overflow-hidden rounded-[1.6rem] p-3">
                <img
                  src={editorialImages.heroPrimary}
                  alt="Премиальная уходовая косметика YUVEMA"
                  className="h-[420px] w-full rounded-[1.35rem] object-cover"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.95, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <div className="hero-marble-card relative mx-auto max-w-[660px] rounded-[2.8rem] border border-white/80 p-5 shadow-soft-xl">
              <div className="grid gap-4 lg:grid-cols-[0.72fr_1.02fr]">
                <div className="flex flex-col gap-4">
                  <div className="overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/88 p-3 shadow-soft-md">
                    <img
                      src={editorialImages.heroSecondary}
                      alt="Уходовая косметика на светлом мраморе"
                      className="h-[278px] w-full rounded-[1.45rem] object-cover"
                    />
                    <div className="px-2 pb-2 pt-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        Эстетика ухода
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-stone/78">
                        Светлая композиция, чистый продукт и никакого тёмного тяжёлого пятна в первом экране.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.9rem] border border-white/80 bg-white/88 p-5 shadow-soft-md">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      Почерк бренда
                    </p>
                    <p className="mt-4 font-serif text-[1.95rem] leading-[1.02] text-stone">
                      Мрамор, мягкий свет, продукт и чёткая premium-композиция без визуального шума.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[2.2rem] border border-white/85 bg-white/88 p-3 shadow-soft-lg">
                    <div className="hero-marble-stage rounded-[1.85rem] p-3">
                      <img
                        src={editorialImages.heroPrimary}
                        alt="Профессиональная косметика YUVEMA"
                        className="h-[498px] w-full rounded-[1.55rem] object-cover"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-[0.92fr_1.08fr] gap-4">
                    <div className="overflow-hidden rounded-[1.7rem] border border-white/80 bg-white/88 p-3 shadow-soft-md">
                      <img
                        src={editorialImages.heroDetail}
                        alt="Сыворотка YUVEMA в editorial-композиции"
                        className="h-[178px] w-full rounded-[1.3rem] object-cover"
                      />
                    </div>

                    <div className="rounded-[1.7rem] border border-white/80 bg-white/88 p-5 shadow-soft-md">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {siteConfig.city}
                      </div>
                      <p className="mt-4 font-serif text-[1.65rem] leading-[1.04] text-stone">
                        Консультация встроена в сайт и помогает довести клиента до уверенного выбора.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-[#EEE2D6] bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-4 md:grid-cols-3">
            {valueCards.map(({ icon: Icon, title, text }, index) => (
              <motion.article
                key={title}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.06 }}
                className="premium-card p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF0E3] shadow-soft">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="font-serif text-[1.55rem] leading-[1.04] text-stone">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {featuredShelf.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <motion.div
              {...reveal}
              className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] text-primary">
                  Выбор YUVEMA
                </p>
                <h2 className="mt-3 font-serif text-[2.7rem] leading-none text-stone md:text-[3.25rem]">
                  Избранный уход YUVEMA
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Средства, с которых удобно начать знакомство с брендом и собрать аккуратную
                  повседневную рутину.
                </p>
              </div>

              <Button asChild variant="outline" className="w-fit px-6 text-[11px] uppercase tracking-[0.18em]">
                <Link to="/catalog">
                  Весь каталог
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4">
              {featuredShelf.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-y border-[#EEE2D6] bg-[#FBF7F1] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <motion.div
              {...reveal}
              className="overflow-hidden rounded-[2.2rem] border border-[#EEE2D6] bg-white p-4 shadow-soft-xl"
            >
              <div className="hero-arch h-full min-h-[500px] overflow-hidden rounded-[1.9rem]">
                <img
                  src={editorialImages.b2b}
                  alt="Премиальный уход и B2B-сервис YUVEMA"
                  className="h-full w-full object-cover"
                />
              </div>
            </motion.div>

            <motion.div {...reveal} className="premium-panel flex flex-col justify-center px-8 py-10 md:px-10">
              <p className="text-[10px] uppercase tracking-[0.26em] text-primary">
                B2B и экспертный сервис
              </p>
              <h2 className="mt-4 font-serif text-[2.7rem] leading-[0.98] text-stone md:text-[3.2rem]">
                Для клиник, специалистов и партнёров с высокими ожиданиями к сервису
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                YUVEMA подходит не только для прямой продажи клиенту, но и как аккуратная
                платформа для B2B-заявок, партнёрской работы и профессионального заказа.
              </p>

              <div className="section-divider my-7" />

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  "Цены и условия для B2B-клиентов",
                  "Сопровождение по ассортименту и заявкам",
                  "Единый путь от консультации до заказа",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.35rem] border border-[#EEE2D6] bg-white px-4 py-4 text-sm leading-relaxed text-stone/75 shadow-soft"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="outline" className="px-7 text-[11px] uppercase tracking-[0.18em]">
                  <Link to="/b2b">
                    Стать партнёром
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-5 text-[11px] uppercase tracking-[0.18em]"
                  onClick={() => openWidget({ mode: "sales", reset: true })}
                >
                  Обсудить ассортимент
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {bestsellerShelf.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <motion.div {...reveal} className="mb-12">
              <p className="text-[10px] uppercase tracking-[0.26em] text-primary">Лидеры каталога</p>
              <h2 className="mt-3 font-serif text-[2.7rem] leading-none text-stone md:text-[3.2rem]">
                Лидеры спроса
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4">
              {bestsellerShelf.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
