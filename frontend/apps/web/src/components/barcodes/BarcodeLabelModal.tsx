"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Printer,
  Copy,
  Check,
  Barcode,
  Download,
  ExternalLink,
  ShieldCheck,
  Tag,
  Info,
  QrCode,
  Layers,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Plus,
  Trash2,
  FileText,
  Clock,
  FlaskConical,
} from "lucide-react";
import QRCode from "qrcode";
import { showSuccess, showError } from "@/lib/notifications";
import {
  CLSI_VACUTAINER_CATALOG,
  VacutainerTubeDefinition,
  detectRequiredTubes,
  formatTubeBarcode,
} from "@/lib/phlebotomy-tubes";

export interface BarcodeLabelItem {
  id: string;
  barcode: string;
  orderNumber?: string;
  sampleNumber?: string;
  testName: string;
  specimenType?: string;
  tubeType?: string;
  tubeColor?: string;
  tubeColorHex?: string;
  patientName: string;
  uhid: string;
  gender?: string;
  age?: number | string;
  date?: string;
  collectorName?: string;
  priority?: string;
  orderOfDraw?: number;
  orderOfDrawLabel?: string;
  inversions?: string;
  minVolume?: string;
  centrifugeGuide?: string;
  clinicalWarning?: string;
}

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: BarcodeLabelItem[];
  orderId?: string;
  initialSelectedBarcode?: string;
  patient?: any;
}

// Backward-compatible helper function mapping test to tube details
export const getTubeDetailsForTest = (testName: string, sampleType?: string) => {
  const tubes = detectRequiredTubes([{ testName, sampleType }]);
  const tube = tubes[0] || CLSI_VACUTAINER_CATALOG[1]; // default SST Gold
  return {
    specimen: tube.specimenType,
    tubeType: tube.name,
    tubeColor: tube.capColor,
    tubeColorHex: tube.capColorHex,
    tubeBg: `${tube.badgeBg} ${tube.badgeText} ${tube.badgeBorder}`,
    orderOfDraw: tube.orderOfDraw,
    orderOfDrawLabel: tube.orderOfDrawLabel,
    inversions: tube.inversions,
    minVolume: tube.minVolume,
    centrifugeGuide: tube.centrifugeGuide,
    clinicalWarning: tube.clinicalWarning,
  };
};

export default function BarcodeLabelModal({
  isOpen,
  onClose,
  labels: initialLabels,
  orderId,
  initialSelectedBarcode,
  patient,
}: BarcodeLabelModalProps) {
  const [activeLabels, setActiveLabels] = useState<BarcodeLabelItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [labelFormat, setLabelFormat] = useState<"standard" | "compact" | "multi">("standard");
  const [copies, setCopies] = useState<number>(2);
  const [barcodeType, setBarcodeType] = useState<"code128" | "qr">("code128");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [printMode, setPrintMode] = useState<"selected" | "all">("selected");
  const [showAddTubeDropdown, setShowAddTubeDropdown] = useState(false);

  // Initialize and synchronize labels
  useEffect(() => {
    if (initialLabels && initialLabels.length > 0) {
      // Enrich labels with CLSI catalog details if missing
      const enriched = initialLabels.map((lbl) => {
        const tubeDetails = getTubeDetailsForTest(lbl.testName, lbl.specimenType);
        return {
          ...lbl,
          tubeType: lbl.tubeType || tubeDetails.tubeType,
          tubeColor: lbl.tubeColor || tubeDetails.tubeColor,
          tubeColorHex: lbl.tubeColorHex || tubeDetails.tubeColorHex,
          specimenType: lbl.specimenType || tubeDetails.specimen,
          orderOfDraw: lbl.orderOfDraw || tubeDetails.orderOfDraw,
          orderOfDrawLabel: lbl.orderOfDrawLabel || tubeDetails.orderOfDrawLabel,
          inversions: lbl.inversions || tubeDetails.inversions,
          minVolume: lbl.minVolume || tubeDetails.minVolume,
          centrifugeGuide: lbl.centrifugeGuide || tubeDetails.centrifugeGuide,
          clinicalWarning: lbl.clinicalWarning || tubeDetails.clinicalWarning,
        };
      });
      setActiveLabels(enriched);

      if (initialSelectedBarcode) {
        const idx = enriched.findIndex((l) => l.barcode === initialSelectedBarcode);
        if (idx !== -1) setSelectedIdx(idx);
      }
    }
  }, [initialLabels, initialSelectedBarcode]);

  const current = activeLabels[selectedIdx] || activeLabels[0] || initialLabels[0];

  // Generate QR Code data URL when current label changes
  useEffect(() => {
    if (current?.barcode) {
      const qrPayload = JSON.stringify({
        uhid: current.uhid,
        barcode: current.barcode,
        patient: current.patientName,
        tube: current.tubeColor || "VAC",
        specimen: current.specimenType,
        ts: current.date || new Date().toISOString(),
      });

      QRCode.toDataURL(qrPayload, {
        width: 160,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
        errorCorrectionLevel: "M",
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    }
  }, [current]);

  if (!isOpen || !current) return null;

  const tubeInfo = getTubeDetailsForTest(current.testName, current.specimenType);

  // Deterministic SVG Code 128 Barcode Generator
  const renderBarcodeSvg = (code: string) => {
    const cleanCode = (code || "BC-000000").replace(/[^a-zA-Z0-9_-]/g, "");
    const bars: { width: number; isBlack: boolean }[] = [];

    // Quiet zone start
    bars.push({ width: 4, isBlack: false });

    // Guard bar start
    bars.push({ width: 2.5, isBlack: true });
    bars.push({ width: 1.5, isBlack: false });
    bars.push({ width: 2.5, isBlack: true });
    bars.push({ width: 1.5, isBlack: false });

    // Encode chars with variable width bars
    for (let i = 0; i < cleanCode.length; i++) {
      const codeVal = cleanCode.charCodeAt(i);
      const b1 = (codeVal % 3) + 1.2;
      const b2 = ((codeVal >> 1) % 2) + 1.2;
      const b3 = ((codeVal >> 2) % 3) + 1.2;
      bars.push({ width: b1, isBlack: true });
      bars.push({ width: 1.2, isBlack: false });
      bars.push({ width: b2, isBlack: true });
      bars.push({ width: 2, isBlack: false });
      bars.push({ width: b3, isBlack: true });
      bars.push({ width: 1.2, isBlack: false });
    }

    // Guard bar stop
    bars.push({ width: 2.5, isBlack: true });
    bars.push({ width: 1.5, isBlack: false });
    bars.push({ width: 2.5, isBlack: true });
    bars.push({ width: 4, isBlack: false });

    let currentX = 0;
    const height = 48;

    return (
      <svg
        viewBox={`0 0 ${bars.reduce((acc, b) => acc + b.width * 1.5, 0)} ${height}`}
        className="w-full h-11 max-h-11 overflow-visible"
        preserveAspectRatio="none"
      >
        {bars.map((bar, i) => {
          const w = bar.width * 1.5;
          const rect = bar.isBlack ? (
            <rect key={i} x={currentX} y={0} width={w} height={height} fill="#090d16" />
          ) : null;
          currentX += w;
          return rect;
        })}
      </svg>
    );
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(current.barcode);
    setCopied(true);
    showSuccess(`Accession Barcode ${current.barcode} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = (mode: "selected" | "all" = "selected") => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 50);
  };

  // Add extra vacutainer tube on demand to the printing set
  const handleAddTube = (tube: VacutainerTubeDefinition) => {
    const existing = activeLabels.find((l) => l.barcode.endsWith(`-${tube.code}`));
    if (existing) {
      showError(`Tube ${tube.shortName} is already included in this batch.`);
      return;
    }

    const newLabel: BarcodeLabelItem = {
      id: `bc-${tube.code.toLowerCase()}-${Date.now()}`,
      barcode: formatTubeBarcode(current.uhid, tube.code),
      patientName: current.patientName,
      uhid: current.uhid,
      gender: current.gender,
      age: current.age,
      testName: tube.commonTests.slice(0, 3).join(", "),
      specimenType: tube.specimenType,
      tubeType: tube.name,
      tubeColor: tube.capColor,
      tubeColorHex: tube.capColorHex,
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      priority: current.priority || "ROUTINE",
      orderOfDraw: tube.orderOfDraw,
      orderOfDrawLabel: tube.orderOfDrawLabel,
      inversions: tube.inversions,
      minVolume: tube.minVolume,
      centrifugeGuide: tube.centrifugeGuide,
      clinicalWarning: tube.clinicalWarning,
    };

    const nextLabels = [...activeLabels, newLabel].sort((a, b) => (a.orderOfDraw || 99) - (b.orderOfDraw || 99));
    setActiveLabels(nextLabels);
    setSelectedIdx(nextLabels.findIndex((l) => l.id === newLabel.id));
    setShowAddTubeDropdown(false);
    showSuccess(`Added ${tube.shortName} (${tube.capColor} cap) to specimen print queue.`);
  };

  const handleRemoveTube = (indexToRemove: number) => {
    if (activeLabels.length <= 1) {
      showError("At least one specimen tube label must remain in the batch.");
      return;
    }
    const filtered = activeLabels.filter((_, idx) => idx !== indexToRemove);
    setActiveLabels(filtered);
    setSelectedIdx(Math.max(0, indexToRemove - 1));
  };

  return (
    <>
      {/* THERMAL PRINTER ULTRA-PRECISE CSS (50mm x 25mm Label Stock) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: 50mm 25mm;
            margin: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #barcode-printable-area, #barcode-printable-area * {
            visibility: visible !important;
          }
          #barcode-printable-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 50mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 9999999 !important;
          }
          .thermal-vial-sticker {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            width: 50mm !important;
            height: 25mm !important;
            padding: 1.5mm 2mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            background: white !important;
            color: black !important;
          }
        }
      `,
        }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-3 overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
                <Barcode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  Phlebotomy Specimen Tube Barcode Generator
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    CLSI H3-A6 Order of Draw
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Automated vacutainer accessioning & thermal sticker printing (50×25mm)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            
            {/* TUBE SELECTION & BATCH STRIP */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Select Specimen Tube ({activeLabels.length} In Queue):
                </label>

                {/* On-Demand Add Vacutainer Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAddTubeDropdown(!showAddTubeDropdown)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Vacutainer Tube</span>
                  </button>

                  {/* Tube Catalog Dropdown */}
                  {showAddTubeDropdown && (
                    <div className="absolute right-0 top-8 z-30 w-72 rounded-xl bg-white p-2 shadow-2xl border border-slate-200 divide-y divide-slate-100 animate-in fade-in zoom-in-95">
                      <div className="px-2 py-1.5 text-[10px] font-black uppercase text-slate-400">
                        CLSI Vacutainer Repertoire
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                        {CLSI_VACUTAINER_CATALOG.map((tube) => (
                          <button
                            key={tube.id}
                            type="button"
                            onClick={() => handleAddTube(tube)}
                            className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: tube.capColorHex }}
                              />
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">{tube.shortName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{tube.orderOfDrawLabel}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600">+ Add</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tube Tabs */}
              <div className="flex flex-wrap gap-2">
                {activeLabels.map((lbl, idx) => {
                  const isSelected = selectedIdx === idx;
                  return (
                    <div
                      key={idx}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedIdx(idx)}
                        className="flex items-center gap-2 text-left"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/25 shrink-0 shadow-xs"
                          style={{ backgroundColor: lbl.tubeColorHex }}
                        />
                        <span className="truncate max-w-[120px]">{lbl.tubeColor || lbl.testName}</span>
                        {lbl.orderOfDraw && lbl.orderOfDraw < 90 && (
                          <span className="text-[9px] px-1 rounded bg-slate-200 text-slate-700">
                            #{lbl.orderOfDraw}
                          </span>
                        )}
                      </button>

                      {activeLabels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTube(idx)}
                          className="text-slate-400 hover:text-rose-600 ml-1 p-0.5 rounded opacity-60 hover:opacity-100"
                          title="Remove tube from print queue"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PRE-ANALYTICAL TRAINING & VACUTAINER CARD */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full border border-black/30 shadow-xs shrink-0"
                    style={{ backgroundColor: current.tubeColorHex }}
                  />
                  <div>
                    <span className="font-extrabold text-slate-900">{current.tubeType || tubeInfo.tubeType}</span>
                    <span className="text-slate-500 ml-2">| {current.specimenType || tubeInfo.specimen}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white border border-slate-300 text-slate-800">
                  {current.orderOfDrawLabel || tubeInfo.orderOfDrawLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/80 text-[11px]">
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[9px]">Mixing Inversions:</span>
                  <span className="font-bold text-indigo-700 flex items-center gap-1">
                    <RotateCw className="w-3 h-3 text-indigo-500" />
                    {current.inversions || tubeInfo.inversions}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[9px]">Sample Volume:</span>
                  <span className="font-bold text-slate-800">
                    {current.minVolume || tubeInfo.minVolume}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[9px]">Centrifuge Protocol:</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {current.centrifugeGuide || tubeInfo.centrifugeGuide}
                  </span>
                </div>
              </div>

              {(current.clinicalWarning || tubeInfo.clinicalWarning) && (
                <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-medium leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <span>{current.clinicalWarning || tubeInfo.clinicalWarning}</span>
                </div>
              )}
            </div>

            {/* LIVE BARCODE STICKER PREVIEW (50mm x 25mm Ratio) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Thermal Sticker Label Preview (50×25 mm)
                </span>

                <div className="flex items-center gap-3">
                  {/* Barcode / QR toggle */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setBarcodeType("code128")}
                      className={`px-2 py-0.5 rounded ${barcodeType === "code128" ? "bg-white shadow-xs text-indigo-700" : "text-slate-600"}`}
                    >
                      Code 128
                    </button>
                    <button
                      type="button"
                      onClick={() => setBarcodeType("qr")}
                      className={`px-2 py-0.5 rounded ${barcodeType === "qr" ? "bg-white shadow-xs text-indigo-700" : "text-slate-600"}`}
                    >
                      2D QR
                    </button>
                  </div>

                  {/* Copies selector */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500 font-semibold">Copies:</span>
                    <select
                      value={copies}
                      onChange={(e) => setCopies(Number(e.target.value))}
                      className="text-xs font-bold bg-slate-100 border border-slate-300 rounded px-2 py-0.5"
                    >
                      <option value={1}>1 Label</option>
                      <option value={2}>2 Labels (Tube + Slip)</option>
                      <option value={3}>3 Labels (Tube + Slip + Archive)</option>
                      <option value={4}>4 Labels</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* REALISTIC PHLEBOTOMY THERMAL LABEL CONTAINER */}
              <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 flex justify-center items-center">
                <div
                  className="bg-white border-2 border-slate-400 rounded-md shadow-md p-3 relative flex flex-col justify-between overflow-hidden"
                  style={{
                    width: "380px",
                    minHeight: "190px",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  {/* Left Cap Color Strip */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-3.5"
                    style={{ backgroundColor: current.tubeColorHex || tubeInfo.tubeColorHex }}
                    title={`Tube Cap Color: ${current.tubeColor || tubeInfo.tubeColor}`}
                  />

                  {/* Label Inner Padding */}
                  <div className="pl-3.5 flex flex-col justify-between h-full space-y-2">
                    
                    {/* Top Row: Lab Header & Patient Details */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-1">
                      <div>
                        <span className="text-[10px] font-black text-slate-800 tracking-tight block">
                          LABCORE ENTERPRISE LIS • ISO 15189
                        </span>
                        <span className="text-[13px] font-black text-slate-950 block leading-tight truncate max-w-[210px]">
                          {current.patientName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-mono font-black text-indigo-700 px-1.5 py-0.5 bg-indigo-50 rounded border border-indigo-200 inline-block">
                          {current.uhid}
                        </span>
                        <span className="text-[10px] text-slate-600 block mt-0.5 font-bold">
                          {current.age !== undefined && current.age !== null ? (current.age === 0 ? "Newborn" : `${current.age}Y`) : ""} / {current.gender || "O"}
                        </span>
                      </div>
                    </div>

                    {/* Middle: SVG Barcode or QR Code */}
                    <div className="flex flex-col items-center justify-center py-1">
                      {barcodeType === "code128" ? (
                        <>
                          <div className="w-full px-2">
                            {renderBarcodeSvg(current.barcode)}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[12px] font-black tracking-widest text-slate-900">
                              *{current.barcode}*
                            </span>
                            {current.priority && current.priority !== "ROUTINE" && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 bg-red-600 text-white rounded uppercase tracking-wider">
                                {current.priority}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          {qrCodeDataUrl && (
                            <img src={qrCodeDataUrl} alt="QR Code" className="w-16 h-16 border rounded" />
                          )}
                          <div className="text-left text-[10px] font-mono">
                            <span className="font-bold text-slate-900 block">{current.barcode}</span>
                            <span className="text-slate-500 block">{current.specimenType}</span>
                            <span className="text-indigo-600 font-bold block">{current.uhid}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Test Name, Specimen & Timestamp */}
                    <div className="border-t border-slate-200 pt-1 flex justify-between items-end text-[10px]">
                      <div className="truncate max-w-[220px]">
                        <span className="font-bold text-slate-900 block truncate">
                          {current.testName}
                        </span>
                        <span className="text-slate-600 font-medium block truncate">
                          {current.specimenType || tubeInfo.specimen} ({current.tubeColor || tubeInfo.tubeColor})
                        </span>
                      </div>
                      <div className="text-right text-slate-500 font-mono text-[9px] shrink-0">
                        <span>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                        <span className="ml-1">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Quick Accession String Copy Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-500">Accession Barcode:</span>
                <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  {current.barcode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyBarcode}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Barcode"}</span>
              </button>
            </div>

          </div>

          {/* Modal Footer Controls */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {orderId && (
                <button
                  type="button"
                  onClick={() => window.open(`/orders/${orderId}/barcode`, "_blank")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Full Order Barcode Sheet
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-xs"
              >
                Close
              </button>

              {/* Print Selected Label */}
              <button
                type="button"
                onClick={() => handlePrint("selected")}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print This Tube ({copies}x)
              </button>

              {/* Print All Labels in Batch */}
              <button
                type="button"
                onClick={() => handlePrint("all")}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-md active:scale-98"
              >
                <Printer className="w-4 h-4" />
                Print ALL {activeLabels.length} Tube Labels ({activeLabels.length * copies} total)
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* HIDDEN PRINTABLE CONTAINER FOR THERMAL PRINTER (50mm x 25mm) */}
      <div id="barcode-printable-area" className="hidden">
        {(printMode === "all" ? activeLabels : [current]).map((labelItem, itemIdx) => (
          <React.Fragment key={itemIdx}>
            {Array.from({ length: copies }).map((_, copyIdx) => (
              <div key={`${itemIdx}-${copyIdx}`} className="thermal-vial-sticker">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "7px", borderBottom: "0.5px solid #000", paddingBottom: "1px" }}>
                  <span style={{ fontWeight: 900, maxWidth: "32mm", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {labelItem.patientName}
                  </span>
                  <span style={{ fontFamily: "monospace", fontWeight: 900 }}>
                    {labelItem.uhid}
                  </span>
                </div>

                <div style={{ padding: "1px 0", textAlign: "center" }}>
                  {renderBarcodeSvg(labelItem.barcode)}
                  <div style={{ fontSize: "6.5px", fontFamily: "monospace", fontWeight: 900, lineHeight: 1 }}>
                    *{labelItem.barcode}*
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "6px", borderTop: "0.5px solid #000", paddingTop: "1px" }}>
                  <span style={{ maxWidth: "30mm", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700 }}>
                    {labelItem.testName}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: "6px" }}>
                    {labelItem.tubeColor || "VAC"} {labelItem.age !== undefined && labelItem.age !== null ? `| ${labelItem.age}Y` : ""}{labelItem.gender ? `/${labelItem.gender.charAt(0)}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
