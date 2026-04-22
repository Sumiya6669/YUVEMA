import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api/client";

export default function Wishlist() {
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => apiClient.entities.WishlistItem.list(),
    initialData: [],
  });

  const removeItem = async (id) => {
    await apiClient.entities.WishlistItem.delete(id);
    queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    toast.success("Удалено из избранного");
  };

  const addToCart = async (item) => {
    await apiClient.entities.CartItem.create({
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url,
    });
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    toast.success("Добавлено в корзину");
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <Heart className="mb-6 h-16 w-16 text-muted-foreground/30" />
        <h2 className="mb-3 font-serif text-2xl font-bold">Избранное пусто</h2>
        <p className="mb-8 text-muted-foreground">
          Сохраняйте понравившиеся продукты
        </p>
        <Link to="/catalog">
          <Button className="rounded-full px-8">Перейти в каталог</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <h1 className="mb-10 font-serif text-3xl font-bold">Избранное</h1>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="group">
            <Link to={`/product/${item.product_id}`}>
              <div className="mb-3 aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-serif text-4xl text-muted-foreground/20">
                    Y
                  </div>
                )}
              </div>
            </Link>
            <p className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              {item.brand}
            </p>
            <h3 className="mb-1 line-clamp-2 text-sm font-medium">
              {item.product_name}
            </h3>
            <p className="mb-3 text-sm font-semibold">
              {item.price?.toLocaleString()} ₸
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 rounded-full text-xs"
                onClick={() => addToCart(item)}
              >
                <ShoppingBag className="mr-1 h-3 w-3" />
                В корзину
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
