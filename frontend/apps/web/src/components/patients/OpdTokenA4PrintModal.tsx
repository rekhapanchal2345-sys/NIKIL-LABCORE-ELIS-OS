'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  Printer,
  X,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FlaskConical,
  Stethoscope,
  UserCheck,
  FileText,
  ZoomIn,
  ZoomOut,
  Building2,
  Phone,
  Activity,
  Scissors,
  AlertTriangle,
  Edit3,
  CreditCard,
  Plus,
  Check,
  Receipt,
  Award,
  HeartPulse,
  Sparkles,
} from 'lucide-react';
import type { QueueToken, QueueStage } from './OpdLiveQueue';

export interface DiagnosticSpecRow {
  sno: string;
  loincCode: string;
  testCode: string;
  testName: string;
  methodology: string;
  department: string;
  specimenType: string;
  vacutainerTube: string;
  tubeShortLabel: string;
  tubeColorHex: string;
  volumeMl: number;
  prepInstruction: string;
  tatEstimate: string;
  tariffInr: number;
}

const DIAGNOSTIC_TEST_CATALOG: Record<string, Omit<DiagnosticSpecRow, 'sno'>> = {
  'Complete Blood Count (CBC)': {
    loincCode: '58410-2',
    testCode: 'HEM-CBC01',
    testName: 'Complete Blood Count (CBC) with 5-Part Automated Diff & ESR',
    methodology: 'Fluorescence Flow Cytometry & Photometric',
    department: 'Hematology & Cell Analysis',
    specimenType: 'Venous Whole Blood',
    vacutainerTube: 'Lavender Top (K2-EDTA)',
    tubeShortLabel: 'Lavender EDTA',
    tubeColorHex: '#7C3AED',
    volumeMl: 2.0,
    prepInstruction: 'Random / Invert gently 8-10x',
    tatEstimate: '2 Hours',
    tariffInr: 450,
  },
  'Comprehensive Lipid Profile': {
    loincCode: '24331-1',
    testCode: 'BIO-LIP04',
    testName: 'Lipid Profile Comprehensive (Total Chol, Trig, HDL, Direct LDL, VLDL)',
    methodology: 'Enzymatic Colorimetric (CHOD-PAP / GPO)',
    department: 'Clinical Biochemistry',
    specimenType: 'Centrifuged Serum',
    vacutainerTube: 'Gold Top (SST Gel Clot Activator)',
    tubeShortLabel: 'Gold SST Gel',
    tubeColorHex: '#D97706',
    volumeMl: 3.5,
    prepInstruction: '10-12 Hrs Water-Only Fasting',
    tatEstimate: '3 Hours',
    tariffInr: 850,
  },
  'HbA1c Glycated Hemoglobin': {
    loincCode: '4548-4',
    testCode: 'BIO-HBA1C',
    testName: 'Glycosylated Hemoglobin (HbA1c) with Estimated Average Glucose (eAG)',
    methodology: 'Ion-Exchange HPLC (NGSP / IFCC Certified)',
    department: 'Clinical Biochemistry',
    specimenType: 'Venous Whole Blood',
    vacutainerTube: 'Lavender Top (K2-EDTA)',
    tubeShortLabel: 'Lavender EDTA',
    tubeColorHex: '#7C3AED',
    volumeMl: 2.0,
    prepInstruction: 'No Fasting Required (Random)',
    tatEstimate: '2 Hours',
    tariffInr: 650,
  },
  'Thyroid Profile Total (T3, T4, TSH)': {
    loincCode: '11580-8',
    testCode: 'IMM-THY03',
    testName: 'Thyroid Function Panel (Ultra-Sensitive TSH, Total T3, Total T4)',
    methodology: 'Electrochemiluminescence Immunoassay (ECLIA)',
    department: 'Immunoassay & Endocrinology',
    specimenType: 'Centrifuged Serum',
    vacutainerTube: 'Gold Top (SST Gel Clot Activator)',
    tubeShortLabel: 'Gold SST Gel',
    tubeColorHex: '#D97706',
    volumeMl: 3.5,
    prepInstruction: 'Morning Sample Preferred; Avoid Biotin 48h',
    tatEstimate: '4 Hours',
    tariffInr: 750,
  },
  'Liver Function Test (LFT)': {
    loincCode: '24325-3',
    testCode: 'BIO-LFT09',
    testName: 'Hepatic Function Panel (Bilirubin T/D/I, AST, ALT, ALP, GGT, Total Protein, Albumin)',
    methodology: 'IFCC Spectrophotometric Kinetic Assay',
    department: 'Clinical Biochemistry',
    specimenType: 'Centrifuged Serum',
    vacutainerTube: 'Gold Top (SST Gel Clot Activator)',
    tubeShortLabel: 'Gold SST Gel',
    tubeColorHex: '#D97706',
    volumeMl: 3.5,
    prepInstruction: 'Avoid Hemolysis & Lipemia',
    tatEstimate: '3 Hours',
    tariffInr: 900,
  },
  'Kidney Function Test (KFT)': {
    loincCode: '24362-6',
    testCode: 'BIO-RFT08',
    testName: 'Renal Function & Electrolytes Panel (Creatinine, eGFR, BUN, Uric Acid, Na+, K+, Cl-)',
    methodology: 'Enzymatic Creatinine & Indirect ISE',
    department: 'Clinical Biochemistry',
    specimenType: 'Centrifuged Serum',
    vacutainerTube: 'Gold Top (SST Gel Clot Activator)',
    tubeShortLabel: 'Gold SST Gel',
    tubeColorHex: '#D97706',
    volumeMl: 3.5,
    prepInstruction: 'Routine Venipuncture',
    tatEstimate: '2.5 Hours',
    tariffInr: 950,
  },
  'Fasting Blood Sugar (FBS)': {
    loincCode: '1558-6',
    testCode: 'BIO-FBS01',
    testName: 'Fasting Plasma Glucose (FPG)',
    methodology: 'Hexokinase / G-6-PDH Reference Method',
    department: 'Clinical Biochemistry',
    specimenType: 'Fluoride Plasma',
    vacutainerTube: 'Grey Top (Sodium Fluoride / Na2-EDTA)',
    tubeShortLabel: 'Grey Fluoride',
    tubeColorHex: '#475569',
    volumeMl: 2.0,
    prepInstruction: 'Strict 8-10 Hrs Overnight Fasting',
    tatEstimate: '1.5 Hours',
    tariffInr: 180,
  },
  'Post Prandial Blood Sugar (PPBS)': {
    loincCode: '1521-4',
    testCode: 'BIO-PPB02',
    testName: '2-Hour Post-Prandial Plasma Glucose (PPPG)',
    methodology: 'Hexokinase Enzymatic Assay',
    department: 'Clinical Biochemistry',
    specimenType: 'Fluoride Plasma',
    vacutainerTube: 'Grey Top (Sodium Fluoride / Na2-EDTA)',
    tubeShortLabel: 'Grey Fluoride',
    tubeColorHex: '#475569',
    volumeMl: 2.0,
    prepInstruction: 'Exactly 2 Hrs After Meal Start',
    tatEstimate: '1.5 Hours',
    tariffInr: 180,
  },
  'Urine Routine & Microscopic': {
    loincCode: '24356-8',
    testCode: 'CLP-URM01',
    testName: 'Urine Complete Examination (10-Parameter Dipstick + Digital Flow Microscopy)',
    methodology: 'Reflectance Photometry & Automated Microscopy',
    department: 'Clinical Pathology',
    specimenType: 'Mid-Stream Clean Catch Urine',
    vacutainerTube: 'Sterile Wide-Mouth Barcoded Container',
    tubeShortLabel: 'Sterile Urine Cup',
    tubeColorHex: '#0284C7',
    volumeMl: 15.0,
    prepInstruction: 'First Morning / Mid-Stream Clean Catch',
    tatEstimate: '1.5 Hours',
    tariffInr: 250,
  },
  'Troponin I (STAT Cardiac)': {
    loincCode: '89579-7',
    testCode: 'CRD-TRPI1',
    testName: 'High-Sensitivity Cardiac Troponin-I (hs-cTnI STAT Assay)',
    methodology: 'Chemiluminescent Microparticle Immunoassay (CMIA)',
    department: 'STAT Cardiac & Critical Care',
    specimenType: 'Heparin Plasma / Serum',
    vacutainerTube: 'Green Top (Lithium Heparin) / Gold SST',
    tubeShortLabel: 'Green Heparin',
    tubeColorHex: '#059669',
    volumeMl: 3.0,
    prepInstruction: 'STAT Priority - Immediate Centrifugation',
    tatEstimate: '45 Mins',
    tariffInr: 1450,
  },
  'Vitamin D (25-OH) & Vitamin B12': {
    loincCode: '1989-3',
    testCode: 'IMM-VIT02',
    testName: '25-Hydroxy Vitamin D Total & Serum Cyanocobalamin (Vitamin B12) Combo',
    methodology: 'Electrochemiluminescence (ECLIA)',
    department: 'Immunoassay & Endocrinology',
    specimenType: 'Centrifuged Serum',
    vacutainerTube: 'Gold Top (SST Gel Clot Activator)',
    tubeShortLabel: 'Gold SST Gel',
    tubeColorHex: '#D97706',
    volumeMl: 4.0,
    prepInstruction: 'Protect Specimen from Direct Light',
    tatEstimate: '4 Hours',
    tariffInr: 1800,
  },
  'Coagulation Profile (PT/INR & aPTT)': {
    loincCode: '5902-2',
    testCode: 'COA-PT01',
    testName: 'Prothrombin Time (PT) with ISI/INR & Activated Partial Thromboplastin Time',
    methodology: 'Optical Nephelometric Clotting Detection',
    department: 'Coagulation & Hemostasis',
    specimenType: 'Citrated Platelet-Poor Plasma',
    vacutainerTube: 'Light Blue Top (3.2% Sodium Citrate 9:1)',
    tubeShortLabel: 'Blue Citrate',
    tubeColorHex: '#0EA5E9',
    volumeMl: 2.7,
    prepInstruction: 'Strict Fill to Mark (9:1 Ratio Required)',
    tatEstimate: '2 Hours',
    tariffInr: 800,
  },
};

const CATALOG_ALIASES: Record<string, string> = {
  'Complete Blood Count': 'Complete Blood Count (CBC)',
  CBC: 'Complete Blood Count (CBC)',
  'Lipid Profile': 'Comprehensive Lipid Profile',
  'Lipid Profile Comprehensive': 'Comprehensive Lipid Profile',
  HbA1c: 'HbA1c Glycated Hemoglobin',
  'Thyroid Total': 'Thyroid Profile Total (T3, T4, TSH)',
  LFT: 'Liver Function Test (LFT)',
  KFT: 'Kidney Function Test (KFT)',
  'Fasting Blood Sugar': 'Fasting Blood Sugar (FBS)',
  'Urine Routine': 'Urine Routine & Microscopic',
};

function resolveDiagnosticRows(testsOrdered?: string[]): DiagnosticSpecRow[] {
  const rawList =
    Array.isArray(testsOrdered) && testsOrdered.length > 0
      ? testsOrdered
      : ['Complete Blood Count (CBC)', 'Comprehensive Lipid Profile', 'Thyroid Profile Total (T3, T4, TSH)'];

  return rawList.map((rawName, idx) => {
    const sno = String(idx + 1).padStart(2, '0');
    const canonicalKey = CATALOG_ALIASES[rawName] || rawName;
    const exact = DIAGNOSTIC_TEST_CATALOG[canonicalKey];
    if (exact) {
      return { sno, ...exact };
    }
    const matchedKey = Object.keys(DIAGNOSTIC_TEST_CATALOG).find(
      (k) =>
        rawName.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(rawName.toLowerCase())
    );
    if (matchedKey) {
      return { sno, ...DIAGNOSTIC_TEST_CATALOG[matchedKey]! };
    }
    return {
      sno,
      loincCode: `2432${idx}-0`,
      testCode: `LAB-PNL0${idx + 1}`,
      testName: rawName,
      methodology: 'Automated Clinical Analyzer Protocol',
      department: 'Core Diagnostic Laboratory',
      specimenType: 'Venous Serum / Whole Blood',
      vacutainerTube: 'Gold Top (SST Gel) / Lavender EDTA',
      tubeShortLabel: 'Gold SST Gel',
      tubeColorHex: '#0284C7',
      volumeMl: 3.0,
      prepInstruction: 'Standard Pre-Analytical Protocol',
      tatEstimate: '3 Hours',
      tariffInr: 600,
    };
  });
}

function generateDeterministicAbhaId(uhid: string): string {
  let hash = 2166136261;
  for (let i = 0; i < uhid.length; i++) {
    hash ^= uhid.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const abs = Math.abs(hash);
  const p1 = String((abs % 8999) + 1000);
  const p2 = String(((abs >> 4) % 8999) + 1000);
  const p3 = String(((abs >> 8) % 8999) + 1000);
  return `91-${p1}-${p2}-${p3}`;
}

function generateBarcodeBars(seedText: string): number[] {
  const bars: number[] = [2, 1, 1, 2, 3, 1];
  for (let i = 0; i < seedText.length; i++) {
    const code = seedText.charCodeAt(i);
    bars.push((code % 3) + 1);
    bars.push(((code >> 2) % 2) + 1);
    bars.push(((code >> 4) % 3) + 1);
  }
  bars.push(2, 3, 1, 1, 2);
  return bars;
}

function generateDeterministicQrMatrix(seedText: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r]![c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    grid[6]![i] = i % 2 === 0;
    grid[i]![6] = i % 2 === 0;
  }

  let hash = 5381;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 33) ^ seedText.charCodeAt(i);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft || r === 6 || c === 6) continue;
      const cellSeed = Math.abs((hash ^ (r * 31 + c * 17)) * 1103515245);
      grid[r]![c] = cellSeed % 11 < 6;
    }
  }
  return grid;
}

const ROUTING_STEPS: Array<{
  stage: QueueStage;
  code: string;
  title: string;
  subtitle: string;
  defaultRoom: string;
}> = [
  {
    stage: 'WAITING_VITALS',
    code: 'STAGE 01',
    title: 'Registration & Triage',
    subtitle: 'UHID, ABHA & Vitals Check',
    defaultRoom: 'Triage Desk A (G-Floor)',
  },
  {
    stage: 'PHLEBOTOMY',
    code: 'STAGE 02',
    title: 'Sample Collection',
    subtitle: 'Barcoded Vacutainer Draw',
    defaultRoom: 'Phlebotomy Booth 1',
  },
  {
    stage: 'CONSULTATION',
    code: 'STAGE 03',
    title: 'Specialist Doctor OPD',
    subtitle: 'Clinical Exam & Rx Advice',
    defaultRoom: 'OPD Consultation Wing',
  },
  {
    stage: 'LAB_PROCESSING',
    code: 'STAGE 04',
    title: 'Diagnostic Lab / Imaging',
    subtitle: 'HL7 / ASTM Analyzer Run',
    defaultRoom: 'Core Lab Bay 2 (1st Flr)',
  },
  {
    stage: 'BILLING_DISPATCH',
    code: 'STAGE 05',
    title: 'Pharmacy & Report Sign-Off',
    subtitle: 'Verified NABL Release',
    defaultRoom: 'Report & Pharmacy Desk',
  },
];

const CONSULTING_DOCTORS = [
  { name: 'Dr. Rajesh Sharma, MD (Internal Medicine)', regNo: 'MCI-REG-44910', dept: 'General & Internal Medicine', cabin: 'OPD Cabin 101' },
  { name: 'Dr. Priya Mehta, DM (Cardiology)', regNo: 'MCI-REG-51208', dept: 'Interventional Cardiology', cabin: 'OPD Cabin 102' },
  { name: 'Dr. Arun Kumar, MD (Diabetology & Endo)', regNo: 'MCI-REG-38904', dept: 'Endocrinology & Metabolism', cabin: 'OPD Cabin 103' },
  { name: 'Dr. Nikil Panchal, MD (Chief Pathologist)', regNo: 'NABL-DIR-2026', dept: 'Clinical Pathology & Lab Medicine', cabin: 'Diagnostic Wing A' },
  { name: 'Dr. Ananya Sen, MS (OBGYN)', regNo: 'MCI-REG-60412', dept: 'Obstetrics & Gynecology', cabin: 'OPD Cabin 105' },
];

interface OpdTokenA4PrintModalProps {
  token: QueueToken | null;
  qrDataUrl?: string;
  onClose: () => void;
}

export default function OpdTokenA4PrintModal({
  token,
  qrDataUrl,
  onClose,
}: OpdTokenA4PrintModalProps) {
  const [layoutMode, setLayoutMode] = useState<'A4_SHEET' | 'THERMAL_80MM'>('A4_SHEET');
  const [previewScale, setPreviewScale] = useState<'FIT' | 'ACTUAL'>('FIT');
  const [showClinicalEditor, setShowClinicalEditor] = useState(false);

  // Editable Clinical & Triage Vitals State
  const [bpValue, setBpValue] = useState('122/78 mmHg');
  const [pulseValue, setPulseValue] = useState('76 bpm');
  const [spo2Value, setSpo2Value] = useState('98% RA');
  const [tempValue, setTempValue] = useState('98.4 F');
  const [weightKg, setWeightKg] = useState('68');
  const [heightCm, setHeightCm] = useState('170');
  const [rbsValue, setRbsValue] = useState('96 mg/dL');
  const [bloodGroup, setBloodGroup] = useState('O+ Positive');
  const [allergyStatus, setAllergyStatus] = useState('No Known Drug / Latex Allergies (NKA)');
  const [fallRiskStatus, setFallRiskStatus] = useState('Low Risk - Ambulatory');
  const [fastingOverride, setFastingOverride] = useState<string>('');

  // Editable Consultation, Payer & Tests State
  const [selectedDoctorIdx, setSelectedDoctorIdx] = useState(0);
  const [visitCategory, setVisitCategory] = useState('OPD Consultation + Diagnostic Requisition');
  const [payerCategory, setPayerCategory] = useState('Self-Pay / Direct Private Tariff');
  const [paymentMode, setPaymentMode] = useState('PAID - UPI / Digital Receipt Verified');
  const [opdConsultFee, setOpdConsultFee] = useState<number>(500);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [customSelectedTests, setCustomSelectedTests] = useState<string[] | null>(null);

  const [checklistState, setChecklistState] = useState({
    identityVerified: true,
    barcodeAffixed: true,
    fastingConfirmed: true,
    anticoagulantRatioChecked: true,
    hemolysisFreeVerified: true,
  });

  const printSheetRef = useRef<HTMLDivElement>(null);
  const thermalSlipRef = useRef<HTMLDivElement>(null);

  const activeTestsList =
    customSelectedTests !== null
      ? customSelectedTests
      : Array.isArray(token?.testsOrdered) && token.testsOrdered.length > 0
      ? token.testsOrdered
      : ['Complete Blood Count (CBC)', 'Comprehensive Lipid Profile', 'Thyroid Profile Total (T3, T4, TSH)'];

  const diagnosticRows = resolveDiagnosticRows(activeTestsList);

  const toggleCatalogTest = (testKey: string) => {
    const current = [...activeTestsList];
    const exists = current.some(
      (t) => t === testKey || (CATALOG_ALIASES[t] && CATALOG_ALIASES[t] === testKey)
    );
    if (exists) {
      if (current.length <= 1) return;
      setCustomSelectedTests(
        current.filter((t) => t !== testKey && CATALOG_ALIASES[t] !== testKey)
      );
    } else {
      setCustomSelectedTests([...current, testKey]);
    }
  };

  // BMI calculation
  const bmiCalculated = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (!w || !h || h <= 0) return '23.5';
    return (w / (h * h)).toFixed(1);
  }, [weightKg, heightCm]);

  // Vacutainer tube summary aggregation
  const tubeSummary = useMemo(() => {
    const map = new Map<string, { label: string; hex: string; count: number; totalVol: number }>();
    diagnosticRows.forEach((row) => {
      const existing = map.get(row.tubeShortLabel);
      if (existing) {
        existing.count += 1;
        existing.totalVol += row.volumeMl;
      } else {
        map.set(row.tubeShortLabel, {
          label: row.tubeShortLabel,
          hex: row.tubeColorHex,
          count: 1,
          totalVol: row.volumeMl,
        });
      }
    });
    return Array.from(map.values());
  }, [diagnosticRows]);

  const totalBloodVolumeMl = useMemo(
    () => diagnosticRows.reduce((acc, r) => acc + r.volumeMl, 0).toFixed(1),
    [diagnosticRows]
  );

  // Financial calculation
  const labSubtotal = useMemo(
    () => diagnosticRows.reduce((acc, r) => acc + r.tariffInr, 0),
    [diagnosticRows]
  );
  const grossTotal = labSubtotal + (Number(opdConsultFee) || 0);
  const netPayable = Math.max(0, grossTotal - (Number(discountAmount) || 0));

  const abhaId = generateDeterministicAbhaId(token?.uhid || 'UHID-2026-1002');
  const nowDate = token?.createdAt ? new Date(token.createdAt) : new Date();
  const datePart = `${nowDate.getFullYear()}${String(nowDate.getMonth() + 1).padStart(2, '0')}${String(nowDate.getDate()).padStart(2, '0')}`;
  const cleanToken = token?.tokenNumber ? token.tokenNumber.replace(/[^A-Z0-9]/gi, '') : 'TK000';
  const accessionNumber = `ACC-${datePart}-${cleanToken}`;
  const receiptNumber = `RCP-${datePart}-${String(token?.tokenIndex || 102).padStart(4, '0')}`;

  const formattedDate = nowDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = nowDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const selectedDoctor =
    CONSULTING_DOCTORS[selectedDoctorIdx] || CONSULTING_DOCTORS[0]!;
  const effectiveDoctorName = token?.doctorName || selectedDoctor.name;

  const effectiveFasting =
    fastingOverride ||
    (token?.fastingStatus === 'FASTING_12H'
      ? '10-12 Hrs Overnight Fasting Verified'
      : token?.fastingStatus === 'POST_PRANDIAL'
      ? '2-Hr Post-Prandial (PP) Specimen'
      : token?.fastingStatus || '10-12 Hrs Overnight Fasting Verified');

  const barcodeBars = generateBarcodeBars(accessionNumber);
  const fallbackQrMatrix = useMemo(
    () => {
      if (!token) return [];
      return generateDeterministicQrMatrix(`${accessionNumber}|${token.uhid}|${token.tokenNumber}`);
    },
    [accessionNumber, token?.uhid, token?.tokenNumber]
  );

  if (!token) return null;

  const stageOrder: QueueStage[] = [
    'WAITING_VITALS',
    'PHLEBOTOMY',
    'CONSULTATION',
    'LAB_PROCESSING',
    'BILLING_DISPATCH',
    'COMPLETED',
  ];
  const currentStageIdx = Math.max(0, stageOrder.indexOf(token.stage));

  const priorityConfig =
    token.priority === 'EMERGENCY'
      ? {
          label: 'STAT / EMERGENCY RED LANE',
          shortLabel: 'STAT EMERGENCY',
          border: '#B91C1C',
          bg: '#FEF2F2',
          text: '#991B1B',
        }
      : token.priority === 'VIP' || token.priority === 'FAST_TRACK'
      ? {
          label: `${token.priority.replace(/_/g, ' ')} PRIORITY LANE`,
          shortLabel: token.priority.replace(/_/g, ' '),
          border: '#B45309',
          bg: '#FFFBEB',
          text: '#92400E',
        }
      : token.priority === 'SENIOR_CITIZEN'
      ? {
          label: 'SENIOR CITIZEN PRIORITY (60+ YRS)',
          shortLabel: 'SENIOR CITIZEN',
          border: '#0369A1',
          bg: '#F0F9FF',
          text: '#075985',
        }
      : {
          label: 'ROUTINE AMBULATORY OPD & LAB',
          shortLabel: 'ROUTINE OPD',
          border: '#047857',
          bg: '#ECFDF5',
          text: '#065F46',
        };

  const renderQrGraphic = (sizePx: number) => {
    if (qrDataUrl) {
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={qrDataUrl}
          alt="Live Queue Turn Tracking QR Code"
          style={{ width: sizePx, height: sizePx }}
          className="object-contain bg-white"
        />
      );
    }
    const dim = fallbackQrMatrix.length;
    return (
      <svg
        width={sizePx}
        height={sizePx}
        viewBox={`0 0 ${dim + 2} ${dim + 2}`}
        className="bg-white"
        aria-label="Live Queue Turn Tracking QR Code"
      >
        <rect x="0" y="0" width={dim + 2} height={dim + 2} fill="#FFFFFF" />
        {fallbackQrMatrix.map((row, rIdx) =>
          row.map((cell, cIdx) =>
            cell ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx + 1}
                y={rIdx + 1}
                width={1}
                height={1}
                fill="#0F172A"
              />
            ) : null
          )
        )}
      </svg>
    );
  };

  const renderHospitalCrestSvg = (sizePx = 42) => (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-label="Hospital Official Medical Crest"
    >
      <rect x="2" y="2" width="60" height="60" rx="12" fill="#F8FAFC" stroke="#0284C7" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="23" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M28 14H36V26H48V34H36V46H28V34H16V26H28V14Z" fill="#0284C7" fillOpacity="0.14" stroke="#0284C7" strokeWidth="1.8" />
      <path d="M32 13V49" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="11.5" r="2.5" fill="#0F766E" />
      <path d="M22 20C26 17 30 18 32 20C34 18 38 17 42 20C39 23 35 23 32 22C29 23 25 23 22 20Z" fill="#0F766E" />
      <path d="M26 26C29 29 35 29 38 32C35 35 29 35 26 38C29 41 35 41 38 44" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 26C35 29 29 29 26 32C29 35 35 35 38 38C35 41 29 41 26 44" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const handlePrintDocument = () => {
    const isThermal = layoutMode === 'THERMAL_80MM';
    const targetRef = isThermal ? thermalSlipRef.current : printSheetRef.current;
    if (!targetRef) {
      window.print();
      return;
    }

    const sheetHtml = targetRef.innerHTML;
    const printWindow = window.open('', '_blank', 'width=1050,height=920');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>LABCORE_OPD_${isThermal ? 'Thermal_Slip' : 'A4_Requisition'}_${token.tokenNumber}_${token.uhid}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: ${isThermal ? '80mm auto' : 'A4 portrait'};
      margin: ${isThermal ? '3mm' : '6mm'};
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #FFFFFF !important;
      color: #0F172A !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-container {
      width: ${isThermal ? '74mm' : '198mm'};
      margin: 0 auto;
      background: #FFFFFF;
      box-sizing: border-box;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="print-container">
    ${sheetHtml}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="LABCORE Hospital OPD Queue Token & Printable Requisition Sheet"
    >
      {/* Dedicated @media print rules for true A4 & 80mm printing */}
      <style>{`
        @media print {
          @page {
            size: ${layoutMode === 'THERMAL_80MM' ? '80mm auto' : 'A4 portrait'};
            margin: ${layoutMode === 'THERMAL_80MM' ? '3mm' : '6mm'};
          }
          body * {
            visibility: hidden !important;
          }
          #labcore-opd-print-sheet,
          #labcore-opd-print-sheet * {
            visibility: visible !important;
          }
          #labcore-opd-print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${layoutMode === 'THERMAL_80MM' ? '76mm' : '198mm'} !important;
            max-width: none !important;
            margin: 0 !important;
            padding: ${layoutMode === 'THERMAL_80MM' ? '3mm' : '5mm'} !important;
            box-shadow: none !important;
            background: #FFFFFF !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* =====================================================================
          TOP NON-PRINTED CONTROL & CLINICAL CUSTOMIZATION BAR (ULTRA-LIGHT)
         ===================================================================== */}
      <div className="w-full max-w-[980px] bg-white border border-slate-300 rounded-t-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-0 z-30 print:hidden">
        <div className="flex items-center gap-3">
          {renderHospitalCrestSvg(38)}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                LABCORE MEDICAL DIAGNOSTICS &amp; HOSPITAL
              </h2>
              <span className="text-[11px] font-mono font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                NABL ISO 15189:2022 &bull; NABH OPD
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono">
              Token: <strong className="text-slate-900">{token.tokenNumber}</strong> &middot; Patient:{' '}
              <strong className="text-slate-900">{token.patientName}</strong> &middot; UHID:{' '}
              <strong className="text-slate-900">{token.uhid}</strong> &middot; Accession: {accessionNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Dual Print Format Switcher: Full A4 Sheet vs 80mm Thermal Slip */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300">
            <button
              type="button"
              onClick={() => setLayoutMode('A4_SHEET')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                layoutMode === 'A4_SHEET'
                  ? 'bg-white text-sky-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={13} />
              <span>A4 Hospital Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('THERMAL_80MM')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                layoutMode === 'THERMAL_80MM'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt size={13} />
              <span>80mm Token Slip</span>
            </button>
          </div>

          {/* Live Clinical & Tests Editor Drawer Button */}
          <button
            type="button"
            onClick={() => setShowClinicalEditor((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 whitespace-nowrap ${
              showClinicalEditor
                ? 'bg-sky-50 text-sky-900 border-sky-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Edit3 size={13} />
            <span>{showClinicalEditor ? 'Close Editor' : 'Edit Vitals / Tests / Fee'}</span>
          </button>

          {/* Scale Switcher (A4 mode) */}
          {layoutMode === 'A4_SHEET' && (
            <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewScale('FIT')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
                  previewScale === 'FIT'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ZoomOut size={12} /> Fit
              </button>
              <button
                type="button"
                onClick={() => setPreviewScale('ACTUAL')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
                  previewScale === 'ACTUAL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ZoomIn size={12} /> 100%
              </button>
            </div>
          )}

          {/* Primary Print Trigger */}
          <button
            type="button"
            onClick={handlePrintDocument}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white shadow-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Printer size={14} />
            <span>
              {layoutMode === 'A4_SHEET' ? 'Print A4 OPD Sheet' : 'Print 80mm Token Slip'}
            </span>
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* =====================================================================
          COLLAPSIBLE LIVE CLINICAL, VITALS, DOCTOR & TESTS EDITOR DRAWER
         ===================================================================== */}
      {showClinicalEditor && (
        <div className="w-full max-w-[980px] bg-slate-50 border-x border-b border-slate-300 px-4 py-3.5 space-y-3 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <HeartPulse size={14} className="text-sky-700" />
              Live Pre-Print Clinical Vitals, Consulting Specialist, Tariff &amp; Test Order Editor
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Updates reflect immediately on both A4 Sheet &amp; 80mm Slip
            </span>
          </div>

          {/* Row 1: Vitals & Anthropometry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                BP (mmHg)
              </label>
              <input
                type="text"
                value={bpValue}
                onChange={(e) => setBpValue(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Pulse (bpm)
              </label>
              <input
                type="text"
                value={pulseValue}
                onChange={(e) => setPulseValue(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                SpO2 (%)
              </label>
              <input
                type="text"
                value={spo2Value}
                onChange={(e) => setSpo2Value(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Temp (F)
              </label>
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Weight (kg)
              </label>
              <input
                type="text"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Height (cm)
              </label>
              <input
                type="text"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Capillary RBS
              </label>
              <input
                type="text"
                value={rbsValue}
                onChange={(e) => setRbsValue(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
              >
                <option value="O+ Positive">O+ Positive</option>
                <option value="A+ Positive">A+ Positive</option>
                <option value="B+ Positive">B+ Positive</option>
                <option value="AB+ Positive">AB+ Positive</option>
                <option value="O- Negative">O- Negative</option>
                <option value="A- Negative">A- Negative</option>
              </select>
            </div>
          </div>

          {/* Row 2: Doctor, Fasting, Payer, Fees & Clinical Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Consulting / Referring Specialist
              </label>
              <select
                value={selectedDoctorIdx}
                onChange={(e) => setSelectedDoctorIdx(Number(e.target.value))}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900 font-medium"
              >
                {CONSULTING_DOCTORS.map((doc, idx) => (
                  <option key={doc.regNo} value={idx}>
                    {doc.name} ({doc.cabin})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Dietary / Fasting State
              </label>
              <select
                value={effectiveFasting}
                onChange={(e) => setFastingOverride(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900 font-medium"
              >
                <option value="10-12 Hrs Overnight Fasting Verified">10-12 Hrs Fasting</option>
                <option value="8-10 Hrs Fasting Verified">8-10 Hrs Fasting</option>
                <option value="2-Hr Post-Prandial (PP) Specimen">2-Hr Post-Prandial</option>
                <option value="Random / Non-Fasting Specimen">Random (Non-Fasting)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Payer / Tariff Plan
              </label>
              <select
                value={payerCategory}
                onChange={(e) => setPayerCategory(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900 font-medium"
              >
                <option value="Self-Pay / Direct Private Tariff">Direct Private</option>
                <option value="CGHS / ECHS Central Govt">CGHS / ECHS Govt</option>
                <option value="Ayushman Bharat PM-JAY">Ayushman PM-JAY</option>
                <option value="Cashless TPA / Star Health">Cashless TPA</option>
                <option value="Corporate Wellness Empanelled">Corporate Panel</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                OPD Consult Fee (INR)
              </label>
              <input
                type="number"
                min={0}
                value={opdConsultFee}
                onChange={(e) => setOpdConsultFee(Number(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Concession / TPA (INR)
              </label>
              <input
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
          </div>

          {/* Row 3: Allergy, Chief Complaints & Provisional Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Drug / Latex Allergy Alert
              </label>
              <input
                type="text"
                value={allergyStatus}
                onChange={(e) => setAllergyStatus(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Chief Complaints / Clinical History
              </label>
              <input
                type="text"
                placeholder="e.g., Fatigue, polyuria, routine glycemic & thyroid evaluation"
                value={chiefComplaints}
                onChange={(e) => setChiefComplaints(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Provisional ICD-10 Diagnosis / Doctor Note
              </label>
              <input
                type="text"
                placeholder="e.g., E11.9 Type 2 Diabetes Mellitus / E03.9 Hypothyroidism screen"
                value={provisionalDiagnosis}
                onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
          </div>

          {/* Row 4: Ordered Diagnostic Tests Quick Toggle Pills */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              Ordered Diagnostic Lab Panels (Click to Add / Remove from Requisition Table):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(DIAGNOSTIC_TEST_CATALOG).map((testKey) => {
                const isSelected = activeTestsList.some(
                  (t) => t === testKey || CATALOG_ALIASES[t] === testKey
                );
                const spec = DIAGNOSTIC_TEST_CATALOG[testKey]!;
                return (
                  <button
                    key={testKey}
                    type="button"
                    onClick={() => toggleCatalogTest(testKey)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: spec.tubeColorHex }}
                    />
                    <span>{testKey}</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      (&#8377;{spec.tariffInr})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MAIN VIEWPORT CANVAS: FULL A4 HOSPITAL SHEET OR 80MM THERMAL SLIP
         ===================================================================== */}
      <div className="w-full max-w-[980px] bg-slate-200/80 border-x border-b border-slate-300 rounded-b-xl p-3 sm:p-6 flex justify-center overflow-x-auto">
        {layoutMode === 'A4_SHEET' ? (
          /* =================================================================
             MODE 1: FULL A4 HOSPITAL OPD REQUISITION, ROUTING & TOKEN SHEET
             ================================================================= */
          <div
            id="labcore-opd-print-sheet"
            ref={printSheetRef}
            className={`bg-white text-slate-900 shadow-xl border border-slate-300 transition-transform origin-top ${
              previewScale === 'FIT'
                ? 'w-full max-w-[850px] p-5 sm:p-7'
                : 'w-[850px] min-w-[850px] p-7'
            }`}
            style={{ minHeight: '1120px' }}
          >
            {/* 1. INSTITUTIONAL ACCREDITATION STRIP */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 mb-2 border-b border-slate-300 text-[9px] font-mono text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">NABL ISO 15189:2022 CERT: MC-6042</span>
                <span>&bull;</span>
                <span className="font-bold text-slate-900">NABH ACCREDITED: HOSP-2026-8841</span>
                <span>&bull;</span>
                <span>CLSI H3-A6 &amp; HL7 FHIR R4</span>
              </div>
              <div className="flex items-center gap-2">
                <span>CLINICAL EST. REG: MH/MUM/CEA-90412</span>
                <span>&bull;</span>
                <span>GSTIN: 27AABCL8821M1Z5</span>
              </div>
            </div>

            {/* 2. OFFICIAL HOSPITAL, LAB & CLINIC LETTERHEAD HEADER */}
            <div className="border-b-2 border-slate-900 pb-3 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Left: Hospital Crest + Name + Address */}
              <div className="flex items-start gap-3.5">
                {renderHospitalCrestSvg(54)}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase leading-none">
                      LABCORE MEDICAL DIAGNOSTICS &amp; HOSPITAL
                    </h1>
                  </div>
                  <p className="text-[11px] font-bold text-sky-800 mt-1">
                    Department of Outpatient Medicine (OPD), Automated Clinical Pathology &amp; Radio-Diagnostics
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                    Campus Tower A &amp; B, Healthcare Knowledge Park, Sector 14 &bull; 24x7 Emergency &amp; Lab Helpline:{' '}
                    <strong className="text-slate-900">+91 (022) 4890-7700</strong> &bull; Web: www.labcorehospital.org
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[9.5px] font-mono text-slate-700">
                    <span>
                      <strong>Document:</strong> OPD Queue &amp; Diagnostic Requisition Form (Form-OPD-04A)
                    </span>
                    <span>&middot;</span>
                    <span>
                      <strong>Visit Type:</strong> {visitCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Prominent Token Callout Box */}
              <div className="shrink-0 w-full sm:w-auto border-2 border-slate-900 rounded-lg bg-slate-50 px-3.5 py-2 text-center flex sm:flex-col items-center justify-between sm:justify-center gap-2">
                <div className="text-left sm:text-center">
                  <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">
                    OPD QUEUE TOKEN NO.
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 leading-none my-0.5">
                    {token.tokenNumber}
                  </div>
                </div>
                <div className="flex flex-col items-end sm:items-center gap-1">
                  <div
                    className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border"
                    style={{
                      borderColor: priorityConfig.border,
                      backgroundColor: priorityConfig.bg,
                      color: priorityConfig.text,
                    }}
                  >
                    {priorityConfig.label}
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-700">
                    Station: <strong className="text-slate-900">{token.counterName}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SECTION 01: PATIENT MASTER DEMOGRAPHICS, ABHA ID & BARCODE GRID */}
            <div className="mb-3">
              <div className="bg-[#F0F9FF] border border-slate-300 border-b-0 px-2.5 py-1 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0284C7]">
                  01. Patient Master Demographics, ABHA Health ID &amp; Consulting Specialist
                </span>
                <span className="text-[10px] font-mono text-slate-600">
                  Issued: <strong>{formattedDate}</strong> at <strong>{formattedTime}</strong>
                </span>
              </div>

              <div className="grid grid-cols-12 border border-slate-300 text-[11px] bg-white">
                {/* Left 9 cols: 3x3 Demographic & Clinical Cells */}
                <div className="col-span-12 sm:col-span-9 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-300">
                  {/* Col 1 */}
                  <div className="divide-y divide-slate-200">
                    <div className="p-2">
                      <div className="text-[9px] font-mono uppercase text-slate-500 font-semibold">
                        Patient Full Name
                      </div>
                      <div className="font-black text-slate-900 text-xs mt-0.5">
                        {token.patientName}
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-[9px] font-mono uppercase text-slate-500 font-semibold">
                        Age / Sex / Blood Group
                      </div>
                      <div className="font-bold text-slate-900 font-mono mt-0.5">
                        {token.age} Yrs &middot; {token.gender} &middot;{' '}
                        <span className="text-sky-800">{bloodGroup}</span>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-[9px] font-mono uppercase text-slate-500 font-semibold">
                        Registered Mobile (SMS/WA)
                      </div>
                      <div className="font-mono font-semibold text-slate-800 mt-0.5">
                        {token.phone ? `+91 ${token.phone}` : '+91 98201-44910'}
                      </div>
                    </div>
                  </div>

                  {/* Col 2 */}
                  <div className="divide-y divide-slate-200">
                    <div className="p-2">
                      <div className="text-[9px] font-mono uppercase text-slate-500 font-semibold">
                        Hospital UHID / MRN
                      </div>
                      <div className="font-mono font-black text-slate-900 text-xs mt-0.5">
                        {token.uhid}
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-[9px] font-mono uppercase text-slate-500 font-semibold">
                        Ayushman Bharat ABHA ID
                      </div>
                      <div className="font-mono font-bold text-teal-800 mt-0.5">
                        {abhaId}
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-[9px] font-mono uppercase text-slate-500 font-semibold">
                        LIS Specimen Accession No.
                      </div>
                      <div className="font-mono font-bold text-slate-900 mt-0.5">
                        {accessionNumber}
                      </div>
                    </div>
                  </div>

                  {/* Col 3 */}
                  <div className="divide-y divide-slate-200">
                    <div className="p-2">
                      <div className="text-[9px] font-mono uppercase text-slate-500 font-semibold">
                        Consulting / Referring Doctor
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5 leading-tight">
                        {effectiveDoctorName}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">
                        {selectedDoctor.dept} ({selectedDoctor.regNo})
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-[9px] font-mono uppercase text-slate-500 font-semibold">
                        Assigned OPD Room / Station
                      </div>
                      <div className="font-bold text-sky-900 mt-0.5">
                        {token.counterName}
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-[9px] font-mono uppercase text-slate-500 font-semibold">
                        Payer / Billing Category
                      </div>
                      <div className="font-semibold text-slate-800 mt-0.5 truncate">
                        {payerCategory}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 3 cols: 1D Barcode + Live Queue QR Code */}
                <div className="col-span-12 sm:col-span-3 border-t sm:border-t-0 sm:border-l border-slate-300 bg-slate-50/60 p-2 flex flex-col items-center justify-between">
                  <div className="w-full text-center">
                    <div className="text-[8.5px] font-mono font-bold uppercase text-slate-500">
                      1D LIS ACCESSION BARCODE
                    </div>
                    <div className="flex justify-center my-1 bg-white py-1 px-1.5 border border-slate-200 rounded">
                      <svg
                        width="148"
                        height="26"
                        viewBox="0 0 180 30"
                        className="bg-white"
                        aria-label="1D Accession Barcode"
                      >
                        {(() => {
                          let xPos = 4;
                          return barcodeBars.map((w, idx) => {
                            const isBar = idx % 2 === 0;
                            const widthPx = w * 1.85;
                            const rect = isBar ? (
                              <rect
                                key={idx}
                                x={xPos}
                                y={2}
                                width={widthPx}
                                height={26}
                                fill="#0F172A"
                              />
                            ) : null;
                            xPos += widthPx;
                            return rect;
                          });
                        })()}
                      </svg>
                    </div>
                    <div className="text-[9px] font-mono font-bold text-slate-800">
                      *{accessionNumber}*
                    </div>
                  </div>

                  <div className="w-full border-t border-slate-200 pt-1.5 mt-1 flex items-center justify-center gap-2">
                    <div className="border border-slate-300 bg-white p-0.5 rounded shrink-0">
                      {renderQrGraphic(52)}
                    </div>
                    <div className="text-left">
                      <div className="text-[8.5px] font-mono font-bold uppercase text-sky-900">
                        LIVE QUEUE QR
                      </div>
                      <p className="text-[8.5px] text-slate-600 leading-tight">
                        Scan with phone camera for live turn &amp; e-report status.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. SECTION 02: CLINICAL TRIAGE VITALS, ANTHROPOMETRY & PRE-ANALYTICAL SAFETY */}
            <div className="mb-3">
              <div className="bg-[#F0FDFA] border border-slate-300 border-b-0 px-2.5 py-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F766E]">
                  02. Triage Vitals, Anthropometry &amp; Pre-Analytical Fasting Status
                </span>
                <span className="text-[9.5px] font-mono text-slate-600">
                  Triage Protocol: Nursing Desk Verified &bull; BMI Auto-Computed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 border border-slate-300 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 bg-white text-center">
                <div className="p-1.5">
                  <div className="text-[8.5px] font-mono uppercase text-slate-500 font-semibold">
                    Blood Pressure
                  </div>
                  <div className="text-xs font-mono font-black text-slate-900 mt-0.5">
                    {bpValue}
                  </div>
                  <div className="text-[8px] font-mono text-slate-400">Ref: 120/80 mmHg</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[8.5px] font-mono uppercase text-slate-500 font-semibold">
                    Pulse Rate
                  </div>
                  <div className="text-xs font-mono font-black text-slate-900 mt-0.5">
                    {pulseValue}
                  </div>
                  <div className="text-[8px] font-mono text-slate-400">Ref: 60-100 bpm</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[8.5px] font-mono uppercase text-slate-500 font-semibold">
                    Arterial SpO2
                  </div>
                  <div className="text-xs font-mono font-black text-emerald-800 mt-0.5">
                    {spo2Value}
                  </div>
                  <div className="text-[8px] font-mono text-slate-400">Ref: 95-100%</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[8.5px] font-mono uppercase text-slate-500 font-semibold">
                    Temperature
                  </div>
                  <div className="text-xs font-mono font-black text-slate-900 mt-0.5">
                    {tempValue}
                  </div>
                  <div className="text-[8px] font-mono text-slate-400">Afebrile (Normal)</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[8.5px] font-mono uppercase text-slate-500 font-semibold">
                    Weight / Ht / BMI
                  </div>
                  <div className="text-xs font-mono font-black text-slate-900 mt-0.5">
                    {weightKg}kg &middot; {bmiCalculated} kg/m&sup2;
                  </div>
                  <div className="text-[8px] font-mono text-slate-400">Height: {heightCm} cm</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[8.5px] font-mono uppercase text-slate-500 font-semibold">
                    Capillary RBS
                  </div>
                  <div className="text-xs font-mono font-black text-sky-900 mt-0.5">
                    {rbsValue}
                  </div>
                  <div className="text-[8px] font-mono text-slate-400">Glucometer Check</div>
                </div>
              </div>

              {/* Pre-Analytical Dietary & Safety Strip */}
              <div className="border border-t-0 border-slate-300 bg-slate-50 px-2.5 py-1.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold uppercase text-slate-500">Fasting State:</span>
                  <strong className="font-mono text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                    {effectiveFasting}
                  </strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold uppercase text-slate-500">Allergies:</span>
                  <strong className="text-slate-900 truncate">{allergyStatus}</strong>
                </div>
                <div className="flex items-center sm:justify-end gap-1.5">
                  <span className="font-mono font-bold uppercase text-slate-500">Fall / Triage Risk:</span>
                  <strong className="text-emerald-800 font-mono">{fallRiskStatus}</strong>
                </div>
              </div>
            </div>

            {/* 5. SECTION 03: 5-STAGE OPD & DIAGNOSTIC CLINICAL ROUTING TRACKER */}
            <div className="mb-3">
              <div className="bg-slate-100 border border-slate-300 border-b-0 px-2.5 py-1 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-800">
                  03. Multi-Stage Ambulatory OPD &amp; Diagnostic Clinical Routing Tracker
                </span>
                <span className="text-[9.5px] font-mono text-slate-600">
                  Active Counter: <strong className="text-sky-900">{token.counterName}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 border border-slate-300 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 text-[10px] bg-white">
                {ROUTING_STEPS.map((step, idx) => {
                  const isCompleted = idx < currentStageIdx;
                  const isCurrent = idx === currentStageIdx;
                  return (
                    <div
                      key={step.code}
                      className={`p-2 flex flex-col justify-between ${
                        isCurrent ? 'bg-sky-50/70' : isCompleted ? 'bg-emerald-50/30' : 'bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-[9px] text-slate-500">
                            {step.code}
                          </span>
                          <span
                            className={`font-mono font-bold text-[8.5px] px-1.5 py-0.2 rounded uppercase ${
                              isCurrent
                                ? 'bg-sky-700 text-white'
                                : isCompleted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isCurrent ? 'ACTIVE STATION' : isCompleted ? 'DONE' : 'QUEUED'}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 mt-1 leading-tight">
                          {step.title}
                        </div>
                        <div className="text-[9px] text-slate-500 leading-tight mt-0.5">
                          {step.subtitle}
                        </div>
                      </div>
                      <div className="mt-2 pt-1 border-t border-dashed border-slate-200 flex items-center justify-between text-[9px] font-mono text-slate-600">
                        <span className="truncate font-semibold text-slate-800">
                          {isCurrent ? token.counterName : step.defaultRoom}
                        </span>
                        <span>{isCompleted ? 'Verified' : 'Sign: ____'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. SECTION 04: ORDERED DIAGNOSTIC INVESTIGATIONS & VACUTAINER SPECIMEN TABLE */}
            <div className="mb-3">
              <div className="bg-slate-100 border border-slate-300 border-b-0 px-2.5 py-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-800">
                  04. Prescribed Diagnostic Investigations, LOINC &amp; Vacutainer Specimen Matrix
                </span>
                <span className="text-[9.5px] font-mono text-slate-600">
                  Total Panels: <strong>{diagnosticRows.length}</strong> &middot; Est. Blood Draw:{' '}
                  <strong>{totalBloodVolumeMl} mL</strong>
                </span>
              </div>

              <div className="border border-slate-300 overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300 text-[9px] font-mono uppercase text-slate-600">
                      <th className="py-1.5 px-2 border-r border-slate-300 w-7 text-center">#</th>
                      <th className="py-1.5 px-2 border-r border-slate-300 w-24">Code / LOINC</th>
                      <th className="py-1.5 px-2 border-r border-slate-300">
                        Investigation Name &amp; Analytical Method
                      </th>
                      <th className="py-1.5 px-2 border-r border-slate-300 w-28">Department</th>
                      <th className="py-1.5 px-2 border-r border-slate-300 w-36">
                        Specimen &amp; Vacutainer
                      </th>
                      <th className="py-1.5 px-1.5 border-r border-slate-300 w-14 text-center">
                        Vol.
                      </th>
                      <th className="py-1.5 px-2 border-r border-slate-300 w-32">
                        Pre-Analytical Prep
                      </th>
                      <th className="py-1.5 px-1.5 border-r border-slate-300 w-14 text-center">
                        TAT
                      </th>
                      <th className="py-1.5 px-2 w-16 text-right">Fee (&#8377;)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {diagnosticRows.map((row) => (
                      <tr key={row.sno} className="align-top">
                        <td className="py-1.5 px-2 border-r border-slate-300 font-mono font-bold text-slate-600 text-center">
                          {row.sno}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-300 font-mono">
                          <div className="font-bold text-slate-900">{row.testCode}</div>
                          <div className="text-[8.5px] text-slate-500">LOINC: {row.loincCode}</div>
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-300">
                          <div className="font-bold text-slate-900 leading-snug">{row.testName}</div>
                          <div className="text-[8.5px] text-slate-500 font-mono">
                            Method: {row.methodology}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-300 text-[9.5px] text-slate-700 font-medium">
                          {row.department}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-300">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-[9.5px]">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-400"
                              style={{ backgroundColor: row.tubeColorHex }}
                            />
                            <span>{row.vacutainerTube}</span>
                          </div>
                          <div className="text-[8.5px] text-slate-500 pl-4">{row.specimenType}</div>
                        </td>
                        <td className="py-1.5 px-1.5 border-r border-slate-300 font-mono font-bold text-slate-800 text-center">
                          {row.volumeMl.toFixed(1)} mL
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-300 text-[9px] text-slate-700">
                          {row.prepInstruction}
                        </td>
                        <td className="py-1.5 px-1.5 border-r border-slate-300 font-mono font-semibold text-slate-800 text-center">
                          {row.tatEstimate}
                        </td>
                        <td className="py-1.5 px-2 font-mono font-bold text-slate-900 text-right">
                          {row.tariffInr.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vacutainer Collection Summary & NABL Pre-Analytical Verification Bar */}
              <div className="border border-t-0 border-slate-300 bg-slate-50 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[9.5px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold uppercase text-slate-600">
                    Required Vacutainers:
                  </span>
                  {tubeSummary.map((t) => (
                    <span
                      key={t.label}
                      className="inline-flex items-center gap-1 bg-white border border-slate-300 px-2 py-0.5 rounded font-mono font-semibold text-slate-800"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: t.hex }}
                      />
                      <span>
                        {t.count}x {t.label} ({t.totalVol.toFixed(1)} mL)
                      </span>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 font-mono text-[9px] text-slate-700">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState.identityVerified}
                      onChange={(e) =>
                        setChecklistState((s) => ({ ...s, identityVerified: e.target.checked }))
                      }
                      className="accent-sky-700"
                    />
                    <span>2-Factor ID Verified</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState.barcodeAffixed}
                      onChange={(e) =>
                        setChecklistState((s) => ({ ...s, barcodeAffixed: e.target.checked }))
                      }
                      className="accent-sky-700"
                    />
                    <span>Barcoded at Bed/Chair</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState.fastingConfirmed}
                      onChange={(e) =>
                        setChecklistState((s) => ({ ...s, fastingConfirmed: e.target.checked }))
                      }
                      className="accent-sky-700"
                    />
                    <span>Fasting Confirmed</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 7. SECTION 05: DOCTOR OPD CONSULTATION Rx BOX + BILLING & FEE RECEIPT STRIP */}
            <div className="grid grid-cols-12 gap-3 mb-3">
              {/* Left 7 Cols: Doctor OPD Clinical Notes, ICD-10 & Rx Box */}
              <div className="col-span-12 sm:col-span-7 border border-slate-300 bg-white flex flex-col justify-between">
                <div>
                  <div className="bg-slate-100 border-b border-slate-300 px-2.5 py-1 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-800">
                      05A. OPD Physician Clinical Notes, Provisional Diagnosis &amp; Rx
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      Cabin: {selectedDoctor.cabin}
                    </span>
                  </div>
                  <div className="p-2.5 space-y-2 text-[10px]">
                    <div className="grid grid-cols-12 gap-2 border-b border-dashed border-slate-200 pb-1.5">
                      <span className="col-span-4 font-mono font-bold uppercase text-slate-500 text-[9px]">
                        Chief Complaints / H/O:
                      </span>
                      <span className="col-span-8 font-medium text-slate-900">
                        {chiefComplaints ||
                          'Ambulatory OPD evaluation & baseline diagnostic laboratory workup.'}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-2 border-b border-dashed border-slate-200 pb-1.5">
                      <span className="col-span-4 font-mono font-bold uppercase text-slate-500 text-[9px]">
                        Provisional Diagnosis:
                      </span>
                      <span className="col-span-8 font-mono font-semibold text-slate-900">
                        {provisionalDiagnosis ||
                          'Z00.00 General Medical Examination / Metabolic & Endocrine Screen'}
                      </span>
                    </div>
                    {/* Ruled Rx Area for Doctor Handwriting / Clinical Remarks */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-1">
                        <span className="font-bold text-slate-800 text-xs font-serif">
                          &#8478; / Clinical Advice &amp; Special Instructions:
                        </span>
                        <span>(Physician Stamp &amp; Notes)</span>
                      </div>
                      <div className="h-6 border-b border-dotted border-slate-300" />
                      <div className="h-6 border-b border-dotted border-slate-300" />
                    </div>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[9px] font-mono text-slate-600">
                  <span>Follow-Up Review: With Lab Reports</span>
                  <span>Emergency Contact: +91 (022) 4890-7700</span>
                </div>
              </div>

              {/* Right 5 Cols: Itemized OPD & Diagnostic Fee Receipt Summary */}
              <div className="col-span-12 sm:col-span-5 border border-slate-300 bg-white flex flex-col justify-between">
                <div>
                  <div className="bg-slate-100 border-b border-slate-300 px-2.5 py-1 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-800">
                      05B. OPD &amp; Lab Billing Receipt
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                      SETTLED / PAID
                    </span>
                  </div>
                  <div className="p-2.5 space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between font-mono text-[9.5px] text-slate-600">
                      <span>Official Receipt No:</span>
                      <strong className="text-slate-900">{receiptNumber}</strong>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[9.5px] text-slate-600">
                      <span>OPD Specialist Consultation Fee:</span>
                      <strong className="text-slate-900">
                        &#8377;{Number(opdConsultFee).toFixed(2)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[9.5px] text-slate-600">
                      <span>Diagnostic Lab Investigations ({diagnosticRows.length}):</span>
                      <strong className="text-slate-900">&#8377;{labSubtotal.toFixed(2)}</strong>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[9.5px] text-slate-600">
                      <span>Concession / TPA Coverage:</span>
                      <strong className="text-emerald-700">
                        - &#8377;{Number(discountAmount).toFixed(2)}
                      </strong>
                    </div>
                    <div className="border-t border-slate-300 pt-1.5 flex items-center justify-between font-mono text-xs font-black text-slate-900">
                      <span>NET TOTAL RECEIVED:</span>
                      <span className="text-sky-900">&#8377;{netPayable.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="px-2.5 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[9px] font-mono text-slate-700">
                  <span className="truncate">{paymentMode}</span>
                  <span className="font-bold text-emerald-800">AUTH SIGN</span>
                </div>
              </div>
            </div>

            {/* 8. SECTION 06: 3-COLUMN OFFICIAL HOSPITAL & LABORATORY SIGN-OFF STAMPS */}
            <div className="grid grid-cols-3 border border-slate-300 divide-x divide-slate-300 text-[9.5px] bg-white mb-3">
              <div className="p-2 flex flex-col justify-between h-14">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold uppercase text-slate-600 text-[8.5px]">
                    1. OPD Registration &amp; Triage Desk
                  </span>
                  <span className="text-[8px] font-mono text-emerald-700 font-bold">VERIFIED</span>
                </div>
                <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-700 border-t border-dashed border-slate-300 pt-1">
                  <span>Officer: Front Desk #02</span>
                  <span>{formattedTime}</span>
                </div>
              </div>
              <div className="p-2 flex flex-col justify-between h-14">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold uppercase text-slate-600 text-[8.5px]">
                    2. Certified Phlebotomist Sign-Off
                  </span>
                  <span className="text-[8px] font-mono text-slate-500">
                    Tubes: {tubeSummary.reduce((a, b) => a + b.count, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-600 border-t border-dashed border-slate-300 pt-1">
                  <span>Draw Time: ____:____</span>
                  <span>Sign: ____________</span>
                </div>
              </div>
              <div className="p-2 flex flex-col justify-between h-14">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold uppercase text-slate-600 text-[8.5px]">
                    3. Consulting Doctor / Pathologist
                  </span>
                  <span className="text-[8px] font-mono text-sky-800 font-bold">NABL / MCI</span>
                </div>
                <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-600 border-t border-dashed border-slate-300 pt-1">
                  <span className="truncate max-w-[125px]">{effectiveDoctorName}</span>
                  <span>Stamp &amp; Sign</span>
                </div>
              </div>
            </div>

            {/* 9. SECTION 07: PERFORATED TEAR-OFF PATIENT HANDOVER TOKEN & REPORT VOUCHER */}
            <div className="pt-1">
              <div className="flex items-center gap-2 text-[8.5px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-2">
                <span className="border-t border-dashed border-slate-400 flex-1" />
                <span className="flex items-center gap-1 text-slate-700">
                  <Scissors size={11} />
                  PERFORATED TEAR-OFF PATIENT HANDOVER TOKEN &amp; REPORT COLLECTION VOUCHER
                </span>
                <span className="border-t border-dashed border-slate-400 flex-1" />
              </div>

              <div className="border-2 border-slate-900 rounded-lg p-2.5 bg-slate-50/70 grid grid-cols-12 gap-3 items-center">
                {/* Left 5 cols: Hospital & Patient Summary */}
                <div className="col-span-12 sm:col-span-5 border-b sm:border-b-0 sm:border-r border-slate-300 pb-2 sm:pb-0 sm:pr-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-black uppercase text-sky-900">
                      LABCORE MEDICAL DIAGNOSTICS &amp; HOSPITAL
                    </span>
                  </div>
                  <div className="text-xs font-black text-slate-900 mt-0.5">
                    {token.patientName}{' '}
                    <span className="font-mono font-normal text-[10px] text-slate-600">
                      ({token.age}Y/{token.gender})
                    </span>
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-700">
                    UHID: <strong>{token.uhid}</strong> &middot; ABHA: {abhaId}
                  </div>
                  <div className="text-[9px] font-mono text-slate-600 mt-0.5 truncate">
                    Doctor: {effectiveDoctorName}
                  </div>
                  <div className="text-[9px] font-mono text-slate-700 mt-0.5">
                    Receipt: <strong>{receiptNumber}</strong> &middot; Paid:{' '}
                    <strong className="text-emerald-800">&#8377;{netPayable.toFixed(2)}</strong> (
                    {diagnosticRows.length} Tests)
                  </div>
                </div>

                {/* Center 4 cols: Prominent Token & Station Routing */}
                <div className="col-span-8 sm:col-span-4 text-center px-2">
                  <div className="text-[8.5px] font-mono font-bold uppercase text-slate-500">
                    WAITING HALL QUEUE TOKEN
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900 tracking-tight my-0.5 bg-white border border-slate-900 rounded py-0.5">
                    {token.tokenNumber}
                  </div>
                  <div className="text-[10px] font-bold text-slate-900">
                    Proceed To: <span className="text-sky-800">{token.counterName}</span>
                  </div>
                  <div className="text-[8.5px] font-mono text-slate-600">
                    Priority: {priorityConfig.shortLabel} &middot; Issued: {formattedTime}
                  </div>
                </div>

                {/* Right 3 cols: Mini QR Code on Tear-Off Stub */}
                <div className="col-span-4 sm:col-span-3 flex flex-col items-center justify-center border-l border-slate-300 pl-2">
                  <div className="border border-slate-300 bg-white p-0.5 rounded">
                    {renderQrGraphic(56)}
                  </div>
                  <span className="text-[8px] font-mono font-bold uppercase text-slate-700 mt-1 text-center">
                    Scan for Live Turn &amp; PDF Report
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =================================================================
             MODE 2: UPGRADED 80MM HOSPITAL THERMAL OPD QUEUE TOKEN SLIP
             (ULTRA-LIGHT WHITE CLINICAL RECEIPT FOR HOSPITALS, LABS & CLINICS)
             ================================================================= */
          <div
            ref={thermalSlipRef}
            className="w-full max-w-[400px] bg-white text-slate-900 border border-slate-300 rounded-xl shadow-xl p-5"
          >
            {/* Hospital Emblem & Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <div className="flex justify-center mb-1.5">{renderHospitalCrestSvg(44)}</div>
              <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sky-800">
                NABL ISO 15189:2022 &bull; NABH ACCREDITED
              </div>
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-0.5 leading-snug">
                LABCORE MEDICAL DIAGNOSTICS &amp; HOSPITAL
              </h1>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Outpatient (OPD) &amp; Clinical Pathology Token Slip
              </p>
              <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                Helpline: +91 (022) 4890-7700 &bull; {formattedDate} {formattedTime}
              </p>
            </div>

            {/* Prominent Token Callout Box */}
            <div className="my-3 border-2 border-slate-900 rounded-xl bg-slate-50 p-3 text-center">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-600 mb-1">
                <span>TOKEN SLIP</span>
                <span
                  className="px-1.5 py-0.2 rounded font-bold border"
                  style={{
                    borderColor: priorityConfig.border,
                    backgroundColor: priorityConfig.bg,
                    color: priorityConfig.text,
                  }}
                >
                  {priorityConfig.shortLabel}
                </span>
              </div>
              <div className="text-4xl font-black font-mono text-slate-900 tracking-tight py-1 bg-white border border-slate-300 rounded-lg">
                {token.tokenNumber}
              </div>
              <div className="mt-2 text-xs font-bold text-slate-900">
                Proceed To: <span className="text-sky-800">{token.counterName}</span>
              </div>
              <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                Consultant: {effectiveDoctorName}
              </div>
            </div>

            {/* Patient Demographics & Identifiers Table */}
            <div className="border border-slate-300 rounded-lg divide-y divide-slate-200 text-[11px] mb-3 bg-white">
              <div className="p-2 flex items-center justify-between">
                <span className="text-slate-500 font-mono text-[10px] uppercase">Patient:</span>
                <strong className="text-slate-900 font-black">{token.patientName}</strong>
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-slate-500 font-mono text-[10px] uppercase">Age / Sex / BG:</span>
                <span className="font-mono font-bold text-slate-800">
                  {token.age}Y / {token.gender} / {bloodGroup}
                </span>
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-slate-500 font-mono text-[10px] uppercase">UHID / MRN:</span>
                <span className="font-mono font-bold text-slate-900">{token.uhid}</span>
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-slate-500 font-mono text-[10px] uppercase">ABHA ID:</span>
                <span className="font-mono font-semibold text-teal-800">{abhaId}</span>
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-slate-500 font-mono text-[10px] uppercase">Fasting Status:</span>
                <span className="font-mono font-bold text-amber-800 text-[10px]">
                  {effectiveFasting}
                </span>
              </div>
            </div>

            {/* Compact Triage Vitals Strip */}
            <div className="border border-slate-300 rounded-lg bg-slate-50 p-2 mb-3">
              <div className="text-[9px] font-mono font-bold uppercase text-slate-500 mb-1">
                Recorded Triage Vitals
              </div>
              <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                <div className="bg-white border border-slate-200 rounded p-1">
                  <div className="text-[8px] text-slate-400">BP</div>
                  <div className="font-bold text-slate-900">{bpValue.split(' ')[0]}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-1">
                  <div className="text-[8px] text-slate-400">PULSE</div>
                  <div className="font-bold text-slate-900">{pulseValue}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-1">
                  <div className="text-[8px] text-slate-400">SpO2</div>
                  <div className="font-bold text-emerald-800">{spo2Value}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-1">
                  <div className="text-[8px] text-slate-400">TEMP</div>
                  <div className="font-bold text-slate-900">{tempValue}</div>
                </div>
              </div>
            </div>

            {/* Ordered Diagnostic Tests & Vacutainers Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-3 bg-white">
              <div className="bg-slate-100 px-2.5 py-1.5 border-b border-slate-300 flex items-center justify-between text-[9.5px] font-mono font-bold uppercase text-slate-700">
                <span>Ordered Tests &amp; Tubes ({diagnosticRows.length})</span>
                <span>Fee (&#8377;)</span>
              </div>
              <div className="divide-y divide-slate-200 text-[10px]">
                {diagnosticRows.map((row) => (
                  <div key={row.sno} className="p-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">{row.testName}</div>
                      <div className="text-[9px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: row.tubeColorHex }}
                        />
                        <span>
                          {row.tubeShortLabel} ({row.volumeMl.toFixed(1)}mL) &middot; TAT:{' '}
                          {row.tatEstimate}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {row.tariffInr.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 border-t border-slate-300 px-2.5 py-1.5 space-y-0.5 font-mono text-[10px]">
                <div className="flex justify-between text-slate-600">
                  <span>OPD Consultation Fee:</span>
                  <span>&#8377;{Number(opdConsultFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 text-xs pt-0.5 border-t border-slate-200">
                  <span>TOTAL PAID ({receiptNumber}):</span>
                  <span className="text-emerald-800">&#8377;{netPayable.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 2D Live Turn QR Code + 1D Barcode */}
            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70 flex flex-col items-center text-center">
              <div className="border border-slate-300 bg-white p-1.5 rounded-lg shadow-2xs">
                {renderQrGraphic(108)}
              </div>
              <div className="text-[10px] font-mono font-bold uppercase text-sky-900 mt-2">
                Scan with Phone to Track Live Turn
              </div>
              <p className="text-[9.5px] text-slate-600 mt-0.5 leading-snug">
                Watch your token number on the waiting hall digital screens or scan QR for live queue status.
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200 w-full flex flex-col items-center">
                <svg width="160" height="24" viewBox="0 0 180 30" className="bg-white">
                  {(() => {
                    let xPos = 4;
                    return barcodeBars.map((w, idx) => {
                      const isBar = idx % 2 === 0;
                      const widthPx = w * 1.85;
                      const rect = isBar ? (
                        <rect
                          key={idx}
                          x={xPos}
                          y={2}
                          width={widthPx}
                          height={26}
                          fill="#0F172A"
                        />
                      ) : null;
                      xPos += widthPx;
                      return rect;
                    });
                  })()}
                </svg>
                <span className="text-[9px] font-mono font-bold text-slate-700 mt-0.5">
                  *{accessionNumber}*
                </span>
              </div>
            </div>

            {/* Bottom Action Buttons inside Slip View */}
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setLayoutMode('A4_SHEET')}
                className="py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <FileText size={13} />
                <span>Full A4 Sheet</span>
              </button>
              <button
                type="button"
                onClick={handlePrintDocument}
                className="py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={13} />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
