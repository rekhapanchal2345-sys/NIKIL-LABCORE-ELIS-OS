"use client";
import React from "react";

export function SampleDetails({ sample, onClose }: any) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
      <h4 className="text-sm font-semibold text-slate-900">Sample Details</h4>
      <p className="text-xs text-slate-600">Barcode: {sample?.barcode || sample?.id || "N/A"}</p>
      {onClose && <button type="button" onClick={onClose} className="text-xs text-blue-600">Close</button>}
    </div>
  );
}
export default SampleDetails;
