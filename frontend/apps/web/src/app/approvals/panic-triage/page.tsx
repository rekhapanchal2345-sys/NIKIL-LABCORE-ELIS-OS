'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  PhoneCall,
  AlertOctagon,
  FileCheck2,
  Lock,
  Unlock,
  MessageSquareShare,
  CheckCircle2,
  XCircle,
  Cpu,
} from 'lucide-react';

type FailTag =
  | 'DELTA_BREACH'
  | 'PANIC_VALUE'
  | 'QC_SUSPECT'
  | 'UNVERIFIED_INDEX'
  | 'MACHINE_FLAG'
  | 'OUT_OF_REF_RANGE';

interface Auto10ACandidateRow {
  id: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  ageSex: string;
  testCode: string;
  parameterName: string;
  value: string;
  unit: string;
  refRange: string;
  qcPassed8h: boolean;
  zeroMachineFlags: boolean;
  withinRefInterval: boolean;
  deltaCheckPassed: boolean;
  deltaPercent: number;
  serumIndicesClean: boolean;
  verdict: 'AUTO_APPROVED' | 'ROUTED_TO_PATHOLOGIST';
  failTags: FailTag[];
  nablPdfUrl: string | null;
}

interface PanicReadBackRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  testCode: string;
  parameterName: string;
  panicValue: string;
  unit: string;
  criticalLimitBreached: string;
  whatsappDispatched: boolean;
  smsPriorityDispatched: boolean;
  notifiedDoctorName: string;
  doctorPhone: string;
  callTimestamp: string | null;
  readBackConfirmed: boolean;
  clinicalActionRemarks: string;
  isResolved: boolean;
}

const INITIAL_AUTO10A_ROWS: Auto10ACandidateRow[] = [
  {
    id: 'av-1',
    orderId: 'ORD-8801',
    orderNumber: 'ORD-20261019-8801',
    patientName: 'Ananya Chatterjee',
    ageSex: '34F',
    testCode: 'TSH',
    parameterName: 'Thyroid Stimulating Hormone',
    value: '2.18',
    unit: 'µIU/mL',
    refRange: '0.45 - 4.50',
    qcPassed8h: true,
    zeroMachineFlags: true,
    withinRefInterval: true,
    deltaCheckPassed: true,
    deltaPercent: 4.2,
    serumIndicesClean: true,
    verdict: 'AUTO_APPROVED',
    failTags: [],
    nablPdfUrl: '/api/v1/reports/nabl-auto/ORD-8801.pdf',
  },
  {
    id: 'av-2',
    orderId: 'ORD-8802',
    orderNumber: 'ORD-20261019-8802',
    patientName: 'Devendra Fadnavis Kulkarni',
    ageSex: '62M',
    testCode: 'K',
    parameterName: 'Serum Potassium (K+)',
    value: '6.9',
    unit: 'mmol/L',
    refRange: '3.5 - 5.1',
    qcPassed8h: true,
    zeroMachineFlags: true,
    withinRefInterval: false,
    deltaCheckPassed: false,
    deltaPercent: 38.0,
    serumIndicesClean: true,
    verdict: 'ROUTED_TO_PATHOLOGIST',
    failTags: ['PANIC_VALUE', 'DELTA_BREACH', 'OUT_OF_REF_RANGE'],
    nablPdfUrl: null,
  },
  {
    id: 'av-3',
    orderId: 'ORD-8803',
    orderNumber: 'ORD-20261019-8803',
    patientName: 'Sureshappa Patil',
    ageSex: '51M',
    testCode: 'PLT',
    parameterName: 'Platelet Count',
    value: '14000',
    unit: '/µL',
    refRange: '150,000 - 450,000',
    qcPassed8h: true,
    zeroMachineFlags: false,
    withinRefInterval: false,
    deltaCheckPassed: false,
    deltaPercent: 52.4,
    serumIndicesClean: true,
    verdict: 'ROUTED_TO_PATHOLOGIST',
    failTags: ['PANIC_VALUE', 'DELTA_BREACH', 'MACHINE_FLAG'],
    nablPdfUrl: null,
  },
];

const INITIAL_PANIC_LEDGER: PanicReadBackRecord[] = [
  {
    id: 'panic-201',
    orderId: 'ORD-8802',
    orderNumber: 'ORD-20261019-8802',
    patientName: 'Devendra Fadnavis Kulkarni (62M)',
    testCode: 'K',
    parameterName: 'Serum Potassium (K+)',
    panicValue: '6.9',
    unit: 'mmol/L',
    criticalLimitBreached: 'Potassium > 6.5 mmol/L (Life-Threatening Hyperkalemia)',
    whatsappDispatched: true,
    smsPriorityDispatched: true,
    notifiedDoctorName: '',
    doctorPhone: '',
    callTimestamp: null,
    readBackConfirmed: false,
    clinicalActionRemarks: '',
    isResolved: false,
  },
  {
    id: 'panic-202',
    orderId: 'ORD-8803',
    orderNumber: 'ORD-20261019-8803',
    patientName: 'Sureshappa Patil (51M)',
    testCode: 'PLT',
    parameterName: 'Platelet Count',
    panicValue: '14,000',
    unit: '/µL',
    criticalLimitBreached: 'Platelets < 20,000 /µL (Spontaneous Hemorrhage Risk)',
    whatsappDispatched: true,
    smsPriorityDispatched: true,
    notifiedDoctorName: 'Dr. Siddharth Mehta (Hematology)',
    doctorPhone: '+91-9825011223',
    callTimestamp: '2026-10-19T15:42:10Z',
    readBackConfirmed: true,
    clinicalActionRemarks:
      'Read-back verified verbatim by Dr. Siddharth Mehta. Single-donor platelet apheresis ordered immediately.',
    isResolved: true,
  },
];

export default function PathologistPanicAndAuto10ADeskPage() {
  const [autoRows] = useState<Auto10ACandidateRow[]>(INITIAL_AUTO10A_ROWS);
  const [panicLedger, setPanicLedger] = useState<PanicReadBackRecord[]>(INITIAL_PANIC_LEDGER);
  const [selectedPanicId, setSelectedPanicId] = useState<string>('panic-201');

  const [doctorNameInput, setDoctorNameInput] = useState('Dr. Arvind Swaminathan (Nephrology ICU)');
  const [doctorPhoneInput, setDoctorPhoneInput] = useState('+91-9898044556');
  const [readBackChecked, setReadBackChecked] = useState(false);
  const [remarksInput, setRemarksInput] = useState(
    'Spoke directly to Dr. Swaminathan. Verbatim read-back of K+ = 6.9 mmol/L confirmed. IV Calcium Gluconate + Insulin-Dextrose infusion initiated.'
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedPanic = panicLedger.find((p) => p.id === selectedPanicId) || panicLedger[0];

  const handleFileReadBack = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!readBackChecked) {
      setStatusMessage(
        'NABL ISO 15189 Clause 7.4.2 Error: You must confirm verbatim telephonic Read-Back by checking the box before unlocking report dispatch.'
      );
      return;
    }

    setPanicLedger((prev) =>
      prev.map((item) =>
        item.id === selectedPanic.id
          ? {
              ...item,
              notifiedDoctorName: doctorNameInput,
              doctorPhone: doctorPhoneInput,
              callTimestamp: new Date().toISOString(),
              readBackConfirmed: true,
              clinicalActionRemarks: remarksInput,
              isResolved: true,
            }
          : item
      )
    );

    setStatusMessage(
      `Telephonic Read-Back Ledger filed for ${selectedPanic.orderNumber}. Report Dispatch Lock lifted.`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            CLSI AUTO10-A Autoverification &middot; NABL ISO 15189:2022 Clause 7.4.2
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Pathologist Autoverification &amp; Critical Panic Read-Back Audit Ledger
          </h1>
        </div>
      </div>

      {/* SECTION 1: CLSI AUTO10-A 5-GATE PIPELINE MATRIX */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          1. CLSI AUTO10-A 5-Gate Real-Time Evaluation Stream
        </h2>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase">
                <th className="p-3.5">Order / Patient</th>
                <th className="p-3.5">Biomarker &amp; Result</th>
                <th className="p-3.5 text-center">1. 8h Shift QC</th>
                <th className="p-3.5 text-center">2. Machine Flags</th>
                <th className="p-3.5 text-center">3. Bio Ref Range</th>
                <th className="p-3.5 text-center">4. 72h Delta (&lt;10%)</th>
                <th className="p-3.5 text-center">5. HIL Indices</th>
                <th className="p-3.5">Verdict &amp; Fail Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {autoRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40">
                  <td className="p-3.5">
                    <div className="font-mono font-bold text-white">{row.orderNumber}</div>
                    <div className="text-slate-400">
                      {row.patientName} ({row.ageSex})
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-white">
                      {row.parameterName}:{' '}
                      <span className="text-amber-300 font-mono">
                        {row.value} {row.unit}
                      </span>
                    </div>
                    <div className="text-slate-400">Ref: {row.refRange}</div>
                  </td>
                  <td className="p-3.5 text-center">
                    {row.qcPassed8h ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 inline" />
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.zeroMachineFlags ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 inline" />
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.withinRefInterval ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 inline" />
                    )}
                  </td>
                  <td className="p-3.5 text-center font-mono">
                    <span className={row.deltaCheckPassed ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                      {row.deltaPercent}%
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    {row.serumIndicesClean ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 inline" />
                    )}
                  </td>
                  <td className="p-3.5">
                    {row.verdict === 'AUTO_APPROVED' ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          AUTO_APPROVED (NABL PDF Ready)
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {row.failTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40 font-bold text-[11px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: CRITICAL PANIC ALERT & TELEPHONIC READ-BACK LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" />
            2. Life-Threatening Panic Alerts &amp; Report Dispatch Lock Status
          </h2>

          {panicLedger.map((item) => {
            const isSelected = item.id === selectedPanic.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedPanicId(item.id)}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  isSelected
                    ? 'bg-slate-900 border-rose-500'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-300">
                        {item.orderNumber}
                      </span>
                      <span className="text-sm font-bold text-white">{item.patientName}</span>
                    </div>
                    <div className="text-base font-extrabold text-red-400 mt-1">
                      {item.parameterName}: {item.panicValue} {item.unit}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Threshold Breached: {item.criticalLimitBreached}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40 flex items-center gap-1">
                        <MessageSquareShare className="w-3 h-3" />
                        WhatsApp Cloud Push Sent
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600/40">
                        Priority SMS Dispatched
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {item.isResolved && item.readBackConfirmed ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                        <Unlock className="w-3.5 h-3.5" />
                        READ-BACK FILED (DISPATCH UNLOCKED)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-500 text-xs font-bold animate-pulse">
                        <Lock className="w-3.5 h-3.5" />
                        DISPATCH LOCKED (AWAITING CALL)
                      </span>
                    )}
                  </div>
                </div>

                {item.isResolved && (
                  <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-1">
                    <div>
                      Notified Physician: <strong>{item.notifiedDoctorName}</strong> ({item.doctorPhone})
                    </div>
                    <div className="text-emerald-300">
                      Remarks: &ldquo;{item.clinicalActionRemarks}&rdquo;
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Telephonic Read-Back Entry Form */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleFileReadBack}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-rose-400" />
              Mandatory Telephonic Read-Back Log (ISO 15189 7.4.2)
            </h3>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
              <div className="text-slate-400">
                Active Order: <strong className="text-white">{selectedPanic.orderNumber}</strong>
              </div>
              <div className="text-rose-300 font-bold">
                Panic Result: {selectedPanic.parameterName} = {selectedPanic.panicValue}{' '}
                {selectedPanic.unit}
              </div>
            </div>

            {statusMessage && (
              <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/50 text-xs text-cyan-200">
                {statusMessage}
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Notified Ordering Doctor / ICU Intensivist Name
              </label>
              <input
                type="text"
                required
                value={doctorNameInput}
                onChange={(e) => setDoctorNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Doctor Direct Phone Number</label>
              <input
                type="text"
                required
                value={doctorPhoneInput}
                onChange={(e) => setDoctorPhoneInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Clinical Action &amp; Verbatim Read-Back Notes
              </label>
              <textarea
                rows={3}
                required
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <label className="flex items-start gap-2.5 text-xs text-amber-200 bg-amber-950/40 border border-amber-500/40 p-3 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={readBackChecked}
                onChange={(e) => setReadBackChecked(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I certify under NABL ISO 15189:2022 Clause 7.4.2 that the notified physician repeated back the patient identity, parameter, and critical value verbatim.
              </span>
            </label>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-lg text-xs transition"
            >
              File Telephonic Read-Back &amp; Unlock Final Report Dispatch
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
