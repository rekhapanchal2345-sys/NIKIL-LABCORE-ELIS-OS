'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Cpu,
  FlaskConical,
  Droplets,
  HeartPulse,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  RefreshCw,
  Calculator,
  Gauge,
  ThermometerSnowflake,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface BullsAnalyteResult {
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

interface BullsBatchEntry {
  batchId: string;
  timestamp: string;
  analytes: {
    mcv: BullsAnalyteResult;
    mch: BullsAnalyteResult;
    mchc: BullsAnalyteResult;
  };
  instrumentDiagnosticHypothesis: string;
  anyOutOfControl: boolean;
}

interface EwmaSeriesPoint {
  index: number;
  rawValue: number;
  ewmaValue: number;
  ucl: number;
  lcl: number;
  isBreach: boolean;
}

interface PlausibilityCase {
  caseId: string;
  patientName: string;
  sampleBarcode: string;
  analyzer: string;
  electrolytes: {
    na: number;
    k: number;
    cl: number;
    hco3: number;
    albumin?: number;
    glucose?: number;
    bun?: number;
    measuredOsmolality?: number;
    ca?: number;
    hb?: number;
  };
  evaluation: {
    uncorrectedAnionGap: number;
    albuminCorrectedAnionGap: number;
    effectiveAlbuminUsedGdL: number;
    deltaAnionGap: number;
    deltaBicarbonate: number;
    deltaDeltaRatio: number | null;
    acidBaseClassification: string;
    acidBaseClinicalInterpretation: string;
    calculatedOsmolality: number | null;
    osmolalGap: number | null;
    unmeasuredOsmolsFlag: boolean;
    ivContaminationPattern: string;
    ivContaminationProbability: number;
    autoverificationHoldRequired: boolean;
    clinicalAlerts: string[];
  };
}

interface SepsisKineticCase {
  patientId: string;
  patientName: string;
  ward: string;
  elapsedHours: number;
  current: {
    platelets: number;
    totalBilirubin: number;
    creatinine: number;
    lactate: number;
    procalcitonin?: number;
    baselineProcalcitonin72h?: number;
  };
  previous: {
    platelets: number;
    totalBilirubin: number;
    creatinine: number;
    lactate: number;
    procalcitonin?: number;
  };
  evaluation: {
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
      antibacterialResponseStatus: string;
    };
    codeSepsisInterlockTriggered: boolean;
    severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENT_INTERLOCK';
    clinicalActionDirectives: string[];
  };
}

interface TatRadarItem {
  sampleId: string;
  barcode: string;
  analyzerId: string;
  department: string;
  elapsedMinutes: number;
  slaTargetMinutes: number;
  centrifugeDelayMinutes: number;
  sampleHilIndex: number;
  isIcu: boolean;
  queueDepth: number;
  prediction: {
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
  };
}

interface ReagentMonitorItem {
  analyzerId: string;
  analyzerName: string;
  analyteCode: string;
  reagentLotNumber: string;
  initialVolumeMl: number;
  daysPierced: number;
  carouselTempCelsius: number;
  diffusionMetrics: {
    saturationVaporPressurePa: number;
    massEvaporationRateMgPerDay: number;
    cumulativeVolumeLossMl: number;
    remainingVolumeMl: number;
    concentrationFactorPhi: number;
    effectiveConcentrationShiftPct: number;
    clsiAllowableTotalErrorPct: number;
    exceedsClsiTeaLimit: boolean;
    estimatedRemainingHoursUntilTeaBreach: number;
    qcRecommendation: string;
  };
}

// ============================================================================
// INITIAL DETERMINISTIC CLINICAL TELEMETRY FALLBACK
// ============================================================================

const INITIAL_SNAPSHOT = {
  generatedAt: new Date().toISOString(),
  activeInFlightSamplesCount: 24,
  bullsMovingAverageSeries: [
    {
      batchId: 'BATCH-XN1000-01',
      timestamp: '08:00',
      anyOutOfControl: false,
      instrumentDiagnosticHypothesis: 'Erythrocyte indices stable within CLSI C24-A4 +/-3% Bull X_B corridor.',
      analytes: {
        mcv: {
          analyte: 'MCV' as const,
          unit: 'fL',
          previousXB: 89.5,
          currentXB: 89.38,
          batchArithmeticMean: 89.2,
          signedSquareRootSumDi: -4.12,
          rawDeviationSumDi: -6.0,
          targetMean: 89.5,
          lowerLimit3Pct: 86.815,
          upperLimit3Pct: 92.185,
          percentDeviationFromTarget: -0.134,
          isOutOfControl: false,
          driftDirection: 'STABLE' as const,
        },
        mch: {
          analyte: 'MCH' as const,
          unit: 'pg',
          previousXB: 30.2,
          currentXB: 30.16,
          batchArithmeticMean: 30.1,
          signedSquareRootSumDi: -1.8,
          rawDeviationSumDi: -2.0,
          targetMean: 30.2,
          lowerLimit3Pct: 29.294,
          upperLimit3Pct: 31.106,
          percentDeviationFromTarget: -0.132,
          isOutOfControl: false,
          driftDirection: 'STABLE' as const,
        },
        mchc: {
          analyte: 'MCHC' as const,
          unit: 'g/dL',
          previousXB: 33.8,
          currentXB: 33.8,
          batchArithmeticMean: 33.8,
          signedSquareRootSumDi: 0,
          rawDeviationSumDi: 0,
          targetMean: 33.8,
          lowerLimit3Pct: 32.786,
          upperLimit3Pct: 34.814,
          percentDeviationFromTarget: 0,
          isOutOfControl: false,
          driftDirection: 'STABLE' as const,
        },
      },
    },
    {
      batchId: 'BATCH-XN1000-02',
      timestamp: '09:00',
      anyOutOfControl: false,
      instrumentDiagnosticHypothesis: 'Erythrocyte indices stable within CLSI C24-A4 +/-3% Bull X_B corridor.',
      analytes: {
        mcv: {
          analyte: 'MCV' as const,
          unit: 'fL',
          previousXB: 89.38,
          currentXB: 89.59,
          batchArithmeticMean: 89.8,
          signedSquareRootSumDi: 3.9,
          rawDeviationSumDi: 4.4,
          targetMean: 89.5,
          lowerLimit3Pct: 86.815,
          upperLimit3Pct: 92.185,
          percentDeviationFromTarget: 0.1,
          isOutOfControl: false,
          driftDirection: 'STABLE' as const,
        },
        mch: {
          analyte: 'MCH' as const,
          unit: 'pg',
          previousXB: 30.16,
          currentXB: 30.28,
          batchArithmeticMean: 30.3,
          signedSquareRootSumDi: 1.9,
          rawDeviationSumDi: 2.8,
          targetMean: 30.2,
          lowerLimit3Pct: 29.294,
          upperLimit3Pct: 31.106,
          percentDeviationFromTarget: 0.265,
          isOutOfControl: false,
          driftDirection: 'STABLE' as const,
        },
        mchc: {
          analyte: 'MCHC' as const,
          unit: 'g/dL',
          previousXB: 33.8,
          currentXB: 33.71,
          batchArithmeticMean: 33.7,
          signedSquareRootSumDi: -1.4,
          rawDeviationSumDi: -2.0,
          targetMean: 33.8,
          lowerLimit3Pct: 32.786,
          upperLimit3Pct: 34.814,
          percentDeviationFromTarget: -0.266,
          isOutOfControl: false,
          driftDirection: 'STABLE' as const,
        },
      },
    },
    {
      batchId: 'BATCH-XN1000-03',
      timestamp: '10:00',
      anyOutOfControl: false,
      instrumentDiagnosticHypothesis: 'Erythrocyte indices stable within CLSI C24-A4 +/-3% Bull X_B corridor.',
      analytes: {
        mcv: {
          analyte: 'MCV' as const,
          unit: 'fL',
          previousXB: 89.59,
          currentXB: 90.42,
          batchArithmeticMean: 90.8,
          signedSquareRootSumDi: 8.2,
          rawDeviationSumDi: 16.2,
          targetMean: 89.5,
          lowerLimit3Pct: 86.815,
          upperLimit3Pct: 92.185,
          percentDeviationFromTarget: 1.028,
          isOutOfControl: false,
          driftDirection: 'STABLE' as const,
        },
        mch: {
          analyte: 'MCH' as const,
          unit: 'pg',
          previousXB: 30.28,
          currentXB: 30.39,
          batchArithmeticMean: 30.4,
          signedSquareRootSumDi: 1.5,
          rawDeviationSumDi: 2.4,
          targetMean: 30.2,
          lowerLimit3Pct: 29.294,
          upperLimit3Pct: 31.106,
          percentDeviationFromTarget: 0.629,
          isOutOfControl: false,
          driftDirection: 'STABLE' as const,
        },
        mchc: {
          analyte: 'MCHC' as const,
          unit: 'g/dL',
          previousXB: 33.71,
          currentXB: 33.48,
          batchArithmeticMean: 33.4,
          signedSquareRootSumDi: -2.8,
          rawDeviationSumDi: -4.2,
          targetMean: 33.8,
          lowerLimit3Pct: 32.786,
          upperLimit3Pct: 34.814,
          percentDeviationFromTarget: -0.947,
          isOutOfControl: false,
          driftDirection: 'STABLE' as const,
        },
      },
    },
    {
      batchId: 'BATCH-XN1000-04',
      timestamp: '11:00',
      anyOutOfControl: false,
      instrumentDiagnosticHypothesis: 'Monitor MCV upward trajectory (+2.18% toward UCL).',
      analytes: {
        mcv: {
          analyte: 'MCV' as const,
          unit: 'fL',
          previousXB: 90.42,
          currentXB: 91.45,
          batchArithmeticMean: 91.9,
          signedSquareRootSumDi: 11.4,
          rawDeviationSumDi: 21.6,
          targetMean: 89.5,
          lowerLimit3Pct: 86.815,
          upperLimit3Pct: 92.185,
          percentDeviationFromTarget: 2.179,
          isOutOfControl: false,
          driftDirection: 'POSITIVE_DRIFT' as const,
        },
        mch: {
          analyte: 'MCH' as const,
          unit: 'pg',
          previousXB: 30.39,
          currentXB: 30.48,
          batchArithmeticMean: 30.5,
          signedSquareRootSumDi: 1.4,
          rawDeviationSumDi: 2.2,
          targetMean: 30.2,
          lowerLimit3Pct: 29.294,
          upperLimit3Pct: 31.106,
          percentDeviationFromTarget: 0.927,
          isOutOfControl: false,
          driftDirection: 'STABLE' as const,
        },
        mchc: {
          analyte: 'MCHC' as const,
          unit: 'g/dL',
          previousXB: 33.48,
          currentXB: 33.12,
          batchArithmeticMean: 33.0,
          signedSquareRootSumDi: -3.6,
          rawDeviationSumDi: -7.6,
          targetMean: 33.8,
          lowerLimit3Pct: 32.786,
          upperLimit3Pct: 34.814,
          percentDeviationFromTarget: -2.012,
          isOutOfControl: false,
          driftDirection: 'NEGATIVE_DRIFT' as const,
        },
      },
    },
    {
      batchId: 'BATCH-XN1000-05',
      timestamp: '12:00',
      anyOutOfControl: true,
      instrumentDiagnosticHypothesis:
        'ALERT: Positive MCV shift with reciprocal MCHC drop detected. Suspect hypotonic diluent contamination, aperture impedance drift, or sheath fluid temperature shift.',
      analytes: {
        mcv: {
          analyte: 'MCV' as const,
          unit: 'fL',
          previousXB: 91.45,
          currentXB: 92.64,
          batchArithmeticMean: 93.1,
          signedSquareRootSumDi: 14.8,
          rawDeviationSumDi: 27.0,
          targetMean: 89.5,
          lowerLimit3Pct: 86.815,
          upperLimit3Pct: 92.185,
          percentDeviationFromTarget: 3.508,
          isOutOfControl: true,
          driftDirection: 'POSITIVE_DRIFT' as const,
        },
        mch: {
          analyte: 'MCH' as const,
          unit: 'pg',
          previousXB: 30.48,
          currentXB: 30.55,
          batchArithmeticMean: 30.6,
          signedSquareRootSumDi: 1.2,
          rawDeviationSumDi: 2.4,
          targetMean: 30.2,
          lowerLimit3Pct: 29.294,
          upperLimit3Pct: 31.106,
          percentDeviationFromTarget: 1.159,
          isOutOfControl: false,
          driftDirection: 'STABLE' as const,
        },
        mchc: {
          analyte: 'MCHC' as const,
          unit: 'g/dL',
          previousXB: 33.12,
          currentXB: 32.58,
          batchArithmeticMean: 32.4,
          signedSquareRootSumDi: -5.1,
          rawDeviationSumDi: -11.4,
          targetMean: 33.8,
          lowerLimit3Pct: 32.786,
          upperLimit3Pct: 34.814,
          percentDeviationFromTarget: -3.609,
          isOutOfControl: true,
          driftDirection: 'NEGATIVE_DRIFT' as const,
        },
      },
    },
  ] as BullsBatchEntry[],
  cembrowskiTruncatedEwma: {
    analyzerId: 'COBAS-C503-01',
    analyteCode: 'NA',
    unit: 'mmol/L',
    totalInputCount: 20,
    retainedCount: 18,
    truncatedLowerBound: 138.9,
    truncatedUpperBound: 144.5,
    truncatedMean: 141.91,
    truncatedStdDev: 1.62,
    lambda: 0.08,
    asymptoticStandardError: 0.2858,
    controlLimitWidth3Sigma: 0.8575,
    lowerControlLimit: 139.1425,
    upperControlLimit: 140.8575,
    currentZt: 141.482,
    zScoreEquivalent: 5.18,
    isCalibrationDriftDetected: true,
    driftDirection: 'HYPER_CALIBRATION_DRIFT',
    series: [
      { index: 1, rawValue: 139.8, ewmaValue: 139.98, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 2, rawValue: 140.2, ewmaValue: 140.0, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 3, rawValue: 138.9, ewmaValue: 139.91, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 4, rawValue: 141.0, ewmaValue: 140.0, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 5, rawValue: 140.4, ewmaValue: 140.03, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 6, rawValue: 140.8, ewmaValue: 140.09, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 7, rawValue: 141.2, ewmaValue: 140.18, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 8, rawValue: 141.5, ewmaValue: 140.29, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 9, rawValue: 141.7, ewmaValue: 140.4, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 10, rawValue: 142.1, ewmaValue: 140.54, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 11, rawValue: 142.4, ewmaValue: 140.69, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 12, rawValue: 142.8, ewmaValue: 140.86, ucl: 140.86, lcl: 139.14, isBreach: false },
      { index: 13, rawValue: 143.1, ewmaValue: 141.04, ucl: 140.86, lcl: 139.14, isBreach: true },
      { index: 14, rawValue: 143.3, ewmaValue: 141.22, ucl: 140.86, lcl: 139.14, isBreach: true },
      { index: 15, rawValue: 143.6, ewmaValue: 141.41, ucl: 140.86, lcl: 139.14, isBreach: true },
      { index: 16, rawValue: 144.2, ewmaValue: 141.63, ucl: 140.86, lcl: 139.14, isBreach: true },
    ] as EwmaSeriesPoint[],
  },
  physiologicalPlausibilityCases: [
    {
      caseId: 'PLS-ICU-01',
      patientName: 'Rajeshwari Patel (MICU Bed 4)',
      sampleBarcode: 'SMP-2026-8841',
      analyzer: 'Roche Cobas c503-A',
      electrolytes: {
        na: 134,
        k: 4.8,
        cl: 96,
        hco3: 11,
        albumin: 2.2,
        glucose: 118,
        bun: 44,
        measuredOsmolality: 312,
        ca: 8.4,
        hb: 10.6,
      },
      evaluation: {
        uncorrectedAnionGap: 27,
        albuminCorrectedAnionGap: 32.5,
        effectiveAlbuminUsedGdL: 2.2,
        deltaAnionGap: 20.5,
        deltaBicarbonate: 13,
        deltaDeltaRatio: 1.577,
        acidBaseClassification: 'PURE_HIGH_ANION_GAP_METABOLIC_ACIDOSIS',
        acidBaseClinicalInterpretation:
          'Delta Ratio (1.577) between 0.8 and 2.0: Pure High Anion Gap Metabolic Acidosis (Lactic acidosis, Ketoacidosis, Uremia, or Toxic Alcohols).',
        calculatedOsmolality: 290.27,
        osmolalGap: 21.73,
        unmeasuredOsmolsFlag: true,
        ivContaminationPattern: 'NONE',
        ivContaminationProbability: 0,
        autoverificationHoldRequired: true,
        clinicalAlerts: [
          'Delta Ratio (1.577) between 0.8 and 2.0: Pure High Anion Gap Metabolic Acidosis.',
          'CRITICAL OSMOLAL GAP (21.73 mOsm/kg > 10): Unmeasured osmols present. Evaluate immediately for toxic alcohol ingestion or propylene glycol infusion.',
        ],
      },
    },
    {
      caseId: 'PLS-ER-02',
      patientName: 'Vikramaditya Sinh (Trauma Bay 2)',
      sampleBarcode: 'SMP-2026-8849',
      analyzer: 'Roche Cobas c503-A',
      electrolytes: {
        na: 159,
        k: 2.6,
        cl: 126,
        hco3: 29,
        albumin: 4.1,
        glucose: 92,
        bun: 14,
        ca: 6.9,
        hb: 9.1,
      },
      evaluation: {
        uncorrectedAnionGap: 4,
        albuminCorrectedAnionGap: 4.75,
        effectiveAlbuminUsedGdL: 4.1,
        deltaAnionGap: -7.25,
        deltaBicarbonate: -5,
        deltaDeltaRatio: 1.45,
        acidBaseClassification: 'METABOLIC_ALKALOSIS_OR_RESPIRATORY_COMPENSATION',
        acidBaseClinicalInterpretation:
          'Hypernatremic hyperchloremic narrowing of Anion Gap secondary to isotonic 0.9% NaCl line contamination.',
        calculatedOsmolality: 328.11,
        osmolalGap: null,
        unmeasuredOsmolsFlag: false,
        ivContaminationPattern: 'NORMAL_SALINE_0_9_PERCENT',
        ivContaminationProbability: 0.91,
        autoverificationHoldRequired: true,
        clinicalAlerts: [
          'PRE-ANALYTICAL IV CONTAMINATION (0.9% NaCl): Hypernatremia (Na=159 mmol/L) & severe Hyperchloremia (Cl=126 mmol/L) with dilutional K/Ca/Hb drop. Specimen drawn downstream of Normal Saline IV line.',
        ],
      },
    },
    {
      caseId: 'PLS-WARD-03',
      patientName: 'Meenakshi Desai (Surgical Ward 12)',
      sampleBarcode: 'SMP-2026-8854',
      analyzer: 'Beckman AU680-B',
      electrolytes: {
        na: 114,
        k: 2.8,
        cl: 81,
        hco3: 18,
        albumin: 3.9,
        glucose: 540,
        bun: 11,
        ca: 6.8,
        hb: 8.9,
      },
      evaluation: {
        uncorrectedAnionGap: 15,
        albuminCorrectedAnionGap: 16.25,
        effectiveAlbuminUsedGdL: 3.9,
        deltaAnionGap: 4.25,
        deltaBicarbonate: 6,
        deltaDeltaRatio: 0.708,
        acidBaseClassification: 'COMBINED_HIGH_AND_NORMAL_AG_ACIDOSIS',
        acidBaseClinicalInterpretation:
          'Spurious dilutional hyponatremia and hypochloremia caused by 5% Dextrose (D5W) IV line contamination.',
        calculatedOsmolality: 261.93,
        osmolalGap: null,
        unmeasuredOsmolsFlag: false,
        ivContaminationPattern: 'DEXTROSE_5_PERCENT_D5W',
        ivContaminationProbability: 0.94,
        autoverificationHoldRequired: true,
        clinicalAlerts: [
          'PRE-ANALYTICAL IV CONTAMINATION (D5W): Extreme glucose spike (540 mg/dL) with proportional >30% dilutional drop in Na (114 mmol/L) and Cl (81 mmol/L).',
        ],
      },
    },
  ] as PlausibilityCase[],
  sepsisKineticCases: [
    {
      patientId: 'PAT-ICU-901',
      patientName: 'Harshadbhai Mehta (SICU Bed 02)',
      ward: 'SICU',
      elapsedHours: 2.0,
      current: {
        platelets: 42,
        totalBilirubin: 3.8,
        creatinine: 2.9,
        lactate: 4.8,
        procalcitonin: 14.2,
        baselineProcalcitonin72h: 22.0,
      },
      previous: {
        platelets: 96,
        totalBilirubin: 1.8,
        creatinine: 1.6,
        lactate: 3.6,
        procalcitonin: 22.0,
      },
      evaluation: {
        sofaSubScores: { coagulationPlatelets: 3, liverBilirubin: 2, renalCreatinine: 2 },
        totalLabSofaScore: 7,
        previousLabSofaScore: 4,
        deltaSofaScore: 3,
        organDysfunctionDetected: true,
        lactateKinetics: {
          currentMmolL: 4.8,
          previousMmolL: 3.6,
          elapsedHours: 2.0,
          clearancePercent: -33.33,
          velocityMmolPerHour: 0.6,
          isClearanceInadequate: true,
          isRapidlyRising: true,
        },
        procalcitoninKinetics: {
          currentNgMl: 14.2,
          baseline72hNgMl: 22.0,
          declinePercent: 35.45,
          antibacterialResponseStatus: 'INADEQUATE_SOURCE_CONTROL_OR_RESISTANCE',
        },
        codeSepsisInterlockTriggered: true,
        severity: 'EMERGENT_INTERLOCK',
        clinicalActionDirectives: [
          'EMERGENT CODE SEPSIS INTERLOCK: Kinetic lactate rising at +0.6 mmol/L/hr (exceeds +0.5 mmol/L/hr threshold).',
          'SEPSIS-3 ORGAN FAILURE PROGRESSION: Acute Lab-SOFA increase of +3 points (Total Lab-SOFA: 7/12).',
          'PCT KINETIC WARNING: Procalcitonin decline is only 35.45% (<80% 72h target). Evaluate for resistant pathogen.',
        ],
      },
    },
    {
      patientId: 'PAT-ICU-904',
      patientName: 'Anjali Chauhan (MICU Bed 07)',
      ward: 'MICU',
      elapsedHours: 2.0,
      current: {
        platelets: 88,
        totalBilirubin: 2.1,
        creatinine: 2.2,
        lactate: 3.3,
        procalcitonin: 8.5,
        baselineProcalcitonin72h: 11.4,
      },
      previous: {
        platelets: 92,
        totalBilirubin: 2.0,
        creatinine: 2.1,
        lactate: 3.5,
        procalcitonin: 11.4,
      },
      evaluation: {
        sofaSubScores: { coagulationPlatelets: 2, liverBilirubin: 2, renalCreatinine: 2 },
        totalLabSofaScore: 6,
        previousLabSofaScore: 6,
        deltaSofaScore: 0,
        organDysfunctionDetected: true,
        lactateKinetics: {
          currentMmolL: 3.3,
          previousMmolL: 3.5,
          elapsedHours: 2.0,
          clearancePercent: 5.71,
          velocityMmolPerHour: -0.1,
          isClearanceInadequate: true,
          isRapidlyRising: false,
        },
        procalcitoninKinetics: {
          currentNgMl: 8.5,
          baseline72hNgMl: 11.4,
          declinePercent: 25.44,
          antibacterialResponseStatus: 'INADEQUATE_SOURCE_CONTROL_OR_RESISTANCE',
        },
        codeSepsisInterlockTriggered: true,
        severity: 'EMERGENT_INTERLOCK',
        clinicalActionDirectives: [
          'EMERGENT CODE SEPSIS INTERLOCK: Kinetic Lactate Clearance is 5.71% (<10% target over 2h window). Re-evaluate hemodynamic resuscitation.',
        ],
      },
    },
    {
      patientId: 'PAT-ICU-912',
      patientName: 'Kantilal Prajapati (CCU Bed 01)',
      ward: 'CCU',
      elapsedHours: 2.5,
      current: {
        platelets: 168,
        totalBilirubin: 0.9,
        creatinine: 1.1,
        lactate: 1.4,
        procalcitonin: 0.9,
        baselineProcalcitonin72h: 9.8,
      },
      previous: {
        platelets: 145,
        totalBilirubin: 1.3,
        creatinine: 1.4,
        lactate: 2.6,
        procalcitonin: 9.8,
      },
      evaluation: {
        sofaSubScores: { coagulationPlatelets: 0, liverBilirubin: 0, renalCreatinine: 0 },
        totalLabSofaScore: 0,
        previousLabSofaScore: 3,
        deltaSofaScore: -3,
        organDysfunctionDetected: false,
        lactateKinetics: {
          currentMmolL: 1.4,
          previousMmolL: 2.6,
          elapsedHours: 2.5,
          clearancePercent: 46.15,
          velocityMmolPerHour: -0.48,
          isClearanceInadequate: false,
          isRapidlyRising: false,
        },
        procalcitoninKinetics: {
          currentNgMl: 0.9,
          baseline72hNgMl: 9.8,
          declinePercent: 90.82,
          antibacterialResponseStatus: 'RESOLVING_BACTEREMIA',
        },
        codeSepsisInterlockTriggered: false,
        severity: 'INFO',
        clinicalActionDirectives: [
          'ANTIMICROBIAL STEWARDSHIP: Procalcitonin declined by 90.82% (>80% at 72h). Indicates resolving bacteremia and effective source control.',
        ],
      },
    },
  ] as SepsisKineticCase[],
  tatHazardRadar: [
    {
      sampleId: 'SMP-TAT-01',
      barcode: 'STAT-ICU-9921',
      analyzerId: 'COBAS-C503-01',
      department: 'CLINICAL_CHEMISTRY',
      elapsedMinutes: 18,
      slaTargetMinutes: 30,
      centrifugeDelayMinutes: 11,
      sampleHilIndex: 2,
      isIcu: true,
      queueDepth: 28,
      prediction: {
        linearPredictorScore: 3.211,
        hazardRatio: 24.804,
        checkpointBreachProbabilities: {
          minute10: 0.562,
          minute20: 0.978,
          minute30: 0.999,
        },
        projectedCompletionMinutes: 49.0,
        overallSlaBreachProbability: 0.999,
        recommendPreemptiveReroute: true,
        recommendedTargetAnalyzerId: 'COBAS-C503-02',
        recommendedTargetAnalyzerName: 'Roche Cobas c503 #2 (Backup)',
        estimatedMinutesSavedIfRerouted: 16.4,
        operationalRationale:
          'SLA Breach Hazard is 99.9% (>75% threshold, HR=24.8). Reroute specimen STAT-ICU-9921 to Roche Cobas c503 #2 (Queue: 5 vs 28) to save ~16.4 min.',
      },
    },
    {
      sampleId: 'SMP-TAT-02',
      barcode: 'ER-TROP-9924',
      analyzerId: 'ARCHITECT-I2000-01',
      department: 'IMMUNOASSAY',
      elapsedMinutes: 14,
      slaTargetMinutes: 35,
      centrifugeDelayMinutes: 9,
      sampleHilIndex: 1,
      isIcu: true,
      queueDepth: 22,
      prediction: {
        linearPredictorScore: 2.479,
        hazardRatio: 11.929,
        checkpointBreachProbabilities: {
          minute10: 0.251,
          minute20: 0.735,
          minute30: 0.962,
        },
        projectedCompletionMinutes: 46.5,
        overallSlaBreachProbability: 0.962,
        recommendPreemptiveReroute: true,
        recommendedTargetAnalyzerId: 'COBAS-E801-01',
        recommendedTargetAnalyzerName: 'Roche Cobas e801 Immuno',
        estimatedMinutesSavedIfRerouted: 16.4,
        operationalRationale:
          'SLA Breach Hazard is 96.2% (>75% threshold, HR=11.93). Reroute specimen ER-TROP-9924 to Roche Cobas e801 Immuno (Queue: 4 vs 22) to save ~16.4 min.',
      },
    },
    {
      sampleId: 'SMP-TAT-03',
      barcode: 'OPD-HEM-9930',
      analyzerId: 'SYSMEX-XN1000-01',
      department: 'HEMATOLOGY',
      elapsedMinutes: 12,
      slaTargetMinutes: 45,
      centrifugeDelayMinutes: 0,
      sampleHilIndex: 0,
      isIcu: false,
      queueDepth: 8,
      prediction: {
        linearPredictorScore: 0.336,
        hazardRatio: 1.399,
        checkpointBreachProbabilities: {
          minute10: 0.018,
          minute20: 0.079,
          minute30: 0.182,
        },
        projectedCompletionMinutes: 19.9,
        overallSlaBreachProbability: 0.182,
        recommendPreemptiveReroute: false,
        recommendedTargetAnalyzerId: null,
        recommendedTargetAnalyzerName: null,
        estimatedMinutesSavedIfRerouted: 0,
        operationalRationale:
          'In-flight TAT trajectory nominal (HR=1.4, 30-min Breach Risk=18.2%). Maintain current analyzer assignment.',
      },
    },
  ] as TatRadarItem[],
  reagentEvaporationMonitors: [
    {
      analyzerId: 'COBAS-C503-01',
      analyzerName: 'Roche Cobas c503 #1',
      analyteCode: 'NA',
      reagentLotNumber: 'LOT-NA-88412',
      initialVolumeMl: 18,
      daysPierced: 11.5,
      carouselTempCelsius: 8.2,
      diffusionMetrics: {
        saturationVaporPressurePa: 1087.2,
        massEvaporationRateMgPerDay: 24.8,
        cumulativeVolumeLossMl: 0.2852,
        remainingVolumeMl: 17.715,
        concentrationFactorPhi: 1.0161,
        effectiveConcentrationShiftPct: 1.61,
        clsiAllowableTotalErrorPct: 2.8,
        exceedsClsiTeaLimit: true,
        estimatedRemainingHoursUntilTeaBreach: 0,
        qcRecommendation:
          'CRITICAL REAGENT DRIFT: On-board evaporation (+1.61% concentration shift) exceeds CLSI stability budget (1.4% for NA). Perform immediate 2-point recalibration or replace pierced reagent cassette.',
      },
    },
    {
      analyzerId: 'COBAS-C503-01',
      analyzerName: 'Roche Cobas c503 #1',
      analyteCode: 'CA',
      reagentLotNumber: 'LOT-CA-77109',
      initialVolumeMl: 20,
      daysPierced: 14.0,
      carouselTempCelsius: 8.5,
      diffusionMetrics: {
        saturationVaporPressurePa: 1109.4,
        massEvaporationRateMgPerDay: 25.3,
        cumulativeVolumeLossMl: 0.3542,
        remainingVolumeMl: 19.646,
        concentrationFactorPhi: 1.018,
        effectiveConcentrationShiftPct: 1.8,
        clsiAllowableTotalErrorPct: 5.0,
        exceedsClsiTeaLimit: false,
        estimatedRemainingHoursUntilTeaBreach: 126.4,
        qcRecommendation:
          'Reagent cassette within CLSI EP25-A on-board stability budget (+1.8% shift vs 2.5% limit). Recalibrate in ~126.4 hours.',
      },
    },
  ] as ReagentMonitorItem[],
};

// ============================================================================
// MAIN CLINICAL INTELLIGENCE WORKSTATION COMPONENT
// ============================================================================

export default function NexusClinicalIntelligenceWorkstation() {
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
  const [selectedBullsParam, setSelectedBullsParam] = useState<'mcv' | 'mch' | 'mchc'>('mcv');
  const [reroutedBarcodes, setReroutedBarcodes] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Interactive Live Plausibility Sandbox State
  const [sandboxInput, setSandboxInput] = useState({
    na: 134,
    k: 4.8,
    cl: 96,
    hco3: 11,
    albumin: 2.2,
    glucose: 118,
    bun: 44,
    measuredOsmolality: 312,
  });

  useEffect(() => {
    const fetchLiveSnapshot = async () => {
      try {
        const res = await fetch('/api/v1/nexus/clinical-intelligence/snapshot');
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.data) {
            setSnapshot(json.data);
          }
        }
      } catch {
        // Fallback to deterministic local clinical state if backend offline
      }
    };
    fetchLiveSnapshot();
  }, []);

  const handleRefreshTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/nexus/clinical-intelligence/snapshot');
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          setSnapshot(json.data);
        }
      }
    } catch {
      // Keep local snapshot
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  const handleExecuteReroute = (barcode: string, targetAnalyzerName: string) => {
    setReroutedBarcodes((prev) => ({
      ...prev,
      [barcode]: targetAnalyzerName,
    }));
  };

  // Real-time interactive calculation for the Anion Gap / Delta-Delta Sandbox
  const sandboxCalc = useMemo(() => {
    const { na, cl, hco3, albumin, glucose, bun, measuredOsmolality } = sandboxInput;
    const rawAg = na - (cl + hco3);
    const correctedAg = rawAg + 2.5 * (4.4 - albumin);
    const deltaAg = correctedAg - 12;
    const deltaHco3 = 24 - hco3;
    const deltaRatio = Math.abs(deltaHco3) >= 0.5 ? deltaAg / deltaHco3 : null;
    const calcOsm = 2 * na + glucose / 18 + bun / 2.8;
    const osmGap = measuredOsmolality - calcOsm;

    let classification = 'NORMAL_ACID_BASE';
    if (correctedAg > 12) {
      if (deltaRatio !== null) {
        if (deltaRatio < 0.4) classification = 'HYPERCHLOREMIC_NORMAL_AG_ACIDOSIS';
        else if (deltaRatio < 0.8) classification = 'COMBINED_HIGH_AND_NORMAL_AG_ACIDOSIS';
        else if (deltaRatio <= 2.0) classification = 'PURE_HIGH_ANION_GAP_METABOLIC_ACIDOSIS';
        else classification = 'HIGH_AG_ACIDOSIS_WITH_CONCOMITANT_METABOLIC_ALKALOSIS';
      } else {
        classification = 'HIGH_AG_ACIDOSIS_WITH_CONCOMITANT_METABOLIC_ALKALOSIS';
      }
    } else if (hco3 < 22) {
      classification = 'HYPERCHLOREMIC_NORMAL_AG_ACIDOSIS';
    }

    return {
      rawAg: rawAg.toFixed(1),
      correctedAg: correctedAg.toFixed(2),
      deltaRatio: deltaRatio !== null ? deltaRatio.toFixed(2) : 'N/A',
      calcOsm: calcOsm.toFixed(1),
      osmGap: osmGap.toFixed(1),
      classification,
    };
  }, [sandboxInput]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 font-sans">
      {/* TOP COMMAND HEADER */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">
              NIKIL-LABCORE-ELIS-OS
            </span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
              CLSI C24-A4 / EP07-A2 / SEPSIS-3
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-2 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-cyan-400" />
            LABCORE OMNISCIENT NEXUS — Clinical Mathematics &amp; Operations Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-Time Patient Moving Averages (Bull&apos;s X_B &amp; Truncated EWMA), Figge-Jabor-Kazda Acid-Base Plausibility, Sepsis-3 Kinetic Velocity &amp; Cox Hazard TAT Routing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-right">
            <div className="text-xs text-slate-400 font-mono">IN-FLIGHT SPECIMENS</div>
            <div className="text-xl font-bold text-cyan-400 font-mono">
              {snapshot.activeInFlightSamplesCount} TUBES
            </div>
          </div>
          <button
            onClick={handleRefreshTelemetry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition cursor-pointer shadow-lg shadow-cyan-900/30"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Recompute Telemetry
          </button>
        </div>
      </header>

      {/* SECTION 1: BULL'S MOVING AVERAGE (X_B) & CEMBROWSKI TRUNCATED EWMA */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bull's X_B Hematology Moving Average Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  1A. AACC / Bull&apos;s Moving Average (X_B) — Hematology Drift
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Recursive Root-Damped Smoothing: X_B(i) = X_B(i-1) + sgn(d_i)·√|d_i| (N=20 Batch)
                </p>
              </div>
              <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['mcv', 'mch', 'mchc'] as const).map((param) => (
                  <button
                    key={param}
                    onClick={() => setSelectedBullsParam(param)}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition ${
                      selectedBullsParam === param
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {param}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Chart for Bull's Moving Average with +/- 3% Limit Bands */}
            {(() => {
              const series = snapshot.bullsMovingAverageSeries;
              const latest = series[series.length - 1]?.analytes[selectedBullsParam];
              if (!latest) return null;

              const target = latest.targetMean;
              const ucl = latest.upperLimit3Pct;
              const lcl = latest.lowerLimit3Pct;
              const minY = lcl * 0.985;
              const maxY = ucl * 1.015;

              const mapY = (val: number) => {
                const ratio = (val - minY) / (maxY - minY);
                return 170 - Math.max(0, Math.min(1, ratio)) * 140;
              };

              const points = series
                .map((b, idx) => {
                  const x = 50 + (idx / Math.max(1, series.length - 1)) * 480;
                  const y = mapY(b.analytes[selectedBullsParam].currentXB);
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <div className="space-y-3">
                  <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
                    <svg viewBox="0 0 560 195" className="w-full h-48 overflow-visible">
                      {/* +/- 3% Control Band Fill */}
                      <rect
                        x="50"
                        y={mapY(ucl)}
                        width="480"
                        height={Math.max(2, mapY(lcl) - mapY(ucl))}
                        fill="rgba(6, 182, 212, 0.07)"
                      />
                      {/* UCL +3% Line */}
                      <line
                        x1="50"
                        y1={mapY(ucl)}
                        x2="530"
                        y2={mapY(ucl)}
                        stroke="#f43f5e"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                      />
                      <text x="534" y={mapY(ucl) + 4} className="fill-rose-400 text-[10px] font-mono">
                        +3% ({ucl})
                      </text>

                      {/* Target Mean Line */}
                      <line
                        x1="50"
                        y1={mapY(target)}
                        x2="530"
                        y2={mapY(target)}
                        stroke="#10b981"
                        strokeWidth="1.2"
                      />
                      <text x="534" y={mapY(target) + 4} className="fill-emerald-400 text-[10px] font-mono">
                        Target ({target})
                      </text>

                      {/* LCL -3% Line */}
                      <line
                        x1="50"
                        y1={mapY(lcl)}
                        x2="530"
                        y2={mapY(lcl)}
                        stroke="#f43f5e"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                      />
                      <text x="534" y={mapY(lcl) + 4} className="fill-rose-400 text-[10px] font-mono">
                        -3% ({lcl})
                      </text>

                      {/* X_B Polyline */}
                      <polyline
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="2.5"
                        points={points}
                      />

                      {/* Data Nodes */}
                      {series.map((b, idx) => {
                        const item = b.analytes[selectedBullsParam];
                        const x = 50 + (idx / Math.max(1, series.length - 1)) * 480;
                        const y = mapY(item.currentXB);
                        return (
                          <g key={b.batchId}>
                            <circle
                              cx={x}
                              cy={y}
                              r={item.isOutOfControl ? 5.5 : 4}
                              className={
                                item.isOutOfControl
                                  ? 'fill-rose-500 stroke-white stroke-2'
                                  : 'fill-cyan-400 stroke-slate-950 stroke-2'
                              }
                            />
                            <text
                              x={x}
                              y={y - 10}
                              textAnchor="middle"
                              className="fill-slate-200 text-[10px] font-mono"
                            >
                              {item.currentXB}
                            </text>
                            <text
                              x={x}
                              y="188"
                              textAnchor="middle"
                              className="fill-slate-500 text-[10px] font-mono"
                            >
                              {b.timestamp}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-400 font-mono">CURRENT BULL X_B</div>
                      <div className="text-lg font-bold font-mono text-white">
                        {latest.currentXB} {latest.unit}
                      </div>
                    </div>
                    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-400 font-mono">DRIFT BIAS (%)</div>
                      <div
                        className={`text-lg font-bold font-mono ${
                          latest.isOutOfControl ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {latest.percentDeviationFromTarget > 0 ? '+' : ''}
                        {latest.percentDeviationFromTarget}%
                      </div>
                    </div>
                    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-400 font-mono">RESIDUAL SUM d_i</div>
                      <div className="text-lg font-bold font-mono text-cyan-400">
                        {latest.rawDeviationSumDi}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 leading-relaxed">
              <span className="font-bold">Sysmex XN-1000 Diagnostic Telemetry: </span>
              {snapshot.bullsMovingAverageSeries[snapshot.bullsMovingAverageSeries.length - 1]
                ?.instrumentDiagnosticHypothesis}
            </div>
          </div>
        </div>

        {/* Cembrowski Truncated EWMA Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  1B. Cembrowski Truncated EWMA — Clinical Chemistry (Na+)
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  5th–95th Percentile Tail Truncation | Z_t = λX̄_t + (1-λ)Z_(t-1) | ±3σ·√(λ/(2-λ))
                </p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                λ = {snapshot.cembrowskiTruncatedEwma.lambda}
              </span>
            </div>

            {(() => {
              const ewma = snapshot.cembrowskiTruncatedEwma;
              const minY = ewma.lowerControlLimit - 1.2;
              const maxY = ewma.upperControlLimit + 1.5;

              const mapY = (val: number) => {
                const ratio = (val - minY) / (maxY - minY);
                return 170 - Math.max(0, Math.min(1, ratio)) * 140;
              };

              const points = ewma.series
                .map((pt, idx) => {
                  const x = 45 + (idx / Math.max(1, ewma.series.length - 1)) * 485;
                  const y = mapY(pt.ewmaValue);
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <div className="space-y-3">
                  <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
                    <svg viewBox="0 0 560 195" className="w-full h-48 overflow-visible">
                      {/* UCL */}
                      <line
                        x1="45"
                        y1={mapY(ewma.upperControlLimit)}
                        x2="530"
                        y2={mapY(ewma.upperControlLimit)}
                        stroke="#f43f5e"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                      />
                      <text
                        x="534"
                        y={mapY(ewma.upperControlLimit) + 4}
                        className="fill-rose-400 text-[10px] font-mono"
                      >
                        UCL ({ewma.upperControlLimit.toFixed(2)})
                      </text>

                      {/* LCL */}
                      <line
                        x1="45"
                        y1={mapY(ewma.lowerControlLimit)}
                        x2="530"
                        y2={mapY(ewma.lowerControlLimit)}
                        stroke="#f43f5e"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                      />
                      <text
                        x="534"
                        y={mapY(ewma.lowerControlLimit) + 4}
                        className="fill-rose-400 text-[10px] font-mono"
                      >
                        LCL ({ewma.lowerControlLimit.toFixed(2)})
                      </text>

                      {/* EWMA Trajectory */}
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        points={points}
                      />

                      {ewma.series.map((pt, idx) => {
                        const x = 45 + (idx / Math.max(1, ewma.series.length - 1)) * 485;
                        const y = mapY(pt.ewmaValue);
                        return (
                          <circle
                            key={pt.index}
                            cx={x}
                            cy={y}
                            r={pt.isBreach ? 5 : 3.5}
                            className={
                              pt.isBreach
                                ? 'fill-rose-500 stroke-white stroke-2'
                                : 'fill-emerald-400 stroke-slate-950 stroke-1'
                            }
                          />
                        );
                      })}
                    </svg>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5 text-center">
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                      <div className="text-[10px] text-slate-400 font-mono">TRUNCATED RANGE</div>
                      <div className="text-sm font-bold font-mono text-slate-200">
                        {ewma.truncatedLowerBound}–{ewma.truncatedUpperBound}
                      </div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                      <div className="text-[10px] text-slate-400 font-mono">CURRENT Z_t</div>
                      <div className="text-sm font-bold font-mono text-rose-400">
                        {ewma.currentZt.toFixed(2)} mmol/L
                      </div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                      <div className="text-[10px] text-slate-400 font-mono">ASYMPTOTIC SE</div>
                      <div className="text-sm font-bold font-mono text-cyan-400">
                        ±{ewma.asymptoticStandardError.toFixed(3)}
                      </div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                      <div className="text-[10px] text-slate-400 font-mono">Z-EQUIVALENT</div>
                      <div className="text-sm font-bold font-mono text-amber-400">
                        {ewma.zScoreEquivalent}σ
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <span className="font-bold">PBRTQC Calibration Drift Interlock: </span>
              ICU extreme outliers (118.0 &amp; 164.0 mmol/L) automatically truncated. Remaining patient stream shows +1.48 mmol/L upward ISE reference electrode drift exceeding +3·SE limit (140.86 mmol/L) without running physical QC vials.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MULTI-ANALYTE PHYSIOLOGICAL CROSS-PLAUSIBILITY & IV CONTAMINATION SHIELD */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Droplets className="w-5 h-5 text-indigo-400" />
              2. Multi-Analyte Physiological Cross-Plausibility &amp; IV Line Contamination Shield
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Figge-Jabor-Kazda Albumin-Corrected Anion Gap | Delta-Delta (ΔAG/ΔHCO3) Acid-Base Ratio | Osmolal Gap | 0.9% NaCl / D5W / K-EDTA Detector
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            3 Specimens Blocked from Autoverification
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {snapshot.physiologicalPlausibilityCases.map((item) => (
            <div
              key={item.caseId}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 font-semibold">
                    {item.sampleBarcode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      item.evaluation.ivContaminationPattern !== 'NONE'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {item.evaluation.ivContaminationPattern !== 'NONE'
                      ? `IV CONTAM: ${item.evaluation.ivContaminationPattern}`
                      : item.evaluation.acidBaseClassification}
                  </span>
                </div>
                <div className="font-bold text-sm text-white mt-1.5">{item.patientName}</div>
                <div className="text-xs text-slate-400 font-mono">{item.analyzer}</div>

                {/* Electrolyte Matrix */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 text-center">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">Na+</div>
                    <div className="text-xs font-bold font-mono text-white">{item.electrolytes.na}</div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">K+</div>
                    <div className="text-xs font-bold font-mono text-white">{item.electrolytes.k}</div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">Cl-</div>
                    <div className="text-xs font-bold font-mono text-white">{item.electrolytes.cl}</div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">HCO3-</div>
                    <div className="text-xs font-bold font-mono text-white">{item.electrolytes.hco3}</div>
                  </div>
                </div>

                {/* Derived Mathematical Equations */}
                <div className="mt-3 space-y-1.5 text-xs font-mono bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uncorrected AG:</span>
                    <span className="text-slate-200">{item.evaluation.uncorrectedAnionGap} mmol/L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Figge Corrected AG (Alb {item.electrolytes.albumin} g/dL):</span>
                    <span className="text-cyan-400 font-bold">
                      {item.evaluation.albuminCorrectedAnionGap} mmol/L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delta-Delta (ΔAG / ΔHCO3):</span>
                    <span className="text-amber-400 font-bold">
                      {item.evaluation.deltaDeltaRatio ?? 'N/A'}
                    </span>
                  </div>
                  {item.evaluation.osmolalGap !== null && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Osmolal Gap (Meas - Calc):</span>
                      <span className="text-rose-400 font-bold">
                        {item.evaluation.osmolalGap} mOsm/kg
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                {item.evaluation.clinicalAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded p-2 leading-snug"
                  >
                    {alert}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Figge-Jabor-Kazda & Osmolal Gap Calculator Bar */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase mb-3">
            <Calculator className="w-4 h-4" />
            Interactive Figge-Jabor-Kazda Anion Gap, Delta-Delta &amp; Osmolal Gap Simulator
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Na+ (mmol/L)', key: 'na', step: 1 },
              { label: 'Cl- (mmol/L)', key: 'cl', step: 1 },
              { label: 'HCO3- (mmol/L)', key: 'hco3', step: 1 },
              { label: 'Albumin (g/dL)', key: 'albumin', step: 0.1 },
              { label: 'Glucose (mg/dL)', key: 'glucose', step: 5 },
              { label: 'BUN (mg/dL)', key: 'bun', step: 1 },
              { label: 'Meas. Osm (mOsm)', key: 'measuredOsmolality', step: 1 },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">
                  {field.label}
                </label>
                <input
                  type="number"
                  step={field.step}
                  value={sandboxInput[field.key as keyof typeof sandboxInput]}
                  onChange={(e) =>
                    setSandboxInput((prev) => ({
                      ...prev,
                      [field.key]: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div>
              Uncorrected AG: <span className="text-white font-bold">{sandboxCalc.rawAg}</span>
            </div>
            <div>
              Figge Corrected AG: <span className="text-cyan-400 font-bold">{sandboxCalc.correctedAg}</span>
            </div>
            <div>
              Delta-Delta Ratio: <span className="text-amber-400 font-bold">{sandboxCalc.deltaRatio}</span>
            </div>
            <div>
              Calc Osmolality: <span className="text-white font-bold">{sandboxCalc.calcOsm}</span>
            </div>
            <div>
              Osmolal Gap:{' '}
              <span
                className={`font-bold ${
                  parseFloat(sandboxCalc.osmGap) > 10 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {sandboxCalc.osmGap} mOsm/kg
              </span>
            </div>
            <div className="px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold">
              {sandboxCalc.classification}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SEPSIS-3 (SOFA) & KINETIC LACTATE CLEARANCE VELOCITY */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-400" />
              3. Real-Time Sepsis-3 (Lab-SOFA) &amp; Kinetic Lactate Clearance Velocity Engine
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Platelet / Bilirubin / Creatinine SOFA Sub-Scores | Clearance % = ((Lac_t0 - Lac_t1)/Lac_t0)×100 | 72h Procalcitonin Kinetics
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            2 Active Code Sepsis Interlocks
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {snapshot.sepsisKineticCases.map((sep) => {
            const isInterlock = sep.evaluation.codeSepsisInterlockTriggered;
            return (
              <div
                key={sep.patientId}
                className={`rounded-xl p-4 border flex flex-col justify-between space-y-3 ${
                  isInterlock
                    ? 'bg-rose-950/20 border-rose-500/50'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">{sep.patientId}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isInterlock
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isInterlock ? 'CODE SEPSIS INTERLOCK' : 'RESOLVING / STABLE'}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white mt-1">{sep.patientName}</div>

                  {/* Lab-SOFA Breakdown */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
                      <div className="text-[10px] text-slate-400 font-mono">PLT ({sep.current.platelets}k)</div>
                      <div className="text-sm font-bold font-mono text-white">
                        SOFA +{sep.evaluation.sofaSubScores.coagulationPlatelets}
                      </div>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
                      <div className="text-[10px] text-slate-400 font-mono">TBIL ({sep.current.totalBilirubin})</div>
                      <div className="text-sm font-bold font-mono text-white">
                        SOFA +{sep.evaluation.sofaSubScores.liverBilirubin}
                      </div>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
                      <div className="text-[10px] text-slate-400 font-mono">CREA ({sep.current.creatinine})</div>
                      <div className="text-sm font-bold font-mono text-white">
                        SOFA +{sep.evaluation.sofaSubScores.renalCreatinine}
                      </div>
                    </div>
                  </div>

                  {/* Kinetic Velocity Telemetry */}
                  <div className="mt-3 bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Lab-SOFA (ΔSOFA):</span>
                      <span className="text-white font-bold">
                        {sep.evaluation.totalLabSofaScore}/12 (
                        {sep.evaluation.deltaSofaScore >= 0 ? `+${sep.evaluation.deltaSofaScore}` : sep.evaluation.deltaSofaScore})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lactate (t0 → t1 @ {sep.elapsedHours}h):</span>
                      <span className="text-white font-bold">
                        {sep.previous.lactate} → {sep.current.lactate} mmol/L
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kinetic Clearance / Velocity:</span>
                      <span
                        className={`font-bold ${
                          sep.evaluation.lactateKinetics.isClearanceInadequate ||
                          sep.evaluation.lactateKinetics.isRapidlyRising
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {sep.evaluation.lactateKinetics.clearancePercent}% (
                        {sep.evaluation.lactateKinetics.velocityMmolPerHour! > 0 ? '+' : ''}
                        {sep.evaluation.lactateKinetics.velocityMmolPerHour} mmol/L/h)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">72h PCT Decline:</span>
                      <span
                        className={`font-bold ${
                          (sep.evaluation.procalcitoninKinetics.declinePercent ?? 0) >= 80
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {sep.evaluation.procalcitoninKinetics.declinePercent}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  {sep.evaluation.clinicalActionDirectives.map((dir, idx) => (
                    <div
                      key={idx}
                      className={`text-[11px] p-2 rounded border leading-snug ${
                        isInterlock
                          ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                          : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      }`}
                    >
                      {dir}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4 & 5: COX PROPORTIONAL HAZARD TAT RADAR & REAGENT EVAPORATION DRIFT */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 4. Preemptive Dynamic TAT Hazard & Queue Saturation Predictor */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              4. Preemptive Dynamic TAT Cox Hazard &amp; Queue Rerouting Radar
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              h(t|X) = h_0(t)·exp(β₁Queue + β₂SpinDelay + β₃HIL + β₄IsICU) | Reroute Threshold &gt; 75%
            </p>
          </div>

          <div className="space-y-3">
            {snapshot.tatHazardRadar.map((tube) => {
              const reroutedTo = reroutedBarcodes[tube.barcode];
              const breachPct = Math.round(tube.prediction.overallSlaBreachProbability * 100);

              return (
                <div
                  key={tube.sampleId}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{tube.barcode}</span>
                      {tube.isIcu && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">
                          ICU STAT
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-400">
                        Line: {reroutedTo || tube.analyzerId} (Queue: {tube.queueDepth} | Spin Delay: {tube.centrifugeDelayMinutes}m | HIL: {tube.sampleHilIndex})
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      Hazard Ratio: {tube.prediction.hazardRatio}x
                    </span>
                  </div>

                  {/* Checkpoint Hazard Bars (10m, 20m, 30m) */}
                  <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
                    {[
                      { label: '10-Min Breach Risk', val: tube.prediction.checkpointBreachProbabilities.minute10 },
                      { label: '20-Min Breach Risk', val: tube.prediction.checkpointBreachProbabilities.minute20 },
                      { label: '30-Min Breach Risk', val: tube.prediction.checkpointBreachProbabilities.minute30 },
                    ].map((cp) => {
                      const pct = Math.round((reroutedTo ? cp.val * 0.22 : cp.val) * 100);
                      return (
                        <div key={cp.label} className="bg-slate-900 p-2 rounded border border-slate-800">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>{cp.label}</span>
                            <span className={pct > 75 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct > 75 ? 'bg-rose-500' : pct > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                    <p className="text-xs text-slate-300 leading-snug">
                      {reroutedTo
                        ? `PREEMPTIVE REROUTE EXECUTED: Diverted to ${reroutedTo}. Estimated SLA breach risk reduced to <18%.`
                        : tube.prediction.operationalRationale}
                    </p>

                    {tube.prediction.recommendPreemptiveReroute &&
                      tube.prediction.recommendedTargetAnalyzerName &&
                      !reroutedTo && (
                        <button
                          onClick={() =>
                            handleExecuteReroute(
                              tube.barcode,
                              tube.prediction.recommendedTargetAnalyzerName!
                            )
                          }
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs transition cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Reroute ({breachPct}% Risk)
                        </button>
                      )}

                    {reroutedTo && (
                      <span className="shrink-0 flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Rerouted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Reagent Septum Evaporation & Concentration Drift (Fick's Diffusion) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ThermometerSnowflake className="w-5 h-5 text-cyan-400" />
              5. Reagent Septum Evaporation &amp; Concentration Drift (Fick&apos;s Diffusion)
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              ṁ_evap = D·A·(P_sat(T) - P_amb)/(R·T·δ) | Evaluates Concentration Shift φ(t) vs CLSI TE_a
            </p>
          </div>

          <div className="space-y-3">
            {snapshot.reagentEvaporationMonitors.map((reagent) => {
              const dm = reagent.diffusionMetrics;
              return (
                <div
                  key={`${reagent.analyzerId}-${reagent.analyteCode}`}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {reagent.analyzerName} — Analyte: {reagent.analyteCode}
                      </span>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Lot: {reagent.reagentLotNumber} | Pierced: {reagent.daysPierced} days | Carousel: {reagent.carouselTempCelsius}°C
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        dm.exceedsClsiTeaLimit
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {dm.exceedsClsiTeaLimit ? 'CLSI DRIFT BUDGET BREACH' : 'ON-BOARD STABLE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">P_sat(T)</div>
                      <div className="text-xs font-bold text-white">{dm.saturationVaporPressurePa} Pa</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">ṁ_evap Rate</div>
                      <div className="text-xs font-bold text-cyan-400">{dm.massEvaporationRateMgPerDay} mg/d</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Factor φ(t)</div>
                      <div className="text-xs font-bold text-amber-400">{dm.concentrationFactorPhi}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Shift vs TEa</div>
                      <div
                        className={`text-xs font-bold ${
                          dm.exceedsClsiTeaLimit ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        +{dm.effectiveConcentrationShiftPct}% / {dm.clsiAllowableTotalErrorPct}%
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-xs p-2.5 rounded border leading-snug ${
                      dm.exceedsClsiTeaLimit
                        ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    {dm.qcRecommendation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
