import assert from 'node:assert/strict';
import {
  NexusOperatingModeService,
  InstrumentConnectionSnapshot,
} from '../nexus-operating-mode.service';
import {
  calculateErlangCQueueMetrics,
  evaluateWeibullReliability,
  evaluateArrheniusThermalStability,
  evaluateHilInterferenceEp07Ed3,
  calculateCkdEpi2021Egfr,
  ClsiEp07Ed3AssayInterferenceRule,
} from '../nexus-verified-science.engine';
import {
  assertValidSpecimenTransition,
  computeInstrumentResultIdempotencyHash,
} from '../../samples/specimen-lifecycle-guard';

export function runNexusVerificationSuite(): void {
  // 1. Operating Mode & Telemetry Authenticity Verification
  const modeSvc = new NexusOperatingModeService();
  const orgId = 'ORG-CLINICAL-01';
  assert.equal(modeSvc.getOperatingMode(orgId).mode, 'DEMO_MODE');

  // Unauthorized role cannot activate CONTROLLED_PRODUCTION_MODE
  assert.throws(() =>
    modeSvc.transitionMode({
      organizationId: orgId,
      targetMode: 'CONTROLLED_PRODUCTION_MODE',
      actorUserId: 'USER-TECH-1',
      actorRole: 'TECHNOLOGIST',
      reason: 'Attempt unauthorized prod activation',
      enabledCapabilities: ['ASTM_INGEST'],
      signingSecret: 'test-secret-key',
    })
  );

  // LAB_DIRECTOR can activate SHADOW_MODE
  modeSvc.transitionMode({
    organizationId: orgId,
    targetMode: 'SHADOW_MODE',
    actorUserId: 'USER-DIR-1',
    actorRole: 'LAB_DIRECTOR',
    reason: 'Stage 3 Shadow validation start',
    enabledCapabilities: ['ASTM_SHADOW_READ'],
    signingSecret: 'test-secret-key',
  });

  // Synthetic simulator source MUST be blocked in SHADOW_MODE
  const fakeAnalyzer: InstrumentConnectionSnapshot = {
    analyzerId: 'ROCHE-COBAS-01',
    manufacturer: 'Roche',
    model: 'cobas c 303',
    firmwareVersion: '02-01',
    protocol: 'SIMULATOR',
    socketConnected: true,
    lastVerifiedMessageAtIso: new Date().toISOString(),
    recentNakCount: 0,
    dlqDepth: 0,
    isSyntheticSource: true,
  };
  assert.throws(
    () => modeSvc.evaluateAnalyzerTelemetryState(orgId, fakeAnalyzer),
    /SECURITY_SAFETY_VIOLATION/
  );

  // Disconnected real analyzer reports DISCONNECTED, never LIVE
  const disconnectedReal: InstrumentConnectionSnapshot = {
    ...fakeAnalyzer,
    protocol: 'ASTM_E1381_E1394',
    isSyntheticSource: false,
    socketConnected: false,
  };
  const discStatus = modeSvc.evaluateAnalyzerTelemetryState(orgId, disconnectedReal);
  assert.equal(discStatus.state, 'DISCONNECTED');
  assert.equal(discStatus.allowLiveOperationalMutation, false);

  // 2. Scientific Algorithm Reference Verification: Erlang-C
  // Independent Reference: lambda = 40/h, mu = 25/h, c = 2 => A = 1.6, rho = 0.8
  // P_0 = [1 + 1.6 + (1.6^2 / 2) / (1 - 0.8)]^-1 = [2.6 + 1.28 / 0.2]^-1 = [2.6 + 6.4]^-1 = 1/9
  // P_W = (6.4) * (1/9) = 6.4 / 9 = 0.711111...
  const erlang = calculateErlangCQueueMetrics({
    arrivalRatePerHour: 40,
    serviceRatePerServerPerHour: 25,
    serverCount: 2,
  });
  assert.equal(erlang.status, 'STABLE');
  assert.equal(erlang.utilizationRho, 0.8);
  assert.equal(erlang.probabilityOfWaitingPw, 0.711111);

  // Boundary: rho >= 1 returns OVER_CAPACITY_UNSTABLE safely
  const overloaded = calculateErlangCQueueMetrics({
    arrivalRatePerHour: 60,
    serviceRatePerServerPerHour: 25,
    serverCount: 2,
  });
  assert.equal(overloaded.status, 'OVER_CAPACITY_UNSTABLE');
  assert.equal(overloaded.probabilityOfWaitingPw, null);

  // 3. Weibull RUL Minimum Failure Data Guard
  const weibullBlocked = evaluateWeibullReliability({
    currentOperatingHours: 1200,
    shapeBeta: 2.1,
    scaleEtaHours: 3000,
    verifiedUncensoredFailureCount: 2,
  });
  assert.equal(weibullBlocked.status, 'INSUFFICIENT_FAILURE_DATA');
  assert.equal(weibullBlocked.conditionalMedianRulHours, null);

  // 4. Arrhenius Missing-Temperature Gap Guard
  const arrheniusGap = evaluateArrheniusThermalStability({
    analyteCode: 'ACTH',
    activationEnergyJoulesPerMol: 85000,
    preExponentialFactorPerHour: 1e12,
    intervals: [
      { startEpochMs: 0, endEpochMs: 600_000, temperatureCelsius: 4.0 },
      { startEpochMs: 3_600_000, endEpochMs: 4_200_000, temperatureCelsius: 4.5 }, // 50 min gap > 15 min limit
    ],
  });
  assert.equal(arrheniusGap.status, 'TEMPERATURE_PROVENANCE_GAP');
  assert.equal(arrheniusGap.provenanceComplete, false);

  // 5. CLSI EP07 (3rd Edition) Assay-Specific HIL Guard
  const ep07Registry: ClsiEp07Ed3AssayInterferenceRule[] = [
    {
      analyzerModel: 'Roche cobas c 303',
      parameterCode: 'K',
      methodName: 'Indirect ISE',
      policyVersion: 'SOP-CHEM-EP07-2026.1',
      effectiveDateIso: '2026-01-01T00:00:00Z',
      hemolysisWarningIndex: 20,
      hemolysisRejectIndex: 90,
      icterusWarningIndex: 40,
      icterusRejectIndex: 60,
      lipemiaWarningIndex: 500,
      lipemiaRejectIndex: 1000,
      standardReference: 'CLSI_EP07_ED3_2018',
    },
  ];
  const hilReject = evaluateHilInterferenceEp07Ed3({
    analyzerModel: 'Roche cobas c 303',
    parameterCode: 'K',
    measuredHIndex: 115, // Exceeds Potassium H-index reject threshold of 90
    measuredIIndex: 2,
    measuredLIndex: 10,
    approvedRulesRegistry: ep07Registry,
  });
  assert.equal(hilReject.decision, 'SPECIMEN_INTERFERENCE_HOLD_FOR_REVIEW');
  assert.equal(hilReject.allowAutoverification, false);

  // 6. CKD-EPI 2021 Pediatric Guard & Adult Reference Check
  assert.throws(
    () =>
      calculateCkdEpi2021Egfr({
        serumCreatinineMgDl: 0.8,
        ageYears: 12,
        biologicalSex: 'FEMALE',
      }),
    /CLINICAL_SAFETY_BLOCK/
  );
  const adultEgfr = calculateCkdEpi2021Egfr({
    serumCreatinineMgDl: 0.7,
    ageYears: 50,
    biologicalSex: 'FEMALE',
  });
  // At Scr = kappa (0.7) for 50yo Female: 142 * 1 * 1 * (0.9938^50) * 1.012 = 142 * 0.73274 * 1.012 = 105.3
  assert.equal(adultEgfr.egfrMlMinPer173m2, 105.3);
  assert.equal(adultEgfr.kdigoGStage, 'G1');

  // 7. Specimen Lifecycle & Approval Gate Enforcement
  assert.throws(
    () =>
      assertValidSpecimenTransition({
        specimenBarcode: 'BC-2026-00091',
        fromState: 'TECH_REVIEWED',
        toState: 'RELEASED',
        actorRole: 'TECHNOLOGIST',
        requiresPathologistApproval: true,
      }),
    /CLINICAL_SAFETY_GATE_VIOLATION/
  );

  // 8. Idempotency Hash Determinism
  const h1 = computeInstrumentResultIdempotencyHash({
    organizationId: orgId,
    analyzerId: 'SYSMEX-XN1000-01',
    specimenBarcode: 'BC-2026-00091',
    instrumentTestCode: 'WBC',
    measuredValueRaw: '7.42',
    units: '10^3/uL',
    instrumentCompletionTimestampIso: '2026-10-23T10:15:00Z',
  });
  const h2 = computeInstrumentResultIdempotencyHash({
    organizationId: orgId,
    analyzerId: 'SYSMEX-XN1000-01',
    specimenBarcode: 'BC-2026-00091',
    instrumentTestCode: 'WBC',
    measuredValueRaw: '7.42',
    units: '10^3/uL',
    instrumentCompletionTimestampIso: '2026-10-23T10:15:00Z',
  });
  assert.equal(h1, h2);
}
