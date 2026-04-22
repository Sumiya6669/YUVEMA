import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAiWidget } from "@/components/ai/AiAssistantWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/product/ProductCard";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/services/api/client";

export default function ProductDetail() {
  const { id: productId } = useParams();
  const [qty, setQty] = useState(1);
  const queryClient = useQueryClient();
  const { isB2BClient } = useAuth();
  const { openWidget } = useAiWidget();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const products = await apiClient.entities.Product.filter({ id: productId });
      return products[0] || null;
    },
    enabled: Boolean(productId),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => apiClient.entities.Review.filter({ product_id: productId }),
    enabled: Boolean(productId),
    initialData: [],
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related", product?.category],
    queryFn: () =>
      apiClient.entities.Product.filter(
        { category: product.category },
        "-created_date",
        4,
      ),
    enabled: Boolean(product?.category),
    initialData: [],
  });

  const displayPrice =
    isB2BClient && product?.wholesale_price ? product.wholesale_price : product?.price;

  const addToCart = async () => {
    await apiClient.entities.CartItem.create({
      product_id: product.id,
      product_name: product.name,
      price: displayPrice,
      quantity: qty,
      image_url: product.image_url,
    });
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    toast.success("Добавлено в корзину");
  };

  const addToWishlist = async () => {
    await apiClient.entities.WishlistItem.create({
      product_id: product.id,
      product_name: product.name,
      price: displayPrice,
      image_url: product.image_url,
      brand: product.brand,
    });
    queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    toast.success("Добавлено в избранное");
  };

  if (isLoading || !product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid animate-pulse gap-12 md:grid-cols-2">
          <div className="aspect-square rounded-xl bg-secondary" />
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-secondary" />
            <div className="h-8 w-64 rounded bg-secondary" />
            <div className="h-6 w-32 rounded bg-secondary" />
            <div className="h-40 rounded bg-secondary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <Link
          to="/catalog"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Каталог
        </Link>

        <div className="grid gap-12 lg:gap-16 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="aspect-square overflow-hidden rounded-xl bg-secondary"
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-8xl text-muted-foreground/20">
                Y
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-primary">
              {product.brand}
            </p>
            <h1 className="mb-2 font-serif text-3xl font-bold md:text-4xl">
              {product.name}
            </h1>
            {product.volume && (
              <p className="mb-4 text-sm text-muted-foreground">{product.volume}</p>
            )}

            {reviews.length > 0 && (
              <div className="mb-6 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= (product.rating || 0)
                          ? "fill-primary text-primary"
                          : "text-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {reviews.length} отзывов
                </span>
              </div>
            )}

            <p className="mb-2 text-3xl font-bold">
              {displayPrice?.toLocaleString()} ₸
            </p>
            {isB2BClient && product.wholesale_price && (
              <p className="mb-6 text-sm text-primary">
                B2B цена активна для вашего аккаунта
              </p>
            )}

            {product.short_description && (
              <p className="mb-8 leading-relaxed text-muted-foreground">
                {product.short_description}
              </p>
            )}

            {(product.skin_types?.length > 0 || product.skin_problems?.length > 0) && (
              <div className="mb-8 space-y-3">
                {product.skin_types?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.skin_types.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}
                {product.skin_problems?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.skin_problems.map((problem) => (
                      <Badge key={problem} variant="secondary" className="text-xs">
                        {problem}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mb-4 flex items-center gap-4">
              <div className="flex items-center rounded-full border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setQty((current) => Math.max(1, current - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setQty((current) => current + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={addToCart} className="h-12 flex-1 rounded-full">
                <ShoppingBag className="mr-2 h-4 w-4" />
                В корзину
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={addToWishlist}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {product.in_stock !== false && (
              <p className="mb-8 flex items-center gap-1.5 text-sm text-green-600">
                <Check className="h-4 w-4" />
                В наличии
              </p>
            )}

            <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5 shadow-soft">
              <p className="text-[10px] uppercase tracking-[0.22em] text-primary">
                Нужна помощь с выбором?
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Откройте встроенную консультацию, чтобы сравнить это средство с альтернативами,
                подобрать дополняющий уход или собрать полную рутину под вашу задачу.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 px-6 text-[11px] uppercase tracking-[0.18em]"
                onClick={() =>
                  openWidget({
                    mode: "sales",
                    message: `Помоги подобрать уход вокруг продукта ${product.brand} ${product.name}.`,
                    selectedProductIds: [product.id],
                  })
                }
              >
                <Sparkles className="h-4 w-4" />
                Открыть консультацию
              </Button>
            </div>

            <Tabs defaultValue="desc" className="mt-8">
              <TabsList className="w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
                <TabsTrigger
                  value="desc"
                  className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Описание
                </TabsTrigger>
                <TabsTrigger
                  value="composition"
                  className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Состав
                </TabsTrigger>
                <TabsTrigger
                  value="usage"
                  className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Применение
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Отзывы ({reviews.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="desc" className="pt-6">
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {product.description || "Описание скоро будет добавлено."}
                </p>
              </TabsContent>
              <TabsContent value="composition" className="pt-6">
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {product.composition || "Информация о составе скоро будет добавлена."}
                </p>
              </TabsContent>
              <TabsContent value="usage" className="pt-6">
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {product.usage_instructions ||
                    "Инструкция по применению скоро будет добавлена."}
                </p>
              </TabsContent>
              <TabsContent value="reviews" className="pt-6">
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= review.rating
                                    ? "fill-primary text-primary"
                                    : "text-border"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">
                            {review.author_name || "Покупатель"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {review.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Отзывов пока нет.</p>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {related.filter((item) => item.id !== product.id).length > 0 && (
          <div className="mt-24">
            <h2 className="mb-8 font-serif text-2xl font-bold">
              Похожие продукты
            </h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-8">
              {related
                .filter((item) => item.id !== product.id)
                .slice(0, 4)
                .map((item, index) => (
                  <ProductCard key={item.id} product={item} index={index} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
