export interface VacutainerTubeDefinition {
  code: string;
  name: string;
  shortName: string;
  specimenType: string;
  capColor: string;
  capColorHex: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  orderOfDraw: number;
  orderOfDrawLabel: string;
  inversions: string;
  minVolume: string;
  centrifugeGuide: string;
  clinicalWarning: string;
  additive: string;
  department: string;
  commonTests: string[];
}

export const CLSI_VACUTAINER_CATALOG: VacutainerTubeDefinition[] = [
  {
    code: "BLD-CULT",
    name: "Blood Culture Aerobic/Anaerobic Bottle",
    shortName: "Blood Culture",
    specimenType: "Whole Blood (Sterile)",
    capColor: "Yellow / Gold",
    capColorHex: "#EAB308",
    badgeBg: "bg-yellow-50",
    badgeText: "text-yellow-800",
    badgeBorder: "border-yellow-200",
    orderOfDraw: 1,
    orderOfDrawLabel: "1st in CLSI Order of Draw",
    inversions: "8–10 gentle inversions",
    minVolume: "8.0–10.0 mL",
    centrifugeGuide: "Do NOT Centrifuge — Incubate at 37°C",
    clinicalWarning: "Sterilize venipuncture site with 2% Chlorhexidine; draw first to prevent contamination.",
    additive: "Sodium Polyanethol Sulfonate (SPS) Broth",
    department: "Microbiology",
    commonTests: ["Blood Culture", "Sepsis Panel", "Bacteremia Screen"],
  },
  {
    code: "CIT-BLU",
    name: "Light Blue Top (3.2% Sodium Citrate)",
    shortName: "Citrate Blue",
    specimenType: "Citrated Plasma",
    capColor: "Light Blue",
    capColorHex: "#0284C7",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-800",
    badgeBorder: "border-sky-200",
    orderOfDraw: 2,
    orderOfDrawLabel: "2nd in CLSI Order of Draw",
    inversions: "3–4 gentle inversions",
    minVolume: "2.7 mL (Strict 9:1 Blood-to-Citrate Ratio)",
    centrifugeGuide: "1500 × g for 15 min (Platelet-Poor Plasma)",
    clinicalWarning: "Underfilling causes false prolongation of PT/INR & aPTT. Reject if <90% fill line.",
    additive: "3.2% Buffered Trisodium Citrate",
    department: "Coagulation",
    commonTests: ["PT/INR", "aPTT", "D-Dimer", "Fibrinogen", "Coagulation Profile"],
  },
  {
    code: "SST-GLD",
    name: "SST Gold Gel Separator Tube",
    shortName: "SST Gold",
    specimenType: "Serum",
    capColor: "Gold / Amber",
    capColorHex: "#F59E0B",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-200",
    orderOfDraw: 3,
    orderOfDrawLabel: "3rd in CLSI Order of Draw",
    inversions: "5 inversions (Clot Activator)",
    minVolume: "3.5 mL",
    centrifugeGuide: "1300–2000 × g for 10 min after 30m clotting",
    clinicalWarning: "Allow 30 minutes complete clot retraction prior to centrifugation to prevent fibrin strands.",
    additive: "Silica Clot Activator + Polymer Gel",
    department: "Biochemistry & Immunoassay",
    commonTests: ["LFT", "KFT", "Lipid Profile", "Thyroid Panel (TSH/FT4)", "Troponin-I", "Vitamin D"],
  },
  {
    code: "HEP-GRN",
    name: "Green Top (Lithium Heparin)",
    shortName: "Heparin Green",
    specimenType: "Heparinized Plasma / Whole Blood",
    capColor: "Green",
    capColorHex: "#10B981",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-800",
    badgeBorder: "border-emerald-200",
    orderOfDraw: 4,
    orderOfDrawLabel: "4th in CLSI Order of Draw",
    inversions: "8–10 inversions",
    minVolume: "3.0 mL",
    centrifugeGuide: "1300 × g for 10 min (Immediate STAT spin)",
    clinicalWarning: "Preferred for STAT electrolytes and arterial blood gas / ammonia.",
    additive: "Lithium Heparin (Spray-Coated)",
    department: "STAT Chemistry / Critical Care",
    commonTests: ["ABG", "STAT Electrolytes", "Ammonia", "Lactate", "Cytogenetics"],
  },
  {
    code: "EDTA-LAV",
    name: "Lavender Top (K2/K3 EDTA)",
    shortName: "EDTA Lavender",
    specimenType: "EDTA Whole Blood",
    capColor: "Lavender / Purple",
    capColorHex: "#8B5CF6",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-800",
    badgeBorder: "border-purple-200",
    orderOfDraw: 5,
    orderOfDrawLabel: "5th in CLSI Order of Draw",
    inversions: "8–10 gentle inversions immediately",
    minVolume: "2.0–3.0 mL",
    centrifugeGuide: "Do NOT Centrifuge for CBC / HbA1c",
    clinicalWarning: "Invert immediately to prevent micro-clots and platelet clumping; never draw before SST/Electrolytes (K+ carry-over).",
    additive: "Spray-Dried K2 EDTA",
    department: "Hematology & HPLC",
    commonTests: ["CBC", "Complete Hemogram", "HbA1c", "ESR", "Peripheral Smear", "Malaria", "Blood Group"],
  },
  {
    code: "FLU-GRY",
    name: "Grey Top (Sodium Fluoride / K-Oxalate)",
    shortName: "Fluoride Grey",
    specimenType: "Fluoride Plasma",
    capColor: "Grey",
    capColorHex: "#64748B",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800",
    badgeBorder: "border-slate-300",
    orderOfDraw: 6,
    orderOfDrawLabel: "6th in CLSI Order of Draw",
    inversions: "8–10 inversions",
    minVolume: "2.0 mL",
    centrifugeGuide: "1300 × g for 10 min",
    clinicalWarning: "Antiglycolytic agent preserves blood glucose stability for up to 24 hours.",
    additive: "Sodium Fluoride + Potassium Oxalate",
    department: "Clinical Biochemistry",
    commonTests: ["Fasting Blood Sugar (FBS)", "Post-Prandial Glucose (PPBS)", "Random Glucose (RBS)", "GTT"],
  },
  {
    code: "URN-CUP",
    name: "Sterile Wide-Mouth Urine Container",
    shortName: "Sterile Urine Cup",
    specimenType: "Mid-Stream Urine",
    capColor: "Yellow Sterile Cap",
    capColorHex: "#CA8A04",
    badgeBg: "bg-yellow-50",
    badgeText: "text-yellow-800",
    badgeBorder: "border-yellow-200",
    orderOfDraw: 7,
    orderOfDrawLabel: "Non-Blood Sterile Specimen",
    inversions: "Swirl gently",
    minVolume: "15.0 mL",
    centrifugeGuide: "400 × g for 5 min for urinary sediment",
    clinicalWarning: "Process within 2 hours of collection or refrigerate at 2–8°C.",
    additive: "None (Sterile Container)",
    department: "Clinical Pathology & Microbiology",
    commonTests: ["Urine Routine & Microscopy", "Urine Culture & Sensitivity", "Microalbumin"],
  },
];

export function detectRequiredTubes(tests?: Array<any>): VacutainerTubeDefinition[] {
  if (!tests || tests.length === 0) {
    return [CLSI_VACUTAINER_CATALOG[2], CLSI_VACUTAINER_CATALOG[4]];
  }

  const matched = new Map<string, VacutainerTubeDefinition>();

  for (const t of tests) {
    const text = `${t?.testName || ""} ${t?.testCode || ""} ${t?.sampleType || ""} ${t?.sampleContainer || ""} ${t?.category || ""}`.toLowerCase();

    if (/cbc|hemogram|hba1c|esr|platelet|hemoglobin|edta|lavender|malaria|smear/.test(text)) {
      matched.set("EDTA-LAV", CLSI_VACUTAINER_CATALOG[4]);
    } else if (/pt|inr|aptt|coag|dimer|fibrinogen|citrate|blue/.test(text)) {
      matched.set("CIT-BLU", CLSI_VACUTAINER_CATALOG[1]);
    } else if (/fbs|ppbs|rbs|glucose|sugar|gtt|fluoride|grey/.test(text)) {
      matched.set("FLU-GRY", CLSI_VACUTAINER_CATALOG[5]);
    } else if (/abg|blood gas|heparin|lactate|ammonia/.test(text)) {
      matched.set("HEP-GRN", CLSI_VACUTAINER_CATALOG[3]);
    } else if (/urine|urinalysis/.test(text)) {
      matched.set("URN-CUP", CLSI_VACUTAINER_CATALOG[6]);
    } else if (/blood culture|bact/.test(text)) {
      matched.set("BLD-CULT", CLSI_VACUTAINER_CATALOG[0]);
    } else {
      matched.set("SST-GLD", CLSI_VACUTAINER_CATALOG[2]);
    }
  }

  return [...matched.values()].sort((a, b) => a.orderOfDraw - b.orderOfDraw);
}

export function formatTubeBarcode(uhidOrOrderCode?: string, tubeCode = "SST"): string {
  const cleanBase = String(uhidOrOrderCode || "LC-2026")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();
  const cleanTube = String(tubeCode || "SST")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase();
  return `BC-${cleanBase}-${cleanTube}`;
}
