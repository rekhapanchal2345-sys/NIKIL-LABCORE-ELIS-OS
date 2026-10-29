"use client";

import React from "react";

export default function PatientPrintTemplate({ patient }: { patient: any }) {
  if (!patient) return null;
  return (
    <div className="hidden print:block p-6 text-slate-900 bg-white">
      <h1 className="text-lg font-bold">Patient Clinical Summary — {patient.firstName} {patient.lastName}</h1>
      <p className="text-xs font-mono mt-1">UHID: {patient.uhid || patient.id}</p>
    </div>
  );
}
