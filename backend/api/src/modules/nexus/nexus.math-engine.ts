/**
 * LABCORE OMNISCIENT NEXUS — MATHEMATICAL INTELLIGENCE ENGINE
 * 
 * Numerically stable, typed mathematical computation layer for:
 * 1. Descriptive & Robust Statistics (Mean, Median, Variance, Quantiles, IQR, MAD, Skewness, Outliers)
 * 2. Statistical Inference (Confidence Intervals, Standard Error)
 * 3. Process & Queueing Analytics (Little's Law, Erlang-C wait probability, Traffic Intensity)
 * 4. Equipment Reliability (Weibull hazard rate, survival probability, RUL)
 * 5. Pre-Analytical Bio-Stability (Arrhenius kinetic thermal acceleration)
 */

import { CusumQualityControlResult, DataProvenance, DescriptiveStatisticsResult, QueueProcessAnalytics } from './nexus.types';

export class NexusMathEngine {
    // =========================================================================
    // 1. DESCRIPTIVE & ROBUST STATISTICS
    // =========================================================================

    /**
     * Computes comprehensive descriptive and robust statistics on a numerical series.
     * Handles empty, single-element, and degenerate arrays gracefully without NaN/Infinity.
     */
    public static computeDescriptiveStatistics(
        values: number[],
        provenance: DataProvenance = 'LIVE'
    ): DescriptiveStatisticsResult {
        // Filter out null, undefined, NaN, and Infinite values
        const cleanValues = (values || [])
            .filter((v) => typeof v === 'number' && Number.isFinite(v))
            .sort((a, b) => a - b);

        const n = cleanValues.length;

        if (n === 0) {
            return {
                sampleSize: 0,
                mean: 0,
                median: 0,
                variance: 0,
                stdDev: 0,
                min: 0,
                max: 0,
                p10: 0,
                p25: 0,
                p50: 0,
                p75: 0,
                p90: 0,
                p95: 0,
                p99: 0,
                iqr: 0,
                mad: 0,
                skewness: 0,
                outliersCount: 0,
                confidenceInterval95: [0, 0],
                hasSufficientData: false,
                provenance,
            };
        }

        const sum = cleanValues.reduce((acc, v) => acc + v, 0);
        const mean = sum / n;
        const min = cleanValues[0];
        const max = cleanValues[n - 1];

        // Variance & Standard Deviation (Sample variance: n - 1 for n > 1)
        const squaredDiffsSum = cleanValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
        const variance = n > 1 ? squaredDiffsSum / (n - 1) : 0;
        const stdDev = Math.sqrt(variance);

        // Quantiles via Linear Interpolation
        const p10 = this.computeQuantile(cleanValues, 0.10);
        const p25 = this.computeQuantile(cleanValues, 0.25);
        const p50 = this.computeQuantile(cleanValues, 0.50);
        const p75 = this.computeQuantile(cleanValues, 0.75);
        const p90 = this.computeQuantile(cleanValues, 0.90);
        const p95 = this.computeQuantile(cleanValues, 0.95);
        const p99 = this.computeQuantile(cleanValues, 0.99);

        const iqr = Math.max(0, p75 - p25);

        // Robust Scale: Median Absolute Deviation (MAD)
        // MAD = median(|x_i - median(x)|)
        const absoluteDeviations = cleanValues
            .map((v) => Math.abs(v - p50))
            .sort((a, b) => a - b);
        const mad = this.computeQuantile(absoluteDeviations, 0.50);

        // Skewness: Fisher-Pearson coefficient of skewness
        let skewness = 0;
        if (n >= 3 && stdDev > 1e-9) {
            const m3 = cleanValues.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / n;
            skewness = m3 / Math.pow(stdDev, 3);
        }

        // Outlier Diagnostics via Tukey's Fences (1.5 * IQR)
        const lowerFence = p25 - 1.5 * iqr;
        const upperFence = p75 + 1.5 * iqr;
        const outliersCount = cleanValues.filter((v) => v < lowerFence || v > upperFence).length;

        // 95% Confidence Interval for the Mean (t-distribution critical value approximation)
        const criticalT = n < 30 ? 2.042 : 1.960;
        const standardError = stdDev / Math.sqrt(n);
        const ciLower = mean - criticalT * standardError;
        const ciUpper = mean + criticalT * standardError;

        return {
            sampleSize: n,
            mean: Number(mean.toFixed(2)),
            median: Number(p50.toFixed(2)),
            variance: Number(variance.toFixed(2)),
            stdDev: Number(stdDev.toFixed(2)),
            min: Number(min.toFixed(2)),
            max: Number(max.toFixed(2)),
            p10: Number(p10.toFixed(2)),
            p25: Number(p25.toFixed(2)),
            p50: Number(p50.toFixed(2)),
            p75: Number(p75.toFixed(2)),
            p90: Number(p90.toFixed(2)),
            p95: Number(p95.toFixed(2)),
            p99: Number(p99.toFixed(2)),
            iqr: Number(iqr.toFixed(2)),
            mad: Number(mad.toFixed(2)),
            skewness: Number(skewness.toFixed(3)),
            outliersCount,
            confidenceInterval95: [Number(ciLower.toFixed(2)), Number(ciUpper.toFixed(2))],
            hasSufficientData: n >= 10,
            provenance,
        };
    }

    /**
     * Quantile computation using linear interpolation between closest ranks.
     */
    public static computeQuantile(sortedValues: number[], p: number): number {
        if (!sortedValues || sortedValues.length === 0) return 0;
        if (sortedValues.length === 1 || p <= 0) return sortedValues[0];
        if (p >= 1) return sortedValues[sortedValues.length - 1];

        const index = p * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;

        if (lower === upper) return sortedValues[lower];
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }

    // =========================================================================
    // 2. PROCESS & QUEUEING ANALYTICS (M/M/c & LITTLE'S LAW)
    // =========================================================================

    /**
     * Erlang C formula for multi-server M/M/c queueing systems:
     * Probability that an arriving specimen must wait in queue:
     *
     *   C(c, a) = ( (a^c / c!) * (c / (c - a)) ) /
     *             ( sum_{k=0}^{c-1} (a^k / k!) + (a^c / c!) * (c / (c - a)) )
     *
     * where:
     *   c = number of parallel channels/analyzers
     *   lambda = arrival rate (specimens/hr)
     *   mu = service rate per channel (specimens/hr)
     *   a = lambda / mu (offered load in Erlangs)
     *   rho = a / c (traffic intensity / utilization)
     */
    public static computeErlangCWaitProbability(
        c: number,
        lambdaPerHour: number,
        muPerHour: number
    ): number {
        if (c <= 0 || muPerHour <= 0 || lambdaPerHour <= 0) return 0;

        const a = lambdaPerHour / muPerHour;
        const rho = a / c;

        // System saturation boundary: if rho >= 1, queue grows without bound
        if (rho >= 0.999) return 1.0;

        // Numerically stable sum of series term by term
        let termK = 1.0;
        let sumTerms = 1.0;

        for (let k = 1; k < c; k++) {
            termK = (termK * a) / k;
            sumTerms += termK;
        }

        // termC = a^c / c!
        const termC = (termK * a) / c;
        const numerator = termC * (c / (c - a));
        const denominator = sumTerms + numerator;

        if (denominator <= 0 || !Number.isFinite(denominator)) return 1.0;

        const pWait = numerator / denominator;
        return Math.max(0, Math.min(1.0, pWait));
    }

    /**
     * Computes full queueing characteristics using Erlang C and Little's Law (L = lambda * W).
     */
    public static evaluateQueueProcess(
        department: string,
        channels: number,
        arrivalRateLambda: number,
        serviceRateMuPerChannel: number,
        slaTargetMinutes: number,
        provenance: DataProvenance = 'LIVE'
    ): QueueProcessAnalytics {
        const c = Math.max(1, Math.round(channels));
        const lambda = Math.max(0.1, arrivalRateLambda);
        const mu = Math.max(0.1, serviceRateMuPerChannel);

        const a = lambda / mu;
        const rho = a / c;

        const erlangC = this.computeErlangCWaitProbability(c, lambda, mu);

        let meanWaitHours = 0;
        let queueLengthLq = 0;

        if (rho < 0.98) {
            // Mean queue wait time W_q = C(c, a) / (c * mu - lambda)
            meanWaitHours = erlangC / Math.max(0.01, c * mu - lambda);
            // Little's Law for queue: L_q = lambda * W_q
            queueLengthLq = lambda * meanWaitHours;
        } else {
            // Saturated backlog approximation
            queueLengthLq = Math.max(5, (lambda - c * mu * 0.95) * 4);
            meanWaitHours = queueLengthLq / (c * mu);
        }

        const serviceTimeHours = 1.0 / mu;
        const totalTatHours = meanWaitHours + serviceTimeHours;

        const meanWaitMinutes = meanWaitHours * 60;
        const meanTotalTatMinutes = totalTatHours * 60;

        // Little's Law total system WIP: L = lambda * W
        const workInProgressL = lambda * totalTatHours;

        // Predicted SLA breach rate via exponential distribution assumption for tail wait
        let predictedSlaBreachRatePct = 0;
        if (slaTargetMinutes > 0) {
            const targetHours = slaTargetMinutes / 60;
            if (totalTatHours > targetHours) {
                const excessRatio = (totalTatHours - targetHours) / targetHours;
                predictedSlaBreachRatePct = Math.min(99.9, erlangC * 100 * (1 + excessRatio));
            } else {
                const margin = targetHours - serviceTimeHours;
                if (margin > 0 && c * mu > lambda) {
                    predictedSlaBreachRatePct = Math.min(
                        100,
                        Math.max(0.1, erlangC * Math.exp(-(c * mu - lambda) * margin) * 100)
                    );
                } else {
                    predictedSlaBreachRatePct = erlangC * 50;
                }
            }
        }

        let severity: QueueProcessAnalytics['bottleneckSeverity'] = 'OPTIMAL';
        if (rho >= 0.92 || predictedSlaBreachRatePct > 25) {
            severity = 'CRITICAL_SATURATION';
        } else if (rho >= 0.80 || predictedSlaBreachRatePct > 12) {
            severity = 'HIGH_CONGESTION';
        } else if (rho >= 0.65) {
            severity = 'MODERATE_LOAD';
        }

        return {
            department,
            activeChannels: c,
            arrivalRateLambdaPerHour: Number(lambda.toFixed(1)),
            serviceRateMuPerHour: Number(mu.toFixed(1)),
            trafficIntensityRho: Number(rho.toFixed(3)),
            workInProgressL: Number(workInProgressL.toFixed(1)),
            queueLengthLq: Number(queueLengthLq.toFixed(1)),
            erlangCWaitProbability: Number(erlangC.toFixed(4)),
            meanWaitTimeWqMinutes: Number(meanWaitMinutes.toFixed(1)),
            meanTotalTatWMinutes: Number(meanTotalTatMinutes.toFixed(1)),
            slaTargetMinutes,
            predictedSlaBreachRatePct: Number(predictedSlaBreachRatePct.toFixed(1)),
            bottleneckSeverity: severity,
            provenance,
        };
    }

    // =========================================================================
    // 3. WEIBULL FLEET RELIABILITY & REMAINING USEFUL LIFE (RUL)
    // =========================================================================

    /**
     * Weibull 2-parameter reliability distribution:
     *   R(t) = exp(-(t / eta)^beta)
     *   Instantaneous hazard rate h(t) = (beta / eta) * (t / eta)^(beta - 1)
     *
     * where:
     *   t = cumulative operating hours since overhaul
     *   eta = characteristic life scale parameter (hours)
     *   beta = shape parameter (beta > 1 indicates mechanical/optical wear-out regime)
     */
    public static computeWeibullReliability(
        operatingHoursT: number,
        etaScaleHours: number,
        betaShape: number
    ): {
        survivalProbabilityPct: number;
        instantaneousHazardRateHPerHour: number;
        probabilityOfFailureNext24hPct: number;
        predictedRulHours: number;
    } {
        const t = Math.max(0.1, operatingHoursT);
        const eta = Math.max(10, etaScaleHours);
        const beta = Math.max(0.5, betaShape);

        // Survival probability R(t)
        const ratio = t / eta;
        const exponent = Math.pow(ratio, beta);
        const survivalProbability = Math.exp(-exponent);
        const survivalProbabilityPct = Math.max(0.01, Math.min(100, survivalProbability * 100));

        // Hazard rate h(t) = (beta / eta) * (t / eta)^(beta - 1)
        const hazardRate = (beta / eta) * Math.pow(ratio, beta - 1);

        // Probability of failure over next 24 operating hours:
        // P(failure in (t, t + 24] | survived to t) = 1 - R(t + 24) / R(t)
        const t24 = t + 24;
        const exponent24 = Math.pow(t24 / eta, beta);
        const survivalProbability24 = Math.exp(-exponent24);
        const conditionalSurvival = survivalProbability > 1e-12 ? survivalProbability24 / survivalProbability : 0;
        const probFail24hPct = Math.min(99.9, Math.max(0.1, (1 - conditionalSurvival) * 100));

        // Mean Remaining Useful Life (RUL) estimate before hazard exceeds critical threshold (e.g. h(t) >= 0.02)
        // If R(t) > 0.5, RUL can be approximated by eta * Gamma(1 + 1/beta) - t
        const gammaApprox = 0.8862; // Gamma(1 + 1/2) for beta ~ 2
        const meanTimeToFailure = eta * gammaApprox;
        const predictedRulHours = Math.max(0, meanTimeToFailure - t);

        return {
            survivalProbabilityPct: Number(survivalProbabilityPct.toFixed(2)),
            instantaneousHazardRateHPerHour: Number(hazardRate.toFixed(6)),
            probabilityOfFailureNext24hPct: Number(probFail24hPct.toFixed(2)),
            predictedRulHours: Number(predictedRulHours.toFixed(1)),
        };
    }

    // =========================================================================
    // 4. ARRHENIUS PRE-ANALYTICAL THERMAL DEGRADATION KINETICS
    // =========================================================================

    /**
     * Arrhenius equation for temperature-accelerated analyte degradation:
     *   k(T) = k_ref * exp( (E_a / R) * (1 / T_ref - 1 / T_kelvin) )
     *
     * where:
     *   T_ref = 295.15 K (22°C reference)
     *   T_kelvin = ambient/transport temperature in Kelvin
     *   E_a / R = empirical activation energy parameter (Kelvin)
     */
    public static computeArrheniusRateConstant(
        kRefPerHour: number,
        activationEnergyOverR: number,
        tempCelsius: number
    ): number {
        const T_REF_KELVIN = 295.15;
        const tKelvin = Math.max(273.15, tempCelsius + 273.15);
        const exponent = activationEnergyOverR * (1.0 / T_REF_KELVIN - 1.0 / tKelvin);
        return kRefPerHour * Math.exp(exponent);
    }
}
