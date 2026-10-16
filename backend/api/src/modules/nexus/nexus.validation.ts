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
