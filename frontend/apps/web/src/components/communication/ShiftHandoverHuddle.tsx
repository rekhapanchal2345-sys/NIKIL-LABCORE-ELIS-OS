'use client';

import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  CheckSquare,
  Square,
  Lock,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface ShiftHandoverRecord {
  id: string;
  shiftName: 'MORNING_SHIFT' | 'EVENING_SHIFT' | 'NIGHT_STAT_SHIFT';
  date: string;
  outgoingOfficer: string;
  incomingOfficer: string;
  supervisorSignOff: boolean;
  status: 'PENDING_SIGNOFF' | 'LOCKED_AUDIT';
  stats: {
    samplesProcessed: number;
    panicValuesEscalated: number;
    pendingRedraws: number;
    reagentWarnings: number;
  };
  checklist: {
    id: string;
    label: string;
    checked: boolean;
    category: 'QC_CALIBRATION' | 'SPECIMEN_TRACKING' | 'REAGENT_INVENTORY' | 'CRITICAL_PANIC';
  }[];
  handoverNotes: string;
}

const INITIAL_HANDOVERS: ShiftHandoverRecord[] = [
  {
    id: 'SH-2026-1021-NIGHT',
    shiftName: 'NIGHT_STAT_SHIFT',
    date: '21 Oct 2026 (Night Shift: 11:00 PM - 07:00 AM)',
    outgoingOfficer: 'Dr. Sameer Sen (MD Pathologist, Reg: DMC-8491)',
    incomingOfficer: 'Dr. Kavita Rao (Chief Biochemist, Reg: DMC-6012)',
    supervisorSignOff: true,
    status: 'LOCKED_AUDIT',
    stats: {
      samplesProcessed: 284,
      panicValuesEscalated: 3,
      pendingRedraws: 1,
      reagentWarnings: 1,
    },
    checklist: [
      {
        id: 'c1',
        label: 'All Westgard 1:2s & 1:3s Levey-Jennings QC runs locked before batch analysis',
        checked: true,
        category: 'QC_CALIBRATION',
      },
      {
        id: 'c2',
        label: 'Every critical panic value verbally read back to clinician within 15-minute SLA',
        checked: true,
        category: 'CRITICAL_PANIC',
      },
      {
        id: 'c3',
        label: 'Hemolyzed sample in ICU Bed 03 flagged and night-redraw runner dispatched',
        checked: true,
        category: 'SPECIMEN_TRACKING',
      },
      {
        id: 'c4',
        label: 'hs-Troponin-I secondary cartridge loaded on Cobas e411 with 86 tests reserve',
        checked: true,
        category: 'REAGENT_INVENTORY',
      },
    ],
    handoverNotes:
      'Night shift completed with 3 critical panic values (Troponin-I 2.45, K+ 6.8, Platelets 18,000) all verbally read-back and confirmed with attending consultants. Reagent inventory is stable.',
  },
];

export default function ShiftHandoverHuddle() {
  const [handovers, setHandovers] = useState<ShiftHandoverRecord[]>(INITIAL_HANDOVERS);
  const [activeRecord, setActiveRecord] = useState<ShiftHandoverRecord>(INITIAL_HANDOVERS[0]);
  const [isSignoffModalOpen, setIsSignoffModalOpen] = useState(false);
  const [signoffPin, setSignoffPin] = useState('');

  const handleToggleChecklist = (itemIndex: number) => {
    const updatedChecklist = [...activeRecord.checklist];
    updatedChecklist[itemIndex].checked = !updatedChecklist[itemIndex].checked;
    setActiveRecord({ ...activeRecord, checklist: updatedChecklist });
  };

  const handleLockHandover = () => {
    setActiveRecord({
      ...activeRecord,
      status: 'LOCKED_AUDIT',
      supervisorSignOff: true,
    });
    setIsSignoffModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#0F172A]">Clinical Shift Handover & Huddle Desk</h3>
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-[#0F766E] border border-teal-200">
                NABL ISO-15189 Quality Protocol
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Standardized shift-to-shift laboratory custody transfer, pending critical value handoff, analyzer calibration verification, and dual electronic signatures.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Duty Handover Synced
          </span>
        </div>
      </div>

      {/* Main Shift Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Shift Summary & KPI Telemetry (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
              Shift Custody Information
            </h4>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Current Shift</span>
                <p className="text-xs font-extrabold text-[#0F172A] mt-0.5">{activeRecord.date}</p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Outgoing Officer</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{activeRecord.outgoingOfficer}</p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Incoming Relieving Officer</span>
                <p className="text-xs font-bold text-[#0F766E] mt-0.5">{activeRecord.incomingOfficer}</p>
              </div>
            </div>

            {/* Shift Volume Metric Counters */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200/60">
                <span className="text-[10px] font-bold text-[#0F766E] uppercase">Samples Run</span>
                <p className="text-xl font-extrabold text-[#0F766E] mt-1">{activeRecord.stats.samplesProcessed}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/60">
                <span className="text-[10px] font-bold text-rose-700 uppercase">Panic Handled</span>
                <p className="text-xl font-extrabold text-rose-700 mt-1">{activeRecord.stats.panicValuesEscalated}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Redraw Watch</span>
                <p className="text-xl font-extrabold text-amber-700 mt-1">{activeRecord.stats.pendingRedraws}</p>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-200/60">
                <span className="text-[10px] font-bold text-[#0284C7] uppercase">Reagent Status</span>
                <p className="text-xl font-extrabold text-[#0284C7] mt-1">Normal</p>
              </div>
            </div>

            {/* Electronic Sign-Off Box */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-emerald-800">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>NABL Quality Custody Locked</span>
              </div>
              <p className="text-[10px] text-emerald-700 mt-1">
                Verified with Dual Digital Signature & Biometric Timestamp
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Shift Checklist & Operational Handover Notes (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
                  Mandatory Clinical Handover Checklist
                </h4>
                <span className="text-xs font-bold text-emerald-700">
                  {activeRecord.checklist.filter((c) => c.checked).length} / {activeRecord.checklist.length} Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every item must be inspected and verified by both outgoing and incoming lab leadership.
              </p>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2.5">
              {activeRecord.checklist.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(idx)}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    item.checked
                      ? 'bg-teal-50/40 border-teal-200 text-slate-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-[#0F766E]">
                    {item.checked ? (
                      <CheckCircle2 className="w-5 h-5 text-[#0F766E]" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${item.checked ? 'text-slate-900' : 'text-slate-600'}`}>
                      {item.label}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                      {item.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Handover Log Text Area */}
            <div>
              <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Pathology Handover Remarks & Special Watchlist
              </label>
              <textarea
                rows={3}
                readOnly
                value={activeRecord.handoverNotes}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 bg-[#F8FAFC] leading-relaxed focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
