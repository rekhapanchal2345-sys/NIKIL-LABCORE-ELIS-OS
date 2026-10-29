"use client";
import React from "react";

export function UsersSettings({ initialValues = {}, onSave, saving }: any) {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Users & Access Control</h3>
      <p className="text-sm text-slate-600">Manage laboratory personnel accounts, roles, and shift assignments.</p>
      {onSave && (
        <button
          type="button"
          onClick={() => onSave(initialValues)}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          {saving ? "Saving..." : "Save User Settings"}
        </button>
      )}
    </div>
  );
}
export default UsersSettings;
