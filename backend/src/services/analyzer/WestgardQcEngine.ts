import { EventEmitter } from 'events';

export type WestgardRuleCode = '1-2s' | '1-3s' | '2-2s' | 'R-4s' | '4-1s' | '10-x';
export type QcLevel = 'LEVEL_1_LOW' | 'LEVEL_2_NORMAL' | 'LEVEL_3_HIGH';
export type QcEvaluationStatus = 'IN_CONTROL' | 'WARNING_1_2S' | 'REJECTED_LOCKOUT';

export interface QcLotTargetConfig {
  analyzerId: string;
  parameterCode: string;
  parameterName: string;
  qcLotNumber: string;
  level: QcLevel;
  targetMean: number;
  targetSd: number; // Must be > 0
  units: string;
  expirationDate: string;
}

export interface QcDataPoint {
  pointId: string;
  analyzerId: string;
  parameterCode: string;
  qcLotNumber: string;
  level: QcLevel;
  runBatchId: string;
  measuredValue: number;
  zScore: number; // (Measured - TargetMean) / TargetSD
  timestamp: string;
  operatorId: string;
}

export interface WestgardRuleViolation {
  ruleCode: WestgardRuleCode;
  severity: 'WARNING' | 'REJECTION';
  errorCategory: 'RANDOM_ERROR' | 'SYSTEMATIC_ERROR';
  description: string;
  contributingPointIds: string[];
  correctiveActionSOP: string;
}

export interface LeveyJenningsPlotPoint {
  pointId: string;
  timestamp: string;
  measuredValue: number;
  zScore: number;
  level: QcLevel;
  bandClassification:
    | 'WITHIN_1SD'
    | 'BETWEEN_1SD_2SD'
    | 'BETWEEN_2SD_3SD'
    | 'BEYOND_3SD';
  violatedRules: WestgardRuleCode[];
}

export interface ParameterLockoutState {
  analyzerId: string;
  parameterCode: string;
  isLockedOut: boolean;
  lockedSince: string | null;
  triggeringRules: WestgardRuleCode[];
  qcLotNumber: string;
  requiresCalibration: boolean;
  quarantinedPatientSampleCount: number;
}

export interface QcStatisticalSummary {
  analyzerId: string;
  parameterCode: string;
  level: QcLevel;
  nPoints: number;
  calculatedMean: number;
  calculatedSd: number;
  cvPercent: number; // Coefficient of Variation (%)
  biasPercent: number;
  cpkIndex: number; // Process Capability Index
  status: QcEvaluationStatus;
  activeViolations: WestgardRuleViolation[];
  lockoutState: ParameterLockoutState;
  leveyJenningsSeries: LeveyJenningsPlotPoint[];
}

export class WestgardQcEngine extends EventEmitter {
  // Key: `${analyzerId}:${parameterCode}:${level}`
  private readonly targetConfigs: Map<string, QcLotTargetConfig> = new Map();
  // Historical QC points per `${analyzerId}:${parameterCode}` (ordered chronologically)
  private readonly historyStore: Map<string, QcDataPoint[]> = new Map();
  // Active circuit breaker state per `${analyzerId}:${parameterCode}`
  private readonly lockoutRegistry: Map<string, ParameterLockoutState> = new Map();

  constructor() {
    super();
  }

  // --------------------------------------------------------------------------
  // 1. REGISTER QC LOT TARGET MEAN & STANDARD DEVIATION
  // --------------------------------------------------------------------------
  public registerQcLotTarget(config: QcLotTargetConfig): void {
    if (config.targetSd <= 0) {
      throw new Error(
        `Invalid target SD (${config.targetSd}) for ${config.parameterCode}. Standard deviation must be strictly positive.`
      );
    }
    const key = `${config.analyzerId}:${config.parameterCode}:${config.level}`;
    this.targetConfigs.set(key, config);

    const lockoutKey = `${config.analyzerId}:${config.parameterCode}`;
    if (!this.lockoutRegistry.has(lockoutKey)) {
      this.lockoutRegistry.set(lockoutKey, {
        analyzerId: config.analyzerId,
        parameterCode: config.parameterCode,
        isLockedOut: false,
        lockedSince: null,
        triggeringRules: [],
        qcLotNumber: config.qcLotNumber,
        requiresCalibration: false,
        quarantinedPatientSampleCount: 0,
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. EVALUATE NEW QC RUN AGAINST ALL 6 WESTGARD RULES (CLSI C24-A4)
  // --------------------------------------------------------------------------
  public evaluateQcRun(params: {
    analyzerId: string;
    parameterCode: string;
    level: QcLevel;
    measuredValue: number;
    runBatchId: string;
    operatorId: string;
    timestamp?: string;
  }): QcStatisticalSummary {
    const configKey = `${params.analyzerId}:${params.parameterCode}:${params.level}`;
    const config = this.targetConfigs.get(configKey);

    if (!config) {
      throw new Error(
        `No QC Lot Target configured for Analyzer=${params.analyzerId}, Parameter=${params.parameterCode}, Level=${params.level}`
      );
    }

    const zScore = Number(
      ((params.measuredValue - config.targetMean) / config.targetSd).toFixed(4)
    );

    const newPoint: QcDataPoint = {
      pointId: `QC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      analyzerId: params.analyzerId,
      parameterCode: params.parameterCode,
      qcLotNumber: config.qcLotNumber,
      level: params.level,
      runBatchId: params.runBatchId,
      measuredValue: params.measuredValue,
      zScore,
      timestamp: params.timestamp || new Date().toISOString(),
      operatorId: params.operatorId,
    };

    const paramHistoryKey = `${params.analyzerId}:${params.parameterCode}`;
    const allParamPoints = this.historyStore.get(paramHistoryKey) || [];
    allParamPoints.push(newPoint);
    // Keep up to 200 historical runs in memory
    if (allParamPoints.length > 200) {
      allParamPoints.shift();
    }
    this.historyStore.set(paramHistoryKey, allParamPoints);

    // Filter points for the same QC level and across levels in the same runBatchId
    const sameLevelPoints = allParamPoints.filter((p) => p.level === params.level);
    const currentBatchPoints = allParamPoints.filter(
      (p) => p.runBatchId === params.runBatchId
    );

    const violations = this.runSixWestgardRules(
      newPoint,
      sameLevelPoints,
      currentBatchPoints,
      allParamPoints
    );

    // Update Analyzer Parameter Safety Lockout Circuit Breaker
    const rejectionRules = violations
      .filter((v) => v.severity === 'REJECTION')
      .map((v) => v.ruleCode);

    const lockoutState = this.updateCircuitBreakerLockout(
      params.analyzerId,
      params.parameterCode,
      config.qcLotNumber,
      rejectionRules
    );

    const status: QcEvaluationStatus =
      rejectionRules.length > 0
        ? 'REJECTED_LOCKOUT'
        : violations.some((v) => v.ruleCode === '1-2s')
        ? 'WARNING_1_2S'
        : 'IN_CONTROL';

    const stats = this.computeCumulativeStatistics(sameLevelPoints, config);
    const ljSeries = this.buildLeveyJenningsSeries(sameLevelPoints, allParamPoints);

    const summary: QcStatisticalSummary = {
      analyzerId: params.analyzerId,
      parameterCode: params.parameterCode,
      level: params.level,
      nPoints: sameLevelPoints.length,
      calculatedMean: stats.calculatedMean,
      calculatedSd: stats.calculatedSd,
      cvPercent: stats.cvPercent,
      biasPercent: stats.biasPercent,
      cpkIndex: stats.cpkIndex,
      status,
      activeViolations: violations,
      lockoutState,
      leveyJenningsSeries: ljSeries,
    };

    if (status === 'REJECTED_LOCKOUT') {
      this.emit('westgardLockoutTripped', summary);
    } else if (status === 'WARNING_1_2S') {
      this.emit('westgardWarning', summary);
    }

    return summary;
  }

  // --------------------------------------------------------------------------
  // 3. MATHEMATICAL EVALUATION OF THE 6 WESTGARD RULES
  // --------------------------------------------------------------------------
  private runSixWestgardRules(
    latest: QcDataPoint,
    sameLevelSeries: QcDataPoint[],
    currentRunBatch: QcDataPoint[],
    allLevelsChronological: QcDataPoint[]
  ): WestgardRuleViolation[] {
    const violations: WestgardRuleViolation[] = [];
    const absZ = Math.abs(latest.zScore);

    // RULE 1: 1-3s (Rejection - Random Error or sudden large systematic shift)
    // Triggered when a single control measurement exceeds Mean ± 3SD
    if (absZ > 3.0) {
      violations.push({
        ruleCode: '1-3s',
        severity: 'REJECTION',
        errorCategory: 'RANDOM_ERROR',
        description: `1-3s Violation: Control point Z-score (${latest.zScore.toFixed(2)} SD) exceeds ±3.0 SD limit.`,
        contributingPointIds: [latest.pointId],
        correctiveActionSOP:
          'Halt patient testing immediately. Inspect sample probe for micro-clots/bubbles, verify reagent volume, and repeat QC run.',
      });
    }

    // RULE 2: 1-2s (Warning Rule - Triggers inspection of secondary rules)
    // Triggered when a single control measurement exceeds Mean ± 2SD
    if (absZ > 2.0) {
      violations.push({
        ruleCode: '1-2s',
        severity: 'WARNING',
        errorCategory: 'RANDOM_ERROR',
        description: `1-2s Warning: Control point Z-score (${latest.zScore.toFixed(2)} SD) exceeds ±2.0 SD warning gate.`,
        contributingPointIds: [latest.pointId],
        correctiveActionSOP:
          'Evaluate cascading multi-rules (2-2s, R-4s, 4-1s, 10-x). If no rejection rules are triggered, run may proceed with caution.',
      });
    }

    // RULE 3: 2-2s (Rejection - Systematic Error)
    // Case A (Across-run): 2 consecutive points on the same level > +2SD or both < -2SD
    if (sameLevelSeries.length >= 2) {
      const prevSameLevel = sameLevelSeries[sameLevelSeries.length - 2];
      const bothAbovePlus2 = latest.zScore > 2.0 && prevSameLevel.zScore > 2.0;
      const bothBelowMinus2 = latest.zScore < -2.0 && prevSameLevel.zScore < -2.0;

      if (bothAbovePlus2 || bothBelowMinus2) {
        violations.push({
          ruleCode: '2-2s',
          severity: 'REJECTION',
          errorCategory: 'SYSTEMATIC_ERROR',
          description: `2-2s Across-Run Violation: Two consecutive ${latest.level} controls exceed ${
            bothAbovePlus2 ? '+2.0 SD' : '-2.0 SD'
          } on the same side of the mean (${prevSameLevel.zScore.toFixed(2)} SD, ${latest.zScore.toFixed(2)} SD).`,
          contributingPointIds: [prevSameLevel.pointId, latest.pointId],
          correctiveActionSOP:
            'Systematic calibration drift or reagent degradation detected. Perform 2-point recalibration and verify calibrator lot stability.',
        });
      }
    }

    // Case B (Within-run across levels): 2 simultaneous levels in the same batch both > +2SD or both < -2SD
    if (currentRunBatch.length >= 2) {
      for (const other of currentRunBatch) {
        if (other.pointId === latest.pointId) continue;
        const bothAbovePlus2 = latest.zScore > 2.0 && other.zScore > 2.0;
        const bothBelowMinus2 = latest.zScore < -2.0 && other.zScore < -2.0;

        if ((bothAbovePlus2 || bothBelowMinus2) && !violations.some((v) => v.ruleCode === '2-2s')) {
          violations.push({
            ruleCode: '2-2s',
            severity: 'REJECTION',
            errorCategory: 'SYSTEMATIC_ERROR',
            description: `2-2s Within-Run Violation: Two QC levels (${other.level} & ${latest.level}) in batch ${latest.runBatchId} both exceed ${
              bothAbovePlus2 ? '+2.0 SD' : '-2.0 SD'
            }.`,
            contributingPointIds: [other.pointId, latest.pointId],
            correctiveActionSOP:
              'Across-level systematic bias detected. Check incubator temperature, reagent lot blank, and perform full calibration.',
          });
        }
      }
    }

    // RULE 4: R-4s (Rejection - Random Error)
    // Case A (Within-run across levels): One level > +2SD and another level < -2SD (or absolute Z difference >= 4.0 SD within run)
    if (currentRunBatch.length >= 2) {
      for (const other of currentRunBatch) {
        if (other.pointId === latest.pointId) continue;
        const zSpan = Math.abs(latest.zScore - other.zScore);
        if (zSpan >= 4.0) {
          violations.push({
            ruleCode: 'R-4s',
            severity: 'REJECTION',
            errorCategory: 'RANDOM_ERROR',
            description: `R-4s Within-Run Violation: Range between ${other.level} (${other.zScore.toFixed(2)} SD) and ${latest.level} (${latest.zScore.toFixed(2)} SD) is ${zSpan.toFixed(2)} SD (≥ 4.0 SD).`,
            contributingPointIds: [other.pointId, latest.pointId],
            correctiveActionSOP:
              'Severe random imprecision. Inspect pipettor syringe seals, wash station carry-over, and power supply stability.',
          });
          break;
        }
      }
    } else if (sameLevelSeries.length >= 2) {
      // Case B (Across consecutive points on single level when opposite sides exceed 4SD span)
      const prev = sameLevelSeries[sameLevelSeries.length - 2];
      const oppositeSides =
        (latest.zScore > 2.0 && prev.zScore < -2.0) ||
        (latest.zScore < -2.0 && prev.zScore > 2.0);
      const zSpan = Math.abs(latest.zScore - prev.zScore);
      if (oppositeSides && zSpan >= 4.0) {
        violations.push({
          ruleCode: 'R-4s',
          severity: 'REJECTION',
          errorCategory: 'RANDOM_ERROR',
          description: `R-4s Consecutive Violation: Consecutive points swung from ${prev.zScore.toFixed(2)} SD to ${latest.zScore.toFixed(2)} SD (Range = ${zSpan.toFixed(2)} SD ≥ 4.0 SD).`,
          contributingPointIds: [prev.pointId, latest.pointId],
          correctiveActionSOP:
            'High random error swing. Check for air bubbles in reagent lines and repeat QC.',
        });
      }
    }

    // RULE 5: 4-1s (Rejection - Systematic Error)
    // 4 consecutive control measurements (same level OR across levels) exceed +1SD or -1SD on the same side
    const checkFourOneS = (series: QcDataPoint[], label: string): boolean => {
      if (series.length < 4) return false;
      const last4 = series.slice(-4);
      const allAbovePlus1 = last4.every((p) => p.zScore > 1.0);
      const allBelowMinus1 = last4.every((p) => p.zScore < -1.0);
      if (allAbovePlus1 || allBelowMinus1) {
        violations.push({
          ruleCode: '4-1s',
          severity: 'REJECTION',
          errorCategory: 'SYSTEMATIC_ERROR',
          description: `4-1s Violation (${label}): Four consecutive points exceed ${
            allAbovePlus1 ? '+1.0 SD' : '-1.0 SD'
          } on the same side of the mean.`,
          contributingPointIds: last4.map((p) => p.pointId),
          correctiveActionSOP:
            'Sustained calibration shift (>1 SD). Recalibrate assay and verify reagent storage temperature log.',
        });
        return true;
      }
      return false;
    };

    if (!checkFourOneS(sameLevelSeries, latest.level)) {
      checkFourOneS(allLevelsChronological, 'Multi-Level Stream');
    }

    // RULE 6: 10-x (Rejection - Systematic Trend / Bias)
    // 10 consecutive control measurements fall on the same side of the mean (all Z > 0 or all Z < 0)
    const checkTenX = (series: QcDataPoint[], label: string): boolean => {
      if (series.length < 10) return false;
      const last10 = series.slice(-10);
      const allPositive = last10.every((p) => p.zScore > 0);
      const allNegative = last10.every((p) => p.zScore < 0);
      if (allPositive || allNegative) {
        violations.push({
          ruleCode: '10-x',
          severity: 'REJECTION',
          errorCategory: 'SYSTEMATIC_ERROR',
          description: `10-x Violation (${label}): Ten consecutive control points fell ${
            allPositive ? 'above' : 'below'
          } the target mean, indicating chronic systematic drift.`,
          contributingPointIds: last10.map((p) => p.pointId),
          correctiveActionSOP:
            'Chronic systematic drift. Replace optical lamp/ISE reference electrode, reconstitute fresh calibrators, and recalibrate.',
        });
        return true;
      }
      return false;
    };

    if (!checkTenX(sameLevelSeries, latest.level)) {
      checkTenX(allLevelsChronological, 'Multi-Level Stream');
    }

    return violations;
  }

  // --------------------------------------------------------------------------
  // 4. ANALYZER SAFETY CIRCUIT BREAKER (AUTO-LOCKOUT & UNLOCK)
  // --------------------------------------------------------------------------
  private updateCircuitBreakerLockout(
    analyzerId: string,
    parameterCode: string,
    qcLotNumber: string,
    rejectionRules: WestgardRuleCode[]
  ): ParameterLockoutState {
    const key = `${analyzerId}:${parameterCode}`;
    const current = this.lockoutRegistry.get(key) || {
      analyzerId,
      parameterCode,
      isLockedOut: false,
      lockedSince: null,
      triggeringRules: [],
      qcLotNumber,
      requiresCalibration: false,
      quarantinedPatientSampleCount: 0,
    };

    if (rejectionRules.length > 0) {
      current.isLockedOut = true;
      current.lockedSince = current.lockedSince || new Date().toISOString();
      current.triggeringRules = Array.from(
        new Set([...current.triggeringRules, ...rejectionRules])
      );
      current.requiresCalibration = true;
      this.lockoutRegistry.set(key, current);
    }

    return { ...current };
  }

  public canReleasePatientResult(
    analyzerId: string,
    parameterCode: string
  ): {
    allowed: boolean;
    reason?: string;
    lockoutState?: ParameterLockoutState;
  } {
    const key = `${analyzerId}:${parameterCode}`;
    const lockout = this.lockoutRegistry.get(key);

    if (lockout && lockout.isLockedOut) {
      lockout.quarantinedPatientSampleCount += 1;
      this.lockoutRegistry.set(key, lockout);
      return {
        allowed: false,
        reason: `ISO 15189 / CLSI C24-A4 QC Lockout Active on ${analyzerId} [${parameterCode}]: Violated rules [${lockout.triggeringRules.join(
          ', '
        )}] since ${lockout.lockedSince}. Patient result held in quarantine pending recalibration.`,
        lockoutState: { ...lockout },
      };
    }

    return { allowed: true };
  }

  public resolveParameterLockout(params: {
    analyzerId: string;
    parameterCode: string;
    authorizedByUserId: string;
    calibrationVerificationRunId: string;
    correctiveActionNotes: string;
  }): ParameterLockoutState {
    const key = `${params.analyzerId}:${params.parameterCode}`;
    const resetState: ParameterLockoutState = {
      analyzerId: params.analyzerId,
      parameterCode: params.parameterCode,
      isLockedOut: false,
      lockedSince: null,
      triggeringRules: [],
      qcLotNumber: this.lockoutRegistry.get(key)?.qcLotNumber || 'ACTIVE-LOT',
      requiresCalibration: false,
      quarantinedPatientSampleCount: 0,
    };
    this.lockoutRegistry.set(key, resetState);

    this.emit('westgardLockoutCleared', {
      ...resetState,
      authorizedByUserId: params.authorizedByUserId,
      calibrationVerificationRunId: params.calibrationVerificationRunId,
      correctiveActionNotes: params.correctiveActionNotes,
      clearedAt: new Date().toISOString(),
    });

    return resetState;
  }

  // --------------------------------------------------------------------------
  // 5. LEVEY-JENNINGS SERIES & CUMULATIVE METRICS (CV%, BIAS%, Cpk)
  // --------------------------------------------------------------------------
  private computeCumulativeStatistics(
    points: QcDataPoint[],
    config: QcLotTargetConfig
  ): {
    calculatedMean: number;
    calculatedSd: number;
    cvPercent: number;
    biasPercent: number;
    cpkIndex: number;
  } {
    if (points.length === 0) {
      return {
        calculatedMean: config.targetMean,
        calculatedSd: config.targetSd,
        cvPercent: Number(((config.targetSd / config.targetMean) * 100).toFixed(2)),
        biasPercent: 0,
        cpkIndex: 1.33,
      };
    }

    const n = points.length;
    const sum = points.reduce((acc, p) => acc + p.measuredValue, 0);
    const mean = sum / n;

    const variance =
      n > 1
        ? points.reduce((acc, p) => acc + Math.pow(p.measuredValue - mean, 2), 0) / (n - 1)
        : Math.pow(config.targetSd, 2);

    const sd = Math.max(Math.sqrt(variance), 1e-6);
    const cvPercent = mean !== 0 ? (sd / Math.abs(mean)) * 100 : 0;
    const biasPercent =
      config.targetMean !== 0
        ? ((mean - config.targetMean) / config.targetMean) * 100
        : 0;

    // Upper and Lower 3SD specification limits for Cpk
    const usl = config.targetMean + 3 * config.targetSd;
    const lsl = config.targetMean - 3 * config.targetSd;
    const cpu = (usl - mean) / (3 * sd);
    const cpl = (mean - lsl) / (3 * sd);
    const cpkIndex = Math.max(0, Math.min(cpu, cpl));

    return {
      calculatedMean: Number(mean.toFixed(3)),
      calculatedSd: Number(sd.toFixed(4)),
      cvPercent: Number(cvPercent.toFixed(2)),
      biasPercent: Number(biasPercent.toFixed(2)),
      cpkIndex: Number(cpkIndex.toFixed(2)),
    };
  }

  private buildLeveyJenningsSeries(
    sameLevelPoints: QcDataPoint[],
    allParamPoints: QcDataPoint[]
  ): LeveyJenningsPlotPoint[] {
    return sameLevelPoints.map((pt, idx) => {
      const subSeriesSameLevel = sameLevelPoints.slice(0, idx + 1);
      const batchPoints = allParamPoints.filter((p) => p.runBatchId === pt.runBatchId);
      const subAllPoints = allParamPoints.slice(
        0,
        allParamPoints.findIndex((p) => p.pointId === pt.pointId) + 1
      );

      const pointViolations = this.runSixWestgardRules(
        pt,
        subSeriesSameLevel,
        batchPoints,
        subAllPoints
      ).map((v) => v.ruleCode);

      const absZ = Math.abs(pt.zScore);
      const bandClassification: LeveyJenningsPlotPoint['bandClassification'] =
        absZ <= 1.0
          ? 'WITHIN_1SD'
          : absZ <= 2.0
          ? 'BETWEEN_1SD_2SD'
          : absZ <= 3.0
          ? 'BETWEEN_2SD_3SD'
          : 'BEYOND_3SD';

      return {
        pointId: pt.pointId,
        timestamp: pt.timestamp,
        measuredValue: pt.measuredValue,
        zScore: pt.zScore,
        level: pt.level,
        bandClassification,
        violatedRules: pointViolations,
      };
    });
  }
}
