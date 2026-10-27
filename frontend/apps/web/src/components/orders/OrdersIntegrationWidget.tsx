"use client";

import React from "react";
import { Activity, ArrowRight, Server, ShieldCheck } from "lucide-react";

export interface IntegrationFeed {
  id: string;
  name: string;
  protocol?: string;
  status: "CONNECTED" | "DEGRADED" | "DISCONNECTED" | "UNKNOWN";
  lastMessageAt?: string;
  messagesToday?: number;
}

interface OrdersIntegrationWidgetProps {
  onOpenEngine?: () => void;
  feeds?: IntegrationFeed[];
  ordersToday?: number;
}

const statusLabel: Record<IntegrationFeed["status"], string> = {
  CONNECTED: "Connected",
  DEGRADED: "Degraded",
  DISCONNECTED: "Disconnected",
  UNKNOWN: "Unknown",
};

const statusClass: Record<IntegrationFeed["status"], string> = {
  CONNECTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DEGRADED: "bg-amber-50 text-amber-700 border-amber-200",
  DISCONNECTED: "bg-rose-50 text-rose-700 border-rose-200",
  UNKNOWN: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function OrdersIntegrationWidget({
  onOpenEngine,
  feeds = [],
  ordersToday,
}: OrdersIntegrationWidgetProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Order interfaces</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Review interface connectivity and inbound order messages returned by configured systems.
            </p>
          </div>
        </div>
        {onOpenEngine && (
          <button
            type="button"
            onClick={onOpenEngine}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900"
          >
            Open interface workspace <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Configured feeds</p>
          <p className="mt-1 text-lg font-black text-slate-900">{feeds.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Connected feeds</p>
          <p className="mt-1 text-lg font-black text-slate-900">{feeds.filter((feed) => feed.status === "CONNECTED").length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Orders today</p>
          <p className="mt-1 text-lg font-black text-slate-900">{ordersToday ?? "—"}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {feeds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
            <Activity className="mx-auto h-5 w-5 text-slate-400" />
            <p className="mt-2 text-xs font-semibold text-slate-700">No interface telemetry available</p>
            <p className="mt-1 text-[11px] text-slate-500">Configure an interface or open the workspace to review connection settings.</p>
          </div>
        ) : (
          feeds.map((feed) => (
            <div key={feed.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">{feed.name}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {feed.protocol || "Protocol not specified"}
                  {feed.lastMessageAt ? ` · Last message ${feed.lastMessageAt}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-500">{feed.messagesToday ?? "—"} messages</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClass[feed.status]}`}>
                  {statusLabel[feed.status]}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
        Interface status is shown only when reported by the configured connection.
      </div>
    </section>
  );
}
