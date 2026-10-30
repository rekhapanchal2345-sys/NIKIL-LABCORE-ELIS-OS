"use client";
import React, { useState } from "react";
import { ShieldAlert, X } from "lucide-react";

export function SampleRejectModal({ isOpen, onClose, sample, onConfirm, onSuccess, loading, error }: any) {
  const [reason, setReason] = useState("Gross Hemolysis (HIL Index > 4+)");
  const [redrawRequired, setRedrawRequired] = useState(true);
  const [urgency, setUrgency] = useState("STAT");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-300" />
            <h3 className="text-sm font-bold">Pre-Analytical Specimen Rejection (ISO 15189)</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-rose-200 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Primary Rejection Cause</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 font-semibold">
              <option>Gross Hemolysis (HIL Index &gt; 4+)</option>
              <option>Clotted EDTA Whole Blood Specimen</option>
              <option>Quantity Not Sufficient (QNS) / Short Draw</option>
              <option>Incorrect Vacutainer Tube / Additive</option>
              <option>Unlabeled or Mislabeled Specimen Tube</option>
              <option>Severe Lipemia / Turbidity Interference</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
            <label className="flex items-center gap-2 font-bold text-amber-900 cursor-pointer">
              <input type="checkbox" checked={redrawRequired} onChange={(e) => setRedrawRequired(e.target.checked)} className="rounded border-amber-400" />
              Trigger Immediate Phlebotomy Redraw Alert
            </label>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="rounded-lg border border-amber-300 bg-white px-2 py-1 font-bold text-amber-900">
              <option value="STAT">STAT</option>
              <option value="URGENT">URGENT</option>
              <option value="ROUTINE">ROUTINE</option>
            </select>
          </div>
          {error && <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 font-bold border border-slate-200 rounded-xl text-slate-600">Cancel</button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                onConfirm?.(reason, redrawRequired, urgency);
                onSuccess?.();
              }}
              className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
            >
              Confirm Rejection &amp; Log Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SampleRejectModal;
