"use client";
import React from "react";

export function PasswordProtectModal({ isOpen, onClose, onConfirm }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Password Protect Report</h3>
        <p className="text-sm text-slate-600">Encrypt PDF with patient DOB or custom password.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border">Cancel</button>
          <button type="button" onClick={() => { onConfirm?.(); onClose?.(); }} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white">Apply</button>
        </div>
      </div>
    </div>
  );
}
export default PasswordProtectModal;
