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
    title: "Качество",
    text: "Мы отбираем уход по силе формул, качеству составов и реальной способности решать задачи кожи.",
  },
  {
    icon: Award,
    title: "Экспертиза",
    text: "Каждый продукт в YUVEMA должен быть понятен по роли, результату и месту в рабочем маршруте ухода.",
  },
  {
    icon: Users,
    title: "Результат",
    text: "Мы строим ассортимент и сервис так, чтобы человек видел не обещание, а понятный путь к улучшению состояния кожи.",
  },
  {
    icon: Globe,
    title: "Доступ",
    text: "Профессиональная косметика, экспертная консультация и технологичный подбор должны быть доступны не только в кабинете специалиста.",
  },
];

export default function About() {
  return (
    <div>
      <PageHero
        eyebrow="О бренде"
        title="YUVEMA — профессиональный уход с акцентом на качество, экспертность и видимый результат"
        description="Мы строим бренд, в котором сильные формулы, понятный выбор и спокойная эстетика работают вместе и помогают решать реальные задачи кожи."
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
              Профессиональный уход должен быть точным, понятным и достойным доверия
            </h2>
            <p className="mt-5 text-sm leading-8 text-muted-foreground">
              Для YUVEMA уход начинается не с красивого обещания, а с качества формулы, экспертной
              логики подбора и реального результата для кожи. Поэтому мы убираем шум, усиливаем
              ясность выбора и выстраиваем сервис вокруг профессионального подхода.
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
              Помогать людям решать задачи кожи через профессиональную косметику, экспертность и технологии
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-muted-foreground">
              Мы хотим дать человеку доступ к профессиональному уходу без сложного входа: через
              сильный каталог, понятную консультацию, AI-подбор и сервис, который помогает выбрать
              средство не случайно, а по реальной задаче кожи.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
