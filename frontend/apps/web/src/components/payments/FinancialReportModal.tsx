"use client";

import React from "react";
import { X, FileSpreadsheet, Printer } from "lucide-react";

export interface FinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  orders: any[];
  summary: any;
}

export default function FinancialReportModal({
  isOpen,
  onClose,
  payments,
  summary,
}: FinancialReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Statutory Day-Book & Revenue Summary Studio
              </h3>
              <p className="text-[11px] text-slate-500">
                Hospital, Diagnostic Lab & Clinic CA Audit Schedule (SAC 999312)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-400">Today Collection</div>
            <div className="mt-1 font-mono text-base font-extrabold text-slate-900">
              ₹{Number(summary?.todayCollection || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-400">Cash Till</div>
            <div className="mt-1 font-mono text-base font-extrabold text-emerald-700">
              ₹{Number(summary?.cashDrawer || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-400">Receivables</div>
            <div className="mt-1 font-mono text-base font-extrabold text-amber-700">
              ₹{Number(summary?.outstandingReceivables || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-400">Total Vouchers</div>
            <div className="mt-1 font-mono text-base font-extrabold text-sky-700">
              {payments.length}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2d52] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Day-Book
          </button>
        </div>
      </div>
    </div>
  );
}
