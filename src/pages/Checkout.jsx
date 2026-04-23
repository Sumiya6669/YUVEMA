import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/services/api/client";

function createOrderNumber() {
  return `YUV-${Date.now().toString(36).toUpperCase()}`;
}

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    deliveryMethod: "delivery",
    payment: "kaspi",
    notes: "",
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiClient.entities.CartItem.list(),
    initialData: [],
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((current) => ({
      ...current,
      name: current.name || user.full_name || "",
      email: current.email || user.email || "",
      phone: current.phone || user.phone || "",
      city: current.city || user.city || "",
    }));
  }, [user]);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0,
    );
    const shipping =
      form.deliveryMethod === "pickup"
        ? 0
        : subtotal >= siteConfig.freeShippingThreshold
          ? 0
          : siteConfig.shippingPrice;

    return {
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }, [cartItems, form.deliveryMethod]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.city ||
      (form.deliveryMethod === "delivery" && !form.address)
    ) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Корзина пуста");
      return;
    }

    setSubmitting(true);

    try {
      const orderNumber = createOrderNumber();

      await apiClient.entities.Order.create({
        order_number: orderNumber,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        type: user?.role === "b2b_client" ? "b2b" : "b2c",
        payment_method: form.payment,
        delivery_method: form.deliveryMethod,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity || 1,
          price: item.price,
          image_url: item.image_url,
        })),
        shipping_address:
          form.deliveryMethod === "pickup" ? siteConfig.location : form.address,
        shipping_city: form.city,
        notes: form.notes,
      });

      await apiClient.entities.CartItem.clear();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Заказ оформлен");
      navigate(`/order-success?order=${orderNumber}`);
    } catch (error) {
      toast.error(error.message || "Не удалось оформить заказ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHero
        eyebrow="Оформление заказа"
        title="Финальный шаг перед подтверждением"
        description="Проверьте контактные данные, выберите способ получения и оплату. После этого заказ сразу уйдёт в обработку."
      />

      <section className="page-section py-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            className="premium-panel space-y-6 px-7 py-8"
          >
            <div>
              <h2 className="font-serif text-[2rem] leading-none text-stone">
                Контактные данные
              </h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field label="Имя *">
                  <Input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Email *">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Телефон *">
                  <Input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Город *">
                  <Input
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, city: event.target.value }))
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="section-divider" />

            <div>
              <h2 className="font-serif text-[2rem] leading-none text-stone">
                Получение и оплата
              </h2>
              <div className="mt-5 space-y-5">
                <Field label="Способ получения">
                  <Select
                    value={form.deliveryMethod}
                    onValueChange={(deliveryMethod) =>
                      setForm((current) => ({
                        ...current,
                        deliveryMethod,
                        address:
                          deliveryMethod === "pickup" ? siteConfig.location : current.address,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery">Доставка</SelectItem>
                      <SelectItem value="pickup">Самовывоз</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {form.deliveryMethod === "delivery" ? (
                  <Field label="Адрес *">
                    <Input
                      value={form.address}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, address: event.target.value }))
                      }
                    />
                  </Field>
                ) : (
                  <div className="rounded-[1.4rem] border border-[#E5D6C5] bg-[#FFFCF8] px-5 py-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Пункт самовывоза
                    </p>
                    <p className="mt-2 font-medium text-stone">Шоурум YUVEMA</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {siteConfig.location}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Самовывоз доступен после подтверждения заказа менеджером.
                    </p>
                  </div>
                )}

                <Field label="Способ оплаты">
                  <Select
                    value={form.payment}
                    onValueChange={(payment) =>
                      setForm((current) => ({ ...current, payment }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kaspi">Kaspi Pay</SelectItem>
                      <SelectItem value="halyk">Halyk Bank</SelectItem>
                      <SelectItem value="freedom">Freedom Pay</SelectItem>
                      <SelectItem value="cash">Наличные</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Комментарий">
                  <Textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    placeholder="Пожелания к заказу"
                  />
                </Field>
              </div>
            </div>
          </form>

          <div>
            <div className="premium-panel sticky top-28 px-6 py-7">
              <h2 className="font-serif text-[2rem] leading-none text-stone">
                Ваш заказ
              </h2>
              <div className="mt-6 space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {item.product_name} × {item.quantity || 1}
                    </span>
                    <span className="shrink-0 text-stone">
                      {((item.price || 0) * (item.quantity || 1)).toLocaleString("ru-RU")} ₸
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-[#EEE2D6] pt-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Подытог</span>
                  <span>{totals.subtotal.toLocaleString("ru-RU")} ₸</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {form.deliveryMethod === "pickup" ? "Самовывоз" : "Доставка"}
                  </span>
                  <span>
                    {form.deliveryMethod === "pickup"
                      ? "Бесплатно"
                      : totals.shipping === 0
                        ? "Бесплатно"
                        : `${totals.shipping.toLocaleString("ru-RU")} ₸`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#EEE2D6] pt-4 text-base font-semibold">
                  <span>Итого</span>
                  <span>{totals.total.toLocaleString("ru-RU")} ₸</span>
                </div>
              </div>

              <Button
                type="submit"
                form="checkout-form"
                className="mt-7 h-12 w-full"
                disabled={submitting || cartItems.length === 0}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Подтвердить заказ
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ children, label }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
