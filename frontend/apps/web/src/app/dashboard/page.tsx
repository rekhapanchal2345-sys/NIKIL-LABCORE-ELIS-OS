'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboardlayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Activity,
  FlaskConical,
  Cpu,
  BedDouble,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  QrCode,
  FileCheck2,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  Microscope,
  Wifi,
  WifiOff,
  SlidersHorizontal,
  LayoutDashboard,
  Timer,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import * as ApiModule from '@/lib/api';
import { dashboardApi } from '@/lib/api';
import {
  HospitalMetricBar,
  DEFAULT_HOSPITAL_METRICS,
  HospitalMetricsData,
} from '@/components/dashboard/HospitalMetricBar';
import {
  ClinicalTriageDesk,
  INITIAL_TRIAGE_ITEMS,
  CriticalTriageItem,
} from '@/components/dashboard/ClinicalTriageDesk';
import TurnaroundTimeWidget from '@/components/dashboard/TurnaroundTimeWidget';
import ShiftHandoverReconciliation from '@/components/dashboard/ShiftHandoverReconciliation';

export type ClinicalPersona =
  | 'ALL'
  | 'RECEPTIONIST'
  | 'PHLEBOTOMIST'
  | 'PATHOLOGIST'
  | 'HOSPITAL_ADMIN';

export type DashboardView =
  | 'overview'
  | 'critical'
  | 'pipeline'
  | 'tat'
  | 'ward'
  | 'shift';

interface WardStatItem {
  id: string;
  wardName: string;
  wingCode: string;
  activeStatSamples: number;
  breachedCount: number;
  within30MinCount: number;
  within60MinCount: number;
  leadPhysician: string;
  bedHighlights: {
    bed: string;
    patient: string;
    test: string;
    tatRemainingMin: number;
  }[];
}

interface DepartmentPipelineRow {
  id: string;
  department: string;
  code: string;
  accessioned: number;
  runningOnAnalyzer: number;
  autoVerified: number;
  pendingDoctorSignOff: number;
  meanTatMin: number;
  slaTargetMin: number;
  westgardQcStatus: 'PASS_1_2S' | 'WARN_1_2S' | 'REJECT_1_3S';
}

interface AnalyzerTelemetryNode {
  id: string;
  name: string;
  model: string;
  protocol: 'ASTM E1394' | 'HL7 v2.5.1';
  department: string;
  status: 'ONLINE' | 'CALIBRATING' | 'OFFLINE';
  throughputPerHour: number;
  activeRack: string;
  reagentLevelPercent: number;
  lastHeartbeat: string;
}

const HOSPITAL_WARD_STAT_MATRIX: WardStatItem[] = [
  {
    id: 'ward-icu',
    wardName: 'Medical & Cardiac ICU',
    wingCode: 'ICU-BLK-A',
    activeStatSamples: 14,
    breachedCount: 0,
    within30MinCount: 9,
    within60MinCount: 5,
    leadPhysician: 'Dr. S. K. Deshmukh',
    bedHighlights: [
      {
        bed: 'ICU Bed 12',
        patient: 'Rajeshwari Devi',
        test: 'Troponin-I & Serum K+',
        tatRemainingMin: 13,
      },
      {
        bed: 'ICU Bed 04',
        patient: 'Mahendra Solanki',
        test: 'Arterial Blood Gas (ABG)',
        tatRemainingMin: 18,
      },
    ],
  },
  {
    id: 'ward-er',
    wardName: 'Emergency & Trauma Center',
    wingCode: 'ER-STAT-01',
    activeStatSamples: 19,
    breachedCount: 1,
    within30MinCount: 12,
    within60MinCount: 6,
    leadPhysician: 'Dr. R. K. Verma',
    bedHighlights: [
      {
        bed: 'Trauma Bay 02',
        patient: 'Harbhajan Singh',
        test: 'CBC + Crossmatch STAT',
        tatRemainingMin: 22,
      },
      {
        bed: 'ER Obs Bed 07',
        patient: 'Farida Begum',
        test: 'D-Dimer & PT/INR',
        tatRemainingMin: 41,
      },
    ],
  },
  {
    id: 'ward-nicu',
    wardName: 'Neonatal & Pediatric ICU (NICU)',
    wingCode: 'NICU-FL2',
    activeStatSamples: 8,
    breachedCount: 1,
    within30MinCount: 5,
    within60MinCount: 2,
    leadPhysician: 'Dr. Anjali Mehta',
    bedHighlights: [
      {
        bed: 'Incubator 04',
        patient: 'B/O Meena Patel',
        test: 'Neonatal Bilirubin & Glucose',
        tatRemainingMin: -4,
      },
      {
        bed: 'Warmer 02',
        patient: 'B/O Kavita Joshi',
        test: 'CRP High-Sensitivity',
        tatRemainingMin: 25,
      },
    ],
  },
  {
    id: 'ward-opd',
    wardName: 'Outpatient Fast-Track (OPD)',
    wingCode: 'OPD-WING-C',
    activeStatSamples: 27,
    breachedCount: 0,
    within30MinCount: 8,
    within60MinCount: 19,
    leadPhysician: 'Dr. Nikil MD (Path)',
    bedHighlights: [
      {
        bed: 'OPD Token #108',
        patient: 'Vikramaditya Sharma',
        test: 'HbA1c & Lipid Profile',
        tatRemainingMin: 48,
      },
      {
        bed: 'OPD Token #114',
        patient: 'Sushila Chaudhary',
        test: 'Thyroid Panel (TSH/FT4)',
        tatRemainingMin: 54,
      },
    ],
  },
];

const DEPARTMENT_PIPELINE_MATRIX: DepartmentPipelineRow[] = [
  {
    id: 'dept-heme',
    department: 'Hematology & Coagulation (CBC)',
    code: 'HEME-01',
    accessioned: 28,
    runningOnAnalyzer: 42,
    autoVerified: 89,
    pendingDoctorSignOff: 5,
    meanTatMin: 38,
    slaTargetMin: 60,
    westgardQcStatus: 'PASS_1_2S',
  },
  {
    id: 'dept-biochem',
    department: 'Clinical Biochemistry (LFT/RFT)',
    code: 'CHEM-02',
    accessioned: 36,
    runningOnAnalyzer: 54,
    autoVerified: 112,
    pendingDoctorSignOff: 4,
    meanTatMin: 56,
    slaTargetMin: 90,
    westgardQcStatus: 'PASS_1_2S',
  },
  {
    id: 'dept-immuno',
    department: 'Chemiluminescence Immunoassay',
    code: 'IMMU-03',
    accessioned: 18,
    runningOnAnalyzer: 24,
    autoVerified: 44,
    pendingDoctorSignOff: 3,
    meanTatMin: 74,
    slaTargetMin: 120,
    westgardQcStatus: 'WARN_1_2S',
  },
  {
    id: 'dept-micro',
    department: 'Clinical Pathology & Microbiology',
    code: 'MICR-04',
    accessioned: 12,
    runningOnAnalyzer: 12,
    autoVerified: 18,
    pendingDoctorSignOff: 2,
    meanTatMin: 82,
    slaTargetMin: 120,
    westgardQcStatus: 'PASS_1_2S',
  },
];

const ANALYZER_TELEMETRY_NODES: AnalyzerTelemetryNode[] = [
  {
    id: 'anlz-sysmex',
    name: 'Sysmex XN-1000',
    model: '6-Part Diff Hematology',
    protocol: 'ASTM E1394',
    department: 'Hematology',
    status: 'ONLINE',
    throughputPerHour: 96,
    activeRack: 'RACK-H08 (Slot 4/10)',
    reagentLevelPercent: 88,
    lastHeartbeat: '2 sec ago',
  },
  {
    id: 'anlz-cobas',
    name: 'Roche Cobas 6000 (c501/e601)',
    model: 'Photometric + ECLIA',
    protocol: 'HL7 v2.5.1',
    department: 'Biochemistry & Immunoassay',
    status: 'ONLINE',
    throughputPerHour: 240,
    activeRack: 'RACK-C14 (Slot 9/15)',
    reagentLevelPercent: 74,
    lastHeartbeat: '1 sec ago',
  },
  {
    id: 'anlz-mindray',
    name: 'Mindray BS-480',
    model: 'STAT Clinical Chemistry',
    protocol: 'ASTM E1394',
    department: 'Emergency STAT Lab',
    status: 'ONLINE',
    throughputPerHour: 115,
    activeRack: 'STAT-WHEEL-02',
    reagentLevelPercent: 92,
    lastHeartbeat: '4 sec ago',
  },
  {
    id: 'anlz-vitek',
    name: 'bioMérieux VITEK 2 Compact',
    model: 'Automated ID / AST System',
    protocol: 'HL7 v2.5.1',
    department: 'Microbiology',
    status: 'CALIBRATING',
    throughputPerHour: 32,
    activeRack: 'CAROUSEL-A',
    reagentLevelPercent: 61,
    lastHeartbeat: '12 sec ago',
  },
];

const PERSONA_SWITCHER_CARDS: {
  id: ClinicalPersona;
  title: string;
  subtitle: string;
  primaryActionLabel: string;
  primaryActionRoute: string;
}[] = [
  {
    id: 'ALL',
    title: 'Unified Hospital Cockpit',
    subtitle: 'Complete OPD/IPD/ICU & NABL overview',
    primaryActionLabel: 'Open Order Queue',
    primaryActionRoute: '/orders',
  },
  {
    id: 'RECEPTIONIST',
    title: 'Receptionist (OPD & Billing)',
    subtitle: 'Patient DPDP registration, ABHA & GST POS',
    primaryActionLabel: '+ New Patient / Bill',
    primaryActionRoute: '/patients/new',
  },
  {
    id: 'PHLEBOTOMIST',
    title: 'Phlebotomist (Tube Accession)',
    subtitle: 'Vacutainer barcoding & order-of-draw desk',
    primaryActionLabel: 'Scan & Collect Tube',
    primaryActionRoute: '/samples/tube-accessioning',
  },
  {
    id: 'PATHOLOGIST',
    title: 'Pathologist (MD Sign-Off)',
    subtitle: 'Panic read-back, delta check & NABL seal',
    primaryActionLabel: 'Review Sign-Offs',
    primaryActionRoute: '/approvals',
  },
  {
    id: 'HOSPITAL_ADMIN',
    title: 'Hospital Admin (TAT & Audit)',
    subtitle: 'SLA compliance, cash daybook & doctor tariff',
    primaryActionLabel: 'Shift Daybook Audit',
    primaryActionRoute: '/payments',
  },
];

const VIEW_TABS: {
  id: DashboardView;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}[] = [
  {
    id: 'overview',
    label: 'Lab Operations KPI',
    shortLabel: 'KPI Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'critical',
    label: 'Critical Alerts Triage',
    shortLabel: 'Panic Triage',
    icon: AlertOctagon,
    badge: 'Panic',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
  },
  {
    id: 'pipeline',
    label: 'Department Pipeline Matrix',
    shortLabel: 'Pipeline',
    icon: FlaskConical,
  },
  {
    id: 'tat',
    label: 'TAT Performance Monitor',
    shortLabel: 'TAT Monitor',
    icon: Clock,
    badge: 'SLA',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    id: 'ward',
    label: 'Ward STAT Queue',
    shortLabel: 'Ward STAT',
    icon: BedDouble,
  },
  {
    id: 'shift',
    label: 'Shift Handover Summary',
    shortLabel: 'Shift Close',
    icon: Receipt,
  },
];

function DashboardCockpitInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const urlView = (searchParams.get('view') as DashboardView) || 'overview';
  const [activeView, setActiveView] = useState<DashboardView>(urlView);

  useEffect(() => {
    if (urlView) {
      setActiveView(urlView);
    }
  }, [urlView]);

  const [activePersona, setActivePersona] = useState<ClinicalPersona>('ALL');
  const [metrics, setMetrics] = useState<HospitalMetricsData>(DEFAULT_HOSPITAL_METRICS);
  const [triageItems, setTriageItems] = useState<CriticalTriageItem[]>(INITIAL_TRIAGE_ITEMS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('Just now');

  const fetchCockpitTelemetry = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch unified hospital telemetry from backend
      const res = await dashboardApi.getMetrics();
      if (res && res.success && res.data) {
        setMetrics((prev) => ({
          ...prev,
          ...res.data,
        }));
      }

      setLastSyncedAt(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (e) {
      console.error('Failed to fetch cockpit telemetry', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCockpitTelemetry();
  }, [fetchCockpitTelemetry]);

  const handleSelectView = (viewId: DashboardView) => {
    setActiveView(viewId);
    if (viewId === 'overview') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard?view=${viewId}`);
    }
  };

  const handleAcknowledgePanic = async (
    itemId: string,
    recipientName: string,
    readBackNote: string
  ) => {
    try {
      await dashboardApi.acknowledgePanic({
        resultValueId: itemId,
        recipientName,
        readBackNote,
      });
      // Refresh telemetry
      fetchCockpitTelemetry();
    } catch (err) {
      console.error('Panic read-back acknowledgment failed', err);
    }
  };

  const activePersonaConfig =
    PERSONA_SWITCHER_CARDS.find((p) => p.id === activePersona) ||
    PERSONA_SWITCHER_CARDS[0];

  return (
    <ProtectedRoute>
      <DashboardLayout title="Hospital Clinical Laboratory Intelligence Cockpit">
        <div className="min-h-full bg-[#F8FAFC] text-[#0F172A] p-4 lg:p-6 space-y-6">
          {/* Top Clinical Command Bar & Sub-Navigation Views */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 lg:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-teal-50 text-[#0F766E] border border-teal-200">
                    NABL ISO 15189:2022 ACCREDITED
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-sky-50 text-[#0284C7] border border-sky-200">
                    ABDM / ABHA v0.5 GATEWAY READY
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-[#ECFDF5] text-[#059669] border border-emerald-200">
                    DPDP ACT 2023 COMPLIANT
                  </span>
                </div>
                <h1 className="text-lg lg:text-xl font-extrabold tracking-tight text-[#0F172A] mt-2">
                  Hospital Clinical Laboratory Intelligence Cockpit
                </h1>
                <p className="text-xs text-[#475569] mt-0.5">
                  Logged in as{' '}
                  <strong className="text-[#0F172A]">
                    {typeof user?.fullName === 'string'
                      ? user.fullName
                      : typeof user?.name === 'string'
                      ? user.name
                      : 'Dr. Nikil MD (Pathology)'}
                  </strong>{' '}
                  • Active Duty:{' '}
                  <strong className="text-[#0F766E]">
                    {activePersonaConfig.title}
                  </strong>{' '}
                  • Telemetry Synced: {lastSyncedAt}
                </p>
              </div>

              {/* Quick Action Triggers */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={fetchCockpitTelemetry}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200/80 bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#475569] transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-[#0F766E] ${
                      isRefreshing ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Sync Telemetry</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/patients/new')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100/70 text-[#0F766E] text-xs font-bold transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Register Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/samples/tube-accessioning')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100/70 text-[#0284C7] text-xs font-bold transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Tube Barcode Desk</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(activePersonaConfig.primaryActionRoute)
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F766E] hover:bg-teal-800 text-white text-xs font-bold transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{activePersonaConfig.primaryActionLabel}</span>
                </button>
              </div>
            </div>

            {/* Sub-Navigation View Selector Tabs (Matches Sidebar Children) */}
            <div className="pt-3 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#475569]">
                  DASHBOARD SUB-NAVIGATION VIEWS
                </span>
                <span className="text-[11px] font-medium text-[#0284C7]">
                  Jump directly to specialized clinical modules
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {VIEW_TABS.map((tab) => {
                  const isActive = activeView === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSelectView(tab.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-sm'
                          : 'bg-[#F8FAFC] text-[#475569] border-slate-200/80 hover:bg-white hover:text-[#0F172A]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#0F766E]'}`} />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            isActive
                              ? 'bg-white/20 text-white border-white/30'
                              : tab.badgeColor || 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role-Based Clinical Persona Switcher Bar */}
            <div className="pt-3 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#475569]">
                  ROLE-BASED CLINICAL WORKSTATION PERSONA
                </span>
                <span className="text-[11px] font-medium text-[#0284C7]">
                  Tailors cockpit widgets to active clinical duty
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {PERSONA_SWITCHER_CARDS.map((card) => {
                  const isSelected = activePersona === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setActivePersona(card.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-teal-50/70 border-[#0F766E] ring-1 ring-[#0F766E]/20'
                          : 'bg-[#F8FAFC] border-slate-200/80 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? 'text-[#0F766E]' : 'text-[#0F172A]'
                          }`}
                        >
                          {card.title}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#475569] mt-0.5 line-clamp-1">
                        {card.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 1. Unified Single-Source Hospital Metric Bar (Always Visible) */}
          <HospitalMetricBar
            metrics={metrics}
            onSelectCard={(key) => {
              if (key === 'PATIENTS') router.push('/patients');
              if (key === 'PIPELINE') handleSelectView('pipeline');
              if (key === 'PANIC') handleSelectView('critical');
              if (key === 'TAT') handleSelectView('tat');
              if (key === 'REVENUE') handleSelectView('shift');
            }}
          />

          {/* VIEW: CRITICAL ALERTS TRIAGE */}
          {(activeView === 'overview' || activeView === 'critical') && (
            <div className={activeView === 'critical' ? 'ring-2 ring-red-500/20 rounded-xl' : ''}>
              {(activePersona === 'ALL' ||
                activePersona === 'PATHOLOGIST' ||
                activePersona === 'HOSPITAL_ADMIN' ||
                activePersona === 'PHLEBOTOMIST') && (
                <ClinicalTriageDesk
                  items={triageItems}
                  onAcknowledgePanic={handleAcknowledgePanic}
                />
              )}
            </div>
          )}

          {/* VIEW: TAT PERFORMANCE MONITOR (Dedicated Widget) */}
          {(activeView === 'tat' || activeView === 'overview') && (
            <div className="space-y-4">
              <TurnaroundTimeWidget
                averageTatHours={Number((metrics.turnaroundTime.averageMinutes / 60).toFixed(1))}
                sampleStats={{
                  complianceRate: metrics.turnaroundTime.complianceRatePercent,
                  statAverageMinutes: metrics.turnaroundTime.statAverageMinutes,
                }}
              />
            </div>
          )}

          {/* VIEW: SHIFT HANDOVER & CASH RECONCILIATION */}
          {(activeView === 'shift' || activeView === 'overview') && (
            <div className="space-y-4">
              <ShiftHandoverReconciliation
                todayRevenue={metrics.revenueAndShift.netRevenueInr || 144950}
                pendingPayments={metrics.revenueAndShift.cashCollectedInr || 12400}
              />
            </div>
          )}

          {/* VIEW: WARD STAT QUEUE (Dedicated or Overview) */}
          {(activeView === 'overview' || activeView === 'ward') && (
            <section
              aria-label="Live Hospital Ward and Bed STAT Matrix"
              className="bg-white rounded-xl border border-slate-200/80 overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-[#0284C7]" />
                  <h2 className="text-sm font-extrabold text-[#0F172A] tracking-tight">
                    LIVE HOSPITAL WARD &amp; BED STAT SAMPLE MATRIX (ICU / ER / NICU / OPD)
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
                  <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]">
                    &lt; 30 MIN URGENT: 34
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-amber-200">
                    &lt; 60 MIN SLA: 32
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#DC2626] text-white">
                    BREACHED: 2
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
                {HOSPITAL_WARD_STAT_MATRIX.map((ward) => (
                  <div key={ward.id} className="p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-sky-50 text-[#0284C7] border border-sky-200">
                          {ward.wingCode}
                        </span>
                        <span className="text-xs font-extrabold text-[#0F172A]">
                          {ward.activeStatSamples} Active STAT
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] mt-2">
                        {ward.wardName}
                      </h3>
                      <p className="text-[11px] text-[#475569]">
                        In-Charge: {ward.leadPhysician}
                      </p>

                      <div className="grid grid-cols-3 gap-1.5 mt-3">
                        <div className="px-2 py-1 rounded bg-[#FEF2F2] border border-[#FCA5A5] text-center">
                          <span className="block text-xs font-extrabold text-[#DC2626]">
                            {ward.within30MinCount}
                          </span>
                          <span className="text-[9px] font-bold uppercase text-[#DC2626]">
                            &lt;30m SLA
                          </span>
                        </div>
                        <div className="px-2 py-1 rounded bg-[#FFFBEB] border border-amber-200 text-center">
                          <span className="block text-xs font-extrabold text-[#D97706]">
                            {ward.within60MinCount}
                          </span>
                          <span className="text-[9px] font-bold uppercase text-[#D97706]">
                            &lt;60m SLA
                          </span>
                        </div>
                        <div
                          className={`px-2 py-1 rounded border text-center ${
                            ward.breachedCount > 0
                              ? 'bg-[#DC2626] text-white border-[#DC2626]'
                              : 'bg-[#ECFDF5] text-[#059669] border-emerald-200'
                          }`}
                        >
                          <span className="block text-xs font-extrabold">
                            {ward.breachedCount}
                          </span>
                          <span className="text-[9px] font-bold uppercase">
                            Breached
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-[#475569]">
                        PRIORITY BED SAMPLES
                      </span>
                      {ward.bedHighlights.map((bedItem, idx) => {
                        const isBreached = bedItem.tatRemainingMin <= 0;
                        const isUnder30 =
                          bedItem.tatRemainingMin > 0 && bedItem.tatRemainingMin <= 30;
                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-[#F8FAFC] border border-slate-200/80 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-[#0F172A]">
                                  {bedItem.bed}
                                </span>
                                <span className="text-[11px] text-[#475569] truncate">
                                  • {bedItem.patient}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#475569] truncate">
                                {bedItem.test}
                              </p>
                            </div>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded shrink-0 ${
                                isBreached
                                  ? 'bg-[#DC2626] text-white'
                                  : isUnder30
                                  ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]'
                                  : 'bg-[#FFFBEB] text-[#D97706] border border-amber-200'
                              }`}
                            >
                              {isBreached
                                ? `BREACH ${Math.abs(bedItem.tatRemainingMin)}m`
                                : `${bedItem.tatRemainingMin}m left`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* VIEW: DEPARTMENT PIPELINE MATRIX & ANALYZER TELEMETRY */}
          {(activeView === 'overview' || activeView === 'pipeline') && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left 2 Columns: Specimen Pipeline & Department Matrix */}
              <section
                aria-label="Department Specimen Pipeline Matrix"
                className="xl:col-span-2 bg-white rounded-xl border border-slate-200/80 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-[#0F766E]" />
                      <h2 className="text-sm font-extrabold text-[#0F172A] tracking-tight">
                        SPECIMEN PIPELINE &amp; CLINICAL DEPARTMENT MATRIX
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/results')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline"
                    >
                      <span>Open Workstations</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 bg-[#F8FAFC]/60 text-[10px] font-bold tracking-wider uppercase text-[#475569]">
                          <th className="py-3 px-4">Clinical Department</th>
                          <th className="py-3 px-3 text-center">Accessioned</th>
                          <th className="py-3 px-3 text-center">In Analyzer</th>
                          <th className="py-3 px-3 text-center">Auto-Verified</th>
                          <th className="py-3 px-3 text-center">MD Sign-Off</th>
                          <th className="py-3 px-3 text-center">Mean TAT</th>
                          <th className="py-3 px-4 text-right">Westgard QC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 text-xs">
                        {DEPARTMENT_PIPELINE_MATRIX.map((row) => (
                          <tr
                            key={row.id}
                            className="hover:bg-[#F8FAFC] transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#0F172A]">
                                {row.department}
                              </div>
                              <div className="text-[10px] font-mono text-[#475569]">
                                {row.code} • SLA Target &lt;{row.slaTargetMin}m
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono font-bold text-[#D97706]">
                              {row.accessioned}
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono font-bold text-[#0284C7]">
                              {row.runningOnAnalyzer}
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono font-bold text-[#059669]">
                              {row.autoVerified}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-50 text-[#0284C7] border border-sky-200">
                                {row.pendingDoctorSignOff}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="font-mono font-bold text-[#0F172A]">
                                {row.meanTatMin}m
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded border ${
                                  row.westgardQcStatus === 'PASS_1_2S'
                                    ? 'bg-[#ECFDF5] text-[#059669] border-emerald-200'
                                    : 'bg-[#FFFBEB] text-[#D97706] border-amber-200'
                                }`}
                              >
                                {row.westgardQcStatus === 'PASS_1_2S'
                                  ? 'LJ QC PASS'
                                  : '1-2S WARN'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="px-5 py-3 bg-[#F8FAFC] border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#059669]" />
                    <span>
                      CLSI AUTO10-A Autoverification Engine Active (84.2% Pass Rate)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/approvals')}
                    className="font-bold text-[#0284C7] hover:underline"
                  >
                    Batch Sign-Off 14 Verified Reports &rarr;
                  </button>
                </div>
              </section>

              {/* Right Column: Lightweight Analyzer Telemetry Health Indicator */}
              <section
                aria-label="Analyzer Telemetry Status"
                className="bg-white rounded-xl border border-slate-200/80 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#0284C7]" />
                      <h2 className="text-sm font-extrabold text-[#0F172A] tracking-tight">
                        ANALYZER TELEMETRY (ASTM / HL7)
                      </h2>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-[#ECFDF5] text-[#059669] border border-emerald-200">
                      4 INSTRUMENTS
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200/80">
                    {ANALYZER_TELEMETRY_NODES.map((node) => {
                      const isOnline = node.status === 'ONLINE';
                      const isCalibrating = node.status === 'CALIBRATING';
                      return (
                        <div
                          key={node.id}
                          className="p-3.5 hover:bg-[#F8FAFC] transition-colors space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[#0F172A]">
                                  {node.name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-[#475569]">
                                  {node.protocol}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#475569]">
                                {node.department} • {node.activeRack}
                              </p>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded border ${
                                isOnline
                                  ? 'bg-[#ECFDF5] text-[#059669] border-emerald-200'
                                  : isCalibrating
                                  ? 'bg-[#FFFBEB] text-[#D97706] border-amber-200'
                                  : 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
                              }`}
                            >
                              {isOnline ? (
                                <Wifi className="w-3 h-3" />
                              ) : (
                                <WifiOff className="w-3 h-3" />
                              )}
                              {node.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#475569]">
                            <span>
                              Throughput:{' '}
                              <strong className="text-[#0F172A]">
                                {node.throughputPerHour} tests/hr
                              </strong>
                            </span>
                            <span>
                              Reagent:{' '}
                              <strong className="text-[#0F766E]">
                                {node.reagentLevelPercent}%
                              </strong>
                            </span>
                            <span className="font-mono text-[10px]">
                              Ping: {node.lastHeartbeat}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="px-5 py-3 bg-[#F8FAFC] border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-[#475569]">TCP Socket Listener: Port 5000</span>
                  <button
                    type="button"
                    onClick={() => router.push('/analyzers')}
                    className="inline-flex items-center gap-1 font-bold text-[#0F766E] hover:underline"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Configure Drivers</span>
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function DashboardCockpitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 text-[#0F766E] animate-spin" />
            <span className="text-xs font-bold text-[#475569]">
              Loading Hospital Clinical Intelligence Cockpit...
            </span>
          </div>
        </div>
      }
    >
      <DashboardCockpitInner />
    </Suspense>
  );
}
