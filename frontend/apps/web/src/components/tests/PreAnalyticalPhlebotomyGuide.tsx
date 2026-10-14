"use client";

import React, { useState } from "react";
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Thermometer,
  RotateCw,
  Info,
  Droplets,
  Search,
  ShieldCheck,
  Check,
  XCircle,
  FileCheck
} from "lucide-react";

interface DrawOrderItem {
  step: number;
  tubeType: string;
  capColor: string;
  additive: string;
  department: string;
  inversions: string;
  sampleTests: string[];
}

const ORDER_OF_DRAW: DrawOrderItem[] = [
  { step: 1, tubeType: "Blood Culture Bottles", capColor: "bg-yellow-500", additive: "SPS / Broth Media", department: "Microbiology & Blood Culture", inversions: "8 - 10 times", sampleTests: ["Aerobic Blood Culture", "Anaerobic Blood Culture", "Fungal Blood Culture"] },
  { step: 2, tubeType: "Sodium Citrate 3.2%", capColor: "bg-sky-500", additive: "Buffered 0.109M Sodium Citrate (9:1)", department: "Coagulation & Hemostasis", inversions: "3 - 4 gentle times", sampleTests: ["PT / INR", "aPTT", "D-Dimer", "Fibrinogen", "Thrombin Time"] },
  { step: 3, tubeType: "SST Gold / Plain Red", capColor: "bg-amber-500", additive: "Clot Activator & Polymer Gel Separator", department: "Clinical Biochemistry & Serology", inversions: "5 times (Let clot 30m)", sampleTests: ["Liver Function (LFT)", "Kidney Function (KFT)", "Lipid Profile", "Hepatitis Viral Markers"] },
  { step: 4, tubeType: "Lithium Heparin", capColor: "bg-emerald-600", additive: "Sodium / Lithium Heparin (Antithrombin)", department: "Emergency STAT Chemistry", inversions: "8 - 10 times", sampleTests: ["STAT Electrolytes", "Troponin I", "Blood Ammonia", "Arterial Blood Gas (ABG)"] },
  { step: 5, tubeType: "K2 / K3 EDTA Purple", capColor: "bg-purple-600", additive: "Dipotassium EDTA Chelating Agent", department: "Hematology & Molecular PCR", inversions: "8 - 10 times", sampleTests: ["Complete Blood Count (CBC)", "HbA1c", "Peripheral Blood Smear", "Blood Grouping (ABO/Rh)"] },
  { step: 6, tubeType: "Sodium Fluoride Grey", capColor: "bg-slate-500", additive: "Fluoride + Potassium Oxalate", department: "Clinical Chemistry (Glycolysis)", inversions: "8 - 10 times", sampleTests: ["Fasting Plasma Glucose", "Post-Prandial Glucose (PPBS)", "Oral Glucose Tolerance (GTT)"] },
];

export default function PreAnalyticalPhlebotomyGuide() {
  const [selectedTab, setSelectedTab] = useState<"draw-order" | "rejection-criteria" | "storage-matrix">("draw-order");

  return (
    <div className="space-y-6">
      {/* Light White Header Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                CLSI H3-A6 Standard Phlebotomy Protocol
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Hemolysis Quality Assurance
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-purple-600" />
              Pre-Analytical Phlebotomy &amp; Specimen Handling SOP Guide
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standardized order of blood draw, specimen stability temperatures, and sample rejection guidelines to ensure 100% analytical accuracy in hospital laboratories.
            </p>
          </div>

          <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-xs font-bold">
            <button
              onClick={() => setSelectedTab("draw-order")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTab === "draw-order" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Order of Draw (CLSI)
            </button>
            <button
              onClick={() => setSelectedTab("rejection-criteria")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTab === "rejection-criteria" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sample Rejection Criteria
            </button>
            <button
              onClick={() => setSelectedTab("storage-matrix")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTab === "storage-matrix" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Storage &amp; Centrifugation
            </button>
          </div>
        </div>

        {/* Tab 1: Order of Draw */}
        {selectedTab === "draw-order" && (
          <div className="mt-6 space-y-3">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Why Order of Draw Matters:</strong> Drawing tubes in the wrong sequence causes anticoagulant cross-contamination (e.g. EDTA carried over into a plain tube falsely binds calcium and spikes potassium values).
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {ORDER_OF_DRAW.map((tube) => (
                <div key={tube.step} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 transition-all space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white font-mono font-bold text-xs">
                      #{tube.step}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">Invert: {tube.inversions}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full shadow-xs ${tube.capColor}`} />
                    <h3 className="font-bold text-xs text-slate-900">{tube.tubeType}</h3>
                  </div>

                  <p className="text-[11px] text-slate-500">Additive: <strong className="text-slate-700">{tube.additive}</strong></p>

                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Common Tests:</span>
                    <div className="flex flex-wrap gap-1">
                      {tube.sampleTests.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Sample Rejection Criteria */}
        {selectedTab === "rejection-criteria" && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Gross Hemolysis (Pink/Red Serum)", cause: "Rupture of red blood cells during difficult draw, forceful plunger push, or small gauge needle.", impact: "Falsely elevates Potassium (K+), AST, LDH, and Phosphorus due to intracellular leakage.", action: "Reject sample & redraw immediate repeat tube." },
                { title: "Micro-Clots in EDTA Lavender Tube", cause: "Inadequate or delayed inversion mixing (must be inverted 8-10 times immediately after collection).", impact: "Falsely depletes platelet count (Pseudothrombocytopenia) and clogs hematology analyzer sample needle.", action: "Mandatory redraw required; do not analyze clotted tube." },
                { title: "Underfilled Sodium Citrate Coagulation Tube", cause: "Tube not filled to the etched indicator line (<90% filled).", impact: "Excess free liquid anticoagulant dilutes plasma, producing falsely prolonged PT/INR and aPTT.", action: "Sample must be filled exactly to the line (9:1 ratio)." },
                { title: "Severe Lipemic Serum (Milky White)", cause: "Non-fasting patient sample rich in chylomicrons/triglycerides (>1000 mg/dL).", impact: "Causes light scattering interference in spectrophotometric clinical chemistry assays.", action: "Perform high-speed ultracentrifugation clearing or request overnight fasting redraw." },
              ].map((rej) => (
                <div key={rej.title} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{rej.title}</span>
                  </div>
                  <p className="text-slate-600"><strong>Mechanism:</strong> {rej.cause}</p>
                  <p className="text-slate-600"><strong>Analytical Impact:</strong> {rej.impact}</p>
                  <div className="pt-2 border-t border-slate-200 font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>SOP Action: {rej.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Storage & Centrifugation */}
        {selectedTab === "storage-matrix" && (
          <div className="mt-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Thermometer className="w-4 h-4 text-amber-600" />
                  <span>Ambient Room Temp (18–25°C)</span>
                </div>
                <p className="text-slate-600">Routine hematology CBC (stable up to 8 hours), blood smears (make within 2 hours), coagulation citrate plasma (analyze within 4 hours).</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Thermometer className="w-4 h-4 text-blue-600" />
                  <span>Refrigerated (2–8°C)</span>
                </div>
                <p className="text-slate-600">Separated serum for LFT/KFT (stable up to 7 days), urine routine (preserve within 2h or refrigerate up to 24h), HbA1c (stable up to 7 days).</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Thermometer className="w-4 h-4 text-indigo-600" />
                  <span>Deep Frozen (-20°C / -80°C)</span>
                </div>
                <p className="text-slate-600">Specialized immunology hormones, Vitamin D, D-Dimer plasma, molecular DNA/RNA eluates. Avoid repeated freeze-thaw cycles.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <RotateCw className="w-4 h-4 text-slate-700" />
                <span>Centrifugation Standards</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Allow plain tubes with clot activator to clot completely for <strong>20 to 30 minutes</strong> at room temperature before centrifugation. Spin serum separator tubes (SST) at <strong>3,000 to 3,500 RPM (approx 1,500 RCF) for 10 minutes</strong> with swing-out rotor to form a tight, impermeable barrier between cells and serum.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
