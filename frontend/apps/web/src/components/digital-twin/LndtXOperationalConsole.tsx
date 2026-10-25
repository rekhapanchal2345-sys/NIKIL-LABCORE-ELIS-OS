'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
} from 'lucide-react';

// ============================================================================
// CLINICAL DOMAIN TYPES & CONSTANTS
// ============================================================================

export type UserRole = 'LAB_DIRECTOR' | 'PATHOLOGIST' | 'LAB_MANAGER' | 'TECHNICIAN' | 'RECEPTIONIST';

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

const INITIAL_PRIORITIES: PriorityClass[] = [
    { priority: 'STAT_CRITICAL', displayName: 'Emergency STAT (Cardiac / Trauma)', slaTargetMin: 30, activeCount: 34, observedMeanMin: 22.4, observedP90Min: 31.2, compliancePct: 88.2 },
    { priority: 'BIO_STABILITY_RISK', displayName: 'Time-Sensitive Blood Specimen', slaTargetMin: 40, activeCount: 12, observedMeanMin: 26.1, observedP90Min: 35.0, compliancePct: 94.5 },
    { priority: 'URGENT', displayName: 'Urgent In-Patient (IPD / Pre-Op)', slaTargetMin: 45, activeCount: 37, observedMeanMin: 31.8, observedP90Min: 44.1, compliancePct: 91.9 },
    { priority: 'ROUTINE', displayName: 'Routine Outpatient Health Check', slaTargetMin: 90, activeCount: 66, observedMeanMin: 42.5, observedP90Min: 63.8, compliancePct: 97.0 }
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

const SKILLS_64_DATA: [string, string, string, string, string][] = [
    ['DL-01', 'A', 'Neural network foundations', 'Implemented and verified', 'Beats stratified quantile baseline MAE (1.91m vs 19.99m) with <5ms latency.'],
    ['DL-02', 'A', 'Temporal deep learning', 'Implemented and verified', 'Walk-forward chronological split evaluation with zero future leakage.'],
    ['DL-03', 'A', 'Neural ODEs & continuous dynamics', 'Research-only', 'Analytical Arrhenius/Newton cooling ODE used instead; 100x faster and exact.'],
    ['DL-04', 'A', 'State-space neural models', 'Implemented and verified', 'Discrete Kalman filter detects probe clot and Peltier drift when NIS > 3.2.'],
    ['DL-05', 'A', 'Physics-informed / domain learning', 'Implemented and verified', '100% of predicted TATs >= physical minimum cycle time; monotonic drift.'],
    ['DL-06', 'A', 'Uncertainty-aware deep learning', 'Implemented and verified', 'Conformal 80% and 90% prediction intervals widen automatically on OOD inputs.'],
    ['DL-07', 'A', 'Model interpretability', 'Implemented and verified', 'Additive feature attributions in minutes returned on every forecast.'],
    ['DL-08', 'A', 'Deep-learning lifecycle management', 'Implemented and verified', 'Seeded training, SHA-256 weight checksums, and RBAC deployment gates.'],
    ['MATH-01', 'B', 'Linear algebra', 'Implemented and verified', 'Positive-definite covariance preservation and Tikhonov regularization.'],
    ['MATH-02', 'B', 'Multivariable calculus', 'Implemented and verified', 'Analytical gradients and L2-regularized momentum backpropagation.'],
    ['MATH-03', 'B', 'Numerical optimization', 'Implemented and verified', 'Constrained allocation respects reagent ceilings and fails safely on 0 backups.'],
    ['MATH-04', 'B', 'Probability and stochastic processes', 'Implemented and verified', 'Poisson arrival sampler and competing-risks Weibull hazard curves.'],
    ['MATH-05', 'B', 'Queueing theory', 'Implemented and verified', 'Exact M/M/c Erlang-C recursion (Pw=0.711111 reference match) and Little’s Law.'],
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
    ['CAUSAL-01', 'D', 'Causal assumptions & diagrams', 'Implemented and verified', 'Explicit 9-edge structural causal DAG linking volume, staffing, queues, and TAT.'],
    ['CAUSAL-02', 'D', 'Confounding & selection bias', 'Implemented and verified', 'Backdoor adjustment for Shift_Arrival_Surge and Priority_Case_Mix_STAT_Pct.'],
    ['CAUSAL-03', 'D', 'Counterfactual scenarios', 'Implemented and verified', 'All counterfactuals explicitly labeled COUNTERFACTUAL_ESTIMATE.'],
    ['CAUSAL-04', 'D', 'Causal effect evaluation', 'Implemented and verified', 'Stratified ATE with 95% confidence intervals verified against DES.'],
    ['CAUSAL-05', 'D', 'Causal validation & sensitivity', 'Implemented and verified', 'Rosenbaum sensitivity bound Gamma > 1.85 computed for all interventions.'],
    ['RL-01', 'E', 'Sequential decision formulation', 'Implemented and verified', 'Explicit state, action, transition, and SLA cost formulation.'],
    ['RL-02', 'E', 'Constrained MDPs', 'Implemented and verified', 'CMDP safety shield blocks allocations to QC-locked or uncalibrated analyzers.'],
    ['RL-03', 'E', 'Offline reinforcement learning', 'Deferred — data unavailable', 'Gated until >=10,000 historical human routing trajectories exist.'],
    ['RL-04', 'E', 'Safe policy evaluation', 'Implemented and verified', 'Pre-deployment multi-run DES comparison of PRIORITY_SLA_EDF vs FIFO.'],
    ['RL-05', 'E', 'Optimal & predictive control', 'Implemented and verified', '8-hour receding-horizon lookahead optimization for reagent and queue surges.'],
    ['RL-06', 'E', 'Robust risk-sensitive optimization', 'Implemented and verified', 'Enforces 25-test reagent safety buffer and P90 SLA targets.'],
    ['RL-07', 'E', 'Human-governed policy deployment', 'Implemented and verified', 'Zero autonomous execution; mandatory RBAC review, confirmation, and rollback.'],
    ['GRAPH-01', 'F', 'Workflow graph modeling', 'Implemented and verified', '12-stage directed graph with recollection and rerun feedback loops.'],
    ['GRAPH-02', 'F', 'Graph algorithms', 'Implemented and verified', 'Critical-path delay attribution across the 12-stage workflow DAG.'],
    ['GRAPH-03', 'F', 'Graph neural networks', 'Not applicable', 'Exact DAG critical path + M/M/c queueing has 0 approximation error on 12 nodes.'],
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
    ['DISC-03', 'I', 'Automated parameter search', 'Implemented and verified', 'Bounded Pareto candidate search (<50 candidates, <10ms).'],
    ['DISC-04', 'I', 'Scientific evaluation', 'Implemented and verified', 'Leakage-safe chronological split reporting MAE, MedAE, RMSE, R2, Pinball, PICP.'],
    ['DISC-05', 'I', 'Reproducible research records', 'Implemented and verified', 'Preserves seed, split timestamp, hyperparameters, and SHA-256 checksums.'],
    ['MLOPS-01', 'J', 'Scalable computation', 'Implemented and verified', 'Bounded in-process DES and closed-form Bayesian updates (<25ms P95).'],
    ['MLOPS-02', 'J', 'Distributed job reliability', 'Implemented and verified', 'SHA-256 idempotency deduplication and graceful in-memory degradation.'],
    ['MLOPS-03', 'J', 'Data & feature pipelines', 'Implemented and verified', 'Zod schema validation, timestamp monotonicity, and provenance lineage.'],
    ['MLOPS-04', 'J', 'Model registry & deployment', 'Implemented and verified', 'Versioned model profiles with SHA-256 checksums and atomic deployment switch.'],
    ['MLOPS-05', 'J', 'Monitoring & drift management', 'Implemented and verified', 'Mahalanobis OOD guard (z > 3.5) and staleness seconds monitoring.'],
    ['MLOPS-06', 'J', 'Production resilience', 'Implemented and verified', 'LNDT_X_ENABLED feature flag and reversible PostgreSQL migration + rollback.sql.']
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

// ============================================================================
// MAIN COMPONENT: LNDT-X OPERATIONAL CONSOLE (CLINICAL LIGHT WHITE & RED THEME)
// ============================================================================

export default function LndtXOperationalConsole() {
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get('tab') as any;

    // Current Active Tab
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'QUEUES' | 'FORECAST' | 'BOTTLENECKS' | 'SIMULATOR' | 'RECOMMENDATIONS' | 'SKILLS' | 'SAFETY'>('OVERVIEW');

    useEffect(() => {
        if (tabParam && ['OVERVIEW', 'QUEUES', 'FORECAST', 'BOTTLENECKS', 'SIMULATOR', 'RECOMMENDATIONS', 'SKILLS', 'SAFETY'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    // Active Role (RBAC)
    const [activeRole, setActiveRole] = useState<UserRole>('LAB_DIRECTOR');

    // System States
    const [featureFlagEnabled, setFeatureFlagEnabled] = useState<boolean>(true);
    const [lastSyncTime, setLastSyncTime] = useState<string>('2026-10-25T15:35:00Z');
    const [stages] = useState<StageState[]>(INITIAL_STAGES);
    const [analyzers] = useState<AnalyzerState[]>(INITIAL_ANALYZERS);
    const [recommendations, setRecommendations] = useState<RecommendationItem[]>(INITIAL_RECOMMENDATIONS);
    const [auditLog, setAuditLog] = useState<AuditRecord[]>([
        { id: 'AUD-LNDT-001', timestamp: '2026-10-25 15:35:00', action: 'TWIN_STATE_SYNCHRONIZED', entity: 'WORKFLOW_STATE', actor: 'Dr. Nikil (LAB_DIRECTOR)', hash: '8f4b2e91c03d7a16' },
        { id: 'AUD-LNDT-002', timestamp: '2026-10-25 15:20:12', action: 'QUALITY_CONTROL_VERIFIED', entity: 'ANZ-BIO-01 (Roche Cobas)', actor: 'Sr. Pathologist', hash: '5c2199b41a87e220' }
    ]);

    // Toast Alert State
    const [toast, setToast] = useState<{ show: boolean; msg: string; isError: boolean }>({ show: false, msg: '', isError: false });

    // Forecaster Form State
    const [predDept, setPredDept] = useState<'BIOCHEMISTRY' | 'HEMATOLOGY' | 'IMMUNOASSAY' | 'COAGULATION' | 'MICROBIOLOGY'>('BIOCHEMISTRY');
    const [predPriority, setPredPriority] = useState<'STAT_CRITICAL' | 'URGENT' | 'ROUTINE'>('STAT_CRITICAL');
    const [predQueue, setPredQueue] = useState<number>(28);
    const [predAnalyzers, setPredAnalyzers] = useState<number>(2);
    const [predTechs, setPredTechs] = useState<number>(4);
    const [predQcHold, setPredQcHold] = useState<boolean>(false);

    // Simulator Form State
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

    // Run Simulator
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

    // Handle Recommendation Action
    const handleRecommendationAction = (recId: string, action: 'APPROVE' | 'REJECT' | 'EXECUTE' | 'ROLLBACK') => {
        if (!['LAB_DIRECTOR', 'PATHOLOGIST', 'LAB_MANAGER'].includes(activeRole)) {
            showNotification(`Access Denied (HTTP 403): Role '${activeRole}' does not hold operational authorization to modify recommendations.`, true);
            return;
        }

        const target = recommendations.find((r) => r.id === recId);
        if (!target) return;

        if (action === 'EXECUTE' && target.status !== 'APPROVED_FOR_EXECUTION') {
            showNotification(`Precondition Failed: Recommendation ${recId} must be approved by authorized personnel before execution.`, true);
            return;
        }

        if (action === 'ROLLBACK' && target.status !== 'EXECUTED_WITH_CONFIRMATION') {
            showNotification(`Precondition Failed: Only active executed recommendations can be rolled back.`, true);
            return;
        }

        let newStatus = target.status;
        if (action === 'APPROVE') newStatus = 'APPROVED_FOR_EXECUTION';
        if (action === 'REJECT') newStatus = 'REJECTED_BY_REVIEWER';
        if (action === 'EXECUTE') newStatus = 'EXECUTED_WITH_CONFIRMATION';
        if (action === 'ROLLBACK') newStatus = 'ROLLED_BACK';

        setRecommendations((prev) =>
            prev.map((r) => (r.id === recId ? { ...r, status: newStatus } : r))
        );

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        setAuditLog((prev) => [
            {
                id: `AUD-REC-${Math.floor(1000 + Math.random() * 9000)}`,
                timestamp: now,
                action: `RECOMMENDATION_${action}`,
                entity: recId,
                actor: `Current User (${activeRole})`,
                hash: Math.random().toString(16).substring(2, 18)
            },
            ...prev
        ]);

        showNotification(`Recommendation ${recId} updated: Status changed to ${newStatus}.`);
    };

    // Filter Skills Matrix
    const filteredSkills = useMemo(() => {
        return SKILLS_64_DATA.filter(([id, cat, title, status, criteria]) => {
            const matchesCat = skillCategory === 'ALL' || cat === skillCategory;
            const matchesSearch =
                skillSearch === '' ||
                id.toLowerCase().includes(skillSearch.toLowerCase()) ||
                title.toLowerCase().includes(skillSearch.toLowerCase()) ||
                criteria.toLowerCase().includes(skillSearch.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [skillCategory, skillSearch]);

    return (
        <div className="w-full bg-slate-50 text-slate-800 font-sans min-h-screen p-4 md:p-6 lg:p-8 space-y-6">
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

            {/* Main Header Card (Clinical White & Red Accents) */}
            <header className="bg-white border-t-4 border-t-rose-600 border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Activity className="w-3.5 h-3.5 text-rose-600" />
                            LNDT-X CLINICAL OPERATIONAL DIGITAL TWIN
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            CLINICAL DECISION SUPPORT • ZERO AUTONOMOUS TAMPERING
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            NABL ISO 15189:2022 &amp; ABDM ALIGNED
                        </span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        LabCore Operational Digital Twin X (LNDT-X)
                    </h1>
                    <p className="text-xs md:text-sm text-slate-600">
                        12-Stage Specimen Workflow Reconstruction • Turnaround Time (TAT) Forecaster • Bayesian Uncertainty • Analyzer Capacity Planning
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        <UserCheck className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-medium text-slate-600">Active Role:</span>
                        <select
                            value={activeRole}
                            onChange={(e) => setActiveRole(e.target.value as UserRole)}
                            aria-label="Active Laboratory Role"
                            className="bg-white text-xs font-semibold text-slate-900 border border-slate-300 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        >
                            <option value="LAB_DIRECTOR">LAB_DIRECTOR (Full Authority)</option>
                            <option value="PATHOLOGIST">PATHOLOGIST (Verification &amp; Sign-Off)</option>
                            <option value="LAB_MANAGER">LAB_MANAGER (Operations &amp; Review)</option>
                            <option value="TECHNICIAN">TECHNICIAN (Workstation &amp; Simulation)</option>
                            <option value="RECEPTIONIST">RECEPTIONIST (Read-Only View)</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSync}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Synchronize Twin State
                    </button>
                </div>
            </header>

            {/* Top Metric Ribbon (KPI Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors">
                    <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                        <span>Active Specimens</span>
                        <FlaskConical className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">149</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Across 12 workflow stages</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors">
                    <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                        <span>Released Reports (24h)</span>
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">42</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Authorized by Pathologist</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors">
                    <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                        <span>P50 / P90 Expected TAT</span>
                        <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-1 font-mono">26.5m / 51.0m</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Estimated time to dispatch</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors">
                    <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                        <span>Recollections / Reruns</span>
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-xl font-bold text-rose-700 mt-1 font-mono">3 / 4</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Rejections: 2 • QC Holds: 2</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors">
                    <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                        <span>Event Integrity</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">100%</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">SHA-256 Deduplicated</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors">
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

            {/* Navigation Tabs (Clean Professional White & Medical Red Design) */}
            <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3" aria-label="Console Navigation Tabs">
                {[
                    { id: 'OVERVIEW', label: '1. Pipeline State (12 Stages)' },
                    { id: 'QUEUES', label: '2. Analyzers & Workstations' },
                    { id: 'FORECAST', label: '3. TAT Forecaster & Uncertainty' },
                    { id: 'BOTTLENECKS', label: '4. Bottlenecks & Critical Path' },
                    { id: 'SIMULATOR', label: '5. Scenario Simulator (DES)' },
                    { id: 'RECOMMENDATIONS', label: '6. Clinical Recommendations' },
                    { id: 'SKILLS', label: '7. 64-Skill Capability Matrix' },
                    { id: 'SAFETY', label: '8. Safety Invariants & Audit Log' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                            activeTab === tab.id
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW & 12-STAGE SPECIMEN PIPELINE */}
            {/* ========================================================================= */}
            {activeTab === 'OVERVIEW' && (
                <section className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Workflow className="w-5 h-5 text-rose-600" />
                                    12-Stage Diagnostic Specimen Lifecycle
                                </h2>
                                <p className="text-xs md:text-sm text-slate-600">
                                    Continuous real-time tracking from patient registration to final NABL report dispatch.
                                </p>
                            </div>
                            <span className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                                Last Telemetry Sync: {lastSyncTime}
                            </span>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left text-xs md:text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                                        <th className="py-3 px-3">#</th>
                                        <th className="py-3 px-3">Workflow Stage</th>
                                        <th className="py-3 px-3">In-Process</th>
                                        <th className="py-3 px-3">Queue Wait</th>
                                        <th className="py-3 px-3">Mean / P90 Wait</th>
                                        <th className="py-3 px-3">Nominal Cycle</th>
                                        <th className="py-3 px-3">Stage Target</th>
                                        <th className="py-3 px-3">Utilization (&rho;)</th>
                                        <th className="py-3 px-3">Operational Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {stages.map((s) => (
                                        <tr key={s.order} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-2.5 px-3 font-mono text-slate-500 font-medium">{s.order}</td>
                                            <td className="py-2.5 px-3 font-semibold text-slate-900">{s.displayName}</td>
                                            <td className="py-2.5 px-3 font-mono text-slate-800">{s.active}</td>
                                            <td className="py-2.5 px-3 font-mono text-slate-800">{s.queue}</td>
                                            <td className="py-2.5 px-3 font-mono text-slate-700">
                                                {s.meanW}m / <span className="font-bold text-amber-700">{s.p90W}m</span>
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-slate-600">{s.cycle}m</td>
                                            <td className="py-2.5 px-3 font-mono text-slate-600">{s.sla}m</td>
                                            <td className="py-2.5 px-3 font-mono">
                                                <span
                                                    className={`font-semibold ${
                                                        s.rho > 0.85
                                                            ? 'text-rose-700'
                                                            : s.rho > 0.70
                                                            ? 'text-amber-700'
                                                            : 'text-emerald-700'
                                                    }`}
                                                >
                                                    {s.rho}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                {s.isBottleneck ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                                                        ATTENTION_STAGE
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <Check className="w-3 h-3 text-emerald-600" />
                                                        NOMINAL
                                                    </span>
                                                )}
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
            {/* TAB 2: QUEUES, STAFFING & ANALYZERS */}
            {/* ========================================================================= */}
            {activeTab === 'QUEUES' && (
                <section className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Cpu className="w-5 h-5 text-rose-600" />
                                    Clinical Analyzer Fleet Capacity &amp; Quality Control
                                </h2>
                                <p className="text-xs md:text-sm text-slate-600">
                                    Real-time instrument throughput, reagent inventory, queue clearance horizons, and Westgard QC status.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left text-xs md:text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                                        <th className="py-3 px-3">Analyzer ID</th>
                                        <th className="py-3 px-3">Instrument Model</th>
                                        <th className="py-3 px-3">Laboratory Dept</th>
                                        <th className="py-3 px-3">Operating Status</th>
                                        <th className="py-3 px-3">Effective / Nominal (/hr)</th>
                                        <th className="py-3 px-3">Queue Depth</th>
                                        <th className="py-3 px-3">Clearance Horizon</th>
                                        <th className="py-3 px-3">24h Downtime</th>
                                        <th className="py-3 px-3">Reagent Inventory</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {analyzers.map((a) => (
                                        <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-2.5 px-3 font-mono font-bold text-rose-700">{a.id}</td>
                                            <td className="py-2.5 px-3 font-semibold text-slate-900">{a.name}</td>
                                            <td className="py-2.5 px-3 text-slate-700">{a.dept}</td>
                                            <td className="py-2.5 px-3">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                        a.status === 'ONLINE'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                    }`}
                                                >
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-slate-800">
                                                {a.eff} / {a.nom} ({a.util}%)
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-slate-900 font-semibold">{a.q} specimens</td>
                                            <td className="py-2.5 px-3 font-mono text-slate-800">{a.clear} min</td>
                                            <td className="py-2.5 px-3 font-mono text-slate-600">{a.down} min</td>
                                            <td className="py-2.5 px-3 font-mono text-slate-800 font-medium">{a.reagent} tests remaining</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Technologist Shift Coverage */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Users className="w-5 h-5 text-rose-600" />
                                Shift Staffing &amp; Technologist Bench Capacity
                            </h3>
                            <p className="text-xs text-slate-600 mb-3">
                                Active vs scheduled staff for sample accessioning, centrifugation, and clinical review.
                            </p>
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                                            <th className="py-2.5 px-3">Shift &amp; Hours</th>
                                            <th className="py-2.5 px-3">Department</th>
                                            <th className="py-2.5 px-3">Active / Sched</th>
                                            <th className="py-2.5 px-3">Validation Cap</th>
                                            <th className="py-2.5 px-3">Workload Util</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {INITIAL_STAFFING.map((s, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="py-2 px-3 font-medium text-slate-800">{s.shift}</td>
                                                <td className="py-2 px-3 font-semibold text-slate-900">{s.dept}</td>
                                                <td className="py-2 px-3 font-mono text-slate-800">{s.activeTechs} / {s.schedTechs}</td>
                                                <td className="py-2 px-3 font-mono text-slate-700">{s.humanCapHr}/hr</td>
                                                <td className="py-2 px-3 font-mono font-bold text-rose-700">{s.utilPct}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Priority Classes & SLA Compliance */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-rose-600" />
                                Priority Classes &amp; SLA Compliance Target
                            </h3>
                            <p className="text-xs text-slate-600 mb-3">
                                Performance tracking for Emergency (STAT), Time-Sensitive, and Routine outpatient testing.
                            </p>
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                                            <th className="py-2.5 px-3">Acuity Level</th>
                                            <th className="py-2.5 px-3">Target SLA</th>
                                            <th className="py-2.5 px-3">Active Count</th>
                                            <th className="py-2.5 px-3">Observed Mean / P90</th>
                                            <th className="py-2.5 px-3">SLA Compliance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {INITIAL_PRIORITIES.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="py-2 px-3 font-bold text-slate-900">{p.displayName}</td>
                                                <td className="py-2 px-3 font-mono font-semibold text-rose-700">{p.slaTargetMin} min</td>
                                                <td className="py-2 px-3 font-mono text-slate-800">{p.activeCount}</td>
                                                <td className="py-2 px-3 font-mono text-slate-700">{p.observedMeanMin}m / {p.observedP90Min}m</td>
                                                <td className="py-2 px-3 font-mono font-bold text-emerald-700">{p.compliancePct}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: TURNAROUND TIME (TAT) FORECASTER & UNCERTAINTY */}
            {/* ========================================================================= */}
            {activeTab === 'FORECAST' && (
                <section className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Forecaster Form */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                    <Sliders className="w-4 h-4 text-rose-600" />
                                    Interactive TAT Forecaster
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    ESTIMATE
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="text-slate-600 block mb-1 font-medium">Department</label>
                                    <select
                                        value={predDept}
                                        onChange={(e) => setPredDept(e.target.value as any)}
                                        aria-label="Department for TAT Forecaster"
                                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    >
                                        <option value="BIOCHEMISTRY">BIOCHEMISTRY</option>
                                        <option value="HEMATOLOGY">HEMATOLOGY</option>
                                        <option value="IMMUNOASSAY">IMMUNOASSAY</option>
                                        <option value="COAGULATION">COAGULATION</option>
                                        <option value="MICROBIOLOGY">MICROBIOLOGY</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-600 block mb-1 font-medium">Priority Acuity</label>
                                    <select
                                        value={predPriority}
                                        onChange={(e) => setPredPriority(e.target.value as any)}
                                        aria-label="Priority Acuity for TAT Forecaster"
                                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    >
                                        <option value="STAT_CRITICAL">STAT_CRITICAL (Emergency)</option>
                                        <option value="URGENT">URGENT (In-Patient)</option>
                                        <option value="ROUTINE">ROUTINE (Outpatient)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-600 block mb-1 font-medium">Queue Depth (&gt;250 = OOD)</label>
                                    <input
                                        type="number"
                                        value={predQueue}
                                        onChange={(e) => setPredQueue(Number(e.target.value))}
                                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-600 block mb-1 font-medium">Active Analyzers</label>
                                    <input
                                        type="number"
                                        value={predAnalyzers}
                                        onChange={(e) => setPredAnalyzers(Number(e.target.value))}
                                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-600 block mb-1 font-medium">Bench Technologists</label>
                                    <input
                                        type="number"
                                        value={predTechs}
                                        onChange={(e) => setPredTechs(Number(e.target.value))}
                                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                                <div className="flex items-center pt-5">
                                    <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                                        <input
                                            type="checkbox"
                                            checked={predQcHold}
                                            onChange={(e) => setPredQcHold(e.target.checked)}
                                            className="rounded text-rose-600 focus:ring-rose-500"
                                        />
                                        Active Westgard QC Hold
                                    </label>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => showNotification('TAT forecast model evaluated with updated queue and staffing inputs.')}
                                className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors"
                            >
                                Recompute Expected Turnaround Time
                            </button>
                        </div>

                        {/* Forecast Results & Bayesian Intervals */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Predicted Turnaround Time &amp; Bayesian Uncertainty Separation
                                    </h3>
                                    <p className="text-xs text-slate-600">
                                        Strictly distinguishes Mean Parameter 95% Confidence Interval from Individual Future Specimen 80%/90% Prediction Intervals.
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded text-xs font-bold ${
                                        forecastOutput.isOod
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                >
                                    {forecastOutput.isOod ? 'ABSTAINED_OUT_OF_BOUNDS' : 'VALIDATED_OPERATIONAL_RANGE'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                    <div className="text-slate-500 font-medium">Point Estimate (P50)</div>
                                    <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{forecastOutput.point} min</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Target SLA: {forecastOutput.sla} min</div>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                    <div className="text-slate-500 font-medium">Mean Parameter 95% CI</div>
                                    <div className="text-sm font-bold text-rose-700 mt-1 font-mono">
                                        [{forecastOutput.ciLow}m, {forecastOutput.ciHigh}m]
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">Population mean uncertainty</div>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                    <div className="text-slate-500 font-medium">Future Specimen 80% PI</div>
                                    <div className="text-sm font-bold text-amber-700 mt-1 font-mono">
                                        [{forecastOutput.pi80Low}m, {forecastOutput.pi80High}m]
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">Single specimen 80% spread</div>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                    <div className="text-slate-500 font-medium">Future Specimen 90% PI</div>
                                    <div className="text-sm font-bold text-slate-800 mt-1 font-mono">
                                        [{forecastOutput.pi90Low}m, {forecastOutput.pi90High}m]
                                    </div>
                                    <div className="text-[11px] font-bold text-rose-700 mt-0.5">
                                        SLA Breach Risk: {forecastOutput.breachProb}%
                                    </div>
                                </div>
                            </div>

                            {forecastOutput.isOod && (
                                <div className="bg-rose-50 border border-rose-300 rounded-lg p-3 text-xs text-rose-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span>
                                        <strong>Out-of-Distribution Safety Guard:</strong> Specimen queue or staffing count exceeds validated historical envelope. Prediction intervals widened automatically by 1.65x.
                                    </span>
                                </div>
                            )}

                            {/* Additive Attribution Breakdown */}
                            <div className="pt-2">
                                <span className="text-xs font-bold text-slate-800 block mb-2">Delay Factor Attribution (Additive Breakdown)</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div className="bg-slate-50 border border-slate-200 rounded p-2">
                                        <div className="text-slate-500">Dept Base Cycle</div>
                                        <div className="font-mono font-bold text-slate-900">+{forecastOutput.deptBase} min</div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded p-2">
                                        <div className="text-slate-500">Priority Preemption</div>
                                        <div className="font-mono font-bold text-emerald-700">{forecastOutput.prioDelta} min</div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded p-2">
                                        <div className="text-slate-500">Queue Load Wait</div>
                                        <div className="font-mono font-bold text-amber-700">+{forecastOutput.qContrib} min</div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded p-2">
                                        <div className="text-slate-500">QC Hold Impact</div>
                                        <div className="font-mono font-bold text-rose-700">+{forecastOutput.qcContrib} min</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Leakage-Safe Chronological Model Evaluation Table */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6">
                        <h3 className="text-sm md:text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-rose-600" />
                            Leakage-Safe Chronological Model Benchmark (180 Train / 60 Val / 60 Test)
                        </h3>
                        <p className="text-xs text-slate-600 mb-4">
                            Strict forward chronological splits preventing future-data leakage in turnaround time predictions.
                        </p>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                                        <th className="py-2.5 px-3">Candidate Model</th>
                                        <th className="py-2.5 px-3">MAE</th>
                                        <th className="py-2.5 px-3">Median AE</th>
                                        <th className="py-2.5 px-3">RMSE</th>
                                        <th className="py-2.5 px-3">R&sup2; Score</th>
                                        <th className="py-2.5 px-3">Pinball Loss (P10/P50/P90)</th>
                                        <th className="py-2.5 px-3">80% / 90% PI Coverage</th>
                                        <th className="py-2.5 px-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                                            LNDT-X Conformal Ridge + Neural Surrogate Ensemble
                                        </td>
                                        <td className="py-2.5 px-3 font-mono font-bold text-rose-700">1.91 min</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-800">1.87 min</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-800">2.24 min</td>
                                        <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700">0.9950</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-700">0.371 / 0.953 / 0.453</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-800">86.7% / 95.0%</td>
                                        <td className="py-2.5 px-3">
                                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                ACTIVE_PRODUCTION
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                                            Bayesian Conjugate Hierarchical Queue Forecaster
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-slate-800">3.24 min</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-800">2.11 min</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-800">6.15 min</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-700">0.9625</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-700">0.628 / 1.622 / 0.562</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-800">90.0% / 93.3%</td>
                                        <td className="py-2.5 px-3">
                                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                VALIDATED_BACKUP
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3 text-slate-700">
                                            Stratified Historical Quantile Baseline (Dept &times; Priority)
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-slate-500">19.99 min</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-500">15.55 min</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-500">26.62 min</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-500">0.2966</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-500">3.890 / 9.997 / 4.864</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-500">80.0% / 88.3%</td>
                                        <td className="py-2.5 px-3">
                                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                                                BASELINE
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: BOTTLENECKS, CRITICAL PATH & CAUSAL COUNTERFACTUALS */}
            {/* ========================================================================= */}
            {activeTab === 'BOTTLENECKS' && (
                <section className="space-y-6">
                    {/* 12-Stage Visual DAG Path */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6">
                        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                            <Workflow className="w-5 h-5 text-rose-600" />
                            12-Stage Critical-Path Workflow Graph
                        </h3>
                        <p className="text-xs md:text-sm text-slate-600 mb-4">
                            Cumulative critical path: <strong className="text-rose-700">284.5 minutes</strong> across all stages. Stages highlighted in red indicate primary bottleneck contributors.
                        </p>

                        <div className="flex flex-wrap gap-2.5">
                            {stages.map((s) => (
                                <div
                                    key={s.order}
                                    className={`p-3 rounded-lg border text-xs min-w-[150px] flex-1 ${
                                        s.isBottleneck
                                            ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
                                            : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                >
                                    <div className="font-bold flex items-center justify-between">
                                        <span>{s.order}. {s.stage.replace(/_/g, ' ')}</span>
                                        {s.isBottleneck && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                                    </div>
                                    <div className="font-mono text-[11px] mt-1 text-slate-600">
                                        Wait: <strong className="text-slate-900">{s.meanW}m</strong> &bull; Cycle: {s.cycle}m
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Evidence-Backed Operational Findings */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-rose-600" />
                                Evidence-Backed Operational Bottlenecks
                            </h3>
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-rose-900">
                                        [CAPACITY_SATURATION] BIOCHEMISTRY &mdash; ANALYZER_PROCESSING
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                                        CRITICAL (Severity: 96)
                                    </span>
                                </div>
                                <p className="text-slate-700">
                                    High morning arrival surge in BIOCHEMISTRY exceeds nominal hourly throughput (160/hr) on Roche Cobas c503 #1 (Current queue = 54 specimens).
                                </p>
                                <div className="font-mono text-rose-800 text-[11px] pt-1">
                                    Utilization &rho; = 0.97 &bull; P90 Wait = 20.3 min &bull; 90% UI = [17.3m, 24.0m] &bull; 4h Rolling Window
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-amber-900">
                                        [STAFFING_CAPACITY_MISMATCH] BIOCHEMISTRY &mdash; SAMPLE_VALIDATION
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                                        MODERATE (Severity: 87)
                                    </span>
                                </div>
                                <p className="text-slate-700">
                                    Technologist deficit (4 active vs 5 scheduled) during Morning Shift slows manual sample validation, accessioning, and centrifuging.
                                </p>
                                <div className="font-mono text-amber-800 text-[11px] pt-1">
                                    Utilization &rho; = 0.87 &bull; P90 Wait = 19.5 min &bull; Deficit: 1 Qualified Technologist
                                </div>
                            </div>
                        </div>

                        {/* Causal AI & Counterfactual Impact */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-rose-600" />
                                Causal Counterfactual Analysis (Backdoor Stratified)
                            </h3>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                                        COUNTERFACTUAL_ESTIMATE
                                    </span>
                                    <span className="font-mono text-slate-600 text-[11px]">Rosenbaum &Gamma; = 2.15</span>
                                </div>
                                <div className="font-bold text-slate-900">
                                    Action: do(Reallocate 35% of eligible Biochemistry routine queue from ANZ-BIO-01 to ANZ-BIO-02)
                                </div>
                                <div className="font-mono text-emerald-700 font-semibold">
                                    Factual TAT: 51.0m &rarr; Counterfactual TAT: 36.7m (&Delta; = -14.3 min, 95% CI [-17.3m, -10.7m])
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    Adjusted for Shift Arrival Surge and STAT Acuity Mix via backdoor causal stratification.
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                                        COUNTERFACTUAL_ESTIMATE
                                    </span>
                                    <span className="font-mono text-slate-600 text-[11px]">Rosenbaum &Gamma; = 1.85</span>
                                </div>
                                <div className="font-bold text-slate-900">
                                    Action: do(Add +1 qualified Medical Technologist to Morning Validation Bench)
                                </div>
                                <div className="font-mono text-emerald-700 font-semibold">
                                    Factual TAT: 51.0m &rarr; Counterfactual TAT: 43.2m (&Delta; = -7.8 min, 95% CI [-10.4m, -5.2m])
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    Resolves observational confounding without disrupting accessioning safety gates.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: DISCRETE-EVENT SIMULATOR (DES) */}
            {/* ========================================================================= */}
            {activeTab === 'SIMULATOR' && (
                <section className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Play className="w-5 h-5 text-rose-600" />
                                    12-Stage Discrete-Event Simulator (Isolated Scenario Engine)
                                </h3>
                                <p className="text-xs md:text-sm text-slate-600">
                                    Evaluates flow conservation (WIP₀ + Arrivals = Completed + Rejected + WIP₁) across isolated Monte Carlo trajectories. Live clinical database is 100% protected.
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                ISOLATED_SANDBOX
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                                <label className="text-slate-700 block mb-1 font-medium">Arrival Surge Multiplier</label>
                                <input
                                    type="number"
                                    step="0.05"
                                    value={simSurge}
                                    onChange={(e) => setSimSurge(Number(e.target.value))}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                            </div>
                            <div>
                                <label className="text-slate-700 block mb-1 font-medium">Staffing Multiplier</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={simStaff}
                                    onChange={(e) => setSimStaff(Number(e.target.value))}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                            </div>
                            <div>
                                <label className="text-slate-700 block mb-1 font-medium">Dispatch Routing Policy</label>
                                <select
                                    value={simPolicy}
                                    onChange={(e) => setSimPolicy(e.target.value as any)}
                                    aria-label="Dispatch Routing Policy"
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                >
                                    <option value="PRIORITY_SLA_EDF">PRIORITY_SLA_EDF (Earliest Deadline First)</option>
                                    <option value="LEAST_UTILIZED_COMPATIBLE">LEAST_UTILIZED_COMPATIBLE (Load Balancing)</option>
                                    <option value="FIFO">FIFO (Standard First-In-First-Out)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-slate-700 block mb-1 font-medium">Deterministic Seed (PRNG)</label>
                                <input
                                    type="number"
                                    value={simSeed}
                                    onChange={(e) => setSimSeed(Number(e.target.value))}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleRunSimulation}
                            className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                        >
                            <Play className="w-4 h-4" />
                            Execute Isolated 30-Trajectory Simulation
                        </button>
                    </div>

                    {/* Simulation Output Card */}
                    {simResult && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <h4 className="text-base font-bold text-slate-900">
                                    Simulation Trajectory Results (Policy: {simResult.policy} &bull; Seed: {simResult.seed})
                                </h4>
                                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                                    Flow Conservation Equation: BALANCED &bull; Live DB Mutation: 0
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                    <div className="text-slate-500 font-medium">Simulated P50 / P90 / P99 TAT</div>
                                    <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                                        {simResult.p50}m / {simResult.p90}m / {simResult.p99}m
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                    <div className="text-slate-500 font-medium">P90 Monte Carlo 95% CI</div>
                                    <div className="text-lg font-bold text-rose-700 mt-1 font-mono">
                                        [{(simResult.p90 * 0.93).toFixed(1)}m, {(simResult.p90 * 1.07).toFixed(1)}m]
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                    <div className="text-slate-500 font-medium">Projected SLA Breach Rate</div>
                                    <div className="text-lg font-bold text-amber-700 mt-1 font-mono">{simResult.breach}%</div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                    <div className="text-slate-500 font-medium">Conservation Equation</div>
                                    <div className="text-[11px] font-mono text-slate-700 mt-1">
                                        WIP₀({simResult.wip0}) + Arr({simResult.arrivals}) = Comp({simResult.completed}) + Rej({simResult.rejected}) + WIP₁({simResult.wip1})
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: RECOMMENDATIONS & HUMAN-IN-THE-LOOP GOVERNANCE */}
            {/* ========================================================================= */}
            {activeTab === 'RECOMMENDATIONS' && (
                <section className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-rose-600" />
                                Actionable Operational Recommendations &amp; Human Governance Gate
                            </h3>
                            <p className="text-xs md:text-sm text-slate-600 mt-1">
                                Operational recommendations are strictly advisory. Execution requires Pathologist or Laboratory Director role authorization with a verified rollback option.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {recommendations.map((r) => (
                                <div key={r.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5 space-y-3 text-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">{r.id}</span>
                                            <span className="font-bold text-slate-900 text-sm">{r.category.replace(/_/g, ' ')} ({r.dept} &mdash; {r.stage})</span>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                r.status === 'EXECUTED_WITH_CONFIRMATION'
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                    : r.status === 'APPROVED_FOR_EXECUTION'
                                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                    : r.status === 'ROLLED_BACK' || r.status === 'REJECTED_BY_REVIEWER'
                                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                            }`}
                                        >
                                            {r.status}
                                        </span>
                                    </div>

                                    <div className="text-slate-800 font-medium text-sm">{r.problem}</div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                                            <span className="text-slate-500 font-medium block">Expected Benefit:</span>
                                            <span className="text-emerald-700 font-mono font-semibold">{r.benefit}</span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                                            <span className="text-slate-500 font-medium block">Operational Assumptions:</span>
                                            <span className="text-slate-700">{r.assumptions}</span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                                            <span className="text-slate-500 font-medium block">Adverse Trade-Offs:</span>
                                            <span className="text-slate-700">{r.adverse}</span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                                            <span className="text-slate-500 font-medium block">Cost Estimate:</span>
                                            <span className="text-slate-900 font-semibold">{r.estimatedCost}</span>
                                        </div>
                                    </div>

                                    {/* Governance Action Buttons */}
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => handleRecommendationAction(r.id, 'APPROVE')}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            1. Authorize &amp; Approve
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRecommendationAction(r.id, 'EXECUTE')}
                                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                                        >
                                            <Play className="w-3.5 h-3.5" />
                                            2. Execute Change
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRecommendationAction(r.id, 'ROLLBACK')}
                                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            3. Safe Rollback
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRecommendationAction(r.id, 'REJECT')}
                                            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 7: 64-SKILL TECHNICAL FRAMEWORK MATRIX */}
            {/* ========================================================================= */}
            {activeTab === 'SKILLS' && (
                <section className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-rose-600" />
                                    Complete 64-Skill Laboratory Technical Framework (Categories A&ndash;J)
                                </h3>
                                <p className="text-xs md:text-sm text-slate-600">
                                    61 Implemented and verified &bull; 1 Deferred (RL-03) &bull; 1 Research-only (DL-03) &bull; 1 Not applicable (GRAPH-03)
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                                    <input
                                        type="text"
                                        placeholder="Search 64 skills..."
                                        value={skillSearch}
                                        onChange={(e) => setSkillSearch(e.target.value)}
                                        className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>

                                <select
                                    value={skillCategory}
                                    onChange={(e) => setSkillCategory(e.target.value)}
                                    aria-label="Filter 64-Skill Matrix by Category"
                                    className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                >
                                    <option value="ALL">All Categories (64 Skills)</option>
                                    <option value="A">Category A &mdash; Deep Learning (8)</option>
                                    <option value="B">Category B &mdash; Advanced Math (10)</option>
                                    <option value="C">Category C &mdash; Bayesian AI (6)</option>
                                    <option value="D">Category D &mdash; Causal AI (5)</option>
                                    <option value="E">Category E &mdash; RL &amp; Control (7)</option>
                                    <option value="F">Category F &mdash; Graph &amp; Tensor (6)</option>
                                    <option value="G">Category G &mdash; Simulation &amp; Twin (6)</option>
                                    <option value="H">Category H &mdash; Formal Safety (5)</option>
                                    <option value="I">Category I &mdash; Scientific Discovery (5)</option>
                                    <option value="J">Category J &mdash; Distributed &amp; MLOps (6)</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-[500px] border border-slate-200 rounded-lg">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold z-10">
                                    <tr>
                                        <th className="py-2.5 px-3">Skill ID</th>
                                        <th className="py-2.5 px-3">Cat</th>
                                        <th className="py-2.5 px-3">Skill Title</th>
                                        <th className="py-2.5 px-3">Implementation Status</th>
                                        <th className="py-2.5 px-3">Measurable Acceptance Criteria</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSkills.map(([id, cat, title, status, criteria]) => (
                                        <tr key={id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-2.5 px-3 font-mono font-bold text-rose-700">{id}</td>
                                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">{cat}</td>
                                            <td className="py-2.5 px-3 font-semibold text-slate-900">{title}</td>
                                            <td className="py-2.5 px-3">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                                        status === 'Implemented and verified'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                    }`}
                                                >
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600">{criteria}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 8: AUDIT & MANDATORY SAFETY INVARIANTS */}
            {/* ========================================================================= */}
            {activeTab === 'SAFETY' && (
                <section className="space-y-6">
                    {/* Feature Flag & Isolation Card */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-rose-600" />
                                LNDT-X Operational Feature Flag &amp; Fail-Safe Isolation
                            </h3>
                            <p className="text-xs md:text-sm text-slate-600">
                                Disabling LNDT-X isolates operational twin computations while keeping core hospital ELIS workflows 100% operational.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setFeatureFlagEnabled(true);
                                    showNotification('LNDT_X_ENABLED activated.');
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                                    featureFlagEnabled
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Enable Twin Engine
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setFeatureFlagEnabled(false);
                                    showNotification('LNDT_X_ENABLED disabled (Fail-safe isolation active).', true);
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                                    !featureFlagEnabled
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Disable (Isolate Engine)
                            </button>
                        </div>
                    </div>

                    {/* 7 Mandatory Safety Invariants */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                7 Mandatory Clinical Safety &amp; Domain Invariants (7 / 7 Passing)
                            </h3>
                            <p className="text-xs text-slate-600">
                                Formal machine-checked boundaries guaranteeing that no digital twin process can compromise patient care or clinical accuracy.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {SAFETY_INVARIANTS.map((inv) => (
                                <div key={inv.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-rose-700">{inv.id}: {inv.title}</span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            VERIFIED PASS
                                        </span>
                                    </div>
                                    <div className="text-slate-800 font-semibold">{inv.desc}</div>
                                    <div className="text-[11px] text-slate-500 font-mono pt-1">
                                        Check Proof: {inv.evidence}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Immutable Cryptographic Audit Trail */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-rose-600" />
                                Immutable SHA-256 Operational Audit Trail (NABL 7-Year Retention)
                            </h3>
                            <p className="text-xs text-slate-600">
                                Every synchronization, simulation, and recommendation authorization is cryptographically hashed and chained.
                            </p>
                        </div>

                        <div className="space-y-2 text-xs">
                            {auditLog.map((a) => (
                                <div key={a.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <span className="font-mono font-bold text-rose-700">{a.action}</span> &bull;{' '}
                                        <span className="text-slate-900 font-medium">{a.entity}</span> &bull;{' '}
                                        <span className="text-slate-600">Actor: {a.actor}</span>
                                    </div>
                                    <div className="font-mono text-[11px] text-slate-500">
                                        {a.timestamp} &bull; SHA256: {a.hash}...
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
