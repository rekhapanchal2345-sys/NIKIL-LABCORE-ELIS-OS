"use client";

import { useState } from "react";
import { Printer, Check, X, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  previewContent: React.ReactNode;
  printType: "label" | "collection-sheet";
}

export default function PrintPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  previewContent,
  printType
}: PrintPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState<"fit" | "100" | "125">("fit");
  const [stock, setStock] = useState(printType === "label" ? "Thermal 2 × 1 in" : "A4");
  const [printer, setPrinter] = useState("LabCore Zebra 01");
  const [verified, setVerified] = useState(false);

  const handlePrint = () => {
    setIsLoading(true);
    setTimeout(() => {
      onConfirm();
      setIsLoading(false);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        {/* Header */}
        <div className="relative border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 border border-sky-200">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500">
                  {printType === "label" ? "Accession label thermal print queue" : "Specimen collection manifest print queue"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="grid flex-1 gap-6 overflow-auto bg-slate-50/50 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className={`relative transition-transform duration-200 ${zoom === "100" ? "scale-100" : zoom === "125" ? "scale-125" : "scale-90"}`}>
              {previewContent}
            </div>
          </div>

          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Production Checks</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="text-[11px] font-bold text-slate-600">
                Target Printer
                <select 
                  value={printer} 
                  onChange={(e) => setPrinter(e.target.value)} 
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                >
                  <option>LabCore Zebra 01</option>
                  <option>LabCore Zebra 02</option>
                  <option>Save as PDF</option>
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-600">
                Media Stock
                <select 
                  value={stock} 
                  onChange={(e) => setStock(e.target.value)} 
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                >
                  <option>{printType === "label" ? "Thermal 2 × 1 in" : "A4 Standard"}</option>
                  <option>{printType === "label" ? "Thermal 3 × 1 in" : "A4 Landscape"}</option>
                </select>
              </label>
            </div>

            <div className="space-y-2 text-xs">
              {[
                printType === "label" ? "Thermal label stock calibrated" : "A4 medical letterhead ready",
                "Patient identity & UHID confirmed",
                "Code128 barcode readable",
                "CLSI chain-of-custody logged",
              ].map((check) => (
                <div key={check} className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{check}</span>
                </div>
              ))}
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs font-medium text-amber-900">
              <input 
                type="checkbox" 
                checked={verified} 
                onChange={(e) => setVerified(e.target.checked)} 
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" 
              />
              <span>I verified patient identity, specimen barcode, and print alignment before release.</span>
            </label>

            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-xs text-sky-900">
              <p className="font-bold">Operator SOP:</p>
              <p className="mt-0.5 text-[11px] text-sky-800 leading-relaxed">
                {printType === "label" 
                  ? "Affix sticker vertically along tube axis without covering the inspection window." 
                  : "Collect physical patient signature before courier dispatch."}
              </p>
            </div>
          </aside>
        </div>

        {/* Print Controls Bar */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              <span>
                {printType === "label" 
                  ? "Direct thermal 300 DPI mode · High contrast Code128 pattern" 
                  : "Clinical manifest document · NABL audit compliant"}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 text-[11px]">
              <span className="px-2 text-slate-500">Zoom:</span>
              {(["fit", "100", "125"] as const).map((value) => (
                <button 
                  key={value} 
                  type="button" 
                  onClick={() => setZoom(value)} 
                  className={`rounded-lg px-2.5 py-1 font-bold transition-colors ${zoom === value ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {value === "fit" ? "Fit" : `${value}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <span className="text-xs text-slate-500">
            {verified ? "✓ Quality gate passed — ready to transmit to printer" : "⚠️ Please check verification box above to release"}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              disabled={isLoading || !verified}
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  <span>{verified ? "Send to Printer" : "Verify First"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}