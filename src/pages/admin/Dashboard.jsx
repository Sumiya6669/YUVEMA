import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  ArrowUpRight,
  FileText,
  Package,
  ShoppingCart,
  UserRoundSearch,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api/client";

const chartColors = ["#D8A3AF", "#E8C8B8", "#9D7A4E", "#A8CEB5", "#E7D2C5"];

export default function Dashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => apiClient.entities.Order.list("-created_date", 500),
    initialData: [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => apiClient.entities.Product.list("-created_date", 500),
    initialData: [],
  });
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiClient.entities.User.list("-created_date", 500),
    initialData: [],
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => apiClient.entities.BlogPost.list("-created_date", 200),
    initialData: [],
  });
  const { data: applications = [] } = useQuery({
    queryKey: ["admin-b2b-applications"],
    queryFn: () => apiClient.entities.B2BApplication.list("-created_date", 200),
    initialData: [],
  });

  const totalRevenue = orders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + (order.total || 0), 0);
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const unpaidOrders = orders.filter((order) => order.payment_status !== "paid").length;
  const drafts = posts.filter((post) => !post.published).length;
  const pendingApplications = applications.filter(
    (application) => application.status === "pending",
  ).length;

  const revenueByDay = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(new Date(), 6 - index);
    const dateString = format(date, "yyyy-MM-dd");
    const dayOrders = orders.filter(
      (order) =>
        order.created_date?.startsWith(dateString) &&
        order.payment_status === "paid",
    );

    return {
      day: format(date, "dd.MM"),
      revenue: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
    };
  });

  const statusData = Object.entries(
    orders.reduce((accumulator, order) => {
      accumulator[order.status] = (accumulator[order.status] || 0) + 1;
      return accumulator;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const stats = [
    {
      label: "Оплаченная выручка",
      value: `${totalRevenue.toLocaleString()} ₸`,
      note: `${unpaidOrders} заказов требуют оплаты`,
      icon: ArrowUpRight,
    },
    {
      label: "Заказы",
      value: orders.length,
      note: `${pendingOrders} ожидают обработки`,
      icon: ShoppingCart,
    },
    {
      label: "Клиенты",
      value: users.length,
      note: `${applications.length} B2B-заявок всего`,
      icon: Users,
    },
    {
      label: "Каталог и контент",
      value: `${products.length} / ${posts.length}`,
      note: `${drafts} черновиков, ${pendingApplications} заявок pending`,
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="premium-panel px-7 py-7">
        <p className="text-[10px] uppercase tracking-[0.24em] text-primary">Админка YUVEMA</p>
        <h1 className="mt-4 font-serif text-[2.5rem] leading-none text-stone">Обзор платформы</h1>
        <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground">
          Здесь собраны основные показатели по продажам, каталогу, контенту, B2B-заявкам и
          клиентам. Это главный экран для ежедневной работы команды.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
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

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Выручка за 7 дней</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueByDay}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => `${value.toLocaleString()} ₸`} />
                <Bar dataKey="revenue" fill="#D8A3AF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статусы заказов</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={82}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((_, index) => (
                    <Cell key={`status-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              {
                to: "/admin/products",
                title: "Каталог",
                text: "Добавить товар, обновить карточку или включить новинку в витрину.",
                icon: Package,
              },
              {
                to: "/admin/content",
                title: "Контент",
                text: "Опубликовать статью, доработать черновик или обновить визуал обложки.",
                icon: FileText,
              },
              {
                to: "/admin/applications",
                title: "Лиды и заявки",
                text: "Проверить B2B-заявки и входящие сообщения с сайта.",
                icon: UserRoundSearch,
              },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-[1.2rem] border border-[#EEE2D6] bg-[#FFFCF8] px-4 py-4 transition-colors hover:bg-[#FBF5EE]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF0E3] shadow-soft">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-stone">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Последние заказы</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/orders">Все заказы</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.slice(0, 8).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-[1rem] border border-[#EEE2D6] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-stone">{order.order_number || "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-stone">
                    {order.total?.toLocaleString()} ₸
                  </p>
                  <div className="mt-1 flex justify-end gap-2">
                    <Badge variant="outline">{order.status}</Badge>
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
