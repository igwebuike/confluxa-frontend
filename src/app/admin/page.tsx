"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Phone,
  ClipboardList,
  Settings,
  Shield,
  Bell,
  Search,
  Plus,
  Activity,
  Server,
  Mail,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  DollarSign,
  Wrench,
  LifeBuoy,
  ChevronRight,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Briefcase,
  LogOut,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  global_role: string;
};

type Tenant = {
  id: string;
  tenant_key: string;
  name: string;
  display_name: string | null;
  industry: string | null;
  status: string | null;
  is_active?: boolean | null;
  created_at?: string;
};

type Contact = {
  id: string;
  tenant_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
};

type PipelineStage = {
  id: string;
  tenant_id: string;
  name: string;
  stage_key: string;
  position: number;
};

type Deal = {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  title: string;
  status: string;
  source: string | null;
  estimated_value: number | null;
  probability: number | null;
  created_at: string;
  last_activity_at: string | null;
  stage_id: string | null;
};

type Task = {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  deal_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  created_at: string;
};

type Call = {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  external_call_id: string | null;
  direction: string | null;
  caller_phone: string | null;
  caller_email: string | null;
  called_number: string | null;
  duration_seconds: number | null;
  summary: string | null;
  transcript: string | null;
  outcome: string | null;
  qualification_status: string | null;
  created_at: string;
};

type TenantStatRow = {
  id: string;
  tenant_key: string;
  name: string;
  industry: string;
  status: string;
  contacts: number;
  calls: number;
  openDeals: number;
  tasksDue: number;
  booked: number;
  recovered: number;
  pipelineValue: number;
  bookRate: number;
  recoveryRate: number;
};

type SystemHealth = {
  ok?: boolean;
  voice_routing?: string;
  webhook_health?: string;
  email_delivery?: string;
  stats?: {
    tenants_total?: number;
    tenants_active?: number;
    calls_last_24h?: number;
    open_tasks?: number;
    open_deals?: number;
  };
  version?: string;
};

type AdminSection =
  | "overview"
  | "tenants"
  | "calls"
  | "deals"
  | "tasks"
  | "system"
  | "settings";

type AnalyticsWindow = "7" | "30" | "90";

type TrendPoint = {
  day: string;
  label: string;
  calls: number;
  booked: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://confluxa-core.onrender.com";

const APP_BASE =
  process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/+$/, "") ||
  "https://app.getconfluxa.com";

const ADMIN_SECRET =
  process.env.NEXT_PUBLIC_ADMIN_SECRET?.trim() || "";

function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtCurrency(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function shortDayLabel(date: Date) {
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function fullName(first?: string | null, last?: string | null, fallback = "Unknown") {
  const name = [first || "", last || ""].join(" ").trim();
  return name || fallback;
}

function statusTone(status?: string) {
  const s = (status || "").toLowerCase();
  if (
    s.includes("active") ||
    s.includes("healthy") ||
    s.includes("booked") ||
    s.includes("qualified") ||
    s.includes("open")
  ) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (
    s.includes("new") ||
    s.includes("retry") ||
    s.includes("onboarding") ||
    s.includes("needs") ||
    s.includes("pending")
  ) {
    return "bg-amber-100 text-amber-900 border-amber-200";
  }
  if (
    s.includes("inactive") ||
    s.includes("failed") ||
    s.includes("alert") ||
    s.includes("miss") ||
    s.includes("closed")
  ) {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function isBookedOutcome(outcome?: string | null) {
  return (outcome || "").toLowerCase().includes("book");
}

function isRecoveredOutcome(outcome?: string | null) {
  const s = (outcome || "").toLowerCase();
  return (
    s.includes("qual") ||
    s.includes("book") ||
    s.includes("won") ||
    s.includes("recover")
  );
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  note?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <div className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              {value}
            </div>
            <p className="mt-2 text-sm text-slate-500">{note || "—"}</p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-3 text-white">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ModalShell({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            ×
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function ConfluxaAdminPage() {
  const supabase = getSupabaseClient();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);

  const [health, setHealth] = useState<SystemHealth | null>(null);

  const [section, setSection] = useState<AdminSection>("overview");
  const [query, setQuery] = useState("");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [analyticsWindow, setAnalyticsWindow] = useState<AnalyticsWindow>("30");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    display_name: "",
    industry: "general",
    status: "active",
  });

  function getAdminHeaders() {
    const headers: Record<string, string> = {};
    if (ADMIN_SECRET) headers["X-Admin-Secret"] = ADMIN_SECRET;
    return headers;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  async function loadSystemHealth() {
    try {
      const res = await fetch(`${API_BASE}/api/system/health`, {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setHealth(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        window.location.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, global_role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (profileData.global_role !== "platform_admin") {
        setError("This page is only for platform admins.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const [
        tenantsRes,
        contactsRes,
        dealsRes,
        tasksRes,
        callsRes,
        stagesRes,
      ] = await Promise.all([
        supabase
          .from("tenants")
          .select("id, tenant_key, name, display_name, industry, status, is_active, created_at")
          .order("created_at", { ascending: true }),

        supabase
          .from("contacts")
          .select("id, tenant_id, first_name, last_name, email, phone, company, created_at")
          .limit(5000),

        supabase
          .from("deals")
          .select("id, tenant_id, contact_id, title, status, source, estimated_value, probability, created_at, last_activity_at, stage_id")
          .limit(5000),

        supabase
          .from("tasks")
          .select("id, tenant_id, contact_id, deal_id, title, description, status, priority, due_at, created_at")
          .limit(5000),

        supabase
          .from("calls")
          .select("id, tenant_id, contact_id, external_call_id, direction, caller_phone, caller_email, called_number, duration_seconds, summary, transcript, outcome, qualification_status, created_at")
          .limit(5000),

        supabase
          .from("pipeline_stages")
          .select("id, tenant_id, name, stage_key, position")
          .limit(2000),
      ]);

      if (tenantsRes.error) throw tenantsRes.error;
      if (contactsRes.error) throw contactsRes.error;
      if (dealsRes.error) throw dealsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (callsRes.error) throw callsRes.error;
      if (stagesRes.error) throw stagesRes.error;

      setTenants((tenantsRes.data || []) as Tenant[]);
      setContacts((contactsRes.data || []) as Contact[]);
      setDeals((dealsRes.data || []) as Deal[]);
      setTasks((tasksRes.data || []) as Task[]);
      setCalls((callsRes.data || []) as Call[]);
      setPipelineStages((stagesRes.data || []) as PipelineStage[]);

      await loadSystemHealth();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Could not load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function refreshAll() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const tenantStats = useMemo<TenantStatRow[]>(() => {
    return tenants.map((tenant) => {
      const tenantContacts = contacts.filter((c) => c.tenant_id === tenant.id);
      const tenantDeals = deals.filter((d) => d.tenant_id === tenant.id);
      const tenantTasks = tasks.filter((t) => t.tenant_id === tenant.id);
      const tenantCalls = calls.filter((c) => c.tenant_id === tenant.id);

      const openDeals = tenantDeals.filter((d) => d.status === "open").length;
      const tasksDue = tenantTasks.filter(
        (t) => t.status === "open" && t.due_at
      ).length;
      const booked = tenantCalls.filter((c) => isBookedOutcome(c.outcome)).length;
      const recovered = tenantCalls.filter((c) =>
        isRecoveredOutcome(c.outcome)
      ).length;
      const pipelineValue = tenantDeals.reduce(
        (sum, d) => sum + Number(d.estimated_value || 0),
        0
      );
      const callsCount = tenantCalls.length;

      return {
        id: tenant.id,
        tenant_key: tenant.tenant_key,
        name: tenant.display_name || tenant.name,
        industry: tenant.industry || "general",
        status:
          tenant.status ||
          (tenant.is_active ? "active" : "inactive") ||
          "active",
        contacts: tenantContacts.length,
        calls: callsCount,
        openDeals,
        tasksDue,
        booked,
        recovered,
        pipelineValue,
        bookRate: callsCount ? Math.round((booked / callsCount) * 100) : 0,
        recoveryRate: callsCount
          ? Math.round((recovered / callsCount) * 100)
          : 0,
      };
    });
  }, [tenants, contacts, deals, tasks, calls]);

  const filteredTenantStats = useMemo(() => {
    return tenantStats.filter((tenant) => {
      const matchesTenant =
        tenantFilter === "all" ||
        tenant.id === tenantFilter ||
        tenant.name.toLowerCase() === tenantFilter.toLowerCase();

      const haystack = [
        tenant.name,
        tenant.tenant_key,
        tenant.status,
        tenant.industry,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      return matchesTenant && matchesQuery;
    });
  }, [tenantStats, tenantFilter, query]);

  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      const tenant = tenantStats.find((t) => t.id === call.tenant_id);
      const matchesTenant =
        tenantFilter === "all" ||
        call.tenant_id === tenantFilter ||
        tenant?.name.toLowerCase() === tenantFilter.toLowerCase();

      const haystack = [
        call.caller_phone,
        call.caller_email,
        call.summary,
        call.outcome,
        call.qualification_status,
        tenant?.name,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      return matchesTenant && matchesQuery;
    });
  }, [calls, tenantStats, tenantFilter, query]);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const tenant = tenantStats.find((t) => t.id === deal.tenant_id);
      const stage = pipelineStages.find((s) => s.id === deal.stage_id);
      const matchesTenant =
        tenantFilter === "all" ||
        deal.tenant_id === tenantFilter ||
        tenant?.name.toLowerCase() === tenantFilter.toLowerCase();

      const haystack = [
        deal.title,
        deal.status,
        deal.source,
        stage?.name,
        stage?.stage_key,
        tenant?.name,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      return matchesTenant && matchesQuery;
    });
  }, [deals, tenantStats, pipelineStages, tenantFilter, query]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const tenant = tenantStats.find((t) => t.id === task.tenant_id);
      const matchesTenant =
        tenantFilter === "all" ||
        task.tenant_id === tenantFilter ||
        tenant?.name.toLowerCase() === tenantFilter.toLowerCase();

      const haystack = [
        task.title,
        task.description,
        task.status,
        task.priority,
        tenant?.name,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      return matchesTenant && matchesQuery;
    });
  }, [tasks, tenantStats, tenantFilter, query]);

  const summary = useMemo(() => {
    const activeTenants = tenantStats.filter((t) =>
      t.status.toLowerCase().includes("active")
    ).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const callsToday = calls.filter((c) => new Date(c.created_at) >= today).length;
    const bookedMeetings = calls.filter((c) => isBookedOutcome(c.outcome)).length;
    const missedRecovered = calls.filter((c) => isRecoveredOutcome(c.outcome)).length;

    return {
      callsToday,
      bookedMeetings,
      missedRecovered,
      activeTenants,
    };
  }, [tenantStats, calls]);

  const monthlyAgencyMrr = useMemo(() => {
    return tenantStats.filter((t) => t.status.toLowerCase().includes("active")).length * 1500;
  }, [tenantStats]);

  const setupFeesThisMonth = useMemo(() => {
    return tenantStats.length * 500;
  }, [tenantStats]);

  const tenantsNeedingAttention = useMemo(() => {
    return tenantStats.filter(
      (t) =>
        !t.status.toLowerCase().includes("active") ||
        t.calls === 0 ||
        t.openDeals === 0
    ).length;
  }, [tenantStats]);

  const analyticsDays = Number(analyticsWindow);

  const analyticsTrend = useMemo<TrendPoint[]>(() => {
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - (analyticsDays - 1));
    start.setHours(0, 0, 0, 0);

    const map = new Map<string, TrendPoint>();
    for (let i = 0; i < analyticsDays; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, {
        day: key,
        label: shortDayLabel(d),
        calls: 0,
        booked: 0,
      });
    }

    filteredCalls.forEach((call) => {
      const d = new Date(call.created_at);
      if (Number.isNaN(d.getTime()) || d < start) return;
      const key = d.toISOString().slice(0, 10);
      const row = map.get(key);
      if (!row) return;
      row.calls += 1;
      if (isBookedOutcome(call.outcome)) row.booked += 1;
    });

    return Array.from(map.values());
  }, [filteredCalls, analyticsDays]);

  const analyticsTotals = useMemo(() => {
    return analyticsTrend.reduce(
      (acc, row) => {
        acc.calls += row.calls;
        acc.booked += row.booked;
        return acc;
      },
      { calls: 0, booked: 0 }
    );
  }, [analyticsTrend]);

  const averageBookRate = filteredTenantStats.length
    ? Math.round(
        filteredTenantStats.reduce((acc, row) => acc + row.bookRate, 0) /
          filteredTenantStats.length
      )
    : 0;

  const topTenant = filteredTenantStats[0];

  const initials = useMemo(() => {
    const name = profile?.full_name || profile?.email || "EE";
    return name
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile]);

  async function saveNewTenant() {
    if (!newTenant.name.trim()) {
      setActionMessage("Enter a tenant name first.");
      return;
    }

    try {
      const { error } = await supabase.from("tenants").insert({
        tenant_key: newTenant.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        name: newTenant.name.trim(),
        display_name: newTenant.display_name.trim() || newTenant.name.trim(),
        industry: newTenant.industry,
        status: newTenant.status,
        is_active: true,
      });

      if (error) throw error;

      setShowNewTenantModal(false);
      setNewTenant({
        name: "",
        display_name: "",
        industry: "general",
        status: "active",
      });
      setActionMessage("Tenant created successfully.");
      await loadData();
      setSection("tenants");
    } catch (e: any) {
      console.error(e);
      setActionMessage(e?.message || "Could not create tenant.");
    }
  }

  function getTenantDashboardUrl(tenant: TenantStatRow) {
    return `${APP_BASE}/dashboard?tenant_key=${encodeURIComponent(tenant.tenant_key)}`;
  }

  const navItems: {
    key: AdminSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "overview", label: "Agency Overview", icon: LayoutDashboard },
    { key: "tenants", label: "Tenants", icon: Users },
    { key: "calls", label: "Calls", icon: Phone },
    { key: "deals", label: "Deals", icon: Briefcase },
    { key: "tasks", label: "Tasks", icon: ClipboardList },
    { key: "system", label: "System", icon: Shield },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ModalShell
        open={showNewTenantModal}
        title="Add new tenant"
        description="Create a new Confluxa client workspace."
        onClose={() => setShowNewTenantModal(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Tenant name</label>
            <Input
              className="rounded-2xl"
              value={newTenant.name}
              onChange={(e) => setNewTenant((p) => ({ ...p, name: e.target.value }))}
              placeholder="Innovative Mechanical"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Display name</label>
            <Input
              className="rounded-2xl"
              value={newTenant.display_name}
              onChange={(e) =>
                setNewTenant((p) => ({ ...p, display_name: e.target.value }))
              }
              placeholder="Innovative Mechanical"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Industry</label>
            <Select
              value={newTenant.industry}
              onValueChange={(value) =>
                setNewTenant((p) => ({ ...p, industry: value }))
              }
            >
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="medspa">Medspa</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setShowNewTenantModal(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-2xl bg-slate-950 hover:bg-slate-800"
            onClick={saveNewTenant}
          >
            Save tenant
          </Button>
        </div>
      </ModalShell>

      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="flex h-16 items-center border-b border-slate-200 px-6">
            <div>
              <div className="text-lg font-semibold text-slate-950">
                Confluxa Agency OS
              </div>
              <div className="text-xs text-slate-500">
                Internal admin console
              </div>
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="space-y-2">
              {navItems.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSection(key)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                    section === key
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4">
            <Card className="rounded-3xl border-0 bg-slate-950 text-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 font-medium">
                  <Server className="h-4 w-4" />
                  Platform health
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Voice routing</span>
                    <Badge className="border-0 bg-emerald-500/20 text-emerald-100">
                      {health?.voice_routing || "—"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Webhook health</span>
                    <Badge className="border-0 bg-emerald-500/20 text-emerald-100">
                      {health?.webhook_health || "—"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email delivery</span>
                    <Badge className="border-0 bg-sky-500/20 text-sky-100">
                      {health?.email_delivery || "—"}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={refreshAll}
                  className="mt-5 w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {refreshing ? "Refreshing..." : "Refresh data"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="px-4 pt-4">
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-slate-900">
                  Quick actions
                </div>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => setShowNewTenantModal(true)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-3 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add tenant
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setSection("system")}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-3 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Open diagnostics
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setSection("tasks")}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-3 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <LifeBuoy className="h-4 w-4" />
                      Review tasks
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        <main>
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  Internal
                </div>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                  Confluxa Agency OS
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Cross-tenant operations, delivery, and revenue visibility.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative min-w-[280px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tenants, calls, deals, tasks"
                    className="rounded-2xl border-slate-200 pl-9"
                  />
                </div>

                <Select value={tenantFilter} onValueChange={setTenantFilter}>
                  <SelectTrigger className="w-[220px] rounded-2xl border-slate-200">
                    <SelectValue placeholder="All tenants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tenants</SelectItem>
                    {tenantStats.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="rounded-2xl bg-slate-950 hover:bg-slate-800"
                  onClick={() => setShowNewTenantModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New tenant
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-2xl border-slate-200"
                >
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
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {actionMessage ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                {actionMessage}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                Loading admin dashboard...
              </div>
            ) : null}

            {section === "overview" && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    title="Monthly recurring revenue"
                    value={fmtCurrency(monthlyAgencyMrr)}
                    note={`${summary.activeTenants} active paying tenants`}
                    icon={DollarSign}
                  />
                  <MetricCard
                    title="Setup fees this month"
                    value={fmtCurrency(setupFeesThisMonth)}
                    note="Simple internal estimate"
                    icon={TrendingUp}
                  />
                  <MetricCard
                    title="Tenants needing attention"
                    value={tenantsNeedingAttention}
                    note="Low activity or inactive workspace"
                    icon={AlertTriangle}
                  />
                  <MetricCard
                    title="Calls today"
                    value={summary.callsToday}
                    note="Across all tenant workspaces"
                    icon={Phone}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    title="Booked outcomes"
                    value={summary.bookedMeetings}
                    note="Booked calls across platform"
                    icon={ClipboardList}
                  />
                  <MetricCard
                    title="Recovered opportunities"
                    value={summary.missedRecovered}
                    note="Qualified or saved conversations"
                    icon={CheckCircle2}
                  />
                  <MetricCard
                    title="Active tenant accounts"
                    value={summary.activeTenants}
                    note="Live client workspaces"
                    icon={Users}
                  />
                  <MetricCard
                    title="Open deals"
                    value={deals.filter((d) => d.status === "open").length}
                    note="All active opportunities"
                    icon={Briefcase}
                  />
                </div>

                <Card className="rounded-3xl border-slate-200 shadow-sm">
                  <CardHeader>
                    <SectionHeader
                      title="Tenant analytics layer"
                      description="Cross-tenant performance trends and booking efficiency."
                      action={
                        <div className="flex items-center gap-2">
                          <Select
                            value={analyticsWindow}
                            onValueChange={(value: AnalyticsWindow) =>
                              setAnalyticsWindow(value)
                            }
                          >
                            <SelectTrigger className="w-[130px] rounded-2xl border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">Last 7 days</SelectItem>
                              <SelectItem value="30">Last 30 days</SelectItem>
                              <SelectItem value="90">Last 90 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      }
                    />
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <MetricCard
                        title="Analytics calls"
                        value={analyticsTotals.calls}
                        note={`${analyticsDays}-day filtered window`}
                        icon={BarChart3}
                      />
                      <MetricCard
                        title="Analytics booked"
                        value={analyticsTotals.booked}
                        note={`${
                          analyticsTotals.calls
                            ? Math.round((analyticsTotals.booked / analyticsTotals.calls) * 100)
                            : 0
                        }% booking rate`}
                        icon={ClipboardList}
                      />
                      <MetricCard
                        title="Average book rate"
                        value={`${averageBookRate}%`}
                        note="Across visible tenants"
                        icon={TrendingUp}
                      />
                      <MetricCard
                        title="Top tenant"
                        value={topTenant?.name || "—"}
                        note={
                          topTenant
                            ? `${topTenant.calls} calls • ${topTenant.bookRate}% booked`
                            : "No tenant data"
                        }
                        icon={Users}
                      />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                      <Card className="rounded-3xl border-slate-200 shadow-none">
                        <CardHeader>
                          <CardTitle>Call volume trend</CardTitle>
                          <CardDescription>
                            Calls and booked calls over the selected window.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={analyticsTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="label" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="calls" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="booked" strokeWidth={3} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-3xl border-slate-200 shadow-none">
                        <CardHeader>
                          <CardTitle>Tenant performance</CardTitle>
                          <CardDescription>
                            Booking comparison across visible tenants.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={filteredTenantStats.slice(0, 8)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="calls" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="booked" radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="rounded-3xl border-slate-200 shadow-none">
                      <CardHeader>
                        <CardTitle>Tenant leaderboard</CardTitle>
                        <CardDescription>
                          Operational performance by tenant.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tenant</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Calls</TableHead>
                              <TableHead>Contacts</TableHead>
                              <TableHead>Open deals</TableHead>
                              <TableHead>Tasks due</TableHead>
                              <TableHead>Book rate</TableHead>
                              <TableHead>Pipeline</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTenantStats.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.name}</TableCell>
                                <TableCell>
                                  <Badge className={statusTone(row.status)}>{row.status}</Badge>
                                </TableCell>
                                <TableCell>{row.calls}</TableCell>
                                <TableCell>{row.contacts}</TableCell>
                                <TableCell>{row.openDeals}</TableCell>
                                <TableCell>{row.tasksDue}</TableCell>
                                <TableCell>{row.bookRate}%</TableCell>
                                <TableCell>{fmtCurrency(row.pipelineValue)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {section === "tenants" && !loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <SectionHeader
                  title="Tenant management"
                  description="Manage all client accounts and workspace performance."
                  action={
                    <Button
                      className="rounded-2xl bg-slate-950 hover:bg-slate-800"
                      onClick={() => setShowNewTenantModal(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add tenant
                    </Button>
                  }
                />

                <Card className="rounded-3xl border-slate-200 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Industry</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Calls</TableHead>
                          <TableHead>Booked</TableHead>
                          <TableHead>Recovered</TableHead>
                          <TableHead>Pipeline</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTenantStats.map((tenant) => (
                          <TableRow key={tenant.id}>
                            <TableCell className="font-medium">{tenant.name}</TableCell>
                            <TableCell>{tenant.industry}</TableCell>
                            <TableCell>
                              <Badge className={statusTone(tenant.status)}>{tenant.status}</Badge>
                            </TableCell>
                            <TableCell>{tenant.calls}</TableCell>
                            <TableCell>{tenant.booked}</TableCell>
                            <TableCell>{tenant.recovered}</TableCell>
                            <TableCell>{fmtCurrency(tenant.pipelineValue)}</TableCell>
                            <TableCell>
                              <a
                                href={getTenantDashboardUrl(tenant)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Button variant="outline" size="sm" className="rounded-2xl">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Dashboard
                                </Button>
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {section === "calls" && !loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <SectionHeader
                  title="Call operations"
                  description="Review inbound and outbound call activity across the platform."
                />

                <Card className="rounded-3xl border-slate-200 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Caller</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Outcome</TableHead>
                          <TableHead>Summary</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCalls.map((call) => {
                          const tenant = tenantStats.find((t) => t.id === call.tenant_id);
                          return (
                            <TableRow key={call.id}>
                              <TableCell>{tenant?.name || "Unknown tenant"}</TableCell>
                              <TableCell>
                                <div className="font-medium">{call.caller_phone || "Unknown caller"}</div>
                                <div className="text-xs text-slate-500">{call.caller_email || "—"}</div>
                              </TableCell>
                              <TableCell>{fmtDateTime(call.created_at)}</TableCell>
                              <TableCell>
                                <Badge className={statusTone(call.outcome || call.qualification_status || "")}>
                                  {call.outcome || call.qualification_status || "New"}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[360px] truncate">
                                {call.summary || "No summary yet"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {section === "deals" && !loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <SectionHeader
                  title="Deals"
                  description="Cross-tenant opportunity visibility."
                />

                <Card className="rounded-3xl border-slate-200 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Probability</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDeals.map((deal) => {
                          const tenant = tenantStats.find((t) => t.id === deal.tenant_id);
                          const stage = pipelineStages.find((s) => s.id === deal.stage_id);
                          return (
                            <TableRow key={deal.id}>
                              <TableCell>{tenant?.name || "Unknown tenant"}</TableCell>
                              <TableCell>
                                <div className="font-medium">{deal.title}</div>
                                <div className="text-xs text-slate-500">
                                  {stage?.name || stage?.stage_key || "No stage"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={statusTone(deal.status)}>{deal.status}</Badge>
                              </TableCell>
                              <TableCell>{deal.source || "—"}</TableCell>
                              <TableCell>{fmtCurrency(deal.estimated_value)}</TableCell>
                              <TableCell>{deal.probability ?? 0}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {section === "tasks" && !loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <SectionHeader
                  title="Tasks"
                  description="Follow-up and operational tasks across all tenants."
                />

                <Card className="rounded-3xl border-slate-200 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.map((task) => {
                          const tenant = tenantStats.find((t) => t.id === task.tenant_id);
                          return (
                            <TableRow key={task.id}>
                              <TableCell>{tenant?.name || "Unknown tenant"}</TableCell>
                              <TableCell>
                                <div className="font-medium">{task.title}</div>
                                <div className="text-xs text-slate-500 truncate max-w-[300px]">
                                  {task.description || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={statusTone(task.status)}>{task.status}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{task.priority}</Badge>
                              </TableCell>
                              <TableCell>{fmtDateTime(task.due_at)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {section === "system" && !loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <SectionHeader
                  title="System + delivery"
                  description="Backend reliability and operational checks."
                />

                <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Platform health detail</CardTitle>
                      <CardDescription>
                        Live backend status from the privileged system health endpoint.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        <div>
                          <div className="font-medium">Voice routing</div>
                          <div className="text-sm text-slate-500">Phone and assistant flow</div>
                        </div>
                        <Badge className={statusTone(health?.voice_routing)}>{health?.voice_routing || "—"}</Badge>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        <div>
                          <div className="font-medium">Webhook health</div>
                          <div className="text-sm text-slate-500">Inbound event processing</div>
                        </div>
                        <Badge className={statusTone(health?.webhook_health)}>{health?.webhook_health || "—"}</Badge>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        <div>
                          <div className="font-medium">Email delivery</div>
                          <div className="text-sm text-slate-500">Summary delivery status</div>
                        </div>
                        <Badge className={statusTone(health?.email_delivery)}>{health?.email_delivery || "—"}</Badge>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl bg-slate-100 p-4">
                          <div className="text-sm text-slate-500">Tenants total</div>
                          <div className="mt-2 text-2xl font-semibold text-slate-950">
                            {health?.stats?.tenants_total ?? tenantStats.length}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-4">
                          <div className="text-sm text-slate-500">Calls last 24h</div>
                          <div className="mt-2 text-2xl font-semibold text-slate-950">
                            {health?.stats?.calls_last_24h ?? 0}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-4">
                          <div className="text-sm text-slate-500">Open tasks</div>
                          <div className="mt-2 text-2xl font-semibold text-slate-950">
                            {health?.stats?.open_tasks ?? 0}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-4">
                          <div className="text-sm text-slate-500">Open deals</div>
                          <div className="mt-2 text-2xl font-semibold text-slate-950">
                            {health?.stats?.open_deals ?? 0}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Operator actions</CardTitle>
                      <CardDescription>
                        Internal shortcuts for platform management.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        ["Review webhook logs", Activity],
                        ["Review delivery health", Mail],
                        ["Check backend version", Server],
                        ["Run diagnostics", Wrench],
                        ["Support queue", LifeBuoy],
                      ].map(([label, Icon]: any) => (
                        <button
                          key={label}
                          onClick={() => setActionMessage(`${label} clicked.`)}
                          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-slate-100 p-2">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {section === "settings" && !loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <SectionHeader
                  title="Agency settings"
                  description="Environment, app routing, and operator guidance."
                />

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Frontend + API</CardTitle>
                      <CardDescription>
                        Current environment and integration targets.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-sm font-medium">API base URL</div>
                        <div className="mt-1 break-all text-sm text-slate-500">
                          {API_BASE}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-sm font-medium">App base URL</div>
                        <div className="mt-1 break-all text-sm text-slate-500">
                          {APP_BASE}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-sm font-medium">Admin profile</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {profile?.full_name || "No full name"} • {profile?.email || "—"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Admin notes</CardTitle>
                      <CardDescription>
                        This page is your agency operating layer.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-500">
                      <p>Tenant dashboard answers: “How is one business doing?”</p>
                      <p>
                        Admin dashboard answers: “What needs action across all tenants,
                        revenue, delivery, and onboarding?”
                      </p>
                      <p>
                        That is why this page focuses on cross-tenant totals,
                        performance, system health, and operator actions.
                      </p>
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