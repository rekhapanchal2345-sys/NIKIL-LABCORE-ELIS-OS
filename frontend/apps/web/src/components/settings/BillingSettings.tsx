"use client";
import React, { useState } from "react";

export function BillingSettings({ initialValues = {}, onSave, saving }: any) {
  const [values] = useState<any>(initialValues);
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Billing & GST Configuration</h3>
      <p className="text-sm text-slate-600">Configure invoice numbering, discount caps, and payment modes.</p>
      {onSave && (
        <button
          type="button"
          onClick={() => onSave(values)}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          {saving ? "Saving..." : "Save Billing Settings"}
        </button>
      )}
    </div>
  );
}
export default BillingSettings;
