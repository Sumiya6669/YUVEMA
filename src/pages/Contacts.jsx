import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ExternalLink, Mail, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import TwoGisMap from "@/components/maps/TwoGisMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { apiClient } from "@/services/api/client";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
};

export default function Contacts() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await apiClient.entities.ContactMessage.create(form);
      toast.success("Сообщение отправлено. Мы свяжемся с вами.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      toast.error(error.message || "Не удалось отправить сообщение");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="border-b border-[#EEE2D6] bg-[#FBF7F1] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <motion.div {...fadeIn} className="max-w-3xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-primary">
              Контакты YUVEMA
            </p>
            <h1 className="font-serif text-[3rem] leading-[0.96] text-stone md:text-[4rem]">
              Точка бренда, адрес и удобная связь в одном месте
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Мы убрали заглушки и оставили только то, что действительно нужно пользователю:
              точный адрес, карту 2GIS и живую форму связи.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <motion.div {...fadeIn} className="space-y-6">
              <div className="premium-panel px-7 py-7">
                <h2 className="font-serif text-[2rem] leading-none text-stone">Шоурум YUVEMA</h2>
                <div className="mt-6 space-y-5">
                  {[
                    { icon: MapPin, label: "Адрес", value: siteConfig.location },
                    { icon: Mail, label: "Email", value: siteConfig.email },
                    { icon: Clock, label: "Режим работы", value: siteConfig.businessHours },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FBF0E3] shadow-soft">
                        <item.icon className="h-4 w-4 text-primary" strokeWidth={1.6} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-stone/85">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href={siteConfig.twoGisLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8A6B48]"
                >
                  Открыть в 2GIS
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="premium-panel overflow-hidden p-3">
                <TwoGisMap />
              </div>
            </motion.div>

            <motion.div
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.08 }}
              className="premium-panel px-7 py-7"
            >
              <h2 className="font-serif text-[2rem] leading-none text-stone">Написать нам</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Если нужен подбор, уточнение по заказу или B2B-вопрос, оставьте сообщение. Мы
                ответим без лишней формальности и быстро вернёмся с конкретикой.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Имя</Label>
                  <Input
                    id="contact-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Телефон</Label>
                  <Input
                    id="contact-phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Сообщение</Label>
                  <Textarea
                    id="contact-message"
                    rows={6}
                    value={form.message}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                  />
                </div>
                <Button type="submit" className="h-12 px-7" disabled={submitting}>
                  <Send className="h-4 w-4" />
                  {submitting ? "Отправляем…" : "Отправить сообщение"}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
