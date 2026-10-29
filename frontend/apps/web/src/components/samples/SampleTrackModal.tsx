"use client";
import React from "react";

export function SampleTrackModal({ isOpen, onClose, sample }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Sample Chain-of-Custody</h3>
        <p className="text-xs text-slate-600">Tracking specimen {sample?.barcode || sample?.id || ""}</p>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs bg-slate-900 text-white rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
}
export default SampleTrackModal;
