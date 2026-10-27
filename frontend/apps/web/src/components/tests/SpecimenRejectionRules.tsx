"use client";

import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Droplets,
  Clock,
  Search,
  Filter,
  FileCheck,
  Send,
  RotateCcw,
  Info,
  Thermometer,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface RejectionRule {
  id: string;
  defectCategory: "SERUM_INDICES" | "TUBE_INTEGRITY" | "ANTICOAGULANT" | "TRANSIT_DELAY";
  title: string;
  severity: "CRITICAL_REJECT" | "WARN_DOCUMENT" | "CONDITIONAL_ACCEPT";
  visualIndicator: string;
  affectedAnalytes: string[];
  mechanismOfInterference: string;
  mandatoryAction: string;
  clsiStandard: string;
}

const REJECTION_RULES: RejectionRule[] = [
  {
    id: "rej-1",
    defectCategory: "SERUM_INDICES",
    title: "Severe Hemolysis (H-Index > 500 mg/dL)",
    severity: "CRITICAL_REJECT",
    visualIndicator: "Cherry red / bright pink serum/plasma after centrifugation",
    affectedAnalytes: ["Potassium (K+)", "LDH", "AST (SGOT)", "Magnesium", "Phosphorus", "Troponin I", "Iron"],
    mechanismOfInterference: "Intracellular erythrocyte lysis releases massive amounts of Potassium and LDH into plasma (RBC K+ is 25× higher than serum K+), causing dangerous pseudo-hyperkalemia.",
    mandatoryAction: "100% Reject for Potassium & LDH. Flag physician immediately. Request fresh atraumatic venipuncture redraw (no butterfly 25G needle).",
    clsiStandard: "CLSI C56-A / CAP Pre-Analytical Metric",
  },
  {
    id: "rej-2",
    defectCategory: "SERUM_INDICES",
    title: "Gross Lipemia (L-Index > 300 mg/dL)",
    severity: "CONDITIONAL_ACCEPT",
    visualIndicator: "Milky, opaque, turbid emulsion (chylomicrons / triglycerides)",
    affectedAnalytes: ["Electrolytes (Indirect ISE)", "Total Protein", "Amylase", "Hemoglobin Photometry"],
    mechanismOfInterference: "Chylomicrons cause light scattering in spectrophotometers and displace plasma water, causing pseudo-hyponatremia on indirect ISE analyzers.",
    mandatoryAction: "Perform high-speed ultracentrifugation (airfuge) to clear lipid layer before testing, or run on Direct ISE analyzer. Document L-Index on report.",
    clsiStandard: "CLSI C56-A Serum Interference Standard",
  },
  {
    id: "rej-3",
    defectCategory: "SERUM_INDICES",
    title: "Severe Icterus (I-Index > 20 mg/dL)",
    severity: "WARN_DOCUMENT",
    visualIndicator: "Dark amber, golden brown, or olive green serum/plasma (conjugated bilirubin)",
    affectedAnalytes: ["Creatinine (Alkaline Picrate Jaffé)", "Cholesterol", "Glucose Oxidase", "Total Protein"],
    mechanismOfInterference: "Bilirubin consumes hydrogen peroxide intermediates and exhibits spectral overlap at 500-540 nm wavelengths.",
    mandatoryAction: "Run Enzymatic Creatinine (PAP method) instead of Jaffé. Document elevated I-Index and append clinical interpretive comment.",
    clsiStandard: "CLSI C56-A Clinical Chemistry Guidelines",
  },
  {
    id: "rej-4",
    defectCategory: "TUBE_INTEGRITY",
    title: "Clotted EDTA Whole Blood / Coagulation Citrate",
    severity: "CRITICAL_REJECT",
    visualIndicator: "Visible fibrin clot, gelatinous string, or microclots on wooden applicator stick",
    affectedAnalytes: ["Complete Blood Count (CBC)", "Platelet Count", "PT / INR", "aPTT", "ESR"],
    mechanismOfInterference: "Fibrin mesh traps platelets and leukocytes, causing profound pseudo-thrombocytopenia and consumption of coagulation factors.",
    mandatoryAction: "Immediate sample cancellation. Mandatory telephone alert to nursing ward. Never attempt to run clotted specimen through automated hematology analyzer.",
    clsiStandard: "CLSI H04-A6 Hematology Specimen Standard",
  },
  {
    id: "rej-5",
    defectCategory: "TUBE_INTEGRITY",
    title: "Quantity Not Sufficient (QNS / Underfilled Tube)",
    severity: "CRITICAL_REJECT",
    visualIndicator: "Specimen volume below minimum fill indicator mark on vacuum tube",
    affectedAnalytes: ["All automated panel tests requiring minimal dead volume (250 µL)"],
    mechanismOfInterference: "Analyzer aspiration needle requires specific immersion depth to prevent bubble suction and probe crash. Excess anticoagulant ratio causes cell shrinkage.",
    mandatoryAction: "Reject tube. Log as QNS in LIS accession. Issue redraw requisition with specific volume guideline (min 2.5 mL for EDTA, 3.5 mL for SST).",
    clsiStandard: "CLSI GP44-A4 Procedures for Specimen Handling",
  },
  {
    id: "rej-6",
    defectCategory: "ANTICOAGULANT",
    title: "Sodium Citrate Coagulation Underfill (<90% Nominal Volume)",
    severity: "CRITICAL_REJECT",
    visualIndicator: "Light blue vacutainer filled below arrow tolerance marker (less than 9:1 blood to citrate)",
    affectedAnalytes: ["Prothrombin Time (PT/INR)", "aPTT", "D-Dimer", "Fibrinogen"],
    mechanismOfInterference: "Underfilled citrate leaves excess unbound citrate anticoagulant, which binds reagent calcium ions in the coagulation test, causing falsely prolonged clotting times.",
    mandatoryAction: "Strict zero-tolerance reject. Tube must be filled within ±10% of manufacturer fill line. Use discard tube first if using butterfly set.",
    clsiStandard: "CLSI H21-A5 Coagulation Specimen Collection",
  },
  {
    id: "rej-7",
    defectCategory: "ANTICOAGULANT",
    title: "Order of Draw Contamination (EDTA Carryover into Serum/Heparin)",
    severity: "CRITICAL_REJECT",
    visualIndicator: "Clinically impossible laboratory pattern: Severe Hyperkalemia (>7.0) with Severe Hypocalcemia (<5.0)",
    affectedAnalytes: ["Serum Calcium", "Serum Potassium", "Alkaline Phosphatase (ALP)", "Magnesium"],
    mechanismOfInterference: "K2/K3 EDTA additive carryover from drawing purple tube before gold/red tube. EDTA chelates Calcium and Magnesium to zero while adding Potassium.",
    mandatoryAction: "Immediate laboratory alert. Check phlebotomy sequence. Cancel results and dispatch urgent redraw under supervisor observation.",
    clsiStandard: "CLSI H3-A6 Order of Blood Draw Standard",
  },
  {
    id: "rej-8",
    defectCategory: "TRANSIT_DELAY",
    title: "Uncentrifuged Specimen Delay > 4 Hours without Cold-Chain",
    severity: "CRITICAL_REJECT",
    visualIndicator: "Whole blood in plain or SST tube remaining in ambient transport box > 4 hours",
    affectedAnalytes: ["Glucose (Glycolysis)", "Potassium", "Phosphorus", "Enzymes (ALT, AST)", "Blood Gases"],
    mechanismOfInterference: "Living red blood cells continuously metabolize glucose (glycolysis decreases glucose 5-7% per hour) and cellular ATP depletion causes potassium leakage.",
    mandatoryAction: "Reject for glucose and electrolytes. For off-site collection centers, insist on on-site centrifugation within 2 hours or Sodium Fluoride grey tubes.",
    clsiStandard: "ISO 15189:2022 Specimen Transport Standard",
  },
];

export default function SpecimenRejectionRules() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeDefectSimulator, setActiveDefectSimulator] = useState<string | null>(null);

  const filteredRules = useMemo(() => {
    return REJECTION_RULES.filter((rule) => {
      if (selectedCategory !== "ALL" && rule.defectCategory !== selectedCategory) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          rule.title.toLowerCase().includes(q) ||
          rule.visualIndicator.toLowerCase().includes(q) ||
          rule.affectedAnalytes.some((a) => a.toLowerCase().includes(q)) ||
          rule.mechanismOfInterference.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Light White Header Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                CLSI GP44-A4 &amp; ISO 15189 Quality Standard
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                CAP Pre-Analytical Safety
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              Pre-Analytical Specimen Integrity &amp; Rejection Protocol
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Standardized rejection rules and interference criteria for hemolyzed, icteric, lipemic, clotted, underfilled, and contaminated specimens to protect clinical decision-making.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              Active Criteria: <strong className="text-slate-900">{REJECTION_RULES.length} Standards</strong>
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search defect, analyte (e.g. Potassium), mechanism, or criteria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto">
            {[
              { id: "ALL", label: "All Rules" },
              { id: "SERUM_INDICES", label: "HIL Indices" },
              { id: "TUBE_INTEGRITY", label: "Tube & Clot" },
              { id: "ANTICOAGULANT", label: "Anticoagulants" },
              { id: "TRANSIT_DELAY", label: "Transit Delay" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => {
          const isCritical = rule.severity === "CRITICAL_REJECT";
          const isWarn = rule.severity === "WARN_DOCUMENT";

          return (
            <div
              key={rule.id}
              className={`rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md space-y-4 ${
                isCritical
                  ? "border-rose-200/90"
                  : isWarn
                  ? "border-amber-200/90"
                  : "border-blue-200/90"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isCritical
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : isWarn
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-blue-100 text-blue-800 border border-blue-300"
                      }`}
                    >
                      {isCritical ? "Strict Rejection" : isWarn ? "Document & Warn" : "Conditional"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {rule.clsiStandard}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-950 leading-snug">
                    {rule.title}
                  </h3>
                </div>

                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                    isCritical
                      ? "bg-rose-50 text-rose-600"
                      : isWarn
                      ? "bg-amber-50 text-amber-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {isCritical ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                </div>
              </div>

              {/* Visual Indicator */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-xs">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Visual Appearance:
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {rule.visualIndicator}
                </span>
              </div>

              {/* Mechanism */}
              <div className="text-xs space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Interference Pathophysiology:
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {rule.mechanismOfInterference}
                </p>
              </div>

              {/* Affected Analytes */}
              <div className="text-xs space-y-1.5 pt-1 border-t border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Invalidated Analytes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {rule.affectedAnalytes.map((analyte) => (
                    <span
                      key={analyte}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200"
                    >
                      {analyte}
                    </span>
                  ))}
                </div>
              </div>

              {/* Protocol Action Box */}
              <div
                className={`rounded-xl p-3 text-xs font-medium space-y-1 ${
                  isCritical
                    ? "bg-rose-50/70 border border-rose-200 text-rose-900"
                    : "bg-amber-50/70 border border-amber-200 text-amber-900"
                }`}
              >
                <span className="block text-[10px] font-bold uppercase tracking-wider">
                  Mandatory Lab Action:
                </span>
                <p>{rule.mandatoryAction}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
