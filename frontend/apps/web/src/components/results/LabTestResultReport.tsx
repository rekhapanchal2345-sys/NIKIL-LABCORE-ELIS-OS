"use client";
import React from "react";

export function LabTestResultReport({ result }: any) {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-3">
      <h3 className="text-base font-semibold text-slate-900">Laboratory Test Result Report</h3>
      <p className="text-sm text-slate-600">Patient: {result?.patientName || "N/A"}</p>
    </div>
  );
}
export default LabTestResultReport;
