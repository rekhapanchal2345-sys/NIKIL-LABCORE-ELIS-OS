"use client";
import React from "react";

export function SampleRejectModal({ isOpen, onClose, sample, onConfirm, onSuccess }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Reject Specimen</h3>
        <p className="text-xs text-slate-600">Record pre-analytical rejection reason (hemolysis, lipemia, insufficient volume).</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border rounded-lg">Cancel</button>
          <button
            type="button"
            onClick={() => {
              onConfirm?.("Hemolyzed specimen");
              onSuccess?.();
              onClose?.();
            }}
            className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg"
          >
            Reject Specimen
          </button>
        </div>
      </div>
    </div>
  );
}
export default SampleRejectModal;
