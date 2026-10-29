"use client";
import React from "react";

export function ResultHistoryModal({ isOpen, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Result Audit History</h3>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
}
export default ResultHistoryModal;
