'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  ArrowRight,
  Printer,
  Sparkles,
  AlertCircle,
  Search,
  RefreshCw,
  Plus,
  Flame,
  Phone,
  Shield,
  Stethoscope,
  FlaskConical,
  CreditCard,
  Check,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { patientApi } from '@/lib/api';
import { showSuccess, showInfo, showError } from '@/lib/notifications';
import { calculatePatientRiskScore } from '@/lib/patient-intelligence';

export type QueueStage =
  | 'WAITING_VITALS'
  | 'PHLEBOTOMY'
  | 'CONSULTATION'
  | 'LAB_PROCESSING'
  | 'BILLING_DISPATCH'
  | 'COMPLETED';

export interface QueueToken {
  id: string;
  tokenNumber: string;
  tokenIndex: number;
  patientId: string;
  uhid: string;
  patientName: string;
  gender: string;
  age: number;
  phone: string;
  stage: QueueStage;
  priority: 'NORMAL' | 'VIP' | 'EMERGENCY';
  createdAt: Date;
  calledAt?: Date;
  counterName: string;
  doctorName?: string;
  testsOrdered?: string[];
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

const STAGE_CONFIG: Record<
  QueueStage,
  { label: string; icon: any; color: string; badge: string; step: number }
> = {
  WAITING_VITALS: {
    label: 'Vitals & Triage',
    icon: Flame,
    color: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    step: 1,
  },
  PHLEBOTOMY: {
    label: 'Sample Collection',
    icon: FlaskConical,
    color: 'from-rose-500 to-pink-600',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    step: 2,
  },
  CONSULTATION: {
    label: 'Doctor Review',
    icon: Stethoscope,
    color: 'from-sky-500 to-blue-600',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    step: 3,
  },
  LAB_PROCESSING: {
    label: 'Testing in Lab',
    icon: Clock,
    color: 'from-purple-500 to-indigo-600',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    step: 4,
  },
  BILLING_DISPATCH: {
    label: 'Reports & Billing',
    icon: CreditCard,
    color: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    step: 5,
  },
  COMPLETED: {
    label: 'Checked Out',
    icon: CheckCircle2,
    color: 'from-slate-400 to-slate-600',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    step: 6,
  },
};

export default function OpdLiveQueue() {
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<QueueStage | 'ALL'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentlyServing, setCurrentlyServing] = useState<QueueToken | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTokenForSlip, setSelectedTokenForSlip] = useState<QueueToken | null>(null);

  // Load real patients & synthesize initial live tokens
  const fetchQueueData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await patientApi.getAll('?limit=25');
      const patientList = res?.data?.patients || res?.patients || [];

      // Generate realistic live hospital tokens from active patients
      const generatedTokens: QueueToken[] = patientList.slice(0, 15).map((p: any, idx: number) => {
        const isEmergency = idx === 0 && (p.isCritical || p.patientType === 'VIP');
        const isVip = p.patientType === 'VIP' || idx === 2;
        const priority = isEmergency ? 'EMERGENCY' : isVip ? 'VIP' : 'NORMAL';

        // Assign progressive queue stages
        const stages: QueueStage[] = [
          'WAITING_VITALS',
          'PHLEBOTOMY',
          'PHLEBOTOMY',
          'CONSULTATION',
          'LAB_PROCESSING',
          'BILLING_DISPATCH',
          'COMPLETED',
        ];
        const assignedStage = stages[idx % stages.length]!;

        const risk = calculatePatientRiskScore(p);

        return {
          id: p.id || `token-${idx + 1}`,
          tokenNumber: priority === 'EMERGENCY' ? `EMG-0${idx + 1}` : priority === 'VIP' ? `VIP-0${idx + 1}` : `T-${String(idx + 1).padStart(2, '0')}`,
          tokenIndex: idx + 1,
          patientId: p.id,
          uhid: p.uhid || `LC-2026-000${idx + 1}`,
          patientName: `${p.title || 'Mr.'} ${p.firstName} ${p.lastName || ''}`.trim(),
          gender: p.gender || 'MALE',
          age: Number(p.age) || 35,
          phone: p.phone || '9876543210',
          stage: assignedStage,
          priority,
          createdAt: new Date(Date.now() - (idx * 8 + 3) * 60 * 1000),
          counterName: assignedStage === 'PHLEBOTOMY' ? 'Phlebotomy Booth 1' : assignedStage === 'CONSULTATION' ? 'OPD Room 104' : 'Reception Desk',
          doctorName: 'Dr. Rajesh Sharma, MD',
          testsOrdered: idx % 2 === 0 ? ['Complete Blood Count', 'Lipid Profile', 'HbA1c'] : ['Thyroid Profile', 'LFT'],
          riskScore: risk.score,
          riskLevel: risk.level,
        };
      });

      setTokens(generatedTokens);

      // Find first in-service token
      const inService = generatedTokens.find((t) => t.stage === 'PHLEBOTOMY' || t.stage === 'CONSULTATION');
      if (inService) setCurrentlyServing(inService);
    } catch (err) {
      console.error('Queue load error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  // Voice Announcement Chime (Speech Synthesis)
  const announceToken = (token: QueueToken, counter?: string) => {
    if (!soundEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const text = `Attention please. Token number ${token.tokenNumber}, ${token.patientName}, please proceed to ${counter || token.counterName}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  // Call Next Token
  const handleCallToken = (token: QueueToken) => {
    setCurrentlyServing(token);
    announceToken(token);
    showSuccess(`Calling Token ${token.tokenNumber}: ${token.patientName}`);
  };

  // Advance Token Stage
  const handleAdvanceStage = (tokenId: string) => {
    const stageOrder: QueueStage[] = [
      'WAITING_VITALS',
      'PHLEBOTOMY',
      'CONSULTATION',
      'LAB_PROCESSING',
      'BILLING_DISPATCH',
      'COMPLETED',
    ];

    setTokens((prev) =>
      prev.map((t) => {
        if (t.id !== tokenId) return t;
        const currIndex = stageOrder.indexOf(t.stage);
        const nextStage = stageOrder[Math.min(stageOrder.length - 1, currIndex + 1)]!;
        return {
          ...t,
          stage: nextStage,
          counterName:
            nextStage === 'PHLEBOTOMY'
              ? 'Phlebotomy Booth 2'
              : nextStage === 'CONSULTATION'
              ? 'Consultation Cabin 2'
              : nextStage === 'BILLING_DISPATCH'
              ? 'Discharge & Billing Counter'
              : t.counterName,
        };
      })
    );
    showInfo('Patient transitioned to next queue stage');
  };

  // Filtered tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter((t) => {
      const matchesStage = activeStage === 'ALL' ? t.stage !== 'COMPLETED' : t.stage === activeStage;
      const matchesSearch =
        !searchQuery.trim() ||
        t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.uhid.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStage && matchesSearch;
    });
  }, [tokens, activeStage, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const waitingCount = tokens.filter((t) => t.stage !== 'COMPLETED').length;
    const completedCount = tokens.filter((t) => t.stage === 'COMPLETED').length;
    const emergencyCount = tokens.filter((t) => t.priority === 'EMERGENCY' || t.priority === 'VIP').length;
    return {
      totalToday: tokens.length,
      inQueue: waitingCount,
      completedToday: completedCount,
      priorityCount: emergencyCount,
      avgWaitMinutes: 14,
    };
  }, [tokens]);

  return (
    <div className="space-y-6">
      {/* ── Header Ribbon ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Hospital OPD Queue
            </span>
            <span className="text-xs text-slate-400">NABL ISO 15189 Certified Flow</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            Patient Token Dispatch & Live Queuing
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Real-time patient flow: Registration → Vitals → Phlebotomy Collection → Clinical Consultation → Report Dispatch
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition shadow-sm ${
              soundEnabled
                ? 'bg-indigo-600/40 border-indigo-400/50 text-indigo-200 hover:bg-indigo-600/60'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            {soundEnabled ? 'Chime Voice ON' : 'Voice Muted'}
          </button>

          <button
            type="button"
            onClick={fetchQueueData}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
            title="Refresh Live Token Status"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── KPI Statistics Bar ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today's Footfall</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{metrics.totalToday}</span>
            <Users size={16} className="text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Total registered patients</p>
        </div>

        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Currently Waiting</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-sky-900">{metrics.inQueue}</span>
            <Clock size={16} className="text-sky-600" />
          </div>
          <p className="text-[10px] text-sky-600 mt-1">In active laboratory pipeline</p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Avg. Wait Time</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-900">{metrics.avgWaitMinutes} min</span>
            <Flame size={16} className="text-amber-600" />
          </div>
          <p className="text-[10px] text-amber-600 mt-1">From token to collection</p>
        </div>

        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Fast-Track / VIP</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-900">{metrics.priorityCount}</span>
            <Shield size={16} className="text-rose-600" />
          </div>
          <p className="text-[10px] text-rose-600 mt-1">Emergency priority patients</p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Dispatched Today</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-900">{metrics.completedToday}</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">Sample collected & processed</p>
        </div>
      </div>

      {/* ── Active "Now Serving" Board Callout ──────────────── */}
      {currentlyServing ? (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-blue-900 text-white shadow-lg border border-indigo-700/60 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-xl bg-white text-indigo-950 flex flex-col items-center justify-center font-black shadow-inner shrink-0">
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">SERVING</span>
              <span className="text-2xl tracking-tight leading-none mt-0.5">{currentlyServing.tokenNumber}</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight">{currentlyServing.patientName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white/20 text-white">
                  {currentlyServing.uhid}
                </span>
                {currentlyServing.priority === 'EMERGENCY' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500 font-bold uppercase">Emergency</span>
                )}
              </div>
              <p className="text-xs text-indigo-200 mt-0.5 flex items-center gap-2">
                <span>{currentlyServing.gender} · {currentlyServing.age} yrs</span>
                <span>•</span>
                <span>Counter: <strong className="text-white">{currentlyServing.counterName}</strong></span>
              </p>
              {currentlyServing.testsOrdered && (
                <p className="text-[11px] text-indigo-300 mt-1 flex items-center gap-1.5">
                  <FlaskConical size={12} className="text-sky-300" />
                  <span>Tests: {currentlyServing.testsOrdered.join(', ')}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => announceToken(currentlyServing)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/20 transition flex items-center gap-1.5"
            >
              <Volume2 size={14} /> Announce Chime
            </button>

            <button
              type="button"
              onClick={() => handleAdvanceStage(currentlyServing.id)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white shadow-md transition flex items-center gap-1.5"
            >
              <span>Next Stage</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Stage Filter Chips & Search Bar ────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" style={{ scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => setActiveStage('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
              activeStage === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Active ({tokens.filter((t) => t.stage !== 'COMPLETED').length})
          </button>

          {(Object.keys(STAGE_CONFIG) as QueueStage[]).map((stg) => {
            const count = tokens.filter((t) => t.stage === stg).length;
            const cfg = STAGE_CONFIG[stg];
            return (
              <button
                key={stg}
                type="button"
                onClick={() => setActiveStage(stg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeStage === stg
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{cfg.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/60 text-slate-700">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
            placeholder="Search Token, Name, UHID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Token Cards Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTokens.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Patients in this Queue Stage</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tokens will appear automatically as patients register at the reception desk.</p>
          </div>
        ) : (
          filteredTokens.map((token) => {
            const stageCfg = STAGE_CONFIG[token.stage];
            const StageIcon = stageCfg.icon;
            const isCurrent = currentlyServing?.id === token.id;

            return (
              <div
                key={token.id}
                className={`p-4 rounded-xl border transition-all duration-200 bg-white shadow-2xs hover:shadow-md flex flex-col justify-between ${
                  isCurrent ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200/90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-tight shadow-xs">
                        {token.tokenNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 tracking-tight">{token.patientName}</h4>
                          {token.priority === 'EMERGENCY' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700">EMG</span>
                          )}
                          {token.priority === 'VIP' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700">VIP</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {token.uhid} · {token.gender} · {token.age} yrs
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${stageCfg.badge}`}>
                      <StageIcon size={11} /> {stageCfg.label}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Current Station:</span>
                      <strong className="text-slate-800">{token.counterName}</strong>
                    </div>
                    {token.testsOrdered && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Tests:</span>
                        <span className="font-medium text-slate-700 truncate max-w-[180px]">{token.testsOrdered.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Wait Duration:</span>
                      <span className="font-semibold text-amber-600">
                        {Math.max(1, Math.floor((Date.now() - token.createdAt.getTime()) / 60000))} mins in clinic
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTokenForSlip(token)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="Print Token Slip"
                  >
                    <Printer size={15} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCallToken(token)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition flex items-center gap-1"
                    >
                      <Play size={12} fill="currentColor" /> Call
                    </button>

                    {token.stage !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStage(token.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-indigo-700 transition flex items-center gap-1"
                      >
                        Advance <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Thermal Slip Print Modal (58mm / 80mm standard receipt) ── */}
      {selectedTokenForSlip && (
        <div className="dr-overlay" role="dialog" aria-modal="true" aria-label="Print token slip">
          <div className="dr-panel max-w-sm bg-white p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h3 className="font-black text-slate-900 text-base">LABCORE DIAGNOSTICS</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">OPD Token Receipt</p>
              <div className="my-3 py-2 bg-slate-100 rounded-xl">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{selectedTokenForSlip.tokenNumber}</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{selectedTokenForSlip.patientName}</p>
              <p className="text-[11px] text-slate-500">UHID: {selectedTokenForSlip.uhid} · {selectedTokenForSlip.gender} · {selectedTokenForSlip.age}y</p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 py-1">
              <div className="flex justify-between">
                <span>Station:</span>
                <strong>{selectedTokenForSlip.counterName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Priority:</span>
                <span className="font-bold text-slate-800">{selectedTokenForSlip.priority}</span>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 italic">
              Please wait for your token to be announced on the digital display board.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTokenForSlip(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setSelectedTokenForSlip(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Printer size={13} /> Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
