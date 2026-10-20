'use client';

import React from 'react';
import {
  Users,
  TestTube2,
  AlertOctagon,
  Clock,
  IndianRupee,
  ArrowUpRight,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export interface HospitalMetricsData {
  patientsToday: {
    total: number;
    opd: number;
    ipd: number;
    emergency: number;
    trendPercent: number;
  };
  specimenPipeline: {
    totalActive: number;
    accessioned: number;
    processing: number;
    approved: number;
  };
  criticalPanic: {
    unacknowledgedCount: number;
    acknowledgedToday: number;
    slaReadbackTargetMin: number;
  };
  turnaroundTime: {
    averageMinutes: number;
    slaTargetMinutes: number;
    complianceRatePercent: number;
    statAverageMinutes: number;
  };
  revenueAndShift: {
    netRevenueInr: number;
    cashCollectedInr: number;
    upiAndCardInr: number;
    gstSynced: boolean;
    shiftStatus: 'OPEN' | 'RECONCILING' | 'CLOSED';
  };
}

export interface HospitalMetricBarProps {
  metrics?: HospitalMetricsData;
  isLoading?: boolean;
  onSelectCard?: (
    metricKey: 'PATIENTS' | 'PIPELINE' | 'PANIC' | 'TAT' | 'REVENUE'
  ) => void;
}

export const DEFAULT_HOSPITAL_METRICS: HospitalMetricsData = {
  patientsToday: {
    total: 342,
    opd: 218,
    ipd: 86,
    emergency: 38,
    trendPercent: 12.4,
  },
  specimenPipeline: {
    totalActive: 489,
    accessioned: 94,
    processing: 132,
    approved: 263,
  },
  criticalPanic: {
    unacknowledgedCount: 3,
    acknowledgedToday: 19,
    slaReadbackTargetMin: 15,
  },
  turnaroundTime: {
    averageMinutes: 64,
    slaTargetMinutes: 90,
    complianceRatePercent: 96.8,
    statAverageMinutes: 24,
  },
  revenueAndShift: {
    netRevenueInr: 284650,
    cashCollectedInr: 92400,
    upiAndCardInr: 192250,
    gstSynced: true,
    shiftStatus: 'OPEN',
  },
};

export function HospitalMetricBar({
  metrics = DEFAULT_HOSPITAL_METRICS,
  isLoading = false,
  onSelectCard,
}: HospitalMetricBarProps) {
  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const hasActivePanic = metrics.criticalPanic.unacknowledgedCount > 0;
  const isTatWithinSla =
    metrics.turnaroundTime.averageMinutes <=
    metrics.turnaroundTime.slaTargetMinutes;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="h-32 bg-white rounded-xl border border-slate-200/80 p-4 animate-pulse flex flex-col justify-between"
          >
            <div className="h-3 w-28 bg-slate-200 rounded" />
            <div className="h-7 w-20 bg-slate-200 rounded" />
            <div className="h-3 w-full bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section
      aria-label="Unified Clinical & Hospital KPI Bar"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5"
    >
      {/* 1. Active Patients Today (OPD vs IPD vs Emergency) */}
      <div
        onClick={() => onSelectCard?.('PATIENTS')}
        className="bg-white rounded-xl border border-slate-200/80 p-4 hover:border-[#0F766E] transition-colors cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#475569]">
            1. ACTIVE PATIENTS TODAY
          </span>
          <div className="p-1.5 rounded-lg bg-teal-50 text-[#0F766E] border border-teal-200/60">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              {metrics.patientsToday.total}
            </span>
            <span className="inline-flex items-center text-[11px] font-bold text-[#059669]">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />+
              {metrics.patientsToday.trendPercent}%
            </span>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-slate-100 text-[#475569]">
            UHID SYNC
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-[11px]">
          <div>
            <span className="text-[#475569]">OPD: </span>
            <strong className="text-[#0F172A]">
              {metrics.patientsToday.opd}
            </strong>
          </div>
          <div>
            <span className="text-[#475569]">IPD: </span>
            <strong className="text-[#0284C7]">
              {metrics.patientsToday.ipd}
            </strong>
          </div>
          <div>
            <span className="text-[#475569]">ER: </span>
            <strong className="text-[#DC2626]">
              {metrics.patientsToday.emergency}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Samples in Pipeline (Accessioned -> Processing -> Approved) */}
      <div
        onClick={() => onSelectCard?.('PIPELINE')}
        className="bg-white rounded-xl border border-slate-200/80 p-4 hover:border-[#0284C7] transition-colors cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#475569]">
            2. SPECIMENS IN PIPELINE
          </span>
          <div className="p-1.5 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-200/60">
            <TestTube2 className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              {metrics.specimenPipeline.totalActive}
            </span>
            <span className="text-xs font-medium text-[#475569]">Tubes</span>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-sky-50 text-[#0284C7] border border-sky-200">
            BARCODED
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-[11px]">
          <div>
            <span className="text-[#475569]">Acc: </span>
            <strong className="text-[#D97706]">
              {metrics.specimenPipeline.accessioned}
            </strong>
          </div>
          <div>
            <span className="text-[#475569]">Run: </span>
            <strong className="text-[#0284C7]">
              {metrics.specimenPipeline.processing}
            </strong>
          </div>
          <div>
            <span className="text-[#475569]">Sign: </span>
            <strong className="text-[#059669]">
              {metrics.specimenPipeline.approved}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Critical Panic Value Count (Red blinking pill if > 0) */}
      <div
        onClick={() => onSelectCard?.('PANIC')}
        className={`rounded-xl border p-4 transition-colors cursor-pointer flex flex-col justify-between ${
          hasActivePanic
            ? 'bg-[#FEF2F2] border-[#FCA5A5] hover:border-[#DC2626]'
            : 'bg-white border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${
              hasActivePanic ? 'text-[#DC2626]' : 'text-[#475569]'
            }`}
          >
            3. CRITICAL PANIC VALUES
          </span>
          <div
            className={`p-1.5 rounded-lg border ${
              hasActivePanic
                ? 'bg-white text-[#DC2626] border-[#FCA5A5]'
                : 'bg-emerald-50 text-[#059669] border-emerald-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold tracking-tight ${
                hasActivePanic ? 'text-[#DC2626]' : 'text-[#0F172A]'
              }`}
            >
              {metrics.criticalPanic.unacknowledgedCount}
            </span>
            <span
              className={`text-xs font-semibold ${
                hasActivePanic ? 'text-[#DC2626]' : 'text-[#475569]'
              }`}
            >
              Unacknowledged
            </span>
          </div>

          {hasActivePanic ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-[#DC2626] text-white animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              HH / LL ALERT
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-[#ECFDF5] text-[#059669]">
              ALL CLEAR
            </span>
          )}
        </div>

        <div
          className={`flex items-center justify-between pt-2 border-t text-[11px] ${
            hasActivePanic ? 'border-red-200/80 text-red-900' : 'border-slate-100 text-[#475569]'
          }`}
        >
          <span>ISO Read-back SLA: &lt;{metrics.criticalPanic.slaReadbackTargetMin}m</span>
          <strong className="font-semibold">
            {metrics.criticalPanic.acknowledgedToday} ACK Today
          </strong>
        </div>
      </div>

      {/* 4. Average Turnaround Time (TAT) with SLA Benchmark (< 90 min) */}
      <div
        onClick={() => onSelectCard?.('TAT')}
        className="bg-white rounded-xl border border-slate-200/80 p-4 hover:border-[#0F766E] transition-colors cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#475569]">
            4. MEAN TURNAROUND (TAT)
          </span>
          <div className="p-1.5 rounded-lg bg-teal-50 text-[#0F766E] border border-teal-200/60">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              {metrics.turnaroundTime.averageMinutes}
            </span>
            <span className="text-xs font-semibold text-[#475569]">min</span>
            <span className="text-[11px] text-slate-400">
              / {metrics.turnaroundTime.slaTargetMinutes}m SLA
            </span>
          </div>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded border ${
              isTatWithinSla
                ? 'bg-[#ECFDF5] text-[#059669] border-emerald-200'
                : 'bg-[#FFFBEB] text-[#D97706] border-amber-200'
            }`}
          >
            {metrics.turnaroundTime.complianceRatePercent}% SLA
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-[#475569]">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-[#0F766E]" />
            ICU STAT Mean:
          </span>
          <strong className="text-[#0F766E] font-bold">
            {metrics.turnaroundTime.statAverageMinutes} min
          </strong>
        </div>
      </div>

      {/* 5. Today's Net Revenue & Cash Shift Status (Synced with GST Engine) */}
      <div
        onClick={() => onSelectCard?.('REVENUE')}
        className="bg-white rounded-xl border border-slate-200/80 p-4 hover:border-[#059669] transition-colors cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#475569]">
            5. NET REVENUE & SHIFT
          </span>
          <div className="p-1.5 rounded-lg bg-[#ECFDF5] text-[#059669] border border-emerald-200">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <span className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
            {formatINR(metrics.revenueAndShift.netRevenueInr)}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-[#ECFDF5] text-[#059669] border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            SHIFT {metrics.revenueAndShift.shiftStatus}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-[#475569]">
          <span>
            Cash: <strong className="text-[#0F172A]">{formatINR(metrics.revenueAndShift.cashCollectedInr)}</strong>
          </span>
          <span className="text-[#059669] font-semibold">GST Synced</span>
        </div>
      </div>
    </section>
  );
}

export default HospitalMetricBar;
