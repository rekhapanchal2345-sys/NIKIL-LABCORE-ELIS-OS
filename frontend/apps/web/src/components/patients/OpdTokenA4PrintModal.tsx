'use client';

import React, { useState, useRef } from 'react';
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
  Maximize2,
  Building2,
  Phone,
  Activity,
  Scissors,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import type { QueueToken, QueueStage } from './OpdLiveQueue';

interface DiagnosticSpecRow {
  sno: string;
  loincCode: string;
  testCode: string;
  testName: string;
  department: string;
  specimenType: string;
  vacutainerTube: string;
  tubeColorHex: string;
  volumeMl: string;
  prepInstruction: string;
  tatEstimate: string;
}

const DIAGNOSTIC_TEST_CATALOG: Record<string, Omit<DiagnosticSpecRow, 'sno'>> = {
  'Complete Blood Count': {
    loincCode: '58410-2',
    testCode: 'HEM-CBC01',
    testName: 'Complete Blood Count (CBC) with 5-Part Differential',
    department: 'Hematology & Cell Analysis',
    specimenType: 'Venous Whole Blood',
    vacutainerTube: 'Lavender Top (K2-EDTA)',
    tubeColorHex: '#7C3AED',
    volumeMl: '2.0 mL',
    prepInstruction: 'Random / Invert gently 8x',
    tatEstimate: '2 Hours',
  },
  'Lipid Profile': {
    loincCode: '24331-1',
    testCode: 'BIO-LIP04',
    testName: 'Comprehensive Lipid Profile (Chol, Trig, HDL, Direct LDL)',
    department: 'Clinical Biochemistry',
    specimenType: 'Centrifuged Serum',
    vacutainerTube: 'Gold Top (SST Gel Clot Activator)',
    tubeColorHex: '#D97706',
    volumeMl: '3.5 mL',
    prepInstruction: '10-12 Hrs Water-Only Fasting',
    tatEstimate: '3 Hours',
  },
  HbA1c: {
    loincCode: '4548-4',
    testCode: 'BIO-HBA1C',
    testName: 'Glycosylated Hemoglobin (HbA1c - HPLC NGSP Certified)',
    department: 'Clinical Biochemistry',
    specimenType: 'Venous Whole Blood',
    vacutainerTube: 'Lavender Top (K2-EDTA)',
    tubeColorHex: '#7C3AED',
    volumeMl: '2.0 mL',
    prepInstruction: 'No Fasting Required (Random)',
    tatEstimate: '2 Hours',
  },
  'Thyroid Total': {
    loincCode: '11580-8',
    testCode: 'IMM-THY03',
    testName: 'Thyroid Function Panel (Ultra-Sensitive TSH, Total T3, Total T4)',
    department: 'Chemiluminescence Immunoassay',
    specimenType: 'Centrifuged Serum',
    vacutainerTube: 'Gold Top (SST Gel Clot Activator)',
    tubeColorHex: '#D97706',
    volumeMl: '3.5 mL',
    prepInstruction: 'Morning Sample Preferred; Avoid Biotin 48h',
    tatEstimate: '4 Hours',
  },
  LFT: {
    loincCode: '24325-3',
    testCode: 'BIO-LFT09',
    testName: 'Hepatic Function Panel (Bilirubin T/D, AST, ALT, ALP, GGT, Albumin)',
    department: 'Clinical Biochemistry',
    specimenType: 'Centrifuged Serum',
    vacutainerTube: 'Gold Top (SST Gel Clot Activator)',
    tubeColorHex: '#D97706',
    volumeMl: '3.5 mL',
    prepInstruction: 'Avoid Hemolysis & Lipemia',
    tatEstimate: '3 Hours',
  },
  KFT: {
    loincCode: '24362-6',
    testCode: 'BIO-RFT08',
    testName: 'Renal Function & Electrolytes Panel (Creatinine, eGFR, BUN, Uric Acid, Na/K/Cl)',
    department: 'Clinical Biochemistry',
    specimenType: 'Centrifuged Serum',
    vacutainerTube: 'Gold Top (SST Gel Clot Activator)',
    tubeColorHex: '#D97706',
    volumeMl: '3.5 mL',
    prepInstruction: 'Routine Venipuncture',
    tatEstimate: '2.5 Hours',
  },
  'Fasting Blood Sugar': {
    loincCode: '1558-6',
    testCode: 'BIO-FBS01',
    testName: 'Fasting Plasma Glucose (Hexokinase Enzymatic Method)',
    department: 'Clinical Biochemistry',
    specimenType: 'Fluoride Plasma',
    vacutainerTube: 'Grey Top (Sodium Fluoride / Na2-EDTA)',
    tubeColorHex: '#475569',
    volumeMl: '2.0 mL',
    prepInstruction: 'Strict 8-10 Hrs Overnight Fasting',
    tatEstimate: '1.5 Hours',
  },
  'Urine Routine': {
    loincCode: '24356-8',
    testCode: 'CLP-URM01',
    testName: 'Urine Complete Examination (Automated Dipstick + Flow Microscopy)',
    department: 'Clinical Pathology',
    specimenType: 'Mid-Stream Clean Catch Urine',
    vacutainerTube: 'Sterile Wide-Mouth Barcoded Container',
    tubeColorHex: '#0284C7',
    volumeMl: '15.0 mL',
    prepInstruction: 'First Morning / Mid-Stream Specimen',
    tatEstimate: '1.5 Hours',
  },
};

function resolveDiagnosticRows(testsOrdered?: string[]): DiagnosticSpecRow[] {
  const rawList =
    Array.isArray(testsOrdered) && testsOrdered.length > 0
      ? testsOrdered
      : ['Thyroid Total', 'LFT', 'KFT'];

  return rawList.map((rawName, idx) => {
    const sno = String(idx + 1).padStart(2, '0');
    const exact = DIAGNOSTIC_TEST_CATALOG[rawName];
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
      department: 'Core Diagnostic Laboratory',
      specimenType: 'Venous Serum / Whole Blood',
      vacutainerTube: 'Gold Top (SST Gel) / EDTA',
      tubeColorHex: '#0369A1',
      volumeMl: '3.0 mL',
      prepInstruction: 'Standard Pre-Analytical Protocol',
      tatEstimate: '3 Hours',
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

const ROUTING_STEPS: Array<{
  stage: QueueStage;
  code: string;
  title: string;
  subtitle: string;
  defaultRoom: string;
}> = [
  {
    stage: 'WAITING_VITALS',
    code: 'STEP 01',
    title: 'Registration & Triage',
    subtitle: 'UHID, ABHA & Vitals Check',
    defaultRoom: 'Triage Desk A',
  },
  {
    stage: 'PHLEBOTOMY',
    code: 'STEP 02',
    title: 'Sample Collection',
    subtitle: 'Barcoded Vacutainer Draw',
    defaultRoom: 'Phlebotomy Booth 1',
  },
  {
    stage: 'CONSULTATION',
    code: 'STEP 03',
    title: 'Specialist OPD',
    subtitle: 'Clinical Consultation',
    defaultRoom: 'OPD Cabin 101',
  },
  {
    stage: 'LAB_PROCESSING',
    code: 'STEP 04',
    title: 'Automated Analyzer',
    subtitle: 'HL7 / ASTM Assay Run',
    defaultRoom: 'Core Lab Bay 2',
  },
  {
    stage: 'BILLING_DISPATCH',
    code: 'STEP 05',
    title: 'Pathologist Sign-Off',
    subtitle: 'NABL Report Release',
    defaultRoom: 'Report Counter',
  },
];

interface OpdTokenA4PrintModalProps {
  token: QueueToken | null;
  qrDataUrl: string;
  onClose: () => void;
}

export default function OpdTokenA4PrintModal({
  token,
  qrDataUrl,
  onClose,
}: OpdTokenA4PrintModalProps) {
  const [previewScale, setPreviewScale] = useState<'FIT' | 'ACTUAL'>('FIT');
  const [showVitalsEditor, setShowVitalsEditor] = useState(false);
  const [bpValue, setBpValue] = useState('122/78 mmHg');
  const [pulseValue, setPulseValue] = useState('76 bpm');
  const [spo2Value, setSpo2Value] = useState('98%');
  const [tempValue, setTempValue] = useState('98.4 F');
  const [fastingOverride, setFastingOverride] = useState<string>('');
  const [checklistState, setChecklistState] = useState({
    identityVerified: true,
    barcodeAffixed: true,
    fastingConfirmed: true,
    specimenIntegrity: false,
    coldChainLogged: false,
  });

  const printSheetRef = useRef<HTMLDivElement>(null);

  if (!token) return null;

  const diagnosticRows = resolveDiagnosticRows(token.testsOrdered);
  const abhaId = generateDeterministicAbhaId(token.uhid || 'UHID-2026-1002');
  const accessionNumber = `ACC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${token.tokenNumber.replace(/[^A-Z0-9]/gi, '')}`;
  const issuedDateObj = token.createdAt ? new Date(token.createdAt) : new Date();
  const formattedDate = issuedDateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = issuedDateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const effectiveFasting = fastingOverride || token.fastingStatus || 'RANDOM';
  const barcodeBars = generateBarcodeBars(accessionNumber);

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
          label: 'STAT / EMERGENCY PRIORITY',
          border: '#B91C1C',
          bg: '#FEF2F2',
          text: '#991B1B',
        }
      : token.priority === 'VIP' || token.priority === 'FAST_TRACK'
      ? {
          label: `${token.priority.replace(/_/g, ' ')} PRIORITY`,
          border: '#B45309',
          bg: '#FFFBEB',
          text: '#92400E',
        }
      : {
          label: 'ROUTINE AMBULATORY OPD',
          border: '#047857',
          bg: '#ECFDF5',
          text: '#065F46',
        };

  const handlePrintA4Document = () => {
    if (!printSheetRef.current) {
      window.print();
      return;
    }

    const sheetHtml = printSheetRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=1024,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>OPD_Queue_Requisition_${token.tokenNumber}_${token.uhid}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: A4 portrait;
      margin: 7mm;
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
    .a4-print-root {
      width: 196mm;
      min-height: 280mm;
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
  <div class="a4-print-root">
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
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="A4 Hospital OPD Queue Token & Requisition Sheet"
    >
      {/* Non-Printed Top Action & Control Toolbar */}
      <div className="w-full max-w-[920px] bg-white border border-slate-300 rounded-t-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold">
            <FileText size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                A4 Hospital OPD Queue &amp; Diagnostic Requisition Sheet
              </h2>
              <span className="text-[11px] font-mono font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                ISO 15189:2022 A4 FORMAT
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Token: {token.tokenNumber} &middot; Patient: {token.patientName} &middot; UHID: {token.uhid} &middot; Paper: 210mm x 297mm (A4 Portrait)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Vitals & Fasting Quick Editor Toggle */}
          <button
            type="button"
            onClick={() => setShowVitalsEditor((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 whitespace-nowrap ${
              showVitalsEditor
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Edit3 size={13} />
            {showVitalsEditor ? 'Hide Triage Vitals' : 'Edit Vitals / Fasting'}
          </button>

          {/* Scale Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setPreviewScale('FIT')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                previewScale === 'FIT'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fit Preview
            </button>
            <button
              type="button"
              onClick={() => setPreviewScale('ACTUAL')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                previewScale === 'ACTUAL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              100% A4 (210mm)
            </button>
          </div>

          {/* Primary A4 Print Button */}
          <button
            type="button"
            onClick={handlePrintA4Document}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 border border-sky-900 transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Printer size={14} />
            Print A4 OPD Slip
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition flex items-center gap-1 whitespace-nowrap"
          >
            <X size={14} />
            Close
          </button>
        </div>
      </div>

      {/* Collapsible Triage Vitals & Pre-Analytical Editor Bar (Non-Printed) */}
      {showVitalsEditor && (
        <div className="w-full max-w-[920px] bg-slate-50 border-x border-b border-slate-300 px-4 py-2.5 grid grid-cols-2 sm:grid-cols-5 gap-2.5 print:hidden">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Blood Pressure
            </label>
            <input
              type="text"
              value={bpValue}
              onChange={(e) => setBpValue(e.target.value)}
              className="w-full mt-0.5 px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Heart Rate / Pulse
            </label>
            <input
              type="text"
              value={pulseValue}
              onChange={(e) => setPulseValue(e.target.value)}
              className="w-full mt-0.5 px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Oxygen (SpO2)
            </label>
            <input
              type="text"
              value={spo2Value}
              onChange={(e) => setSpo2Value(e.target.value)}
              className="w-full mt-0.5 px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Body Temp
            </label>
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full mt-0.5 px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Fasting State
            </label>
            <select
              value={effectiveFasting}
              onChange={(e) => setFastingOverride(e.target.value)}
              className="w-full mt-0.5 px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
            >
              <option value="RANDOM">RANDOM (Non-Fasting)</option>
              <option value="FASTING_12H">FASTING (10-12 Hrs)</option>
              <option value="POST_PRANDIAL_2H">POST-PRANDIAL (2 Hrs PP)</option>
              <option value="STAT_EMERGENCY">STAT / EMERGENCY</option>
            </select>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* A4 PRINTABLE CLINICAL DOCUMENT SHEET (210mm x 297mm PROPORTIONS)      */}
      {/* ===================================================================== */}
      <div
        className={`w-full ${
          previewScale === 'ACTUAL' ? 'max-w-[210mm]' : 'max-w-[920px]'
        } bg-white border border-slate-300 shadow-2xl rounded-b-xl p-5 sm:p-7 text-slate-900 mb-8`}
      >
        <div
          ref={printSheetRef}
          className="bg-white text-slate-900 border-2 border-slate-900 p-4 sm:p-5 space-y-3.5"
        >
          {/* 1. INSTITUTIONAL HOSPITAL & NABL DIAGNOSTIC LABORATORY HEADER */}
          <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left: Hospital Crest Logo + Titles */}
            <div className="flex items-start gap-3.5">
              {/* Institutional Medical & Diagnostic Vector Emblem */}
              <div className="w-16 h-16 shrink-0 rounded-lg border-2 border-slate-900 bg-slate-50 flex flex-col items-center justify-center p-1">
                <svg
                  viewBox="0 0 64 64"
                  className="w-11 h-11 text-sky-800"
                  fill="none"
                   xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="4"
                    y="4"
                    width="56"
                    height="56"
                    rx="10"
                    stroke="#0F172A"
                    strokeWidth="3.5"
                    fill="#F8FAFC"
                  />
                  <path
                    d="M27 14H37V27H50V37H37V50H27V37H14V27H27V14Z"
                    fill="#0369A1"
                    stroke="#0F172A"
                    strokeWidth="2"
                  />
                  <circle cx="32" cy="32" r="5" fill="#FFFFFF" />
                </svg>
                <span className="text-[7px] font-mono font-bold tracking-widest uppercase text-slate-900 mt-0.5">
                  NABL MC-4892
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-800">
                    TERTIARY CLINICAL PATHOLOGY &amp; AMBULATORY HOSPITAL
                  </span>
                  <span className="text-[10px] text-slate-400">&middot;</span>
                  <span className="text-[10px] font-mono font-semibold text-slate-700">
                    ISO 15189:2022 &amp; CAP ACCREDITED
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase leading-tight mt-0.5">
                  LABCORE MEDICAL DIAGNOSTICS &amp; HOSPITAL
                </h1>
                <p className="text-[11px] font-semibold text-slate-700">
                  Department of Laboratory Medicine, Clinical Biochemistry, Hematology &amp; Outpatient Services
                </p>
                <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                  Central Clinical Wing, Sector 14, Medical Enclave &middot; 24x7 Lab Desk: +91 (022) 4890-1100 &middot; HL7 FHIR R4 / ABDM Node
                </p>
              </div>
            </div>

            {/* Right: Authoritative Token & Queue Box */}
            <div className="w-full sm:w-auto shrink-0 border-2 border-slate-900 rounded-lg bg-slate-50 px-4 py-2 text-center min-w-[175px]">
              <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-600 border-b border-slate-300 pb-0.5">
                OPD QUEUE TOKEN NO.
              </div>
              <div className="text-3xl font-black font-mono tracking-tight text-slate-900 leading-none py-1.5">
                {token.tokenNumber}
              </div>
              <div
                className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border"
                style={{
                  borderColor: priorityConfig.border,
                  backgroundColor: priorityConfig.bg,
                  color: priorityConfig.text,
                }}
              >
                {priorityConfig.label}
              </div>
            </div>
          </div>

          {/* DOCUMENT CONTROL BANNER */}
          <div className="bg-slate-900 text-white px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <div className="font-bold uppercase tracking-wider">
              FORM: LC-OPD-REQ-2026 &middot; OUTPATIENT QUEUE ROUTING &amp; PRE-ANALYTICAL SPECIMEN REQUISITION
            </div>
            <div>
              ACCESSION NO: <strong className="text-sky-300">{accessionNumber}</strong> &middot; STATUS:{' '}
              <strong className="text-emerald-300">{token.status}</strong>
            </div>
          </div>

          {/* 2. PATIENT DEMOGRAPHICS, UHID/ABHA & CLINICAL TRIAGE MATRIX (4-COLUMN TABLE) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-800">
                01. Patient Demographics, Identifiers &amp; Clinical Triage Record
              </span>
              <span className="text-[10px] font-mono text-slate-600">
                2-Identifier Verification: Confirmed
              </span>
            </div>
            <table className="w-full border border-slate-900 text-xs">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 font-bold text-slate-700 px-2.5 py-1.5 w-[18%] border-r border-slate-300 text-[11px]">
                    Patient Full Name
                  </td>
                  <td className="px-2.5 py-1.5 font-bold text-slate-900 w-[32%] border-r border-slate-900 text-xs">
                    {token.patientName}
                  </td>
                  <td className="bg-slate-100 font-bold text-slate-700 px-2.5 py-1.5 w-[18%] border-r border-slate-300 text-[11px]">
                    UHID / Hospital MRN
                  </td>
                  <td className="px-2.5 py-1.5 font-mono font-bold text-slate-900 w-[32%] text-xs">
                    {token.uhid}
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 font-bold text-slate-700 px-2.5 py-1.5 border-r border-slate-300 text-[11px]">
                    Age / Biological Sex
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-900 border-r border-slate-900 text-[11px]">
                    {token.age} Years &middot; {token.gender}
                  </td>
                  <td className="bg-slate-100 font-bold text-slate-700 px-2.5 py-1.5 border-r border-slate-300 text-[11px]">
                    ABHA Digital Health ID
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-900 text-[11px]">
                    {abhaId}
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 font-bold text-slate-700 px-2.5 py-1.5 border-r border-slate-300 text-[11px]">
                    Assigned OPD Station
                  </td>
                  <td className="px-2.5 py-1.5 font-bold text-sky-900 bg-sky-50/60 border-r border-slate-900 text-xs">
                    {token.counterName}
                  </td>
                  <td className="bg-slate-100 font-bold text-slate-700 px-2.5 py-1.5 border-r border-slate-300 text-[11px]">
                    Referring Consultant
                  </td>
                  <td className="px-2.5 py-1.5 font-semibold text-slate-900 text-[11px]">
                    {token.doctorName || 'Dr. Rajesh Sharma, MD (Internal Medicine)'}
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 font-bold text-slate-700 px-2.5 py-1.5 border-r border-slate-300 text-[11px]">
                    Token Issued Date/Time
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-900 border-r border-slate-900 text-[11px]">
                    {formattedDate} at {formattedTime}
                  </td>
                  <td className="bg-slate-100 font-bold text-slate-700 px-2.5 py-1.5 border-r border-slate-300 text-[11px]">
                    Dietary / Fasting State
                  </td>
                  <td className="px-2.5 py-1.5 font-mono font-bold text-slate-900 text-[11px]">
                    {effectiveFasting.replace(/_/g, ' ')}
                  </td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold text-slate-700 px-2.5 py-1.5 border-r border-slate-300 text-[11px]">
                    Baseline Triage Vitals
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-800 border-r border-slate-900 text-[11px]">
                    BP: {bpValue} &middot; HR: {pulseValue} &middot; SpO2: {spo2Value} &middot; Temp: {tempValue}
                  </td>
                  <td className="bg-slate-100 font-bold text-slate-700 px-2.5 py-1.5 border-r border-slate-300 text-[11px]">
                    Patient Mobile / Alert
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-900 text-[11px]">
                    {token.phone || '+91 98765-43210'} &middot; Clinical Risk: {token.riskLevel} ({token.riskScore}/100)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. MULTI-STAGE AMBULATORY OPD & LABORATORY ROUTING TRACKER */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-800">
                02. Multi-Stage Ambulatory Clinical &amp; Laboratory Routing Tracker
              </span>
              <span className="text-[10px] font-mono text-slate-600">
                Active Stage: {token.stage.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="grid grid-cols-5 border border-slate-900 divide-x divide-slate-300 bg-white">
              {ROUTING_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div
                    key={step.stage}
                    className={`p-2 flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-sky-50 border-b-2 border-b-sky-700'
                        : isCompleted
                        ? 'bg-slate-50/80'
                        : 'bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-mono font-bold text-slate-600">
                          {step.code}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold uppercase ${
                            isCurrent
                              ? 'text-sky-800'
                              : isCompleted
                              ? 'text-emerald-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {isCurrent ? '[ACTIVE]' : isCompleted ? '[DONE]' : '[QUEUE]'}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-900 mt-0.5 leading-snug">
                        {step.title}
                      </div>
                      <div className="text-[9px] text-slate-600 leading-tight">
                        {step.subtitle}
                      </div>
                    </div>
                    <div className="mt-1.5 pt-1 border-t border-slate-200 text-[9px] font-mono font-semibold text-slate-700">
                      Counter: {isCurrent ? token.counterName : step.defaultRoom}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. ORDERED DIAGNOSTIC INVESTIGATIONS & SPECIMEN COLLECTION MATRIX */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-800">
                03. Ordered Diagnostic Investigations, LOINC Codes &amp; Vacutainer Specimen Matrix
              </span>
              <span className="text-[10px] font-mono text-slate-600">
                Total Investigations Ordered: {diagnosticRows.length}
              </span>
            </div>
            <table className="w-full border border-slate-900 text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-left font-mono text-[10px] uppercase text-slate-800">
                  <th className="py-1.5 px-2 border-r border-slate-300 w-[6%] text-center">#</th>
                  <th className="py-1.5 px-2 border-r border-slate-300 w-[14%]">Test / LOINC</th>
                  <th className="py-1.5 px-2 border-r border-slate-300 w-[28%]">
                    Diagnostic Investigation Name
                  </th>
                  <th className="py-1.5 px-2 border-r border-slate-300 w-[16%]">Department</th>
                  <th className="py-1.5 px-2 border-r border-slate-300 w-[18%]">
                    Vacutainer / Specimen
                  </th>
                  <th className="py-1.5 px-2 border-r border-slate-300 w-[10%] text-right">
                    Vol / TAT
                  </th>
                  <th className="py-1.5 px-2 w-[8%] text-center">Drawn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {diagnosticRows.map((row) => (
                  <tr key={row.sno} className="bg-white">
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono font-bold text-slate-700">
                      {row.sno}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300 font-mono">
                      <div className="font-bold text-slate-900">{row.testCode}</div>
                      <div className="text-[9px] text-slate-500">LOINC: {row.loincCode}</div>
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300">
                      <div className="font-bold text-slate-900 leading-snug">{row.testName}</div>
                      <div className="text-[9px] text-slate-600 font-mono">
                        Prep: {row.prepInstruction}
                      </div>
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300 font-medium text-slate-800">
                      {row.department}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-xs border border-slate-700 shrink-0"
                          style={{ backgroundColor: row.tubeColorHex }}
                        />
                        <span>{row.vacutainerTube}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">{row.specimenType}</div>
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono">
                      <div className="font-bold text-slate-900">{row.volumeMl}</div>
                      <div className="text-[9px] text-slate-500">TAT: {row.tatEstimate}</div>
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono text-slate-700">
                      [ &nbsp; ]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. PRE-ANALYTICAL NABL CHECKLIST, 1D BARCODE & LIVE QUEUE QR CODE */}
          <div className="grid grid-cols-12 gap-3 pt-0.5">
            {/* Left 7 cols: Pre-Analytical NABL ISO 15189 Clause 7.2 Verification */}
            <div className="col-span-12 sm:col-span-7 border border-slate-900 p-2.5 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">
                  04. Pre-Analytical Phlebotomy &amp; NABL ISO 15189:2022 Verification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] text-slate-800">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState.identityVerified}
                      onChange={(e) =>
                        setChecklistState((s) => ({ ...s, identityVerified: e.target.checked }))
                      }
                      className="rounded border-slate-400"
                    />
                    <span>Patient 2-Identifier Check (Name + UHID)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState.barcodeAffixed}
                      onChange={(e) =>
                        setChecklistState((s) => ({ ...s, barcodeAffixed: e.target.checked }))
                      }
                      className="rounded border-slate-400"
                    />
                    <span>Primary Vacutainer Barcode Affixed</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState.fastingConfirmed}
                      onChange={(e) =>
                        setChecklistState((s) => ({ ...s, fastingConfirmed: e.target.checked }))
                      }
                      className="rounded border-slate-400"
                    />
                    <span>Dietary / Fasting Window Verified</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistState.specimenIntegrity}
                      onChange={(e) =>
                        setChecklistState((s) => ({ ...s, specimenIntegrity: e.target.checked }))
                      }
                      className="rounded border-slate-400"
                    />
                    <span>Specimen Quality Check (No Hemolysis)</span>
                  </label>
                </div>
              </div>

              {/* 1D Code-128 Style Accession Barcode */}
              <div className="mt-2.5 pt-2 border-t border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white px-2.5 py-1.5 border border-slate-200">
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase text-slate-500">
                    1D LIS SPECIMEN ACCESSION BARCODE
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    *{accessionNumber}*
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <svg
                    width="180"
                    height="30"
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
              </div>
            </div>

            {/* Right 5 cols: 2D Live Turn QR Code + Digital Queue Instructions */}
            <div className="col-span-12 sm:col-span-5 border border-slate-900 p-2.5 bg-white flex items-center gap-3">
              <div className="shrink-0 border border-slate-300 p-1.5 bg-white">
                {qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt="Live Queue Tracker QR Code"
                    className="w-24 h-24 object-contain"
                  />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center bg-slate-50 text-[10px] font-mono text-slate-400">
                    QR READY
                  </div>
                )}
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="font-mono font-bold uppercase text-sky-900">
                  LIVE MOBILE TURN TRACKER
                </div>
                <p className="text-slate-700 leading-snug">
                  Scan this 2D QR code with your smartphone camera to view live booth queue progress and estimated calling time.
                </p>
                <div className="font-mono text-[9px] text-slate-600 pt-0.5">
                  <div>Queue Token: <strong>{token.tokenNumber}</strong></div>
                  <div>Station: <strong>{token.counterName}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. AUTHORIZED HOSPITAL & LABORATORY SIGNATURES (3-COLUMN) */}
          <div className="grid grid-cols-3 border border-slate-900 divide-x divide-slate-900 text-[10px] bg-white">
            <div className="p-2 flex flex-col justify-between h-14">
              <span className="font-mono font-bold uppercase text-slate-600 text-[9px]">
                1. OPD Registration &amp; Triage Desk
              </span>
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-700 border-t border-dashed border-slate-300 pt-1">
                <span>Verified By: Reception Desk</span>
                <span>{formattedTime}</span>
              </div>
            </div>
            <div className="p-2 flex flex-col justify-between h-14">
              <span className="font-mono font-bold uppercase text-slate-600 text-[9px]">
                2. Phlebotomist / Sample Collector Sign
              </span>
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-dashed border-slate-300 pt-1">
                <span>Draw Time: ____:____</span>
                <span>Initials: ________</span>
              </div>
            </div>
            <div className="p-2 flex flex-col justify-between h-14">
              <span className="font-mono font-bold uppercase text-slate-600 text-[9px]">
                3. Patient / Attendant Consent Sign
              </span>
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-dashed border-slate-300 pt-1">
                <span>Venipuncture Consent</span>
                <span>Sign: ____________</span>
              </div>
            </div>
          </div>

          {/* 7. PERFORATED TEAR-OFF PATIENT HANDOVER TOKEN STUB */}
          <div className="pt-2">
            <div className="flex items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-2">
              <span className="border-t-2 border-dashed border-slate-400 flex-1" />
              <span>
                [SCISSORS] PERFORATED TEAR-OFF PATIENT HANDOVER TOKEN SLIP (WAITING HALL COPY)
              </span>
              <span className="border-t-2 border-dashed border-slate-400 flex-1" />
            </div>

            <div className="border-2 border-slate-900 rounded-lg p-3 bg-slate-50/50 grid grid-cols-12 gap-3 items-center">
              {/* Left 5 cols: Hospital & Patient Summary */}
              <div className="col-span-12 sm:col-span-5 border-b sm:border-b-0 sm:border-r border-slate-300 pb-2 sm:pb-0 sm:pr-3">
                <div className="text-[9px] font-mono font-bold uppercase text-sky-800">
                  LABCORE MEDICAL DIAGNOSTICS &amp; HOSPITAL
                </div>
                <div className="text-xs font-black text-slate-900 mt-0.5">
                  {token.patientName}
                </div>
                <div className="text-[10px] font-mono text-slate-700">
                  UHID: {token.uhid} &middot; {token.age}Y / {token.gender}
                </div>
                <div className="text-[9px] font-mono text-slate-600 mt-1 truncate">
                  Tests ({diagnosticRows.length}): {diagnosticRows.map((d) => d.testCode).join(', ')}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Please watch your token number on the waiting hall digital display screens.
                </div>
              </div>

              {/* Center 4 cols: Prominent Token & Station Routing */}
              <div className="col-span-8 sm:col-span-4 text-center px-2">
                <div className="text-[9px] font-mono font-bold uppercase text-slate-500">
                  YOUR OPD QUEUE TOKEN
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 tracking-tight my-0.5 bg-white border border-slate-900 rounded py-1">
                  {token.tokenNumber}
                </div>
                <div className="text-[10px] font-bold text-slate-900">
                  Proceed To: <span className="text-sky-800">{token.counterName}</span>
                </div>
                <div className="text-[9px] font-mono text-slate-600">
                  Priority: {token.priority} &middot; Issued: {formattedTime}
                </div>
              </div>

              {/* Right 3 cols: Mini QR Code on Tear-Off Stub */}
              <div className="col-span-4 sm:col-span-3 flex flex-col items-center justify-center border-l border-slate-300 pl-2">
                {qrDataUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt="Tear-Off Stub QR"
                    className="w-16 h-16 border border-slate-300 bg-white p-0.5"
                  />
                )}
                <span className="text-[8px] font-mono font-bold uppercase text-slate-600 mt-1 text-center">
                  Scan for Live Turn
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
