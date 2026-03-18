"use client";

import React from "react";
import { X, Phone, Building2, Clock3, ClipboardList, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export type CallTranscriptDetail = {
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
  tenant_phone_label?: string;
  called_number?: string;
  vapi_call_id?: string;
  vapi_conversation_id?: string;
  summary: string;
  transcript: string;
  intent?: string;
  sentiment?: string;
  objection?: string;
  ended_reason?: string;
  follow_up?: string;
};

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

function fmtTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CallTranscriptModal({
  open,
  loading,
  detail,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  detail: CallTranscriptDetail | null;
  onClose: () => void;
}) {
  if (!open) return null;

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value || "");
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">
              AI Call Transcript Viewer
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Review the call summary, transcript, intent, and recommended follow-up.
            </p>
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

        <div className="max-h-[80vh] overflow-y-auto p-6">
          {loading ? (
            <div className="text-sm text-slate-500">Loading call transcript...</div>
          ) : !detail ? (
            <div className="text-sm text-red-600">Could not load call detail.</div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-500">Caller</div>
                    <div className="mt-2 font-semibold text-slate-900">
                      {detail.caller_name || "Unknown Caller"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {detail.caller_phone || "—"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-500">Tenant</div>
                    <div className="mt-2 font-semibold text-slate-900">
                      {detail.tenant_name || "—"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {detail.tenant_phone_label || "Main"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-500">Outcome</div>
                    <div className="mt-2">
                      <Badge className={statusTone(detail.outcome)}>
                        {detail.outcome || "Unknown"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-500">Call time</div>
                    <div className="mt-2 font-semibold text-slate-900">
                      {fmtTime(detail.time)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Phone className="h-4 w-4" />
                      Call details
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <div>
                        <span className="font-medium text-slate-900">Caller email:</span>{" "}
                        {detail.caller_email || "—"}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Called number:</span>{" "}
                        {detail.called_number || "—"}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Business:</span>{" "}
                        {detail.business_name || "—"}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Business phone:</span>{" "}
                        {detail.business_phone || "—"}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">VAPI Call ID:</span>{" "}
                        {detail.vapi_call_id || "—"}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Conversation ID:</span>{" "}
                        {detail.vapi_conversation_id || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Building2 className="h-4 w-4" />
                      AI extraction
                    </div>
                    <div className="mt-3 space-y-3 text-sm">
                      <div>
                        <div className="font-medium text-slate-900">Intent</div>
                        <div className="text-slate-600">{detail.intent || "—"}</div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Sentiment</div>
                        <div className="text-slate-600">{detail.sentiment || "—"}</div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Objection</div>
                        <div className="text-slate-600">{detail.objection || "—"}</div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Ended reason</div>
                        <div className="text-slate-600">{detail.ended_reason || "—"}</div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Recommended follow-up</div>
                        <div className="text-slate-600">{detail.follow_up || "Needs follow-up"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <ClipboardList className="h-4 w-4" />
                        AI summary
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => copyText(detail.summary || "")}
                      >
                        Copy summary
                      </Button>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {detail.summary || "No summary available."}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <MessageSquare className="h-4 w-4" />
                        Full transcript
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => copyText(detail.transcript || "")}
                      >
                        Copy transcript
                      </Button>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto rounded-2xl bg-slate-50 p-4 text-sm leading-6 whitespace-pre-wrap text-slate-700">
                      {detail.transcript || "No transcript available."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}