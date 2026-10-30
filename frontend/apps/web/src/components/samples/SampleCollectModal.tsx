"use client";
import React, { useState } from "react";
import { TestTube2, CheckCircle2, X } from "lucide-react";

export function SampleCollectModal({ isOpen, onClose, sample, onConfirm, onSuccess, loading, error }: any) {
  const [collectionSite, setCollectionSite] = useState("Left Antecubital Venipuncture");
  const [volumeMl, setVolumeMl] = useState("3.0 mL");
  const [fastingStatus, setFastingStatus] = useState("Verified");
  const [notes, setNotes] = useState("CLSI H3-A6 Order of Draw followed; 8x gentle inversion completed.");

  if (!isOpen || !sample) return null;

  const pat = sample.order?.patient || {};
  const patName = `${pat.firstName || ""} ${pat.lastName || ""}`.trim() || "Patient";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TestTube2 className="h-5 w-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold">Record Phlebotomy Venipuncture Collection</h3>
              <p className="text-xs text-slate-300">{sample.sampleNumber} • Barcode: {sample.barcode}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2">
            <div><span className="text-slate-500">Patient:</span> <strong className="text-slate-900">{patName} ({pat.uhid || "UHID"})</strong></div>
            <div><span className="text-slate-500">Investigation:</span> <strong className="text-slate-900">{sample.test?.testName || "Test"}</strong></div>
            <div><span className="text-slate-500">Vacutainer:</span> <strong className="text-sky-700">{sample.test?.sampleContainer || sample.sampleType}</strong></div>
            <div><span className="text-slate-500">Priority:</span> <strong className="text-rose-600">{sample.priority || "ROUTINE"}</strong></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Venipuncture Site</label>
              <select value={collectionSite} onChange={(e) => setCollectionSite(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900">
                <option>Left Antecubital Venipuncture</option>
                <option>Right Antecubital Venipuncture</option>
                <option>Dorsal Hand Vein (Butterfly 23G)</option>
                <option>Capillary Heel / Finger Prick</option>
              </select>
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Collected Volume &amp; Fasting</label>
              <div className="flex gap-2">
                <input type="text" value={volumeMl} onChange={(e) => setVolumeMl(e.target.value)} className="w-24 rounded-xl border border-slate-300 px-2.5 py-2 text-slate-900 font-mono" />
                <select value={fastingStatus} onChange={(e) => setFastingStatus(e.target.value)} className="flex-1 rounded-xl border border-slate-300 px-2.5 py-2 text-slate-900">
                  <option>Verified</option>
                  <option>Fasting (10-12h)</option>
                  <option>Random</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Phlebotomist Clinical Note</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900" />
          </div>

          {error && <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                const payload = { collectionSite, volumeMl, fastingStatus, notes, collectedAt: new Date().toISOString() };
                onConfirm?.(payload);
                onSuccess?.(payload);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Specimen Collection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SampleCollectModal;
