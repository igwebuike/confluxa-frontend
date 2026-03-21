"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
  global_role?: string;
  is_active?: boolean;
};

export type AuthTenant = {
  id: string;
  tenant_key: string;
  tenant_name: string;
  role?: string;
};

type AuthMeResponse = {
  ok?: boolean;
  user?: AuthUser;
  tenants?: AuthTenant[];
  detail?: string;
  error?: string;
};

export function useAuthMe() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenants, setTenants] = useState<AuthTenant[]>([]);
  const [error, setError] = useState("");

  const loadAuth = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/auth/me", {
        method: "GET",
      });

      const data: AuthMeResponse = await res.json();

      if (!res.ok || !data.ok || !data.user) {
        setAuthenticated(false);
        setUser(null);
        setTenants([]);
        setError(data.detail || data.error || "Not authenticated");
        return;
      }

      setAuthenticated(true);
      setUser(data.user);
      setTenants(Array.isArray(data.tenants) ? data.tenants : []);
    } catch (err) {
      console.error(err);
      setAuthenticated(false);
      setUser(null);
      setTenants([]);
      setError("Unable to verify session");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  return {
    loading,
    authenticated,
    user,
    tenants,
    error,
    reloadAuth: loadAuth,
  };
}