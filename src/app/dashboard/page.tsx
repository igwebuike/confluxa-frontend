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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

type NavKey = "overview" | "calls" | "deals" | "tasks" | "contacts" | "settings";

type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
  global_role?: string;
  is_active?: boolean;
  accessible_tenants?: string[];
  default_tenant?: string;
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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://confluxa-core.onrender.com";

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

async function apiFetchWrapper(path: string, init: RequestInit = {}) {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  if (ADMIN_SECRET) {
    headers.set("X-Admin-Secret", ADMIN_SECRET);
  }

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

  // CHECK AUTHENTICATION FIRST
  useEffect(() => {
    async function checkAuth() {
      setIsCheckingAuth(true);
      try {
        const supabase = getSupabaseClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.log("No active session, redirecting to login");
          window.location.href = "/login";
          return;
        }
        
        console.log("User is authenticated:", session.user.email);
        
        // Get user's role
        const globalRole = String(
          session.user.app_metadata?.role ||
          session.user.user_metadata?.role ||
          session.user.app_metadata?.global_role ||
          session.user.user_metadata?.global_role ||
          "member"
        ).toLowerCase();

        const adminRoles = ["platform_admin", "admin", "owner"];
        const isAdminUser = adminRoles.includes(globalRole);
        setIsAdmin(isAdminUser);
        
        // Get default tenant from user metadata
        const defaultTenant = session.user.user_metadata?.default_tenant || 
                               session.user.app_metadata?.default_tenant ||
                               null;

        setProfile({
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name || "",
          global_role: globalRole,
          is_active: true,
          default_tenant: defaultTenant || undefined,
        });
        
        // Get tenant from URL or user metadata
        let tenantKey = getTenantKey();
        if (!tenantKey && defaultTenant) {
          tenantKey = defaultTenant;
          if (tenantKey) {
            setTenantKey(tenantKey);
          }
        }
        
        let options: TenantOption[] = [];
        
        if (tenantKey) {
          options = [{
            id: tenantKey,
            tenant_key: tenantKey,
            name: "Loading...",
            role: globalRole,
          }];
          setTenantOptions(options);
          setSelectedTenantKey(tenantKey);
          syncTenantKey(tenantKey);
        } else {
          setError("No workspace specified. Please use a valid link with ?tenant_key=your-workspace");
        }
        
        setProfile(prev => prev ? {
          ...prev,
          accessible_tenants: options.map(t => t.tenant_key),
        } : null);
        
      } catch (err: any) {
        console.error("Auth check error:", err);
        setError(err?.message || "Failed to verify session.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } finally {
        setIsCheckingAuth(false);
        setAuthLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  async function handleLogout() {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      clearTenantKey();
    } catch (e) {
      console.error(e);
    } finally {
      window.location.replace("/login");
    }
  }

  function syncTenantKey(tenantKey: string) {
    if (!tenantKey) return;
    
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tenant_key", tenantKey);
      window.history.replaceState({}, "", url.toString());
      localStorage.setItem("tenant_key", tenantKey);
    }
    
    setSelectedTenantKey(tenantKey);
  }

  async function loadTenantData(tenantKey: string) {
    if (!tenantKey) return;

    setLoading(true);
    setRefreshing(true);
    setError("");

    try {
      const [summaryRes, callsRes, leadsRes] = await Promise.all([
        apiFetchWrapper(`/api/dashboard/summary`).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
        apiFetchWrapper(`/api/calls?limit=200`).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
        apiFetchWrapper(`/api/leads?limit=200`).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
      ]);

      setSummary(summaryRes || summary);
      setCalls(Array.isArray(callsRes) ? callsRes : []);
      setLeads(Array.isArray(leadsRes) ? leadsRes : []);

      if (summaryRes?.tenant_name && selectedTenant?.name === "Loading...") {
        setTenantOptions(prev =>
          prev.map(opt =>
            opt.tenant_key === tenantKey ? { ...opt, name: summaryRes.tenant_name } : opt
          )
        );
      }
    } catch (err: any) {
      console.error("Failed to load tenant data:", err);
      if (err.message?.includes("401") || err.message?.includes("403")) {
        setError("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setError("Could not load workspace data. Please try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleTenantChange = useCallback((newTenantKey: string) => {
    if (!profile?.accessible_tenants?.includes(newTenantKey)) {
      setError("You don't have access to this workspace");
      return;
    }
    
    syncTenantKey(newTenantKey);
  }, [profile]);

  useEffect(() => {
    if (selectedTenantKey && !authLoading && !isCheckingAuth) {
      loadTenantData(selectedTenantKey);
    }
  }, [selectedTenantKey, authLoading, isCheckingAuth]);

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

  const filteredLeads = useMemo(() => {
    if (!leads.length) return [];
    return leads.filter(lead => {
      const q = search.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(q) ||
        lead.business?.toLowerCase().includes(q) ||
        lead.issue?.toLowerCase().includes(q) ||
        lead.status?.toLowerCase().includes(q)
      );
    });
  }, [leads, search]);

  // Show loading while checking auth
  if (isCheckingAuth || authLoading) {
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

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm text-slate-700">
          <Button onClick={() => window.location.href = "/login"}>Go to Login</Button>
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
              {profile && (
                <div className="mt-4 text-sm text-slate-600 truncate">
                  <div>{profile.email}</div>
                </div>
              )}
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

                {/* Tenant selector - only for admins */}
                {isAdmin && tenantOptions.length > 1 && (
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

                {/* For regular users: show fixed workspace name */}
                {!isAdmin && selectedTenant && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium">
                    Workspace: {selectedTenant.name || selectedTenantKey}
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

                {/* Deals Section */}
                {page === "deals" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Active Deals</CardTitle>
                        <CardDescription>Current opportunities in pipeline</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Stage</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Probability</TableHead>
                              <TableHead>Contact</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {deals.map((deal) => (
                              <TableRow key={deal.id}>
                                <TableCell className="font-medium">{deal.title}</TableCell>
                                <TableCell>{deal.stage || deal.status || "New"}</TableCell>
                                <TableCell>{formatCurrency(deal.estimated_value)}</TableCell>
                                <TableCell>{deal.probability || 0}%</TableCell>
                                <TableCell>{deal.contact_name || "—"}</TableCell>
                              </TableRow>
                            ))}
                            {deals.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-slate-500">
                                  No deals found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Tasks Section */}
                {page === "tasks" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Tasks & Follow-ups</CardTitle>
                        <CardDescription>Action items requiring attention</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Contact</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tasks.map((task) => (
                              <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{task.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                                    {task.priority || "medium"}
                                  </Badge>
                                </TableCell>
                                <TableCell>{task.due_at ? new Date(task.due_at).toLocaleDateString() : "—"}</TableCell>
                                <TableCell>{task.contact_name || "—"}</TableCell>
                              </TableRow>
                            ))}
                            {tasks.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-slate-500">
                                  No tasks found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Contacts Section */}
                {page === "contacts" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Contacts</CardTitle>
                        <CardDescription>People and companies in your CRM</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contacts.map((contact) => (
                              <TableRow key={contact.id}>
                                <TableCell className="font-medium">{contact.name}</TableCell>
                                <TableCell>{contact.email || "—"}</TableCell>
                                <TableCell>{contact.phone || "—"}</TableCell>
                                <TableCell>{contact.company || "—"}</TableCell>
                                <TableCell>{contact.created_at ? new Date(contact.created_at).toLocaleDateString() : "—"}</TableCell>
                              </TableRow>
                            ))}
                            {contacts.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-slate-500">
                                  No contacts found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Settings Section */}
                {page === "settings" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Workspace Settings</CardTitle>
                        <CardDescription>Configure your workspace preferences</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <h3 className="font-medium mb-2">Account Information</h3>
                          <p className="text-sm text-slate-600">Email: {profile?.email}</p>
                          <p className="text-sm text-slate-600">Role: {profile?.global_role}</p>
                          <p className="text-sm text-slate-600">Tenant: {selectedTenant?.name || selectedTenantKey}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <h3 className="font-medium mb-2">API Configuration</h3>
                          <p className="text-sm text-slate-600">API Base: {API_BASE}</p>
                        </div>
                        <Button onClick={handleLogout} variant="outline" className="rounded-2xl">
                          Sign Out
                        </Button>
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