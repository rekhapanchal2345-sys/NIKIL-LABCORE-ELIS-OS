"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  FlaskConical,
  Heart,
  IndianRupee,
  Layers,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
  Zap,
  Building2,
  Stethoscope,
  Timer,
  AlertCircle,
  XCircle,
  X,
  Flame,
  ArrowRight
} from "lucide-react";
import { orderApi } from "@/lib/api";

// ==========================================
// TYPES
// ==========================================

export interface OrderAnalytics {
  overview: {
    totalOrders: number;
    todayOrders: number;
    pendingSamples: number;
    statOrders: number;
    urgentOrders: number;
    completedToday: number;
    cancelledToday: number;
    tatBreachCount: number;
  };
  revenue: {
    totalBilled: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  paymentBreakdown: Array<{ status: string; count: number }>;
  topTests: Array<{ test?: { testName: string; testCode: string }; _count: { _all: number } }>;
  topDoctors: Array<{ doctor?: { fullName: string; specialization: string }; _count: { _all: number } }>;
}

export interface TATData {
  active: number;
  breached: number;
  critical: number;
  breachedOrders: TATOrder[];
  criticalOrders: TATOrder[];
  allActiveOrders: TATOrder[];
}

export interface TATOrder {
  orderId: string;
  orderNumber: string;
  priority: string;
  status: string;
  ageHours: number;
  expectedTATHours: number;
  isBreached: boolean;
  percentComplete: number;
  patient: { firstName: string; lastName: string; uhid: string };
  tests: string[];
}

export interface PipelineData {
  pipeline: Record<string, any[]>;
  totals: Record<string, number>;
}

// ==========================================
// 1. ANALYTICS STAT CARD (LIGHT WHITE CLINICAL)
// ==========================================

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  urgent,
  onClick,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  urgent?: boolean;
  onClick?: () => void;
  bgTint?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 shadow-2xs ${
        urgent
          ? "border-rose-300 bg-rose-50/60 shadow-sm shadow-rose-100"
          : "border-slate-200/90 bg-white hover:border-sky-300 hover:shadow-xs"
      } ${onClick ? "cursor-pointer hover:scale-[1.01]" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 ${color}`}>
          <Icon className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
        </div>
        {urgent && Number(value) > 0 && (
          <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
        )}
      </div>

      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 font-medium mt-0.5">{sub}</div>}
    </div>
  );
}

// ==========================================
// 2. ANALYTICS DASHBOARD STRIP (LIGHT WHITE)
// ==========================================

export function OrderAnalyticsDashboard({
  analytics,
  tatData,
  loading,
  onStatClick,
}: {
  analytics: OrderAnalytics | null;
  tatData: TATData | null;
  loading: boolean;
  onStatClick?: (filter: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (!analytics) return null;
  const ov = analytics.overview;
  const rev = analytics.revenue;

  return (
    <div className="space-y-4 mb-5">
      {/* Critical Alerts Banner */}
      {(ov.statOrders > 0 || ov.tatBreachCount > 0) && (
        <div className="flex flex-wrap gap-2.5 items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-wider text-rose-900">Emergency &amp; SLA Alarms:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ov.statOrders > 0 && (
              <span
                className="text-xs font-bold bg-white text-rose-700 border border-rose-200 rounded-full px-3 py-1 cursor-pointer hover:bg-rose-100 transition shadow-2xs flex items-center gap-1.5"
                onClick={() => onStatClick?.("STAT")}
              >
                <Flame className="h-3.5 w-3.5 text-rose-600 fill-rose-600" />
                {ov.statOrders} STAT Requisitions Pending
              </span>
            )}
            {ov.tatBreachCount > 0 && (
              <span
                className="text-xs font-bold bg-white text-amber-800 border border-amber-200 rounded-full px-3 py-1 cursor-pointer hover:bg-amber-100 transition shadow-2xs flex items-center gap-1.5"
                onClick={() => onStatClick?.("TAT_BREACH")}
              >
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                {ov.tatBreachCount} SLA Turnaround Breached
              </span>
            )}
            {tatData && tatData.critical > 0 && (
              <span className="text-xs font-bold bg-amber-100/70 text-amber-900 border border-amber-300 rounded-full px-2.5 py-1">
                ⚠️ {tatData.critical} Approaching TAT Threshold
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard
          icon={Layers}
          label="Today"
          value={ov.todayOrders}
          sub="Requisitions booked"
          color="text-sky-600"
          onClick={() => onStatClick?.("today")}
        />
        <StatCard
          icon={FlaskConical}
          label="Pending Draw"
          value={ov.pendingSamples}
          sub="Phlebotomy due"
          color="text-amber-600"
          onClick={() => onStatClick?.("REGISTERED")}
        />
        <StatCard
          icon={Zap}
          label="STAT Emergency"
          value={ov.statOrders}
          sub="Immediate run"
          color="text-rose-600"
          urgent={ov.statOrders > 0}
          onClick={() => onStatClick?.("STAT")}
        />
        <StatCard
          icon={Timer}
          label="TAT Breached"
          value={ov.tatBreachCount}
          sub="Exceeded SLA"
          color="text-orange-600"
          urgent={ov.tatBreachCount > 0}
          onClick={() => onStatClick?.("TAT_BREACH")}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={ov.completedToday}
          sub="Signed & verified"
          color="text-emerald-600"
          onClick={() => onStatClick?.("COMPLETED")}
        />
        <StatCard
          icon={IndianRupee}
          label="Revenue"
          value={`₹${(rev.totalBilled / 1000).toFixed(1)}k`}
          sub={`₹${(rev.totalCollected / 1000).toFixed(1)}k collected`}
          color="text-teal-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Collection %"
          value={`${rev.collectionRate}%`}
          sub="Ledger clearance"
          color="text-indigo-600"
        />
        <StatCard
          icon={XCircle}
          label="Cancelled"
          value={ov.cancelledToday}
          sub="Revoked orders"
          color="text-slate-500"
        />
      </div>
    </div>
  );
}

// ==========================================
// 3. TAT MONITOR PANEL MODAL (LIGHT WHITE)
// ==========================================

export function TATMonitorPanel({
  tatData,
  isOpen,
  onClose,
  onOrderClick,
}: {
  tatData: TATData | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderClick?: (orderId: string) => void;
}) {
  if (!isOpen || !tatData) return null;

  const combined = [
    ...tatData.breachedOrders.map((o) => ({ ...o, isBreached: true })),
    ...tatData.criticalOrders.filter((o) => !o.isBreached),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-teal-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                Turnaround Time (TAT) &amp; SLA Monitor
              </h2>
              <p className="text-xs text-slate-500">
                {tatData.breached} breached · {tatData.critical} critical SLA approaching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:text-slate-700 shadow-2xs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3 custom-scrollbar bg-slate-50/40">
          {combined.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
              <p className="font-black text-slate-900 text-base">All Requisitions Within SLA!</p>
              <p className="text-xs text-slate-500 mt-1">Zero critical or breached turnaround orders across diagnostic bays.</p>
            </div>
          ) : (
            combined.map((order) => (
              <div
                key={order.orderId}
                onClick={() => onOrderClick?.(order.orderId)}
                className={`rounded-2xl border p-4 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md bg-white ${
                  order.isBreached
                    ? "border-rose-300 shadow-rose-100 shadow-xs"
                    : "border-amber-200 shadow-2xs"
                }`}
              >
                {/* Progress Ring */}
                <div
                  className={`shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center text-xs font-black border ${
                    order.isBreached
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {order.percentComplete}%
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-slate-900">{order.orderNumber}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        order.priority === "STAT"
                          ? "bg-rose-600 text-white"
                          : order.priority === "URGENT"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {order.priority}
                    </span>
                    {order.isBreached && (
                      <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-black">
                        BREACHED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-bold mt-1 truncate">
                    {order.patient.firstName} {order.patient.lastName} · <span className="font-mono text-slate-500 font-normal">{order.patient.uhid}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{order.tests.join(", ")}</p>
                </div>

                {/* TAT Timing */}
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-black ${order.isBreached ? "text-rose-600" : "text-amber-700"}`}>
                    {order.ageHours}h elapsed
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">/ {order.expectedTATHours}h SLA limit</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. PIPELINE KANBAN VIEW (LIGHT WHITE)
// ==========================================

const PIPELINE_COLUMNS = [
  { key: "REGISTERED", label: "Registered", icon: AlertCircle, color: "text-amber-700", border: "border-amber-200", bg: "bg-amber-50" },
  { key: "SAMPLE_COLLECTED", label: "Sample Collected", icon: FlaskConical, color: "text-purple-700", border: "border-purple-200", bg: "bg-purple-50" },
  { key: "PROCESSING", label: "Processing", icon: Activity, color: "text-sky-700", border: "border-sky-200", bg: "bg-sky-50" },
  { key: "COMPLETED", label: "Completed", icon: CheckCircle2, color: "text-emerald-700", border: "border-emerald-200", bg: "bg-emerald-50" },
];

function PipelineCard({ order, onAction }: { order: any; onAction?: (order: any) => void }) {
  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
  const ageMin = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div
      onClick={() => onAction?.(order)}
      className={`rounded-2xl border p-3.5 cursor-pointer transition-all hover:shadow-md bg-white ${
        order.priority === "STAT"
          ? "border-rose-300 shadow-rose-100 shadow-xs"
          : order.priority === "URGENT"
          ? "border-amber-200 shadow-2xs"
          : "border-slate-200 shadow-2xs"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="font-mono text-xs font-black text-slate-900">{order.orderNumber}</span>
        <span
          className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
            order.priority === "STAT"
              ? "bg-rose-600 text-white"
              : order.priority === "URGENT"
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {order.priority}
        </span>
      </div>

      <p className="text-xs font-bold text-slate-900 truncate">
        {order.patient?.firstName} {order.patient?.lastName}
      </p>
      <p className="text-[10px] text-slate-500 font-mono">{order.patient?.uhid}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        {(order.items || []).slice(0, 2).map((item: any, i: number) => (
          <span key={i} className="text-[9px] bg-slate-100 text-slate-700 rounded px-1.5 py-0.5 truncate max-w-[100px] border border-slate-200">
            {item.test?.testName}
          </span>
        ))}
        {(order.items || []).length > 2 && (
          <span className="text-[9px] bg-slate-100 text-slate-500 rounded px-1 py-0.5 border border-slate-200">
            +{order.items.length - 2}
          </span>
        )}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-slate-400" />
          {ageHours > 0 ? `${ageHours}h ${ageMin}m` : `${ageMin}m`}
        </span>
        {order.doctor && (
          <span className="truncate max-w-[90px] font-medium text-slate-700">
            {order.doctor.fullName}
          </span>
        )}
      </div>
    </div>
  );
}

export function OrderPipelineView({
  pipelineData,
  loading,
  onOrderClick,
}: {
  pipelineData: PipelineData | null;
  loading: boolean;
  onOrderClick?: (order: any) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 h-[500px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!pipelineData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {PIPELINE_COLUMNS.map((col) => {
        const colOrders = pipelineData.pipeline[col.key] || [];
        const count = pipelineData.totals[col.key] || 0;
        const Icon = col.icon;

        return (
          <div key={col.key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${col.color}`} />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">{col.label}</span>
              </div>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${col.bg} ${col.border} ${col.color}`}>
                {count}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar">
              {colOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium bg-white rounded-xl border border-dashed border-slate-200">
                  No orders in this stage
                </div>
              ) : (
                colOrders.map((order: any) => (
                  <PipelineCard key={order.id} order={order} onAction={onOrderClick} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 5. ADVANCED FILTER BAR (LIGHT WHITE CLINICAL)
// ==========================================

export function AdvancedFilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: {
    status: string;
    payment: string;
    priority: string;
    date: string;
    collectionType: string;
    dateFrom: string;
    dateTo: string;
  };
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}) {
  const hasFilters = Object.values(filters).some((v) => v && v !== "all" && v !== "");
  const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block";
  const selectClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs px-3 py-2 focus:outline-none focus:border-sky-500 transition cursor-pointer font-medium";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Layers className="h-4 w-4 text-sky-600" />
          Advanced Clinical Requisition Filters
        </h3>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 transition flex items-center gap-1"
          >
            <XCircle className="h-3.5 w-3.5" /> Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className={labelClass}>Lifecycle Status</label>
          <select className={selectClass} value={filters.status} onChange={(e) => onChange("status", e.target.value)}>
            <option value="all">All Stages</option>
            <option value="REGISTERED">Registered</option>
            <option value="SAMPLE_COLLECTED">Sample Drawn</option>
            <option value="PROCESSING">On Analyzers</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Clinical Priority</label>
          <select className={selectClass} value={filters.priority} onChange={(e) => onChange("priority", e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="STAT">⚡ STAT Emergency</option>
            <option value="URGENT">🔴 Urgent Priority</option>
            <option value="ROUTINE">🟢 Routine Standard</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Billing Clearance</label>
          <select className={selectClass} value={filters.payment} onChange={(e) => onChange("payment", e.target.value)}>
            <option value="all">All Ledgers</option>
            <option value="PAID">Fully Paid</option>
            <option value="PARTIAL">Partially Settled</option>
            <option value="PENDING">Due / Pending</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Collection Type</label>
          <select className={selectClass} value={filters.collectionType} onChange={(e) => onChange("collectionType", e.target.value)}>
            <option value="">All Types</option>
            <option value="WALK_IN">OPD Walk-in</option>
            <option value="HOME_COLLECTION">Home Phlebotomy</option>
            <option value="HOSPITAL">IPD Ward Bedside</option>
            <option value="CLINIC">External Clinic B2B</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>From Requisition Date</label>
          <input
            type="date"
            className={selectClass}
            value={filters.dateFrom}
            onChange={(e) => onChange("dateFrom", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>To Requisition Date</label>
          <input
            type="date"
            className={selectClass}
            value={filters.dateTo}
            onChange={(e) => onChange("dateTo", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. VIEW MODE SWITCHER (LIGHT WHITE)
// ==========================================

export function ViewModeSwitcher({
  mode,
  onChange,
}: {
  mode: "table" | "pipeline" | "analytics";
  onChange: (mode: "table" | "pipeline" | "analytics") => void;
}) {
  const modes = [
    { key: "table" as const, label: "Worklist Table", icon: Layers },
    { key: "pipeline" as const, label: "Pipeline Kanban", icon: Activity },
    { key: "analytics" as const, label: "Telemetry & TAT", icon: BarChart3 },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-2xs">
      {modes.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            mode === key
              ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Icon className="h-3.5 w-3.5 text-sky-600" />
          {label}
        </button>
      ))}
    </div>
  );
}
