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

    // =========================================================================
    // 5. CUSUM (CUMULATIVE SUM) STATISTICAL QUALITY CONTROL
    // =========================================================================

    /**
     * Two-sided tabular CUSUM algorithm for detecting small, persistent calibration shifts (0.5 - 1.5 sigma).
     * S_H[i] = max(0, S_H[i-1] + (Z_i - k))
     * S_L[i] = max(0, S_L[i-1] - (Z_i + k))
     * Shift flagged when S_H or S_L exceeds decision threshold h (typically h = 4.0 or 5.0).
     */
    public static computeCusumDrift(
        values: number[],
        targetMean: number,
        targetSd: number,
        kSlack: number = 0.5,
        hDecision: number = 4.5
    ): CusumQualityControlResult {
        const posCusum: number[] = [];
        const negCusum: number[] = [];

        let currentPos = 0;
        let currentNeg = 0;
        let driftDetected = false;
        let driftShiftRunIndex: number | undefined;
        let driftDirection: 'UPWARD_SYSTEMATIC' | 'DOWNWARD_SYSTEMATIC' | 'NONE' = 'NONE';

        for (let i = 0; i < values.length; i++) {
            const z = (values[i] - targetMean) / Math.max(1e-6, targetSd);

            currentPos = Math.max(0, currentPos + (z - kSlack));
            currentNeg = Math.max(0, currentNeg - (z + kSlack));

            posCusum.push(Number(currentPos.toFixed(3)));
            negCusum.push(Number(currentNeg.toFixed(3)));

            if (!driftDetected) {
                if (currentPos >= hDecision) {
                    driftDetected = true;
                    driftShiftRunIndex = i + 1;
                    driftDirection = 'UPWARD_SYSTEMATIC';
                } else if (currentNeg >= hDecision) {
                    driftDetected = true;
                    driftShiftRunIndex = i + 1;
                    driftDirection = 'DOWNWARD_SYSTEMATIC';
                }
            }
        }

        return {
            positiveCusum: posCusum,
            negativeCusum: negCusum,
            decisionIntervalH: hDecision,
            slackParameterK: kSlack,
            driftDetected,
            driftShiftRunIndex,
            driftDirection,
        };
    }

    // =========================================================================
    // 6. HIL (HEMOLYSIS, ICTERUS, LIPEMIA) INTERFERENCE EVALUATION
    // =========================================================================

    /**
     * Evaluates spectrophotometric HIL indices against clinical assay interference thresholds.
     */
    public static computeHilInterference(
        hemolysisMgDl: number,
        icterusMgDl: number,
        lipemiaTurbidity: number,
        analyteCode: string
    ): {
        isInterfered: boolean;
        interferingFactor?: 'HEMOLYSIS' | 'ICTERUS' | 'LIPEMIA';
        clinicalAction: 'REJECT_COLD_REDRAW' | 'DILUTE_AND_RERUN' | 'RELEASE_WITH_CAUTION_NOTE' | 'CLEAR_VALID';
        warningNote?: string;
    } {
        // Clinical interference thresholds (Standard CLSI EP07-A2 Guidelines)
        const THRESHOLDS: Record<string, { h: number; i: number; l: number }> = {
            K_SERUM: { h: 50, i: 30, l: 300 },       // Extreme sensitivity to erythrocyte lysis
            LDH: { h: 25, i: 20, l: 200 },           // Highly elevated by lysis
            AST: { h: 100, i: 25, l: 300 },
            ALT: { h: 200, i: 30, l: 400 },
            BILI_TOTAL: { h: 200, i: 999, l: 250 },  // Hemolysis interferes with diazo reaction
            GLU_PLASMA: { h: 500, i: 40, l: 500 },
            TROP_I_HS: { h: 150, i: 25, l: 400 },
        };

        const t = THRESHOLDS[analyteCode] || { h: 250, i: 30, l: 400 };

        if (hemolysisMgDl >= t.h) {
            return {
                isInterfered: true,
                interferingFactor: 'HEMOLYSIS',
                clinicalAction: analyteCode === 'K_SERUM' || analyteCode === 'LDH' ? 'REJECT_COLD_REDRAW' : 'RELEASE_WITH_CAUTION_NOTE',
                warningNote: `Hemolysis index (${hemolysisMgDl} mg/dL) exceeds clinical interference cutoff (${t.h} mg/dL). Intracellular release alters analyte accuracy.`,
            };
        }

        if (lipemiaTurbidity >= t.l) {
            return {
                isInterfered: true,
                interferingFactor: 'LIPEMIA',
                clinicalAction: 'DILUTE_AND_RERUN',
                warningNote: `Lipemia turbidity (${lipemiaTurbidity} turbidity units) exceeds threshold (${t.l}). Optical spectrophotometry scatter detected. High-speed ultracentrifugation or dilution required.`,
            };
        }

        if (icterusMgDl >= t.i) {
            return {
                isInterfered: true,
                interferingFactor: 'ICTERUS',
                clinicalAction: 'RELEASE_WITH_CAUTION_NOTE',
                warningNote: `High bilirubin icterus index (${icterusMgDl} mg/dL) may cause negative bias in enzymatic creatinine/glucose assays.`,
            };
        }

        return {
            isInterfered: false,
            clinicalAction: 'CLEAR_VALID',
        };
    }

    // =========================================================================
    // 7. CLINICAL DELTA-CHECK & VELOCITY CALCULATION
    // =========================================================================

    /**
     * Evaluates longitudinal delta check and rate of change between previous and current clinical results.
     */
    public static computeDeltaCheck(
        currentVal: number,
        previousVal: number,
        elapsedHours: number,
        analyteCode: string
    ): {
        deltaAbs: number;
        deltaPct: number;
        velocityPerHour: number;
        isCriticalAlert: boolean;
        clinicalInterpretation: string;
    } {
        const deltaAbs = currentVal - previousVal;
        const deltaPct = previousVal !== 0 ? (deltaAbs / Math.abs(previousVal)) * 100 : 0;
        const validHours = Math.max(0.1, elapsedHours);
        const velocity = deltaAbs / validHours;

        // Diagnostic criteria
        const DELTA_THRESHOLDS: Record<string, { maxPct: number; isCriticalOnDrop?: boolean; label: string }> = {
            HB: { maxPct: 20, isCriticalOnDrop: true, label: 'Hemoglobin' }, // >20% drop in <24h suggests active bleed
            CREAT: { maxPct: 50, isCriticalOnDrop: false, label: 'Serum Creatinine' }, // >50% rise = Acute Kidney Injury
            K_SERUM: { maxPct: 25, label: 'Potassium' }, // >25% delta can trigger arrhythmia risk
            PLT: { maxPct: 40, isCriticalOnDrop: true, label: 'Platelet Count' }, // Sudden drop = DIC, HIT, or clump
            TROP_I: { maxPct: 100, label: 'Troponin-I' }, // Acute rise in chest pain indicates AMI
        };

        const rule = DELTA_THRESHOLDS[analyteCode] || { maxPct: 35, label: analyteCode };
        const isCritical = Math.abs(deltaPct) >= rule.maxPct;

        let interpretation = 'Delta variance within expected biological intra-individual variation.';
        if (isCritical) {
            if (analyteCode === 'CREAT' && deltaPct >= 50) {
                interpretation = `Acute 50%+ rise in Creatinine (${previousVal} -> ${currentVal}) over ${validHours.toFixed(1)}h indicates probable KDIGO Acute Kidney Injury.`;
            } else if (analyteCode === 'HB' && deltaPct <= -20) {
                interpretation = `Critical drop in Hemoglobin (${previousVal} -> ${currentVal} g/dL, ${deltaPct.toFixed(1)}%) in ${validHours.toFixed(1)}h indicates acute blood loss.`;
            } else if (analyteCode === 'K_SERUM') {
                interpretation = `Rapid potassium shift (${previousVal} -> ${currentVal} mmol/L) requires immediate verification of hemolysis and cardiac telemetry notification.`;
            } else {
                interpretation = `Significant clinical delta alert: ${rule.label} changed by ${deltaPct.toFixed(1)}% (Threshold: ${rule.maxPct}%). Rule out IV fluid dilution or patient misidentification.`;
            }
        }

        return {
            deltaAbs: Number(deltaAbs.toFixed(2)),
            deltaPct: Number(deltaPct.toFixed(1)),
            velocityPerHour: Number(velocity.toFixed(3)),
            isCriticalAlert: isCritical,
            clinicalInterpretation: interpretation,
        };
    }

    // =========================================================================
    // 8. SIX SIGMA ANALYTICAL QUALITY METRICS & OPSPECS (CLSI C24-A4)
    // =========================================================================

    /**
     * Evaluates analytical Six Sigma Quality Metric and Quality Goal Index (QGI).
     * Sigma = (TEa - |Bias%|) / CV%
     * QGI = (Bias% / (1.5 * TEa)) / (CV% / (0.5 * TEa))
     * Delta SE_crit = ((TEa - |Bias%|) / CV%) - 1.65
     */
    public static computeSixSigmaQuality(
        allowableTotalErrorTeaPct: number,
        biasPercentage: number,
        coefficientOfVariationCvPct: number
    ): {
        sigmaMetric: number;
        qualityRating: 'WORLD_CLASS_6_SIGMA' | 'EXCELLENT_5_SIGMA' | 'GOOD_4_SIGMA' | 'MARGINAL_3_SIGMA' | 'UNACCEPTABLE_BELOW_3_SIGMA';
        qualityGoalIndexQgi: number;
        rootCauseImbalance: 'EXCESSIVE_IMPRECISION_CV' | 'EXCESSIVE_SYSTEMATIC_BIAS' | 'BALANCED_ERROR';
        criticalSystematicErrorSeCrit: number;
        recommendedQcProtocol: string;
        controlsPerRun: number;
    } {
        const tea = Math.max(0.1, allowableTotalErrorTeaPct);
        const cv = Math.max(0.01, coefficientOfVariationCvPct);
        const absBias = Math.abs(biasPercentage);

        const sigmaMetric = (tea - absBias) / cv;

        let qualityRating: 'WORLD_CLASS_6_SIGMA' | 'EXCELLENT_5_SIGMA' | 'GOOD_4_SIGMA' | 'MARGINAL_3_SIGMA' | 'UNACCEPTABLE_BELOW_3_SIGMA' = 'WORLD_CLASS_6_SIGMA';
        let recommendedQcProtocol = 'Single 1:3s rule per 1,000 patient specimens (Minimal QC overhead).';
        let controlsPerRun = 1;

        if (sigmaMetric >= 6.0) {
            qualityRating = 'WORLD_CLASS_6_SIGMA';
            recommendedQcProtocol = 'Single 1:3s rule evaluation per 1,000 patient specimens. Auto-verification enabled without routine holds.';
            controlsPerRun = 1;
        } else if (sigmaMetric >= 5.0) {
            qualityRating = 'EXCELLENT_5_SIGMA';
            recommendedQcProtocol = '1:3s and 2:2s Westgard rules with 2 levels of control every 400 specimens.';
            controlsPerRun = 2;
        } else if (sigmaMetric >= 4.0) {
            qualityRating = 'GOOD_4_SIGMA';
            recommendedQcProtocol = '1:3s, 2:2s, and R:4s rules with 2 control levels run every 200 specimens.';
            controlsPerRun = 2;
        } else if (sigmaMetric >= 3.0) {
            qualityRating = 'MARGINAL_3_SIGMA';
            recommendedQcProtocol = 'Multi-rule 1:3s/2:2s/R:4s/4:1s. Run 3 control levels every 100 specimens. Weekly recalibration required.';
            controlsPerRun = 3;
        } else {
            qualityRating = 'UNACCEPTABLE_BELOW_3_SIGMA';
            recommendedQcProtocol = 'CRITICAL: Full Westgard multi-rules (including 10x). 4 control levels run before every patient batch. Method redesign or immediate analyzer maintenance required.';
            controlsPerRun = 4;
        }

        // Quality Goal Index (QGI) for root cause discernment
        // QGI < 0.8 => Imprecision dominates; QGI > 1.2 => Inaccuracy/Bias dominates
        const qgi = (absBias / Math.max(0.01, 1.5 * tea)) / (cv / Math.max(0.01, 0.5 * tea));
        let rootCauseImbalance: 'EXCESSIVE_IMPRECISION_CV' | 'EXCESSIVE_SYSTEMATIC_BIAS' | 'BALANCED_ERROR' = 'BALANCED_ERROR';
        if (qgi < 0.8) {
            rootCauseImbalance = 'EXCESSIVE_IMPRECISION_CV';
        } else if (qgi > 1.2) {
            rootCauseImbalance = 'EXCESSIVE_SYSTEMATIC_BIAS';
        }

        const criticalSystematicErrorSeCrit = Math.max(0, sigmaMetric - 1.65);

        return {
            sigmaMetric: Number(sigmaMetric.toFixed(2)),
            qualityRating,
            qualityGoalIndexQgi: Number(qgi.toFixed(2)),
            rootCauseImbalance,
            criticalSystematicErrorSeCrit: Number(criticalSystematicErrorSeCrit.toFixed(2)),
            recommendedQcProtocol,
            controlsPerRun,
        };
    }

    // =========================================================================
    // 9. KALMAN FILTERING ESTIMATOR FOR CONTINUOUS SENSOR DRIFT
    // =========================================================================

    /**
     * 1D Discrete Kalman Filter state update for tracking true analyte concentrations
     * and estimating latent photometer / electrode calibration drift velocity.
     *
     * State equation: x_k = x_{k-1} + v_{k-1} * dt + w_k
     * Measurement:   z_k = x_k + v_k
     */
    public static evaluateKalmanSensorDrift(
        measurements: number[],
        initialTargetMean: number,
        processNoiseQ: number = 0.005,
        measurementNoiseR: number = 0.04
    ): {
        filteredValues: number[];
        estimatedDriftRatePerRun: number;
        estimatedCurrentTrueValue: number;
        latentCalibrationDriftAbs: number;
        predictedRunsUntilRecalibration: number;
    } {
        if (!measurements || measurements.length === 0) {
            return {
                filteredValues: [],
                estimatedDriftRatePerRun: 0,
                estimatedCurrentTrueValue: initialTargetMean,
                latentCalibrationDriftAbs: 0,
                predictedRunsUntilRecalibration: 999,
            };
        }

        let stateEstimate = initialTargetMean;
        let errorCovarianceP = 1.0;
        const filteredValues: number[] = [];

        for (let i = 0; i < measurements.length; i++) {
            const z = measurements[i];

            // 1. Time Update (Predict)
            const predictedEstimate = stateEstimate;
            const predictedP = errorCovarianceP + processNoiseQ;

            // 2. Measurement Update (Correct)
            const kalmanGainK = predictedP / (predictedP + measurementNoiseR);
            stateEstimate = predictedEstimate + kalmanGainK * (z - predictedEstimate);
            errorCovarianceP = (1 - kalmanGainK) * predictedP;

            filteredValues.push(Number(stateEstimate.toFixed(3)));
        }

        const n = filteredValues.length;
        const totalChange = filteredValues[n - 1] - filteredValues[0];
        const estimatedDriftRate = n > 1 ? totalChange / (n - 1) : 0;
        const latentDrift = stateEstimate - initialTargetMean;

        // Predict runs until drift exceeds 3x measurement noise (~0.12 or critical threshold)
        const criticalDriftThreshold = 3 * Math.sqrt(measurementNoiseR);
        let predictedRunsUntilRecalibration = 999;
        if (Math.abs(estimatedDriftRate) > 1e-4) {
            const remainingToLimit = Math.max(0, criticalDriftThreshold - Math.abs(latentDrift));
            predictedRunsUntilRecalibration = Math.round(remainingToLimit / Math.abs(estimatedDriftRate));
        }

        return {
            filteredValues,
            estimatedDriftRatePerRun: Number(estimatedDriftRate.toFixed(4)),
            estimatedCurrentTrueValue: Number(stateEstimate.toFixed(3)),
            latentCalibrationDriftAbs: Number(Math.abs(latentDrift).toFixed(3)),
            predictedRunsUntilRecalibration: Math.max(1, predictedRunsUntilRecalibration),
        };
    }

    // =========================================================================
    // 10. NON-LINEAR ENZYME KINETICS & SUBSTRATE DEPLETION (MICHAELIS-MENTEN)
    // =========================================================================

    /**
     * Evaluates enzyme velocity via Michaelis-Menten kinetics and detects
     * photometric substrate depletion in extreme high-activity clinical specimens
     * (e.g. ALT > 2000 U/L where absorbance flattening falsifies readings).
     *
     * Velocity: v = (V_max * [S]) / (K_m + [S])
     */
    public static evaluateEnzymeKinetics(
        substrateConcentrationMmolL: number,
        vMaxUnitsPerMin: number,
        kmMmolL: number,
        absorbanceDeltaPerMin: number
    ): {
        reactionVelocityUnitsPerMin: number;
        isSubstrateDepleted: boolean;
        recommendedDilutionRatio: string;
        dilutedRerunRequired: boolean;
        lineweaverBurkSlope: number;
    } {
        const s = Math.max(0.001, substrateConcentrationMmolL);
        const vMax = Math.max(0.1, vMaxUnitsPerMin);
        const km = Math.max(0.001, kmMmolL);

        const velocity = (vMax * s) / (km + s);

        // Substrate depletion occurs when reaction velocity reaches plateau (>96% of V_max)
        // or measured absorbance slope is flat despite active enzyme
        const isDepleted = velocity >= 0.96 * vMax || absorbanceDeltaPerMin < 0.002;
        let recommendedDilutionRatio = '1:1 (Direct Neat Sample)';
        let dilutedRerunRequired = false;

        if (isDepleted) {
            dilutedRerunRequired = true;
            recommendedDilutionRatio = '1:10 Saline Dilution (Automated Secondary Rerun)';
        }

        const lineweaverBurkSlope = km / vMax;

        return {
            reactionVelocityUnitsPerMin: Number(velocity.toFixed(2)),
            isSubstrateDepleted: isDepleted,
            recommendedDilutionRatio,
            dilutedRerunRequired,
            lineweaverBurkSlope: Number(lineweaverBurkSlope.toFixed(4)),
        };
    }

    // =========================================================================
    // 11. FINITE-CAPACITY QUEUEING NETWORK WITH ERLANG-B LOSS (M/M/c/K)
    // =========================================================================

    /**
     * Erlang-B loss probability formula for finite-capacity pneumatic tube ports and STAT infeed channels:
     *   B(c, a) = (a^c / c!) / sum_{k=0}^c (a^k / k!)
     */
    public static computeErlangBLossProbability(
        channelsC: number,
        arrivalRateLambdaPerHour: number,
        serviceRateMuPerHour: number
    ): {
        blockingProbabilityB: number;
        spilloverRatePerHour: number;
        carriedTrafficErlangs: number;
        backupCourierDispatchRequired: boolean;
    } {
        const c = Math.max(1, Math.round(channelsC));
        const lambda = Math.max(0.1, arrivalRateLambdaPerHour);
        const mu = Math.max(0.1, serviceRateMuPerHour);
        const a = lambda / mu;

        // Numerically stable recursive computation of Erlang B:
        // B(0, a) = 1
        // B(k, a) = (a * B(k-1, a)) / (k + a * B(k-1, a))
        let b = 1.0;
        for (let k = 1; k <= c; k++) {
            b = (a * b) / (k + a * b);
        }

        const blockingProbability = Math.max(0, Math.min(1.0, b));
        const spilloverRate = lambda * blockingProbability;
        const carriedTraffic = a * (1 - blockingProbability);
        const dispatchRequired = blockingProbability >= 0.05; // >5% port congestion requires physical backup courier

        return {
            blockingProbabilityB: Number(blockingProbability.toFixed(4)),
            spilloverRatePerHour: Number(spilloverRate.toFixed(1)),
            carriedTrafficErlangs: Number(carriedTraffic.toFixed(2)),
            backupCourierDispatchRequired: dispatchRequired,
        };
    }

    // =========================================================================
    // 12. KDIGO AKI COMPLETE STAGING & CKD-EPI 2021 RACE-FREE eGFR
    // =========================================================================

    /**
     * Staging of Acute Kidney Injury conforming to KDIGO Clinical Practice Guidelines
     * and baseline filtration estimation using the CKD-EPI 2021 Race-Free formula:
     * eGFR = 142 * min(Scr/kappa, 1)^alpha * max(Scr/kappa, 1)^-1.200 * 0.9938^Age * [1.012 if female]
     */
    public static evaluateKdigoAkiAndEgfr(
        currentCreatinineMgDl: number,
        baselineCreatinineMgDl: number,
        patientAgeYears: number,
        patientSex: 'FEMALE' | 'MALE',
        urineOutputMlKgHrOver6h?: number
    ): {
        akiStage: 'NO_AKI' | 'STAGE_1_AKI' | 'STAGE_2_AKI' | 'STAGE_3_AKI_CRITICAL';
        creatinineFoldRise: number;
        absoluteDeltaMgDl: number;
        baselineEgfrMlkMinPer173m2: number;
        currentEstimatedEgfr: number;
        clinicalGuidelineDirective: string;
        mandatoryNephrologyConsult: boolean;
    } {
        const cCurr = Math.max(0.1, currentCreatinineMgDl);
        const cBase = Math.max(0.1, baselineCreatinineMgDl);
        const age = Math.max(18, Math.min(110, patientAgeYears));

        const absDelta = cCurr - cBase;
        const foldRise = cCurr / cBase;

        // CKD-EPI 2021 Race-Free parameters
        const isFemale = patientSex === 'FEMALE';
        const kappa = isFemale ? 0.7 : 0.9;
        const alpha = isFemale ? -0.241 : -0.302;
        const genderFactor = isFemale ? 1.012 : 1.000;

        const calcEgfr = (scr: number) => {
            const minRatio = Math.min(scr / kappa, 1.0);
            const maxRatio = Math.max(scr / kappa, 1.0);
            return (
                142 *
                Math.pow(minRatio, alpha) *
                Math.pow(maxRatio, -1.200) *
                Math.pow(0.9938, age) *
                genderFactor
            );
        };

        const baselineEgfr = calcEgfr(cBase);
        const currentEgfr = calcEgfr(cCurr);

        // KDIGO Staging Criteria
        let akiStage: 'NO_AKI' | 'STAGE_1_AKI' | 'STAGE_2_AKI' | 'STAGE_3_AKI_CRITICAL' = 'NO_AKI';
        let directive = 'Renal filtration parameters within stable intra-individual baseline.';
        let mandatoryConsult = false;

        if (cCurr >= 4.0 || foldRise >= 3.0 || (urineOutputMlKgHrOver6h !== undefined && urineOutputMlKgHrOver6h < 0.3)) {
            akiStage = 'STAGE_3_AKI_CRITICAL';
            directive = 'CRITICAL KDIGO STAGE 3 AKI: Creatinine >= 3.0x baseline or >= 4.0 mg/dL. Immediate emergent nephrology notification, discontinue nephrotoxic agents, assess for RRT.';
            mandatoryConsult = true;
        } else if (foldRise >= 2.0 && foldRise < 3.0) {
            akiStage = 'STAGE_2_AKI';
            directive = 'KDIGO STAGE 2 AKI: 2.0-2.9x increase in serum creatinine. Fluid balance monitoring, renal ultrasound, and dosage adjustment of renal-cleared medications mandatory.';
            mandatoryConsult = true;
        } else if (absDelta >= 0.3 || (foldRise >= 1.5 && foldRise < 2.0)) {
            akiStage = 'STAGE_1_AKI';
            directive = 'KDIGO STAGE 1 AKI: Acute rise >= 0.3 mg/dL within 48h or 1.5-1.9x baseline. Repeat serum creatinine in 12-24 hours; avoid contrast and NSAIDs.';
            mandatoryConsult = false;
        }

        return {
            akiStage,
            creatinineFoldRise: Number(foldRise.toFixed(2)),
            absoluteDeltaMgDl: Number(absDelta.toFixed(2)),
            baselineEgfrMlkMinPer173m2: Number(baselineEgfr.toFixed(1)),
            currentEstimatedEgfr: Number(currentEgfr.toFixed(1)),
            clinicalGuidelineDirective: directive,
            mandatoryNephrologyConsult: mandatoryConsult,
        };
    }

    // =========================================================================
    // 13. ARRHENIUS TIME-TEMPERATURE INTEGRAL (TTI) COLD CHAIN LOGGING
    // =========================================================================

    /**
     * Computes cumulative biochemical degradation across non-isothermal temperature intervals:
     *   Omega = sum_{i=1}^m k(T_i) * Delta t_i
     *   Viability = max(0, 100% * (1 - Omega))
     */
    public static computeArrheniusTimeTemperatureIntegral(
        segments: { tempCelsius: number; durationHours: number }[],
        kRefPerHour: number,
        activationEnergyOverR: number
    ): {
        cumulativeDegradationOmega: number;
        remainingViabilityPct: number;
        equivalentHoursAtReference4C: number;
        isViableForTesting: boolean;
        sampleAction: 'PROCEED_AUTOMATED_RUN' | 'ATTACH_PREANALYTICAL_CAUTION' | 'REJECT_MANDATORY_REDRAW';
    } {
        let totalOmega = 0;

        for (const seg of segments) {
            const k = this.computeArrheniusRateConstant(
                kRefPerHour,
                activationEnergyOverR,
                seg.tempCelsius
            );
            totalOmega += k * Math.max(0, seg.durationHours);
        }

        const remainingViabilityPct = Math.max(0, Math.min(100, (1 - totalOmega) * 100));
        const kRef = this.computeArrheniusRateConstant(kRefPerHour, activationEnergyOverR, 4.0);
        const equivalentHoursAt4C = kRef > 0 ? totalOmega / kRef : 0;

        let sampleAction: 'PROCEED_AUTOMATED_RUN' | 'ATTACH_PREANALYTICAL_CAUTION' | 'REJECT_MANDATORY_REDRAW' = 'PROCEED_AUTOMATED_RUN';
        if (remainingViabilityPct < 70.0) {
            sampleAction = 'REJECT_MANDATORY_REDRAW';
        } else if (remainingViabilityPct < 85.0) {
            sampleAction = 'ATTACH_PREANALYTICAL_CAUTION';
        }

        return {
            cumulativeDegradationOmega: Number(totalOmega.toFixed(4)),
            remainingViabilityPct: Number(remainingViabilityPct.toFixed(1)),
            equivalentHoursAtReference4C: Number(equivalentHoursAt4C.toFixed(1)),
            isViableForTesting: remainingViabilityPct >= 70.0,
            sampleAction,
        };
    }
}

