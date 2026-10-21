'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Activity,
  AlertTriangle,
  Cpu,
  User,
  PhoneCall,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Volume2,
  VolumeX,
  Wifi,
  ChevronRight,
  Layers,
  Zap,
  Barcode,
  CheckCircle2,
} from 'lucide-react';

// ============================================================================
// TYPES & CLINICAL COMMAND DATA CONTRACTS
// ============================================================================
export type CommandCategory =
  | 'ALL'
  | 'CRITICAL_PANIC'
  | 'PATIENTS'
  | 'ANALYZERS'
  | 'QUARANTINE_BARCODES'
  | 'HARDWARE_ACTIONS';

export interface OmniCommandItem {
  id: string;
  category: Exclude<CommandCategory, 'ALL'>;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeVariant: 'critical' | 'emerald' | 'amber' | 'blue' | 'purple';
  keywords: string[];
  routePath?: string;
  metadata: {
    mrn?: string;
    abhaId?: string;
    phone?: string;
    analyzerPort?: string;
    ipAddress?: string;
    barcode?: string;
    panicValue?: string;
    parameter?: string;
  };
  actionHandler?: () => void;
}

export interface PipelineTelemetryMetrics {
  networkThroughputKbps: number;
  serialPacketFps: number;
  activeAnalyzersCount: number;
  totalAnalyzersCount: number;
  unacknowledgedPanicCount: number;
  quarantinedBarcodesCount: number;
}

interface OmniCommandPaletteProps {
  currentRole?: 'CHIEF_PATHOLOGIST' | 'BIOMEDICAL_ENGINEER' | 'STAT_TECHNOLOGIST';
  activeRoute?: string;
  onNavigate?: (path: string, preservedState: Record<string, unknown>) => void;
  onExecuteHardwareCommand?: (commandId: string, payload: Record<string, unknown>) => void;
}

// ============================================================================
// REAL-WORLD CLINICAL SEED DATA FOR OMNI-SEARCH
// ============================================================================
const CLINICAL_COMMAND_REGISTRY: OmniCommandItem[] = [
  // CRITICAL PANIC ALERTS
  {
    id: 'PANIC-901',
    category: 'CRITICAL_PANIC',
    title: 'PANIC HIGH POTASSIUM: 6.8 mmol/L — Rajeshwari Iyer (64F)',
    subtitle: 'ICU Bed 04 • Barcode #SMP-1092 • Cobas Pro c503 • Unacknowledged (3m elapsed)',
    badgeText: 'HH PANIC CALL',
    badgeVariant: 'critical',
    keywords: ['panic', 'critical', 'potassium', 'k+', '6.8', 'rajeshwari', 'iyer', 'smp-1092', 'icu'],
    routePath: '/approvals/panic-triage?sample=SMP-1092',
    metadata: {
      mrn: 'MRN-2026-8841',
      phone: '+91-98450-11223',
      barcode: 'SMP-1092',
      panicValue: '6.8 mmol/L',
      parameter: 'Potassium (K+)',
    },
  },
  {
    id: 'PANIC-902',
    category: 'CRITICAL_PANIC',
    title: 'PANIC LOW PLATELETS: 18 x10³/µL — Vikramaditya Menon (41M)',
    subtitle: 'Oncology Ward B • Barcode #SMP-1104 • Sysmex XN-1000 • Read-Back Required',
    badgeText: 'LL PANIC CALL',
    badgeVariant: 'critical',
    keywords: ['panic', 'platelets', 'plt', '18', 'vikramaditya', 'menon', 'smp-1104', 'sysmex'],
    routePath: '/approvals/panic-triage?sample=SMP-1104',
    metadata: {
      mrn: 'MRN-2026-7719',
      phone: '+91-98201-44910',
      barcode: 'SMP-1104',
      panicValue: '18 x10³/µL',
      parameter: 'Platelet Count (PLT)',
    },
  },
  // PATIENTS (MRN, Name, Phone, ABHA ID)
  {
    id: 'PAT-101',
    category: 'PATIENTS',
    title: 'Rajeshwari Iyer • MRN-2026-8841',
    subtitle: 'ABHA: 91-4421-8890-1234 • Phone: +91-98450-11223 • 64Y Female • ICU-04',
    badgeText: 'ABDM VERIFIED',
    badgeVariant: 'emerald',
    keywords: ['rajeshwari', 'iyer', 'mrn-2026-8841', '91-4421-8890-1234', '9845011223', 'patient'],
    routePath: '/patients/MRN-2026-8841',
    metadata: {
      mrn: 'MRN-2026-8841',
      abhaId: '91-4421-8890-1234',
      phone: '+91-98450-11223',
    },
  },
  {
    id: 'PAT-102',
    category: 'PATIENTS',
    title: 'Aravind Swaminathan • MRN-2026-9102',
    subtitle: 'ABHA: 91-7732-1029-4451 • Phone: +91-94441-88219 • 52Y Male • OPD Cardiology',
    badgeText: 'STAT ORDER',
    badgeVariant: 'blue',
    keywords: ['aravind', 'swaminathan', 'mrn-2026-9102', '91-7732-1029-4451', '9444188219'],
    routePath: '/patients/MRN-2026-9102',
    metadata: {
      mrn: 'MRN-2026-9102',
      abhaId: '91-7732-1029-4451',
      phone: '+91-94441-88219',
    },
  },
  // ANALYZERS (Names, Status, COM Ports, IP Addresses)
  {
    id: 'ANLZ-01',
    category: 'ANALYZERS',
    title: 'Roche Cobas Pro c503 / e801 (Core Biochemistry)',
    subtitle: 'ASTM E1381/E1394 • TCP 192.168.10.45:5001 (COM3 Bridge) • 115200 8N1 • ONLINE',
    badgeText: 'ONLINE • 42 FPS',
    badgeVariant: 'emerald',
    keywords: ['roche', 'cobas', 'c503', 'e801', '192.168.10.45', '5001', 'com3', 'astm'],
    routePath: '/analyzers/COBAS-PRO-01',
    metadata: {
      analyzerPort: 'COM3 / TCP:5001',
      ipAddress: '192.168.10.45:5001',
    },
  },
  {
    id: 'ANLZ-02',
    category: 'ANALYZERS',
    title: 'Sysmex XN-1000 Hematology Analyzer',
    subtitle: 'HL7 v2.5.1 MLLP • TCP 192.168.10.48:6002 • Bidirectional Host Query • ONLINE',
    badgeText: 'MLLP ACTIVE',
    badgeVariant: 'emerald',
    keywords: ['sysmex', 'xn-1000', 'hematology', '192.168.10.48', '6002', 'hl7', 'mllp'],
    routePath: '/analyzers/SYSMEX-XN-01',
    metadata: {
      analyzerPort: 'TCP:6002',
      ipAddress: '192.168.10.48:6002',
    },
  },
  {
    id: 'ANLZ-03',
    category: 'ANALYZERS',
    title: 'Abbott Architect i2000SR Immunoassay',
    subtitle: 'ASTM E1381 Serial • /dev/ttyUSB1 (COM4) • 9600 8N1 • Westgard 2-2s Lockout on TSH',
    badgeText: 'QC LOCKOUT',
    badgeVariant: 'amber',
    keywords: ['abbott', 'architect', 'i2000sr', 'com4', 'ttyusb1', 'lockout', 'tsh'],
    routePath: '/analyzers/ARCHITECT-I2000',
    metadata: {
      analyzerPort: 'COM4 (/dev/ttyUSB1)',
      ipAddress: '192.168.10.52:4001',
    },
  },
  // UNMATCHED BARCODE TUBE QUARANTINE QUEUE
  {
    id: 'QUAR-301',
    category: 'QUARANTINE_BARCODES',
    title: 'Unmatched Barcode #SMP-8891 (Rack B-09)',
    subtitle: 'Scanned on Cobas Pro c503 • Host Query returned 0 pending orders • Held in Quarantine',
    badgeText: 'QUARANTINED',
    badgeVariant: 'amber',
    keywords: ['unmatched', 'quarantine', 'barcode', 'smp-8891', 'rack b-09'],
    routePath: '/samples/tube-accessioning?quarantine=SMP-8891',
    metadata: {
      barcode: 'SMP-8891',
    },
  },
  {
    id: 'QUAR-302',
    category: 'QUARANTINE_BARCODES',
    title: 'Hemolyzed Quarantine #SMP-1077 (H-Index: 240 mg/dL)',
    subtitle: 'CLSI EP07-A2 Suppression on Potassium & LDH • Recollection Notification Pending',
    badgeText: 'HEMOLYZED (H:240)',
    badgeVariant: 'critical',
    keywords: ['hemolyzed', 'quarantine', 'smp-1077', 'h-index', 'recollect'],
    routePath: '/samples/tube-accessioning?quarantine=SMP-1077',
    metadata: {
      barcode: 'SMP-1077',
    },
  },
  // QUICK HARDWARE & CLINICAL ACTIONS
  {
    id: 'ACT-FORCE-QC',
    category: 'HARDWARE_ACTIONS',
    title: 'Force QC Calibration & Clear Westgard Circuit Breaker',
    subtitle: 'Dispatch 2-Level Control Calibration packet to Abbott Architect i2000SR (COM4)',
    badgeText: 'CMD • CALIBRATE',
    badgeVariant: 'purple',
    keywords: ['force', 'qc', 'calibration', 'westgard', 'unlock', 'architect'],
    metadata: {
      analyzerPort: 'COM4',
    },
  },
  {
    id: 'ACT-FLUSH-SERIAL',
    category: 'HARDWARE_ACTIONS',
    title: 'Flush RS-232 / MLLP Serial Frame Buffer & Send <EOT>',
    subtitle: 'Resets ASTM E1381 FSM state to IDLE and clears hung intermediate <ETB> buffers',
    badgeText: 'CMD • BUFFER FLUSH',
    badgeVariant: 'purple',
    keywords: ['flush', 'serial', 'buffer', 'eot', 'reset', 'fsm', 'com3'],
    metadata: {
      analyzerPort: 'ALL_PORTS',
    },
  },
  {
    id: 'ACT-RERUN-1092',
    category: 'HARDWARE_ACTIONS',
    title: 'Rerun Barcode #SMP-1092 with 1:5 Auto-Dilution',
    subtitle: 'Injects ASTM Host Order (O) record to Cobas Pro c503 Rack A-04 with Dilution=5.0',
    badgeText: 'CMD • RERUN 1:5',
    badgeVariant: 'blue',
    keywords: ['rerun', 'barcode', 'smp-1092', 'dilution', 'cobas', 'order'],
    metadata: {
      barcode: 'SMP-1092',
    },
  },
];

// ============================================================================
// FUZZY SCORING & HIGHLIGHTING ENGINE
// ============================================================================
function computeFuzzyMatchScore(item: OmniCommandItem, rawQuery: string): number {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 100;

  const tokens = query.split(/\s+/);
  const searchableBlob = [
    item.title,
    item.subtitle,
    item.badgeText,
    ...item.keywords,
    item.metadata.mrn || '',
    item.metadata.abhaId || '',
    item.metadata.phone || '',
    item.metadata.barcode || '',
    item.metadata.ipAddress || '',
    item.metadata.analyzerPort || '',
  ]
    .join(' ')
    .toLowerCase();

  let totalScore = 0;

  for (const token of tokens) {
    if (item.title.toLowerCase().includes(token)) {
      totalScore += 50;
      if (item.title.toLowerCase().startsWith(token)) totalScore += 25;
    } else if (searchableBlob.includes(token)) {
      totalScore += 30;
    } else {
      // Subsequence character fuzzy check
      let charIdx = 0;
      for (let i = 0; i < searchableBlob.length && charIdx < token.length; i++) {
        if (searchableBlob[i] === token[charIdx]) {
          charIdx++;
        }
      }
      if (charIdx === token.length) {
        totalScore += 12;
      } else {
        return 0; // Token did not match
      }
    }
  }

  // Boost critical panic items to surface at top of clinical searches
  if (item.category === 'CRITICAL_PANIC') {
    totalScore += 15;
  }

  return totalScore;
}

export const OmniCommandPalette: React.FC<OmniCommandPaletteProps> = ({
  currentRole = 'CHIEF_PATHOLOGIST',
  activeRoute = '/analyzers/live-cockpit',
  onNavigate,
  onExecuteHardwareCommand,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CommandCategory>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Cross-tab preserved state (persisted in sessionStorage so switching views never loses filters)
  const [preservedWorkspaceState, setPreservedWorkspaceState] = useState<{
    activeAnalyzerFilter: string;
    snifferStreamingEnabled: boolean;
    lastVisitedPaths: string[];
  }>({
    activeAnalyzerFilter: 'ALL_ANALYZERS',
    snifferStreamingEnabled: true,
    lastVisitedPaths: ['/dashboard', '/analyzers', '/approvals/panic-triage'],
  });

  // Live Pipeline Telemetry Metrics
  const [telemetry, setTelemetry] = useState<PipelineTelemetryMetrics>({
    networkThroughputKbps: 1420,
    serialPacketFps: 64,
    activeAnalyzersCount: 7,
    totalAnalyzersCount: 8,
    unacknowledgedPanicCount: 2,
    quarantinedBarcodesCount: 2,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Restore cross-tab state on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('NIKIL_LABCORE_COCKPIT_STATE');
      if (saved) {
        setPreservedWorkspaceState(JSON.parse(saved));
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }, []);

  const updatePreservedState = useCallback(
    (patch: Partial<typeof preservedWorkspaceState>) => {
      setPreservedWorkspaceState((prev) => {
        const next = { ...prev, ...patch };
        try {
          sessionStorage.setItem('NIKIL_LABCORE_COCKPIT_STATE', JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
        return next;
      });
    },
    []
  );

  // Simulate live hardware telemetry jitter
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        networkThroughputKbps: Math.max(480, prev.networkThroughputKbps + Math.floor(Math.random() * 140 - 70)),
        serialPacketFps: Math.max(18, Math.min(120, prev.serialPacketFps + Math.floor(Math.random() * 11 - 5))),
      }));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Web Audio API Clinical Panic Chime Synthesizer (IEC 60601-1-8 inspired dual-tone alert)
  const triggerClinicalPanicAudioChime = useCallback(() => {
    if (audioMuted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const freqs = [880, 1174.66, 880]; // A5 -> D6 -> A5 clinical priority triad
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(0.08, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.13);
      });
    } catch {
      // AudioContext blocked until user interaction
    }
  }, [audioMuted]);

  // Filtered & Fuzzy-Ranked Command List
  const filteredCommands = useMemo(() => {
    return CLINICAL_COMMAND_REGISTRY.filter((item) =>
      selectedCategory === 'ALL' ? true : item.category === selectedCategory
    )
      .map((item) => ({
        item,
        score: computeFuzzyMatchScore(item, searchQuery),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [searchQuery, selectedCategory]);

  // Reset selection index on filter change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, selectedCategory]);

  // Execute Selected Item
  const handleExecuteItem = useCallback(
    (item: OmniCommandItem) => {
      if (item.category === 'CRITICAL_PANIC') {
        triggerClinicalPanicAudioChime();
      }

      if (item.category === 'HARDWARE_ACTIONS') {
        onExecuteHardwareCommand?.(item.id, item.metadata);
        setActionFeedback(`Executed: ${item.title}`);
        setTimeout(() => setActionFeedback(null), 3500);
        setIsOpen(false);
        return;
      }

      if (item.routePath) {
        const updatedPaths = Array.from(
          new Set([item.routePath, ...preservedWorkspaceState.lastVisitedPaths])
        ).slice(0, 6);
        updatePreservedState({ lastVisitedPaths: updatedPaths });
        onNavigate?.(item.routePath, preservedWorkspaceState);
        setActionFeedback(`Routed to ${item.routePath} (Workspace filters preserved)`);
        setTimeout(() => setActionFeedback(null), 3000);
        setIsOpen(false);
      }
    },
    [
      onExecuteHardwareCommand,
      onNavigate,
      preservedWorkspaceState,
      triggerClinicalPanicAudioChime,
      updatePreservedState,
    ]
  );

  // Global Keyboard Listeners (Ctrl+K / Cmd+K, ArrowUp, ArrowDown, Enter, Escape, Tab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          if (next) {
            setTimeout(() => inputRef.current?.focus(), 20);
          }
          return next;
        });
        return;
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length > 0
            ? (prev - 1 + filteredCommands.length) % filteredCommands.length
            : 0
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const categories: CommandCategory[] = [
          'ALL',
          'CRITICAL_PANIC',
          'PATIENTS',
          'ANALYZERS',
          'QUARANTINE_BARCODES',
          'HARDWARE_ACTIONS',
        ];
        const currentIdx = categories.indexOf(selectedCategory);
        setSelectedCategory(categories[(currentIdx + 1) % categories.length]);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        handleExecuteItem(filteredCommands[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, selectedCategory, handleExecuteItem]);

  const breadcrumbSegments = useMemo(() => {
    return activeRoute
      .split('/')
      .filter(Boolean)
      .map((seg) => seg.toUpperCase().replace(/-/g, ' '));
  }, [activeRoute]);

  return (
    <div className="w-full bg-slate-950 text-slate-100 border-b border-slate-800 select-none">
      {/* =================================================================== */}
      {/* PERSISTENT DIAGNOSTIC PIPELINE STATUS BAR & ROLE-AWARE BREADCRUMBS  */}
      {/* =================================================================== */}
      <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Role Badge + Smart Breadcrumbs */}
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            {currentRole.replace(/_/g, ' ')}
          </span>

          <nav aria-label="Clinical Breadcrumbs" className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">NIKIL-LABCORE-OS</span>
            {breadcrumbSegments.map((seg, idx) => (
              <React.Fragment key={seg + idx}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span
                  className={
                    idx === breadcrumbSegments.length - 1
                      ? 'text-cyan-400 font-semibold'
                      : 'text-slate-400'
                  }
                >
                  {seg}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Center: Omni-Command Trigger Button (Ctrl + K) */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 20);
          }}
          className="flex items-center justify-between gap-6 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 text-xs text-slate-300 transition-all shadow-inner group min-w-[280px] sm:min-w-[360px]"
        >
          <span className="flex items-center gap-2 text-slate-400 group-hover:text-slate-200">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search MRN, ABHA, Analyzer IP, Panic Alerts, Commands...</span>
          </span>
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-800 text-cyan-300 rounded border border-slate-600">
            Ctrl + K
          </kbd>
        </button>

        {/* Right: Live Hardware Pipeline Telemetry Bar */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Net:</span>
            <span className="font-mono font-semibold text-emerald-300">
              {(telemetry.networkThroughputKbps / 1000).toFixed(2)} Mbps
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Serial:</span>
            <span className="font-mono font-semibold text-cyan-300">
              {telemetry.serialPacketFps} FPS
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Analyzers:</span>
            <span className="font-mono font-semibold text-white">
              {telemetry.activeAnalyzersCount}/{telemetry.totalAnalyzersCount}
            </span>
          </div>

          {/* Unacknowledged Panic Counter with Audio Chime Trigger */}
          <button
            type="button"
            onClick={() => {
              triggerClinicalPanicAudioChime();
              setSelectedCategory('CRITICAL_PANIC');
              setIsOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900/80 border border-rose-500/60 text-rose-200 font-semibold animate-pulse"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{telemetry.unacknowledgedPanicCount} PANIC</span>
          </button>

          <button
            type="button"
            onClick={() => setAudioMuted((m) => !m)}
            title={audioMuted ? 'Unmute Clinical Alert Audio' : 'Mute Clinical Alert Audio'}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Action Confirmation Banner */}
      {actionFeedback && (
        <div className="bg-emerald-950/90 border-t border-emerald-500/40 px-4 py-1.5 text-xs text-emerald-200 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* OMNI-COMMAND CLINICAL PALETTE MODAL OVERLAY                         */}
      {/* =================================================================== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Search Input Header */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
              <Search className="w-5 h-5 text-cyan-400 mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type MRN, Patient Name, ABHA ID, Analyzer IP/COM, Barcode #SMP-1092, or Hardware Action..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 mr-2"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700 hover:text-white"
              >
                ESC
              </button>
            </div>

            {/* Category Filter Pills (Tab Cycled) */}
            <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border-b border-slate-800 overflow-x-auto">
              {(
                [
                  { key: 'ALL', label: 'All Clinical Entities' },
                  { key: 'CRITICAL_PANIC', label: 'Panic Alerts (2)' },
                  { key: 'PATIENTS', label: 'Patients & ABHA' },
                  { key: 'ANALYZERS', label: 'Analyzers & COM/IP' },
                  { key: 'QUARANTINE_BARCODES', label: 'Quarantine Tubes' },
                  { key: 'HARDWARE_ACTIONS', label: 'Hardware Commands' },
                ] as Array<{ key: CommandCategory; label: string }>
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                    selectedCategory === tab.key
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Results List */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-800/60">
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No matching clinical records, analyzers, or commands for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                filteredCommands.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleExecuteItem(item)}
                      className={`px-4 py-3 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-800/90' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                          {item.category === 'CRITICAL_PANIC' && (
                            <PhoneCall className="w-4 h-4 text-rose-400 animate-bounce" />
                          )}
                          {item.category === 'PATIENTS' && (
                            <User className="w-4 h-4 text-emerald-400" />
                          )}
                          {item.category === 'ANALYZERS' && (
                            <Cpu className="w-4 h-4 text-cyan-400" />
                          )}
                          {item.category === 'QUARANTINE_BARCODES' && (
                            <Barcode className="w-4 h-4 text-amber-400" />
                          )}
                          {item.category === 'HARDWARE_ACTIONS' && (
                            <Zap className="w-4 h-4 text-purple-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-100 truncate">
                              {item.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                                item.badgeVariant === 'critical'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : item.badgeVariant === 'emerald'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : item.badgeVariant === 'amber'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : item.badgeVariant === 'purple'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              }`}
                            >
                              {item.badgeText}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{item.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                            <span>Execute</span>
                            <CornerDownLeft className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Keyboard Guide & Preserved State Indicator */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-slate-300" />
                  <ArrowDown className="w-3 h-3 text-slate-300" />
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3 text-slate-300" />
                  <span>Execute / Route</span>
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">
                    Tab
                  </kbd>{' '}
                  Switch Category
                </span>
              </div>

              <div className="text-slate-500 font-mono">
                State Sync: Sniffer={preservedWorkspaceState.snifferStreamingEnabled ? 'LIVE' : 'PAUSED'} • Recent={preservedWorkspaceState.lastVisitedPaths.length} tabs
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OmniCommandPalette;
