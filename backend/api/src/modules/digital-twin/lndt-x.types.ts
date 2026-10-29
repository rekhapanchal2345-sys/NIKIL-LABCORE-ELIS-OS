/**
 * INDT-X Enterprise domain contracts.
 * Outputs are observational/analytical and never imply clinical certainty.
 */
export type LndtWorkflowStage =
  | 'PATIENT_REGISTRATION' | 'TEST_ORDER' | 'ACCESSIONING' | 'SAMPLE_COLLECTION'
  | 'SAMPLE_RECEIPT' | 'SAMPLE_VALIDATION' | 'QUEUE_ASSIGNMENT' | 'ANALYZER_PROCESSING'
  | 'QC_VALIDATION' | 'RESULT_INGESTION' | 'AUTHORIZED_REVIEW' | 'REPORT_RELEASE';

export type LndtPriorityClass = 'STAT_CRITICAL' | 'BIO_STABILITY_RISK' | 'URGENT' | 'ROUTINE';

export interface LndtStageMetric {
  order: number; stage: LndtWorkflowStage; displayName: string; activeCount: number;
  queueDepth: number; meanWaitMin: number; p90WaitMin: number; cycleTimeMin: number;
  slaTargetMin: number; utilizationRho: number; isBottleneck: boolean;
}

export interface LndtForecasterInput {
  department: string; priority: LndtPriorityClass; queueDepth: number;
  activeAnalyzers: number; activeTechs: number; qcHoldActive: boolean;
}

export interface LndtForecasterOutput {
  pointEstimateMin: number; slaTargetMin: number; parameterCi95: [number, number];
  futureOutcomePi80: [number, number]; futureOutcomePi90: [number, number];
  slaBreachProbabilityPct: number; isOutOfDistribution: boolean;
  sampleSize: number; historicalMedianMin: number; historicalP90Min: number;
  uncertaintyMethod: 'EMPIRICAL_BOOTSTRAP_APPROXIMATION';
  dataWindowDays: number;
  attribution: Record<string, number>;
}

export interface LndtSimulationInput {
  arrivalSurgeMultiplier: number; staffingMultiplier: number;
  dispatchPolicy: 'PRIORITY_SLA_EDF' | 'LEAST_UTILIZED_COMPATIBLE' | 'FIFO'; prngSeed: number;
}

export interface LndtSimulationOutput {
  wip0: number; arrivals: number; rejected: number; completed: number; wip1: number;
  flowConservationVerified: boolean; p50TatMin: number; p90TatMin: number; p99TatMin: number;
  p90MonteCarloCi95: [number, number]; slaBreachRatePct: number; policy: string; seed: number;
  replications: number; empiricalSampleSize: number; dataWindowDays: number;
}

export interface LndtRecommendation {
  id: string; category: string; department: string; stage: LndtWorkflowStage;
  problem: string; expectedBenefit: string; assumptions: string; adverseEffects: string;
  estimatedCostInr?: number; status: 'PENDING_HUMAN_REVIEW' | 'APPROVED_FOR_EXECUTION' |
  'EXECUTED_WITH_CONFIRMATION' | 'REJECTED_BY_REVIEWER' | 'ROLLED_BACK';
  evidence?: { sampleSize: number; metric: string; observedValue: number; dataWindowDays: number };
  authorizedBy?: string; executedAt?: string; rolledBackAt?: string;
}

export interface LndtGraphNode { id: string; type: 'PATIENT'|'ORDER'|'SAMPLE'|'TEST'|'RESULT'; label: string; time?: string; }
export interface LndtGraphEdge { source: string; target: string; relation: string; time?: string; }
