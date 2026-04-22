import React, { Suspense, lazy } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import RequireRole from "@/components/auth/RequireRole";
import { AuthProvider } from "@/lib/AuthContext";
import { queryClientInstance } from "@/lib/query-client";

const AdminLayout = lazy(() => import("@/components/layout/AdminLayout"));
const PublicLayout = lazy(() => import("@/components/layout/PublicLayout"));
const PageNotFound = lazy(() => import("@/lib/PageNotFound"));

const Account = lazy(() => import("@/pages/Account"));
const About = lazy(() => import("@/pages/About"));
const B2B = lazy(() => import("@/pages/B2B"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogDetail = lazy(() => import("@/pages/BlogDetail"));
const Cart = lazy(() => import("@/pages/Cart"));
const Catalog = lazy(() => import("@/pages/Catalog"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Contacts = lazy(() => import("@/pages/Contacts"));
const Home = lazy(() => import("@/pages/Home"));
const OrderSuccess = lazy(() => import("@/pages/OrderSuccess"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));

const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminApplications = lazy(() => import("@/pages/admin/Applications"));
const AdminClients = lazy(() => import("@/pages/admin/Clients"));
const AdminContent = lazy(() => import("@/pages/admin/Content"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));

function RouteLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          YUVEMA
        </p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/about" element={<About />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/account" element={<Account />} />
        <Route path="/b2b" element={<B2B />} />
        <Route path="/recommendation" element={<Navigate replace to="/" />} />
      </Route>

      <Route
        element={
          <RequireRole roles={["admin"]}>
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/clients" element={<AdminClients />} />
        <Route path="/admin/content" element={<AdminContent />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/applications" element={<AdminApplications />} />
        <Route
          path="/admin/ai"
          element={<Navigate replace to="/admin/applications" />}
        />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Suspense fallback={<RouteLoader />}>
            <AppRoutes />
          </Suspense>
        </Router>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
