"use client";

import React, { useState } from "react";
import {
  Activity,
  User,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Search,
  FileSignature,
  FlaskConical,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface ParameterTrendRecord {
  date: string;
  value: number;
  displayValue: string;
  unit: string;
  referenceRange: string;
  flag: "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
  notes?: string;
}

interface PatientEmrData {
  uhid: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  knownAllergies: string[];
  chronicConditions: string[];
  lastVisit: string;
  primaryPhysician: string;
  parameterTrends: Record<string, ParameterTrendRecord[]>;
  prescriptionsHistory: Array<{
    date: string;
    rxNumber: string;
    diagnosis: string;
    doctor: string;
    medicationsSummary: string;
  }>;
}

const SAMPLE_PATIENTS: PatientEmrData[] = [
  {
    uhid: "UHID-2026-8812",
    fullName: "Smt. Sunita Devi",
    age: 54,
    gender: "Female",
    bloodGroup: "B Positive",
    phone: "+91 98231 44512",
    knownAllergies: ["Penicillin", "Sulfa Drugs"],
    chronicConditions: ["Type 2 Diabetes Mellitus", "Essential Hypertension", "Dyslipidemia"],
    lastVisit: "2026-10-26",
    primaryPhysician: "Dr. Rajesh Sharma, MD",
    parameterTrends: {
      "HbA1c (Glycated Hemoglobin)": [
        { date: "2026-01-14", value: 9.8, displayValue: "9.8 %", unit: "%", referenceRange: "< 5.7 %", flag: "HIGH", notes: "Initial presentation, poorly controlled" },
        { date: "2026-04-18", value: 8.6, displayValue: "8.6 %", unit: "%", referenceRange: "< 5.7 %", flag: "HIGH", notes: "Metformin escalated" },
        { date: "2026-07-22", value: 7.9, displayValue: "7.9 %", unit: "%", referenceRange: "< 5.7 %", flag: "HIGH", notes: "Diet adherence improved" },
        { date: "2026-10-26", value: 7.2, displayValue: "7.2 %", unit: "%", referenceRange: "< 5.7 %", flag: "NORMAL", notes: "Consistent improvement, glycemic control target near" },
      ],
      "Fasting Blood Glucose (FBS)": [
        { date: "2026-01-14", value: 218, displayValue: "218 mg/dL", unit: "mg/dL", referenceRange: "70 - 100 mg/dL", flag: "HIGH" },
        { date: "2026-04-18", value: 174, displayValue: "174 mg/dL", unit: "mg/dL", referenceRange: "70 - 100 mg/dL", flag: "HIGH" },
        { date: "2026-07-22", value: 142, displayValue: "142 mg/dL", unit: "mg/dL", referenceRange: "70 - 100 mg/dL", flag: "HIGH" },
        { date: "2026-10-26", value: 124, displayValue: "124 mg/dL", unit: "mg/dL", referenceRange: "70 - 100 mg/dL", flag: "NORMAL" },
      ],
      "Serum Creatinine": [
        { date: "2026-01-14", value: 0.95, displayValue: "0.95 mg/dL", unit: "mg/dL", referenceRange: "0.5 - 1.1 mg/dL", flag: "NORMAL" },
        { date: "2026-04-18", value: 1.02, displayValue: "1.02 mg/dL", unit: "mg/dL", referenceRange: "0.5 - 1.1 mg/dL", flag: "NORMAL" },
        { date: "2026-07-22", value: 0.98, displayValue: "0.98 mg/dL", unit: "mg/dL", referenceRange: "0.5 - 1.1 mg/dL", flag: "NORMAL" },
        { date: "2026-10-26", value: 0.92, displayValue: "0.92 mg/dL", unit: "mg/dL", referenceRange: "0.5 - 1.1 mg/dL", flag: "NORMAL" },
      ],
      "Platelet Count": [
        { date: "2026-01-14", value: 240, displayValue: "240,000 /µL", unit: "/µL", referenceRange: "150,000 - 450,000", flag: "NORMAL" },
        { date: "2026-04-18", value: 260, displayValue: "260,000 /µL", unit: "/µL", referenceRange: "150,000 - 450,000", flag: "NORMAL" },
        { date: "2026-07-22", value: 255, displayValue: "255,000 /µL", unit: "/µL", referenceRange: "150,000 - 450,000", flag: "NORMAL" },
        { date: "2026-10-26", value: 275, displayValue: "275,000 /µL", unit: "/µL", referenceRange: "150,000 - 450,000", flag: "NORMAL" },
      ],
    },
    prescriptionsHistory: [
      {
        date: "2026-10-26",
        rxNumber: "RX-2026-904121",
        diagnosis: "Essential Hypertension with Type 2 Diabetes Mellitus",
        doctor: "Dr. Rajesh Sharma, MD",
        medicationsSummary: "Telmisartan 40mg, Metformin 500mg SR, Atorvastatin 10mg",
      },
      {
        date: "2026-07-22",
        rxNumber: "RX-2026-810940",
        diagnosis: "Type 2 Diabetes follow-up; Suboptimal glycemic response",
        doctor: "Dr. Rajesh Sharma, MD",
        medicationsSummary: "Metformin 500mg SR, Glimepiride 1mg, Telmisartan 40mg",
      },
      {
        date: "2026-01-14",
        rxNumber: "RX-2026-701923",
        diagnosis: "Newly Diagnosed Type 2 Diabetes; Grade 1 Hypertension",
        doctor: "Dr. Rajesh Sharma, MD",
        medicationsSummary: "Metformin 500mg, Lifestyle modification advised",
      },
    ],
  },
  {
    uhid: "UHID-2026-7910",
    fullName: "Mr. Harish Chandra",
    age: 67,
    gender: "Male",
    bloodGroup: "O Positive",
    phone: "+91 94150 33219",
    knownAllergies: ["None Known (NKDA)"],
    chronicConditions: ["COPD", "Coronary Artery Disease", "Chronic Kidney Disease Stage 3"],
    lastVisit: "2026-10-25",
    primaryPhysician: "Dr. Vikram Seth (Intensivist)",
    parameterTrends: {
      "Platelet Count": [
        { date: "2026-10-22", value: 185, displayValue: "185,000 /µL", unit: "/µL", referenceRange: "150,000 - 450,000", flag: "NORMAL" },
        { date: "2026-10-24", value: 65, displayValue: "65,000 /µL", unit: "/µL", referenceRange: "150,000 - 450,000", flag: "LOW", notes: "Sepsis induced consumption" },
        { date: "2026-10-26", value: 18, displayValue: "18,000 /µL", unit: "/µL", referenceRange: "150,000 - 450,000", flag: "CRITICAL", notes: "Severe sepsis coagulopathy, STAT transfusion indicated" },
      ],
      "Total Leukocyte Count (WBC)": [
        { date: "2026-10-22", value: 9.8, displayValue: "9,800 /µL", unit: "/µL", referenceRange: "4,000 - 11,000", flag: "NORMAL" },
        { date: "2026-10-24", value: 14.5, displayValue: "14,500 /µL", unit: "/µL", referenceRange: "4,000 - 11,000", flag: "HIGH" },
        { date: "2026-10-26", value: 19.4, displayValue: "19,400 /µL", unit: "/µL", referenceRange: "4,000 - 11,000", flag: "CRITICAL" },
      ],
    },
    prescriptionsHistory: [
      {
        date: "2026-10-22",
        rxNumber: "RX-2026-890124",
        diagnosis: "Right Lower Lobe Pneumonia; Sepsis Watch",
        doctor: "Dr. Vikram Seth",
        medicationsSummary: "Inj. Meropenem 1g IV, Inj. Hydrocortisone, Inhaler Tiotropium",
      },
    ],
  },
];

export default function DoctorEmrTrendsView() {
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const currentPatient = SAMPLE_PATIENTS[selectedPatientIndex] || SAMPLE_PATIENTS[0];
  const parametersList = Object.keys(currentPatient.parameterTrends);
  const [selectedParameter, setSelectedParameter] = useState(parametersList[0] || "");

  // Update selected parameter if patient changes and current parameter doesn't exist
  React.useEffect(() => {
    if (!currentPatient.parameterTrends[selectedParameter]) {
      setSelectedParameter(Object.keys(currentPatient.parameterTrends)[0] || "");
    }
  }, [selectedPatientIndex, currentPatient, selectedParameter]);

  const trendData = currentPatient.parameterTrends[selectedParameter] || [];

  return (
    <div className="space-y-4">
      {/* ── Patient Selector & Search ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-700">Select Patient for Longitudinal Review:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_PATIENTS.map((p, idx) => (
              <button
                key={p.uhid}
                type="button"
                onClick={() => setSelectedPatientIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedPatientIndex === idx
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>{p.fullName}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${selectedPatientIndex === idx ? "bg-white/20" : "bg-white"}`}>
                  {p.uhid}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Patient Clinical Dossier (Ultra Light White Theme) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="md:col-span-2 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{currentPatient.fullName}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
                {currentPatient.uhid}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {currentPatient.bloodGroup}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {currentPatient.age} years old • {currentPatient.gender} • Primary Doctor: <strong>{currentPatient.primaryPhysician}</strong>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              Known Drug Allergies:
            </span>
            <div className="flex flex-wrap gap-1">
              {currentPatient.knownAllergies.map((all, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                  ⚠️ {all}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Chronic Comorbidities:
            </span>
            <div className="flex flex-wrap gap-1">
              {currentPatient.chronicConditions.map((cond, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                  {cond}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Longitudinal Lab Parameter Progression ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Cumulative Laboratory Trends & Biomarker Progression</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical serial lab determinations over time plotted against CLSI normal intervals.
            </p>
          </div>

          {/* Parameter Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Select Parameter:</span>
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              className="rounded-xl border border-slate-200 py-1.5 px-3 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-sky-600"
            >
              {parametersList.map((param) => (
                <option key={param} value={param}>
                  {param}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Progression Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {trendData.map((rec, i) => {
            const isHigh = rec.flag === "HIGH";
            const isCritical = rec.flag === "CRITICAL";

            return (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${
                  isCritical
                    ? "bg-rose-50 border-rose-200"
                    : isHigh
                    ? "bg-amber-50/70 border-amber-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>📅 {rec.date}</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${
                      isCritical
                        ? "bg-rose-200 text-rose-900"
                        : isHigh
                        ? "bg-amber-200 text-amber-900"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {rec.flag}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span
                    className={`text-xl font-black font-mono ${
                      isCritical ? "text-rose-700" : isHigh ? "text-amber-800" : "text-slate-900"
                    }`}
                  >
                    {rec.displayValue}
                  </span>
                  {i > 0 && (
                    <span className="text-[11px] font-bold flex items-center gap-0.5 text-slate-500">
                      {rec.value > trendData[i - 1].value ? (
                        <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-teal-600" />
                      )}
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Ref: {rec.referenceRange}
                </div>

                {rec.notes && (
                  <p className="text-[10px] text-slate-600 mt-2 italic bg-white/60 p-1.5 rounded border border-slate-200/60">
                    "{rec.notes}"
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Chronological Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">Date of Investigation</th>
                <th className="py-2.5 px-3">Observed Parameter Value</th>
                <th className="py-2.5 px-3">Biological Reference Interval</th>
                <th className="py-2.5 px-3">Evaluation & Severity</th>
                <th className="py-2.5 px-3">Clinical Context / Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {trendData.map((rec, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{rec.date}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{rec.displayValue}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{rec.referenceRange}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.flag === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : rec.flag === "HIGH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {rec.flag}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{rec.notes || "Routine follow-up"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── Past Prescription & Clinical History ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-sky-600" />
          <span>Patient Past Prescriptions & Encounter History</span>
        </h3>

        <div className="space-y-2">
          {currentPatient.prescriptionsHistory.map((rx, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-700">{rx.rxNumber}</span>
                  <span className="text-[11px] text-slate-400 font-mono">📅 {rx.date}</span>
                </div>
                <div className="font-semibold text-slate-900">{rx.diagnosis}</div>
                <div className="text-[11px] text-slate-500">
                  Prescribed: <span className="font-medium text-slate-700">{rx.medicationsSummary}</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-[11px] text-slate-600 font-semibold block">{rx.doctor}</span>
                <span className="text-[10px] text-teal-700 font-bold">✓ Dispensed & Followed</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
