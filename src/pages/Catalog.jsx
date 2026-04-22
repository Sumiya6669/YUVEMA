import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAiWidget } from "@/components/ai/AiAssistantWidget";
import { apiClient } from "@/services/api/client";

const SKIN_TYPES = ["Сухая", "Жирная", "Комбинированная", "Нормальная", "Чувствительная"];
const SKIN_PROBLEMS = [
  "Акне",
  "Сухость",
  "Пигментация",
  "Морщины",
  "Покраснения",
  "Расширенные поры",
];

export default function Catalog() {
  const { openWidget } = useAiWidget();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedSkinType, setSelectedSkinType] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiClient.entities.Product.list("-created_date", 200),
    initialData: [],
  });

  const brands = useMemo(
    () => [...new Set(products.map((product) => product.brand).filter(Boolean))],
    [products],
  );
  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (product) =>
          product.name?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query),
      );
    }

    if (brand !== "all") {
      result = result.filter((product) => product.brand === brand);
    }

    if (category !== "all") {
      result = result.filter((product) => product.category === category);
    }

    if (selectedSkinType) {
      result = result.filter((product) => product.skin_types?.includes(selectedSkinType));
    }

    if (selectedProblem) {
      result = result.filter((product) => product.skin_problems?.includes(selectedProblem));
    }

    if (sortBy === "price_asc") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return result;
  }, [brand, category, products, search, selectedProblem, selectedSkinType, sortBy]);

  const hasFilters =
    brand !== "all" || category !== "all" || Boolean(selectedSkinType) || Boolean(selectedProblem);

  function clearFilters() {
    setBrand("all");
    setCategory("all");
    setSelectedSkinType(null);
    setSelectedProblem(null);
    setSearch("");
  }

  return (
    <div>
      <PageHero
        eyebrow="Каталог"
        title="Премиальный ассортимент с понятной навигацией и аккуратным выбором"
        description="Подберите средство по задаче кожи, бренду, категории или откройте консультацию, если нужен готовый маршрут до покупки."
      >
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="text-[11px] uppercase tracking-[0.18em]"
            onClick={() => openWidget({ mode: "consultation", reset: true })}
          >
            <Sparkles className="h-4 w-4" />
            Нужна консультация
          </Button>
        </div>
      </PageHero>

      <section className="page-section py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="premium-panel px-5 py-5 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск по названию, бренду или категории"
                  className="w-full rounded-full border border-[#ECE1D5] bg-white px-11 py-3 text-sm text-stone outline-none transition-all placeholder:text-muted-foreground/75 focus:border-[#D4B082] focus:ring-2 focus:ring-[#EAD8BE]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger className="w-[170px] rounded-full border-[#ECE1D5] bg-white">
                    <SelectValue placeholder="Бренд" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все бренды</SelectItem>
                    {brands.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[180px] rounded-full border-[#ECE1D5] bg-white">
                    <SelectValue placeholder="Категория" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все категории</SelectItem>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[170px] rounded-full border-[#ECE1D5] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Сначала новинки</SelectItem>
                    <SelectItem value="price_asc">Цена по возрастанию</SelectItem>
                    <SelectItem value="price_desc">Цена по убыванию</SelectItem>
                    <SelectItem value="name">По алфавиту</SelectItem>
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={() => setShowFilters((current) => !current)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                    showFilters
                      ? "border-[#D4B082] bg-[#F8ECDD] text-[#6B533B]"
                      : "border-[#ECE1D5] bg-white text-muted-foreground hover:border-[#D4B082]"
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 grid gap-5 border-t border-[#EFE4D8] pt-5 md:grid-cols-2">
                    <div>
                      <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                        Тип кожи
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SKIN_TYPES.map((item) => (
                          <Chip
                            key={item}
                            active={selectedSkinType === item}
                            onClick={() =>
                              setSelectedSkinType(selectedSkinType === item ? null : item)
                            }
                          >
                            {item}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                        Задача кожи
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SKIN_PROBLEMS.map((item) => (
                          <Chip
                            key={item}
                            active={selectedProblem === item}
                            onClick={() =>
                              setSelectedProblem(selectedProblem === item ? null : item)
                            }
                          >
                            {item}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Найдено {filteredProducts.length}
              </span>

              {brand !== "all" && <ActiveFilter label={brand} onClear={() => setBrand("all")} />}
              {category !== "all" && (
                <ActiveFilter label={category} onClear={() => setCategory("all")} />
              )}
              {selectedSkinType && (
                <ActiveFilter label={selectedSkinType} onClear={() => setSelectedSkinType(null)} />
              )}
              {selectedProblem && (
                <ActiveFilter label={selectedProblem} onClear={() => setSelectedProblem(null)} />
              )}
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-muted-foreground transition-colors hover:text-stone"
              >
                Сбросить фильтры
              </button>
            )}
          </div>

          <div className="mt-8">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="premium-card animate-pulse p-3">
                    <div className="mb-5 aspect-[0.82] rounded-[1.35rem] bg-[#F4EEE7]" />
                    <div className="h-3 w-20 rounded-full bg-[#EFE7DD]" />
                    <div className="mt-3 h-5 w-40 rounded-full bg-[#EFE7DD]" />
                    <div className="mt-3 h-4 w-full rounded-full bg-[#F4EEE7]" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            ) : (
              <div className="premium-panel px-8 py-14 text-center">
                <p className="font-serif text-[2rem] text-stone">Ничего не найдено</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Попробуйте смягчить фильтры или откройте консультацию, и мы поможем подобрать
                  уход под вашу задачу.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button variant="outline" onClick={clearFilters}>
                    Сбросить фильтры
                  </Button>
                  <Button onClick={() => openWidget({ mode: "routine", reset: true })}>
                    Открыть подбор ухода
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs transition-all ${
        active
          ? "border-[#D4B082] bg-[#F8ECDD] text-[#6B533B] shadow-soft"
          : "border-[#ECE1D5] bg-white text-[#7A6652] hover:border-[#D4B082] hover:bg-[#FFF8F1]"
      }`}
    >
      {children}
    </button>
  );
}

function ActiveFilter({ label, onClear }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1 rounded-full border border-[#E5D0B1] bg-[#FBF1E4] px-3 py-1 text-xs text-[#7A613E]"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}
