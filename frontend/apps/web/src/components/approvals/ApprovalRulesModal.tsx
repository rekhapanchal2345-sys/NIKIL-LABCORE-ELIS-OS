"use client";

import React from "react";
import { ShieldCheck, X } from "lucide-react";

interface ApprovalRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApprovalRulesModal({ isOpen, onClose }: ApprovalRulesModalProps) {
  if (!isOpen) return null;

  const criticalLimits = [
    { department: "Biochemistry", test: "Potassium (K+)", panicLow: "< 2.8 mmol/L", panicHigh: "> 6.2 mmol/L", action: "Immediate verbal call to physician; risk of fatal arrhythmia." },
    { department: "Biochemistry", test: "Sodium (Na+)", panicLow: "< 120 mmol/L", panicHigh: "> 160 mmol/L", action: "Notify for acute neurological / osmotic demyelination risk." },
    { department: "Biochemistry", test: "Glucose (Fasting/Random)", panicLow: "< 45 mg/dL", panicHigh: "> 450 mg/dL", action: "Immediate hypoglycemia or hyperosmolar / DKA notification." },
    { department: "Biochemistry", test: "Serum Calcium", panicLow: "< 6.0 mg/dL", panicHigh: "> 13.0 mg/dL", action: "Tetany or hypercalcemic crisis risk." },
    { department: "Hematology", test: "Hemoglobin (Hb)", panicLow: "< 6.0 g/dL", panicHigh: "> 20.0 g/dL", action: "Severe acute anemia requiring urgent transfusion." },
    { department: "Hematology", test: "Platelet Count", panicLow: "< 20,000 /µL", panicHigh: "> 1,000,000 /µL", action: "High spontaneous hemorrhage or thrombotic risk." },
    { department: "Hematology", test: "Total Leukocyte Count (WBC)", panicLow: "< 1,500 /µL", panicHigh: "> 35,000 /µL", action: "Agranulocytosis or hyperleukocytosis / leukostasis alert." },
    { department: "Cardiology", test: "Troponin I / T", panicLow: "—", panicHigh: "> 0.04 ng/mL", action: "Stat notification for acute coronary syndrome / myocardial infarction." },
    { department: "Coagulation", test: "Prothrombin Time / INR", panicLow: "—", panicHigh: "INR > 4.5", action: "Critical bleeding risk in anti-coagulated patients." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#F8FAFC] border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Pathologist Sign-Off Policies & Critical Action Limits</h3>
              <p className="text-xs text-[#64748B]">
                Governing Standards: ISO 15189:2022 / NABL / CLSI Autovalidation Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-slate-400 hover:bg-gray-100 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="text-lg font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                <span>⚡</span> Clean Fast-Track
              </div>
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Auto-Approval Criteria</h4>
              <p className="text-xs text-emerald-800 mt-1">
                Results with 100% parameters within biological reference intervals, no analyzer flags, and delta check shift &lt; 15% qualify for streamlined release.
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
              <div className="text-lg font-bold text-red-800 mb-1 flex items-center gap-1.5">
                <span>🚨</span> Panic Limits
              </div>
              <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">Verbal Call Mandate</h4>
              <p className="text-xs text-red-800 mt-1">
                Any parameter breaching life-threatening thresholds MUST have a documented telephone read-back before digital report authorization.
              </p>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
              <div className="text-lg font-bold text-sky-800 mb-1 flex items-center gap-1.5">
                <span>🔬</span> Smear Review
              </div>
              <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wide">Manual Microscopy</h4>
              <p className="text-xs text-sky-800 mt-1">
                Mandatory for blast flag presence, severe thrombocytopenia (&lt;50k), or acute WBC spikes to rule out pseudothrombocytopenia.
              </p>
            </div>
          </div>

          {/* Critical Value Thresholds Table */}
          <div>
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
              Standard Panic Value Action Thresholds
            </h4>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-xs">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-[#F8FAFC]">
                  <tr className="text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4 text-left">Department</th>
                    <th className="py-2.5 px-4 text-left">Test / Parameter</th>
                    <th className="py-2.5 px-4 text-left">Panic Low</th>
                    <th className="py-2.5 px-4 text-left">Panic High</th>
                    <th className="py-2.5 px-4 text-left">Clinical Mandate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {criticalLimits.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-slate-500">
                        {c.department}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[#0F172A]">
                        {c.test}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#0284C7]">
                        {c.panicLow}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#DC2626]">
                        {c.panicHigh}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {c.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F8FAFC] px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#0284C7] hover:bg-[#0369A1] px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            Close Policy Guide
          </button>
        </div>
      </div>
    </div>
  );
}
