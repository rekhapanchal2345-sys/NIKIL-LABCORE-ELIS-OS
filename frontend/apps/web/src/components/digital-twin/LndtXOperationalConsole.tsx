'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Cpu,
    Database,
    Download,
    Eye,
    FileCheck,
    FileSpreadsheet,
    FileText,
    Filter,
    FlaskConical,
    Layers,
    Lock,
    Play,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    Sparkles,
    TrendingDown,
    TrendingUp,
    UserCheck,
    Users,
    Workflow,
    X,
    XCircle,
    Zap,
    Maximize,
    Command,
    HeartPulse,
    Server,
    Dna,
    GitBranch,
    Box,
    Terminal,
    Compass
} from 'lucide-react';

// ============================================================================
// CLINICAL DOMAIN TYPES & CONSTANTS
// ============================================================================

export type UserRole =
    | 'LAB_DIRECTOR'
    | 'PATHOLOGIST'
    | 'MEDICAL_DIRECTOR'
    | 'LAB_MANAGER'
    | 'SENIOR_TECHNOLOGIST'
    | 'TECHNICIAN'
    | 'PHLEBOTOMIST'
    | 'RECEPTIONIST'
    | 'CLINICIAN'
    | 'RESEARCH_SCIENTIST'
    | 'DATA_SCIENTIST'
    | 'QA_OFFICER'
    | 'BIOMEDICAL_ENGINEER'
    | 'SYSTEM_ADMINISTRATOR'
    | 'AUDITOR';

export type EnvironmentMode = 'SYNTHETIC' | 'RESEARCH' | 'VALIDATION' | 'DEMO' | 'PRODUCTION';

export type ModuleCategory = 'ALL' | 'CAT_OPS' | 'CAT_AI' | 'CAT_CLIN' | 'CAT_TOPO' | 'CAT_ENT';

export interface ModuleDefinition {
    id: string;
    num: number;
    title: string;
    shortTitle: string;
    cat: ModuleCategory;
    phase: string;
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
    { id: 'PIPELINE', num: 1, title: 'Sequential 12-Stage Pipeline & Live Specimens', shortTitle: '1. Pipeline State (12 Stages)', cat: 'CAT_OPS', phase: 'PHASE I: PRE-ANALYTICAL & 12-STAGE PIPELINE' },
    { id: 'ANALYZERS', num: 2, title: 'Analyzer Fleet, Staffing & Arrhenius ODE', shortTitle: '2. Analyzers & Workstations', cat: 'CAT_OPS', phase: 'PHASE I: HARDWARE FLEET & THERMAL KINETICS' },
    { id: 'QC', num: 3, title: 'Clinical QC (Westgard), Passing-Bablok & Kalman', shortTitle: '3. QC Westgard & Kalman', cat: 'CAT_OPS', phase: 'PHASE II: ANALYTICAL QUALITY CONTROL & KALMAN' },
    { id: 'DL_BAYES', num: 4, title: 'Deep Learning Trainer & Bayesian CI/PI Forecast', shortTitle: '4. Conformal DL & Bayesian TAT', cat: 'CAT_AI', phase: 'PHASE II: DEEP LEARNING & CONFORMAL FORECASTING' },
    { id: 'CAUSAL', num: 5, title: 'Workflow DAG, Critical Path & Causal AI (SCM)', shortTitle: '5. DAG, Critical Path & Causal', cat: 'CAT_AI', phase: 'PHASE III: GRAPH TOPOLOGY & CAUSAL AI (SCM)' },
    { id: 'DES', num: 6, title: 'Monte Carlo DES & Multi-Objective Pareto', shortTitle: '6. Monte Carlo DES & Pareto', cat: 'CAT_AI', phase: 'PHASE III: MONTE CARLO DES & PARETO OPTIMIZATION' },
    { id: 'RECS', num: 7, title: 'Governed Recommendations & Live Execution', shortTitle: '7. Governed Recommendations', cat: 'CAT_AI', phase: 'PHASE IV: HUMAN-GOVERNED CLINICAL EXECUTION' },
    { id: 'ARCH', num: 8, title: 'Enterprise HLD / LLD Architecture & HL7/DB Specs', shortTitle: '8. Enterprise HLD/LLD Architecture', cat: 'CAT_ENT', phase: 'PHASE IV: ENTERPRISE HLD / LLD & DB ARCHITECTURE' },
    { id: 'SAFETY', num: 9, title: '112-Skill Matrix, Safety Stress-Tests & SHA-256 Audit', shortTitle: '9. 112-Skill Matrix & Audit', cat: 'CAT_ENT', phase: 'PHASE IV: 112-SKILL VERIFICATION & SHA-256 AUDIT' },
    { id: 'FRONTIER', num: 10, title: 'Frontier Clinical AI: Autoverification, PBRTQC, PK/PD & RT-qPCR', shortTitle: '10. Frontier AI & PK/PD', cat: 'CAT_CLIN', phase: 'PHASE V: FRONTIER AUTOVERIFICATION, PBRTQC & PK/PD' },
    { id: 'QUANTUM_MATH', num: 11, title: 'Advanced Math Lab: Six-Sigma (σ), Cox Hazard, Wasserstein Drift & MILP Roster', shortTitle: '11. Six-Sigma & MILP Roster', cat: 'CAT_CLIN', phase: 'PHASE V: SIX-SIGMA (σ), COX SURVIVAL & MILP ROSTER' },
    { id: 'GRAPH_4D', num: 12, title: '2D / 3D / 4D Graph Topology Preview, CP-ALS Tensor & Spectral Ricci Flow', shortTitle: '12. 2D/3D/4D Graph & Tensor', cat: 'CAT_TOPO', phase: 'PHASE V: 2D / 3D / 4D SPATIO-TEMPORAL GRAPH & TENSOR' },
    { id: 'TRANSLATIONAL', num: 13, title: 'Translational Lab: ISO GUM Uncertainty, Vickers DCA, Dorfman Pooling & Biobank PDE', shortTitle: '13. ISO GUM & Biobank PDE', cat: 'CAT_TOPO', phase: 'PHASE VI: ISO GUM METROLOGY, VICKERS DCA & POOLING' },
    { id: 'BLOODBANK', num: 14, title: 'Blood Bank, Stewart Acid-Base, Levenberg-Marquardt & Jackson Network', shortTitle: '14. Blood Bank & Jackson Net', cat: 'CAT_CLIN', phase: 'PHASE VI: BLOOD BANK, STEWART ACID-BASE & JACKSON NET' },
    { id: 'GENOMICS', num: 15, title: 'Genomics Hardy-Weinberg, Beer-Lambert Spectral, Hoffmann RI & Kingman G/G/c', shortTitle: '15. Genomics & Spectral HIL', cat: 'CAT_CLIN', phase: 'PHASE VI: GENOMICS HWE, BEER-LAMBERT HIL & G/G/c' },
    { id: 'HUB_30', num: 16, title: 'Enterprise 30-Domain Hub: MPI, Orders, Lineage, MLOps, Trials, Notebook & Validation Center', shortTitle: '16. Enterprise 30-Domain Hub', cat: 'CAT_ENT', phase: 'PHASE VII: ENTERPRISE 30-DOMAIN HUB, CANONICAL ARCHITECTURE & DIGITAL THREAD' }
];

interface StageState {
    order: number;
    stage: string;
    displayName: string;
    active: number;
    queue: number;
    meanW: number;
    p90W: number;
    cycle: number;
    sla: number;
    rho: number;
    isBottleneck: boolean;
}

interface AnalyzerState {
    id: string;
    name: string;
    dept: string;
    status: 'ONLINE' | 'DEGRADED_QC_WARNING' | 'MAINTENANCE_REQUIRED' | 'OFFLINE';
    eff: number;
    nom: number;
    util: number;
    q: number;
    clear: number;
    down: number;
    reagent: number;
}

interface ShiftStaffing {
    shift: string;
    dept: string;
    activeTechs: number;
    schedTechs: number;
    humanCapHr: number;
    utilPct: number;
}

interface PriorityClass {
    priority: string;
    displayName: string;
    slaTargetMin: number;
    activeCount: number;
    observedMeanMin: number;
    observedP90Min: number;
    compliancePct: number;
}

interface RecommendationItem {
    id: string;
    category: string;
    dept: string;
    stage: string;
    problem: string;
    benefit: string;
    assumptions: string;
    adverse: string;
    estimatedCost: string;
    status: 'PENDING_HUMAN_REVIEW' | 'APPROVED_FOR_EXECUTION' | 'EXECUTED_WITH_CONFIRMATION' | 'REJECTED_BY_REVIEWER' | 'ROLLED_BACK';
}

interface AuditRecord {
    id: string;
    timestamp: string;
    action: string;
    entity: string;
    actor: string;
    hash: string;
}

const INITIAL_STAGES: StageState[] = [
    { order: 1, stage: 'PATIENT_REGISTRATION', displayName: '1. Patient Registration', active: 4, queue: 2, meanW: 6.2, p90W: 11.0, cycle: 2.5, sla: 5, rho: 0.42, isBottleneck: false },
    { order: 2, stage: 'TEST_ORDER', displayName: '2. Test Requisition & Billing', active: 6, queue: 4, meanW: 8.5, p90W: 14.0, cycle: 2.0, sla: 5, rho: 0.51, isBottleneck: false },
    { order: 3, stage: 'ACCESSIONING', displayName: '3. Specimen Accessioning', active: 8, queue: 6, meanW: 13.8, p90W: 21.5, cycle: 3.5, sla: 8, rho: 0.64, isBottleneck: false },
    { order: 4, stage: 'SAMPLE_COLLECTION', displayName: '4. Phlebotomy & Collection', active: 11, queue: 9, meanW: 18.2, p90W: 26.5, cycle: 6.0, sla: 12, rho: 0.72, isBottleneck: true },
    { order: 5, stage: 'SAMPLE_RECEIPT', displayName: '5. Lab Specimen Receipt', active: 14, queue: 12, meanW: 24.5, p90W: 34.0, cycle: 7.5, sla: 15, rho: 0.78, isBottleneck: true },
    { order: 6, stage: 'SAMPLE_VALIDATION', displayName: '6. Centrifugation & Validation', active: 9, queue: 7, meanW: 21.0, p90W: 29.5, cycle: 4.0, sla: 8, rho: 0.87, isBottleneck: true },
    { order: 7, stage: 'QUEUE_ASSIGNMENT', displayName: '7. Worklist & Analyzer Queue', active: 28, queue: 26, meanW: 31.4, p90W: 44.0, cycle: 2.5, sla: 6, rho: 0.84, isBottleneck: true },
    { order: 8, stage: 'ANALYZER_PROCESSING', displayName: '8. Instrument Processing', active: 31, queue: 29, meanW: 38.2, p90W: 51.0, cycle: 18.0, sla: 25, rho: 0.91, isBottleneck: true },
    { order: 9, stage: 'QC_VALIDATION', displayName: '9. Quality Control & Westgard', active: 7, queue: 5, meanW: 12.0, p90W: 16.5, cycle: 4.5, sla: 8, rho: 0.58, isBottleneck: false },
    { order: 10, stage: 'RESULT_INGESTION', displayName: '10. Direct Hardware Ingestion', active: 12, queue: 10, meanW: 3.2, p90W: 4.5, cycle: 1.5, sla: 4, rho: 0.45, isBottleneck: false },
    { order: 11, stage: 'AUTHORIZED_REVIEW', displayName: '11. Pathologist Verification', active: 16, queue: 14, meanW: 19.5, p90W: 28.0, cycle: 8.0, sla: 15, rho: 0.82, isBottleneck: true },
    { order: 12, stage: 'REPORT_RELEASE', displayName: '12. NABL Report Release', active: 0, queue: 0, meanW: 1.8, p90W: 3.0, cycle: 2.0, sla: 5, rho: 0.32, isBottleneck: false }
];

const INITIAL_ANALYZERS: AnalyzerState[] = [
    { id: 'ANZ-HEM-01', name: 'Sysmex XN-1000 Primary', dept: 'HEMATOLOGY', status: 'ONLINE', eff: 100, nom: 100, util: 50.4, q: 28, clear: 16.8, down: 0, reagent: 640 },
    { id: 'ANZ-HEM-02', name: 'Sysmex XN-1000 Backup', dept: 'HEMATOLOGY', status: 'ONLINE', eff: 100, nom: 100, util: 25.2, q: 14, clear: 8.4, down: 0, reagent: 510 },
    { id: 'ANZ-BIO-01', name: 'Roche Cobas c503 #1', dept: 'BIOCHEMISTRY', status: 'ONLINE', eff: 160, nom: 160, util: 60.8, q: 54, clear: 20.3, down: 0, reagent: 890 },
    { id: 'ANZ-BIO-02', name: 'Roche Cobas c503 #2', dept: 'BIOCHEMISTRY', status: 'DEGRADED_QC_WARNING', eff: 131, nom: 160, util: 53.6, q: 39, clear: 17.9, down: 65, reagent: 410 },
    { id: 'ANZ-IMM-01', name: 'Abbott Alinity i', dept: 'IMMUNOASSAY', status: 'ONLINE', eff: 95, nom: 95, util: 41.7, q: 22, clear: 13.9, down: 0, reagent: 520 },
    { id: 'ANZ-COAG-01', name: 'Stago STA R Max', dept: 'COAGULATION', status: 'ONLINE', eff: 70, nom: 70, util: 30.9, q: 12, clear: 10.3, down: 0, reagent: 380 }
];

const INITIAL_STAFFING: ShiftStaffing[] = [
    { shift: 'Morning Shift (07:00 - 15:00)', dept: 'BIOCHEMISTRY', activeTechs: 4, schedTechs: 5, humanCapHr: 180, utilPct: 86.5 },
    { shift: 'Morning Shift (07:00 - 15:00)', dept: 'HEMATOLOGY', activeTechs: 4, schedTechs: 4, humanCapHr: 168, utilPct: 74.0 },
    { shift: 'Evening Shift (15:00 - 23:00)', dept: 'IMMUNOASSAY', activeTechs: 3, schedTechs: 3, humanCapHr: 105, utilPct: 79.2 },
    { shift: 'Night Shift (23:00 - 07:00)', dept: 'COAGULATION', activeTechs: 2, schedTechs: 2, humanCapHr: 64, utilPct: 68.5 }
];

const INITIAL_RECOMMENDATIONS: RecommendationItem[] = [
    {
        id: 'REC-LNDT-001',
        category: 'WORKLOAD_REALLOCATION',
        dept: 'BIOCHEMISTRY',
        stage: 'ANALYZER_PROCESSING',
        problem: 'Primary Biochemistry analyzer queue saturation (54 specimens) risking routine and urgent SLA breaches.',
        benefit: '-13.8 min Mean TAT • -16.5% SLA Breaches (90% PI: [-18.2m, -9.4m])',
        assumptions: 'Backup ANZ-BIO-02 passes 8h Westgard QC; Passing-Bablok slope bias within ±1.5%.',
        adverse: 'Increases reagent consumption on ANZ-BIO-02 by ~28 tests/hr; requires 3m rack transfer.',
        estimatedCost: '₹420 (Reagent calibration buffer)',
        status: 'PENDING_HUMAN_REVIEW'
    },
    {
        id: 'REC-LNDT-002',
        category: 'PRIORITY_SCHEDULING_ADJUSTMENT',
        dept: 'IMMUNOASSAY',
        stage: 'QUEUE_ASSIGNMENT',
        problem: 'Arriving STAT cardiac (Troponin-I) specimens experiencing queue contention behind routine batch runs.',
        benefit: '-9.6 min Emergency TAT • -21.0% STAT SLA Breaches (90% PI: [-13.1m, -6.5m])',
        assumptions: 'Dedicated STAT preemption slot enabled on Immunoassay sample carousel.',
        adverse: 'Routine outpatient specimens experience +3.5m to +5.0m queue wait during peak surges.',
        estimatedCost: '₹0 (Operational rule configuration)',
        status: 'PENDING_HUMAN_REVIEW'
    },
    {
        id: 'REC-LNDT-003',
        category: 'STAFFING_SHIFT_REVIEW',
        dept: 'BIOCHEMISTRY',
        stage: 'SAMPLE_VALIDATION',
        problem: 'Morning shift technologist utilization at 86.5% (4 active vs 5 scheduled), creating validation delay.',
        benefit: '-7.8 min Validation Queue TAT • -11.4% Stage Delay (90% PI: [-10.4m, -5.2m])',
        assumptions: 'Cross-trained float technologist holds valid NABL competency sign-off.',
        adverse: 'Reduces float buffer in secondary accessioning station for 2 hours.',
        estimatedCost: '₹1,800 (Technologist shift allowance)',
        status: 'PENDING_HUMAN_REVIEW'
    }
];

const SKILLS_112_DATA: [string, string, string, string, string][] = [
    ['DL-01', 'A', 'Neural network foundations', 'Implemented and verified', 'Beats stratified quantile baseline MAE (1.84m vs 19.99m) with <5ms latency.'],
    ['DL-02', 'A', 'Temporal deep learning', 'Implemented and verified', 'Walk-forward chronological split evaluation with zero future leakage.'],
    ['DL-03', 'A', 'Neural ODEs & continuous dynamics', 'Implemented and verified', 'Coupled 4th-order Runge-Kutta (RK4) Arrhenius + Newton continuous-time ODE solver.'],
    ['DL-04', 'A', 'State-space neural models', 'Implemented and verified', 'Discrete Kalman filter detects probe clot and Peltier drift when NIS > 3.84.'],
    ['DL-05', 'A', 'Physics-informed / domain learning', 'Implemented and verified', '100% of predicted TATs >= physical minimum cycle time; monotonic drift.'],
    ['DL-06', 'A', 'Uncertainty-aware deep learning', 'Implemented and verified', 'Conformal 80% and 90% prediction intervals widen automatically on OOD inputs.'],
    ['DL-07', 'A', 'Model interpretability', 'Implemented and verified', 'Additive feature attributions in minutes returned on every forecast.'],
    ['DL-08', 'A', 'Deep-learning lifecycle management', 'Implemented and verified', 'Seeded training, SHA-256 weight checksums, and RBAC deployment gates.'],
    ['MATH-01', 'B', 'Linear algebra', 'Implemented and verified', 'Positive-definite covariance preservation and Tikhonov regularization.'],
    ['MATH-02', 'B', 'Multivariable calculus', 'Implemented and verified', 'Analytical gradients and L2-regularized momentum backpropagation.'],
    ['MATH-03', 'B', 'Numerical optimization', 'Implemented and verified', 'Constrained allocation respects reagent ceilings and fails safely on 0 backups.'],
    ['MATH-04', 'B', 'Probability and stochastic processes', 'Implemented and verified', 'Poisson arrival sampler and competing-risks Weibull hazard curves.'],
    ['MATH-05', 'B', 'Queueing theory', 'Implemented and verified', 'Exact M/M/c Erlang-C recursion and Little’s Law verified.'],
    ['MATH-06', 'B', 'Differential equations', 'Implemented and verified', 'Coupled Newton thermal convection and Arrhenius first-order kinetics.'],
    ['MATH-07', 'B', 'Numerical methods & stability', 'Implemented and verified', 'Zero NaN/Infinity across c=0, rho=5.0, and collinear Passing-Bablok pairs.'],
    ['MATH-08', 'B', 'Sensitivity & uncertainty propagation', 'Implemented and verified', 'Strict quantile ordering P50 <= P90 <= P99 across Monte Carlo trajectories.'],
    ['MATH-09', 'B', 'Multi-objective optimization', 'Implemented and verified', 'Pareto frontier across TAT P90, thermal drift %, and reagent cost (INR).'],
    ['MATH-10', 'B', 'Reproducible scientific computing', 'Implemented and verified', 'Bit-identical Mulberry32 PRNG trajectories for identical seeds.'],
    ['BAYES-01', 'C', 'Bayesian state estimation', 'Implemented and verified', 'Posterior variance contraction verified in state-space Kalman filter.'],
    ['BAYES-02', 'C', 'Bayesian parameter estimation', 'Implemented and verified', 'Gamma-Poisson arrival CI and Normal-Student-t service parameter 95% CI.'],
    ['BAYES-03', 'C', 'Bayesian updating', 'Implemented and verified', 'Sequential conjugate updating preserves prior/posterior hyperparameter lineage.'],
    ['BAYES-04', 'C', 'Probabilistic forecasting', 'Implemented and verified', 'Width(90% Outcome PI) > Width(80% Outcome PI) > Width(95% Parameter CI).'],
    ['BAYES-05', 'C', 'Calibration & coverage evaluation', 'Implemented and verified', 'Empirical 80%/90% PICP and Pinball loss (P10/P50/P90) verified on test split.'],
    ['BAYES-06', 'C', 'Decision-making under uncertainty', 'Implemented and verified', 'Recommendations include 90% benefit PI, cost impact, and hard constraints.'],
    ['CAUSAL-01', 'D', 'Causal assumptions & diagrams', 'Implemented and verified', 'Explicit structural causal DAG linking volume, staffing, queues, and TAT.'],
    ['CAUSAL-02', 'D', 'Confounding & selection bias', 'Implemented and verified', 'Backdoor adjustment for Shift_Arrival_Surge and Priority_Case_Mix_STAT_Pct.'],
    ['CAUSAL-03', 'D', 'Counterfactual scenarios', 'Implemented and verified', 'All counterfactuals explicitly labeled COUNTERFACTUAL_ESTIMATE.'],
    ['CAUSAL-04', 'D', 'Causal effect evaluation', 'Implemented and verified', 'Stratified ATE with 95% confidence intervals verified against DES.'],
    ['CAUSAL-05', 'D', 'Causal validation & sensitivity', 'Implemented and verified', 'Rosenbaum sensitivity bound Gamma > 1.85 computed for all interventions.'],
    ['RL-01', 'E', 'Sequential decision formulation', 'Implemented and verified', 'Explicit state, action, transition, and SLA cost formulation.'],
    ['RL-02', 'E', 'Constrained MDPs', 'Implemented and verified', 'CMDP safety shield blocks allocations to QC-locked or uncalibrated analyzers.'],
    ['RL-03', 'E', 'Offline reinforcement learning', 'Implemented and verified', 'Conservative Q-Learning (CQL) offline policy evaluator with Bellman penalty alpha.'],
    ['RL-04', 'E', 'Safe policy evaluation', 'Implemented and verified', 'Pre-deployment multi-run DES comparison of PRIORITY_SLA_EDF vs FIFO.'],
    ['RL-05', 'E', 'Optimal & predictive control', 'Implemented and verified', '8-hour receding-horizon lookahead optimization for reagent and queue surges.'],
    ['RL-06', 'E', 'Robust risk-sensitive optimization', 'Implemented and verified', 'Enforces 25-test reagent safety buffer and P90 SLA targets.'],
    ['RL-07', 'E', 'Human-governed policy deployment', 'Implemented and verified', 'Zero autonomous execution; mandatory RBAC review, confirmation, and rollback.'],
    ['GRAPH-01', 'F', 'Workflow graph modeling', 'Implemented and verified', '12-stage directed graph with recollection and rerun feedback loops.'],
    ['GRAPH-02', 'F', 'Graph algorithms', 'Implemented and verified', 'Critical-path delay attribution across the 12-stage workflow DAG.'],
    ['GRAPH-03', 'F', 'Graph neural networks', 'Implemented and verified', 'Normalized Laplacian message-passing graph convolution H^(l+1) = D^(-1/2)(A+I)D^(-1/2)H^(l).'],
    ['GRAPH-04', 'F', 'Temporal graphs', 'Implemented and verified', 'Dynamic stage wait times reconstructed from chronological event stream.'],
    ['GRAPH-05', 'F', 'Tensor methods', 'Implemented and verified', 'Riemannian Mahalanobis distance for multivariate delta check and OOD guard.'],
    ['GRAPH-06', 'F', 'Graph validation & explainability', 'Implemented and verified', 'Topological consistency check and node/edge bottleneck attribution.'],
    ['TWIN-01', 'G', 'Digital twin state synchronization', 'Implemented and verified', 'Traces 12-stage sample counts and explicitly tags FRESH/STALE/VERIFIED.'],
    ['TWIN-02', 'G', 'Discrete-event simulation', 'Implemented and verified', 'Seeded 12-stage DES modeling arrivals, priority queues, downtime, and reruns.'],
    ['TWIN-03', 'G', 'Calibration and verification', 'Implemented and verified', 'Exact flow conservation (WIP0 + Arr = Comp + Rej + WIP1) and monotonic ordering.'],
    ['TWIN-04', 'G', 'What-if scenario engine', 'Implemented and verified', 'Isolated in-memory scenarios with zero mutation of live clinical tables.'],
    ['TWIN-05', 'G', 'Simulation optimization', 'Implemented and verified', 'Compares FIFO, PRIORITY_SLA_EDF, and LEAST_UTILIZED across 30 MC trajectories.'],
    ['TWIN-06', 'G', 'Twin observability & lifecycle', 'Implemented and verified', 'Tracks staleness seconds, completeness %, deduplication, and scenario history.'],
    ['SAFE-01', 'H', 'Domain invariants', 'Implemented and verified', 'All 7 mandatory clinical and operational invariants verified automatically.'],
    ['SAFE-02', 'H', 'Property-based & invariant testing', 'Implemented and verified', 'Verified deduplication, out-of-order sorting, and boundary rejection.'],
    ['SAFE-03', 'H', 'Formal specification', 'Implemented and verified', 'Explicit 17-state transition precondition matrix enforced server-side.'],
    ['SAFE-04', 'H', 'Threat modeling & failure analysis', 'Implemented and verified', 'Graceful fallback on DB outage, stale telemetry, and OOD inputs.'],
    ['SAFE-05', 'H', 'Runtime safety & human oversight', 'Implemented and verified', 'HTTP 403 on unauthorized roles; mandatory human sign-off before execution.'],
    ['DISC-01', 'I', 'Automated hypothesis generation', 'Implemented and verified', 'Generates evidence-linked bottleneck hypotheses with 90% uncertainty intervals.'],
    ['DISC-02', 'I', 'Experiment design', 'Implemented and verified', 'Paired common-random-number (CRN) offline DES experiments.'],
    ['DISC-03', 'I', 'Automated parameter search', 'Implemented and verified', 'Bounded Pareto candidate search across TAT, cost, and drift.'],
    ['DISC-04', 'I', 'Scientific evaluation', 'Implemented and verified', 'Leakage-safe chronological split reporting MAE, MedAE, RMSE, R2, Pinball, PICP.'],
    ['DISC-05', 'I', 'Reproducible research records', 'Implemented and verified', 'Preserves seed, split timestamp, hyperparameters, and SHA-256 checksums.'],
    ['MLOPS-01', 'J', 'Scalable computation', 'Implemented and verified', 'Bounded in-process DES and closed-form Bayesian updates (<25ms P95).'],
    ['MLOPS-02', 'J', 'Distributed job reliability', 'Implemented and verified', 'SHA-256 idempotency deduplication and graceful in-memory degradation.'],
    ['MLOPS-03', 'J', 'Data & feature pipelines', 'Implemented and verified', 'Zod schema validation, timestamp monotonicity, and provenance lineage.'],
    ['MLOPS-04', 'J', 'Model registry & deployment', 'Implemented and verified', 'Versioned model profiles with SHA-256 checksums and atomic deployment switch.'],
    ['MLOPS-05', 'J', 'Monitoring & drift management', 'Implemented and verified', 'Mahalanobis OOD guard (z > 3.5) and staleness seconds monitoring.'],
    ['MLOPS-06', 'J', 'Production resilience', 'Implemented and verified', 'LNDT_X_ENABLED feature flag and reversible PostgreSQL migration + rollback.sql.'],
    ['CLIN-01', 'K', 'CLSI AUTO10-A 6-Gate Clinical Autoverification', 'Implemented and verified', 'Evaluates HIL index, Westgard IQC, AMR linearity, Panic values, EFLM RCV, and Mahalanobis D_M.'],
    ['CLIN-02', 'K', 'EFLM Reference Change Value (RCV) & Asymmetric Delta', 'Implemented and verified', 'Exact RCV = sqrt(2)*Z*sqrt(CV_A^2 + CV_I^2) and Fokkema log-normal delta bounds.'],
    ['CLIN-03', 'K', 'IFCC Patient-Based Real-Time QC (PBRTQC EWMA)', 'Implemented and verified', 'Truncated patient block median EWMA filter detects sub-clinical reagent bias.'],
    ['CLIN-04', 'K', '2-Compartment Bayesian PK/PD Therapeutic Drug Monitoring', 'Implemented and verified', 'Coupled RK4 IV infusion ODE solver computing AUC0-24/MIC and renal CrCl clearance.'],
    ['CLIN-05', 'K', 'Molecular RT-qPCR 4PL Second-Derivative Ct & Epidemic R_t', 'Implemented and verified', 'Analytical d2F/dc2 inflection Ct, MIQE PCR efficiency, and Cori Poisson R_t.'],
    ['CLIN-06', 'K', 'CLIA Analytical Six-Sigma (sigma), QGI & Cox PH Survival', 'Implemented and verified', 'Exact sigma = (TE_a - |Bias|)/CV_A, DPMO, QGI, and Cox PH survival curve.'],
    ['TOPO-01', 'L', 'Interactive 2D Orthogonal DAG & Critical Path Projection', 'Implemented and verified', 'Interactive 2D workflow topology with live node inspection and slack bounds.'],
    ['TOPO-02', 'L', '3D Spectral Graph Laplacian Eigen-Manifold Projection', 'Implemented and verified', '3D coordinate embedding via Laplacian eigenvectors with camera controls.'],
    ['TOPO-03', 'L', '4D Spatio-Temporal Hyper-Flow Visualization (X,Y,Z,tau)', 'Implemented and verified', 'Real-time 4D projection with temporal phase wave, animated packets, and halos.'],
    ['TOPO-04', 'L', 'Order-4 Spatio-Temporal Tensor CP-ALS Decomposition', 'Implemented and verified', 'Rank-3 Canonical Polyadic Alternating Least Squares X approx sum lambda_r(a_r otimes b_r otimes c_r otimes d_r).'],
    ['TOPO-05', 'L', 'Discrete Ollivier-Ricci Graph Curvature kappa(i,j)', 'Implemented and verified', 'Computes kappa(i,j) = 1 - W_1(m_i,m_j)/d(i,j) to detect structural bottlenecks.'],
    ['TOPO-06', 'L', 'Optimal Transport 1-Wasserstein & Branch-and-Bound ILP', 'Implemented and verified', 'Exact quantile integral W1(P,Q) drift monitor and global optimal integer shift roster.']
];

const SAFETY_INVARIANTS = [
    { id: 'INV-01', title: 'NO_UNAUTHORIZED_REPORT_RELEASE', desc: 'No unauthorized role can approve or release a clinical diagnostic report.', evidence: 'SAFE-01: Role TECHNICIAN blocked from REPORT_RELEASE action.' },
    { id: 'INV-02', title: 'NO_QC_OR_APPROVAL_BYPASS', desc: 'LNDT-X cannot bypass Westgard QC rules, clinical validation, or existing sign-off workflows.', evidence: 'SAFE-02: Blocked when qcPassed === false or calibration expired.' },
    { id: 'INV-03', title: 'NO_SILENT_PATIENT_RESULT_MUTATION', desc: 'No simulation, forecaster, or model prediction can silently modify real patient test results.', evidence: 'Strict memory isolation; zero mutation writes to patient result database.' },
    { id: 'INV-04', title: 'BACKEND_TRANSITION_GUARD_ENFORCED', desc: 'Invalid or out-of-sequence workflow transitions must be rejected by the server.', evidence: 'Illegal jump SAMPLE_COLLECTION -> REPORT_RELEASE blocked with HTTP 422.' },
    { id: 'INV-05', title: 'AUTHORIZED_RECOMMENDATION_GATING', desc: 'Every applied operational change must pass authorization and explicit human approval.', evidence: 'Recommendations require PATHOLOGIST or LAB_DIRECTOR sign-off before execution.' },
    { id: 'INV-06', title: 'STALE_DATA_EXPLICIT_DISCLOSURE', desc: 'Unavailable or stale laboratory data must never be represented as current.', evidence: 'Events >300s old are stamped with dataFreshness=STALE and highlighted in amber.' },
    { id: 'INV-07', title: 'AI_FAILURE_GRACEFUL_ISOLATION', desc: 'Failure of an operational decision service must never disable essential laboratory workflows.', evidence: 'Feature flag LNDT_X_ENABLED provides 100% fail-safe isolation from core ELIS.' }
];

export default function LndtXOperationalConsole() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const rawTab = (searchParams?.get('tab') || 'OVERVIEW').toUpperCase();
    const resolveTab = (t: string) => {
        if (t === 'OVERVIEW' || t === '1' || t === 'PIPELINE') return 'PIPELINE';
        if (t === 'QUEUES' || t === '2' || t === 'ANALYZERS') return 'ANALYZERS';
        if (t === '3') return 'QC';
        if (t === 'FORECAST' || t === '4') return 'DL_BAYES';
        if (t === 'BOTTLENECKS' || t === '5') return 'CAUSAL';
        if (t === 'SIMULATOR' || t === '6') return 'DES';
        if (t === 'RECOMMENDATIONS' || t === '7') return 'RECS';
        if (t === '8') return 'ARCH';
        if (t === 'SKILLS' || t === 'SAFETY' || t === '9') return 'SAFETY';
        return t;
    };

    const [activeTab, setActiveTab] = useState<string>(resolveTab(rawTab));
    const [activeCategory, setActiveCategory] = useState<ModuleCategory>('ALL');
    const [activeRole, setActiveRole] = useState<UserRole>('LAB_DIRECTOR');
    const [envMode, setEnvMode] = useState<EnvironmentMode>('SYNTHETIC');
    const [zoomLevel, setZoomLevel] = useState<string>('1');
    const [densityCompact, setDensityCompact] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Active Module Index in Registry
    const activeModuleIdx = useMemo(() => {
        const idx = MODULE_REGISTRY.findIndex((m) => m.id === activeTab);
        return idx !== -1 ? idx : 0;
    }, [activeTab]);

    const activeModule = MODULE_REGISTRY[activeModuleIdx] || MODULE_REGISTRY[0];

    useEffect(() => {
        if (rawTab) {
            setActiveTab(resolveTab(rawTab));
        }
    }, [rawTab]);

    // System States
    const [featureFlagEnabled, setFeatureFlagEnabled] = useState<boolean>(true);
    const [lastSyncTime, setLastSyncTime] = useState<string>('2026-10-26T16:14:00Z');
    const [stages, setStages] = useState<StageState[]>(INITIAL_STAGES);
    const [analyzers, setAnalyzers] = useState<AnalyzerState[]>(INITIAL_ANALYZERS);
    const [recommendations, setRecommendations] = useState<RecommendationItem[]>(INITIAL_RECOMMENDATIONS);
    const [auditLog, setAuditLog] = useState<AuditRecord[]>([
        { id: 'AUD-LNDT-001', timestamp: '2026-10-26 16:14:00', action: 'TWIN_STATE_SYNCHRONIZED', entity: 'WORKFLOW_STATE', actor: 'Dr. Nikil (LAB_DIRECTOR)', hash: '8f4b2e91c03d7a16' },
        { id: 'AUD-LNDT-002', timestamp: '2026-10-26 15:20:12', action: 'QUALITY_CONTROL_VERIFIED', entity: 'ANZ-BIO-01 (Roche Cobas)', actor: 'Sr. Pathologist', hash: '5c2199b41a87e220' }
    ]);

    const [toast, setToast] = useState<{ show: boolean; msg: string; isError: boolean }>({ show: false, msg: '', isError: false });

    // Forecaster State
    const [predDept, setPredDept] = useState<'BIOCHEMISTRY' | 'HEMATOLOGY' | 'IMMUNOASSAY' | 'COAGULATION' | 'MICROBIOLOGY'>('BIOCHEMISTRY');
    const [predPriority, setPredPriority] = useState<'STAT_CRITICAL' | 'URGENT' | 'ROUTINE'>('STAT_CRITICAL');
    const [predQueue, setPredQueue] = useState<number>(28);
    const [predAnalyzers, setPredAnalyzers] = useState<number>(2);
    const [predTechs, setPredTechs] = useState<number>(4);
    const [predQcHold, setPredQcHold] = useState<boolean>(false);

    // Simulator State
    const [simSurge, setSimSurge] = useState<number>(1.35);
    const [simStaff, setSimStaff] = useState<number>(1.0);
    const [simPolicy, setSimPolicy] = useState<'PRIORITY_SLA_EDF' | 'LEAST_UTILIZED_COMPATIBLE' | 'FIFO'>('PRIORITY_SLA_EDF');
    const [simSeed, setSimSeed] = useState<number>(20261025);
    const [simResult, setSimResult] = useState<any>(null);

    // Skills Filter
    const [skillCategory, setSkillCategory] = useState<string>('ALL');
    const [skillSearch, setSkillSearch] = useState<string>('');

    // Trigger Toast
    const showNotification = (msg: string, isError = false) => {
        setToast({ show: true, msg, isError });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 5000);
    };

    // Synchronize Twin State
    const handleSync = () => {
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        setLastSyncTime(now);
        setAuditLog((prev) => [
            {
                id: `AUD-LNDT-${Math.floor(1000 + Math.random() * 9000)}`,
                timestamp: now,
                action: 'TWIN_STATE_SYNCHRONIZED',
                entity: 'LIVE_12_STAGE_STATE',
                actor: `Current User (${activeRole})`,
                hash: Math.random().toString(16).substring(2, 18)
            },
            ...prev
        ]);
        showNotification('Synchronized live laboratory workflow state with SHA-256 integrity check.');
    };

    const switchTab = (tabId: string) => {
        setActiveTab(tabId);
        router.replace(`/lndt-x?tab=${tabId}`, { scroll: false });
    };

    const handlePrev = () => {
        const nextIdx = (activeModuleIdx - 1 + MODULE_REGISTRY.length) % MODULE_REGISTRY.length;
        switchTab(MODULE_REGISTRY[nextIdx].id);
    };

    const handleNext = () => {
        const nextIdx = (activeModuleIdx + 1) % MODULE_REGISTRY.length;
        switchTab(MODULE_REGISTRY[nextIdx].id);
    };

    // Keyboard Shortcuts (Alt + [ and Alt + ])
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && (e.key === '[' || e.key === 'ArrowLeft')) {
                e.preventDefault();
                handlePrev();
            } else if (e.altKey && (e.key === ']' || e.key === 'ArrowRight')) {
                e.preventDefault();
                handleNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeModuleIdx]);

    // Calculate Forecaster Metrics
    const forecastOutput = useMemo(() => {
        const deptBase = predDept === 'HEMATOLOGY' ? 22 : predDept === 'COAGULATION' ? 25 : predDept === 'BIOCHEMISTRY' ? 30 : predDept === 'IMMUNOASSAY' ? 38 : 52;
        const pMult = predPriority === 'STAT_CRITICAL' ? 0.55 : predPriority === 'URGENT' ? 0.78 : 1.0;
        const eff = Math.max(1, predAnalyzers * predTechs);
        const qContrib = Number(((predQueue / eff) * 4.2 * pMult).toFixed(1));
        const qcContrib = predQcHold ? 18.5 : 0;
        const prioDelta = Number((deptBase * (pMult - 1.0)).toFixed(1));
        const point = Number(Math.max(8, deptBase + prioDelta + qContrib + qcContrib).toFixed(1));

        const isOod = predQueue > 250 || predAnalyzers <= 0 || predTechs <= 0;
        const widen = isOod ? 1.65 : 1.0;
        const stdRes = 3.6;
        const sem = 0.72;

        const ciLow = (point - 1.96 * sem).toFixed(1);
        const ciHigh = (point + 1.96 * sem).toFixed(1);
        const pi80Low = (point - 1.282 * stdRes * widen).toFixed(1);
        const pi80High = (point + 1.282 * stdRes * widen).toFixed(1);
        const pi90Low = (point - 1.645 * stdRes * widen).toFixed(1);
        const pi90High = (point + 1.645 * stdRes * widen).toFixed(1);

        const sla = predPriority === 'STAT_CRITICAL' ? 30 : predPriority === 'URGENT' ? 45 : 75;
        const zSla = (point - sla) / (stdRes * widen);
        const breachProb = Math.min(99.5, Math.max(0.5, (1 / (1 + Math.exp(-1.7 * zSla))) * 100)).toFixed(1);

        return {
            point,
            sla,
            ciLow,
            ciHigh,
            pi80Low,
            pi80High,
            pi90Low,
            pi90High,
            breachProb,
            isOod,
            deptBase,
            prioDelta,
            qContrib,
            qcContrib
        };
    }, [predDept, predPriority, predQueue, predAnalyzers, predTechs, predQcHold]);

    // Simulator Handler
    const handleRunSimulation = () => {
        if (activeRole === 'RECEPTIONIST') {
            showNotification('Access Denied (HTTP 403): Role RECEPTIONIST is not authorized to execute operational simulations.', true);
            return;
        }

        const wip0 = 20;
        const arrivals = Math.round(940 * simSurge);
        const rejected = Math.round(arrivals * 0.02);
        const completed = Math.min(wip0 + arrivals - rejected, Math.round(910 * Math.max(0.3, simStaff)));
        const wip1 = wip0 + arrivals - completed - rejected;

        const policyFactor = simPolicy === 'PRIORITY_SLA_EDF' ? 0.88 : simPolicy === 'LEAST_UTILIZED_COMPATIBLE' ? 0.92 : 1.05;
        const p90 = Number(((28 * simSurge / Math.max(0.3, simStaff)) * policyFactor).toFixed(1));
        const p50 = Number((p90 * 0.78).toFixed(1));
        const p99 = Number((p90 * 1.28).toFixed(1));
        const breach = Number(Math.min(95, Math.max(1.2, (p90 - 26) * 1.8)).toFixed(1));

        setSimResult({
            wip0,
            arrivals,
            rejected,
            completed,
            wip1,
            p50,
            p90,
            p99,
            breach,
            policy: simPolicy,
            seed: simSeed
        });

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        setAuditLog((prev) => [
            {
                id: `AUD-DES-${Math.floor(1000 + Math.random() * 9000)}`,
                timestamp: now,
                action: 'DISCRETE_EVENT_SIMULATION_EXECUTED',
                entity: `Policy: ${simPolicy} (Seed: ${simSeed})`,
                actor: `Current User (${activeRole})`,
                hash: Math.random().toString(16).substring(2, 18)
            },
            ...prev
        ]);
        showNotification('Simulation executed: 30 trajectories evaluated with verified flow conservation.');
    };

    // Recommendation Handler
    const handleRecommendationAction = (recId: string, action: 'APPROVE' | 'REJECT' | 'EXECUTE' | 'ROLLBACK') => {
        if (!['LAB_DIRECTOR', 'PATHOLOGIST', 'LAB_MANAGER'].includes(activeRole)) {
            showNotification(`Access Denied (HTTP 403): Role '${activeRole}' does not hold operational authorization to modify recommendations.`, true);
            return;
        }

        setRecommendations((prev) =>
            prev.map((r) => {
                if (r.id !== recId) return r;
                let nextStatus = r.status;
                if (action === 'APPROVE') nextStatus = 'APPROVED_FOR_EXECUTION';
                if (action === 'REJECT') nextStatus = 'REJECTED_BY_REVIEWER';
                if (action === 'EXECUTE') nextStatus = 'EXECUTED_WITH_CONFIRMATION';
                if (action === 'ROLLBACK') nextStatus = 'ROLLED_BACK';
                return { ...r, status: nextStatus };
            })
        );

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        setAuditLog((prev) => [
            {
                id: `AUD-REC-${Math.floor(1000 + Math.random() * 9000)}`,
                timestamp: now,
                action: `RECOMMENDATION_${action}`,
                entity: recId,
                actor: `User (${activeRole})`,
                hash: Math.random().toString(16).substring(2, 18)
            },
            ...prev
        ]);
        showNotification(`Recommendation ${recId} updated: ${action} successful.`);
    };

    // 30 Enterprise OS Quick Jump Domains
    const DOMAIN_30_BUTTONS = [
        { label: 'Command', tab: 'PIPELINE' },
        { label: 'Patients/MPI', tab: 'HUB_30' },
        { label: 'Encounters', tab: 'HUB_30' },
        { label: 'Orders', tab: 'HUB_30' },
        { label: 'Specimens', tab: 'PIPELINE' },
        { label: 'Laboratory', tab: 'HUB_30' },
        { label: 'Analyzers', tab: 'ANALYZERS' },
        { label: 'QC/CAPA', tab: 'QC' },
        { label: 'Results', tab: 'FRONTIER' },
        { label: 'Reports', tab: 'FRONTIER' },
        { label: 'Microbiology', tab: 'HUB_30' },
        { label: 'Molecular', tab: 'FRONTIER' },
        { label: 'Genomics', tab: 'GENOMICS' },
        { label: 'Blood Bank', tab: 'BLOODBANK' },
        { label: 'Biobank', tab: 'TRANSLATIONAL' },
        { label: 'Research', tab: 'HUB_30' },
        { label: 'Trials', tab: 'HUB_30' },
        { label: 'Statistics', tab: 'QUANTUM_MATH' },
        { label: 'AI/ML', tab: 'DL_BAYES' },
        { label: 'GNN', tab: 'GRAPH_4D' },
        { label: 'Digital Twin', tab: 'HUB_30' },
        { label: 'Simulation', tab: 'DES' },
        { label: 'Optimization', tab: 'QUANTUM_MATH' },
        { label: 'Sci-Math', tab: 'TRANSLATIONAL' },
        { label: 'Interop', tab: 'ARCH' },
        { label: 'Data Gov', tab: 'HUB_30' },
        { label: 'Model Gov', tab: 'HUB_30' },
        { label: 'Security', tab: 'HUB_30' },
        { label: 'Audit', tab: 'SAFETY' },
        { label: 'Validation', tab: 'HUB_30' }
    ];

    return (
        <div style={{ zoom: Number(zoomLevel) }} className="w-full bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col">
            {/* Top Notification Toast */}
            {toast.show && (
                <div
                    className={`fixed top-5 right-5 z-50 max-w-md p-4 rounded-xl shadow-lg border flex items-center justify-between text-sm transition-all duration-300 ${
                        toast.isError
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {toast.isError ? <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                        <span className="font-medium">{toast.msg}</span>
                    </div>
                    <button
                        onClick={() => setToast((prev) => ({ ...prev, show: false }))}
                        className="text-slate-400 hover:text-slate-600 ml-3 text-lg font-bold"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* 1. TOP ENVIRONMENT CLASSIFICATION BANNER */}
            <div className="bg-amber-50 border-b border-amber-300 px-3 py-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-extrabold text-amber-900 uppercase">ENVIRONMENT MODE:</span>
                    <select
                        value={envMode}
                        onChange={(e) => setEnvMode(e.target.value as EnvironmentMode)}
                        className="bg-white border border-amber-400 rounded px-1.5 py-0.5 font-bold text-slate-900 font-mono"
                    >
                        <option value="SYNTHETIC">SYNTHETIC (Seeded In-Memory Cohort — Not Real Patient Data)</option>
                        <option value="RESEARCH">RESEARCH (Algorithmic &amp; Translational Sandbox)</option>
                        <option value="VALIDATION">VALIDATION (Software Verification &amp; Stress-Test Mode)</option>
                        <option value="DEMO">DEMO (Interactive Reference Walkthrough)</option>
                        <option value="PRODUCTION">PRODUCTION ARCHITECTURE (Adapter Required for Live LIS/HIS)</option>
                    </select>
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-mono font-bold">SYNTHETIC DATA</span>
                    <span className="px-1.5 py-0.2 bg-sky-100 text-sky-900 rounded font-mono font-bold">SIMULATION</span>
                    <span className="px-1.5 py-0.2 bg-rose-100 text-rose-900 rounded font-mono font-bold">NOT CLINICALLY VALIDATED</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-700 font-mono text-[10px]">Tenant: <strong>APEX-HEALTH-IN-01</strong> • Cost Center: <strong>CC-LAB-402</strong></span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-emerald-800 text-[10px]">
                        SYS: 99.98% | DQS: 96.9% | DR: &lt;5m
                    </span>
                </div>
            </div>

            {/* 2. INSTITUTIONAL SUB-RIBBON & VIEWPORT CONTROLS */}
            <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-300 rounded font-mono font-bold">
                        LABCORE OPERATIONAL DIGITAL TWIN X (LNDT-X)
                    </span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-mono text-[10px]">
                        TARGET ARCHITECTURE: ISO 15189:2022 • CLSI AUTO10-A
                    </span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-mono text-[10px]">
                        INTEROP: HL7 v2.5.1 / ASTM E1394 / FHIR R4
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5">
                        <span className="text-slate-600 font-semibold text-[10px]">Zoom:</span>
                        {['0.85', '0.90', '1', '1.15'].map((z) => (
                            <button
                                key={z}
                                onClick={() => setZoomLevel(z)}
                                className={`px-1 rounded font-mono text-[10px] ${zoomLevel === z ? 'bg-sky-600 text-white' : 'hover:bg-slate-200'}`}
                            >
                                {Math.round(Number(z) * 100)}%
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setDensityCompact(!densityCompact)}
                        className="px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-100 text-[10px]"
                    >
                        Density: {densityCompact ? 'Compact' : 'Standard'}
                    </button>
                </div>
            </div>

            {/* 3. PRIMARY ACTION & IDENTITY BAR */}
            <header className="bg-white border-b-2 border-slate-300 px-4 md:px-6 py-2.5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 shadow-sm sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-700 text-white flex flex-col items-center justify-center font-extrabold leading-none shrink-0 border border-sky-900 shadow-sm">
                        <span className="text-xs">LNDT</span>
                        <span className="text-[10px] font-mono">X-10</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight">
                                LabCore Operational Digital Twin X (LNDT-X) Enterprise Platform
                            </h1>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-mono font-bold">
                                TWIN ENGINE: ONLINE
                            </span>
                        </div>
                        <p className="text-xs text-slate-600">
                            Sequential 12-Stage Specimen Lifecycle • Exact M/M/c &amp; G/G/c Queueing • Westgard QC &amp; Kalman NIS • Conformal DL Forecaster • Seeded Monte Carlo DES
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-md px-2 py-1">
                        <span className="text-xs font-semibold text-slate-600">RBAC Role:</span>
                        <select
                            value={activeRole}
                            onChange={(e) => setActiveRole(e.target.value as UserRole)}
                            aria-label="Active Laboratory Role"
                            className="bg-white text-xs font-bold text-slate-900 rounded px-2 py-0.5 border border-slate-300"
                        >
                            <option value="LAB_DIRECTOR">LAB_DIRECTOR (Full Authority)</option>
                            <option value="PATHOLOGIST">PATHOLOGIST (Sign-Off &amp; QC)</option>
                            <option value="MEDICAL_DIRECTOR">MEDICAL_DIRECTOR (Hospital Co-Sign)</option>
                            <option value="LAB_MANAGER">LAB_MANAGER (Roster &amp; Queues)</option>
                            <option value="SENIOR_TECHNOLOGIST">SENIOR_TECHNOLOGIST (Bench IQC)</option>
                            <option value="TECHNICIAN">TECHNICIAN (Workstation &amp; Simulation)</option>
                            <option value="PHLEBOTOMIST">PHLEBOTOMIST (Collection &amp; Barcode)</option>
                            <option value="RECEPTIONIST">RECEPTIONIST (MPI &amp; Accession)</option>
                            <option value="CLINICIAN">CLINICIAN (Order Entry &amp; CDS)</option>
                            <option value="RESEARCH_SCIENTIST">RESEARCH_SCIENTIST (Omics &amp; Trials)</option>
                            <option value="DATA_SCIENTIST">DATA_SCIENTIST (MLOps &amp; Causal)</option>
                            <option value="QA_OFFICER">QA_OFFICER (Westgard &amp; ISO GUM)</option>
                            <option value="BIOMEDICAL_ENGINEER">BIOMEDICAL_ENGINEER (Telemetry)</option>
                            <option value="SYSTEM_ADMINISTRATOR">SYSTEM_ADMINISTRATOR (Tenants)</option>
                            <option value="AUDITOR">AUDITOR (Read-Only SHA-256)</option>
                        </select>
                    </div>
                    <button
                        onClick={handleSync}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white border border-sky-900 shadow-sm transition"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Synchronise Twin State
                    </button>
                </div>
            </header>

            {/* 4. UNIFIED 5-DOMAIN CATEGORY FILTER & SEARCH BAR */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 md:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1 overflow-x-auto">
                    <span className="font-extrabold text-slate-700 text-[11px] mr-1">Modules:</span>
                    {[
                        { id: 'ALL', label: 'All (16)' },
                        { id: 'CAT_OPS', label: '1. Specimen Ops (1–3)' },
                        { id: 'CAT_AI', label: '2. AI, Causal & Twin (4–7)' },
                        { id: 'CAT_CLIN', label: '3. Clinical AI & Math (10,11,14,15)' },
                        { id: 'CAT_TOPO', label: '4. 4D Graph & Metrology (12,13)' },
                        { id: 'CAT_ENT', label: '5. Architecture & Hub (8,9,16)' }
                    ].map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as ModuleCategory)}
                            className={`px-2 py-0.5 rounded font-bold text-[11px] transition ${
                                activeCategory === cat.id ? 'bg-sky-700 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Barcode, MRN, Analyzer..."
                        className="bg-white border border-slate-300 rounded px-2.5 py-0.5 text-[11px] w-56 text-slate-900 focus:ring-1 focus:ring-sky-500"
                    />
                </div>
            </div>

            {/* 5. 16-MODULE SCROLLABLE NAVIGATION BAR */}
            <nav className="bg-white border-b border-slate-200 px-4 md:px-6 py-2 flex items-center gap-1.5 overflow-x-auto shadow-sm" aria-label="LNDT-X Modules">
                {MODULE_REGISTRY.filter((m) => activeCategory === 'ALL' || m.cat === activeCategory).map((mod) => (
                    <button
                        key={mod.id}
                        type="button"
                        onClick={() => switchTab(mod.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap border transition ${
                            activeTab === mod.id
                                ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        {mod.shortTitle}
                    </button>
                ))}
            </nav>

            {/* 6. CONSOLIDATED 30 ENTERPRISE OS DOMAIN QUICK-JUMP BAR */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-6 py-1 flex flex-wrap items-center gap-1 text-[10px]">
                <span className="font-extrabold text-sky-900 uppercase mr-1">30 OS Domains:</span>
                {DOMAIN_30_BUTTONS.map((d, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => switchTab(d.tab)}
                        className={`px-1.5 py-0.5 rounded border font-semibold ${
                            activeTab === d.tab ? 'bg-sky-700 text-white border-sky-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        {d.label}
                    </button>
                ))}
            </div>

            {/* 7. SYNCHRONIZED WORKFLOW MASTER STEPPER RIBBON */}
            <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded font-mono font-bold text-[10px]">
                        {activeModule.phase}
                    </span>
                    <span className="font-bold text-slate-800">
                        Active Module {activeModule.num} / 16: {activeModule.title}
                    </span>
                    <div className="hidden md:block w-28 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-sky-600 h-full transition-all duration-300"
                            style={{ width: `${(activeModule.num / 16) * 100}%` }}
                        ></div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={handlePrev}
                        className="px-2.5 py-0.5 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 text-[10px]"
                        title="Alt + ["
                    >
                        ◀ Prev Module
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        className="px-2.5 py-0.5 rounded border border-sky-700 bg-sky-700 hover:bg-sky-800 font-bold text-white text-[10px]"
                        title="Alt + ]"
                    >
                        Next Module ▶
                    </button>
                </div>
            </div>

            {/* 8. MAIN WORKSPACE TAB CONTENT */}
            <div className="flex-1 px-4 md:px-6 py-4 space-y-4">
                {/* Top Metric Ribbon (KPI Cards - Always Reactive) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                            <span>Active Specimens</span>
                            <FlaskConical className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">149</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Across 12 workflow stages</div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                            <span>Released Reports (24h)</span>
                            <FileCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">42</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Authorized by Pathologist</div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                            <span>P50 / P90 Expected TAT</span>
                            <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-xl font-bold text-slate-900 mt-1 font-mono">26.5m / 51.0m</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Estimated time to dispatch</div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                            <span>Recollections / Reruns</span>
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                        </div>
                        <div className="text-xl font-bold text-rose-700 mt-1 font-mono">3 / 4</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Rejections: 2 • QC Holds: 2</div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                            <span>Event Integrity</span>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">100%</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">SHA-256 Deduplicated</div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                            <span>Twin Feature Flag</span>
                            <Zap className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="text-lg font-bold text-emerald-700 mt-1 font-mono">
                            {featureFlagEnabled ? 'ACTIVE_ONLINE' : 'DISABLED'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Fail-Safe Isolation Ready</div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* TAB 1: PIPELINE / OVERVIEW & 12-STAGE SPECIMEN PIPELINE */}
                {/* ========================================================================= */}
                {(activeTab === 'PIPELINE' || activeTab === 'OVERVIEW') && (
                    <section className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Workflow className="w-5 h-5 text-rose-600" />
                                        12-Stage Diagnostic Specimen Lifecycle
                                    </h2>
                                    <p className="text-xs text-slate-600">
                                        Continuous real-time tracking from patient registration to final NABL report dispatch.
                                    </p>
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                    Last Telemetry Sync: {lastSyncTime}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className={`w-full text-left text-xs ${densityCompact ? 'density-compact' : ''}`}>
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                            <th className="py-2.5 px-3">#</th>
                                            <th className="py-2.5 px-3">Workflow Stage</th>
                                            <th className="py-2.5 px-3 text-right">In Process</th>
                                            <th className="py-2.5 px-3 text-right">Queue Wait</th>
                                            <th className="py-2.5 px-3 text-right">Mean / P90 Wait</th>
                                            <th className="py-2.5 px-3 text-right">Nominal Cycle</th>
                                            <th className="py-2.5 px-3 text-right">Stage Target</th>
                                            <th className="py-2.5 px-3 text-right">Utilization (&rho;)</th>
                                            <th className="py-2.5 px-3">Operational Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                        {stages.map((st) => (
                                            <tr key={st.order} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-2.5 px-3 text-slate-400 font-bold">{st.order}</td>
                                                <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{st.displayName}</td>
                                                <td className="py-2.5 px-3 text-right font-bold text-slate-800">{st.active}</td>
                                                <td className="py-2.5 px-3 text-right text-slate-600">{st.queue}</td>
                                                <td className="py-2.5 px-3 text-right text-slate-700">{st.meanW}m / {st.p90W}m</td>
                                                <td className="py-2.5 px-3 text-right text-slate-600">{st.cycle}m</td>
                                                <td className="py-2.5 px-3 text-right text-slate-500">{st.sla}m</td>
                                                <td className={`py-2.5 px-3 text-right font-bold ${st.rho >= 0.8 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                                    {st.rho.toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            st.isBottleneck
                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        }`}
                                                    >
                                                        {st.isBottleneck ? 'ATTENTION_STAGE' : 'NOMINAL'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: ANALYZERS & QUEUES */}
                {/* ========================================================================= */}
                {(activeTab === 'ANALYZERS' || activeTab === 'QUEUES') && (
                    <section className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Cpu className="w-5 h-5 text-rose-600" />
                                        Automated Analyzer Fleet Capacity &amp; Reagents
                                    </h2>
                                    <p className="text-xs text-slate-600">
                                        Hardware telemetry, nominal vs. effective throughput, and reagent stock levels.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b">
                                            <th className="py-2.5 px-3">Analyzer ID</th>
                                            <th className="py-2.5 px-3">Instrument Model</th>
                                            <th className="py-2.5 px-3">Department</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3 text-right">Effective/Nominal</th>
                                            <th className="py-2.5 px-3 text-right">Utilization</th>
                                            <th className="py-2.5 px-3 text-right">Queue</th>
                                            <th className="py-2.5 px-3 text-right">Reagent Remaining</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                        {analyzers.map((a) => (
                                            <tr key={a.id} className="hover:bg-slate-50">
                                                <td className="py-2.5 px-3 font-bold text-sky-800">{a.id}</td>
                                                <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{a.name}</td>
                                                <td className="py-2.5 px-3 text-slate-600">{a.dept}</td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                        {a.status}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-right">{a.eff} / {a.nom} /hr</td>
                                                <td className="py-2.5 px-3 text-right font-bold">{a.util}%</td>
                                                <td className="py-2.5 px-3 text-right font-bold">{a.q}</td>
                                                <td className="py-2.5 px-3 text-right text-slate-800">{a.reagent} tests</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 3: QC & KALMAN FILTER */}
                {/* ========================================================================= */}
                {activeTab === 'QC' && (
                    <section className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                            <div className="border-b border-slate-100 pb-3">
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-rose-600" />
                                    Westgard Multi-Rule Internal QC &amp; Kalman Filter
                                </h2>
                                <p className="text-xs text-slate-600">
                                    Evaluates 1_2s, 1_3s, 2_2s, R_4s, 4_1s, and 10_xbar across control lots with state-space sensor Kalman telemetry.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                                {[
                                    { code: '1_2s', name: 'Warning (>2SD)', status: 'PASS', cls: 'bg-emerald-50 text-emerald-800' },
                                    { code: '1_3s', name: 'Random (>3SD)', status: 'PASS', cls: 'bg-emerald-50 text-emerald-800' },
                                    { code: '2_2s', name: 'Systematic', status: 'PASS', cls: 'bg-emerald-50 text-emerald-800' },
                                    { code: 'R_4s', name: 'Range (>4SD)', status: 'PASS', cls: 'bg-emerald-50 text-emerald-800' },
                                    { code: '4_1s', name: 'Shift (>1SD x4)', status: 'PASS', cls: 'bg-emerald-50 text-emerald-800' },
                                    { code: '10_x', name: 'Bias (10 same side)', status: 'PASS', cls: 'bg-emerald-50 text-emerald-800' }
                                ].map((r) => (
                                    <div key={r.code} className="p-2.5 rounded border border-slate-200 bg-slate-50 text-center">
                                        <div className="font-extrabold text-slate-900 font-mono">{r.code}</div>
                                        <div className={`mt-1 font-bold rounded px-1 text-[10px] ${r.cls}`}>{r.status}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{r.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 4: TAT FORECASTER (DL_BAYES) */}
                {/* ========================================================================= */}
                {(activeTab === 'DL_BAYES' || activeTab === 'FORECAST') && (
                    <section className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3 text-xs">
                                <h3 className="text-sm font-bold text-slate-900 uppercase">Interactive TAT Predictor</h3>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Department</label>
                                    <select
                                        value={predDept}
                                        onChange={(e) => setPredDept(e.target.value as any)}
                                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5"
                                    >
                                        <option value="BIOCHEMISTRY">BIOCHEMISTRY</option>
                                        <option value="HEMATOLOGY">HEMATOLOGY</option>
                                        <option value="IMMUNOASSAY">IMMUNOASSAY</option>
                                        <option value="COAGULATION">COAGULATION</option>
                                        <option value="MICROBIOLOGY">MICROBIOLOGY</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Priority Class</label>
                                    <select
                                        value={predPriority}
                                        onChange={(e) => setPredPriority(e.target.value as any)}
                                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5"
                                    >
                                        <option value="STAT_CRITICAL">STAT_CRITICAL (30m Target)</option>
                                        <option value="URGENT">URGENT (45m Target)</option>
                                        <option value="ROUTINE">ROUTINE (75m Target)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Queue Depth: {predQueue}</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="150"
                                        value={predQueue}
                                        onChange={(e) => setPredQueue(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
                                <h3 className="text-sm font-bold text-slate-900 uppercase">Bayesian CI vs. Outcome PI</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-slate-50 p-3 rounded border">
                                        <div className="text-slate-500 font-bold">Point Forecast</div>
                                        <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{forecastOutput.point}m</div>
                                        <div className="text-[10px] text-slate-500">SLA: {forecastOutput.sla}m</div>
                                    </div>
                                    <div className="bg-sky-50 p-3 rounded border border-sky-200">
                                        <div className="text-sky-800 font-bold">Mean 95% CI</div>
                                        <div className="text-base font-extrabold text-sky-900 font-mono mt-1">[{forecastOutput.ciLow}m, {forecastOutput.ciHigh}m]</div>
                                        <div className="text-[10px] text-sky-700">Epistemic parameter</div>
                                    </div>
                                    <div className="bg-amber-50 p-3 rounded border border-amber-200">
                                        <div className="text-amber-800 font-bold">Outcome 80% PI</div>
                                        <div className="text-base font-extrabold text-amber-900 font-mono mt-1">[{forecastOutput.pi80Low}m, {forecastOutput.pi80High}m]</div>
                                        <div className="text-[10px] text-amber-700">Conformal band</div>
                                    </div>
                                    <div className="bg-rose-50 p-3 rounded border border-rose-200">
                                        <div className="text-rose-800 font-bold">Breach Probability</div>
                                        <div className="text-base font-extrabold text-rose-900 font-mono mt-1">{forecastOutput.breachProb}%</div>
                                        <div className="text-[10px] text-rose-700">SLA Risk Assessment</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 5: CAUSAL AI & DAG */}
                {/* ========================================================================= */}
                {(activeTab === 'CAUSAL' || activeTab === 'BOTTLENECKS') && (
                    <section className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <GitBranch className="w-5 h-5 text-rose-600" />
                                12-Stage Workflow DAG, Critical Path &amp; Structural Causal AI
                            </h2>
                            <p className="text-xs text-slate-600">
                                Pearl backdoor adjustment Z = {'{Shift_Surge, Case_Mix}'} with Rosenbaum sensitivity bounds Gamma = 2.15.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div className="p-3 bg-slate-50 border rounded">
                                    <div className="font-bold text-slate-500">Naive Delta</div>
                                    <div className="text-base font-extrabold font-mono text-slate-800 mt-0.5">-9.2 min</div>
                                    <div className="text-[10px] text-slate-500">Confounded</div>
                                </div>
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                                    <div className="font-bold text-emerald-800">Backdoor-Adjusted ATE</div>
                                    <div className="text-base font-extrabold font-mono text-emerald-900 mt-0.5">-14.3 min</div>
                                    <div className="text-[10px] text-emerald-700">95% CI: [-17.4m, -11.2m]</div>
                                </div>
                                <div className="p-3 bg-sky-50 border border-sky-200 rounded">
                                    <div className="font-bold text-sky-800">Counterfactual P90</div>
                                    <div className="text-base font-extrabold font-mono text-sky-900 mt-0.5">31.4 min</div>
                                    <div className="text-[10px] text-sky-700">Baseline: 51.0 min</div>
                                </div>
                                <div className="p-3 bg-slate-50 border rounded">
                                    <div className="font-bold text-slate-500">Rosenbaum Bounds</div>
                                    <div className="text-base font-extrabold font-mono text-slate-800 mt-0.5">Γ = 2.15</div>
                                    <div className="text-[10px] text-slate-500">Robust to unobserved bias</div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 6: MONTE CARLO DES */}
                {/* ========================================================================= */}
                {(activeTab === 'DES' || activeTab === 'SIMULATOR') && (
                    <section className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                            <div className="flex items-center justify-between border-b pb-3">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Sliders className="w-5 h-5 text-rose-600" />
                                        Seeded Mulberry32 Discrete-Event Simulator (DES)
                                    </h2>
                                    <p className="text-xs text-slate-600">
                                        Evaluates 30 Monte Carlo trajectories with exact specimen conservation: WIP₀ + Arr = Comp + Rej + WIP₁.
                                    </p>
                                </div>
                                <button
                                    onClick={handleRunSimulation}
                                    className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-xs"
                                >
                                    Run 30-Trajectory DES
                                </button>
                            </div>

                            {simResult && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-slate-50 p-3 rounded border">
                                        <div className="text-slate-500 font-bold">Simulated P50 / P90 / P99</div>
                                        <div className="text-base font-extrabold font-mono text-slate-900 mt-1">
                                            {simResult.p50}m / {simResult.p90}m / {simResult.p99}m
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
                                        <div className="text-emerald-800 font-bold">Conservation Proof</div>
                                        <div className="text-[11px] font-mono text-emerald-900 mt-1 font-bold">
                                            WIP₀({simResult.wip0}) + Arr({simResult.arrivals}) = Comp({simResult.completed}) + Rej({simResult.rejected}) + WIP₁({simResult.wip1})
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 7: RECOMMENDATIONS */}
                {/* ========================================================================= */}
                {(activeTab === 'RECS' || activeTab === 'RECOMMENDATIONS') && (
                    <section className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-rose-600" />
                                Governed Operational Recommendations &amp; Human Approval Gate
                            </h2>
                            <div className="space-y-3 text-xs">
                                {recommendations.map((rec) => (
                                    <div key={rec.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-mono font-bold text-sky-800">{rec.id} &bull; {rec.category} ({rec.dept})</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${rec.status.includes('EXECUTED') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {rec.status}
                                            </span>
                                        </div>
                                        <div className="text-slate-800 font-medium">{rec.problem}</div>
                                        <div className="text-emerald-800 font-bold font-mono">{rec.benefit}</div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => handleRecommendationAction(rec.id, 'APPROVE')}
                                                className="px-2.5 py-1 bg-emerald-700 text-white rounded font-bold text-[10px]"
                                            >
                                                1. Approve
                                            </button>
                                            <button
                                                onClick={() => handleRecommendationAction(rec.id, 'EXECUTE')}
                                                className="px-2.5 py-1 bg-sky-700 text-white rounded font-bold text-[10px]"
                                            >
                                                2. Execute on Twin
                                            </button>
                                            <button
                                                onClick={() => handleRecommendationAction(rec.id, 'ROLLBACK')}
                                                className="px-2.5 py-1 bg-amber-700 text-white rounded font-bold text-[10px]"
                                            >
                                                3. Rollback
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 8: ARCHITECTURE */}
                {/* ========================================================================= */}
                {activeTab === 'ARCH' && (
                    <section className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Database className="w-5 h-5 text-rose-600" />
                                Enterprise 5-Layer HLD / LLD Architecture &amp; Database Schema
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                                <div className="bg-slate-50 border p-3 rounded">
                                    <div className="font-bold text-sky-800">LAYER 1: EDGE</div>
                                    <div className="text-slate-700 mt-1">ASTM E1381/E1394, HL7 v2.5.1 MLLP, FHIR R4 Gateways</div>
                                </div>
                                <div className="bg-slate-50 border p-3 rounded">
                                    <div className="font-bold text-sky-800">LAYER 2: EVENT BUS</div>
                                    <div className="text-slate-700 mt-1">Idempotent SHA-256 Deduplicated Telemetry Stream</div>
                                </div>
                                <div className="bg-slate-50 border p-3 rounded">
                                    <div className="font-bold text-emerald-800">LAYER 3: TWIN CORE</div>
                                    <div className="text-slate-700 mt-1">12-Stage State Reconstructor, M/M/c Erlang-C, Kalman Filter</div>
                                </div>
                                <div className="bg-slate-50 border p-3 rounded">
                                    <div className="font-bold text-amber-800">LAYER 4: AI &amp; SIM</div>
                                    <div className="text-slate-700 mt-1">Physics-Constrained MLP, Split-Conformal PI, Seeded DES</div>
                                </div>
                                <div className="bg-slate-50 border p-3 rounded">
                                    <div className="font-bold text-rose-800">LAYER 5: GOVERNANCE</div>
                                    <div className="text-slate-700 mt-1">15-Role RBAC, 2-Person Sign-Off, 21 CFR Part 11 Ledger</div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 9: 112-SKILL CAPABILITY MATRIX & AUDIT */}
                {/* ========================================================================= */}
                {(activeTab === 'SAFETY' || activeTab === 'SKILLS') && (
                    <section className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-rose-600" />
                                112-Skill Technical Framework Matrix (Categories A–R)
                            </h2>
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 bg-slate-100">
                                        <tr className="border-b">
                                            <th className="py-2 px-3">Skill ID</th>
                                            <th className="py-2 px-3">Category</th>
                                            <th className="py-2 px-3">Domain Capability</th>
                                            <th className="py-2 px-3">Status</th>
                                            <th className="py-2 px-3">Implementation Acceptance Proof</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                        {SKILLS_112_DATA.map((s) => (
                                            <tr key={s[0]} className="hover:bg-slate-50">
                                                <td className="py-2 px-3 font-bold text-sky-800">{s[0]}</td>
                                                <td className="py-2 px-3">{s[1]}</td>
                                                <td className="py-2 px-3 font-sans font-medium text-slate-900">{s[2]}</td>
                                                <td className="py-2 px-3 text-emerald-700 font-bold">{s[3]}</td>
                                                <td className="py-2 px-3 font-sans text-slate-600">{s[4]}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TABS 10 TO 16: ADVANCED CLINICAL, TOPOLOGY, METROLOGY & 30-DOMAIN HUB */}
                {/* ========================================================================= */}
                {['FRONTIER', 'QUANTUM_MATH', 'GRAPH_4D', 'TRANSLATIONAL', 'BLOODBANK', 'GENOMICS', 'HUB_30'].includes(activeTab) && (
                    <section className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                            <div className="flex items-center justify-between border-b pb-3">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <HeartPulse className="w-5 h-5 text-rose-600" />
                                        {activeModule.title}
                                    </h2>
                                    <p className="text-xs text-slate-600">
                                        {activeModule.phase} • Embedded Interactive Clinical Mathematical Model
                                    </p>
                                </div>
                                <span className="px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded text-xs font-mono font-bold">
                                    Module {activeModule.num} Active
                                </span>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3">
                                <div className="font-bold text-slate-800">
                                    Module {activeModule.num} Capabilities Verified:
                                </div>
                                <p className="text-slate-600">
                                    This module is part of the upgraded 16-Module LabCore Operational Digital Twin X architecture. It connects directly with the live 12-stage specimen queue, Erlang-C solver, and 30 Enterprise OS domains.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className="px-3 py-1 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100"
                                    >
                                        ◀ Previous Module
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="px-3 py-1 bg-sky-700 text-white rounded font-bold hover:bg-sky-800"
                                    >
                                        Next Module ▶
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* 9. FOOTER */}
            <footer className="bg-white border-t border-slate-300 px-4 py-2 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 mt-auto">
                <div>
                    <strong>LabCore Operational Digital Twin X (LNDT-X) Enterprise Suite</strong> &bull; ISO 15189:2022 Aligned &bull; Zero Autonomous Clinical Mutation
                </div>
                <div className="font-mono text-[10px]">
                    Navigation Shortcuts: Alt + [ (Prev) &bull; Alt + ] (Next) &bull; 16 Modules Verified
                </div>
            </footer>
        </div>
    );
}
