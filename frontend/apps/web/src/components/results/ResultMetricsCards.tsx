"use client";
import React, { useEffect, useState } from "react";
import { resultApi } from "@/lib/api";

export function ResultMetricsCards({ metrics, onFilterChange }: any) {
  const [counts, setCounts] = useState({
    total: metrics?.total ?? 0,
    pending: metrics?.pending ?? 0,
    approved: metrics?.approved ?? 0,
    critical: metrics?.critical ?? 0,
  });

  useEffect(() => {
    resultApi.getAll().then((res: any) => {
      const list = res?.data?.results || [];
      setCounts({
        total: list.length,
        pending: list.filter((r: any) => r.status === "PENDING" || r.status === "ENTERED" || r.status === "VERIFIED").length,
        approved: list.filter((r: any) => r.status === "APPROVED" || r.status === "PUBLISHED").length,
        critical: list.filter((r: any) => (r.values || []).some((v: any) => v.flag === "CRITICAL" || v.flag === "PANIC")).length,
      });
    }).catch(() => {});
  }, [metrics]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button
        type="button"
        onClick={() => onFilterChange?.("")}
        className="text-left p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition"
      >
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Worksheets</div>
        <div className="mt-1 text-2xl font-black text-slate-900">{counts.total}</div>
      </button>
      <button
        type="button"
        onClick={() => onFilterChange?.("PENDING")}
        className="text-left p-4 bg-white hover:bg-amber-50/40 rounded-xl border border-amber-200 shadow-sm transition"
      >
        <div className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Validation</div>
        <div className="mt-1 text-2xl font-black text-amber-600">{counts.pending}</div>
      </button>
      <button
        type="button"
        onClick={() => onFilterChange?.("APPROVED")}
        className="text-left p-4 bg-white hover:bg-emerald-50/40 rounded-xl border border-emerald-200 shadow-sm transition"
      >
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved &amp; Signed</div>
        <div className="mt-1 text-2xl font-black text-emerald-600">{counts.approved}</div>
      </button>
      <button
        type="button"
        onClick={() => onFilterChange?.("")}
        className="text-left p-4 bg-white hover:bg-red-50/40 rounded-xl border border-red-200 shadow-sm transition"
      >
        <div className="text-xs font-bold uppercase tracking-wider text-red-700">Critical Panic Alerts</div>
        <div className="mt-1 text-2xl font-black text-red-600">{counts.critical}</div>
      </button>
    </div>
  );
}
export default ResultMetricsCards;
