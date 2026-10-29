"use client";

import React, { ChangeEvent } from "react";
import { Search, SlidersHorizontal, RotateCcw, Stethoscope, AlertTriangle, Radio, Timer } from "lucide-react";

interface ReportFiltersProps {
  search: string;
  reportType: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  doctor: string;
  criticalOnly: boolean;
  deliveryChannel: string;
  slaBreach: boolean;
  doctors: Array<{ id: string; name: string }>;

  onSearchChange: (value: string) => void;
  onReportTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onDoctorChange: (value: string) => void;
  onCriticalOnlyChange: (value: boolean) => void;
  onDeliveryChannelChange: (value: string) => void;
  onSlaBreachChange: (value: boolean) => void;
  onReset: () => void;
}

export default function ReportFilters({
  search,
  reportType,
  status,
  dateFrom,
  dateTo,
  doctor,
  criticalOnly,
  deliveryChannel,
  slaBreach,
  doctors,
  onSearchChange,
  onReportTypeChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onDoctorChange,
  onCriticalOnlyChange,
  onDeliveryChannelChange,
  onSlaBreachChange,
  onReset,
}: ReportFiltersProps) {
  const hasFilters =
    Boolean(search) ||
    Boolean(reportType) ||
    Boolean(status) ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(doctor) || criticalOnly || Boolean(deliveryChannel) || slaBreach;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-slate-950/80">
      <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/60 text-cyan-400 shadow-sm">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white">Smart Filters</p>
            <p className="text-xs text-slate-400">Refine your diagnostic report worklist</p>
          </div>
        </div>
        <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:block">
          Report Operations
        </span>
      </div>

      <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-8">
        <div className="lg:col-span-2">
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Search Reports
          </label>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />

            <input
              type="search"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onSearchChange(e.target.value)
              }
              placeholder="Report number, patient..."
              className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Report Type
          </label>

          <select
            value={reportType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onReportTypeChange(e.target.value)
            }
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 text-xs font-medium text-slate-200 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
          >
            <option value="" className="bg-slate-900 text-slate-200">All types</option>
            <option value="patient" className="bg-slate-900 text-slate-200">Patient Report</option>
            <option value="daily" className="bg-slate-900 text-slate-200">Daily Report</option>
            <option value="weekly" className="bg-slate-900 text-slate-200">Weekly Report</option>
            <option value="monthly" className="bg-slate-900 text-slate-200">Monthly Report</option>
            <option value="financial" className="bg-slate-900 text-slate-200">Financial Report</option>
            <option value="test" className="bg-slate-900 text-slate-200">Test Report</option>
            <option value="custom" className="bg-slate-900 text-slate-200">Custom Report</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Stethoscope className="h-3 w-3 text-cyan-400" /> Doctor
          </label>
          <select
            value={doctor}
            onChange={(e) => onDoctorChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 text-xs font-medium text-slate-200 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
          >
            <option value="" className="bg-slate-900 text-slate-200">All doctors</option>
            {doctors.map((item) => (
              <option key={item.id} value={item.id} className="bg-slate-900 text-slate-200">
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Radio className="h-3 w-3 text-cyan-400" /> Channel
          </label>
          <select
            value={deliveryChannel}
            onChange={(e) => onDeliveryChannelChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 text-xs font-medium text-slate-200 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
          >
            <option value="" className="bg-slate-900 text-slate-200">All channels</option>
            <option value="WHATSAPP" className="bg-slate-900 text-slate-200">WhatsApp</option>
            <option value="EMAIL" className="bg-slate-900 text-slate-200">Email</option>
            <option value="SMS" className="bg-slate-900 text-slate-200">SMS</option>
            <option value="PHYSICAL" className="bg-slate-900 text-slate-200">Physical</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Status
          </label>

          <select
            value={status}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onStatusChange(e.target.value)
            }
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 text-xs font-medium text-slate-200 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
          >
            <option value="" className="bg-slate-900 text-slate-200">All statuses</option>
            <option value="pending" className="bg-slate-900 text-slate-200">Pending</option>
            <option value="processing" className="bg-slate-900 text-slate-200">Processing</option>
            <option value="generated" className="bg-slate-900 text-slate-200">Generated</option>
            <option value="ready" className="bg-slate-900 text-slate-200">Ready</option>
            <option value="completed" className="bg-slate-900 text-slate-200">Completed</option>
            <option value="failed" className="bg-slate-900 text-slate-200">Failed</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            From Date
          </label>

          <input
            type="date"
            value={dateFrom}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onDateFromChange(e.target.value)
            }
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 text-xs font-medium text-slate-200 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            To Date
          </label>

          <input
            type="date"
            value={dateTo}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onDateToChange(e.target.value)
            }
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 text-xs font-medium text-slate-200 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-slate-800/80 pt-3.5 md:grid-cols-2">
        <label
          className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition ${
            criticalOnly
              ? "border-rose-500/40 bg-rose-950/40 text-rose-300 shadow-sm"
              : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-900"
          }`}
        >
          <span className="flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="h-4 w-4 text-rose-400" /> Critical results only
          </span>
          <input
            type="checkbox"
            checked={criticalOnly}
            onChange={(e) => onCriticalOnlyChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500/30"
          />
        </label>
        <label
          className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition ${
            slaBreach
              ? "border-amber-500/40 bg-amber-950/40 text-amber-300 shadow-sm"
              : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-900"
          }`}
        >
          <span className="flex items-center gap-2 text-xs font-bold">
            <Timer className="h-4 w-4 text-amber-400" /> TAT / SLA breach
          </span>
          <input
            type="checkbox"
            checked={slaBreach}
            onChange={(e) => onSlaBreachChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/30"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
        <p className="text-xs text-slate-400">
          Filter reports by type, status, patient, channel and generation date.
        </p>

        <button
          type="button"
          onClick={onReset}
          disabled={!hasFilters}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3.5 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-900/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filters
        </button>
      </div>
    </section>
  );
}