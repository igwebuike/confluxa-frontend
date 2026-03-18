"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  CalendarDays,
  Building2,
  Activity,
  Settings,
  Bell,
  Search,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  Headphones,
  Briefcase,
  BarChart3,
  ClipboardList,
  BadgeCheck,
  Clock3,
  Filter,
  Plus,
  ExternalLink,
  X,
  RefreshCcw,
  Download,
  Upload,
  TrendingUp,
  Users,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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

type DashboardSummary = {
  calls_today: number;
  booked_meetings: number;
  missed_calls_recovered: number;
  active_clients: number;
  calls_today_note?: string;
  booked_meetings_note?: string;
  missed_calls_recovered_note?: string;
  active_clients_note?: string;
};

type CallTrendPoint = {
  day: string;
  calls: number;
  booked: number;
};

type CallRow = {
  id: string;
  caller: string;
  number: string;
  tenant: string;
  tenant_id?: string;
  time: string;
  raw_time?: string;
  duration: string;
  outcome: string;
  summary: string;
};

type LeadRow = {
  id: string;
  name: string;
  niche: string;
  status: string;
  business: string;
  business_id?: string;
  issue: string;
  next: string;
};

type ClientRow = {
  id: string;
  name: string;
  phone: string;
  status: string;
  calls: number;
  booked: number;
  recovered: number;
  tenant_key?: string;
};

type FailureRow = {
  label: string;
  value: number;
  tone: string;
};

type SystemHealth = {
  voice_routing: string;
  webhook_health: string;
  email_delivery: string;
  email_retries?: number;
  failures?: FailureRow[];
  onboarding_progress?: {
    label: string;
    description: string;
    percent: number;
  };
};

type AnalyticsBucket = {
  bucket: string;
  total_calls: number;
  booked_calls: number;
  qualified_calls: number;
  missed_calls: number;
  book_rate: number;
};

type ConversionStage = {
  stage: string;
  count: number;
};

type ConversionFunnel = {
  ok: boolean;
  tenant_key?: string;
  tenant_name?: string;
  total_leads: number;
  stages: ConversionStage[];
  conversion: {
    lead_to_booked_pct: number;
    qualified_to_booked_pct: number;
  };
};

type CallDetail = {
  ok: boolean;
  id: string;
  tenant_id?: string;
  tenant_name: string;
  caller_name: string;
  caller_phone: string;
  caller_email?: string;
  time: string;
  outcome: string;
  business_name?: string;
  business_phone?: string;
  called_number?: string;
  tenant_phone_label?: string;
  summary: string;
  transcript: string;
  payload?: any;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://confluxa-core.onrender.com";

const ADMIN_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_BASE_URL?.replace(/\/+$/, "") ||
  "https://app.getconfluxa.com/admin";

const ADMIN_SECRET =
  process.env.NEXT_PUBLIC_ADMIN_SECRET?.trim() || "";

const fallbackSummary: DashboardSummary = {
  calls_today: 42,
  booked_meetings: 9,
  missed_calls_recovered: 14,
  active_clients: 6,
  calls_today_note: "+18% vs yesterday",
  booked_meetings_note: "3 awaiting confirmation",
  missed_calls_recovered_note: "AI answered after hours",
  active_clients_note: "2 in onboarding",
};

const fallbackCallTrend: CallTrendPoint[] = [
  { day: "Mon", calls: 22, booked: 3 },
  { day: "Tue", calls: 31, booked: 5 },
  { day: "Wed", calls: 28, booked: 4 },
  { day: "Thu", calls: 39, booked: 7 },
  { day: "Fri", calls: 42, booked: 9 },
  { day: "Sat", calls: 18, booked: 2 },
  { day: "Sun", calls: 11, booked: 1 },
];

const fallbackCalls: CallRow[] = [
  {
    id: "1",
    caller: "Brian Adams",
    number: "+1 512-999-0995",
    tenant: "Innovative Mechanical",
    tenant_id: "im",
    time: "7:36 PM",
    raw_time: new Date().toISOString(),
    duration: "4m 12s",
    outcome: "Qualified",
    summary: "Heating failure. Service follow-up needed.",
  },
  {
    id: "2",
    caller: "Sarah Kim",
    number: "+1 469-222-1010",
    tenant: "Knowledge Bureau",
    tenant_id: "kb",
    time: "6:58 PM",
    raw_time: new Date().toISOString(),
    duration: "6m 03s",
    outcome: "Booked",
    summary: "Requested course consultation. Good fit.",
  },
  {
    id: "3",
    caller: "David Flores",
    number: "+1 214-110-8888",
    tenant: "Medspa Demo",
    tenant_id: "medspa",
    time: "5:41 PM",
    raw_time: new Date().toISOString(),
    duration: "2m 41s",
    outcome: "New lead",
    summary: "Asking about botox pricing and appointment windows.",
  },
  {
    id: "4",
    caller: "Unknown Caller",
    number: "+1 817-221-4455",
    tenant: "UOT",
    tenant_id: "uot",
    time: "4:12 PM",
    raw_time: new Date().toISOString(),
    duration: "1m 28s",
    outcome: "Missed intent",
    summary: "Ended early. Could not confirm contact info.",
  },
];

const fallbackLeads: LeadRow[] = [
  {
    id: "1",
    name: "Brian Adams",
    niche: "HVAC",
    status: "Qualified",
    business: "Innovative Mechanical",
    business_id: "im",
    issue: "Heating issue",
    next: "Call back in 15 min",
  },
  {
    id: "2",
    name: "Sarah Kim",
    niche: "Training",
    status: "Booked",
    business: "Knowledge Bureau",
    business_id: "kb",
    issue: "Course consultation",
    next: "Meeting tomorrow",
  },
  {
    id: "3",
    name: "Amanda Lee",
    niche: "Medspa",
    status: "New",
    business: "Glow Medspa",
    business_id: "medspa",
    issue: "Botox pricing",
    next: "Send SMS follow-up",
  },
  {
    id: "4",
    name: "James R.",
    niche: "Legal",
    status: "Contacted",
    business: "Northstar Legal",
    business_id: "legal",
    issue: "Consult scheduling",
    next: "Awaiting reply",
  },
];

const fallbackClients: ClientRow[] = [
  {
    id: "im",
    name: "Innovative Mechanical",
    phone: "+1 281-299-3921",
    status: "Active",
    calls: 42,
    booked: 6,
    recovered: 11,
    tenant_key: "innovative-mechanical",
  },
  {
    id: "kb",
    name: "Knowledge Bureau",
    phone: "+1 202-555-1132",
    status: "Active",
    calls: 28,
    booked: 8,
    recovered: 2,
    tenant_key: "knowledge-bureau",
  },
  {
    id: "medspa",
    name: "Glow Medspa",
    phone: "+1 469-555-7711",
    status: "Onboarding",
    calls: 6,
    booked: 1,
    recovered: 3,
    tenant_key: "glow-medspa",
  },
];

const fallbackFailures: FailureRow[] = [
  { label: "Webhook retries", value: 2, tone: "bg-amber-100 text-amber-900" },
  { label: "Call transcription gaps", value: 1, tone: "bg-red-100 text-red-900" },
  { label: "Number mapping alerts", value: 0, tone: "bg-emerald-100 text-emerald-900" },
];

const fallbackHealth: SystemHealth = {
  voice_routing: "Healthy",
  webhook_health: "Healthy",
  email_delivery: "2 retries",
  email_retries: 2,
  failures: fallbackFailures,
  onboarding_progress: {
    label: "Client onboarding progress",
    description: "2 of 3 steps completed for Glow Medspa",
    percent: 66,
  },
};

const fallbackAnalytics: AnalyticsBucket[] = [
  {
    bucket: "2026-03-11",
    total_calls: 18,
    booked_calls: 3,
    qualified_calls: 7,
    missed_calls: 2,
    book_rate: 16.7,
  },
  {
    bucket: "2026-03-12",
    total_calls: 24,
    booked_calls: 4,
    qualified_calls: 8,
    missed_calls: 3,
    book_rate: 16.7,
  },
  {
    bucket: "2026-03-13",
    total_calls: 21,
    booked_calls: 5,
    qualified_calls: 9,
    missed_calls: 2,
    book_rate: 23.8,
  },
  {
    bucket: "2026-03-14",
    total_calls: 29,
    booked_calls: 6,
    qualified_calls: 10,
    missed_calls: 3,
    book_rate: 20.7,
  },
  {
    bucket: "2026-03-15",
    total_calls: 16,
    booked_calls: 2,
    qualified_calls: 6,
    missed_calls: 1,
    book_rate: 12.5,
  },
  {
    bucket: "2026-03-16",
    total_calls: 31,
    booked_calls: 8,
    qualified_calls: 12,
    missed_calls: 4,
    book_rate: 25.8,
  },
  {
    bucket: "2026-03-17",
    total_calls: 22,
    booked_calls: 4,
    qualified_calls: 9,
    missed_calls: 2,
    book_rate: 18.2,
  },
];

const fallbackConversionFunnel: ConversionFunnel = {
  ok: true,
  tenant_key: "uot",
  tenant_name: "UOT",
  total_leads: 50,
  stages: [
    { stage: "New", count: 14 },
    { stage: "Contacted", count: 8 },
    { stage: "Qualified", count: 12 },
    { stage: "Booked", count: 9 },
    { stage: "Won", count: 3 },
    { stage: "Missed", count: 2 },
    { stage: "Follow-up", count: 2 },
  ],
  conversion: {
    lead_to_booked_pct: 18,
    qualified_to_booked_pct: 75,
  },
};

function toneForFailure(label: string, value: number) {
  const lower = label.toLowerCase();
  if (value === 0) return "bg-emerald-100 text-emerald-900";
  if (lower.includes("retry") || lower.includes("mapping")) {
    return "bg-amber-100 text-amber-900";
  }
  return "bg-red-100 text-red-900";
}

function formatTime(input?: string) {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(input?: string) {
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

function formatBucketLabel(input?: string) {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(seconds?: number | null) {
  if (seconds == null || Number.isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function csvEscape(value: unknown) {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

export default function ConfluxaFrontendPrototype() {
  const [page, setPage] = useState("dashboard");
  const [tenant, setTenant] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [uploading, setUploading] = useState(false);

  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [callTrend, setCallTrend] = useState<CallTrendPoint[]>(fallbackCallTrend);
  const [recentCalls, setRecentCalls] = useState<CallRow[]>(fallbackCalls);
  const [leads, setLeads] = useState<LeadRow[]>(fallbackLeads);
  const [clients, setClients] = useState<ClientRow[]>(fallbackClients);
  const [health, setHealth] = useState<SystemHealth>(fallbackHealth);
  const [analytics, setAnalytics] = useState<AnalyticsBucket[]>(fallbackAnalytics);
  const [conversionFunnel, setConversionFunnel] =
    useState<ConversionFunnel>(fallbackConversionFunnel);

  const [selectedCall, setSelectedCall] = useState<CallDetail | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [loadingCallDetail, setLoadingCallDetail] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  const tenantKeyFromUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("tenant_key")
      : null;

  const tenantScopedQuery = tenantKeyFromUrl
    ? `tenant_key=${encodeURIComponent(tenantKeyFromUrl)}`
    : "";

  function withTenantScope(path: string, extraQuery = "") {
    const params = [tenantScopedQuery, extraQuery].filter(Boolean).join("&");
    return `${API_BASE_URL}${path}${params ? `?${params}` : ""}`;
  }

  function buildHeaders() {
    const headers: Record<string, string> = {};
    if (ADMIN_SECRET) {
      headers["X-Admin-Secret"] = ADMIN_SECRET;
    }
    return headers;
  }

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        fetch(withTenantScope("/api/dashboard/summary"), {
          headers: buildHeaders(),
        }).then((r) =>
          r.ok ? r.json() : Promise.reject(new Error("Failed summary"))
        ),
        fetch(
          withTenantScope("/api/dashboard/call-trend", `days=${range === "7d" ? 7 : 30}`),
          { headers: buildHeaders() }
        ).then((r) =>
          r.ok ? r.json() : Promise.reject(new Error("Failed call trend"))
        ),
        fetch(withTenantScope("/api/calls", "limit=20"), {
          headers: buildHeaders(),
        }).then((r) =>
          r.ok ? r.json() : Promise.reject(new Error("Failed calls"))
        ),
        fetch(withTenantScope("/api/leads", "limit=20"), {
          headers: buildHeaders(),
        }).then((r) =>
          r.ok ? r.json() : Promise.reject(new Error("Failed leads"))
        ),
        fetch(`${API_BASE_URL}/api/tenants`, {
          headers: buildHeaders(),
        }).then((r) =>
          r.ok ? r.json() : Promise.reject(new Error("Failed tenants"))
        ),
        fetch(`${API_BASE_URL}/api/system/health`, {
          headers: buildHeaders(),
        }).then((r) =>
          r.ok ? r.json() : Promise.reject(new Error("Failed health"))
        ),
        fetch(
          withTenantScope(
            "/api/dashboard/analytics",
            `group_by=day&start_date=&end_date=`
          ),
          { headers: buildHeaders() }
        ).then((r) =>
          r.ok ? r.json() : Promise.reject(new Error("Failed analytics"))
        ),
        fetch(withTenantScope("/api/dashboard/conversion-funnel"), {
          headers: buildHeaders(),
        }).then((r) =>
          r.ok ? r.json() : Promise.reject(new Error("Failed conversion funnel"))
        ),
      ];

      const [
        summaryRes,
        trendRes,
        callsRes,
        leadsRes,
        tenantsRes,
        healthRes,
        analyticsRes,
        conversionRes,
      ] = await Promise.all(endpoints);

      setSummary({
        calls_today: Number(summaryRes.calls_today ?? fallbackSummary.calls_today),
        booked_meetings: Number(
          summaryRes.booked_meetings ?? fallbackSummary.booked_meetings
        ),
        missed_calls_recovered: Number(
          summaryRes.missed_calls_recovered ??
            fallbackSummary.missed_calls_recovered
        ),
        active_clients: Number(
          summaryRes.active_clients ?? fallbackSummary.active_clients
        ),
        calls_today_note:
          summaryRes.calls_today_note ?? fallbackSummary.calls_today_note ?? "",
        booked_meetings_note:
          summaryRes.booked_meetings_note ??
          fallbackSummary.booked_meetings_note ??
          "",
        missed_calls_recovered_note:
          summaryRes.missed_calls_recovered_note ??
          fallbackSummary.missed_calls_recovered_note ??
          "",
        active_clients_note:
          summaryRes.active_clients_note ??
          fallbackSummary.active_clients_note ??
          "",
      });

      setCallTrend(
        Array.isArray(trendRes) && trendRes.length
          ? trendRes.map((item: any) => ({
              day: String(item.day ?? ""),
              calls: Number(item.calls ?? 0),
              booked: Number(item.booked ?? 0),
            }))
          : fallbackCallTrend
      );

      setRecentCalls(
        Array.isArray(callsRes) && callsRes.length
          ? callsRes.map((item: any) => ({
              id: String(
                item.id ??
                  item.call_id ??
                  `${Date.now()}-${Math.random().toString(36).slice(2)}`
              ),
              caller: String(
                item.caller ??
                  item.caller_name ??
                  item.first_name ??
                  "Unknown Caller"
              ),
              number: String(item.number ?? item.caller_phone ?? ""),
              tenant: String(item.tenant ?? item.tenant_name ?? "Unknown"),
              tenant_id: item.tenant_id ? String(item.tenant_id) : undefined,
              time: formatTime(item.time ?? item.created_at ?? item.started_at),
              raw_time: String(item.time ?? item.created_at ?? item.started_at ?? ""),
              duration: formatDuration(
                item.duration_seconds ?? item.duration ?? null
              ),
              outcome: String(
                item.outcome ?? item.qualification_status ?? "New lead"
              ),
              summary: String(item.summary ?? item.call_summary ?? "No summary"),
            }))
          : fallbackCalls
      );

      setLeads(
        Array.isArray(leadsRes) && leadsRes.length
          ? leadsRes.map((item: any) => ({
              id: String(
                item.id ??
                  `${Date.now()}-${Math.random().toString(36).slice(2)}`
              ),
              name: String(
                item.name ??
                  [item.first_name, item.last_name].filter(Boolean).join(" ") ??
                  "Unknown Lead"
              ),
              niche: String(item.niche ?? item.industry ?? "General"),
              status: String(item.status ?? item.qualification_status ?? "New"),
              business: String(
                item.business ?? item.tenant_name ?? item.company_name ?? "Unknown"
              ),
              business_id: item.tenant_id ? String(item.tenant_id) : undefined,
              issue: String(item.issue ?? item.summary ?? "No issue captured"),
              next: String(item.next ?? item.next_action ?? "Needs follow-up"),
            }))
          : fallbackLeads
      );

      setClients(
        Array.isArray(tenantsRes) && tenantsRes.length
          ? tenantsRes.map((item: any) => ({
              id: String(item.id ?? `tenant-${Math.random().toString(36).slice(2)}`),
              name: String(item.name ?? item.display_name ?? "Unknown client"),
              phone: String(
                item.phone ?? item.phone_number ?? item.primary_phone ?? "No number"
              ),
              status: String(
                item.status ?? (item.is_active ? "Active" : "Inactive")
              ),
              calls: Number(item.calls ?? 0),
              booked: Number(item.booked ?? 0),
              recovered: Number(item.recovered ?? 0),
              tenant_key: item.tenant_key ? String(item.tenant_key) : undefined,
            }))
          : fallbackClients
      );

      setHealth({
        voice_routing: String(
          healthRes.voice_routing ?? fallbackHealth.voice_routing
        ),
        webhook_health: String(
          healthRes.webhook_health ?? fallbackHealth.webhook_health
        ),
        email_delivery: String(
          healthRes.email_delivery ?? fallbackHealth.email_delivery
        ),
        email_retries: Number(
          healthRes.email_retries ?? fallbackHealth.email_retries ?? 0
        ),
        failures:
          Array.isArray(healthRes.failures) && healthRes.failures.length
            ? healthRes.failures.map((item: any) => ({
                label: String(item.label ?? "Unknown issue"),
                value: Number(item.value ?? 0),
                tone: String(
                  item.tone ??
                    toneForFailure(
                      String(item.label ?? ""),
                      Number(item.value ?? 0)
                    )
                ),
              }))
            : fallbackHealth.failures,
        onboarding_progress:
          healthRes.onboarding_progress ?? fallbackHealth.onboarding_progress,
      });

      setAnalytics(
        Array.isArray(analyticsRes?.data) && analyticsRes.data.length
          ? analyticsRes.data.map((item: any) => ({
              bucket: String(item.bucket ?? ""),
              total_calls: Number(item.total_calls ?? 0),
              booked_calls: Number(item.booked_calls ?? 0),
              qualified_calls: Number(item.qualified_calls ?? 0),
              missed_calls: Number(item.missed_calls ?? 0),
              book_rate: Number(item.book_rate ?? 0),
            }))
          : fallbackAnalytics
      );

      setConversionFunnel(
        conversionRes?.ok ? conversionRes : fallbackConversionFunnel
      );
    } catch (err) {
      console.error(err);
      setError(
        "Using fallback demo data because one or more dashboard endpoints are not live yet."
      );
      setSummary(fallbackSummary);
      setCallTrend(fallbackCallTrend);
      setRecentCalls(fallbackCalls);
      setLeads(fallbackLeads);
      setClients(fallbackClients);
      setHealth(fallbackHealth);
      setAnalytics(fallbackAnalytics);
      setConversionFunnel(fallbackConversionFunnel);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantKeyFromUrl, range]);

  async function openCallDetail(callId: string) {
    setLoadingCallDetail(true);
    try {
      const res = await fetch(withTenantScope(`/api/calls/${callId}`), {
        headers: buildHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.detail || data.error || "Failed to load call detail");
      }
      setSelectedCall(data);
      setShowCallModal(true);
    } catch (err) {
      console.error(err);
      setError("Could not load call detail.");
    } finally {
      setLoadingCallDetail(false);
    }
  }

  async function handleExport(dataset: "calls" | "leads" | "dashboard") {
    try {
      const res = await fetch(
        withTenantScope("/api/data/export", `dataset=${dataset}&format=json`),
        { headers: buildHeaders() }
      );
      if (!res.ok) {
        throw new Error("Failed export");
      }
      const data = await res.json();

      const rows = Array.isArray(data) ? data : [data];
      downloadCsv(
        `${tenantKeyFromUrl || "agency"}-${dataset}.csv`,
        rows.map((row: any) =>
          typeof row === "object" && row !== null ? row : { value: row }
        )
      );
    } catch (err) {
      console.error(err);
      setError(`Could not export ${dataset}.`);
    }
  }

  async function handleUploadSeedData(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const tenantParam =
        tenantKeyFromUrl || clients.find((c) => c.id === tenant)?.tenant_key;

      const qs = tenantParam ? `tenant_key=${encodeURIComponent(tenantParam)}` : "";
      const res = await fetch(
        `${API_BASE_URL}/api/data/upload${qs ? `?${qs}` : ""}`,
        {
          method: "POST",
          headers: buildHeaders(),
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.detail || data.error || "Upload failed");
      }

      await loadDashboard();
    } catch (err) {
      console.error(err);
      setError("Could not upload seed data.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const filteredCalls = useMemo(() => {
    return recentCalls.filter((c) => {
      const matchesTenant =
        tenant === "all" ||
        c.tenant_id === tenant ||
        c.tenant.toLowerCase() === tenant.toLowerCase();

      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        [c.caller, c.number, c.tenant, c.summary]
          .join(" ")
          .toLowerCase()
          .includes(q);

      return matchesTenant && matchesSearch;
    });
  }, [recentCalls, tenant, search]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesTenant =
        tenant === "all" ||
        lead.business_id === tenant ||
        lead.business.toLowerCase() === tenant.toLowerCase();

      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        [lead.name, lead.business, lead.issue, lead.status]
          .join(" ")
          .toLowerCase()
          .includes(q);

      return matchesTenant && matchesSearch;
    });
  }, [leads, tenant, search]);

  const visibleClients = useMemo(() => {
    if (tenant === "all") return clients;
    return clients.filter(
      (client) =>
        client.id === tenant ||
        client.name.toLowerCase() === tenant.toLowerCase()
    );
  }, [clients, tenant]);

  const analyticsChartData = useMemo(() => {
    return analytics.map((item) => ({
      ...item,
      label: formatBucketLabel(item.bucket),
    }));
  }, [analytics]);

  const summaryCards = [
    {
      title: "Calls today",
      value: summary.calls_today,
      note: summary.calls_today_note || "",
      icon: PhoneCall,
    },
    {
      title: "Booked meetings",
      value: summary.booked_meetings,
      note: summary.booked_meetings_note || "",
      icon: CalendarDays,
    },
    {
      title: "Missed calls recovered",
      value: summary.missed_calls_recovered,
      note: summary.missed_calls_recovered_note || "",
      icon: BadgeCheck,
    },
    {
      title: "Active clients",
      value: summary.active_clients,
      note: summary.active_clients_note || "",
      icon: Building2,
    },
  ];

  const selectedTenantKeyForProvisioning =
    tenantKeyFromUrl || clients.find((c) => c.id === tenant)?.tenant_key || "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">
                  {selectedCall?.caller_name || "Call detail"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedCall?.tenant_name || "—"} •{" "}
                  {formatDateTime(selectedCall?.time)}
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => setShowCallModal(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-500">Outcome</div>
                    <div className="mt-2 font-semibold text-slate-900">
                      {selectedCall?.outcome || "—"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-500">Caller phone</div>
                    <div className="mt-2 font-semibold text-slate-900">
                      {selectedCall?.caller_phone || "—"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-500">Business</div>
                    <div className="mt-2 font-semibold text-slate-900">
                      {selectedCall?.business_name || "—"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-500">Line</div>
                    <div className="mt-2 font-semibold text-slate-900">
                      {selectedCall?.tenant_phone_label || "—"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <CheckCircle2 className="h-4 w-4" />
                  AI Summary
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                  {selectedCall?.summary || "No summary available."}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <FileText className="h-4 w-4" />
                  Transcript
                </div>
                <div className="mt-3 max-h-[340px] overflow-y-auto whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  {selectedCall?.transcript || "No transcript available."}
                </div>
              </div>

              {selectedCall?.payload ? (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-medium text-slate-900">
                    Raw payload
                  </div>
                  <pre className="mt-3 max-h-[260px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                    {JSON.stringify(selectedCall.payload, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

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
                <div className="text-xs text-slate-500">Operations Console</div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <nav className="space-y-1">
              {[
                ["dashboard", "Dashboard", BarChart3],
                ["calls", "Calls", Phone],
                ["leads", "Leads", ClipboardList],
                ["clients", "Clients", Building2],
                ["settings", "Settings", Settings],
              ].map(([key, label, Icon]: any) => (
                <button
                  key={key}
                  onClick={() => setPage(key)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${
                    page === key
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="px-4">
            <Card className="rounded-3xl border-slate-200/80 bg-slate-900 text-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Headphones className="h-5 w-5" />
                  <div className="font-medium">Live system status</div>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <span>Voice routing</span>
                    <Badge className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/20">
                      {health.voice_routing}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Webhook health</span>
                    <Badge className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/20">
                      {health.webhook_health}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email delivery</span>
                    <Badge className="bg-amber-500/20 text-amber-100 hover:bg-amber-500/20">
                      {health.email_delivery}
                    </Badge>
                  </div>
                </div>
                <Button
                  className="mt-5 w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100"
                  onClick={loadDashboard}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
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
                  Confluxa Control Room
                </h1>
                <p className="text-sm text-slate-500">
                  Run clients, monitor calls, and prove ROI from one place.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[260px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-2xl border-slate-200 pl-9"
                    placeholder="Search calls, tenants, leads"
                  />
                </div>

                <Select value={tenant} onValueChange={setTenant}>
                  <SelectTrigger className="w-[220px] rounded-2xl border-slate-200">
                    <SelectValue placeholder="Tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tenants</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="rounded-2xl bg-slate-900 hover:bg-slate-800"
                  onClick={() => window.open(ADMIN_BASE_URL, "_blank")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New client
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
                    Logout
                  </Button>

                  <Avatar className="h-10 w-10 rounded-2xl">
                    <AvatarFallback className="rounded-2xl bg-orange-100 text-orange-900">
                      EE
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-8 px-6 py-6">
            {error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                Loading dashboard data...
              </div>
            ) : null}

            {page === "dashboard" && (
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

                <div className="grid gap-4 md:grid-cols-3">
                  <StatCard
                    title="Total leads"
                    value={conversionFunnel.total_leads}
                    note="All captured leads"
                    icon={Users}
                  />
                  <StatCard
                    title="Lead → Booked"
                    value={`${conversionFunnel.conversion.lead_to_booked_pct}%`}
                    note="Overall booking conversion"
                    icon={TrendingUp}
                  />
                  <StatCard
                    title="Qualified → Booked"
                    value={`${conversionFunnel.conversion.qualified_to_booked_pct}%`}
                    note="High-intent conversion"
                    icon={CheckCircle2}
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <SectionTitle
                        title="Call performance"
                        description="Calls and bookings over time for the selected window."
                        action={
                          <Tabs
                            value={range}
                            onValueChange={(value) => setRange(value as "7d" | "30d")}
                          >
                            <TabsList className="rounded-2xl bg-slate-100">
                              <TabsTrigger value="7d">7D</TabsTrigger>
                              <TabsTrigger value="30d">30D</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        }
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analyticsChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="total_calls"
                              strokeWidth={4}
                              dot={false}
                              name="Calls"
                            />
                            <Line
                              type="monotone"
                              dataKey="booked_calls"
                              strokeWidth={4}
                              dot={false}
                              name="Booked"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>System attention</CardTitle>
                      <CardDescription>
                        Items that need review before they affect client experience.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(health.failures ?? fallbackFailures).map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-slate-100 p-2">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{item.label}</div>
                              <div className="text-sm text-slate-500">Last 24 hours</div>
                            </div>
                          </div>
                          <Badge className={item.tone}>{item.value}</Badge>
                        </div>
                      ))}

                      {health.onboarding_progress ? (
                        <div className="rounded-2xl bg-slate-100 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {health.onboarding_progress.label}
                              </div>
                              <div className="text-sm text-slate-500">
                                {health.onboarding_progress.description}
                              </div>
                            </div>
                            <Briefcase className="h-5 w-5 text-slate-500" />
                          </div>
                          <Progress
                            value={health.onboarding_progress.percent}
                            className="mt-4"
                          />
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                  <CardHeader>
                    <CardTitle>Lead conversion tracking</CardTitle>
                    <CardDescription>
                      Follow how leads move from new to booked and won.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {conversionFunnel.stages.map((stage) => (
                        <div
                          key={stage.stage}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="text-sm text-slate-500">{stage.stage}</div>
                          <div className="mt-2 text-2xl font-semibold text-slate-900">
                            {stage.count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <SectionTitle
                        title="Recent calls"
                        description="Live view of incoming conversations across tenants."
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
                            <TableHead>Tenant</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Outcome</TableHead>
                            <TableHead>Summary</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCalls.map((call) => (
                            <TableRow
                              key={call.id}
                              className="cursor-pointer"
                              onClick={() => openCallDetail(call.id)}
                            >
                              <TableCell>
                                <div className="font-medium">{call.caller}</div>
                                <div className="text-xs text-slate-500">{call.number}</div>
                              </TableCell>
                              <TableCell>{call.tenant}</TableCell>
                              <TableCell>
                                <div>{call.time}</div>
                                <div className="text-xs text-slate-500">
                                  {call.duration}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="rounded-full">
                                  {call.outcome}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[320px] truncate">
                                {call.summary}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Lead pipeline</CardTitle>
                      <CardDescription>
                        What the business owner wants to see at a glance.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {filteredLeads.slice(0, 4).map((lead) => (
                        <div
                          key={lead.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{lead.name}</div>
                              <div className="text-sm text-slate-500">
                                {lead.business}
                              </div>
                            </div>
                            <Badge variant="secondary" className="rounded-full">
                              {lead.status}
                            </Badge>
                          </div>
                          <div className="mt-3 text-sm text-slate-600">
                            {lead.issue}
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" />
                            {lead.next}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {page === "calls" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionTitle
                  title="Calls"
                  description="Every call, transcript, and outcome in one operational view."
                  action={
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="rounded-2xl border-slate-200"
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                      <Button
                        className="rounded-2xl bg-slate-900 hover:bg-slate-800"
                        onClick={() => handleExport("calls")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  }
                />
                <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Caller</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Date / time</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Outcome</TableHead>
                          <TableHead>Transcript summary</TableHead>
                          <TableHead>Follow-up</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCalls.map((call) => (
                          <TableRow key={`${call.id}-calls`}>
                            <TableCell>
                              <div className="font-medium">{call.caller}</div>
                              <div className="text-xs text-slate-500">{call.number}</div>
                            </TableCell>
                            <TableCell>{call.tenant}</TableCell>
                            <TableCell>{call.time}</TableCell>
                            <TableCell>{call.duration}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{call.outcome}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[340px] truncate">
                              {call.summary}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                className="rounded-2xl border-slate-200"
                                onClick={() => openCallDetail(call.id)}
                                disabled={loadingCallDetail}
                              >
                                Open
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {page === "leads" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionTitle
                  title="Leads"
                  description="Captured from calls and ready for follow-up."
                  action={
                    <Button
                      className="rounded-2xl bg-slate-900 hover:bg-slate-800"
                      onClick={() => handleExport("leads")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export leads
                    </Button>
                  }
                />
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  {filteredLeads.map((lead) => (
                    <Card
                      key={lead.id}
                      className="rounded-3xl border-slate-200/80 shadow-sm"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-slate-500">
                              {lead.business}
                            </div>
                          </div>
                          <Badge variant="secondary">{lead.status}</Badge>
                        </div>
                        <div className="mt-4 text-sm text-slate-600">
                          {lead.issue}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                          <Activity className="h-3.5 w-3.5" />
                          {lead.niche}
                        </div>
                        <div className="mt-5 flex items-center justify-between">
                          <span className="text-xs text-slate-500">{lead.next}</span>
                          <Button variant="ghost" className="rounded-2xl">
                            View <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {page === "clients" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionTitle
                  title="Clients"
                  description="Manage tenants, phone lines, performance in one place."
                  action={
                    <div className="flex gap-2">
                      <label className="inline-flex cursor-pointer items-center">
                        <input
                          type="file"
                          className="hidden"
                          accept=".csv,.json"
                          onChange={handleUploadSeedData}
                          disabled={uploading}
                        />
                        <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
                          <Upload className="mr-2 h-4 w-4" />
                          {uploading ? "Uploading..." : "Upload seed data"}
                        </span>
                      </label>
                      <Button
                        className="rounded-2xl bg-slate-900 hover:bg-slate-800"
                        onClick={() => window.open(ADMIN_BASE_URL, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Admin
                      </Button>
                    </div>
                  }
                />
                <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Calls</TableHead>
                            <TableHead>Booked</TableHead>
                            <TableHead>Recovered</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visibleClients.map((client) => (
                            <TableRow key={client.id}>
                              <TableCell className="font-medium">
                                {client.name}
                              </TableCell>
                              <TableCell>{client.phone}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{client.status}</Badge>
                              </TableCell>
                              <TableCell>{client.calls}</TableCell>
                              <TableCell>{client.booked}</TableCell>
                              <TableCell>{client.recovered}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Client health snapshot</CardTitle>
                      <CardDescription>
                        Show this view in demos to make Confluxa feel premium.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={visibleClients}>
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

                <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                  <CardHeader>
                    <CardTitle>Admin tenant provisioning</CardTitle>
                    <CardDescription>
                      Provisioning checklist for onboarding a client properly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          title: "Tenant selected",
                          done: !!selectedTenantKeyForProvisioning,
                          note: selectedTenantKeyForProvisioning || "Choose a tenant",
                        },
                        {
                          title: "Phone line mapped",
                          done: visibleClients.length > 0,
                          note: "Verify Twilio / Vapi number",
                        },
                        {
                          title: "Seed data loaded",
                          done: recentCalls.length > 0,
                          note: "Upload CSV or JSON if needed",
                        },
                        {
                          title: "Dashboard live",
                          done: true,
                          note: "Client view is available",
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-slate-900">
                              {item.title}
                            </div>
                            {item.done ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                            )}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            {item.note}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {page === "settings" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionTitle
                  title="Settings"
                  description="Workspace settings, diagnostics, and admin access."
                />
                <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Workspace access</CardTitle>
                      <CardDescription>
                        This dashboard is for monitoring performance. Client onboarding lives in Admin.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                        {tenantKeyFromUrl ? (
                          <div className="space-y-2">
                            <div className="font-medium text-slate-900">
                              Tenant-scoped dashboard
                            </div>
                            <div>
                              Current tenant key:{" "}
                              <span className="font-medium">{tenantKeyFromUrl}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="font-medium text-slate-900">
                              Agency-wide demo view
                            </div>
                            <div>
                              Add <span className="font-medium">?tenant_key=your-tenant-key</span>{" "}
                              to the URL to scope this dashboard to one client.
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-sm font-medium text-slate-900">
                          Backend API
                        </div>
                        <div className="mt-1 break-all text-sm text-slate-500">
                          {API_BASE_URL}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          className="rounded-2xl bg-slate-900 hover:bg-slate-800"
                          onClick={() => window.open(ADMIN_BASE_URL, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Admin
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-2xl border-slate-200"
                          onClick={loadDashboard}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Run diagnostics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Admin shortcuts</CardTitle>
                      <CardDescription>
                        Fast actions for you and your team.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        ["View webhook logs", Activity],
                        ["Map Twilio numbers", Phone],
                        ["Review failed deliveries", AlertTriangle],
                        ["Open call events", ClipboardList],
                        ["Check API health", CheckCircle2],
                      ].map(([label, Icon]: any) => (
                        <button
                          key={label}
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
          </div>
        </main>
      </div>
    </div>
  );
}