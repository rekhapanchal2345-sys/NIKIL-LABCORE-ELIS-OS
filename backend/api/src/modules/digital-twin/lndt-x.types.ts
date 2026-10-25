/**
 * LNDT-X: LabCore Neural Digital Twin X - Domain Types & Data Contracts
 * Standards Compliance: NABL (ISO 15189:2022) | ABDM FHIR R4 | Zero Autonomous Clinical Mutation
 */

export type LndtWorkflowStage =
    | 'PATIENT_REGISTRATION'
    | 'TEST_ORDER'
    | 'ACCESSIONING'
    | 'SAMPLE_COLLECTION'
    | 'SAMPLE_RECEIPT'
    | 'SAMPLE_VALIDATION'
    | 'QUEUE_ASSIGNMENT'
    | 'ANALYZER_PROCESSING'
    | 'QC_VALIDATION'
    | 'RESULT_INGESTION'
    | 'AUTHORIZED_REVIEW'
    | 'REPORT_RELEASE';

export type LndtPriorityClass = 'STAT_CRITICAL' | 'BIO_STABILITY_RISK' | 'URGENT' | 'ROUTINE';

export type LndtRole = 'LAB_DIRECTOR' | 'PATHOLOGIST' | 'LAB_MANAGER' | 'TECHNICIAN' | 'RECEPTIONIST';

export interface LndtStageMetric {
    order: number;
    stage: LndtWorkflowStage;
    displayName: string;
    activeCount: number;
    queueDepth: number;
    meanWaitMin: number;
    p90WaitMin: number;
    cycleTimeMin: number;
    slaTargetMin: number;
    utilizationRho: number;
    isBottleneck: boolean;
}

export interface LndtForecasterInput {
    department: 'BIOCHEMISTRY' | 'HEMATOLOGY' | 'IMMUNOASSAY' | 'COAGULATION' | 'MICROBIOLOGY';
    priority: LndtPriorityClass;
    queueDepth: number;
    activeAnalyzers: number;
    activeTechs: number;
    qcHoldActive: boolean;
}

export interface LndtForecasterOutput {
    pointEstimateMin: number;
    slaTargetMin: number;
    parameterCi95: [number, number];
    futureOutcomePi80: [number, number];
    futureOutcomePi90: [number, number];
    slaBreachProbabilityPct: number;
    isOutOfDistribution: boolean;
    attribution: {
        deptBaselineMin: number;
        priorityPreemptionMin: number;
        queueLoadMin: number;
        qcHoldPenaltyMin: number;
    };
}

export interface LndtSimulationInput {
    arrivalSurgeMultiplier: number;
    staffingMultiplier: number;
    dispatchPolicy: 'PRIORITY_SLA_EDF' | 'LEAST_UTILIZED_COMPATIBLE' | 'FIFO';
    prngSeed: number;
}

export interface LndtSimulationOutput {
    wip0: number;
    arrivals: number;
    rejected: number;
    completed: number;
    wip1: number;
    flowConservationVerified: boolean;
    p50TatMin: number;
    p90TatMin: number;
    p99TatMin: number;
    p90MonteCarloCi95: [number, number];
    slaBreachRatePct: number;
    policy: string;
    seed: number;
}

export interface LndtRecommendation {
    id: string;
    category: string;
    department: string;
    stage: LndtWorkflowStage;
    problem: string;
    expectedBenefit: string;
    assumptions: string;
    adverseEffects: string;
    estimatedCostInr: number;
    status: 'PENDING_HUMAN_REVIEW' | 'APPROVED_FOR_EXECUTION' | 'EXECUTED_WITH_CONFIRMATION' | 'REJECTED_BY_REVIEWER' | 'ROLLED_BACK';
    authorizedBy?: string;
    executedAt?: string;
    rolledBackAt?: string;
}
