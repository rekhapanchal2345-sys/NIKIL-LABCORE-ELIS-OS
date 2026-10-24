export interface ErlangCMetrics {
  status: 'STABLE' | 'OVER_CAPACITY_UNSTABLE';
  utilizationRho: number;
  OfferedLoadErlangs: number;
  probabilityOfWaitingPw: number | null;
  expectedQueueLengthLq: number | null;
  expectedWaitTimeMinutesWq: number | null;
  expectedTotalTatMinutesW: number | null;
}

/**
 * Algorithm 1 & 2: Numerically stable Erlang-B and Erlang-C queueing calculation.
 * Uses exact Erlang-B recursion to prevent factorial overflow for any server count c.
 */
export function calculateErlangCQueueMetrics(params: {
  arrivalRatePerHour: number;
  serviceRatePerServerPerHour: number;
  serverCount: number;
}): ErlangCMetrics {
  const { arrivalRatePerHour: lambda, serviceRatePerServerPerHour: mu, serverCount: c } = params;

  if (!Number.isFinite(lambda) || lambda < 0) {
    throw new Error('INVALID_INPUT: arrivalRatePerHour must be finite and >= 0');
  }
  if (!Number.isFinite(mu) || mu <= 0) {
    throw new Error('INVALID_INPUT: serviceRatePerServerPerHour must be > 0');
  }
  if (!Number.isInteger(c) || c < 1) {
    throw new Error('INVALID_INPUT: serverCount must be an integer >= 1');
  }

  if (lambda === 0) {
    return {
      status: 'STABLE',
      utilizationRho: 0,
      OfferedLoadErlangs: 0,
      probabilityOfWaitingPw: 0,
      expectedQueueLengthLq: 0,
      expectedWaitTimeMinutesWq: 0,
      expectedTotalTatMinutesW: 60 / mu,
    };
  }

  const A = lambda / mu; // Offered load in Erlangs
  const rho = A / c;

  if (rho >= 1.0) {
    return {
      status: 'OVER_CAPACITY_UNSTABLE',
      utilizationRho: Number(rho.toFixed(6)),
      OfferedLoadErlangs: Number(A.toFixed(6)),
      probabilityOfWaitingPw: null,
      expectedQueueLengthLq: null,
      expectedWaitTimeMinutesWq: null,
      expectedTotalTatMinutesW: null,
    };
  }

  // Exact stable recursion for Erlang-B: B(k, A) = (A * B(k-1, A)) / (k + A * B(k-1, A))
  let erlangB = 1.0;
  for (let k = 1; k <= c; k++) {
    erlangB = (A * erlangB) / (k + A * erlangB);
  }

  // Exact relation between Erlang-C and Erlang-B:
  // P_W = (c * B(c, A)) / (c - A * (1 - B(c, A)))
  const pw = (c * erlangB) / (c - A * (1 - erlangB));
  const lq = (pw * rho) / (1 - rho);
  const wqHours = lq / lambda; // Little's Law: W_q = L_q / lambda
  const wHours = wqHours + 1 / mu;

  return {
    status: 'STABLE',
    utilizationRho: Number(rho.toFixed(6)),
    OfferedLoadErlangs: Number(A.toFixed(6)),
    probabilityOfWaitingPw: Number(pw.toFixed(6)),
    expectedQueueLengthLq: Number(lq.toFixed(6)),
    expectedWaitTimeMinutesWq: Number((wqHours * 60).toFixed(4)),
    expectedTotalTatMinutesW: Number((wHours * 60).toFixed(4)),
  };
}

/**
 * Algorithm 5: Weibull Reliability & Conditional Median RUL with Minimum Failure-Count Guard.
 */
export function evaluateWeibullReliability(params: {
  currentOperatingHours: number;
  shapeBeta: number;
  scaleEtaHours: number;
  verifiedUncensoredFailureCount: number;
}) {
  const {
    currentOperatingHours: t0,
    shapeBeta: beta,
    scaleEtaHours: eta,
    verifiedUncensoredFailureCount: nFailures,
  } = params;

  if (t0 < 0 || beta <= 0 || eta <= 0) {
    throw new Error('INVALID_WEIBULL_PARAMETERS');
  }

  // Safety Control: Refuse unsupported failure predictions when training data is inadequate
  if (nFailures < 5) {
    return {
      status: 'INSUFFICIENT_FAILURE_DATA' as const,
      reliabilityAtCurrentAge: null,
      instantaneousHazardPerHour: null,
      conditionalMedianRulHours: null,
      advisoryNote: `Weibull RUL prediction suppressed: only ${nFailures} verified failure events recorded (minimum 5 required).`,
    };
  }

  const ratio = t0 / eta;
  const reliability = Math.exp(-Math.pow(ratio, beta));
  const hazard =
    t0 === 0 && beta < 1
      ? Number.POSITIVE_INFINITY
      : (beta / eta) * Math.pow(ratio, beta - 1);
  const conditionalMedianRul =
    eta * Math.pow(Math.pow(ratio, beta) + Math.LN2, 1 / beta) - t0;

  return {
    status: 'VERIFIED_ESTIMATE' as const,
    reliabilityAtCurrentAge: Number(reliability.toFixed(6)),
    instantaneousHazardPerHour: Number(hazard.toFixed(8)),
    conditionalMedianRulHours: Number(Math.max(0, conditionalMedianRul).toFixed(2)),
    advisoryNote:
      'Advisory statistical estimate only; schedule preventive maintenance per manufacturer service manual.',
  };
}

/**
 * Algorithm 6: Arrhenius Specimen Thermal Stability with Missing-Temperature Provenance Guard.
 */
export interface TemperatureIntervalSample {
  startEpochMs: number;
  endEpochMs: number;
  temperatureCelsius: number | null;
}

export function evaluateArrheniusThermalStability(params: {
  analyteCode: string;
  activationEnergyJoulesPerMol: number;
  preExponentialFactorPerHour: number;
  intervals: ReadonlyArray<TemperatureIntervalSample>;
  maxAllowedGapMinutes?: number;
}) {
  const R_GAS_CONSTANT = 8.314462618;
  const maxGapMs = (params.maxAllowedGapMinutes ?? 15) * 60 * 1000;

  if (params.intervals.length === 0) {
    return {
      status: 'MISSING_TEMPERATURE_TELEMETRY' as const,
      estimatedRemainingFraction: null,
      provenanceComplete: false,
      clinicalSafetyNotice:
        'No verified cold-chain temperature telemetry available. Mathematical stability cannot be asserted.',
    };
  }

  let integratedRateConstant = 0;
  let provenanceGapDetected = false;

  for (let i = 0; i < params.intervals.length; i++) {
    const seg = params.intervals[i];
    if (seg.endEpochMs <= seg.startEpochMs) {
      throw new Error('INVALID_TIME_INTERVAL_ORDER');
    }
    if (
      seg.temperatureCelsius === null ||
      !Number.isFinite(seg.temperatureCelsius) ||
      seg.temperatureCelsius < -100 ||
      seg.temperatureCelsius > 70
    ) {
      provenanceGapDetected = true;
      break;
    }
    if (i > 0) {
      const gap = seg.startEpochMs - params.intervals[i - 1].endEpochMs;
      if (gap > maxGapMs) {
        provenanceGapDetected = true;
        break;
      }
    }

    const tempKelvin = seg.temperatureCelsius + 273.15;
    const durationHours = (seg.endEpochMs - seg.startEpochMs) / (1000 * 3600);
    const ratePerHour =
      params.preExponentialFactorPerHour *
      Math.exp(-params.activationEnergyJoulesPerMol / (R_GAS_CONSTANT * tempKelvin));
    integratedRateConstant += ratePerHour * durationHours;
  }

  if (provenanceGapDetected) {
    return {
      status: 'TEMPERATURE_PROVENANCE_GAP' as const,
      estimatedRemainingFraction: null,
      provenanceComplete: false,
      clinicalSafetyNotice:
        'Cold-chain telemetry contains missing or out-of-range intervals. Requires physical specimen inspection and technologist review.',
    };
  }

  const remainingFraction = Math.exp(-integratedRateConstant);

  return {
    status: 'ESTIMATED' as const,
    estimatedRemainingFraction: Number(remainingFraction.toFixed(4)),
    provenanceComplete: true,
    clinicalSafetyNotice:
      'ADVISORY ONLY: Mathematical Arrhenius estimate is not standalone proof of specimen validity or invalidity. Follow laboratory SOP.',
  };
}

/**
 * Algorithm 11: CLSI EP07 (3rd Edition, 2018) Analyzer & Method-Specific HIL Interference Evaluator.
 * Never uses universal thresholds; requires explicit method/analyzer policy lookup.
 */
export interface ClsiEp07Ed3AssayInterferenceRule {
  analyzerModel: string;
  parameterCode: string;
  methodName: string;
  policyVersion: string;
  effectiveDateIso: string;
  hemolysisWarningIndex: number;
  hemolysisRejectIndex: number;
  icterusWarningIndex: number;
  icterusRejectIndex: number;
  lipemiaWarningIndex: number;
  lipemiaRejectIndex: number;
  standardReference: 'CLSI_EP07_ED3_2018';
}

export function evaluateHilInterferenceEp07Ed3(params: {
  analyzerModel: string;
  parameterCode: string;
  measuredHIndex: number;
  measuredIIndex: number;
  measuredLIndex: number;
  approvedRulesRegistry: ReadonlyArray<ClsiEp07Ed3AssayInterferenceRule>;
}) {
  const rule = params.approvedRulesRegistry.find(
    (r) =>
      r.analyzerModel === params.analyzerModel &&
      r.parameterCode === params.parameterCode
  );

  if (!rule) {
    return {
      decision: 'BLOCK_AUTOVERIFICATION_UNVERIFIED_RULE' as const,
      allowAutoverification: false,
      requiredReviewerRole: 'SENIOR_TECHNOLOGIST' as const,
      reason: `No verified CLSI EP07 (3rd Ed.) HIL interference rule configured for ${params.analyzerModel} / ${params.parameterCode}.`,
      ruleProvenance: null,
    };
  }

  const violations: string[] = [];
  let reject = false;

  if (params.measuredHIndex >= rule.hemolysisRejectIndex) {
    reject = true;
    violations.push(
      `Hemolysis Index (${params.measuredHIndex}) >= Reject Limit (${rule.hemolysisRejectIndex})`
    );
  } else if (params.measuredHIndex >= rule.hemolysisWarningIndex) {
    violations.push(
      `Hemolysis Index (${params.measuredHIndex}) >= Warning Limit (${rule.hemolysisWarningIndex})`
    );
  }

  if (params.measuredIIndex >= rule.icterusRejectIndex) {
    reject = true;
    violations.push(
      `Icterus Index (${params.measuredIIndex}) >= Reject Limit (${rule.icterusRejectIndex})`
    );
  } else if (params.measuredIIndex >= rule.icterusWarningIndex) {
    violations.push(
      `Icterus Index (${params.measuredIIndex}) >= Warning Limit (${rule.icterusWarningIndex})`
    );
  }

  if (params.measuredLIndex >= rule.lipemiaRejectIndex) {
    reject = true;
    violations.push(
      `Lipemia Index (${params.measuredLIndex}) >= Reject Limit (${rule.lipemiaRejectIndex})`
    );
  } else if (params.measuredLIndex >= rule.lipemiaWarningIndex) {
    violations.push(
      `Lipemia Index (${params.measuredLIndex}) >= Warning Limit (${rule.lipemiaWarningIndex})`
    );
  }

  if (reject) {
    return {
      decision: 'SPECIMEN_INTERFERENCE_HOLD_FOR_REVIEW' as const,
      allowAutoverification: false,
      requiredReviewerRole: 'PATHOLOGIST' as const,
      reason: violations.join('; '),
      ruleProvenance: {
        standard: rule.standardReference,
        policyVersion: rule.policyVersion,
        methodName: rule.methodName,
      },
    };
  }

  if (violations.length > 0) {
    return {
      decision: 'WARNING_REQUIRES_TECH_REVIEW' as const,
      allowAutoverification: false,
      requiredReviewerRole: 'SENIOR_TECHNOLOGIST' as const,
      reason: violations.join('; '),
      ruleProvenance: {
        standard: rule.standardReference,
        policyVersion: rule.policyVersion,
        methodName: rule.methodName,
      },
    };
  }

  return {
    decision: 'PASS' as const,
    allowAutoverification: true,
    requiredReviewerRole: null,
    reason: 'HIL indices within verified CLSI EP07 (3rd Ed.) method limits.',
    ruleProvenance: {
      standard: rule.standardReference,
      policyVersion: rule.policyVersion,
      methodName: rule.methodName,
    },
  };
}

/**
 * Algorithm 15: CKD-EPI 2021 Race-Free Creatinine eGFR & KDIGO 2024 G-Staging.
 */
export function calculateCkdEpi2021Egfr(params: {
  serumCreatinineMgDl: number;
  ageYears: number;
  biologicalSex: 'FEMALE' | 'MALE';
}) {
  if (params.ageYears < 18) {
    throw new Error(
      'CLINICAL_SAFETY_BLOCK: CKD-EPI 2021 is validated only for adults (age >= 18). Use pediatric CKiD U25 / Schwartz equation with measured height.'
    );
  }
  if (
    !Number.isFinite(params.serumCreatinineMgDl) ||
    params.serumCreatinineMgDl <= 0 ||
    params.serumCreatinineMgDl > 35
  ) {
    throw new Error('INVALID_SERUM_CREATININE_VALUE');
  }

  const isFemale = params.biologicalSex === 'FEMALE';
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const sexMultiplier = isFemale ? 1.012 : 1.0;

  const ratio = params.serumCreatinineMgDl / kappa;
  const egfr =
    142 *
    Math.pow(Math.min(ratio, 1.0), alpha) *
    Math.pow(Math.max(ratio, 1.0), -1.2) *
    Math.pow(0.9938, params.ageYears) *
    sexMultiplier;

  const roundedEgfr = Number(egfr.toFixed(1));
  let kdigoGStage: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5';
  if (roundedEgfr >= 90) kdigoGStage = 'G1';
  else if (roundedEgfr >= 60) kdigoGStage = 'G2';
  else if (roundedEgfr >= 45) kdigoGStage = 'G3a';
  else if (roundedEgfr >= 30) kdigoGStage = 'G3b';
  else if (roundedEgfr >= 15) kdigoGStage = 'G4';
  else kdigoGStage = 'G5';

  return {
    egfrMlMinPer173m2: roundedEgfr,
    kdigoGStage,
    equationReference: 'CKD-EPI 2021 (Inker et al., NEJM 2021; KDIGO 2024)',
    disclaimer:
      'Chronic Kidney Disease staging requires persistence of abnormalities for >= 3 months and correlation with Urine ACR (A1-A3).',
  };
}
