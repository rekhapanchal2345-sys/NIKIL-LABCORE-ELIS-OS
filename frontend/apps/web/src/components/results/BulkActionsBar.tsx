"use client";
import React from "react";

export function BulkActionsBar({ selectedCount = 0, onClear, onBulkApprove }: any) {
  if (!selectedCount) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm">
      <span>{selectedCount} item(s) selected</span>
      <div className="flex items-center gap-2">
        {onBulkApprove && (
          <button type="button" onClick={onBulkApprove} className="px-3 py-1 bg-emerald-600 rounded-lg text-xs font-medium">
            Approve Selected
          </button>
        )}
        {onClear && (
          <button type="button" onClick={onClear} className="px-3 py-1 bg-slate-700 rounded-lg text-xs">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
export default BulkActionsBar;
