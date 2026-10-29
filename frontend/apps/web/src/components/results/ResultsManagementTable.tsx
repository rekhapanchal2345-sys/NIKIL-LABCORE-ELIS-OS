"use client";
import React from "react";

export interface ResultRow {
  id: string;
  patientName?: string;
  patientId?: string;
  testName?: string;
  testCode?: string;
  value?: string | number;
  unit?: string;
  referenceRange?: string;
  status?: string;
  flag?: string;
  updatedAt?: string;
  [key: string]: any;
}

export function ResultsManagementTable({ rows = [], results = [], onSelectRow, onEnterResult, onApprove }: any) {
  const list: ResultRow[] = rows.length ? rows : results;
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3">Patient</th>
            <th className="px-4 py-3">Test</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                No laboratory results found.
              </td>
            </tr>
          ) : (
            list.map((r, idx) => (
              <tr key={r.id || idx} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{r.patientName || "Walk-in Patient"}</td>
                <td className="px-4 py-3 text-slate-700">{r.testName || r.testCode || "Test Panel"}</td>
                <td className="px-4 py-3 text-slate-700">{r.value ?? "—"} {r.unit || ""}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
                    {r.status || "PENDING"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => (onEnterResult || onSelectRow)?.(r)}
                    className="text-blue-600 hover:underline text-xs font-medium"
                  >
                    Open
                  </button>
                  {onApprove && (
                    <button
                      type="button"
                      onClick={() => onApprove(r)}
                      className="text-emerald-600 hover:underline text-xs font-medium"
                    >
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
export default ResultsManagementTable;
