"use client";
import React from "react";

export function ParameterResultEntrySheet({ isOpen, onClose, result, onSave }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Parameter Result Entry</h3>
        <p className="text-sm text-slate-600">{result?.testName || "Clinical Parameter Entry"}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg">Close</button>
          <button type="button" onClick={() => { onSave?.(result); onClose?.(); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">Save Entry</button>
        </div>
      </div>
    </div>
  );
}
export default ParameterResultEntrySheet;
