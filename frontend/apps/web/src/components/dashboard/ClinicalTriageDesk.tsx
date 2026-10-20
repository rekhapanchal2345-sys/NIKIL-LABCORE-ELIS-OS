'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertOctagon,
  PhoneCall,
  CheckCircle2,
  FileCheck2,
  Clock,
  Flame,
  TrendingUp,
  UserCheck,
  X,
  Building2,
  ShieldAlert,
} from 'lucide-react';

export type PanicFlagLevel = 'CRITICAL_HIGH' | 'CRITICAL_LOW' | 'DELTA_FAIL';
export type SlaTimerStatus = 'URGENT_30M' | 'WARNING_60M' | 'BREACHED';

export interface CriticalTriageItem {
  id: string;
  sampleBarcode: string;
  orderId: string;
  patientName: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  uhid: string;
  wardAndBed: string;
  referringDoctor: string;
  referringDoctorPhone: string;
  testName: string;
  parameterName: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  previousValue?: string;
  flag: PanicFlagLevel;
  flagCode: 'HH' | 'LL' | 'DELTA';
  analyzerName: string;
  remainingSeconds: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  readBackNote?: string;
}

export interface ClinicalTriageDeskProps {
  items?: CriticalTriageItem[];
  onAcknowledgePanic?: (
    itemId: string,
    recipientName: string,
    readBackNote: string
  ) => void;
}

export const INITIAL_TRIAGE_ITEMS: CriticalTriageItem[] = [
  {
    id: 'panic-01',
    sampleBarcode: 'SMP-20261020-00142',
    orderId: 'ORD-2026-9921',
    patientName: 'Rajeshwari Devi',
    age: 64,
    gender: 'F',
    uhid: 'UHID-2026-88412',
    wardAndBed: 'ICU Bed 12 (Cardiac Wing)',
    referringDoctor: 'Dr. S. K. Deshmukh (MD Card)',
    referringDoctorPhone: '+91-98250-11223',
    testName: 'Renal & Electrolyte STAT Panel',
    parameterName: 'Serum Potassium (K+)',
    resultValue: '6.8',
    unit: 'mEq/L',
    referenceRange: '3.5 - 5.1 mEq/L',
    previousValue: '4.6 mEq/L (6h ago)',
    flag: 'CRITICAL_HIGH',
    flagCode: 'HH',
    analyzerName: 'Cobas 6000 c501',
    remainingSeconds: 820, // 13 min 40 sec remaining (< 30 min)
    acknowledged: false,
  },
  {
    id: 'panic-02',
    sampleBarcode: 'SMP-20261020-00159',
    orderId: 'ORD-2026-9934',
    patientName: 'Baby of Meena Patel',
    age: 1,
    gender: 'M',
    uhid: 'UHID-2026-88490',
    wardAndBed: 'NICU Incubator 04',
    referringDoctor: 'Dr. Anjali Mehta (MD Paed)',
    referringDoctorPhone: '+91-98250-44556',
    testName: 'Neonatal Capillary Blood Glucose',
    parameterName: 'Plasma Glucose (Random)',
    resultValue: '32',
    unit: 'mg/dL',
    referenceRange: '50 - 110 mg/dL',
    previousValue: '68 mg/dL',
    flag: 'CRITICAL_LOW',
    flagCode: 'LL',
    analyzerName: 'Mindray BS-480',
    remainingSeconds: -245, // SLA Breached by 4m 05s
    acknowledged: false,
  },
  {
    id: 'panic-03',
    sampleBarcode: 'SMP-20261020-00168',
    orderId: 'ORD-2026-9948',
    patientName: 'Harbhajan Singh Rathore',
    age: 57,
    gender: 'M',
    uhid: 'UHID-2026-88504',
    wardAndBed: 'Emergency Trauma Bay 02',
    referringDoctor: 'Dr. R. K. Verma (ER Chief)',
    referringDoctorPhone: '+91-98250-77889',
    testName: 'Complete Blood Count (STAT)',
    parameterName: 'Hemoglobin & Platelets',
    resultValue: 'Hb: 5.4 g/dL | PLT: 18,000',
    unit: '/µL',
    referenceRange: 'Hb: 13-17 | PLT: 150k-450k',
    previousValue: 'Hb: 11.2 g/dL (Delta -51.7%)',
    flag: 'DELTA_FAIL',
    flagCode: 'DELTA',
    analyzerName: 'Sysmex XN-1000',
    remainingSeconds: 2140, // 35 min 40 sec remaining (< 60 min)
    acknowledged: false,
  },
];

export function ClinicalTriageDesk({
  items: externalItems,
  onAcknowledgePanic,
}: ClinicalTriageDeskProps) {
  const router = useRouter();
  const [triageItems, setTriageItems] = useState<CriticalTriageItem[]>(
    externalItems || INITIAL_TRIAGE_ITEMS
  );
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNACK' | 'ACK'>('ALL');

  // Modal states for "Call Ward" & "ACK Panic" (ISO 15189 Read-Back)
  const [activeModalItem, setActiveModalItem] =
    useState<CriticalTriageItem | null>(null);
  const [modalMode, setModalMode] = useState<'CALL_WARD' | 'ACK_PANIC' | null>(
    null
  );
  const [recipientName, setRecipientName] = useState('');
  const [readBackNote, setReadBackNote] = useState('');

  // Live 1-second SLA / TAT countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTriageItems((prev) =>
        prev.map((item) =>
          item.acknowledged
            ? item
            : { ...item, remainingSeconds: item.remainingSeconds - 1 }
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (seconds: number): {
    label: string;
    status: SlaTimerStatus;
  } => {
    if (seconds <= 0) {
      const overMin = Math.floor(Math.abs(seconds) / 60);
      const overSec = Math.abs(seconds) % 60;
      return {
        label: `BREACHED (+${overMin}m ${overSec < 10 ? '0' : ''}${overSec}s)`,
        status: 'BREACHED',
      };
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    if (mins < 30) {
      return {
        label: `< 30 MIN (${formatted})`,
        status: 'URGENT_30M',
      };
    }
    return {
      label: `< 60 MIN (${formatted})`,
      status: 'WARNING_60M',
    };
  };

  const openActionModal = (
    item: CriticalTriageItem,
    mode: 'CALL_WARD' | 'ACK_PANIC'
  ) => {
    setActiveModalItem(item);
    setModalMode(mode);
    setRecipientName(item.referringDoctor);
    setReadBackNote(
      `Read-back verified for ${item.patientName} (${item.uhid}): ${item.parameterName} = ${item.resultValue} ${item.unit} [${item.flagCode}]`
    );
  };

  const handleConfirmPanicAck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalItem) return;

    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setTriageItems((prev) =>
      prev.map((it) =>
        it.id === activeModalItem.id
          ? {
              ...it,
              acknowledged: true,
              acknowledgedBy: recipientName || it.referringDoctor,
              acknowledgedAt: nowTime,
              readBackNote,
            }
          : it
      )
    );

    if (onAcknowledgePanic) {
      onAcknowledgePanic(activeModalItem.id, recipientName, readBackNote);
    }

    setActiveModalItem(null);
    setModalMode(null);
  };

  const unacknowledgedCount = triageItems.filter((i) => !i.acknowledged).length;

  const visibleItems = triageItems.filter((item) => {
    if (filterMode === 'UNACK') return !item.acknowledged;
    if (filterMode === 'ACK') return item.acknowledged;
    return true;
  });

  return (
    <section
      aria-label="Clinical Triage and Panic Action Desk"
      className="bg-white rounded-xl border border-slate-200/80 overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-[#FEF2F2] border-b border-[#FCA5A5] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#DC2626] text-white shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-[#0F172A] tracking-tight">
                CLINICAL TRIAGE &amp; PANIC ACTION DESK (HH / LL / DELTA)
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-[#DC2626] text-white">
                {unacknowledgedCount} URGENT
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#475569]">
              NABL ISO 15189 Clause 7.4.1.6 Mandatory Critical Value Read-Back &amp;
              Pathologist Sign-off Queue
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#FCA5A5]">
          {(['ALL', 'UNACK', 'ACK'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-colors ${
                filterMode === mode
                  ? 'bg-[#DC2626] text-white'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              {mode === 'ALL'
                ? `All (${triageItems.length})`
                : mode === 'UNACK'
                ? `Pending (${unacknowledgedCount})`
                : `ACK (${triageItems.length - unacknowledgedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Triage Rows */}
      <div className="divide-y divide-slate-200/80">
        {visibleItems.map((item) => {
          const timer = formatCountdown(item.remainingSeconds);

          return (
            <div
              key={item.id}
              className={`p-4 transition-colors ${
                item.acknowledged
                  ? 'bg-[#F8FAFC]/60'
                  : timer.status === 'BREACHED'
                  ? 'bg-[#FEF2F2]/40 hover:bg-[#FEF2F2]/70'
                  : 'bg-white hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Column: Patient & Ward Details */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-[#0F172A]">
                      {item.patientName}
                    </span>
                    <span className="text-xs font-semibold text-[#475569]">
                      ({item.age}Y / {item.gender})
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-[#0F172A] border border-slate-200">
                      {item.uhid}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-teal-50 text-[#0F766E] border border-teal-200">
                      {item.sampleBarcode}
                    </span>

                    {/* SLA / TAT Real-time Countdown Pill */}
                    {!item.acknowledged ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded border ${
                          timer.status === 'BREACHED'
                            ? 'bg-[#DC2626] text-white border-[#DC2626] animate-pulse'
                            : timer.status === 'URGENT_30M'
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
                            : 'bg-[#FFFBEB] text-[#D97706] border-amber-300'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {timer.label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-[#ECFDF5] text-[#059669] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        ACK AT {item.acknowledgedAt}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#475569]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#0284C7]">
                      <Building2 className="w-3.5 h-3.5" />
                      {item.wardAndBed}
                    </span>
                    <span>•</span>
                    <span>
                      Ref: <strong className="text-[#0F172A]">{item.referringDoctor}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Instrument: <strong className="text-[#0F766E]">{item.analyzerName}</strong>
                    </span>
                  </div>
                </div>

                {/* Center Column: Critical Parameter & Result Flag */}
                <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] min-w-[270px] sm:min-w-[310px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#475569]">
                      {item.testName}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-[#DC2626] text-white">
                      {item.flag === 'DELTA_FAIL' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <Flame className="w-3 h-3" />
                      )}
                      {item.flag.replace('_', ' ')} [{item.flagCode}]
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xs font-bold text-[#0F172A]">
                      {item.parameterName}:
                    </span>
                    <span className="text-sm font-mono font-extrabold text-[#DC2626]">
                      {item.resultValue} {item.unit}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[10px] text-[#475569]">
                    <span>Ref: {item.referenceRange}</span>
                    {item.previousValue && <span>Prev: {item.previousValue}</span>}
                  </div>
                </div>

                {/* Right Column: 3 Clinical Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openActionModal(item, 'CALL_WARD')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200/80 bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Call Ward</span>
                  </button>

                  <button
                    type="button"
                    disabled={item.acknowledged}
                    onClick={() => openActionModal(item, 'ACK_PANIC')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                      item.acknowledged
                        ? 'bg-[#ECFDF5] text-[#059669] border border-emerald-200 cursor-default'
                        : 'bg-[#DC2626] text-white hover:bg-red-700'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{item.acknowledged ? 'ACK Logged' : 'ACK Panic'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/approvals?orderId=${encodeURIComponent(item.orderId)}`)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F766E] hover:bg-teal-800 text-white text-xs font-bold transition-colors"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Open Approval</span>
                  </button>
                </div>
              </div>

              {item.acknowledged && item.readBackNote && (
                <div className="mt-2.5 px-3 py-1.5 rounded bg-[#ECFDF5] border border-emerald-200 text-[11px] text-[#059669] flex items-center justify-between">
                  <span>
                    <strong>ISO 15189 Read-Back Verified:</strong> {item.readBackNote}
                  </span>
                  <span className="font-semibold">
                    Notified: {item.acknowledgedBy}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ward Call / Panic Read-Back Modal */}
      {activeModalItem && modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
          <form
            onSubmit={handleConfirmPanicAck}
            className="w-full max-w-lg bg-white rounded-xl border border-slate-200/80 shadow-xl overflow-hidden"
          >
            <div className="px-5 py-3.5 bg-[#FEF2F2] border-b border-[#FCA5A5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#DC2626]">
                  {modalMode === 'CALL_WARD'
                    ? 'WARD TELEPHONY & CRITICAL NOTIFICATION LOG'
                    : 'NABL ISO 15189 CRITICAL PANIC READ-BACK LOG'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveModalItem(null);
                  setModalMode(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#0F172A]">
                    {activeModalItem.patientName} ({activeModalItem.uhid})
                  </span>
                  <span className="text-xs font-bold text-[#0284C7]">
                    {activeModalItem.wardAndBed}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-[#DC2626]">
                  {activeModalItem.parameterName}: {activeModalItem.resultValue}{' '}
                  {activeModalItem.unit} (Ref: {activeModalItem.referenceRange})
                </p>
                <p className="text-[11px] text-[#475569]">
                  Direct Extension / Hotline:{' '}
                  <strong className="text-[#0F172A]">
                    {activeModalItem.referringDoctorPhone}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-[#475569] mb-1">
                  Notified Physician / ICU Nurse On-Duty
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-[#0F172A] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-[#475569] mb-1">
                  Verbatim Read-Back Confirmation Note (NABL Audit Trail)
                </label>
                <textarea
                  rows={3}
                  required
                  value={readBackNote}
                  onChange={(e) => setReadBackNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-[#0F172A] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalItem(null);
                    setModalMode(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#475569] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold"
                >
                  Record Read-Back &amp; ACK Panic
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default ClinicalTriageDesk;
