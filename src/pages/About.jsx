import React from "react";
import { motion } from "framer-motion";
import { Award, Globe, Shield, Users } from "lucide-react";
import PageHero from "@/components/layout/PageHero";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
};

const values = [
  {
    icon: Shield,
    title: "Подлинность",
    text: "Работаем только с оригинальной продукцией и выстраиваем доверие не обещаниями, а прозрачностью.",
  },
  {
    icon: Award,
    title: "Экспертиза",
    text: "Подбираем уход как сервис бренда: спокойно, аргументированно и без лишнего давления на покупку.",
  },
  {
    icon: Users,
    title: "Партнёрство",
    text: "Поддерживаем не только клиента, но и клиники, косметологов и специалистов, которым нужен внятный B2B-контур.",
  },
  {
    icon: Globe,
    title: "Мировые бренды",
    text: "Собираем ассортимент с акцентом на качество, эффективность формул и эстетичную подачу ухода.",
  },
];

export default function About() {
  return (
    <div>
      <PageHero
        eyebrow="О бренде"
        title="YUVEMA — уход, который выглядит спокойно, дорого и профессионально"
        description="Мы строим не просто каталог косметики, а аккуратную бренд-среду, в которой клиенту легко доверять ассортименту, сервису и рекомендации."
      />

      <section className="page-section py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { value: "12+", label: "брендов в развитии" },
              { value: "200+", label: "средств в каталоге" },
              { value: "3", label: "сценария AI-консультации" },
              { value: "B2B", label: "для клиник и специалистов" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.06 }}
                className="premium-card p-6 text-center"
              >
                <p className="font-serif text-[2.2rem] leading-none text-stone">{stat.value}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
          <motion.div {...reveal} className="premium-panel px-7 py-8 md:px-9">
            <p className="text-[10px] uppercase tracking-[0.26em] text-primary">Философия бренда</p>
            <h2 className="section-heading mt-4">
              Не шумный люкс, а чистая эстетика и грамотный уход
            </h2>
            <p className="mt-5 text-sm leading-8 text-muted-foreground">
              Для YUVEMA важно, чтобы каждая точка касания выглядела собранно: от карточки товара
              до консультации, от B2B-заявки до финального заказа. Поэтому мы делаем акцент на
              ясной структуре, спокойной визуальной подаче и понятном выборе.
            </p>
          </motion.div>

          <motion.div {...reveal} className="grid gap-4 md:grid-cols-2">
            {values.map(({ icon: Icon, title, text }, index) => (
              <motion.article
                key={title}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.05 }}
                className="premium-card p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF0E3] shadow-soft">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-[1.5rem] leading-[1.04] text-stone">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-[#FBF7F1] py-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-12">
          <motion.div {...reveal} className="premium-panel px-7 py-10 text-center md:px-10">
            <p className="text-[10px] uppercase tracking-[0.26em] text-primary">Миссия</p>
            <h2 className="section-heading mt-4">
              Сделать профессиональный уход понятным, эстетичным и доступным для реальной покупки
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-muted-foreground">
              Мы хотим, чтобы человек видел не хаотичный набор банок, а внятную систему ухода:
              с объяснением, экспертной логикой и ощущением, что он пришёл в сильный современный
              бренд, а не в безликий маркетплейс.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
