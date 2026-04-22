import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  UserRoundSearch,
  Users,
} from "lucide-react";
import BrandMark from "@/components/branding/BrandMark";
import { useAuth } from "@/lib/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Обзор", path: "/admin" },
  { icon: ShoppingCart, label: "Заказы", path: "/admin/orders" },
  { icon: Package, label: "Каталог", path: "/admin/products" },
  { icon: Users, label: "Клиенты", path: "/admin/clients" },
  { icon: FileText, label: "Контент", path: "/admin/content" },
  { icon: BarChart3, label: "Аналитика", path: "/admin/analytics" },
  { icon: UserRoundSearch, label: "Лиды и заявки", path: "/admin/applications" },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#FBF7F1]">
      <aside
        className={`fixed bottom-0 left-0 top-0 z-40 flex flex-col border-r border-[#ECE1D5] bg-[#FFFDF9] transition-all duration-300 ${
          collapsed ? "w-[88px]" : "w-[292px]"
        }`}
      >
        <div className="border-b border-[#ECE1D5] px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <BrandMark compact={collapsed} />
              {!collapsed && (
                <>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Admin panel
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Управление каталогом, заказами, клиентами и контентом.
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F1E8] text-muted-foreground transition-colors hover:bg-[#EFE3D4]"
              onClick={() => setCollapsed((current) => !current)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="border-b border-[#ECE1D5] px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Активный аккаунт
            </p>
            <p className="mt-2 text-sm font-medium text-stone">{user?.full_name || user?.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-[1rem] px-3 py-3 text-sm transition-all ${
                  isActive
                    ? "bg-[#F8ECDD] font-medium text-[#654D38] shadow-soft"
                    : "text-muted-foreground hover:bg-white hover:text-stone"
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#9D7A4E]" : ""}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-[#ECE1D5] p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-[1rem] px-3 py-3 text-sm text-muted-foreground transition-all hover:bg-white hover:text-stone"
          >
            <Globe className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Открыть сайт</span>}
          </Link>

          <button
            type="button"
            onClick={() => logout(true)}
            className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-sm text-muted-foreground transition-all hover:bg-[#FDEDEA] hover:text-[#C05060]"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-[88px]" : "ml-[292px]"}`}>
        <div className="min-h-screen p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
