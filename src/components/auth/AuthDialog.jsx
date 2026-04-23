import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import BrandMark from "@/components/branding/BrandMark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { buildAuthUrl, clearAuthUrl } from "@/lib/authModal";

export default function AuthDialog() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoadingAuth, signIn, signUp, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState(searchParams.get("auth") || "login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const dialogMode = searchParams.get("auth");
  const isOpen = dialogMode === "login" || dialogMode === "register";
  const nextPath = useMemo(
    () => searchParams.get("next") || "/account",
    [searchParams],
  );
  const isAdminFlow = nextPath.startsWith("/admin") || location.pathname.startsWith("/admin");

  useEffect(() => {
    if (dialogMode === "login" || dialogMode === "register") {
      setMode(dialogMode);
    }
  }, [dialogMode]);

  if (isAuthenticated && isOpen && !isLoadingAuth) {
    return <Navigate replace to={user?.role === "admin" ? "/admin" : nextPath} />;
  }

  function closeDialog() {
    navigate(
      clearAuthUrl({
        pathname: location.pathname,
        search: location.search,
      }),
      { replace: true },
    );
  }

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const signedUser = await signIn(loginForm);
      toast.success("Вы вошли в аккаунт");
      closeDialog();
      navigate(
        signedUser?.role === "admin"
          ? "/admin"
          : nextPath === "/" || nextPath === location.pathname
            ? "/account"
            : nextPath,
      );
    } catch (error) {
      toast.error(error.message || "Не удалось войти");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await signUp(registerForm);
      toast.success(
        "Аккаунт создан. Если в проекте включено подтверждение email, сначала подтвердите почту.",
      );
      setMode("login");
      navigate(
        buildAuthUrl({
          pathname: location.pathname,
          search: location.search,
          mode: "login",
          nextPath,
        }),
        { replace: true },
      );
      setLoginForm({
        email: registerForm.email,
        password: registerForm.password,
      });
    } catch (error) {
      toast.error(error.message || "Не удалось создать аккаунт");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-[920px] overflow-hidden border-[#E7DACD] bg-[#FFFCF8] p-0 shadow-soft-xl">
        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          <div className="bg-marble-rich p-8 md:p-10">
            <BrandMark className="mb-8" />
            <Badge variant="outline" className="border-[#E3D0B2] bg-white/75 text-[#7A613E]">
              {isAdminFlow ? "Вход в админку" : "Премиальный доступ"}
            </Badge>
            <h2 className="mt-6 font-serif text-[2.6rem] leading-[0.94] text-stone">
              {isAdminFlow
                ? "Вход администратора открывается прямо поверх сайта"
                : "Вход и регистрация теперь открываются прямо поверх сайта"}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-8 text-stone/70">
              {isAdminFlow
                ? "Без отдельной страницы. После входа с ролью admin система сразу переводит вас в административную панель."
                : "Без отдельной страницы. Вы входите, возвращаетесь в нужный сценарий и сразу продолжаете путь до покупки, B2B-заявки или админки."}
            </p>

            <div className="mt-8 space-y-3">
              {(isAdminFlow
                ? [
                    "Введите админ-аккаунт, и система сразу откроет /admin",
                    "Если роль ещё не подтянулась, сервер синхронизирует профиль через /api/auth-profile",
                    "Окно входа закрывается, а сценарий продолжается без лишней страницы",
                  ]
                : [
                    "Вход администратора с автоматическим переходом в /admin",
                    "Обычный клиент попадает в личный кабинет без лишних шагов",
                    "Регистрация, консультация и покупка остаются в одном потоке",
                  ]).map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-white/75 bg-white/72 px-4 py-4 text-sm leading-relaxed text-stone/75 shadow-soft"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 md:p-10">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-serif text-[2rem] font-medium text-stone">
                {mode === "login" ? "Войти" : "Создать аккаунт"}
              </DialogTitle>
              <p className="text-sm leading-7 text-muted-foreground">
                {mode === "login"
                  ? isAdminFlow
                    ? "Если этот аккаунт имеет роль admin, вход завершится прямым переходом в административную панель."
                    : "Если это админ-аккаунт, система сама откроет административную панель."
                  : "Создайте аккаунт, чтобы отслеживать заказы, подавать B2B-заявку и работать с подбором ухода."}
              </p>
            </DialogHeader>

            <div className="mt-6 flex rounded-full bg-[#F5EEE6] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  navigate(
                    buildAuthUrl({
                      pathname: location.pathname,
                      search: location.search,
                      mode: "login",
                      nextPath,
                    }),
                    { replace: true },
                  );
                }}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm transition-colors ${
                  mode === "login"
                    ? "bg-white font-medium text-stone shadow-soft"
                    : "text-muted-foreground"
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  navigate(
                    buildAuthUrl({
                      pathname: location.pathname,
                      search: location.search,
                      mode: "register",
                      nextPath,
                    }),
                    { replace: true },
                  );
                }}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm transition-colors ${
                  mode === "register"
                    ? "bg-white font-medium text-stone shadow-soft"
                    : "text-muted-foreground"
                }`}
              >
                Регистрация
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <Field label="Email" htmlFor="auth-login-email">
                  <Input
                    id="auth-login-email"
                    type="email"
                    required
                    className="h-12 rounded-[1.1rem] border-[#E8DED2] bg-white"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Пароль" htmlFor="auth-login-password">
                  <Input
                    id="auth-login-password"
                    type="password"
                    required
                    className="h-12 rounded-[1.1rem] border-[#E8DED2] bg-white"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Button type="submit" className="mt-2 h-12 w-full" disabled={submitting}>
                  {submitting ? "Входим..." : "Войти"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <Field label="Имя" htmlFor="auth-register-name">
                  <Input
                    id="auth-register-name"
                    required
                    className="h-12 rounded-[1.1rem] border-[#E8DED2] bg-white"
                    value={registerForm.fullName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Email" htmlFor="auth-register-email">
                  <Input
                    id="auth-register-email"
                    type="email"
                    required
                    className="h-12 rounded-[1.1rem] border-[#E8DED2] bg-white"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Пароль" htmlFor="auth-register-password">
                  <Input
                    id="auth-register-password"
                    type="password"
                    minLength={8}
                    required
                    className="h-12 rounded-[1.1rem] border-[#E8DED2] bg-white"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Button type="submit" className="mt-2 h-12 w-full" disabled={submitting}>
                  {submitting ? "Создаём аккаунт..." : "Создать аккаунт"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ children, htmlFor, label }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
