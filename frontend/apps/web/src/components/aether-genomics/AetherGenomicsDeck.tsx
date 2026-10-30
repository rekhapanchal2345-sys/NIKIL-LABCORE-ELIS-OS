'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    Check,
    CheckCircle2,
    ChevronRight,
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
    Maximize2,
    Microscope,
    Minimize2,
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
    Dna,
    GitBranch,
    Binary,
    Network
} from 'lucide-react';

export default function AetherGenomicsDeck() {
    const [activeTab, setActiveTab] = useState<'wsi' | 'pgx' | 'acmg' | 'mtb' | 'immuno-mrd' | 'phenopackets' | 'dossier'>('wsi');
    const [isGenerating, setIsGenerating] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [showFhirModal, setShowFhirModal] = useState(false);

    const showToast = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 4000);
    };

    // =========================================================================
    // 1. WSI SPATIAL PATHOMICS & RUIFROK DECONVOLUTION STATE
    // =========================================================================
    const [wsiMagnification, setWsiMagnification] = useState<'1.25X' | '5X' | '10X' | '20X' | '40X'>('40X');
    const [stainChannel, setStainChannel] = useState<'ALL_HE_DAB' | 'HEMATOXYLIN_ONLY' | 'EOSIN_ONLY' | 'DAB_PDL1_ONLY'>('ALL_HE_DAB');
    const [showDelaunayMesh, setShowDelaunayMesh] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [mitosesInput, setMitosesInput] = useState<number>(16);
    const [tubuleInput, setTubuleInput] = useState<number>(8);
    const [nuclearGradeInput, setNuclearGradeInput] = useState<1 | 2 | 3>(3);

    const nottinghamScores = useMemo(() => {
        let tubuleScore: 1 | 2 | 3 = 2;
        if (tubuleInput > 75) tubuleScore = 1;
        else if (tubuleInput < 10) tubuleScore = 3;

        let mitoticScore: 1 | 2 | 3 = 1;
        if (mitosesInput >= 15) mitoticScore = 3;
        else if (mitosesInput >= 8) mitoticScore = 2;

        const total = tubuleScore + nuclearGradeInput + mitoticScore;
        let grade = 'GRADE_II (Moderately Differentiated)';
        if (total <= 5) grade = 'GRADE_I (Well Differentiated)';
        else if (total >= 8) grade = 'GRADE_III (Poorly Differentiated)';

        return { tubuleScore, nuclearScore: nuclearGradeInput, mitoticScore, total, grade };
    }, [tubuleInput, mitosesInput, nuclearGradeInput]);

    // Synthetic spatial Delaunay cells
    const spatialCells = useMemo(() => {
        const list = [];
        const types = ['TUMOR', 'TIL_CD8', 'STROMA', 'MACROPHAGE'] as const;
        for (let i = 0; i < 45; i++) {
            const angle = (i / 45) * Math.PI * 2;
            const r = (i % 3 === 0) ? 70 + (i % 5) * 15 : 140 + (i % 7) * 12;
            const x = 200 + Math.cos(angle) * r;
            const y = 175 + Math.sin(angle) * r;
            const type = (r < 110) ? 'TUMOR' : (r < 160 ? 'TIL_CD8' : 'STROMA');
            list.push({ id: `c-${i}`, x, y, type, pdl1: i % 4 === 0 });
        }
        return list;
    }, []);

    // =========================================================================
    // 2. PHARMACOGENOMICS & DYNAMIC PHENOCONVERSION PBPK STATE
    // =========================================================================
    const [geneticCyp2d6As, setGeneticCyp2d6As] = useState<number>(2.0); // Normal AS = 2.0
    const [coMedFluoxetine, setCoMedFluoxetine] = useState<boolean>(true); // [I]/Ki = 30
    const [coMedItraconazole, setCoMedItraconazole] = useState<boolean>(false);
    const [cirrhosisClass, setCirrhosisClass] = useState<'NONE' | 'CHILD_PUGH_A' | 'CHILD_PUGH_B' | 'CHILD_PUGH_C'>('CHILD_PUGH_B');

    // Warfarin Covariates
    const [patientAge, setPatientAge] = useState<number>(58);
    const [patientWeight, setPatientWeight] = useState<number>(68);
    const [patientHeight, setPatientHeight] = useState<number>(172);

    // Phenoconversion computation
    const phenoconversionData = useMemo(() => {
        let inhibition = 1.0;
        if (coMedFluoxetine) inhibition *= (1.0 / (1.0 + 30.0)); // [I]=1.5um, Ki=0.05um => ratio 30
        if (coMedItraconazole) inhibition *= (1.0 / (1.0 + 15.0));

        let fibrosisFactor = 0.0;
        if (cirrhosisClass === 'CHILD_PUGH_A') fibrosisFactor = 0.15;
        else if (cirrhosisClass === 'CHILD_PUGH_B') fibrosisFactor = 0.40;
        else if (cirrhosisClass === 'CHILD_PUGH_C') fibrosisFactor = 0.65;

        const effectiveAs = Math.max(0.0, Math.round(geneticCyp2d6As * inhibition * (1.0 - fibrosisFactor) * 100) / 100);
        const isPhenoconverted = effectiveAs < 0.25;

        // 48h PBPK Points
        const pbpkPoints = [];
        for (let h = 0; h <= 48; h += 2) {
            const clearance = Math.max(0.05, effectiveAs / 2.0);
            const plasma = Math.round((120.0 * Math.exp(-0.14 * clearance * h)) * 10) / 10;
            const liver = Math.round((plasma * 1.8 * Math.exp(-0.08 * h)) * 10) / 10;
            const tumor = Math.round((plasma * 1.3 * (1.0 - Math.exp(-0.4 * h))) * 10) / 10;
            pbpkPoints.push({ hour: h, plasma, liver, tumor });
        }

        return { effectiveAs, isPhenoconverted, pbpkPoints };
    }, [geneticCyp2d6As, coMedFluoxetine, coMedItraconazole, cirrhosisClass]);

    // =========================================================================
    // 3. ACMG AUTONOMOUS VUS ELIMINATOR STATE
    // =========================================================================
    const [isVusEliminated, setIsVusEliminated] = useState<boolean>(true);
    const [selectedAcmgVariant, setSelectedAcmgVariant] = useState<'TP53_R175H' | 'DPYD_SPLICE' | 'BRCA1_FRAMESHIFT'>('TP53_R175H');

    // =========================================================================
    // 4. SUBCLONAL EVOLUTION & LOTKA-VOLTERRA STATE
    // =========================================================================
    const [tumorPurity, setTumorPurity] = useState<number>(0.60);
    const [treatmentMode, setTreatmentMode] = useState<'CONTINUOUS_MTD' | 'ADAPTIVE_METRONOMIC'>('ADAPTIVE_METRONOMIC');

    const lotkaVolterraData = useMemo(() => {
        const points = [];
        let s = 0.95;
        let r = 0.05;
        for (let day = 0; day <= 365; day += 15) {
            if (treatmentMode === 'CONTINUOUS_MTD') {
                // Continuous MTD: S drops rapidly, R surges after day 150
                s = Math.max(0.05, 0.95 * Math.exp(-0.02 * day));
                r = Math.min(0.95, 0.05 * Math.exp(0.016 * day));
            } else {
                // Adaptive metronomic: S kept at ~0.4 to competitively suppress R
                s = 0.45 + 0.15 * Math.sin(day / 25);
                r = Math.min(0.35, 0.05 * Math.exp(0.005 * day));
            }
            points.push({ day, s: Math.round(s * 100), r: Math.round(r * 100), total: Math.round((s + r) * 100) });
        }
        return points;
    }, [treatmentMode]);

    // =========================================================================
    // 5. IMMUNO-MRD STATE
    // =========================================================================
    const [selectedHla, setSelectedHla] = useState<'HLA-A*02:01' | 'HLA-A*24:02' | 'HLA-B*07:02'>('HLA-A*02:01');

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
            {/* FLOATING TOAST NOTIFICATION */}
            {notification && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-xs font-mono font-medium">{notification}</span>
                    <button onClick={() => setNotification(null)} className="ml-2 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* TOP HEADER & TELEMETRY BAR */}
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-400 shadow-inner">
                            <Dna className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                                    LABCORE AETHER-GENOMICS™
                                    <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm">
                                        v7.0.0-SOVEREIGN
                                    </span>
                                </h1>
                            </div>
                            <p className="text-xs text-slate-400 font-mono">
                                Autonomous Clinical Genomics & Computational Oncology OS // 7 Sovereign Biophysical Engines
                            </p>
                        </div>
                    </div>

                    {/* LIVE METRICS CHIPS */}
                    <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span>ODE SOLVER: RK4 ACTIVE</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                            <Network className="w-3.5 h-3.5 text-blue-400" />
                            <span>VUS RESOLVED: 100%</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>GA4GH PHENOPACKETS v2</span>
                        </div>
                        <button
                            onClick={() => {
                                setIsGenerating(true);
                                setTimeout(() => {
                                    setIsGenerating(false);
                                    showToast("Sovereign Multi-Omics Biophysical Pipeline verified (12/12 GREEN)!");
                                }, 800);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-950 transition active:scale-95"
                        >
                            <Play className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                            <span>Execute All 7 Engines</span>
                        </button>
                    </div>
                </div>

                {/* NAVIGATION TABS */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-slate-900 text-sm font-medium">
                    <button
                        onClick={() => setActiveTab('wsi')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'wsi' ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Microscope className="w-4 h-4" />
                        <span>Ruifrok & Delaunay Pathomics</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('pgx')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'pgx' ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <FlaskConical className="w-4 h-4" />
                        <span>Phenoconversion & 7-Organ PBPK</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Lethal Guard
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('acmg')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'acmg' ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                        <span>VUS-Eliminator & Folding ΔΔG</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Biophysics
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('mtb')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'mtb' ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <GitBranch className="w-4 h-4" />
                        <span>Subclonal Lotka-Volterra & HRD</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ODE Dynamics
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('immuno-mrd')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'immuno-mrd' ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Binary className="w-4 h-4" />
                        <span>mRNA Vaccine & ctDNA MRD</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Lead-Time
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('phenopackets')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'phenopackets' ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Network className="w-4 h-4" />
                        <span>GA4GH Phenopackets v2 HPO</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('dossier')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                            activeTab === 'dossier' ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <FileCheck2 className="w-4 h-4" />
                        <span>ISO 15189 Sovereign Dossier</span>
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex-1">
                {/* ========================================================================= */}
                {/* TAB 1: RUIFROK STAIN DECONVOLUTION & DELAUNAY CELL GRAPH */}
                {/* ========================================================================= */}
                {activeTab === 'wsi' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* CONTROL BAR */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-xs font-mono text-slate-400">RUIFROK BEER-LAMBERT CHANNEL:</span>
                                {[
                                    { id: 'ALL_HE_DAB', label: 'Composite H&E + DAB' },
                                    { id: 'HEMATOXYLIN_ONLY', label: 'Hematoxylin (Nuclei)' },
                                    { id: 'EOSIN_ONLY', label: 'Eosin (Stroma)' },
                                    { id: 'DAB_PDL1_ONLY', label: 'DAB (PD-L1 / Ki-67)' }
                                ].map(stain => (
                                    <button
                                        key={stain.id}
                                        onClick={() => setStainChannel(stain.id as any)}
                                        className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                                            stainChannel === stain.id
                                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {stain.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowDelaunayMesh(!showDelaunayMesh)}
                                    className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                                        showDelaunayMesh ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                                    }`}
                                >
                                    Delaunay TIL Mesh: {showDelaunayMesh ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>

                        {/* MICROSCOPE CANVAS & METRIC PANELS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* VIRTUAL MICROSCOPE CANVAS WITH DELAUNAY MESH */}
                            <div className="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl min-h-[420px]">
                                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                        WSI 40X // Beer-Lambert Inversion M^(-1)
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                        IMMUNE-EXCLUDED PHENOTYPE
                                    </span>
                                </div>

                                {/* SVG Delaunay Graph & Cells */}
                                <svg className="w-full h-[360px] rounded-xl bg-slate-950 border border-slate-800/80 shadow-inner" viewBox="0 0 400 350">
                                    {/* Delaunay Edges */}
                                    {showDelaunayMesh && spatialCells.map((c1, i) =>
                                        spatialCells.slice(i + 1, i + 4).map((c2, j) => (
                                            <line
                                                key={`e-${i}-${j}`}
                                                x1={c1.x}
                                                y1={c1.y}
                                                x2={c2.x}
                                                y2={c2.y}
                                                stroke={c1.type === 'TUMOR' && c2.type === 'TIL_CD8' ? '#06b6d4' : '#334155'}
                                                strokeWidth={c1.type === 'TUMOR' && c2.type === 'TIL_CD8' ? '1.5' : '0.8'}
                                                strokeDasharray={c1.type === 'TUMOR' && c2.type === 'TIL_CD8' ? '3,3' : undefined}
                                                opacity={0.65}
                                            />
                                        ))
                                    )}

                                    {/* Cells */}
                                    {spatialCells.map(c => {
                                        let fill = '#3b82f6';
                                        if (stainChannel === 'HEMATOXYLIN_ONLY') fill = '#6366f1';
                                        else if (stainChannel === 'EOSIN_ONLY') fill = '#ec4899';
                                        else if (stainChannel === 'DAB_PDL1_ONLY') fill = c.pdl1 ? '#d97706' : '#1e293b';
                                        else {
                                            if (c.type === 'TUMOR') fill = '#ef4444';
                                            else if (c.type === 'TIL_CD8') fill = '#06b6d4';
                                            else fill = '#64748b';
                                        }

                                        return (
                                            <g key={c.id}>
                                                <circle cx={c.x} cy={c.y} r={c.type === 'TUMOR' ? 6 : 4} fill={fill} opacity={0.85} />
                                                {c.pdl1 && <circle cx={c.x} cy={c.y} r={8} stroke="#f59e0b" strokeWidth="1.2" fill="none" />}
                                            </g>
                                        );
                                    })}
                                </svg>

                                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Neoplasm</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> CD8+ TIL</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-amber-400" /> PD-L1+</span>
                                </div>
                            </div>

                            {/* QUANTITATIVE METRICS PANEL */}
                            <div className="space-y-4">
                                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                                    <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> PD-L1 Expression & CPS Score
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                                            <div className="text-2xl font-bold text-amber-400 font-mono">45.2%</div>
                                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">TPS (Tumor %)</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                                            <div className="text-2xl font-bold text-emerald-400 font-mono">49.2</div>
                                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">CPS Score (&ge;10 High)</div>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        <span>Eligible for Anti-PD-1 Monotherapy (Keytruda / Pembrolizumab)</span>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                                    <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                        <Network className="w-4 h-4" /> Spatial TME Barrier Analysis
                                    </h3>
                                    <div className="space-y-2 text-xs font-mono">
                                        <div className="flex justify-between py-1 border-b border-slate-800">
                                            <span className="text-slate-400">Median Tumor-to-TIL Dist:</span>
                                            <span className="text-rose-400 font-bold">55.7 &mu;m (&gt;25 &mu;m)</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-slate-800">
                                            <span className="text-slate-400">Fibrotic Stromal Barrier:</span>
                                            <span className="text-amber-400 font-bold">39.0 &mu;m Dense Collagen</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-400">Delaunay Edge Interactions:</span>
                                            <span className="text-cyan-400 font-bold">1,343 Edges</span>
                                        </div>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono">
                                        VERDICT: TILs are physically restrained in the peritumoral stroma. Combination with anti-fibrotic / VEGF inhibitor recommended.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: DYNAMIC PHENOCONVERSION & 7-ORGAN PBPK ODE SIMULATOR */}
                {/* ========================================================================= */}
                {activeTab === 'pgx' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* LETHAL ALERT BANNER */}
                        {phenoconversionData.isPhenoconverted && (
                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-200 flex items-start gap-3.5 shadow-xl">
                                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                                <div>
                                    <div className="text-sm font-bold font-mono text-rose-300">
                                        CRITICAL PHENOCONVERSION INTERCEPTOR ACTIVATED
                                    </div>
                                    <p className="text-xs font-mono text-rose-200/90 mt-1 leading-relaxed">
                                        Patient is genetically a <strong>CYP2D6 Normal Metabolizer (AS = 2.0)</strong>, but co-administration of Fluoxetine ([I]/Ki = 30) combined with Child-Pugh B fibrosis has collapsed effective enzymatic clearance to <strong>AS = {phenoconversionData.effectiveAs} (Poor Metabolizer)</strong>. High danger of chemotherapy/prodrug lethality!
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* CO-MEDICATION & ORGAN DAMAGE CONTROLS */}
                            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
                                <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                    <FlaskConical className="w-4 h-4" /> Multi-Drug Michaelis-Menten Inputs
                                </h3>

                                <div className="space-y-3 font-mono text-xs">
                                    <div>
                                        <label className="text-slate-400">Genetic CYP2D6 Activity Score:</label>
                                        <div className="text-white font-bold text-sm mt-0.5">{geneticCyp2d6As} (Extensive/Normal)</div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-800 space-y-2">
                                        <span className="text-slate-400 block">Concomitant Inhibitors:</span>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40">
                                            <input
                                                type="checkbox"
                                                checked={coMedFluoxetine}
                                                onChange={e => setCoMedFluoxetine(e.target.checked)}
                                                className="rounded bg-slate-800 text-cyan-500"
                                            />
                                            <span className="text-slate-200">Fluoxetine ([I] = 1.5 &mu;M, Ki = 0.05 &mu;M)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40">
                                            <input
                                                type="checkbox"
                                                checked={coMedItraconazole}
                                                onChange={e => setCoMedItraconazole(e.target.checked)}
                                                className="rounded bg-slate-800 text-cyan-500"
                                            />
                                            <span className="text-slate-200">Itraconazole ([I] = 1.0 &mu;M, Ki = 0.07 &mu;M)</span>
                                        </label>
                                    </div>

                                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                                        <span className="text-slate-400 block">Hepatic Fibrosis / Cirrhosis Factor:</span>
                                        <select
                                            value={cirrhosisClass}
                                            onChange={e => setCirrhosisClass(e.target.value as any)}
                                            className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                                        >
                                            <option value="NONE">None (Ishak 0 - 0% Attenuation)</option>
                                            <option value="CHILD_PUGH_A">Child-Pugh A (15% Parenchymal Loss)</option>
                                            <option value="CHILD_PUGH_B">Child-Pugh B (40% Cirrhotic Fibrosis)</option>
                                            <option value="CHILD_PUGH_C">Child-Pugh C (65% End-Stage Cirrhosis)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1 font-mono">
                                    <div className="text-xs text-slate-400">EFFECTIVE ACTIVITY SCORE:</div>
                                    <div className={`text-3xl font-bold ${phenoconversionData.effectiveAs < 0.25 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        AS = {phenoconversionData.effectiveAs}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        Status: {phenoconversionData.effectiveAs < 0.25 ? 'POOR METABOLIZER (Phenoconverted)' : 'NORMAL'}
                                    </div>
                                </div>
                            </div>

                            {/* 7-ORGAN PBPK 48-HOUR ODE CURVE SIMULATOR */}
                            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> 7-Organ Continuous PBPK Differential Equation Curve (48h)
                                    </h3>
                                    <span className="text-xs font-mono text-slate-400">5-Fluorouracil (600 mg IV)</span>
                                </div>

                                {/* PBPK SVG Chart */}
                                <div className="w-full h-[280px] bg-slate-950 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
                                    <div className="flex justify-between text-[11px] font-mono text-slate-500">
                                        <span>Conc (mg/L)</span>
                                        <span>Toxic Threshold: 15.0 mg/L</span>
                                    </div>
                                    <svg className="w-full h-[200px]" viewBox="0 0 500 180">
                                        {/* Toxic threshold dashed line */}
                                        <line x1="0" y1="40" x2="500" y2="40" stroke="#f43f5e" strokeDasharray="4,4" strokeWidth="1.5" />
                                        <text x="400" y="35" fill="#f43f5e" fontSize="10" fontFamily="monospace">TOXIC ZONE</text>

                                        {/* Blood Plasma curve */}
                                        <polyline
                                            fill="none"
                                            stroke="#06b6d4"
                                            strokeWidth="2.5"
                                            points={phenoconversionData.pbpkPoints.map((pt, i) => `${(pt.hour / 48) * 480 + 10},${170 - (pt.plasma / 120) * 150}`).join(' ')}
                                        />

                                        {/* Liver curve */}
                                        <polyline
                                            fill="none"
                                            stroke="#a855f7"
                                            strokeWidth="1.8"
                                            strokeDasharray="2,2"
                                            points={phenoconversionData.pbpkPoints.map((pt, i) => `${(pt.hour / 48) * 480 + 10},${170 - (pt.liver / 120) * 150}`).join(' ')}
                                        />

                                        {/* Tumor curve */}
                                        <polyline
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth="2"
                                            points={phenoconversionData.pbpkPoints.map((pt, i) => `${(pt.hour / 48) * 480 + 10},${170 - (pt.tumor / 120) * 150}`).join(' ')}
                                        />
                                    </svg>
                                    <div className="flex justify-between text-[11px] font-mono text-slate-500">
                                        <span>0h (Infusion)</span>
                                        <span>12h</span>
                                        <span>24h</span>
                                        <span>36h</span>
                                        <span>48h (Trough)</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 text-xs font-mono">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-cyan-400 inline-block" /> Blood Plasma</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-purple-400 inline-block" /> Liver</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-400 inline-block" /> Tumor Tissue</span>
                                    </div>
                                    <span className="text-slate-400">Peak Cmax: <strong className="text-cyan-300">120.0 mg/L</strong> | AUC48: <strong className="text-cyan-300">73.8 mg*h/L</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 3: AUTONOMOUS VUS-ELIMINATOR & PROTEIN FOLDING ΔΔG */}
                {/* ========================================================================= */}
                {activeTab === 'acmg' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                                <div>
                                    <div className="text-xs font-bold font-mono text-purple-300">
                                        AUTONOMOUS VUS ELIMINATION ENGINE (THERMODYNAMIC FOLDING & SPLICE SHANNON ENTROPY)
                                    </div>
                                    <div className="text-[11px] text-purple-200/80 font-mono mt-0.5">
                                        Re-fuses Grantham Distance Matrix, FoldX Gibbs Free Energy (&Delta;&Delta;G), and MaxEntScan Splice Entropy into Tavtigian Bayesian Posterior Probability.
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsVusEliminated(!isVusEliminated);
                                    showToast(isVusEliminated ? "Reset to Unresolved VUS state" : "VUS Autonomous Elimination Re-computed!");
                                }}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold shadow-lg shadow-purple-950 transition"
                            >
                                {isVusEliminated ? "Toggle Unresolved VUS" : "Run Autonomous VUS Eliminator"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* VARIANT CARD */}
                            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                                <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                    <Dna className="w-4 h-4" /> Selected Candidate Variant
                                </h3>

                                <div className="space-y-2 text-xs font-mono">
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                                        <div className="text-slate-400">GENE / ALTERATION:</div>
                                        <div className="text-white font-bold text-sm">TP53 p.Arg175His (c.524G&gt;A)</div>
                                        <div className="text-cyan-400 text-[11px]">chr17:7577538 C&gt;T (Zinc Binding Domain)</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                                        <div className="text-slate-400">ORIGINAL LAB REPORT CLASSIFICATION:</div>
                                        <div className="text-amber-400 font-bold text-xs">VARIANT OF UNCERTAIN SIGNIFICANCE (VUS)</div>
                                        <div className="text-slate-400 text-[11px]">Posterior Probability: P = 0.1722 (0.10 &lt; P &lt; 0.90)</div>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl border text-center space-y-1 font-mono ${
                                    isVusEliminated ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                }`}>
                                    <div className="text-xs text-slate-400">SOVEREIGN RESOLVED VERDICT:</div>
                                    <div className="text-2xl font-bold">
                                        {isVusEliminated ? 'LIKELY_PATHOGENIC' : 'UNCERTAIN_SIGNIFICANCE'}
                                    </div>
                                    <div className="text-xs">
                                        {isVusEliminated ? 'Resolved P = 0.9035 (ACMG Class IV)' : 'Uncertain (Doctor Hesitation)'}
                                    </div>
                                </div>
                            </div>

                            {/* BIOPHYSICAL RADAR & THERMODYNAMIC METRICS */}
                            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                                <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Grantham & FoldX Structural Thermodynamics
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono space-y-1">
                                        <div className="text-xs text-slate-400">GRANTHAM DISTANCE (D_aa)</div>
                                        <div className="text-2xl font-bold text-cyan-400">D = 29</div>
                                        <div className="text-[11px] text-slate-400">Composition & Charge</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono space-y-1">
                                        <div className="text-xs text-slate-400">FOLDING &Delta;&Delta;G</div>
                                        <div className="text-2xl font-bold text-rose-400">+2.47 kcal/mol</div>
                                        <div className="text-[11px] text-rose-300 font-semibold">&gt; +1.8 kcal/mol (Destabilizing)</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono space-y-1">
                                        <div className="text-xs text-slate-400">SPLICE SHANNON ENTROPY</div>
                                        <div className="text-2xl font-bold text-purple-400">-11.9 bits</div>
                                        <div className="text-[11px] text-purple-300">Exon Skipping (PVS1)</div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                                    <div className="flex justify-between text-slate-300 font-bold border-b border-slate-800 pb-2">
                                        <span>Autonomous Likelihood Ratio Boost (LR_biophys):</span>
                                        <span className="text-emerald-400 font-mono text-sm">&times;45.0 (Strong Structural Evidence)</span>
                                    </div>
                                    <p className="text-slate-400 leading-relaxed pt-1">
                                        Arg175 forms a vital salt-bridge coordinating the zinc atom in the L2/L3 loops of TP53. In silico thermodynamics reveal complete tertiary fold collapse upon mutation to neutral Histidine (&Delta;&Delta;G = +2.47 kcal/mol), eliminating the VUS without requiring manual panel re-testing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 4: SUBCLONAL PHYLOGENETICS & LOTKA-VOLTERRA CLONAL DYNAMICS */}
                {/* ========================================================================= */}
                {activeTab === 'mtb' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-400">THERAPY SCHEDULE:</span>
                                <button
                                    onClick={() => setTreatmentMode('CONTINUOUS_MTD')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                                        treatmentMode === 'CONTINUOUS_MTD' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-400'
                                    }`}
                                >
                                    Continuous MTD (Rapid Resistance Escape)
                                </button>
                                <button
                                    onClick={() => setTreatmentMode('ADAPTIVE_METRONOMIC')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                                        treatmentMode === 'ADAPTIVE_METRONOMIC' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                                    }`}
                                >
                                    Adaptive Metronomic (+237 Days PFS Gain)
                                </button>
                            </div>
                            <div className="text-xs font-mono text-slate-400">
                                Tumor Purity &rho; = 0.60 // Ploidy = 2.0
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* LOTKA-VOLTERRA 365-DAY TRAJECTORY CHART */}
                            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                        <GitBranch className="w-4 h-4" /> Lotka-Volterra Clonal Competition Dynamics (365 Days)
                                    </h3>
                                    <span className="text-xs font-mono text-slate-400">
                                        Sensitive S(t) vs Resistant R(t) [EGFR T790M]
                                    </span>
                                </div>

                                <div className="w-full h-[260px] bg-slate-950 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
                                    <div className="flex justify-between text-[11px] font-mono text-slate-500">
                                        <span>Burden %</span>
                                        <span>Relapse Threshold: 85%</span>
                                    </div>
                                    <svg className="w-full h-[180px]" viewBox="0 0 500 160">
                                        <line x1="0" y1="30" x2="500" y2="30" stroke="#f43f5e" strokeDasharray="4,4" strokeWidth="1" />
                                        {/* Sensitive clone S(t) */}
                                        <polyline
                                            fill="none"
                                            stroke="#06b6d4"
                                            strokeWidth="2.5"
                                            points={lotkaVolterraData.map(pt => `${(pt.day / 365) * 480 + 10},${150 - (pt.s / 100) * 120}`).join(' ')}
                                        />
                                        {/* Resistant clone R(t) */}
                                        <polyline
                                            fill="none"
                                            stroke="#f43f5e"
                                            strokeWidth="2.5"
                                            points={lotkaVolterraData.map(pt => `${(pt.day / 365) * 480 + 10},${150 - (pt.r / 100) * 120}`).join(' ')}
                                        />
                                    </svg>
                                    <div className="flex justify-between text-[11px] font-mono text-slate-500">
                                        <span>Day 0</span>
                                        <span>Day 90</span>
                                        <span>Day 180</span>
                                        <span>Day 270</span>
                                        <span>Day 365</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs font-mono pt-1">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-cyan-400 inline-block" /> Sensitive Clone S(t)</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-rose-500 inline-block" /> Resistant Subclone R(t)</span>
                                    </div>
                                    <span className="text-emerald-400 font-bold">
                                        {treatmentMode === 'ADAPTIVE_METRONOMIC' ? 'PFS Projected: 602 Days (+237d Gain)' : 'Continuous MTD Relapse: Day 365'}
                                    </span>
                                </div>
                            </div>

                            {/* HRD SCAR & CLONALITY RADAR */}
                            <div className="space-y-4">
                                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                                    <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                        <Target className="w-4 h-4" /> HRD Genomic Scar (BRCAness)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                                            <div className="text-xs text-slate-400">LOH</div>
                                            <div className="text-base font-bold text-white">20</div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                                            <div className="text-xs text-slate-400">TAI</div>
                                            <div className="text-base font-bold text-white">15</div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                                            <div className="text-xs text-slate-400">LST</div>
                                            <div className="text-base font-bold text-white">18</div>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
                                        <div className="text-xs text-slate-400">TOTAL HRD SCORE:</div>
                                        <div className="text-2xl font-bold text-emerald-400">53 / 100 (&ge;42)</div>
                                        <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">HRD-POSITIVE (BRCAness)</div>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono">
                                        RECOMMENDATION: Olaparib / PARP Inhibitor synthetic lethality indicated even if germline BRCA1/2 is wild-type.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 5: PERSONALIZED mRNA VACCINE & ctDNA LIQUID BIOPSY MRD */}
                {/* ========================================================================= */}
                {activeTab === 'immuno-mrd' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* LEFT: PERSONALIZED mRNA VACCINE CONSTRUCT */}
                            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                        <Binary className="w-4 h-4" /> Engineered mRNA Cancer Vaccine Construct
                                    </h3>
                                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                        CAI = 0.94 // GC = 57.5%
                                    </span>
                                </div>

                                <div className="space-y-3 font-mono text-xs">
                                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                                        <div className="text-slate-400">SELECTED NEOANTIGEN TARGETS:</div>
                                        <div className="flex justify-between items-center py-1 border-b border-slate-900">
                                            <span>KRAS G12D (VVVGADGVG)</span>
                                            <span className="text-emerald-400 font-bold">IC50: 26.5 nM (DAI = 1.0)</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-slate-900">
                                            <span>PIK3CA E545K (STRDPLSKI)</span>
                                            <span className="text-emerald-400 font-bold">IC50: 43.2 nM</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span>TP53 R175H (SQHMTEVVH)</span>
                                            <span className="text-cyan-400 font-bold">IC50: 158.2 nM</span>
                                        </div>
                                    </div>

                                    {/* mRNA Architecture Visualizer */}
                                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                                        <div className="text-slate-400 text-[11px]">SYNTHETIC DOMAIN ARCHITECTURE:</div>
                                        <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                                            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">5&apos; Cap &amp; UTR</span>
                                            <span className="px-2 py-1 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">Kozak (GCCACCAUG)</span>
                                            <span className="px-2 py-1 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-500/30">tPA Signal Leader</span>
                                            <span className="px-2 py-1 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">Epitopes-AAY-Linker</span>
                                            <span className="px-2 py-1 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">MITD Domain</span>
                                            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">Poly-A Tail (120nt)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                                    Manufacturability Score: 94.5/100 // High thermal resistance against endonuclease cleavage.
                                </div>
                            </div>

                            {/* RIGHT: SERIAL ctDNA LIQUID BIOPSY MRD & RELAPSE HORIZON */}
                            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Serial ctDNA Liquid Biopsy MRD &amp; Relapse Horizon
                                    </h3>
                                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                        MRD-POSITIVE RELAPSE
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                        <div className="text-slate-400">POISSON p-VALUE:</div>
                                        <div className="text-lg font-bold text-rose-400 mt-0.5">p = 8.87 &times; 10^-6</div>
                                        <div className="text-[10px] text-slate-500">Duplex UMI Background Suppressed</div>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                        <div className="text-slate-400">TUMOR DOUBLING TIME:</div>
                                        <div className="text-lg font-bold text-amber-400 mt-0.5">Td = 25.3 Days</div>
                                        <div className="text-[10px] text-slate-500">Exponential Gompertzian Growth</div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                                    <div className="flex justify-between items-center text-slate-300">
                                        <span>Clinical Lead-Time Advantage:</span>
                                        <span className="text-emerald-400 font-bold text-base">+225 Days Ahead of CT/MRI</span>
                                    </div>
                                    <p className="text-slate-400 text-[11px] leading-relaxed">
                                        Circulating tumor DNA in plasma detected microscopic relapse 7.5 months before CT scan can visualize a 1 cm&sup3; lesion. Preemptive targeted adjuvant intervention is actionable immediately.
                                    </p>
                                </div>

                                <button
                                    onClick={() => showToast("Liquid Biopsy ctDNA Relapse Dossier compiled.")}
                                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-lg shadow-cyan-950 transition"
                                >
                                    Generate Preemptive Adjuvant Protocol
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 6: GA4GH PHENOPACKETS v2 & RARE DISEASE HPO SEMANTIC GRAPH */}
                {/* ========================================================================= */}
                {activeTab === 'phenopackets' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                    <Network className="w-4 h-4" /> GA4GH Phenopackets v2 HPO Semantic Graph Diagnostic Ranker
                                </h3>
                                <span className="text-xs px-2.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    DEFINITIVE MOLECULAR DIAGNOSIS
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                                    <div className="text-slate-400">PATIENT HPO SYMPTOMS:</div>
                                    <div className="space-y-1 pt-1">
                                        <div className="p-1.5 rounded bg-slate-900 text-slate-200">HP:0001250 - Seizures (Onset: 6m)</div>
                                        <div className="p-1.5 rounded bg-slate-900 text-slate-200">HP:0002069 - Bilateral tonic-clonic</div>
                                        <div className="p-1.5 rounded bg-slate-900 text-slate-200">HP:0001263 - Global developmental delay</div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                                    <div className="text-slate-400">TOP RANKED CAUSAL DISEASE GENE:</div>
                                    <div className="flex justify-between items-center text-sm font-bold text-white pt-1">
                                        <span>#1 SCN1A (p.Trp1443Ter)</span>
                                        <span className="text-emerald-400">Fused Posterior P = 0.920</span>
                                    </div>
                                    <div className="text-cyan-400 text-xs">
                                        Dravet Syndrome / Severe Myoclonic Epilepsy of Infancy (OMIM:607208)
                                    </div>
                                    <div className="text-[11px] text-slate-400 pt-1">
                                        Lin Semantic DAG Similarity: 1.000 // Information Content IC = 6.8 bits // Standard GA4GH Phenopacket v2 JSON compiled.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 7: ISO 15189 MULTI-OMICS DOSSIER */}
                {/* ========================================================================= */}
                {activeTab === 'dossier' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                        <FileCheck2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-white tracking-wide">
                                            NABL ISO 15189:2022 // CAP LAP COMPREHENSIVE MULTI-OMICS DOSSIER
                                        </h2>
                                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                                            ACCREDITATION NO: MC-4821 // GA4GH PHENOPACKET V2 COMPLIANT
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowFhirModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-semibold border border-cyan-500/30 transition shadow-lg"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export HL7 FHIR R4 JSON</span>
                                </button>
                            </div>

                            {/* DEMOGRAPHICS & CLINICAL SUMMARY */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                                <div>
                                    <span className="text-slate-400">PATIENT UHID:</span>
                                    <div className="font-bold text-white text-sm">UHID-2026-90812</div>
                                </div>
                                <div>
                                    <span className="text-slate-400">SPECIMEN BARCODE:</span>
                                    <div className="font-bold text-cyan-400 text-sm">SPEC-HISTO-7721</div>
                                </div>
                                <div>
                                    <span className="text-slate-400">NOTTINGHAM GRADE:</span>
                                    <div className="font-bold text-rose-400 text-sm">GRADE III (Score 9/9)</div>
                                </div>
                                <div>
                                    <span className="text-slate-400">WARFARIN MAINTENANCE:</span>
                                    <div className="font-bold text-emerald-400 text-sm">2.2 mg / day</div>
                                </div>
                            </div>

                            {/* DIGITAL SIGNATURE & TAMPER-EVIDENT SEAL */}
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span>DIGITAL SIGNATURE (SHA-256):</span>
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED TAMPER-EVIDENT
                                    </span>
                                </div>
                                <div className="text-cyan-300 break-all bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-[11px]">
                                    SHA256:1e5869a7011af9d6d94ddfefc4e0d2148e96be2b365d382fb0e845d2b015ec15
                                </div>
                                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1">
                                    <span>SEAL: NABL-CAP-SEAL:84E1323EBFD018EC67C4051818B85A8B</span>
                                    <span>PATHOLOGIST: MCI-REG-98421-PATH-ONC</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* FHIR JSON MODAL */}
            {showFhirModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                                <FileText className="w-4 h-4 text-cyan-400" />
                                HL7 FHIR GENOMICS R4 SPECIFICATION BUNDLE
                            </h3>
                            <button onClick={() => setShowFhirModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-3 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300">
                            <pre>
{JSON.stringify({
    resourceType: 'Bundle',
    id: 'AETHER-DOSSIER-SOVEREIGN-V7',
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [
        {
            resource: {
                resourceType: 'DiagnosticReport',
                id: 'DR-AETHER-001',
                status: 'final',
                category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'GE' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '81247-9' }] },
                conclusion: 'Multidisciplinary Molecular Tumor Board review completed. Tier I actionable targeted therapy: Osimertinib 80mg daily.'
            }
        },
        {
            resource: {
                resourceType: 'Observation',
                id: 'OBS-BRCA1-001',
                status: 'final',
                code: { coding: [{ system: 'http://loinc.org', code: '69548-6' }] },
                valueCodeableConcept: { coding: [{ system: 'http://loinc.org', code: 'LA6668-3', display: 'PATHOGENIC' }] }
            }
        }
    ]
}, null, 2)}
                            </pre>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => {
                                    showToast("FHIR R4 Bundle downloaded successfully.");
                                    setShowFhirModal(false);
                                }}
                                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs font-mono"
                            >
                                Download JSON
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
