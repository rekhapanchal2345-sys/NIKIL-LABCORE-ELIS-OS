/**
 * LabCore ELIS LIS - Phlebotomy & Vacutainer Specimen Reference Engine
 * Grounded in CLSI H3-A6, ISO 15189:2022, CAP, and WHO Phlebotomy Guidelines.
 * Standardizes diagnostic vacutainer selection, pre-analytical mixing, order of draw,
 * minimum sample volume, and automated barcode accessioning.
 */

export interface VacutainerTubeDefinition {
  id: string;
  code: string;
  name: string;
  shortName: string;
  capColor: string;
  capColorHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  orderOfDraw: number; // CLSI H3-A6 Sequence (1 to 8, or 99 for non-blood)
  orderOfDrawLabel: string;
  additive: string;
  mechanism: string;
  specimenType: string;
  commonTests: string[];
  inversions: string;
  inversionCount: number;
  minVolume: string;
  centrifugeGuide: string;
  clinicalWarning: string;
  storageTemp: string;
}

export const CLSI_VACUTAINER_CATALOG: VacutainerTubeDefinition[] = [
  {
    id: "tube-citrate-blue",
    code: "CITR",
    name: "Buffered Sodium Citrate 3.2% (0.109 M)",
    shortName: "Sodium Citrate 3.2%",
    capColor: "Light Blue",
    capColorHex: "#0284C7", // Sky Blue
    badgeBg: "bg-sky-50",
    badgeBorder: "border-sky-300",
    badgeText: "text-sky-800",
    orderOfDraw: 2,
    orderOfDrawLabel: "CLSI Step 2 (Coagulation)",
    additive: "3.2% (0.109 mol/L) Buffered Sodium Citrate",
    mechanism: "Reversibly chelates calcium; preserved for optical/mechanical clot time measurement upon recalcification.",
    specimenType: "Citrated Plasma (Platelet-Poor)",
    commonTests: ["PT / INR", "aPTT / PTT", "D-Dimer", "Plasma Fibrinogen", "Thrombin Time", "Factor VIII / IX", "Lupus Anticoagulant"],
    inversions: "3 - 4 gentle 180° inversions",
    inversionCount: 4,
    minVolume: "2.7 mL (Exact fill to indicator line required - 9:1 ratio)",
    centrifugeGuide: "Centrifuge at 1500 RCF for 15 minutes within 1 hour to yield platelet-poor plasma (<10,000/µL).",
    clinicalWarning: "CRITICAL: Strict 9:1 blood-to-citrate ratio required. Underfilling (<90%) creates excess unbound citrate, falsely prolonging PT/INR. If using butterfly needle, always draw a discard tube first to purge air.",
    storageTemp: "Test within 4 hours at 18-25°C. For deferred testing, separate plasma and freeze at -70°C.",
  },
  {
    id: "tube-sst-gold",
    code: "SERUM",
    name: "Serum Gel Clot Activator (SST II Advance)",
    shortName: "SST Gel / Serum",
    capColor: "Gold / Red",
    capColorHex: "#D97706", // Amber / Gold
    badgeBg: "bg-amber-50",
    badgeBorder: "border-amber-300",
    badgeText: "text-amber-800",
    orderOfDraw: 3,
    orderOfDrawLabel: "CLSI Step 3 (Serum / Chemistry)",
    additive: "Silica micro-crystals (clot activator) + Polyester barrier gel",
    mechanism: "Silica accelerates intrinsic clotting; polymer gel with specific gravity between clot and serum moves during spin to form hermetic barrier.",
    specimenType: "Serum (Clotted)",
    commonTests: ["Liver Function (LFT)", "Kidney Function (KFT/RFT)", "Lipid Profile", "Thyroid (T3, T4, TSH)", "Cardiac Troponin", "Electrolytes (Na, K, Cl)", "Ferritin & B12", "Hepatitis & HIV Serology", "Tumor Markers (PSA, CA-125)"],
    inversions: "5 gentle 180° inversions",
    inversionCount: 5,
    minVolume: "3.5 - 5.0 mL whole blood",
    centrifugeGuide: "Allow upright clotting for 30 minutes at 20-25°C. Spin in swing-bucket centrifuge at 2000-3000 RCF for 10 minutes.",
    clinicalWarning: "Do not centrifuge prematurely (<30 min); residual fibrin strands will aspirate into analyzer probes. Avoid freezing tube on gel (pipette serum off gel before deep freezing).",
    storageTemp: "Stable 48 hours at 2-8°C. Long-term: aliquot serum and freeze at -20°C.",
  },
  {
    id: "tube-plain-red",
    code: "RED",
    name: "Plain Clot Activator (Glass / Silicone No-Gel)",
    shortName: "Plain Red Top",
    capColor: "Red",
    capColorHex: "#DC2626", // Red
    badgeBg: "bg-red-50",
    badgeBorder: "border-red-300",
    badgeText: "text-red-800",
    orderOfDraw: 3,
    orderOfDrawLabel: "CLSI Step 3 (Plain Serum / TDM)",
    additive: "Silica clot activator (zero gel)",
    mechanism: "Promotes rapid physiological clot formation without gel absorption interference for therapeutic drug monitoring.",
    specimenType: "Pure Serum",
    commonTests: ["Therapeutic Drug Monitoring (Phenytoin, Digoxin, Lithium, Valproate)", "Blood Bank Crossmatch", "Antibody Screening", "Specialized Autoimmune Panels"],
    inversions: "5 gentle 180° inversions",
    inversionCount: 5,
    minVolume: "4.0 - 6.0 mL whole blood",
    centrifugeGuide: "Allow 30-60 min complete clotting upright. Centrifuge at 2000 RCF for 10 minutes. Pipette serum into secondary aliquot tube.",
    clinicalWarning: "Preferred for lipophilic drug assays and blood bank compatibility testing where gel might bind target analytes.",
    storageTemp: "Refrigerate at 2-8°C up to 7 days.",
  },
  {
    id: "tube-heparin-green",
    code: "HEPA",
    name: "Lithium Heparin / Sodium Heparin",
    shortName: "Heparin Plasma",
    capColor: "Green",
    capColorHex: "#16A34A", // Emerald
    badgeBg: "bg-emerald-50",
    badgeBorder: "border-emerald-300",
    badgeText: "text-emerald-800",
    orderOfDraw: 4,
    orderOfDrawLabel: "CLSI Step 4 (STAT Chemistry)",
    additive: "Spray-dried Lithium Heparin (14-30 USP Units/mL)",
    mechanism: "Enhances Antithrombin III activity, neutralizing thrombin and preventing fibrin formation for instant plasma separation.",
    specimenType: "Heparinized Plasma / Whole Blood",
    commonTests: ["STAT Cardiac Markers (Troponin I/T)", "Arterial / Venous Blood Gas (ABG/VBG)", "Plasma Ammonia", "Electrolytes STAT", "Flow Cytometry", "Chromosome Karyotyping"],
    inversions: "8 - 10 gentle 180° inversions",
    inversionCount: 8,
    minVolume: "3.0 - 4.0 mL whole blood",
    centrifugeGuide: "Can be centrifuged immediately without waiting for clotting! Spin at 2000-3000 RCF for 10 minutes.",
    clinicalWarning: "Use Lithium Heparin for routine chemistry (Sodium Heparin invalidates electrolyte sodium readings). Ammonia requires immediate placement on wet ice slurry and analysis within 30 min.",
    storageTemp: "Analyze immediately for blood gas/ammonia; stable 24h at 2-8°C for routine chemistry.",
  },
  {
    id: "tube-edta-purple",
    code: "EDTA",
    name: "K2 / K3 EDTA Whole Blood",
    shortName: "EDTA Lavender",
    capColor: "Lavender",
    capColorHex: "#9333EA", // Purple
    badgeBg: "bg-purple-50",
    badgeBorder: "border-purple-300",
    badgeText: "text-purple-800",
    orderOfDraw: 5,
    orderOfDrawLabel: "CLSI Step 5 (Hematology)",
    additive: "Dipotassium (K2) EDTA (1.8 mg/mL blood)",
    mechanism: "Irreversibly binds and chelates divalent calcium ions, halting coagulation while preserving cellular morphology and size.",
    specimenType: "EDTA Whole Blood",
    commonTests: ["Complete Blood Count (CBC / Hemogram)", "Peripheral Blood Smear (PBS)", "HbA1c (Glycated Hemoglobin)", "Erythrocyte Sedimentation Rate (ESR)", "Blood Group & Rh Typing", "Malaria Antigen / Smear", "Reticulocyte Count", "Direct Coomb's Test (DCT)"],
    inversions: "8 - 10 gentle 180° inversions immediately",
    inversionCount: 10,
    minVolume: "2.0 - 3.0 mL whole blood",
    centrifugeGuide: "DO NOT CENTRIFUGE for CBC, ESR, or smear. Run as well-mixed whole blood. Centrifuge only if plasma is specifically requested for viral load.",
    clinicalWarning: "Invert immediately upon filling. Micro-clots trap platelets and WBCs, producing pseudo-thrombocytopenia and analyzer orifice blockages. Never freeze whole blood (causes hemolysis). Prepare peripheral smear within 4 hours.",
    storageTemp: "Room temperature 18-25°C for up to 6 hours for CBC; 2-8°C up to 24 hours. HbA1c stable at 2-8°C for 7 days.",
  },
  {
    id: "tube-fluoride-grey",
    code: "FLUO",
    name: "Sodium Fluoride / Potassium Oxalate",
    shortName: "Fluoride Grey",
    capColor: "Grey",
    capColorHex: "#64748B", // Slate
    badgeBg: "bg-slate-50",
    badgeBorder: "border-slate-300",
    badgeText: "text-slate-800",
    orderOfDraw: 6,
    orderOfDrawLabel: "CLSI Step 6 (Glycolysis Inhibitor)",
    additive: "Sodium Fluoride (2.5 mg/mL) + Potassium Oxalate (2.0 mg/mL)",
    mechanism: "Fluoride ion inhibits enolase enzyme in the Embden-Meyerhof pathway, halting red cell glucose consumption; oxalate acts as anticoagulant.",
    specimenType: "Fluoride Plasma",
    commonTests: ["Fasting Blood Sugar (FBS)", "Post-Prandial Blood Sugar (PPBS)", "Oral Glucose Tolerance Test (OGTT)", "Gestational Diabetes (GDM) Screen", "Blood Lactate (Chilled)"],
    inversions: "8 - 10 gentle 180° inversions",
    inversionCount: 8,
    minVolume: "2.0 mL whole blood",
    centrifugeGuide: "Spin at 2000 RCF for 10 minutes within 2 hours of draw.",
    clinicalWarning: "Without sodium fluoride, RBCs consume in-vitro glucose at 5-7% per hour (~10 mg/dL/hr) at room temperature, causing dangerous false normoglycemia in diabetic screening.",
    storageTemp: "Plasma stable for 24 hours at room temp, up to 72 hours at 2-8°C.",
  },
  {
    id: "tube-acd-yellow",
    code: "ACD",
    name: "Acid Citrate Dextrose (ACD Solution A/B)",
    shortName: "ACD Pale Yellow",
    capColor: "Pale Yellow",
    capColorHex: "#CA8A04", // Dark Yellow
    badgeBg: "bg-yellow-50",
    badgeBorder: "border-yellow-300",
    badgeText: "text-yellow-800",
    orderOfDraw: 7,
    orderOfDrawLabel: "CLSI Step 7 (Molecular / HLA)",
    additive: "Trisodium citrate, citric acid, and dextrose",
    mechanism: "Citrate prevents coagulation; dextrose nourishes cellular metabolism to preserve viable leukocytes and intact genomic DNA.",
    specimenType: "ACD Whole Blood",
    commonTests: ["HLA Phenotyping / Tissue Crossmatch", "DNA Extraction & Molecular Genetics", "Paternity Testing", "Stem Cell Enumeration"],
    inversions: "8 - 10 gentle 180° inversions",
    inversionCount: 8,
    minVolume: "6.0 - 8.5 mL whole blood",
    centrifugeGuide: "Do not centrifuge unless isolating buffy coat. Keep at 15-25°C; do not refrigerate or freeze if viable cells are needed.",
    clinicalWarning: "Preferred over heparin for PCR because heparin inhibits Taq polymerase enzymes used in DNA amplification.",
    storageTemp: "Transport at room temperature (18-25°C) within 24-48 hours.",
  },
  {
    id: "tube-trace-blue",
    code: "TRACE",
    name: "Trace Element Free K2 EDTA (Royal Blue)",
    shortName: "Trace Royal Blue",
    capColor: "Royal Blue",
    capColorHex: "#1D4ED8", // Royal Blue
    badgeBg: "bg-blue-50",
    badgeBorder: "border-blue-300",
    badgeText: "text-blue-800",
    orderOfDraw: 8,
    orderOfDrawLabel: "CLSI Step 8 (Trace Elements)",
    additive: "Certified Trace-Element Free with K2 EDTA (or Plain)",
    mechanism: "Specially acid-washed interior and chemically pure butyl stoppers guaranteed < 5 ppb background heavy metals.",
    specimenType: "Trace Element Whole Blood / Serum",
    commonTests: ["Blood Lead Level (Pb)", "Arsenic (As)", "Cadmium (Cd)", "Mercury (Hg)", "Serum Zinc (Zn)", "Copper (Cu)", "Toxicology Screens"],
    inversions: "8 - 10 gentle 180° inversions",
    inversionCount: 8,
    minVolume: "4.0 - 6.0 mL whole blood",
    centrifugeGuide: "Follow specific test protocol (Whole blood for Lead; spin 10 min at 2000 RCF for serum trace elements).",
    clinicalWarning: "Standard rubber stoppers release zinc and lead; ONLY certified Royal Blue tubes may be used for clinical heavy metal analysis.",
    storageTemp: "Stable 7 days at 2-8°C.",
  },
  {
    id: "tube-esr-black",
    code: "BESR",
    name: "Sodium Citrate 4:1 (Automated Westergren ESR)",
    shortName: "Citrate 4:1 Black",
    capColor: "Black",
    capColorHex: "#0F172A", // Dark Slate / Black
    badgeBg: "bg-slate-100",
    badgeBorder: "border-slate-400",
    badgeText: "text-slate-900",
    orderOfDraw: 2,
    orderOfDrawLabel: "CLSI Step 2 (ESR Westergren)",
    additive: "Buffered Sodium Citrate 4:1 (4 parts blood to 1 part citrate solution)",
    mechanism: "Provides the standardized 4:1 dilution required by the International Council for Standardization in Haematology (ICSH) for automated Westergren ESR sedimentometers.",
    specimenType: "Diluted Whole Blood",
    commonTests: ["Automated Westergren ESR (1-Hour Erythrocyte Sedimentation Rate)"],
    inversions: "8 - 10 gentle 180° inversions",
    inversionCount: 8,
    minVolume: "Exact fill to 1.6 mL or 2.4 mL marked indicator ring",
    centrifugeGuide: "DO NOT CENTRIFUGE. Insert tube directly into automated infrared ESR analyzer (e.g., Alifax / Sedline).",
    clinicalWarning: "Must be filled to exact fill ring. Over or underfill alters dilution ratio, severely corrupting ESR sedimentation velocity.",
    storageTemp: "Must be tested within 4 hours at room temperature, or 24 hours at 2-8°C.",
  },
  {
    id: "container-urine-sterile",
    code: "URINE",
    name: "Sterile Universal Specimen Cup (Yellow Cap)",
    shortName: "Sterile Urine Cup",
    capColor: "Yellow Cup",
    capColorHex: "#EAB308", // Yellow Cap
    badgeBg: "bg-yellow-50",
    badgeBorder: "border-yellow-300",
    badgeText: "text-yellow-800",
    orderOfDraw: 99,
    orderOfDrawLabel: "Non-Blood Specimen (Cup)",
    additive: "Sterile - Non-preserved (or optional Boric Acid for delayed culture)",
    mechanism: "Wide-mouth container for clean-catch midstream urine or aspirated body fluids.",
    specimenType: "Clean-Catch Midstream Urine",
    commonTests: ["Urine Routine & Microscopy (Urine R/M)", "Urine Culture & Sensitivity (Urine C&S)", "24-Hour Urinary Protein / Creatinine", "Urinary Microalbumin", "Urine Pregnancy Test (hCG)", "Urinary Drug of Abuse Panel"],
    inversions: "Swirl gently 3 times prior to dipping test strip or aliquot",
    inversionCount: 3,
    minVolume: "15 - 30 mL midstream urine",
    centrifugeGuide: "Centrifuge 10 mL aliquot at 1500-2000 RPM for 5 minutes for microscopic sediment examination.",
    clinicalWarning: "Patient instruction is paramount: discard initial 20 mL stream, collect midstream without touching interior of container. Culture must be plated within 2 hours or refrigerated at 2-8°C immediately.",
    storageTemp: "Refrigerate at 2-8°C if processing is delayed beyond 1 hour.",
  },
  {
    id: "container-vtm-swab",
    code: "SWAB",
    name: "Viral Transport Medium (VTM) Swab",
    shortName: "VTM Swab",
    capColor: "Red Cap Swab",
    capColorHex: "#E11D48", // Rose Red
    badgeBg: "bg-rose-50",
    badgeBorder: "border-rose-300",
    badgeText: "text-rose-800",
    orderOfDraw: 99,
    orderOfDrawLabel: "Non-Blood Specimen (Swab)",
    additive: "Modified Hanks Balanced Salt Solution + Gelatin + Gentamicin + Amphotericin B",
    mechanism: "Cryoprotective and antibiotic medium preventing bacterial overgrowth while preserving viral nucleocapsid integrity for nucleic acid amplification.",
    specimenType: "Nasopharyngeal / Oropharyngeal Swab",
    commonTests: ["RT-PCR COVID-19", "Influenza A & B Panel", "Respiratory Syncytial Virus (RSV)", "HSV-1 / HSV-2 PCR", "Monkeypox / Varicella Swab"],
    inversions: "Break swab shaft into vial, screw cap tightly, invert 3 times",
    inversionCount: 3,
    minVolume: "Single Dacron/Flocked swab immersed in 3.0 mL VTM fluid",
    centrifugeGuide: "Do not centrifuge. Vortex 10 seconds before molecular nucleic acid extraction.",
    clinicalWarning: "Use synthetic flocked swabs (Dacron/Polyester). NEVER use calcium alginate swabs or wooden shafts as they contain PCR inhibitors.",
    storageTemp: "Refrigerate at 2-8°C up to 72 hours. Deep freeze at -70°C for longer storage.",
  },
];

/**
 * Intelligently maps an array of test names / orders to the exact set of
 * CLSI vacutainer tubes required, sorted strictly according to Order of Draw!
 */
export function detectRequiredTubes(tests: Array<{ testName: string; sampleType?: string }>): VacutainerTubeDefinition[] {
  if (!tests || tests.length === 0) {
    // Default standard clinical phlebotomy panel: EDTA Lavender + SST Gold + Fluoride Grey
    return [
      CLSI_VACUTAINER_CATALOG.find((t) => t.code === "CITR")!,
      CLSI_VACUTAINER_CATALOG.find((t) => t.code === "SERUM")!,
      CLSI_VACUTAINER_CATALOG.find((t) => t.code === "EDTA")!,
      CLSI_VACUTAINER_CATALOG.find((t) => t.code === "FLUO")!,
    ].filter(Boolean);
  }

  const detectedCodes = new Set<string>();

  tests.forEach((t) => {
    const name = (t.testName || "").toUpperCase();
    const sample = (t.sampleType || "").toUpperCase();

    // 1. Citrate 3.2% Light Blue (Coagulation)
    if (
      name.includes("PT") ||
      name.includes("INR") ||
      name.includes("APTT") ||
      name.includes("PTT") ||
      name.includes("DIMER") ||
      name.includes("FIBRINOGEN") ||
      name.includes("COAGUL") ||
      sample.includes("CITRATE")
    ) {
      detectedCodes.add("CITR");
    }

    // 2. EDTA Lavender (Hematology / Glycated Hb)
    if (
      name.includes("CBC") ||
      name.includes("HEMOGRAM") ||
      name.includes("BLOOD COUNT") ||
      name.includes("HEMOGLOBIN") ||
      name.includes("HBA1C") ||
      name.includes("GLYCATED") ||
      name.includes("ESR") ||
      name.includes("SMEAR") ||
      name.includes("MALARIA") ||
      name.includes("BLOOD GROUP") ||
      name.includes("COOMB") ||
      sample.includes("EDTA") ||
      sample.includes("WHOLE_BLOOD")
    ) {
      detectedCodes.add("EDTA");
    }

    // 3. Fluoride Grey (Glycolysis / Glucose)
    if (
      name.includes("FBS") ||
      name.includes("PPBS") ||
      name.includes("FASTING SUGAR") ||
      name.includes("RANDOM SUGAR") ||
      name.includes("GLUCOSE") ||
      name.includes("OGTT") ||
      name.includes("GTT") ||
      name.includes("LACTATE") ||
      sample.includes("FLUORIDE")
    ) {
      detectedCodes.add("FLUO");
    }

    // 4. Heparin Green (STAT / Blood Gas / Troponin / Cytogenetics)
    if (
      name.includes("ABG") ||
      name.includes("BLOOD GAS") ||
      name.includes("AMMONIA") ||
      name.includes("KARYOTYPE") ||
      name.includes("FLOW CYTOMETRY") ||
      sample.includes("HEPARIN")
    ) {
      detectedCodes.add("HEPA");
    }

    // 5. Heavy Metals / Trace Elements (Royal Blue)
    if (
      name.includes("LEAD") ||
      name.includes("ARSENIC") ||
      name.includes("MERCURY") ||
      name.includes("CADMIUM") ||
      name.includes("HEAVY METAL") ||
      sample.includes("TRACE")
    ) {
      detectedCodes.add("TRACE");
    }

    // 6. Urine (Sterile Container)
    if (
      name.includes("URINE") ||
      name.includes("URINARY") ||
      sample.includes("URINE")
    ) {
      detectedCodes.add("URINE");
    }

    // 7. Swab / VTM
    if (
      name.includes("RT-PCR") ||
      name.includes("COVID") ||
      name.includes("SWAB") ||
      name.includes("INFLUENZA") ||
      sample.includes("SWAB")
    ) {
      detectedCodes.add("SWAB");
    }

    // 8. Biochemistry / Serology / SST Gold (Catch-all for routine blood chemistry)
    if (
      name.includes("LFT") ||
      name.includes("KFT") ||
      name.includes("RFT") ||
      name.includes("LIPID") ||
      name.includes("THYROID") ||
      name.includes("TSH") ||
      name.includes("ELECTROLYTE") ||
      name.includes("VITAMIN") ||
      name.includes("FERRITIN") ||
      name.includes("CREATININE") ||
      name.includes("UREA") ||
      name.includes("BILIRUBIN") ||
      name.includes("SEROLOGY") ||
      name.includes("HBSAG") ||
      name.includes("HIV") ||
      name.includes("HCV") ||
      name.includes("WIDAL") ||
      name.includes("TROPONIN") ||
      sample.includes("SERUM") ||
      detectedCodes.size === 0 // If nothing matched, at least add SST Gold
    ) {
      detectedCodes.add("SERUM");
    }
  });

  // Guarantee at least SST Serum and EDTA Lavender if empty
  if (detectedCodes.size === 0) {
    detectedCodes.add("SERUM");
    detectedCodes.add("EDTA");
  }

  // Filter catalog and sort strictly by CLSI Order of Draw
  const result = CLSI_VACUTAINER_CATALOG.filter((tube) => detectedCodes.has(tube.code));
  return result.sort((a, b) => a.orderOfDraw - b.orderOfDraw);
}

/**
 * Format accession barcode identifier for a tube
 * Pattern: {UHID}-{TUBE_CODE} e.g. UHID-2026-00001-EDTA
 */
export function formatTubeBarcode(uhid: string, tubeCode: string): string {
  const cleanUhid = (uhid || "UHID-000000").replace(/[^a-zA-Z0-9-]/g, "");
  return `${cleanUhid}-${tubeCode}`;
}
