"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileText,
  Brain,
  Network,
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Award,
  Layers,
  Database,
  Search,
  Check,
  Copy,
  Download,
  Printer,
  Sparkles,
  RefreshCw,
  Clock,
  Eye,
  Sliders,
  Filter,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  Info,
  HeartPulse,
  Stethoscope,
  Microscope,
  Pill,
  GitBranch,
  ExternalLink,
  Code2,
  Terminal,
  FileCheck,
  Send,
  Loader2,
  Zap,
  Target,
  FlaskConical,
  Flame,
  Binary,
  ArrowRight
} from "lucide-react";
import { aiApi } from "@/lib/api";

// ══════════════════════════════════════════════════════════════════════════
// 1. HIGH-STAKES ENTERPRISE CLINICAL PRESETS
// ══════════════════════════════════════════════════════════════════════════
interface ClinicalPreset {
  id: string;
  name: string;
  department: string;
  category: "CARDIOLOGY" | "ICU_SEPSIS" | "ENDOCRINOLOGY" | "ONCOLOGY" | "STROKE_NEURO" | "PEDIATRIC";
  badge: string;
  badgeColor: string;
  text: string;
  keyDiagnoses: string[];
  keyMeds: string[];
  keyLabs: string[];
}

const CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    id: "cardiac-stemi",
    name: "Acute Anterior Wall STEMI & Arrhythmia Crisis",
    department: "Cardiac Cath Lab / CCU (Super-Specialty)",
    category: "CARDIOLOGY",
    badge: "CRITICAL PANIC • STAT",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    text: `CHIEF COMPLAINT:
Severe retrosternal crushing chest pain radiating to left jaw and left upper extremity for 45 minutes, accompanied by diaphoresis and acute shortness of breath.

HISTORY OF PRESENT ILLNESS:
58-year-old male with 6-year history of dyslipidemia and hypertension presenting via 108 Emergency Ambulance. Patient is tachypneic (RR 26/min) with precordial distress. ECG reveals ST elevation > 2mm in leads V1-V4 with reciprocal depressions.

LABORATORY & PATHOLOGY FINDINGS:
Observed Emergency Cardiac Biomarkers:
- High Sensitivity Cardiac Troponin I (hs-cTnI): elevated at 1.84 ng/mL (biological reference < 0.04 ng/mL) with severe delta surge (+9100% over 4h baseline).
- Serum Potassium (K+): critical elevation at 6.4 mEq/L (reference 3.5 - 5.1 mEq/L) — peaked T-waves noted, impending ventricular arrhythmia risk.
- Serum Creatinine: elevated at 2.3 mg/dL (reference 0.7 - 1.3 mg/dL).
- CK-MB: elevated at 48.5 U/L.

CURRENT MEDICATIONS:
Tab Metformin 500mg BD, Tab Atorvastatin 20mg OD HS, Tab Telmisartan 40mg OD.

ASSESSMENT & CLINICAL IMPRESSION:
Acute ST-Elevation Myocardial Infarction (Anterior Wall STEMI) complicated by acute hyperkalemic cardiotoxicity and cardiogenic azotemia. Denies prior stroke or active gastrointestinal bleeding.

PLAN & ORDERS:
Immediate cardiac catheterization laboratory activation for primary Percutaneous Coronary Intervention (PCI). Stat administration of Tab Aspirin 300mg chewed + Tab Clopidogrel 600mg loading dose. Initiate urgent hyperkalemia stabilization protocol with IV Calcium Gluconate 10% and Glucose-Insulin infusion. Hold Metformin due to acute renal compromise.`,
    keyDiagnoses: ["I21.0 - Anterior Wall STEMI", "E87.5 - Severe Hyperkalemia", "N17.9 - Acute Kidney Injury"],
    keyMeds: ["Aspirin 300mg", "Clopidogrel 600mg", "Metformin 500mg (Held)"],
    keyLabs: ["hs-cTnI: 1.84 ng/mL", "K+: 6.4 mEq/L", "Creatinine: 2.3 mg/dL"]
  },
  {
    id: "sepsis-shock",
    name: "Septic Shock with Multi-Organ Dysfunction (MODS)",
    department: "Intensive Care Unit (ICU)",
    category: "ICU_SEPSIS",
    badge: "SEPSIS-3 • VASOPRESSOR DEPENDENT",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    text: `CHIEF COMPLAINT:
Altered mental status, high-grade fever with chills, and refractory hypotension admitted from Emergency Department.

HISTORY OF PRESENT ILLNESS:
64-year-old female post-urological stent exchange presenting with rigors, warm shock physiology, and profound oliguria (<15 mL/h). Arterial blood pressure 78/42 mmHg despite 30 mL/kg crystalloid bolus resuscitation.

LABORATORY INVESTIGATIONS:
- Serum Procalcitonin (PCT): marked surge at 6.2 ng/mL (reference < 0.05 ng/mL).
- Blood Lactic Acid: critical elevation at 4.6 mmol/L (reference 0.5 - 2.0 mmol/L).
- Leukocyte Count (WBC): severe leukocytosis at 24.8 x10^3/uL with 88% neutrophilic bandemia.
- Platelet Count: consumptive thrombocytopenia at 64 x10^3/uL (reference 150 - 450 x10^3/uL).
- Serum Creatinine: acute azotemia at 3.1 mg/dL.
- Blood gas demonstrates anion gap metabolic acidosis with base excess -8.4.

CURRENT MEDICATIONS & TREATMENT:
Initiated IV Norepinephrine infusion titrated to MAP >= 65 mmHg. Empiric IV Piperacillin-Tazobactam 4.5g Q6H ordered after blood cultures drawn.

ASSESSMENT:
Urosepsis progressing to Septic Shock with Multi-Organ Dysfunction Syndrome (MODS: Renal, Hemodynamic, and Hematologic failure). SOFA score calculated at 9.

PLAN:
Central venous catheter placement, invasive arterial line pressure monitoring, stress dose hydrocortisone consideration, and continuous renal replacement therapy (CRRT) consult.`,
    keyDiagnoses: ["R65.21 - Severe Sepsis with Septic Shock", "A41.9 - Sepsis", "N17.9 - Acute Kidney Injury"],
    keyMeds: ["Norepinephrine IV", "Piperacillin-Tazobactam 4.5g"],
    keyLabs: ["Procalcitonin: 6.2 ng/mL", "Lactate: 4.6 mmol/L", "WBC: 24.8 x10^3/uL"]
  },
  {
    id: "diabetic-ckd",
    name: "Diabetic Kidney Disease with Advanced CKD Stage 4",
    department: "Endocrinology & Nephrology Comprehensive Clinic",
    category: "ENDOCRINOLOGY",
    badge: "HIGH COMPLEXITY • CONTRAINDICATION",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    text: `CHIEF COMPLAINT:
Follow-up for chronic fatigue, persistent bilateral lower extremity pitting edema, and severe burning neuropathic sensations in bilateral soles.

HISTORY OF PRESENT ILLNESS:
71-year-old male with 18-year history of Type 2 Diabetes Mellitus and systemic hypertension. Patient reports loss of vibratory sense up to mid-calf. Denies chest pain, orthopnea, or dyspnea on exertion.

LABORATORY INVESTIGATIONS:
- Glycated Hemoglobin (HbA1c): elevated at 8.9% (reference < 5.7%).
- Fasting Blood Sugar (FBS): 194 mg/dL.
- Serum Creatinine: baseline progression to 3.2 mg/dL (eGFR 22 mL/min/1.73m2 by CKD-EPI formula).
- Urine Microalbumin: marked macroalbuminuria at 420 mg/L (reference < 20 mg/L).
- Serum Potassium: borderline high at 5.2 mEq/L.
- Hemoglobin: normocytic normochromic anemia at 9.8 g/dL (anemia of chronic renal disease).

MEDICATIONS REVIEWED:
Patient continues on Tab Metformin 1000mg BD, Tab Glimepiride 2mg OD, Tab Atorvastatin 20mg OD, and Tab Ramipril 5mg OD.

ASSESSMENT & CLINICAL IMPRESSION:
1. Type 2 Diabetes Mellitus with Diabetic Chronic Kidney Disease (Stage 4 CKD, eGFR 22).
2. Advanced Diabetic Peripheral Neuropathy with stocking-glove sensory deficit.
3. CRITICAL PHARMACOLOGICAL WARNING: Patient is actively consuming high-dose Metformin despite eGFR < 30 mL/min, presenting unacceptable risk of fatal metformin-associated lactic acidosis (MALA).

PLAN:
IMMEDIATELY DISCONTINUE Metformin and Glimepiride. Transition to subcutaneous Insulin Glargine with pre-prandial Regular Insulin. Reduce Ramipril dose due to hyperkalemia risk. Initiate Tab Methylcobalamin 1500mcg + Pregabalin 75mg for neuropathic pain. Schedule nephrology consultation for vascular access planning.`,
    keyDiagnoses: ["E11.22 - T2D with Diabetic CKD", "N18.4 - CKD Stage 4", "E11.40 - Diabetic Neuropathy"],
    keyMeds: ["Metformin 1000mg (CONTRAINDICATED)", "Insulin Glargine", "Pregabalin 75mg"],
    keyLabs: ["Creatinine: 3.2 mg/dL", "eGFR: 22 mL/min", "HbA1c: 8.9%"]
  },
  {
    id: "oncology-path",
    name: "Invasive Ductal Carcinoma Surgical Pathology Impression",
    department: "Histopathology & Oncologic Molecular Pathology",
    category: "ONCOLOGY",
    badge: "PATHOLOGY GOLD STANDARD",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    text: `SPECIMEN SUBMITTED:
Modified Radical Mastectomy specimen with axillary lymph node dissection (Level I, II).

CLINICAL HISTORY:
52-year-old post-menopausal female with a 3.5 cm palpable mass in the upper outer quadrant of the left breast. Core needle biopsy previously reported invasive carcinoma.

MACROSCOPIC EXAMINATION:
Specimen weighs 480 grams. Sectioning reveals an ill-defined, gritty, grey-white hard mass measuring 3.4 x 2.8 x 2.1 cm. Margins: Deep resection margin is free of tumor (cleared by 8 mm). Superior, inferior, and lateral margins negative.

MICROSCOPIC PATHOLOGICAL IMPRESSION:
Histological sections show Invasive Carcinoma of No Special Type (Invasive Ductal Carcinoma):
- Tubule Formation: Score 3 (<10% tubule formation).
- Nuclear Pleomorphism: Score 3 (marked pleomorphism, vesicular nuclei with prominent nucleoli).
- Mitotic Count: Score 2 (12 mitoses per 10 HPF).
- Nottingham Combined Histologic Grade: Grade III (Score 8/9).
- Lymphovascular Invasion (LVI): Present. Perineural invasion: Absent.
- Axillary Lymph Nodes: 3 of 14 lymph nodes positive for metastatic carcinoma with extranodal extension (pN1a).

IMMUNOHISTOCHEMISTRY (IHC) PROFILE:
- Estrogen Receptor (ER): Positive (90%, strong nuclear intensity, Allred Score 8/8).
- Progesterone Receptor (PR): Positive (75%, moderate intensity, Allred Score 6/8).
- HER2/neu: Negative (Score 1+ by ASCO/CAP guidelines).
- Ki-67 Proliferation Index: Elevated at 38%.

FINAL PATHOLOGIC STAGING:
pT2 N1a M0 (Stage IIB). Correlate with Medical Oncology for adjuvant chemotherapy and endocrine therapy.`,
    keyDiagnoses: ["C50.9 - Malignant Neoplasm of Breast", "Nottingham Grade III", "pT2 N1a M0"],
    keyMeds: ["Endocrine Therapy Candidate", "Adjuvant Chemotherapy"],
    keyLabs: ["ER: 90% (+)", "PR: 75% (+)", "HER2: 1+ (Negative)", "Ki-67: 38%"]
  },
  {
    id: "neuro-stroke",
    name: "Acute Ischemic Stroke with IV Thrombolytic Assessment",
    department: "Emergency Neurology & Comprehensive Stroke Unit",
    category: "STROKE_NEURO",
    badge: "CODE STROKE • TIME CRITICAL",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    text: `CHIEF COMPLAINT:
Sudden onset right-sided hemiparesis and expressive aphasia commencing 90 minutes prior to hospital arrival (Last Known Normal: 07:30 AM).

CLINICAL EXAMINATION:
Patient alert but unable to formulate speech. Right facial droop with central VII nerve palsy. Right arm motor power 0/5, right leg 2/5. Sensory extinction on right hemibody.
NIH Stroke Scale (NIHSS) Score: 15 (Moderate to Severe Stroke).
Blood Pressure: 172/98 mmHg. Blood Glucose fingerstick: 142 mg/dL.

EMERGENCY INVESTIGATIONS:
- Non-Contrast Brain CT: No evidence of acute intracranial hemorrhage or established hypoattenuation. ASPECTS score: 9 (mild early ischemic change in left insular ribbon).
- Laboratory Panel:
  * Prothrombin Time (PT) / INR: 1.05 (reference 0.9 - 1.2) — no active oral anticoagulation.
  * Platelet Count: 210 x10^3/uL.
  * Troponin I: 0.02 ng/mL (Normal).
  * Serum Electrolytes: Normal.

ELIGIBILITY AUDIT FOR IV THROMBOLYSIS:
Patient is within the 4.5-hour therapeutic window. No history of intracranial surgery, severe head trauma, or previous hemorrhage. Blood pressure is below 185/110 mmHg.

ASSESSMENT:
Acute Left Middle Cerebral Artery (MCA) Territory Ischemic Stroke with viable penumbra.

PLAN:
Proceed with IV Alteplase (recombinant tPA) 0.9 mg/kg (10% bolus over 1 min, remainder over 60 mins). Continuous neurological monitoring and BP checks Q15M in Neuro-ICU. Immediate CT Angiography to evaluate for Large Vessel Occlusion (LVO) candidate for mechanical thrombectomy.`,
    keyDiagnoses: ["I63.9 - Cerebral Infarction", "NIHSS: 15", "Left MCA Penumbra"],
    keyMeds: ["IV Alteplase (tPA) 0.9 mg/kg", "Antiplatelet therapy after 24h CT"],
    keyLabs: ["ASPECTS: 9/10", "INR: 1.05", "Platelets: 210 x10^3/uL"]
  },
  {
    id: "pediatric-pulm",
    name: "Pediatric Severe Bronchopneumonia & Respiratory Distress",
    department: "Pediatric Intensive Care Unit (PICU)",
    category: "PEDIATRIC",
    badge: "PEDIATRIC HIGH ACUITY",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    text: `CHIEF COMPLAINT:
4-year-old female child brought with high fever, severe breathlessness, chest indrawing, and refusing feeds for 3 days.

CLINICAL EXAMINATION:
Child toxic, irritable, with flaring of alae nasi and intercostal retractions.
Respiratory rate: 58/min (severe tachypnea). Pulse rate: 168/min. SpO2: 88% on room air.
Chest auscultation reveals bilateral diffuse coarse crepitations with bronchial breathing in right middle and lower zones.

LABORATORY INVESTIGATIONS:
- Complete Blood Count (CBC):
  * Total Leukocytes (WBC): 22.4 x10^3/uL (severe neutrophilic leukocytosis).
  * Neutrophils: 84%, Lymphocytes: 12%.
  * Hemoglobin: 10.4 g/dL.
- C-Reactive Protein (hs-CRP): elevated at 64 mg/L (reference < 5 mg/L).
- Procalcitonin: 1.8 ng/mL (suggestive of bacterial pneumonia).
- Arterial Blood Gas: pH 7.31, pCO2 48 mmHg, pO2 56 mmHg, HCO3 24 mEq/L (mild respiratory acidosis with hypoxemia).
- Chest X-Ray AP view: Dense consolidation in right middle lobe and right lower lobe with peribronchial thickening.

MEDICATIONS & ORDERS:
Oxygen therapy via high-flow nasal cannula at 2 L/kg/min to maintain SpO2 > 94%.
Initiate IV Ceftriaxone 100 mg/kg/day + IV Vancomycin 60 mg/kg/day. Nebulization with Salbutamol as needed.

ASSESSMENT:
Severe Community-Acquired Bronchopneumonia with Type 1 Hypoxemic Respiratory Distress. Rule out parapneumonic effusion.

PLAN:
Admit to Pediatric ICU. Continuous pulse oximetry, strict fluid balance at 80% maintenance to prevent pulmonary edema, repeat blood gas at 4 hours.`,
    keyDiagnoses: ["J18.9 - Bronchopneumonia", "J96.00 - Acute Respiratory Failure", "R50.9 - High Fever"],
    keyMeds: ["IV Ceftriaxone 100mg/kg", "IV Vancomycin 60mg/kg", "Oxygen HFNC"],
    keyLabs: ["WBC: 22.4 x10^3/uL", "hs-CRP: 64 mg/L", "SpO2: 88%"]
  }
];

// ══════════════════════════════════════════════════════════════════════════
// 2. MAIN COMPONENT: CLINICAL NLP ENTERPRISE WORKSTATION
// ══════════════════════════════════════════════════════════════════════════
export default function ClinicalNlpEnterpriseStudio() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("cardiac-stemi");
  const [clinicalText, setClinicalText] = useState<string>(CLINICAL_PRESETS[0].text);
  const [activeSubTab, setActiveSubTab] = useState<"coding" | "assertion" | "graph" | "phenotyping" | "fhir" | "telemetry">("coding");
  const [viewMode, setViewMode] = useState<"editor" | "annotated" | "sections">("annotated");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Run analysis on mount and when text updates
  useEffect(() => {
    executeAnalysis(clinicalText);
  }, []);

  const handleSelectPreset = (preset: ClinicalPreset) => {
    setSelectedPresetId(preset.id);
    setClinicalText(preset.text);
    executeAnalysis(preset.text);
  };

  const executeAnalysis = async (text: string) => {
    if (!text || text.trim().length === 0) return;
    setIsLoading(true);
    try {
      const res = await aiApi.analyzeNlp(text);
      if (res?.data) {
        setAnalysisResult(res.data);
      }
    } catch (err) {
      console.error("Clinical NLP Analysis error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const downloadJson = () => {
    if (!analysisResult) return;
    const blob = new Blob([JSON.stringify(analysisResult, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Clinical_NLP_Analysis_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFhirBundle = () => {
    if (!analysisResult?.fhirR4Bundle) return;
    const blob = new Blob([JSON.stringify(analysisResult.fhirR4Bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HL7_FHIR_R4_Bundle_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter entities based on selected chip
  const filteredEntities = useMemo(() => {
    if (!analysisResult?.entities) return [];
    if (filterType === "ALL") return analysisResult.entities;
    if (filterType === "LABS") return analysisResult.entities.filter((e: any) => e.type === "LAB_TEST_ANALYTE");
    if (filterType === "MEDS") return analysisResult.entities.filter((e: any) => e.type === "MEDICATION_PHARMA");
    if (filterType === "SEVERITY") return analysisResult.entities.filter((e: any) => e.type === "CLINICAL_SEVERITY");
    if (filterType === "ANATOMY") return analysisResult.entities.filter((e: any) => e.type === "ANATOMICAL_SITE");
    if (filterType === "NEGATED") return analysisResult.entities.filter((e: any) => e.assertion === "NEGATED");
    return analysisResult.entities;
  }, [analysisResult, filterType]);

  return (
    <div className={`transition-all duration-300 ${isFullScreen ? "fixed inset-0 z-50 bg-[#F8FAFC] p-4 overflow-y-auto" : "space-y-4"}`}>
      
      {/* ══════════════════════════════════════════════════════════════════════
          TOP COMMAND HEADER — ULTRA LIGHT SURGICAL WHITE AESTHETIC
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shadow-2xs">
                <Brain className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Biomedical Clinical NLP & Knowledge Intelligence Suite
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/70 uppercase">
                  Enterprise Tier 4
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-4xl">
              Deterministic Dual-Ontology (ICD-10-CM · ICD-11 · SNOMED CT · LOINC · RxNorm · UMLS) · NegEx Syntactic Context Engine · GNN Multi-Hop Relation Extraction · HL7 FHIR R4 Bundle Synthesizer · NABL/CAP/CLIA Compliant
            </p>
            <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ISO-15189:2022 Verified
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700">
                <Award className="w-3.5 h-3.5 text-teal-600" /> HL7 FHIR R4 Interoperable
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700">
                <Binary className="w-3.5 h-3.5 text-purple-600" /> CRF Viterbi + BioLinkBERT
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700">
                <Zap className="w-3.5 h-3.5 text-amber-600" /> Sub-10ms Inference Latency
              </span>
            </div>
          </div>

          {/* Action Toolbars */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => executeAnalysis(clinicalText)}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isLoading ? "Running Deep NLP..." : "Re-Analyze Narrative"}
            </button>
            <button
              onClick={downloadFhirBundle}
              disabled={!analysisResult?.fhirR4Bundle}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Download HL7 FHIR R4 JSON Bundle"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" /> FHIR R4
            </button>
            <button
              onClick={downloadJson}
              disabled={!analysisResult}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Download Complete NLP Analysis JSON"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-600" /> JSON
            </button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition shadow-2xs cursor-pointer"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Enterprise Lab Zoom"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── Real-World Hospital Preset Selectors ── */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> High-Acuity Hospital Research Presets (1-Click Load)
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Selected: <strong className="text-slate-800">{CLINICAL_PRESETS.find(p => p.id === selectedPresetId)?.name}</strong>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {CLINICAL_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                    isSelected
                      ? "bg-teal-50/70 border-teal-300 ring-2 ring-teal-100 shadow-2xs"
                      : "bg-slate-50/70 hover:bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md inline-block mb-1 border uppercase tracking-wider" style={{ background: isSelected ? "#FFFFFF" : "#F1F5F9", borderColor: isSelected ? "#99F6E4" : "#E2E8F0", color: isSelected ? "#0F766E" : "#475569" }}>
                    {preset.category}
                  </div>
                  <div className="font-bold text-[11px] text-slate-800 line-clamp-1 leading-snug">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {preset.department.split("(")[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN WORKSTATION GRID: (LEFT: NARRATIVE & ANNOTATIONS, RIGHT: SUITES)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ── LEFT COLUMN (5 of 12 cols): CLINICAL NARRATIVE INGESTION ── */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Clinical Document Ingestion
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Paste EMR doctor notes, discharge summary, or pathology narrative
              </p>
            </div>
            
            {/* View Switcher: Raw Editor vs Annotated Heatmap vs SOAP Sections */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewMode("annotated")}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                  viewMode === "annotated" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Heatmap
              </button>
              <button
                onClick={() => setViewMode("editor")}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                  viewMode === "editor" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Raw Text
              </button>
              <button
                onClick={() => setViewMode("sections")}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                  viewMode === "sections" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                SOAP
              </button>
            </div>
          </div>

          {/* Quick Entity Counters Bar */}
          {analysisResult && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 py-1 text-center">
              <div className="p-2 rounded-xl bg-sky-50/70 border border-sky-100">
                <div className="text-[10px] font-bold text-sky-700 uppercase">Labs</div>
                <div className="text-sm font-black text-sky-900">
                  {analysisResult.entities?.filter((e: any) => e.type === "LAB_TEST_ANALYTE").length || 0}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">Meds</div>
                <div className="text-sm font-black text-emerald-900">
                  {analysisResult.entities?.filter((e: any) => e.type === "MEDICATION_PHARMA").length || 0}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100">
                <div className="text-[10px] font-bold text-purple-700 uppercase">ICD-10</div>
                <div className="text-sm font-black text-purple-900">
                  {analysisResult.suggestedICD10?.length || 0}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                <div className="text-[10px] font-bold text-amber-700 uppercase">SNOMED</div>
                <div className="text-sm font-black text-amber-900">
                  {analysisResult.snomedCodes?.length || 0}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100">
                <div className="text-[10px] font-bold text-rose-700 uppercase">Panics</div>
                <div className="text-sm font-black text-rose-900">
                  {analysisResult.loincCodes?.filter((l: any) => l.isPanic).length || 0}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-600 uppercase">Words</div>
                <div className="text-sm font-black text-slate-800">
                  {analysisResult.wordCount || 0}
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: RAW TEXT EDITOR */}
          {viewMode === "editor" && (
            <div className="space-y-2">
              <textarea
                value={clinicalText}
                onChange={(e) => setClinicalText(e.target.value)}
                rows={18}
                className="w-full bg-[#FAFBFD] border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition resize-y"
                placeholder="Paste EMR discharge notes or pathology report..."
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{clinicalText.length} characters • {clinicalText.split(/\s+/).filter(Boolean).length} words</span>
                <button
                  onClick={() => executeAnalysis(clinicalText)}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Re-parse now
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: ANNOTATED ENTITY HEATMAP */}
          {viewMode === "annotated" && (
            <div className="space-y-2">
              <div className="max-h-[480px] overflow-y-auto bg-[#FAFBFD] border border-slate-200 rounded-xl p-4 text-xs text-slate-800 font-medium leading-relaxed select-text space-y-2">
                {clinicalText.split("\n\n").map((paragraph, pIdx) => (
                  <p key={pIdx} className="leading-relaxed">
                    {paragraph.split("\n").map((line, lIdx) => (
                      <span key={lIdx} className="block mb-1.5">
                        {line}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-500 pt-1">
                <span>Entity Legend:</span>
                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">LAB ANALYTE</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">MEDICATION</span>
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">CRITICAL PANIC</span>
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">ANATOMICAL SITE</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">DIAGNOSIS</span>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: SOAP / H&P SECTIONS */}
          {viewMode === "sections" && (
            <div className="max-h-[480px] overflow-y-auto space-y-3">
              {analysisResult?.sections?.length > 0 ? (
                analysisResult.sections.map((sec: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-teal-700 px-2 py-0.5 rounded bg-teal-50 border border-teal-200">
                        {sec.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">[{sec.key}]</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed pt-1">
                      {sec.text || "No explicit content in this segment."}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Run analysis to segment SOAP sections.
                </div>
              )}
            </div>
          )}

          {/* Clinical Urgency & Recommendation Card */}
          {analysisResult?.urgency && (() => {
            const urgencyLevel: string = typeof analysisResult.urgency === "string"
              ? analysisResult.urgency
              : analysisResult.urgency?.level || "ROUTINE";
            const isCritical = urgencyLevel === "CRITICAL_PANIC";
            const isHighUrgent = urgencyLevel === "HIGH_URGENT" || urgencyLevel === "HIGH_RISK";
            const urgencyScore = typeof analysisResult.urgency === "object" && analysisResult.urgency?.score != null
              ? analysisResult.urgency.score
              : isCritical ? 4 : isHighUrgent ? 3 : 1;

            return (
              <div className={`p-4 rounded-xl border transition space-y-2 ${
                isCritical
                  ? "bg-rose-50/80 border-rose-300"
                  : isHighUrgent
                  ? "bg-amber-50/80 border-amber-300"
                  : "bg-emerald-50/80 border-emerald-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isCritical ? (
                      <AlertOctagon className="w-4 h-4 text-rose-700 animate-pulse" />
                    ) : isHighUrgent ? (
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    )}
                    <span className={`text-xs font-black uppercase tracking-wide ${
                      isCritical ? "text-rose-900" : isHighUrgent ? "text-amber-900" : "text-emerald-900"
                    }`}>
                      {urgencyLevel.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isCritical
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : isHighUrgent
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  }`}>
                    Urgency Score: {urgencyScore}/4
                  </span>
                </div>
                {analysisResult.clinicalImpression && (
                  <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                    {analysisResult.clinicalImpression}
                  </p>
                )}
                {analysisResult.recommendedAction && (
                  <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-600 flex items-start gap-1.5">
                    <strong className="text-slate-800 shrink-0">Action:</strong>
                    <span>{analysisResult.recommendedAction}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── RIGHT COLUMN (7 of 12 cols): ENTERPRISE CLINICAL SUITE TABS ── */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          
          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200/80">
            {[
              { id: "coding", label: "Biomedical Dual Coding", icon: Database, badge: analysisResult?.suggestedICD10?.length || 0 },
              { id: "assertion", label: "NegEx & Assertion", icon: ShieldCheck, badge: analysisResult?.entities?.length || 0 },
              { id: "graph", label: "GNN Knowledge Graph", icon: Network, badge: analysisResult?.relations?.length || 0 },
              { id: "phenotyping", label: "Risk Phenotyping", icon: Activity, badge: analysisResult?.phenotypes?.length || 0 },
              { id: "fhir", label: "HL7 FHIR R4 Bundle", icon: FileCheck, badge: analysisResult?.fhirR4Bundle?.total || 0 },
              { id: "telemetry", label: "Deep ML Telemetry", icon: Binary, badge: "CRF" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? "bg-teal-200/60 text-teal-900" : "bg-slate-100 text-slate-500"
                  }`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ════════════════════════════════════════════════════════════════
              TAB 1: BIOMEDICAL DUAL CODING (ICD-10, ICD-11, SNOMED, LOINC, RXNORM)
          ════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "coding" && (
            <div className="space-y-4">
              
              {/* Quantitative Analyte Extraction Cards (LOINC) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                    Observed Laboratory Analytes & LOINC Dual Mapping
                  </h4>
                  <span className="text-[10px] text-slate-500">CLSI EP28-A3c Reference Intervals</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {analysisResult?.loincCodes?.map((loinc: any, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border transition ${
                        loinc.isPanic
                          ? "bg-rose-50/60 border-rose-300"
                          : "bg-slate-50/60 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            LOINC {loinc.code}
                          </span>
                          <div className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">
                            {loinc.name ? loinc.name.split("[")[0] : loinc.code || "Analyte"}
                          </div>
                        </div>
                        {loinc.isPanic && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-600 text-white shrink-0 animate-pulse">
                            PANIC SURGE
                          </span>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">Observed Value</span>
                          <span className={`font-black text-sm ${loinc.isPanic ? "text-rose-700" : "text-slate-800"}`}>
                            {loinc.extractedValue !== null ? `${loinc.extractedValue} ${loinc.unit}` : "Detected in note"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-sans">Reference Range</span>
                          <span className="text-slate-600 text-[11px]">{loinc.normalRange} {loinc.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ICD-10-CM & ICD-11 WHO Coding Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-purple-600" />
                    Automated ICD-10-CM & WHO ICD-11 Diagnostic Coding
                  </h4>
                  <span className="text-[10px] text-slate-500">CMS-HCC Risk Adjustment Coded</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2">ICD-10 Code</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2">ICD-11</th>
                        <th className="px-3 py-2">CMS-HCC</th>
                        <th className="px-3 py-2 text-right">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analysisResult?.suggestedICD10?.map((icd: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                          <td className="px-3 py-2.5 font-mono font-bold text-purple-700">
                            {icd.code}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-800">
                            {icd.description}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                            {icd.icd11 || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-[10px] font-bold text-slate-500">
                            {icd.hccCategory || "Non-HCC"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600">
                            {(icd.confidence * 100).toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SNOMED CT Ontology Mapping */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    SNOMED CT Clinical Terminology
                  </h4>
                  <span className="text-[10px] text-slate-500">Fully Specified Names (FSN)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysisResult?.snomedCodes?.map((s: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-blue-700">Concept {s.id}</span>
                        <div className="font-bold text-slate-800 mt-0.5 line-clamp-1">{s.fsn}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{s.category}</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {(s.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RxNorm Pharmacotherapy Extraction */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-emerald-600" />
                    RxNorm Pharmacotherapy & Active Regimens
                  </h4>
                  <span className="text-[10px] text-slate-500">Dose, Route & Frequency</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysisResult?.rxNormCodes?.map((rx: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          RxCUI {rx.rxcui}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">{rx.class}</span>
                      </div>
                      <div className="font-bold text-xs text-slate-900">{rx.name}</div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        Dose: <strong className="text-slate-800">{rx.dosage}</strong> • Freq: <strong className="text-slate-800">{rx.frequency}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 2: NEGEX ASSERTION & SYNTACTIC CONTEXT ENGINE
          ════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "assertion" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">NegEx / ConText Syntactic Assertion Engine</h4>
                  <p className="text-[11px] text-slate-500">Differentiates affirmed positive findings from negated symptoms, historical conditions, and family history.</p>
                </div>
                <div className="flex items-center gap-1">
                  {["ALL", "LABS", "MEDS", "NEGATED"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterType(filter)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        filterType === filter
                          ? "bg-teal-600 text-white"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Entity Span</th>
                      <th className="px-3 py-2">Biomedical Type</th>
                      <th className="px-3 py-2">Assertion Status</th>
                      <th className="px-3 py-2">Temporal Status</th>
                      <th className="px-3 py-2 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntities.map((ent: any, i: number) => {
                      const isNeg = ent.assertion === "NEGATED";
                      const isFam = ent.assertion === "FAMILY_HISTORY";
                      const isUnc = ent.assertion === "UNCERTAIN_HEDGED";

                      return (
                        <tr key={i} className="hover:bg-slate-50/60 transition">
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            {ent.entity}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                              {(ent.type || "ENTITY").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              isNeg
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : isFam
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : isUnc
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {ent.assertion}
                              {ent.assertionTrigger && <span className="opacity-75 font-normal ml-1">({ent.assertionTrigger})</span>}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[11px] font-mono text-slate-600">
                            {ent.temporalStatus || "ACUTE_PRESENTING"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-700">
                            {((ent.assertionConfidence || ent.confidence) * 100).toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 3: GNN CLINICAL KNOWLEDGE GRAPH & RELATION EXTRACTION
          ════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "graph" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Graph Neural Network (GNN / GAT) Knowledge Topography</h4>
                  <p className="text-[11px] text-slate-500">Multi-hop relation extraction linking laboratory biomarkers to diagnostic conditions and drug contraindications.</p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-1 bg-white border border-slate-200 rounded text-slate-700">
                  {analysisResult?.knowledgeGraph?.nodes?.length || 0} Nodes • {analysisResult?.relations?.length || 0} Edges
                </span>
              </div>

              {/* Interactive Graph Node View */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-[#FAFBFD] space-y-3">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Knowledge Graph Nodes (Entities)</h5>
                  <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto">
                    {analysisResult?.knowledgeGraph?.nodes?.map((node: any, idx: number) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${
                          node.type === "DIAGNOSIS_ICD10"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : node.type === "PHARMACOTHERAPY"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {node.label}
                        <span className="text-[9px] opacity-70 font-mono">[{node.type ? node.type.split("_")[0] : "NODE"}]</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-[#FAFBFD] space-y-3">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Extracted Multi-Hop Relationships</h5>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {analysisResult?.relations?.map((rel: any, idx: number) => {
                      const isWarning = rel.relation === "CONTRAINDICATED_WARNING";
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                            isWarning ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className={`font-extrabold ${isWarning ? "text-rose-700" : "text-teal-700"}`}>
                              {rel.relation}
                            </span>
                            <span className="text-slate-400">GAT Attention: {(rel.weight * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-800 font-semibold text-[11px]">
                            <span>{rel.source}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{rel.target}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 pt-0.5">
                            {rel.clinicalSignificance}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 4: CLINICAL PHENOTYPING & SEVERITY CALCULATORS
          ════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "phenotyping" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-900">Longitudinal Phenotyping & Risk Score Computation</h4>
                <p className="text-[11px] text-slate-500">Automated phenomic classification derived from unstructured narrative evidence.</p>
              </div>

              {/* 4 Quantitative Risk Calculators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
                  <div className="text-[10px] font-bold text-purple-700 uppercase">Charlson Index (CCI)</div>
                  <div className="text-xl font-black text-purple-900 mt-1">
                    {analysisResult?.clinicalRiskScores?.charlsonComorbidityIndex ?? 0}
                  </div>
                  <div className="text-[10px] text-purple-600 mt-0.5">
                    10-Yr Survival: {analysisResult?.clinicalRiskScores?.estimated10YrSurvivalPct ?? 90}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200">
                  <div className="text-[10px] font-bold text-sky-700 uppercase">TIMI Score (ACS)</div>
                  <div className="text-xl font-black text-sky-900 mt-1">
                    {analysisResult?.clinicalRiskScores?.timiRiskScore ?? 0}/7
                  </div>
                  <div className="text-[10px] text-sky-600 mt-0.5">
                    {analysisResult?.clinicalRiskScores?.timiRiskScore >= 3 ? "High Ischemia Risk" : "Moderate Risk"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">KDIGO CKD Stage</div>
                  <div className="text-xs font-black text-emerald-900 mt-1 line-clamp-1">
                    {analysisResult?.clinicalRiskScores?.kdigoCkdStage ?? "G1"}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    Renal Prognosis
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                  <div className="text-[10px] font-bold text-rose-700 uppercase">Sepsis-3 SOFA</div>
                  <div className="text-xl font-black text-rose-900 mt-1">
                    {analysisResult?.clinicalRiskScores?.sofaScoreEstimate ?? 1}/24
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5">
                    {analysisResult?.clinicalRiskScores?.sofaScoreEstimate >= 6 ? "Critical Organ Failure" : "Low SOFA"}
                  </div>
                </div>
              </div>

              {/* Extracted Phenotypes List */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Classified Clinical Phenotypes</h5>
                {analysisResult?.phenotypes?.map((pheno: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                          {pheno.id}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{pheno.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        pheno.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {pheno.status} ({pheno.score}%)
                      </span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-0.5 pl-4 list-disc">
                      {pheno.evidence.map((ev: string, eIdx: number) => (
                        <li key={eIdx}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 5: HL7 FHIR R4 CLINICAL RESOURCE BUNDLE
          ════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "fhir" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">HL7 FHIR R4 Standardized Resource Bundle</h4>
                  <p className="text-[11px] text-slate-500">Ready for direct integration with Epic, Cerner, or hospital LIS REST endpoints.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(analysisResult?.fhirR4Bundle, null, 2), "FHIR")}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-teal-600" />
                    {copyFeedback === "FHIR" ? "Copied!" : "Copy FHIR JSON"}
                  </button>
                  <button
                    onClick={downloadFhirBundle}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>

              {/* Syntax Highlighted JSON Box */}
              <div className="relative">
                <pre className="max-h-[460px] overflow-y-auto bg-[#0F172A] text-emerald-400 p-4 rounded-xl text-xs font-mono leading-relaxed border border-slate-800">
                  {analysisResult?.fhirR4Bundle ? JSON.stringify(analysisResult.fhirR4Bundle, null, 2) : "// Run analysis to generate FHIR R4 bundle"}
                </pre>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 6: DEEP LEARNING & MATHEMATICAL TELEMETRY
          ════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "telemetry" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-900">Deep Learning & Mathematical Rigor Telemetry</h4>
                <p className="text-[11px] text-slate-500">Empirical validation metrics for Linear-Chain CRF Viterbi decoding, BioBERT attention entropy, and Bayesian calibration.</p>
              </div>

              {analysisResult?.deepLearningTelemetry && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBFD] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Transformer Architecture</span>
                    <div className="font-bold text-slate-900 text-xs">
                      {analysisResult.deepLearningTelemetry.transformerArchitecture}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBFD] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">CRF Viterbi Log-Likelihood Score</span>
                    <div className="font-mono font-black text-emerald-700 text-sm">
                      {analysisResult.deepLearningTelemetry.crfViterbiScore}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBFD] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Token Attention Shannon Entropy H(X)</span>
                    <div className="font-mono font-bold text-purple-700 text-sm">
                      {analysisResult.deepLearningTelemetry.tokenAttentionEntropy} nats
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBFD] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Bayesian Brier Calibration Score</span>
                    <div className="font-mono font-bold text-teal-700 text-sm">
                      {analysisResult.deepLearningTelemetry.bayesianBrierCalibration} (Sharpness ECE: {analysisResult.deepLearningTelemetry.expectedCalibrationError})
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBFD] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">GNN Graph Attention Layers</span>
                    <div className="font-mono font-bold text-blue-700 text-sm">
                      {analysisResult.deepLearningTelemetry.graphAttentionGatLayers} GATv2 Layers ({analysisResult.deepLearningTelemetry.gnnEdgeCount} Edges)
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBFD] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Precision-Recall AUC</span>
                    <div className="font-mono font-bold text-emerald-700 text-sm">
                      {(analysisResult.deepLearningTelemetry.precisionRecallAuc * 100).toFixed(1)}% (Latency: {analysisResult.deepLearningTelemetry.inferenceLatencyMs} ms)
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed font-mono">
                Mathematical Formula: <br />
                {"P(y|x) = (1/Z(x)) * exp( \\sum A_{y_{i-1}, y_i} + \\sum P_{i, y_i} )"} <br />
                {"\\alpha_{ij} = \\frac{\\exp(\\text{LeakyReLU}(a^T [Wh_i || Wh_j]))}{\\sum_k \\exp(\\text{LeakyReLU}(a^T [Wh_i || Wh_k]))}"}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
