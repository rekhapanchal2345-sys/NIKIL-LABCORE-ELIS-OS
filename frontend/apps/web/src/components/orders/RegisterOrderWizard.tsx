"use client";

import React from "react";

export default function RegisterOrderWizard({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: (order?: any) => void;
  initialPatientId?: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs text-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-sm font-bold text-slate-900">Register Diagnostic Requisition</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="font-bold text-slate-600">
            Close
          </button>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onSuccess?.({ orderNumber: `ORD-2026-${Date.now().toString().slice(-4)}` })}
          className="rounded-xl bg-[#0f2d52] px-4 py-2 font-bold text-white"
        >
          Submit Requisition
        </button>
      </div>
    </div>
  );
}
