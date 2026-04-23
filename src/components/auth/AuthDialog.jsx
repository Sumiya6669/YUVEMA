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
        <div className="grid lg:grid-cols-[0.7fr_1.3fr]">
          <div className="bg-marble-rich p-8 md:p-10">
            <BrandMark className="mb-8" />
            <Badge variant="outline" className="border-[#E3D0B2] bg-white/75 text-[#7A613E]">
              {isAdminFlow ? "Вход в админку" : "Премиальный доступ"}
            </Badge>
            <div className="mt-10 rounded-[1.8rem] border border-white/80 bg-white/68 p-6 shadow-soft">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#8A7258]">
                {isAdminFlow ? "Admin access" : "Аккаунт YUVEMA"}
              </p>
              <p className="mt-4 font-serif text-[2rem] leading-[1.02] text-stone">
                {isAdminFlow ? "Авторизация администратора" : "Авторизация и регистрация"}
              </p>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-serif text-[2rem] font-medium text-stone">
                {mode === "login" ? "Войти" : "Создать аккаунт"}
              </DialogTitle>
            </DialogHeader>

            {!isAdminFlow && (
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
            )}

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
