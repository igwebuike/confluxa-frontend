"use client";

import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";

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

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
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

  const selectedTenant = useMemo(
    () => tenantOptions.find((t) => t.tenant_key === selectedTenantKey) || null,
    [tenantOptions, selectedTenantKey]
  );

  async function handleLogout() {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      window.location.replace("/login");
    }
  }

  function syncTenantKeyToUrl(tenantKey: string) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (tenantKey) {
      url.searchParams.set("tenant_key", tenantKey);
    } else {
      url.searchParams.delete("tenant_key");
    }
    window.history.replaceState({}, "", url.toString());
  }

  async function loadSupabaseAuthAndTenants() {
    setAuthLoading(true);
    setError("");

    try {
      const supabase = getSupabaseClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.replace("/login");
        return;
      }

      const globalRole = String(
        user.app_metadata?.role ||
          user.user_metadata?.role ||
          user.app_metadata?.global_role ||
          user.user_metadata?.global_role ||
          "member"
      ).toLowerCase();

      setProfile({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "",
        global_role: globalRole,
        is_active: true,
      });

      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;

      const tenantKeyFromUrl = params?.get("tenant_key") || "";

      let options: TenantOption[] = [];

      try {
        const tenantRes = await apiFetch("/api/tenants", { method: "GET" });
        const tenantData = await tenantRes.json();

        if (Array.isArray(tenantData)) {
          options = tenantData
            .filter((row: BackendTenantRow) => row?.tenant_key && row?.name)
            .map((row: BackendTenantRow) => ({
              id: String(row.id || row.tenant_key || ""),
              tenant_key: String(row.tenant_key || ""),
              name: String(row.name || row.display_name || row.tenant_key || ""),
              role: String(row.role || (globalRole === "admin" ? "admin" : "member")),
            }));
        }
      } catch (tenantErr) {
        console.error("Failed loading tenant options:", tenantErr);
      }

      if (!options.length && tenantKeyFromUrl) {
        options = [
          {
            id: tenantKeyFromUrl,
            tenant_key: tenantKeyFromUrl,
            name: tenantKeyFromUrl,
            role: globalRole,
          },
        ];
      }

      setTenantOptions(options);

      const resolvedTenantKey =
        tenantKeyFromUrl && options.some((t) => t.tenant_key === tenantKeyFromUrl)
          ? tenantKeyFromUrl
          : options[0]?.tenant_key || tenantKeyFromUrl || "";

      setSelectedTenantKey(resolvedTenantKey);
      if (resolvedTenantKey) {
        syncTenantKeyToUrl(resolvedTenantKey);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to verify session.");
      window.location.replace("/login");
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadTenantData(tenantKey: string) {
    if (!tenantKey) return;

    setLoading(true);
    setRefreshing(true);
    setError("");

    try {
      const [summaryRes, callsRes, leadsRes, analyticsRes] = await Promise.all([
        apiFetch(
          `/api/dashboard/summary?tenant_key=${encodeURIComponent(tenantKey)}`
        ).then((r) => r.json()),
        apiFetch(
          `/api/calls?tenant_key=${encodeURIComponent(tenantKey)}&limit=200`
        ).then((r) => r.json()),
        apiFetch(
          `/api/leads?tenant_key=${encodeURIComponent(tenantKey)}&limit=200`
        ).then((r) => r.json()),
        apiFetch(
          `/api/dashboard/tenant-analytics?tenant_key=${encodeURIComponent(
            tenantKey
          )}&days=30`
        ).then((r) => r.json()),
      ]);

      setSummary(
        summaryRes || {
          calls_today: 0,
          booked_meetings: 0,
          missed_calls_recovered: 0,
          active_clients: 0,
        }
      );

      const mappedCalls: CallRow[] = Array.isArray(callsRes)
        ? callsRes.map((row: any) => ({
            id: String(row.id ?? ""),
            vapi_call_id: row.vapi_call_id ? String(row.vapi_call_id) : undefined,
            tenant_id: row.tenant_id ? String(row.tenant_id) : undefined,
            tenant_name: row.tenant_name ? String(row.tenant_name) : undefined,
            caller_name: String(row.caller_name ?? "Unknown Caller"),
            caller_phone: String(row.caller_phone ?? ""),
            time: String(row.time ?? ""),
            duration_seconds:
              typeof row.duration_seconds === "number" ? row.duration_seconds : null,
            outcome: String(row.outcome ?? "New"),
            summary: String(row.summary ?? "No summary"),
          }))
        : [];

      const mappedLeads: LeadRow[] = Array.isArray(leadsRes)
        ? leadsRes.map((row: any) => ({
            id: String(row.id ?? ""),
            tenant_id: row.tenant_id ? String(row.tenant_id) : undefined,
            tenant_name: row.tenant_name ? String(row.tenant_name) : undefined,
            name: String(row.name ?? "Unknown"),
            niche: String(row.niche ?? "General"),
            status: String(row.status ?? "New"),
            business: String(row.business ?? ""),
            issue: String(row.issue ?? "No issue captured"),
            next_action: String(row.next_action ?? "Needs follow-up"),
          }))
        : [];

      setCalls(mappedCalls);
      setLeads(mappedLeads);

      const recentCalls = Array.isArray(analyticsRes?.recent_calls)
        ? analyticsRes.recent_calls
        : [];
      const pipelineStages = Array.isArray(analyticsRes?.pipeline?.stages)
        ? analyticsRes.pipeline.stages
        : [];

      setTasks(
        mappedLeads.slice(0, 20).map((lead) => ({
          id: lead.id,
          title: lead.issue || "Lead follow-up",
          status: lead.status || "open",
          priority: "medium",
          due_at: null,
          description: lead.next_action,
          contact_name: lead.name,
        }))
      );

      setDeals(
        pipelineStages.map((stage: any, idx: number) => ({
          id: `${stage.stage}-${idx}`,
          title: stage.stage,
          stage: stage.stage,
          status: "open",
          estimated_value: null,
          probability: null,
          contact_name: "",
        }))
      );

      setContacts(
        mappedLeads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          email: null,
          phone: null,
          company: lead.business,
          created_at: null,
        }))
      );

      if (!recentCalls.length && mappedCalls.length) {
        setCalls(mappedCalls);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load tenant data.");
      setSummary({
        calls_today: 0,
        booked_meetings: 0,
        missed_calls_recovered: 0,
        active_clients: 0,
      });
      setCalls([]);
      setLeads([]);
      setTasks([]);
      setDeals([]);
      setContacts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSupabaseAuthAndTenants();
  }, []);

  useEffect(() => {
    if (selectedTenantKey) {
      syncTenantKeyToUrl(selectedTenantKey);
      loadTenantData(selectedTenantKey);
    }
  }, [selectedTenantKey]);

  const filteredCalls = useMemo(() => {
    const q = search.toLowerCase();
    return calls.filter((call) =>
      !q
        ? true
        : [call.caller_name, call.caller_phone, call.summary, call.outcome]
            .join(" ")
            .toLowerCase()
            .includes(q)
    );
  }, [calls, search]);

  const filteredDeals = useMemo(() => {
    const q = search.toLowerCase();
    return deals.filter((deal) =>
      !q
        ? true
        : [deal.title, deal.status, deal.stage, deal.contact_name]
            .join(" ")
            .toLowerCase()
            .includes(q)
    );
  }, [deals, search]);

  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter((task) =>
      !q
        ? true
        : [
            task.title,
            task.description,
            task.status,
            task.priority,
            task.contact_name,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
    );
  }, [tasks, search]);

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter((contact) =>
      !q
        ? true
        : [contact.name, contact.email, contact.phone, contact.company]
            .join(" ")
            .toLowerCase()
            .includes(q)
    );
  }, [contacts, search]);

  const metrics = useMemo(() => {
    const totalContacts = contacts.length;
    const openDeals = deals.length;
    const pipelineValue = deals.reduce(
      (sum, deal) => sum + Number(deal.estimated_value || 0),
      0
    );
    const tasksDue = tasks.length;
    const callsToday = summary.calls_today || 0;

    return {
      totalContacts,
      openDeals,
      pipelineValue,
      tasksDue,
      callsToday,
    };
  }, [contacts, deals, tasks, summary]);

  const callTrend = useMemo(() => {
    const map = new Map<string, { day: string; calls: number; booked: number }>();
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, {
        day: d.toLocaleDateString([], { month: "short", day: "numeric" }),
        calls: 0,
        booked: 0,
      });
    }

    for (const call of calls) {
      if (!call.time) continue;
      const parsed = new Date(call.time);
      if (Number.isNaN(parsed.getTime())) continue;
      const key = parsed.toISOString().slice(0, 10);
      if (map.has(key)) {
        const row = map.get(key)!;
        row.calls += 1;
        if ((call.outcome || "").toLowerCase().includes("book")) {
          row.booked += 1;
        }
      }
    }

    return Array.from(map.values());
  }, [calls]);

  const pipelineChart = useMemo(() => {
    const stageCounts = new Map<string, number>();
    for (const lead of leads) {
      const label = lead.status || "Unknown";
      stageCounts.set(label, (stageCounts.get(label) || 0) + 1);
    }
    return Array.from(stageCounts.entries()).map(([stage, count]) => ({
      stage,
      count,
    }));
  }, [leads]);

  const summaryCards = [
    {
      title: "Contacts",
      value: metrics.totalContacts,
      note: "People and prospects in this workspace",
      icon: Users,
    },
    {
      title: "Open deals",
      value: metrics.openDeals,
      note: "Active opportunities in pipeline",
      icon: Briefcase,
    },
    {
      title: "Pipeline value",
      value: formatCurrency(metrics.pipelineValue),
      note: "Estimated value of open work",
      icon: TrendingUp,
    },
    {
      title: "Calls today",
      value: metrics.callsToday,
      note: "Inbound and outbound activity today",
      icon: PhoneCall,
    },
  ];

  const initials = useMemo(() => {
    const name = profile?.full_name || profile?.email || "EE";
    return name
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        Checking session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="flex h-16 items-center px-6">
            <div className="flex items-center gap-3">
              <img
                src="/confluxa-logo.png"
                alt="Confluxa"
                className="h-14 w-14 rounded-xl object-contain"
              />
              <div>
                <div className="font-semibold">Confluxa</div>
                <div className="text-xs text-slate-500">Tenant Workspace</div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPage(item.key)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${
                    page === item.key
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="px-4">
            <Card className="rounded-3xl border-slate-200/80 bg-slate-900 text-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5" />
                  <div className="font-medium">Active workspace</div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-200">
                  <div className="font-medium text-white">
                    {selectedTenant?.name || "No tenant selected"}
                  </div>
                  <div>{selectedTenant?.role || "member"}</div>
                  <div className="text-slate-300">
                    {(profile?.global_role || "").toLowerCase() === "platform_admin" ||
                    (profile?.global_role || "").toLowerCase() === "admin"
                      ? "Platform admin access"
                      : "Tenant-scoped access"}
                  </div>
                </div>

                <Button
                  className="mt-5 w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => selectedTenantKey && loadTenantData(selectedTenantKey)}
                  disabled={refreshing || !selectedTenantKey}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>

        <main>
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {selectedTenant?.name || "Dashboard"}
                </h1>
                <p className="text-sm text-slate-500">
                  Real calls, deals, tasks, and contacts from your backend workspace.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[260px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-2xl border-slate-200 pl-9"
                    placeholder="Search records"
                  />
                </div>

                <Select value={selectedTenantKey} onValueChange={setSelectedTenantKey}>
                  <SelectTrigger className="w-[260px] rounded-2xl border-slate-200">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantOptions.length ? (
                      tenantOptions.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.tenant_key}>
                          {tenant.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__none" disabled>
                        No tenant available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" className="rounded-2xl border-slate-200">
                  <Bell className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-slate-200"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>

                  <Avatar className="h-10 w-10 rounded-2xl">
                    <AvatarFallback className="rounded-2xl bg-orange-100 text-orange-900">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-8 px-6 py-6">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                Loading dashboard...
              </div>
            ) : null}

            {!loading && !selectedTenantKey ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                No tenant is available yet. Add `?tenant_key=your-tenant-key` to the URL,
                or make sure `/api/tenants` returns tenant rows.
              </div>
            ) : null}

            {!loading && selectedTenantKey && page === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {summaryCards.map((card) => (
                    <StatCard key={card.title} {...card} />
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Call trend</CardTitle>
                      <CardDescription>
                        Calls and booked outcomes over the last 7 days.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={callTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="calls" strokeWidth={4} dot={false} />
                            <Line
                              type="monotone"
                              dataKey="booked"
                              strokeWidth={4}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Tasks due</CardTitle>
                      <CardDescription>
                        Follow-up items that need attention.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {filteredTasks.slice(0, 5).length ? (
                        filteredTasks.slice(0, 5).map((task) => (
                          <div key={task.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">{task.title}</div>
                                <div className="text-sm text-slate-500">
                                  {task.contact_name || "Unassigned contact"}
                                </div>
                              </div>
                              <Badge variant="secondary">{task.priority || "medium"}</Badge>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                              <Clock3 className="h-3.5 w-3.5" />
                              Due {formatDateTime(task.due_at)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                          No open tasks yet.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <SectionTitle
                        title="Recent calls"
                        description="Latest conversation activity in this workspace."
                        action={
                          <Button
                            variant="outline"
                            className="rounded-2xl border-slate-200"
                            onClick={() => setPage("calls")}
                          >
                            View all
                          </Button>
                        }
                      />
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Caller</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Outcome</TableHead>
                            <TableHead>Summary</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCalls.slice(0, 8).map((call) => (
                            <TableRow key={call.id}>
                              <TableCell>
                                <div className="font-medium">{call.caller_name}</div>
                                <div className="text-xs text-slate-500">
                                  {call.caller_phone || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>{formatTime(call.time)}</div>
                                <div className="text-xs text-slate-500">
                                  {formatDuration(call.duration_seconds)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {call.outcome || "New"}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[320px] truncate">
                                {call.summary || "No summary"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Pipeline stages</CardTitle>
                      <CardDescription>
                        Open deal distribution by stage.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pipelineChart}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="stage" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {!loading && selectedTenantKey && page === "calls" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionTitle
                  title="Calls"
                  description="Every call record in this tenant workspace."
                />
                <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Caller</TableHead>
                          <TableHead>Date / time</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Outcome</TableHead>
                          <TableHead>Summary</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCalls.map((call) => (
                          <TableRow key={call.id}>
                            <TableCell>
                              <div className="font-medium">{call.caller_name}</div>
                              <div className="text-xs text-slate-500">
                                {call.caller_phone || "—"}
                              </div>
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

            {!loading && selectedTenantKey && page === "deals" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionTitle
                  title="Deals"
                  description="Live opportunity pipeline for this tenant."
                />
                <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Probability</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDeals.map((deal) => (
                          <TableRow key={deal.id}>
                            <TableCell className="font-medium">{deal.title}</TableCell>
                            <TableCell>{deal.contact_name || "—"}</TableCell>
                            <TableCell>{deal.stage || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{deal.status || "open"}</Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(deal.estimated_value)}</TableCell>
                            <TableCell>{deal.probability ?? 0}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!loading && selectedTenantKey && page === "tasks" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionTitle
                  title="Tasks"
                  description="Follow-up and operational tasks for this tenant."
                />
                <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>
                              <div className="font-medium">{task.title}</div>
                              <div className="text-xs text-slate-500 truncate max-w-[320px]">
                                {task.description || "—"}
                              </div>
                            </TableCell>
                            <TableCell>{task.contact_name || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{task.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{task.priority || "medium"}</Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(task.due_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!loading && selectedTenantKey && page === "contacts" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionTitle
                  title="Contacts"
                  description="People and businesses associated with this tenant."
                />
                <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                  <CardContent className="p-0">
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
                        {filteredContacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="font-medium">{contact.name}</TableCell>
                            <TableCell>{contact.email || "—"}</TableCell>
                            <TableCell>{contact.phone || "—"}</TableCell>
                            <TableCell>{contact.company || "—"}</TableCell>
                            <TableCell>{formatDateTime(contact.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!loading && selectedTenantKey && page === "settings" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionTitle
                  title="Settings"
                  description="Workspace and access context for the current tenant."
                />
                <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Workspace context</CardTitle>
                      <CardDescription>
                        What this dashboard is currently connected to.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-slate-900">Tenant:</span>{" "}
                            {selectedTenant?.name || "—"}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">Tenant key:</span>{" "}
                            {selectedTenant?.tenant_key || "—"}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">Membership role:</span>{" "}
                            {selectedTenant?.role || "member"}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">Global role:</span>{" "}
                            {profile?.global_role || "member"}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-sm font-medium text-slate-900">Profile</div>
                        <div className="mt-2 text-sm text-slate-500">
                          {profile?.full_name || "No full name set"}
                        </div>
                        <div className="text-sm text-slate-500">{profile?.email || "—"}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Workspace checks</CardTitle>
                      <CardDescription>
                        Simple operational confidence signals.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Tenant selected", done: !!selectedTenantKey },
                        { label: "Contacts loaded", done: contacts.length > 0 },
                        { label: "Calls loaded", done: calls.length > 0 },
                        { label: "Leads loaded", done: leads.length > 0 },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="font-medium">{item.label}</div>
                          {item.done ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}