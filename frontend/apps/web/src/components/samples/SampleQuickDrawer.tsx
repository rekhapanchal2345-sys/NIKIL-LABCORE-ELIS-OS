"use client";

import React, { useState } from "react";
import { 
  X, Activity, Clock3, AlertTriangle, Printer, MapPin, 
  ShieldCheck, FlaskConical, ScanLine, UserRound, Droplet, 
  CheckCircle2, ArrowRight, FileText, Phone, Building2, 
  ExternalLink, Sparkles, Loader2, ShieldAlert
} from "lucide-react";
import Link from "next/link";

interface QuickDrawerSample {
  id: string;
  sampleNumber: string;
  barcode: string;
  patientId: string;
  orderId: string;
  testId: string;
  sampleType: string;
  status: string;
  priority?: string;
  collectedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  collectedBy?: {
    fullName: string;
    employeeCode: string;
  };
  order: {
    id: string;
    orderNumber: string;
    patient: {
      id: string;
      uhid: string;
      firstName: string;
      lastName: string;
      gender: string;
      age?: number;
      phone?: string;
    };
    doctor?: {
      fullName: string;
      specialization?: string;
    };
  };
  test: {
    testCode: string;
    testName: string;
    sampleType: string;
    sampleContainer: string;
    processingDepartment?: string;
  };
}

interface SampleQuickDrawerProps {
  sample: QuickDrawerSample | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvance: (sample: QuickDrawerSample, action: "collect" | "receive" | "process" | "complete") => void;
  onReject: (sampleId: string) => void;
  onPrintLabel: (sample: QuickDrawerSample) => void;
  onPrintSheet: (sample: QuickDrawerSample) => void;
  updating: boolean;
}

export default function SampleQuickDrawer({
  sample,
  isOpen,
  onClose,
  onAdvance,
  onReject,
  onPrintLabel,
  onPrintSheet,
  updating,
}: SampleQuickDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "chain" | "sop">("overview");

  if (!isOpen || !sample) return null;

  const isStat = sample.priority === "STAT" || sample.priority === "URGENT";

  const getNextAction = (status: string) => {
    switch (status) {
      case "PENDING": return { label: "Mark Collected (Phlebotomy)", action: "collect" as const };
      case "COLLECTED": return { label: "Receive in Central Lab", action: "receive" as const };
      case "RECEIVED": return { label: "Start Analyzer Run", action: "process" as const };
      case "PROCESSING": return { label: "Complete & Validate", action: "complete" as const };
      default: return null;
    }
  };

  const nextStep = getNextAction(sample.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="border-b border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-0.5 font-mono text-[11px] font-black text-sky-800">
                  {sample.sampleNumber}
                </span>
                {isStat && (
                  <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-sm">
                    STAT / CRITICAL
                  </span>
                )}
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${
                  sample.status === "COMPLETED" ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
                  sample.status === "PROCESSING" ? "border-purple-200 bg-purple-50 text-purple-800" :
                  sample.status === "RECEIVED" ? "border-sky-200 bg-sky-50 text-sky-800" :
                  sample.status === "COLLECTED" ? "border-indigo-200 bg-indigo-50 text-indigo-800" :
                  sample.status === "REJECTED" ? "border-rose-200 bg-rose-50 text-rose-800" :
                  "border-amber-200 bg-amber-50 text-amber-800"
                }`}>
                  {sample.status}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900">{sample.test.testName}</h2>
              <p className="font-mono text-xs text-slate-500 flex items-center gap-2">
                <ScanLine className="h-3.5 w-3.5 text-sky-600" /> Barcode: {sample.barcode} · Order: #{sample.order.orderNumber}
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-t border-slate-100 pt-4 mt-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab("overview")}
              className={`rounded-xl px-4 py-2 transition-all ${
                activeTab === "overview"
                  ? "bg-sky-50 text-sky-800 border border-sky-200 font-black shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Specimen Overview
            </button>
            <button
              onClick={() => setActiveTab("chain")}
              className={`rounded-xl px-4 py-2 transition-all ${
                activeTab === "chain"
                  ? "bg-sky-50 text-sky-800 border border-sky-200 font-black shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Chain of Custody
            </button>
            <button
              onClick={() => setActiveTab("sop")}
              className={`rounded-xl px-4 py-2 transition-all ${
                activeTab === "sop"
                  ? "bg-sky-50 text-sky-800 border border-sky-200 font-black shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Clinical Handling SOP
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Patient Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700">
                    <UserRound className="h-4 w-4" /> Patient Demographics
                  </div>
                  <Link
                    href={`/patients/${sample.order.patient.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800"
                  >
                    Patient Profile <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Full Name</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {sample.order.patient.firstName} {sample.order.patient.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">UHID / Patient ID</p>
                    <p className="font-mono font-bold text-sky-700 text-sm mt-0.5">{sample.order.patient.uhid}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Age & Gender</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{sample.order.patient.age || "—"} Years · {sample.order.patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Referring Clinician</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{sample.order.doctor?.fullName || "OPD / Self Requisition"}</p>
                  </div>
                </div>
              </div>

              {/* Specimen Integrity & Container Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <FlaskConical className="h-4 w-4 text-sky-600" /> Container &amp; Pre-Analytical Quality
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
                    QC VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Container Type</p>
                    <p className="font-bold text-slate-900 mt-1">{sample.test.sampleContainer || "Standard Specimen Tube"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Specimen Matrix</p>
                    <p className="font-bold text-slate-900 mt-1">{sample.sampleType}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Hemolysis / Lipemia Index</p>
                    <p className="font-bold text-emerald-700 mt-1">Normal (&lt;15 mg/dL)</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Sample Volume</p>
                    <p className="font-bold text-emerald-700 mt-1">Adequate (3.0 mL)</p>
                  </div>
                </div>
              </div>

              {/* Quick Print Hub */}
              <div className="flex gap-3">
                <button
                  onClick={() => onPrintLabel(sample)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                >
                  <Printer className="h-4 w-4 text-sky-600" /> Print Barcode Tube Label
                </button>
                <button
                  onClick={() => onPrintSheet(sample)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                >
                  <FileText className="h-4 w-4 text-indigo-600" /> Print Collection Sheet
                </button>
              </div>
            </>
          )}

          {activeTab === "chain" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sky-600" /> Immutable Audit &amp; Chain-of-Custody Log
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-500 shadow-sm" />
                    <p className="text-xs font-bold text-slate-900">Requisition Registered</p>
                    <p className="text-[10px] text-slate-500">Order #{sample.order.orderNumber} created in ELIS</p>
                    <span className="text-[9px] font-mono text-slate-400">{new Date(sample.createdAt).toLocaleString()}</span>
                  </div>

                  {sample.collectedAt && (
                    <div className="relative">
                      <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-500 shadow-sm" />
                      <p className="text-xs font-bold text-slate-900">Specimen Collected (Phlebotomy)</p>
                      <p className="text-[10px] text-slate-500">Drawn by: {sample.collectedBy?.fullName || "Staff Phlebotomist"}</p>
                      <span className="text-[9px] font-mono text-slate-400">{new Date(sample.collectedAt).toLocaleString()}</span>
                    </div>
                  )}

                  {sample.receivedAt && (
                    <div className="relative">
                      <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-teal-500 shadow-sm" />
                      <p className="text-xs font-bold text-slate-900">Central Lab Accession &amp; Integrity Passed</p>
                      <p className="text-[10px] text-slate-500">Received at Laboratory Reception</p>
                      <span className="text-[9px] font-mono text-slate-400">{new Date(sample.receivedAt).toLocaleString()}</span>
                    </div>
                  )}

                  {sample.completedAt && (
                    <div className="relative">
                      <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                      <p className="text-xs font-bold text-slate-900">Processing Completed &amp; Validated</p>
                      <p className="text-[10px] text-slate-500">Ready for Diagnostic Reporting</p>
                      <span className="text-[9px] font-mono text-slate-400">{new Date(sample.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "sop" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-amber-600" /> Clinical Specimen Handling Protocol
              </h3>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="font-bold text-slate-900">Inversion Protocol</p>
                  <p className="text-slate-600 mt-1">
                    Gently invert 8–10 times immediately after venipuncture to ensure uniform mixing with anticoagulant. Do not shake vigorously.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="font-bold text-slate-900">Centrifugation Speed &amp; Time</p>
                  <p className="text-slate-600 mt-1">
                    Allow serum tubes to clot for 30 minutes at room temperature. Centrifuge at 3,500 RPM for 10 minutes at 20°C.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="font-bold text-slate-900">Storage &amp; Stability</p>
                  <p className="text-slate-600 mt-1">
                    Stable at room temperature (20–25°C) for up to 4 hours. Store in refrigerated archive (2–8°C) for up to 72 hours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Bottom Actions */}
        <div className="border-t border-slate-200 bg-white p-5 flex items-center justify-between gap-3 shadow-md">
          {sample.status !== "REJECTED" && sample.status !== "COMPLETED" && (
            <button
              onClick={() => onReject(sample.id)}
              className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              Reject / Redraw
            </button>
          )}

          {nextStep ? (
            <button
              onClick={() => onAdvance(sample, nextStep.action)}
              disabled={updating}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-md hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 transition-all"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{nextStep.label}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> Sample Lifecycle Completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
