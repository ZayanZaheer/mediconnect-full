import { createContext, useContext, useMemo, useState } from "react";
import { loadAuth, saveAuth, clearAuth } from "../lib/auth";
import { API_CONFIG } from '../config/api.js';

const AuthCtx = createContext(null);
const API_BASE = API_CONFIG.BASE_URL;

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadAuth());

  const value = useMemo(
    () => ({
      // ==========================
      //  PUBLIC EXPOSED VALUES
      // ==========================
      user: auth?.user || null,
      role: auth?.role || null,
      token: auth?.token || null,
      isAuthenticated: !!auth?.token,

      // ==========================
      //  LOGIN
      // ==========================
      login: async (credentials) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || "Login failed");
        }

        const data = await response.json();

        // 🚨 DO NOT setAuth here
        // 🚨 DO NOT saveAuth here
        // Just return the data

        return {
          token: data.token,
          role: data.user.role,
          user: data.user
        };
      },

      // Add this new function:
      finalizeLogin: (authData) => {
        setAuth(authData);
        saveAuth(authData);
      },


      // ==========================
      //  LOGOUT
      // ==========================
      logout: () => {
        setAuth(null);
        clearAuth();
      },
    }),
    [auth]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
