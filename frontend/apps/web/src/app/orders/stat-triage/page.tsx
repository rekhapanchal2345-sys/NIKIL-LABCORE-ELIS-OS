'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Siren,
  Clock,
  BedDouble,
  Volume2,
  VolumeX,
  UserCheck,
  PlusCircle,
  Activity,
  Building2,
  CheckCircle2,
} from 'lucide-react';

type EncounterType = 'OPD' | 'IPD' | 'EMERGENCY_STAT' | 'ICU' | 'DAYCARE';

interface StatOrderCardItem {
  id: string;
  orderNumber: string;
  patientName: string;
  encounterType: EncounterType;
  wardName?: string;
  roomNumber?: string;
  bedNumber?: string;
  nurseStationId?: string;
  biomarkerCodes: string[];
  targetTatMinutes: number;
  elapsedMinutes: number;
  requiresBedsideDraw: boolean;
  assignedPhlebotomist?: string;
  bedsideCollected: boolean;
  audioAlertAcknowledged: boolean;
}

const INITIAL_STAT_QUEUE: StatOrderCardItem[] = [
  {
    id: 'stat-1',
    orderNumber: 'STAT-20261019-9901',
    patientName: 'Vikramaditya Rathore (58M)',
    encounterType: 'EMERGENCY_STAT',
    wardName: 'Emergency Trauma Resuscitation Bay',
    roomNumber: 'ER-01',
    bedNumber: 'BAY-03',
    nurseStationId: 'NS-TRAUMA-A',
    biomarkerCodes: ['TROP-I', 'LACTATE', 'ABG', 'ECG-STAT'],
    targetTatMinutes: 30,
    elapsedMinutes: 25, // 83.3% elapsed -> Breaches 75% TAT Siren!
    requiresBedsideDraw: true,
    assignedPhlebotomist: 'Phleb. Rameshwar Nair',
    bedsideCollected: true,
    audioAlertAcknowledged: false,
  },
  {
    id: 'stat-2',
    orderNumber: 'ICU-20261019-9904',
    patientName: 'Meenakshi Sundaram (71F)',
    encounterType: 'ICU',
    wardName: 'Cardiac Intensive Care Unit (CICU)',
    roomNumber: 'ICU-3B',
    bedNumber: 'CICU-12',
    nurseStationId: 'NS-CICU-02',
    biomarkerCodes: ['ELECTROLYTES', 'PT-INR', 'ABG'],
    targetTatMinutes: 30,
    elapsedMinutes: 23, // 76.6% elapsed -> Breaches 75% TAT Siren!
    requiresBedsideDraw: true,
    assignedPhlebotomist: undefined,
    bedsideCollected: false,
    audioAlertAcknowledged: false,
  },
  {
    id: 'stat-3',
    orderNumber: 'IPD-20261019-9910',
    patientName: 'Harbhajan Singh Gill (46M)',
    encounterType: 'IPD',
    wardName: 'Surgical Hepatobiliary Ward',
    roomNumber: 'RM-408',
    bedNumber: 'BED-408B',
    nurseStationId: 'NS-FLOOR-4',
    biomarkerCodes: ['LFT', 'PT-INR', 'CBC'],
    targetTatMinutes: 45,
    elapsedMinutes: 18, // 40% elapsed -> On Track
    requiresBedsideDraw: true,
    assignedPhlebotomist: 'Phleb. Anita Desai',
    bedsideCollected: false,
    audioAlertAcknowledged: false,
  },
];

export default function EmergencyStatTriageWorkstationPage() {
  const [queue, setQueue] = useState<StatOrderCardItem[]>(INITIAL_STAT_QUEUE);
  const [filterEncounter, setFilterEncounter] = useState<'ALL' | EncounterType>('ALL');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // New Inpatient / STAT Registration Form State
  const [patientName, setPatientName] = useState('');
  const [encounterType, setEncounterType] = useState<EncounterType>('EMERGENCY_STAT');
  const [wardName, setWardName] = useState('Cardiac ICU');
  const [roomNumber, setRoomNumber] = useState('ICU-2');
  const [bedNumber, setBedNumber] = useState('BED-09');
  const [nurseStationId, setNurseStationId] = useState('NS-ICU-01');
  const [selectedBiomarkers, setSelectedBiomarkers] = useState<string>('TROP-I, ABG, LACTATE');

  /**
   * Synthesizes a clinical high-priority acoustic alert using Web Audio API
   * whenever a STAT order breaches 75% of its target Turnaround Time (TAT).
   */
  const playClinicalStatSiren = useCallback(() => {
    if (!audioEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.18); // E5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Browser autoplay block fallback
    }
  }, [audioEnabled]);

  // Increment elapsed time ticker and check 75% TAT breach
  useEffect(() => {
    const timer = setInterval(() => {
      setQueue((prev) =>
        prev.map((item) => ({
          ...item,
          elapsedMinutes: Number((item.elapsedMinutes + 0.1).toFixed(1)),
        }))
      );
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const hasUnacknowledged75Breach = queue.some(
    (item) =>
      (item.elapsedMinutes / item.targetTatMinutes) * 100 >= 75 &&
      !item.audioAlertAcknowledged
  );

  const handleAcknowledgeSiren = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, audioAlertAcknowledged: true } : item
      )
    );
  };

  const handleDispatchPhlebotomist = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              assignedPhlebotomist: item.assignedPhlebotomist || 'Phleb. Sunita Rao (STAT Team)',
              bedsideCollected: true,
            }
          : item
      )
    );
  };

  const handleAddStatOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    const codes = selectedBiomarkers
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const is30Min = codes.some((c) =>
      ['TROP-I', 'TROP-T', 'ABG', 'LACTATE', 'ELECTROLYTES'].includes(c)
    );

    const newEntry: StatOrderCardItem = {
      id: `stat-${Date.now()}`,
      orderNumber: `STAT-20261019-${Math.floor(1000 + Math.random() * 8999)}`,
      patientName: patientName.trim(),
      encounterType,
      wardName,
      roomNumber,
      bedNumber,
      nurseStationId,
      biomarkerCodes: codes,
      targetTatMinutes: is30Min ? 30 : 45,
      elapsedMinutes: 1,
      requiresBedsideDraw: encounterType !== 'OPD',
      bedsideCollected: false,
      audioAlertAcknowledged: false,
    };

    setQueue((prev) => [newEntry, ...prev]);
    setPatientName('');
  };

  const filteredQueue = queue.filter((item) =>
    filterEncounter === 'ALL' ? true : item.encounterType === filterEncounter
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Emergency Siren Banner when >= 75% TAT is breached */}
      {hasUnacknowledged75Breach && (
        <div className="bg-red-950 border-2 border-red-500 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Siren className="w-7 h-7 text-red-400 shrink-0" />
            <div>
              <h2 className="text-base font-extrabold text-red-200 uppercase tracking-wide">
                CRITICAL SLA WARNING: STAT ORDER EXCEEDED 75% TARGET TURNAROUND TIME
              </h2>
              <p className="text-xs text-red-300">
                Immediate prioritization required on STAT lane. Click &ldquo;Test Audio Siren&rdquo; or acknowledge individual cards below.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playClinicalStatSiren}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
            >
              <Volume2 className="w-4 h-4" />
              Sound Acoustic Siren
            </button>
            <button
              type="button"
              onClick={() => setAudioEnabled((a) => !a)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              {audioEnabled ? 'Audio Armed' : 'Muted'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Emergency STAT &amp; Hospital Inpatient (IPD / ICU) Command Desk
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            30/45-Minute Hard SLA Countdown &amp; Bedside Phlebotomy Dispatch
          </h1>
        </div>

        {/* Encounter Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'EMERGENCY_STAT', 'ICU', 'IPD', 'DAYCARE', 'OPD'] as const).map((enc) => (
            <button
              key={enc}
              type="button"
              onClick={() => setFilterEncounter(enc)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterEncounter === enc
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {enc.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Active STAT / ICU / IPD Countdown Cards */}
        <div className="lg:col-span-8 space-y-4">
          {filteredQueue.map((item) => {
            const pct = Math.min(100, Math.round((item.elapsedMinutes / item.targetTatMinutes) * 100));
            const remainingMins = Math.max(0, Number((item.targetTatMinutes - item.elapsedMinutes).toFixed(1)));
            const isBreached75 = pct >= 75;
            const isHardBreached = item.elapsedMinutes >= item.targetTatMinutes;

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-5 transition ${
                  isHardBreached
                    ? 'bg-red-950/50 border-red-500'
                    : isBreached75
                    ? 'bg-amber-950/40 border-amber-500'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-rose-600 text-white">
                        {item.encounterType}
                      </span>
                      <span className="font-mono text-xs text-slate-300 font-bold">
                        {item.orderNumber}
                      </span>
                      {isBreached75 && (
                        <span className="px-2 py-0.5 rounded bg-red-600/30 border border-red-400 text-red-200 text-[11px] font-bold">
                          &ge;75% TAT WARNING
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">{item.patientName}</h3>
                  </div>

                  {/* SLA Countdown Timer Box */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-right">
                    <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      Target SLA: {item.targetTatMinutes} mins
                    </div>
                    <div
                      className={`text-xl font-extrabold font-mono ${
                        isBreached75 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {remainingMins}m remaining ({pct}%)
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mt-3 border border-slate-800">
                  <div
                    className={`h-full transition-all ${
                      isHardBreached
                        ? 'bg-red-600'
                        : isBreached75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* IPD / ICU Location & Biomarkers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                  <div className="space-y-1">
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      Ward: <strong className="text-slate-200">{item.wardName || 'OPD Walk-In'}</strong>
                    </div>
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-cyan-400" />
                      Room: <strong className="text-white">{item.roomNumber || '-'}</strong> &middot; Bed:{' '}
                      <strong className="text-amber-300">{item.bedNumber || '-'}</strong> &middot; Nurse Station:{' '}
                      <strong className="text-cyan-300">{item.nurseStationId || '-'}</strong>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 mb-1">Critical STAT Biomarkers:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.biomarkerCodes.map((code) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500/40 text-rose-200 font-bold"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bedside Phlebotomy & Siren Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300">
                      Bedside Phlebotomy:{' '}
                      <strong>{item.assignedPhlebotomist || 'Unassigned'}</strong>
                    </span>
                    {item.bedsideCollected ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-semibold">
                        Bedside Drawn
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDispatchPhlebotomist(item.id)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1 rounded font-semibold transition"
                      >
                        Dispatch Bedside Draw
                      </button>
                    )}
                  </div>

                  {isBreached75 && !item.audioAlertAcknowledged && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledgeSiren(item.id)}
                      className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Acknowledge 75% TAT Alert
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 4 Cols: Bedside STAT / IPD Requisition Form */}
        <div className="lg:col-span-4">
          <form
            onSubmit={handleAddStatOrder}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 sticky top-6"
          >
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-rose-400" />
              Requisition STAT / Inpatient Bedside Draw
            </h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Patient Name &amp; Age/Sex</label>
              <input
                type="text"
                required
                placeholder="e.g., Col. Rajendra Prasad (68M)"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Encounter Type</label>
              <select
                value={encounterType}
                onChange={(e) => setEncounterType(e.target.value as EncounterType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="EMERGENCY_STAT">EMERGENCY_STAT (30m Hard SLA)</option>
                <option value="ICU">ICU (Intensive Care Unit)</option>
                <option value="IPD">IPD (Hospital Inpatient Ward)</option>
                <option value="DAYCARE">DAYCARE (Oncology / Dialysis)</option>
                <option value="OPD">OPD (Outpatient Department)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Ward Name</label>
                <input
                  type="text"
                  value={wardName}
                  onChange={(e) => setWardName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nurse Station ID</label>
                <input
                  type="text"
                  value={nurseStationId}
                  onChange={(e) => setNurseStationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Room Number</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Bed Number</label>
                <input
                  type="text"
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                STAT Biomarkers (Comma separated)
              </label>
              <input
                type="text"
                value={selectedBiomarkers}
                onChange={(e) => setSelectedBiomarkers(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-lg text-xs transition"
            >
              Launch STAT Countdown &amp; Dispatch Phlebotomist
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
