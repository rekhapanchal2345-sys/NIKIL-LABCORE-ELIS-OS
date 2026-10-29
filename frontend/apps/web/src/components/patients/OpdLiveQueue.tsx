'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import QRCode from 'qrcode';
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
  Tv,
  PauseCircle,
  UserX,
  ArrowRightLeft,
  RotateCcw,
  QrCode,
  HeartPulse,
  Sliders,
  LayoutGrid,
  Table as TableIcon,
  Activity,
  Calendar,
} from 'lucide-react';
import { patientApi } from '@/lib/api';
import { showSuccess, showInfo, showError } from '@/lib/notifications';
import { calculatePatientRiskScore } from '@/lib/patient-intelligence';
import { queueAudio } from '@/lib/queue-chime';
import OpdWaitingRoomTvDisplay from './OpdWaitingRoomTvDisplay';
import QuickTokenModal from './QuickTokenModal';
import TransferStationModal from './TransferStationModal';
import ChimeSettingsModal from './ChimeSettingsModal';
import OpdTokenA4PrintModal from './OpdTokenA4PrintModal';

export type QueueStage =
  | 'WAITING_VITALS'
  | 'PHLEBOTOMY'
  | 'CONSULTATION'
  | 'LAB_PROCESSING'
  | 'BILLING_DISPATCH'
  | 'COMPLETED';

export type QueueStatus =
  | 'WAITING'
  | 'CALLED'
  | 'IN_SERVICE'
  | 'ON_HOLD'
  | 'NO_SHOW'
  | 'COMPLETED';

export type QueuePriority =
  | 'ROUTINE'
  | 'FAST_TRACK'
  | 'SENIOR_CITIZEN'
  | 'PEDIATRIC'
  | 'VIP'
  | 'EMERGENCY';

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
  status: QueueStatus;
  priority: QueuePriority;
  createdAt: Date;
  calledAt?: Date;
  counterName: string;
  doctorName?: string;
  testsOrdered?: string[];
  fastingStatus?: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  holdReason?: string;
  callCount?: number;
  serviceRequested?: string;
}

const STORAGE_KEY = 'labcore_opd_live_queue_v5';

const STAGE_CONFIG: Record<
  QueueStage,
  { label: string; icon: any; badge: string; step: number }
> = {
  WAITING_VITALS: {
    label: 'Vitals & Triage',
    icon: Flame,
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    step: 1,
  },
  PHLEBOTOMY: {
    label: 'Sample Collection',
    icon: FlaskConical,
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    step: 2,
  },
  CONSULTATION: {
    label: 'Doctor OPD',
    icon: Stethoscope,
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    step: 3,
  },
  LAB_PROCESSING: {
    label: 'Lab Testing',
    icon: Clock,
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    step: 4,
  },
  BILLING_DISPATCH: {
    label: 'Billing & Reports',
    icon: CreditCard,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    step: 5,
  },
  COMPLETED: {
    label: 'Checked Out',
    icon: CheckCircle2,
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    step: 6,
  },
};

export default function OpdLiveQueue() {
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [rawPatients, setRawPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<QueueStage | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<QueueStatus | 'ALL'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentlyServing, setCurrentlyServing] = useState<QueueToken | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Modals & Settings
  const [isTvKioskOpen, setIsTvKioskOpen] = useState(false);
  const [isQuickTokenOpen, setIsQuickTokenOpen] = useState(false);
  const [isChimeSettingsOpen, setIsChimeSettingsOpen] = useState(false);
  const [transferToken, setTransferToken] = useState<QueueToken | null>(null);
  const [selectedTokenForSlip, setSelectedTokenForSlip] = useState<QueueToken | null>(null);
  const [slipQrDataUrl, setSlipQrDataUrl] = useState<string>('');

  // Persist tokens
  const persistTokens = useCallback((newTokens: QueueToken[]) => {
    setTokens(newTokens);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('labcore_opd_sync');
          bc.postMessage({ type: 'SYNC_TOKENS', tokens: newTokens });
          bc.close();
        }
      } catch (e) {
        console.warn('Storage sync error:', e);
      }
    }
  }, []);

  // Fetch initial queue data
  const fetchQueueData = useCallback(async () => {
    try {
      setLoading(true);

      // Check localStorage
      let storedTokens: QueueToken[] | null = null;
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              storedTokens = parsed.map((t: any) => ({
                ...t,
                createdAt: new Date(t.createdAt),
                calledAt: t.calledAt ? new Date(t.calledAt) : undefined,
              }));
            }
          } catch {}
        }
      }

      // Fetch active registered patients
      const res = await (patientApi.getAll as any)('?limit=30');
      const resData = (res as any)?.data || res;
      const patientList = resData?.patients || resData?.items || (Array.isArray(resData) ? resData : []);
      setRawPatients(patientList);

      if (storedTokens && storedTokens.length > 0) {
        setTokens(storedTokens);
        const inService = storedTokens.find((t) => t.status === 'CALLED' || t.status === 'IN_SERVICE');
        if (inService) setCurrentlyServing(inService);
        return;
      }

      // Synthesize realistic baseline tokens from active patients
      const generatedTokens: QueueToken[] = patientList.slice(0, 16).map((p: any, idx: number) => {
        const isEmergency = idx === 0 && (p.isCritical || p.patientType === 'VIP');
        const isVip = p.patientType === 'VIP' || idx === 2;
        const priority: QueuePriority = isEmergency
          ? 'EMERGENCY'
          : isVip
          ? 'VIP'
          : idx === 4
          ? 'SENIOR_CITIZEN'
          : idx === 6
          ? 'FAST_TRACK'
          : 'ROUTINE';

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

        const initialStatus: QueueStatus =
          assignedStage === 'COMPLETED'
            ? 'COMPLETED'
            : idx === 1
            ? 'CALLED'
            : idx === 2
            ? 'IN_SERVICE'
            : idx === 5
            ? 'ON_HOLD'
            : 'WAITING';

        const prefix =
          priority === 'EMERGENCY'
            ? 'EMG'
            : priority === 'VIP'
            ? 'VIP'
            : priority === 'SENIOR_CITIZEN'
            ? 'SNR'
            : 'T';

        const risk = calculatePatientRiskScore(p);

        return {
          id: p.id || `token-${idx + 1}`,
          tokenNumber: `${prefix}-${String(idx + 1).padStart(2, '0')}`,
          tokenIndex: idx + 1,
          patientId: p.id || `pat-${idx + 1}`,
          uhid: p.uhid || `LC-2026-000${idx + 1}`,
          patientName: `${p.title || 'Mr.'} ${p.firstName} ${p.lastName || ''}`.trim(),
          gender: p.gender || 'MALE',
          age: Number(p.age) || 35,
          phone: p.phone || '9876543210',
          stage: assignedStage,
          status: initialStatus,
          priority,
          createdAt: new Date(Date.now() - (idx * 10 + 5) * 60 * 1000),
          counterName:
            assignedStage === 'PHLEBOTOMY'
              ? 'Phlebotomy Booth 1'
              : assignedStage === 'CONSULTATION'
              ? 'OPD Cabin 101'
              : assignedStage === 'WAITING_VITALS'
              ? 'Triage & Vitals Desk'
              : 'Discharge Counter A',
          doctorName: 'Dr. Rajesh Sharma, MD',
          testsOrdered:
            idx % 2 === 0
              ? ['Complete Blood Count', 'Lipid Profile', 'HbA1c']
              : ['Thyroid Total', 'LFT', 'KFT'],
          fastingStatus: idx % 2 === 0 ? 'FASTING_12H' : 'RANDOM',
          riskScore: risk.score,
          riskLevel: risk.level,
          callCount: initialStatus === 'CALLED' ? 1 : 0,
        };
      });

      persistTokens(generatedTokens);
      const activeCall = generatedTokens.find((t) => t.status === 'CALLED' || t.status === 'IN_SERVICE');
      if (activeCall) setCurrentlyServing(activeCall);
    } catch (err) {
      console.error('Queue load error', err);
    } finally {
      setLoading(false);
    }
  }, [persistTokens]);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  // BroadcastChannel for instant multi-tab sync
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel('labcore_opd_sync');

    bc.onmessage = (event) => {
      if (event.data?.type === 'SYNC_TOKENS' && Array.isArray(event.data?.tokens)) {
        const synced = event.data.tokens.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          calledAt: t.calledAt ? new Date(t.calledAt) : undefined,
        }));
        setTokens(synced);
        const inService = synced.find((t: QueueToken) => t.status === 'CALLED' || t.status === 'IN_SERVICE');
        if (inService) setCurrentlyServing(inService);
      }
    };

    return () => {
      bc.close();
    };
  }, []);

  // Generate QR code for slip
  useEffect(() => {
    if (!selectedTokenForSlip) {
      setSlipQrDataUrl('');
      return;
    }

    const trackerUrl = `${window.location.origin}/patients/opd-queue?token=${selectedTokenForSlip.tokenNumber}&uhid=${selectedTokenForSlip.uhid}`;
    QRCode.toDataURL(trackerUrl, {
      width: 160,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => setSlipQrDataUrl(url))
      .catch((e) => console.warn('QR error:', e));
  }, [selectedTokenForSlip]);

  // Audio Dispatch Announcement
  const announceToken = useCallback(
    (token: QueueToken, counterOverride?: string) => {
      if (!soundEnabled) return;
      queueAudio.setMuted(false);
      queueAudio.announceToken({
        tokenNumber: token.tokenNumber,
        patientName: token.patientName,
        counterName: counterOverride || token.counterName,
      });
    },
    [soundEnabled]
  );

  // Call / Re-call Action
  const handleCallToken = (token: QueueToken) => {
    const updated = tokens.map((t) => {
      if (t.id === token.id) {
        return {
          ...t,
          status: 'CALLED' as QueueStatus,
          calledAt: new Date(),
          callCount: (t.callCount || 0) + 1,
        };
      }
      return t;
    });

    const activeToken = {
      ...token,
      status: 'CALLED' as QueueStatus,
      calledAt: new Date(),
      callCount: (token.callCount || 0) + 1,
    };

    setCurrentlyServing(activeToken);
    persistTokens(updated);
    announceToken(activeToken);
    showSuccess(`Calling Token ${token.tokenNumber}: ${token.patientName}`);
  };

  // Start In-Service
  const handleStartService = (tokenId: string) => {
    const updated = tokens.map((t) => (t.id === tokenId ? { ...t, status: 'IN_SERVICE' as QueueStatus } : t));
    persistTokens(updated);
    showInfo('Patient is now IN-SERVICE with doctor/technician');
  };

  // Hold Token Action
  const handleHoldToken = (tokenId: string) => {
    const updated = tokens.map((t) =>
      t.id === tokenId
        ? {
            ...t,
            status: 'ON_HOLD' as QueueStatus,
            holdReason: 'Awaiting Fasting Window (2h) / Ultrasound Preliminary',
          }
        : t
    );
    if (currentlyServing?.id === tokenId) setCurrentlyServing(null);
    persistTokens(updated);
    showInfo('Patient moved to ON-HOLD queue');
  };

  // Mark No-Show Action
  const handleNoShow = (tokenId: string) => {
    const updated = tokens.map((t) =>
      t.id === tokenId ? { ...t, status: 'NO_SHOW' as QueueStatus } : t
    );
    if (currentlyServing?.id === tokenId) setCurrentlyServing(null);
    persistTokens(updated);
    showError('Patient marked as NO-SHOW (Absent after call)');
  };

  // Recall / Restore Token
  const handleRestoreToken = (tokenId: string) => {
    const updated = tokens.map((t) =>
      t.id === tokenId ? { ...t, status: 'WAITING' as QueueStatus } : t
    );
    persistTokens(updated);
    showSuccess('Token restored to active waiting queue');
  };

  // Transfer Station
  const handleConfirmTransfer = (
    tokenId: string,
    newStage: QueueStage,
    newCounter: string,
    note?: string
  ) => {
    const updated = tokens.map((t) => {
      if (t.id !== tokenId) return t;
      return {
        ...t,
        stage: newStage,
        counterName: newCounter,
        status: 'WAITING' as QueueStatus,
        holdReason: note || undefined,
      };
    });
    if (currentlyServing?.id === tokenId) setCurrentlyServing(null);
    persistTokens(updated);
    showSuccess(`Transferred to ${newCounter}`);
  };

  // Advance Pipeline Stage
  const handleAdvanceStage = (tokenId: string) => {
    const stageOrder: QueueStage[] = [
      'WAITING_VITALS',
      'PHLEBOTOMY',
      'CONSULTATION',
      'LAB_PROCESSING',
      'BILLING_DISPATCH',
      'COMPLETED',
    ];

    const updated = tokens.map((t) => {
      if (t.id !== tokenId) return t;
      const currIndex = stageOrder.indexOf(t.stage);
      const nextIndex = Math.min(stageOrder.length - 1, currIndex + 1);
      const nextStage = stageOrder[nextIndex]!;
      const isComplete = nextStage === 'COMPLETED';

      return {
        ...t,
        stage: nextStage,
        status: (isComplete ? 'COMPLETED' : 'WAITING') as QueueStatus,
        counterName:
          nextStage === 'PHLEBOTOMY'
            ? 'Phlebotomy Booth 1'
            : nextStage === 'CONSULTATION'
            ? 'OPD Cabin 101'
            : nextStage === 'BILLING_DISPATCH'
            ? 'Discharge Counter A'
            : nextStage === 'COMPLETED'
            ? 'Discharged'
            : t.counterName,
      };
    });

    if (currentlyServing?.id === tokenId) {
      const nextServing = updated.find((t) => t.status === 'CALLED' || t.status === 'IN_SERVICE');
      setCurrentlyServing(nextServing || null);
    }

    persistTokens(updated);
    showInfo('Patient transitioned to next clinical workflow stage');
  };

  // New Token Created via Modal
  const handleTokenCreated = (newToken: QueueToken) => {
    const updated = [newToken, ...tokens];
    persistTokens(updated);
    setSelectedTokenForSlip(newToken);
    showSuccess(`Token ${newToken.tokenNumber} issued successfully!`);
  };

  // Filter Tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter((t) => {
      const matchesStage = activeStage === 'ALL' ? t.stage !== 'COMPLETED' : t.stage === activeStage;
      const matchesStatus = statusFilter === 'ALL' ? true : t.status === statusFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone.includes(searchQuery);

      return matchesStage && matchesStatus && matchesSearch;
    });
  }, [tokens, activeStage, statusFilter, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const inQueue = tokens.filter(
      (t) => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'IN_SERVICE'
    ).length;
    const completed = tokens.filter((t) => t.status === 'COMPLETED' || t.stage === 'COMPLETED').length;
    const emergency = tokens.filter((t) => t.priority === 'EMERGENCY').length;
    const onHold = tokens.filter((t) => t.status === 'ON_HOLD').length;
    const noShow = tokens.filter((t) => t.status === 'NO_SHOW').length;

    return {
      totalToday: tokens.length,
      inQueue,
      completedToday: completed,
      emergencyCount: emergency,
      onHoldCount: onHold,
      noShowCount: noShow,
      avgWaitMinutes: Math.max(3, Math.round(inQueue * 3.2)),
    };
  }, [tokens]);

  return (
    <div className="space-y-6 bg-slate-50/60 p-1 rounded-3xl">
      {/* -- Professional Hospital Header Ribbon (Medical White & Surgical Teal) -- */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          {/* Medical Shield Logo */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white flex items-center justify-center font-black shadow-md shadow-teal-600/20 shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M19 10.5h-5.5V5a1.5 1.5 0 0 0-3 0v5.5H5a1.5 1.5 0 0 0 0 3h5.5V19a1.5 1.5 0 0 0 3 0v-5.5H19a1.5 1.5 0 0 0 0-3z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                LABCORE MEDICAL DIAGNOSTICS & HOSPITAL OPD
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                Live Patient Flow
              </span>
              <span className="text-[11px] font-bold text-slate-400">NABL ISO 15189 Certified</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ambulatory Care Orchestrator: Registration  Vitals  Phlebotomy  OPD Doctor Consultations  Lab Core  Billing
            </p>
          </div>
        </div>

        {/* Action Tray */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Issue Walk-in Token */}
          <button
            type="button"
            onClick={() => setIsQuickTokenOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-sm transition flex items-center gap-2"
          >
            <Plus size={15} />
            <span>+ Issue Patient Token</span>
          </button>

          {/* Waiting Hall TV Signage */}
          <button
            type="button"
            onClick={() => setIsTvKioskOpen(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition flex items-center gap-1.5 shadow-2xs"
            title="Launch Fullscreen Waiting Hall TV Display"
          >
            <Tv size={15} className="text-teal-600" />
            <span>Waiting Hall TV Display</span>
          </button>

          {/* Audio Chime Settings */}
          <button
            type="button"
            onClick={() => setIsChimeSettingsOpen(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition flex items-center gap-1.5 shadow-2xs"
            title="Configure Acoustic Bells & Speech"
          >
            <Sliders size={14} className="text-slate-600" />
            <span>Chime Settings</span>
          </button>

          {/* Mute/Unmute */}
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              queueAudio.setMuted(!next);
            }}
            className={`p-2.5 rounded-xl text-xs font-bold border transition shadow-2xs ${
              soundEnabled
                ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Chime ON' : 'Muted'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Reload */}
          <button
            type="button"
            onClick={fetchQueueData}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-600 transition shadow-2xs"
            title="Refresh Live Token Status"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* -- KPI Hospital Metrics Strip (Pristine Light White & Color Badges) -- */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{metrics.totalToday}</span>
            <Users size={16} className="text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Clinic footfall today</p>
        </div>

        <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">In Active Line</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-teal-900">{metrics.inQueue}</span>
            <Clock size={16} className="text-teal-600" />
          </div>
          <p className="text-[10px] text-teal-600 mt-1">Waiting or In-Service</p>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Estimated Wait</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-900">{metrics.avgWaitMinutes}m</span>
            <Flame size={16} className="text-amber-600" />
          </div>
          <p className="text-[10px] text-amber-600 mt-1">Dynamic velocity estimate</p>
        </div>

        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">STAT / Emergency</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-900">{metrics.emergencyCount}</span>
            <Shield size={16} className="text-rose-600" />
          </div>
          <p className="text-[10px] text-rose-600 mt-1">Fast-track high priority</p>
        </div>

        <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">On-Hold / Missed</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-purple-900">
              {metrics.onHoldCount + metrics.noShowCount}
            </span>
            <PauseCircle size={16} className="text-purple-600" />
          </div>
          <p className="text-[10px] text-purple-600 mt-1">Awaiting fasting / recall</p>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Dispatched Today</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-900">{metrics.completedToday}</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">Discharged & reports ready</p>
        </div>
      </div>

      {/* -- Active "Now Serving" Calling Bay ------------------- */}
      {currentlyServing ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-50/90 via-white to-cyan-50/50 border-2 border-teal-500/60 shadow-md flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center font-black shadow-lg shrink-0 ring-4 ring-teal-500/20">
              <span className="text-[10px] uppercase font-black text-teal-400 tracking-wider">
                {currentlyServing.status === 'CALLED' ? 'CALLING' : 'SERVING'}
              </span>
              <span className="text-3xl tracking-tight leading-none mt-1 font-mono">
                {currentlyServing.tokenNumber}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  {currentlyServing.patientName}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 font-mono border border-slate-200">
                  {currentlyServing.uhid}
                </span>
                {currentlyServing.priority === 'EMERGENCY' && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-black uppercase tracking-wider animate-bounce">
                    STAT EMERGENCY
                  </span>
                )}
                {currentlyServing.priority === 'VIP' && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black uppercase tracking-wider">
                    VIP Priority
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                <span>{currentlyServing.gender} &middot; {currentlyServing.age} yrs</span>
                <span></span>
                <span>
                  Current Station:{' '}
                  <strong className="text-teal-800 font-bold bg-teal-100/80 px-2 py-0.5 rounded">
                    {currentlyServing.counterName}
                  </strong>
                </span>
                {currentlyServing.doctorName && (
                  <>
                    <span></span>
                    <span className="text-slate-700 font-semibold">{currentlyServing.doctorName}</span>
                  </>
                )}
              </p>

              {currentlyServing.testsOrdered && (
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <FlaskConical size={12} className="text-teal-600" />
                  <span>Prescribed: {currentlyServing.testsOrdered.join(', ')}</span>
                  {currentlyServing.fastingStatus && (
                    <span className="ml-2 font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      {currentlyServing.fastingStatus}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedTokenForSlip(currentlyServing)}
              className="px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-xs font-bold text-sky-800 border border-sky-200 shadow-2xs transition flex items-center gap-1.5"
            >
              <Printer size={15} className="text-sky-700" /> A4 Token Slip
            </button>
            <button
              type="button"
              onClick={() => announceToken(currentlyServing)}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 border border-slate-300 shadow-2xs transition flex items-center gap-1.5"
            >
              <Volume2 size={15} className="text-teal-600" /> Announce Again
            </button>

            {currentlyServing.status === 'CALLED' && (
              <button
                type="button"
                onClick={() => handleStartService(currentlyServing.id)}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-black text-white shadow-sm transition flex items-center gap-1.5"
              >
                <Check size={14} /> Start Service
              </button>
            )}

            <button
              type="button"
              onClick={() => setTransferToken(currentlyServing)}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-300 shadow-2xs transition flex items-center gap-1.5"
            >
              <ArrowRightLeft size={14} className="text-slate-500" /> Transfer
            </button>

            <button
              type="button"
              onClick={() => handleHoldToken(currentlyServing.id)}
              className="px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-800 border border-amber-200 transition flex items-center gap-1.5"
            >
              <PauseCircle size={14} /> Hold
            </button>

            <button
              type="button"
              onClick={() => handleAdvanceStage(currentlyServing.id)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-teal-700 text-xs font-black text-white shadow-sm transition flex items-center gap-1.5"
            >
              <span>Next Stage</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {/* -- Filters, Stage Tabs, Search & View Mode Switcher ---- */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Stage Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" style={{ scrollbarWidth: 'none' }}>
            <button
              type="button"
              onClick={() => setActiveStage('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeStage === 'ALL'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Active ({tokens.filter((t) => t.stage !== 'COMPLETED').length})
            </button>

            {(Object.keys(STAGE_CONFIG) as QueueStage[]).map((stg) => {
              const count = tokens.filter((t) => t.stage === stg && t.status !== 'COMPLETED').length;
              const cfg = STAGE_CONFIG[stg];
              const Icon = cfg.icon;
              return (
                <button
                  key={stg}
                  type="button"
                  onClick={() => setActiveStage(stg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    activeStage === stg
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={13} />
                  <span>{cfg.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-800 font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar & View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-600"
                placeholder="Search Token, Name, UHID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'CARDS' ? 'bg-white shadow-xs text-teal-700' : 'text-slate-500'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'TABLE' ? 'bg-white shadow-xs text-teal-700' : 'text-slate-500'
                }`}
                title="Clinical Table View"
              >
                <TableIcon size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Filter: Status Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider shrink-0">
            Status:
          </span>
          {(['ALL', 'WAITING', 'CALLED', 'IN_SERVICE', 'ON_HOLD', 'NO_SHOW', 'COMPLETED'] as const).map(
            (st) => {
              const count =
                st === 'ALL'
                  ? tokens.length
                  : tokens.filter((t) => t.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                    statusFilter === st
                      ? 'bg-teal-50 text-teal-700 border border-teal-200 font-extrabold'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {st.replace('_', ' ')} ({count})
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* -- Main Data View: Cards Grid OR Dense Table -------- */}
      {viewMode === 'TABLE' ? (
        /* Clinical Dense Table View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Token</th>
                <th className="py-3.5 px-4">Patient Information</th>
                <th className="py-3.5 px-4">Department / Room</th>
                <th className="py-3.5 px-4">Tests Prescribed</th>
                <th className="py-3.5 px-4">Wait Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No patient records found in this filter view.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token) => (
                  <tr
                    key={token.id}
                    className={`hover:bg-slate-50/80 transition ${
                      currentlyServing?.id === token.id ? 'bg-teal-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-black text-sm text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{token.tokenNumber}</span>
                        {token.priority === 'EMERGENCY' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700">
                            STAT
                          </span>
                        )}
                        {token.priority === 'VIP' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800">
                            VIP
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{token.patientName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {token.uhid} &middot; {token.gender} &middot; {token.age}y
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{token.counterName}</div>
                      <div className="text-[10px] text-slate-400">{token.doctorName}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="truncate max-w-[200px] text-slate-700">
                        {token.testsOrdered?.join(', ') || 'General Consultation'}
                      </div>
                      {token.fastingStatus && (
                        <span className="text-[10px] font-semibold text-amber-700">
                          {token.fastingStatus}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-amber-600">
                      {Math.max(1, Math.floor((Date.now() - token.createdAt.getTime()) / 60000))}m
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          token.status === 'CALLED'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : token.status === 'IN_SERVICE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : token.status === 'ON_HOLD'
                            ? 'bg-amber-100 text-amber-900'
                            : token.status === 'NO_SHOW'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {token.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTokenForSlip(token)}
                          className="px-2.5 py-1 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition flex items-center gap-1"
                          title="Print A4 Hospital Sheet / 80mm Token Slip"
                        >
                          <Printer size={13} /> A4 / Slip
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCallToken(token)}
                          className="px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition"
                        >
                          Call
                        </button>

                        {token.stage !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStage(token.id)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-teal-700 rounded-lg transition"
                          >
                            Advance
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTokens.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-3xl border border-dashed border-slate-300 bg-white">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Patients in this Filter</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust your stage filter or click "+ Issue Patient Token" above.
              </p>
            </div>
          ) : (
            filteredTokens.map((token) => {
              const stageCfg = STAGE_CONFIG[token.stage];
              const StageIcon = stageCfg.icon;
              const isCurrent = currentlyServing?.id === token.id;

              return (
                <div
                  key={token.id}
                  className={`p-4 rounded-3xl border transition-all duration-200 bg-white shadow-2xs hover:shadow-md flex flex-col justify-between ${
                    isCurrent
                      ? 'border-teal-500 ring-2 ring-teal-500/20'
                      : token.priority === 'EMERGENCY'
                      ? 'border-rose-300 bg-rose-50/10'
                      : token.status === 'ON_HOLD'
                      ? 'border-amber-300 bg-amber-50/10'
                      : token.status === 'NO_SHOW'
                      ? 'border-slate-300 bg-slate-50/70 opacity-75'
                      : 'border-slate-200/90'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-sm tracking-tight shadow-xs font-mono ${
                            token.priority === 'EMERGENCY'
                              ? 'bg-rose-600 text-white'
                              : token.priority === 'VIP'
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          {token.tokenNumber}
                        </span>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-black text-slate-900 tracking-tight">
                              {token.patientName}
                            </h4>
                            {token.priority === 'EMERGENCY' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                STAT
                              </span>
                            )}
                            {token.priority === 'VIP' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                VIP
                              </span>
                            )}
                            {token.priority === 'SENIOR_CITIZEN' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700">
                                SNR
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {token.uhid} &middot; {token.gender} &middot; {token.age}y
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${stageCfg.badge}`}
                        >
                          <StageIcon size={11} /> {stageCfg.label}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            token.status === 'CALLED'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : token.status === 'IN_SERVICE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : token.status === 'ON_HOLD'
                              ? 'bg-amber-200 text-amber-900'
                              : token.status === 'NO_SHOW'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {token.status}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Current Station:</span>
                        <strong className="text-slate-800 font-bold">{token.counterName}</strong>
                      </div>

                      {token.testsOrdered && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Tests:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[190px]">
                            {token.testsOrdered.join(', ')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Wait Duration:</span>
                        <span className="font-semibold text-amber-600 font-mono">
                          {Math.max(1, Math.floor((Date.now() - token.createdAt.getTime()) / 60000))} mins
                        </span>
                      </div>

                      {token.holdReason && (
                        <div className="p-1.5 rounded-xl bg-amber-50 text-[10px] text-amber-800 border border-amber-200">
                          Hold: {token.holdReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTokenForSlip(token)}
                        className="px-2.5 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition flex items-center gap-1"
                        title="Print A4 Hospital Sheet / 80mm Token Slip"
                      >
                        <Printer size={13} /> A4 / Slip
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferToken(token)}
                        className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                        title="Transfer Station"
                      >
                        <ArrowRightLeft size={15} />
                      </button>

                      {token.status !== 'NO_SHOW' && token.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => handleNoShow(token.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Mark No-Show"
                        >
                          <UserX size={15} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {token.status === 'NO_SHOW' ? (
                        <button
                          type="button"
                          onClick={() => handleRestoreToken(token.id)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition flex items-center gap-1"
                        >
                          <RotateCcw size={12} /> Recall
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCallToken(token)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 hover:bg-teal-50 border border-teal-200 transition flex items-center gap-1"
                          >
                            <Play size={12} fill="currentColor" /> Call
                          </button>

                          {token.stage !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStage(token.id)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-teal-700 transition flex items-center gap-1"
                            >
                              Advance <ArrowRight size={12} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* -- Waiting Hall TV Kiosk Display Modal ----------------- */}
      {isTvKioskOpen && (
        <OpdWaitingRoomTvDisplay
          tokens={tokens}
          currentlyServing={currentlyServing}
          onClose={() => setIsTvKioskOpen(false)}
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            queueAudio.setMuted(!next);
          }}
        />
      )}

      {/* -- Walk-in Quick Token Modal -------------------------- */}
      <QuickTokenModal
        isOpen={isQuickTokenOpen}
        onClose={() => setIsQuickTokenOpen(false)}
        onTokenCreated={handleTokenCreated}
        existingPatients={rawPatients}
      />

      {/* -- Transfer Station Modal ----------------------------- */}
      <TransferStationModal
        isOpen={Boolean(transferToken)}
        token={transferToken}
        onClose={() => setTransferToken(null)}
        onTransfer={handleConfirmTransfer}
      />

      {/* -- Audio Chime & Speech Settings Modal ---------------- */}
      <ChimeSettingsModal
        isOpen={isChimeSettingsOpen}
        onClose={() => setIsChimeSettingsOpen(false)}
      />

      {/* -- Thermal Slip Print Modal with 2D QR Code ------------ */}
      {selectedTokenForSlip && (
        <OpdTokenA4PrintModal
          token={selectedTokenForSlip}
          qrDataUrl={slipQrDataUrl}
          onClose={() => setSelectedTokenForSlip(null)}
        />
      )}
    </div>
  );
}