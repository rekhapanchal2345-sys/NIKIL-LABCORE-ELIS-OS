"use client";
import React from "react";

export function BackupSettings({ initialValues = {}, onSave, saving }: any) {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Backup & Disaster Recovery</h3>
      <p className="text-sm text-slate-600">Automated encrypted snapshots and point-in-time recovery schedules.</p>
      {onSave && (
        <button
          type="button"
          onClick={() => onSave(initialValues)}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          {saving ? "Saving..." : "Save Backup Settings"}
        </button>
      )}
    </div>
  );
}
export default BackupSettings;
