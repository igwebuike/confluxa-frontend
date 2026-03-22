"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Building2,
  Settings,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  BarChart3,
  ClipboardList,
  Clock3,
  RefreshCcw,
  TrendingUp,
  Users,
  Briefcase,
  LogOut,
  Calendar,
  PhoneIncoming,
} from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";
import { getTenantKey, setTenantKey, clearTenantKey } from "@/lib/tenant-context";
import { apiFetch } from "@/lib/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type NavKey = "overview" | "calls" | "deals" | "tasks" | "contacts" | "settings";

type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
  global_role?: string;
  is_active?: boolean;
  accessible_tenants?: string[]; // List of tenant keys this user can access
};

type DashboardSummary = {
  calls_today: number;
  booked_meetings: number;
  missed_calls_recovered: number;
  active_clients: number;
  calls_today_note?: string;
  booked_meetings_note?: string;
  missed_calls_recovered_note?: string;
  active_clients_note?: string;
  tenant_key?: string;
  tenant_name?: string;
};

type CallRow = {
  id: string;
  vapi_call_id?: string;
  tenant_id?: string;
  tenant_name?: string;
  caller_name: string;
  caller_phone: string;
  time: string;
  duration_seconds?: number | null;
  outcome: string;
  summary: string;
};

type LeadRow = {
  id: string;
  tenant_id?: string;
  tenant_name?: string;
  name: string;
  niche: string;
  status: string;
  business: string;
  issue: string;
  next_action: string;
};

type TenantOption = {
  id: string;
  tenant_key: string;
  name: string;
  role?: string;
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  due_at?: string | null;
  description?: string | null;
  contact_name?: string;
};

type DealRow = {
  id: string;
  title: string;
  stage?: string;
  status?: string;
  estimated_value?: number | null;
  probability?: number | null;
  contact_name?: string;
};

type ContactRow = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  created_at?: string | null;
};

type BackendTenantRow = {
  id?: string;
  tenant_key?: string;
  name?: string;
  display_name?: string;
  role?: string;
  phone_number?: string;
  status?: string;
  calls?: number;
  booked?: number;
  recovered?: number;
};

const NAV_ITEMS: Array<{
  key: NavKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "overview", label: "Dashboard", icon: BarChart3 },
  { key: "calls", label: "Calls", icon: Phone },
  { key: "deals", label: "Deals", icon: Briefcase },
  { key: "tasks", label: "Tasks", icon: ClipboardList },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "settings", label: "Settings", icon: Settings },
];

const ADMIN_SECRET =
  process.env.NEXT_PUBLIC_ADMIN_SECRET?.trim() || "";

function formatDateTime(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDuration(seconds?: number | null) {
  if (seconds == null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function StatCard({
  title,
  value,
  note,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-3xl border-slate-200/80 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <h3 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
              {value}
            </h3>
            <p className="mt-2 text-sm text-slate-500">{note}</p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-3 text-white">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default function DashboardPage() {
  const [page, setPage] = useState<NavKey>("overview");
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [selectedTenantKey, setSelectedTenantKey] = useState("");
  const [search, setSearch] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState<DashboardSummary>({
    calls_today: 0,
    booked_meetings: 0,
    missed_calls_recovered: 0,
    active_clients: 0,
  });

  const [calls, setCalls] = useState<CallRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);

  const [isAdmin, setIsAdmin] = useState(false);

  const selectedTenant = useMemo(
    () => tenantOptions.find((t) => t.tenant_key === selectedTenantKey) || null,
    [tenantOptions, selectedTenantKey]
  );

  async function handleLogout() {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      clearTenantKey(); // Clear tenant context on logout
    } catch (e) {
      console.error(e);
    } finally {
      window.location.replace("/login");
    }
  }

  // Sync tenant to URL and localStorage
  const syncTenantKey = useCallback((tenantKey: string) => {
    if (!tenantKey) return;
    
    // Update URL without full reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tenant_key", tenantKey);
      window.history.replaceState({}, "", url.toString());
      
      // Update localStorage
      localStorage.setItem("tenant_key", tenantKey);
    }
    
    setSelectedTenantKey(tenantKey);
  }, []);

  // Load user auth and their accessible tenants
  async function loadAuthAndTenants() {
    setAuthLoading(true);
    setError("");

    try {
      const supabase = getSupabaseClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.replace("/login");
        return;
      }

      // Get user's role
      const globalRole = String(
        user.app_metadata?.role ||
        user.user_metadata?.role ||
        user.app_metadata?.global_role ||
        user.user_metadata?.global_role ||
        "member"
      ).toLowerCase();

      const adminRoles = ["platform_admin", "admin", "owner"];
      const isAdminUser = adminRoles.includes(globalRole);
      setIsAdmin(isAdminUser);

      // Set profile
      setProfile({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "",
        global_role: globalRole,
        is_active: true,
      });

      // Get tenant from URL (source of truth)
      let currentTenantKey = getTenantKey();
      
      let options: TenantOption[] = [];

      if (isAdminUser) {
        // Admins can see all tenants (but still with server-side validation)
        try {
          const tenantRes = await apiFetch("/api/tenants", {
            enforceTenant: false, // Admin endpoint doesn't require tenant
            isAdminView: true,
          });
          
          if (tenantRes.ok) {
            const tenantData = await tenantRes.json();
            if (Array.isArray(tenantData)) {
              options = tenantData
                .filter((row: BackendTenantRow) => row?.tenant_key && row?.name)
                .map((row: BackendTenantRow) => ({
                  id: String(row.id || row.tenant_key || ""),
                  tenant_key: String(row.tenant_key || ""),
                  name: String(row.name || row.display_name || row.tenant_key || ""),
                  role: String(row.role || globalRole),
                }));
            }
          }
        } catch (e) {
          console.error("Failed to load tenant list for admin:", e);
          setError("Failed to load tenant list. Please refresh the page.");
        }
      } else {
        // Regular users: get their assigned tenants from backend
        try {
          const userTenantsRes = await apiFetch("/auth/my-tenants", {
            enforceTenant: false, // This endpoint returns user's tenants
          });
          
          if (userTenantsRes.ok) {
            const tenantsData = await userTenantsRes.json();
            options = tenantsData.map((tenant: any) => ({
              id: tenant.id,
              tenant_key: tenant.tenant_key,
              name: tenant.name,
              role: tenant.role || "member",
            }));
          } else {
            throw new Error("Failed to fetch user tenants");
          }
        } catch (e) {
          console.error("Failed to load user tenants:", e);
          setError("Unable to verify workspace access. Please contact support.");
          return;
        }
      }

      setTenantOptions(options);

      // Validate current tenant access
      const accessibleTenantKeys = options.map(t => t.tenant_key);
      const hasAccess = currentTenantKey && accessibleTenantKeys.includes(currentTenantKey);
      
      if (!hasAccess) {
        // Fallback to first available tenant
        if (options.length > 0) {
          currentTenantKey = options[0].tenant_key;
          syncTenantKey(currentTenantKey);
        } else {
          setError("You don't have access to any workspaces.");
          return;
        }
      } else if (currentTenantKey) {
        syncTenantKey(currentTenantKey);
      } else {
        setError("No workspace specified. Please use a valid link.");
        return;
      }

      // Update profile with accessible tenants
      setProfile(prev => prev ? {
        ...prev,
        accessible_tenants: accessibleTenantKeys,
      } : null);

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to verify session.");
      window.location.replace("/login");
    } finally {
      setAuthLoading(false);
    }
  }

  // Load data for specific tenant
  async function loadTenantData(tenantKey: string) {
    if (!tenantKey) return;
    
    // Verify access before loading
    if (profile?.accessible_tenants && !profile.accessible_tenants.includes(tenantKey)) {
      setError("You don't have access to this workspace");
      return;
    }

    setLoading(true);
    setRefreshing(true);
    setError("");

    try {
      const [summaryRes, callsRes, leadsRes] = await Promise.all([
        apiFetch(`/api/dashboard/summary`).then(r => r.json()),
        apiFetch(`/api/calls?limit=200`).then(r => r.json()),
        apiFetch(`/api/leads?limit=200`).then(r => r.json()),
      ]);

      setSummary(summaryRes || summary);
      setCalls(Array.isArray(callsRes) ? callsRes : []);
      setLeads(Array.isArray(leadsRes) ? leadsRes : []);

      // Update tenant name if we got it from summary
      if (summaryRes?.tenant_name && selectedTenant?.name === "Loading workspace...") {
        setTenantOptions(prev =>
          prev.map(opt =>
            opt.tenant_key === tenantKey ? { ...opt, name: summaryRes.tenant_name } : opt
          )
        );
      }
    } catch (err: any) {
      console.error("Failed to load tenant data:", err);
      setError("Could not load workspace data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Handle tenant change
  const handleTenantChange = useCallback((newTenantKey: string) => {
    if (!profile?.accessible_tenants?.includes(newTenantKey)) {
      setError("You don't have access to this workspace");
      return;
    }
    
    syncTenantKey(newTenantKey);
    // Data will reload via useEffect when selectedTenantKey changes
  }, [profile, syncTenantKey]);

  // Initial load
  useEffect(() => {
    loadAuthAndTenants();
  }, []);

  // Load data when tenant changes
  useEffect(() => {
    if (selectedTenantKey && !authLoading) {
      loadTenantData(selectedTenantKey);
    }
  }, [selectedTenantKey, authLoading]);

  const filteredCalls = useMemo(() => {
    if (!calls.length) return [];
    return calls.filter(call => {
      const q = search.toLowerCase();
      return (
        call.caller_name?.toLowerCase().includes(q) ||
        call.caller_phone?.includes(q) ||
        call.summary?.toLowerCase().includes(q) ||
        call.outcome?.toLowerCase().includes(q)
      );
    });
  }, [calls, search]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm text-slate-700">
          Loading your workspace...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-red-200 bg-white px-8 py-6 shadow-sm text-red-700 max-w-md text-center">
          <AlertTriangle className="mx-auto h-10 w-10 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Error</h2>
          <p className="mb-6">{error}</p>
          <Button onClick={handleLogout}>Sign Out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-slate-200 bg-white hidden lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-900 p-2 text-white">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Confluxa</h2>
                  <p className="text-xs text-slate-500">AI Voice Agents</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 p-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = page === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setPage(item.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                      isActive
                        ? "bg-slate-100 font-medium text-slate-900"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        <main>
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {NAV_ITEMS.find((i) => i.key === page)?.label || "Dashboard"}
                </h1>
                <p className="text-sm text-slate-500">
                  {page === "overview"
                    ? "Your key metrics and recent activity"
                    : page === "calls"
                    ? "All inbound and outbound calls"
                    : page === "deals"
                    ? "Active opportunities and pipeline"
                    : page === "tasks"
                    ? "Follow-ups and action items"
                    : page === "contacts"
                    ? "People and companies in your CRM"
                    : "Workspace configuration"}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[260px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    className="pl-9 rounded-2xl border-slate-200"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Tenant selector - only show if multiple tenants available */}
                {tenantOptions.length > 1 && (
                  <Select
                    value={selectedTenantKey}
                    onValueChange={handleTenantChange}
                  >
                    <SelectTrigger className="w-[260px] rounded-2xl border-slate-200">
                      <SelectValue placeholder="Select workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenantOptions.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.tenant_key}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Show current workspace name if only one */}
                {tenantOptions.length === 1 && selectedTenant && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium">
                    Workspace: {selectedTenant.name}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main content area */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-slate-500">Loading data...</div>
              </div>
            ) : (
              <>
                {/* Overview Section */}
                {page === "overview" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <StatCard
                        title="Calls Today"
                        value={summary.calls_today}
                        note={summary.calls_today_note || ""}
                        icon={Phone}
                      />
                      <StatCard
                        title="Booked Meetings"
                        value={summary.booked_meetings}
                        note={summary.booked_meetings_note || ""}
                        icon={Calendar}
                      />
                      <StatCard
                        title="Missed Calls Recovered"
                        value={summary.missed_calls_recovered}
                        note={summary.missed_calls_recovered_note || ""}
                        icon={PhoneIncoming}
                      />
                      <StatCard
                        title="Active Clients"
                        value={summary.active_clients}
                        note={summary.active_clients_note || ""}
                        icon={Users}
                      />
                    </div>

                    {/* Recent Calls Table */}
                    <Card className="mt-8">
                      <CardHeader>
                        <CardTitle>Recent Calls</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Caller</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Outcome</TableHead>
                              <TableHead>Summary</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCalls.slice(0, 5).map((call) => (
                              <TableRow key={call.id}>
                                <TableCell>
                                  <div className="font-medium">{call.caller_name || "Unknown"}</div>
                                  <div className="text-sm text-muted-foreground">{call.caller_phone || "—"}</div>
                                </TableCell>
                                <TableCell>{formatDateTime(call.time)}</TableCell>
                                <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{call.outcome || "New"}</Badge>
                                </TableCell>
                                <TableCell className="max-w-[300px] truncate">
                                  {call.summary || "No summary"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Calls Section */}
                {page === "calls" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle>All Calls</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Caller</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Outcome</TableHead>
                              <TableHead>Summary</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCalls.map((call) => (
                              <TableRow key={call.id}>
                                <TableCell>
                                  <div className="font-medium">{call.caller_name || "Unknown"}</div>
                                  <div className="text-sm text-muted-foreground">{call.caller_phone || "—"}</div>
                                </TableCell>
                                <TableCell>{formatDateTime(call.time)}</TableCell>
                                <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{call.outcome || "New"}</Badge>
                                </TableCell>
                                <TableCell className="max-w-[360px] truncate">
                                  {call.summary || "No summary"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {!selectedTenantKey && !loading && (
                  <div className="text-center py-20 text-slate-500">
                    No workspace selected. Please contact support or use a valid link.
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}