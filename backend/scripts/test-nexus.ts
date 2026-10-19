/**
 * LABCORE OMNISCIENT NEXUS — AUTOMATED VERIFICATION SUITE
 * 
 * Validates mathematical identities, Erlang C queueing, Little's Law,
 * Weibull prognostics, Arrhenius kinetics, Westgard QC, and API RBAC contracts.
 */

import assert from 'assert';
import { NexusMathEngine } from '../api/src/modules/nexus/nexus.math-engine';
import { NexusService } from '../api/src/modules/nexus/nexus.service';
import { NexusController } from '../api/src/modules/nexus/nexus.controller';
import { Response } from 'express';
import prisma from '../api/config/database';

interface MockResponseCapture {
    statusCode: number;
    body: any;
    res: Response;
}

function createMockResponse(): MockResponseCapture {
    const capture: MockResponseCapture = {
        statusCode: 200,
        body: null,
        res: {} as Response,
    };
    capture.res.status = ((code: number) => {
        capture.statusCode = code;
        return capture.res;
    }) as any;
    capture.res.json = ((payload: any) => {
        capture.body = payload;
        return capture.res;
    }) as any;
    return capture;
}

async function runNexusVerificationSuite(): Promise<void> {
    console.log('==============================================================');
    console.log(' LABCORE OMNISCIENT NEXUS — SCIENTIFIC & API VERIFICATION    ');
    console.log('==============================================================');

    let passed = 0;

    // TEST 1: Descriptive Statistics — Known-Answer Test
    {
        // Reference dataset: [2, 4, 4, 4, 5, 5, 7, 9] (n = 8)
        // Mean = 40 / 8 = 5.0
        // Median = (4 + 5) / 2 = 4.5
        // Variance = 32 / 7 = 4.5714...
        // StdDev = sqrt(32/7) = 2.138...
        const data = [2, 4, 4, 4, 5, 5, 7, 9];
        const stats = NexusMathEngine.computeDescriptiveStatistics(data, 'HISTORICAL');

        assert.strictEqual(stats.sampleSize, 8);
        assert.strictEqual(stats.mean, 5.0);
        assert.strictEqual(stats.median, 4.5);
        assert.ok(Math.abs(stats.stdDev - 2.14) < 0.05, `Expected stdDev ~2.14, got ${stats.stdDev}`);
        assert.ok(stats.iqr > 0, 'IQR must be positive');
        assert.strictEqual(stats.outliersCount, 1, 'Value 9 exceeds upper fence 7.75 and is correctly flagged');
        console.log('[PASS] 1. Descriptive Statistics: Known-answer mean, median, variance, and IQR');
        passed++;
    }

    // TEST 2: Robust Statistics & Outlier Diagnostics (Tukey's Fences & MAD)
    {
        // Dataset with clear extreme outlier (100)
        const dataWithOutlier = [10, 11, 10, 12, 11, 10, 12, 10, 11, 100];
        const stats = NexusMathEngine.computeDescriptiveStatistics(dataWithOutlier, 'LIVE');

        assert.strictEqual(stats.sampleSize, 10);
        assert.strictEqual(stats.outliersCount, 1, 'Should detect exactly 1 outlier (100)');
        assert.ok(stats.mad <= 2.0, `MAD should be robust against outlier (got ${stats.mad})`);
        assert.ok(stats.skewness > 1.5, `Skewness should be strongly positive (got ${stats.skewness})`);
        console.log('[PASS] 2. Robust Statistics: MAD and Tukey fence outlier detection');
        passed++;
    }

    // TEST 3: Edge Cases — Empty and Single Element Arrays
    {
        const emptyStats = NexusMathEngine.computeDescriptiveStatistics([], 'HISTORICAL');
        assert.strictEqual(emptyStats.sampleSize, 0);
        assert.strictEqual(emptyStats.mean, 0);
        assert.strictEqual(emptyStats.hasSufficientData, false);

        const singleStats = NexusMathEngine.computeDescriptiveStatistics([42], 'HISTORICAL');
        assert.strictEqual(singleStats.sampleSize, 1);
        assert.strictEqual(singleStats.mean, 42);
        assert.strictEqual(singleStats.stdDev, 0);
        console.log('[PASS] 3. Edge Cases: Empty array and n=1 numerical stability');
        passed++;
    }

    // TEST 4: Erlang C Formula & Saturation Invariants
    {
        // 2 channels, lambda = 80/hr, mu = 50/hr per channel -> offered load a = 1.6, rho = 0.80
        const erlangC = NexusMathEngine.computeErlangCWaitProbability(2, 80, 50);
        assert.ok(erlangC > 0 && erlangC < 1.0, `Erlang C probability must be in (0, 1), got ${erlangC}`);

        // Saturated system boundary: lambda >= c * mu (rho >= 1)
        const saturatedP = NexusMathEngine.computeErlangCWaitProbability(2, 120, 50);
        assert.strictEqual(saturatedP, 1.0, 'Saturated system must return wait probability 1.0');
        console.log('[PASS] 4. Queueing Theory: Erlang-C wait probability & saturation boundary');
        passed++;
    }

    // TEST 5: Little's Law Invariant: L = lambda * W
    {
        const result = NexusMathEngine.evaluateQueueProcess('HEMATOLOGY', 2, 80, 50, 45, 'SIMULATED');
        assert.ok(result.workInProgressL > 0, 'WIP L must be strictly positive');
        assert.strictEqual(result.trafficIntensityRho, 0.8, 'Traffic intensity rho must equal 0.8');

        // Verify Little's Law: L = lambda * W
        const expectedL = (result.arrivalRateLambdaPerHour * (result.meanTotalTatWMinutes / 60));
        assert.ok(
            Math.abs(result.workInProgressL - expectedL) < 0.2,
            `Little's Law conservation: L (${result.workInProgressL}) should match lambda * W (${expectedL})`
        );
        console.log('[PASS] 5. Process Analytics: Little\'s Law conservation proof (L = lambda * W)');
        passed++;
    }

    // TEST 6: Weibull 2-Parameter Reliability & Hazard Rate
    {
        // Mechanical wear-out: eta = 500 hrs, beta = 2.5 (wear-out regime)
        const t0 = NexusMathEngine.computeWeibullReliability(1, 500, 2.5);
        assert.ok(t0.survivalProbabilityPct > 99.9, 'Early life survival should exceed 99.9%');

        const t250 = NexusMathEngine.computeWeibullReliability(250, 500, 2.5);
        const t500 = NexusMathEngine.computeWeibullReliability(500, 500, 2.5);

        // Survival probability must decrease monotonically
        assert.ok(
            t0.survivalProbabilityPct > t250.survivalProbabilityPct &&
            t250.survivalProbabilityPct > t500.survivalProbabilityPct,
            'Weibull survival probability must be strictly monotonically decreasing'
        );

        // Hazard rate for beta > 1 must increase over operating time
        assert.ok(
            t500.instantaneousHazardRateHPerHour > t250.instantaneousHazardRateHPerHour,
            'Wear-out regime hazard rate h(t) must increase with operating hours'
        );
        console.log('[PASS] 6. Fleet Reliability: Weibull survival monotonicity & wear-out hazard rate');
        passed++;
    }

    // TEST 7: Arrhenius Thermal Kinetic Acceleration
    {
        const kRef = 0.05; // per hour at 22°C (295.15 K)
        const EaOverR = 4500; // Kelvin

        const kCold = NexusMathEngine.computeArrheniusRateConstant(kRef, EaOverR, 4.0); // 4°C fridge
        const kRoom = NexusMathEngine.computeArrheniusRateConstant(kRef, EaOverR, 22.0); // 22°C room
        const kWarm = NexusMathEngine.computeArrheniusRateConstant(kRef, EaOverR, 37.0); // 37°C summer

        assert.ok(kCold < kRoom && kRoom < kWarm, 'Degradation rate must accelerate with higher temperature');
        assert.ok(Math.abs(kRoom - kRef) < 1e-4, 'k at 22°C reference must match kRef');
        console.log('[PASS] 7. Chemical Kinetics: Arrhenius thermal degradation acceleration proof');
        passed++;
    }

    // TEST 8: Omniscient Nexus Command Center Live Overview
    {
        const service = new NexusService();
        const overview = await service.getCommandCenterOverview();

        assert.ok(overview.snapshotTimestamp, 'Overview must have snapshot timestamp');
        assert.strictEqual(overview.provenance, 'LIVE');
        assert.ok(overview.operationalKpis.totalSamplesToday.value >= 0);
        assert.ok(overview.operationalKpis.medianTurnaroundTimeMinutes.value > 0);
        assert.ok(overview.departmentQueues.length === 5, 'Should cover all 5 laboratory departments');
        assert.ok(overview.inventoryAlerts.length > 0, 'Should include reagent inventory alerts');
        assert.ok(overview.qualityAlerts.length > 0, 'Should include quality intelligence');
        assert.ok(overview.registeredModels.length >= 3, 'Should list deployed governance models');
        console.log('[PASS] 8. Command Center: Integrated operational KPIs, queues, inventory, and QC');
        passed++;
    }

    // TEST 9: Controlled Autonomy Safety Gate & Pathologist Authority
    {
        const service = new NexusService();

        // Pathologist approval succeeds
        const approved = await service.reviewControlledAutonomyProposal(
            'PROP-NX-01',
            'APPROVED_EXECUTED',
            'USR-PATH-01',
            'PATHOLOGIST',
            'Approved after Level-1/2 QC verification.'
        );
        assert.strictEqual(approved.status, 'APPROVED_EXECUTED');
        assert.strictEqual(approved.reviewedBy, 'USR-PATH-01');

        // Unauthorized role (e.g. BILLING_CLERK) is blocked
        let blocked = false;
        try {
            await service.reviewControlledAutonomyProposal(
                'PROP-NX-01',
                'APPROVED_EXECUTED',
                'USR-CLERK-01',
                'BILLING_CLERK'
            );
        } catch (err: any) {
            blocked = err.message.includes('Unauthorized');
        }
        assert.strictEqual(blocked, true, 'Non-clinical role must be rejected with Unauthorized error');
        console.log('[PASS] 9. Controlled Autonomy: Pathologist sign-off gate & RBAC security enforcement');
        passed++;
    }

    // TEST 10: Non-Mutation Invariant & Zero-PII Leakage
    {
        const preSampleCount = await prisma.sample.count();
        const preOrderCount = await prisma.order.count();

        const controller = new NexusController();
        const capture = createMockResponse();

        await controller.getCommandCenterOverview({} as any, capture.res);

        assert.strictEqual(capture.statusCode, 200);
        assert.strictEqual(capture.body.success, true);

        // Verify no live records were mutated
        const postSampleCount = await prisma.sample.count();
        const postOrderCount = await prisma.order.count();
        assert.strictEqual(preSampleCount, postSampleCount, 'Command center must not mutate live samples');
        assert.strictEqual(preOrderCount, postOrderCount, 'Command center must not mutate live orders');

        // Verify zero PII in overview response
        const jsonStr = JSON.stringify(capture.body);
        assert.strictEqual(jsonStr.includes('passwordHash'), false, 'Never expose passwordHash');
        assert.strictEqual(jsonStr.includes('totpSecretEnc'), false, 'Never expose TOTP secrets');
        console.log('[PASS] 10. Integrity & Privacy: Non-mutation invariant & zero PII leakage verified');
        passed++;
    }

    // TEST 11: CUSUM Drift Detection
    {
        // Series with systematic 1-sigma shift starting at index 5: target = 100, SD = 5
        // Shift values: 100, 101, 99, 100, 101, 106, 107, 106, 108, 107
        const series = [100, 101, 99, 100, 101, 106, 107, 106, 108, 107];
        const cusum = NexusMathEngine.computeCusumDrift(series, 100, 5, 0.5, 3.5);

        assert.strictEqual(cusum.driftDetected, true, 'CUSUM must detect persistent 1-sigma positive shift');
        assert.strictEqual(cusum.driftDirection, 'UPWARD_SYSTEMATIC');
        assert.ok(cusum.driftShiftRunIndex! >= 6, 'Shift index should be detected after index 5');
        console.log('[PASS] 11. Advanced QC: Two-sided CUSUM drift detection & change-point localization');
        passed++;
    }

    // TEST 12: Spectrophotometric HIL Interference Indices
    {
        // Potassium is hyper-sensitive to hemolysis (>50 mg/dL)
        const kHemolysis = NexusMathEngine.computeHilInterference(120, 5, 40, 'K_SERUM');
        assert.strictEqual(kHemolysis.isInterfered, true);
        assert.strictEqual(kHemolysis.interferingFactor, 'HEMOLYSIS');
        assert.strictEqual(kHemolysis.clinicalAction, 'REJECT_COLD_REDRAW');

        // Normal sample passes
        const cleanSample = NexusMathEngine.computeHilInterference(15, 2, 80, 'K_SERUM');
        assert.strictEqual(cleanSample.isInterfered, false);
        assert.strictEqual(cleanSample.clinicalAction, 'CLEAR_VALID');
        console.log('[PASS] 12. Pre-Analytical Integrity: Spectrophotometric HIL index interference verification');
        passed++;
    }

    // TEST 13: Clinical Delta-Check & Kinetic Velocity
    {
        // Serum Creatinine rises from 1.0 to 2.2 over 16h (120% rise -> KDIGO Acute Kidney Injury alert)
        const creatDelta = NexusMathEngine.computeDeltaCheck(2.2, 1.0, 16.0, 'CREAT');
        assert.strictEqual(creatDelta.deltaAbs, 1.2);
        assert.strictEqual(creatDelta.deltaPct, 120.0);
        assert.strictEqual(creatDelta.isCriticalAlert, true);
        assert.ok(creatDelta.clinicalInterpretation.includes('Acute Kidney Injury'));

        // Normal biological delta
        const stableDelta = NexusMathEngine.computeDeltaCheck(1.05, 1.0, 24.0, 'CREAT');
        assert.strictEqual(stableDelta.isCriticalAlert, false);
        console.log('[PASS] 13. Clinical Safety: Longitudinal Delta-check velocity & critical organ injury alerting');
        passed++;
    }

    // TEST 14: Six Sigma Analytical Quality & QGI
    {
        // TEa = 10.0%, Bias = 1.0%, CV = 1.5% -> Sigma = (10 - 1) / 1.5 = 6.0 (World Class 6-Sigma)
        const sixSigma = NexusMathEngine.computeSixSigmaQuality(10.0, 1.0, 1.5);
        assert.strictEqual(sixSigma.sigmaMetric, 6.0);
        assert.strictEqual(sixSigma.qualityRating, 'WORLD_CLASS_6_SIGMA');
        assert.strictEqual(sixSigma.controlsPerRun, 1);
        assert.ok(sixSigma.criticalSystematicErrorSeCrit > 4.0);

        // Substandard method: TEa = 6.0%, Bias = 2.0%, CV = 2.0% -> Sigma = (6 - 2) / 2 = 2.0 (Unacceptable)
        const subSigma = NexusMathEngine.computeSixSigmaQuality(6.0, 2.0, 2.0);
        assert.strictEqual(subSigma.sigmaMetric, 2.0);
        assert.strictEqual(subSigma.qualityRating, 'UNACCEPTABLE_BELOW_3_SIGMA');
        assert.strictEqual(subSigma.controlsPerRun, 4);
        console.log('[PASS] 14. Quality Engineering: Six Sigma analytical metric & QGI root cause evaluation');
        passed++;
    }

    // TEST 15: Kalman Filter State Estimator for Sensor Drift
    {
        // Drifted series starting at target 100 with noisy measurements drifting upward to 105
        const measurements = [100.2, 100.8, 101.4, 102.1, 102.9, 103.5, 104.2, 104.9, 105.3];
        const kalman = NexusMathEngine.evaluateKalmanSensorDrift(measurements, 100.0);
        assert.strictEqual(kalman.filteredValues.length, measurements.length);
        assert.ok(kalman.estimatedDriftRatePerRun > 0.4, 'Drift velocity must be positive');
        assert.ok(kalman.latentCalibrationDriftAbs > 3.0, 'Latent drift must be captured');
        assert.ok(kalman.predictedRunsUntilRecalibration > 0, 'Recalibration horizon must be positive');
        console.log('[PASS] 15. Advanced Mathematics: Kalman filter continuous sensor & electrode drift tracking');
        passed++;
    }

    // TEST 16: Non-Linear Michaelis-Menten Kinetics & Substrate Depletion
    {
        // Normal linear reaction
        const normalKinetics = NexusMathEngine.evaluateEnzymeKinetics(10.0, 100.0, 5.0, 0.045);
        assert.strictEqual(normalKinetics.isSubstrateDepleted, false);
        assert.strictEqual(normalKinetics.dilutedRerunRequired, false);

        // High enzyme activity with depleted substrate (flat slope, velocity near V_max)
        const depletedKinetics = NexusMathEngine.evaluateEnzymeKinetics(200.0, 100.0, 2.0, 0.001);
        assert.strictEqual(depletedKinetics.isSubstrateDepleted, true);
        assert.strictEqual(depletedKinetics.dilutedRerunRequired, true);
        assert.ok(depletedKinetics.recommendedDilutionRatio.includes('1:10 Saline Dilution'));
        console.log('[PASS] 16. Biochemical Kinetics: Michaelis-Menten non-linear substrate depletion detection');
        passed++;
    }

    // TEST 17: Finite-Capacity Open Queueing with Erlang-B Loss Probability
    {
        // 4 arrival ports, lambda = 60/hr, mu = 20/hr per port -> offered load a = 3.0 Erlangs
        const loss = NexusMathEngine.computeErlangBLossProbability(4, 60, 20);
        assert.ok(loss.blockingProbabilityB > 0 && loss.blockingProbabilityB < 1.0);
        assert.ok(loss.carriedTrafficErlangs > 0);
        assert.ok(loss.spilloverRatePerHour >= 0);
        console.log('[PASS] 17. Stochastic Queueing: Erlang-B finite-capacity blocking & spillover dispatch');
        passed++;
    }

    // TEST 18: KDIGO AKI Complete Staging & CKD-EPI 2021 Race-Free eGFR
    {
        // Patient baseline 0.9 mg/dL rises to 3.1 mg/dL (3.44x fold rise -> KDIGO Stage 3)
        const kdigo = NexusMathEngine.evaluateKdigoAkiAndEgfr(3.1, 0.9, 62, 'MALE');
        assert.strictEqual(kdigo.akiStage, 'STAGE_3_AKI_CRITICAL');
        assert.strictEqual(kdigo.creatinineFoldRise, 3.44);
        assert.strictEqual(kdigo.mandatoryNephrologyConsult, true);
        assert.ok(kdigo.baselineEgfrMlkMinPer173m2 > 80.0);
        assert.ok(kdigo.currentEstimatedEgfr < 30.0);
        console.log('[PASS] 18. Clinical Diagnostic AI: KDIGO AKI complete staging & CKD-EPI 2021 race-free eGFR');
        passed++;
    }

    // TEST 19: Arrhenius Time-Temperature Integral (TTI) Cold Chain Integrity
    {
        // Specimen spent 2 hours at 4°C, 3 hours at 25°C, and 1 hour at 35°C
        const segments = [
            { tempCelsius: 4.0, durationHours: 2.0 },
            { tempCelsius: 25.0, durationHours: 3.0 },
            { tempCelsius: 35.0, durationHours: 1.0 },
        ];
        // Potassium Ea/R = 4200 K, kRef = 0.005/hr
        const tti = NexusMathEngine.computeArrheniusTimeTemperatureIntegral(segments, 0.005, 4200);
        assert.ok(tti.cumulativeDegradationOmega > 0);
        assert.ok(tti.remainingViabilityPct < 98.0 && tti.remainingViabilityPct > 70.0);
        assert.strictEqual(tti.isViableForTesting, true);
        assert.ok(tti.equivalentHoursAtReference4C > 6.0, 'Thermal stress accelerates equivalent 4°C aging');
        console.log('[PASS] 19. Bio-Stability Physics: Arrhenius non-isothermal time-temperature integral (TTI)');
        passed++;
    }

    console.log('==============================================================');
    console.log(` ALL ${passed}/19 NEXUS VERIFICATION SUITES PASSED SUCCESSFULLY `);
    console.log('==============================================================');

}

runNexusVerificationSuite()
    .catch((err) => {
        console.error('Nexus Verification Failure:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
