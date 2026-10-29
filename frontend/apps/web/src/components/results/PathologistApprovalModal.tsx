"use client";
import React from "react";

export function PathologistApprovalModal({ isOpen, onClose, result, onApprove }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Pathologist Digital Sign-Off</h3>
        <p className="text-sm text-slate-600">Authorize and release clinical report for {result?.patientName || "patient"}.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
          <button type="button" onClick={() => { onApprove?.(result); onClose?.(); }} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg">Approve & Sign</button>
        </div>
      </div>
    </div>
  );
}
export default PathologistApprovalModal;
