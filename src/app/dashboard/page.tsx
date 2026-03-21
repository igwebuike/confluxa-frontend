"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  CalendarDays,
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
  FileText,
  Briefcase,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
};

type Membership = {
  id: string;
  role: string;
  tenant: Tenant | null;
};

type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
};

type PipelineStage = {
  id: string;
  name: string;
  stage_key: string;
  position: number;
};

type Deal = {
  id: string;
  title: string;
  status: string;
  source: string | null;
  estimated_value: number | null;
  probability: number | null;
  created_at: string;
  last_activity_at: string | null;
  stage: PipelineStage | null;
  contact: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  created_at: string;
  contact: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
};

type Call = {
  id: string;
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
  contact: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

type NavKey = "overview" | "calls" | "deals" | "tasks" | "contacts" | "settings";

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

function fullName(first?: string | null, last?: string | null, fallback = "Unknown") {
  const name = [first || "", last || ""].join(" ").trim();
  return name || fallback;
}

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

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
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
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default function DashboardPage() {
  const [page, setPage] = useState<NavKey>("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [adminTenants, setAdminTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);

  const selectedTenant = useMemo(() => {
    const fromMembership = memberships.find((m) => m.tenant?.id === selectedTenantId)?.tenant;
    const fromAdmin = adminTenants.find((t) => t.id === selectedTenantId);
    return fromMembership || fromAdmin || null;
  }, [memberships, adminTenants, selectedTenantId]);

  const tenantOptions = useMemo(() => {
    const membershipTenants = memberships
      .map((m) => m.tenant)
      .filter(Boolean) as Tenant[];

    const all = [...membershipTenants];
    for (const tenant of adminTenants) {
      if (!all.some((t) => t.id === tenant.id)) {
        all.push(tenant);
      }
    }
    return all;
  }, [memberships, adminTenants]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  async function loadBase() {
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

      if (profileError) {
        throw profileError;
      }

      setProfile(profileData);

      const { data: membershipData, error: membershipError } = await supabase
        .from("tenant_memberships")
        .select(`
          id,
          role,
          tenant:tenants (
            id,
            tenant_key,
            name,
            display_name,
            industry
          )
        `)
        .order("created_at", { ascending: true });

      if (membershipError) {
        throw membershipError;
      }

      const normalizedMemberships = (membershipData || []) as unknown as Membership[];
      setMemberships(normalizedMemberships);

      let tenantChoices: Tenant[] = normalizedMemberships
        .map((m) => m.tenant)
        .filter(Boolean) as Tenant[];

      if (profileData.global_role === "platform_admin") {
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("id, tenant_key, name, display_name, industry")
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (tenantError) {
          throw tenantError;
        }

        const adminTenantRows = (tenantData || []) as Tenant[];
        setAdminTenants(adminTenantRows);
        tenantChoices = adminTenantRows;
      }

      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;
      const tenantIdFromUrl = params?.get("tenant_id") || "";
      const tenantKeyFromUrl = params?.get("tenant_key") || "";

      let resolvedTenantId = "";

      if (tenantIdFromUrl && tenantChoices.some((t) => t.id === tenantIdFromUrl)) {
        resolvedTenantId = tenantIdFromUrl;
      } else if (tenantKeyFromUrl) {
        const match = tenantChoices.find((t) => t.tenant_key === tenantKeyFromUrl);
        if (match) resolvedTenantId = match.id;
      }

      if (!resolvedTenantId && tenantChoices.length > 0) {
        resolvedTenantId = tenantChoices[0].id;
      }

      setSelectedTenantId(resolvedTenantId);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load workspace.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTenantData(tenantId: string) {
    if (!tenantId) return;

    setRefreshing(true);
    setError("");

    try {
      const [contactsRes, dealsRes, tasksRes, callsRes] = await Promise.all([
        supabase
          .from("contacts")
          .select("id, first_name, last_name, email, phone, company, created_at")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(200),

        supabase
          .from("deals")
          .select(`
            id,
            title,
            status,
            source,
            estimated_value,
            probability,
            created_at,
            last_activity_at,
            stage:pipeline_stages (
              id,
              name,
              stage_key,
              position
            ),
            contact:contacts (
              id,
              first_name,
              last_name,
              email,
              phone
            )
          `)
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(200),

        supabase
          .from("tasks")
          .select(`
            id,
            title,
            description,
            status,
            priority,
            due_at,
            created_at,
            contact:contacts (
              id,
              first_name,
              last_name,
              email
            )
          `)
          .eq("tenant_id", tenantId)
          .order("due_at", { ascending: true })
          .limit(200),

        supabase
          .from("calls")
          .select(`
            id,
            external_call_id,
            direction,
            caller_phone,
            caller_email,
            called_number,
            duration_seconds,
            summary,
            transcript,
            outcome,
            qualification_status,
            created_at,
            contact:contacts (
              id,
              first_name,
              last_name,
              email,
              phone
            )
          `)
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(300),
      ]);

      if (contactsRes.error) throw contactsRes.error;
      if (dealsRes.error) throw dealsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (callsRes.error) throw callsRes.error;

      setContacts((contactsRes.data || []) as Contact[]);
      setDeals((dealsRes.data || []) as unknown as Deal[]);
      setTasks((tasksRes.data || []) as unknown as Task[]);
      setCalls((callsRes.data || []) as unknown as Call[]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load tenant data.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      loadTenantData(selectedTenantId);
    }
  }, [selectedTenantId]);

  const filteredCalls = useMemo(() => {
    const q = search.toLowerCase();
    return calls.filter((call) =>
      !q
        ? true
        : [
            fullName(call.contact?.first_name, call.contact?.last_name, ""),
            call.caller_phone,
            call.caller_email,
            call.summary,
            call.outcome,
            call.qualification_status,
          ]
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
        : [
            deal.title,
            deal.status,
            deal.source,
            deal.stage?.name,
            deal.stage?.stage_key,
            fullName(deal.contact?.first_name, deal.contact?.last_name, ""),
            deal.contact?.email,
          ]
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
            fullName(task.contact?.first_name, task.contact?.last_name, ""),
            task.contact?.email,
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
        : [
            fullName(contact.first_name, contact.last_name, ""),
            contact.email,
            contact.phone,
            contact.company,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
    );
  }, [contacts, search]);

  const metrics = useMemo(() => {
    const today = startOfToday();

    const totalContacts = contacts.length;
    const openDeals = deals.filter((deal) => deal.status === "open").length;
    const pipelineValue = deals.reduce(
      (sum, deal) => sum + Number(deal.estimated_value || 0),
      0
    );
    const tasksDue = tasks.filter(
      (task) => task.status === "open" && task.due_at && new Date(task.due_at) >= today
    ).length;
    const callsToday = calls.filter((call) => new Date(call.created_at) >= today).length;

    return {
      totalContacts,
      openDeals,
      pipelineValue,
      tasksDue,
      callsToday,
    };
  }, [contacts, deals, tasks, calls]);

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
      const key = new Date(call.created_at).toISOString().slice(0, 10);
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
    for (const deal of deals) {
      const label = deal.stage?.name || deal.stage?.stage_key || "Unknown";
      stageCounts.set(label, (stageCounts.get(label) || 0) + 1);
    }
    return Array.from(stageCounts.entries()).map(([stage, count]) => ({
      stage,
      count,
    }));
  }, [deals]);

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
                    {selectedTenant?.display_name || selectedTenant?.name || "No tenant selected"}
                  </div>
                  <div>{selectedTenant?.industry || "General"}</div>
                  <div className="text-slate-300">
                    {profile?.global_role === "platform_admin"
                      ? "Platform admin access"
                      : "Tenant-scoped access"}
                  </div>
                </div>

                <Button
                  className="mt-5 w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => selectedTenantId && loadTenantData(selectedTenantId)}
                  disabled={refreshing || !selectedTenantId}
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
                  {selectedTenant?.display_name || selectedTenant?.name || "Dashboard"}
                </h1>
                <p className="text-sm text-slate-500">
                  Real calls, deals, tasks, and contacts from your live Supabase workspace.
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

                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger className="w-[260px] rounded-2xl border-slate-200">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantOptions.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.display_name || tenant.name}
                      </SelectItem>
                    ))}
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

            {!loading && !selectedTenantId ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                No tenant is available for this user yet.
              </div>
            ) : null}

            {!loading && selectedTenantId && page === "overview" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {summaryCards.map((card) => (
                    <StatCard key={card.title} {...card} />
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Call trend</CardTitle>
                      <CardDescription>Calls and booked outcomes over the last 7 days.</CardDescription>
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
                            <Line type="monotone" dataKey="booked" strokeWidth={4} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Tasks due</CardTitle>
                      <CardDescription>Follow-up items that need attention.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {filteredTasks.slice(0, 5).length ? (
                        filteredTasks.slice(0, 5).map((task) => (
                          <div key={task.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">{task.title}</div>
                                <div className="text-sm text-slate-500">
                                  {fullName(task.contact?.first_name, task.contact?.last_name, "Unassigned contact")}
                                </div>
                              </div>
                              <Badge variant="secondary">{task.priority}</Badge>
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
                                <div className="font-medium">
                                  {fullName(call.contact?.first_name, call.contact?.last_name, "Unknown Caller")}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {call.caller_phone || call.caller_email || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>{formatTime(call.created_at)}</div>
                                <div className="text-xs text-slate-500">
                                  {formatDuration(call.duration_seconds)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {call.outcome || call.qualification_status || "New"}
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
                      <CardDescription>Open deal distribution by stage.</CardDescription>
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

            {!loading && selectedTenantId && page === "calls" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                              <div className="font-medium">
                                {fullName(call.contact?.first_name, call.contact?.last_name, "Unknown Caller")}
                              </div>
                              <div className="text-xs text-slate-500">
                                {call.caller_phone || call.caller_email || "—"}
                              </div>
                            </TableCell>
                            <TableCell>{formatDateTime(call.created_at)}</TableCell>
                            <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {call.outcome || call.qualification_status || "New"}
                              </Badge>
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

            {!loading && selectedTenantId && page === "deals" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                            <TableCell>
                              {fullName(deal.contact?.first_name, deal.contact?.last_name, "—")}
                            </TableCell>
                            <TableCell>{deal.stage?.name || deal.stage?.stage_key || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{deal.status}</Badge>
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

            {!loading && selectedTenantId && page === "tasks" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                            <TableCell>
                              {fullName(task.contact?.first_name, task.contact?.last_name, "—")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{task.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{task.priority}</Badge>
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

            {!loading && selectedTenantId && page === "contacts" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                            <TableCell className="font-medium">
                              {fullName(contact.first_name, contact.last_name, "Unknown")}
                            </TableCell>
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

            {!loading && selectedTenantId && page === "settings" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <SectionTitle
                  title="Settings"
                  description="Workspace and access context for the current tenant."
                />
                <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Workspace context</CardTitle>
                      <CardDescription>What this dashboard is currently connected to.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-slate-900">Tenant:</span>{" "}
                            {selectedTenant?.display_name || selectedTenant?.name || "—"}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">Tenant key:</span>{" "}
                            {selectedTenant?.tenant_key || "—"}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">Industry:</span>{" "}
                            {selectedTenant?.industry || "General"}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">Role:</span>{" "}
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
                      <CardDescription>Simple operational confidence signals.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        {
                          label: "Tenant selected",
                          done: !!selectedTenantId,
                        },
                        {
                          label: "Contacts loaded",
                          done: contacts.length > 0,
                        },
                        {
                          label: "Calls loaded",
                          done: calls.length > 0,
                        },
                        {
                          label: "Deals loaded",
                          done: deals.length > 0,
                        },
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