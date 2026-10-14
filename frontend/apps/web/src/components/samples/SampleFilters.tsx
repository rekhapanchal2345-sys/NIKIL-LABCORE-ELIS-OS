"use client";

import React, { ChangeEvent } from "react";
import { Search, RotateCcw, Filter, Calendar } from "lucide-react";

interface SampleFiltersProps {
  search: string;
  status: string;
  sampleType: string;
  dateFrom: string;
  dateTo: string;

  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSampleTypeChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onReset: () => void;
}

export default function SampleFilters({
  search,
  status,
  sampleType,
  dateFrom,
  dateTo,
  onSearchChange,
  onStatusChange,
  onSampleTypeChange,
  onDateFromChange,
  onDateToChange,
  onReset,
}: SampleFiltersProps) {
  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    onSearchChange(event.target.value);
  }

  function handleStatus(event: ChangeEvent<HTMLSelectElement>) {
    onStatusChange(event.target.value);
  }

  function handleSampleType(event: ChangeEvent<HTMLSelectElement>) {
    onSampleTypeChange(event.target.value);
  }

  function handleDateFrom(event: ChangeEvent<HTMLInputElement>) {
    onDateFromChange(event.target.value);
  }

  function handleDateTo(event: ChangeEvent<HTMLInputElement>) {
    onDateToChange(event.target.value);
  }

  const hasFilters =
    Boolean(search) ||
    Boolean(status) ||
    Boolean(sampleType) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">
            Search Specimen
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-4 w-4 text-sky-600" />
            </span>

            <input
              type="search"
              value={search}
              onChange={handleSearch}
              placeholder="Sample ID, barcode, patient UHID or name..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all font-medium"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">
            Workflow Stage
          </label>

          <select
            value={status}
            onChange={handleStatus}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white transition-all font-medium"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending Phlebotomy</option>
            <option value="collected">Collected</option>
            <option value="received">Received in Lab</option>
            <option value="processing">In-Analyzer Run</option>
            <option value="completed">Completed &amp; Validated</option>
            <option value="rejected">Rejected / Redraw</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">
            Specimen Matrix
          </label>

          <select
            value={sampleType}
            onChange={handleSampleType}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white transition-all font-medium"
          >
            <option value="">All matrix types</option>
            <option value="Blood">Whole Blood</option>
            <option value="Serum">Serum</option>
            <option value="Plasma">Plasma</option>
            <option value="Urine">Urine</option>
            <option value="Stool">Stool</option>
            <option value="Swab">Swab</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">
            From Date
          </label>

          <input
            type="date"
            value={dateFrom}
            onChange={handleDateFrom}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500">
          Filter specimens by accession barcode, patient UHID, stage, and pre-analytical draw date.
        </p>

        <button
          type="button"
          onClick={onReset}
          disabled={!hasFilters}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
        >
          <RotateCcw className="h-3 w-3" /> Reset Filters
        </button>
      </div>
    </section>
  );
}