import React, { useMemo, useState } from "react";
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
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAiWidget } from "@/components/ai/AiAssistantWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openWidget } = useAiWidget();
  const { user, isAuthenticated, isLoadingAuth, signIn, signUp, logout } =
    useAuth();
  const [mode, setMode] = useState("login");
  const [submitting, setSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const nextPath = useMemo(
    () => searchParams.get("next") || "/account",
    [searchParams],
  );
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

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const signedUser = await signIn(loginForm);
      toast.success("Вы вошли в аккаунт");
      if ((nextPath === "/account" || nextPath === "/") && signedUser?.role === "admin") {
        navigate("/admin");
      } else {
        navigate(nextPath);
      }
    } catch (error) {
      toast.error(error.message || "Не удалось войти");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await signUp(registerForm);
      toast.success(
        "Аккаунт создан. Если включено подтверждение email, подтвердите адрес и войдите.",
      );
      setMode("login");
      setLoginForm({
        email: registerForm.email,
        password: registerForm.password,
      });
    } catch (error) {
      toast.error(error.message || "Не удалось создать аккаунт");
    } finally {
      setSubmitting(false);
    }
  };

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
    return (
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-marble p-8 md:p-12">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">
              Личный кабинет
            </p>
            <h1 className="mb-4 font-serif text-4xl font-light text-stone">
              Управляйте заказами и B2B-доступом из одного аккаунта
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              После входа вы сможете отслеживать заказы, подавать B2B-заявку,
              видеть персональные условия и быстро возвращаться к избранным
              продуктам.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                "История заказов и статусы доставки",
                "B2B-заявка и оптовые цены после одобрения",
                "Быстрый доступ к каталогу, корзине и избранному",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-8 shadow-soft">
            {adminDenied && (
              <div className="mb-6 rounded-[1.4rem] border border-[#E8D7C0] bg-[#FBF1E4] px-5 py-4 text-sm leading-relaxed text-[#6C543B]">
                В этот раздел допускаются только администраторы. Если у вас админ-аккаунт,
                войдите под ним, и система автоматически переведёт вас в `/admin`.
              </div>
            )}

            <div className="mb-6 flex rounded-full bg-secondary/70 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${
                  mode === "login"
                    ? "bg-white font-medium text-stone shadow-soft"
                    : "text-muted-foreground"
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${
                  mode === "register"
                    ? "bg-white font-medium text-stone shadow-soft"
                    : "text-muted-foreground"
                }`}
              >
                Регистрация
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-full"
                  disabled={submitting}
                >
                  {submitting ? "Входим…" : "Войти"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Имя</Label>
                  <Input
                    id="register-name"
                    required
                    value={registerForm.fullName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Пароль</Label>
                  <Input
                    id="register-password"
                    type="password"
                    minLength={8}
                    required
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-full"
                  disabled={submitting}
                >
                  {submitting ? "Создаём аккаунт…" : "Создать аккаунт"}
                </Button>
              </form>
            )}

            <div className="mt-6 rounded-[1.35rem] border border-[#EEE2D6] bg-[#FFFCF8] px-4 py-4 text-sm leading-relaxed text-muted-foreground">
              Для входа в админку используйте админ-аккаунт из `.env.local`. После входа
              администратор автоматически попадает в `/admin`.
            </div>
          </div>
        </div>
      </div>
    );
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
