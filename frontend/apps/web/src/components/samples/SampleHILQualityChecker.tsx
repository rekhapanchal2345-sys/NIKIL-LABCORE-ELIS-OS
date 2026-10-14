"use client";

import React, { useState } from "react";
import {
  AlertTriangle, ShieldAlert, CheckCircle2, Info, Eye, 
  FlaskConical, RefreshCcw, HelpCircle, ArrowRight, Activity, 
  BadgeAlert, Sliders, ShieldCheck, Thermometer
} from "lucide-react";

interface InterferenceImpact {
  parameter: string;
  effect: "Falsely Increased" | "Falsely Decreased" | "Optical Interference" | "Invalid";
  magnitude: string;
  clinicalRisk: string;
}

const HEMOLYSIS_GRADES = [
  { grade: "H0", label: "Normal (Clear)", mgDl: "< 20 mg/dL", color: "#FEF3C7", textColor: "text-slate-800", desc: "Clear straw-yellow serum. Acceptable for all clinical chemistry tests." },
  { grade: "H1", label: "Mild Hemolysis (1+)", mgDl: "20–50 mg/dL", color: "#FECACA", textColor: "text-red-900", desc: "Faint pink hue. Potassium & LDH slightly elevated; caution advised." },
  { grade: "H2", label: "Moderate Hemolysis (2+)", mgDl: "50–100 mg/dL", color: "#F87171", textColor: "text-white", desc: "Distinct reddish tinge. Potassium, AST, LDH significantly compromised." },
  { grade: "H3", label: "Gross Hemolysis (3+)", mgDl: "100–300 mg/dL", color: "#DC2626", textColor: "text-white", desc: "Deep red/cherry serum. Reject for K+, Troponin, AST, LDH, Coagulation." },
  { grade: "H4", label: "Severe Hemolysis (4+)", mgDl: "> 300 mg/dL", color: "#991B1B", textColor: "text-white", desc: "Dark burgundy red. Mandatory specimen rejection & urgent redraw required." },
];

const ICTERUS_GRADES = [
  { grade: "I0", label: "Normal (0)", umol: "< 35 µmol/L", color: "#FEF9C3", textColor: "text-slate-800", desc: "Normal amber serum." },
  { grade: "I1", label: "Mild Icterus (1+)", umol: "35–100 µmol/L", color: "#FACC15", textColor: "text-slate-900", desc: "Golden yellow serum. Slight optical interference with creatinine Jaffé." },
  { grade: "I2", label: "Moderate Icterus (2+)", umol: "100–300 µmol/L", color: "#EAB308", textColor: "text-slate-900", desc: "Deep yellow-brown. Total protein, cholesterol, triglycerides impacted." },
  { grade: "I3", label: "Severe Icterus (3+)", umol: "> 300 µmol/L", color: "#CA8A04", textColor: "text-white", desc: "Dark brown/greenish bile hue. Strong negative interference with glucose oxidase." },
];

const LIPEMIA_GRADES = [
  { grade: "L0", label: "Normal (0)", turb: "Clear", color: "#FEF3C7", textColor: "text-slate-800", desc: "Crystal clear serum." },
  { grade: "L1", label: "Mild Lipemia (1+)", turb: "Slight Opalescent", color: "#F1F5F9", textColor: "text-slate-800", desc: "Slightly hazy/cloudy serum. May affect light scatter measurements." },
  { grade: "L2", label: "Moderate Lipemia (2+)", turb: "Milky / Turbid", color: "#E2E8F0", textColor: "text-slate-900", desc: "Marked milkiness. Causes pseudohyponatremia on indirect ISE electrolyte bay." },
  { grade: "L3", label: "Severe Lipemia (3+)", turb: "Chylomicron Creamy Layer", color: "#CBD5E1", textColor: "text-slate-900", desc: "Heavy creamy supernatant. Ultracentrifugation required before analysis." },
];

const AFFECTED_BY_HEMOLYSIS: InterferenceImpact[] = [
  { parameter: "Potassium (K+)", effect: "Falsely Increased", magnitude: "Up to +3.0 mmol/L artifactual jump", clinicalRisk: "May trigger false hyperkalemia treatment or hide true hypokalemia" },
  { parameter: "Lactate Dehydrogenase (LDH)", effect: "Falsely Increased", magnitude: "Up to +500% elevation (RBCs rich in LDH)", clinicalRisk: "False positive myocardial or hemolysis marker" },
  { parameter: "Aspartate Aminotransferase (AST)", effect: "Falsely Increased", magnitude: "+50% to +100% false elevation", clinicalRisk: "Mimics liver necrosis or cardiac injury" },
  { parameter: "High-Sensitivity Troponin (hs-cTn)", effect: "Falsely Decreased", magnitude: "Negative interference in some immunoassays", clinicalRisk: "High risk of missing true Acute Myocardial Infarction (NSTEMI)" },
  { parameter: "Total Bilirubin", effect: "Optical Interference", magnitude: "Interferes with azo-dye spectrophotometry", clinicalRisk: "Inaccurate neonatal jaundice diagnosis" },
  { parameter: "Magnesium (Mg)", effect: "Falsely Increased", magnitude: "RBC intracellular release", clinicalRisk: "Overestimates actual extracellular levels" },
];

export default function SampleHILQualityChecker() {
  const [selectedH, setSelectedH] = useState(1);
  const [selectedI, setSelectedI] = useState(0);
  const [selectedL, setSelectedL] = useState(0);

  const activeH = HEMOLYSIS_GRADES[selectedH];
  const activeI = ICTERUS_GRADES[selectedI];
  const activeL = LIPEMIA_GRADES[selectedL];

  const hasCriticalInterference = selectedH >= 3 || selectedL >= 2 || selectedI >= 3;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                <FlaskConical className="h-3.5 w-3.5 text-sky-600" /> Pre-Analytical Serum Integrity
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                <BadgeAlert className="h-3.5 w-3.5 text-amber-600" /> HIL Optical Index
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl mt-1.5">
              Hemolysis, Icterus &amp; Lipemia (HIL) Clinical Assessment Desk
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl mt-1">
              Verify serum quality before loading specimen racks onto automated clinical chemistry and immunoassay analyzers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasCriticalInterference ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 animate-pulse">
                <ShieldAlert className="h-4 w-4" /> Reject Specimen / Redraw Recommended
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Acceptable for Analyzer Bay
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive 3-Pillar Assessment Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pillar 1: Hemolysis (H) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-600 inline-block" />
                Hemolysis Index (H)
              </h3>
              <p className="text-[11px] text-slate-500">Free hemoglobin from lysed erythrocytes</p>
            </div>
            <span className="font-mono text-xs font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
              {activeH.grade}
            </span>
          </div>

          {/* Visual Serum Tube Simulation */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div
              className="h-14 w-8 rounded-md shadow-inner border border-black/10 transition-colors duration-300"
              style={{ backgroundColor: activeH.color }}
            />
            <div>
              <p className="text-xs font-black text-slate-800">{activeH.label}</p>
              <p className="text-[11px] font-mono text-slate-500 font-semibold">{activeH.mgDl}</p>
              <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{activeH.desc}</p>
            </div>
          </div>

          {/* Grade Selector Pills */}
          <div className="grid grid-cols-5 gap-1.5">
            {HEMOLYSIS_GRADES.map((g, idx) => (
              <button
                key={g.grade}
                onClick={() => setSelectedH(idx)}
                className={`flex flex-col items-center rounded-xl border py-2 text-[10px] font-black transition-all ${
                  selectedH === idx
                    ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-400/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{g.grade}</span>
                <span
                  className="mt-1 h-2 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: g.color }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Pillar 2: Icterus (I) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                Icterus Index (I)
              </h3>
              <p className="text-[11px] text-slate-500">Elevated conjugated &amp; unconjugated bilirubin</p>
            </div>
            <span className="font-mono text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
              {activeI.grade}
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div
              className="h-14 w-8 rounded-md shadow-inner border border-black/10 transition-colors duration-300"
              style={{ backgroundColor: activeI.color }}
            />
            <div>
              <p className="text-xs font-black text-slate-800">{activeI.label}</p>
              <p className="text-[11px] font-mono text-slate-500 font-semibold">{activeI.umol}</p>
              <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{activeI.desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {ICTERUS_GRADES.map((g, idx) => (
              <button
                key={g.grade}
                onClick={() => setSelectedI(idx)}
                className={`flex flex-col items-center rounded-xl border py-2 text-[10px] font-black transition-all ${
                  selectedI === idx
                    ? "border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-400/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{g.grade}</span>
                <span
                  className="mt-1 h-2 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: g.color }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Pillar 3: Lipemia (L) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-slate-400 inline-block" />
                Lipemia Index (L)
              </h3>
              <p className="text-[11px] text-slate-500">Chylomicrons &amp; high triglycerides (turbidity)</p>
            </div>
            <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
              {activeL.grade}
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div
              className="h-14 w-8 rounded-md shadow-inner border border-black/10 transition-colors duration-300"
              style={{ backgroundColor: activeL.color }}
            />
            <div>
              <p className="text-xs font-black text-slate-800">{activeL.label}</p>
              <p className="text-[11px] font-mono text-slate-500 font-semibold">{activeL.turb}</p>
              <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{activeL.desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {LIPEMIA_GRADES.map((g, idx) => (
              <button
                key={g.grade}
                onClick={() => setSelectedL(idx)}
                className={`flex flex-col items-center rounded-xl border py-2 text-[10px] font-black transition-all ${
                  selectedL === idx
                    ? "border-slate-500 bg-slate-100 text-slate-900 ring-2 ring-slate-400/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{g.grade}</span>
                <span
                  className="mt-1 h-2 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: g.color }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Affected Laboratory Analytes Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Impact on Laboratory Analytes &amp; Patient Safety
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specific clinical test parameters contaminated or distorted by pre-analytical serum indices
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Current Index: <span className="font-mono font-black text-slate-900">{activeH.grade} / {activeI.grade} / {activeL.grade}</span>
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Parameter / Test</th>
                <th className="px-4 py-3">Interference Effect</th>
                <th className="px-4 py-3">Magnitude of Distortion</th>
                <th className="px-4 py-3">Clinical Risk to Patient</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {AFFECTED_BY_HEMOLYSIS.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{item.parameter}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black ${
                        item.effect === "Falsely Increased"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : item.effect === "Falsely Decreased"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {item.effect}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-700">{item.magnitude}</td>
                  <td className="px-4 py-3 text-slate-500">{item.clinicalRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
