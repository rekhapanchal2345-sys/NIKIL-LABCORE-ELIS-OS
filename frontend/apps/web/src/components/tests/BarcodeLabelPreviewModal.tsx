"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Barcode,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FlaskConical,
  User,
  Building2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

interface BarcodeLabelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: any;
  patientInfo?: {
    uhid?: string;
    name?: string;
    age?: number;
    gender?: string;
    ward?: string;
    bed?: string;
  };
}

export default function BarcodeLabelPreviewModal({
  isOpen,
  onClose,
  test,
  patientInfo = {
    uhid: "UHID-2026-89412",
    name: "Rajesh Kumar Verma",
    age: 48,
    gender: "M",
    ward: "ICU-Bed 04",
    bed: "B-04",
  },
}: BarcodeLabelPreviewModalProps) {
  const [copies, setCopies] = useState<number>(2);
  const [includeSecondaryAliquot, setIncludeSecondaryAliquot] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isOpen || !test) return null;

  const testName = test.testName || test.name || "Investigation";
  const testCode = test.testCode || test.code || "TEST-01";
  const loinc = test.loincCode || "LOINC-PENDING";
  const container = test.sampleContainer || "EDTA Purple Tube (K2)";
  const sampleType = test.sampleType || "WHOLE_BLOOD";
  const isStat = (test.tatHours && Number(test.tatHours) <= 4) || (test.tatDisplay && test.tatDisplay.toLowerCase().includes("stat"));

  // Generate a realistic clinical accession number
  const accessionNumber = `ACC-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(100000 + Math.random() * 900000)}`;
  const collectionTime = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) + " " + new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getCapColorHex = (tubeStr: string) => {
    const s = tubeStr.toLowerCase();
    if (s.includes("purple") || s.includes("edta")) return "#9333EA";
    if (s.includes("gold") || s.includes("sst") || s.includes("yellow")) return "#D97706";
    if (s.includes("red") || s.includes("plain")) return "#DC2626";
    if (s.includes("blue") || s.includes("citrate")) return "#0284C7";
    if (s.includes("grey") || s.includes("gray") || s.includes("fluoride")) return "#64748B";
    if (s.includes("green") || s.includes("heparin")) return "#16A34A";
    return "#475569";
  };

  const capColor = getCapColorHex(container);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAccession = () => {
    navigator.clipboard.writeText(accessionNumber);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 border border-sky-200">
              <Barcode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Specimen Thermal Barcode Label Preview
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Standard 50mm × 25mm Direct Thermal Phlebotomy Accession Tag
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Thermal Label Display Box */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-100/80 rounded-2xl border border-dashed border-slate-300">
            {/* The 50mm x 25mm Aspect Ratio Simulated Clinical Thermal Label */}
            <div className="relative w-full max-w-[340px] bg-white rounded-lg border-2 border-slate-800 shadow-md p-3 font-mono text-slate-900 select-none">
              {/* Color coded tube identifier strip on top edge */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[5px]"
                style={{ backgroundColor: capColor }}
              />

              {/* Label Header */}
              <div className="flex items-start justify-between gap-1 pt-1 pb-1 border-b border-slate-300 text-[9px] leading-tight font-sans">
                <div>
                  <span className="font-extrabold text-slate-950 uppercase tracking-tight">
                    LABCORE CENTRAL HOSPITAL
                  </span>
                  <span className="block text-[8px] text-slate-500">ISO 15189 · NABL #MC-2849</span>
                </div>
                <div className="text-right">
                  {isStat ? (
                    <span className="inline-block px-1 py-0.2 rounded bg-rose-600 text-white font-black text-[8px] uppercase tracking-wider animate-pulse">
                      STAT EMERGENCY
                    </span>
                  ) : (
                    <span className="inline-block px-1 py-0.2 rounded bg-slate-200 text-slate-800 font-bold text-[8px]">
                      ROUTINE
                    </span>
                  )}
                </div>
              </div>

              {/* Patient Details Row */}
              <div className="pt-1.5 pb-1 text-[10px] font-sans">
                <div className="flex justify-between items-baseline">
                  <span className="font-black text-slate-950 truncate max-w-[200px]">
                    {patientInfo.name}
                  </span>
                  <span className="text-[9px] font-bold text-slate-600">
                    {patientInfo.age}Y/{patientInfo.gender}
                  </span>
                </div>
                <div className="flex justify-between text-[8.5px] text-slate-600 mt-0.5">
                  <span>UHID: <strong>{patientInfo.uhid}</strong></span>
                  <span>{patientInfo.ward}</span>
                </div>
              </div>

              {/* Barcode Vector Graphic Simulation */}
              <div className="my-1.5 flex flex-col items-center justify-center bg-white p-1">
                {/* SVG Barcode bars */}
                <svg
                  className="w-full h-9"
                  viewBox="0 0 240 38"
                  preserveAspectRatio="none"
                >
                  {/* Outer guard bars */}
                  <rect x="0" y="0" width="3" height="38" fill="#000" />
                  <rect x="6" y="0" width="2" height="38" fill="#000" />
                  {/* Alternating data bars representing accession */}
                  <rect x="12" y="0" width="4" height="38" fill="#000" />
                  <rect x="20" y="0" width="2" height="38" fill="#000" />
                  <rect x="25" y="0" width="5" height="38" fill="#000" />
                  <rect x="33" y="0" width="1" height="38" fill="#000" />
                  <rect x="38" y="0" width="3" height="38" fill="#000" />
                  <rect x="44" y="0" width="6" height="38" fill="#000" />
                  <rect x="54" y="0" width="2" height="38" fill="#000" />
                  <rect x="60" y="0" width="4" height="38" fill="#000" />
                  <rect x="68" y="0" width="2" height="38" fill="#000" />
                  <rect x="74" y="0" width="5" height="38" fill="#000" />
                  <rect x="83" y="0" width="3" height="38" fill="#000" />
                  <rect x="90" y="0" width="1" height="38" fill="#000" />
                  <rect x="95" y="0" width="4" height="38" fill="#000" />
                  <rect x="103" y="0" width="2" height="38" fill="#000" />
                  <rect x="109" y="0" width="6" height="38" fill="#000" />
                  <rect x="119" y="0" width="3" height="38" fill="#000" />
                  <rect x="126" y="0" width="2" height="38" fill="#000" />
                  <rect x="132" y="0" width="5" height="38" fill="#000" />
                  <rect x="141" y="0" width="1" height="38" fill="#000" />
                  <rect x="146" y="0" width="4" height="38" fill="#000" />
                  <rect x="154" y="0" width="2" height="38" fill="#000" />
                  <rect x="160" y="0" width="5" height="38" fill="#000" />
                  <rect x="169" y="0" width="3" height="38" fill="#000" />
                  <rect x="176" y="0" width="2" height="38" fill="#000" />
                  <rect x="182" y="0" width="4" height="38" fill="#000" />
                  <rect x="190" y="0" width="1" height="38" fill="#000" />
                  <rect x="195" y="0" width="5" height="38" fill="#000" />
                  <rect x="204" y="0" width="2" height="38" fill="#000" />
                  <rect x="210" y="0" width="4" height="38" fill="#000" />
                  <rect x="218" y="0" width="2" height="38" fill="#000" />
                  <rect x="224" y="0" width="3" height="38" fill="#000" />
                  <rect x="231" y="0" width="2" height="38" fill="#000" />
                  <rect x="237" y="0" width="3" height="38" fill="#000" />
                </svg>
                <span className="text-[10px] font-black tracking-widest text-slate-900 mt-0.5">
                  *{accessionNumber}*
                </span>
              </div>

              {/* Investigation Code & Tube Meta */}
              <div className="pt-1 border-t border-slate-300 font-sans text-[8.5px] leading-tight">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-950 truncate max-w-[170px]">
                    {testCode}: {testName}
                  </span>
                  <span className="text-slate-600 font-mono text-[7.5px]">
                    LOINC: {loinc}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 mt-0.5">
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ backgroundColor: capColor }} />
                    <span>{container}</span>
                  </span>
                  <span className="font-mono text-[7.5px]">{collectionTime}</span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 font-mono">
              Thermal dimensions: 50.8mm × 25.4mm (2&quot; × 1&quot;) · 203 DPI Barcode
            </p>
          </div>

          {/* Print Configuration Controls */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Print Copies (Tubes)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCopies(num)}
                    className={`h-8 w-9 rounded-lg font-bold text-xs transition ${
                      copies === num
                        ? "bg-sky-700 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {num}×
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Secondary Aliquot Label
              </label>
              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSecondaryAliquot}
                  onChange={(e) => setIncludeSecondaryAliquot(e.target.checked)}
                  className="rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Generate Plasma/Serum Aliquot Tag
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={handleCopyAccession}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            {copiedSuccess ? (
              <span className="text-emerald-600">✓ Accession ID Copied</span>
            ) : (
              <span>Copy Accession ID ({accessionNumber})</span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-800 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print {copies} Thermal {copies === 1 ? "Label" : "Labels"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
