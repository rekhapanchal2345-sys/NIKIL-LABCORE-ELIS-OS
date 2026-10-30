/**
 * LABCORE AETHER-GENOMICS™ v7.0.0-SOVEREIGN
 * Sub-Engine 6: Serial ctDNA Liquid Biopsy Minimal Residual Disease (MRD) & Relapse Lead-Time Predictor
 * 
 * Biophysical Mathematics:
 * - Duplex UMI Poisson-Binomial Error Suppression (P < 0.001 threshold)
 * - Gompertzian Tumor Proliferation Differential Equation:
 *   dV/dt = alpha * V * ln(K / V) => V(t) = K * (V_0 / K)^(exp(-alpha * t))
 * - Longitudinal Doubling Time T_d = ln(2) / k_growth (Days)
 * - Extrapolated Radiological Relapse (V >= 10^9 cells / 1 cm^3 CT detection threshold)
 */

import {
    CtdnaMrdKineticsInput,
    CtdnaMrdKineticsResult,
    GompertzianTrajectoryPoint
} from '../types/aether-genomics.types';

export class CtdnaMrdKineticsEngine {

    /**
     * Duplex UMI Poisson error suppression cumulative p-value
     */
    public static computePoissonBinomialPval(depth: number, mutantReads: number, p0: number = 1e-4): number {
        if (mutantReads <= 0) return 1.0;
        const lambda = depth * p0;

        // Cumulative Poisson P(X >= k) = 1 - sum_{j=0}^{k-1} (lambda^j * e^(-lambda) / j!)
        let sum = 0.0;
        let term = Math.exp(-lambda);

        for (let j = 0; j < mutantReads; j++) {
            sum += term;
            term *= lambda / (j + 1);
        }

        const pval = Math.max(1e-12, 1.0 - sum);
        return Math.round(pval * 1e8) / 1e8;
    }

    /**
     * Evaluate Serial ctDNA Kinetics, MRD Status, and Gompertzian Relapse Horizon
     */
    public static evaluateMrdKinetics(input: CtdnaMrdKineticsInput): CtdnaMrdKineticsResult {
        const timepoints = [...input.timepoints].sort((a, b) => a.daysSinceSurgery - b.daysSinceSurgery);
        const p0 = input.backgroundErrorRate || 1e-4;

        const latestTimepoint = timepoints[timepoints.length - 1];
        const latestDepth = latestTimepoint.duplexSequencingDepth;
        const latestMutants = latestTimepoint.mutantDuplexReadCount;

        // Statistical significance of latest ctDNA call
        const pVal = this.computePoissonBinomialPval(latestDepth, latestMutants, p0);

        let mrdStatus: 'MRD_POSITIVE_RELAPSE_RISK' | 'MRD_NEGATIVE_MOLECULAR_REMISSION' | 'INDETERMINATE_LOW_DEPTH' = 'MRD_NEGATIVE_MOLECULAR_REMISSION';
        if (latestDepth < 10000) {
            mrdStatus = 'INDETERMINATE_LOW_DEPTH';
        } else if (pVal < 0.001 && latestMutants >= 3) {
            mrdStatus = 'MRD_POSITIVE_RELAPSE_RISK';
        }

        // Longitudinal Growth Rate Estimation
        let kGrowth = 0.015; // default daily exponential growth
        let doublingTimeDays = 45.0;

        if (timepoints.length >= 2 && mrdStatus === 'MRD_POSITIVE_RELAPSE_RISK') {
            const first = timepoints[0];
            const last = timepoints[timepoints.length - 1];
            const deltaDays = Math.max(1, last.daysSinceSurgery - first.daysSinceSurgery);

            const concFirst = Math.max(0.5, first.mutantDuplexReadCount / Math.max(1.0, first.plasmaVolumeMl));
            const concLast = Math.max(0.5, last.mutantDuplexReadCount / Math.max(1.0, last.plasmaVolumeMl));

            if (concLast > concFirst) {
                kGrowth = Math.log(concLast / concFirst) / deltaDays;
                doublingTimeDays = Math.max(10.0, Math.round((Math.log(2) / kGrowth) * 10) / 10);
            }
        }

        // Gompertzian Kinetics & Extrapolation
        // 1 mutant copy / mL plasma correlates to approx ~1.5 x 10^5 viable tumor cells
        const copiesPerMl = latestMutants / Math.max(1.0, latestTimepoint.plasmaVolumeMl);
        const initialTumorCells = Math.max(1000, Math.round(copiesPerMl * 1.5e5));
        const carryingCapacityK = 1e12; // 10^12 cells = ~1 kg lethal limit
        const radiologicalThresholdCells = 1e9; // 10^9 cells = 1 cm^3 clinical CT detection limit
        const alpha = Math.max(0.001, kGrowth * 0.12);

        // Project Gompertzian trajectory forward over 360 days from latest timepoint
        const trajectory: GompertzianTrajectoryPoint[] = [];
        let daysToRadiologicalRelapse = 730; // default 2 years if not reached

        for (let dayOffset = 0; dayOffset <= 360; dayOffset += 15) {
            const absDay = latestTimepoint.daysSinceSurgery + dayOffset;
            const t = dayOffset;

            // Analytical Gompertzian solution: V(t) = K * (V0 / K)^(exp(-alpha * t))
            const exponent = Math.exp(-alpha * t);
            const currentCells = Math.min(carryingCapacityK, carryingCapacityK * Math.pow(initialTumorCells / carryingCapacityK, exponent));
            const projectedCopies = Math.round((currentCells / 1.5e5) * 10) / 10;
            const isAboveRadio = currentCells >= radiologicalThresholdCells;

            if (isAboveRadio && daysToRadiologicalRelapse === 730) {
                daysToRadiologicalRelapse = absDay;
            }

            trajectory.push({
                day: absDay,
                projectedCtdnaCopiesPerMl: projectedCopies,
                projectedTumorCellCount: Math.round(currentCells),
                isAboveRadiologicalThreshold: isAboveRadio
            });
        }

        const leadTimeDays = Math.max(0, daysToRadiologicalRelapse - latestTimepoint.daysSinceSurgery);
        const projectedDate = new Date();
        projectedDate.setDate(projectedDate.getDate() + leadTimeDays);

        let oncologyAction = 'Surgical and molecular remission maintained. Continue standard ctDNA surveillance at 3-month intervals.';
        if (mrdStatus === 'MRD_POSITIVE_RELAPSE_RISK') {
            oncologyAction = `CRITICAL ONCOLOGY ALERT: True circulating tumor DNA detected (p=${pVal}). Patient has MRD-Positive minimal residual disease with projected radiological relapse in ${leadTimeDays} days (~${Math.round(leadTimeDays / 30)} months). Initiate preemptive adjuvant targeted / immunotherapy prior to macroscopic recurrence.`;
        } else if (mrdStatus === 'INDETERMINATE_LOW_DEPTH') {
            oncologyAction = 'Sequencing depth insufficient for definitive MRD exclusion (<10,000x). Repeat blood draw recommended.';
        }

        return {
            patientId: input.patientId,
            currentMrdStatus: mrdStatus,
            pValPoissonBinomialSuppression: pVal,
            instantaneousGrowthRatePerDay: Math.round(kGrowth * 1000) / 1000,
            tumorDoublingTimeDays: doublingTimeDays,
            predictedRadiologicalRelapseDays: daysToRadiologicalRelapse,
            clinicalLeadTimeAdvantageDays: leadTimeDays,
            projectedRelapseDateIso: projectedDate.toISOString(),
            gompertzianKinetics: {
                initialTumorCells,
                asymptoticCarryingCapacityCells: carryingCapacityK,
                growthDecelerationAlpha: Math.round(alpha * 10000) / 10000,
                radiologicalDetectionCellThreshold: radiologicalThresholdCells,
                trajectoryProjectedDays: trajectory
            },
            clinicalOncologyAction: oncologyAction
        };
    }
}
