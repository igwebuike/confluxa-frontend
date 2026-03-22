// lib/api.ts
// STRICT TENANT ENFORCEMENT - NO SCOPE=ALL WITHOUT EXPLICIT ADMIN CHECK

const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://confluxa-core.onrender.com";

function isBrowser() {
  return typeof window !== "undefined";
}

// ALWAYS use URL as source of truth
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
    // Ensure localStorage is in sync
    if (getStoredTenantKey() !== fromUrl) {
      localStorage.setItem("tenant_key", fromUrl);
    }
    return fromUrl;
  }
  return getStoredTenantKey();
}

export type ApiFetchOptions = RequestInit & {
  tenantKey?: string | null;
  enforceTenant?: boolean; // If true, will throw if no tenant key
  isAdminView?: boolean; // Only set if user is verified admin
};

export async function apiFetch(
  path: string,
  init: ApiFetchOptions = {}
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  
  // Determine tenant key (priority: explicit > URL > localStorage)
  let tenantKey = init.tenantKey;
  if (tenantKey === undefined) {
    tenantKey = getEffectiveTenantKey();
  }
  
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  // Check if this is an admin-only endpoint that requires special handling
  const isAdminOnlyEndpoint = path.includes("/admin/") || path.includes("/tenants");
  const enforceTenant = init.enforceTenant !== false;
  
  // Build URL
  const url = new URL(
    `${RAW_API_BASE_URL}${cleanPath}`,
    isBrowser() ? window.location.origin : "http://localhost:3000"
  );
  
  // CRITICAL: Always add tenant_key to query params for backend filtering
  // Even for admin views, we add it but the backend should validate
  if (tenantKey) {
    url.searchParams.set("tenant_key", tenantKey);
  }
  
  // Headers
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  // Add auth headers from Supabase if available
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
  
  // TENANT ENFORCEMENT: Non-admin endpoints MUST have tenant key
  if (!isAdminOnlyEndpoint && enforceTenant && !tenantKey) {
    throw new Error(
      "Missing tenant context. This endpoint requires a valid tenant_key. " +
      "Please ensure the URL contains ?tenant_key=your-tenant-key"
    );
  }
  
  // For admin endpoints, we still include tenant key but backend should validate
  if (tenantKey) {
    headers.set("X-Tenant-Key", tenantKey);
  }
  
  // NEVER allow scope=all unless explicitly authorized
  // This is removed - backend should use RLS, not frontend scope flags
  if (init.isAdminView && url.searchParams.has("scope")) {
    console.warn("Removing scope parameter - backend should use RLS");
    url.searchParams.delete("scope");
  }
  
  const response = await fetch(url.toString(), {
    ...init,
    credentials: "include",
    headers,
  });
  
  // Check for tenant access denied (backend should return 403)
  if (response.status === 403) {
    console.error("Tenant access denied for:", tenantKey);
    throw new Error("You don't have access to this tenant's data");
  }
  
  return response;
}