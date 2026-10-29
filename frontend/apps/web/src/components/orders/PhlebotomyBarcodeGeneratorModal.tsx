"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Printer,
  Copy,
  Check,
  Barcode as BarcodeIcon,
  FlaskConical,
  Info,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Search,
  Droplets,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { showSuccess, showInfo } from "@/lib/notifications";
import {
  CLSI_VACUTAINER_CATALOG,
  detectRequiredTubes,
  formatTubeBarcode,
  VacutainerTubeDefinition,
} from "@/lib/phlebotomy-tubes";
import BarcodeLabelModal, { BarcodeLabelItem } from "@/components/barcodes/BarcodeLabelModal";

export interface PhlebotomyBarcodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: any | null;
  orders?: any[];
  onSelectOrder?: (order: any) => void;
}

export default function PhlebotomyBarcodeGeneratorModal({
  isOpen,
  onClose,
  order: initialOrder,
  orders = [],
  onSelectOrder,
}: PhlebotomyBarcodeGeneratorModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrder?.id || "");
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);

  // Barcode Print Modal states
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printLabels, setPrintLabels] = useState<BarcodeLabelItem[]>([]);
  const [selectedBarcodeToPrint, setSelectedBarcodeToPrint] = useState<string | undefined>(undefined);

  // Active Order resolving
  const activeOrder = useMemo(() => {
    if (selectedOrderId && orders.length > 0) {
      const found = orders.find((o) => o.id === selectedOrderId);
      if (found) return found;
    }
    return initialOrder || (orders.length > 0 ? orders[0] : null);
  }, [selectedOrderId, orders, initialOrder]);

  // Extract tests from active order
  const orderTests = useMemo(() => {
    if (!activeOrder?.items || !Array.isArray(activeOrder.items)) return [];
    return activeOrder.items.map((item: any) => ({
      testName: item.test?.testName || item.testName || "Diagnostic Test",
      sampleType: item.test?.sampleType || item.sampleType || "WHOLE_BLOOD",
    }));
  }, [activeOrder]);

  // Detect tubes according to CLSI H3-A6
  const requiredTubes = useMemo(() => {
    if (orderTests.length > 0) {
      return detectRequiredTubes(orderTests);
    }
    // Fallback: standard diagnostic repertoire
    return CLSI_VACUTAINER_CATALOG.filter((t) =>
      ["tube-citrate-blue", "tube-sst-gold", "tube-heparin-green", "tube-edta-purple", "tube-fluoride-grey"].includes(
        t.id
      )
    );
  }, [orderTests]);

  if (!isOpen) return null;

  const orderBarcodeOrUhid =
    activeOrder?.barcode || activeOrder?.orderNumber || activeOrder?.patient?.uhid || "LIS-SAMPLE";
  const patientUhid = activeOrder?.patient?.uhid || "UHID-SAMPLE";
  const patientFullName = activeOrder?.patient
    ? `${activeOrder.patient.firstName || ""} ${activeOrder.patient.lastName || ""}`.trim()
    : "Hospital Patient";

  const handleCopyBarcode = (barcodeStr: string) => {
    navigator.clipboard.writeText(barcodeStr);
    setCopiedBarcode(barcodeStr);
    showSuccess(`Barcode ${barcodeStr} copied to clipboard!`);
    setTimeout(() => setCopiedBarcode(null), 2500);
  };

  const handlePrintSingleTube = (tube: VacutainerTubeDefinition) => {
    const tubeBarcode = formatTubeBarcode(orderBarcodeOrUhid, tube.code);
    const item: BarcodeLabelItem = {
      id: `${activeOrder?.id || "ord"}-${tube.id}`,
      barcode: tubeBarcode,
      orderNumber: activeOrder?.orderNumber,
      testName: tube.commonTests.slice(0, 3).join(", ") || tube.name,
      specimenType: tube.specimenType,
      tubeType: tube.shortName,
      tubeColor: tube.capColor,
      tubeColorHex: tube.capColorHex,
      patientName: patientFullName,
      uhid: patientUhid,
      gender: activeOrder?.patient?.gender,
      age: activeOrder?.patient?.age,
      date: new Date().toISOString().split("T")[0],
      priority: activeOrder?.priority || "ROUTINE",
      orderOfDraw: tube.orderOfDraw,
      orderOfDrawLabel: tube.orderOfDrawLabel,
      inversions: tube.inversions,
      minVolume: tube.minVolume,
      centrifugeGuide: tube.centrifugeGuide,
      clinicalWarning: tube.clinicalWarning,
    };

    setPrintLabels([item]);
    setSelectedBarcodeToPrint(tubeBarcode);
    setPrintModalOpen(true);
  };

  const handlePrintAllTubes = () => {
    const items: BarcodeLabelItem[] = requiredTubes.map((tube) => {
      const tubeBarcode = formatTubeBarcode(orderBarcodeOrUhid, tube.code);
      return {
        id: `${activeOrder?.id || "ord"}-${tube.id}`,
        barcode: tubeBarcode,
        orderNumber: activeOrder?.orderNumber,
        testName: tube.commonTests.slice(0, 3).join(", ") || tube.name,
        specimenType: tube.specimenType,
        tubeType: tube.shortName,
        tubeColor: tube.capColor,
        tubeColorHex: tube.capColorHex,
        patientName: patientFullName,
        uhid: patientUhid,
        gender: activeOrder?.patient?.gender,
        age: activeOrder?.patient?.age,
        date: new Date().toISOString().split("T")[0],
        priority: activeOrder?.priority || "ROUTINE",
        orderOfDraw: tube.orderOfDraw,
        orderOfDrawLabel: tube.orderOfDrawLabel,
        inversions: tube.inversions,
        minVolume: tube.minVolume,
        centrifugeGuide: tube.centrifugeGuide,
        clinicalWarning: tube.clinicalWarning,
      };
    });

    setPrintLabels(items);
    setSelectedBarcodeToPrint(undefined);
    setPrintModalOpen(true);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Phlebotomy Specimen Tube Barcode Generator"
      >
        <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <BarcodeIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Phlebotomy Specimen Tube Barcode Generator
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    CLSI H3-A6 Standard
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Color-coded biological specimen vacutainer barcodes &amp; pre-analytical accessioning
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintAllTubes}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print All {requiredTubes.length} Labels</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-slate-50/40">
            {/* Order Selector Banner (if multiple orders provided) */}
            {orders.length > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-slate-400" /> Target Requisition:
                </span>
                <select
                  value={selectedOrderId || activeOrder?.id || ""}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    const sel = orders.find((o) => o.id === e.target.value);
                    if (sel && onSelectOrder) onSelectOrder(sel);
                  }}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      Order #{o.orderNumber} • {o.patient?.firstName} {o.patient?.lastName} ({o.patient?.uhid})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Active Order Card */}
            {activeOrder && (
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/40 p-4.5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-indigo-900 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                        #{activeOrder.orderNumber || "ORD-NEW"}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{patientFullName}</h3>
                      <span className="text-xs font-mono text-slate-500">UHID: {patientUhid}</span>
                      {activeOrder.priority === "STAT" && (
                        <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                          STAT Emergency
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Specimen Master Barcode:{" "}
                      <strong className="font-mono text-slate-800">{activeOrder.barcode || "ACC-AUTO-GEN"}</strong>
                      {activeOrder.doctor?.fullName && ` • Dr. ${activeOrder.doctor.fullName}`}
                    </p>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-slate-500 font-medium">Allocated Tubes:</span>{" "}
                    <strong className="text-indigo-700 font-bold">{requiredTubes.length} Vacutainers</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {orderTests.length > 0 ? `Mapped from ${orderTests.length} ordered tests` : "Standard phlebotomy suite"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Vacutainer Tubes List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <FlaskConical className="h-4 w-4 text-indigo-600" />
                  Specimen Collection Tubes (CLSI Order of Draw)
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  Sequence avoids chemical cross-contamination
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {requiredTubes.map((tube) => {
                  const tubeBarcode = formatTubeBarcode(orderBarcodeOrUhid, tube.code);
                  const isCopied = copiedBarcode === tubeBarcode;

                  return (
                    <div
                      key={tube.id}
                      className={`rounded-2xl border p-4 text-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs ${tube.badgeBg} ${tube.badgeBorder}`}
                    >
                      <div className="flex items-start gap-3.5">
                        <span
                          className="h-5 w-5 rounded-full border-2 border-white shadow-md shrink-0 mt-0.5"
                          style={{ backgroundColor: tube.capColorHex }}
                          title={`${tube.name} (${tube.capColor})`}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-black text-sm ${tube.badgeText}`}>{tube.name}</p>
                            <span className="rounded-md bg-white/90 border border-slate-200 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-700 font-mono">
                              {tube.orderOfDrawLabel}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Specimen: <strong className="text-slate-800">{tube.specimenType}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              Barcode:{" "}
                              <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono shadow-inner">
                                {tubeBarcode}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium flex-wrap pt-0.5">
                            <span>
                              Inversions: <strong className="text-slate-900">{tube.inversions}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Volume: <strong className="text-slate-900">{tube.minVolume}</strong>
                            </span>
                            {tube.commonTests.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500 truncate max-w-xs">
                                  Assays: {tube.commonTests.slice(0, 3).join(", ")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleCopyBarcode(tubeBarcode)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs font-bold text-xs"
                          title="Copy Tube Barcode"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 text-[11px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintSingleTube(tube)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Label</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CLSI Order of Draw Training Card */}
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-950 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 font-black text-sky-900">
                <Info className="w-4 h-4 text-sky-600" />
                <span>CLSI H3-A6 / ISO 15189 Phlebotomy Directive:</span>
              </div>
              <p className="text-[11px] text-sky-900 leading-relaxed font-medium">
                Standard Blood Draw Sequence:{" "}
                <strong>Citrate (Blue) → SST Gel (Gold) → Heparin (Green) → EDTA (Purple) → Fluoride (Grey)</strong>.
                Drawing tubes out of order causes cross-contamination of tube additives (e.g. EDTA chelating calcium or elevating potassium in chemistry tubes), leading to critical false laboratory test results.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              Ready for high-density 38×19mm &amp; 50×25mm thermal tube labelers
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintAllTubes}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print All Labels</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Barcode Label Print Modal */}
      <BarcodeLabelModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        labels={printLabels}
        initialSelectedBarcode={selectedBarcodeToPrint}
        patient={activeOrder?.patient || undefined}
      />
    </>
  );
}
