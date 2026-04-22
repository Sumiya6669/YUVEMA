import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, LayoutDashboard, MapPin, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import BrandMark from "@/components/branding/BrandMark";
import { navigationLinks, siteConfig } from "@/config/site";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/services/api/client";

const toolbarItems = [
  { to: "/catalog", icon: Search, hidden: true },
  { to: "/wishlist", icon: Heart },
  { to: "/cart", icon: ShoppingBag },
  { to: "/account", icon: User },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAdmin, isAuthenticated } = useAuth();

  const { data: cartItems = [] } = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiClient.entities.CartItem.list(),
    initialData: [],
  });
  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => apiClient.entities.WishlistItem.list(),
    initialData: [],
  });

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler);

    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-[#EEE3D6] bg-[#FFFDF9]/88 shadow-soft-lg backdrop-blur-2xl"
            : "bg-transparent"
        }`}
      >
        <div className="border-b border-white/70 bg-white/55 backdrop-blur-md">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-[10px] uppercase tracking-[0.2em] text-muted-foreground lg:px-12">
            <span className="hidden sm:flex sm:items-center sm:gap-2">
              <MapPin className="h-3 w-3" />
              {siteConfig.location}
            </span>
            <a
              href={siteConfig.twoGisLink}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-stone"
            >
              Открыть в 2GIS
            </a>
            <Link to="/b2b" className="transition-colors hover:text-stone">
              B2B для клиник и косметологов
            </Link>
          </div>
        </div>

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
          <Link to="/" className="transition-transform duration-300 hover:scale-[1.01]">
            <BrandMark className="hidden sm:inline-flex" />
            <BrandMark compact className="sm:hidden" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {isAdmin && (
              <Link
                to="/admin"
                className="group relative pb-1 text-[11px] uppercase tracking-[0.22em] text-[#8A6B48] transition-colors duration-300 hover:text-stone"
              >
                Админка
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-center rounded-full bg-gradient-to-r from-transparent via-gold to-transparent transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            )}
            {navigationLinks.map((link) => {
              const active = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`group relative pb-1 text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 ${
                    active
                      ? "font-semibold text-stone"
                      : "text-muted-foreground hover:text-stone"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute inset-x-0 -bottom-0.5 h-px origin-center rounded-full bg-gradient-to-r from-transparent via-gold to-transparent transition-transform duration-300 ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            {toolbarItems.map(({ to, icon: Icon, hidden }) => {
              const count = to === "/cart" ? cartCount : to === "/wishlist" ? wishlist.length : 0;

              return (
                <Link
                  key={to}
                  to={to}
                  title={
                    to === "/account" ? (isAuthenticated ? "Аккаунт" : "Войти") : undefined
                  }
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-white/70 text-stone/75 shadow-soft transition-all duration-300 hover:border-[#E7D7C5] hover:bg-white hover:text-stone hover:shadow-soft-md ${
                    hidden ? "hidden sm:flex" : ""
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.45} />
                  {count > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-[#F4E6C8] px-1 text-[8px] font-semibold leading-none text-[#6E573C]">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-white/70 text-stone/75 shadow-soft transition-all duration-300 hover:border-[#E7D7C5] hover:bg-white hover:text-stone hover:shadow-soft-md lg:hidden"
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
          >
            <div
              className="absolute inset-0 bg-white/60 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="absolute bottom-0 right-0 top-0 flex w-80 flex-col bg-marble-light"
            >
              <div className="flex items-center justify-between border-b border-[#EEE3D6] px-6 py-6">
                <BrandMark compact />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone shadow-soft transition-all hover:bg-[#F8F1E8]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex flex-col gap-6 px-6 pt-10">
                {navigationLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <Link
                      to={link.path}
                      className="font-serif text-[2rem] text-stone transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto space-y-4 px-6 pb-10">
                <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-white/82 p-5 shadow-soft">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    Шоурум YUVEMA
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-stone/80">{siteConfig.location}</p>
                  <a
                    href={siteConfig.twoGisLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-[11px] uppercase tracking-[0.18em] text-[#8B6B47]"
                  >
                    Смотреть в 2GIS
                  </a>
                </div>

                <div className="rounded-[1.5rem] border border-[#EEE2D6] bg-white/82 p-5 shadow-soft">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    Связаться
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-stone/80">{siteConfig.email}</p>
                </div>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-3 rounded-full border border-[#DFC4A2] bg-[#F7EBDD] px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-[#664F39] shadow-soft"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Открыть админку
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
