"use client";
import React from "react";
import { Search, RotateCcw } from "lucide-react";

export function ResultFilters({
  search,
  onSearchChange,
  status,
  statusFilter,
  onStatusChange,
  onStatusFilterChange,
  department,
  onDepartmentChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onReset,
}: any) {
  const currentStatus = status ?? statusFilter ?? "";
  const handleStatus = onStatusChange || onStatusFilterChange;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search patient name, UHID, order number, barcode, or test..."
          value={search || ""}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
        />
      </div>
      <select
        value={currentStatus}
        onChange={(e) => handleStatus?.(e.target.value === "ALL" ? "" : e.target.value)}
        className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-white focus:border-sky-500 focus:outline-none"
      >
        <option value="">All Workflow Statuses</option>
        <option value="PENDING">Pending Worksheet</option>
        <option value="ENTERED">Entered (Tech)</option>
        <option value="VERIFIED">Verified</option>
        <option value="APPROVED">Approved &amp; Signed</option>
        <option value="PUBLISHED">Published</option>
      </select>
      {onDepartmentChange && (
        <select
          value={department || ""}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white"
        >
          <option value="">All Lab Departments</option>
          <option value="Hematology">Hematology &amp; Coagulation</option>
          <option value="Biochemistry">Clinical Biochemistry</option>
          <option value="Immunoassay">Immunoassay &amp; Hormones</option>
          <option value="Microbiology">Microbiology</option>
        </select>
      )}
      {onDateFromChange && (
        <input
          type="date"
          value={dateFrom || ""}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700"
        />
      )}
      {onDateToChange && (
        <input
          type="date"
          value={dateTo || ""}
          onChange={(e) => onDateToChange(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700"
        />
      )}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      )}
    </div>
  );
}
export default ResultFilters;
