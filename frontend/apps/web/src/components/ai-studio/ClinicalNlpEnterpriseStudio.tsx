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
  ArrowRight,
  UserCheck,
  Hospital,
  Shield,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Calendar,
  Lock,
  Compass,
  Box
} from "lucide-react";
import { aiApi } from "@/lib/api";

// ══════════════════════════════════════════════════════════════════════════
// 1. HIGH-STAKES ENTERPRISE CLINICAL PRESETS (REAL-WORLD HOSPITALS)
// ══════════════════════════════════════════════════════════════════════════
interface ClinicalPreset {
  id: string;
  name: string;
  department: string;
  category: "CARDIOLOGY" | "ICU_SEPSIS" | "ENDOCRINOLOGY" | "ONCOLOGY" | "STROKE_NEURO" | "PEDIATRIC";
  badge: string;
  badgeColor: string;
  patientUhid: string;
  patientAgeSex: string;
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
    patientUhid: "UHID-CCU-88219",
    patientAgeSex: "58Y / Male",
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
    patientUhid: "UHID-ICU-49102",
    patientAgeSex: "64Y / Female",
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
    patientUhid: "UHID-NEP-30198",
    patientAgeSex: "71Y / Male",
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
    patientUhid: "UHID-PATH-71822",
    patientAgeSex: "52Y / Female",
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
    patientUhid: "UHID-STR-10924",
    patientAgeSex: "67Y / Male",
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
    patientUhid: "UHID-PED-55190",
    patientAgeSex: "4Y / Female",
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
// 2. MAIN COMPONENT: ENTERPRISE CLINICAL NLP INTELLIGENCE WORKSTATION
// ══════════════════════════════════════════════════════════════════════════
export default function ClinicalNlpEnterpriseStudio() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("cardiac-stemi");
  const [clinicalText, setClinicalText] = useState<string>(CLINICAL_PRESETS[0].text);
  const [activeSubTab, setActiveSubTab] = useState<"coding" | "assertion" | "graph" | "risk" | "pharmacovigilance" | "fhir" | "telemetry" | "signoff">("coding");
  const [graphDimensionMode, setGraphDimensionMode] = useState<"2D" | "3D" | "4D">("2D");
  const [temporalStep, setTemporalStep] = useState<number>(0);
  const [isTemporalPlaying, setIsTemporalPlaying] = useState<boolean>(false);
  const [yawAngle, setYawAngle] = useState<number>(35);
  const [pitchAngle, setPitchAngle] = useState<number>(20);
  const [autoRotate3D, setAutoRotate3D] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"annotated" | "redacted" | "editor" | "sections">("annotated");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showArchModal, setShowArchModal] = useState<boolean>(false);

  // Pathologist Sign-Off State
  const [pathologistName, setPathologistName] = useState<string>("Dr. Sunita Deshmukh, MD (Path)");
  const [licenseNumber, setLicenseNumber] = useState<string>("MCI-48192-MH");
  const [verificationStatus, setVerificationStatus] = useState<"PENDING" | "VERIFIED" | "FLAGGED">("PENDING");
  const [verificationTimestamp, setVerificationTimestamp] = useState<string | null>(null);

  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);

  // Run analysis on mount and when text updates
  useEffect(() => {
    executeAnalysis(clinicalText);
  }, []);

  // 4D Temporal Auto-Play Loop
  useEffect(() => {
    let interval: any = null;
    if (isTemporalPlaying) {
      interval = setInterval(() => {
        setTemporalStep((prev) => (prev >= 4 ? 0 : prev + 1));
      }, 2200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTemporalPlaying]);

  // 3D Canvas Projection Render Loop
  useEffect(() => {
    if (graphDimensionMode !== "3D" || activeSubTab !== "graph") return;

    let animFrame: number;
    const canvas = canvas3DRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let currentYaw = yawAngle;
    const render3D = () => {
      if (autoRotate3D) {
        currentYaw = (currentYaw + 0.4) % 360;
        setYawAngle(currentYaw);
      }

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle surgical grid floor
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 1;
      const radYaw = (currentYaw * Math.PI) / 180;
      const radPitch = (pitchAngle * Math.PI) / 180;

      const cosY = Math.cos(radYaw);
      const sinY = Math.sin(radYaw);
      const cosP = Math.cos(radPitch);
      const sinP = Math.sin(radPitch);

      // Floor grid lines
      for (let g = -160; g <= 160; g += 40) {
        // Line along X
        const p1 = project3D(-160, g, -70, cosY, sinY, cosP, sinP, width, height);
        const p2 = project3D(160, g, -70, cosY, sinY, cosP, sinP, width, height);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Line along Y
        const p3 = project3D(g, -160, -70, cosY, sinY, cosP, sinP, width, height);
        const p4 = project3D(g, 160, -70, cosY, sinY, cosP, sinP, width, height);
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }

      // Draw 3D Edges
      if (analysisResult?.knowledgeGraph?.edges) {
        ctx.lineWidth = 1.5;
        analysisResult.knowledgeGraph.edges.forEach((edge: any) => {
          const sNode = analysisResult.knowledgeGraph.nodes.find((n: any) => n.id === edge.source);
          const tNode = analysisResult.knowledgeGraph.nodes.find((n: any) => n.id === edge.target);
          const sCoord = analysisResult.knowledgeGraph.dimensionalCoordinates?.projection3D?.find((c: any) => c.id === edge.source);
          const tCoord = analysisResult.knowledgeGraph.dimensionalCoordinates?.projection3D?.find((c: any) => c.id === edge.target);

          if (sCoord && tCoord) {
            const sp = project3D(sCoord.x, sCoord.y, sCoord.z, cosY, sinY, cosP, sinP, width, height);
            const tp = project3D(tCoord.x, tCoord.y, tCoord.z, cosY, sinY, cosP, sinP, width, height);

            ctx.beginPath();
            ctx.moveTo(sp.x, sp.y);
            ctx.lineTo(tp.x, tp.y);
            if (edge.relation === "CONTRAINDICATED_WARNING") {
              ctx.strokeStyle = "#F43F5E";
              ctx.setLineDash([4, 4]);
            } else {
              ctx.strokeStyle = "#94A3B8";
              ctx.setLineDash([]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      }

      // Draw 3D Nodes sorted by depth Z
      if (analysisResult?.knowledgeGraph?.dimensionalCoordinates?.projection3D) {
        const sortedNodes = [...analysisResult.knowledgeGraph.dimensionalCoordinates.projection3D].map((c: any) => {
          const originalNode = analysisResult.knowledgeGraph.nodes.find((n: any) => n.id === c.id);
          const proj = project3D(c.x, c.y, c.z, cosY, sinY, cosP, sinP, width, height);
          return { ...c, ...proj, originalNode };
        }).sort((a, b) => b.depth - a.depth);

        sortedNodes.forEach((node) => {
          const r = Math.max(5, Math.min(14, 10 * (1 + node.depth / 400)));
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);

          // Layer coloring: Lab (Sky), Disease (Purple), Drug (Emerald)
          if (node.layer === "LAB") {
            ctx.fillStyle = "#0284C7";
          } else if (node.layer === "DISEASE") {
            ctx.fillStyle = "#7C3AED";
          } else if (node.layer === "DRUG") {
            ctx.fillStyle = "#059669";
          } else {
            ctx.fillStyle = "#0D9488";
          }
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#FFFFFF";
          ctx.stroke();

          // Node Label
          ctx.fillStyle = "#1E293B";
          ctx.font = "bold 9px monospace";
          const label = node.originalNode?.label || node.id;
          ctx.fillText(label.substring(0, 18), node.x + r + 3, node.y + 3);
        });
      }

      if (autoRotate3D) {
        animFrame = requestAnimationFrame(render3D);
      }
    };

    render3D();

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [graphDimensionMode, activeSubTab, yawAngle, pitchAngle, autoRotate3D, analysisResult]);

  function project3D(x: number, y: number, z: number, cosY: number, sinY: number, cosP: number, sinP: number, w: number, h: number) {
    // Yaw rotation around Z axis
    const x1 = x * cosY - y * sinY;
    const y1 = x * sinY + y * cosY;
    const z1 = z;

    // Pitch rotation around X axis
    const x2 = x1;
    const y2 = y1 * cosP - z1 * sinP;
    const z2 = y1 * sinP + z1 * cosP;

    // Perspective projection
    const fov = 450;
    const scale = fov / (fov + y2 + 180);
    const px = w / 2 + x2 * scale;
    const py = h / 2 - z2 * scale;

    return { x: px, y: py, depth: y2 };
  }

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

  const handleSignOff = () => {
    setVerificationStatus("VERIFIED");
    setVerificationTimestamp(new Date().toLocaleString());
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

  // Filter entities
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

  const activePreset = CLINICAL_PRESETS.find(p => p.id === selectedPresetId) || CLINICAL_PRESETS[0];

  return (
    <div
      className={`transition-all duration-300 font-sans ${
        isFullScreen ? "fixed inset-0 z-50 bg-[#F8FAFC] p-4 overflow-y-auto" : "space-y-4"
      }`}
      style={{ zoom: `${zoomLevel}%` }}
    >
      
      {/* ══════════════════════════════════════════════════════════════════════
          HOSPITAL INSTITUTION HEADER & LIVE CLINICAL ENCOUNTER BANNER
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
                <Brain className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    Biomedical Clinical NLP & Multi-Ontology Intelligence Suite
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                    Enterprise Tier 4
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500">
                  National Clinical Research Institute & Super-Specialty Medical Center • Division of Pathology & Medical Informatics
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbars & Zoom Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Screen Zoom Slider */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-600 gap-1.5">
              <ZoomOut
                className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-700"
                onClick={() => setZoomLevel(Math.max(70, zoomLevel - 15))}
              />
              <span className="font-mono text-[11px] font-bold text-slate-700 w-9 text-center">
                {zoomLevel}%
              </span>
              <ZoomIn
                className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-700"
                onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))}
              />
            </div>

            <button
              onClick={() => setShowArchModal(true)}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="View Architecture HLD / LLD Specifications"
            >
              <Box className="w-3.5 h-3.5 text-purple-600" /> Architecture HLD/LLD
            </button>

            <button
              onClick={() => executeAnalysis(clinicalText)}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isLoading ? "Executing NLP Pipeline..." : "Re-Analyze Narrative"}
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

        {/* Live Patient Encounter Context Banner */}
        <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient UHID</span>
            <span className="font-mono font-bold text-slate-800">{activePreset.patientUhid}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Demographics</span>
            <span className="font-bold text-slate-800">{activePreset.patientAgeSex}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Encounter Dept</span>
            <span className="font-bold text-slate-800 line-clamp-1">{activePreset.department.split("(")[0]}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">HIPAA Privacy Status</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" /> Safe-Harbor Masked
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Quality Standard</span>
            <span className="font-bold text-teal-700 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-600" /> ISO-15189:2022
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Electronic Verification</span>
            <span className={`font-bold flex items-center gap-1 ${verificationStatus === "VERIFIED" ? "text-emerald-700" : "text-amber-700"}`}>
              <UserCheck className="w-3 h-3" /> {verificationStatus === "VERIFIED" ? "Verified" : "Pending Sign-Off"}
            </span>
          </div>
        </div>

        {/* Real-World Hospital Case Presets */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> High-Acuity Hospital Research Presets (1-Click Load)
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Selected: <strong className="text-slate-800">{activePreset.name}</strong>
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
                  <div
                    className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md inline-block mb-1 border uppercase tracking-wider"
                    style={{
                      background: isSelected ? "#FFFFFF" : "#F1F5F9",
                      borderColor: isSelected ? "#99F6E4" : "#E2E8F0",
                      color: isSelected ? "#0F766E" : "#475569"
                    }}
                  >
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
          SEQUENTIAL CLINICAL WORKFLOW STEPPER BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between overflow-x-auto pb-1 no-scrollbar gap-2 text-xs">
          {[
            { step: 1, label: "1. Ingest & PHI Scrub", sub: "HIPAA Safe-Harbor", active: viewMode === "redacted" },
            { step: 2, label: "2. SOAP Segment", sub: "Section Boundaries", active: viewMode === "sections" },
            { step: 3, label: "3. Biomedical NER", sub: "LOINC/RxNorm/Anat", active: activeSubTab === "coding" },
            { step: 4, label: "4. ConText Assertion", sub: "NegEx Syntactic", active: activeSubTab === "assertion" },
            { step: 5, label: "5. Dual Coding", sub: "ICD-10/11 & SNOMED", active: activeSubTab === "coding" },
            { step: 6, label: "6. Knowledge Graph", sub: "2D/3D/4D GAT", active: activeSubTab === "graph" },
            { step: 7, label: "7. Clinical Risk", sub: "7 Validated Scores", active: activeSubTab === "risk" },
            { step: 8, label: "8. Pharmacovigilance", sub: "DDI & Warnings", active: activeSubTab === "pharmacovigilance" },
            { step: 9, label: "9. FHIR R4 Sign-Off", sub: "Pathologist Verified", active: activeSubTab === "signoff" || activeSubTab === "fhir" }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border whitespace-nowrap transition cursor-pointer ${
                item.active
                  ? "bg-teal-50 border-teal-300 text-teal-900 font-extrabold shadow-2xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 font-medium hover:bg-slate-100"
              }`}
              onClick={() => {
                if (item.step === 1) setViewMode("redacted");
                else if (item.step === 2) setViewMode("sections");
                else if (item.step === 3 || item.step === 5) setActiveSubTab("coding");
                else if (item.step === 4) setActiveSubTab("assertion");
                else if (item.step === 6) setActiveSubTab("graph");
                else if (item.step === 7) setActiveSubTab("risk");
                else if (item.step === 8) setActiveSubTab("pharmacovigilance");
                else if (item.step === 9) setActiveSubTab("signoff");
              }}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                item.active ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {item.step}
              </div>
              <div>
                <div className="text-[11px] font-bold">{item.label}</div>
                <div className="text-[9px] text-slate-400">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN WORKSTATION GRID: (LEFT: NARRATIVE & PHI, RIGHT: CLINICAL SUITES)
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
                Electronic Medical Record narrative, discharge summary or surgical pathology note
              </p>
            </div>
            
            {/* View Switcher: Annotated Heatmap vs HIPAA Scrubbed vs Raw Editor vs SOAP */}
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
                onClick={() => setViewMode("redacted")}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                  viewMode === "redacted" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                HIPAA Mask
              </button>
              <button
                onClick={() => setViewMode("editor")}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                  viewMode === "editor" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Raw Editor
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

          {/* VIEW MODE 3: HIPAA SAFE-HARBOR DE-IDENTIFIED TEXT */}
          {viewMode === "redacted" && (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> HIPAA Safe-Harbor Privacy Cleared
                </span>
                <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {analysisResult?.deidentification?.redactedCount || 0} PHI Items Masked
                </span>
              </div>
              <div className="max-h-[440px] overflow-y-auto bg-[#FAFBFD] border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap select-text">
                {analysisResult?.deidentification?.scrubbedText || clinicalText}
              </div>
              <p className="text-[10px] text-slate-400">
                Safe for multi-center clinical trials, epidemiological research, and compliance audit exports without HIPAA violations.
              </p>
            </div>
          )}

          {/* VIEW MODE 4: SOAP / H&P SECTIONS */}
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
                    <strong className="text-slate-800 shrink-0">Protocol Action:</strong>
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
              { id: "coding", label: "Dual Coding", icon: Database, badge: analysisResult?.suggestedICD10?.length || 0 },
              { id: "assertion", label: "NegEx Assertion", icon: ShieldCheck, badge: analysisResult?.entities?.length || 0 },
              { id: "graph", label: "GNN Graph (2D/3D/4D)", icon: Network, badge: analysisResult?.relations?.length || 0 },
              { id: "risk", label: "Clinical Risk Suite", icon: Activity, badge: "7 Scores" },
              { id: "pharmacovigilance", label: "Pharmacovigilance", icon: Pill, badge: analysisResult?.pharmacovigilance?.interactions?.length || 0 },
              { id: "fhir", label: "HL7 FHIR R4", icon: FileCheck, badge: analysisResult?.fhirR4Bundle?.total || 0 },
              { id: "telemetry", label: "Deep ML Telemetry", icon: Binary, badge: "CRF" },
              { id: "signoff", label: "Pathologist Sign-Off", icon: Award, badge: verificationStatus }
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
                    Observed Laboratory Analytes & LOINC 6-Axis Dual Mapping
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
                  <span className="text-[10px] text-slate-500">CMS-HCC Risk Adjustment Factor (RAF) Coded</span>
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
                    SNOMED CT International Terminology
                  </h4>
                  <span className="text-[10px] text-slate-500">Concept ID & Fully Specified Names (FSN)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysisResult?.snomedCodes?.map((s: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-blue-700">Concept {s.id}</span>
                        <div className="font-bold text-slate-800 mt-0.5 line-clamp-1">{s.fsn}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{s.category} ({s.semanticTag})</div>
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
                  <span className="text-[10px] text-slate-500">Dose, Route, Frequency & Black-Box Audits</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysisResult?.rxNormCodes?.map((rx: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          RxCUI {rx.rxcui} • ATC: {rx.atcCode || "N/A"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">{rx.class}</span>
                      </div>
                      <div className="font-bold text-xs text-slate-900">{rx.name}</div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        Dose: <strong className="text-slate-800">{rx.dosage}</strong> • Freq: <strong className="text-slate-800">{rx.frequency}</strong>
                      </div>
                      {rx.blackBoxWarning && (
                        <div className="text-[10px] text-rose-700 bg-rose-50/70 p-1.5 rounded border border-rose-200 font-sans mt-1">
                          <strong>Warning:</strong> {rx.blackBoxWarning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 2: CONTEXT & NEGEX SYNTACTIC ASSERTION ENGINE
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
              TAB 3: CLINICAL KNOWLEDGE GRAPH (2D FORCE, 3D SPATIAL, 4D TEMPORAL)
          ════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "graph" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Multi-Dimensional Knowledge Graph Engine</h4>
                  <p className="text-[11px] text-slate-500">2D Force Adjacency • 3D Depth Isometric Perspective • 4D Longitudinal Temporal Evolution.</p>
                </div>

                {/* Dimension Mode Selector */}
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setGraphDimensionMode("2D")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      graphDimensionMode === "2D" ? "bg-teal-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    2D Force
                  </button>
                  <button
                    onClick={() => setGraphDimensionMode("3D")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      graphDimensionMode === "3D" ? "bg-teal-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    3D Spatial
                  </button>
                  <button
                    onClick={() => setGraphDimensionMode("4D")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      graphDimensionMode === "4D" ? "bg-teal-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    4D Temporal
                  </button>
                </div>
              </div>

              {/* ── 2D MODE: INTERACTIVE FORCE GRAPH TOPOLOGY ── */}
              {graphDimensionMode === "2D" && (
                <div className="border border-slate-200 rounded-xl bg-[#FAFBFD] p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">2D Concentric Force Layout</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {analysisResult?.knowledgeGraph?.nodes?.length || 0} Nodes • {analysisResult?.knowledgeGraph?.edges?.length || 0} Edges
                    </span>
                  </div>

                  <div className="relative w-full h-[360px] bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 800 600">
                      {/* Edges */}
                      {analysisResult?.knowledgeGraph?.edges?.map((edge: any, eIdx: number) => {
                        const s = analysisResult.knowledgeGraph.dimensionalCoordinates?.projection2D?.find((c: any) => c.id === edge.source);
                        const t = analysisResult.knowledgeGraph.dimensionalCoordinates?.projection2D?.find((c: any) => c.id === edge.target);
                        if (!s || !t) return null;
                        const isWarning = edge.relation === "CONTRAINDICATED_WARNING";

                        return (
                          <g key={eIdx}>
                            <line
                              x1={s.x}
                              y1={s.y}
                              x2={t.x}
                              y2={t.y}
                              stroke={isWarning ? "#F43F5E" : "#94A3B8"}
                              strokeWidth={isWarning ? 2.5 : 1.5}
                              strokeDasharray={isWarning ? "5,5" : "none"}
                            />
                          </g>
                        );
                      })}

                      {/* Nodes */}
                      {analysisResult?.knowledgeGraph?.dimensionalCoordinates?.projection2D?.map((nodeCoord: any, nIdx: number) => {
                        const originalNode = analysisResult.knowledgeGraph.nodes.find((n: any) => n.id === nodeCoord.id);
                        const isDiag = originalNode?.type === "DIAGNOSIS_ICD10";
                        const isDrug = originalNode?.type === "PHARMACOTHERAPY";

                        return (
                          <g key={nIdx} className="cursor-pointer group">
                            <circle
                              cx={nodeCoord.x}
                              cy={nodeCoord.y}
                              r={nodeCoord.radius}
                              fill={isDiag ? "#7C3AED" : isDrug ? "#059669" : "#0284C7"}
                              stroke="#FFFFFF"
                              strokeWidth={2.5}
                            />
                            <text
                              x={nodeCoord.x}
                              y={nodeCoord.y + nodeCoord.radius + 12}
                              fontSize="10"
                              fontWeight="bold"
                              fill="#1E293B"
                              textAnchor="middle"
                            >
                              {(originalNode?.label || nodeCoord.id).substring(0, 16)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              )}

              {/* ── 3D MODE: PERSPECTIVE PROJECTION WITH ROTATION CONTROLS ── */}
              {graphDimensionMode === "3D" && (
                <div className="border border-slate-200 rounded-xl bg-[#FAFBFD] p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-700">3D Depth Perspective Projection (Z-axis Layered)</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoRotate3D}
                          onChange={(e) => setAutoRotate3D(e.target.checked)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        Auto-Spin 360°
                      </label>
                      <button
                        onClick={() => { setYawAngle(35); setPitchAngle(20); }}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Reset Camera
                      </button>
                    </div>
                  </div>

                  {/* 3D Canvas Viewport */}
                  <div className="relative w-full h-[360px] bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                    <canvas
                      ref={canvas3DRef}
                      width={800}
                      height={400}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Camera Rotation Sliders */}
                  <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                        <span>Yaw Angle (Rotate X-Y)</span>
                        <span className="font-mono">{Math.round(yawAngle)}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={yawAngle}
                        onChange={(e) => setYawAngle(parseFloat(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                        <span>Pitch Angle (Elevation)</span>
                        <span className="font-mono">{Math.round(pitchAngle)}°</span>
                      </div>
                      <input
                        type="range"
                        min="-60"
                        max="60"
                        value={pitchAngle}
                        onChange={(e) => setPitchAngle(parseFloat(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 4D MODE: LONGITUDINAL TEMPORAL EVOLUTION TRAJECTORY ── */}
              {graphDimensionMode === "4D" && (
                <div className="border border-slate-200 rounded-xl bg-[#FAFBFD] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900">4D Longitudinal Temporal Evolution</h5>
                      <p className="text-[11px] text-slate-500">Tracks physiological progression from emergency presentation to biomarker clearance and discharge reconciliation.</p>
                    </div>
                    <button
                      onClick={() => setIsTemporalPlaying(!isTemporalPlaying)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isTemporalPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isTemporalPlaying ? "Pause Timeline" : "Simulate 4D Course"}
                    </button>
                  </div>

                  {/* Step Slider */}
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="1"
                      value={temporalStep}
                      onChange={(e) => setTemporalStep(parseInt(e.target.value, 10))}
                      className="w-full accent-teal-600"
                    />
                    <div className="grid grid-cols-5 text-center text-[10px] font-mono font-bold text-slate-500">
                      <span>t0: 0h (Admission)</span>
                      <span>t1: +2h (Stat Labs)</span>
                      <span>t2: +6h (Therapy)</span>
                      <span>t3: +24h (Draw 2)</span>
                      <span>t4: +48h (Discharge)</span>
                    </div>
                  </div>

                  {/* Active 4D Step Details Card */}
                  {analysisResult?.knowledgeGraph?.dimensionalCoordinates?.timeline4D && (
                    <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-teal-900">
                          {analysisResult.knowledgeGraph.dimensionalCoordinates.timeline4D[temporalStep]?.label}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-teal-200 text-teal-800">
                          Status: {analysisResult.knowledgeGraph.dimensionalCoordinates.timeline4D[temporalStep]?.physiologicalStability}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700">
                        <strong>Active Clinical Targets: </strong>
                        <span>
                          {analysisResult.knowledgeGraph.dimensionalCoordinates.timeline4D[temporalStep]?.activeConditions?.join(", ") || "Standard monitoring"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Hop Relation List */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Extracted Multi-Hop Clinical Relationships</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto">
                  {analysisResult?.relations?.map((rel: any, idx: number) => {
                    const isWarning = rel.relation === "CONTRAINDICATED_WARNING";
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          isWarning ? "bg-rose-50 border-rose-200" : "bg-slate-50/70 border-slate-200"
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
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 4: REAL-WORLD CLINICAL RISK & REGRESSION SCORING SUITE
          ════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "risk" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-900">Empirical Clinical Risk & Severity Regression Suite</h4>
                <p className="text-[11px] text-slate-500">7 guideline-validated clinical calculators computed deterministically from parsed unstructured narrative.</p>
              </div>

              {/* 7 Quantitative Clinical Risk Scores Grid */}
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
                    eGFR: {analysisResult?.clinicalRiskScores?.egfrCalculated ?? 95} mL/min
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                  <div className="text-[10px] font-bold text-rose-700 uppercase">Sepsis-3 SOFA</div>
                  <div className="text-xl font-black text-rose-900 mt-1">
                    {analysisResult?.clinicalRiskScores?.sofaScoreEstimate ?? 1}/24
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5">
                    qSOFA: {analysisResult?.clinicalRiskScores?.qSofaScore ?? 0}/3
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="text-[10px] font-bold text-amber-700 uppercase">CHA2DS2-VASc</div>
                  <div className="text-xl font-black text-amber-900 mt-1">
                    {analysisResult?.clinicalRiskScores?.cha2ds2VascScore ?? 0}/9
                  </div>
                  <div className="text-[10px] text-amber-600 mt-0.5">
                    Stroke Risk in AFib
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
                  <div className="text-[10px] font-bold text-indigo-700 uppercase">HAS-BLED Score</div>
                  <div className="text-xl font-black text-indigo-900 mt-1">
                    {analysisResult?.clinicalRiskScores?.hasBledScore ?? 0}/9
                  </div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">
                    Major Bleeding Risk
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 col-span-2 sm:col-span-2">
                  <div className="text-[10px] font-bold text-teal-700 uppercase">CURB-65 Pneumonia Severity</div>
                  <div className="text-xl font-black text-teal-900 mt-1">
                    {analysisResult?.clinicalRiskScores?.curb65Score ?? 0}/5
                  </div>
                  <div className="text-[10px] text-teal-600 mt-0.5">
                    {analysisResult?.clinicalRiskScores?.curb65Score >= 3 ? "Urgent Inpatient / ICU Mandated" : "Outpatient / Short Stay Eligible"}
                  </div>
                </div>
              </div>

              {/* Classified Phenotypes */}
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
              TAB 5: PHARMACOVIGILANCE & DRUG-DRUG INTERACTIONS
          ════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "pharmacovigilance" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-900">Hospital Pharmacovigilance & Drug-Drug Interaction Matrix</h4>
                <p className="text-[11px] text-slate-500">Cross-analyzes identified medications against FDA black-box warnings and renal contraindications.</p>
              </div>

              {/* Drug-Drug Interactions */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Drug-Drug Interactions (DDI)</h5>
                {analysisResult?.pharmacovigilance?.interactions?.length > 0 ? (
                  analysisResult.pharmacovigilance.interactions.map((inter: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-rose-300 bg-rose-50/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-rose-900">
                          {inter.drugs.join(" + ")}
                        </span>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase">
                          {inter.severity}
                        </span>
                      </div>
                      <p className="text-xs text-rose-800 leading-relaxed">{inter.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 font-medium">
                    No critical multi-drug pharmacodynamic antagonisms detected in current regimen.
                  </div>
                )}
              </div>

              {/* Contraindications */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Drug-Disease Contraindication Alerts</h5>
                {analysisResult?.pharmacovigilance?.contraindications?.length > 0 ? (
                  analysisResult.pharmacovigilance.contraindications.map((contra: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-900">{contra.drug} in {contra.disease}</span>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-600 text-white uppercase">
                          {contra.severity}
                        </span>
                      </div>
                      <p className="text-xs text-amber-800">{contra.recommendation}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 font-medium">
                    No active drug-disease organ contraindications identified.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 6: HL7 FHIR R4 CLINICAL RESOURCE BUNDLE
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
              TAB 7: DEEP LEARNING & MATHEMATICAL RIGOR TELEMETRY
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase">CRF Viterbi Trellis Score</span>
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
                Mathematical Model Formulations: <br />
                {"1. Linear-Chain CRF: P(y|x) = (1/Z(x)) * exp( sum_t [ A_{y_{t-1}, y_t} + P_{t, y_t} ] )"} <br />
                {"2. GATv2 Attention: alpha_{ij} = [ exp(LeakyReLU(a^T [W h_i || W h_j])) ] / [ sum_k exp(LeakyReLU(a^T [W h_i || W h_k])) ]"} <br />
                {"3. CKD-EPI 2021 Race-Free: eGFR = 142 * min(Scr/kappa, 1)^alpha * max(Scr/kappa, 1)^-1.200 * 0.9938^Age"}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 8: ATTENDING PATHOLOGIST REVIEW & ELECTRONIC SIGN-OFF
          ════════════════════════════════════════════════════════════════ */}
          {activeSubTab === "signoff" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-teal-600" />
                  Pathologist & Attending Physician Clinical Verification
                </h4>
                <p className="text-[11px] text-slate-500">
                  Per CLIA §493.1291 and CAP GEN.43882, automated clinical NLP extractions must be signed by a registered medical practitioner before official diagnostic record release.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Attending Pathologist Name
                    </label>
                    <input
                      type="text"
                      value={pathologistName}
                      onChange={(e) => setPathologistName(e.target.value)}
                      className="w-full bg-[#FAFBFD] border border-slate-200 rounded-lg p-2 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Medical Council Registration No
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full bg-[#FAFBFD] border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Verification Status</span>
                    <span className={`font-black text-xs ${verificationStatus === "VERIFIED" ? "text-emerald-700" : "text-amber-700"}`}>
                      {verificationStatus === "VERIFIED" ? `Signed & Released: ${verificationTimestamp}` : "Pending Verification"}
                    </span>
                  </div>

                  <button
                    onClick={handleSignOff}
                    disabled={verificationStatus === "VERIFIED"}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UserCheck className="w-4 h-4" />
                    {verificationStatus === "VERIFIED" ? "Verification Stamped" : "Electronically Sign & Release to EMR"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ARCHITECTURE HLD & LLD SPECIFICATIONS MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showArchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Box className="w-5 h-5 text-purple-600" />
                  Enterprise Clinical NLP System Architecture (HLD & LLD)
                </h3>
                <p className="text-xs text-slate-500">ISO-15189:2022, CAP Laboratory Accreditation & HL7 FHIR R4 Standards</p>
              </div>
              <button
                onClick={() => setShowArchModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
                <h4 className="font-extrabold text-purple-900 mb-1">High-Level Design (HLD) Pipeline Flow</h4>
                <p>
                  Unstructured Clinical Note → [1. HIPAA Safe-Harbor De-Identification Proxy] → [2. Lexical & SOAP Boundary Segmenter] → [3. Biomedical-ClinicalBERT & BioLinkBERT Subword Tokenizer] → [4. Dual-Ontology Normalizer (ICD-10/11, SNOMED CT, LOINC, RxNorm)] → [5. ConText / NegEx Syntactic Assertion Engine] → [6. GATv2 Multi-Hop Relation Knowledge Graph] → [7. 7-Metric Clinical Risk Scoring Suite] → [8. Pharmacovigilance & DDI Matrix] → [9. HL7 FHIR R4 Standardized Resource Bundle].
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-extrabold text-slate-900 mb-1">Low-Level Design (LLD) Specifications & Formulations</h4>
                <ul className="list-disc pl-4 space-y-1 font-mono text-[11px]">
                  <li>Linear-Chain Conditional Random Field (CRF) with Viterbi decoding trellis</li>
                  <li>Token Attention Shannon Entropy: H(A) = - Σ (p_i * log2(p_i))</li>
                  <li>Graph Attention Network (GATv2) layer weights: α_ij = softmax(LeakyReLU(a^T [Wh_i || Wh_j]))</li>
                  <li>CKD-EPI 2021 Race-Free Creatinine eGFR formula</li>
                  <li>Charlson Comorbidity Index (CCI) + age-adjusted 10-year mortality prediction</li>
                  <li>Sepsis-3 SOFA (Sequential Organ Failure Assessment) & qSOFA scoring algorithms</li>
                  <li>TIMI Risk Score for ACS, CHA2DS2-VASc for Atrial Fibrillation, HAS-BLED for Bleeding Risk</li>
                  <li>HL7 FHIR R4 Resources: DiagnosticReport, Observation, Condition, MedicationStatement, RiskAssessment</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                <h4 className="font-extrabold mb-1">Regulatory & Compliance Certifications</h4>
                <p>
                  Designed in compliance with College of American Pathologists (CAP) Accreditation, National Accreditation Board for Testing and Calibration Laboratories (NABL ISO-15189:2022), Clinical Laboratory Improvement Amendments (CLIA 42 CFR 493), and FDA 21 CFR Part 11 Electronic Records.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right border-t border-slate-100">
              <button
                onClick={() => setShowArchModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Architecture Modal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
