"use client";

import React, { useState } from "react";
import {
  X,
  Microscope,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  FileText,
  User,
  Activity,
  Printer,
  Sparkles,
} from "lucide-react";
import { showSuccess, showError, showInfo } from "@/lib/notifications";

export interface VerificationReportItem {
  id: string;
  reportId: string;
  accessionNumber: string;
  barcode: string;
  patientName: string;
  uhid: string;
  age: number;
  gender: string;
  referredByDoctor: string;
  testPanelName: string;
  department: string;
  specimenType: string;
  instrumentId: string;
  collectedAt: string;
  analyzedAt: string;
  isPanic: boolean;
  deltaFlag: boolean;
  status: "PENDING_PATHOLOGIST" | "APPROVED" | "RE_TEST_ORDERED";
  parameters: Array<{
    name: string;
    result: string;
    unit: string;
    referenceRange: string;
    flag: "NORMAL" | "HIGH" | "LOW" | "PANIC_HIGH" | "PANIC_LOW";
    deltaChange?: string;
  }>;
  doctorRemarks?: string;
}

interface PathologistReviewModalProps {
  report: VerificationReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSignOff: (reportId: string, remarks: string) => void;
  onOrderReRun: (reportId: string, reason: string) => void;
}

export default function PathologistReviewModal({
  report,
  isOpen,
  onClose,
  onSignOff,
  onOrderReRun,
}: PathologistReviewModalProps) {
  const [remarks, setRemarks] = useState(
    report?.isPanic
      ? "Critical panic values validated against calibration run. Critical telephonic alert communicated to attending physician."
      : "Observed parameters clinically correlated with patient diagnosis. Results validated and authorized for release."
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !report) return null;

  const handleSign = () => {
    setSubmitting(true);
    onSignOff(report.reportId, remarks);
    setSubmitting(false);
    onClose();
  };

  const handleReRun = () => {
    const reason = prompt(
      "Specify clinical reason for Test Re-Run / Sample Redraw:",
      "Discordance with prior baseline; secondary run requested for confirmation."
    );
    if (!reason) return;
    setSubmitting(true);
    onOrderReRun(report.reportId, reason);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header (Clean White Clinical UI) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-100 shadow-2xs">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-slate-900">
                  Pathologist Clinical Verification & Sign-Off
                </h3>
                {report.isPanic ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                    🚨 STAT Panic Report
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    Awaiting Sign-Off
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Report ID: <span className="font-mono font-bold text-slate-800">{report.reportId}</span> • Accession:{" "}
                <span className="font-mono text-slate-700">{report.accessionNumber}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Patient Details & Instrument Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block">Patient Name:</span>
              <strong className="text-slate-900 text-xs">
                {report.patientName} ({report.age}y / {report.gender})
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Patient UHID:</span>
              <strong className="font-mono text-sky-700 text-xs">{report.uhid}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Referring Clinician:</span>
              <strong className="text-slate-800 text-xs">{report.referredByDoctor}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Analyzer & Specimen:</span>
              <strong className="text-slate-800 text-xs font-mono">
                {report.instrumentId} ({report.specimenType})
              </strong>
            </div>
          </div>

          {/* Test Panel Name */}
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>{report.testPanelName}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {report.department}
              </span>
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              Analyzed: {report.analyzedAt}
            </span>
          </div>

          {/* Parameters Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Investigation Parameter</th>
                  <th className="py-2.5 px-3">Observed Result</th>
                  <th className="py-2.5 px-3">CLSI Reference Interval</th>
                  <th className="py-2.5 px-3">Delta vs Prior</th>
                  <th className="py-2.5 px-3">Clinical Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {report.parameters.map((param, idx) => {
                  const isPanicHigh = param.flag === "PANIC_HIGH";
                  const isPanicLow = param.flag === "PANIC_LOW";
                  const isHigh = param.flag === "HIGH";
                  const isLow = param.flag === "LOW";
                  const isAbnormal = isPanicHigh || isPanicLow || isHigh || isLow;

                  return (
                    <tr
                      key={idx}
                      className={
                        isPanicHigh || isPanicLow
                          ? "bg-rose-50/60 font-semibold"
                          : isAbnormal
                          ? "bg-amber-50/40"
                          : "hover:bg-slate-50"
                      }
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {param.name}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span
                          className={
                            isPanicHigh || isPanicLow
                              ? "text-rose-700 text-sm"
                              : isAbnormal
                              ? "text-amber-800"
                              : "text-slate-800"
                          }
                        >
                          {param.result} {param.unit}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {param.referenceRange} {param.unit}
                      </td>

                      <td className="py-2.5 px-3 font-mono">
                        {param.deltaChange ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              param.deltaChange.startsWith("+")
                                ? "bg-rose-100 text-rose-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            Δ {param.deltaChange}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {isPanicHigh ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 border border-rose-300">
                            🚨 CRITICAL HIGH (HH)
                          </span>
                        ) : isPanicLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 border border-rose-300">
                            🚨 CRITICAL LOW (LL)
                          </span>
                        ) : isHigh ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            HIGH (H)
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            LOW (L)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            NORMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pathologist Remarks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Pathologist Authorization & Clinical Interpretation Remarks:
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 focus:border-sky-600 focus:outline-none"
            />
          </div>

          {/* Legal NABL Authorization Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>NABL ISO 15189:2022 Compliant Digital Authorization</span>
            </div>
            <span className="font-bold text-slate-700 font-mono">
              HMAC-SHA256 Cryptographic Stamp
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <button
            type="button"
            onClick={handleReRun}
            className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>Order Re-Test / Dilution</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSign}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Sign-Off & Authorize (Release)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
