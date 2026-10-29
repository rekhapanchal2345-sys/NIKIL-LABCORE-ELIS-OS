"use client";
import React from "react";

export function SampleQuickDrawer({ isOpen, onClose, sample }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-xl border-l border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Specimen Inspector</h3>
        <button type="button" onClick={onClose} className="text-xs text-slate-500">Close</button>
      </div>
      <p className="text-xs text-slate-600">Barcode: {sample?.barcode || sample?.id || "N/A"}</p>
    </div>
  );
}
export default SampleQuickDrawer;
