'use client';

import React, { useState } from 'react';
import {
  AlertOctagon,
  Radio,
  Send,
  ShieldAlert,
  Users,
  Bell,
  CheckCircle2,
  Clock,
  Flame,
  HeartPulse,
  Cpu,
  ThermometerSnowflake,
  Volume2,
  X,
  AlertTriangle,
} from 'lucide-react';

export interface EmergencyBroadcastRecord {
  id: string;
  codeType: 'CODE_BLUE' | 'CODE_RED' | 'MASS_STAT' | 'COLD_CHAIN_ALERT' | 'ANALYZER_OFFLINE';
  title: string;
  location: string;
  triggeredBy: string;
  timestamp: string;
  targetDepartments: string[];
  acknowledgedCount: number;
  totalRecipients: number;
  status: 'ACTIVE_EMERGENCY' | 'STAND_DOWN';
  notes: string;
}

const INITIAL_BROADCASTS: EmergencyBroadcastRecord[] = [
  {
    id: 'EMG-2026-08',
    codeType: 'MASS_STAT',
    title: 'Multi-Trauma STAT Protocol (ER Mass Inflow)',
    location: 'Emergency Trauma Ward & Central Hematology',
    triggeredBy: 'Dr. Sameer Sen (Duty Pathologist)',
    timestamp: '15 min ago (11:15 PM)',
    targetDepartments: ['Hematology Lab', 'Blood Bank / Cross-Match', 'Duty Pathologists', 'STAT Phlebotomy'],
    acknowledgedCount: 28,
    totalRecipients: 32,
    status: 'ACTIVE_EMERGENCY',
    notes: '8 Highway accident casualties admitted. Cross-match 16 units PRBC and fast-track STAT CBC + PT/INR immediately.',
  },
  {
    id: 'EMG-2026-07',
    codeType: 'COLD_CHAIN_ALERT',
    title: 'Walk-in Reagent Freezer #2 Temperature Excursion (+4.2°C)',
    location: 'Central Cold Storage Room B',
    triggeredBy: 'IoT Environmental Sensor #CS-04',
    timestamp: '1 hr ago (10:30 PM)',
    targetDepartments: ['Biomedical Maintenance', 'Quality Assurance', 'Bio-chemistry In-charge'],
    acknowledgedCount: 12,
    totalRecipients: 12,
    status: 'STAND_DOWN',
    notes: 'Compressor auto-restarted via secondary backup generator. Reagents moved to Reserve Freezer #3. Zero stock compromised.',
  },
];

export default function EmergencyBroadcastCenter() {
  const [broadcasts, setBroadcasts] = useState<EmergencyBroadcastRecord[]>(INITIAL_BROADCASTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<'CODE_BLUE' | 'CODE_RED' | 'MASS_STAT' | 'COLD_CHAIN_ALERT' | 'ANALYZER_OFFLINE'>('CODE_BLUE');
  const [broadcastLocation, setBroadcastLocation] = useState('Central Diagnostic Center - Floor 1');
  const [broadcastNotes, setBroadcastNotes] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([
    'All Emergency Doctors',
    'ICU & HDU Desks',
    'Duty Pathologists',
  ]);

  const allDepts = [
    'All Emergency Doctors',
    'ICU & HDU Desks',
    'Duty Pathologists',
    'Phlebotomy Squad',
    'Biomedical Engineering',
    'Hospital Security',
  ];

  const handleToggleDept = (dept: string) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const handleTriggerBroadcast = () => {
    const codeTitles = {
      CODE_BLUE: 'CODE BLUE: Medical Emergency / Resuscitation Team Alert',
      CODE_RED: 'CODE RED: Immediate Fire & HazMat Evacuation Alert',
      MASS_STAT: 'STAT MASS CASUALTY: Fast-Track Lab & Blood Cross-Match',
      COLD_CHAIN_ALERT: 'CRITICAL COLD-CHAIN: Reagent Storage Temperature Excursion',
      ANALYZER_OFFLINE: 'SYSTEM ALERT: Core Analyzer ASTM/HL7 Interfacing Down',
    };

    const newRecord: EmergencyBroadcastRecord = {
      id: `EMG-2026-${Math.floor(10 + Math.random() * 90)}`,
      codeType: selectedCode,
      title: codeTitles[selectedCode],
      location: broadcastLocation,
      triggeredBy: 'Current Operator (Admin Superdesk)',
      timestamp: 'Just Now',
      targetDepartments: selectedDepts,
      acknowledgedCount: 1,
      totalRecipients: selectedDepts.length * 8,
      status: 'ACTIVE_EMERGENCY',
      notes: broadcastNotes || 'Immediate attention and clinical priority response mandatory.',
    };

    setBroadcasts([newRecord, ...broadcasts]);
    setIsModalOpen(false);
    setBroadcastNotes('');
  };

  const handleStandDown = (id: string) => {
    setBroadcasts((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'STAND_DOWN' } : b))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Trigger Button */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-50 via-white to-red-50 p-6 border border-rose-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#0F172A]">Hospital & Lab Emergency Paging Desk</h3>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-300">
                High-Priority Override
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Broadcast instantaneous emergency codes (Code Blue, Fire/HazMat, Mass Casualty, Cold-Chain Alerts) to all connected clinic terminals, staff WhatsApp numbers, and high-priority SMS.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm shrink-0"
        >
          <AlertOctagon className="w-4 h-4 animate-bounce" />
          Transmit Emergency Broadcast
        </button>
      </div>

      {/* Broadcast History Cards */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Active Emergency & Broadcast Log ({broadcasts.length})
        </h4>

        <div className="grid grid-cols-1 gap-4">
          {broadcasts.map((b) => {
            const isActive = b.status === 'ACTIVE_EMERGENCY';
            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-white border-rose-300 shadow-sm ring-1 ring-rose-200'
                    : 'bg-[#F8FAFC] border-slate-200 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`p-2.5 rounded-xl shrink-0 ${
                        b.codeType === 'CODE_BLUE'
                          ? 'bg-blue-100 text-blue-700'
                          : b.codeType === 'CODE_RED'
                          ? 'bg-red-100 text-red-700'
                          : b.codeType === 'COLD_CHAIN_ALERT'
                          ? 'bg-cyan-100 text-cyan-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {b.codeType === 'CODE_BLUE' ? (
                        <HeartPulse className="w-5 h-5" />
                      ) : b.codeType === 'CODE_RED' ? (
                        <Flame className="w-5 h-5" />
                      ) : b.codeType === 'COLD_CHAIN_ALERT' ? (
                        <ThermometerSnowflake className="w-5 h-5" />
                      ) : (
                        <AlertOctagon className="w-5 h-5" />
                      )}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#0F172A]">{b.title}</span>
                        {isActive ? (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 animate-pulse">
                            ACTIVE PROTOCOL
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                            STAND DOWN (RESOLVED)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">Location:</span> {b.location} • <span className="font-semibold text-slate-700">Triggered by:</span> {b.triggeredBy} ({b.timestamp})
                      </p>
                    </div>
                  </div>

                  {/* Actions & Ack Tracker */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-[#0F172A]">
                        {b.acknowledgedCount} / {b.totalRecipients} Confirmed
                      </p>
                      <div className="w-28 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${(b.acknowledgedCount / b.totalRecipients) * 100}%` }}
                        />
                      </div>
                    </div>

                    {isActive && (
                      <button
                        onClick={() => handleStandDown(b.id)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        Stand Down
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes and departments */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-600 italic">"{b.notes}"</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {b.targetDepartments.map((dept, i) => (
                      <span
                        key={i}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          TRANSMIT MODAL
      ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white">
                  <AlertOctagon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">Transmit Clinical Emergency Broadcast</h3>
                  <p className="text-[11px] text-rose-800">High-priority multi-terminal lab & hospital alert</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Emergency Code Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Protocol / Code Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CODE_BLUE', label: '🚨 CODE BLUE (Medical / Resuscitation)' },
                    { id: 'MASS_STAT', label: '🩸 MASS CASUALTY (STAT Lab Protocol)' },
                    { id: 'CODE_RED', label: '🔥 CODE RED (Fire / HazMat Evacuation)' },
                    { id: 'COLD_CHAIN_ALERT', label: '❄️ COLD-CHAIN (Freezer / Reagent Spike)' },
                  ].map((code) => (
                    <button
                      key={code.id}
                      type="button"
                      onClick={() => setSelectedCode(code.id as any)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                        selectedCode === code.id
                          ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {code.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Physical Facility / Location</label>
                <input
                  type="text"
                  value={broadcastLocation}
                  onChange={(e) => setBroadcastLocation(e.target.value)}
                  placeholder="e.g. Central Lab, ICU Bed 04, Trauma OT"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Target Departments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Notification Groups</label>
                <div className="flex flex-wrap gap-1.5">
                  {allDepts.map((dept) => {
                    const isChecked = selectedDepts.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => handleToggleDept(dept)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                          isChecked
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {dept}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Operational Directive / Notes</label>
                <textarea
                  rows={2}
                  value={broadcastNotes}
                  onChange={(e) => setBroadcastNotes(e.target.value)}
                  placeholder="Specific instructions for on-duty doctors, technologists and phlebotomists..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerBroadcast}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20"
              >
                <Volume2 className="w-4 h-4" />
                Transmit Alert Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
