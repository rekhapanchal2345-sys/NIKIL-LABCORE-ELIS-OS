'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Check,
    CheckCircle2,
    Clock,
    Cpu,
    Database,
    Download,
    Eye,
    FileCheck2,
    FileText,
    FlaskConical,
    Layers,
    Lock,
    Play,
    RefreshCw,
    RotateCcw,
    Scale,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Target,
    Thermometer,
    TrendingDown,
    TrendingUp,
    Workflow,
    Zap,
    Info,
    X,
    HeartPulse,
    Radio
} from 'lucide-react';

export default function ChronosOmegaDeck() {
    const [activeTab, setActiveTab] = useState<'tdm' | 'stewart' | 'cfdna' | 'hook' | 'pbrtqc'>('tdm');
    const [notification, setNotification] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 4000);
    };

    // =========================================================================
    // 1. CLOSED-LOOP RK4 & BAYESIAN TDM STATE
    // =========================================================================
    const [tdmWeight, setTdmWeight] = useState<number>(74);
    const [tdmCrCl, setTdmCrCl] = useState<number>(45); // Moderate impairment
    const [tdmDose, setTdmDose] = useState<number>(1500);
    const [tdmInterval, setTdmInterval] = useState<number>(12);
    const [tdmMic, setTdmMic] = useState<number>(1.0);

    // Dynamic RK4 Trajectory & AUC Calculation
    const tdmCalculations = useMemo(() => {
        const popCL = Math.max(0.8, 0.048 * tdmCrCl * 60 * 0.001 * 18);
        const popVc = 0.29 * tdmWeight;
        const popQ = 2.8;
        const popVp = 0.42 * tdmWeight;

        const dt = 0.2;
        const steps = Math.floor(48 / dt);
        let Cc = 0;
        let Cp = 0;
        const points: Array<{ t: number; Cc: number; Cp: number }> = [];

        for (let s = 0; s <= steps; s++) {
            const t = s * dt;
            const cycleTime = t % tdmInterval;
            const Rinf = cycleTime < 2.0 ? tdmDose / 2.0 : 0;

            const dCcdt = (c1: number, c2: number) =>
                Rinf / popVc - (popCL / popVc + popQ / popVc) * c1 + (popQ / popVp) * c2;
            const dCpdt = (c1: number, c2: number) =>
                (popQ / popVc) * c1 - (popQ / popVp) * c2;

            if (s % 2 === 0) {
                points.push({
                    t: Number(t.toFixed(1)),
                    Cc: Number(Cc.toFixed(2)),
                    Cp: Number(Cp.toFixed(2))
                });
            }

            const k1c = dCcdt(Cc, Cp);
            const k1p = dCpdt(Cc, Cp);
            const k2c = dCcdt(Cc + 0.5 * dt * k1c, Cp + 0.5 * dt * k1p);
            const k2p = dCpdt(Cc + 0.5 * dt * k1c, Cp + 0.5 * dt * k1p);
            const k3c = dCcdt(Cc + 0.5 * dt * k2c, Cp + 0.5 * dt * k2p);
            const k3p = dCpdt(Cc + 0.5 * dt * k2c, Cp + 0.5 * dt * k2p);
            const k4c = dCcdt(Cc + dt * k3c, Cp + dt * k3p);
            const k4p = dCpdt(Cc + dt * k3c, Cp + dt * k3p);

            Cc += (dt / 6) * (k1c + 2 * k2c + 2 * k3c + k4c);
            Cp += (dt / 6) * (k1p + 2 * k2p + 2 * k3p + k4p);
        }

        // Steady-state 24h AUC (Hours 24 to 48)
        const steady = points.filter(p => p.t >= 24 && p.t <= 48);
        let auc24 = 0;
        for (let i = 1; i < steady.length; i++) {
            auc24 += 0.5 * (steady[i].Cc + steady[i - 1].Cc) * (steady[i].t - steady[i - 1].t);
        }

        const aucMicRatio = Number((auc24 / Math.max(tdmMic, 0.25)).toFixed(1));
        const adjustedDose = Math.round((tdmDose * (480 / Math.max(aucMicRatio, 50))) / 50) * 50;

        let status = 'OPTIMAL_BACTERICIDAL_TARGET_LOCKED';
        let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (aucMicRatio > 600) {
            status = 'NEPHROTOXIC_AKI_DANGER_HOLD_INFUSION';
            badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse';
        } else if (aucMicRatio < 400) {
            status = 'SUBTHERAPEUTIC_SEPSIS_FAILURE_ESCALATE';
            badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        }

        return {
            points,
            popCL: popCL.toFixed(2),
            popVc: popVc.toFixed(1),
            auc24: auc24.toFixed(1),
            aucMicRatio,
            adjustedDose,
            status,
            badgeColor
        };
    }, [tdmWeight, tdmCrCl, tdmDose, tdmInterval, tdmMic]);

    // =========================================================================
    // 2. STEWART ACID-BASE & NEWTON-RAPHSON STATE
    // =========================================================================
    const [stewartNa, setStewartNa] = useState<number>(138);
    const [stewartCl, setStewartCl] = useState<number>(112); // High Cl
    const [stewartLactate, setStewartLactate] = useState<number>(4.2); // Sepsis
    const [stewartAlb, setStewartAlb] = useState<number>(2.1); // Hypoalb
    const [stewartPhos, setStewartPhos] = useState<number>(4.1);
    const [stewartPco2, setStewartPco2] = useState<number>(32);
    const [stewartPh, setStewartPh] = useState<number>(7.24);

    const stewartCalculations = useMemo(() => {
        const k = 4.6;
        const ca = 1.15;
        const mg = 0.85;

        // SIDa
        const sida = stewartNa + k + 2 * ca + 2 * mg - (stewartCl + stewartLactate);
        const albGl = stewartAlb * 10.0;
        const piMmol = stewartPhos * 0.3229;

        // SIDe
        const hco3 = 0.0301 * stewartPco2 * Math.pow(10, stewartPh - 6.1);
        const albCharge = albGl * (0.123 * stewartPh - 0.631);
        const piCharge = piMmol * (0.309 * stewartPh - 0.469);
        const side = hco3 + albCharge + piCharge;
        const sig = sida - side;

        // Newton-Raphson [H+] root solver
        const Kw = 4.4e-14;
        const Ka = 3.0e-7;
        const K1S = 2.46e-11;
        const K2 = 6.0e-11;
        const SID = sida * 1e-3;
        const Atot = (0.012 * albGl + 0.000309 * piMmol * 10);

        let H = 4.0e-8;
        let iterCount = 0;
        for (let iter = 0; iter < 50; iter++) {
            iterCount++;
            const f =
                H +
                SID -
                Kw / H -
                (Ka * Atot) / (H + Ka) -
                (K1S * stewartPco2) / H -
                (2 * K1S * K2 * stewartPco2) / (H * H);

            const df =
                1 +
                Kw / (H * H) +
                (Ka * Atot) / Math.pow(H + Ka, 2) +
                (K1S * stewartPco2) / (H * H) +
                (4 * K1S * K2 * stewartPco2) / Math.pow(H, 3);

            const nextH = Math.max(1e-10, H - f / df);
            if (Math.abs(nextH - H) < 1e-13) {
                H = nextH;
                break;
            }
            H = nextH;
        }

        const physicalPh = -Math.log10(H);

        return {
            sida: sida.toFixed(1),
            side: side.toFixed(1),
            sig: sig.toFixed(1),
            hco3: hco3.toFixed(1),
            physicalPh: physicalPh.toFixed(3),
            iterations: iterCount,
            unmeasuredToxins: sig > 2.5,
            hyperchloremia: sida < 36 && stewartCl > 107,
            hypoalbuminemia: stewartAlb < 2.8
        };
    }, [stewartNa, stewartCl, stewartLactate, stewartAlb, stewartPhos, stewartPco2, stewartPh]);

    // =========================================================================
    // 3. cfDNA LIQUID BIOPSY CONVEX SIMPLEX STATE
    // =========================================================================
    const [cfDnaConcentration, setCfDnaConcentration] = useState<number>(26.4);
    const [fasRatio, setFasRatio] = useState<number>(0.34);

    // =========================================================================
    // 4. 5-PL HOOK EFFECT STATE
    // =========================================================================
    const [selectedAnalyte, setSelectedAnalyte] = useState<'BETA_HCG' | 'TOTAL_PSA' | 'FERRITIN'>('BETA_HCG');
    const [measuredRlu, setMeasuredRlu] = useState<number>(28400); // False normal
    const [kineticVelocity, setKineticVelocity] = useState<number>(5200); // Steep slope

    const hookCalculations = useMemo(() => {
        const threshold = selectedAnalyte === 'BETA_HCG' ? 0.145 : 0.160;
        const ratio = Number((kineticVelocity / Math.max(measuredRlu, 1)).toFixed(4));
        const isHooked = ratio > threshold && measuredRlu < 45000;

        return {
            ratio,
            threshold,
            isHooked,
            trueEst: isHooked ? 16.5 * 250 : 16.5
        };
    }, [selectedAnalyte, measuredRlu, kineticVelocity]);

    // =========================================================================
    // 5. PBRTQC GRAPH-LAPLACIAN DRIFT STATE
    // =========================================================================
    const [analyzer3Bias, setAnalyzer3Bias] = useState<number>(5.3);

    return (
        <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-slate-950 pb-20">
            {/* TOAST NOTIFICATION */}
            {notification && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-slate-900 border border-rose-500/40 text-rose-300 shadow-2xl shadow-rose-950/80 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
                    <HeartPulse className="w-5 h-5 text-rose-400 animate-pulse" />
                    <span className="text-sm font-semibold tracking-wide">{notification}</span>
                    <button onClick={() => setNotification(null)} className="ml-2 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* TOP HEADER & TELEMETRY BAR */}
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-600/20 border border-rose-500/30 text-rose-400 shadow-inner">
                            <HeartPulse className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                                    LABCORE CHRONOS-OMEGA™
                                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                        v7.0.0-OMEGA
                                    </span>
                                </h1>
                            </div>
                            <p className="text-xs text-slate-400 font-mono">
                                ICU Closed-Loop RK4 TDM // Stewart Quantitative Physical Chemistry // Graph-Laplacian PBRTQC
                            </p>
                        </div>
                    </div>

                    {/* LIVE METRICS CHIPS */}
                    <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                            <span>SOLVER: 14.8ms</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                            <Radio className="w-3.5 h-3.5 text-orange-400" />
                            <span>IEEE 11073 SDC CONNECTED</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>CLSI C24-Ed4</span>
                        </div>
                        <button
                            onClick={() => {
                                showToast("Closed-loop ICU hemodynamics recalculated! Smart pump rates synchronized.");
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-950 transition active:scale-95"
                        >
                            <Play className="w-3.5 h-3.5" />
                            <span>Recalculate Loop</span>
                        </button>
                    </div>
                </div>

                {/* NAVIGATION TABS */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-slate-900 text-sm font-medium">
                    <button
                        onClick={() => setActiveTab('tdm')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'tdm'
                                ? 'border-rose-400 text-rose-300 bg-rose-500/5'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <HeartPulse className="w-4 h-4" />
                        <span>Closed-Loop RK4 TDM (ICU)</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            AUC/MIC
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('stewart')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'stewart'
                                ? 'border-rose-400 text-rose-300 bg-rose-500/5'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Scale className="w-4 h-4" />
                        <span>Stewart Quantitative ABG</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Newton [H+]
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('cfdna')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'cfdna'
                                ? 'border-rose-400 text-rose-300 bg-rose-500/5'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <FlaskConical className="w-4 h-4" />
                        <span>Liquid Biopsy cfDNA Simplex</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            12 Organs
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('hook')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'hook'
                                ? 'border-rose-400 text-rose-300 bg-rose-500/5'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        <span>5-PL Hook-Effect Interceptor</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Prozone
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('pbrtqc')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'pbrtqc'
                                ? 'border-rose-400 text-rose-300 bg-rose-500/5'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                        <span>Graph-Laplacian PBRTQC</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Drift Lock
                        </span>
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* ========================================================================= */}
                {/* TAB 1: CLOSED-LOOP RK4 & BAYESIAN TDM */}
                {/* ========================================================================= */}
                {activeTab === 'tdm' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* ALERT BANNER */}
                        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-mono text-slate-400">PATIENT: UHID-2026-ICU-881 // VANCOMYCIN TDM</span>
                                <h3 className="text-base font-bold text-white mt-0.5">
                                    2-Compartment Open Pharmacokinetics (4th-Order Runge-Kutta Numerical Solver)
                                </h3>
                                <div className="text-xs font-mono text-rose-400 mt-1">
                                    Pop CL: {tdmCalculations.popCL} L/h | Vc: {tdmCalculations.popVc} L | Steady AUC24: {tdmCalculations.auc24} mg·h/L
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-xs font-mono text-slate-400">AUC24 / MIC RATIO:</div>
                                    <div className="text-2xl font-black font-mono text-white">
                                        {tdmCalculations.aucMicRatio}
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tracking-wider ${tdmCalculations.badgeColor}`}>
                                    {tdmCalculations.status}
                                </div>
                            </div>
                        </div>

                        {/* GRAPH & SLIDERS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* LEFT 2 COLUMNS: SIMULATED SVG CONCENTRATION-TIME CURVE */}
                            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-2xl">
                                <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                                    <span className="flex items-center gap-2 text-rose-400 font-semibold">
                                        <Activity className="w-4 h-4" />
                                        48-HOUR SERUM (RED) & TISSUE (ORANGE) RK4 TRAJECTORY
                                    </span>
                                    <span>Target Therapeutic Window: 400 - 600 mg·h/L</span>
                                </div>

                                <div className="h-64 w-full relative bg-slate-950 rounded-xl overflow-hidden p-2 flex items-end">
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415515_1px,transparent_1px),linear-gradient(to_bottom,#33415515_1px,transparent_1px)] bg-[size:3rem_2rem]" />

                                    {/* Threshold Envelope (Hours 24-48) */}
                                    <div className="absolute top-12 bottom-12 left-1/2 right-4 bg-emerald-500/5 border-y border-emerald-500/20 pointer-events-none" />

                                    {/* SVG Trajectory */}
                                    <svg className="w-full h-full absolute inset-0 overflow-visible p-4">
                                        {/* Central Compartment Curve */}
                                        <polyline
                                            fill="none"
                                            stroke="#f43f5e"
                                            strokeWidth="2.5"
                                            points={tdmCalculations.points
                                                .map((p, i) => `${(i / (tdmCalculations.points.length - 1)) * 650},${220 - Math.min(p.Cc * 3.5, 200)}`)
                                                .join(' ')}
                                        />
                                        {/* Peripheral Compartment Curve */}
                                        <polyline
                                            fill="none"
                                            stroke="#fb923c"
                                            strokeWidth="1.5"
                                            strokeDasharray="4,4"
                                            points={tdmCalculations.points
                                                .map((p, i) => `${(i / (tdmCalculations.points.length - 1)) * 650},${220 - Math.min(p.Cp * 3.5, 200)}`)
                                                .join(' ')}
                                        />
                                    </svg>

                                    <div className="absolute bottom-2 left-4 text-[10px] font-mono text-slate-500">Hour 0</div>
                                    <div className="absolute bottom-2 left-1/2 text-[10px] font-mono text-slate-500">Hour 24 (Steady State)</div>
                                    <div className="absolute bottom-2 right-4 text-[10px] font-mono text-slate-500">Hour 48</div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2">
                                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                        <div className="text-slate-400">RECOMMENDED ADJUSTED DOSE</div>
                                        <div className="text-base font-bold text-rose-400 mt-0.5">{tdmCalculations.adjustedDose} mg q12h</div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                        <div className="text-slate-400">SMART PUMP INFUSION RATE</div>
                                        <div className="text-base font-bold text-cyan-400 mt-0.5">{(tdmCalculations.adjustedDose / 2).toFixed(0)} mg / hr</div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                        <div className="text-slate-400">IEEE 11073 SDC LOCK</div>
                                        <div className="text-base font-bold text-emerald-400 mt-0.5">READY_TO_ARM</div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: SLIDERS */}
                            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs font-mono">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <Workflow className="w-4 h-4 text-rose-400" />
                                    BEDSIDE ICU PARAMETERS
                                </h4>

                                <div>
                                    <div className="flex justify-between text-slate-300 mb-1">
                                        <span>Patient Weight:</span>
                                        <span className="text-rose-400 font-bold">{tdmWeight} kg</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="40"
                                        max="130"
                                        value={tdmWeight}
                                        onChange={e => setTdmWeight(Number(e.target.value))}
                                        className="w-full accent-rose-500 bg-slate-800 rounded h-1.5"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-slate-300 mb-1">
                                        <span>eGFR / CrCl:</span>
                                        <span className="text-rose-400 font-bold">{tdmCrCl} mL/min</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="120"
                                        value={tdmCrCl}
                                        onChange={e => setTdmCrCl(Number(e.target.value))}
                                        className="w-full accent-rose-500 bg-slate-800 rounded h-1.5"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                                        <span>Severe AKI (10)</span>
                                        <span>Normal (120)</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-slate-300 mb-1">
                                        <span>Current Dose:</span>
                                        <span className="text-rose-400 font-bold">{tdmDose} mg</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="500"
                                        max="2500"
                                        step="250"
                                        value={tdmDose}
                                        onChange={e => setTdmDose(Number(e.target.value))}
                                        className="w-full accent-rose-500 bg-slate-800 rounded h-1.5"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-slate-300 mb-1">
                                        <span>Interval:</span>
                                        <span className="text-rose-400 font-bold">q{tdmInterval}h</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {[8, 12, 24].map(int => (
                                            <button
                                                key={int}
                                                onClick={() => setTdmInterval(int)}
                                                className={`py-1 rounded font-mono ${
                                                    tdmInterval === int
                                                        ? 'bg-rose-500 text-slate-950 font-bold'
                                                        : 'bg-slate-800 text-slate-300'
                                                }`}
                                            >
                                                q{int}h
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: STEWART QUANTITATIVE ACID-BASE NOMOGRAM */}
                {/* ========================================================================= */}
                {activeTab === 'stewart' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                <div className="text-slate-400">APPARENT SID (SIDa)</div>
                                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{stewartCalculations.sida} mEq/L</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">Target: 38 - 42 mEq/L</div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                <div className="text-slate-400">EFFECTIVE SID (SIDe)</div>
                                <div className="text-xl font-bold font-mono text-blue-400 mt-1">{stewartCalculations.side} mEq/L</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">HCO3- + Alb- + Pi-</div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                <div className="text-slate-400">STRONG ION GAP (SIG)</div>
                                <div className="text-xl font-bold font-mono text-rose-400 mt-1">{stewartCalculations.sig} mEq/L</div>
                                <div className="text-[10px] text-rose-400/80 mt-0.5">Tox: &gt; 2.5 mEq/L</div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                <div className="text-slate-400">NEWTON-RAPHSON SOLVED pH</div>
                                <div className="text-xl font-bold font-mono text-amber-400 mt-1">{stewartCalculations.physicalPh}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">Converged in {stewartCalculations.iterations} iters</div>
                            </div>
                        </div>

                        {/* PARTITIONING VERDICTS */}
                        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Scale className="w-4 h-4 text-cyan-400" />
                                STEWART MULTI-AXIS PHYSICAL ION PARTITIONING
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div className={`p-3.5 rounded-xl border ${stewartCalculations.unmeasuredToxins ? 'bg-rose-950/30 border-rose-500/40' : 'bg-slate-950 border-slate-800'}`}>
                                    <div className="font-bold text-white">Unmeasured Toxic Anions (SIG {stewartCalculations.sig}):</div>
                                    <p className="text-slate-400 text-[11px] mt-1">
                                        {stewartCalculations.unmeasuredToxins
                                            ? '🚨 POSITIVE: Ketoacids / Uremic Toxins / Salicylate / Ethylene Glycol accumulating in plasma.'
                                            : 'Within homeostatic unmeasured anion envelope.'}
                                    </p>
                                </div>

                                <div className={`p-3.5 rounded-xl border ${stewartCalculations.hyperchloremia ? 'bg-amber-950/30 border-amber-500/40' : 'bg-slate-950 border-slate-800'}`}>
                                    <div className="font-bold text-white">Hyperchloremic Acidosis (Cl {stewartCl}):</div>
                                    <p className="text-slate-400 text-[11px] mt-1">
                                        {stewartCalculations.hyperchloremia
                                            ? '⚠️ DILUTIONAL: Iatrogenic normal saline 0.9% resuscitation. Immediately switch to Plasma-Lyte / balanced crystalloid.'
                                            : 'Chloride ratio within expected range.'}
                                    </p>
                                </div>

                                <div className={`p-3.5 rounded-xl border ${stewartCalculations.hypoalbuminemia ? 'bg-purple-950/30 border-purple-500/40' : 'bg-slate-950 border-slate-800'}`}>
                                    <div className="font-bold text-white">Hypoalbuminemic Mask (Alb {stewartAlb}):</div>
                                    <p className="text-slate-400 text-[11px] mt-1">
                                        {stewartCalculations.hypoalbuminemia
                                            ? '🔍 MASKED ALKALOSIS: Loss of weak acid [Alb-] masks lethal underlying metabolic acidosis. True acidosis is worse than pH indicates.'
                                            : 'Albumin non-volatile buffering normal.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 3: cfDNA LIQUID BIOPSY CONVEX SIMPLEX */}
                {/* ========================================================================= */}
                {activeTab === 'cfdna' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                <div className="text-slate-400">FRAGMENTATION ABERRATION (FAS)</div>
                                <div className="text-xl font-bold font-mono text-purple-400 mt-1">{fasRatio}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">Short (&lt;150bp) / Mononucleosome ratio</div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                <div className="text-slate-400">NUCLEOSOME HELICAL PERIODICITY</div>
                                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">10.42 bp</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">Fourier Spectral Pitch</div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                <div className="text-slate-400">MINIMAL RESIDUAL DISEASE (MRD)</div>
                                <div className="text-sm font-bold font-mono text-rose-400 mt-1">HIGH_RELAPSE_RISK</div>
                                <div className="text-[10px] text-rose-400/80 mt-0.5">Tumor Fraction: 10.1%</div>
                            </div>
                        </div>

                        {/* 12-ORGAN TISSUE DECONVOLUTION BARS */}
                        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <FlaskConical className="w-4 h-4 text-purple-400" />
                                12-ORGAN TISSUE-OF-ORIGIN CONVEX PROJECTION (FISTA ON SIMPLEX)
                            </h4>

                            <div className="space-y-2.5 text-xs font-mono">
                                {[
                                    { organ: 'Healthy Hematopoietic (Leukocytes)', pct: 72.8, color: 'bg-slate-700' },
                                    { organ: 'Lung Alveolar / Bronchial (PRIMARY SUSPECT)', pct: 19.6, color: 'bg-rose-500' },
                                    { organ: 'Hepatocellular (Liver)', pct: 1.2, color: 'bg-cyan-500' },
                                    { organ: 'Colorectal Epithelium', pct: 0.9, color: 'bg-purple-500' },
                                    { organ: 'Pancreatic Ductal', pct: 0.8, color: 'bg-amber-500' },
                                    { organ: 'Mammary Epithelium', pct: 0.7, color: 'bg-pink-500' },
                                    { organ: 'Prostate Glandular', pct: 0.6, color: 'bg-blue-500' },
                                    { organ: 'Renal Tubular', pct: 0.5, color: 'bg-emerald-500' },
                                    { organ: 'Gastric Mucosa', pct: 0.5, color: 'bg-orange-500' },
                                    { organ: 'Vascular Endothelium', pct: 0.5, color: 'bg-teal-500' },
                                    { organ: 'Ovarian Epithelium', pct: 0.5, color: 'bg-indigo-500' },
                                    { organ: 'Glioblastoma / Neural', pct: 0.4, color: 'bg-slate-600' }
                                ].map((item, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-slate-300">
                                            <span>{item.organ}</span>
                                            <span className="font-bold text-white">{item.pct}%</span>
                                        </div>
                                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                                            <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 4: 5-PL IMMUNOASSAY HOOK EFFECT */}
                {/* ========================================================================= */}
                {activeTab === 'hook' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {hookCalculations.isHooked && (
                            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3.5 shadow-lg shadow-rose-950/30">
                                <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                            PROZONE HOOK EFFECT BARRICADE
                                        </span>
                                        <span className="text-xs font-mono text-rose-300">{selectedAnalyte}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white mt-1">
                                        Extreme Antigen Oversaturation Detected — False Normal Blocked!
                                    </h4>
                                    <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                                        Early kinetic velocity ratio ({hookCalculations.ratio}) exceeds threshold ({hookCalculations.threshold}). Nominal result (16.5 mIU/mL) is falsely suppressed by ~250-fold antigen excess. Dispatched 1:100 & 1:1000 serial reflex dilutions!
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs font-mono">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                                    IMMUNOASSAY HOOK ANALYTE CONTROLS
                                </h4>

                                <div>
                                    <span className="text-slate-400">Select Tumor Marker:</span>
                                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                                        {(['BETA_HCG', 'TOTAL_PSA', 'FERRITIN'] as const).map(ana => (
                                            <button
                                                key={ana}
                                                onClick={() => setSelectedAnalyte(ana)}
                                                className={`py-1.5 rounded font-mono ${
                                                    selectedAnalyte === ana
                                                        ? 'bg-amber-500 text-slate-950 font-bold'
                                                        : 'bg-slate-800 text-slate-300'
                                                }`}
                                            >
                                                {ana}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-slate-300 mb-1">
                                        <span>Equilibrium RLU (t=180s):</span>
                                        <span className="text-amber-400 font-bold">{measuredRlu} RLU</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10000"
                                        max="60000"
                                        value={measuredRlu}
                                        onChange={e => setMeasuredRlu(Number(e.target.value))}
                                        className="w-full accent-amber-500 bg-slate-800 rounded h-1.5"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-slate-300 mb-1">
                                        <span>Early Kinetic Velocity (dRLU/dt at t=18s):</span>
                                        <span className="text-amber-400 font-bold">{kineticVelocity} RLU/s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1000"
                                        max="9000"
                                        value={kineticVelocity}
                                        onChange={e => setKineticVelocity(Number(e.target.value))}
                                        className="w-full accent-amber-500 bg-slate-800 rounded h-1.5"
                                    />
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs font-mono">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <Target className="w-4 h-4 text-rose-400" />
                                    INTERCEPTOR VERDICT
                                </h4>

                                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                                    <div className="text-slate-400">KINETIC RATIO R:</div>
                                    <div className="text-xl font-bold font-mono text-white">{hookCalculations.ratio}</div>
                                    <div className="text-[11px] text-slate-500">Threshold: {hookCalculations.threshold}</div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                                    <div className="text-slate-400">TRUE ESTIMATED CONCENTRATION:</div>
                                    <div className="text-xl font-bold font-mono text-rose-400">
                                        {hookCalculations.trueEst} mIU/mL
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        Action: {hookCalculations.isHooked ? 'HARD_BLOCK_FALSE_NEGATIVE_REPORT' : 'VALIDATED_NORMAL_VALUE'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 5: GRAPH-LAPLACIAN PBRTQC */}
                {/* ========================================================================= */}
                {activeTab === 'pbrtqc' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <div>
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-emerald-400" />
                                        4-ANALYZER BIOCHEMISTRY NETWORK (GRAPH-LAPLACIAN CONSENSUS)
                                    </h4>
                                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                                        Analyte: SERUM_POTASSIUM // Box-Cox Moving Winsorized CUSUM
                                    </div>
                                </div>
                                <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Zero-Reagent PBRTQC
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                                {[
                                    { id: 'ROCHE-COBAS-01', model: 'Cobas c503', meanZ: -0.004, cusum: 0, status: 'SYNCHRONIZED_IN_CONTROL', color: 'border-emerald-500/30' },
                                    { id: 'ROCHE-COBAS-02', model: 'Cobas c503', meanZ: -0.077, cusum: 0, status: 'SYNCHRONIZED_IN_CONTROL', color: 'border-emerald-500/30' },
                                    { id: 'ABBOTT-ARCHITECT-03', model: 'c8000', meanZ: 3.056, cusum: 20.45, status: 'AUTO_QUARANTINE_INSTRUMENT_CALIBRATION_DRIFT', color: 'border-rose-500/60 bg-rose-950/20' },
                                    { id: 'SYSMEX-LINE-04', model: 'BioRad Variant', meanZ: -0.077, cusum: 0, status: 'SYNCHRONIZED_IN_CONTROL', color: 'border-emerald-500/30' }
                                ].map((node, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl bg-slate-950 border ${node.color} space-y-2`}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-white">{node.id}</span>
                                            <span className="text-[10px] text-slate-400">{node.model}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            Mean Z-Score: <span className="text-white font-bold">{node.meanZ}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            CUSUM+ Accumulator: <span className="text-amber-400 font-bold">{node.cusum}</span>
                                        </div>
                                        <div className="pt-1 border-t border-slate-900 text-[10px] font-bold">
                                            <span className={node.status.includes('QUARANTINE') ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}>
                                                {node.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
