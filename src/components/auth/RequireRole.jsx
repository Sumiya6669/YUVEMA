import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

function LoadingScreen() {
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

export default function RequireRole({ roles = [], children }) {
  const location = useLocation();
  const { isLoadingAuth, isAuthenticated, user } = useAuth();

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/?auth=login&next=${encodeURIComponent(next)}`} />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate replace to="/account?adminDenied=1" />;
  }

  return children || <Outlet />;
}
