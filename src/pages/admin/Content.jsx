import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  FileText,
  Globe,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/services/api/client";
import { formatDate, slugify } from "@/pages/admin/adminUtils";

const emptyPost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  category: "",
  published: false,
  tagsInput: "",
};

export default function Content() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(emptyPost);

  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => apiClient.entities.BlogPost.list("-created_date", 200),
    initialData: [],
  });

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          post.title?.toLowerCase().includes(query) ||
          post.category?.toLowerCase().includes(query);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "published" ? post.published : !post.published);

        return matchesSearch && matchesStatus;
      }),
    [posts, search, statusFilter],
  );

  const stats = useMemo(() => {
    const categories = new Set(posts.map((post) => post.category).filter(Boolean));

    return [
      {
        label: "Всего статей",
        value: posts.length,
        note: "Полная база контента",
      },
      {
        label: "Опубликовано",
        value: posts.filter((post) => post.published).length,
        note: "Видны на витрине блога",
      },
      {
        label: "Черновики",
        value: posts.filter((post) => !post.published).length,
        note: "Нуждаются в доработке",
      },
      {
        label: "Категории",
        value: categories.size,
        note: "Тематическое разделение материалов",
      },
    ];
  }, [posts]);

  function openNew() {
    setEditing(null);
    setForm(emptyPost);
    setDialogOpen(true);
  }

  function openEdit(post) {
    setEditing(post);
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      cover_image: post.cover_image || "",
      category: post.category || "",
      published: Boolean(post.published),
      tagsInput: Array.isArray(post.tags) ? post.tags.join(", ") : "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      excerpt: form.excerpt.trim(),
      content: form.content,
      cover_image: form.cover_image.trim(),
      category: form.category.trim(),
      published: Boolean(form.published),
      tags: form.tagsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (!payload.title || !payload.content) {
      toast.error("Заполните заголовок и основной текст статьи");
      return;
    }

    if (editing) {
      await apiClient.entities.BlogPost.update(editing.id, payload);
      toast.success("Статья обновлена");
    } else {
      await apiClient.entities.BlogPost.create(payload);
      toast.success("Статья создана");
    }

    queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyPost);
  }

  async function handleDelete(id) {
    await apiClient.entities.BlogPost.delete(id);
    queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    toast.success("Статья удалена");
  }

  return (
    <div className="space-y-6">
      <div className="premium-panel px-7 py-7">
        <p className="text-[10px] uppercase tracking-[0.24em] text-primary">Редакционный блок</p>
        <h1 className="mt-4 font-serif text-[2.5rem] leading-none text-stone">Контент и блог</h1>
        <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground">
          Этот экран рассчитан на быстрый выпуск статьи: заголовок, обложка, slug, теги,
          черновик и публикация без отдельной CMS.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-stone">{stat.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stat.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="premium-panel px-5 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по заголовку или категории"
              className="pl-11"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все материалы</SelectItem>
                <SelectItem value="published">Опубликованные</SelectItem>
                <SelectItem value="draft">Черновики</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Новая статья
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[1.2rem] bg-[#F5EEE6]">
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground/35" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-stone">{post.title}</p>
                  <Badge variant={post.published ? "default" : "outline"}>
                    {post.published ? "Опубликовано" : "Черновик"}
                  </Badge>
                  {post.category && <Badge variant="secondary">{post.category}</Badge>}
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt || "Добавьте короткое описание, чтобы статья выглядела завершённой на витрине."}
                </p>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Slug: {post.slug || "—"}</span>
                  <span>Дата: {formatDate(post.created_date, "dd.MM.yyyy")}</span>
                  <span>Тегов: {Array.isArray(post.tags) ? post.tags.length : 0}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {post.published && post.id && (
                  <Button asChild variant="ghost">
                    <a href={`/blog/${post.id}`} target="_blank" rel="noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" onClick={() => openEdit(post)}>
                  <Pencil className="h-4 w-4" />
                  Изменить
                </Button>
                <Button variant="ghost" onClick={() => handleDelete(post.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPosts.length === 0 && (
          <div className="premium-panel px-8 py-14 text-center">
            <p className="font-serif text-[2rem] text-stone">Контент не найден</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Попробуйте другой запрос или создайте новую статью прямо из админки.
            </p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать статью" : "Новая статья"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Заголовок">
                  <Input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, title: event.target.value }))
                    }
                  />
                </Field>

                <Field label="Slug">
                  <Input
                    value={form.slug}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, slug: event.target.value }))
                    }
                    placeholder="Будет создан автоматически"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Категория">
                  <Input
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category: event.target.value }))
                    }
                  />
                </Field>

                <Field label="Теги через запятую">
                  <Input
                    value={form.tagsInput}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, tagsInput: event.target.value }))
                    }
                  />
                </Field>
              </div>

              <Field label="Краткое описание">
                <Textarea
                  rows={4}
                  value={form.excerpt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, excerpt: event.target.value }))
                  }
                />
              </Field>

              <Field label="Контент (Markdown)">
                <Textarea
                  rows={18}
                  value={form.content}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, content: event.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="space-y-4">
              <Field label="URL обложки">
                <Input
                  value={form.cover_image}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, cover_image: event.target.value }))
                  }
                />
              </Field>

              <div className="rounded-[1.4rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Статус публикации
                </p>

                <div className="mt-4 flex items-center justify-between rounded-[1rem] border border-[#EEE2D6] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-stone">Опубликовать материал</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Если выключено, статья останется черновиком и не появится на витрине.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(form.published)}
                    onCheckedChange={(value) =>
                      setForm((current) => ({ ...current, published: value }))
                    }
                  />
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Быстрый предпросмотр
                </p>
                <div className="mt-4 overflow-hidden rounded-[1.2rem] bg-[#F5EEE6]">
                  {form.cover_image ? (
                    <img
                      src={form.cover_image}
                      alt={form.title || "preview"}
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center font-serif text-5xl text-muted-foreground/20">
                      Y
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    {form.slug ? `/${form.slug}` : "Slug будет сгенерирован по заголовку"}
                  </div>
                  <h3 className="font-serif text-[1.7rem] leading-[1.02] text-stone">
                    {form.title || "Заголовок статьи"}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {form.excerpt ||
                      "Краткое описание помогает превратить статью в сильную карточку на странице блога."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={handleSave}>
            {editing ? "Сохранить изменения" : "Создать статью"}
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
