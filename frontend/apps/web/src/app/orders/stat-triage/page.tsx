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
import { orderApi } from '@/lib/api';

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

export default function EmergencyStatTriageWorkstationPage() {
  const [queue, setQueue] = useState<StatOrderCardItem[]>([]);
  const [filterEncounter, setFilterEncounter] = useState<'ALL' | EncounterType>('ALL');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // New Inpatient / STAT Registration Form State
  const [patientName, setPatientName] = useState('');
  const [encounterType, setEncounterType] = useState<EncounterType>('EMERGENCY_STAT');
  const [wardName, setWardName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [nurseStationId, setNurseStationId] = useState('');
  const [selectedBiomarkers, setSelectedBiomarkers] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    orderApi.getAll().then((response: any) => {
      if (cancelled) return;
      const orders = response?.data?.orders || response?.data || [];
      const statOrders = (Array.isArray(orders) ? orders : [])
        .filter((order: any) => ['STAT', 'URGENT'].includes(String(order.priority || '').toUpperCase()))
        .filter((order: any) => !['COMPLETED', 'CANCELLED'].includes(String(order.orderStatus || '').toUpperCase()))
        .map((order: any): StatOrderCardItem => {
          const createdAt = new Date(order.createdAt).getTime();
          const elapsedMinutes = Number.isFinite(createdAt)
            ? Math.max(0, Number(((Date.now() - createdAt) / 60000).toFixed(1)))
            : 0;
          const isStat = String(order.priority || '').toUpperCase() === 'STAT';
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            patientName: `${order.patient?.firstName || ''} ${order.patient?.lastName || ''}`.trim() || 'Unnamed patient',
            encounterType: 'OPD',
            biomarkerCodes: (order.items || []).map((item: any) => item.test?.testCode || item.test?.testName).filter(Boolean),
            targetTatMinutes: isStat ? 30 : 45,
            elapsedMinutes,
            requiresBedsideDraw: false,
            bedsideCollected: Boolean(order.sampleCollected),
            audioAlertAcknowledged: false,
          };
        });
      setQueue(statOrders);
    }).catch(() => setQueue([]));
    return () => { cancelled = true; };
  }, []);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 space-y-6">
      {/* Top Emergency Siren Banner when >= 75% TAT is breached */}
      {hasUnacknowledged75Breach && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Siren className="w-7 h-7 text-rose-600 shrink-0" />
            <div>
              <h2 className="text-base font-extrabold text-rose-900 uppercase tracking-wide">
                CRITICAL SLA WARNING: STAT ORDER EXCEEDED 75% TARGET TURNAROUND TIME
              </h2>
              <p className="text-xs text-rose-700">
                Immediate prioritization is required. Review the order and acknowledge the alert when action has been taken.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playClinicalStatSiren}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
            >
              <Volume2 className="w-4 h-4" />
                Test alert
            </button>
            <button
              type="button"
              onClick={() => setAudioEnabled((a) => !a)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              {audioEnabled ? 'Audio Armed' : 'Muted'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            STAT and inpatient order review
          </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Priority order review and specimen collection
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
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
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
                    ? 'bg-rose-50 border-rose-300'
                    : isBreached75
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-rose-600 text-white">
                        {item.encounterType}
                      </span>
                      <span className="font-mono text-xs text-slate-600 font-bold">
                        {item.orderNumber}
                      </span>
                      {isBreached75 && (
                        <span className="px-2 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold">
                          &ge;75% TAT WARNING
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{item.patientName}</h3>
                  </div>

                  {/* SLA Countdown Timer Box */}
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-right">
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
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-3 border border-slate-200">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      Ward: <strong className="text-slate-200">{item.wardName || 'OPD Walk-In'}</strong>
                    </div>
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-cyan-400" />
                      Room: <strong className="text-slate-900">{item.roomNumber || '-'}</strong> &middot; Bed:{' '}
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
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200">
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
            className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 sticky top-6 shadow-xs"
          >
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-rose-400" />
              Requisition STAT / Inpatient Bedside Draw
            </h2>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Patient name / identifier</label>
              <input
                type="text"
                required
                placeholder="Enter patient name or UHID"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Encounter type</label>
              <select
                value={encounterType}
                onChange={(e) => setEncounterType(e.target.value as EncounterType)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900"
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
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nurse Station ID</label>
                <input
                  type="text"
                  value={nurseStationId}
                  onChange={(e) => setNurseStationId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Room Number</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Bed Number</label>
                <input
                  type="text"
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Investigation codes (comma separated)
              </label>
              <input
                type="text"
                value={selectedBiomarkers}
                onChange={(e) => setSelectedBiomarkers(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-xs transition"
            >
              Register STAT order
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
