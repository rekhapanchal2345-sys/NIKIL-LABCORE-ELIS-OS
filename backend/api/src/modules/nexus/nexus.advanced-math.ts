/**
 * LABCORE OMNISCIENT NEXUS - HIGH-ORDER CLINICAL MATHEMATICS ENGINE
 * Standards:
 * - AACC Patient-Based Real-Time Quality Control (PBRTQC) & Bull's X_B Algorithm
 * - Cembrowski Truncated EWMA & CLSI C24-A4 Statistical Quality Control
 * - CLSI EP07-A2 Interference Testing & Figge-Jabor-Kazda Anion Gap Equations
 * - Sepsis-3 (Singer et al., JAMA 2016) Lab-SOFA & Kinetic Lactate Clearance
 * - Cox Proportional Hazards Survival Analysis for Specimen SLA Breach
 * - Fick's First Law of Diffusion & Magnus-Tetens Vapor Pressure for Reagent Drift
 */

export interface ErythrocyteSample {
  sampleId?: string;
  mcv: number; // fL (Normal ~ 80 - 100 fL)
  mch: number; // pg (Normal ~ 27 - 33 pg)
  mchc: number; // g/dL (Normal ~ 32 - 36 g/dL)
}

export interface ErythrocyteMeans {
  mcv: number;
  mch: number;
  mchc: number;
}

export interface BullsAnalyteResult {
  analyte: 'MCV' | 'MCH' | 'MCHC';
  unit: string;
  previousXB: number;
  currentXB: number;
  batchArithmeticMean: number;
  signedSquareRootSumDi: number;
  rawDeviationSumDi: number;
  targetMean: number;
  lowerLimit3Pct: number;
  upperLimit3Pct: number;
  percentDeviationFromTarget: number;
  isOutOfControl: boolean;
  driftDirection: 'POSITIVE_DRIFT' | 'NEGATIVE_DRIFT' | 'STABLE';
}

export interface BullsMovingAverageOutput {
  batchSize: number;
  validSampleCount: number;
  analytes: {
    mcv: BullsAnalyteResult;
    mch: BullsAnalyteResult;
    mchc: BullsAnalyteResult;
  };
  instrumentDiagnosticHypothesis: string;
  anyOutOfControl: boolean;
  timestamp: string;
}

export interface TruncatedEwmaPoint {
  index: number;
  rawValue: number;
  ewmaValue: number;
  ucl: number;
  lcl: number;
  isBreach: boolean;
}

export interface TruncatedEwmaOutput {
  totalInputCount: number;
  retainedCount: number;
  truncatedLowerBound: number;
  truncatedUpperBound: number;
  truncatedMean: number;
  truncatedStdDev: number;
  lambda: number;
  asymptoticStandardError: number;
  controlLimitWidth3Sigma: number;
  lowerControlLimit: number;
  upperControlLimit: number;
  currentZt: number;
  zScoreEquivalent: number;
  isCalibrationDriftDetected: boolean;
  driftDirection: 'HYPER_CALIBRATION_DRIFT' | 'HYPO_CALIBRATION_DRIFT' | 'IN_CONTROL';
  series: TruncatedEwmaPoint[];
}

export interface ElectrolytePanelInput {
  na: number; // mmol/L
  k: number; // mmol/L
  cl: number; // mmol/L
  hco3: number; // mmol/L
  albumin?: number; // g/dL (Default normal reference: 4.4 g/dL)
  glucose?: number; // mg/dL
  bun?: number; // mg/dL
  measuredOsmolality?: number; // mOsm/kg
  ca?: number; // mg/dL
  hb?: number; // g/dL
  previousResults?: {
    na?: number;
    k?: number;
    cl?: number;
    hco3?: number;
    ca?: number;
    hb?: number;
    glucose?: number;
  };
}

export type AcidBaseClassificationType =
  | 'NORMAL_ACID_BASE'
  | 'PURE_HIGH_ANION_GAP_METABOLIC_ACIDOSIS'
  | 'HYPERCHLOREMIC_NORMAL_ANION_GAP_ACIDOSIS'
  | 'COMBINED_HIGH_AND_NORMAL_AG_ACIDOSIS'
  | 'HIGH_AG_ACIDOSIS_WITH_CONCOMITANT_METABOLIC_ALKALOSIS'
  | 'METABOLIC_ALKALOSIS_OR_RESPIRATORY_COMPENSATION';

export type IvContaminationPatternType =
  | 'NONE'
  | 'NORMAL_SALINE_0_9_PERCENT'
  | 'DEXTROSE_5_PERCENT_D5W'
  | 'K_EDTA_CROSS_CONTAMINATION'
  | 'NON_SPECIFIC_HEMODILUTION';

export interface PhysiologicalPlausibilityOutput {
  uncorrectedAnionGap: number;
  albuminCorrectedAnionGap: number;
  effectiveAlbuminUsedGdL: number;
  deltaAnionGap: number;
  deltaBicarbonate: number;
  deltaDeltaRatio: number | null;
  acidBaseClassification: AcidBaseClassificationType;
  acidBaseClinicalInterpretation: string;
  calculatedOsmolality: number | null;
  osmolalGap: number | null;
  unmeasuredOsmolsFlag: boolean;
  ivContaminationPattern: IvContaminationPatternType;
  ivContaminationProbability: number;
  autoverificationHoldRequired: boolean;
  clinicalAlerts: string[];
}

export interface SepsisPanel {
  platelets: number; // x10^3 / uL
  totalBilirubin: number; // mg/dL
  creatinine: number; // mg/dL
  lactate: number; // mmol/L
  procalcitonin?: number; // ng/mL
  baselineProcalcitonin72h?: number; // ng/mL
}

export interface SepsisKineticEvaluationOutput {
  sofaSubScores: {
    coagulationPlatelets: number;
    liverBilirubin: number;
    renalCreatinine: number;
  };
  totalLabSofaScore: number;
  previousLabSofaScore: number | null;
  deltaSofaScore: number;
  organDysfunctionDetected: boolean;
  lactateKinetics: {
    currentMmolL: number;
    previousMmolL: number | null;
    elapsedHours: number | null;
    clearancePercent: number | null;
    velocityMmolPerHour: number | null;
    isClearanceInadequate: boolean;
    isRapidlyRising: boolean;
  };
  procalcitoninKinetics: {
    currentNgMl: number | null;
    baseline72hNgMl: number | null;
    declinePercent: number | null;
    antibacterialResponseStatus:
      | 'RESOLVING_BACTEREMIA'
      | 'INADEQUATE_SOURCE_CONTROL_OR_RESISTANCE'
      | 'BASELINE_ONLY'
      | 'NOT_MEASURED';
  };
  codeSepsisInterlockTriggered: boolean;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENT_INTERLOCK';
  clinicalActionDirectives: string[];
}

export interface InFlightSpecimenTelemetry {
  sampleId: string;
  barcode: string;
  analyzerId: string;
  department: 'CLINICAL_CHEMISTRY' | 'HEMATOLOGY' | 'COAGULATION' | 'IMMUNOASSAY';
  elapsedMinutes: number;
  slaTargetMinutes: number;
  centrifugeDelayMinutes: number;
  sampleHilIndex: number; // 0 (Clean) to 4 (Severe Hemolysis/Icterus/Lipemia requiring dilution/rerun)
  isIcu: boolean;
}

export interface DepartmentQueueState {
  analyzerId: string;
  queueDepth: number;
  meanProcessingRateTubesPerMin: number;
  parallelAnalyzersAvailable: {
    analyzerId: string;
    name: string;
    currentQueueDepth: number;
    isOnline: boolean;
  }[];
}

export interface TatSlaHazardOutput {
  sampleId: string;
  barcode: string;
  linearPredictorScore: number;
  hazardRatio: number;
  checkpointBreachProbabilities: {
    minute10: number;
    minute20: number;
    minute30: number;
  };
  projectedCompletionMinutes: number;
  overallSlaBreachProbability: number;
  recommendPreemptiveReroute: boolean;
  recommendedTargetAnalyzerId: string | null;
  recommendedTargetAnalyzerName: string | null;
  estimatedMinutesSavedIfRerouted: number;
  operationalRationale: string;
}

export interface ReagentEvaporationOutput {
  analyteCode: string;
  initialVolumeMl: number;
  daysPierced: number;
  carouselTempCelsius: number;
  carouselTempKelvin: number;
  saturationVaporPressurePa: number;
  ambientVaporPressurePa: number;
  massEvaporationRateMgPerDay: number;
  cumulativeVolumeLossMl: number;
  remainingVolumeMl: number;
  concentrationFactorPhi: number;
  effectiveConcentrationShiftPct: number;
  clsiAllowableTotalErrorPct: number;
  exceedsClsiTeaLimit: boolean;
  estimatedRemainingHoursUntilTeaBreach: number;
  qcRecommendation: string;
}

// ============================================================================
// NUMERICAL SAFETY HELPERS
// ============================================================================

function safeNum(val: unknown, fallback = 0): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    return fallback;
  }
  return val;
}

function roundTo(val: number, decimals = 4): number {
  const safe = safeNum(val, 0);
  const factor = Math.pow(10, decimals);
  return Math.round((safe + Number.EPSILON) * factor) / factor;
}

function signum(val: number): number {
  if (val > 0) return 1;
  if (val < 0) return -1;
  return 0;
}

function computeQuantileSorted(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const clampedP = Math.max(0, Math.min(1, p));
  const pos = (sorted.length - 1) * clampedP;
  const base = Math.floor(pos);
  const rest = pos - base;
  const nextVal = sorted[base + 1] !== undefined ? sorted[base + 1] : sorted[base];
  return sorted[base] + rest * (nextVal - sorted[base]);
}

// ============================================================================
// 1A. AACC / BULL'S MOVING AVERAGE (X_B) FOR HEMATOLOGY
// ============================================================================

export function computeBullsMovingAverage(
  batch20: ErythrocyteSample[],
  previousXB: ErythrocyteMeans = { mcv: 89.5, mch: 30.2, mchc: 33.8 },
  targetMeans: ErythrocyteMeans = { mcv: 89.5, mch: 30.2, mchc: 33.8 }
): BullsMovingAverageOutput {
  const validSamples = (Array.isArray(batch20) ? batch20 : []).filter(
    (s) =>
      s &&
      Number.isFinite(s.mcv) &&
      s.mcv > 30 &&
      s.mcv < 160 &&
      Number.isFinite(s.mch) &&
      s.mch > 10 &&
      s.mch < 60 &&
      Number.isFinite(s.mchc) &&
      s.mchc > 20 &&
      s.mchc < 45
  );

  const evaluateParameter = (
    analyte: 'MCV' | 'MCH' | 'MCHC',
    unit: string,
    extract: (s: ErythrocyteSample) => number,
    prevVal: number,
    targetVal: number
  ): BullsAnalyteResult => {
    const safePrev = safeNum(prevVal, targetVal);
    const safeTarget = safeNum(targetVal, 1);

    if (validSamples.length === 0) {
      return {
        analyte,
        unit,
        previousXB: roundTo(safePrev, 3),
        currentXB: roundTo(safePrev, 3),
        batchArithmeticMean: roundTo(safePrev, 3),
        signedSquareRootSumDi: 0,
        rawDeviationSumDi: 0,
        targetMean: roundTo(safeTarget, 3),
        lowerLimit3Pct: roundTo(safeTarget * 0.97, 3),
        upperLimit3Pct: roundTo(safeTarget * 1.03, 3),
        percentDeviationFromTarget: roundTo(((safePrev - safeTarget) / safeTarget) * 100, 3),
        isOutOfControl: Math.abs((safePrev - safeTarget) / safeTarget) > 0.03,
        driftDirection: 'STABLE',
      };
    }

    // Normalize sum to 20-sample equivalent if partial batch is passed
    const scaleFactor = 20 / validSamples.length;
    let rawSumDiff = 0;
    let bullRootDiffSum = 0;
    let rawSumValues = 0;

    for (const sample of validSamples) {
      const xij = extract(sample);
      const diff = xij - safePrev;
      rawSumValues += xij;
      rawSumDiff += diff;
      bullRootDiffSum += signum(diff) * Math.sqrt(Math.abs(diff));
    }

    const scaledDi = rawSumDiff * scaleFactor;
    const stepAdjustment = (signum(scaledDi) * Math.sqrt(Math.abs(scaledDi))) / 20;
    const currentXB = safePrev + stepAdjustment;

    const batchArithmeticMean = rawSumValues / validSamples.length;
    const lowerLimit3Pct = safeTarget * 0.97;
    const upperLimit3Pct = safeTarget * 1.03;
    const pctDeviation = ((currentXB - safeTarget) / safeTarget) * 100;
    const isOutOfControl = currentXB < lowerLimit3Pct || currentXB > upperLimit3Pct;

    let driftDirection: 'POSITIVE_DRIFT' | 'NEGATIVE_DRIFT' | 'STABLE' = 'STABLE';
    if (pctDeviation > 1.5) driftDirection = 'POSITIVE_DRIFT';
    else if (pctDeviation < -1.5) driftDirection = 'NEGATIVE_DRIFT';

    return {
      analyte,
      unit,
      previousXB: roundTo(safePrev, 3),
      currentXB: roundTo(currentXB, 3),
      batchArithmeticMean: roundTo(batchArithmeticMean, 3),
      signedSquareRootSumDi: roundTo(bullRootDiffSum * scaleFactor, 4),
      rawDeviationSumDi: roundTo(scaledDi, 4),
      targetMean: roundTo(safeTarget, 3),
      lowerLimit3Pct: roundTo(lowerLimit3Pct, 3),
      upperLimit3Pct: roundTo(upperLimit3Pct, 3),
      percentDeviationFromTarget: roundTo(pctDeviation, 3),
      isOutOfControl,
      driftDirection,
    };
  };

  const mcvRes = evaluateParameter('MCV', 'fL', (s) => s.mcv, previousXB.mcv, targetMeans.mcv);
  const mchRes = evaluateParameter('MCH', 'pg', (s) => s.mch, previousXB.mch, targetMeans.mch);
  const mchcRes = evaluateParameter('MCHC', 'g/dL', (s) => s.mchc, previousXB.mchc, targetMeans.mchc);

  let hypothesis = 'Erythrocyte indices stable within CLSI C24-A4 +/-3% Bull X_B corridor.';
  if (mcvRes.isOutOfControl && mchcRes.isOutOfControl) {
    if (mcvRes.driftDirection === 'POSITIVE_DRIFT' && mchcRes.driftDirection === 'NEGATIVE_DRIFT') {
      hypothesis =
        'ALERT: Positive MCV shift with reciprocal MCHC drop detected. Suspect hypotonic diluent contamination, aperture impedance drift, or sheath fluid temperature shift.';
    } else if (mcvRes.driftDirection === 'NEGATIVE_DRIFT' && mchcRes.driftDirection === 'POSITIVE_DRIFT') {
      hypothesis =
        'ALERT: Negative MCV shift with elevated MCHC (>36 g/dL) detected. Suspect hypertonic diluent lot variance or RBC aspiration partial micro-clot.';
    } else {
      hypothesis =
        'ALERT: Simultaneous MCV and MCHC Bull X_B breach. Suspect hemoglobinometer photometric lamp drift or lysis reagent degradation.';
    }
  } else if (mchcRes.isOutOfControl) {
    hypothesis =
      'ALERT: Isolated MCHC X_B violation. Inspect cyanmethemoglobin/SLS-Hb optical flow cell and RBC/Hb dilution ratio calibration.';
  } else if (mcvRes.isOutOfControl) {
    hypothesis =
      'ALERT: Isolated MCV X_B violation. Verify RBC aperture current, hydrodynamic focusing pressure, and latex particle sizing calibration.';
  }

  return {
    batchSize: 20,
    validSampleCount: validSamples.length,
    analytes: {
      mcv: mcvRes,
      mch: mchRes,
      mchc: mchcRes,
    },
    instrumentDiagnosticHypothesis: hypothesis,
    anyOutOfControl: mcvRes.isOutOfControl || mchRes.isOutOfControl || mchcRes.isOutOfControl,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// 1B. CEMBROWSKI TRUNCATED EWMA FOR CLINICAL CHEMISTRY
// ============================================================================

export function computeTruncatedEwma(
  values: number[],
  lambda = 0.08,
  lowerPercentile = 0.05,
  upperPercentile = 0.95,
  referenceTargetMean?: number,
  referenceTargetSd?: number
): TruncatedEwmaOutput {
  const cleanValues = (Array.isArray(values) ? values : []).filter((v) => Number.isFinite(v));
  const safeLambda = Math.max(0.01, Math.min(0.5, safeNum(lambda, 0.08)));

  if (cleanValues.length === 0) {
    const fallbackMean = safeNum(referenceTargetMean, 0);
    return {
      totalInputCount: 0,
      retainedCount: 0,
      truncatedLowerBound: 0,
      truncatedUpperBound: 0,
      truncatedMean: fallbackMean,
      truncatedStdDev: 0,
      lambda: safeLambda,
      asymptoticStandardError: 0,
      controlLimitWidth3Sigma: 0,
      lowerControlLimit: fallbackMean,
      upperControlLimit: fallbackMean,
      currentZt: fallbackMean,
      zScoreEquivalent: 0,
      isCalibrationDriftDetected: false,
      driftDirection: 'IN_CONTROL',
      series: [],
    };
  }

  const sorted = [...cleanValues].sort((a, b) => a - b);
  const qLow = computeQuantileSorted(sorted, lowerPercentile);
  const qHigh = computeQuantileSorted(sorted, upperPercentile);

  const retained = cleanValues.filter((v) => v >= qLow && v <= qHigh);
  const workingSet = retained.length > 0 ? retained : cleanValues;

  const n = workingSet.length;
  const truncatedMean = workingSet.reduce((acc, v) => acc + v, 0) / n;

  let varianceSum = 0;
  for (const val of workingSet) {
    varianceSum += (val - truncatedMean) ** 2;
  }
  const sampleStdDev = n > 1 ? Math.sqrt(varianceSum / (n - 1)) : 0;

  const centerLine = referenceTargetMean !== undefined ? safeNum(referenceTargetMean, truncatedMean) : truncatedMean;
  const sigma = referenceTargetSd !== undefined && referenceTargetSd > 0 ? referenceTargetSd : Math.max(sampleStdDev, 1e-6);

  const ewmaFactor = Math.sqrt(safeLambda / (2 - safeLambda));
  const asymptoticSe = sigma * ewmaFactor;
  const controlWidth = 3 * asymptoticSe;
  const ucl = centerLine + controlWidth;
  const lcl = centerLine - controlWidth;

  let zt = centerLine;
  const series: TruncatedEwmaPoint[] = [];

  for (let i = 0; i < workingSet.length; i++) {
    const xt = workingSet[i];
    zt = safeLambda * xt + (1 - safeLambda) * zt;
    const isBreach = zt > ucl || zt < lcl;
    series.push({
      index: i + 1,
      rawValue: roundTo(xt, 3),
      ewmaValue: roundTo(zt, 4),
      ucl: roundTo(ucl, 4),
      lcl: roundTo(lcl, 4),
      isBreach,
    });
  }

  const zScoreEquivalent = asymptoticSe > 0 ? (zt - centerLine) / asymptoticSe : 0;
  const isCalibrationDriftDetected = zt > ucl || zt < lcl;

  let driftDirection: 'HYPER_CALIBRATION_DRIFT' | 'HYPO_CALIBRATION_DRIFT' | 'IN_CONTROL' = 'IN_CONTROL';
  if (zt > ucl) driftDirection = 'HYPER_CALIBRATION_DRIFT';
  else if (zt < lcl) driftDirection = 'HYPO_CALIBRATION_DRIFT';

  return {
    totalInputCount: cleanValues.length,
    retainedCount: workingSet.length,
    truncatedLowerBound: roundTo(qLow, 3),
    truncatedUpperBound: roundTo(qHigh, 3),
    truncatedMean: roundTo(truncatedMean, 4),
    truncatedStdDev: roundTo(sampleStdDev, 4),
    lambda: safeLambda,
    asymptoticStandardError: roundTo(asymptoticSe, 4),
    controlLimitWidth3Sigma: roundTo(controlWidth, 4),
    lowerControlLimit: roundTo(lcl, 4),
    upperControlLimit: roundTo(ucl, 4),
    currentZt: roundTo(zt, 4),
    zScoreEquivalent: roundTo(zScoreEquivalent, 3),
    isCalibrationDriftDetected,
    driftDirection,
    series,
  };
}

// ============================================================================
// 2. MULTI-ANALYTE PHYSIOLOGICAL CROSS-PLAUSIBILITY & IV FLUID SHIELD
// ============================================================================

export function evaluatePhysiologicalPlausibility(
  electrolytes: ElectrolytePanelInput
): PhysiologicalPlausibilityOutput {
  const na = safeNum(electrolytes.na, 140);
  const k = safeNum(electrolytes.k, 4.0);
  const cl = safeNum(electrolytes.cl, 104);
  const hco3 = safeNum(electrolytes.hco3, 24);
  const albumin =
    electrolytes.albumin !== undefined && Number.isFinite(electrolytes.albumin) && electrolytes.albumin > 0
      ? electrolytes.albumin
      : 4.4;

  const alerts: string[] = [];

  const uncorrectedAnionGap = na - (cl + hco3);
  const albuminCorrectedAnionGap = uncorrectedAnionGap + 2.5 * (4.4 - albumin);

  const deltaAG = albuminCorrectedAnionGap - 12;
  const deltaHCO3 = 24 - hco3;
  let deltaDeltaRatio: number | null = null;
  let acidBaseClassification: AcidBaseClassificationType = 'NORMAL_ACID_BASE';
  let acidBaseInterpretation = 'Electrolyte acid-base balance and Figge-corrected anion gap within physiological limits.';

  if (Math.abs(deltaHCO3) >= 1.0 || albuminCorrectedAnionGap > 14) {
    if (Math.abs(deltaHCO3) >= 0.5) {
      deltaDeltaRatio = roundTo(deltaAG / deltaHCO3, 3);
    }

    if (albuminCorrectedAnionGap <= 12 && hco3 < 22) {
      acidBaseClassification = 'HYPERCHLOREMIC_NORMAL_ANION_GAP_ACIDOSIS';
      acidBaseInterpretation =
        'Normal Anion Gap (Hyperchloremic) Metabolic Acidosis (NAGMA). Consider GI bicarbonate loss, renal tubular acidosis, or 0.9% NaCl resuscitation.';
      alerts.push(acidBaseInterpretation);
    } else if (albuminCorrectedAnionGap > 12) {
      if (deltaDeltaRatio !== null) {
        if (deltaDeltaRatio < 0.4 && hco3 < 22) {
          acidBaseClassification = 'HYPERCHLOREMIC_NORMAL_ANION_GAP_ACIDOSIS';
          acidBaseInterpretation = `Delta Ratio (${deltaDeltaRatio}) < 0.4: Hyperchloremic Normal Anion Gap Acidosis dominating.`;
        } else if (deltaDeltaRatio >= 0.4 && deltaDeltaRatio < 0.8) {
          acidBaseClassification = 'COMBINED_HIGH_AND_NORMAL_AG_ACIDOSIS';
          acidBaseInterpretation = `Delta Ratio (${deltaDeltaRatio}) between 0.4 and 0.8: Combined High Anion Gap + Normal Anion Gap Metabolic Acidosis.`;
          alerts.push(acidBaseInterpretation);
        } else if (deltaDeltaRatio >= 0.8 && deltaDeltaRatio <= 2.0) {
          acidBaseClassification = 'PURE_HIGH_ANION_GAP_METABOLIC_ACIDOSIS';
          acidBaseInterpretation = `Delta Ratio (${deltaDeltaRatio}) between 0.8 and 2.0: Pure High Anion Gap Metabolic Acidosis (Lactic acidosis, Ketoacidosis, Uremia, or Toxic Alcohols).`;
          alerts.push(acidBaseInterpretation);
        } else if (deltaDeltaRatio > 2.0 || hco3 >= 24) {
          acidBaseClassification = 'HIGH_AG_ACIDOSIS_WITH_CONCOMITANT_METABOLIC_ALKALOSIS';
          acidBaseInterpretation = `Delta Ratio (${deltaDeltaRatio ?? '>2.0'}) > 2.0: High Anion Gap Metabolic Acidosis with concomitant Metabolic Alkalosis (e.g., emesis/NG suction/diuretics) or chronic compensated respiratory acidosis.`;
          alerts.push(acidBaseInterpretation);
        }
      } else {
        acidBaseClassification = 'HIGH_AG_ACIDOSIS_WITH_CONCOMITANT_METABOLIC_ALKALOSIS';
        acidBaseInterpretation =
          'Elevated Corrected Anion Gap (>12 mmol/L) without corresponding HCO3 drop: Occult High AG Metabolic Acidosis masked by concomitant Metabolic Alkalosis.';
        alerts.push(acidBaseInterpretation);
      }
    } else if (hco3 > 28) {
      acidBaseClassification = 'METABOLIC_ALKALOSIS_OR_RESPIRATORY_COMPENSATION';
      acidBaseInterpretation = 'Elevated Bicarbonate (>28 mmol/L): Primary Metabolic Alkalosis or compensated respiratory acidosis.';
    }
  }

  if (uncorrectedAnionGap < 2) {
    alerts.push(
      `CRITICAL ANALYTICAL ANOMALY: Negative or ultra-narrow Anion Gap (${roundTo(uncorrectedAnionGap, 1)} mmol/L). Suspect severe hypoalbuminemia, IgG paraproteinemia (multiple myeloma cationic shift), bromide/iodide interference, or severe hyperlipidemia.`
    );
  }

  let calculatedOsmolality: number | null = null;
  let osmolalGap: number | null = null;
  let unmeasuredOsmolsFlag = false;

  if (
    electrolytes.glucose !== undefined &&
    Number.isFinite(electrolytes.glucose) &&
    electrolytes.bun !== undefined &&
    Number.isFinite(electrolytes.bun)
  ) {
    calculatedOsmolality = roundTo(2 * na + electrolytes.glucose / 18 + electrolytes.bun / 2.8, 2);
    if (electrolytes.measuredOsmolality !== undefined && Number.isFinite(electrolytes.measuredOsmolality)) {
      osmolalGap = roundTo(electrolytes.measuredOsmolality - calculatedOsmolality, 2);
      if (osmolalGap > 10) {
        unmeasuredOsmolsFlag = true;
        alerts.push(
          `CRITICAL OSMOLAL GAP (${osmolalGap} mOsm/kg > 10): Unmeasured osmols present. Evaluate immediately for toxic alcohol ingestion (methanol, ethylene glycol, isopropanol), ethanol, mannitol, or propylene glycol infusion.`
        );
      }
    }
  }

  let ivPattern: IvContaminationPatternType = 'NONE';
  let ivProbability = 0;

  const prev = electrolytes.previousResults;
  const kDropPct = prev?.k && prev.k > 0 ? ((prev.k - k) / prev.k) * 100 : 0;
  const caDropPct =
    prev?.ca && prev.ca > 0 && electrolytes.ca !== undefined ? ((prev.ca - electrolytes.ca) / prev.ca) * 100 : 0;
  const hbDropPct =
    prev?.hb && prev.hb > 0 && electrolytes.hb !== undefined ? ((prev.hb - electrolytes.hb) / prev.hb) * 100 : 0;
  const naDropPct = prev?.na && prev.na > 0 ? ((prev.na - na) / prev.na) * 100 : 0;
  const clDropPct = prev?.cl && prev.cl > 0 ? ((prev.cl - cl) / prev.cl) * 100 : 0;

  if (k >= 8.0 && electrolytes.ca !== undefined && electrolytes.ca < 5.5) {
    ivPattern = 'K_EDTA_CROSS_CONTAMINATION';
    ivProbability = 0.96;
    alerts.push(
      `PRE-ANALYTICAL INTERLOCK: Extreme Hyperkalemia (K=${k} mmol/L) with concomitant Severe Hypocalcemia (Ca=${electrolytes.ca} mg/dL). Classic K3-EDTA lavender-top order-of-draw carryover or tube decanting. Reject specimen.`
    );
  } else if (
    electrolytes.glucose !== undefined &&
    electrolytes.glucose >= 400 &&
    ((na < 122 && cl < 88) || (naDropPct >= 25 && clDropPct >= 25))
  ) {
    ivPattern = 'DEXTROSE_5_PERCENT_D5W';
    ivProbability = 0.94;
    alerts.push(
      `PRE-ANALYTICAL IV CONTAMINATION (D5W): Extreme glucose spike (${electrolytes.glucose} mg/dL) with proportional dilutional drop in Na (${na} mmol/L) and Cl (${cl} mmol/L). Specimen drawn proximal to 5% Dextrose infusion cannula.`
    );
  } else if (
    na > 155 &&
    cl > 120 &&
    (uncorrectedAnionGap < 6 || k < 3.0 || kDropPct >= 20 || caDropPct >= 20 || hbDropPct >= 20)
  ) {
    ivPattern = 'NORMAL_SALINE_0_9_PERCENT';
    ivProbability = 0.91;
    alerts.push(
      `PRE-ANALYTICAL IV CONTAMINATION (0.9% NaCl): Hypernatremia (Na=${na} mmol/L) & severe Hyperchloremia (Cl=${cl} mmol/L, equal 154 mmol/L isotonic ratio) with dilutional K/Ca/Hb suppression. Specimen drawn downstream of Normal Saline IV line.`
    );
  }

  const autoverificationHoldRequired =
    ivPattern !== 'NONE' || unmeasuredOsmolsFlag || uncorrectedAnionGap < 2 || albuminCorrectedAnionGap > 20;

  return {
    uncorrectedAnionGap: roundTo(uncorrectedAnionGap, 2),
    albuminCorrectedAnionGap: roundTo(albuminCorrectedAnionGap, 2),
    effectiveAlbuminUsedGdL: roundTo(albumin, 2),
    deltaAnionGap: roundTo(deltaAG, 2),
    deltaBicarbonate: roundTo(deltaHCO3, 2),
    deltaDeltaRatio,
    acidBaseClassification,
    acidBaseClinicalInterpretation: acidBaseInterpretation,
    calculatedOsmolality,
    osmolalGap,
    unmeasuredOsmolsFlag,
    ivContaminationPattern: ivPattern,
    ivContaminationProbability: roundTo(ivProbability, 3),
    autoverificationHoldRequired,
    clinicalAlerts: alerts,
  };
}

// ============================================================================
// 3. SEPSIS-3 (LAB-SOFA) & KINETIC LACTATE CLEARANCE VELOCITY ENGINE
// ============================================================================

function computeCoagulationSofa(platelets: number): number {
  const plt = safeNum(platelets, 200);
  if (plt >= 150) return 0;
  if (plt >= 100) return 1;
  if (plt >= 50) return 2;
  if (plt >= 20) return 3;
  return 4;
}

function computeLiverSofa(bilirubinMgDl: number): number {
  const bili = safeNum(bilirubinMgDl, 0.8);
  if (bili < 1.2) return 0;
  if (bili <= 1.9) return 1;
  if (bili <= 5.9) return 2;
  if (bili <= 11.9) return 3;
  return 4;
}

function computeRenalSofa(creatinineMgDl: number): number {
  const cr = safeNum(creatinineMgDl, 0.9);
  if (cr < 1.2) return 0;
  if (cr <= 1.9) return 1;
  if (cr <= 3.4) return 2;
  if (cr <= 4.9) return 3;
  return 4;
}

export function evaluateSepsisSofaAndLactateClearance(
  current: SepsisPanel,
  previous?: SepsisPanel,
  elapsedHours?: number
): SepsisKineticEvaluationOutput {
  const coagScore = computeCoagulationSofa(current.platelets);
  const liverScore = computeLiverSofa(current.totalBilirubin);
  const renalScore = computeRenalSofa(current.creatinine);
  const totalLabSofaScore = coagScore + liverScore + renalScore;

  let previousLabSofaScore: number | null = null;
  let deltaSofaScore = 0;

  if (previous) {
    previousLabSofaScore =
      computeCoagulationSofa(previous.platelets) +
      computeLiverSofa(previous.totalBilirubin) +
      computeRenalSofa(previous.creatinine);
    deltaSofaScore = totalLabSofaScore - previousLabSofaScore;
  }

  const currentLactate = safeNum(current.lactate, 1.0);
  let prevLactate: number | null = null;
  let clearancePercent: number | null = null;
  let velocityMmolPerHour: number | null = null;
  let isClearanceInadequate = false;
  let isRapidlyRising = false;

  const validElapsedHrs =
    elapsedHours !== undefined && Number.isFinite(elapsedHours) && elapsedHours > 0 ? elapsedHours : null;

  if (previous && Number.isFinite(previous.lactate) && previous.lactate > 0) {
    prevLactate = previous.lactate;
    clearancePercent = roundTo(((prevLactate - currentLactate) / prevLactate) * 100, 2);

    if (validElapsedHrs !== null) {
      velocityMmolPerHour = roundTo((currentLactate - prevLactate) / validElapsedHrs, 3);
      const normalized2hClearance = (clearancePercent / validElapsedHrs) * 2;
      if ((prevLactate >= 2.0 || currentLactate >= 2.0) && normalized2hClearance < 10) {
        isClearanceInadequate = true;
      }
      if (velocityMmolPerHour > 0.5) {
        isRapidlyRising = true;
      }
    } else if ((prevLactate >= 2.0 || currentLactate >= 2.0) && clearancePercent < 10) {
      isClearanceInadequate = true;
    }
  }

  const currentPct =
    current.procalcitonin !== undefined && Number.isFinite(current.procalcitonin) ? current.procalcitonin : null;
  const baselinePct =
    current.baselineProcalcitonin72h !== undefined && Number.isFinite(current.baselineProcalcitonin72h)
      ? current.baselineProcalcitonin72h
      : previous?.procalcitonin !== undefined && Number.isFinite(previous.procalcitonin)
      ? previous.procalcitonin
      : null;

  let pctDeclinePercent: number | null = null;
  let pctStatus:
    | 'RESOLVING_BACTEREMIA'
    | 'INADEQUATE_SOURCE_CONTROL_OR_RESISTANCE'
    | 'BASELINE_ONLY'
    | 'NOT_MEASURED' = 'NOT_MEASURED';

  if (currentPct !== null && baselinePct !== null && baselinePct > 0) {
    pctDeclinePercent = roundTo(((baselinePct - currentPct) / baselinePct) * 100, 2);
    if (pctDeclinePercent >= 80) {
      pctStatus = 'RESOLVING_BACTEREMIA';
    } else {
      pctStatus = 'INADEQUATE_SOURCE_CONTROL_OR_RESISTANCE';
    }
  } else if (currentPct !== null) {
    pctStatus = 'BASELINE_ONLY';
  }

  const directives: string[] = [];
  const codeSepsisInterlockTriggered =
    isClearanceInadequate ||
    isRapidlyRising ||
    currentLactate >= 4.0 ||
    deltaSofaScore >= 2 ||
    totalLabSofaScore >= 6;

  if (isRapidlyRising && velocityMmolPerHour !== null) {
    directives.push(
      `EMERGENT CODE SEPSIS INTERLOCK: Kinetic lactate rising at +${velocityMmolPerHour} mmol/L/hr (exceeds +0.5 mmol/L/hr threshold). Tissue hypoperfusion accelerating.`
    );
  }
  if (isClearanceInadequate && clearancePercent !== null) {
    directives.push(
      `EMERGENT CODE SEPSIS INTERLOCK: Kinetic Lactate Clearance is ${clearancePercent}% (<10% target over 2h window). Re-evaluate hemodynamic resuscitation and vasopressor titration.`
    );
  }
  if (deltaSofaScore >= 2) {
    directives.push(
      `SEPSIS-3 ORGAN FAILURE PROGRESSION: Acute Lab-SOFA increase of +${deltaSofaScore} points (Total Lab-SOFA: ${totalLabSofaScore}/12).`
    );
  }
  if (pctStatus === 'RESOLVING_BACTEREMIA' && pctDeclinePercent !== null) {
    directives.push(
      `ANTIMICROBIAL STEWARDSHIP: Procalcitonin declined by ${pctDeclinePercent}% (>80% at 72h). Indicates resolving bacteremia and effective source control.`
    );
  } else if (pctStatus === 'INADEQUATE_SOURCE_CONTROL_OR_RESISTANCE' && pctDeclinePercent !== null) {
    directives.push(
      `PCT KINETIC WARNING: Procalcitonin decline is only ${pctDeclinePercent}% (<80% target). Evaluate for resistant pathogen or undrained infectious focus.`
    );
  }

  if (directives.length === 0) {
    directives.push('Organ function sub-scores and lactate kinetics within stable clinical thresholds.');
  }

  let severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENT_INTERLOCK' = 'INFO';
  if (codeSepsisInterlockTriggered) {
    severity = 'EMERGENT_INTERLOCK';
  } else if (totalLabSofaScore >= 2 || currentLactate >= 2.0) {
    severity = 'CRITICAL';
  } else if (totalLabSofaScore >= 1 || pctStatus === 'INADEQUATE_SOURCE_CONTROL_OR_RESISTANCE') {
    severity = 'WARNING';
  }

  return {
    sofaSubScores: {
      coagulationPlatelets: coagScore,
      liverBilirubin: liverScore,
      renalCreatinine: renalScore,
    },
    totalLabSofaScore,
    previousLabSofaScore,
    deltaSofaScore,
    organDysfunctionDetected: deltaSofaScore >= 2 || totalLabSofaScore >= 2,
    lactateKinetics: {
      currentMmolL: roundTo(currentLactate, 2),
      previousMmolL: prevLactate !== null ? roundTo(prevLactate, 2) : null,
      elapsedHours: validElapsedHrs,
      clearancePercent,
      velocityMmolPerHour,
      isClearanceInadequate,
      isRapidlyRising,
    },
    procalcitoninKinetics: {
      currentNgMl: currentPct,
      baseline72hNgMl: baselinePct,
      declinePercent: pctDeclinePercent,
      antibacterialResponseStatus: pctStatus,
    },
    codeSepsisInterlockTriggered,
    severity,
    clinicalActionDirectives: directives,
  };
}

// ============================================================================
// 4. PREEMPTIVE DYNAMIC TAT HAZARD & QUEUE SATURATION PREDICTOR (COX PH)
// ============================================================================

export function predictTatSlaBreachHazard(
  specimen: InFlightSpecimenTelemetry,
  queueState: DepartmentQueueState
): TatSlaHazardOutput {
  const beta1QueueDepth = 0.042;
  const beta2CentrifugeDelay = 0.085;
  const beta3SampleHil = 0.31;
  const beta4IsIcu = 0.48;

  const qDepth = Math.max(0, safeNum(queueState.queueDepth, 0));
  const centDelay = Math.max(0, safeNum(specimen.centrifugeDelayMinutes, 0));
  const hil = Math.max(0, Math.min(4, safeNum(specimen.sampleHilIndex, 0)));
  const isIcuFlag = specimen.isIcu ? 1 : 0;

  const linearPredictor =
    beta1QueueDepth * qDepth +
    beta2CentrifugeDelay * centDelay +
    beta3SampleHil * hil +
    beta4IsIcu * isIcuFlag;

  const clampedLinear = Math.min(10, Math.max(-10, linearPredictor));
  const hazardRatio = Math.exp(clampedLinear);

  const slaTarget = Math.max(15, safeNum(specimen.slaTargetMinutes, specimen.isIcu ? 30 : 60));
  const weibullScaleEta = slaTarget * 1.15;
  const weibullShapeK = 2.2;

  const computeBreachProbAtMinute = (tMin: number): number => {
    const effectiveT = Math.max(0, tMin);
    const H0 = Math.pow(effectiveT / weibullScaleEta, weibullShapeK);
    const survivalProb = Math.exp(-H0 * hazardRatio);
    return roundTo(Math.max(0, Math.min(1, 1 - survivalProb)), 4);
  };

  const prob10 = computeBreachProbAtMinute(10);
  const prob20 = computeBreachProbAtMinute(20);
  const prob30 = computeBreachProbAtMinute(30);

  const processingRate = Math.max(0.25, safeNum(queueState.meanProcessingRateTubesPerMin, 1.5));
  const analyticalTimeMin = qDepth / processingRate + (hil >= 2 ? 8 : 3.5);
  const projectedCompletionMinutes = safeNum(specimen.elapsedMinutes, 0) + centDelay + analyticalTimeMin;

  const overallBreachProb = computeBreachProbAtMinute(
    Math.max(specimen.elapsedMinutes + analyticalTimeMin, (projectedCompletionMinutes / slaTarget) * 30)
  );

  const recommendPreemptiveReroute = overallBreachProb > 0.75 || prob30 > 0.75;

  let recommendedAnalyzerId: string | null = null;
  let recommendedAnalyzerName: string | null = null;
  let minutesSaved = 0;

  const onlineCandidates = (queueState.parallelAnalyzersAvailable || [])
    .filter((a) => a.isOnline && a.analyzerId !== specimen.analyzerId)
    .sort((a, b) => a.currentQueueDepth - b.currentQueueDepth);

  if (recommendPreemptiveReroute && onlineCandidates.length > 0) {
    const bestTarget = onlineCandidates[0];
    if (bestTarget.currentQueueDepth < qDepth) {
      recommendedAnalyzerId = bestTarget.analyzerId;
      recommendedAnalyzerName = bestTarget.name;
      minutesSaved = roundTo((qDepth - bestTarget.currentQueueDepth) / processingRate, 1);
    }
  }

  const rationale = recommendPreemptiveReroute
    ? recommendedAnalyzerId
      ? `SLA Breach Hazard is ${roundTo(Math.max(overallBreachProb, prob30) * 100, 1)}% (>75% threshold, HR=${roundTo(hazardRatio, 2)}). Reroute specimen ${specimen.barcode} to ${recommendedAnalyzerName} (Queue: ${onlineCandidates[0].currentQueueDepth} vs ${qDepth}) to save ~${minutesSaved} min.`
      : `SLA Breach Hazard is ${roundTo(Math.max(overallBreachProb, prob30) * 100, 1)}% (>75% threshold, HR=${roundTo(hazardRatio, 2)}). Prioritize tube to STAT rack bypass immediately.`
    : `In-flight TAT trajectory nominal (HR=${roundTo(hazardRatio, 2)}, 30-min Breach Risk=${roundTo(prob30 * 100, 1)}%). Maintain current analyzer assignment.`;

  return {
    sampleId: specimen.sampleId,
    barcode: specimen.barcode,
    linearPredictorScore: roundTo(clampedLinear, 4),
    hazardRatio: roundTo(hazardRatio, 3),
    checkpointBreachProbabilities: {
      minute10: prob10,
      minute20: prob20,
      minute30: prob30,
    },
    projectedCompletionMinutes: roundTo(projectedCompletionMinutes, 1),
    overallSlaBreachProbability: roundTo(Math.max(overallBreachProb, prob30), 4),
    recommendPreemptiveReroute,
    recommendedTargetAnalyzerId: recommendedAnalyzerId,
    recommendedTargetAnalyzerName: recommendedAnalyzerName,
    estimatedMinutesSavedIfRerouted: minutesSaved,
    operationalRationale: rationale,
  };
}

// ============================================================================
// 5. REAGENT SEPTUM EVAPORATION & CONCENTRATION DRIFT (FICK'S DIFFUSION)
// ============================================================================

const CLSI_ALLOWABLE_TOTAL_ERROR_PCT: Record<string, number> = {
  NA: 2.8,
  K: 6.0,
  CL: 5.0,
  CA: 5.0,
  GLU: 8.0,
  BUN: 9.0,
  CREA: 10.0,
  ALB: 8.0,
  TBIL: 15.0,
  ALT: 15.0,
  AST: 15.0,
  ALKP: 15.0,
  LAC: 10.0,
};

export function computeReagentEvaporationConcentration(
  initialVolumeMl: number,
  daysPierced: number,
  carouselTempCelsius: number,
  analyteCode: string,
  septumApertureDiameterMm = 1.6,
  ambientCarouselRelativeHumidity = 0.35
): ReagentEvaporationOutput {
  const v0Ml = Math.max(1.0, safeNum(initialVolumeMl, 25));
  const days = Math.max(0, safeNum(daysPierced, 1));
  const tempC = Math.max(2, Math.min(35, safeNum(carouselTempCelsius, 6)));
  const tempK = tempC + 273.15;

  const pSatPa = 610.94 * Math.exp((17.625 * tempC) / (tempC + 243.04));
  const clampedRh = Math.max(0.05, Math.min(0.95, safeNum(ambientCarouselRelativeHumidity, 0.35)));
  const pAmbPa = pSatPa * clampedRh;

  const diffusivityM2PerSec = 2.26e-5 * Math.pow(tempK / 273.15, 1.81) * 18.5;
  const radiusM = (Math.max(0.5, septumApertureDiameterMm) / 1000) / 2;
  const areaM2 = Math.PI * radiusM * radiusM;
  const septumThicknessDeltaM = 0.0022;
  const universalGasConstantR = 8.3144626;
  const molarMassWaterGPerMol = 18.01528;

  const molarFluxMolPerSec =
    (diffusivityM2PerSec * areaM2 * Math.max(0, pSatPa - pAmbPa)) /
    (universalGasConstantR * tempK * septumThicknessDeltaM);

  const massRateGramsPerSec = molarFluxMolPerSec * molarMassWaterGPerMol;
  const massEvaporationRateMgPerDay = massRateGramsPerSec * 1000 * 86400;

  const dailyVolumeLossMl = massEvaporationRateMgPerDay / 1000;
  const cumulativeVolumeLossMl = Math.min(v0Ml * 0.85, dailyVolumeLossMl * days);
  const remainingVolumeMl = Math.max(v0Ml * 0.15, v0Ml - cumulativeVolumeLossMl);

  const concentrationFactorPhi = v0Ml / remainingVolumeMl;
  const effectiveConcentrationShiftPct = (concentrationFactorPhi - 1) * 100;

  const normalizedCode = (analyteCode || 'GENERIC').trim().toUpperCase();
  const clsiTeaPct = CLSI_ALLOWABLE_TOTAL_ERROR_PCT[normalizedCode] ?? 8.0;
  const stabilityDriftBudgetPct = clsiTeaPct * 0.5;
  const exceedsClsiTeaLimit = effectiveConcentrationShiftPct >= stabilityDriftBudgetPct;

  const phiMax = 1 + stabilityDriftBudgetPct / 100;
  const maxAllowableLossMl = v0Ml * (1 - 1 / phiMax);
  const remainingAllowableLossMl = Math.max(0, maxAllowableLossMl - cumulativeVolumeLossMl);
  const estimatedRemainingHoursUntilTeaBreach =
    dailyVolumeLossMl > 0 ? (remainingAllowableLossMl / dailyVolumeLossMl) * 24 : 720;

  const qcRecommendation = exceedsClsiTeaLimit
    ? `CRITICAL REAGENT DRIFT: On-board evaporation (+${roundTo(effectiveConcentrationShiftPct, 2)}% concentration shift) exceeds CLSI stability budget (${roundTo(stabilityDriftBudgetPct, 2)}% for ${normalizedCode}). Perform immediate 2-point recalibration or replace pierced reagent cassette.`
    : `Reagent cassette within CLSI EP25-A on-board stability budget (+${roundTo(effectiveConcentrationShiftPct, 2)}% shift vs ${roundTo(stabilityDriftBudgetPct, 2)}% limit). Recalibrate in ~${roundTo(estimatedRemainingHoursUntilTeaBreach, 1)} hours.`;

  return {
    analyteCode: normalizedCode,
    initialVolumeMl: roundTo(v0Ml, 2),
    daysPierced: roundTo(days, 2),
    carouselTempCelsius: roundTo(tempC, 2),
    carouselTempKelvin: roundTo(tempK, 2),
    saturationVaporPressurePa: roundTo(pSatPa, 2),
    ambientVaporPressurePa: roundTo(pAmbPa, 2),
    massEvaporationRateMgPerDay: roundTo(massEvaporationRateMgPerDay, 3),
    cumulativeVolumeLossMl: roundTo(cumulativeVolumeLossMl, 4),
    remainingVolumeMl: roundTo(remainingVolumeMl, 3),
    concentrationFactorPhi: roundTo(concentrationFactorPhi, 5),
    effectiveConcentrationShiftPct: roundTo(effectiveConcentrationShiftPct, 3),
    clsiAllowableTotalErrorPct: clsiTeaPct,
    exceedsClsiTeaLimit,
    estimatedRemainingHoursUntilTeaBreach: roundTo(estimatedRemainingHoursUntilTeaBreach, 1),
    qcRecommendation,
  };
}
