import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Award, Check, Lock, Truck, Users } from "lucide-react";
import { toast } from "sonner";
import PageHero from "@/components/layout/PageHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/services/api/client";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
};

export default function B2B() {
  const queryClient = useQueryClient();
  const { user, isB2BClient } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company: user?.company_name || "",
    bin: user?.company_bin || "",
    name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.city || "",
    message: "",
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["b2b-applications", user?.email],
    queryFn: () => apiClient.entities.B2BApplication.filter({ email: user.email }, "-created_date", 5),
    enabled: Boolean(user?.email),
    initialData: [],
  });

  const latestApplication = useMemo(() => applications[0] || null, [applications]);

  const handleApply = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await apiClient.entities.B2BApplication.create({
        company: form.company,
        bin: form.bin,
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        message: form.message,
        status: "pending",
      });

      queryClient.invalidateQueries({ queryKey: ["b2b-applications"] });
      toast.success("Заявка отправлена. Мы свяжемся с вами после проверки.");
      setForm((current) => ({ ...current, message: "" }));
    } catch (error) {
      toast.error(error.message || "Не удалось отправить заявку");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHero
        eyebrow="B2B"
        title="Партнёрский контур YUVEMA для клиник, косметологов и сильной розницы"
        description="Оптовые условия, сопровождение по ассортименту и понятный маршрут от заявки до профессионального заказа."
      />

      <section className="page-section py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Award,
                title: "Оптовые условия",
                text: "Прайсы и логика работы для партнёров, которым нужен не просто доступ, а управляемый сервис.",
              },
              {
                icon: Users,
                title: "Сопровождение",
                text: "Помощь по ассортименту, консультации для команды и понятная коммуникация по заявкам.",
              },
              {
                icon: Truck,
                title: "Оперативность",
                text: "Быстрая обработка заказов и аккуратный сценарий поставки по Казахстану.",
              },
            ].map(({ icon: Icon, title, text }, index) => (
              <motion.article
                key={title}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.06 }}
                className="premium-card p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF0E3] shadow-soft">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="font-serif text-[1.5rem] leading-[1.04] text-stone">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {isB2BClient ? (
        <section className="bg-[#FBF7F1] py-20">
          <div className="mx-auto max-w-5xl px-6 lg:px-12">
            <motion.div {...reveal} className="premium-panel px-8 py-12 text-center md:px-10">
              <Check className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="section-heading mt-5">Доступ к B2B-условиям уже активирован</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-muted-foreground">
                Ваш профиль подтверждён. В каталоге и карточках товаров отображаются B2B-цены, а
                заказы можно оформлять как профессиональный клиент.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Badge variant="outline">Оптовый доступ активен</Badge>
                {latestApplication?.status && <Badge>{latestApplication.status}</Badge>}
              </div>
              <Button className="mt-8 px-8" asChild>
                <a href="/catalog">
                  Перейти в каталог
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </motion.div>
          </div>
        </section>
      ) : (
        <section className="bg-[#FBF7F1] py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <motion.div {...reveal} className="premium-panel px-7 py-8">
                <Lock className="h-9 w-9 text-primary" />
                <h2 className="section-heading mt-5">Подать B2B-заявку</h2>
                <p className="mt-4 text-sm leading-8 text-muted-foreground">
                  После проверки заявки мы откроем профессиональный доступ для вашего аккаунта и
                  подтвердим условия партнёрства.
                </p>
                {latestApplication && (
                  <div className="mt-6 rounded-[1.4rem] border border-[#E5D0B1] bg-[#FBF1E4] px-4 py-4 text-sm text-[#6F583B]">
                    Текущий статус заявки: <strong>{latestApplication.status}</strong>
                  </div>
                )}
              </motion.div>

              <motion.form
                {...reveal}
                onSubmit={handleApply}
                className="premium-panel space-y-5 px-7 py-8"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Название компании</Label>
                    <Input
                      required
                      value={form.company}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, company: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>БИН</Label>
                    <Input
                      required
                      value={form.bin}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, bin: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Контактное лицо</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Телефон</Label>
                    <Input
                      required
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Город</Label>
                  <Input
                    required
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, city: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Комментарий</Label>
                  <Textarea
                    rows={5}
                    value={form.message}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, message: event.target.value }))
                    }
                  />
                </div>

                <Button type="submit" className="h-12 w-full" disabled={submitting}>
                  {submitting ? "Отправляем…" : "Отправить заявку"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
