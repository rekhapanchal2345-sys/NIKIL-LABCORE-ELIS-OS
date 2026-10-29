"use client";
import React, { useState } from "react";

export function ProfileSettings({ initialValues = {}, onSave, onChange, saving }: any) {
  const [values, setValues] = useState<any>(initialValues);
  const handleChange = (key: string, val: any) => {
    const next = { ...values, [key]: val };
    setValues(next);
    onChange?.(next);
  };
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Profile Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
          <input
            type="text"
            value={values.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
          <input
            type="email"
            value={values.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
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
          {saving ? "Saving..." : "Save Profile"}
        </button>
      )}
    </div>
  );
}
export default ProfileSettings;
