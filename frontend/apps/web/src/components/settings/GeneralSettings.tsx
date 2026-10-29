"use client";
import React, { useState } from "react";

export function GeneralSettings({ initialValues = {}, onSave, onChange, saving }: any) {
  const [values, setValues] = useState<any>(initialValues);
  const handleChange = (key: string, val: any) => {
    const next = { ...values, [key]: val };
    setValues(next);
    onChange?.(next);
  };
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">General Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Laboratory Name</label>
          <input
            type="text"
            value={values.labName || "Sobhana Diagnostic Centre"}
            onChange={(e) => handleChange("labName", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Timezone</label>
          <input
            type="text"
            value={values.timezone || "Asia/Kolkata"}
            onChange={(e) => handleChange("timezone", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
      </div>
      {onSave && (
        <button
          type="button"
          onClick={() => onSave(values)}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          {saving ? "Saving..." : "Save General Settings"}
        </button>
      )}
    </div>
  );
}
export default GeneralSettings;
