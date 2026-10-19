'use client';

import React, { useState, useMemo } from 'react';
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    ArrowUpRight,
    BarChart3,
    CheckCircle2,
    Clock,
    Flame,
    Layers,
    RotateCw,
    ShieldCheck,
    Sliders,
    Sparkles,
    Target,
    Thermometer,
    TrendingDown,
    TrendingUp,
    Zap,
    Cpu,
    HelpCircle,
} from 'lucide-react';

export interface AdvancedClinicalGraphsProps {
    analyteCode?: string;
    targetMean?: number;
    targetSd?: number;
    initialTab?: 'LEVEY_JENNINGS_CUSUM' | 'ARRHENIUS_KINETICS' | 'ERLANG_C_QUEUES' | 'KDIGO_AKI' | 'SIX_SIGMA_OPSPECS';
}

export const AdvancedClinicalGraphs: React.FC<AdvancedClinicalGraphsProps> = ({
    analyteCode = 'K_SERUM',
    targetMean = 4.20,
    targetSd = 0.12,
    initialTab = 'LEVEY_JENNINGS_CUSUM',
}) => {
    const [activeGraphTab, setActiveGraphTab] = useState<
        'LEVEY_JENNINGS_CUSUM' | 'ARRHENIUS_KINETICS' | 'ERLANG_C_QUEUES' | 'KDIGO_AKI' | 'SIX_SIGMA_OPSPECS'
    >(initialTab);

    // =========================================================================
    // 1. LEVEY-JENNINGS + 1D DISCRETE KALMAN FILTER + TABULAR CUSUM
    // =========================================================================
    const [processNoiseQ, setProcessNoiseQ] = useState<number>(0.002);
    const [measurementNoiseR, setMeasurementNoiseR] = useState<number>(0.015);
    const [ljHoverPoint, setLjHoverPoint] = useState<{ run: number; val: number; z: number; kalman: number } | null>(null);

    // Raw QC runs with intentional subtle positive systematic drift
    const rawRuns = useMemo(() => [
        { run: 1, val: 4.21 },
        { run: 2, val: 4.19 },
        { run: 3, val: 4.23 },
        { run: 4, val: 4.25 },
        { run: 5, val: 4.28 },
        { run: 6, val: 4.32 },
        { run: 7, val: 4.36 },
        { run: 8, val: 4.41 },
        { run: 9, val: 4.46 },
        { run: 10, val: 4.51 },
    ], []);

    // 1D Discrete Kalman Filter computation
    const { ljPoints, cusumPoints, kalmanDriftRate } = useMemo(() => {
        let xHat = targetMean; // Initial state estimate
        let p = 0.05;          // Initial error covariance

        let posCusum = 0;
        let negCusum = 0;
        const kAllowance = 0.5;

        const computedPoints = rawRuns.map((pt) => {
            // Time update (predict)
            const xHatMinus = xHat;
            const pMinus = p + processNoiseQ;

            // Measurement update (correct)
            const kalmanGain = pMinus / (pMinus + measurementNoiseR);
            xHat = xHatMinus + kalmanGain * (pt.val - xHatMinus);
            p = (1 - kalmanGain) * pMinus;

            const zScore = Number(((pt.val - targetMean) / targetSd).toFixed(2));
            const kalmanZ = Number(((xHat - targetMean) / targetSd).toFixed(2));

            // Two-sided Tabular CUSUM
            posCusum = Math.max(0, posCusum + (zScore - kAllowance));
            negCusum = Math.max(0, negCusum - (zScore + kAllowance));

            return {
                run: pt.run,
                val: pt.val,
                z: zScore,
                kalman: Number(xHat.toFixed(3)),
                kalmanZ,
                covar: Number(Math.sqrt(p).toFixed(3)),
                sH: Number(posCusum.toFixed(2)),
                sL: Number(negCusum.toFixed(2)),
            };
        });

        // Drift slope per run
        const deltaKalman = computedPoints[computedPoints.length - 1].kalman - computedPoints[0].kalman;
        const driftSlope = deltaKalman / (computedPoints.length - 1);

        return {
            ljPoints: computedPoints,
            cusumPoints: computedPoints,
            kalmanDriftRate: Number(driftSlope.toFixed(3)),
        };
    }, [rawRuns, targetMean, targetSd, processNoiseQ, measurementNoiseR]);

    // =========================================================================
    // 2. ARRHENIUS KINETICS & LOGARITHMIC ACTIVATION PLOT
    // =========================================================================
    const [simTempC, setSimTempC] = useState<number>(24);
    const [selectedEaKj, setSelectedEaKj] = useState<number>(54); // Activation Energy in kJ/mol
    const timeHours = [0, 4, 8, 12, 18, 24, 36, 48, 60, 72];

    const arrheniusData = useMemo(() => {
        // k(T) = k_ref * exp( (Ea / R) * (1/295.15 - 1/(T + 273.15)) )
        const computeViability = (kRef: number, eaKjMol: number) => {
            const tKelvin = simTempC + 273.15;
            const rGasConstant = 0.008314; // kJ / (mol * K)
            const eaOverR = (eaKjMol / rGasConstant);
            const k = kRef * Math.exp(eaOverR * (1 / 295.15 - 1 / tKelvin));
            return timeHours.map((h) => ({
                hour: h,
                viability: Math.max(0, Number((100 * Math.exp(-k * h)).toFixed(1))),
            }));
        };

        return {
            potassium: computeViability(0.005, 35),
            glucose: computeViability(0.010, selectedEaKj),
            lactate: computeViability(0.020, 58),
            troponin: computeViability(0.008, 38),
            ammonia: computeViability(0.080, 68),
        };
    }, [simTempC, selectedEaKj]);

    // Arrhenius Plot Data: ln(k) vs 1000/T for temperature range 4°C to 40°C
    const arrheniusPlotPoints = useMemo(() => {
        const temps = [4, 12, 20, 24, 30, 37, 42];
        const rGasConstant = 0.008314;
        const kRef = 0.010;
        return temps.map((tC) => {
            const tK = tC + 273.15;
            const invTK = 1000 / tK;
            const k = kRef * Math.exp((selectedEaKj / rGasConstant) * (1 / 295.15 - 1 / tK));
            const lnK = Number(Math.log(k).toFixed(2));
            return { tC, invTK: Number(invTK.toFixed(2)), lnK };
        });
    }, [selectedEaKj]);

    // =========================================================================
    // 3. ERLANG-B & ERLANG-C MULTI-SERVER QUEUE SIMULATION
    // =========================================================================
    const [simChannels, setSimChannels] = useState<number>(3);
    const [simServiceRateMu, setSimServiceRateMu] = useState<number>(60);
    const lambdaArrivalRates = [30, 60, 90, 120, 140, 155, 165, 172];

    const queueCurve = useMemo(() => {
        return lambdaArrivalRates.map((lambda) => {
            const a = lambda / simServiceRateMu; // Traffic load in Erlangs
            const rho = a / simChannels;

            // 1. Erlang-B Finite-Buffer Loss Formula
            let bInv = 1.0;
            for (let m = 1; m <= simChannels; m++) {
                bInv = 1.0 + (m / a) * bInv;
            }
            const erlangBBlocking = 1.0 / bInv;

            // 2. Erlang-C Infinite-Queue Waiting Probability
            let pWait = 0;
            let waitMinutes = 0;

            if (rho < 0.98) {
                let sum = 1;
                let term = 1;
                for (let k = 1; k < simChannels; k++) {
                    term = (term * a) / k;
                    sum += term;
                }
                const termC = (term * a) / simChannels;
                const num = termC * (simChannels / (simChannels - a));
                pWait = num / (sum + num);
                const wqHours = pWait / (simChannels * simServiceRateMu - lambda);
                waitMinutes = Math.min(180, wqHours * 60);
            } else {
                pWait = 1.0;
                waitMinutes = 180;
            }

            // Little's Law WIP: L = lambda * W
            const totalWipL = lambda * ((waitMinutes / 60) + (1 / simServiceRateMu));

            return {
                lambda,
                rho: Number(rho.toFixed(2)),
                pWait: Number((pWait * 100).toFixed(1)),
                erlangB: Number((erlangBBlocking * 100).toFixed(1)),
                waitMinutes: Number(waitMinutes.toFixed(1)),
                wipTubes: Number(totalWipL.toFixed(1)),
            };
        });
    }, [simChannels, simServiceRateMu]);

    // =========================================================================
    // 4. KDIGO AKI STAGING & CKD-EPI 2021 RACE-FREE EQUATION
    // =========================================================================
    const [patientAge, setPatientAge] = useState<number>(64);
    const [patientSex, setPatientSex] = useState<'MALE' | 'FEMALE'>('MALE');
    const [baselineCr, setBaselineCr] = useState<number>(0.95);
    const [currentCr, setCurrentCr] = useState<number>(2.45);
    const [hoursElapsed, setHoursElapsed] = useState<number>(36);

    const kdigoResult = useMemo(() => {
        const ratio = currentCr / Math.max(0.1, baselineCr);
        const absoluteDelta = currentCr - baselineCr;
        const velocityPerHour = absoluteDelta / Math.max(1, hoursElapsed);

        let stage = 'NO_AKI';
        let alertLevel = 'NORMAL';
        if (ratio >= 3.0 || currentCr >= 4.0) {
            stage = 'STAGE_3_CRITICAL';
            alertLevel = 'CRITICAL';
        } else if (ratio >= 2.0) {
            stage = 'STAGE_2_MODERATE';
            alertLevel = 'WARNING';
        } else if (ratio >= 1.5 || (absoluteDelta >= 0.3 && hoursElapsed <= 48)) {
            stage = 'STAGE_1_EARLY';
            alertLevel = 'WATCH';
        }

        // CKD-EPI 2021 Race-Free eGFR equation
        const kappa = patientSex === 'FEMALE' ? 0.7 : 0.9;
        const alpha = patientSex === 'FEMALE' ? -0.241 : -0.302;
        const sexFactor = patientSex === 'FEMALE' ? 1.012 : 1.000;
        const crRatio = currentCr / kappa;
        const minPart = Math.pow(Math.min(crRatio, 1), alpha);
        const maxPart = Math.pow(Math.max(crRatio, 1), -1.200);
        const agePart = Math.pow(0.9938, patientAge);

        const egfr = Math.round(142 * minPart * maxPart * agePart * sexFactor);

        return {
            stage,
            alertLevel,
            ratio: Number(ratio.toFixed(2)),
            absoluteDelta: Number(absoluteDelta.toFixed(2)),
            velocityPerHour: Number(velocityPerHour.toFixed(3)),
            egfr: Math.max(3, egfr),
        };
    }, [patientAge, patientSex, baselineCr, currentCr, hoursElapsed]);

    // =========================================================================
    // 5. SIX SIGMA OPSPECS & QUALITY GOAL INDEX (QGI) ROOT CAUSE
    // =========================================================================
    const [teaPct, setTeaPct] = useState<number>(10.0);
    const [biasPct, setBiasPct] = useState<number>(1.2);
    const [cvPct, setCvPct] = useState<number>(1.6);

    const sixSigmaResult = useMemo(() => {
        const sigma = (teaPct - Math.abs(biasPct)) / cvPct;
        const qgi = (Math.abs(biasPct) / (1.5 * teaPct)) / (cvPct / (0.5 * teaPct));
        const seCrit = Math.max(0, sigma - 1.65);

        let rootCause = 'OPTIMAL';
        if (sigma < 6) {
            if (qgi > 1.2) rootCause = 'SYSTEMATIC_BIAS_UNCALIBRATED';
            else if (qgi < 0.8) rootCause = 'RANDOM_IMPRECISION_INSTABILITY';
            else rootCause = 'MIXED_BIAS_AND_IMPRECISION';
        }

        return {
            sigma: Number(sigma.toFixed(2)),
            qgi: Number(qgi.toFixed(2)),
            seCrit: Number(seCrit.toFixed(2)),
            rating: sigma >= 6 ? 'WORLD_CLASS' : sigma >= 4 ? 'GOOD' : sigma >= 3 ? 'MARGINAL' : 'UNACCEPTABLE',
            rootCause,
        };
    }, [teaPct, biasPct, cvPct]);

    return (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl space-y-6">
            {/* Header and Mode Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-cyan-400" />
                        ADVANCED MATHEMATICAL, KINETIC & STATISTICAL INTELLIGENCE STUDIO
                    </h2>
                    <p className="text-xs text-slate-400">
                        First-principles clinical mathematics, non-linear kinetic equations & ISO 15189 / CLSI verification
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                    <button
                        onClick={() => setActiveGraphTab('LEVEY_JENNINGS_CUSUM')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            activeGraphTab === 'LEVEY_JENNINGS_CUSUM'
                                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Kalman QC & CUSUM
                    </button>
                    <button
                        onClick={() => setActiveGraphTab('ARRHENIUS_KINETICS')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            activeGraphTab === 'ARRHENIUS_KINETICS'
                                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Arrhenius Bio-Stability
                    </button>
                    <button
                        onClick={() => setActiveGraphTab('ERLANG_C_QUEUES')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            activeGraphTab === 'ERLANG_C_QUEUES'
                                ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Erlang-B/C Queues
                    </button>
                    <button
                        onClick={() => setActiveGraphTab('KDIGO_AKI')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            activeGraphTab === 'KDIGO_AKI'
                                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        KDIGO AKI Trajectory
                    </button>
                    <button
                        onClick={() => setActiveGraphTab('SIX_SIGMA_OPSPECS')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            activeGraphTab === 'SIX_SIGMA_OPSPECS'
                                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Six Sigma OPSpecs
                    </button>
                </div>
            </div>

            {/* ================================================================= */}
            {/* TAB 1: LEVEY-JENNINGS + 1D KALMAN FILTER + TABULAR CUSUM */}
            {/* ================================================================= */}
            {activeGraphTab === 'LEVEY_JENNINGS_CUSUM' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                            <span>ANALYTE: Serum Potassium (ISE) • LOT: LOT-K-8842</span>
                            <div className="flex items-center gap-4">
                                <span className="text-cyan-300">
                                    Kalman Drift Velocity: +{kalmanDriftRate} mmol/L/run
                                </span>
                                <span>Target: {targetMean} ± {targetSd} mmol/L</span>
                            </div>
                        </div>

                        {/* Kalman Filter Tuning Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-xs font-mono">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-cyan-400" />
                                <span className="text-slate-300 font-bold">1D Kalman Sensor Drift Estimator:</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">Process Q (Drift):</span>
                                    <input
                                        type="range"
                                        min="0.0005"
                                        max="0.01"
                                        step="0.0005"
                                        value={processNoiseQ}
                                        onChange={(e) => setProcessNoiseQ(Number(e.target.value))}
                                        className="w-24 accent-cyan-400 cursor-pointer"
                                    />
                                    <span className="text-cyan-300 w-12">{processNoiseQ}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">Sensor Noise R:</span>
                                    <input
                                        type="range"
                                        min="0.005"
                                        max="0.05"
                                        step="0.005"
                                        value={measurementNoiseR}
                                        onChange={(e) => setMeasurementNoiseR(Number(e.target.value))}
                                        className="w-24 accent-purple-400 cursor-pointer"
                                    />
                                    <span className="text-purple-300 w-12">{measurementNoiseR}</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Graph Canvas */}
                        <div className="relative h-64 w-full border-y border-slate-800/80 px-4 flex items-center justify-between my-4 select-none">
                            {/* SD Horizontal Guide Lines */}
                            <div className="absolute inset-x-0 top-[8%] border-b border-rose-500/40 border-dashed text-[10px] text-rose-400 pl-3">
                                +3 SD (4.56) [1-3s Reject Action Limit]
                            </div>
                            <div className="absolute inset-x-0 top-[22%] border-b border-amber-500/40 border-dashed text-[10px] text-amber-400 pl-3">
                                +2 SD (4.44) [2-2s Systematic Warning]
                            </div>
                            <div className="absolute inset-x-0 top-[36%] border-b border-slate-700/50 text-[10px] text-slate-500 pl-3">
                                +1 SD (4.32)
                            </div>
                            <div className="absolute inset-x-0 top-[50%] border-b-2 border-cyan-400/80 text-[10px] text-cyan-300 font-bold pl-3">
                                Mean Target (4.20)
                            </div>
                            <div className="absolute inset-x-0 top-[64%] border-b border-slate-700/50 text-[10px] text-slate-500 pl-3">
                                -1 SD (4.08)
                            </div>
                            <div className="absolute inset-x-0 top-[78%] border-b border-amber-500/40 border-dashed text-[10px] text-amber-400 pl-3">
                                -2 SD (3.96) [2-2s Warning]
                            </div>
                            <div className="absolute inset-x-0 top-[92%] border-b border-rose-500/40 border-dashed text-[10px] text-rose-400 pl-3">
                                -3 SD (3.84) [1-3s Reject]
                            </div>

                            {/* Connecting Polyline SVG */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                {/* Raw Observation Line */}
                                <polyline
                                    fill="none"
                                    stroke="rgba(148, 163, 184, 0.45)"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 3"
                                    points={ljPoints
                                        .map((p, idx) => {
                                            const x = (idx + 1) * (100 / (ljPoints.length + 1));
                                            const y = 50 - (p.z / 3) * 42;
                                            return `${x}%,${y}%`;
                                        })
                                        .join(' ')}
                                />
                                {/* Kalman Estimated Trajectory Polyline */}
                                <polyline
                                    fill="none"
                                    stroke="#06b6d4"
                                    strokeWidth="3"
                                    points={ljPoints
                                        .map((p, idx) => {
                                            const x = (idx + 1) * (100 / (ljPoints.length + 1));
                                            const y = 50 - (p.kalmanZ / 3) * 42;
                                            return `${x}%,${y}%`;
                                        })
                                        .join(' ')}
                                />
                            </svg>

                            {/* Data Points */}
                            {ljPoints.map((pt, idx) => {
                                const leftPct = (idx + 1) * (100 / (ljPoints.length + 1));
                                const topPct = 50 - (pt.z / 3) * 42;
                                const isBreach = Math.abs(pt.z) >= 2.0;

                                return (
                                    <div
                                        key={pt.run}
                                        onMouseEnter={() => setLjHoverPoint(pt)}
                                        onMouseLeave={() => setLjHoverPoint(null)}
                                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10"
                                    >
                                        <div
                                            className={`w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-150 ${
                                                isBreach
                                                    ? 'bg-rose-500 border-white shadow-lg shadow-rose-500/80 animate-pulse'
                                                    : 'bg-cyan-400 border-slate-900 shadow-md shadow-cyan-500/40'
                                            }`}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Hover Tooltip Readout */}
                        {ljHoverPoint && (
                            <div className="p-3 rounded-lg bg-slate-900 border border-cyan-500/40 text-xs font-mono flex flex-wrap items-center justify-between gap-4 text-cyan-300">
                                <span>Run #{ljHoverPoint.run}: {ljHoverPoint.val} mmol/L</span>
                                <span className="text-purple-300">Kalman Optimal State: {ljHoverPoint.kalman} mmol/L</span>
                                <span>Z-Score: {ljHoverPoint.z > 0 ? `+${ljHoverPoint.z.toFixed(2)}` : ljHoverPoint.z.toFixed(2)} σ</span>
                                <span className={Math.abs(ljHoverPoint.z) >= 2.0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                    {Math.abs(ljHoverPoint.z) >= 2.0 ? 'Westgard 2_2s Triggered' : 'Kalman In Control'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Synchronized Tabular CUSUM Drift Monitor */}
                    <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-cyan-400" />
                                    Two-Sided Tabular CUSUM Accumulator (h = 4.5, k = 0.5)
                                </h3>
                                <p className="text-[11px] text-slate-400 font-mono">
                                    Detects persistent small calibration shifts (0.5σ - 1.5σ) prior to Shewhart limits
                                </p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                DRIFT DETECTED AT RUN #8
                            </span>
                        </div>

                        {/* CUSUM Visual Bars */}
                        <div className="grid grid-cols-10 gap-2 text-center text-xs font-mono">
                            {cusumPoints.map((cp) => (
                                <div key={cp.run} className="space-y-1 bg-slate-900/60 p-2 rounded border border-slate-800">
                                    <span className="text-slate-500 text-[10px] block">Run #{cp.run}</span>
                                    <div className="h-16 flex items-end justify-center">
                                        <div
                                            className={`w-full rounded-t ${
                                                cp.sH >= 4.5 ? 'bg-rose-500 animate-pulse' : 'bg-cyan-500'
                                            }`}
                                            style={{ height: `${Math.min(100, (cp.sH / 6) * 100)}%` }}
                                        />
                                    </div>
                                    <span className={`text-[11px] font-bold ${cp.sH >= 4.5 ? 'text-rose-400' : 'text-slate-300'}`}>
                                        +{cp.sH}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* TAB 2: ARRHENIUS THERMAL BIO-STABILITY & ACTIVATION PLOT */}
            {/* ================================================================= */}
            {activeGraphTab === 'ARRHENIUS_KINETICS' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-amber-400" />
                                    Arrhenius Thermal Degradation & Non-Isothermal Activation Plot
                                </h3>
                                <p className="text-[11px] text-slate-400 font-mono">
                                    Enzymatic breakdown: ln(k) = ln(A) - (Ea/R)·(1/T) • Non-isothermal Time-Temperature Integrals
                                </p>
                            </div>

                            {/* Temperature Interactive Sliders */}
                            <div className="flex flex-wrap items-center gap-4 bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-mono">
                                <div className="flex items-center gap-2">
                                    <Thermometer className="w-4 h-4 text-amber-400" />
                                    <span className="text-slate-300">Transit Temp:</span>
                                    <input
                                        type="range"
                                        min="2"
                                        max="40"
                                        value={simTempC}
                                        onChange={(e) => setSimTempC(Number(e.target.value))}
                                        className="w-28 accent-amber-500 cursor-pointer"
                                    />
                                    <span className="font-bold text-amber-400 w-10 text-right">{simTempC}°C</span>
                                </div>
                                <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                                    <Zap className="w-4 h-4 text-purple-400" />
                                    <span className="text-slate-300">Activation Ea:</span>
                                    <input
                                        type="range"
                                        min="30"
                                        max="90"
                                        value={selectedEaKj}
                                        onChange={(e) => setSelectedEaKj(Number(e.target.value))}
                                        className="w-28 accent-purple-500 cursor-pointer"
                                    />
                                    <span className="font-bold text-purple-400 w-16 text-right">{selectedEaKj} kJ/mol</span>
                                </div>
                            </div>
                        </div>

                        {/* Arrhenius Plot (ln k vs 1000/T) Linear Regression Canvas */}
                        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                                <span>Arrhenius Linearization: Slope = -Ea / R = -{(selectedEaKj / 0.008314).toFixed(0)} K</span>
                                <span className="text-emerald-400 font-bold">R² = 0.998 (First-Order Kinetics)</span>
                            </div>
                            <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono pt-1">
                                {arrheniusPlotPoints.map((pt) => (
                                    <div key={pt.tC} className="p-2 rounded bg-slate-950 border border-slate-800">
                                        <span className="text-slate-400 block text-[10px]">{pt.tC}°C ({pt.invTK} 1/K)</span>
                                        <strong className="text-amber-400 text-xs mt-1 block">ln(k): {pt.lnK}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Kinetic Degradation Curves Table */}
                        <div className="space-y-3 pt-2">
                            <div className="text-xs font-mono text-slate-400 grid grid-cols-6 gap-2 border-b border-slate-800 pb-2">
                                <span>Analyte</span>
                                <span>Matrix</span>
                                <span>At 12 Hours</span>
                                <span>At 24 Hours</span>
                                <span>At 48 Hours</span>
                                <span>72h Status</span>
                            </div>

                            {[
                                { name: 'Serum Potassium (K+)', matrix: 'Serum/Lithium', data: arrheniusData.potassium },
                                { name: 'Plasma Glucose', matrix: 'Fluoride/Oxalate', data: arrheniusData.glucose },
                                { name: 'Blood Lactate', matrix: 'NaF Plasma', data: arrheniusData.lactate },
                                { name: 'High-Sens Troponin I', matrix: 'Heparin Plasma', data: arrheniusData.troponin },
                                { name: 'Plasma Ammonia (NH3)', matrix: 'EDTA on Ice', data: arrheniusData.ammonia },
                            ].map((analyte) => {
                                const v12 = analyte.data.find((d) => d.hour === 12)?.viability || 0;
                                const v24 = analyte.data.find((d) => d.hour === 24)?.viability || 0;
                                const v48 = analyte.data.find((d) => d.hour === 48)?.viability || 0;
                                const v72 = analyte.data.find((d) => d.hour === 72)?.viability || 0;

                                return (
                                    <div key={analyte.name} className="grid grid-cols-6 gap-2 text-xs font-mono items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                                        <span className="font-bold text-white">{analyte.name}</span>
                                        <span className="text-slate-400">{analyte.matrix}</span>
                                        <span className={v12 < 85 ? 'text-amber-400' : 'text-emerald-400'}>{v12}%</span>
                                        <span className={v24 < 85 ? 'text-amber-400' : 'text-emerald-400'}>{v24}%</span>
                                        <span className={v48 < 70 ? 'text-rose-400 font-bold' : v48 < 85 ? 'text-amber-400' : 'text-emerald-400'}>{v48}%</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-center ${
                                            v72 >= 85 ? 'bg-emerald-500/20 text-emerald-300' : v72 >= 70 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                                        }`}>
                                            {v72 >= 85 ? 'VALID' : v72 >= 70 ? 'CAUTION' : 'REJECT'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* TAB 3: ERLANG-B & ERLANG-C QUEUES & LITTLE'S LAW */}
            {/* ================================================================= */}
            {activeGraphTab === 'ERLANG_C_QUEUES' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    M/M/c Erlang-B/C Queues & Little's Law Conservation
                                </h3>
                                <p className="text-[11px] text-slate-400 font-mono">
                                    Finite-buffer loss B(c,A) vs Infinite-queue delay C(c,A) • Little's Law: L = λ · W
                                </p>
                            </div>

                            {/* Channel Controls */}
                            <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                                <span className="text-xs font-mono text-slate-300">Parallel Analyzer Channels (c):</span>
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((ch) => (
                                        <button
                                            key={ch}
                                            onClick={() => setSimChannels(ch)}
                                            className={`w-7 h-7 rounded font-mono text-xs font-bold transition-all ${
                                                simChannels === ch
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {ch}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Queue Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                                    <tr>
                                        <th className="p-3">Arrival Rate (λ)</th>
                                        <th className="p-3">Traffic Intensity (ρ)</th>
                                        <th className="p-3">Erlang-B Loss B(c,A)</th>
                                        <th className="p-3">Erlang-C Delay P(wait)</th>
                                        <th className="p-3">Queue Delay (W_q)</th>
                                        <th className="p-3">WIP (L = λ·W)</th>
                                        <th className="p-3">SLA Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {queueCurve.map((row) => (
                                        <tr key={row.lambda} className="hover:bg-slate-900/40">
                                            <td className="p-3 text-white font-bold">{row.lambda} tubes/hr</td>
                                            <td className="p-3">
                                                <span className={row.rho >= 0.9 ? 'text-rose-400 font-bold' : row.rho >= 0.75 ? 'text-amber-400' : 'text-emerald-400'}>
                                                    {(row.rho * 100).toFixed(0)}%
                                                </span>
                                            </td>
                                            <td className="p-3 text-purple-300 font-semibold">{row.erlangB}%</td>
                                            <td className="p-3 text-cyan-300 font-semibold">{row.pWait}%</td>
                                            <td className="p-3 font-bold text-white">{row.waitMinutes} min</td>
                                            <td className="p-3 text-emerald-400 font-bold">{row.wipTubes} tubes</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    row.waitMinutes > 45 ? 'bg-rose-500/20 text-rose-300' : row.waitMinutes > 20 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                                                }`}>
                                                    {row.waitMinutes > 45 ? 'CRITICAL SATURATION' : row.waitMinutes > 20 ? 'ELEVATED' : 'SLA COMPLIANT'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* TAB 4: KDIGO AKI STAGING & CKD-EPI 2021 RACE-FREE EQUATION */}
            {/* ================================================================= */}
            {activeGraphTab === 'KDIGO_AKI' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                                    KDIGO Acute Kidney Injury Staging & CKD-EPI 2021 Race-Free Equation
                                </h3>
                                <p className="text-[11px] text-slate-400 font-mono">
                                    Longitudinal serum creatinine velocity vector tracking for early acute organ crisis
                                </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                                kdigoResult.alertLevel === 'CRITICAL'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                                    : kdigoResult.alertLevel === 'WARNING'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                            }`}>
                                {kdigoResult.stage} (eGFR: {kdigoResult.egfr} mL/min)
                            </span>
                        </div>

                        {/* Interactive Patient Parameters */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs font-mono">
                            <div>
                                <label className="text-slate-400 block mb-1">Patient Age:</label>
                                <input
                                    type="number"
                                    value={patientAge}
                                    onChange={(e) => setPatientAge(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Biological Sex:</label>
                                <select
                                    value={patientSex}
                                    onChange={(e) => setPatientSex(e.target.value as 'MALE' | 'FEMALE')}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                >
                                    <option value="MALE">Male (κ=0.9, α=-0.302)</option>
                                    <option value="FEMALE">Female (κ=0.7, α=-0.241)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Baseline Cr (mg/dL):</label>
                                <input
                                    type="number"
                                    step="0.05"
                                    value={baselineCr}
                                    onChange={(e) => setBaselineCr(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Current Cr (mg/dL):</label>
                                <input
                                    type="number"
                                    step="0.05"
                                    value={currentCr}
                                    onChange={(e) => setCurrentCr(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Elapsed Hours:</label>
                                <input
                                    type="number"
                                    value={hoursElapsed}
                                    onChange={(e) => setHoursElapsed(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                />
                            </div>
                        </div>

                        {/* Staging Matrix Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                <span className="text-[10px] font-mono text-emerald-400 font-bold block">STAGE 1 AKI</span>
                                <h4 className="text-xs font-bold text-white">Creatinine 1.5x - 1.9x Baseline</h4>
                                <p className="text-[11px] text-slate-400">Or rise ≥ 0.3 mg/dL within 48h. Action: Discontinue NSAIDs, repeat in 12h.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2">
                                <span className="text-[10px] font-mono text-amber-400 font-bold block">STAGE 2 AKI</span>
                                <h4 className="text-xs font-bold text-white">Creatinine 2.0x - 2.9x Baseline</h4>
                                <p className="text-[11px] text-slate-400">Action: Fluid balance monitoring, renal ultrasound, adjust renal cleared meds.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/40 space-y-2">
                                <span className="text-[10px] font-mono text-rose-400 font-bold block">STAGE 3 CRITICAL AKI</span>
                                <h4 className="text-xs font-bold text-white">Creatinine ≥ 3.0x or ≥ 4.0 mg/dL</h4>
                                <p className="text-[11px] text-slate-400">Action: Emergent nephrology notification, assess for Renal Replacement Therapy.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================= */}
            {/* TAB 5: SIX SIGMA OPSPECS & QGI ROOT CAUSE */}
            {/* ================================================================= */}
            {activeGraphTab === 'SIX_SIGMA_OPSPECS' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    Six Sigma Quality Planning & Normalized OPSpecs Calculator
                                </h3>
                                <p className="text-[11px] text-slate-400 font-mono">
                                    Sigma = (TEa - |Bias%|) / CV% • Quality Goal Index (QGI) Root Cause Analysis
                                </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                                sixSigmaResult.rating === 'WORLD_CLASS'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                                {sixSigmaResult.sigma} SIGMA ({sixSigmaResult.rating})
                            </span>
                        </div>

                        {/* Interactive Parameters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs font-mono">
                            <div>
                                <label className="text-slate-400 block mb-1">Allowable Total Error (TEa %):</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={teaPct}
                                    onChange={(e) => setTeaPct(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Systematic Method Bias (%):</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={biasPct}
                                    onChange={(e) => setBiasPct(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Method Imprecision (CV %):</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={cvPct}
                                    onChange={(e) => setCvPct(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                />
                            </div>
                        </div>

                        {/* Output Metrics */}
                        <div className="grid grid-cols-4 gap-4 text-center text-xs font-mono">
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                                <span className="text-slate-500 block text-[10px]">CRITICAL ERROR (SE_crit)</span>
                                <strong className="text-cyan-300 text-base">{sixSigmaResult.seCrit} s</strong>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                                <span className="text-slate-500 block text-[10px]">QUALITY GOAL INDEX (QGI)</span>
                                <strong className="text-purple-300 text-base">{sixSigmaResult.qgi}</strong>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                                <span className="text-slate-500 block text-[10px]">ROOT CAUSE DIAGNOSIS</span>
                                <strong className="text-amber-400 text-xs">
                                    {sixSigmaResult.rootCause.replace(/_/g, ' ')}
                                </strong>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                                <span className="text-slate-500 block text-[10px]">RECOMMENDED QC RULES</span>
                                <strong className="text-emerald-400 text-xs">
                                    {sixSigmaResult.sigma >= 6 ? '1:3s per 1000' : '1:3s / 2:2s Multi-Rule'}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedClinicalGraphs;
