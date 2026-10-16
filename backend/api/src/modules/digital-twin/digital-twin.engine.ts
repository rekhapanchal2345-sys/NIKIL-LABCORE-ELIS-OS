import {
    AnalyteStabilityKinetics,
    AnalyzerTwinNode,
    DepartmentSimulationForecast,
    DigitalTwinSimulationInput,
    DigitalTwinSimulationResult,
    FailoverOptimizationPlan,
    FailoverRouteAllocation,
    HourlySimulationTimelinePoint,
    LabDepartment,
    QueuedSpecimenTwinItem,
    SpecimenPriorityClass,
    SpecimenStabilityAssessment,
} from './digital-twin.types';

/**
 * Reference biochemical stability kinetics for labile clinical analytes.
 * Rate constants k_ref are calibrated at T_ref = 22°C (295.15 K).
 */
export const ANALYTE_STABILITY_CATALOG: Record<string, AnalyteStabilityKinetics> = {
    K_SERUM: {
        analyteCode: 'K_SERUM',
        analyteName: 'Potassium (Whole Blood / Unspun Serum)',
        department: 'BIOCHEMISTRY',
        referenceRateConstantPerHour: 0.0195, // ~3.8% drift over 2 hrs unspun via Na+/K+ ATPase shift
        activationEnergyOverR: 4200,
        maxPermissibleDriftPct: 4.5,
        centrifugationMitigationFactor: 0.18,
        recommendedAction: 'Centrifuge immediately to separate serum from erythrocytes or preempt to STAT lane.',
    },
    GLU_PLASMA: {
        analyteCode: 'GLU_PLASMA',
        analyteName: 'Glucose (Non-Fluoride / Unspun)',
        department: 'BIOCHEMISTRY',
        referenceRateConstantPerHour: 0.068, // ~5-7% per hour glycolysis at room temp
        activationEnergyOverR: 5400,
        maxPermissibleDriftPct: 8.0,
        centrifugationMitigationFactor: 0.22,
        recommendedAction: 'Preempt to rapid biochemistry channel; verify sodium fluoride glycolysis inhibition.',
    },
    LACTATE: {
        analyteCode: 'LACTATE',
        analyteName: 'Arterial/Venous Blood Lactate',
        department: 'BIOCHEMISTRY',
        referenceRateConstantPerHour: 0.145, // Highly labile without ice bath
        activationEnergyOverR: 6100,
        maxPermissibleDriftPct: 10.0,
        centrifugationMitigationFactor: 0.30,
        recommendedAction: 'Maintain chilled at 2-4°C and execute immediate STAT preemption.',
    },
    NH3_AMMONIA: {
        analyteCode: 'NH3_AMMONIA',
        analyteName: 'Plasma Ammonia (NH3)',
        department: 'BIOCHEMISTRY',
        referenceRateConstantPerHour: 0.21, // Deamination of amino acids rapidly elevates NH3
        activationEnergyOverR: 6500,
        maxPermissibleDriftPct: 12.0,
        centrifugationMitigationFactor: 0.35,
        recommendedAction: 'Critical pre-analytical window (<30 min at room temp). Route to immediate assay or reject for cold redraw.',
    },
    PT_INR: {
        analyteCode: 'PT_INR',
        analyteName: 'Prothrombin Time / INR & APTT (Citrated)',
        department: 'COAGULATION',
        referenceRateConstantPerHour: 0.028, // Factor V & Factor VIII labile degradation
        activationEnergyOverR: 4800,
        maxPermissibleDriftPct: 6.0,
        centrifugationMitigationFactor: 0.50,
        recommendedAction: 'Assay within 2-4 hours of collection; prevent platelet activation.',
    },
    TROP_I_HS: {
        analyteCode: 'TROP_I_HS',
        analyteName: 'High-Sensitivity Troponin I (STAT Cardiac)',
        department: 'IMMUNOASSAY',
        referenceRateConstantPerHour: 0.012,
        activationEnergyOverR: 3800,
        maxPermissibleDriftPct: 5.0,
        centrifugationMitigationFactor: 0.25,
        recommendedAction: 'Clinical cardiac SLA <= 45 mins; prioritize on primary immunoassay analyzer.',
    },
    CBC_DIFF: {
        analyteCode: 'CBC_DIFF',
        analyteName: 'Complete Blood Count + 5-Part Differential (EDTA)',
        department: 'HEMATOLOGY',
        referenceRateConstantPerHour: 0.016, // MPV swelling and neutrophil vacuolization over time
        activationEnergyOverR: 3900,
        maxPermissibleDriftPct: 6.5,
        centrifugationMitigationFactor: 1.0, // Whole blood EDTA is not centrifuged
        recommendedAction: 'Process before EDTA-induced mean platelet volume (MPV) artifact occurs.',
    },
    BLOOD_CULTURE: {
        analyteCode: 'BLOOD_CULTURE',
        analyteName: 'Automated Aerobic/Anaerobic Blood Culture',
        department: 'MICROBIOLOGY',
        referenceRateConstantPerHour: 0.032, // Delayed bottle loading reduces fastidious organism recovery
        activationEnergyOverR: 4500,
        maxPermissibleDriftPct: 7.5,
        centrifugationMitigationFactor: 1.0,
        recommendedAction: 'Load into continuous-monitoring incubator before thermal lag phase.',
    },
};

const DEPARTMENT_BASE_ARRIVALS_PER_HOUR: Record<LabDepartment, number> = {
    HEMATOLOGY: 145,
    BIOCHEMISTRY: 210,
    IMMUNOASSAY: 85,
    COAGULATION: 52,
    MICROBIOLOGY: 28,
};

const DEPARTMENT_SLA_MINUTES: Record<LabDepartment, number> = {
    HEMATOLOGY: 45,
    BIOCHEMISTRY: 60,
    IMMUNOASSAY: 75,
    COAGULATION: 45,
    MICROBIOLOGY: 120,
};

/**
 * Deterministic-seed Mulberry32 pseudo-random number generator (returns [0, 1)).
 */
export function createSeededPrng(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Samples a Poisson random variate with mean lambda using Knuth's algorithm for small lambda
 * and Gaussian-corrected approximation for large lambda.
 */
export function samplePoisson(lambda: number, rng: () => number): number {
    if (lambda <= 0) return 0;
    if (lambda < 30) {
        const L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
            k++;
            p *= Math.max(1e-12, rng());
        } while (p > L);
        return k - 1;
    }
    // Box-Muller normal approximation for lambda >= 30
    const u1 = Math.max(1e-12, rng());
    const u2 = rng();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
}

/**
 * Computes the analytical M/M/c Erlang-C probability that an arriving specimen waits in queue.
 */
export function computeErlangCWaitProbability(
    arrivalRatePerHour: number,
    effectiveCapacityPerHour: number,
    activeServerChannels: number
): { rho: number; erlangC: number } {
    if (activeServerChannels <= 0 || effectiveCapacityPerHour <= 0) {
        return { rho: 9.99, erlangC: 1.0 };
    }
    const rho = arrivalRatePerHour / effectiveCapacityPerHour;
    if (rho >= 1.0) {
        return { rho: Number(rho.toFixed(4)), erlangC: 1.0 };
    }

    const c = Math.max(1, Math.min(20, activeServerChannels));
    const a = c * rho;

    let sumTerms = 1.0;
    let term = 1.0;
    for (let k = 1; k < c; k++) {
        term *= a / k;
        sumTerms += term;
    }
    const lastTerm = (term * (a / c)) / (1.0 - rho);
    const erlangC = lastTerm / (sumTerms + lastTerm);

    return {
        rho: Number(rho.toFixed(4)),
        erlangC: Number(Math.min(1, Math.max(0, erlangC)).toFixed(4)),
    };
}

/**
 * Evaluates biochemical pre-analytical stability using Arrhenius temperature kinetics.
 */
export function evaluateSpecimenStability(
    specimen: QueuedSpecimenTwinItem,
    predictedQueueWaitMinutes: number,
    nowMs: number = Date.now()
): SpecimenStabilityAssessment {
    const profile =
        ANALYTE_STABILITY_CATALOG[specimen.analyteCode] ??
        ANALYTE_STABILITY_CATALOG.K_SERUM;

    const collectedMs = Date.parse(specimen.collectedAtIso);
    const elapsedMinutes = Number.isFinite(collectedMs)
        ? Math.max(1, (nowMs - collectedMs) / 60000)
        : 25;

    const tRefKelvin = 295.15; // 22°C
    const tActualKelvin = Math.max(250, specimen.storageTempCelsius + 273.15);

    const arrheniusFactor = Math.exp(
        profile.activationEnergyOverR * (1 / tRefKelvin - 1 / tActualKelvin)
    );
    const centrifugationMultiplier = specimen.isCentrifuged
        ? profile.centrifugationMitigationFactor
        : 1.0;

    const effectiveRatePerHour =
        profile.referenceRateConstantPerHour *
        arrheniusFactor *
        centrifugationMultiplier;

    const elapsedHours = elapsedMinutes / 60;
    const totalProjectedMinutes = elapsedMinutes + Math.max(0, predictedQueueWaitMinutes);
    const totalProjectedHours = totalProjectedMinutes / 60;

    const currentDriftPct = Number(
        (100 * (1 - Math.exp(-effectiveRatePerHour * elapsedHours))).toFixed(2)
    );
    const projectedDriftAtAssayPct = Number(
        (100 * (1 - Math.exp(-effectiveRatePerHour * totalProjectedHours))).toFixed(2)
    );

    // Solve for time when drift reaches maxPermissibleDriftPct:
    // maxDrift / 100 = 1 - exp(-k * t_max) => t_max = -ln(1 - maxDrift/100) / k
    const maxFraction = Math.min(0.95, profile.maxPermissibleDriftPct / 100);
    const maxViableMinutes =
        effectiveRatePerHour > 0
            ? (-Math.log(1 - maxFraction) / effectiveRatePerHour) * 60
            : 1440;
    const viabilityRemainingMinutes = Number(
        Math.max(0, maxViableMinutes - elapsedMinutes).toFixed(1)
    );

    let riskLevel: SpecimenStabilityAssessment['riskLevel'] = 'SAFE';
    let recommendedPriority: SpecimenPriorityClass = specimen.priority;
    let clinicalRecommendation = 'Within pre-analytical stability window.';

    if (currentDriftPct >= profile.maxPermissibleDriftPct) {
        riskLevel = 'EXPIRED_REDRAW_REQUIRED';
        recommendedPriority = 'STAT_CRITICAL';
        clinicalRecommendation = `Pre-analytical drift (${currentDriftPct}%) already exceeds allowable error (${profile.maxPermissibleDriftPct}%). Quarantine sample and request redraw.`;
    } else if (projectedDriftAtAssayPct >= profile.maxPermissibleDriftPct * 0.8) {
        riskLevel = 'CRITICAL_PREEMPT_REQUIRED';
        recommendedPriority =
            specimen.priority === 'STAT_CRITICAL' ? 'STAT_CRITICAL' : 'BIO_STABILITY_RISK';
        clinicalRecommendation = `Projected queue wait (${predictedQueueWaitMinutes.toFixed(0)}m) will push analyte drift to ${projectedDriftAtAssayPct}% (limit ${profile.maxPermissibleDriftPct}%). ${profile.recommendedAction}`;
    } else if (projectedDriftAtAssayPct >= profile.maxPermissibleDriftPct * 0.55) {
        riskLevel = 'ELEVATED_WATCH';
        recommendedPriority =
            specimen.priority === 'ROUTINE' ? 'URGENT' : specimen.priority;
        clinicalRecommendation = `Approaching 55% of pre-analytical drift budget (${projectedDriftAtAssayPct}% / ${profile.maxPermissibleDriftPct}%). ${profile.recommendedAction}`;
    }

    return {
        sampleId: specimen.sampleId,
        barcode: specimen.barcode,
        analyteCode: specimen.analyteCode,
        analyteName: profile.analyteName,
        department: specimen.department,
        targetAnalyzerId: specimen.targetAnalyzerId,
        originalPriority: specimen.priority,
        recommendedPriority,
        elapsedMinutesSinceCollection: Number(elapsedMinutes.toFixed(1)),
        predictedQueueWaitMinutes: Number(predictedQueueWaitMinutes.toFixed(1)),
        totalProjectedMinutesToAssay: Number(totalProjectedMinutes.toFixed(1)),
        storageTempCelsius: specimen.storageTempCelsius,
        currentDriftPct,
        projectedDriftAtAssayPct,
        maxPermissibleDriftPct: profile.maxPermissibleDriftPct,
        viabilityRemainingMinutes,
        riskLevel,
        clinicalRecommendation,
    };
}

/**
 * Executes the Monte Carlo Discrete-Event Simulation across all 5 laboratory departments.
 */
export function runDigitalTwinSimulation(
    baseAnalyzers: AnalyzerTwinNode[],
    specimens: QueuedSpecimenTwinItem[],
    input: DigitalTwinSimulationInput,
    runId: string,
    idempotencyKey: string
): DigitalTwinSimulationResult {
    const startTimeMs = Date.now();
    const rng = createSeededPrng(input.seed);

    const forcedOfflineSet = new Set(input.forcedOfflineAnalyzerIds ?? []);
    const overridesMap = new Map(
        (input.analyzerOverrides ?? []).map((o) => [o.analyzerId, o])
    );

    const effectiveAnalyzers: AnalyzerTwinNode[] = baseAnalyzers.map((node) => {
        const override = overridesMap.get(node.analyzerId);
        const merged: AnalyzerTwinNode = {
            ...node,
            ...override,
            analyzerId: node.analyzerId,
        };
        if (forcedOfflineSet.has(node.analyzerId)) {
            merged.status = 'MAINTENANCE_OFFLINE';
        }
        return merged;
    });

    const departments: LabDepartment[] = [
        'HEMATOLOGY',
        'BIOCHEMISTRY',
        'IMMUNOASSAY',
        'COAGULATION',
        'MICROBIOLOGY',
    ];

    // Hour-of-day diurnal curve multipliers
    const diurnalProfile = [1.15, 1.32, 1.28, 1.10, 0.95, 0.88, 0.82, 0.78];

    const departmentForecasts: DepartmentSimulationForecast[] = [];
    const criticalAlerts: string[] = [];
    const departmentMeanQueueWaitMap = new Map<LabDepartment, number>();

    let totalProjectedSpecimens = 0;
    let totalThroughputCapacity = 0;

    for (const dept of departments) {
        const deptAnalyzers = effectiveAnalyzers.filter((a) => a.department === dept);
        const activeNodes = deptAnalyzers.filter(
            (a) =>
                a.status === 'ONLINE' ||
                a.status === 'DEGRADED_QC_WARNING'
        );
        const offlineOrLockedCount = deptAnalyzers.length - activeNodes.length;

        const effectiveCapacityPerHour = activeNodes.reduce((sum, a) => {
            const efficiencyFactor = a.status === 'DEGRADED_QC_WARNING' ? 0.82 : 1.0;
            return sum + a.nominalThroughputPerHour * efficiencyFactor;
        }, 0);

        const activeChannels = activeNodes.reduce(
            (sum, a) => sum + a.parallelChannels,
            0
        );

        const initialBacklog = deptAnalyzers.reduce(
            (sum, a) => sum + a.currentQueueDepth,
            0
        );

        const meanCycleMinutes =
            activeNodes.length > 0
                ? activeNodes.reduce((sum, a) => sum + a.meanCycleTimeMinutes, 0) /
                activeNodes.length
                : 35;

        const baseArrivalRate =
            DEPARTMENT_BASE_ARRIVALS_PER_HOUR[dept] * input.surgeMultiplier;

        totalProjectedSpecimens += Math.round(baseArrivalRate * input.horizonHours);
        totalThroughputCapacity += Math.round(
            effectiveCapacityPerHour * input.horizonHours
        );

        const { rho, erlangC } = computeErlangCWaitProbability(
            baseArrivalRate,
            effectiveCapacityPerHour,
            activeChannels
        );

        // Monte Carlo simulation across `input.iterations` trajectories
        const tatSamples: number[] = [];
        const peakQueueSamples: number[] = [];
        let slaBreachTrials = 0;
        const slaTarget = DEPARTMENT_SLA_MINUTES[dept];

        for (let iter = 0; iter < input.iterations; iter++) {
            let queue = initialBacklog;
            let maxQueueInRun = queue;
            let weightedTatSum = 0;
            let totalArrivalsInRun = 0;

            for (let h = 0; h < input.horizonHours; h++) {
                const diurnalMultiplier = diurnalProfile[h % diurnalProfile.length];
                const hourlyLambda = baseArrivalRate * diurnalMultiplier;
                const arrivals = samplePoisson(hourlyLambda, rng);

                // Service capacity with stochastic analyzer micro-variance (+/- 8%)
                const serviceVariance = 0.92 + rng() * 0.16;
                const capacityThisHour = Math.floor(
                    effectiveCapacityPerHour * serviceVariance
                );

                const totalDemand = queue + arrivals;
                const processed = Math.min(totalDemand, Math.max(0, capacityThisHour));
                queue = Math.max(0, totalDemand - processed);
                if (queue > maxQueueInRun) {
                    maxQueueInRun = queue;
                }

                // Queue waiting time in minutes for specimens in this hour
                const waitMinutes =
                    effectiveCapacityPerHour > 0
                        ? (queue / effectiveCapacityPerHour) * 60
                        : input.horizonHours * 60;

                // Pre-analytical centrifugation + analytical cycle + queue wait
                // STAT fraction gets priority preemption (25% of normal wait)
                const effectiveWait =
                    input.statRatio * (waitMinutes * 0.25) +
                    (1 - input.statRatio) * waitMinutes;
                const preAnalyticalMinutes = dept === 'HEMATOLOGY' ? 6 : 12;
                const hourTat = preAnalyticalMinutes + meanCycleMinutes + effectiveWait;

                weightedTatSum += hourTat * Math.max(1, arrivals);
                totalArrivalsInRun += Math.max(1, arrivals);
            }

            const avgRunTat = weightedTatSum / Math.max(1, totalArrivalsInRun);
            tatSamples.push(avgRunTat);
            peakQueueSamples.push(maxQueueInRun);
            if (avgRunTat > slaTarget) {
                slaBreachTrials++;
            }
        }

        tatSamples.sort((a, b) => a - b);
        peakQueueSamples.sort((a, b) => a - b);

        const p50Idx = Math.min(
            tatSamples.length - 1,
            Math.floor(tatSamples.length * 0.5)
        );
        const p90Idx = Math.min(
            tatSamples.length - 1,
            Math.floor(tatSamples.length * 0.9)
        );
        const p99Idx = Math.min(
            tatSamples.length - 1,
            Math.floor(tatSamples.length * 0.99)
        );
        const q95Idx = Math.min(
            peakQueueSamples.length - 1,
            Math.floor(peakQueueSamples.length * 0.95)
        );

        const tatP50 = Number(tatSamples[p50Idx].toFixed(1));
        const tatP90 = Number(tatSamples[p90Idx].toFixed(1));
        const tatP99 = Number(tatSamples[p99Idx].toFixed(1));
        const peakQueueP95 = peakQueueSamples[q95Idx];

        // Calculate reagent exhaustion horizon
        let earliestReagentExhaustionHours: number | null = null;
        if (activeNodes.length > 0 && baseArrivalRate > 0) {
            const perAnalyzerLoad = baseArrivalRate / activeNodes.length;
            for (const node of activeNodes) {
                const hoursLeft = Number(
                    (node.reagentRemainingTests / Math.max(1, perAnalyzerLoad)).toFixed(1)
                );
                if (
                    earliestReagentExhaustionHours === null ||
                    hoursLeft < earliestReagentExhaustionHours
                ) {
                    earliestReagentExhaustionHours = hoursLeft;
                }
            }
        }

        const predictedSlaBreachPct = Number(
            Math.min(
                100,
                Math.max(
                    (slaBreachTrials / input.iterations) * 100,
                    tatP90 > slaTarget
                        ? Math.min(99.5, ((tatP90 - slaTarget) / slaTarget) * 65 + 15)
                        : 0
                )
            ).toFixed(1)
        );

        let bottleneckSeverity: DepartmentSimulationForecast['bottleneckSeverity'] =
            'OPTIMAL';
        if (rho >= 1.0 || activeNodes.length === 0 || predictedSlaBreachPct >= 40) {
            bottleneckSeverity = 'CRITICAL_SATURATION';
            criticalAlerts.push(
                `[${dept}] Critical saturation (ρ=${rho.toFixed(2)}, P90 TAT=${tatP90}m vs ${slaTarget}m SLA). Immediate cross-analyzer failover required.`
            );
        } else if (rho >= 0.82 || predictedSlaBreachPct >= 15) {
            bottleneckSeverity = 'HIGH_CONGESTION';
            criticalAlerts.push(
                `[${dept}] High congestion warning (ρ=${rho.toFixed(2)}, P90 TAT=${tatP90}m).`
            );
        } else if (rho >= 0.65) {
            bottleneckSeverity = 'MODERATE_LOAD';
        }

        if (
            earliestReagentExhaustionHours !== null &&
            earliestReagentExhaustionHours <= input.horizonHours
        ) {
            criticalAlerts.push(
                `[${dept}] Reagent depletion projected in ${earliestReagentExhaustionHours}h (within ${input.horizonHours}h simulation window).`
            );
        }

        const estQueueWait = Math.max(2, tatP50 - meanCycleMinutes - 8);
        departmentMeanQueueWaitMap.set(dept, estQueueWait);

        departmentForecasts.push({
            department: dept,
            activeAnalyzers: activeNodes.length,
            offlineOrLockedAnalyzers: offlineOrLockedCount,
            arrivalRatePerHour: Number(baseArrivalRate.toFixed(1)),
            effectiveCapacityPerHour: Number(effectiveCapacityPerHour.toFixed(1)),
            trafficIntensityRho: rho,
            erlangCWaitProbability: erlangC,
            tatMinutesP50: tatP50,
            tatMinutesP90: tatP90,
            tatMinutesP99: tatP99,
            slaTargetMinutes: slaTarget,
            predictedSlaBreachPct,
            peakQueueDepthP95: peakQueueP95,
            earliestReagentExhaustionHours,
            bottleneckSeverity,
        });
    }

    // Build hourly aggregate timeline
    const hourlyTimeline: HourlySimulationTimelinePoint[] = [];
    let runningBacklog = effectiveAnalyzers.reduce(
        (sum, a) => sum + a.currentQueueDepth,
        0
    );
    const totalHourlyBaseArrival = Object.values(
        DEPARTMENT_BASE_ARRIVALS_PER_HOUR
    ).reduce((a, b) => a + b, 0) * input.surgeMultiplier;
    const totalHourlyEffectiveCap = departmentForecasts.reduce(
        (sum, d) => sum + d.effectiveCapacityPerHour,
        0
    );

    for (let h = 0; h < input.horizonHours; h++) {
        const mult = diurnalProfile[h % diurnalProfile.length];
        const arrivals = Math.round(totalHourlyBaseArrival * mult);
        const demand = runningBacklog + arrivals;
        const completed = Math.min(demand, Math.round(totalHourlyEffectiveCap));
        runningBacklog = Math.max(0, demand - completed);

        const waitMins =
            totalHourlyEffectiveCap > 0
                ? (runningBacklog / totalHourlyEffectiveCap) * 60
                : 120;
        const meanTat = Number((28 + waitMins).toFixed(1));
        const slaCompliance = Number(
            Math.max(5, Math.min(99.9, 100 - Math.max(0, (meanTat - 48) * 1.4))).toFixed(1)
        );

        hourlyTimeline.push({
            hourOffset: h + 1,
            label: `T+${h + 1}h`,
            projectedArrivals: arrivals,
            projectedCompleted: completed,
            projectedBacklog: runningBacklog,
            meanTatMinutes: meanTat,
            slaCompliancePct: slaCompliance,
        });
    }

    // Evaluate specimen bio-thermal stability across queued specimens
    const nowMs = Date.now();
    const stabilityAssessments = specimens.map((specimen) => {
        const deptWait =
            departmentMeanQueueWaitMap.get(specimen.department) ?? 15;
        // If the specimen's target analyzer is offline/locked, add unmitigated failover delay
        const targetNode = effectiveAnalyzers.find(
            (a) => a.analyzerId === specimen.targetAnalyzerId
        );
        const analyzerPenalty =
            !targetNode ||
                targetNode.status === 'MAINTENANCE_OFFLINE' ||
                targetNode.status === 'LOCKED_WESTGARD_VIOLATION' ||
                targetNode.status === 'REAGENT_DEPLETED'
                ? 38
                : 0;

        return evaluateSpecimenStability(
            {
                ...specimen,
                storageTempCelsius:
                    specimen.storageTempCelsius ?? input.ambientTempCelsius,
            },
            deptWait + analyzerPenalty,
            nowMs
        );
    });

    const atRiskSpecimensCount = stabilityAssessments.filter(
        (s) =>
            s.riskLevel === 'CRITICAL_PREEMPT_REQUIRED' ||
            s.riskLevel === 'EXPIRED_REDRAW_REQUIRED'
    ).length;

    if (atRiskSpecimensCount > 0) {
        criticalAlerts.push(
            `[BIO-STABILITY GUARD] ${atRiskSpecimensCount} specimen(s) at critical risk of pre-analytical analyte degradation before assay completion.`
        );
    }

    const overallSlaBreachPct = Number(
        (
            departmentForecasts.reduce((sum, d) => sum + d.predictedSlaBreachPct, 0) /
            departmentForecasts.length
        ).toFixed(1)
    );

    const avgRho =
        departmentForecasts.reduce(
            (sum, d) => sum + Math.min(1.5, d.trafficIntensityRho),
            0
        ) / departmentForecasts.length;

    const overallBottleneckScore = Number(
        Math.min(
            100,
            Math.round(avgRho * 55 + overallSlaBreachPct * 0.35 + atRiskSpecimensCount * 3)
        )
    );

    return {
        runId,
        idempotencyKey,
        executedAtIso: new Date().toISOString(),
        executionDurationMs: Math.max(1, Date.now() - startTimeMs),
        seed: input.seed,
        iterations: input.iterations,
        overallBottleneckScore,
        predictedOverallSlaBreachPct: overallSlaBreachPct,
        totalProjectedSpecimens,
        totalThroughputCapacity,
        departmentForecasts,
        hourlyTimeline,
        stabilityAssessments,
        criticalAlerts,
        analyzerStates: effectiveAnalyzers,
    };
}

/**
 * Computes an optimal Cross-Analyzer Fault-Recovery & Specimen Rerouting plan
 * when a primary analyzer fails QC, exhausts reagents, or goes offline.
 */
export function computeCrossAnalyzerFailoverPlan(
    allAnalyzers: AnalyzerTwinNode[],
    faultedAnalyzerId: string,
    faultReason: string,
    additionalPendingSpecimens: number,
    surgeMultiplier: number,
    proposalId: string,
    idempotencyKey: string
): FailoverOptimizationPlan {
    const faultedNode = allAnalyzers.find(
        (a) => a.analyzerId === faultedAnalyzerId
    );
    if (!faultedNode) {
        throw new Error(`Analyzer '${faultedAnalyzerId}' not found in Digital Twin topology.`);
    }

    const totalSpecimensToReroute =
        faultedNode.currentQueueDepth +
        Math.max(0, additionalPendingSpecimens) +
        Math.round(faultedNode.nominalThroughputPerHour * 0.75 * surgeMultiplier);

    // Identify online compatible backup analyzers in the same department
    const candidateBackups = allAnalyzers.filter(
        (node) =>
            node.analyzerId !== faultedNode.analyzerId &&
            (faultedNode.compatibleBackupAnalyzerIds.includes(node.analyzerId) ||
                node.department === faultedNode.department) &&
            (node.status === 'ONLINE' || node.status === 'DEGRADED_QC_WARNING') &&
            node.reagentRemainingTests > 10
    );

    const unmitigatedTatMinutesP90 = Number(
        (
            faultedNode.meanCycleTimeMinutes +
            145 +
            totalSpecimensToReroute * 1.35
        ).toFixed(1)
    );

    if (candidateBackups.length === 0) {
        return {
            proposalId,
            idempotencyKey,
            faultedAnalyzerId: faultedNode.analyzerId,
            faultedAnalyzerName: faultedNode.name,
            department: faultedNode.department,
            faultReason,
            affectedPendingSpecimens: totalSpecimensToReroute,
            unmitigatedTatMinutesP90,
            mitigatedTatMinutesP90: unmitigatedTatMinutesP90,
            estimatedTatSavedMinutes: 0,
            unallocatedSpecimensCount: totalSpecimensToReroute,
            allocations: [],
            clinicalSafetyGate: {
                requiresPathologistSignoff: true,
                crossLotCalibrationCheckRequired: true,
                autoReleasePermitted: false,
                mandatoryChecks: [
                    'No online backup analyzer available in department. Escalate to Reference Lab / Emergency Manual Protocol.',
                    'Hold non-critical routine specimens at 2-8°C stability storage.',
                ],
            },
            status: 'PENDING_APPROVAL',
            createdAtIso: new Date().toISOString(),
        };
    }

    // Score each backup analyzer by spare hourly capacity, low calibration bias delta, and reagent headroom
    const scoredBackups = candidateBackups.map((backup) => {
        const baseHourlyLoad =
            backup.nominalThroughputPerHour * 0.58 * surgeMultiplier +
            backup.currentQueueDepth * 0.5;
        const spareHourlyCapacity = Math.max(
            10,
            backup.nominalThroughputPerHour - baseHourlyLoad
        );
        const calibrationDelta = Math.abs(
            backup.calibrationBiasPct - faultedNode.calibrationBiasPct
        );
        // Weight favors spare capacity and penalizes high calibration bias delta
        const routingWeight =
            spareHourlyCapacity / (1 + calibrationDelta * 0.25);

        return {
            backup,
            baseHourlyLoad,
            spareHourlyCapacity,
            calibrationDelta: Number(calibrationDelta.toFixed(2)),
            routingWeight: Math.max(1, routingWeight),
        };
    });

    const totalWeight = scoredBackups.reduce((s, b) => s + b.routingWeight, 0);
    let remainingToAllocate = totalSpecimensToReroute;
    const allocations: FailoverRouteAllocation[] = [];

    scoredBackups.forEach((entry, index) => {
        const isLast = index === scoredBackups.length - 1;
        const rawShare = isLast
            ? remainingToAllocate
            : Math.round((entry.routingWeight / totalWeight) * totalSpecimensToReroute);

        const cappedByReagent = Math.min(
            rawShare,
            Math.max(0, entry.backup.reagentRemainingTests - 5),
            remainingToAllocate
        );

        remainingToAllocate = Math.max(0, remainingToAllocate - cappedByReagent);

        const utilBefore = Number(
            Math.min(
                0.99,
                entry.baseHourlyLoad / Math.max(1, entry.backup.nominalThroughputPerHour)
            ).toFixed(2)
        );
        const utilAfter = Number(
            Math.min(
                1.25,
                (entry.baseHourlyLoad + cappedByReagent) /
                Math.max(1, entry.backup.nominalThroughputPerHour)
            ).toFixed(2)
        );

        const waitMinutesAfter =
            ((entry.backup.currentQueueDepth + cappedByReagent) /
                Math.max(1, entry.backup.nominalThroughputPerHour)) *
            60 *
            0.55;
        const projectedTatAfter = Number(
            (entry.backup.meanCycleTimeMinutes + 10 + waitMinutesAfter).toFixed(1)
        );

        allocations.push({
            targetAnalyzerId: entry.backup.analyzerId,
            targetAnalyzerName: entry.backup.name,
            allocatedSpecimens: cappedByReagent,
            sharePct:
                totalSpecimensToReroute > 0
                    ? Number(((cappedByReagent / totalSpecimensToReroute) * 100).toFixed(1))
                    : 0,
            projectedUtilizationBefore: utilBefore,
            projectedUtilizationAfter: utilAfter,
            projectedTatMinutesAfter: projectedTatAfter,
            calibrationBiasDeltaPct: entry.calibrationDelta,
            reagentSufficient:
                entry.backup.reagentRemainingTests >= cappedByReagent + 25,
            validationNotice:
                entry.calibrationDelta > 2.0
                    ? `Cross-instrument bias Δ=${entry.calibrationDelta}% exceeds 2.0%; apply slope/intercept correlation factor before pathologist sign-off.`
                    : `Cross-instrument bias Δ=${entry.calibrationDelta}% within ISO 15189 comparability tolerance.`,
        });
    });

    const weightedMitigatedTat =
        allocations.length > 0
            ? allocations.reduce(
                (sum, a) => sum + a.projectedTatMinutesAfter * (a.sharePct / 100),
                0
            )
            : unmitigatedTatMinutesP90;

    const mitigatedTatMinutesP90 = Number(
        Math.max(18, weightedMitigatedTat * 1.15).toFixed(1)
    );
    const estimatedTatSavedMinutes = Number(
        Math.max(0, unmitigatedTatMinutesP90 - mitigatedTatMinutesP90).toFixed(1)
    );

    const requiresCrossLotCheck = allocations.some(
        (a) => a.calibrationBiasDeltaPct > 1.5
    );

    return {
        proposalId,
        idempotencyKey,
        faultedAnalyzerId: faultedNode.analyzerId,
        faultedAnalyzerName: faultedNode.name,
        department: faultedNode.department,
        faultReason,
        affectedPendingSpecimens: totalSpecimensToReroute,
        unmitigatedTatMinutesP90,
        mitigatedTatMinutesP90,
        estimatedTatSavedMinutes,
        unallocatedSpecimensCount: remainingToAllocate,
        allocations,
        clinicalSafetyGate: {
            requiresPathologistSignoff: true,
            crossLotCalibrationCheckRequired: requiresCrossLotCheck,
            autoReleasePermitted: false,
            mandatoryChecks: [
                'Verify Level-1 and Level-2 liquid QC passed within last 8 hours on target backup analyzers.',
                'Confirm barcode rack rerouting manifest at specimen sorting workstation.',
                requiresCrossLotCheck
                    ? 'Execute split-sample comparability check due to inter-analyzer bias delta > 1.5%.'
                    : 'Inter-analyzer comparability verified (< 1.5% bias delta).',
            ],
        },
        status: 'PENDING_APPROVAL',
        createdAtIso: new Date().toISOString(),
    };
}

function theWeight(spareCapacity: number, calibrationDelta: number): number {
    return spareCapacity / (1 + calibrationDelta * 0.25);
}