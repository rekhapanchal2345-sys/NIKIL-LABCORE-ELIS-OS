import { z } from 'zod';

export const LabDepartmentEnum = z.enum([
    'HEMATOLOGY',
    'BIOCHEMISTRY',
    'IMMUNOASSAY',
    'COAGULATION',
    'MICROBIOLOGY',
]);

export const AnalyzerStatusEnum = z.enum([
    'ONLINE',
    'DEGRADED_QC_WARNING',
    'LOCKED_WESTGARD_VIOLATION',
    'REAGENT_DEPLETED',
    'MAINTENANCE_OFFLINE',
]);

export const SpecimenPriorityEnum = z.enum([
    'STAT_CRITICAL',
    'BIO_STABILITY_RISK',
    'URGENT',
    'ROUTINE',
]);

export const AnalyzerOverrideSchema = z.object({
    analyzerId: z.string().min(1).max(64),
    status: AnalyzerStatusEnum.optional(),
    nominalThroughputPerHour: z.number().min(1).max(5000).optional(),
    currentQueueDepth: z.number().int().min(0).max(10000).optional(),
    reagentRemainingTests: z.number().int().min(0).max(100000).optional(),
    calibrationBiasPct: z.number().min(-50).max(50).optional(),
});

export const CustomSpecimenSchema = z.object({
    sampleId: z.string().min(1).max(64),
    barcode: z.string().min(3).max(64),
    orderId: z.string().min(1).max(64),
    department: LabDepartmentEnum,
    targetAnalyzerId: z.string().min(1).max(64),
    analyteCode: z.string().min(1).max(32),
    priority: SpecimenPriorityEnum,
    collectedAtIso: z.string().datetime({ offset: true }).or(z.string().min(10)),
    storageTempCelsius: z.number().min(-80).max(50),
    isCentrifuged: z.boolean(),
    slaTargetMinutes: z.number().int().min(5).max(1440),
});

export const SimulationRunInputSchema = z.object({
    scenarioName: z.string().trim().min(2).max(120).optional(),
    horizonHours: z.number().int().min(1).max(72).default(8),
    surgeMultiplier: z.number().min(0.1).max(10.0).default(1.0),
    statRatio: z.number().min(0).max(1.0).default(0.18),
    ambientTempCelsius: z.number().min(2).max(45).default(23.0),
    iterations: z.number().int().min(10).max(2000).default(250),
    seed: z.number().int().min(1).max(2147483647).default(20261015),
    forcedOfflineAnalyzerIds: z.array(z.string().min(1).max(64)).max(25).optional(),
    analyzerOverrides: z.array(AnalyzerOverrideSchema).max(50).optional(),
    customSpecimens: z.array(CustomSpecimenSchema).max(500).optional(),
    idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const FailoverOptimizationInputSchema = z.object({
    faultedAnalyzerId: z.string().trim().min(1, 'faultedAnalyzerId is required').max(64),
    faultReason: z
        .string()
        .trim()
        .min(5, 'faultReason must be at least 5 characters')
        .max(500),
    additionalPendingSpecimens: z.number().int().min(0).max(5000).default(0),
    surgeMultiplier: z.number().min(0.5).max(5.0).default(1.0),
    idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const FailoverDecisionInputSchema = z.object({
    decision: z.enum(['APPROVE', 'REJECT']),
    reviewNotes: z
        .string()
        .trim()
        .min(5, 'Clinical review notes must be at least 5 characters')
        .max(1000),
});

export const SpecimenStabilityCheckInputSchema = z.object({
    ambientTempCelsius: z.number().min(2).max(45).default(23.0),
    surgeMultiplier: z.number().min(0.2).max(5.0).default(1.0),
    specimens: z.array(CustomSpecimenSchema).min(1).max(500).optional(),
});

export const TrainSurrogateModelInputSchema = z.object({
    modelName: z.string().trim().min(3).max(64).default('NeuralSurrogate-TAT-v1'),
    epochs: z.number().int().min(5).max(500).default(50),
    learningRate: z.number().min(0.0001).max(1.0).default(0.015),
    batchSize: z.number().int().min(4).max(128).default(16),
    hiddenLayerNeurons: z.number().int().min(8).max(256).default(32),
    regularizationL2: z.number().min(0).max(0.1).default(0.0005),
    seed: z.number().int().min(1).max(2147483647).default(20261015),
});

export const TrainQLearningInputSchema = z.object({
    modelName: z.string().trim().min(3).max(64).default('QLearning-DispatchPolicy-v1'),
    episodes: z.number().int().min(20).max(2000).default(200),
    alpha: z.number().min(0.01).max(0.9).default(0.12),
    gamma: z.number().min(0.5).max(0.99).default(0.95),
    seed: z.number().int().min(1).max(2147483647).default(42),
});

export const SurrogatePredictInputSchema = z.object({
    ambientTempCelsius: z.number().min(2).max(45).default(23.0),
    surgeMultiplier: z.number().min(0.1).max(10.0).default(1.0),
    statRatio: z.number().min(0).max(1.0).default(0.18),
    horizonHours: z.number().int().min(1).max(72).default(8),
    activeAnalyzersCount: z.number().int().min(1).max(50).default(8),
    totalCurrentQueue: z.number().int().min(0).max(2000).default(120),
    lockedAnalyzersCount: z.number().int().min(0).max(20).default(0),
});

export const ParetoOptimizationInputSchema = z.object({
    totalSpecimens: z.number().int().min(10).max(5000).default(320),
    ambientTempCelsius: z.number().min(2).max(45).default(23.0),
    statRatio: z.number().min(0).max(1.0).default(0.2),
});

export const LiveSpecimenEscalationSchema = z.object({
    sampleId: z.string().trim().min(1, 'sampleId is required'),
    clinicalReason: z.string().trim().min(3, 'clinicalReason must be at least 3 characters').max(500),
    targetAnalyzerId: z.string().trim().optional(),
});

export const LiveSpecimenRecollectionSchema = z.object({
    sampleId: z.string().trim().min(1, 'sampleId is required'),
    rejectionReason: z.string().trim().min(3, 'rejectionReason must be at least 3 characters').max(500),
    notifyWard: z.boolean().default(true),
});

export const LiveWardNotificationSchema = z.object({
    sampleId: z.string().trim().min(1, 'sampleId is required'),
    wardDepartment: z.string().trim().min(2).max(100).default('INPATIENT_WARD'),
    notificationUrgency: z.enum(['INFO', 'URGENT', 'CRITICAL_ACTION_REQUIRED']).default('URGENT'),
    message: z.string().trim().min(5, 'Message must be at least 5 characters').max(1000),
});

export const LiveMaintenanceWindowSchema = z.object({
    analyzerId: z.string().trim().min(1, 'analyzerId is required'),
    maintenanceType: z.string().trim().min(2).default('PREVENTIVE'),
    scheduledDateIso: z.string().datetime({ offset: true }).or(z.string().min(10)),
    description: z.string().trim().min(5, 'description must be at least 5 characters').max(1000),
    technicianName: z.string().trim().optional(),
    estimatedDowntimeHours: z.number().min(0.5).max(72).default(2.0),
});

export const LiveAnalyzerLockoutSchema = z.object({
    analyzerId: z.string().trim().min(1, 'analyzerId is required'),
    lockoutReason: z.string().trim().min(5, 'lockoutReason must be at least 5 characters').max(500),
    triggerFailoverProposal: z.boolean().default(true),
});

export const LiveSurgeModeSchema = z.object({
    surgeMultiplier: z.number().min(1.0).max(5.0).default(1.5),
    broadcastMessage: z.string().trim().min(5).max(1000),
    targetDepartments: z.array(z.string()).default(['HEMATOLOGY', 'BIOCHEMISTRY', 'IMMUNOASSAY']),
});

export const ApplyOperatingPolicySchema = z.object({
    policyId: z.string().trim().min(1),
    strategyProfile: z.enum(['MIN_TAT', 'BALANCED_CLINICAL', 'MIN_THERMAL_DRIFT', 'MIN_COST']),
    label: z.string().trim().min(3).max(120),
    description: z.string().trim().max(1000).optional(),
    expectedTatP90: z.number().min(1),
    expectedThermalDriftPct: z.number().min(0),
    expectedCostPerTest: z.number().min(0),
    crossAnalyzerBiasRisk: z.number().min(0),
    allocationRatios: z.record(z.string(), z.number()).default({}),
});

export const SaveScenarioSnapshotSchema = z.object({
    name: z.string().trim().min(2, 'Scenario name must be at least 2 characters').max(120),
    description: z.string().trim().max(1000).optional(),
    horizonHours: z.number().int().min(1).max(72).default(8),
    surgeMultiplier: z.number().min(0.1).max(10.0).default(1.0),
    statRatio: z.number().min(0).max(1.0).default(0.18),
    ambientTempCelsius: z.number().min(2).max(45).default(23.0),
    isBaseline: z.boolean().default(false),
});

export const LogCalibrationSchema = z.object({
    analyzerId: z.string().trim().min(1, 'analyzerId is required'),
    calibrationType: z.string().trim().default('FULL_CALIBRATION'),
    outcome: z.string().trim().default('PASSED_WITHIN_TOLERANCE'),
    result: z.string().trim().optional(),
    calibrationBiasPct: z.number().min(-25).max(25).default(0.4),
    reagentsUsed: z.string().trim().optional(),
    notes: z.string().trim().max(1000).optional(),
});
