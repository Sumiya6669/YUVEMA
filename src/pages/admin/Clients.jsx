import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Eye, Search, Shield, Users, Wallet } from "lucide-react";
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
import { apiClient } from "@/services/api/client";
import {
  formatDate,
  formatMoney,
  getRoleClass,
  roleLabels,
} from "@/pages/admin/adminUtils";

export default function Clients() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiClient.entities.User.list("-created_date", 500),
    initialData: [],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => apiClient.entities.Order.list("-created_date", 500),
    initialData: [],
  });

  const clientStats = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    return [
      {
        icon: Users,
        label: "Всего клиентов",
        value: users.length,
        note: "Все профили, созданные через Supabase Auth",
      },
      {
        icon: Shield,
        label: "Администраторы",
        value: users.filter((user) => user.role === "admin").length,
        note: "Доступ к операционной панели",
      },
      {
        icon: Building2,
        label: "B2B клиенты",
        value: users.filter((user) => user.role === "b2b_client").length,
        note: `${users.filter((user) => user.wholesale_approved).length} с активным оптом`,
      },
      {
        icon: Wallet,
        label: "Оборот клиентов",
        value: formatMoney(totalSpent),
        note: "Суммарно по заказам в базе",
      },
    ];
  }, [orders, users]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.company_name?.toLowerCase().includes(query);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;

        return matchesSearch && matchesRole;
      }),
    [roleFilter, search, users],
  );

  function getUserOrders(email) {
    return orders.filter((order) => order.customer_email === email);
  }

  function getSpend(email) {
    return getUserOrders(email).reduce((sum, order) => sum + Number(order.total || 0), 0);
  }

  async function saveClient() {
    if (!selectedClient) {
      return;
    }

    await apiClient.entities.User.update(selectedClient.id, {
      role: selectedClient.role,
      wholesale_approved: selectedClient.wholesale_approved,
      full_name: selectedClient.full_name,
      company_name: selectedClient.company_name,
      company_bin: selectedClient.company_bin,
      city: selectedClient.city,
      phone: selectedClient.phone,
    });

    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    toast.success("Карточка клиента обновлена");
  }

  return (
    <div className="space-y-6">
      <div className="premium-panel px-7 py-7">
        <p className="text-[10px] uppercase tracking-[0.24em] text-primary">CRM и роли</p>
        <h1 className="mt-4 font-serif text-[2.5rem] leading-none text-stone">Клиенты и доступы</h1>
        <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground">
          Здесь удобно управлять ролями, B2B-статусом, контактами и базовыми данными профиля.
          Экран собран так, чтобы операционно вести и розничных клиентов, и партнёров.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {clientStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF0E3] shadow-soft">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
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
              placeholder="Поиск по имени, email или компании"
              className="pl-11"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все роли</SelectItem>
              {Object.entries(roleLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredUsers.map((user) => {
          const userOrders = getUserOrders(user.email);
          const spend = getSpend(user.email);

          return (
            <Card key={user.id}>
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-stone">
                      {user.full_name || user.email || "Клиент"}
                    </p>
                    <Badge variant="outline" className={getRoleClass(user.role)}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                    {user.wholesale_approved && (
                      <Badge variant="secondary">Оптовый доступ активен</Badge>
                    )}
                  </div>

                  <div className="mt-3 grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em]">Email</p>
                      <p className="mt-1 text-sm text-stone">{user.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em]">Компания</p>
                      <p className="mt-1 text-sm text-stone">{user.company_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em]">Заказов</p>
                      <p className="mt-1 text-sm text-stone">{userOrders.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em]">Оборот</p>
                      <p className="mt-1 text-sm text-stone">{formatMoney(spend)}</p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" onClick={() => setSelectedClient(user)}>
                  <Eye className="h-4 w-4" />
                  Открыть
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="premium-panel px-8 py-14 text-center">
            <p className="font-serif text-[2rem] text-stone">Клиенты не найдены</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Попробуйте смягчить поиск или сменить фильтр по ролям.
            </p>
          </div>
        )}
      </div>

      <Dialog open={Boolean(selectedClient)} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedClient?.full_name || selectedClient?.email}</DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Основной профиль
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field label="Имя">
                      <Input
                        value={selectedClient.full_name || ""}
                        onChange={(event) =>
                          setSelectedClient((current) =>
                            current ? { ...current, full_name: event.target.value } : current,
                          )
                        }
                      />
                    </Field>
                    <Field label="Email">
                      <Input value={selectedClient.email || ""} disabled />
                    </Field>
                    <Field label="Телефон">
                      <Input
                        value={selectedClient.phone || ""}
                        onChange={(event) =>
                          setSelectedClient((current) =>
                            current ? { ...current, phone: event.target.value } : current,
                          )
                        }
                      />
                    </Field>
                    <Field label="Город">
                      <Input
                        value={selectedClient.city || ""}
                        onChange={(event) =>
                          setSelectedClient((current) =>
                            current ? { ...current, city: event.target.value } : current,
                          )
                        }
                      />
                    </Field>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    B2B и компания
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field label="Компания">
                      <Input
                        value={selectedClient.company_name || ""}
                        onChange={(event) =>
                          setSelectedClient((current) =>
                            current
                              ? { ...current, company_name: event.target.value }
                              : current,
                          )
                        }
                      />
                    </Field>
                    <Field label="БИН">
                      <Input
                        value={selectedClient.company_bin || ""}
                        onChange={(event) =>
                          setSelectedClient((current) =>
                            current
                              ? { ...current, company_bin: event.target.value }
                              : current,
                          )
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Права доступа
                  </p>
                  <div className="mt-4 space-y-4">
                    <Field label="Роль">
                      <Select
                        value={selectedClient.role || "user"}
                        onValueChange={(value) =>
                          setSelectedClient((current) =>
                            current ? { ...current, role: value } : current,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <div className="flex items-center justify-between rounded-[1rem] border border-[#EEE2D6] px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-stone">Активировать оптовый доступ</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Влияет на B2B-условия и доступ к оптовым ценам
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(selectedClient.wholesale_approved)}
                        onCheckedChange={(value) =>
                          setSelectedClient((current) =>
                            current ? { ...current, wholesale_approved: value } : current,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    История клиента
                  </p>
                  <div className="mt-4 space-y-3">
                    <DetailRow
                      label="Дата регистрации"
                      value={formatDate(selectedClient.created_date, "dd.MM.yyyy HH:mm")}
                    />
                    <DetailRow
                      label="Количество заказов"
                      value={String(getUserOrders(selectedClient.email).length)}
                    />
                    <DetailRow
                      label="Суммарный оборот"
                      value={formatMoney(getSpend(selectedClient.email))}
                    />
                  </div>

                  <div className="mt-5 space-y-2">
                    {getUserOrders(selectedClient.email)
                      .slice(0, 5)
                      .map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between rounded-[1rem] border border-[#EEE2D6] px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-stone">{order.order_number}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(order.created_date, "dd.MM.yyyy HH:mm")}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-stone">
                            {formatMoney(order.total)}
                          </p>
                        </div>
                      ))}

                    {getUserOrders(selectedClient.email).length === 0 && (
                      <p className="text-sm text-muted-foreground">У клиента пока нет заказов.</p>
                    )}
                  </div>
                </div>

                <Button className="w-full" onClick={saveClient}>
                  Сохранить изменения
                </Button>
              </div>
            </div>
          )}
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

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-[#EEE2D6] px-4 py-3">
      <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className="text-sm text-stone">{value || "—"}</span>
    </div>
  );
}
