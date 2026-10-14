"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Bell,
  PhoneCall,
  MessageSquare,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Search,
  Send,
  Zap,
  Users,
  AlertCircle,
  Volume2
} from "lucide-react";

interface PanicThreshold {
  id: string;
  analyte: string;
  testCode: string;
  unit: string;
  criticalLow?: string;
  criticalHigh?: string;
  clinicalRisk: string;
  department: string;
  statPhoneAlert: boolean;
  smsEnabled: boolean;
  whatsAppEnabled: boolean;
}

const DEFAULT_PANIC_THRESHOLDS: PanicThreshold[] = [
  { id: "p-1", analyte: "Serum Potassium (K+)", testCode: "POTASS", unit: "mmol/L", criticalLow: "< 2.8", criticalHigh: "> 6.2", clinicalRisk: "Cardiac dysrhythmia, ventricular fibrillation, cardiac arrest", department: "Clinical Biochemistry", statPhoneAlert: true, smsEnabled: true, whatsAppEnabled: true },
  { id: "p-2", analyte: "Blood Glucose (Fasting/Random)", testCode: "GLUCOSE", unit: "mg/dL", criticalLow: "< 45", criticalHigh: "> 450", clinicalRisk: "Hypoglycemic coma, severe ketoacidosis / hyperosmolar crisis", department: "Clinical Biochemistry", statPhoneAlert: true, smsEnabled: true, whatsAppEnabled: true },
  { id: "p-3", analyte: "Hemoglobin (Hb)", testCode: "HGB", unit: "g/dL", criticalLow: "< 6.0", criticalHigh: "> 20.0", clinicalRisk: "Severe hypovolemic anoxia, hyperviscosity syndrome", department: "Hematology", statPhoneAlert: true, smsEnabled: true, whatsAppEnabled: true },
  { id: "p-4", analyte: "Platelet Count", testCode: "PLT", unit: "/µL", criticalLow: "< 20,000", criticalHigh: "> 1,000,000", clinicalRisk: "Spontaneous intracranial bleeding, thrombotic stroke risk", department: "Hematology", statPhoneAlert: true, smsEnabled: true, whatsAppEnabled: true },
  { id: "p-5", analyte: "Troponin I (High Sensitivity)", testCode: "TROP_I", unit: "ng/mL", criticalHigh: "> 0.04", clinicalRisk: "Acute Myocardial Infarction (STEMI/NSTEMI)", department: "Immunology / Emergency", statPhoneAlert: true, smsEnabled: true, whatsAppEnabled: true },
  { id: "p-6", analyte: "Serum Sodium (Na+)", testCode: "SODIUM", unit: "mmol/L", criticalLow: "< 120", criticalHigh: "> 160", clinicalRisk: "Cerebral edema, seizures, central pontine myelinolysis", department: "Clinical Biochemistry", statPhoneAlert: true, smsEnabled: true, whatsAppEnabled: true },
  { id: "p-7", analyte: "Serum Calcium (Total)", testCode: "CALCIUM", unit: "mg/dL", criticalLow: "< 6.0", criticalHigh: "> 13.0", clinicalRisk: "Tetany, laryngospasm, hypercalcemic coma", department: "Clinical Biochemistry", statPhoneAlert: true, smsEnabled: true, whatsAppEnabled: true },
  { id: "p-8", analyte: "Serum Creatinine", testCode: "CREAT", unit: "mg/dL", criticalHigh: "> 5.0", clinicalRisk: "Acute renal failure, severe uremic encephalopathy", department: "Clinical Biochemistry", statPhoneAlert: true, smsEnabled: true, whatsAppEnabled: true },
  { id: "p-9", analyte: "Prothrombin Time (INR)", testCode: "PT_INR", unit: "Ratio", criticalHigh: "> 4.5", clinicalRisk: "Major spontaneous internal hemorrhage risk", department: "Hematology & Hemostasis", statPhoneAlert: true, smsEnabled: true, whatsAppEnabled: true },
];

export default function PanicValueAlertMatrix() {
  const [thresholds, setThresholds] = useState<PanicThreshold[]>(DEFAULT_PANIC_THRESHOLDS);
  const [search, setSearch] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [simAlertSuccess, setSimAlertSuccess] = useState(false);

  const handleSimulateCriticalAlert = () => {
    setSimulating(true);
    setSimAlertSuccess(false);
    setTimeout(() => {
      setSimulating(false);
      setSimAlertSuccess(true);
      setTimeout(() => setSimAlertSuccess(false), 5000);
    }, 800);
  };

  const filtered = thresholds.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        t.analyte.toLowerCase().includes(q) ||
        t.testCode.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.clinicalRisk.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Light White Header Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                NABL ISO 15189:2022 Critical Alert Mandate
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Sub-15 Minute Notification SLA
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Critical / Panic Laboratory Values Protocol &amp; Escalation Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Life-threatening abnormal laboratory results automatically trigger multi-channel alerts (SMS, WhatsApp, Audio Chime) to the treating physician with verified read-back documentation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateCriticalAlert}
              disabled={simulating}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{simulating ? "Dispatching..." : "Simulate Emergency Panic Alert"}</span>
            </button>
          </div>
        </div>

        {/* Emergency Simulator Feedback Strip */}
        {simAlertSuccess && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>CRITICAL PANIC TRIGGERED:</strong> Potassium <strong>6.8 mmol/L</strong> for Patient <strong>Aarav Deshmukh (UHID-2026-9041)</strong>! WhatsApp, SMS, &amp; Desk Alert sent to <strong>Dr. Sandeep Deshmukh</strong> with 15-min countdown timer.
              </span>
            </div>
            <span className="font-bold text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded">DISPATCHED</span>
          </div>
        )}

        {/* Protocol Policy Strip */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Identification &amp; Retest</span>
            <p className="font-semibold text-slate-800 mt-0.5">Immediate sample re-run on backup analyzer to rule out artifact/pre-analytical error.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Doctor Communication</span>
            <p className="font-semibold text-slate-800 mt-0.5">Direct phone call or high-priority WhatsApp push to attending physician within 15 minutes.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">3. Read-Back Verification</span>
            <p className="font-semibold text-slate-800 mt-0.5">Doctor/Nurse reads back patient name and critical value to verify zero misunderstanding.</p>
          </div>
        </div>
      </div>

      {/* Thresholds Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Hospital Master Critical Value Thresholds ({filtered.length} Analytes)</h3>
            <p className="text-[11px] text-slate-500">Configured per NABL accreditation standards &amp; clinical consensus</p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search critical analyte..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-52 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3">Analyte &amp; Code</th>
                <th className="p-3">Critical Low</th>
                <th className="p-3">Critical High</th>
                <th className="p-3">Clinical Pathology Risk</th>
                <th className="p-3">Notification Channels</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{t.analyte}</div>
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {t.testCode}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5">{t.department}</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-blue-700">
                    {t.criticalLow ? `${t.criticalLow} ${t.unit}` : "—"}
                  </td>
                  <td className="p-3 font-mono font-bold text-rose-700">
                    {t.criticalHigh ? `${t.criticalHigh} ${t.unit}` : "—"}
                  </td>
                  <td className="p-3 text-[11px] text-slate-600 max-w-xs">
                    {t.clinicalRisk}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {t.statPhoneAlert && (
                        <span className="p-1 rounded bg-rose-50 text-rose-700 font-bold" title="Phone Call Alert">
                          📞 Call
                        </span>
                      )}
                      {t.whatsAppEnabled && (
                        <span className="p-1 rounded bg-emerald-50 text-emerald-700 font-bold" title="WhatsApp Alert">
                          💬 WhatsApp
                        </span>
                      )}
                      {t.smsEnabled && (
                        <span className="p-1 rounded bg-blue-50 text-blue-700 font-bold" title="SMS Alert">
                          ✉ SMS
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ● Active SLA
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
