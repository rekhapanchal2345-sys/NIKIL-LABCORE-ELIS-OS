"use client";

import React from "react";
import { AlertOctagon, CheckCircle2, ClipboardCheck, RotateCcw } from "lucide-react";

interface ApprovalMetricsProps {
  pendingApproval?: number;
  criticalValues?: number;
  approvedToday?: number;
  rejectedRerun?: number;
  loading?: boolean;
  activeFilter?: string;
  onSelectMetric?: (filterKey: string) => void;
}

export default function ApprovalMetrics({
  pendingApproval = 0,
  criticalValues = 0,
  approvedToday = 0,
  rejectedRerun = 0,
  loading = false,
  activeFilter = "",
  onSelectMetric,
}: ApprovalMetricsProps) {
  const hasCritical = criticalValues > 0;

  const metrics = [
    {
      key: "pending",
      title: "Pending Sign-Off",
      value: pendingApproval,
      description: "Results waiting for pathologist authorization",
      Icon: ClipboardCheck,
      accentBorder: "border-l-sky-600",
      iconWrap: "border-sky-100 bg-sky-50 text-sky-700",
      valueColor: "text-slate-900",
    },
    {
      key: "critical",
      title: "Critical Values",
      value: criticalValues,
      description: "Require documented read-back before release",
      Icon: AlertOctagon,
      accentBorder: hasCritical ? "border-l-red-600" : "border-l-slate-300",
      iconWrap: hasCritical ? "border-red-100 bg-red-50 text-red-600" : "border-slate-200 bg-slate-50 text-slate-500",
      valueColor: hasCritical ? "text-red-700" : "text-slate-900",
    },
    {
      key: "approved",
      title: "Approved Today",
      value: approvedToday,
      description: "Reports signed since midnight",
      Icon: CheckCircle2,
      accentBorder: "border-l-emerald-600",
      iconWrap: "border-emerald-100 bg-emerald-50 text-emerald-700",
      valueColor: "text-slate-900",
    },
    {
      key: "rerun",
      title: "Returned for Rerun",
      value: rejectedRerun,
      description: "Sent back for correction or re-sampling",
      Icon: RotateCcw,
      accentBorder: "border-l-amber-500",
      iconWrap: "border-amber-100 bg-amber-50 text-amber-700",
      valueColor: "text-slate-900",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-l-4 border-slate-200 border-l-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="mt-3 h-3.5 w-28 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-50" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(({ key, title, value, description, Icon, accentBorder, iconWrap, valueColor }) => {
        const isSelected = activeFilter === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectMetric?.(key)}
            aria-pressed={isSelected}
            className={`group rounded-xl border border-l-4 bg-white p-4 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${accentBorder} ${
              isSelected
                ? "border-sky-300 bg-sky-50/40"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${iconWrap}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${valueColor}`}>
                {value}
              </span>
            </div>

            <h3 className="mt-3 text-[13px] font-bold text-slate-800">{title}</h3>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">{description}</p>
          </button>
        );
      })}
    </div>
  );
}
