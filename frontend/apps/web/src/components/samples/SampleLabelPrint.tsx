"use client";
import React from "react";
import { Printer, X, Barcode } from "lucide-react";

export function SampleLabelPrint({ isOpen, onClose, onPrint, sample, mode = "label" }: any) {
  if (isOpen === false || !sample) return null;
  const pat = sample.order?.patient || {};
  const patName = `${pat.firstName || ""} ${pat.lastName || ""}`.trim() || "Walk-in Patient";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-sky-400" />
            <h3 className="text-sm font-bold">{mode === "sheet" ? "Phlebotomy Collection Worksheet" : "Vacutainer Barcode Tube Label (50x25mm)"}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-900 space-y-2 font-mono text-xs">
            <div className="flex justify-between font-bold text-slate-900">
              <span>{patName}</span>
              <span>{pat.uhid || "UHID-2026"}</span>
            </div>
            <div className="text-[11px] text-slate-600">{pat.gender || "M/F"} • Order: {sample.order?.orderNumber || "ORD-2026"}</div>
            <div className="py-2 my-1 bg-slate-100 rounded text-center font-black tracking-[0.25em] text-sm text-slate-950 border border-slate-300">
              ||| |||| ||| |||| |||
              <div className="tracking-normal text-xs mt-1">{sample.barcode || "BC-2026-EDTA"}</div>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-sky-800">
              <span>{sample.test?.testCode || "TEST"} - {sample.test?.testName || "Assay"}</span>
              <span>{sample.test?.sampleContainer || sample.sampleType}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 print:hidden">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600">Close</button>
            <button
              type="button"
              onClick={() => {
                window.print();
                onPrint?.();
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl"
            >
              <Printer className="h-3.5 w-3.5" />
              Print {mode === "sheet" ? "Worksheet" : "Barcode Label"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SampleLabelPrint;
