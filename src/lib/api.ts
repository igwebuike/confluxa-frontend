const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://confluxa-core.onrender.com";

function isBrowser() {
  return typeof window !== "undefined";
}

function getStoredTenantKey(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem("tenant_key");
}

function getTenantKeyFromUrl(): string | null {
  if (!isBrowser()) return null;
  const url = new URL(window.location.href);
  return url.searchParams.get("tenant_key");
}

export function getEffectiveTenantKey(): string | null {
  const fromUrl = getTenantKeyFromUrl();
  if (fromUrl) {
    localStorage.setItem("tenant_key", fromUrl);
    return fromUrl;
  }
  return getStoredTenantKey();
}

export type ApiFetchOptions = RequestInit & {
  tenantKey?: string | null;
  scope?: "tenant" | "all";
  isAdminView?: boolean;
  useProxy?: boolean;
};

export async function apiFetch(
  path: string,
  init: ApiFetchOptions = {}
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const tenantKey =
    init.tenantKey === undefined ? getEffectiveTenantKey() : init.tenantKey;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const baseUrl =
    init.useProxy === false
      ? RAW_API_BASE_URL
      : "";

  const url = new URL(
    init.useProxy === false
      ? `${baseUrl}${cleanPath}`
      : `/api/core${cleanPath}`,
    isBrowser() ? window.location.origin : "http://localhost:3000"
  );

  if (init.isAdminView && init.scope === "all") {
    url.searchParams.set("scope", "all");
    headers.delete("X-Tenant-Key");
  } else {
    const finalTenantKey = tenantKey;
    if (!finalTenantKey) {
      throw new Error("Missing tenant key for tenant-scoped request.");
    }
    headers.set("X-Tenant-Key", finalTenantKey);
    url.searchParams.set("tenant_key", finalTenantKey);
  }

  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url.toString(), {
    ...init,
    credentials: "include",
    headers,
  });
}