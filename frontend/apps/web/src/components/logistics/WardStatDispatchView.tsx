'use client';

// ============================================================
// LABCORE ELIS — Hospital Ward & ICU STAT Dispatch Command
// Real-world critical inpatient specimen logistics
// ISO 15189:2022 §5.4 | CLSI GP44-A4 | CLSI H04-A6
// Pneumatic Tube System (PTS) Accelerometry & Shock Safeguards
// ============================================================

import React, { useState, useEffect } from 'react';
import { ShipmentTrip, PneumaticTubeStation } from './logistics.types';
import {
  Zap,
  Clock,
  MapPin,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Send,
  RefreshCw,
  Activity,
  Layers,
  ArrowRight,
  ShieldAlert,
  Flame,
  Gauge,
  Radio,
  FileCheck,
  HeartPulse,
  Syringe,
  Timer,
  ChevronRight,
  Thermometer,
  ShieldCheck,
  Check,
  X,
  Volume2,
} from 'lucide-react';

interface WardStatDispatchViewProps {
  shipments: ShipmentTrip[];
  stations: PneumaticTubeStation[];
  onQuickWardDispatch: (wardName: string, bedNumber: string, reason: string) => void;
  onSendPneumaticCapsule: (stationCode: string) => void;
}

// ─── Critical Care Triage Presets ───────────────────────────
interface StatClinicalPreset {
  id: string;
  title: string;
  acronym: string;
  department: string;
  targetTatMin: number;
  sampleType: string;
  tubeColorHex: string;
  vacutainerType: string;
  specialHandling: string;
  urgency: 'CRITICAL_10M' | 'STAT_15M' | 'URGENT_30M';
}

const STAT_PRESETS: StatClinicalPreset[] = [
  {
    id: 'acs-trop',
    title: 'Acute Coronary Syndrome (ACS)',
    acronym: 'hs-cTnI + CK-MB',
    department: 'Cardiac Biomarkers',
    targetTatMin: 15,
    sampleType: 'Heparin Plasma / Serum Gel',
    tubeColorHex: '#EAB308',
    vacutainerType: 'SST_GOLD',
    specialHandling: 'Centrifuge immediately @ 3000g for 10 min. Do not freeze whole blood.',
    urgency: 'STAT_15M',
  },
  {
    id: 'sepsis-lactate',
    title: 'Septic Shock Early Warning',
    acronym: 'Lactate + Procalcitonin + BC',
    department: 'Critical Care / Microbiology',
    targetTatMin: 15,
    sampleType: 'Fluoride Plasma & Blood Cultures',
    tubeColorHex: '#64748B',
    vacutainerType: 'FLUORIDE_GREY',
    specialHandling: 'Transport on wet ice slurry. Inhibit in-vitro glycolysis immediately.',
    urgency: 'STAT_15M',
  },
  {
    id: 'abg-stat',
    title: 'Arterial Blood Gas (ABG)',
    acronym: 'pH + pO₂ + pCO₂ + Base Excess',
    department: 'Pulmonary / Blood Gas Lab',
    targetTatMin: 10,
    sampleType: 'Lithium Heparin Syringe (Ice Slurry)',
    tubeColorHex: '#10B981',
    vacutainerType: 'LITHIUM_HEPARIN_GREEN',
    specialHandling: 'Zero air bubbles. Transport on melting ice within 10 minutes strictly.',
    urgency: 'CRITICAL_10M',
  },
  {
    id: 'mtp-transfusion',
    title: 'Massive Transfusion Protocol (MTP)',
    acronym: 'STAT Blood Group & Crossmatch',
    department: 'Transfusion Medicine / Blood Bank',
    targetTatMin: 12,
    sampleType: 'EDTA Lavender (2 Tubes Full Draw)',
    tubeColorHex: '#8B5CF6',
    vacutainerType: 'EDTA_LAVENDER',
    specialHandling: 'Positive patient ID with barcode wristband match. Dedicated courier runner.',
    urgency: 'STAT_15M',
  },
  {
    id: 'stroke-coag',
    title: 'Acute Ischemic Stroke (tPA Protocol)',
    acronym: 'PT/INR + APTT + CBC STAT',
    department: 'Hematology / Coagulation Lab',
    targetTatMin: 15,
    sampleType: 'Sodium Citrate (9:1 ratio)',
    tubeColorHex: '#3B82F6',
    vacutainerType: 'SODIUM_CITRATE_BLUE',
    specialHandling: 'Exact fill volume required. Do not transport via PTS if high g-shock expected.',
    urgency: 'STAT_15M',
  },
];

// ─── Pneumatic Tube Station Extended Telemetry ──────────────
interface PtsDetailedStation extends PneumaticTubeStation {
  peakGForce: number;          // Accelerometer reading (max allowed <= 5.0g)
  lineVelocityMps: number;     // Capsule velocity in m/s (ideal 3.0 - 4.5 m/s)
  vacuumLeakPercent: number;   // Vacuum tightness (< 5% is acceptable)
  diverterValve: 'BAY_1_DIRECT' | 'BYPASS_LINE' | 'STATION_LOCKED';
  totalTransitsToday: number;
}

export default function WardStatDispatchView({
  shipments,
  stations,
  onQuickWardDispatch,
  onSendPneumaticCapsule,
}: WardStatDispatchViewProps) {
  const [selectedWard, setSelectedWard] = useState('ICU 3B');
  const [bedInput, setBedInput] = useState('Bed 12');
  const [reasonInput, setReasonInput] = useState('Critical Troponin-I & Lactate STAT');
  const [activePreset, setActivePreset] = useState<StatClinicalPreset | null>(STAT_PRESETS[0]);
  const [nurseStaffId, setNurseStaffId] = useState('RN-4412 (Sr. Critical Care Sister)');
  const [selectedPorter, setSelectedPorter] = useState('Ramesh Yadav (Porter #04)');
  const [capsuleSending, setCapsuleSending] = useState<string | null>(null);
  const [launchTimerSec, setLaunchTimerSec] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'BOARD' | 'PTS_TELEMETRY' | 'PRESETS'>('BOARD');

  const wardTrips = shipments.filter(s => s.type === 'WARD_STAT');

  // Simulated live pneumatic telemetry data
  const ptsLiveStations: PtsDetailedStation[] = stations.map((st, idx) => ({
    ...st,
    peakGForce: [2.8, 3.4, 4.1, 1.9][idx % 4],
    lineVelocityMps: [3.4, 3.8, 3.2, 4.0][idx % 4],
    vacuumLeakPercent: [1.2, 2.4, 0.8, 1.5][idx % 4],
    diverterValve: 'BAY_1_DIRECT',
    totalTransitsToday: 48 + idx * 14,
  }));

  // Countdown timer for launched capsule
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (launchTimerSec > 0) {
      interval = setInterval(() => {
        setLaunchTimerSec(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [launchTimerSec]);

  const handleSendCapsule = (stationCode: string) => {
    setCapsuleSending(stationCode);
    setLaunchTimerSec(35);
    onSendPneumaticCapsule(stationCode);
    setTimeout(() => {
      setCapsuleSending(null);
    }, 35000);
  };

  const handleApplyPreset = (preset: StatClinicalPreset) => {
    setActivePreset(preset);
    setReasonInput(`STAT ${preset.title}: ${preset.acronym} [CLSI Target: <${preset.targetTatMin}m]`);
  };

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWard || !bedInput) return;
    onQuickWardDispatch(selectedWard, bedInput, reasonInput);
    setReasonInput('Urgent Biomarker STAT Run');
  };

  return (
    <div className="space-y-6">
      {/* HOSPITAL STAT COMMAND HEADER */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-inner">
              <Zap className="w-8 h-8 fill-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-white/20 text-white tracking-wider">
                  CLSI GP44-A4 &amp; ISO 15189:2022
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/25 text-red-100">
                  <Activity className="w-3 h-3 text-emerald-300" />
                  MAX TRANSIT SLA: 15 MINUTES
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Hospital Ward &amp; ICU Emergency STAT Dispatch
              </h2>
              <p className="text-xs sm:text-sm text-red-100 font-medium">
                Pneumatic Tube Shock Telemetry &amp; Porter Runner Command for Acute OT, Sepsis &amp; Cardiac Emergencies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-black/25 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20 text-xs">
              <span className="text-red-200 block text-[10px] font-bold uppercase">Active In-Hospital STAT:</span>
              <span className="font-black text-white text-base">{wardTrips.length} Specimens In-Flight</span>
            </div>
            <div className="bg-black/25 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20 text-xs">
              <span className="text-red-200 block text-[10px] font-bold uppercase">Dedicated Porters:</span>
              <span className="font-black text-emerald-300 text-base">3 On Standby</span>
            </div>
          </div>
        </div>

        {/* SUB-VIEW TABS */}
        <div className="mt-5 pt-3 border-t border-white/20 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('BOARD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'BOARD'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            Runner Board &amp; Dispatch ({wardTrips.length})
          </button>
          <button
            onClick={() => setActiveTab('PTS_TELEMETRY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PTS_TELEMETRY'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            Pneumatic Tube Accelerometer Telemetry ({stations.length} Stns)
          </button>
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PRESETS'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            Critical Care Clinical Protocols (5 Panels)
          </button>
        </div>
      </div>

      {/* VIEW 1: ACTIVE WARD RUNNER BOARD & DISPATCHER */}
      {activeTab === 'BOARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: ACTIVE STAT RUNS & RAPID CALL */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active STAT Ward Trips */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Live In-Hospital STAT Transit Board
                  </h3>
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    {wardTrips.length} active
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  SLA CLOCK: GUARANTEED &lt; 15 MIN
                </span>
              </div>

              <div className="space-y-3">
                {wardTrips.map((s) => {
                  const isCriticalUrgent = s.etaMinutes <= 5;
                  return (
                    <div
                      key={s.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCriticalUrgent
                          ? 'border-red-400 bg-red-50/60 ring-2 ring-red-400/20'
                          : 'border-red-200 bg-red-50/25 hover:bg-red-50/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-red-700 bg-white px-2 py-0.5 rounded border border-red-200">
                              {s.trackingId}
                            </span>
                            <span className="text-[11px] font-black text-white bg-red-600 px-2 py-0.5 rounded uppercase flex items-center gap-1 shadow-xs animate-pulse">
                              <Zap className="w-3 h-3 fill-white" />
                              {s.priority} 15-MIN
                            </span>
                            <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                              {s.wardInfo?.wardName} · {s.wardInfo?.bedNumber}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Seal: {s.tamperSealNumber}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {s.title}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium">
                            Ordering Doctor: <strong className="text-slate-800">{s.wardInfo?.orderingDoctor || 'Attending Intensivist'}</strong>
                            <br />
                            <span className="text-red-700 font-semibold">Clinical Indication: {s.wardInfo?.statReason}</span>
                          </p>

                          {/* Route waypoint */}
                          <div className="flex items-center gap-2 text-xs text-slate-600 pt-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              {s.origin}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              {s.destination}
                            </span>
                          </div>
                        </div>

                        {/* Right status block */}
                        <div className="text-left sm:text-right shrink-0 space-y-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-red-100">
                          <div className="inline-flex items-center sm:justify-end gap-1.5 px-3 py-1 rounded-lg bg-red-600 text-white font-mono text-xs font-black shadow-xs">
                            <Timer className="w-3.5 h-3.5 animate-spin" />
                            ETA: {s.etaMinutes > 0 ? `${s.etaMinutes}m Remaining` : 'Dock Arrival'}
                          </div>

                          <div className="text-xs text-slate-700">
                            Runner: <strong className="text-slate-900">{s.driver}</strong>
                          </div>

                          <div className="text-[11px] text-slate-500 font-mono flex items-center sm:justify-end gap-2">
                            <span>{s.vehicle}</span>
                            <span>•</span>
                            <span className="font-bold text-red-700">{s.samplesCount} Tubes</span>
                          </div>

                          <div className="pt-1 flex items-center sm:justify-end gap-1.5">
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              Cold: +{s.currentTempCelsius}°C
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {wardTrips.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-bold text-slate-700">All Hospital Wards Clear</p>
                    <p className="mt-0.5">No critical care STAT runs pending at this moment. Dedicated hospital porters are stationed at OT and ICU hubs.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rapid Ward STAT Call Dispatch Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Emergency Porter Runner Dispatch Terminal
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Direct paging to dedicated hospital porters with electronic chain-of-custody
                    </p>
                  </div>
                </div>
                {activePreset && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Preset: {activePreset.acronym}
                  </span>
                )}
              </div>

              <form onSubmit={handleCreateDispatch} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Originating Hospital Unit
                    </label>
                    <select
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      <option value="ICU Ward 3B">ICU Ward 3B (Critical Care Wing)</option>
                      <option value="Casualty / Trauma Bay">Casualty Emergency &amp; Trauma Bay</option>
                      <option value="Operation Theater OT-04">Operation Theater Complex (OT-04)</option>
                      <option value="Neonatal NICU Level 3">Neonatal Intensive Care (NICU Level 3)</option>
                      <option value="Cath Lab Suite 2">Cardiac Cath Lab (Coronary Angio)</option>
                      <option value="Dialysis Wing Floor 2">Acute Hemodialysis Center</option>
                      <option value="Bone Marrow Transplant Unit">BMT Sterile Isolation Unit</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Bed / OT Table Identifier
                    </label>
                    <input
                      type="text"
                      value={bedInput}
                      onChange={(e) => setBedInput(e.target.value)}
                      placeholder="e.g. Bed 14 / OT Bay 2"
                      className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Duty Nurse / Ordering Staff ID
                    </label>
                    <input
                      type="text"
                      value={nurseStaffId}
                      onChange={(e) => setNurseStaffId(e.target.value)}
                      placeholder="e.g. RN-4412 (Staff Sister)"
                      className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Clinical Indication &amp; Test Panels
                    </label>
                    <input
                      type="text"
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      placeholder="e.g. Cardiac Troponin-I + Lactate STAT"
                      className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Assigned Hospital Porter Runner
                    </label>
                    <select
                      value={selectedPorter}
                      onChange={(e) => setSelectedPorter(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      <option value="Ramesh Yadav (Porter #04)">Ramesh Yadav — Hospital Cart #02 (Standby ICU)</option>
                      <option value="Kishore Parmar (Porter #07)">Kishore Parmar — Dedicated OT Runner (Standby OT)</option>
                      <option value="Sanjay Solanki (Porter #09)">Sanjay Solanki — Rapid Foot Runner (Standby Casualty)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Pneumatic tube or manual cart option automatically assigned by analyte lability</span>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-sm cursor-pointer active:scale-95 transition-all"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    Dispatch Immediate STAT Runner
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: PNEUMATIC CAPSULE STATUS & QUICK PRESETS */}
          <div className="space-y-6">
            {/* Quick Presets Strip */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-red-600" />
                  Clinical STAT Presets
                </h4>
                <span className="text-[10px] text-slate-400">Click to load</span>
              </div>

              <div className="space-y-2">
                {STAT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      activePreset?.id === preset.id
                        ? 'border-red-400 bg-red-50/70 ring-1 ring-red-400/30'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{preset.acronym}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                        &lt;{preset.targetTatMin}m
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{preset.title}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pneumatic Tube Launch Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Pneumatic Tube Capsule
                  </h4>
                  <p className="text-[11px] text-slate-400">Pressurized tube transfer</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  4.3 BAR OK
                </span>
              </div>

              {launchTimerSec > 0 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-2 animate-pulse">
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-blue-600 animate-ping" />
                      Capsule Flight In-Progress
                    </span>
                    <span className="font-mono text-base font-black text-blue-700">{launchTimerSec}s ETA</span>
                  </div>
                  <div className="h-2 w-full bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-1000"
                      style={{ width: `${((35 - launchTimerSec) / 35) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-blue-700">
                    Velocity: 3.4 m/s · Peak shock: 2.8g (Threshold ≤ 5.0g compliant per CLSI GP44-A4)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {stations.slice(0, 3).map((st) => (
                  <div
                    key={st.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{st.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{st.stationCode} · {st.zone}</div>
                    </div>
                    <button
                      onClick={() => handleSendCapsule(st.stationCode)}
                      disabled={capsuleSending === st.stationCode || launchTimerSec > 0}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                      {capsuleSending === st.stationCode ? 'In Flight...' : 'Launch Capsule'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CLSI H04-A6 STAT Order of Draw */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                CLSI H04-A6 STAT Order of Draw
              </h4>
              <div className="space-y-1.5 text-[11px] font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>1. Blood Culture Bottles (Aerobic / Anaerobic)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span>2. Sodium Citrate (Light Blue — PT/INR / D-Dimer)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span>3. Serum Gel / SST (Gold — hs-Troponin, Enzymes)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  <span>4. EDTA (Lavender — CBC, Procalcitonin, Crossmatch)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                  <span>5. Fluoride (Grey — Plasma Lactate on Ice)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PNEUMATIC TUBE SYSTEM ACCELEROMETER & SHOCK TELEMETRY */}
      {activeTab === 'PTS_TELEMETRY' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-blue-600" />
                  Pneumatic Tube System (PTS) Real-Time Physical Telemetry
                </h3>
                <p className="text-xs text-slate-500">
                  Continuous monitoring of g-force shock, transit velocity, vacuum differential, and tube diverter valves
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span>SAFE SHOCK LIMIT: ≤ 5.0g</span>
                <span>•</span>
                <span className="text-emerald-600">ALL STATIONS PASS</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ptsLiveStations.map((st) => {
                const gForcePass = st.peakGForce <= 5.0;
                return (
                  <div
                    key={st.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {st.stationCode}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        LINE ACTIVE
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{st.name}</h4>
                      <p className="text-xs text-slate-400">{st.zone}</p>
                    </div>

                    <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Peak Deceleration:</span>
                        <span className={`font-mono font-bold ${gForcePass ? 'text-emerald-600' : 'text-red-600'}`}>
                          {st.peakGForce}g (Max 5.0g)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Capsule Velocity:</span>
                        <span className="font-mono font-bold text-slate-800">{st.lineVelocityMps} m/s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Air Pressure:</span>
                        <span className="font-mono font-bold text-slate-800">{st.airPressureBar} bar</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Vacuum Seal Tightness:</span>
                        <span className="font-mono font-bold text-emerald-600">{100 - st.vacuumLeakPercent}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Transits Today:</span>
                        <span className="font-mono font-bold text-blue-700">{st.totalTransitsToday} capsules</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendCapsule(st.stationCode)}
                      disabled={launchTimerSec > 0}
                      className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-2xs mt-1"
                    >
                      {launchTimerSec > 0 ? 'Pneumatic Line Busy' : 'Send Test Capsule'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CLINICAL STAT PRESETS */}
      {activeTab === 'PRESETS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-600" />
              Emergency Department &amp; Critical Care Pre-Analytical Transport Protocols
            </h3>
            <p className="text-xs text-slate-500">
              Laboratory turnaround time (TAT) targets, pre-analytical stability limits, and preservation guidelines per ISO 15189:2022
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STAT_PRESETS.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 hover:bg-white hover:border-red-300 transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    TAT &lt; {p.targetTatMin} MIN
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">{p.department}</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                  <p className="text-xs font-mono font-bold text-blue-700 mt-0.5">{p.acronym}</p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span>Sample Tube:</span>
                    <strong className="text-slate-800">{p.sampleType}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed bg-white p-2 rounded-lg border border-slate-200">
                    <strong className="text-red-700 block mb-0.5">Special Handling:</strong>
                    {p.specialHandling}
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleApplyPreset(p);
                    setActiveTab('BOARD');
                  }}
                  className="w-full py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer shadow-2xs"
                >
                  Apply Protocol to Dispatcher
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
