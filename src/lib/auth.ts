import { apiFetch } from "@/lib/api";

export type AuthTenant = {
  id: string;
  tenant_key: string;
  tenant_name: string;
  role: string;
};

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
  global_role: string;
  is_active?: boolean;
};

export type AuthMeResponse = {
  ok: boolean;
  user: AuthUser;
  tenants: AuthTenant[];
};

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const res = await apiFetch("/auth/me", {
    method: "GET",
  });

  const data = await res.json();

  if (!res.ok || !data?.ok || !data?.user) {
    throw new Error(data?.detail || data?.error || "Not authenticated");
  }

  return data as AuthMeResponse;
}

export function isPlatformAdmin(role?: string) {
  const r = (role || "").toLowerCase();
  return r === "platform_admin" || r === "admin";
}