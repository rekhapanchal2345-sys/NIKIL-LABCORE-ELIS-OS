'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  Sliders,
  Info,
  X,
} from 'lucide-react';

export type ControlLevelKey = 'level1' | 'level2';
export type QcRunStatus = 'PASSED' | 'WARNING_1_2S' | 'VIOLATED';

export interface QcDataPoint {
  runId: string;
  runNumber: number;
  timestamp: string;
  controlLevel: 'LEVEL_1_NORMAL' | 'LEVEL_2_PATHOLOGICAL';
  lotNumber: string;
  analyzerId: string;
  measuredValue: number;
  targetMean: number;
  targetSd: number;
  zScore: number;
  status: QcRunStatus;
  triggeredRules: string[];
  primaryDirective: string;
  operatorId: string;
}

export interface LeveyJenningsLimits {
  targetMean: number;
  targetSd: number;
  observedMean: number;
  observedSd: number;
  cvPercentage: number;
  plus1s: number;
  minus1s: number;
  plus2s: number;
  minus2s: number;
  plus3s: number;
  minus3s: number;
}

export interface ControlLevelSeries {
  controlLevel: 'LEVEL_1_NORMAL' | 'LEVEL_2_PATHOLOGICAL';
  label: string;
  lotNumber: string;
  overallStatus: QcRunStatus;
  limits: LeveyJenningsLimits;
  dataPoints: QcDataPoint[];
  violations: Array<{
    rule: string;
    severity: 'REJECTION' | 'WARNING';
    errorType: string;
    description: string;
    clinicalDirective: string;
    involvedPointIndices: number[];
  }>;
  recommendedDirectives: string[];
}

export interface LeveyJenningsChartProps {
  testCode?: string;
  approvalId?: string;
  onClose?: () => void;
  initialData?: {
    testCode: string;
    testName: string;
    unit: string;
    runClearedForPatientTesting: boolean;
    overallSystemStatus: QcRunStatus;
    levels: {
      level1: ControlLevelSeries;
      level2: ControlLevelSeries;
    };
  };
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: QcDataPoint;
}

const CustomWestgardDot: React.FC<CustomDotProps> = ({ cx, cy, payload }) => {
  if (cx === undefined || cy === undefined || !payload) return null;

  if (payload.status === 'VIOLATED') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={9} fill="#ef4444" fillOpacity={0.25} />
        <circle
          cx={cx}
          cy={cy}
          r={5.5}
          fill="#ef4444"
          stroke="#ffffff"
          strokeWidth={2}
        />
      </g>
    );
  }

  if (payload.status === 'WARNING_1_2S') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#f59e0b" fillOpacity={0.25} />
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill="#f59e0b"
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      </g>
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#06b6d4"
      stroke="#0f172a"
      strokeWidth={1.5}
    />
  );
};

export const LeveyJenningsChart: React.FC<LeveyJenningsChartProps> = ({
  testCode = 'GLU',
  approvalId,
  onClose,
  initialData,
}) => {
  const [selectedTest, setSelectedTest] = useState<string>(testCode);
  const [activeLevel, setActiveLevel] = useState<ControlLevelKey>('level1');
  const [chartPayload, setChartPayload] = useState<LeveyJenningsChartProps['initialData'] | null>(
    initialData ?? null
  );
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchQcChart = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch(`${apiBase}/api/approvals/qc-chart/${code}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load QC series`);
      }
      const json = await response.json();
      if (json.success && json.data) {
        setChartPayload(json.data);
      } else {
        throw new Error(json.message || 'Invalid QC response structure');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to QC telemetry service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData || selectedTest !== testCode) {
      fetchQcChart(selectedTest);
    }
  }, [selectedTest]);

  const currentSeries: ControlLevelSeries | null = useMemo(() => {
    if (!chartPayload) return null;
    return chartPayload.levels[activeLevel];
  }, [chartPayload, activeLevel]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 text-slate-200 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 animate-spin text-cyan-400" />
            <span className="font-semibold tracking-wide">
              Loading CLSI C24-A4 Levey-Jennings Statistical Telemetry...
            </span>
          </div>
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-xl bg-slate-900/80" />
      </div>
    );
  }

  if (error || !chartPayload || !currentSeries) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-slate-950 p-6 text-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-400">
            <ShieldAlert className="h-6 w-6" />
            <div>
              <h3 className="font-bold">Statistical QC Telemetry Unavailable</h3>
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchQcChart(selectedTest)}
            className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/30"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { limits, dataPoints, violations, recommendedDirectives, overallStatus } =
    currentSeries;

  const yDomainMin = Number((limits.minus3s - limits.targetSd * 0.8).toFixed(2));
  const yDomainMax = Number((limits.plus3s + limits.targetSd * 0.8).toFixed(2));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
      {/* Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 ring-1 ring-cyan-500/30">
              <Sliders className="h-3.5 w-3.5" />
              NABL ISO 15189:2022 Clause 7.3
            </span>
            <h2 className="text-lg font-bold tracking-tight text-white">
              Levey-Jennings Westgard Multi-Rule Visualizer
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Assay: <strong className="text-slate-200">{chartPayload.testName}</strong> (
            {chartPayload.testCode}) • Lot:{' '}
            <span className="font-mono text-cyan-300">{currentSeries.lotNumber}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Assay Selector */}
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="GLU">GLU — Fasting Plasma Glucose</option>
            <option value="HBA1C">HBA1C — Glycated Hemoglobin</option>
            <option value="CREAT">CREAT — Serum Creatinine</option>
            <option value="K">K — Serum Potassium (ISE)</option>
            <option value="CBC001">CBC001 — Hemoglobin (XN-1000)</option>
          </select>

          {/* Level Toggle */}
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setActiveLevel('level1')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeLevel === 'level1'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Level 1 (Normal)
            </button>
            <button
              type="button"
              onClick={() => setActiveLevel('level2')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeLevel === 'level2'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Level 2 (Pathological)
            </button>
          </div>

          {/* Status Badge */}
          {overallStatus === 'PASSED' && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-4 w-4" />
              IN-CONTROL (PASSED)
            </span>
          )}
          {overallStatus === 'WARNING_1_2S' && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-400 ring-1 ring-amber-500/30">
              <AlertTriangle className="h-4 w-4" />
              WARNING (1-2s FLAG)
            </span>
          )}
          {overallStatus === 'VIOLATED' && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-400 ring-1 ring-rose-500/40">
              <ShieldAlert className="h-4 w-4" />
              WESTGARD VIOLATION (REJECT RUN)
            </span>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Statistical Summary Strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400">
            Target Mean (x̄)
          </span>
          <p className="mt-0.5 font-mono text-base font-bold text-white">
            {limits.targetMean} <span className="text-xs font-normal text-slate-400">{chartPayload.unit}</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400">
            Target SD (s)
          </span>
          <p className="mt-0.5 font-mono text-base font-bold text-cyan-400">
            ±{limits.targetSd} <span className="text-xs font-normal text-slate-400">{chartPayload.unit}</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400">
            Observed Mean
          </span>
          <p className="mt-0.5 font-mono text-base font-bold text-slate-200">
            {limits.observedMean}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400">
            Observed CV%
          </span>
          <p className="mt-0.5 font-mono text-base font-bold text-emerald-400">
            {limits.cvPercentage}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400">
            ±2s Action Zone
          </span>
          <p className="mt-0.5 font-mono text-xs font-semibold text-amber-300">
            {limits.minus2s} – {limits.plus2s}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400">
            ±3s Reject Limits
          </span>
          <p className="mt-0.5 font-mono text-xs font-semibold text-rose-400">
            {limits.minus3s} – {limits.plus3s}
          </p>
        </div>
      </div>

      {/* Recharts Levey-Jennings Visualizer */}
      <div className="mt-5 h-80 w-full rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dataPoints}
            margin={{ top: 15, right: 45, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

            {/* Shaded SD Zones */}
            <ReferenceArea
              y1={limits.minus1s}
              y2={limits.plus1s}
              fill="#10b981"
              fillOpacity={0.05}
            />
            <ReferenceArea
              y1={limits.plus1s}
              y2={limits.plus2s}
              fill="#f59e0b"
              fillOpacity={0.04}
            />
            <ReferenceArea
              y1={limits.minus2s}
              y2={limits.minus1s}
              fill="#f59e0b"
              fillOpacity={0.04}
            />
            <ReferenceArea
              y1={limits.plus2s}
              y2={limits.plus3s}
              fill="#ef4444"
              fillOpacity={0.06}
            />
            <ReferenceArea
              y1={limits.minus3s}
              y2={limits.minus2s}
              fill="#ef4444"
              fillOpacity={0.06}
            />

            <XAxis
              dataKey="runNumber"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(val) => `Run #${val}`}
              stroke="#334155"
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              stroke="#334155"
              width={55}
            />

            {/* Horizontal Reference Lines for Mean, ±1s, ±2s, ±3s */}
            <ReferenceLine
              y={limits.plus3s}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              label={{
                value: `+3s (${limits.plus3s})`,
                fill: '#f87171',
                fontSize: 10,
                position: 'right',
              }}
            />
            <ReferenceLine
              y={limits.plus2s}
              stroke="#f59e0b"
              strokeWidth={1.2}
              strokeDasharray="4 4"
              label={{
                value: `+2s (${limits.plus2s})`,
                fill: '#fbbf24',
                fontSize: 10,
                position: 'right',
              }}
            />
            <ReferenceLine
              y={limits.plus1s}
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="2 3"
              label={{
                value: `+1s (${limits.plus1s})`,
                fill: '#34d399',
                fontSize: 10,
                position: 'right',
              }}
            />
            <ReferenceLine
              y={limits.targetMean}
              stroke="#38bdf8"
              strokeWidth={2}
              label={{
                value: `Mean (${limits.targetMean})`,
                fill: '#38bdf8',
                fontSize: 11,
                position: 'right',
              }}
            />
            <ReferenceLine
              y={limits.minus1s}
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="2 3"
              label={{
                value: `-1s (${limits.minus1s})`,
                fill: '#34d399',
                fontSize: 10,
                position: 'right',
              }}
            />
            <ReferenceLine
              y={limits.minus2s}
              stroke="#f59e0b"
              strokeWidth={1.2}
              strokeDasharray="4 4"
              label={{
                value: `-2s (${limits.minus2s})`,
                fill: '#fbbf24',
                fontSize: 10,
                position: 'right',
              }}
            />
            <ReferenceLine
              y={limits.minus3s}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              label={{
                value: `-3s (${limits.minus3s})`,
                fill: '#f87171',
                fontSize: 10,
                position: 'right',
              }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const pt = payload[0].payload as QcDataPoint;
                return (
                  <div className="max-w-xs rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 text-xs text-slate-100 shadow-2xl backdrop-blur">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-bold text-cyan-400">
                        Run #{pt.runNumber} ({pt.runId.slice(-8)})
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          pt.status === 'VIOLATED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : pt.status === 'WARNING_1_2S'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {pt.status}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p>
                        Measured:{' '}
                        <strong className="font-mono text-white">
                          {pt.measuredValue} {chartPayload.unit}
                        </strong>
                      </p>
                      <p>
                        Z-Score (SDI):{' '}
                        <strong className="font-mono text-cyan-300">
                          {pt.zScore > 0 ? `+${pt.zScore}s` : `${pt.zScore}s`}
                        </strong>
                      </p>
                      {pt.triggeredRules.length > 0 && (
                        <p className="text-rose-400">
                          Rules Flagged: <strong>{pt.triggeredRules.join(', ')}</strong>
                        </p>
                      )}
                      <p className="mt-1.5 border-t border-slate-800 pt-1.5 text-[11px] leading-relaxed text-slate-300">
                        {pt.primaryDirective}
                      </p>
                    </div>
                  </div>
                );
              }}
            />

            <Line
              type="monotone"
              dataKey="measuredValue"
              stroke="#06b6d4"
              strokeWidth={2.2}
              dot={<CustomWestgardDot />}
              activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Actionable Clinical Directives */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Info className="h-4 w-4 text-cyan-400" />
            Actionable Clinical Directives (CLSI C24-A4)
          </h4>
          <ul className="mt-2.5 space-y-2 text-xs text-slate-300">
            {recommendedDirectives.map((dir, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5"
              >
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                <span>{dir}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Detected Westgard Rule Events ({violations.length})
          </h4>
          {violations.length === 0 ? (
            <p className="mt-3 text-xs text-emerald-400">
              Zero Westgard violations across the active analytical window.
            </p>
          ) : (
            <div className="mt-2.5 max-h-36 space-y-2 overflow-y-auto pr-1">
              {violations.map((v, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-2.5 text-xs ${
                    v.severity === 'REJECTION'
                      ? 'border-rose-500/40 bg-rose-950/20 text-rose-200'
                      : 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Rule {v.rule.replace('_', '-')}</span>
                    <span className="text-[10px] uppercase">{v.errorType}</span>
                  </div>
                  <p className="mt-1 text-[11px] opacity-90">{v.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeveyJenningsChart;
