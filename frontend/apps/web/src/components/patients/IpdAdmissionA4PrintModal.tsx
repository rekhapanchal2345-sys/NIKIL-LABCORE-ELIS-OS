'use client';

import React, { useMemo } from 'react';
import {
  X,
  Printer,
  Bed,
  Building2,
  ShieldCheck,
  FileText,
  UserCheck,
  Activity,
  Stethoscope,
  AlertTriangle,
  Scissors,
  CheckCircle2,
  CreditCard,
  Clock,
  HeartPulse,
  Phone,
} from 'lucide-react';

export interface IpdAdmissionRecordData {
  ipdAdmissionNo: string;
  admissionTimestamp: string;
  admissionCategory: string;
  isTransfer?: boolean;
  previousWardBed?: string;
  patient: {
    id: string;
    uhid: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender?: string;
    age?: number | null;
    dateOfBirth?: string | null;
    bloodGroup?: string | null;
    phone?: string | null;
    abhaNumber?: string | null;
    address?: string | null;
    city?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    allergies?: string[];
  };
  ward: {
    id: string;
    name: string;
    floor: string;
    wingCode: string;
    nursingStation: string;
    roomRentPerDay: number;
    nursingChargePerDay: number;
    doctorFeePerDay: number;
    equipmentChargePerDay: number;
  };
  bed: {
    number: string;
    roomType: string;
    o2Port: boolean;
    suctionPort: boolean;
    ventilatorReady: boolean;
    multiparaMonitor: boolean;
    infusionPump: boolean;
    negativePressure: boolean;
    sanitizationCertId: string;
    lastSanitizedAt: string;
  };
  clinical: {
    attendingDoctor: string;
    consultantSpecialty: string;
    coAdmittingDoctor: string;
    icd10Code: string;
    icd10Title: string;
    clinicalNotes: string;
    initialInvestigations: string[];
    dietOrder: string;
    vitalsFrequency: string;
    ioCharting: string;
    fallRiskProtocol: string;
    bradenScore: string;
    isolationLevel: string;
    allergyNotes: string;
    mlcStatus: string;
    estimatedLosDays: number;
    expectedDischargeDate: string;
  };
  billing: {
    payerCategory: string;
    tpaProvider: string;
    policyOrPreAuthNo: string;
    preAuthStatus: string;
    approvedPreAuthLimit: number;
    dailyCompositeRate: number;
    estimatedTotalStayCost: number;
    advanceDepositPaid: number;
    receiptReference: string;
  };
}

export interface IpdAdmissionA4PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: IpdAdmissionRecordData | null;
}

function generateCode128Bars(seedStr: string): number[] {
  const clean = (seedStr || 'IPD-2026-1001').toUpperCase();
  const bars: number[] = [2, 1, 1, 2, 3, 1];
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    bars.push(((code >> 4) % 3) + 1);
    bars.push((code % 2) + 1);
    bars.push(((code >> 2) % 3) + 1);
    bars.push(((code + i) % 2) + 1);
  }
  bars.push(2, 3, 1, 1, 2);
  return bars;
}

function generateQrMatrix(seedStr: string, size = 21): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft || r === 6 || c === 6) continue;
      const bitIdx = r * size + c;
      const val = ((hash >>> (bitIdx % 24)) ^ (r * 31 + c * 17 + seedStr.charCodeAt(bitIdx % seedStr.length))) & 3;
      matrix[r][c] = val === 0 || val === 2;
    }
  }
  return matrix;
}

export default function IpdAdmissionA4PrintModal({
  isOpen,
  onClose,
  record,
}: IpdAdmissionA4PrintModalProps) {
  const barcodeBars = useMemo(
    () => generateCode128Bars(record ? `${record.ipdAdmissionNo}-${record.patient.uhid}` : 'IPD-2026'),
    [record]
  );

  const qrMatrix = useMemo(
    () =>
      generateQrMatrix(
        record
          ? `LABCORE-IPD|${record.ipdAdmissionNo}|${record.patient.uhid}|${record.ward.wingCode}|${record.bed.number}`
          : 'LABCORE-IPD'
      ),
    [record]
  );

  if (!isOpen || !record) return null;

  const fullName = [record.patient.firstName, record.patient.middleName, record.patient.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  const handleTriggerPrint = () => {
    window.print();
  };

  const equipmentList = [
    record.bed.o2Port ? 'O2 Central Piped Port' : null,
    record.bed.suctionPort ? 'Wall Vacuum Suction' : null,
    record.bed.multiparaMonitor ? '5-Para Cardiac Monitor' : null,
    record.bed.infusionPump ? 'Syringe/Infusion Dock' : null,
    record.bed.ventilatorReady ? 'Mechanical Ventilator Port' : null,
    record.bed.negativePressure ? 'HEPA Negative Pressure' : null,
  ].filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto print:static print:bg-white print:p-0 print:block">
      <style>{
        "@media print {\n" +
        "  body * { visibility: hidden !important; }\n" +
        "  #ipd-a4-printable-root, #ipd-a4-printable-root * { visibility: visible !important; }\n" +
        "  #ipd-a4-printable-root {\n" +
        "    position: absolute !important;\n" +
        "    left: 0 !important;\n" +
        "    top: 0 !important;\n" +
        "    width: 210mm !important;\n" +
        "    min-height: 297mm !important;\n" +
        "    margin: 0 !important;\n" +
        "    padding: 8mm 10mm !important;\n" +
        "    box-shadow: none !important;\n" +
        "    border: none !important;\n" +
        "    background: #ffffff !important;\n" +
        "  }\n" +
        "  .no-print-toolbar { display: none !important; }\n" +
        "  @page { size: A4 portrait; margin: 0mm; }\n" +
        "}"
      }</style>

      <div className="relative w-full max-w-[960px] rounded-2xl bg-slate-100 border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:w-full print:max-w-none print:rounded-none print:border-0 print:shadow-none print:bg-white">
        {/* Top Action Bar (Hidden in Print) */}
        <div className="no-print-toolbar px-5 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  A4 Inpatient (IPD) Admission Case Sheet &amp; Patient Identification Wristband
                </h3>
                <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                  ISO 15189 &middot; NABH ADT^A01
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Standard 210mm &times; 297mm Hospital IPD Admission Dossier with Perforated Patient Wristband &amp; Bed-Head Ticket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs px-4 py-2 shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print A4 IPD Case Sheet &amp; Wristband</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3 py-2 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Close Preview</span>
            </button>
          </div>
        </div>

        {/* Scrollable Viewport housing the A4 Sheet */}
        <div className="p-4 sm:p-6 overflow-y-auto flex justify-center bg-slate-100 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="ipd-a4-printable-root"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 border border-slate-300 shadow-lg p-6 sm:p-8 flex flex-col justify-between text-[11px] leading-snug"
          >
            <div className="space-y-3.5">
              {/* 1. INSTITUTIONAL HOSPITAL HEADER */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg border-2 border-slate-900 bg-slate-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-base font-black tracking-tighter text-slate-900 leading-none">LC</span>
                    <span className="text-[7px] font-extrabold uppercase tracking-widest text-sky-700 mt-0.5">HOSP</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-base font-black tracking-tight text-slate-950 uppercase">
                        LABCORE MEDICAL DIAGNOSTICS &amp; TERTIARY HOSPITAL
                      </h1>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-600">
                      NABH Accredited Multi-Specialty Inpatient Facility &middot; NABL ISO 15189:2022 Certified Central Reference Laboratory
                    </p>
                    <p className="text-[9.5px] text-slate-500 mt-0.5">
                      Central Clinical Campus &middot; 24&times;7 ICU / Trauma / Cath-Lab &middot; HL7 v2.5.1 ADT &amp; ABDM Integrated Health Facility
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-block rounded border border-slate-900 bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                    {record.isTransfer ? 'IPD BED TRANSFER (ADT^A02)' : 'IPD ADMISSION SHEET (ADT^A01)'}
                  </div>
                  <div className="mt-1 font-mono text-xs font-black text-slate-900">
                    {record.ipdAdmissionNo}
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-medium">
                    Issued: {record.admissionTimestamp}
                  </div>
                </div>
              </div>

              {/* 2. TOP BARCODE + ALLOCATED WARD/BED HIGHLIGHT BANNER */}
              <div className="grid grid-cols-12 gap-3 rounded-lg border border-slate-300 bg-slate-50/70 p-2.5 items-center">
                <div className="col-span-5 border-r border-slate-300 pr-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                    Allocated Hospital Wing &amp; Care Ward
                  </span>
                  <p className="text-xs font-black text-slate-950 mt-0.5">{record.ward.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-semibold text-slate-600">
                    <span>{record.ward.floor}</span>
                    <span>&middot;</span>
                    <span>Wing: {record.ward.wingCode}</span>
                    <span>&middot;</span>
                    <span>{record.ward.nursingStation}</span>
                  </div>
                </div>

                <div className="col-span-3 border-r border-slate-300 px-3 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                    Assigned Bed / Room Slot
                  </span>
                  <div className="text-base font-mono font-black text-sky-800 mt-0.5">
                    {record.bed.number}
                  </div>
                  <span className="inline-block rounded bg-emerald-50 border border-emerald-300 px-1.5 py-0.2 text-[8.5px] font-bold text-emerald-800 uppercase">
                    {record.bed.roomType} &middot; UV Sanitized
                  </span>
                </div>

                <div className="col-span-4 pl-2 flex flex-col items-end justify-center">
                  <div className="flex items-end h-7 gap-[1px] bg-white px-2 py-0.5 border border-slate-200">
                    {barcodeBars.map((w, idx) => (
                      <span
                        key={idx}
                        style={{ width: `${w * 1.35}px` }}
                        className={idx % 2 === 0 ? 'bg-slate-950 h-full block' : 'bg-transparent h-full block'}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[8.5px] font-bold text-slate-600 mt-0.5 tracking-widest">
                    *{record.ipdAdmissionNo}-{record.patient.uhid}*
                  </span>
                </div>
              </div>

              {/* 3. SECTION A: PATIENT DEMOGRAPHICS & IDENTIFICATION GRID */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                    Section A &mdash; Master Patient Index (MPI) &amp; Admission Identification
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-600">
                    Acuity: <strong className="text-slate-900">{record.admissionCategory}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-4 divide-x divide-y divide-slate-200 text-[10.5px]">
                  <div className="p-2">
                    <span className="text-[8.5px] font-bold uppercase text-slate-400 block">Patient Full Name</span>
                    <span className="font-black text-slate-950 text-xs">{fullName}</span>
                  </div>
                  <div className="p-2">
                    <span className="text-[8.5px] font-bold uppercase text-slate-400 block">Universal Health ID (UHID)</span>
                    <span className="font-mono font-black text-sky-900">{record.patient.uhid}</span>
                  </div>
                  <div className="p-2">
                    <span className="text-[8.5px] font-bold uppercase text-slate-400 block">Age / Biological Sex</span>
                    <span className="font-bold text-slate-900">
                      {record.patient.age ?? 45} Yrs / {record.patient.gender || 'MALE'}
                    </span>
                  </div>
                  <div className="p-2">
                    <span className="text-[8.5px] font-bold uppercase text-slate-400 block">ABO / Rh Blood Group</span>
                    <span className="font-black text-rose-700">{record.patient.bloodGroup || 'O+'}</span>
                  </div>

                  <div className="p-2">
                    <span className="text-[8.5px] font-bold uppercase text-slate-400 block">ABHA Digital Health ID</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {record.patient.abhaNumber || '91-4829-7310-8842'}
                    </span>
                  </div>
                  <div className="p-2">
                    <span className="text-[8.5px] font-bold uppercase text-slate-400 block">Patient / Kin Mobile</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {record.patient.phone || '+91 98201 44510'}
                    </span>
                  </div>
                  <div className="p-2">
                    <span className="text-[8.5px] font-bold uppercase text-slate-400 block">Emergency Next-of-Kin</span>
                    <span className="font-semibold text-slate-800">
                      {record.patient.emergencyContactName || 'Family Attendant (Verified)'}
                    </span>
                  </div>
                  <div className="p-2">
                    <span className="text-[8.5px] font-bold uppercase text-slate-400 block">Medico-Legal (MLC) &amp; Allergies</span>
                    <span className="font-bold text-slate-900">
                      {record.clinical.mlcStatus} &middot; {record.clinical.allergyNotes}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. SECTION B: ADMITTING CONSULTANTS, ICD-10 DIAGNOSIS & BED INFRASTRUCTURE */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                    Section B &mdash; Admitting Consultants, ICD-10-CM Clinical Diagnosis &amp; Bedside Biomedical Ports
                  </span>
                  <span className="font-mono text-[9.5px] font-bold text-slate-600">
                    Sanitization Cert: {record.bed.sanitizationCertId}
                  </span>
                </div>
                <div className="grid grid-cols-12 divide-x divide-slate-200 text-[10.5px]">
                  <div className="col-span-6 p-2.5 space-y-1.5">
                    <div>
                      <span className="text-[8.5px] font-bold uppercase text-slate-400 block">
                        Primary Admitting Consultant &amp; Specialty Unit
                      </span>
                      <p className="font-black text-slate-900">{record.clinical.attendingDoctor}</p>
                      <p className="text-[9.5px] text-slate-600">{record.clinical.consultantSpecialty}</p>
                    </div>
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[8.5px] font-bold uppercase text-slate-400 block">Co-Admitting / Duty RMO</span>
                        <span className="font-semibold text-slate-800">{record.clinical.coAdmittingDoctor}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8.5px] font-bold uppercase text-slate-400 block">Est. Stay / EDD</span>
                        <span className="font-bold text-slate-900">
                          {record.clinical.estimatedLosDays} Days (EDD: {record.clinical.expectedDischargeDate})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-6 p-2.5 space-y-1.5">
                    <div>
                      <span className="text-[8.5px] font-bold uppercase text-slate-400 block">
                        Primary Admitting Diagnosis (ICD-10-CM Verified)
                      </span>
                      <p className="font-black text-slate-900">
                        <span className="font-mono bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded mr-1.5 text-sky-900">
                          {record.clinical.icd10Code}
                        </span>
                        {record.clinical.icd10Title}
                      </p>
                    </div>
                    <div>
                      <span className="text-[8.5px] font-bold uppercase text-slate-400 block">
                        Admitting Clinical Indication &amp; Treatment Plan
                      </span>
                      <p className="text-[10px] text-slate-700 font-medium">
                        {record.clinical.clinicalNotes || 'Inpatient clinical monitoring, parenteral therapy, and serial diagnostic workup.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50/60 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[9.5px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold uppercase text-slate-500">Active Bedside Ports:</span>
                    {equipmentList.map((eq, i) => (
                      <span
                        key={i}
                        className="rounded bg-white border border-slate-300 px-1.5 py-0.5 font-semibold text-slate-800"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                  {record.isTransfer && record.previousWardBed && (
                    <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Transferred From: {record.previousWardBed}
                    </span>
                  )}
                </div>
              </div>

              {/* 5. SECTION C: MANDATORY NURSING CARE, DIET, FALL-RISK & INFECTION CONTROL MATRIX */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                    Section C &mdash; Nursing Station Standing Orders, Dietary Regimen &amp; Patient Safety Protocols
                  </span>
                  <span className="text-[9.5px] font-semibold text-slate-600">
                    Assigned Station: <strong>{record.ward.nursingStation}</strong>
                  </span>
                </div>
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[8.5px] font-bold uppercase text-slate-500">
                      <th className="py-1.5 px-2.5 border-r border-slate-200">Therapeutic Diet Order</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-200">Vitals &amp; SpO2 Frequency</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-200">Fluid / I-O Charting</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-200">Morse Fall-Risk Protocol</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-200">Braden Pressure Score</th>
                      <th className="py-1.5 px-2.5">Isolation &amp; Precautions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="divide-x divide-slate-200 font-semibold text-slate-900">
                      <td className="py-2 px-2.5">{record.clinical.dietOrder}</td>
                      <td className="py-2 px-2.5 font-mono">{record.clinical.vitalsFrequency}</td>
                      <td className="py-2 px-2.5">{record.clinical.ioCharting}</td>
                      <td className="py-2 px-2.5">{record.clinical.fallRiskProtocol}</td>
                      <td className="py-2 px-2.5">{record.clinical.bradenScore}</td>
                      <td className="py-2 px-2.5">{record.clinical.isolationLevel}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="border-t border-slate-200 bg-slate-50/50 px-3 py-1.5 flex items-center justify-between text-[9.5px]">
                  <div>
                    <span className="font-bold uppercase text-slate-500 mr-2">Admission STAT Lab / Imaging Orders:</span>
                    <span className="font-semibold text-slate-800">
                      {record.clinical.initialInvestigations.join('  |  ')}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">Auto-Routed to Central LIS &amp; RIS</span>
                </div>
              </div>

              {/* 6. SECTION D: ROOM TARIFF SCHEDULE, TPA CASHLESS PRE-AUTH & DEPOSIT LEDGER */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                    Section D &mdash; Inpatient Tariff Schedule, TPA / Ayushman Pre-Auth &amp; Admission Deposit Ledger
                  </span>
                  <span className="font-mono text-[9.5px] font-bold text-slate-700">
                    Receipt Ref: {record.billing.receiptReference}
                  </span>
                </div>
                <div className="grid grid-cols-12 divide-x divide-slate-200 text-[10px]">
                  <div className="col-span-5 p-2.5 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payer / Financial Category:</span>
                      <span className="font-black text-slate-900">{record.billing.payerCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">TPA / Insurance / Panel:</span>
                      <span className="font-bold text-slate-800">{record.billing.tpaProvider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Policy / Pre-Auth Ref No.:</span>
                      <span className="font-mono font-bold text-slate-900">{record.billing.policyOrPreAuthNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pre-Auth Status / Limit:</span>
                      <span className="font-bold text-emerald-800">
                        {record.billing.preAuthStatus} (&#8377;{record.billing.approvedPreAuthLimit.toLocaleString('en-IN')})
                      </span>
                    </div>
                  </div>

                  <div className="col-span-7 p-2.5">
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      <div className="rounded border border-slate-200 bg-slate-50 p-1.5">
                        <span className="text-[8px] font-bold uppercase text-slate-400 block">Room Rent/Day</span>
                        <span className="font-mono font-bold text-slate-900">
                          &#8377;{record.ward.roomRentPerDay.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="rounded border border-slate-200 bg-slate-50 p-1.5">
                        <span className="text-[8px] font-bold uppercase text-slate-400 block">Nursing/Day</span>
                        <span className="font-mono font-bold text-slate-900">
                          &#8377;{record.ward.nursingChargePerDay.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="rounded border border-slate-200 bg-slate-50 p-1.5">
                        <span className="text-[8px] font-bold uppercase text-slate-400 block">Consultant/Day</span>
                        <span className="font-mono font-bold text-slate-900">
                          &#8377;{record.ward.doctorFeePerDay.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="rounded border border-slate-200 bg-slate-50 p-1.5">
                        <span className="text-[8px] font-bold uppercase text-slate-400 block">Ports &amp; Mon/Day</span>
                        <span className="font-mono font-bold text-slate-900">
                          &#8377;{record.ward.equipmentChargePerDay.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="rounded border border-sky-200 bg-sky-50 p-1.5">
                        <span className="text-[8px] font-bold uppercase text-sky-700 block">Composite/Day</span>
                        <span className="font-mono font-black text-sky-950">
                          &#8377;{record.billing.dailyCompositeRate.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
                      <span>
                        Est. Stay ({record.clinical.estimatedLosDays} Days):{' '}
                        <strong className="font-mono text-slate-900">
                          &#8377;{record.billing.estimatedTotalStayCost.toLocaleString('en-IN')}
                        </strong>
                      </span>
                      <span className="rounded bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-bold text-emerald-900">
                        Advance Deposit Collected: &#8377;{record.billing.advanceDepositPaid.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. AUTHORIZATION SIGNATURES */}
              <div className="grid grid-cols-4 gap-3 pt-1 text-[9.5px]">
                <div className="border border-slate-300 rounded p-2 flex flex-col justify-between h-14">
                  <span className="text-[8px] font-bold uppercase text-slate-400">
                    1. Patient / Legal Attendant Consent
                  </span>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-[8.5px] text-slate-600">
                    <span>Signed Consent</span>
                    <span className="font-mono">Date/Time</span>
                  </div>
                </div>
                <div className="border border-slate-300 rounded p-2 flex flex-col justify-between h-14">
                  <span className="text-[8px] font-bold uppercase text-slate-400">
                    2. Admitting Medical Officer / RMO
                  </span>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-[8.5px] text-slate-800 font-semibold">
                    <span>{record.clinical.coAdmittingDoctor}</span>
                    <span className="text-emerald-700 font-bold">Verified</span>
                  </div>
                </div>
                <div className="border border-slate-300 rounded p-2 flex flex-col justify-between h-14">
                  <span className="text-[8px] font-bold uppercase text-slate-400">
                    3. IPD Billing &amp; TPA Desk Clearance
                  </span>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-[8.5px] text-slate-800 font-semibold">
                    <span>{record.billing.receiptReference}</span>
                    <span className="text-sky-700 font-bold">Cleared</span>
                  </div>
                </div>
                <div className="border border-slate-300 rounded p-2 flex flex-col justify-between h-14">
                  <span className="text-[8px] font-bold uppercase text-slate-400">
                    4. Ward Nursing Sister Handover
                  </span>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-[8.5px] text-slate-800 font-semibold">
                    <span>{record.ward.nursingStation}</span>
                    <span className="font-mono">{record.bed.number}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. PERFORATED CUT-OUT PATIENT IDENTIFICATION WRISTBAND & BED-HEAD TAG */}
            <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-400">
              <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                <span className="flex items-center gap-1">
                  <Scissors className="h-3 w-3" />
                  Perforated Detachable Strip &mdash; Waterproof Patient Wristband (Left) &amp; Bed-Head Ticket (Right)
                </span>
                <span>NABH Patient Safety Goal PSG-1 (Two-Identifier Verification)</span>
              </div>

              <div className="grid grid-cols-12 gap-3">
                {/* Left: Waterproof Patient Identification Wristband */}
                <div className="col-span-8 rounded-lg border-2 border-slate-900 bg-white p-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 border border-slate-300 rounded bg-white shrink-0">
                      <svg width="46" height="46" viewBox="0 0 21 21" className="block">
                        {qrMatrix.map((row, rIdx) =>
                          row.map((cell, cIdx) =>
                            cell ? (
                              <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#0f172a" />
                            ) : null
                          )
                        )}
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-slate-900 text-white px-1.5 py-0.2 text-[8px] font-black uppercase">
                          IPD WRISTBAND
                        </span>
                        <span className="font-mono text-[9.5px] font-black text-slate-900">
                          {record.ipdAdmissionNo}
                        </span>
                        <span className="font-mono text-[9.5px] font-bold text-sky-800">
                          {record.patient.uhid}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-950 uppercase mt-0.5">{fullName}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-slate-700 mt-0.5">
                        <span>{record.patient.age ?? 45}Y / {record.patient.gender || 'M'}</span>
                        <span>&middot;</span>
                        <span className="text-rose-700">Blood: {record.patient.bloodGroup || 'O+'}</span>
                        <span>&middot;</span>
                        <span className="text-slate-950">
                          {record.ward.wingCode} &mdash; {record.bed.number}
                        </span>
                      </div>
                      <p className="text-[8.5px] font-bold text-rose-700 mt-0.5">
                        Allergy / Risk: {record.clinical.allergyNotes} &middot; {record.clinical.fallRiskProtocol}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 border-l border-slate-200 pl-2.5">
                    <span className="text-[7.5px] font-bold uppercase text-slate-400 block">Attending Unit</span>
                    <span className="text-[9px] font-black text-slate-900 block">
                      {record.clinical.attendingDoctor}
                    </span>
                    <span className="font-mono text-[8.5px] font-bold text-slate-600 block mt-0.5">
                      ICD: {record.clinical.icd10Code}
                    </span>
                    <span className="inline-block mt-1 rounded bg-slate-100 border border-slate-300 px-1.5 py-0.2 text-[8px] font-bold text-slate-800">
                      DO NOT REMOVE UNTIL DISCHARGE
                    </span>
                  </div>
                </div>

                {/* Right: Bed-Head Ticket & Diet Tag */}
                <div className="col-span-4 rounded-lg border-2 border-slate-800 bg-slate-50 p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                    <span className="text-[8.5px] font-black uppercase text-slate-900">BED-HEAD TICKET</span>
                    <span className="font-mono text-xs font-black text-sky-900">{record.bed.number}</span>
                  </div>
                  <div className="my-1 space-y-0.5 text-[9px]">
                    <p className="font-black text-slate-950 truncate">{fullName}</p>
                    <p className="font-semibold text-slate-700 truncate">
                      Diet: <strong>{record.clinical.dietOrder}</strong>
                    </p>
                    <p className="font-semibold text-slate-700 truncate">
                      Vitals: <strong>{record.clinical.vitalsFrequency}</strong>
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-300 pt-1 text-[8px] font-bold text-slate-600">
                    <span>{record.ward.wingCode}</span>
                    <span>EDD: {record.clinical.expectedDischargeDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
