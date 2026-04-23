import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/services/api/client";

function formatPrice(value) {
  if (value === undefined || value === null) {
    return "По запросу";
  }

  return `${Number(value).toLocaleString()} ₸`;
}

export default function ProductCard({ product, index = 0 }) {
  const queryClient = useQueryClient();
  const { isB2BClient } = useAuth();
  const [imageFailed, setImageFailed] = useState(false);
  const displayPrice =
    isB2BClient && product.wholesale_price ? product.wholesale_price : product.price;

  const addToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    await apiClient.entities.CartItem.create({
      product_id: product.id,
      product_name: product.name,
      price: displayPrice,
      quantity: 1,
      image_url: product.image_url,
    });

    queryClient.invalidateQueries({ queryKey: ["cart"] });
    toast.success("Товар добавлен в корзину");
  };

  const addToWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    await apiClient.entities.WishlistItem.create({
      product_id: product.id,
      product_name: product.name,
      price: displayPrice,
      image_url: product.image_url,
      brand: product.brand,
    });

    queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    toast.success("Товар сохранён в избранное");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.75,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group"
    >
      <Link to={`/product/${product.id}`} className="block">
        <article className="premium-card marble-surface overflow-hidden p-3">
          <div className="relative mb-5 aspect-[0.82] overflow-hidden rounded-[1.35rem] bg-nude">
            {product.image_url && !imageFailed ? (
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-marble-light">
                <span className="font-serif text-6xl gold-shimmer">Y</span>
              </div>
            )}

            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
              <div className="flex flex-wrap gap-2">
                {product.new_arrival && (
                  <span className="rounded-full border border-white/80 bg-white/78 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-stone/80 shadow-soft">
                    Новинка
                  </span>
                )}
                {product.bestseller && (
                  <span className="rounded-full border border-[#F0DFC3] bg-[#FFF5E7] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#7A613E] shadow-soft">
                    Bestseller
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={addToWishlist}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/85 bg-white/82 text-[#C48792] shadow-soft transition-all hover:scale-105 hover:shadow-soft-md active:scale-95"
              >
                <Heart className="h-3.5 w-3.5" strokeWidth={1.6} />
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 translate-y-4 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={addToCart}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#DFC4A2] bg-[#F7EBDD] px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-[#664F39] shadow-soft-md transition-all hover:bg-[#F2E2CE] hover:shadow-soft-lg"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                В корзину
              </button>
            </div>
          </div>

          <div className="px-1 pb-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {product.brand}
              </p>
              {(product.featured || product.bestseller) && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-[#A47C4F]">
                  <Sparkles className="h-3 w-3" strokeWidth={1.6} />
                  Expert pick
                </span>
              )}
            </div>

            <h3 className="mb-3 line-clamp-2 font-serif text-[1.3rem] leading-[1.05] text-stone transition-colors duration-300 group-hover:text-[#866540]">
              {product.name}
            </h3>

            {product.short_description && (
              <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                {product.short_description}
              </p>
            )}

            <div className="flex items-end justify-between gap-3 border-t border-[#EFE6DC] pt-4">
              <div>
                <p className="font-medium text-stone">{formatPrice(displayPrice)}</p>
                {product.volume && (
                  <p className="mt-1 text-xs text-muted-foreground">{product.volume}</p>
                )}
              </div>

              {isB2BClient && product.wholesale_price && (
                <span className="rounded-full bg-[#F8EEE2] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#8A6944]">
                  B2B
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
