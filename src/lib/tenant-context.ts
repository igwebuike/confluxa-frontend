// lib/tenant-context.ts
// SINGLE SOURCE OF TRUTH FOR TENANT CONTEXT

function isBrowser() {
  return typeof window !== "undefined";
}

// Primary source: URL parameter
// Secondary: localStorage (for persistence across sessions)
// NEVER use localStorage without URL sync

export function getTenantKey(): string | null {
  if (!isBrowser()) return null;
  
  // URL is the source of truth
  const url = new URL(window.location.href);
  const tenantFromUrl = url.searchParams.get("tenant_key");
  
  if (tenantFromUrl) {
    // Sync to localStorage for persistence
    localStorage.setItem("tenant_key", tenantFromUrl);
    return tenantFromUrl;
  }
  
  // Fallback to localStorage only if URL doesn't have it
  return localStorage.getItem("tenant_key");
}

// Alias for getTenantKey to maintain compatibility
export const getEffectiveTenantKey = getTenantKey;

export function setTenantKey(tenantKey: string, updateUrl: boolean = true) {
  if (!isBrowser()) return;
  
  // Always update localStorage
  localStorage.setItem("tenant_key", tenantKey);
  
  // Optionally update URL (should be true for navigation, false for background sync)
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("tenant_key", tenantKey);
    window.history.pushState({}, "", url.toString());
  }
}

export function clearTenantKey() {
  if (!isBrowser()) return;
  
  localStorage.removeItem("tenant_key");
  
  const url = new URL(window.location.href);
  url.searchParams.delete("tenant_key");
  window.history.replaceState({}, "", url.toString());
}

export function validateTenantAccess(tenantKey: string, userTenants: string[]): boolean {
  // Validate that the current user has access to this tenant
  if (!tenantKey) return false;
  return userTenants.includes(tenantKey);
}

// Hook for React components
import { useEffect, useState, useCallback } from 'react';

export function useTenantKey() {
  const [tenantKey, setTenantKeyState] = useState<string | null>(null);
  
  useEffect(() => {
    // Initialize from URL/localStorage
    setTenantKeyState(getTenantKey());
    
    // Listen for popstate events (browser back/forward)
    const handlePopState = () => {
      setTenantKeyState(getTenantKey());
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  const updateTenantKey = useCallback((newKey: string, updateUrl: boolean = true) => {
    setTenantKey(newKey, updateUrl);
    setTenantKeyState(newKey);
  }, []);
  
  return { tenantKey, updateTenantKey };
}