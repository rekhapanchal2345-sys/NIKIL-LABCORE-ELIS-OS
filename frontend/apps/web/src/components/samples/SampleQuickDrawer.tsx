"use client";
import React from "react";
import { X, Printer, ShieldAlert, ArrowRight, CheckCircle2, TestTube2 } from "lucide-react";

export function SampleQuickDrawer({
  isOpen,
  onClose,
  sample,
  onAdvance,
  onReject,
  onPrintLabel,
  onPrintSheet,
  updating,
}: any) {
  if (!isOpen || !sample) return null;
  const pat = sample.order?.patient || {};
  const patName = `${pat.firstName || ""} ${pat.lastName || ""}`.trim() || "Walk-in Patient";

  const nextActionMap: Record<string, { action: "collect" | "receive" | "process" | "complete"; label: string }> = {
    ORDERED: { action: "collect", label: "Collect Phlebotomy Tube" },
    PENDING: { action: "collect", label: "Collect Phlebotomy Tube" },
    COLLECTED: { action: "receive", label: "Receive at Lab Accession Desk" },
    RECEIVED: { action: "process", label: "Load onto Clinical Analyzer" },
    PROCESSING: { action: "complete", label: "Mark Analytical Run Complete" },
  };
  const nextStep = nextActionMap[sample.status];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <TestTube2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{sample.sampleNumber}</h3>
              <p className="text-xs font-mono text-sky-700 font-bold">Barcode: {sample.barcode}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-slate-500">Patient:</span> <strong className="text-slate-900">{patName}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">UHID:</span> <span className="font-mono font-bold text-slate-800">{pat.uhid || "UHID-2026"}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Order #:</span> <span className="font-mono font-bold text-sky-700">{sample.order?.orderNumber || "ORD-2026"}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Investigation:</span> <strong className="text-slate-900">{sample.test?.testName || "Assay"}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">Vacutainer:</span> <strong className="text-purple-700">{sample.test?.sampleContainer || sample.sampleType}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">Current Status:</span> <span className="px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800">{sample.status}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          {onPrintLabel && (
            <button
              type="button"
              onClick={() => onPrintLabel(sample)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
            >
              <Printer className="h-4 w-4 text-sky-600" />
              Print Tube Label
            </button>
          )}
          {onPrintSheet && (
            <button
              type="button"
              onClick={() => onPrintSheet(sample)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
            >
              <Printer className="h-4 w-4 text-teal-600" />
              Collection Sheet
            </button>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-2.5">
        {nextStep && onAdvance && (
          <button
            type="button"
            disabled={updating}
            onClick={() => onAdvance(sample, nextStep.action)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition"
          >
            <CheckCircle2 className="h-4 w-4" />
            {nextStep.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
        {sample.status !== "REJECTED" && sample.status !== "COMPLETED" && onReject && (
          <button
            type="button"
            onClick={() => onReject(sample.id)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition"
          >
            <ShieldAlert className="h-4 w-4" />
            Reject Specimen (Pre-Analytical QC)
          </button>
        )}
      </div>
    </div>
  );
}
export default SampleQuickDrawer;
