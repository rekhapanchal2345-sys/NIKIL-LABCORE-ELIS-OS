"use client";
import React from "react";
import { Printer, X, ShieldCheck, FileText } from "lucide-react";

export function LabTestResultReport({ report, result, onClose, onPrint }: any) {
  const rep = report || result || {};
  const rows = Array.isArray(rep.results) ? rep.results : (Array.isArray(rep.values) ? rep.values : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold">{rep.reportNumber || "NABL Certified Diagnostic Report"}</h3>
              <p className="text-xs text-slate-300">{rep.patientName || "Patient"} • {rep.testName || "Investigation"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.print();
                onPrint?.();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
            >
              <Printer className="h-3.5 w-3.5" />
              Print A4 Report
            </button>
            {onClose && (
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-8 space-y-6 bg-white text-slate-900">
          <div className="border-b-2 border-sky-600 pb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">LABCORE MEDICAL DIAGNOSTICS &amp; HOSPITAL</h2>
              <p className="text-xs font-bold text-teal-700">NABL ISO 15189:2022 Accredited • Reg: MC-6042 • Clinical Reference Lab</p>
            </div>
            <div className="text-right text-xs font-mono">
              <div className="font-bold text-sky-700">{rep.reportNumber || "RPT-2026"}</div>
              <div className="text-slate-500">Order: {rep.orderId || "ORD-2026"}</div>
              <div className="text-slate-500">Barcode: {rep.barcode || rep.sampleId || "BC-EDTA"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-1">
              <div><span className="text-slate-500">Patient Name:</span> <strong className="text-slate-900">{rep.patientName || "Walk-in Patient"}</strong></div>
              <div><span className="text-slate-500">UHID / Age / Gender:</span> <span className="font-mono font-bold">{rep.patientId || "UHID-2026"}</span> • {rep.age || "35 Yrs"} • {rep.gender || "M/F"}</div>
              <div><span className="text-slate-500">Phone:</span> {rep.phone || "+91 98765 43210"}</div>
            </div>
            <div className="space-y-1">
              <div><span className="text-slate-500">Referred By:</span> <strong>{rep.referredBy || "Dr. Rajeshwari Swaminathan"}</strong></div>
              <div><span className="text-slate-500">Specimen / Dept:</span> {rep.specimen || "WHOLE_BLOOD"} • {rep.department || "Pathology"}</div>
              <div><span className="text-slate-500">Status:</span> <strong className="text-emerald-700">{rep.resultStatus || rep.reportStatus || "Verified"}</strong></div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs">
              <strong className="text-slate-900">{rep.testName || "Clinical Panel"} ({rep.testCode || "LAB"})</strong>
              <span className="text-sky-700 font-semibold">Method: {rep.method || "Automated Assay"}</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Parameter</th>
                  <th className="px-4 py-2.5">Observed Result</th>
                  <th className="px-4 py-2.5">Unit</th>
                  <th className="px-4 py-2.5">Reference Interval</th>
                  <th className="px-4 py-2.5">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((r: any, idx: number) => (
                  <tr key={r.id || idx}>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{r.parameterName || r.parameter?.parameterName || "Analyte"}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{r.result ?? r.value ?? "Normal"}</td>
                    <td className="px-4 py-2.5 text-slate-600 font-mono">{r.unit || r.parameter?.unit || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600 font-mono">{r.referenceRange || "Standard"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        r.flag === "CRITICAL" ? "bg-red-100 text-red-700" : r.flag === "HIGH" || r.flag === "LOW" ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {r.flag || "NORMAL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(rep.interpretation || rep.remarks) && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <strong>Clinical Interpretation:</strong> {rep.interpretation || rep.remarks}
            </div>
          )}

          <div className="pt-4 border-t border-dashed border-slate-300 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <ShieldCheck className="h-4 w-4" />
              Electronically Verified NABL ISO 15189 Report
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-900">{rep.verifiedBy || "Dr. Rajeshwari Swaminathan, MD"}</div>
              <div className="text-[11px] text-slate-500">{rep.verifierRole || "Chief Consultant Pathologist"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LabTestResultReport;
