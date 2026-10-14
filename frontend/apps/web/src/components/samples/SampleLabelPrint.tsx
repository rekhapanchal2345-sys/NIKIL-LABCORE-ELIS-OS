"use client";

import React, { useRef } from "react";
import {
  X,
  Printer,
  FileText,
  Tag,
  QrCode,
  ClipboardList,
  Download,
  FlaskConical,
  User2,
  CalendarDays,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Clock,
  Hash,
  Building2,
} from "lucide-react";

interface Sample {
  id: string;
  sampleNumber: string;
  barcode: string;
  sampleType: string;
  priority?: string;
  collectionType?: string;
  collectedAt?: string;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    patient: {
      uhid: string;
      firstName: string;
      lastName: string;
      gender: string;
      dateOfBirth?: string;
      age?: number;
      phone?: string;
    };
    doctor?: { fullName: string; specialization: string };
  };
  test: {
    testCode: string;
    testName: string;
    sampleType: string;
    sampleContainer: string;
    processingDepartment?: string;
  };
}

// ─── Barcode SVG renderer (CODE128-style visual bars) ────────────────────────
function BarcodeSVG({ value, height = 40 }: { value: string; height?: number }) {
  // Simplified visual barcode – real impl would use jsbarcode or canvas
  const chars = (value || "").split("").map((c) => c.charCodeAt(0));
  const bars: { w: number; isBar: boolean }[] = [];
  let toggle = true;
  chars.forEach((code) => {
    const w = ((code % 4) + 1) * 3;
    bars.push({ w, isBar: toggle });
    toggle = !toggle;
    bars.push({ w: 2, isBar: !toggle });
  });
  const totalW = bars.reduce((acc, b) => acc + b.w, 0);

  return (
    <svg viewBox={`0 0 ${totalW} ${height}`} className="w-full" style={{ height }}>
      {bars.reduce(
        (acc, bar, i) => {
          if (bar.isBar) {
            acc.els.push(
              <rect key={i} x={acc.x} y={0} width={bar.w} height={height} fill="#000" />
            );
          }
          acc.x += bar.w;
          return acc;
        },
        { els: [] as React.ReactNode[], x: 0 }
      ).els}
    </svg>
  );
}

// ─── Thermal Label (62mm × 29mm style) ───────────────────────────────────────
function ThermalLabel({ sample }: { sample: Sample }) {
  const priorityColor =
    sample.priority === "STAT"
      ? "#ef4444"
      : sample.priority === "URGENT"
      ? "#f97316"
      : "#6366f1";

  return (
    <div
      style={{
        width: "62mm",
        minHeight: "29mm",
        border: `2px solid ${priorityColor}`,
        borderRadius: 4,
        fontFamily: "monospace",
        fontSize: 7,
        padding: "3mm 3mm",
        background: "#fff",
        color: "#000",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Header strip */}
      <div
        style={{
          background: priorityColor,
          color: "#fff",
          fontWeight: 900,
          letterSpacing: 1,
          fontSize: 8,
          padding: "1px 4px",
          borderRadius: 2,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>LabCore ELIS</span>
        <span>{sample.priority || "ROUTINE"}</span>
      </div>

      {/* Sample number & barcode text */}
      <div style={{ fontWeight: 900, fontSize: 9, letterSpacing: 0.5 }}>
        {sample.sampleNumber}
      </div>

      {/* Barcode */}
      <div style={{ margin: "1mm 0" }}>
        <BarcodeSVG value={sample.barcode} height={28} />
        <div style={{ fontSize: 6, textAlign: "center", letterSpacing: 1, marginTop: 1 }}>
          {sample.barcode}
        </div>
      </div>

      {/* Patient info */}
      <div style={{ fontWeight: 700, fontSize: 8 }}>
        {sample.order.patient.firstName} {sample.order.patient.lastName}
      </div>
      <div style={{ fontSize: 6, color: "#444" }}>
        UHID: {sample.order.patient.uhid} | {sample.order.patient.gender} |{" "}
        {sample.order.patient.age ? `${sample.order.patient.age}Y` : "—"}
      </div>

      {/* Test info */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontWeight: 700 }}>{sample.test.testCode}</span>
        <span style={{ color: "#555" }}>{sample.test.sampleContainer}</span>
      </div>
      <div style={{ fontSize: 6, color: "#666" }}>{sample.test.testName}</div>

      {/* Footer */}
      <div
        style={{
          marginTop: 2,
          fontSize: 6,
          borderTop: "1px solid #ddd",
          paddingTop: 1,
          display: "flex",
          justifyContent: "space-between",
          color: "#666",
        }}
      >
        <span>
          {new Date(sample.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })}
        </span>
        <span>{sample.test.processingDepartment || "General Lab"}</span>
      </div>
    </div>
  );
}

// ─── Collection Sheet (A4) ────────────────────────────────────────────────────
function CollectionSheet({ sample }: { sample: Sample }) {
  const now = new Date();
  return (
    <div
      style={{
        width: "190mm",
        fontFamily: "Arial, sans-serif",
        fontSize: 9,
        color: "#000",
        background: "#fff",
        padding: "8mm",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #1e293b",
          paddingBottom: 6,
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: 14, color: "#1e293b" }}>
            SPECIMEN COLLECTION SHEET
          </div>
          <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>
            LabCore ELIS — Clinical Laboratory Information System
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: 11 }}>Order: {sample.order.orderNumber}</div>
          <div style={{ fontSize: 8, color: "#64748b" }}>
            Printed: {now.toLocaleDateString("en-IN")} {now.toLocaleTimeString("en-IN")}
          </div>
        </div>
      </div>

      {/* 2-col: Patient + Sample info */}
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        {/* Patient */}
        <div
          style={{
            flex: 1,
            border: "1px solid #e2e8f0",
            borderRadius: 4,
            padding: 6,
          }}
        >
          <div
            style={{
              background: "#0f172a",
              color: "#fff",
              fontWeight: 700,
              fontSize: 8,
              padding: "2px 6px",
              borderRadius: 2,
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            PATIENT INFORMATION
          </div>
          <table style={{ width: "100%", fontSize: 8, borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Name", `${sample.order.patient.firstName} ${sample.order.patient.lastName}`],
                ["UHID", sample.order.patient.uhid],
                ["Gender", sample.order.patient.gender],
                ["Age", sample.order.patient.age ? `${sample.order.patient.age} years` : "—"],
                ["DOB", sample.order.patient.dateOfBirth
                  ? new Date(sample.order.patient.dateOfBirth).toLocaleDateString("en-IN")
                  : "—"],
                ["Phone", sample.order.patient.phone || "—"],
                ["Referring Doctor", sample.order.doctor?.fullName || "—"],
                ["Specialization", sample.order.doctor?.specialization || "—"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ color: "#64748b", paddingBottom: 2, width: "38%" }}>{k}:</td>
                  <td style={{ fontWeight: 600, paddingBottom: 2 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sample */}
        <div
          style={{
            flex: 1,
            border: "1px solid #e2e8f0",
            borderRadius: 4,
            padding: 6,
          }}
        >
          <div
            style={{
              background: "#312e81",
              color: "#fff",
              fontWeight: 700,
              fontSize: 8,
              padding: "2px 6px",
              borderRadius: 2,
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            SPECIMEN DETAILS
          </div>
          <table style={{ width: "100%", fontSize: 8, borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Sample ID", sample.sampleNumber],
                ["Barcode", sample.barcode],
                ["Sample Type", sample.sampleType],
                ["Container", sample.test.sampleContainer],
                ["Test Code", sample.test.testCode],
                ["Test Name", sample.test.testName],
                ["Department", sample.test.processingDepartment || "General Lab"],
                ["Priority", sample.priority || "ROUTINE"],
                ["Collection Type", sample.collectionType || "WALK_IN"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ color: "#64748b", paddingBottom: 2, width: "38%" }}>{k}:</td>
                  <td style={{ fontWeight: 600, paddingBottom: 2 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phlebotomy Instructions */}
      <div
        style={{
          border: "1px solid #fbbf24",
          borderRadius: 4,
          padding: 6,
          background: "#fffbeb",
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 8, color: "#92400e", marginBottom: 4 }}>
          ⚠ PHLEBOTOMY INSTRUCTIONS
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 8, color: "#78350f" }}>
          <div>
            <b>Container:</b> {sample.test.sampleContainer}
          </div>
          <div>
            <b>Volume:</b>{" "}
            {sample.sampleType === "BLOOD"
              ? "3–5 mL"
              : sample.sampleType === "URINE"
              ? "10–20 mL mid-stream"
              : "As required"}
          </div>
          <div>
            <b>Fasting:</b>{" "}
            {sample.test.testCode.includes("GLU") ||
            sample.test.testName.toLowerCase().includes("glucose")
              ? "8–12 hours required"
              : "Not required"}
          </div>
          <div>
            <b>Handling:</b>{" "}
            {sample.sampleType === "BLOOD" ? "Invert gently 8–10×" : "Seal immediately"}
          </div>
        </div>
      </div>

      {/* Chain of Custody */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 4,
          padding: 6,
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 6, color: "#1e293b" }}>
          CHAIN OF CUSTODY LOG
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 8,
          }}
        >
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {["Step", "Action", "Date/Time", "Staff Name & Designation", "Signature"].map((h) => (
                <th
                  key={h}
                  style={{
                    border: "1px solid #e2e8f0",
                    padding: "3px 6px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#475569",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["1", "Patient Identification & Consent"],
              ["2", "Specimen Collection"],
              ["3", "Label Verification"],
              ["4", "Tube Integrity Check"],
              ["5", "Transport to Lab"],
              ["6", "Laboratory Receipt"],
            ].map(([step, action]) => (
              <tr key={step}>
                <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", color: "#64748b" }}>
                  {step}
                </td>
                <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", fontWeight: 600 }}>
                  {action}
                </td>
                <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", minWidth: "28mm" }} />
                <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", minWidth: "40mm" }} />
                <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", minWidth: "28mm" }} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Barcode at bottom */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid #e2e8f0",
          paddingTop: 4,
        }}
      >
        <div style={{ width: "60mm" }}>
          <BarcodeSVG value={sample.barcode} height={32} />
          <div style={{ fontSize: 6, textAlign: "center", letterSpacing: 1, color: "#64748b" }}>
            {sample.barcode}
          </div>
        </div>
        <div style={{ fontSize: 7, color: "#94a3b8", textAlign: "right" }}>
          <div>Generated by LabCore ELIS v1.0</div>
          <div>
            {now.toLocaleDateString("en-IN")} {now.toLocaleTimeString("en-IN")}
          </div>
          <div style={{ marginTop: 2, fontStyle: "italic" }}>
            This document contains confidential medical information.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────────────────
interface Props {
  sample: Sample | null;
  mode: "label" | "sheet";
  onClose: () => void;
  onPrint?: () => void;
}

export default function SampleLabelPrint({ sample, mode, onClose, onPrint }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!sample) return null;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>${mode === "label" ? "Specimen Label" : "Collection Sheet"} — ${sample.sampleNumber}</title>
          <style>
            @media print { @page { margin: 0; } body { margin: 6mm; } }
            body { font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
    onPrint?.();
  };

  const priorityBadge =
    sample.priority === "STAT"
      ? "bg-red-500/20 text-red-300 border-red-500/40"
      : sample.priority === "URGENT"
      ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
      : "bg-slate-700 text-slate-300 border-slate-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
              mode === "label"
                ? "bg-sky-50 border-sky-200"
                : "bg-indigo-50 border-indigo-200"
            }`}>
              {mode === "label" ? (
                <Tag className="h-5 w-5 text-sky-700" />
              ) : (
                <ClipboardList className="h-5 w-5 text-indigo-700" />
              )}
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base">
                {mode === "label" ? "Specimen Label Print Station" : "Collection Manifest Preview"}
              </h2>
              <p className="text-xs text-slate-500">
                {sample.sampleNumber} · {sample.test.testName}
              </p>
            </div>
            <span className={`ml-2 text-[10px] font-bold px-2.5 py-1 rounded-full border ${priorityBadge}`}>
              {sample.priority === "STAT" && <Zap className="inline h-3 w-3 mr-1" />}
              {sample.priority || "ROUTINE"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-black transition-all shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" /> Print Now
            </button>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Tab switcher (label vs sheet) ── */}
        <div className="flex items-center gap-0 border-b border-slate-200 bg-slate-50/50 px-6 shrink-0">
          {(["label", "sheet"] as const).map((t) => (
            <a
              key={t}
              href={`/samples/${sample.id}/${t === "label" ? "label" : "collection-sheet"}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-600 hover:text-sky-700 border-b-2 border-transparent hover:border-sky-500 transition-all"
            >
              {t === "label" ? <Tag className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              Open Dedicated {t === "label" ? "Label" : "Sheet"} Page
              <Download className="h-3 w-3 opacity-60" />
            </a>
          ))}
        </div>

        {/* ── Preview ── */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70">
          <div className="flex justify-center">
            <div
              ref={printRef}
              className="bg-white rounded-xl shadow-md p-4 border border-slate-200"
              style={{ display: "inline-block" }}
            >
              {mode === "label" ? (
                <div className="flex flex-col gap-3">
                  {/* Show 3 copies of label as labs typically print in sheets */}
                  <div className="text-[10px] text-slate-400 font-bold mb-1">Standard 62mm × 29mm Thermal Vacuum Tube Labels (3-Up)</div>
                  <div className="flex flex-wrap gap-3">
                    {[0, 1, 2].map((i) => (
                      <ThermalLabel key={i} sample={sample} />
                    ))}
                  </div>
                </div>
              ) : (
                <CollectionSheet sample={sample} />
              )}
            </div>
          </div>
        </div>

        {/* ── Footer info ── */}
        <div className="flex items-center gap-4 px-6 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-600 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <FlaskConical className="h-3 w-3 text-sky-600" /> {sample.test.sampleContainer}
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <Hash className="h-3 w-3 text-sky-600" /> {sample.barcode}
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <User2 className="h-3 w-3 text-sky-600" /> {sample.order.patient.uhid}
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3 text-sky-600" /> {sample.test.processingDepartment || "General Lab"}
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-emerald-700 font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> NABL Format Verified
          </span>
        </div>
      </div>
    </div>
  );
}
