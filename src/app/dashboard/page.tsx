"use client";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Users,
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
  Wifi,
  BarChart3,
  ClipboardList,
  BadgeCheck,
  AudioLines,
  Clock3,
  Filter,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const summaryCards = [
  { title: "Calls today", value: "42", note: "+18% vs yesterday", icon: PhoneCall },
  { title: "Booked meetings", value: "9", note: "3 awaiting confirmation", icon: CalendarDays },
  { title: "Missed calls recovered", value: "14", note: "AI answered after hours", icon: BadgeCheck },
  { title: "Active clients", value: "6", note: "2 in onboarding", icon: Building2 },
];

const callTrend = [
  { day: "Mon", calls: 22, booked: 3 },
  { day: "Tue", calls: 31, booked: 5 },
  { day: "Wed", calls: 28, booked: 4 },
  { day: "Thu", calls: 39, booked: 7 },
  { day: "Fri", calls: 42, booked: 9 },
  { day: "Sat", calls: 18, booked: 2 },
  { day: "Sun", calls: 11, booked: 1 },
];

const recentCalls = [
  {
    caller: "Brian Adams",
    number: "+1 512-999-0995",
    tenant: "Innovative Mechanical",
    time: "7:36 PM",
    duration: "4m 12s",
    outcome: "Qualified",
    summary: "Heating failure. Service follow-up needed.",
  },
  {
    caller: "Sarah Kim",
    number: "+1 469-222-1010",
    tenant: "Knowledge Bureau",
    time: "6:58 PM",
    duration: "6m 03s",
    outcome: "Booked",
    summary: "Requested course consultation. Good fit.",
  },
  {
    caller: "David Flores",
    number: "+1 214-110-8888",
    tenant: "Medspa Demo",
    time: "5:41 PM",
    duration: "2m 41s",
    outcome: "New lead",
    summary: "Asking about botox pricing and appointment windows.",
  },
  {
    caller: "Unknown Caller",
    number: "+1 817-221-4455",
    tenant: "UOT",
    time: "4:12 PM",
    duration: "1m 28s",
    outcome: "Missed intent",
    summary: "Ended early. Could not confirm contact info.",
  },
];

const leads = [
  {
    name: "Brian Adams",
    niche: "HVAC",
    status: "Qualified",
    business: "Innovative Mechanical",
    issue: "Heating issue",
    next: "Call back in 15 min",
  },
  {
    name: "Sarah Kim",
    niche: "Training",
    status: "Booked",
    business: "Knowledge Bureau",
    issue: "Course consultation",
    next: "Meeting tomorrow",
  },
  {
    name: "Amanda Lee",
    niche: "Medspa",
    status: "New",
    business: "Glow Medspa",
    issue: "Botox pricing",
    next: "Send SMS follow-up",
  },
  {
    name: "James R.",
    niche: "Legal",
    status: "Contacted",
    business: "Northstar Legal",
    issue: "Consult scheduling",
    next: "Awaiting reply",
  },
];

const clients = [
  {
    name: "Innovative Mechanical",
    phone: "+1 281-299-3921",
    status: "Active",
    calls: 42,
    booked: 6,
    recovered: 11,
  },
  {
    name: "Knowledge Bureau",
    phone: "+1 202-555-1132",
    status: "Active",
    calls: 28,
    booked: 8,
    recovered: 2,
  },
  {
    name: "Glow Medspa",
    phone: "+1 469-555-7711",
    status: "Onboarding",
    calls: 6,
    booked: 1,
    recovered: 3,
  },
];

const failures = [
  { label: "Webhook retries", value: 2, tone: "bg-amber-100 text-amber-900" },
  { label: "Call transcription gaps", value: 1, tone: "bg-red-100 text-red-900" },
  { label: "Number mapping alerts", value: 0, tone: "bg-emerald-100 text-emerald-900" },
];

function StatCard({ title, value, note, icon: Icon }: any) {
  return (
    <Card className="rounded-3xl border-slate-200/80 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</h3>
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

function SectionTitle({ title, description, action }: any) {
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

export default function ConfluxaFrontendPrototype() {
  const [page, setPage] = useState("dashboard");
  const [tenant, setTenant] = useState("all");
  const [search, setSearch] = useState("");

  const filteredCalls = useMemo(() => {
    return recentCalls.filter((c) => {
      const q = search.toLowerCase();
      return !q || [c.caller, c.number, c.tenant, c.summary].join(" ").toLowerCase().includes(q);
    });
  }, [search]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="flex h-16 items-center px-6">
            <div className="flex items-center gap-3">
              <img src="/confluxa-logo.png" alt="Confluxa" className="h-10 w-10 rounded-xl object-contain" />
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
                    page === key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
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
                    <Badge className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/20">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Webhook health</span>
                    <Badge className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/20">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email delivery</span>
                    <Badge className="bg-amber-500/20 text-amber-100 hover:bg-amber-500/20">2 retries</Badge>
                  </div>
                </div>
                <Button className="mt-5 w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                  Open diagnostics
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>

        <main>
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Confluxa Control Room</h1>
                <p className="text-sm text-slate-500">Run clients, monitor calls, and prove ROI from one place.</p>
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
                  <SelectTrigger className="w-[180px] rounded-2xl border-slate-200">
                    <SelectValue placeholder="Tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tenants</SelectItem>
                    <SelectItem value="im">Innovative Mechanical</SelectItem>
                    <SelectItem value="kb">Knowledge Bureau</SelectItem>
                    <SelectItem value="medspa">Glow Medspa</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800">
                  <Plus className="mr-2 h-4 w-4" />
                  New client
                </Button>
                <Button variant="outline" size="icon" className="rounded-2xl border-slate-200">
                  <Bell className="h-4 w-4" />
                </Button>
                <Avatar className="h-10 w-10 rounded-2xl">
                  <AvatarFallback className="rounded-2xl bg-orange-100 text-orange-900">EE</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <div className="space-y-8 px-6 py-6">
            {page === "dashboard" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {summaryCards.map((card) => (
                    <StatCard key={card.title} {...card} />
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <SectionTitle
                        title="Call performance"
                        description="Weekly handled calls and booked meetings across active tenants."
                        action={
                          <Tabs defaultValue="7d">
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
                          <LineChart data={callTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="calls" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="booked" strokeWidth={3} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>System attention</CardTitle>
                      <CardDescription>Items that need review before they affect client experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {failures.map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
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

                      <div className="rounded-2xl bg-slate-100 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Client onboarding progress</div>
                            <div className="text-sm text-slate-500">2 of 3 steps completed for Glow Medspa</div>
                          </div>
                          <Briefcase className="h-5 w-5 text-slate-500" />
                        </div>
                        <Progress value={66} className="mt-4" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <SectionTitle
                        title="Recent calls"
                        description="Live view of incoming conversations across tenants."
                        action={<Button variant="outline" className="rounded-2xl border-slate-200">View all</Button>}
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
                            <TableRow key={`${call.caller}-${call.time}`}>
                              <TableCell>
                                <div className="font-medium">{call.caller}</div>
                                <div className="text-xs text-slate-500">{call.number}</div>
                              </TableCell>
                              <TableCell>{call.tenant}</TableCell>
                              <TableCell>
                                <div>{call.time}</div>
                                <div className="text-xs text-slate-500">{call.duration}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="rounded-full">{call.outcome}</Badge>
                              </TableCell>
                              <TableCell className="max-w-[320px] truncate">{call.summary}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Lead pipeline</CardTitle>
                      <CardDescription>What the business owner wants to see at a glance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {leads.slice(0, 4).map((lead) => (
                        <div key={lead.name} className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{lead.name}</div>
                              <div className="text-sm text-slate-500">{lead.business}</div>
                            </div>
                            <Badge variant="secondary" className="rounded-full">{lead.status}</Badge>
                          </div>
                          <div className="mt-3 text-sm text-slate-600">{lead.issue}</div>
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
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <SectionTitle
                  title="Calls"
                  description="Every call, transcript, and outcome in one operational view."
                  action={
                    <div className="flex gap-2">
                      <Button variant="outline" className="rounded-2xl border-slate-200"><Filter className="mr-2 h-4 w-4" />Filter</Button>
                      <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800">Export</Button>
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
                        {recentCalls.map((call) => (
                          <TableRow key={`${call.caller}-${call.time}-calls`}>
                            <TableCell>
                              <div className="font-medium">{call.caller}</div>
                              <div className="text-xs text-slate-500">{call.number}</div>
                            </TableCell>
                            <TableCell>{call.tenant}</TableCell>
                            <TableCell>{call.time}</TableCell>
                            <TableCell>{call.duration}</TableCell>
                            <TableCell><Badge variant="secondary">{call.outcome}</Badge></TableCell>
                            <TableCell className="max-w-[340px] truncate">{call.summary}</TableCell>
                            <TableCell><Button variant="outline" className="rounded-2xl border-slate-200">Open</Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {page === "leads" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <SectionTitle title="Leads" description="Captured from calls and ready for follow-up." />
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  {leads.map((lead) => (
                    <Card key={lead.name} className="rounded-3xl border-slate-200/80 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-slate-500">{lead.business}</div>
                          </div>
                          <Badge variant="secondary">{lead.status}</Badge>
                        </div>
                        <div className="mt-4 text-sm text-slate-600">{lead.issue}</div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                          <Activity className="h-3.5 w-3.5" />
                          {lead.niche}
                        </div>
                        <div className="mt-5 flex items-center justify-between">
                          <span className="text-xs text-slate-500">{lead.next}</span>
                          <Button variant="ghost" className="rounded-2xl">View <ChevronRight className="ml-1 h-4 w-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {page === "clients" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <SectionTitle title="Clients" description="Manage tenants, phone lines, and performance in one place." />
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
                          {clients.map((client) => (
                            <TableRow key={client.name}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell>{client.phone}</TableCell>
                              <TableCell><Badge variant="secondary">{client.status}</Badge></TableCell>
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
                      <CardDescription>Show this view in demos to make Confluxa feel premium.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={clients}>
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
              </motion.div>
            )}

            {page === "settings" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <SectionTitle title="Settings / Admin" description="Onboard clients, map phone numbers, and monitor integrations." />
                <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>New client onboarding</CardTitle>
                      <CardDescription>Turn SQL steps into a clean self-serve workflow.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Business name</label>
                        <Input className="rounded-2xl" placeholder="Innovative Mechanical, LLC" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Notification email</label>
                        <Input className="rounded-2xl" placeholder="owner@business.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone number</label>
                        <Input className="rounded-2xl" placeholder="+1 281 299 3921" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Industry</label>
                        <Select defaultValue="hvac">
                          <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hvac">HVAC</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
                            <SelectItem value="medspa">Medspa</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Delivery mode</label>
                        <Select defaultValue="email">
                          <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="crm">CRM push</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 flex items-center justify-between rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2"><Wifi className="h-4 w-4" /> This form should post to /api/tenants and create tenant, number, and notification rows.</div>
                        <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800">Save client</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle>Admin shortcuts</CardTitle>
                      <CardDescription>Fast actions for you and your team.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        ["View webhook logs", Activity],
                        ["Map Twilio numbers", Phone],
                        ["Review failed deliveries", AlertTriangle],
                        ["Open call events", ClipboardList],
                        ["Check API health", CheckCircle2],
                      ].map(([label, Icon]: any) => (
                        <button key={label} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-slate-100 p-2"><Icon className="h-4 w-4" /></div>
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
