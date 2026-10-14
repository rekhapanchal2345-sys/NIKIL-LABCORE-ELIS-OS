"use client";

import React, { useState } from "react";
import { 
  FlaskConical, Info, Sparkles, CheckCircle2, AlertTriangle, 
  Clock, Gauge, ArrowRight, ShieldCheck, HelpCircle, Layers,
  ChevronRight, RefreshCw, FileText
} from "lucide-react";

interface TubeGuide {
  step: number;
  name: string;
  capColor: string;
  capHex: string;
  additive: string;
  inversions: string;
  department: string;
  tests: string[];
  rationale: string;
  centrifugeRcf?: string;
  centrifugeTime?: string;
  centrifugeTemp?: string;
}

const ORDER_OF_DRAW: TubeGuide[] = [
  {
    step: 1,
    name: "Blood Cultures",
    capColor: "Yellow / Charcoal",
    capHex: "#EAB308",
    additive: "SPS (Sodium Polyanethol Sulfonate) or Broth",
    inversions: "8–10 gentle inversions",
    department: "Microbiology",
    tests: ["Blood Culture Aerobic & Anaerobic", "Bacteremia / Sepsis screen"],
    rationale: "Always drawn FIRST to prevent bacterial contamination from needle puncture and subsequent tube stoppers.",
  },
  {
    step: 2,
    name: "Citrate Tube (Light Blue)",
    capColor: "Light Blue",
    capHex: "#0284C7",
    additive: "3.2% Sodium Citrate (1:9 ratio strictly required)",
    inversions: "3–4 gentle inversions (DO NOT over-mix)",
    department: "Coagulation / Hematology",
    tests: ["PT / INR", "APTT", "D-Dimer", "Fibrinogen", "Thrombin Time"],
    rationale: "Must be filled to exact fill line mark. Drawn before other additive tubes to avoid contamination with tissue thromboplastin.",
    centrifugeRcf: "1500–2000 g (Platelet-Poor Plasma)",
    centrifugeTime: "15 minutes",
    centrifugeTemp: "18–25°C Ambient",
  },
  {
    step: 3,
    name: "Serum Separator Tube (Gold / Red)",
    capColor: "Gold / Red SST",
    capHex: "#F59E0B",
    additive: "Clot Activator & Polymer Gel Separator",
    inversions: "5 gentle inversions",
    department: "Clinical Biochemistry & Immunology",
    tests: ["Liver Function (LFT)", "Kidney Function (KFT)", "Lipid Profile", "Cardiac Troponin", "Thyroid (TSH, FT3, FT4)", "Serology"],
    rationale: "Allow complete clotting for 30 minutes at room temperature before centrifugation. Gel separates serum from erythrocyte layer cleanly.",
    centrifugeRcf: "1800–2200 g",
    centrifugeTime: "10 minutes",
    centrifugeTemp: "20–25°C",
  },
  {
    step: 4,
    name: "Heparin Tube (Green)",
    capColor: "Green Top",
    capHex: "#10B981",
    additive: "Lithium Heparin / Sodium Heparin",
    inversions: "8–10 gentle inversions",
    department: "STAT Biochemistry / Toxicological Screening",
    tests: ["Electrolytes (Na, K, Cl)", "Arterial Blood Gas (ABG)", "Ammonia", "Troponin STAT", "Chromosome Analysis"],
    rationale: "Heparin inhibits thrombin formation for rapid plasma separation without waiting 30 minutes for clot retraction.",
    centrifugeRcf: "2000 g",
    centrifugeTime: "10 minutes",
    centrifugeTemp: "4°C or 20°C",
  },
  {
    step: 5,
    name: "EDTA Tube (Lavender / Purple)",
    capColor: "Lavender / Purple",
    capHex: "#8B5CF6",
    additive: "K2-EDTA or K3-EDTA (Chelates Calcium)",
    inversions: "8–10 gentle inversions immediately upon draw",
    department: "Hematology & Molecular Diagnostics",
    tests: ["Complete Blood Count (CBC)", "HbA1c Glycated Hemoglobin", "Peripheral Blood Smear", "ESR", "Blood Grouping", "Viral Load PCR"],
    rationale: "Preserves cellular morphology of WBC, RBC, and platelets. Drawn after Heparin to prevent EDTA-induced potassium falsely high artifacts.",
  },
  {
    step: 6,
    name: "Fluoride / Oxalate Tube (Grey)",
    capColor: "Grey Top",
    capHex: "#64748B",
    additive: "Sodium Fluoride & Potassium Oxalate",
    inversions: "8–10 gentle inversions",
    department: "Clinical Biochemistry",
    tests: ["Fasting Plasma Glucose (FBS)", "Post-Prandial Glucose (PPBS)", "Oral Glucose Tolerance (OGTT)", "Blood Alcohol / Lactate"],
    rationale: "Fluoride inhibits enolase enzyme, preventing glycolysis in vitro so blood sugar values do not decay over time.",
    centrifugeRcf: "2000 g",
    centrifugeTime: "10 minutes",
    centrifugeTemp: "Ambient 20°C",
  },
];

export default function SampleOrderOfDrawGuide() {
  const [selectedStep, setSelectedStep] = useState<number>(3);
  const [rotorRadiusCm, setRotorRadiusCm] = useState<number>(15);
  const [calcRpm, setCalcRpm] = useState<number>(3500);

  // Formula: RCF (g) = 1.118 * 10^-5 * r * (RPM)^2
  const calculatedRcf = Math.round(1.118e-5 * rotorRadiusCm * Math.pow(calcRpm, 2));

  const activeTube = ORDER_OF_DRAW.find((t) => t.step === selectedStep) || ORDER_OF_DRAW[2];

  return (
    <div className="space-y-6">
      {/* Top Clinical Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-600" /> CLSI H3-A6 / ISO 15189 Standard
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Phlebotomy Quality Protocol
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
              Phlebotomy Order of Draw &amp; Centrifugation Protocol Engine
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl">
              Strict adherence to the universal vacuum tube sequence prevents anticoagulant cross-contamination, spurious hyperkalemia, and erroneous coagulation times.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Standard Protocols</span>
              <p className="text-xs font-black text-slate-800">6 Vacutainer Stages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Tube Sequence Strip & Deep Protocol Dossier */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Visual Steps List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
            Standard Order Sequence (Top to Bottom)
          </h3>
          <div className="space-y-2.5">
            {ORDER_OF_DRAW.map((tube) => {
              const isSelected = tube.step === selectedStep;
              return (
                <div
                  key={tube.step}
                  onClick={() => setSelectedStep(tube.step)}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? "border-sky-500 bg-sky-50/50 shadow-sm ring-2 ring-sky-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Realistic Vacutainer Tube Indicator */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className="h-5 w-4 rounded-t-sm shadow-sm border border-black/10"
                        style={{ backgroundColor: tube.capHex }}
                      />
                      <div className="h-7 w-3.5 rounded-b-md border border-t-0 border-slate-300 bg-gradient-to-b from-white/90 to-slate-100" />
                      <span className="absolute -left-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-black text-white">
                        {tube.step}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900">{tube.name}</h4>
                        {tube.centrifugeRcf && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                            Centrifuge
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{tube.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">
                      Step #{tube.step}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        isSelected ? "text-sky-600 translate-x-1" : "text-slate-300"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Tube Clinical Specification & Centrifuge Tool (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Tube Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm text-white font-black text-base"
                  style={{ backgroundColor: activeTube.capHex }}
                >
                  #{activeTube.step}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{activeTube.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                      {activeTube.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Additive: {activeTube.additive}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400">Inversions</span>
                <p className="text-xs font-black text-slate-800">{activeTube.inversions}</p>
              </div>
            </div>

            {/* Why This Position Rationale */}
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-900">Clinical Phlebotomy Rationale</p>
                  <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                    {activeTube.rationale}
                  </p>
                </div>
              </div>
            </div>

            {/* Tests Ordered In This Tube */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-500">Common Diagnostic Test Panels</span>
              <div className="flex flex-wrap gap-1.5">
                {activeTube.tests.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Centrifugation SOP */}
            {activeTube.centrifugeRcf ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Gauge className="h-4 w-4 text-sky-600" /> Laboratory Centrifugation Protocol
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-black">
                    Valid Centrifuge Setting
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Required RCF (g)</span>
                    <p className="mt-1 text-sm font-black text-slate-900">{activeTube.centrifugeRcf}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
                    <p className="mt-1 text-sm font-black text-slate-900">{activeTube.centrifugeTime}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Temperature</span>
                    <p className="mt-1 text-sm font-black text-slate-900">{activeTube.centrifugeTemp}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Whole Blood Specimen:</strong> Do NOT centrifuge this tube. Keep inverted gently and load directly onto hematology analyzer.
                </span>
              </div>
            )}
          </div>

          {/* Interactive Lab Centrifuge RPM <-> RCF (g-force) Calculator */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-sky-600" />
                  Centrifuge Rotor G-Force (RCF) Calculator
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify your benchtop centrifuge RPM produces the exact CLSI-required g-force (RCF)
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                RCF = 1.118 × 10⁻⁵ × r × RPM²
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rotor Radius (cm): <span className="text-sky-600 font-mono font-black">{rotorRadiusCm} cm</span>
                </label>
                <input
                  type="range"
                  min="8"
                  max="25"
                  step="0.5"
                  value={rotorRadiusCm}
                  onChange={(e) => setRotorRadiusCm(parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>8 cm (Compact)</span>
                  <span>15 cm (Benchtop)</span>
                  <span>25 cm (Floor Standing)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Centrifuge Speed (RPM): <span className="text-sky-600 font-mono font-black">{calcRpm} RPM</span>
                </label>
                <input
                  type="range"
                  min="1000"
                  max="6000"
                  step="100"
                  value={calcRpm}
                  onChange={(e) => setCalcRpm(parseInt(e.target.value, 10))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>1,000 RPM</span>
                  <span>3,500 RPM (Standard)</span>
                  <span>6,000 RPM</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-700">Calculated Centrifugal Force</span>
                <p className="text-2xl font-black text-sky-950 font-mono">
                  {calculatedRcf.toLocaleString()} <span className="text-sm font-bold text-sky-700">g (RCF)</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500">Clinical Suitability:</span>
                <p className="text-xs font-black text-emerald-700 mt-0.5">
                  {calculatedRcf >= 1800 && calculatedRcf <= 2500
                    ? "✓ Optimal for Serum SST Gel Separation"
                    : calculatedRcf < 1800
                    ? "⚠️ Sub-optimal for gel barrier (Increase RPM)"
                    : "⚠️ High force (Risk of tube breakage or hemolysis)"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
