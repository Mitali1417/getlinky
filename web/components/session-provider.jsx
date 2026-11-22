"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { logError } from "@/lib/logger";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const me = await api("/user/me");
      setUser(me.user || null);
      try {
        const data = await api("/url");
        setUrls(data.urls || []);
      } catch (listError) {
        logError("list urls", listError);
        setUrls([]);
        setError(listError.message || "Could not load links");
      }
    } catch (authError) {
      setUser(null);
      setUrls([]);
      if (authError.status && authError.status !== 401) {
        logError("session", authError);
        setError(authError.message || "Could not check your session");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await api("/user/logout", { method: "POST" });
    setUser(null);
    setUrls([]);
    setError("");
  }, []);

  const value = useMemo(
    () => ({
      user,
      urls,
      setUrls,
      loading,
      error,
      authenticated: Boolean(user),
      refresh,
      logout,
    }),
    [user, urls, loading, error, refresh, logout]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
