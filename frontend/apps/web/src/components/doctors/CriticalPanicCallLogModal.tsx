"use client";

import React, { useState } from "react";
import {
  X,
  PhoneCall,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Printer,
  User,
  Building,
  FileCheck,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/notifications";
import { VerificationReportItem } from "./PathologistReviewModal";

export interface CriticalCallLogEntry {
  id: string;
  reportId: string;
  accessionNumber: string;
  patientName: string;
  uhid: string;
  criticalParameters: string;
  recipientName: string;
  recipientDesignation: string;
  recipientPhone: string;
  wardOrClinic: string;
  callerName: string;
  callerRole: string;
  timestamp: string;
  callOutcome: "INFORMED_READ_BACK_CONFIRMED" | "TRANSFERRED_WARD_INCHARGE" | "LINE_BUSY_RETRYING";
  readBackConfirmed: boolean;
  clinicalInstructions: string;
}

interface CriticalPanicCallLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: VerificationReportItem | null;
  onSaveLog?: (entry: CriticalCallLogEntry) => void;
}

export default function CriticalPanicCallLogModal({
  isOpen,
  onClose,
  report,
  onSaveLog,
}: CriticalPanicCallLogModalProps) {
  const [recipientName, setRecipientName] = useState(
    report?.referredByDoctor || "Dr. Vikram Seth"
  );
  const [recipientDesignation, setRecipientDesignation] = useState("Consultant Intensivist / Attending Physician");
  const [recipientPhone, setRecipientPhone] = useState("+91 98201 44512");
  const [wardOrClinic, setWardOrClinic] = useState("ICU Bed 02 / Critical Care Tower");
  const [callerName, setCallerName] = useState("Dr. Rajiv Nair (Consultant Pathologist)");
  const [callerRole, setCallerRole] = useState("Pathologist On-Duty / Laboratory Director");
  const [timestamp, setTimestamp] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
      " (" +
      new Date().toLocaleDateString("en-GB") +
      ")"
  );
  const [callOutcome, setCallOutcome] = useState<
    "INFORMED_READ_BACK_CONFIRMED" | "TRANSFERRED_WARD_INCHARGE" | "LINE_BUSY_RETRYING"
  >("INFORMED_READ_BACK_CONFIRMED");
  const [readBackConfirmed, setReadBackConfirmed] = useState(true);
  const [clinicalInstructions, setClinicalInstructions] = useState(
    "Doctor acknowledged critical platelet count (<20,000/µL). Ordered immediate transfusion of 1 unit Single Donor Platelet (SDP) and repeat CBC after 4 hours."
  );

  if (!isOpen || !report) return null;

  const panicParams = report.parameters
    .filter((p) => p.flag.includes("PANIC"))
    .map((p) => `${p.name}: ${p.result} ${p.unit} (${p.flag})`)
    .join("; ");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      showError("Please specify the recipient doctor or nurse name.");
      return;
    }
    if (!readBackConfirmed && callOutcome === "INFORMED_READ_BACK_CONFIRMED") {
      showError("NABL ISO 15189 requires read-back verification confirmation before closing panic alert.");
      return;
    }

    const newLog: CriticalCallLogEntry = {
      id: `call-log-${Date.now()}`,
      reportId: report.reportId,
      accessionNumber: report.accessionNumber,
      patientName: report.patientName,
      uhid: report.uhid,
      criticalParameters: panicParams || "Critical biological outlier",
      recipientName,
      recipientDesignation,
      recipientPhone,
      wardOrClinic,
      callerName,
      callerRole,
      timestamp,
      callOutcome,
      readBackConfirmed,
      clinicalInstructions,
    };

    if (onSaveLog) {
      onSaveLog(newLog);
    }

    showSuccess(
      `Critical Panic Alert Call Log officially recorded for ${report.reportId} under NABL ISO 15189 compliance.`
    );
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* ── Header ── */}
        <div className="bg-rose-50/80 border-b border-rose-200 p-4 sm:p-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <PhoneCall className="w-5 h-5 text-rose-700 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-rose-950">
                  Critical Value Telephonic Call Alert Register
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-900">
                  NABL ISO 15189:2022
                </span>
              </div>
              <p className="text-xs text-rose-800 font-medium mt-0.5">
                Mandatory telephonic notification & read-back documentation for life-threatening laboratory values.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-rose-100 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Patient & Panic Values Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" />
                <span>{report.patientName}</span>
                <span className="text-slate-500 font-mono">({report.uhid})</span>
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                Report: <strong className="text-slate-900">{report.reportId}</strong> • Acc: {report.accessionNumber}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-100/70 border border-rose-200 text-xs">
              <div className="font-bold text-rose-950 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                Critical Panic Parameter(s) Detected:
              </div>
              <div className="font-mono text-xs font-black text-rose-900">
                {panicParams || "High Alert Outlier Detected"}
              </div>
            </div>
          </div>

          {/* Call Recipient Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-600" />
              1. Contacted Clinician / Ward Recipient
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Recipient Doctor / Nurse Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                  placeholder="e.g. Dr. Vikram Seth / Sister In-Charge"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={recipientDesignation}
                  onChange={(e) => setRecipientDesignation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                  placeholder="e.g. Attending Intensivist / Resident MO"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                  placeholder="e.g. +91 98201 44512"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Location / Ward / Chamber
                </label>
                <input
                  type="text"
                  value={wardOrClinic}
                  onChange={(e) => setWardOrClinic(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                  placeholder="e.g. ICU Bed 02 / OPD Chamber 102"
                />
              </div>
            </div>
          </div>

          {/* Caller Details & Timestamp */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              2. Lab Caller Identity & Call Timestamp
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Caller Name (Pathologist / Senior Tech)
                </label>
                <input
                  type="text"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Call Date & Exact Time
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Call Outcome & Read-Back Verification */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              3. Call Outcome & Read-Back Verification (Clause 7.4.1.7)
            </h4>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCallOutcome("INFORMED_READ_BACK_CONFIRMED")}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    callOutcome === "INFORMED_READ_BACK_CONFIRMED"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Informed & Verified</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Doctor repeated critical value and acknowledged.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCallOutcome("TRANSFERRED_WARD_INCHARGE")}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    callOutcome === "TRANSFERRED_WARD_INCHARGE"
                      ? "border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-amber-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>Ward Sister In-Charge</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Doctor busy/in OT; informed ICU/Ward Sister.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCallOutcome("LINE_BUSY_RETRYING")}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    callOutcome === "LINE_BUSY_RETRYING"
                      ? "border-rose-600 bg-rose-50 text-rose-950 font-bold shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-rose-700">
                    <Clock className="w-4 h-4" />
                    <span>Unanswered / Retry</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">
                    No answer; queued for re-dial in 5 minutes.
                  </span>
                </button>
              </div>

              {/* Mandatory Read-Back Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readBackConfirmed}
                  onChange={(e) => setReadBackConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    Read-Back Verification Completed (NABL Mandatory)
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    The recipient accurately read back the patient name, UHID, specific parameter name, numeric test value, and unit of measurement.
                  </span>
                </div>
              </label>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Doctor's Instructions & Clinical Notes Recorded
                </label>
                <textarea
                  rows={2}
                  value={clinicalInstructions}
                  onChange={(e) => setClinicalInstructions(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium focus:border-sky-600 focus:outline-none"
                  placeholder="Record immediate clinician instructions or treatment modifications..."
                />
              </div>
            </div>
          </div>

          {/* ── Modal Footer ── */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Audit Entry</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Save to NABL Call Register</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
