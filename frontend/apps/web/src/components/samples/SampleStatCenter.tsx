"use client";

import React from "react";
import { 
  Flame, Clock3, AlertTriangle, ArrowRight, ShieldAlert, 
  FlaskConical, UserRound, ScanLine, Printer, CheckCircle2, 
  Activity, Sparkles, Building2, BellRing
} from "lucide-react";

interface StatSample {
  id: string;
  sampleNumber: string;
  barcode: string;
  sampleType: string;
  status: string;
  priority?: string;
  createdAt: string;
  order: {
    orderNumber: string;
    patient: {
      firstName: string;
      lastName: string;
      uhid: string;
      gender: string;
      age?: number;
    };
    doctor?: {
      fullName: string;
    };
  };
  test: {
    testCode: string;
    testName: string;
    sampleContainer: string;
    processingDepartment?: string;
  };
}

interface SampleStatCenterProps {
  samples: StatSample[];
  onSelectSample: (sample: StatSample) => void;
  onAdvanceStatus: (sample: StatSample, nextStatus: string) => void;
  onPrintLabel: (sample: StatSample) => void;
  updatingSampleId: string | null;
}

function calculateTimeRemaining(createdAt: string, targetHours: number = 2) {
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const targetMs = targetHours * 60 * 60 * 1000;
  const remainingMs = targetMs - elapsedMs;

  const isBreached = remainingMs <= 0;
  const absDiff = Math.abs(remainingMs);
  const minutes = Math.floor((absDiff / (1000 * 60)) % 60);
  const hours = Math.floor(absDiff / (1000 * 60 * 60));

  return {
    isBreached,
    text: isBreached ? `${hours}h ${minutes}m OVERDUE` : `${hours}h ${minutes}m remaining`,
    percentElapsed: Math.min(100, Math.round((elapsedMs / targetMs) * 100)),
  };
}

export default function SampleStatCenter({
  samples,
  onSelectSample,
  onAdvanceStatus,
  onPrintLabel,
  updatingSampleId,
}: SampleStatCenterProps) {
  const statSamples = samples.filter(
    (s) => (s.priority === "STAT" || s.priority === "URGENT") && s.status !== "COMPLETED"
  );

  return (
    <div className="space-y-6">
      {/* Top STAT Command Banner */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-100 px-3 py-1 text-xs font-black text-rose-800">
                <Flame className="h-3.5 w-3.5 text-rose-600 fill-rose-600 animate-bounce" />
                ICU &amp; Emergency Escalation Bay
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                <Clock3 className="h-3.5 w-3.5 text-amber-700" /> Sub-60 / Sub-120 Min TAT Escalation
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl mt-1.5">
              STAT Critical &amp; Emergency Priority Center
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl mt-1">
              Automated laboratory triage for Intensive Care Units, Emergency Department, Cardiac Troponin runs, and critical surgical pre-ops.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-right shadow-sm">
              <span className="text-[10px] font-bold uppercase text-rose-600">Active STAT Load</span>
              <p className="text-2xl font-black text-rose-950 font-mono">{statSamples.length} Urgent</p>
            </div>
          </div>
        </div>
      </div>

      {/* STAT Cards List */}
      {statSamples.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm space-y-3">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="text-base font-black text-slate-900">No Critical STAT Backlog</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All STAT requisitions have been processed, analyzed, and signed off within laboratory SLA targets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {statSamples.map((sample) => {
            const { isBreached, text, percentElapsed } = calculateTimeRemaining(sample.createdAt);
            const isUpdating = updatingSampleId === sample.id;

            const nextActionMap: Record<string, { label: string; nextStatus: string }> = {
              PENDING: { label: "Fast-Track Collect", nextStatus: "COLLECTED" },
              COLLECTED: { label: "Receive in STAT Lab", nextStatus: "RECEIVED" },
              RECEIVED: { label: "Load onto STAT Analyzer", nextStatus: "PROCESSING" },
              PROCESSING: { label: "Validate Critical Result", nextStatus: "COMPLETED" },
            };

            const action = nextActionMap[sample.status];

            return (
              <div
                key={sample.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:shadow-md hover:border-rose-300 transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectSample(sample)}
                        className="font-mono text-sm font-black text-slate-900 hover:text-rose-600 transition-colors"
                      >
                        {sample.sampleNumber}
                      </button>
                      <span className="flex items-center gap-1 rounded bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-sm">
                        <Flame className="h-2.5 w-2.5 fill-white" /> STAT Priority
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-500 flex items-center gap-1">
                      <ScanLine className="h-3 w-3 text-sky-600" /> {sample.barcode}
                    </p>
                  </div>

                  <button
                    onClick={() => onPrintLabel(sample)}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    title="Print STAT Label"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>

                {/* Patient & Test Row */}
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Patient</span>
                    <p className="text-xs font-black text-slate-900 mt-0.5">
                      {sample.order.patient.firstName} {sample.order.patient.lastName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      UHID: {sample.order.patient.uhid} · {sample.order.patient.gender}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Test Profile</span>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{sample.test.testName}</p>
                    <span className="inline-block rounded bg-white px-1.5 py-0.2 font-mono text-[9px] font-bold text-slate-700 border border-slate-200 mt-0.5">
                      {sample.test.testCode}
                    </span>
                  </div>
                </div>

                {/* SLA Timer Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5 text-slate-400" /> SLA Countdown
                    </span>
                    <span className={`font-mono text-xs font-black ${isBreached ? "text-rose-600 font-bold" : "text-amber-700"}`}>
                      {text}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isBreached ? "bg-rose-600" : percentElapsed > 75 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, percentElapsed)}%` }}
                    />
                  </div>
                </div>

                {/* Status and Action */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-black text-slate-700">
                    Stage: {sample.status}
                  </span>

                  {action && (
                    <button
                      onClick={() => onAdvanceStatus(sample, action.nextStatus)}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:from-rose-500 hover:to-red-500 transition-all disabled:opacity-50"
                    >
                      <span>{isUpdating ? "Escalating..." : action.label}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
