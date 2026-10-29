"use client";
import React, { useState } from "react";

export function LaboratorySettings({ initialValues = {}, onSave, onChange, saving }: any) {
  const [values, setValues] = useState<any>(initialValues);
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Laboratory Clinical Configuration</h3>
      <p className="text-sm text-slate-600">NABL accreditation details, barcode prefixes, and report verification rules.</p>
      {onSave && (
        <button
          type="button"
          onClick={() => onSave(values)}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          {saving ? "Saving..." : "Save Laboratory Settings"}
        </button>
      )}
    </div>
  );
}
export default LaboratorySettings;
