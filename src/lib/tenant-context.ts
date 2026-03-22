function isBrowser() {
  return typeof window !== "undefined";
}

export function setTenantKey(tenantKey: string) {
  if (!isBrowser()) return;

  localStorage.setItem("tenant_key", tenantKey);

  const url = new URL(window.location.href);
  url.searchParams.set("tenant_key", tenantKey);
  window.history.replaceState({}, "", url.toString());
}

export function getTenantKey(): string | null {
  if (!isBrowser()) return null;

  const url = new URL(window.location.href);
  return url.searchParams.get("tenant_key") || localStorage.getItem("tenant_key");
}

export function clearTenantKey() {
  if (!isBrowser()) return;

  localStorage.removeItem("tenant_key");

  const url = new URL(window.location.href);
  url.searchParams.delete("tenant_key");
  window.history.replaceState({}, "", url.toString());
}