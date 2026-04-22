import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/services/api/client";
import {
  formatMoney,
  orderStatusLabels,
} from "@/pages/admin/adminUtils";

const colors = ["#D8A3AF", "#E8C8B8", "#9D7A4E", "#A8CEB5", "#E7D2C5", "#94A3B8"];

export default function Analytics() {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => apiClient.entities.Order.list("-created_date", 1000),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => apiClient.entities.Product.list("-created_date", 500),
    initialData: [],
  });

  const analytics = useMemo(() => {
    const categoryRevenue = {};
    const productSales = {};

    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const product = products.find((candidate) => candidate.id === item.product_id);
        const category = product?.category || "Другое";
        categoryRevenue[category] =
          (categoryRevenue[category] || 0) + (item.price || 0) * (item.quantity || 1);

        productSales[item.product_name] =
          (productSales[item.product_name] || 0) + (item.quantity || 1);
      });
    });

    return {
      categoryData: Object.entries(categoryRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 6),
      topProducts: Object.entries(productSales)
        .map(([name, qty]) => ({ name: name?.slice(0, 24), qty }))
        .sort((left, right) => right.qty - left.qty)
        .slice(0, 8),
      typeData: [
        {
          name: "B2C",
          value: orders.filter((order) => order.type !== "b2b").length,
        },
        {
          name: "B2B",
          value: orders.filter((order) => order.type === "b2b").length,
        },
      ],
      statusData: Object.entries(
        orders.reduce((accumulator, order) => {
          accumulator[order.status] = (accumulator[order.status] || 0) + 1;
          return accumulator;
        }, {}),
      ).map(([name, value]) => ({
        name: orderStatusLabels[name] || name,
        value,
      })),
      funnelData: [
        { stage: "Заказы", count: orders.length },
        {
          stage: "Оплачены",
          count: orders.filter((order) => order.payment_status === "paid").length,
        },
        {
          stage: "Доставлены",
          count: orders.filter((order) => order.status === "delivered").length,
        },
      ],
    };
  }, [orders, products]);

  return (
    <div className="space-y-6">
      <div className="premium-panel px-7 py-7">
        <p className="text-[10px] uppercase tracking-[0.24em] text-primary">Данные и динамика</p>
        <h1 className="mt-4 font-serif text-[2.5rem] leading-none text-stone">Аналитика</h1>
        <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground">
          Здесь собрана структура выручки, спрос по категориям, распределение заказов и
          динамика по B2C/B2B-сегментам.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Продажи по категориям</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {analytics.categoryData.map((_, index) => (
                    <Cell key={`cat-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Топ продуктов</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topProducts} layout="vertical">
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" fontSize={11} width={120} />
                <Tooltip />
                <Bar dataKey="qty" fill="#D8A3AF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">B2C vs B2B</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.typeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  <Cell fill="#D8A3AF" />
                  <Cell fill="#8F7364" />
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Статусы заказов</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {analytics.statusData.map((_, index) => (
                    <Cell key={`status-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Воронка конверсии</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.funnelData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#D8A3AF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
