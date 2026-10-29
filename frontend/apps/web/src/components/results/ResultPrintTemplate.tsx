"use client";
import React from "react";

export function ResultPrintTemplate({ result }: any) {
  return (
    <div className="hidden print:block p-8 bg-white">
      <h2 className="text-xl font-bold">Sobhana Diagnostic Centre - Clinical Report</h2>
      <p className="text-sm mt-2">Patient: {result?.patientName || "N/A"}</p>
    </div>
  );
}
export default ResultPrintTemplate;
