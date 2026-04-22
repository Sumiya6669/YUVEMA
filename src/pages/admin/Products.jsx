import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/services/api/client";

const emptyProduct = {
  name: "",
  brand: "",
  category: "",
  subcategory: "",
  description: "",
  short_description: "",
  composition: "",
  effects: "",
  price: 0,
  wholesale_price: 0,
  volume: "",
  image_url: "",
  in_stock: true,
  featured: false,
  new_arrival: false,
  bestseller: false,
  skin_types: [],
  skin_problems: [],
  usage_instructions: "",
  country_of_origin: "",
};

export default function Products() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyProduct);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => apiClient.entities.Product.list("-created_date", 500),
    initialData: [],
  });

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          !search ||
          product.name?.toLowerCase().includes(search.toLowerCase()) ||
          product.brand?.toLowerCase().includes(search.toLowerCase()) ||
          product.category?.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  const stats = [
    { label: "Всего", value: products.length },
    { label: "В наличии", value: products.filter((product) => product.in_stock !== false).length },
    { label: "Избранное", value: products.filter((product) => product.featured).length },
    { label: "Новинки", value: products.filter((product) => product.new_arrival).length },
  ];

  function openNew() {
    setEditing(null);
    setForm(emptyProduct);
    setDialogOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({ ...emptyProduct, ...product });
    setDialogOpen(true);
  }

  async function handleSave() {
    const payload = {
      ...form,
      skin_types: normalizeList(form.skin_types),
      skin_problems: normalizeList(form.skin_problems),
    };

    if (editing) {
      await apiClient.entities.Product.update(editing.id, payload);
      toast.success("Товар обновлён");
    } else {
      await apiClient.entities.Product.create(payload);
      toast.success("Товар создан");
    }

    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    setDialogOpen(false);
  }

  async function handleDelete(id) {
    await apiClient.entities.Product.delete(id);
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    toast.success("Товар удалён");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Каталог и товары</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Полное управление карточками товара, ценами и статусами витрины.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Добавить товар
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-stone">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по названию, бренду или категории"
          className="pl-11"
        />
      </div>

      <div className="grid gap-3">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[1rem] bg-[#F5EEE6]">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone">{product.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{product.brand}</span>
                  <span>·</span>
                  <span>{product.category || "Без категории"}</span>
                  {product.volume && (
                    <>
                      <span>·</span>
                      <span>{product.volume}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {product.featured && <Badge variant="secondary">Избранное</Badge>}
                {product.new_arrival && <Badge>Новинка</Badge>}
                {product.bestseller && <Badge variant="outline">Бестселлер</Badge>}
                {!product.in_stock && <Badge variant="outline">Нет в наличии</Badge>}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-stone">
                  {product.price?.toLocaleString()} ₸
                </p>
                {product.wholesale_price ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    B2B: {product.wholesale_price.toLocaleString()} ₸
                  </p>
                ) : null}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать товар" : "Новый товар"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Название">
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </Field>
                <Field label="Бренд">
                  <Input
                    value={form.brand}
                    onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Категория">
                  <Input
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Подкатегория">
                  <Input
                    value={form.subcategory}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, subcategory: event.target.value }))
                    }
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Цена">
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, price: Number(event.target.value) }))
                    }
                  />
                </Field>
                <Field label="B2B цена">
                  <Input
                    type="number"
                    value={form.wholesale_price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        wholesale_price: Number(event.target.value),
                      }))
                    }
                  />
                </Field>
                <Field label="Объём">
                  <Input
                    value={form.volume}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, volume: event.target.value }))
                    }
                  />
                </Field>
              </div>

              <Field label="Краткое описание">
                <Input
                  value={form.short_description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      short_description: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Описание">
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </Field>

              <Field label="Состав">
                <Textarea
                  rows={3}
                  value={form.composition}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, composition: event.target.value }))
                  }
                />
              </Field>

              <Field label="Применение">
                <Textarea
                  rows={3}
                  value={form.usage_instructions}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      usage_instructions: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            <div className="space-y-4">
              <Field label="URL изображения">
                <Input
                  value={form.image_url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, image_url: event.target.value }))
                  }
                />
              </Field>

              <Field label="Эффекты / акценты">
                <Input
                  value={form.effects}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, effects: event.target.value }))
                  }
                />
              </Field>

              <Field label="Типы кожи через запятую">
                <Input
                  value={Array.isArray(form.skin_types) ? form.skin_types.join(", ") : form.skin_types}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      skin_types: splitValue(event.target.value),
                    }))
                  }
                />
              </Field>

              <Field label="Проблемы кожи через запятую">
                <Input
                  value={
                    Array.isArray(form.skin_problems)
                      ? form.skin_problems.join(", ")
                      : form.skin_problems
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      skin_problems: splitValue(event.target.value),
                    }))
                  }
                />
              </Field>

              <Field label="Страна происхождения">
                <Input
                  value={form.country_of_origin}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      country_of_origin: event.target.value,
                    }))
                  }
                />
              </Field>

              <div className="rounded-[1.4rem] border border-[#EEE2D6] bg-[#FFFCF8] p-4">
                <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Статусы карточки
                </p>
                <div className="space-y-3">
                  <ToggleRow
                    checked={form.in_stock}
                    onCheckedChange={(value) => setForm((current) => ({ ...current, in_stock: value }))}
                    label="В наличии"
                  />
                  <ToggleRow
                    checked={form.featured}
                    onCheckedChange={(value) => setForm((current) => ({ ...current, featured: value }))}
                    label="Избранное"
                  />
                  <ToggleRow
                    checked={form.new_arrival}
                    onCheckedChange={(value) => setForm((current) => ({ ...current, new_arrival: value }))}
                    label="Новинка"
                  />
                  <ToggleRow
                    checked={form.bestseller}
                    onCheckedChange={(value) => setForm((current) => ({ ...current, bestseller: value }))}
                    label="Бестселлер"
                  />
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-[#EEE2D6] bg-[#FFFCF8] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Предпросмотр
                </p>
                <div className="overflow-hidden rounded-[1.1rem] bg-[#F5EEE6]">
                  {form.image_url ? (
                    <img src={form.image_url} alt={form.name || "preview"} className="h-52 w-full object-cover" />
                  ) : (
                    <div className="flex h-52 items-center justify-center font-serif text-4xl text-muted-foreground/20">
                      Y
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="mt-2 w-full">
            {editing ? "Сохранить изменения" : "Создать товар"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ children, label }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({ checked, label, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function splitValue(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeList(value) {
  return Array.isArray(value) ? value : splitValue(String(value || ""));
}
