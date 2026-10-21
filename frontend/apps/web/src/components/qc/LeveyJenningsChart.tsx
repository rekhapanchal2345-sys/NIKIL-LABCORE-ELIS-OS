'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Activity,
  Layers,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { approvalApi } from '@/lib/api';

export interface LeveyJenningsDataPoint {
  runIndex: number;
  runDate: string;
  measuredValue: number;
  zScore: number;
  controlLevel: 'LEVEL_1_NORMAL' | 'LEVEL_2_ABNORMAL';
  lotNumber: string;
  isOutlier: boolean;
  status: string;
  rulesViolated: string[];
}

export interface LeveyJenningsSeries {
  testCode: string;
  testName: string;
  parameterCode: string;
  parameterName: string;
  unit: string;
  analyzerCode: string;
  analyzerName: string;
  controlLevel: 'LEVEL_1_NORMAL' | 'LEVEL_2_ABNORMAL';
  lotNumber: string;
  targetMean: number;
  targetSd: number;
  calculatedMean: number;
  calculatedSd: number;
  cvPercentage: number;
  ucl3: number;
  ucl2: number;
  ucl1: number;
  mean: number;
  lcl1: number;
  lcl2: number;
  lcl3: number;
  points: LeveyJenningsDataPoint[];
  westgardStatus: 'PASSED' | 'WARNING' | 'OUT_OF_CONTROL';
  activeViolations: string[];
  recommendation: string;
}

export interface LeveyJenningsChartProps {
  testCode?: string;
  approvalId?: string;
  parameterCode?: string;
  onClose?: () => void;
}

export default function LeveyJenningsChart({
  testCode = 'K',
  approvalId,
  parameterCode,
  onClose,
}: LeveyJenningsChartProps) {
  const [level, setLevel] = useState<'level1' | 'level2'>('level1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qcData, setQcData] = useState<{
    testCode: string;
    testName: string;
    unit: string;
    level1: LeveyJenningsSeries;
    level2: LeveyJenningsSeries;
    overallStatus: string;
  } | null>(null);

  const fetchQcData = async () => {
    try {
      setLoading(true);
      setError(null);
      let res: any;
      if (approvalId) {
        res = await approvalApi.getQcChart(approvalId, parameterCode);
      } else {
        res = await approvalApi.getTestQcChart(testCode, parameterCode);
      }

      if (res?.success && res.data) {
        setQcData(res.data);
      } else {
        setError(res?.message || 'Failed to load Levey-Jennings QC data');
      }
    } catch (err: any) {
      console.error('Failed to fetch LJ QC chart:', err);
      setError(err?.message || 'Error communicating with QC server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQcData();
  }, [testCode, approvalId, parameterCode]);

  const activeSeries: LeveyJenningsSeries | undefined =
    qcData ? (level === 'level1' ? qcData.level1 : qcData.level2) : undefined;

  // Custom Dot renderer for Recharts
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    const isViolated = payload.isOutlier || (payload.rulesViolated && payload.rulesViolated.length > 0 && !payload.rulesViolated.every((r: string) => r.startsWith('1_2s')));
    const isWarning = payload.status === 'WARNING_1_2S';

    let fillColor = '#06b6d4'; // cyan
    let strokeColor = '#0891b2';
    let radius = 4;

    if (isViolated) {
      fillColor = '#ef4444'; // red
      strokeColor = '#ffffff';
      radius = 6;
    } else if (isWarning) {
      fillColor = '#f59e0b'; // amber
      strokeColor = '#ffffff';
      radius = 5;
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1.5}
      />
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-slate-100 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Activity className="h-4 w-4" />
            <span>NABL ISO 15189:2022 &middot; Daily Statistical Quality Control</span>
          </div>
          <h2 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
            <span>Levey-Jennings Chart &amp; Westgard Multi-Rules</span>
            {activeSeries && (
              <span className="rounded-md bg-cyan-950/80 px-2 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-800/50">
                {activeSeries.testCode} ({activeSeries.unit})
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical shift &amp; drift evaluation with 6 Westgard multi-rules (1:2s, 1:3s, 2:2s, R:4s, 4:1s, 10:x).
          </p>
        </div>

        {/* Level Controls & Action */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setLevel('level1')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                level === 'level1'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Level 1 (Normal)
            </button>
            <button
              type="button"
              onClick={() => setLevel('level2')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                level === 'level2'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Level 2 (Abnormal)
            </button>
          </div>

          <button
            type="button"
            onClick={fetchQcData}
            disabled={loading}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Refresh QC telemetry"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading && !qcData ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <span className="text-xs font-bold text-slate-400">Loading Levey-Jennings QC Telemetry...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchQcData}
            className="rounded-lg bg-red-900/40 px-3 py-1 font-bold text-white hover:bg-red-800 transition"
          >
            Retry
          </button>
        </div>
      ) : activeSeries ? (
        <div className="space-y-4">
          {/* Key Metric Tiles Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Target Mean (x̄)</span>
              <p className="text-base font-extrabold text-white mt-0.5">
                {activeSeries.targetMean}{' '}
                <span className="text-[10px] font-normal text-slate-400">{activeSeries.unit}</span>
              </p>
              <span className="text-[10px] text-slate-500">Lot: {activeSeries.lotNumber}</span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Target SD (1σ)</span>
              <p className="text-base font-extrabold text-cyan-400 mt-0.5">
                ±{activeSeries.targetSd}{' '}
                <span className="text-[10px] font-normal text-slate-400">{activeSeries.unit}</span>
              </p>
              <span className="text-[10px] text-slate-500">2σ = {(activeSeries.targetSd * 2).toFixed(2)}</span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Calculated Mean</span>
              <p className="text-base font-extrabold text-slate-200 mt-0.5">
                {activeSeries.calculatedMean}
              </p>
              <span className="text-[10px] text-slate-500">
                Δ = {(activeSeries.calculatedMean - activeSeries.targetMean).toFixed(2)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Calculated SD</span>
              <p className="text-base font-extrabold text-slate-200 mt-0.5">
                {activeSeries.calculatedSd}
              </p>
              <span className="text-[10px] text-slate-500">from 25 runs</span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Coefficient of Var</span>
              <p className="text-base font-extrabold text-amber-300 mt-0.5">
                {activeSeries.cvPercentage}%
              </p>
              <span className="text-[10px] text-slate-500">NABL Tol: &lt;5.0%</span>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Westgard Verdict</span>
              <div className="mt-1">
                {activeSeries.westgardStatus === 'PASSED' ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950 px-2 py-0.5 text-xs font-black text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 className="h-3 w-3" />
                    PASS (IN-CONTROL)
                  </span>
                ) : activeSeries.westgardStatus === 'WARNING' ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-950 px-2 py-0.5 text-xs font-black text-amber-300 border border-amber-500/40">
                    <AlertTriangle className="h-3 w-3" />
                    1:2s WARNING
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-950 px-2 py-0.5 text-xs font-black text-red-300 border border-red-500 animate-pulse">
                    <AlertOctagon className="h-3 w-3" />
                    REJECTION
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Levey-Jennings Interactive Chart Canvas */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activeSeries.points}
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  
                  <XAxis
                    dataKey="runIndex"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `Run ${val}`}
                  />
                  
                  <YAxis
                    domain={[
                      Number((activeSeries.lcl3 - activeSeries.targetSd * 0.5).toFixed(2)),
                      Number((activeSeries.ucl3 + activeSeries.targetSd * 0.5).toFixed(2)),
                    ]}
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => Number(val).toFixed(activeSeries.targetMean > 10 ? 1 : 2)}
                  />

                  {/* Levey-Jennings Control Limits Lines */}
                  {/* +3SD (Red Rejection) */}
                  <ReferenceLine
                    y={activeSeries.ucl3}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: `+3SD (${activeSeries.ucl3})`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                  />

                  {/* +2SD (Amber Warning) */}
                  <ReferenceLine
                    y={activeSeries.ucl2}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    label={{ value: `+2SD (${activeSeries.ucl2})`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
                  />

                  {/* +1SD */}
                  <ReferenceLine
                    y={activeSeries.ucl1}
                    stroke="#334155"
                    strokeDasharray="2 2"
                    strokeWidth={1}
                  />

                  {/* Mean Centerline (Cyan Bold) */}
                  <ReferenceLine
                    y={activeSeries.mean}
                    stroke="#06b6d4"
                    strokeWidth={2}
                    label={{ value: `Mean: ${activeSeries.mean}`, fill: '#06b6d4', fontSize: 11, position: 'insideTopLeft' }}
                  />

                  {/* -1SD */}
                  <ReferenceLine
                    y={activeSeries.lcl1}
                    stroke="#334155"
                    strokeDasharray="2 2"
                    strokeWidth={1}
                  />

                  {/* -2SD (Amber Warning) */}
                  <ReferenceLine
                    y={activeSeries.lcl2}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    label={{ value: `-2SD (${activeSeries.lcl2})`, fill: '#f59e0b', fontSize: 10, position: 'insideBottomRight' }}
                  />

                  {/* -3SD (Red Rejection) */}
                  <ReferenceLine
                    y={activeSeries.lcl3}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: `-3SD (${activeSeries.lcl3})`, fill: '#ef4444', fontSize: 10, position: 'insideBottomRight' }}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const p = payload[0].payload as LeveyJenningsDataPoint;
                      return (
                        <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-xl text-xs space-y-1">
                          <div className="font-bold text-white flex items-center justify-between gap-3">
                            <span>Run #{p.runIndex}</span>
                            <span className="text-slate-400 font-mono">{p.runDate}</span>
                          </div>
                          <div className="text-sm font-black text-cyan-400">
                            {p.measuredValue} {activeSeries.unit}
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <span>Z-Score:</span>
                            <span className={Math.abs(p.zScore) >= 3 ? 'text-red-400 font-bold' : Math.abs(p.zScore) >= 2 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                              {p.zScore > 0 ? `+${p.zScore}` : p.zScore} σ
                            </span>
                          </div>
                          {p.rulesViolated && p.rulesViolated.length > 0 && (
                            <div className="pt-1 border-t border-slate-800 text-[11px] text-amber-300">
                              ⚠️ {p.rulesViolated.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="measuredValue"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={renderCustomDot}
                    activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clinical Action & NABL Standard Advice Banner */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs flex items-start gap-3">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-white">NABL ISO 15189:2022 Clinical Quality Directives:</p>
              <p className="text-slate-300 leading-relaxed">{activeSeries.recommendation}</p>
              {activeSeries.activeViolations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeSeries.activeViolations.map((v) => (
                    <span
                      key={v}
                      className="rounded bg-amber-950/80 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-600/40"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
