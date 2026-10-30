"use client";
import React from "react";
import { Edit3, ShieldCheck, Eye, Printer, History, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export interface ResultRow {
  id: string;
  orderId?: string;
  testId?: string;
  status: string;
  order?: any;
  test?: any;
  enteredBy?: any;
  approvedBy?: any;
  values?: any[];
  createdAt?: string;
  enteredAt?: string;
  verifiedAt?: string;
  approvedAt?: string;
  patientName?: string;
  testName?: string;
  testCode?: string;
  value?: string | number;
  unit?: string;
}

export function ResultsManagementTable({
  results = [],
  data = [],
  loading = false,
  onEnterEdit,
  onPathologistApprove,
  onPreviewReport,
  onPrintReport,
  onViewHistory,
  onEnterResult,
  onSelectRow,
  onApprove,
  selectedResults,
  onSelectResult,
  onSelectAll,
  isAllSelected = false,
}: any) {
  const list: ResultRow[] = Array.isArray(results) && results.length > 0 ? results : Array.isArray(data) ? data : [];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        Loading laboratory result worksheets...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider">
            <tr>
              {onSelectAll && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={Boolean(isAllSelected && list.length > 0)}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                </th>
              )}
              <th className="px-4 py-3 font-bold">Order / Barcode</th>
              <th className="px-4 py-3 font-bold">Patient &amp; UHID</th>
              <th className="px-4 py-3 font-bold">Investigation Panel</th>
              <th className="px-4 py-3 font-bold">Analyte Values &amp; Flags</th>
              <th className="px-4 py-3 font-bold">Workflow Status</th>
              <th className="px-4 py-3 font-bold text-right">Clinical Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {list.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No laboratory results match the current filter criteria.
                </td>
              </tr>
            ) : (
              list.map((r, idx) => {
                const pat = r.order?.patient;
                const fullName = pat ? `${pat.firstName || ""} ${pat.lastName || ""}`.trim() : (r.patientName || "Walk-in Patient");
                const uhid = pat?.uhid || "UHID-2026";
                const orderNum = r.order?.orderNumber || `ORD-${String(r.id).slice(-4)}`;
                const barcode = r.order?.barcode || "BC-EDTA";
                const testTitle = r.test?.testName || r.testName || r.testCode || "Diagnostic Investigation";
                const testCode = r.test?.testCode || r.testCode || "LAB";
                const vals = Array.isArray(r.values) ? r.values : [];
                const hasCritical = vals.some((v: any) => v.flag === "CRITICAL" || v.flag === "PANIC");
                const hasAbnormal = vals.some((v: any) => v.flag === "HIGH" || v.flag === "LOW");
                const isSelected = selectedResults instanceof Set ? selectedResults.has(r.id) : false;

                return (
                  <tr key={r.id || idx} className={`hover:bg-slate-50/90 transition-colors ${hasCritical ? "bg-red-50/30" : ""}`}>
                    {onSelectResult && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectResult(r.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-sky-700 text-xs">{orderNum}</div>
                      <div className="font-mono text-[11px] text-slate-500">{barcode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{uhid} {pat?.gender ? `• ${pat.gender}` : ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{testTitle}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{testCode} • {r.test?.sampleType || "SPECIMEN"}</div>
                    </td>
                    <td className="px-4 py-3">
                      {vals.length > 0 ? (
                        <div className="space-y-1">
                          {vals.slice(0, 2).map((v: any, vIdx: number) => (
                            <div key={v.id || vIdx} className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-600 truncate max-w-[130px]">{v.parameter?.parameterName || "Param"}:</span>
                              <span className={`font-mono font-bold ${v.flag === "CRITICAL" ? "text-red-600" : v.flag === "HIGH" || v.flag === "LOW" ? "text-amber-600" : "text-slate-900"}`}>
                                {v.value || "Pending"} {v.parameter?.unit || ""}
                              </span>
                              {v.flag && v.flag !== "NORMAL" && (
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${v.flag === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                                  {v.flag}
                                </span>
                              )}
                            </div>
                          ))}
                          {vals.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-medium">+{vals.length - 2} more parameters</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Awaiting Analyzer / Entry</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                        r.status === "APPROVED" || r.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.status === "VERIFIED" || r.status === "ENTERED"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {r.status === "APPROVED" || r.status === "PUBLISHED" ? <CheckCircle2 className="h-3 w-3" /> : hasCritical ? <AlertTriangle className="h-3 w-3 text-red-600" /> : <Clock className="h-3 w-3" />}
                        {r.status || "PENDING"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (onEnterEdit) onEnterEdit(r.id);
                            else if (onEnterResult) onEnterResult(r);
                            else if (onSelectRow) onSelectRow(r);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition"
                          title="Enter or Edit Clinical Parameters"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Enter / Edit
                        </button>
                        {(onPathologistApprove || onApprove) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onPathologistApprove) onPathologistApprove(r.id);
                              else if (onApprove) onApprove(r);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition"
                            title="Pathologist Digital Sign-Off"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Sign-Off
                          </button>
                        )}
                        {onPreviewReport && (
                          <button
                            type="button"
                            onClick={() => onPreviewReport(r.id)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                            title="Preview NABL Report"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Report
                          </button>
                        )}
                        {onPrintReport && (
                          <button
                            type="button"
                            onClick={() => onPrintReport(r.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Print A4 Report"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onViewHistory && (
                          <button
                            type="button"
                            onClick={() => onViewHistory(r.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Audit Trail"
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default ResultsManagementTable;
