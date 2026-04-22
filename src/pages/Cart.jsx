import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { apiClient } from "@/services/api/client";

export default function Cart() {
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiClient.entities.CartItem.list(),
    initialData: [],
  });

  const updateQty = async (item, delta) => {
    const quantity = (item.quantity || 1) + delta;
    if (quantity < 1) {
      return;
    }

    await apiClient.entities.CartItem.update(item.id, { quantity });
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  };

  const removeItem = async (id) => {
    await apiClient.entities.CartItem.delete(id);
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    toast.success("Удалено из корзины");
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  );
  const shipping =
    subtotal > siteConfig.freeShippingThreshold ? 0 : siteConfig.shippingPrice;
  const total = subtotal + shipping;

  if (!isLoading && cartItems.length === 0) {
    return (
      <div>
        <PageHero
          eyebrow="Корзина"
          title="Пока здесь пусто"
          description="Добавьте в корзину средства, которые хотите собрать в свой уход."
          align="center"
        >
          <Button asChild>
            <Link to="/catalog">Перейти в каталог</Link>
          </Button>
        </PageHero>
      </div>
    );
  }

  return (
    <div>
      <PageHero
        eyebrow="Корзина"
        title="Ваш заказ уже почти собран"
        description="Проверьте состав корзины, количество и итоговую сумму перед оформлением."
      />

      <section className="page-section py-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
          <div className="space-y-5">
            {cartItems.map((item) => (
              <motion.div key={item.id} layout className="premium-card flex gap-5 p-4">
                <Link
                  to={`/product/${item.product_id}`}
                  className="h-28 w-24 shrink-0 overflow-hidden rounded-[1.1rem] bg-[#F5EEE6]"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-muted-foreground/20">
                      Y
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-stone">{item.product_name}</h3>
                  <p className="mt-2 text-sm font-semibold text-stone">
                    {item.price?.toLocaleString()} ₸
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-[#E5D8CA] bg-white">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQty(item, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-xs font-medium">
                        {item.quantity || 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQty(item, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-stone">
                    {((item.price || 0) * (item.quantity || 1)).toLocaleString()} ₸
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div>
            <div className="premium-panel sticky top-28 px-6 py-7">
              <h2 className="font-serif text-[2rem] leading-none text-stone">Итог заказа</h2>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Подытог</span>
                  <span>{subtotal.toLocaleString()} ₸</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Доставка</span>
                  <span>
                    {shipping === 0 ? "Бесплатно" : `${shipping.toLocaleString()} ₸`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Бесплатная доставка от {siteConfig.freeShippingThreshold.toLocaleString()} ₸
                  </p>
                )}
                <div className="flex justify-between border-t border-[#EEE2D6] pt-4 text-base font-semibold">
                  <span>Итого</span>
                  <span>{total.toLocaleString()} ₸</span>
                </div>
              </div>

              <Link to="/checkout">
                <Button className="mt-7 h-12 w-full">
                  Оформить заказ
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <div className="mt-5 rounded-[1.3rem] border border-[#EEE2D6] bg-white px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                Заказ оформляется спокойно и без лишних шагов: адрес, способ оплаты и
                подтверждение.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
