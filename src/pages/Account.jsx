import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Heart,
  LogOut,
  MessageCircle,
  Shield,
  ShoppingCart,
  User,
} from "lucide-react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAiWidget } from "@/components/ai/AiAssistantWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/services/api/client";

const statusLabels = {
  pending: "Ожидает",
  confirmed: "Подтверждён",
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

const roleLabels = {
  admin: "Администратор",
  user: "Пользователь",
  b2b_client: "B2B клиент",
};

export default function Account() {
  const [searchParams] = useSearchParams();
  const { openWidget } = useAiWidget();
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();
  const adminDenied = searchParams.get("adminDenied") === "1";

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.email],
    queryFn: () =>
      apiClient.entities.Order.filter(
        { customer_email: user.email },
        "-created_date",
        20,
      ),
    enabled: Boolean(user?.email),
    initialData: [],
  });

  if (isLoadingAuth) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-6 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Загружаем аккаунт…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/?auth=login&next=%2Faccount" />;
  }

  if (user?.role === "admin") {
    return <Navigate replace to="/admin" />;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Личный кабинет</h1>
          <p className="mt-1 text-muted-foreground">
            {user.full_name || user.email}
          </p>
          {user.role === "admin" && (
            <p className="mt-2 text-sm text-[#8A6B48]">
              Вы вошли как администратор. Основная панель находится по адресу `/admin`.
            </p>
          )}
          {adminDenied && user.role !== "admin" && (
            <p className="mt-2 text-sm text-[#A06652]">
              У текущего аккаунта нет доступа к админке. Для панели нужен профиль с ролью `admin`.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">
              {roleLabels[user.role] || "Пользователь"}
            </Badge>
            {user.wholesale_approved && (
              <Badge>Оптовый доступ активен</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {user.role === "admin" && (
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <Shield className="mr-2 h-4 w-4" />
                Админ-панель
              </Button>
            </Link>
          )}
          {user.role === "b2b_client" && (
            <Link to="/b2b">
              <Button variant="outline" size="sm">
                B2B кабинет
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={() => logout(true)}>
            <LogOut className="mr-2 h-4 w-4" />
            Выход
          </Button>
        </div>
      </div>

      <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: ShoppingCart, label: "Корзина", path: "/cart" },
          { icon: Heart, label: "Избранное", path: "/wishlist" },
          { icon: User, label: "Каталог", path: "/catalog" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="rounded-xl border p-5 text-center transition-colors hover:border-primary/30"
          >
            <item.icon className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">{item.label}</p>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => openWidget({ mode: "consultation", reset: true })}
          className="rounded-xl border p-5 text-center transition-colors hover:border-primary/30"
        >
          <MessageCircle className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Консультация</p>
        </button>
      </div>

      <h2 className="mb-6 font-serif text-xl font-bold">Мои заказы</h2>
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border p-5">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-mono text-sm font-medium">
                    {order.order_number}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {order.created_date &&
                      format(new Date(order.created_date), "dd.MM.yyyy HH:mm")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    {statusLabels[order.status] || order.status}
                  </Badge>
                  <span className="font-semibold">
                    {order.total?.toLocaleString()} ₸
                  </span>
                </div>
              </div>

              {order.items?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {order.items.map((item, index) => (
                    <div
                      key={`${order.id}-${index}`}
                      className="h-12 w-12 shrink-0 overflow-hidden rounded bg-secondary"
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          Y
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <p>У вас ещё нет заказов</p>
          <Link to="/catalog">
            <Button variant="outline" className="mt-4 rounded-full">
              Перейти в каталог
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
