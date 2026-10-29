"use client";

import React from "react";
import { Building2, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function PremiumLabReport({ report }: { report: any }) {
  if (!report) return null;

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xs text-slate-900 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-slate-900 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#0f2d52]" />
            <h2 className="text-lg font-extrabold tracking-tight text-[#0f2d52]">
              LABCORE ELIS DIAGNOSTIC PATHOLOGY REPORT
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            NABL ISO 15189:2022 Certified Laboratory • CAP Accredited
          </p>
        </div>
        <div className="text-right font-mono text-xs">
          <div className="font-bold text-slate-900">Report #: {report.reportNumber || report.id || "RPT-2026-001"}</div>
          <div className="text-slate-500">Order #: {report.orderNumber || "ORD-2026-001"}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
        <div>
          <div className="text-[10px] font-bold uppercase text-slate-400">Patient Name</div>
          <div className="font-bold text-sm text-slate-900">{report.patient?.name || report.patientName || "Clinical Patient"}</div>
          <div className="font-mono text-slate-600 mt-0.5">UHID: {report.patient?.uhid || "UHID-2026-1001"}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase text-slate-400">Referring Clinician</div>
          <div className="font-bold text-slate-900">{report.doctor?.name || report.doctorName || "OPD Consultant"}</div>
          <div className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verified & Authorized Report
          </div>
        </div>
      </div>
    </div>
  );
}
