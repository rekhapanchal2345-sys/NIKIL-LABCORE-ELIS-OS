export type LabDepartment =
    | 'HEMATOLOGY'
    | 'BIOCHEMISTRY'
    | 'IMMUNOASSAY'
    | 'COAGULATION'
    | 'MICROBIOLOGY';

export type AnalyzerOperationalStatus =
    | 'ONLINE'
    | 'DEGRADED_QC_WARNING'
    | 'LOCKED_WESTGARD_VIOLATION'
    | 'REAGENT_DEPLETED'
    | 'MAINTENANCE_OFFLINE';

export type SpecimenPriorityClass =
    | 'STAT_CRITICAL'
    | 'BIO_STABILITY_RISK'
    | 'URGENT'
    | 'ROUTINE';

export type WestgardRuleCode =
    | 'NONE'
    | '1_2s_WARNING'
    | '1_3s_RANDOM_ERROR'
    | '2_2s_SYSTEMATIC_SHIFT'
    | 'R_4s_RANGE_ERROR'
    | '4_1s_CALIBRATION_DRIFT'
    | '10_x_BIAS';

export interface AnalyzerTwinNode {
    analyzerId: string;
    name: string;
    model: string;
    department: LabDepartment;
    status: AnalyzerOperationalStatus;
    parallelChannels: number;
    nominalThroughputPerHour: number;
    meanCycleTimeMinutes: number;
    currentQueueDepth: number;
    reagentRemainingTests: number;
    reagentLowThreshold: number;
    westgardStatus: WestgardRuleCode;
    calibrationBiasPct: number;
    compatibleBackupAnalyzerIds: string[];
    costPerTestInr: number;
    mtbfHours: number;
}

export interface QueuedSpecimenTwinItem {
    sampleId: string;
    barcode: string;
    orderId: string;
    department: LabDepartment;
    targetAnalyzerId: string;
    analyteCode: string;
    priority: SpecimenPriorityClass;
    collectedAtIso: string;
    storageTempCelsius: number;
    isCentrifuged: boolean;
    slaTargetMinutes: number;
    tubeType?: string;
    arrivalOffsetMinutes?: number;
}

export interface AnalyteStabilityKinetics {
    analyteCode: string;
    analyteName: string;
    department: LabDepartment;
    referenceRateConstantPerHour: number; // k_ref at 22°C (295.15K)
    activationEnergyOverR: number;        // E_a / R (Kelvin)
    maxPermissibleDriftPct: number;       // Total Allowable Error (TEa%) budget for pre-analytical phase
    centrifugationMitigationFactor: number; // Multiplier when serum/plasma is separated from cells
    recommendedAction: string;
}

export interface SpecimenStabilityAssessment {
    sampleId: string;
    barcode: string;
    orderId?: string;
    orderNumber?: string;
    patientName?: string;
    uhid?: string;
    analyteCode: string;
    analyteName: string;
    department: LabDepartment;
    targetAnalyzerId: string;
    originalPriority: SpecimenPriorityClass;
    recommendedPriority: SpecimenPriorityClass;
    elapsedMinutesSinceCollection: number;
    predictedQueueWaitMinutes: number;
    totalProjectedMinutesToAssay: number;
    storageTempCelsius: number;
    currentDriftPct: number;
    projectedDriftAtAssayPct: number;
    maxPermissibleDriftPct: number;
    viabilityRemainingMinutes: number;
    riskLevel: 'SAFE' | 'ELEVATED_WATCH' | 'CRITICAL_PREEMPT_REQUIRED' | 'EXPIRED_REDRAW_REQUIRED';
    clinicalRecommendation: string;
}

export interface DepartmentSimulationForecast {
    department: LabDepartment;
    activeAnalyzers: number;
    offlineOrLockedAnalyzers: number;
    arrivalRatePerHour: number;
    effectiveCapacityPerHour: number;
    trafficIntensityRho: number;
    erlangCWaitProbability: number;
    tatMinutesP50: number;
    tatMinutesP90: number;
    tatMinutesP99: number;
    slaTargetMinutes: number;
    predictedSlaBreachPct: number;
    peakQueueDepthP95: number;
    earliestReagentExhaustionHours: number | null;
    bottleneckSeverity: 'OPTIMAL' | 'MODERATE_LOAD' | 'HIGH_CONGESTION' | 'CRITICAL_SATURATION';
}

export interface HourlySimulationTimelinePoint {
    hourOffset: number;
    label: string;
    projectedArrivals: number;
    projectedCompleted: number;
    projectedBacklog: number;
    meanTatMinutes: number;
    slaCompliancePct: number;
}

export interface DigitalTwinSimulationInput {
    scenarioName?: string;
    horizonHours: number;
    surgeMultiplier: number;
    statRatio: number;
    ambientTempCelsius: number;
    iterations: number;
    seed: number;
    forcedOfflineAnalyzerIds?: string[];
    analyzerOverrides?: Partial<AnalyzerTwinNode>[];
    customSpecimens?: QueuedSpecimenTwinItem[];
    idempotencyKey?: string;
}

export interface DigitalTwinSimulationResult {
    runId: string;
    idempotencyKey: string;
    executedAtIso: string;
    executionDurationMs: number;
    seed: number;
    iterations: number;
    overallBottleneckScore: number; // 0 to 100
    predictedOverallSlaBreachPct: number;
    totalProjectedSpecimens: number;
    totalThroughputCapacity: number;
    departmentForecasts: DepartmentSimulationForecast[];
    hourlyTimeline: HourlySimulationTimelinePoint[];
    stabilityAssessments: SpecimenStabilityAssessment[];
    criticalAlerts: string[];
    analyzerStates: AnalyzerTwinNode[];
}

export interface FailoverRouteAllocation {
    targetAnalyzerId: string;
    targetAnalyzerName: string;
    allocatedSpecimens: number;
    sharePct: number;
    projectedUtilizationBefore: number;
    projectedUtilizationAfter: number;
    projectedTatMinutesAfter: number;
    calibrationBiasDeltaPct: number;
    reagentSufficient: boolean;
    validationNotice: string;
}

export interface FailoverOptimizationPlan {
    proposalId: string;
    idempotencyKey: string;
    faultedAnalyzerId: string;
    faultedAnalyzerName: string;
    department: LabDepartment;
    faultReason: string;
    affectedPendingSpecimens: number;
    unmitigatedTatMinutesP90: number;
    mitigatedTatMinutesP90: number;
    estimatedTatSavedMinutes: number;
    unallocatedSpecimensCount: number;
    allocations: FailoverRouteAllocation[];
    clinicalSafetyGate: {
        requiresPathologistSignoff: boolean;
        crossLotCalibrationCheckRequired: boolean;
        autoReleasePermitted: false; // Strictly false per clinical safety rules
        mandatoryChecks: string[];
    };
    status: 'PENDING_APPROVAL' | 'APPROVED_ACTIVE' | 'REJECTED';
    createdAtIso: string;
}

// =========================================================================
// ADVANCED AI / ML TRAINING, SURROGATE MODELING & PROGNOSTICS TYPES
// =========================================================================

export type ModelTrainingType =
    | 'NEURAL_SURROGATE_TAT'
    | 'Q_LEARNING_DISPATCH'
    | 'WEIBULL_RUL_PROGNOSTICS';

export interface TrainingHyperparameters {
    epochs: number;
    learningRate: number;
    batchSize: number;
    hiddenLayerNeurons: number;
    regularizationL2: number;
    discountFactorGamma?: number;
    explorationEpsilonDecay?: number;
    seed: number;
}

export interface EpochTrainingMetric {
    epoch: number;
    trainLoss: number;
    valLoss: number;
    meanAbsoluteErrorMinutes: number;
    rSquared: number;
}

export interface TrainedModelArtifact {
    modelId: string;
    name: string;
    modelType: ModelTrainingType;
    version: string;
    trainedAtIso: string;
    trainedByUserId: string;
    isDeployed: boolean;
    trainingDurationMs: number;
    hyperparameters: TrainingHyperparameters;
    finalMetrics: {
        rSquared: number;
        trainLoss: number;
        valLoss: number;
        meanAbsoluteErrorMinutes: number;
        inferenceLatencyMicroseconds: number;
    };
    epochMetrics: EpochTrainingMetric[];
    weightsSummary: {
        layers: number[];
        parameterCount: number;
        checksumSha256: string;
    };
    policyMatrix?: Record<string, string>;
}

export interface SurrogatePredictionInput {
    ambientTempCelsius: number;
    surgeMultiplier: number;
    statRatio: number;
    horizonHours: number;
    activeAnalyzersCount: number;
    totalCurrentQueue: number;
    lockedAnalyzersCount: number;
}

export interface SurrogatePredictionResult {
    modelId: string;
    modelVersion: string;
    inferenceTimeMs: number;
    projectedP50TatMinutes: number;
    projectedP90TatMinutes: number;
    projectedP99TatMinutes: number;
    predictedSlaBreachProbabilityPct: number;
    overallBottleneckScore: number;
    confidenceIntervalPct: number;
}

export interface WeibullPrognosticAssessment {
    analyzerId: string;
    analyzerName: string;
    name?: string;
    department: LabDepartment | string;
    operatingHours?: number;
    operatingHoursSinceOverhaul: number;
    characteristicLifeEtaHours: number;
    weibullEtaScaleHours?: number;
    weibullShapeBeta: number;
    weibullBetaShape?: number;
    currentFailureHazardRate: number;
    instantaneousHazardRateH?: number;
    probabilityOfFailureNext24hPct: number;
    failureProbability24hPct?: number;
    remainingUsefulLifeHours: number;
    predictedRulOperatingHours?: number;
    recommendedMaintenanceWindow:
    | 'IMMEDIATE_PREVENTIVE'
    | 'SCHEDULE_NEXT_SHIFT'
    | 'NOMINAL';
    maintenanceUrgency?: 'NOMINAL' | 'ELEVATED_RISK' | 'HIGH_PRIORITY_MAINTENANCE' | 'CRITICAL_INTERVENTION_NEEDED';
    recommendedAction?: string;
    vulnerabilityFactors: string[];
}

export interface ParetoSolutionCandidate {
    solutionId: string;
    label: string;
    strategyProfile: 'MIN_TAT' | 'BALANCED_CLINICAL' | 'MIN_THERMAL_DRIFT' | 'MIN_COST';
    tatMinutesP90: number;
    meanThermalDriftPct: number;
    totalCostInr: number;
    crossAnalyzerBiasMaxPct: number;
    dispatchAllocations: Record<string, number>;
    isParetoFrontier: boolean;
    hypervolumeContribution: number;
}

export interface ParetoOptimizationResult {
    evaluatedCandidateCount: number;
    paretoFrontierSolutions: ParetoSolutionCandidate[];
    recommendedSolutionId: string;
    hypervolumeTotal: number;
    tradeoffSummary: string;
}

// =========================================================================
// REAL HOSPITAL WORKFLOW, DATABASE MUTATION & SEEDER DTOs
// =========================================================================

export interface SaveScenarioSnapshotInput {
    name: string;
    description?: string;
    horizonHours: number;
    surgeMultiplier: number;
    statRatio: number;
    ambientTempCelsius: number;
    isBaseline?: boolean;
}

export interface LogCalibrationInput {
    analyzerId: string;
    calibrationType?: string;
    outcome?: string;
    result?: string;
    calibrationBiasPct?: number;
    reagentsUsed?: string;
    notes?: string;
}

export interface LiveSpecimenEscalationInput {
    sampleId: string;
    clinicalReason: string;
    targetAnalyzerId?: string;
}

export interface LiveSpecimenRecollectionInput {
    sampleId: string;
    rejectionReason: string;
    notifyWard: boolean;
}

export interface LiveWardNotificationInput {
    sampleId: string;
    wardDepartment: string;
    notificationUrgency: 'INFO' | 'URGENT' | 'CRITICAL_ACTION_REQUIRED';
    message: string;
}

export interface LiveMaintenanceWindowInput {
    analyzerId: string;
    maintenanceType: string;
    scheduledDateIso: string;
    description: string;
    technicianName?: string;
    estimatedDowntimeHours?: number;
}

export interface LiveAnalyzerLockoutInput {
    analyzerId: string;
    lockoutReason: string;
    triggerFailoverProposal: boolean;
}

export interface LiveSurgeModeInput {
    surgeMultiplier: number;
    broadcastMessage: string;
    targetDepartments: string[];
}

export interface ApplyOperatingPolicyInput {
    policyId: string;
    strategyProfile: 'MIN_TAT' | 'BALANCED_CLINICAL' | 'MIN_THERMAL_DRIFT' | 'MIN_COST';
    label: string;
    description?: string;
    expectedTatP90: number;
    expectedThermalDriftPct: number;
    expectedCostPerTest: number;
    crossAnalyzerBiasRisk: number;
    allocationRatios: Record<string, number>;
}

export interface SeedHospitalShiftResult {
    seededAnalyzersCount: number;
    seededPatientsCount: number;
    seededOrdersCount: number;
    seededSamplesCount: number;
    seededAlertsCount: number;
    generatedProposalId?: string;
    message: string;
    timestamp: string;
}
