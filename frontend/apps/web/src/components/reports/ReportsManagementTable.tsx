"use client";

import React from "react";
import { Eye, RefreshCw, FileText } from "lucide-react";

export interface ReportsManagementTableProps {
  reports: any[];
  loading?: boolean;
  onViewReport: (report: any) => void;
  onRefresh?: () => void;
}

export default function ReportsManagementTable({
  reports = [],
  onViewReport,
}: ReportsManagementTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 border-r border-slate-200/80">Order #</th>
              <th className="px-4 py-3 border-r border-slate-200/80">Patient</th>
              <th className="px-4 py-3 border-r border-slate-200/80">Investigation</th>
              <th className="px-4 py-3 border-r border-slate-200/80">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 bg-white">
            {reports.length > 0 ? (
              reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 border-r border-slate-200/80 font-mono font-bold text-slate-900">
                    {r.orderNumber || r.id}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200/80 font-semibold text-slate-900">
                    {r.patientName || "Clinical Patient"}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200/80 text-slate-700">
                    {r.testName || "Diagnostic Profile"}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200/80">
                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-bold text-emerald-800">
                      {r.status || "VERIFIED"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onViewReport(r)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0f2d52] px-3 py-1.5 font-bold text-white"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Report
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  <FileText className="mx-auto h-6 w-6 text-slate-300 mb-1" />
                  No clinical reports match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
