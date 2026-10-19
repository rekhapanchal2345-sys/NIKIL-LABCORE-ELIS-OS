/**
 * LABCORE OMNISCIENT NEXUS — REQUEST VALIDATION SCHEMAS
 * 
 * Zod validation contracts for all Nexus operations.
 */

import { z } from 'zod';

export const AutonomyReviewSchema = z.object({
    decision: z.enum(['APPROVED_EXECUTED', 'REJECTED']),
    reviewNotes: z.string().trim().min(3).max(1000).optional(),
});

export const ComputeDescriptiveStatsSchema = z.object({
    values: z.array(z.number()).min(1).max(50000),
    provenance: z.enum([
        'LIVE',
        'HISTORICAL',
        'PREDICTED',
        'SIMULATED',
        'SYNTHETIC',
        'HYPOTHETICAL',
        'CONFIRMED',
    ]).optional(),
});

export const QueueProcessParamsSchema = z.object({
    department: z.string().trim().min(1).max(100),
    channels: z.number().int().min(1).max(50),
    arrivalRateLambdaPerHour: z.number().positive().max(10000),
    serviceRateMuPerHour: z.number().positive().max(10000),
    slaTargetMinutes: z.number().positive().max(10000),
    provenance: z.enum([
        'LIVE',
        'HISTORICAL',
        'PREDICTED',
        'SIMULATED',
        'SYNTHETIC',
        'HYPOTHETICAL',
        'CONFIRMED',
    ]).optional(),
});

export const WeibullReliabilityParamsSchema = z.object({
    operatingHoursT: z.number().min(0).max(100000),
    etaScaleHours: z.number().positive().max(200000),
    betaShape: z.number().positive().max(20),
});

export const SixSigmaParamsSchema = z.object({
    allowableTotalErrorTeaPct: z.number().positive().max(100),
    biasPercentage: z.number().min(-100).max(100),
    coefficientOfVariationCvPct: z.number().positive().max(100),
});

export const KalmanDriftParamsSchema = z.object({
    measurements: z.array(z.number()).min(1).max(10000),
    initialTargetMean: z.number(),
    processNoiseQ: z.number().positive().optional(),
    measurementNoiseR: z.number().positive().optional(),
});

export const EnzymeKineticsParamsSchema = z.object({
    substrateConcentrationMmolL: z.number().positive(),
    vMaxUnitsPerMin: z.number().positive(),
    kmMmolL: z.number().positive(),
    absorbanceDeltaPerMin: z.number().min(0),
});

export const ErlangBLossParamsSchema = z.object({
    channelsC: z.number().int().min(1).max(100),
    arrivalRateLambdaPerHour: z.number().positive().max(10000),
    serviceRateMuPerHour: z.number().positive().max(10000),
});

export const KdigoAkiParamsSchema = z.object({
    currentCreatinineMgDl: z.number().positive().max(30),
    baselineCreatinineMgDl: z.number().positive().max(30),
    patientAgeYears: z.number().min(1).max(120),
    patientSex: z.enum(['FEMALE', 'MALE']),
    urineOutputMlKgHrOver6h: z.number().min(0).optional(),
});

export const ArrheniusTtiParamsSchema = z.object({
    segments: z.array(z.object({
        tempCelsius: z.number().min(-50).max(100),
        durationHours: z.number().min(0).max(1000),
    })).min(1),
    kRefPerHour: z.number().positive(),
    activationEnergyOverR: z.number().positive(),
});

export const CusumParamsSchema = z.object({
    values: z.array(z.number()).min(1).max(10000),
    targetMean: z.number(),
    targetSd: z.number().positive(),
    kSlack: z.number().positive().optional(),
    hDecision: z.number().positive().optional(),
});

export const HilInterferenceParamsSchema = z.object({
    hemolysisMgDl: z.number().min(0),
    icterusMgDl: z.number().min(0),
    lipemiaTurbidity: z.number().min(0),
    analyteCode: z.string().trim().min(1),
});

export const DeltaCheckParamsSchema = z.object({
    currentVal: z.number(),
    previousVal: z.number(),
    elapsedHours: z.number().positive(),
    analyteCode: z.string().trim().min(1),
});

