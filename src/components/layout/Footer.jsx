import React from "react";
import { Instagram, Mail, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAiWidget } from "@/components/ai/AiAssistantWidget";
import BrandMark from "@/components/branding/BrandMark";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export default function Footer() {
  const { openWidget } = useAiWidget();

  const contactItems = [
    { Icon: MapPin, text: siteConfig.location },
    { Icon: Mail, text: siteConfig.email },
  ];

  return (
    <footer className="border-t border-[#EEE2D6] bg-[#FBF7F1]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="premium-panel px-7 py-7">
            <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
              Почерк YUVEMA
            </p>
            <h2 className="mt-4 max-w-xl font-serif text-[2.1rem] leading-[1.02] text-stone">
              Профессиональный уход, где качество формулы и результат важнее громких обещаний.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Каталог, консультация и B2B-сервис собраны в одной системе, которая помогает выбрать
              уход осознанно и без визуального шума.
            </p>
          </div>

          <div className="premium-panel px-7 py-7">
            <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
              Помощь с выбором
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Консультация встроена прямо в сайт. Если нужно подобрать уход, объяснить разницу
              между средствами или собрать корзину, откройте чат.
            </p>
            <Button
              onClick={() => openWidget({ mode: "consultation" })}
              className="mt-6 text-[11px] uppercase tracking-[0.18em]"
            >
              <Sparkles className="h-4 w-4" />
              Открыть консультацию
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-14">
          <div>
            <BrandMark />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Профессиональная косметика и экспертный сервис для клиентов, косметологов и клиник,
              которым важны точный выбор и реальный результат.
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Навигация
            </h4>
            <div className="flex flex-col gap-3">
              {[
                ["/catalog", "Каталог"],
                ["/about", "О бренде"],
                ["/b2b", "B2B"],
                ["/blog", "Блог"],
                ["/contacts", "Контакты"],
              ].map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="text-sm text-muted-foreground transition-colors hover:text-stone"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Контакты
            </h4>
            <div className="space-y-4">
              {contactItems.map(({ Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-soft">
                    <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="pt-1 text-sm text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Соцсети
            </h4>
            <a
              href={siteConfig.instagram}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft transition-shadow group-hover:shadow-soft-md">
                <Instagram className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <span className="text-sm text-muted-foreground transition-colors group-hover:text-stone">
                {siteConfig.instagramHandle}
              </span>
            </a>

            <a
              href={siteConfig.twoGisLink}
              target="_blank"
              rel="noreferrer"
              className="mt-6 block rounded-[1.35rem] border border-[#EEE2D6] bg-white px-5 py-4 text-sm text-muted-foreground shadow-soft transition-colors hover:bg-[#FFF9F1]"
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#8B7156]">Карта 2GIS</p>
              <p className="mt-2 text-stone">Открыть точку YUVEMA на карте</p>
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#EEE2D6] pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">© 2026 YUVEMA. Все права защищены.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span className="transition-colors hover:text-stone">Политика конфиденциальности</span>
            <span className="transition-colors hover:text-stone">Публичная оферта</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
