export interface HistoricalPatientResult {
  resultId: string;
  parameterCode: string;
  numericValue: number;
  units: string;
  collectedAt: string; // ISO-8601 timestamp
  specimenBarcode: string;
}

export interface CurrentSamplePanelResult {
  parameterCode: string;
  parameterName: string;
  numericValue: number;
  units: string;
  collectedAt: string;
  specimenBarcode: string;
}

export interface ParameterBiologicalThresholds {
  parameterCode: string;
  parameterName: string;
  units: string;
  cvAnalyticalPercent: number;    // CV_A (%)
  cvIntraindividualPercent: number; // CV_I (%)
  maxAbsoluteDelta72h: number;
  maxPercentDelta72h: number;
  maxHourlyVelocity: number;      // Max physiologically plausible change per hour
  halfLifeDecayHours: number;     // Time-decay weighting constant
}

export type DeltaAnomalyClassification =
  | 'PASS_PHYSIOLOGICAL'
  | 'KINETIC_DRIFT_WARNING'
  | 'RCV_EXCEEDED_CRITICAL'
  | 'SUSPECTED_IV_FLUID_CONTAMINATION'
  | 'SUSPECTED_TUBE_MISLABEL_WRONG_PATIENT';

export interface SingleParameterDeltaEvaluation {
  parameterCode: string;
  parameterName: string;
  currentValue: number;
  previousValue: number;
  previousCollectedAt: string;
  elapsedHours: number;
  absoluteDelta: number;
  percentDelta: number;
  hourlyKineticVelocity: number;
  timeDecayWeight: number;
  weightedDeltaScore: number;
  referenceChangeValuePercent: number; // RCV (%) at 99% confidence (Z = 2.58)
  exceedsAbsoluteThreshold: boolean;
  exceedsPercentThreshold: boolean;
  exceedsHourlyVelocity: boolean;
  exceedsRcv99: boolean;
  parameterFlag: 'PASS' | 'DELTA_WARN' | 'DELTA_FAIL_HOLD';
  clinicalExplanation: string;
}

export interface PanelDeltaCheckReport {
  patientId: string;
  specimenBarcode: string;
  evaluatedAt: string;
  lookbackWindowHours: number;
  overallClassification: DeltaAnomalyClassification;
  holdAutoverification: boolean;
  wrongPatientMislabelProbability: number; // 0.0 to 1.0
  ivDilutionProbability: number;           // 0.0 to 1.0
  compositeKineticScore: number;
  parameterEvaluations: SingleParameterDeltaEvaluation[];
  recommendedClinicalAction: string;
}

// ============================================================================
// BIOLOGICAL VARIATION & DELTA THRESHOLD MATRIX (EFLM / CLSI EP33)
// ============================================================================
export const CLINICAL_DELTA_THRESHOLD_MATRIX: Record<string, ParameterBiologicalThresholds> = {
  MCV: {
    parameterCode: 'MCV',
    parameterName: 'Mean Corpuscular Volume',
    units: 'fL',
    cvAnalyticalPercent: 0.8,
    cvIntraindividualPercent: 1.4, // Extremely stable in absence of transfusion
    maxAbsoluteDelta72h: 5.0,
    maxPercentDelta72h: 6.0,
    maxHourlyVelocity: 0.4,
    halfLifeDecayHours: 72,
  },
  HGB: {
    parameterCode: 'HGB',
    parameterName: 'Hemoglobin',
    units: 'g/dL',
    cvAnalyticalPercent: 1.0,
    cvIntraindividualPercent: 2.8,
    maxAbsoluteDelta72h: 2.5,
    maxPercentDelta72h: 20.0,
    maxHourlyVelocity: 0.5,
    halfLifeDecayHours: 24,
  },
  PLT: {
    parameterCode: 'PLT',
    parameterName: 'Platelet Count',
    units: '10^3/uL',
    cvAnalyticalPercent: 2.5,
    cvIntraindividualPercent: 9.1,
    maxAbsoluteDelta72h: 100.0,
    maxPercentDelta72h: 40.0,
    maxHourlyVelocity: 12.0,
    halfLifeDecayHours: 36,
  },
  NA: {
    parameterCode: 'NA',
    parameterName: 'Sodium (Serum)',
    units: 'mmol/L',
    cvAnalyticalPercent: 0.6,
    cvIntraindividualPercent: 0.6, // Tightly regulated osmolality
    maxAbsoluteDelta72h: 8.0,
    maxPercentDelta72h: 6.0,
    maxHourlyVelocity: 1.0, // Rapid correction > 0.5-1.0 mmol/L/h risks osmotic demyelination
    halfLifeDecayHours: 24,
  },
  K: {
    parameterCode: 'K',
    parameterName: 'Potassium (Serum)',
    units: 'mmol/L',
    cvAnalyticalPercent: 1.2,
    cvIntraindividualPercent: 4.6,
    maxAbsoluteDelta72h: 1.2,
    maxPercentDelta72h: 25.0,
    maxHourlyVelocity: 0.35,
    halfLifeDecayHours: 12,
  },
  CL: {
    parameterCode: 'CL',
    parameterName: 'Chloride (Serum)',
    units: 'mmol/L',
    cvAnalyticalPercent: 0.8,
    cvIntraindividualPercent: 1.2,
    maxAbsoluteDelta72h: 10.0,
    maxPercentDelta72h: 10.0,
    maxHourlyVelocity: 1.2,
    halfLifeDecayHours: 24,
  },
  CREA: {
    parameterCode: 'CREA',
    parameterName: 'Creatinine (Serum)',
    units: 'mg/dL',
    cvAnalyticalPercent: 2.0,
    cvIntraindividualPercent: 5.9,
    maxAbsoluteDelta72h: 0.6,
    maxPercentDelta72h: 45.0,
    maxHourlyVelocity: 0.08, // Even in anuric AKI, Cr rises ~0.04-0.06 mg/dL/hr
    halfLifeDecayHours: 48,
  },
  ALB: {
    parameterCode: 'ALB',
    parameterName: 'Albumin (Serum)',
    units: 'g/dL',
    cvAnalyticalPercent: 1.5,
    cvIntraindividualPercent: 3.2,
    maxAbsoluteDelta72h: 1.0,
    maxPercentDelta72h: 25.0,
    maxHourlyVelocity: 0.15,
    halfLifeDecayHours: 48,
  },
  CA: {
    parameterCode: 'CA',
    parameterName: 'Calcium Total',
    units: 'mg/dL',
    cvAnalyticalPercent: 1.2,
    cvIntraindividualPercent: 2.1,
    maxAbsoluteDelta72h: 1.5,
    maxPercentDelta72h: 16.0,
    maxHourlyVelocity: 0.25,
    halfLifeDecayHours: 24,
  },
  GLU: {
    parameterCode: 'GLU',
    parameterName: 'Glucose',
    units: 'mg/dL',
    cvAnalyticalPercent: 1.8,
    cvIntraindividualPercent: 5.6,
    maxAbsoluteDelta72h: 180.0,
    maxPercentDelta72h: 120.0,
    maxHourlyVelocity: 60.0,
    halfLifeDecayHours: 6,
  },
};

export class DeltaCheckEngine {
  private readonly lookbackHours: number;

  constructor(lookbackHours: number = 72) {
    this.lookbackHours = lookbackHours;
  }

  // --------------------------------------------------------------------------
  // 1. REFERENCE CHANGE VALUE (RCV) AT 99% CONFIDENCE (Z = 2.58)
  // Formula: RCV = sqrt(2) * Z * sqrt(CV_A^2 + CV_I^2)
  // --------------------------------------------------------------------------
  public static calculateReferenceChangeValue99(cvA: number, cvI: number): number {
    const z99 = 2.58;
    const rcv = Math.SQRT2 * z99 * Math.sqrt(Math.pow(cvA, 2) + Math.pow(cvI, 2));
    return Number(rcv.toFixed(2));
  }

  // --------------------------------------------------------------------------
  // 2. EVALUATE PATIENT PANEL AGAINST HISTORICAL RECORDS WITHIN 72 HOURS
  // --------------------------------------------------------------------------
  public evaluatePatientPanel(params: {
    patientId: string;
    specimenBarcode: string;
    currentPanel: CurrentSamplePanelResult[];
    historicalRecords: HistoricalPatientResult[];
  }): PanelDeltaCheckReport {
    const parameterEvaluations: SingleParameterDeltaEvaluation[] = [];

    for (const current of params.currentPanel) {
      const code = current.parameterCode.toUpperCase();
      const thresholdConfig = CLINICAL_DELTA_THRESHOLD_MATRIX[code];
      if (!thresholdConfig) continue;

      const currentTs = new Date(current.collectedAt).getTime();

      // Find most recent valid historical result for this parameter within lookback window
      const matchingHistory = params.historicalRecords
        .filter((h) => h.parameterCode.toUpperCase() === code)
        .map((h) => ({
          ...h,
          elapsedHours: (currentTs - new Date(h.collectedAt).getTime()) / (1000 * 3600),
        }))
        .filter((h) => h.elapsedHours > 0.05 && h.elapsedHours <= this.lookbackHours)
        .sort((a, b) => a.elapsedHours - b.elapsedHours);

      if (matchingHistory.length === 0) continue;

      const previous = matchingHistory[0];
      const elapsedHours = Number(previous.elapsedHours.toFixed(2));
      const absoluteDelta = Number((current.numericValue - previous.numericValue).toFixed(3));
      const absMag = Math.abs(absoluteDelta);
      const percentDelta =
        previous.numericValue !== 0
          ? Number(((absoluteDelta / previous.numericValue) * 100).toFixed(2))
          : 0;
      const pctMag = Math.abs(percentDelta);

      const hourlyKineticVelocity = Number((absMag / Math.max(elapsedHours, 0.25)).toFixed(4));

      // Exponential time-decay weight: w(t) = exp(-ln(2) * elapsedHours / halfLife)
      // Recent samples (e.g. 4h ago) carry much tighter physiological constraint than 70h ago
      const decayLambda = Math.LN2 / thresholdConfig.halfLifeDecayHours;
      const timeDecayWeight = Number(Math.exp(-decayLambda * elapsedHours).toFixed(4));

      const rcv99 = DeltaCheckEngine.calculateReferenceChangeValue99(
        thresholdConfig.cvAnalyticalPercent,
        thresholdConfig.cvIntraindividualPercent
      );

      // Time-adjusted RCV widens slightly with square root of time for metabolic analytes
      const timeAdjustedRcv = Number(
        (rcv99 * (1 + 0.15 * Math.sqrt(elapsedHours / 24))).toFixed(2)
      );

      const exceedsAbsoluteThreshold = absMag > thresholdConfig.maxAbsoluteDelta72h;
      const exceedsPercentThreshold = pctMag > thresholdConfig.maxPercentDelta72h;
      const exceedsHourlyVelocity = hourlyKineticVelocity > thresholdConfig.maxHourlyVelocity;
      const exceedsRcv99 = pctMag > timeAdjustedRcv;

      const normalizedRatio = Math.max(
        absMag / thresholdConfig.maxAbsoluteDelta72h,
        pctMag / thresholdConfig.maxPercentDelta72h,
        hourlyKineticVelocity / thresholdConfig.maxHourlyVelocity
      );
      const weightedDeltaScore = Number((normalizedRatio * (0.5 + 0.5 * timeDecayWeight)).toFixed(3));

      let parameterFlag: SingleParameterDeltaEvaluation['parameterFlag'] = 'PASS';
      let clinicalExplanation = `Physiologically consistent with prior value (${previous.numericValue} ${current.units} at -${elapsedHours}h).`;

      if ((exceedsAbsoluteThreshold && exceedsPercentThreshold) || exceedsHourlyVelocity) {
        parameterFlag = 'DELTA_FAIL_HOLD';
        clinicalExplanation = `Implausible kinetic jump: ${previous.numericValue} → ${current.numericValue} ${current.units} (${
          percentDelta > 0 ? '+' : ''
        }${percentDelta}%, velocity ${hourlyKineticVelocity} ${current.units}/hr vs max ${
          thresholdConfig.maxHourlyVelocity
        }/hr) over ${elapsedHours}h.`;
      } else if (exceedsRcv99 || exceedsAbsoluteThreshold || exceedsPercentThreshold) {
        parameterFlag = 'DELTA_WARN';
        clinicalExplanation = `Exceeds 99% Reference Change Value (${timeAdjustedRcv}%): changed by ${percentDelta}% over ${elapsedHours}h.`;
      }

      parameterEvaluations.push({
        parameterCode: code,
        parameterName: thresholdConfig.parameterName,
        currentValue: current.numericValue,
        previousValue: previous.numericValue,
        previousCollectedAt: previous.collectedAt,
        elapsedHours,
        absoluteDelta,
        percentDelta,
        hourlyKineticVelocity,
        timeDecayWeight,
        weightedDeltaScore,
        referenceChangeValuePercent: timeAdjustedRcv,
        exceedsAbsoluteThreshold,
        exceedsPercentThreshold,
        exceedsHourlyVelocity,
        exceedsRcv99,
        parameterFlag,
        clinicalExplanation,
      });
    }

    // ------------------------------------------------------------------------
    // 3. MULTIVARIATE PATTERN DETECTION: IV FLUID DILUTION & TUBE MISLABELING
    // ------------------------------------------------------------------------
    const ivDilutionProbability = this.detectIvFluidDilutionPattern(parameterEvaluations);
    const wrongPatientMislabelProbability = this.detectWrongPatientMislabelPattern(
      parameterEvaluations
    );

    const compositeKineticScore =
      parameterEvaluations.length > 0
        ? Number(
            (
              parameterEvaluations.reduce((acc, e) => acc + e.weightedDeltaScore, 0) /
              parameterEvaluations.length
            ).toFixed(3)
          )
        : 0;

    let overallClassification: DeltaAnomalyClassification = 'PASS_PHYSIOLOGICAL';
    let holdAutoverification = false;
    let recommendedClinicalAction =
      'All longitudinal delta checks within physiological and analytical limits. Safe for autoverification.';

    if (wrongPatientMislabelProbability >= 0.7) {
      overallClassification = 'SUSPECTED_TUBE_MISLABEL_WRONG_PATIENT';
      holdAutoverification = true;
      recommendedClinicalAction =
        'CRITICAL PRE-ANALYTICAL ALERT: Discordant MCV/Creatinine/Electrolyte shift strongly indicates Wrong-Blood-In-Tube (WBIT) or specimen mislabeling. Quarantine tube, verify bedside barcode, and order recollection.';
    } else if (ivDilutionProbability >= 0.65) {
      overallClassification = 'SUSPECTED_IV_FLUID_CONTAMINATION';
      holdAutoverification = true;
      recommendedClinicalAction =
        'PRE-ANALYTICAL DILUTION ALERT: Simultaneous acute drop in HGB/Albumin/Calcium with crystalloid/dextrose spike indicates draw proximal to active IV infusion line. Recollect from contralateral arm.';
    } else if (parameterEvaluations.some((e) => e.parameterFlag === 'DELTA_FAIL_HOLD')) {
      overallClassification = 'RCV_EXCEEDED_CRITICAL';
      holdAutoverification = true;
      recommendedClinicalAction =
        'Hold autoverification: One or more parameters exceeded maximum physiological velocity or 72-hour delta limits. Verify clinical status (transfusion, dialysis, acute bleed) before release.';
    } else if (parameterEvaluations.some((e) => e.parameterFlag === 'DELTA_WARN')) {
      overallClassification = 'KINETIC_DRIFT_WARNING';
      holdAutoverification = false;
      recommendedClinicalAction =
        'Significant biological shift (>99% RCV) noted. Correlate with clinical intervention.';
    }

    return {
      patientId: params.patientId,
      specimenBarcode: params.specimenBarcode,
      evaluatedAt: new Date().toISOString(),
      lookbackWindowHours: this.lookbackHours,
      overallClassification,
      holdAutoverification,
      wrongPatientMislabelProbability,
      ivDilutionProbability,
      compositeKineticScore,
      parameterEvaluations,
      recommendedClinicalAction,
    };
  }

  // --------------------------------------------------------------------------
  // 4. IV FLUID DILUTION DETECTOR (SALINE / DEXTROSE / RINGER'S CONTAMINATION)
  // Detects simultaneous negative percent delta in macromolecular/cellular
  // markers (HGB, ALB, CA, K) coupled with Na+/Cl- or Glucose surge
  // --------------------------------------------------------------------------
  private detectIvFluidDilutionPattern(evals: SingleParameterDeltaEvaluation[]): number {
    const byCode = new Map(evals.map((e) => [e.parameterCode, e]));

    const dilutedMarkers = ['HGB', 'ALB', 'CA', 'PLT', 'CREA'].filter((code) => {
      const ev = byCode.get(code);
      return ev && ev.percentDelta <= -15.0 && ev.elapsedHours <= 36;
    });

    const normalSalineSpike =
      (byCode.get('NA')?.absoluteDelta ?? 0) >= 5.0 &&
      (byCode.get('CL')?.absoluteDelta ?? 0) >= 6.0;

    const dextroseSpike =
      (byCode.get('GLU')?.percentDelta ?? 0) >= 85.0 &&
      (byCode.get('GLU')?.currentValue ?? 0) >= 250;

    let score = 0;
    if (dilutedMarkers.length >= 2) {
      score += 0.45 + (dilutedMarkers.length - 2) * 0.15;
    }
    if (dilutedMarkers.length >= 1 && normalSalineSpike) {
      score += 0.35;
    }
    if (dilutedMarkers.length >= 1 && dextroseSpike) {
      score += 0.4;
    }

    return Number(Math.min(1.0, score).toFixed(2));
  }

  // --------------------------------------------------------------------------
  // 5. WRONG-PATIENT TUBE MISLABELING DETECTOR (WBIT)
  // MCV has <1.5% biological variation over 72h; a sudden >5 fL MCV shift
  // combined with discordant Creatinine or Electrolyte shift is a classic
  // signature of specimen swap between two patients.
  // --------------------------------------------------------------------------
  private detectWrongPatientMislabelPattern(evals: SingleParameterDeltaEvaluation[]): number {
    const byCode = new Map(evals.map((e) => [e.parameterCode, e]));
    let score = 0;

    const mcvEval = byCode.get('MCV');
    if (mcvEval && Math.abs(mcvEval.absoluteDelta) >= 5.0) {
      score += 0.55;
      if (Math.abs(mcvEval.absoluteDelta) >= 8.0) {
        score += 0.2;
      }
    }

    const creaEval = byCode.get('CREA');
    if (creaEval && creaEval.exceedsHourlyVelocity && Math.abs(creaEval.percentDelta) >= 40) {
      score += 0.3;
    }

    const discordantCount = evals.filter((e) => e.parameterFlag === 'DELTA_FAIL_HOLD').length;
    if (discordantCount >= 3) {
      score += 0.25;
    }

    return Number(Math.min(1.0, score).toFixed(2));
  }
}
