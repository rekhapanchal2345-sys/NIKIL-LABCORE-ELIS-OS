/**
 * LABCORE OMNISCIENT NEXUS — TYPE DEFINITIONS & CONTRACTS
 * 
 * Strict typing for mathematical analytics, operational intelligence,
 * discrete-event simulation, inventory advisory, and controlled autonomy.
 */

export type DataProvenance =
    | 'LIVE'
    | 'HISTORICAL'
    | 'PREDICTED'
    | 'SIMULATED'
    | 'SYNTHETIC'
    | 'HYPOTHETICAL'
    | 'CONFIRMED';

export interface NexusMetric<T = number> {
    id: string;
    label: string;
    value: T;
    unit: string;
    timeWindow: string;
    source: string;
    timestamp: string;
    sampleSize?: number;
    provenance: DataProvenance;
    confidenceInterval?: [number, number];
    isInsufficientData?: boolean;
    missingDataWarning?: string;
}

export interface DescriptiveStatisticsResult {
    sampleSize: number;
    mean: number;
    median: number;
    variance: number;
    stdDev: number;
    min: number;
    max: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
    iqr: number;
    mad: number; // Median Absolute Deviation (robust scale)
    skewness: number;
    outliersCount: number;
    confidenceInterval95: [number, number];
    hasSufficientData: boolean;
    provenance: DataProvenance;
}

export interface QueueProcessAnalytics {
    department: string;
    activeChannels: number;
    arrivalRateLambdaPerHour: number;
    serviceRateMuPerHour: number;
    trafficIntensityRho: number;
    workInProgressL: number; // Little's Law L = lambda * W
    queueLengthLq: number;
    erlangCWaitProbability: number;
    meanWaitTimeWqMinutes: number;
    meanTotalTatWMinutes: number;
    slaTargetMinutes: number;
    predictedSlaBreachRatePct: number;
    bottleneckSeverity: 'OPTIMAL' | 'MODERATE_LOAD' | 'HIGH_CONGESTION' | 'CRITICAL_SATURATION';
    provenance: DataProvenance;
}

export interface ReagentInventoryAdvisory {
    reagentId: string;
    reagentName: string;
    analyzerId: string;
    analyzerName: string;
    department: string;
    testsRemaining: number;
    dailyConsumptionRate: number;
    daysOfStockRemaining: number;
    safetyStockThreshold: number;
    reorderLeadTimeDays: number;
    stockoutRisk: 'OPTIMAL' | 'ELEVATED_WATCH' | 'CRITICAL_DEPLETION_RISK';
    recommendedReorderDate: string;
    expiryDate: string;
    daysToExpiry: number;
    expiryExposureRisk: boolean;
    provenance: DataProvenance;
}

export interface LeveyJenningsPoint {
    runIndex: number;
    timestamp: string;
    measuredValue: number;
    zScore: number;
    lotNumber: string;
    operatorId: string;
    isOutlier: boolean;
    triggeredWestgardRules: string[];
}

export interface QualityControlIntelligence {
    analyteCode: string;
    analyteName: string;
    analyzerId: string;
    analyzerName: string;
    controlLevel: string;
    lotNumber: string;
    targetMean: number;
    targetSd: number;
    calculatedMean: number;
    calculatedSd: number;
    cvPercentage: number;
    dataPointsCount: number;
    leveyJenningsPoints: LeveyJenningsPoint[];
    activeAlerts: string[];
    isWestgardViolated: boolean;
    latestZScore: number;
    trendType: 'STABLE_HOMEOSTASIS' | 'SYSTEMATIC_SHIFT' | 'INCREASING_DRIFT' | 'EXCESSIVE_IMPRECISION';
    recommendation: string;
    provenance: DataProvenance;
}

export interface EvidenceNode {
    id: string;
    type: 'OBSERVED_FACT' | 'STATISTICAL_CORRELATION' | 'MODEL_PREDICTION' | 'HYPOTHESIS' | 'CONFIRMED_RESOLUTION';
    title: string;
    description: string;
    confidenceScore: number; // 0.0 - 1.0
    sourceModule: string;
    timestamp: string;
    entityReference?: string;
}

export interface EvidenceEdge {
    fromNodeId: string;
    toNodeId: string;
    relationshipType: 'CAUSES' | 'CORRELATES_WITH' | 'AGGRAVATES' | 'RESOLVES' | 'EVIDENCES';
    weight: number;
}

export interface RootCauseInvestigation {
    investigationId: string;
    title: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'ACTIVE' | 'UNDER_REVIEW' | 'RESOLVED_CONFIRMED';
    department: string;
    detectedAt: string;
    objective: string;
    nodes: EvidenceNode[];
    edges: EvidenceEdge[];
    primaryRootCauseSummary: string;
    mitigationActions: string[];
    assignedReviewerRole: string;
    resolutionDate?: string;
    provenance: DataProvenance;
}

export interface ControlledAutonomyProposal {
    id: string;
    category:
    | 'QUEUE_PREEMPTION'
    | 'FAILOVER_REROUTING'
    | 'REAGENT_STOCKOUT_ADVISORY'
    | 'ANALYZER_MAINTENANCE_LOCKOUT'
    | 'WESTGARD_QC_INTERVENTION'
    | 'WORKFORCE_BALANCING';
    riskLevel: 'LOW_ADVISORY' | 'MEDIUM_OPERATIONAL' | 'HIGH_CLINICAL_GATE';
    title: string;
    reason: string;
    supportingEvidence: string[];
    expectedBenefit: string;
    potentialRisk: string;
    proposedAction: string;
    requiredRole: 'LAB_DIRECTOR' | 'PATHOLOGIST' | 'LAB_TECHNICIAN';
    status: 'PENDING_APPROVAL' | 'APPROVED_EXECUTED' | 'REJECTED';
    proposedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
    auditLogId?: string;
}

export interface LaboratoryZoneTopology {
    zoneId: string;
    name: string;
    code: string;
    type: 'PRE_ANALYTICAL' | 'CORE_TESTING' | 'POST_ANALYTICAL' | 'STORAGE_LOGISTICS';
    gridPosition: { x: number; y: number; width: number; height: number };
    color: string;
    activeAnalyzers: string[];
    currentWorkInProgress: number;
    capacityPerHour: number;
    utilizationRatePct: number;
    status: 'OPTIMAL' | 'ELEVATED' | 'SATURATED' | 'OFFLINE';
}

export interface LaboratoryWorldModelSnapshot {
    modelId: string;
    version: string;
    timestamp: string;
    laboratoryName: string;
    ambientTemperatureCelsius: number;
    totalActiveAnalyzers: number;
    totalPendingSpecimens: number;
    overallTatP50Minutes: number;
    overallTatP90Minutes: number;
    overallSlaBreachRatePct: number;
    zones: LaboratoryZoneTopology[];
    activeIncidentsCount: number;
    provenance: DataProvenance;
}

export interface ModelGovernanceProfile {
    modelId: string;
    modelName: string;
    version: string;
    purpose: string;
    algorithm: string;
    trainingWindow: string;
    evaluationMetrics: {
        r2Score?: number;
        meanAbsoluteErrorMinutes?: number;
        coverage95Pct?: number;
        inferenceLatencyMicroseconds: number;
    };
    sha256Checksum: string;
    status: 'DEVELOPMENT' | 'VALIDATED_CANDIDATE' | 'DEPLOYED_PRODUCTION' | 'RETIRED';
    trainedBy: string;
    approvedBy?: string;
    approvedAt?: string;
    driftIndicatorPct: number;
    rollbackTargetVersion?: string;
    provenance: DataProvenance;
}

export interface NexusCommandCenterOverview {
    snapshotTimestamp: string;
    provenance: DataProvenance;
    worldModel: LaboratoryWorldModelSnapshot;
    operationalKpis: {
        totalSamplesToday: NexusMetric<number>;
        samplesAwaitingProcessing: NexusMetric<number>;
        medianTurnaroundTimeMinutes: NexusMetric<number>;
        percentile90TurnaroundTimeMinutes: NexusMetric<number>;
        slaBreachCount: NexusMetric<number>;
        slaBreachRatePct: NexusMetric<number>;
        activeAnalyzersCount: NexusMetric<number>;
        fleetAvailabilityPct: NexusMetric<number>;
        activeQcHoldsCount: NexusMetric<number>;
        reagentsAtStockoutRiskCount: NexusMetric<number>;
        activeInvestigationsCount: NexusMetric<number>;
        controlledAutonomyProposalsCount: NexusMetric<number>;
    };
    departmentQueues: QueueProcessAnalytics[];
    inventoryAlerts: ReagentInventoryAdvisory[];
    qualityAlerts: QualityControlIntelligence[];
    activeInvestigations: RootCauseInvestigation[];
    pendingProposals: ControlledAutonomyProposal[];
    registeredModels: ModelGovernanceProfile[];
    liveSpecimenCarriers?: LiveSpecimenCarrier[];
    enterpriseFleetTelemetry?: EnterpriseAnalyzerTelemetry[];
    hilInterferenceAlerts?: HilInterferenceAssessment[];
    deltaCheckAlerts?: DeltaCheckAlert[];
}

export interface CusumQualityControlResult {
    positiveCusum: number[];
    negativeCusum: number[];
    decisionIntervalH: number;
    slackParameterK: number;
    driftDetected: boolean;
    driftShiftRunIndex?: number;
    driftDirection?: 'UPWARD_SYSTEMATIC' | 'DOWNWARD_SYSTEMATIC' | 'NONE';
}

export interface HilInterferenceAssessment {
    id: string;
    sampleBarcode: string;
    patientUhid: string;
    analyteCode: string;
    analyteName: string;
    hemolysisMgDl: number;
    icterusMgDl: number;
    lipemiaTurbidityUnits: number;
    hemolysisThreshold: number;
    icterusThreshold: number;
    lipemiaThreshold: number;
    isInterfered: boolean;
    interferingFactor?: 'HEMOLYSIS' | 'ICTERUS' | 'LIPEMIA';
    clinicalAction: 'REJECT_COLD_REDRAW' | 'DILUTE_AND_RERUN' | 'RELEASE_WITH_CAUTION_NOTE' | 'CLEAR_VALID';
    warningNote?: string;
    timestamp: string;
}

export interface DeltaCheckAlert {
    id: string;
    sampleBarcode: string;
    patientUhid: string;
    patientNameMasked: string;
    analyteCode: string;
    analyteName: string;
    currentValue: number;
    previousValue: number;
    unit: string;
    deltaAbs: number;
    deltaPct: number;
    elapsedHours: number;
    velocityPerHour: number;
    thresholdDeltaPct: number;
    isCriticalAlert: boolean;
    clinicalInterpretation: string;
    timestamp: string;
}

export interface LiveSpecimenCarrier {
    carrierId: string;
    barcode: string;
    patientUhid: string;
    tubeColor: 'LAVENDER_EDTA' | 'LIGHT_BLUE_CITRATE' | 'GOLD_SST' | 'GREEN_HEPARIN' | 'GREY_FLUORIDE';
    tubeLabel: string;
    tests: string[];
    department: string;
    priority: 'STAT_EMERGENCY' | 'URGENT' | 'ROUTINE';
    currentZoneId: string;
    currentZoneName: string;
    elapsedMinutes: number;
    maxStabilityMinutes: number;
    stabilityRemainingPct: number;
    estimatedCompletionMinutes: number;
    carrierPosition: { x: number; y: number; progressPct: number };
    status: 'ACCESSIONED' | 'IN_CENTRIFUGE' | 'ON_TRACK' | 'ASPIRATING' | 'COMPLETED';
}

export interface EnterpriseAnalyzerTelemetry {
    analyzerId: string;
    name: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    department: string;
    status: 'ONLINE' | 'DEGRADED_QC_WARNING' | 'LOCKED_WESTGARD_VIOLATION' | 'MAINTENANCE_OFFLINE';
    throughputNominalPerHour: number;
    currentThroughputRealtime: number;
    currentQueueDepth: number;
    reagentPacks: {
        name: string;
        lot: string;
        testsRemaining: number;
        lowThreshold: number;
        expiry: string;
    }[];
    carouselRacksInProcess: number;
    opticalLampHours: number;
    vacuumPressureKpa: number;
    chamberTemperatureCelsius: number;
    failureHazardRateH: number;
    rulHours: number;
    lastCalibrationTime: string;
    lastQcStatus: string;
}

