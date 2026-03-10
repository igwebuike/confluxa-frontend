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
  ArrowUpRight,
  DollarSign,
  X,
  Wrench,
  Link2,
  LifeBuoy,
  FileWarning,
  ChevronRight,
  ExternalLink,
  Eye,
} from "lucide-react";

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

type Summary = {
  calls_today: number;
  booked_meetings: number;
  missed_calls_recovered: number;
  active_clients: number;
  calls_today_note?: string;
  booked_meetings_note?: string;
  missed_calls_recovered_note?: string;
  active_clients_note?: string;
};

type CallRow = {
  id: string;
  tenant_id?: string;
  tenant_name: string;
  caller_name: string;
  caller_phone: string;
  time: string;
  outcome: string;
  summary: string;
};

type LeadRow = {
  id: string;
  tenant_id?: string;
  tenant_name: string;
  name: string;
  niche: string;
  status: string;
  business: string;
  issue: string;
  next_action: string;
};

type TenantRow = {
  id: string;
  tenant_key?: string;
  name: string;
  phone_number: string;
  status: string;
  calls: number;
  booked: number;
  recovered: number;
};

type FailureRow = {
  label: string;
  value: number;
  tone: string;
};

type Health = {
  voice_routing: string;
  webhook_health: string;
  email_delivery: string;
  email_retries: number;
  failures: FailureRow[];
  onboarding_progress?: {
    label: string;
    description: string;
    percent: number;
  };
};

type TenantPhoneNumber = {
  id: string;
  tenant_id: string;
  label: string;
  country_code: string;
  phone_number: string;
  phone_e164?: string;
  notification_email?: string;
  delivery_mode?: string;
  is_active: boolean;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
};

type TenantRecipient = {
  id: string;
  email: string;
  notification_type: string;
  is_active: boolean;
  created_at?: string;
};

type TenantDetail = {
  ok: boolean;
  tenant?: {
    id: string;
    tenant_key: string;
    name: string;
    display_name?: string;
    is_active: boolean;
    created_at?: string;
  };
  phone_numbers?: TenantPhoneNumber[];
  notification_recipients?: TenantRecipient[];
  stats?: {
    calls: number;
    contacts: number;
    integrations: number;
  };
  error?: string;
};

type AdminSection =
  | "overview"
  | "tenants"
  | "calls"
  | "leads"
  | "system"
  | "settings";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://confluxa-core.onrender.com";

const APP_BASE =
  process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/+$/, "") ||
  "https://app.getconfluxa.com";

const emptySummary: Summary = {
  calls_today: 0,
  booked_meetings: 0,
  missed_calls_recovered: 0,
  active_clients: 0,
};

function fmtTime(value?: string) {
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

function statusTone(status?: string) {
  const s = (status || "").toLowerCase();
  if (
    s.includes("active") ||
    s.includes("healthy") ||
    s.includes("booked") ||
    s.includes("qualified")
  ) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (
    s.includes("new") ||
    s.includes("retry") ||
    s.includes("onboarding") ||
    s.includes("needs")
  ) {
    return "bg-amber-100 text-amber-900 border-amber-200";
  }
  if (
    s.includes("inactive") ||
    s.includes("failed") ||
    s.includes("alert") ||
    s.includes("miss")
  ) {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
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
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function ConfluxaAdminPage() {
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [health, setHealth] = useState<Health | null>(null);

  const [section, setSection] = useState<AdminSection>("overview");
  const [query, setQuery] = useState("");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingTenant, setSavingTenant] = useState(false);
  const [loadingTenantDetail, setLoadingTenantDetail] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [showTenantDetailModal, setShowTenantDetailModal] = useState(false);

  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [selectedTenantDetail, setSelectedTenantDetail] =
    useState<TenantDetail | null>(null);

  const [newTenant, setNewTenant] = useState({
    business_name: "",
    notification_email: "",
    phone_number: "",
    industry: "hvac",
    delivery_mode: "email",
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [summaryRes, callsRes, leadsRes, tenantsRes, healthRes] =
        await Promise.all([
          fetch(`${API_BASE}/api/dashboard/summary`).then((r) => r.json()),
          fetch(`${API_BASE}/api/calls?limit=20`).then((r) => r.json()),
          fetch(`${API_BASE}/api/leads?limit=20`).then((r) => r.json()),
          fetch(`${API_BASE}/api/tenants`).then((r) => r.json()),
          fetch(`${API_BASE}/api/system/health`).then((r) => r.json()),
        ]);

      setSummary(summaryRes || emptySummary);
      setCalls(Array.isArray(callsRes) ? callsRes : []);
      setLeads(Array.isArray(leadsRes) ? leadsRes : []);
      setTenants(Array.isArray(tenantsRes) ? tenantsRes : []);
      setHealth(healthRes || null);
    } catch (e) {
      console.error(e);
      setError(
        "Could not load admin data. Check API base URL and backend health."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredCalls = useMemo(() => {
    return calls.filter((item) => {
      const matchesTenant =
        tenantFilter === "all" ||
        item.tenant_name?.toLowerCase() === tenantFilter.toLowerCase();

      const haystack = [
        item.caller_name,
        item.caller_phone,
        item.tenant_name,
        item.summary,
        item.outcome,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      return matchesTenant && matchesQuery;
    });
  }, [calls, query, tenantFilter]);

  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      const matchesTenant =
        tenantFilter === "all" ||
        item.tenant_name?.toLowerCase() === tenantFilter.toLowerCase();

      const haystack = [
        item.name,
        item.business,
        item.issue,
        item.status,
        item.next_action,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      return matchesTenant && matchesQuery;
    });
  }, [leads, query, tenantFilter]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesTenant =
        tenantFilter === "all" ||
        tenant.name?.toLowerCase() === tenantFilter.toLowerCase();

      const haystack = [tenant.name, tenant.phone_number, tenant.status]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      return matchesTenant && matchesQuery;
    });
  }, [tenants, query, tenantFilter]);

  const tenantsNeedingAttention = useMemo(() => {
    const failureCount = (health?.failures || []).reduce(
      (acc, item) => acc + (item.value > 0 ? 1 : 0),
      0
    );
    return failureCount;
  }, [health]);

  const monthlyAgencyMrr = useMemo(() => {
    return (
      tenants.filter((t) => t.status.toLowerCase().includes("active")).length *
      1500
    );
  }, [tenants]);

  const setupFeesThisMonth = useMemo(() => {
    return tenants.length * 500;
  }, [tenants]);

  function triggerAction(message: string, nextSection?: AdminSection) {
    setActionMessage(message);
    if (nextSection) setSection(nextSection);
  }

  function resetNewTenantForm() {
    setNewTenant({
      business_name: "",
      notification_email: "",
      phone_number: "",
      industry: "hvac",
      delivery_mode: "email",
    });
  }

  async function loadTenantDetail(tenantId: string) {
    if (!tenantId) return;

    setLoadingTenantDetail(true);
    setActionMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/tenants/${tenantId}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load tenant details.");
      }

      setSelectedTenantId(tenantId);
      setSelectedTenantDetail(data);
      setShowTenantDetailModal(true);
    } catch (e: any) {
      console.error(e);
      setActionMessage(e.message || "Could not load tenant detail.");
    } finally {
      setLoadingTenantDetail(false);
    }
  }

  async function saveNewTenant() {
    if (!newTenant.business_name.trim()) {
      setActionMessage("Enter a business name first.");
      return;
    }

    setSavingTenant(true);
    setActionMessage("");
    setError("");

    try {
      const payload = {
        name: newTenant.business_name.trim(),
        display_name: newTenant.business_name.trim(),
        phone_number: newTenant.phone_number.trim() || undefined,
        notification_email:
          newTenant.notification_email.trim() || undefined,
        delivery_mode: newTenant.delivery_mode || "email",
        country_code: "US",
        label: "Main",
        is_active: true,
      };

      const res = await fetch(`${API_BASE}/api/admin/tenants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create tenant.");
      }

      setActionMessage(
        `Tenant created successfully: ${
          data.tenant?.display_name || data.tenant?.name || newTenant.business_name
        }`
      );

      setShowNewTenantModal(false);
      resetNewTenantForm();
      await loadData();
      setSection("tenants");

      if (data.tenant?.id) {
        await loadTenantDetail(data.tenant.id);
      }
    } catch (e: any) {
      console.error(e);
      setActionMessage(e.message || "Could not create tenant.");
    } finally {
      setSavingTenant(false);
    }
  }

  function getTenantDashboardUrl(tenant: TenantRow) {
    if (tenant.tenant_key) {
      return `${APP_BASE}/dashboard?tenant_key=${encodeURIComponent(
        tenant.tenant_key
      )}`;
    }
    return `${APP_BASE}/dashboard`;
  }

  const navItems: {
    key: AdminSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "overview", label: "Agency Overview", icon: LayoutDashboard },
    { key: "tenants", label: "Tenants", icon: Users },
    { key: "calls", label: "Calls", icon: Phone },
    { key: "leads", label: "Leads", icon: ClipboardList },
    { key: "system", label: "System", icon: Shield },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ModalShell
        open={showNewTenantModal}
        title="Add new tenant"
        description="Use this for onboarding new Confluxa clients."
        onClose={() => {
          if (!savingTenant) setShowNewTenantModal(false);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Business name</label>
            <Input
              className="rounded-2xl"
              value={newTenant.business_name}
              onChange={(e) =>
                setNewTenant((p) => ({ ...p, business_name: e.target.value }))
              }
              placeholder="Innovative Mechanical, LLC"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notification email</label>
            <Input
              className="rounded-2xl"
              value={newTenant.notification_email}
              onChange={(e) =>
                setNewTenant((p) => ({
                  ...p,
                  notification_email: e.target.value,
                }))
              }
              placeholder="owner@business.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone number</label>
            <Input
              className="rounded-2xl"
              value={newTenant.phone_number}
              onChange={(e) =>
                setNewTenant((p) => ({ ...p, phone_number: e.target.value }))
              }
              placeholder="+1 281 299 3921"
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Delivery mode</label>
            <Select
              value={newTenant.delivery_mode}
              onValueChange={(value) =>
                setNewTenant((p) => ({ ...p, delivery_mode: value }))
              }
            >
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="crm">CRM push</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setShowNewTenantModal(false)}
            disabled={savingTenant}
          >
            Cancel
          </Button>
          <Button
            className="rounded-2xl bg-slate-950 hover:bg-slate-800"
            onClick={saveNewTenant}
            disabled={savingTenant}
          >
            {savingTenant ? "Saving..." : "Save tenant"}
          </Button>
        </div>
      </ModalShell>

      <ModalShell
        open={showTenantDetailModal}
        title={
          selectedTenantDetail?.tenant?.display_name ||
          selectedTenantDetail?.tenant?.name ||
          "Tenant detail"
        }
        description="Tenant profile, phone mapping, recipients, and current stats."
        onClose={() => setShowTenantDetailModal(false)}
      >
        {loadingTenantDetail ? (
          <div className="text-sm text-slate-500">Loading tenant detail...</div>
        ) : !selectedTenantDetail?.ok ? (
          <div className="text-sm text-red-600">
            {selectedTenantDetail?.error || "Could not load tenant detail."}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-2xl border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-500">Calls</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {selectedTenantDetail.stats?.calls ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-500">Contacts</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {selectedTenantDetail.stats?.contacts ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-500">Integrations</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {selectedTenantDetail.stats?.integrations ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-medium text-slate-900">
                Tenant info
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm text-slate-600">
                <div>
                  <span className="font-medium text-slate-900">Tenant key:</span>{" "}
                  {selectedTenantDetail.tenant?.tenant_key || "—"}
                </div>
                <div>
                  <span className="font-medium text-slate-900">Status:</span>{" "}
                  {selectedTenantDetail.tenant?.is_active ? "Active" : "Inactive"}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-slate-900">Created:</span>{" "}
                  {fmtTime(selectedTenantDetail.tenant?.created_at)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-900">
                  Phone numbers
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {(selectedTenantDetail.phone_numbers || []).length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No phone numbers assigned yet.
                  </div>
                ) : (
                  selectedTenantDetail.phone_numbers?.map((phone) => (
                    <div
                      key={phone.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">
                            {phone.label || "Main"}
                          </div>
                          <div className="text-sm text-slate-500">
                            {phone.phone_e164 || phone.phone_number || "—"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {phone.is_primary ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              Primary
                            </Badge>
                          ) : null}
                          <Badge className={statusTone(phone.is_active ? "active" : "inactive")}>
                            {phone.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <div>
                          <span className="font-medium text-slate-900">
                            Country:
                          </span>{" "}
                          {phone.country_code || "—"}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">
                            Delivery:
                          </span>{" "}
                          {phone.delivery_mode || "email"}
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium text-slate-900">
                            Notification email:
                          </span>{" "}
                          {phone.notification_email || "—"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-medium text-slate-900">
                Notification recipients
              </div>

              <div className="mt-4 space-y-2">
                {(selectedTenantDetail.notification_recipients || []).length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No notification recipients configured.
                  </div>
                ) : (
                  selectedTenantDetail.notification_recipients?.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {recipient.email}
                        </div>
                        <div className="text-xs text-slate-500">
                          {recipient.notification_type}
                        </div>
                      </div>
                      <Badge className={statusTone(recipient.is_active ? "active" : "inactive")}>
                        {recipient.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <a
                href={`${APP_BASE}/dashboard?tenant_key=${encodeURIComponent(
                  selectedTenantDetail.tenant?.tenant_key || ""
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" className="rounded-2xl">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open dashboard
                </Button>
              </a>
            </div>
          </div>
        )}
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
                  onClick={loadData}
                  className="mt-5 w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh data
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
                    onClick={() =>
                      triggerAction(
                        "Open Twilio / phone mapping workflow next.",
                        "system"
                      )
                    }
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-3 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Map numbers
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() =>
                      triggerAction("Reviewing failed deliveries section.", "system")
                    }
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-3 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <FileWarning className="h-4 w-4" />
                      Review failures
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() =>
                      triggerAction(
                        "Opening settings area for diagnostics and config.",
                        "settings"
                      )
                    }
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-3 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Open diagnostics
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
                  Run onboarding, delivery, tenant management, and growth from one
                  console.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative min-w-[280px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search callers, tenants, leads"
                    className="rounded-2xl border-slate-200 pl-9"
                  />
                </div>

                <Select value={tenantFilter} onValueChange={setTenantFilter}>
                  <SelectTrigger className="w-[220px] rounded-2xl border-slate-200">
                    <SelectValue placeholder="All tenants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tenants</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.name}>
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
                  onClick={() =>
                    triggerAction(
                      "Notifications panel placeholder. Wire this later."
                    )
                  }
                >
                  <Bell className="h-4 w-4" />
                </Button>

                <Avatar className="h-10 w-10 rounded-2xl">
                  <AvatarFallback className="rounded-2xl bg-orange-100 text-orange-900">
                    EE
                  </AvatarFallback>
                </Avatar>
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

            {section === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    title="Monthly recurring revenue"
                    value={`$${monthlyAgencyMrr.toLocaleString()}`}
                    note={`${
                      tenants.filter((t) =>
                        t.status.toLowerCase().includes("active")
                      ).length
                    } active paying tenants`}
                    icon={DollarSign}
                  />
                  <MetricCard
                    title="Setup fees this month"
                    value={`$${setupFeesThisMonth.toLocaleString()}`}
                    note="Demo estimate until billing module is live"
                    icon={ArrowUpRight}
                  />
                  <MetricCard
                    title="Tenants needing attention"
                    value={tenantsNeedingAttention}
                    note="Based on system alerts and failures"
                    icon={AlertTriangle}
                  />
                  <MetricCard
                    title="Calls across tenants today"
                    value={summary.calls_today}
                    note={summary.calls_today_note}
                    icon={Phone}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    title="Booked meetings"
                    value={summary.booked_meetings}
                    note={summary.booked_meetings_note}
                    icon={ClipboardList}
                  />
                  <MetricCard
                    title="Recovered opportunities"
                    value={summary.missed_calls_recovered}
                    note={summary.missed_calls_recovered_note}
                    icon={CheckCircle2}
                  />
                  <MetricCard
                    title="Active tenant accounts"
                    value={summary.active_clients}
                    note={summary.active_clients_note}
                    icon={Users}
                  />
                  <MetricCard
                    title="Email retries"
                    value={health?.email_retries ?? 0}
                    note="Platform delivery retry count"
                    icon={Mail}
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Agency command center</CardTitle>
                      <CardDescription>
                        The operator view for sales, onboarding, support, and
                        retention.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <button
                        onClick={() => setSection("tenants")}
                        className="rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <Users className="h-4 w-4" />
                          Tenant operations
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          View all tenants, their status, phone lines, and
                          performance.
                        </p>
                      </button>

                      <button
                        onClick={() => setSection("system")}
                        className="rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <Shield className="h-4 w-4" />
                          Delivery + reliability
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          Monitor webhook health, retries, summary delivery, and
                          issues.
                        </p>
                      </button>

                      <button
                        onClick={() => setSection("calls")}
                        className="rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <Phone className="h-4 w-4" />
                          Call review
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          Search inbound activity across all tenants from one
                          place.
                        </p>
                      </button>

                      <button
                        onClick={() => setSection("leads")}
                        className="rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <Activity className="h-4 w-4" />
                          Pipeline visibility
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          Track qualified leads, follow-ups, and proof for
                          upsells.
                        </p>
                      </button>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>System attention</CardTitle>
                      <CardDescription>
                        What needs review before it affects delivery.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(health?.failures || []).map((item) => (
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
                              <div className="text-sm text-slate-500">
                                Last 24 hours
                              </div>
                            </div>
                          </div>
                          <Badge className={item.tone}>{item.value}</Badge>
                        </div>
                      ))}

                      {health?.onboarding_progress ? (
                        <div className="rounded-2xl bg-slate-100 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="font-medium">
                                {health.onboarding_progress.label}
                              </div>
                              <div className="text-sm text-slate-500">
                                {health.onboarding_progress.description}
                              </div>
                            </div>
                            <Users className="h-5 w-5 text-slate-500" />
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

                <Tabs defaultValue="calls" className="space-y-6">
                  <TabsList className="rounded-2xl bg-slate-100">
                    <TabsTrigger value="calls">Calls</TabsTrigger>
                    <TabsTrigger value="leads">Leads</TabsTrigger>
                    <TabsTrigger value="tenants">Tenants</TabsTrigger>
                  </TabsList>

                  <TabsContent value="calls">
                    <Card className="rounded-3xl border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle>All tenant call activity</CardTitle>
                        <CardDescription>
                          Every inbound conversation across all tenants.
                        </CardDescription>
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
                            {filteredCalls.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell>
                                  <div className="font-medium">
                                    {row.caller_name || "Unknown Caller"}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {row.caller_phone || "—"}
                                  </div>
                                </TableCell>
                                <TableCell>{row.tenant_name}</TableCell>
                                <TableCell>{fmtTime(row.time)}</TableCell>
                                <TableCell>
                                  <Badge className={statusTone(row.outcome)}>
                                    {row.outcome}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-[320px] truncate">
                                  {row.summary || "No summary yet"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="leads">
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                      {filteredLeads.map((lead) => (
                        <Card
                          key={lead.id}
                          className="rounded-3xl border-slate-200 shadow-sm"
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">{lead.name}</div>
                                <div className="text-sm text-slate-500">
                                  {lead.business}
                                </div>
                              </div>
                              <Badge className={statusTone(lead.status)}>
                                {lead.status}
                              </Badge>
                            </div>
                            <div className="mt-4 text-sm text-slate-600">
                              {lead.issue}
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                              <span>{lead.niche}</span>
                              <span>{lead.next_action}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="tenants">
                    <Card className="rounded-3xl border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle>Tenant accounts</CardTitle>
                        <CardDescription>
                          Use this for pricing, support, onboarding, and
                          reviews.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Calls</TableHead>
                              <TableHead>Booked</TableHead>
                              <TableHead>Recovered</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTenants.map((tenant) => (
                              <TableRow key={tenant.id}>
                                <TableCell className="font-medium">
                                  {tenant.name}
                                </TableCell>
                                <TableCell>{tenant.phone_number}</TableCell>
                                <TableCell>
                                  <Badge className={statusTone(tenant.status)}>
                                    {tenant.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{tenant.calls}</TableCell>
                                <TableCell>{tenant.booked}</TableCell>
                                <TableCell>{tenant.recovered}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-2xl"
                                      onClick={() => loadTenantDetail(tenant.id)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </Button>
                                    <a
                                      href={getTenantDashboardUrl(tenant)}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-2xl"
                                      >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Dashboard
                                      </Button>
                                    </a>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}

            {section === "tenants" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionHeader
                  title="Tenant management"
                  description="Manage all client accounts, status, numbers, and performance."
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
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Calls</TableHead>
                          <TableHead>Booked</TableHead>
                          <TableHead>Recovered</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTenants.map((tenant) => (
                          <TableRow key={tenant.id}>
                            <TableCell className="font-medium">
                              {tenant.name}
                            </TableCell>
                            <TableCell>{tenant.phone_number}</TableCell>
                            <TableCell>
                              <Badge className={statusTone(tenant.status)}>
                                {tenant.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{tenant.calls}</TableCell>
                            <TableCell>{tenant.booked}</TableCell>
                            <TableCell>{tenant.recovered}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-2xl"
                                  onClick={() => loadTenantDetail(tenant.id)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                                <a
                                  href={getTenantDashboardUrl(tenant)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-2xl"
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Dashboard
                                  </Button>
                                </a>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {section === "calls" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionHeader
                  title="Call operations"
                  description="Search and review all inbound call activity across the platform."
                  action={
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() =>
                          triggerAction(
                            "Filter drawer placeholder. Add advanced filters next."
                          )
                        }
                      >
                        Filter
                      </Button>
                      <Button
                        className="rounded-2xl bg-slate-950 hover:bg-slate-800"
                        onClick={() =>
                          triggerAction(
                            "Export placeholder. Next step: CSV download."
                          )
                        }
                      >
                        Export
                      </Button>
                    </div>
                  }
                />

                <Card className="rounded-3xl border-slate-200 shadow-sm">
                  <CardContent className="p-0">
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
                        {filteredCalls.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <div className="font-medium">
                                {row.caller_name || "Unknown Caller"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {row.caller_phone || "—"}
                              </div>
                            </TableCell>
                            <TableCell>{row.tenant_name}</TableCell>
                            <TableCell>{fmtTime(row.time)}</TableCell>
                            <TableCell>
                              <Badge className={statusTone(row.outcome)}>
                                {row.outcome}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[320px] truncate">
                              {row.summary || "No summary yet"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {section === "leads" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionHeader
                  title="Lead pipeline"
                  description="All captured leads and their next action across tenants."
                />

                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredLeads.map((lead) => (
                    <Card
                      key={lead.id}
                      className="rounded-3xl border-slate-200 shadow-sm"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-slate-500">
                              {lead.business}
                            </div>
                          </div>
                          <Badge className={statusTone(lead.status)}>
                            {lead.status}
                          </Badge>
                        </div>
                        <div className="mt-4 text-sm text-slate-600">
                          {lead.issue}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                          <span>{lead.niche}</span>
                          <span>{lead.next_action}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {section === "system" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionHeader
                  title="System + delivery"
                  description="Monitor platform reliability, mapping, notifications, and backend health."
                />

                <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Platform health detail</CardTitle>
                      <CardDescription>
                        Internal checks for backend delivery quality.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        <div>
                          <div className="font-medium">Voice routing</div>
                          <div className="text-sm text-slate-500">
                            Phone and assistant flow
                          </div>
                        </div>
                        <Badge className={statusTone(health?.voice_routing)}>
                          {health?.voice_routing || "—"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        <div>
                          <div className="font-medium">Webhook health</div>
                          <div className="text-sm text-slate-500">
                            Inbound event processing
                          </div>
                        </div>
                        <Badge className={statusTone(health?.webhook_health)}>
                          {health?.webhook_health || "—"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        <div>
                          <div className="font-medium">Email delivery</div>
                          <div className="text-sm text-slate-500">
                            Summary delivery status
                          </div>
                        </div>
                        <Badge className={statusTone(health?.email_delivery)}>
                          {health?.email_delivery || "—"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Operator actions</CardTitle>
                      <CardDescription>
                        Fast shortcuts for internal management.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        ["Review webhook logs", Activity],
                        ["Map Twilio numbers", Link2],
                        ["Review failed deliveries", FileWarning],
                        ["Support queue", LifeBuoy],
                        ["Run diagnostics", Wrench],
                      ].map(([label, Icon]: any) => (
                        <button
                          key={label}
                          onClick={() =>
                            triggerAction(
                              `${label} clicked. Wire endpoint or route next.`
                            )
                          }
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

            {section === "settings" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <SectionHeader
                  title="Agency settings"
                  description="Internal configuration and next-step wiring points."
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
                        <div className="text-sm font-medium">Next steps</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-500">
                          <li>Tenant creation is now wired to admin API</li>
                          <li>Tenant detail modal is live</li>
                          <li>Tenant dashboard deep links are live</li>
                          <li>Add CSV export for calls/leads</li>
                          <li>Add billing/MRR endpoint</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Admin notes</CardTitle>
                      <CardDescription>
                        Use this page as the agency operating layer, not the
                        client view.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-500">
                      <p>
                        Client dashboard answers: “How is one business doing?”
                      </p>
                      <p>
                        Agency admin answers: “What needs action across all
                        tenants, revenue, delivery, and onboarding?”
                      </p>
                      <p>
                        That is why this page uses operator language, action
                        buttons, and cross-tenant visibility.
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