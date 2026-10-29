"use client";
import React from "react";

export function DeltaCheckingPanel(props: any) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <h4 className="text-sm font-semibold text-slate-900">Delta Check Analysis</h4>
      <p className="text-xs text-slate-500 mt-1">Historical variance within physiological reference thresholds.</p>
    </div>
  );
}
export default DeltaCheckingPanel;
