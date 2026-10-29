"use client";
import React from "react";

export function ResultMetricsCards({ metrics = {} }: any) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-white rounded-xl border border-slate-200">
        <div className="text-xs text-slate-500">Total Results</div>
        <div className="text-2xl font-bold text-slate-900">{metrics.total ?? 0}</div>
      </div>
      <div className="p-4 bg-white rounded-xl border border-slate-200">
        <div className="text-xs text-slate-500">Pending Validation</div>
        <div className="text-2xl font-bold text-amber-600">{metrics.pending ?? 0}</div>
      </div>
      <div className="p-4 bg-white rounded-xl border border-slate-200">
        <div className="text-xs text-slate-500">Approved</div>
        <div className="text-2xl font-bold text-emerald-600">{metrics.approved ?? 0}</div>
      </div>
      <div className="p-4 bg-white rounded-xl border border-slate-200">
        <div className="text-xs text-slate-500">Critical Alerts</div>
        <div className="text-2xl font-bold text-red-600">{metrics.critical ?? 0}</div>
      </div>
    </div>
  );
}
export default ResultMetricsCards;
