"use client";
import React from "react";

export function ClinicalVitalsTriageCenter({ patient, onVitalsUpdated }: any) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">Clinical Vitals & Triage Center</h4>
        <span className="text-xs text-emerald-600 font-medium">Stable</span>
      </div>
      <p className="text-xs text-slate-500">
        Patient: {patient?.firstName ? `${patient.firstName} ${patient.lastName || ""}` : "Selected Patient"}
      </p>
    </div>
  );
}
export default ClinicalVitalsTriageCenter;
