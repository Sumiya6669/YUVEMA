import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Clock3,
  CreditCard,
  Eye,
  Search,
  ShoppingCart,
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
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/services/api/client";
import {
  formatDate,
  formatMoney,
  getOrderStatusClass,
  getPaymentStatusClass,
  orderStatusLabels,
  paymentStatusLabels,
} from "@/pages/admin/adminUtils";

export default function Orders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => apiClient.entities.Order.list("-created_date", 500),
    initialData: [],
  });

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          order.customer_name?.toLowerCase().includes(query) ||
          order.customer_email?.toLowerCase().includes(query) ||
          order.order_number?.toLowerCase().includes(query);
        const matchesStatus =
          statusFilter === "all" || order.status === statusFilter;
        const matchesType = typeFilter === "all" || order.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
      }),
    [orders, search, statusFilter, typeFilter],
  );

  const stats = useMemo(() => {
    const paidRevenue = orders
      .filter((order) => order.payment_status === "paid")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return [
      {
        icon: ShoppingCart,
        label: "Всего заказов",
        value: orders.length,
        note: `${filteredOrders.length} в текущем фильтре`,
      },
      {
        icon: Clock3,
        label: "Ожидают обработки",
        value: orders.filter((order) => order.status === "pending").length,
        note: "Нужен быстрый операционный проход",
      },
      {
        icon: CreditCard,
        label: "Оплаченная выручка",
        value: formatMoney(paidRevenue),
        note: `${orders.filter((order) => order.payment_status === "unpaid").length} заказов без оплаты`,
      },
      {
        icon: Briefcase,
        label: "B2B заказы",
        value: orders.filter((order) => order.type === "b2b").length,
        note: "Отдельный контур для партнёров и клиник",
      },
    ];
  }, [filteredOrders.length, orders]);

  async function updateOrder(payload) {
    if (!selectedOrder) {
      return;
    }

    await apiClient.entities.Order.update(selectedOrder.id, payload);
    setSelectedOrder((current) => (current ? { ...current, ...payload } : current));
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success("Заказ обновлён");
  }

  return (
    <div className="space-y-6">
      <div className="premium-panel px-7 py-7">
        <p className="text-[10px] uppercase tracking-[0.24em] text-primary">Операционный центр</p>
        <h1 className="mt-4 font-serif text-[2.5rem] leading-none text-stone">Заказы и статусы</h1>
        <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground">
          Здесь собраны заказы с деталями по клиенту, оплате, доставке и составу корзины.
          Экран рассчитан на быстрый ежедневный проход без лишних кликов.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
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
              placeholder="Поиск по номеру, клиенту или email"
              className="pl-11"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {Object.entries(orderStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="b2c">B2C</SelectItem>
                <SelectItem value="b2b">B2B</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-mono text-sm font-medium text-stone">
                    {order.order_number || "—"}
                  </p>
                  <Badge variant="outline" className={getOrderStatusClass(order.status)}>
                    {orderStatusLabels[order.status] || order.status}
                  </Badge>
                  <Badge variant="outline" className={getPaymentStatusClass(order.payment_status)}>
                    {paymentStatusLabels[order.payment_status] || order.payment_status}
                  </Badge>
                  <Badge variant="outline">
                    {(order.type || "b2c").toUpperCase()}
                  </Badge>
                </div>

                <div className="mt-3 grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em]">Клиент</p>
                    <p className="mt-1 text-sm text-stone">{order.customer_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em]">Email</p>
                    <p className="mt-1 text-sm text-stone">{order.customer_email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em]">Сумма</p>
                    <p className="mt-1 text-sm text-stone">{formatMoney(order.total)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em]">Создан</p>
                    <p className="mt-1 text-sm text-stone">
                      {formatDate(order.created_date, "dd.MM.yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 lg:justify-end">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Позиций
                  </p>
                  <p className="mt-1 text-sm text-stone">{order.items?.length || 0}</p>
                </div>

                <Button variant="outline" onClick={() => setSelectedOrder(order)}>
                  <Eye className="h-4 w-4" />
                  Открыть
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <div className="premium-panel px-8 py-14 text-center">
            <p className="font-serif text-[2rem] text-stone">Заказы не найдены</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Измените фильтры или очистите поиск, чтобы увидеть весь поток заказов.
            </p>
          </div>
        )}
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Заказ {selectedOrder?.order_number || "—"}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Клиент и доставка
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <DetailItem label="Клиент" value={selectedOrder.customer_name} />
                    <DetailItem label="Email" value={selectedOrder.customer_email} />
                    <DetailItem label="Телефон" value={selectedOrder.customer_phone} />
                    <DetailItem label="Город" value={selectedOrder.shipping_city} />
                    <DetailItem
                      label="Адрес"
                      value={selectedOrder.shipping_address}
                      className="md:col-span-2"
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Состав заказа
                  </p>
                  <div className="mt-4 space-y-3">
                    {(selectedOrder.items || []).map((item, index) => (
                      <div
                        key={`${selectedOrder.id}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-[1rem] border border-[#EEE2D6] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-stone">
                            {item.product_name || "Позиция"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.quantity || 1} шт. × {formatMoney(item.price)}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-stone">
                          {formatMoney((item.price || 0) * (item.quantity || 1))}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-[#EEE2D6] pt-4 text-sm md:grid-cols-3">
                    <DetailItem label="Подытог" value={formatMoney(selectedOrder.subtotal)} />
                    <DetailItem
                      label="Доставка"
                      value={formatMoney(selectedOrder.shipping_cost)}
                    />
                    <DetailItem label="Итого" value={formatMoney(selectedOrder.total)} />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Управление статусами
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Статус заказа</Label>
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) => updateOrder({ status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(orderStatusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Статус оплаты</Label>
                      <Select
                        value={selectedOrder.payment_status}
                        onValueChange={(value) => updateOrder({ payment_status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(paymentStatusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Способ оплаты</Label>
                      <Input
                        value={selectedOrder.payment_method || ""}
                        onChange={(event) =>
                          setSelectedOrder((current) =>
                            current
                              ? { ...current, payment_method: event.target.value }
                              : current,
                          )
                        }
                        onBlur={() =>
                          updateOrder({ payment_method: selectedOrder.payment_method || "" })
                        }
                        placeholder="Например, Kaspi, наличные, счёт"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Комментарий к заказу
                  </p>
                  <Textarea
                    rows={6}
                    className="mt-4"
                    value={selectedOrder.notes || ""}
                    onChange={(event) =>
                      setSelectedOrder((current) =>
                        current ? { ...current, notes: event.target.value } : current,
                      )
                    }
                    onBlur={() => updateOrder({ notes: selectedOrder.notes || "" })}
                    placeholder="Внутренние заметки, уточнения по доставке или оплате"
                  />
                </div>

                <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-[#FFFCF8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Служебная информация
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <DetailItem label="Тип заказа" value={(selectedOrder.type || "b2c").toUpperCase()} />
                    <DetailItem
                      label="Создан"
                      value={formatDate(selectedOrder.created_date, "dd.MM.yyyy HH:mm")}
                    />
                    <DetailItem
                      label="Обновлён"
                      value={formatDate(selectedOrder.updated_date, "dd.MM.yyyy HH:mm")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ className = "", label, value }) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-stone">{value || "—"}</p>
    </div>
  );
}
