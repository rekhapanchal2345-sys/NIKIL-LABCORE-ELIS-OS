"use client";
import React, { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, X } from "lucide-react";

export function PathologistApprovalModal({ isOpen, onClose, result, resultDetails, onApprove }: any) {
  const [interpretation, setInterpretation] = useState("All parameters verified and correlate clinically.");
  const [certified, setCertified] = useState(true);

  if (isOpen === false) return null;

  const patName = resultDetails?.patientName || result?.patientName || (result?.order?.patient ? `${result.order.patient.firstName} ${result.order.patient.lastName}` : "Patient");
  const tName = resultDetails?.testName || result?.testName || result?.test?.testName || "Diagnostic Investigation";
  const critList: string[] = resultDetails?.criticalValues || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold">Pathologist Digital Sign-Off (NABL ISO 15189)</h3>
              <p className="text-xs text-slate-300">{patName} • {tName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {critList.length > 0 && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Critical / Abnormal Values Flagged:
              </div>
              <ul className="list-disc pl-5 font-mono">
                {critList.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Pathologist Clinical Interpretation &amp; Sign-Off Note
            </label>
            <textarea
              rows={3}
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer text-xs text-emerald-950 font-medium">
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => setCertified(e.target.checked)}
              className="mt-0.5 rounded border-emerald-400 text-emerald-600"
            />
            <span>
              I certify under NABL ISO 15189:2022 Clause 7.4.1 that I have reviewed the analytical QC and authorize release of this report with my digital signature seal.
            </span>
          </label>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              disabled={!certified}
              onClick={() => {
                onApprove?.(interpretation || "SIGNED_NABL_SEAL");
                onClose?.();
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-sm transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              Authorize &amp; Release Final Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default PathologistApprovalModal;
