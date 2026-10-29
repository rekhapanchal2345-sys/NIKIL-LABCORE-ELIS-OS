"use client";
import React from "react";

export function BrandingSettings({ initialValues = {}, onSave, saving }: any) {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Report Branding & Header</h3>
      <p className="text-sm text-slate-600">Customize laboratory logos, letterhead margins, and digital signatory stamps.</p>
      {onSave && (
        <button
          type="button"
          onClick={() => onSave(initialValues)}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          {saving ? "Saving..." : "Save Branding"}
        </button>
      )}
    </div>
  );
}
export default BrandingSettings;
