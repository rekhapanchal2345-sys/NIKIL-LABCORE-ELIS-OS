"use client";
import React from "react";

export function ResultFilters({ search, onSearchChange, statusFilter, onStatusFilterChange }: any) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
      <input
        type="text"
        placeholder="Search patient, barcode, or test..."
        value={search || ""}
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="flex-1 min-w-[220px] px-3 py-2 border border-slate-300 rounded-lg text-sm"
      />
      <select
        value={statusFilter || "ALL"}
        onChange={(e) => onStatusFilterChange?.(e.target.value)}
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
      >
        <option value="ALL">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="ENTERED">Entered</option>
        <option value="APPROVED">Approved</option>
        <option value="CRITICAL">Critical</option>
      </select>
    </div>
  );
}
export default ResultFilters;
