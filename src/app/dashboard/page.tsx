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
  accessible_tenants?: string[];
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

export default function DashboardPage() {
  const [page, setPage] = useState<NavKey>("overview");
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [selectedTenantKey, setSelectedTenantKey] = useState("");
  const [search, setSearch] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState<DashboardSummary>({
    calls_today: 0,
    booked_meetings: 0,
    missed_calls_recovered: 0,
    active_clients: 0,
  });

  const [calls, setCalls] = useState<CallRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);

  const [isAdmin, setIsAdmin] = useState(false);

  const selectedTenant = useMemo(
    () => tenantOptions.find((t) => t.tenant_key === selectedTenantKey) || null,
    [tenantOptions, selectedTenantKey]
  );

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

  const syncTenantKey = useCallback((tenantKey: string) => {
    if (!tenantKey) return;
    
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tenant_key", tenantKey);
      window.history.replaceState({}, "", url.toString());
      localStorage.setItem("tenant_key", tenantKey);
    }
    
    setSelectedTenantKey(tenantKey);
  }, []);

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

      setProfile({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "",
        global_role: globalRole,
        is_active: true,
      });

      // Get tenant from URL
      let currentTenantKey = getTenantKey();
      
      let options: TenantOption[] = [];

      // For now, use the tenant from URL or localStorage
      if (currentTenantKey) {
        // Use the tenant from URL as the only option
        options = [{
          id: currentTenantKey,
          tenant_key: currentTenantKey,
          name: "Current Workspace",
          role: globalRole,
        }];
        setTenantOptions(options);
        syncTenantKey(currentTenantKey);
      } else {
        // If no tenant in URL, try to get from dashboard summary (fallback)
        try {
          // Try to load dashboard summary to get tenant info
          const summaryRes = await apiFetch("/api/dashboard/summary", {
            enforceTenant: false,
          });
          
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            if (summaryData?.tenant_key) {
              currentTenantKey = summaryData.tenant_key;
              options = [{
                id: currentTenantKey,
                tenant_key: currentTenantKey,
                name: summaryData.tenant_name || "Current Workspace",
                role: globalRole,
              }];
              setTenantOptions(options);
              syncTenantKey(currentTenantKey);
            } else {
              throw new Error("No tenant data found");
            }
          } else {
            throw new Error("Failed to load tenant data");
          }
        } catch (err) {
          console.error("Failed to auto-detect tenant:", err);
          setError("No workspace specified. Please use a valid link with ?tenant_key=your-workspace");
          setAuthLoading(false);
          return;
        }
      }

      setProfile(prev => prev ? {
        ...prev,
        accessible_tenants: options.map(t => t.tenant_key),
      } : null);

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to verify session.");
      setTimeout(() => {
        window.location.replace("/login");
      }, 2000);
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadTenantData(tenantKey: string) {
    if (!tenantKey) return;

    setLoading(true);
    setError("");

    try {
      // Try to load dashboard summary first to verify access
      const summaryRes = await apiFetch(`/api/dashboard/summary`);
      
      if (!summaryRes.ok) {
        if (summaryRes.status === 403) {
          setError("You don't have access to this workspace. Please contact support.");
          setLoading(false);
          return;
        }
        throw new Error(`Failed to load data: ${summaryRes.status}`);
      }
      
      const summaryData = await summaryRes.json();
      setSummary(summaryData || summary);

      // Load calls and leads
      const [callsRes, leadsRes] = await Promise.all([
        apiFetch(`/api/calls?limit=200`),
        apiFetch(`/api/leads?limit=200`),
      ]);

      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setCalls(Array.isArray(callsData) ? callsData : []);
      } else if (callsRes.status === 403) {
        console.warn("Access denied to calls");
        setCalls([]);
      }

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(Array.isArray(leadsData) ? leadsData : []);
      } else if (leadsRes.status === 403) {
        console.warn("Access denied to leads");
        setLeads([]);
      }

      // Update tenant name if we got it
      if (summaryData?.tenant_name && selectedTenant?.name === "Current Workspace") {
        setTenantOptions(prev =>
          prev.map(opt =>
            opt.tenant_key === tenantKey ? { ...opt, name: summaryData.tenant_name } : opt
          )
        );
      }
    } catch (err: any) {
      console.error("Failed to load tenant data:", err);
      setError(err?.message || "Could not load workspace data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleTenantChange = useCallback((newTenantKey: string) => {
    syncTenantKey(newTenantKey);
  }, [syncTenantKey]);

  useEffect(() => {
    loadAuthAndTenants();
  }, []);

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
                    : "Workspace data"}
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

                {tenantOptions.length > 0 && selectedTenant && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium">
                    Workspace: {selectedTenant.name}
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-slate-500">Loading data...</div>
              </div>
            ) : (
              <>
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
                    No workspace selected. Please use a valid link with ?tenant_key=your-workspace
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