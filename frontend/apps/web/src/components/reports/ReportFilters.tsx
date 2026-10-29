"use client";

import React from "react";
import { Search, RotateCcw } from "lucide-react";

export interface ReportFiltersProps {
  search: string;
  reportType?: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  doctor?: string;
  criticalOnly?: boolean;
  deliveryChannel?: string;
  slaBreach?: boolean;
  doctors?: any[];
  onSearchChange: (val: string) => void;
  onReportTypeChange?: (val: string) => void;
  onStatusChange: (val: string) => void;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onDoctorChange?: (val: string) => void;
  onCriticalOnlyChange?: (val: boolean) => void;
  onDeliveryChannelChange?: (val: string) => void;
  onSlaBreachChange?: (val: boolean) => void;
  onReset: () => void;
}

export default function ReportFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onReset,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search patient, UHID, order #, test..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="PUBLISHED">Published</option>
          <option value="PENDING">Pending</option>
        </select>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}
