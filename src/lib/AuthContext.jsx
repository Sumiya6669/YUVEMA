import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/services/api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refreshUser = async (nextSession = session) => {
    if (!nextSession) {
      setUser(null);
      return null;
    }

    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      setAuthError({
        type: "unknown",
        message: error.message || "Не удалось загрузить профиль",
      });
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await apiClient.auth.getSession();

        if (!isMounted) {
          return;
        }

        setSession(initialSession);
        await refreshUser(initialSession);
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    };

    const { data } = apiClient.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await refreshUser(nextSession);
      setIsLoadingAuth(false);
    });

    bootstrap();

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      authChecked: !isLoadingAuth,
      appPublicSettings: null,
      isAdmin: user?.role === "admin",
      isB2BClient: user?.role === "b2b_client" && user?.wholesale_approved,
      logout: async (shouldRedirect = true) => {
        await apiClient.auth.logout(shouldRedirect ? "/" : undefined);
      },
      navigateToLogin: (returnTo = window.location.pathname) =>
        apiClient.auth.redirectToLogin(returnTo),
      checkUserAuth: () => refreshUser(session),
      checkAppState: () => refreshUser(session),
      signIn: apiClient.auth.login,
      signUp: apiClient.auth.register,
      updateProfile: apiClient.auth.updateProfile,
    }),
    [authError, isLoadingAuth, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
