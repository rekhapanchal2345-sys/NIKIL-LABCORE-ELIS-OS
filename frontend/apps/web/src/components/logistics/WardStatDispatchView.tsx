'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface WardStatDispatchViewProps {
  shipments: ShipmentTrip[];
  stations: PneumaticTubeStation[];
  onQuickWardDispatch: (wardName: string, bedNumber: string, reason: string) => void;
  onSendPneumaticCapsule: (stationCode: string) => void;
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
  const [capsuleSending, setCapsuleSending] = useState<string | null>(null);

  const wardTrips = shipments.filter(s => s.type === 'WARD_STAT');

  const handleSendCapsule = (stationCode: string) => {
    setCapsuleSending(stationCode);
    onSendPneumaticCapsule(stationCode);
    setTimeout(() => {
      setCapsuleSending(null);
    }, 3000);
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
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-2xl p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-xs text-white">
              <Zap className="w-8 h-8 fill-white animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-white/20 text-white tracking-wider">
                Hospital Critical Care SLA
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                Inpatient Ward &amp; ICU STAT Runner Board
              </h2>
              <p className="text-xs sm:text-sm text-red-100 font-medium mt-0.5">
                Guaranteed 15-minute specimen transit for Septic Shock, Cardiac Arrest &amp; Emergency OT cases
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20">
            <Activity className="w-5 h-5 text-emerald-300 animate-pulse" />
            <div className="text-xs">
              <span className="text-red-100 block">Active Hospital Porter Runners:</span>
              <span className="font-extrabold text-white text-sm">3 Dedicated Porters On Standby</span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: WARD RUNNER BOARD & PNEUMATIC TUBE TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: ACTIVE WARD STAT TRIPS & RAPID RUNNER DISPATCH (2 SPAN) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active STAT Ward Trips */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" />
                Active In-Hospital STAT Pickups ({wardTrips.length})
              </h3>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Max SLA: 15 Mins
              </span>
            </div>

            <div className="space-y-3">
              {wardTrips.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-red-200 bg-red-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-red-50/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-red-700 bg-white px-2 py-0.5 rounded border border-red-200">
                        {s.trackingId}
                      </span>
                      <span className="text-xs font-extrabold text-white bg-red-600 px-2 py-0.5 rounded uppercase">
                        {s.priority}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {s.wardInfo?.bedNumber || 'Critical Bed'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1">{s.title}</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Doctor: {s.wardInfo?.orderingDoctor || 'Attending Physician'} · Reason: {s.wardInfo?.statReason}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        {s.origin}
                      </span>
                      <span>→</span>
                      <span className="font-semibold text-slate-700">
                        {s.destination}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 space-y-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-red-100">
                    <div className="text-xs font-extrabold text-red-700 flex items-center sm:justify-end gap-1">
                      <Clock className="w-4 h-4 text-red-600 animate-spin" />
                      {s.etaMinutes > 0 ? `${s.etaMinutes} mins to Dock` : 'Accessioning Now'}
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      Runner: <strong className="text-slate-800">{s.driver}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {s.vehicle} · {s.samplesCount} tubes
                    </div>
                  </div>
                </div>
              ))}

              {wardTrips.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No pending in-hospital STAT ward runs at this moment. All ward runners are clear.
                </div>
              )}
            </div>
          </div>

          {/* Rapid Ward STAT Dispatcher Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-red-600" />
              Rapid In-Hospital Porter Runner Call
            </h3>
            <form onSubmit={handleCreateDispatch} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Ward / Unit</label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="ICU 3B">ICU Ward 3B (Critical Care)</option>
                  <option value="Casualty / Emergency Bay">Casualty &amp; Emergency (Trauma Bay)</option>
                  <option value="Operation Theater OT-04">Operation Theater Complex (OT-04)</option>
                  <option value="Neonatal NICU">Neonatal Intensive Care (NICU)</option>
                  <option value="Daycare Chemotherapy">Daycare Oncology &amp; Chemotherapy</option>
                  <option value="Dialysis Wing">Hemodialysis Unit (Floor 2)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Bed / Patient Location</label>
                <input
                  type="text"
                  value={bedInput}
                  onChange={(e) => setBedInput(e.target.value)}
                  placeholder="e.g. Bed 14 / Bay 02"
                  className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Clinical Indication</label>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="e.g. Sepsis / Troponin STAT"
                  className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  required
                />
              </div>

              <div className="sm:col-span-3 flex justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Signal STAT Porter Runner
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: PNEUMATIC TUBE NETWORK TELEMETRY */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Pneumatic Tube Network
                </h3>
                <p className="text-[11px] text-slate-400">High-speed pressurized specimen transport</p>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                4.3 BAR OK
              </span>
            </div>

            <div className="space-y-3">
              {stations.map((st) => (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    st.status === 'SENDING' || st.status === 'RECEIVING'
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-700">{st.stationCode}</span>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">{st.name}</h4>
                      <p className="text-[10px] text-slate-400">{st.zone}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        st.status === 'SENDING'
                          ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse'
                          : st.status === 'RECEIVING'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {st.status}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Pressure: <strong className="text-slate-700 font-mono">{st.airPressureBar} bar</strong></span>
                    {st.capsuleEtaSeconds ? (
                      <span className="text-blue-600 font-bold animate-pulse">
                        Capsule ETA: {st.capsuleEtaSeconds}s
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendCapsule(st.stationCode)}
                        disabled={capsuleSending === st.stationCode}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      >
                        {capsuleSending === st.stationCode ? 'Launching...' : 'Test Launch Tube'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CLINICAL ORDER OF DRAW REMINDER */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              CLSI H04-A6 STAT Order of Draw
            </h4>
            <div className="space-y-1 text-[11px] font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>1. Blood Culture Bottles (Aerobic/Anaerobic)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <span>2. Sodium Citrate (Light Blue - PT/INR)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0" />
                <span>3. Serum Gel / SST (Gold/Red - Troponin, LFT)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                <span>4. EDTA (Lavender - CBC, PCT, Sepsis)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                <span>5. Fluoride (Grey - Plasma Lactate STAT)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
