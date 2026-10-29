"use client";
import React from "react";

export function TestDrawer({ isOpen, onClose, test }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-xl border-l border-slate-200 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{test?.name || "Test Details"}</h3>
        <button type="button" onClick={onClose} className="text-xs text-slate-500">Close</button>
      </div>
    </div>
  );
}
export default TestDrawer;
