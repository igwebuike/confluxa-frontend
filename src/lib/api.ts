// lib/api.ts
// API client with tenant context and authentication

const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://confluxa-core.onrender.com";

function isBrowser() {
  return typeof window !== "undefined";
}

function getTenantKeyFromUrl(): string | null {
  if (!isBrowser()) return null;
  const url = new URL(window.location.href);
  return url.searchParams.get("tenant_key");
}

function getStoredTenantKey(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem("tenant_key");
}

export function getEffectiveTenantKey(): string | null {
  const fromUrl = getTenantKeyFromUrl();
  if (fromUrl) {
    if (getStoredTenantKey() !== fromUrl) {
      localStorage.setItem("tenant_key", fromUrl);
    }
    return fromUrl;
  }
  return getStoredTenantKey();
}

export type ApiFetchOptions = RequestInit & {
  tenantKey?: string | null;
  enforceTenant?: boolean;
  isAdminView?: boolean;
};

export async function apiFetch(
  path: string,
  init: ApiFetchOptions = {}
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  
  let tenantKey = init.tenantKey;
  if (tenantKey === undefined) {
    tenantKey = getEffectiveTenantKey();
  }
  
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  const url = new URL(
    `${RAW_API_BASE_URL}${cleanPath}`,
    isBrowser() ? window.location.origin : "http://localhost:3000"
  );
  
  // Add tenant_key to URL if present
  if (tenantKey) {
    url.searchParams.set("tenant_key", tenantKey);
    headers.set("X-Tenant-Key", tenantKey);
  }
  
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  // Add auth headers from Supabase
  if (isBrowser()) {
    try {
      const { getSupabaseClient } = await import("./supabase");
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
      }
    } catch (e) {
      console.error("Failed to get Supabase session:", e);
    }
  }
  
  // Only enforce tenant for specific endpoints
  const requiresTenant = init.enforceTenant !== false && 
    !path.includes("/auth/") && 
    !path.includes("/health") &&
    !path.includes("/public");
  
  if (requiresTenant && !tenantKey) {
    console.warn(`API call to ${path} missing tenant_key`);
    // Don't throw, let the backend handle it
  }
  
  const response = await fetch(url.toString(), {
    ...init,
    credentials: "include",
    headers,
  });
  
  if (response.status === 403) {
    console.error("Access denied for tenant:", tenantKey);
  }
  
  return response;
}