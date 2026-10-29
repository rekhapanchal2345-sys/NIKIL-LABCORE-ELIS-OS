"use client";
import React from "react";

export function DataRetentionSettings({ initialValues = {}, onSave, saving }: any) {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Data Retention & Archival</h3>
      <p className="text-sm text-slate-600">NABL 15189 compliant clinical record retention policies.</p>
      {onSave && (
        <button
          type="button"
          onClick={() => onSave(initialValues)}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          {saving ? "Saving..." : "Save Data Retention"}
        </button>
      )}
    </div>
  );
}
export default DataRetentionSettings;
