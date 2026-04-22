import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1) || "home";

  return (
    <div className="flex min-h-screen items-center justify-center bg-marble px-6">
      <div className="max-w-md text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">404</p>
        <h1 className="mb-4 font-serif text-4xl font-light text-stone">
          Страница не найдена
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          Раздел <span className="font-medium text-stone">{pageName}</span> недоступен
          или был перемещён.
        </p>
        <Button asChild className="rounded-full px-8">
          <Link to="/">Вернуться на главную</Link>
        </Button>
      </div>
    </div>
  );
}
