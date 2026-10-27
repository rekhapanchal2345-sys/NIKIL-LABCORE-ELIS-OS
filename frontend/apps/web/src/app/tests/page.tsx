"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { testApi } from "@/lib/api";
import TubeGuideModal from "@/components/tests/TubeGuideModal";
import TariffPrintModal from "@/components/tests/TariffPrintModal";
import TestDrawer from "@/components/tests/TestDrawer";
import PackageMatrixView from "@/components/tests/PackageMatrixView";
import ParameterMatrixView from "@/components/tests/ParameterMatrixView";
import ClinicalFormulaEngine from "@/components/tests/ClinicalFormulaEngine";
import AnalyzerQCTracker from "@/components/tests/AnalyzerQCTracker";
import BulkPriceModal from "@/components/tests/BulkPriceModal";
import CloneTestModal from "@/components/tests/CloneTestModal";
import QuickOrderRequisitionModal from "@/components/tests/QuickOrderRequisitionModal";
import AnalyzerInterfacingEngine from "@/components/tests/AnalyzerInterfacingEngine";
import B2BTariffCommissionStudio from "@/components/tests/B2BTariffCommissionStudio";
import PanicValueAlertMatrix from "@/components/tests/PanicValueAlertMatrix";
import PreAnalyticalPhlebotomyGuide from "@/components/tests/PreAnalyticalPhlebotomyGuide";
import SpecimenRejectionRules from "@/components/tests/SpecimenRejectionRules";
import BarcodeLabelPreviewModal from "@/components/tests/BarcodeLabelPreviewModal";
import {
  FlaskConical,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Printer,
  Copy,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Clock3,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  Eye,
  Edit,
  Tag,
  Building2,
  ShieldCheck,
  Package,
  Activity,
  Flame,
  Table as TableIcon,
  LayoutGrid,
  ChevronRight,
  DollarSign,
  Loader2,
  FileText,
  Calculator,
  Shield,
  TrendingUp,
  X,
  Sliders,
  Check,
  Cpu,
  ShieldAlert,
  Thermometer,
  Award,
  BadgeCheck,
  Microscope,
  Stethoscope,
  Send,
  Zap,
  Info,
  Barcode,
  Hospital,
} from "lucide-react";

const VALID_WORKSPACE_TABS = [
  "catalog",
  "packages",
  "parameters",
  "formulas",
  "qc",
  "interfacing",
  "b2b-tariff",
  "panic-alerts",
  "phlebotomy-sop",
  "rejection-rules",
] as const;

export type WorkstationTabType = (typeof VALID_WORKSPACE_TABS)[number];

// =========================================================================
// REAL-WORLD COMPREHENSIVE CLINICAL HOSPITAL INVESTIGATION DATASET
// (Used as authentic baseline and fallback for enterprise hospital labs)
// =========================================================================
const ENTERPRISE_HOSPITAL_TESTS = [
  // ── 1. Hematology & Coagulation ──
  {
    id: "hosp-test-01",
    testName: "Complete Blood Count with 5-Part Differential & ESR (CBC)",
    testCode: "CBC-DIFF",
    loincCode: "58410-2",
    shortName: "CBC / Hemogram",
    category: { name: "Hematology & Coagulation", color: "#7c3aed" },
    processingDepartment: "Hematology Core",
    method: "Automated 5-Part Flow Cytometry + Impedance",
    sampleContainer: "K2 EDTA Purple Tube (3.0 mL)",
    sampleType: "WHOLE_BLOOD",
    sampleVolume: "2.5 mL",
    drawOrder: "#5 Order of Draw",
    stability: "24 Hours at 2-8°C (Do Not Freeze)",
    patientPreparation: "No fasting required (Random sample)",
    tatHours: 4,
    tatDisplay: "4h Routine / 45m STAT",
    isStatCapable: true,
    price: 450,
    offerPrice: 350,
    b2bRate: 180,
    ipdRate: 520,
    icuRate: 650,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Hb < 6.0 or > 20.0 g/dL, Platelets < 20,000 /µL",
  },
  {
    id: "hosp-test-02",
    testName: "Prothrombin Time with International Normalized Ratio (PT/INR)",
    testCode: "PT-INR",
    loincCode: "5902-2",
    shortName: "PT / INR",
    category: { name: "Hematology & Coagulation", color: "#7c3aed" },
    processingDepartment: "Coagulation Lab",
    method: "Photo-Optical Clot Detection Coagulometry",
    sampleContainer: "Sodium Citrate 3.2% Light Blue (2.7 mL)",
    sampleType: "CITRATE_PLASMA",
    sampleVolume: "2.7 mL (Exact 9:1 Fill Mandatory)",
    drawOrder: "#2 Order of Draw",
    stability: "4 Hours at 18-25°C (Do Not Refrigerate)",
    patientPreparation: "Document Anticoagulant Therapy (Warfarin/Acenocoumarol)",
    tatHours: 2,
    tatDisplay: "2h Routine / 30m STAT",
    isStatCapable: true,
    price: 350,
    offerPrice: 280,
    b2bRate: 140,
    ipdRate: 400,
    icuRate: 500,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "INR > 4.5 (Major Hemorrhage Risk)",
  },
  {
    id: "hosp-test-03",
    testName: "D-Dimer Quantitative Assay (Fibrin Degradation)",
    testCode: "D-DIMER",
    loincCode: "48065-7",
    shortName: "D-Dimer Quant",
    category: { name: "Hematology & Coagulation", color: "#7c3aed" },
    processingDepartment: "Coagulation Lab",
    method: "Latex-Enhanced Particle Immunoturbidimetry",
    sampleContainer: "Sodium Citrate 3.2% Light Blue (2.7 mL)",
    sampleType: "CITRATE_PLASMA",
    sampleVolume: "2.7 mL",
    drawOrder: "#2 Order of Draw",
    stability: "4 Hours at 2-8°C / 1 Month at -20°C",
    patientPreparation: "Non-fasting emergency evaluation (DVT/PE/DIC)",
    tatHours: 2,
    tatDisplay: "2h Routine / 45m STAT",
    isStatCapable: true,
    price: 1250,
    offerPrice: 990,
    b2bRate: 650,
    ipdRate: 1450,
    icuRate: 1650,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "D-Dimer > 5,000 ng/mL FEU (Critical Thromboembolism)",
  },
  {
    id: "hosp-test-04",
    testName: "ABO Blood Grouping & Rhesus (RhD) Typing with Subgrouping",
    testCode: "BLOOD-GRP",
    loincCode: "883-9",
    shortName: "ABO & Rh Type",
    category: { name: "Hematology & Coagulation", color: "#7c3aed" },
    processingDepartment: "Blood Transfusion Lab",
    method: "Column Agglutination Technology (Gel Card Method)",
    sampleContainer: "K2 EDTA Purple Tube (3.0 mL)",
    sampleType: "WHOLE_BLOOD",
    sampleVolume: "3.0 mL",
    drawOrder: "#5 Order of Draw",
    stability: "48 Hours at 2-8°C",
    patientPreparation: "No preparation required",
    tatHours: 2,
    tatDisplay: "2h Routine / 20m STAT Emergency",
    isStatCapable: true,
    price: 220,
    offerPrice: 180,
    b2bRate: 90,
    ipdRate: 280,
    icuRate: 350,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Rh Negative in pregnancy / Transfusion cross-match incompatibility",
  },

  // ── 2. Clinical Biochemistry & Metabolic Panels ──
  {
    id: "hosp-test-05",
    testName: "Comprehensive Liver Function Test with Enzymes (LFT Extended)",
    testCode: "LFT-EXT",
    loincCode: "24325-3",
    shortName: "LFT Complete",
    category: { name: "Clinical Biochemistry", color: "#2563eb" },
    processingDepartment: "Biochemistry Core",
    method: "Automated Clinical Chemistry Analyzer (IFCC/Enzymatic Photometry)",
    sampleContainer: "SST Gold Gel Separator Tube (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "48 Hours at 2-8°C (Centrifuge within 1 hour)",
    patientPreparation: "8-10 Hours Overnight Fasting Required (Water Allowed)",
    tatHours: 4,
    tatDisplay: "4h Routine / 1.5h STAT",
    isStatCapable: true,
    price: 850,
    offerPrice: 650,
    b2bRate: 320,
    ipdRate: 950,
    icuRate: 1100,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Total Bilirubin > 15 mg/dL (Adult), SGOT/SGPT > 1,000 U/L",
  },
  {
    id: "hosp-test-06",
    testName: "Kidney Function Test with eGFR & BUN (KFT / RFT)",
    testCode: "KFT-RFT",
    loincCode: "24362-6",
    shortName: "Renal Function",
    category: { name: "Clinical Biochemistry", color: "#2563eb" },
    processingDepartment: "Biochemistry Core",
    method: "Enzymatic PAP / Kinetic Alkaline Picrate (IDMS Traceable)",
    sampleContainer: "SST Gold Gel Separator Tube (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "72 Hours at 2-8°C",
    patientPreparation: "Avoid excessive meat intake and heavy exercise 24h prior",
    tatHours: 4,
    tatDisplay: "4h Routine / 1h STAT",
    isStatCapable: true,
    price: 750,
    offerPrice: 550,
    b2bRate: 280,
    ipdRate: 850,
    icuRate: 980,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Creatinine > 5.0 mg/dL, BUN > 100 mg/dL",
  },
  {
    id: "hosp-test-07",
    testName: "Comprehensive Lipid Profile (Cholesterol, Triglycerides, HDL, LDL, VLDL)",
    testCode: "LIPID-EXT",
    loincCode: "24331-1",
    shortName: "Lipid Panel",
    category: { name: "Clinical Biochemistry", color: "#2563eb" },
    processingDepartment: "Biochemistry Core",
    method: "Direct Enzymatic Clearance & Colorimetry (Friedewald Calculation)",
    sampleContainer: "SST Gold Gel Separator Tube (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "7 Days at 2-8°C / 30 Days at -20°C",
    patientPreparation: "Strict 12-14 Hours Overnight Fasting (Only plain water permitted)",
    tatHours: 6,
    tatDisplay: "6h Routine",
    isStatCapable: false,
    price: 700,
    offerPrice: 499,
    b2bRate: 240,
    ipdRate: 800,
    icuRate: 900,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Triglycerides > 1,000 mg/dL (Acute Pancreatitis Risk)",
  },
  {
    id: "hosp-test-08",
    testName: "Glycated Hemoglobin (HbA1c) with Estimated Average Glucose (eAG)",
    testCode: "HBA1C-HPLC",
    loincCode: "17856-6",
    shortName: "HbA1c by HPLC",
    category: { name: "Clinical Biochemistry", color: "#2563eb" },
    processingDepartment: "Special Chemistry",
    method: "Ion-Exchange High Performance Liquid Chromatography (NGSP/IFCC Certified)",
    sampleContainer: "K2 EDTA Purple Tube (3.0 mL)",
    sampleType: "WHOLE_BLOOD",
    sampleVolume: "2.0 mL",
    drawOrder: "#5 Order of Draw",
    stability: "7 Days at 2-8°C (Do Not Centrifuge or Freeze)",
    patientPreparation: "Non-fasting (Random sample at any time)",
    tatHours: 4,
    tatDisplay: "4h Routine / 2h STAT",
    isStatCapable: true,
    price: 550,
    offerPrice: 450,
    b2bRate: 220,
    ipdRate: 650,
    icuRate: 750,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "HbA1c > 14.0% (Extreme uncontrolled hyperglycemia)",
  },
  {
    id: "hosp-test-09",
    testName: "Serum Electrolytes Panel (Sodium Na+, Potassium K+, Chloride Cl-, Bicarb)",
    testCode: "ELECTRO-SER",
    loincCode: "24326-1",
    shortName: "Electrolytes",
    category: { name: "Clinical Biochemistry", color: "#2563eb" },
    processingDepartment: "Biochemistry Core",
    method: "Direct Ion Selective Electrode (Direct ISE)",
    sampleContainer: "SST Gold / Lithium Heparin Green (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "1.5 mL",
    drawOrder: "#3 Order of Draw",
    stability: "Spin within 30 mins (Delay falsely elevates Potassium K+)",
    patientPreparation: "No specific preparation",
    tatHours: 2,
    tatDisplay: "2h Routine / 30m STAT Emergency",
    isStatCapable: true,
    price: 600,
    offerPrice: 480,
    b2bRate: 250,
    ipdRate: 720,
    icuRate: 850,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "K+ < 2.8 or > 6.2 mmol/L, Na+ < 120 or > 160 mmol/L",
  },
  {
    id: "hosp-test-10",
    testName: "Fasting Plasma Blood Glucose (FBG / Sugar Fasting)",
    testCode: "GLUCOSE-FAST",
    loincCode: "1558-6",
    shortName: "Blood Sugar Fasting",
    category: { name: "Clinical Biochemistry", color: "#2563eb" },
    processingDepartment: "Biochemistry Core",
    method: "Hexokinase / Glucose Oxidase Peroxidase (GOD-POD)",
    sampleContainer: "Sodium Fluoride Grey Tube (2.0 mL)",
    sampleType: "FLUID_PLASMA",
    sampleVolume: "1.5 mL",
    drawOrder: "#6 Order of Draw",
    stability: "48 Hours at 2-8°C (Glycolysis Inhibited by Fluoride)",
    patientPreparation: "8-10 Hours Strict Overnight Fasting Required",
    tatHours: 2,
    tatDisplay: "2h Routine / 30m STAT",
    isStatCapable: true,
    price: 100,
    offerPrice: 80,
    b2bRate: 40,
    ipdRate: 150,
    icuRate: 200,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Glucose < 45 mg/dL (Hypoglycemic coma) or > 450 mg/dL (DKA)",
  },

  // ── 3. Critical Care & Cardiac Biomarkers ──
  {
    id: "hosp-test-11",
    testName: "High Sensitivity Troponin-I (hs-cTnI) STAT Quantitative",
    testCode: "TROP-I-HS",
    loincCode: "48345-3",
    shortName: "hs-Troponin I",
    category: { name: "Cardiac & Emergency", color: "#e11d48" },
    processingDepartment: "Emergency STAT Lab",
    method: "Chemiluminescence Microparticle Immunoassay (CMIA)",
    sampleContainer: "Lithium Heparin Green / SST Gold Tube (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "4 Hours at Room Temp / 24 Hours at 2-8°C",
    patientPreparation: "Immediate emergency collection upon acute chest pain",
    tatHours: 1,
    tatDisplay: "45m Emergency STAT Priority",
    isStatCapable: true,
    price: 1800,
    offerPrice: 1500,
    b2bRate: 950,
    ipdRate: 2100,
    icuRate: 2400,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "hs-cTnI > 0.04 ng/mL (Acute Myocardial Infarction STEMI)",
  },
  {
    id: "hosp-test-12",
    testName: "Arterial Blood Gas (ABG) with Lactate & Co-Oximetry",
    testCode: "ABG-LACT",
    loincCode: "24338-6",
    shortName: "ABG + Lactate",
    category: { name: "Cardiac & Emergency", color: "#e11d48" },
    processingDepartment: "ICU Point-of-Care Lab",
    method: "Potentiometric / Amperometric Blood Gas Electrodes",
    sampleContainer: "Pre-Heparinized Balanced Gas Syringe (1.5 mL)",
    sampleType: "WHOLE_BLOOD",
    sampleVolume: "1.0 mL Anaerobic",
    drawOrder: "#1 Arterial Draw",
    stability: "Immediate analysis within 15 mins (Transport in ice slurry)",
    patientPreparation: "Record Patient FiO2, Ventilator Mode & Body Temperature",
    tatHours: 1,
    tatDisplay: "20m Critical Emergency STAT",
    isStatCapable: true,
    price: 1200,
    offerPrice: 950,
    b2bRate: 600,
    ipdRate: 1400,
    icuRate: 1600,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "pH < 7.20 or > 7.60, pO2 < 50 mmHg, Lactate > 4.0 mmol/L",
  },
  {
    id: "hosp-test-13",
    testName: "NT-proBNP Quantitative Assay (Heart Failure Biomarker)",
    testCode: "NT-PRO-BNP",
    loincCode: "33762-6",
    shortName: "NT-proBNP",
    category: { name: "Cardiac & Emergency", color: "#e11d48" },
    processingDepartment: "Immunology / Cardiac",
    method: "Electrochemiluminescence Immunoassay (ECLIA)",
    sampleContainer: "K2 EDTA Purple / SST Gold (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "3 Days at 2-8°C / 12 Months at -20°C",
    patientPreparation: "Resting sample preferred",
    tatHours: 3,
    tatDisplay: "3h Routine / 1h STAT",
    isStatCapable: true,
    price: 2600,
    offerPrice: 2200,
    b2bRate: 1400,
    ipdRate: 2900,
    icuRate: 3200,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "NT-proBNP > 1,800 pg/mL (Severe Congestive Heart Failure)",
  },

  // ── 4. Endocrinology & Immunoassays ──
  {
    id: "hosp-test-14",
    testName: "Complete Thyroid Profile (Total T3, Total T4, TSH 3rd Gen Ultrasensitive)",
    testCode: "THYROID-ULTRA",
    loincCode: "24348-5",
    shortName: "Thyroid Panel (T3, T4, TSH)",
    category: { name: "Endocrinology & Hormones", color: "#db2777" },
    processingDepartment: "Immunoassay Lab",
    method: "Chemiluminescence Immunoassay (CLIA 3rd Generation)",
    sampleContainer: "SST Gold Gel Separator Tube (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "7 Days at 2-8°C",
    patientPreparation: "Morning sample between 07:00 - 10:00 AM before thyroid meds",
    tatHours: 6,
    tatDisplay: "6h Routine / 2h STAT",
    isStatCapable: true,
    price: 550,
    offerPrice: 399,
    b2bRate: 200,
    ipdRate: 650,
    icuRate: 750,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "TSH < 0.01 µIU/mL (Thyrotoxic crisis) or > 50 µIU/mL (Myxedema)",
  },
  {
    id: "hosp-test-15",
    testName: "Vitamin D 25-Hydroxy (Total 25-OH Vitamin D2 + D3)",
    testCode: "VIT-D-25OH",
    loincCode: "62292-8",
    shortName: "Vitamin D (25-OH)",
    category: { name: "Endocrinology & Hormones", color: "#db2777" },
    processingDepartment: "Immunoassay Lab",
    method: "Chemiluminescence Microparticle Immunoassay (CMIA)",
    sampleContainer: "SST Gold Gel Separator Tube (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "Protect tube from direct sunlight / UV exposure",
    patientPreparation: "No fasting required",
    tatHours: 12,
    tatDisplay: "Same Day (12h Routine)",
    isStatCapable: false,
    price: 1200,
    offerPrice: 799,
    b2bRate: 450,
    ipdRate: 1350,
    icuRate: 1500,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Vit D < 10 ng/mL (Severe Deficiency / Rickets / Osteomalacia)",
  },
  {
    id: "hosp-test-16",
    testName: "Vitamin B12 Quantitative (Active Cyanocobalamin)",
    testCode: "VIT-B12",
    loincCode: "1988-5",
    shortName: "Vitamin B12",
    category: { name: "Endocrinology & Hormones", color: "#db2777" },
    processingDepartment: "Immunoassay Lab",
    method: "Electrochemiluminescence Immunoassay (ECLIA)",
    sampleContainer: "SST Gold Gel Separator Tube (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "Protect from light. 72 Hours at 2-8°C",
    patientPreparation: "Overnight fasting preferred",
    tatHours: 12,
    tatDisplay: "Same Day (12h Routine)",
    isStatCapable: false,
    price: 950,
    offerPrice: 699,
    b2bRate: 350,
    ipdRate: 1100,
    icuRate: 1250,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Vit B12 < 100 pg/mL (Severe Subacute Combined Degeneration)",
  },
  {
    id: "hosp-test-17",
    testName: "Serum Ferritin (Iron Reserve & Systemic Hyperferritinemia)",
    testCode: "SER-FERRITIN",
    loincCode: "2276-4",
    shortName: "Serum Ferritin",
    category: { name: "Endocrinology & Hormones", color: "#db2777" },
    processingDepartment: "Immunoassay Lab",
    method: "Particle-Enhanced Immunoturbidimetry / ECLIA",
    sampleContainer: "SST Gold Gel Separator Tube (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "7 Days at 2-8°C",
    patientPreparation: "Morning draw preferred",
    tatHours: 6,
    tatDisplay: "6h Routine / 2h STAT",
    isStatCapable: true,
    price: 700,
    offerPrice: 550,
    b2bRate: 320,
    ipdRate: 800,
    icuRate: 950,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Ferritin > 2,000 ng/mL (Cytokine storm / Hemophagocytic HLH)",
  },

  // ── 5. Urinalysis & Clinical Pathology ──
  {
    id: "hosp-test-18",
    testName: "Urine Routine & Microscopic Examination (Complete Urinalysis)",
    testCode: "URINE-RE-ME",
    loincCode: "24356-8",
    shortName: "Urine R/M",
    category: { name: "Clinical Pathology & Urine", color: "#d97706" },
    processingDepartment: "Clinical Pathology",
    method: "Automated Dry Chemistry Reflectance + Phase Contrast Flow Imaging",
    sampleContainer: "Sterile Urine Container (30 mL)",
    sampleType: "URINE",
    sampleVolume: "15.0 mL Clean-Catch Midstream",
    drawOrder: "#N/A Non-Blood",
    stability: "Test within 2 hours or refrigerate at 2-8°C (Max 6 hours)",
    patientPreparation: "Clean-catch midstream early morning first void sample preferred",
    tatHours: 2,
    tatDisplay: "2h Routine / 45m STAT",
    isStatCapable: true,
    price: 200,
    offerPrice: 150,
    b2bRate: 70,
    ipdRate: 250,
    icuRate: 300,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Gross Hematuria (RBCs TNTC), Heavy Proteinuria (3+), Ketones 3+",
  },

  // ── 6. Clinical Microbiology & Infectious Serology ──
  {
    id: "hosp-test-19",
    testName: "Automated Blood Culture & Antibiotic Susceptibility Testing (AST)",
    testCode: "BLOOD-CULT-AST",
    loincCode: "600-7",
    shortName: "Blood Culture & Sensitivity",
    category: { name: "Microbiology & Serology", color: "#059669" },
    processingDepartment: "Microbiology Core",
    method: "Continuous Colorimetric Sensor Incubation + VITEK-2 AST (CLSI M100)",
    sampleContainer: "BacT/ALERT Aerobic + Anaerobic Bottles (Pair)",
    sampleType: "WHOLE_BLOOD",
    sampleVolume: "8.0 - 10.0 mL per bottle",
    drawOrder: "#1 First before any vacutainers",
    stability: "Transport immediately to incubator at 35-37°C (Never refrigerate)",
    patientPreparation: "Strict chlorhexidine aseptic skin prep prior to antibiotic administration",
    tatHours: 48,
    tatDisplay: "24-48h Prelim / 5 Days Final",
    isStatCapable: false,
    price: 1800,
    offerPrice: 1500,
    b2bRate: 950,
    ipdRate: 2100,
    icuRate: 2400,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Positive Blood Culture Bottle (Direct telephonic alert to attending doctor)",
  },
  {
    id: "hosp-test-20",
    testName: "Dengue Duo Panel (NS1 Early Antigen + IgM & IgG Antibodies)",
    testCode: "DENGUE-COMBO",
    loincCode: "69085-9",
    shortName: "Dengue NS1 & Antibodies",
    category: { name: "Microbiology & Serology", color: "#059669" },
    processingDepartment: "Serology Lab",
    method: "Immunochromatographic Rapid Assay + Automated ELISA Confirmation",
    sampleContainer: "SST Gold Gel Separator Tube (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "48 Hours at 2-8°C",
    patientPreparation: "Document days of fever onset on requisition",
    tatHours: 3,
    tatDisplay: "3h Routine / 1h STAT",
    isStatCapable: true,
    price: 1100,
    offerPrice: 850,
    b2bRate: 500,
    ipdRate: 1250,
    icuRate: 1400,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Dengue NS1 Positive with Platelets < 50,000 /µL (DHF Warning)",
  },
  {
    id: "hosp-test-21",
    testName: "Hepatitis B Surface Antigen (HBsAg) & Anti-HCV Duo Screen",
    testCode: "VIRAL-HEPATITIS",
    loincCode: "24364-2",
    shortName: "HBsAg & HCV Duo",
    category: { name: "Microbiology & Serology", color: "#059669" },
    processingDepartment: "Serology Lab",
    method: "Chemiluminescence Microparticle Immunoassay (CMIA 4th Gen)",
    sampleContainer: "SST Gold Gel Separator Tube (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "7 Days at 2-8°C",
    patientPreparation: "Pre-operative / Dialysis mandatory screening",
    tatHours: 6,
    tatDisplay: "6h Routine / 2h STAT",
    isStatCapable: true,
    price: 900,
    offerPrice: 700,
    b2bRate: 380,
    ipdRate: 1050,
    icuRate: 1200,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Reactive HBsAg or HCV in OT pre-op candidate",
  },
  {
    id: "hosp-test-22",
    testName: "HIV 1 & 2 4th Generation Antigen/Antibody (p24 Ag + Ab Combo)",
    testCode: "HIV-DUO-4TH",
    loincCode: "56888-1",
    shortName: "HIV 1/2 Combo (p24)",
    category: { name: "Microbiology & Serology", color: "#059669" },
    processingDepartment: "Serology Lab",
    method: "Chemiluminescence Immunoassay (CLIA 4th Generation)",
    sampleContainer: "SST Gold Gel Separator Tube (4.0 mL)",
    sampleType: "SERUM",
    sampleVolume: "2.0 mL",
    drawOrder: "#3 Order of Draw",
    stability: "7 Days at 2-8°C",
    patientPreparation: "Informed consent & pre-test counseling compliance",
    tatHours: 4,
    tatDisplay: "4h Routine / 1h STAT",
    isStatCapable: true,
    price: 650,
    offerPrice: 500,
    b2bRate: 260,
    ipdRate: 750,
    icuRate: 850,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Reactive Screening (Requires NACO Western Blot / Line Immunoassay)",
  },

  // ── 7. Molecular Diagnostics & Genetics ──
  {
    id: "hosp-test-23",
    testName: "GeneXpert MTB/RIF (M. Tuberculosis DNA + Rifampicin Resistance PCR)",
    testCode: "GENEXPERT-MTB",
    loincCode: "79381-0",
    shortName: "GeneXpert TB PCR",
    category: { name: "Molecular Diagnostics", color: "#0284c7" },
    processingDepartment: "Molecular Diagnostics Lab",
    method: "Automated Nested Real-Time PCR (Cartridge-Based Nucleic Acid Amp)",
    sampleContainer: "Sterile Wide-Mouth Sputum Cup (50 mL)",
    sampleType: "SPUTUM",
    sampleVolume: "2.0 - 4.0 mL Purulent Sputum",
    drawOrder: "#N/A Non-Blood",
    stability: "Store at 2-8°C if transit exceeds 2 hours",
    patientPreparation: "Early morning deep cough sputum sample (Not saliva)",
    tatHours: 4,
    tatDisplay: "4h STAT Molecular",
    isStatCapable: true,
    price: 2500,
    offerPrice: 2100,
    b2bRate: 1600,
    ipdRate: 2800,
    icuRate: 3200,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "MTB Detected with Rifampicin Resistance DETECTED (MDR-TB Alert)",
  },

  // ── 8. Histopathology & Tissue Cytology ──
  {
    id: "hosp-test-24",
    testName: "Routine Surgical Histopathology - Small Biopsy (Punch, Core, Endoscopic)",
    testCode: "HISTO-BIOPSY-S",
    loincCode: "65753-6",
    shortName: "Biopsy Small (H&E)",
    category: { name: "Histopathology & Cytology", color: "#4f46e5" },
    processingDepartment: "Histopathology Core",
    method: "Tissue Processing, Paraffin Embedding, 3-Level Microtome & H&E Staining",
    sampleContainer: "Wide-Mouth 10% Neutral Buffered Formalin Jar",
    sampleType: "TISSUE",
    sampleVolume: "10:1 Formalin to Specimen Volume Ratio",
    drawOrder: "#N/A Surgical",
    stability: "Stable at ambient temperature once immersed in 10% formalin",
    patientPreparation: "Immediate immersion in 10% neutral buffered formalin (Never allow to dry)",
    tatHours: 48,
    tatDisplay: "48-72 Hours Standard",
    isStatCapable: false,
    price: 1400,
    offerPrice: 1200,
    b2bRate: 800,
    ipdRate: 1650,
    icuRate: 1900,
    isNablScope: true,
    processingCenter: "IN_HOUSE",
    isActive: true,
    criticalLimits: "Malignancy / Severe High-Grade Dysplasia / Fungal Vascular Invasion",
  },
];

export default function TestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tests, setTests] = useState<any[]>(ENTERPRISE_HOSPITAL_TESTS);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [workstationTab, setWorkstationTab] = useState<WorkstationTabType>("catalog");

  useEffect(() => {
    const requestedWorkspace = searchParams.get("workspace") as WorkstationTabType | null;
    setWorkstationTab(
      requestedWorkspace && VALID_WORKSPACE_TABS.includes(requestedWorkspace)
        ? requestedWorkspace
        : "catalog",
    );
  }, [searchParams]);

  // View Mode: Table vs Grid Cards
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [tableDensity, setTableDensity] = useState<"comfortable" | "compact">("comfortable");

  // Advanced Clinical Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSampleType, setSelectedSampleType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedFasting, setSelectedFasting] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState<"all" | "stat" | "routine">("all");
  const [selectedProcessing, setSelectedProcessing] = useState<"all" | "in-house" | "outsourced">("all");
  const [selectedNablOnly, setSelectedNablOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "code" | "price_asc" | "price_desc" | "tat">("name");

  // Multi-selection for bulk operations
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modals & Drawer State
  const [inspectingTest, setInspectingTest] = useState<any | null>(null);
  const [cloningTest, setCloningTest] = useState<any | null>(null);
  const [barcodePreviewTest, setBarcodePreviewTest] = useState<any | null>(null);
  const [isTubeGuideOpen, setIsTubeGuideOpen] = useState(false);
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [testsRes, catRes] = await Promise.all([
        testApi.getAll().catch(() => ({ success: false, data: [] })),
        testApi.getCategories().catch(() => ({ data: [] })),
      ]);

      if (testsRes.success && testsRes.data) {
        const fetched = testsRes.data.tests || testsRes.data;
        if (Array.isArray(fetched) && fetched.length > 0) {
          // Merge fetched tests with enterprise attributes
          setTests(fetched);
        } else {
          setTests(ENTERPRISE_HOSPITAL_TESTS);
        }
      } else {
        // Fallback to enterprise hospital dataset
        setTests(ENTERPRISE_HOSPITAL_TESTS);
      }

      if (catRes && catRes.data && Array.isArray(catRes.data) && catRes.data.length > 0) {
        setCategories(catRes.data);
      } else {
        // Extract distinct departments from dataset
        const distinctCats = Array.from(
          new Set(ENTERPRISE_HOSPITAL_TESTS.map((t) => t.category?.name || "Core Pathology"))
        ).map((name) => ({ id: name, name }));
        setCategories(distinctCats);
      }
    } catch (err) {
      console.warn("Using clinical enterprise dataset fallback:", err);
      setTests(ENTERPRISE_HOSPITAL_TESTS);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    showNotification(`Copied LOINC / Code "${text}" to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 1-Click Inline Status Toggle Switch
  const handleToggleStatus = async (test: any) => {
    const newStatus = test.isActive === false ? true : false;
    const prevTests = [...tests];

    setTests(
      tests.map((t) => (t.id === test.id ? { ...t, isActive: newStatus } : t))
    );

    if (inspectingTest && inspectingTest.id === test.id) {
      setInspectingTest({ ...inspectingTest, isActive: newStatus });
    }

    try {
      const res = await testApi.update(String(test.id), { isActive: newStatus });
      if (res && res.success) {
        showNotification(
          `Investigation "${test.testName || test.name}" marked as ${
            newStatus ? "Active Operational" : "Paused / Inactive"
          }`
        );
      }
    } catch {
      // In offline / mock mode, still keep the optimistic update
      showNotification(
        `Investigation "${test.testName || test.name}" marked as ${
          newStatus ? "Active Operational" : "Paused / Inactive"
        }`
      );
    }
  };

  // Bulk active/inactive toggle
  const handleBulkToggleActive = async (isActive: boolean) => {
    if (selectedTestIds.length === 0) return;
    setBulkLoading(true);
    try {
      await testApi.bulkToggleActive({ testIds: selectedTestIds, isActive }).catch(() => {});
      showNotification(
        `Updated operational status for ${selectedTestIds.length} investigations to ${
          isActive ? "Active" : "Paused"
        }`
      );
      setTests((prev) =>
        prev.map((t) =>
          selectedTestIds.includes(t.id) ? { ...t, isActive } : t
        )
      );
      setSelectedTestIds([]);
    } catch (err: any) {
      alert(err?.message || "Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // Export Catalogue as CSV
  const handleExportCSV = () => {
    const headers = [
      "Test Name",
      "Internal Code",
      "LOINC Code",
      "Department",
      "Sample Container",
      "Order of Draw",
      "Sample Type",
      "Min Volume",
      "Fasting Required",
      "TAT (Hours)",
      "STAT Capable",
      "Patient Tariff (INR)",
      "Offer Price",
      "B2B Rate",
      "NABL Scope",
      "Status",
    ];

    const rows = filteredTests.map((t) => [
      `"${t.testName || t.name}"`,
      t.testCode || t.code,
      t.loincCode || "N/A",
      `"${t.category?.name || t.processingDepartment || "Core"}"`,
      `"${t.sampleContainer || "Standard Vial"}"`,
      `"${t.drawOrder || "Standard"}"`,
      t.sampleType || "WHOLE_BLOOD",
      t.sampleVolume || "2.5 mL",
      (t.patientPreparation || "").toLowerCase().includes("fast") ? "Yes" : "No",
      t.tatHours || 24,
      t.isStatCapable || Number(t.tatHours) <= 4 ? "Yes" : "No",
      t.price || 0,
      t.offerPrice || t.price || 0,
      t.b2bRate || "N/A",
      t.isNablScope ? "Yes" : "No",
      t.isActive !== false ? "Active" : "Paused",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `LIS_Diagnostic_Catalogue_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Diagnostic catalogue CSV exported successfully");
  };

  // Vacutainer Cap Info & Visual Styling
  const getTubeInfo = (container?: string, sampleType?: string) => {
    const text = `${container || ""} ${sampleType || ""}`.toLowerCase();
    if (text.includes("edta") || text.includes("purple") || text.includes("lavender")) {
      return { label: "EDTA Purple", color: "#9333EA", cap: "bg-purple-600", bg: "bg-purple-50 text-purple-700 border-purple-200", order: "#5" };
    }
    if (text.includes("fluoride") || text.includes("oxalate") || text.includes("grey") || text.includes("gray")) {
      return { label: "Fluoride Grey", color: "#64748B", cap: "bg-slate-500", bg: "bg-slate-100 text-slate-700 border-slate-300", order: "#6" };
    }
    if (text.includes("sst") || text.includes("gold") || text.includes("gel") || text.includes("yellow")) {
      return { label: "SST Gold", color: "#D97706", cap: "bg-amber-500", bg: "bg-amber-50 text-amber-800 border-amber-200", order: "#3" };
    }
    if (text.includes("red") || text.includes("plain") || text.includes("serum")) {
      return { label: "Plain Red", color: "#DC2626", cap: "bg-red-600", bg: "bg-red-50 text-red-700 border-red-200", order: "#2" };
    }
    if (text.includes("citrate") || text.includes("blue")) {
      return { label: "Citrate Blue", color: "#0284C7", cap: "bg-sky-500", bg: "bg-sky-50 text-sky-700 border-sky-200", order: "#2" };
    }
    if (text.includes("heparin") || text.includes("green")) {
      return { label: "Heparin Green", color: "#16A34A", cap: "bg-emerald-600", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", order: "#4" };
    }
    if (text.includes("urine") || text.includes("stool") || text.includes("swab") || text.includes("sputum") || text.includes("bact")) {
      return { label: container || sampleType || "Sterile Specimen", color: "#CA8A04", cap: "bg-yellow-500", bg: "bg-yellow-50 text-yellow-800 border-yellow-200", order: "Draw #1" };
    }
    return { label: container || sampleType || "Standard Vial", color: "#475569", cap: "bg-slate-600", bg: "bg-slate-100 text-slate-700 border-slate-200", order: "Std" };
  };

  // Filtered and Sorted Tests
  const filteredTests = useMemo(() => {
    return tests
      .filter((test) => {
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchesName = (test.testName || test.name || "").toLowerCase().includes(q);
          const matchesCode = (test.testCode || test.code || "").toLowerCase().includes(q);
          const matchesLoinc = (test.loincCode || "").toLowerCase().includes(q);
          const matchesShort = (test.shortName || "").toLowerCase().includes(q);
          const matchesMethod = (test.method || "").toLowerCase().includes(q);
          const matchesDept = (test.category?.name || test.processingDepartment || "").toLowerCase().includes(q);
          if (!matchesName && !matchesCode && !matchesLoinc && !matchesShort && !matchesMethod && !matchesDept) {
            return false;
          }
        }

        if (selectedCategory) {
          const testCatId = test.categoryId;
          const testCatName = test.category?.name || test.category;
          if (testCatId !== selectedCategory && testCatName !== selectedCategory) {
            return false;
          }
        }

        if (selectedSampleType && test.sampleType !== selectedSampleType) {
          return false;
        }

        if (selectedStatus === "active" && test.isActive === false) return false;
        if (selectedStatus === "inactive" && test.isActive !== false) return false;

        if (selectedFasting === "fasting") {
          const prep = (test.patientPreparation || "").toLowerCase();
          if (!prep.includes("fast") && !prep.includes("overnight") && !prep.includes("empty stomach")) {
            return false;
          }
        } else if (selectedFasting === "non-fasting") {
          const prep = (test.patientPreparation || "").toLowerCase();
          if (prep.includes("fast") || prep.includes("overnight")) {
            return false;
          }
        }

        if (selectedUrgency === "stat") {
          const isStat = test.isStatCapable || (test.tatHours && Number(test.tatHours) <= 4);
          if (!isStat) return false;
        } else if (selectedUrgency === "routine") {
          const isStat = test.isStatCapable || (test.tatHours && Number(test.tatHours) <= 4);
          if (isStat) return false;
        }

        if (selectedProcessing === "in-house" && test.processingCenter === "OUTSOURCED") return false;
        if (selectedProcessing === "outsourced" && test.processingCenter !== "OUTSOURCED") return false;

        if (selectedNablOnly && !test.isNablScope) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return (a.testName || a.name || "").localeCompare(b.testName || b.name || "");
        }
        if (sortBy === "code") {
          return (a.testCode || a.code || "").localeCompare(b.testCode || b.code || "");
        }
        if (sortBy === "price_asc") {
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        }
        if (sortBy === "price_desc") {
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        }
        if (sortBy === "tat") {
          return (Number(a.tatHours) || 24) - (Number(b.tatHours) || 24);
        }
        return 0;
      });
  }, [
    tests,
    searchTerm,
    selectedCategory,
    selectedSampleType,
    selectedStatus,
    selectedFasting,
    selectedUrgency,
    selectedProcessing,
    selectedNablOnly,
    sortBy,
  ]);

  const totalActive = tests.filter((t) => t.isActive !== false).length;
  const statAvailableCount = tests.filter(
    (t) => (t.tatHours && Number(t.tatHours) <= 4) || (t.tatDisplay && t.tatDisplay.toLowerCase().includes("stat")) || t.isStatCapable
  ).length;
  const totalCategoriesCount = categories.length || new Set(tests.map((t) => t.categoryId || t.category?.name)).size;

  // Selected Tests for Requisition / Actions
  const selectedTestsList = useMemo(() => {
    return tests.filter((t) => selectedTestIds.includes(t.id));
  }, [tests, selectedTestIds]);

  const handleSelectAll = () => {
    if (selectedTestIds.length === filteredTests.length) {
      setSelectedTestIds([]);
    } else {
      setSelectedTestIds(filteredTests.map((t) => t.id));
    }
  };

  const handleToggleSelectTest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <ProtectedRoute requiredRoles={["ADMIN", "FRONT_DESK", "LAB_TECH", "PATHOLOGIST", "DOCTOR"]}>
      <div className="space-y-6 pb-20">
        {/* Floating Success Notification */}
        {successMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-900 px-5 py-3.5 text-xs font-bold shadow-xl animate-in slide-in-from-top-3 duration-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-black">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Test catalogue could not be refreshed</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
            <button type="button" onClick={fetchInitialData} className="self-start rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-bold text-rose-800 hover:bg-rose-100 sm:self-auto">
              Retry
            </button>
          </div>
        )}

        {/* =========================================================================
            WORKSPACE ROUTING / TAB VIEWS
        ========================================================================= */}
        {workstationTab === "catalog" && (
          <div className="space-y-4">
            {/* ── Advanced Clinical Filters & Search Toolbar (Ultra Light White) ── */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
              {/* Row 1: Search, Department, Specimen Matrix, Urgency, Sort */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
                {/* Search Bar */}
                <div className="relative lg:col-span-2">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search test name, LOINC (e.g. 58410-2), code, method..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-8 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/10 transition"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Department Filter */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-600 focus:outline-none"
                  >
                    <option value="">All Departments ({totalCategoriesCount})</option>
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.id || c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specimen Matrix Filter */}
                <div>
                  <select
                    value={selectedSampleType}
                    onChange={(e) => setSelectedSampleType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-600 focus:outline-none"
                  >
                    <option value="">All Specimen Matrices</option>
                    <option value="WHOLE_BLOOD">Whole Blood (EDTA / Heparin)</option>
                    <option value="SERUM">Serum (SST Gold / Plain Red)</option>
                    <option value="CITRATE_PLASMA">Citrate Plasma 3.2% (Coagulation)</option>
                    <option value="FLUID_PLASMA">Fluoride Plasma (Glucose)</option>
                    <option value="URINE">Clean-Catch Urine</option>
                    <option value="SPUTUM">Sputum / BAL</option>
                    <option value="TISSUE">Tissue Biopsy / Formalin</option>
                  </select>
                </div>

                {/* Priority / TAT Filter */}
                <div>
                  <select
                    value={selectedUrgency}
                    onChange={(e) => setSelectedUrgency(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-600 focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="stat">⚡ STAT Capable (≤ 4h)</option>
                    <option value="routine">Routine Standard</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-600 focus:outline-none"
                  >
                    <option value="name">Sort: Name (A-Z)</option>
                    <option value="code">Sort: Investigation Code</option>
                    <option value="price_asc">Sort: Tariff (Low to High)</option>
                    <option value="price_desc">Sort: Tariff (High to Low)</option>
                    <option value="tat">Sort: Turnaround Time (TAT)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Status Quick Chips, Fasting, NABL, Density & View Mode */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-semibold mr-1">Status:</span>
                  {(["all", "active", "inactive"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer ${
                        selectedStatus === st
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}

                  <span className="text-slate-300 mx-1">|</span>

                  <button
                    type="button"
                    onClick={() => setSelectedFasting(selectedFasting === "fasting" ? "" : "fasting")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedFasting === "fasting"
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Fasting Mandatory
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedNablOnly(!selectedNablOnly)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      selectedNablOnly
                        ? "bg-emerald-700 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    <span>NABL Accredited Only</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Table Density Switcher */}
                  {viewMode === "table" && (
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTableDensity("comfortable")}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                          tableDensity === "comfortable" ? "bg-slate-100 text-slate-900" : "text-slate-500"
                        }`}
                        title="Comfortable row padding"
                      >
                        Comfortable
                      </button>
                      <button
                        type="button"
                        onClick={() => setTableDensity("compact")}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                          tableDensity === "compact" ? "bg-slate-100 text-slate-900" : "text-slate-500"
                        }`}
                        title="High density clinical table"
                      >
                        Compact
                      </button>
                    </div>
                  )}

                  {/* View Mode Switcher */}
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        viewMode === "table" ? "bg-sky-50 text-sky-800" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        viewMode === "grid" ? "bg-sky-50 text-sky-800" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span>Cards</span>
                    </button>
                  </div>

                  {/* CSV Export Button */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                    title="Export filtered directory to CSV"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>

                  <span className="text-slate-500 text-xs pl-1">
                    Showing <strong className="text-slate-900">{filteredTests.length}</strong> of {tests.length}
                  </span>

                  {(searchTerm || selectedCategory || selectedSampleType || selectedStatus !== "all" || selectedFasting || selectedUrgency !== "all" || selectedNablOnly) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("");
                        setSelectedSampleType("");
                        setSelectedStatus("all");
                        setSelectedFasting("");
                        setSelectedUrgency("all");
                        setSelectedNablOnly(false);
                      }}
                      className="text-sky-700 hover:text-sky-900 font-bold ml-1 underline text-xs"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Bulk Selection Action Ribbon ── */}
            {selectedTestIds.length > 0 && (
              <div className="rounded-2xl border border-sky-300 bg-sky-50/90 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-700 text-white font-black text-xs">
                    {selectedTestIds.length}
                  </span>
                  <span className="font-bold text-sky-950">
                    Investigations Selected for Batch Operations
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRequisitionModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-800 font-bold hover:bg-sky-100 transition shadow-2xs cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Create Requisition Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBulkPriceModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-800 font-bold hover:bg-sky-100 transition shadow-2xs cursor-pointer"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Bulk Tariff Revision</span>
                  </button>

                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={() => handleBulkToggleActive(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span>Activate Selected</span>
                  </button>

                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={() => handleBulkToggleActive(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span>Pause Selected</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTestIds([])}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-sky-200 transition"
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Test Directory Table View (Clean Hospital Standards) ── */}
            {viewMode === "table" ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-700" />
                    <p className="text-xs font-bold text-slate-700">Loading diagnostic test directory...</p>
                  </div>
                ) : filteredTests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
                    <FlaskConical className="h-10 w-10 text-slate-300" />
                    <p className="text-sm font-bold text-slate-800">No matching diagnostic investigations found</p>
                    <p className="text-xs text-slate-500">Try adjusting your search query or reset active filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        <tr>
                          <th className="px-4 py-3.5 w-10">
                            <input
                              type="checkbox"
                              checked={selectedTestIds.length === filteredTests.length && filteredTests.length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                            />
                          </th>
                          <th className="px-4 py-3.5 min-w-[240px]">Investigation &amp; LOINC Code</th>
                          <th className="px-4 py-3.5 min-w-[170px]">Department &amp; Methodology</th>
                          <th className="px-4 py-3.5 min-w-[180px]">Specimen Tube &amp; Draw SOP</th>
                          <th className="px-4 py-3.5 min-w-[170px]">Pre-Analytical &amp; TAT</th>
                          <th className="px-4 py-3.5 min-w-[140px]">Tariff Schedule (INR)</th>
                          <th className="px-4 py-3.5 min-w-[90px]">Status</th>
                          <th className="px-4 py-3.5 text-right min-w-[150px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredTests.map((test) => {
                          const tube = getTubeInfo(test.sampleContainer, test.sampleType);
                          const isStat = test.isStatCapable || (test.tatHours && Number(test.tatHours) <= 4);
                          const price = Number(test.price) || 0;
                          const offer = test.offerPrice ? Number(test.offerPrice) : null;
                          const hasDiscount = offer !== null && offer < price && offer > 0;
                          const isSelected = selectedTestIds.includes(test.id);
                          const paddingClass = tableDensity === "compact" ? "py-2 px-4" : "py-3.5 px-4";

                          return (
                            <tr
                              key={test.id}
                              className={`group transition-colors ${
                                isSelected ? "bg-sky-50/50" : "hover:bg-slate-50/70"
                              }`}
                            >
                              {/* Checkbox */}
                              <td className={paddingClass} onClick={(e) => handleToggleSelectTest(test.id, e)}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                                />
                              </td>

                              {/* Test Name, LOINC, Short Code & Accreditation */}
                              <td className={paddingClass}>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setInspectingTest(test)}
                                      className="font-bold text-slate-950 text-sm hover:text-sky-700 text-left transition-colors flex items-center gap-1.5 cursor-pointer leading-snug"
                                    >
                                      <span>{test.testName || test.name}</span>
                                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                                    {/* Test Code */}
                                    <span className="bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                                      {test.testCode || test.code}
                                    </span>

                                    {/* LOINC Code */}
                                    {test.loincCode && (
                                      <span className="bg-sky-50 border border-sky-200 text-sky-800 px-1.5 py-0.5 rounded font-bold">
                                        LOINC: {test.loincCode}
                                      </span>
                                    )}

                                    {/* 1-Click Copy */}
                                    <button
                                      type="button"
                                      onClick={(e) => copyToClipboard(test.loincCode || test.testCode || test.code, e)}
                                      className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                      title="Copy LOINC or test code"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>

                                    {/* NABL Badge */}
                                    {test.isNablScope && (
                                      <span className="font-sans text-[9px] font-black bg-emerald-50 border border-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded">
                                        NABL
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Department & Method */}
                              <td className={paddingClass}>
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-900">
                                    {test.category?.name || test.processingDepartment || "Core Pathology"}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-medium leading-tight">
                                    {test.method || "Automated Analyzer"}
                                  </p>
                                </div>
                              </td>

                              {/* Specimen Tube SOP & Order of Draw */}
                              <td className={paddingClass}>
                                <div className="space-y-1">
                                  <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${tube.bg}`}>
                                    <span className="h-2 w-2 rounded-full shadow-2xs" style={{ backgroundColor: tube.color }} />
                                    <span className="truncate max-w-[140px]">{test.sampleContainer || tube.label}</span>
                                    <span className="text-[8.5px] font-mono text-slate-500 font-normal">
                                      {test.drawOrder || tube.order}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    Vol: <strong className="text-slate-700">{test.sampleVolume || "2.5 mL"}</strong> · {test.sampleType || "WHOLE_BLOOD"}
                                  </p>
                                </div>
                              </td>

                              {/* Pre-Analytical Prep & TAT */}
                              <td className={paddingClass}>
                                <div className="space-y-0.5 text-[10px]">
                                  <span
                                    className={`inline-block font-semibold ${
                                      (test.patientPreparation || "").toLowerCase().includes("fast")
                                        ? "text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    {test.patientPreparation ? test.patientPreparation.slice(0, 36) : "Routine collection"}
                                  </span>
                                  <div className="font-mono text-slate-700 font-bold flex items-center gap-1 pt-0.5">
                                    <Clock3 className="h-3 w-3 text-slate-400" />
                                    <span>TAT: {test.tatHours || 24}h</span>
                                    {isStat && (
                                      <span className="text-rose-600 font-black text-[9px] uppercase tracking-wide">
                                        (STAT 24×7)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Tariff & Multi-Tier Pricing */}
                              <td className={paddingClass}>
                                <div className="space-y-0.5 font-mono">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-black text-slate-950">
                                      ₹{(hasDiscount ? offer : price)?.toLocaleString("en-IN")}
                                    </span>
                                    {hasDiscount && (
                                      <span className="text-[10px] text-slate-400 line-through">
                                        ₹{price?.toLocaleString("en-IN")}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] text-slate-500">
                                    {test.b2bRate && <span>B2B: ₹{test.b2bRate}</span>}
                                    {test.ipdRate && <span>IPD: ₹{test.ipdRate}</span>}
                                  </div>
                                </div>
                              </td>

                              {/* Operational Status */}
                              <td className={paddingClass}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(test)}
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase transition cursor-pointer ${
                                    test.isActive !== false
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                      : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                                  }`}
                                  title="Click to toggle active operational status"
                                >
                                  {test.isActive !== false ? "● Active" : "○ Paused"}
                                </button>
                              </td>

                              {/* Direct Actions */}
                              <td className={`${paddingClass} text-right`}>
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* View Dossier Drawer */}
                                  <button
                                    type="button"
                                    onClick={() => setInspectingTest(test)}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-sky-700 transition shadow-2xs cursor-pointer"
                                    title="View Full Clinical Dossier & Range Matrix"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>

                                  {/* Thermal Barcode Label Preview */}
                                  <button
                                    type="button"
                                    onClick={() => setBarcodePreviewTest(test)}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-purple-700 transition shadow-2xs cursor-pointer"
                                    title="Preview Thermal Phlebotomy Barcode Label"
                                  >
                                    <Barcode className="h-3.5 w-3.5" />
                                  </button>

                                  {/* Duplicate / Clone */}
                                  <button
                                    type="button"
                                    onClick={() => setCloningTest(test)}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-700 transition shadow-2xs cursor-pointer"
                                    title="Clone Investigation Setup"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>

                                  {/* Edit Setup */}
                                  <Link
                                    href={`/tests/${test.id}?edit=true`}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                                    title="Edit Investigation Setup"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* Grid Cards View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTests.map((test) => {
                  const tube = getTubeInfo(test.sampleContainer, test.sampleType);
                  const price = Number(test.price) || 0;
                  const offer = test.offerPrice ? Number(test.offerPrice) : null;
                  const hasDiscount = offer !== null && offer < price && offer > 0;
                  const isStat = test.isStatCapable || (test.tatHours && Number(test.tatHours) <= 4);

                  return (
                    <div
                      key={test.id}
                      className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all duration-200 space-y-4 cursor-pointer"
                      onClick={() => setInspectingTest(test)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                              {test.testCode || test.code}
                            </span>
                            {test.loincCode && (
                              <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md text-[10px]">
                                LOINC: {test.loincCode}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-950 leading-snug">
                            {test.testName || test.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {test.category?.name || "General Pathology"} · {test.method || "Automated"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            test.isActive !== false
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {test.isActive !== false ? "Active" : "Paused"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Specimen &amp; Tube:</span>
                          <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold border ${tube.bg}`}>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tube.color }} />
                            <span className="truncate">{tube.label}</span>
                          </div>
                        </div>

                        <div className="space-y-0.5 text-right font-mono">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Tariff:</span>
                          <span className="text-base font-black text-slate-950">
                            ₹{(hasDiscount ? offer : price)?.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                          <span>{test.tatHours || 24}h Turnaround</span>
                          {isStat && <span className="text-rose-600 font-black">(STAT)</span>}
                        </span>

                        <span className="font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1">
                          View Dossier <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            WORKSPACE TAB 2: HEALTH PACKAGES & PROFILES MATRIX
        ========================================================================= */}
        {workstationTab === "packages" && <PackageMatrixView />}

        {/* =========================================================================
            WORKSPACE TAB 3: ANALYTE PARAMETERS & BIOLOGICAL INTERVALS
        ========================================================================= */}
        {workstationTab === "parameters" && <ParameterMatrixView />}

        {/* =========================================================================
            WORKSPACE TAB 4: CLINICAL FORMULAS & DERIVATION ENGINE
        ========================================================================= */}
        {workstationTab === "formulas" && <ClinicalFormulaEngine />}

        {/* =========================================================================
            WORKSPACE TAB 5: ANALYZER QC & WESTGARD MULTIRULE TRACKER
        ========================================================================= */}
        {workstationTab === "qc" && <AnalyzerQCTracker />}

        {/* =========================================================================
            WORKSPACE TAB 6: LIMS ANALYZER INTERFACING (ASTM / HL7)
        ========================================================================= */}
        {workstationTab === "interfacing" && <AnalyzerInterfacingEngine />}

        {/* =========================================================================
            WORKSPACE TAB 7: B2B TARIFF & DOCTOR COMMISSION STUDIO
        ========================================================================= */}
        {workstationTab === "b2b-tariff" && <B2BTariffCommissionStudio />}

        {/* =========================================================================
            WORKSPACE TAB 8: PANIC / CRITICAL VALUE ALERT MATRIX
        ========================================================================= */}
        {workstationTab === "panic-alerts" && <PanicValueAlertMatrix />}

        {/* =========================================================================
            WORKSPACE TAB 9: PRE-ANALYTICAL PHLEBOTOMY & DRAW SOP (CLSI H3-A6)
        ========================================================================= */}
        {workstationTab === "phlebotomy-sop" && <PreAnalyticalPhlebotomyGuide />}

        {/* =========================================================================
            WORKSPACE TAB 10: SPECIMEN INTEGRITY & REJECTION RULES (NEW ENTERPRISE)
        ========================================================================= */}
        {workstationTab === "rejection-rules" && <SpecimenRejectionRules />}

        {/* =========================================================================
            MODALS & DRAWERS
        ========================================================================= */}
        {/* Slide-over Investigation Dossier */}
        <TestDrawer
          test={inspectingTest}
          isOpen={Boolean(inspectingTest)}
          onClose={() => setInspectingTest(null)}
          onToggleStatus={handleToggleStatus}
          onDuplicate={(t) => setCloningTest(t)}
        />

        {/* Thermal Barcode Label Preview Modal */}
        <BarcodeLabelPreviewModal
          isOpen={Boolean(barcodePreviewTest)}
          onClose={() => setBarcodePreviewTest(null)}
          test={barcodePreviewTest}
        />

        {/* Vacutainer SOP Guide Modal */}
        <TubeGuideModal
          isOpen={isTubeGuideOpen}
          onClose={() => setIsTubeGuideOpen(false)}
        />

        {/* Rate Sheet & Tariff Print Modal */}
        <TariffPrintModal
          isOpen={isTariffModalOpen}
          onClose={() => setIsTariffModalOpen(false)}
          tests={tests}
          categories={categories}
        />

        {/* Bulk Pricing Revision Studio */}
        <BulkPriceModal
          isOpen={isBulkPriceModalOpen}
          onClose={() => setIsBulkPriceModalOpen(false)}
          selectedTestIds={selectedTestIds}
          totalTestsCount={tests.length}
          categories={categories}
          onSuccess={(msg) => {
            showNotification(msg);
            fetchInitialData();
          }}
        />

        {/* Test Cloning Studio */}
        <CloneTestModal
          isOpen={Boolean(cloningTest)}
          onClose={() => setCloningTest(null)}
          test={cloningTest}
          onSuccess={(newTest) => {
            setTests((prev) => [newTest, ...prev]);
            showNotification(`Investigation cloned successfully as ${newTest.testCode}!`);
          }}
        />

        {/* Quick Order Requisition Slip Modal */}
        <QuickOrderRequisitionModal
          isOpen={isRequisitionModalOpen}
          onClose={() => setIsRequisitionModalOpen(false)}
          selectedTests={selectedTestsList}
        />
      </div>
    </ProtectedRoute>
  );
}
