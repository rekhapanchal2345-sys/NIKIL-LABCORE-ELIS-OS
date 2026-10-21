import crypto from 'crypto';
import { prisma } from '../../lib/prisma';

export type ControlLevel = 'LEVEL_1_NORMAL' | 'LEVEL_2_PATHOLOGICAL';
export type QcRunStatus = 'PASSED' | 'WARNING_1_2S' | 'VIOLATED';

export type WestgardRuleCode =
  | '1_3S'
  | '2_2S'
  | 'R_4S'
  | '4_1S'
  | '10_X'
  | '1_2S';

export interface WestgardViolation {
  rule: WestgardRuleCode;
  severity: 'REJECTION' | 'WARNING';
  errorType: 'RANDOM_ERROR' | 'SYSTEMATIC_ERROR' | 'CALIBRATION_DRIFT' | 'WARNING_ALERT';
  description: string;
  clinicalDirective: string;
  involvedPointIndices: number[];
  involvedRunIds: string[];
}

export interface QcDataPoint {
  runId: string;
  runNumber: number;
  timestamp: string;
  controlLevel: ControlLevel;
  lotNumber: string;
  analyzerId: string;
  measuredValue: number;
  targetMean: number;
  targetSd: number;
  zScore: number;
  status: QcRunStatus;
  triggeredRules: WestgardRuleCode[];
  primaryDirective: string;
  operatorId: string;
}

export interface LeveyJenningsLimits {
  targetMean: number;
  targetSd: number;
  observedMean: number;
  observedSd: number;
  cvPercentage: number;
  plus1s: number;
  minus1s: number;
  plus2s: number;
  minus2s: number;
  plus3s: number;
  minus3s: number;
}

export interface ControlLevelSeries {
  controlLevel: ControlLevel;
  label: string;
  lotNumber: string;
  overallStatus: QcRunStatus;
  limits: LeveyJenningsLimits;
  dataPoints: QcDataPoint[];
  violations: WestgardViolation[];
  recommendedDirectives: string[];
}

export interface LeveyJenningsChartResponse {
  testCode: string;
  testName: string;
  unit: string;
  evaluatedAt: string;
  nablClause: string;
  clsiStandard: string;
  runClearedForPatientTesting: boolean;
  overallSystemStatus: QcRunStatus;
  levels: {
    level1: ControlLevelSeries;
    level2: ControlLevelSeries;
  };
}

export interface RecordQcRunInput {
  testCode: string;
  controlLevel: ControlLevel;
  measuredValue: number;
  targetMean: number;
  targetSd: number;
  lotNumber?: string;
  analyzerId?: string;
  operatorId?: string;
  timestamp?: Date;
}

const RULE_DIRECTIVES: Record<
  WestgardRuleCode,
  {
    severity: 'REJECTION' | 'WARNING';
    errorType: WestgardViolation['errorType'];
    description: string;
    clinicalDirective: string;
  }
> = {
  '1_3S': {
    severity: 'REJECTION',
    errorType: 'RANDOM_ERROR',
    description: 'Single control observation exceeds ±3s control limits (CLSI C24-A4 1-3s rejection).',
    clinicalDirective:
      'ABORT RUN IMMEDIATELY: Inspect sample/reagent probes for air bubbles or fibrin clots, verify pipetting precision, and rerun fresh QC material before releasing patient results.',
  },
  '2_2S': {
    severity: 'REJECTION',
    errorType: 'SYSTEMATIC_ERROR',
    description: 'Two consecutive control observations exceed the same +2s or -2s limit (2-2s systematic rejection).',
    clinicalDirective:
      'HOLD PATIENT BATCH: Perform two-point or full calibration on the reagent pack, verify reagent storage temperature, and re-assay both Control Level 1 and Level 2.',
  },
  R_4S: {
    severity: 'REJECTION',
    errorType: 'RANDOM_ERROR',
    description: 'Range between two consecutive control observations exceeds 4s (+2s to -2s swing).',
    clinicalDirective:
      'IMMEDIATE REJECTION: High imprecision detected. Check thermal water bath/incubation block stability, inspect syringe seals, and repeat analytical run.',
  },
  '4_1S': {
    severity: 'REJECTION',
    errorType: 'SYSTEMATIC_ERROR',
    description: 'Four consecutive control observations exceed the same +1s or -1s limit (4-1s shift).',
    clinicalDirective:
      'MAINTENANCE & CALIBRATION ALERT: Gradual systematic shift detected. Recalibrate reagent lot and inspect photometer lamp/optics stability.',
  },
  '10_X': {
    severity: 'REJECTION',
    errorType: 'CALIBRATION_DRIFT',
    description: 'Ten consecutive control observations fall on the same side of the target mean (10-x bias).',
    clinicalDirective:
      'CALIBRATION DRIFT: Long-term analytical bias. Schedule preventive analyzer maintenance, replace degraded reagent pack, and re-baseline calibrator.',
  },
  '1_2S': {
    severity: 'WARNING',
    errorType: 'WARNING_ALERT',
    description: 'Single control observation exceeds ±2s limit but remains within ±3s (1-2s warning flag).',
    clinicalDirective:
      'MONITOR NEXT RUN: Analytical run remains acceptable if no rejection rules are triggered. Inspect subsequent QC point closely for developing systematic trend.',
  },
};

function round4(val: number): number {
  return Math.round(val * 10000) / 10000;
}

/**
 * Calculates Levey-Jennings statistical parameters (Mean, SD, CV%, ±1s, ±2s, ±3s bands).
 */
export function calculateLeveyJenningsLimits(
  targetMean: number,
  targetSd: number,
  measuredValues: number[]
): LeveyJenningsLimits {
  if (targetSd <= 0) {
    throw new Error('Target Standard Deviation (s) must be strictly greater than zero.');
  }

  const n = measuredValues.length;
  const observedMean =
    n > 0 ? measuredValues.reduce((acc, v) => acc + v, 0) / n : targetMean;

  const variance =
    n > 1
      ? measuredValues.reduce((acc, v) => acc + Math.pow(v - observedMean, 2), 0) / (n - 1)
      : Math.pow(targetSd, 2);

  const observedSd = Math.sqrt(variance);
  const cvPercentage = observedMean !== 0 ? (observedSd / Math.abs(observedMean)) * 100 : 0;

  return {
    targetMean: round4(targetMean),
    targetSd: round4(targetSd),
    observedMean: round4(observedMean),
    observedSd: round4(observedSd),
    cvPercentage: round4(cvPercentage),
    plus1s: round4(targetMean + 1 * targetSd),
    minus1s: round4(targetMean - 1 * targetSd),
    plus2s: round4(targetMean + 2 * targetSd),
    minus2s: round4(targetMean - 2 * targetSd),
    plus3s: round4(targetMean + 3 * targetSd),
    minus3s: round4(targetMean - 3 * targetSd),
  };
}

/**
 * Evaluates CLSI C24-A4 Westgard Multi-Rules across consecutive QC observations.
 */
export function evaluateWestgardRules(
  rawPoints: Array<{
    runId: string;
    timestamp: string;
    controlLevel: ControlLevel;
    lotNumber: string;
    analyzerId: string;
    measuredValue: number;
    targetMean: number;
    targetSd: number;
    operatorId: string;
  }>
): {
  evaluatedPoints: QcDataPoint[];
  violations: WestgardViolation[];
  overallStatus: QcRunStatus;
  recommendedDirectives: string[];
} {
  const violations: WestgardViolation[] = [];
  const evaluatedPoints: QcDataPoint[] = [];

  const zScores = rawPoints.map((pt) => (pt.measuredValue - pt.targetMean) / pt.targetSd);

  for (let i = 0; i < rawPoints.length; i++) {
    const pt = rawPoints[i];
    const z = zScores[i];
    const absZ = Math.abs(z);
    const pointRules: WestgardRuleCode[] = [];

    // Rule 1: 1_3s (|z| > 3.0)
    if (absZ > 3.0) {
      pointRules.push('1_3S');
      violations.push({
        rule: '1_3S',
        ...RULE_DIRECTIVES['1_3S'],
        involvedPointIndices: [i],
        involvedRunIds: [pt.runId],
      });
    }

    // Rule 2: 2_2s (2 consecutive points > +2s or < -2s on same side)
    if (i >= 1) {
      const prevZ = zScores[i - 1];
      const bothHigh2s = z > 2.0 && prevZ > 2.0;
      const bothLow2s = z < -2.0 && prevZ < -2.0;
      if (bothHigh2s || bothLow2s) {
        pointRules.push('2_2S');
        violations.push({
          rule: '2_2S',
          ...RULE_DIRECTIVES['2_2S'],
          involvedPointIndices: [i - 1, i],
          involvedRunIds: [rawPoints[i - 1].runId, pt.runId],
        });
      }
    }

    // Rule 3: R_4s (Consecutive points on opposite sides of mean, one > +2s and one < -2s, range >= 4s)
    if (i >= 1) {
      const prevZ = zScores[i - 1];
      const opposite2sSwing =
        (z > 2.0 && prevZ < -2.0) || (z < -2.0 && prevZ > 2.0);
      const range4s = Math.abs(z - prevZ) >= 4.0 && z * prevZ < 0 && (Math.abs(z) >= 2.0 || Math.abs(prevZ) >= 2.0);
      if (opposite2sSwing || range4s) {
        pointRules.push('R_4S');
        violations.push({
          rule: 'R_4S',
          ...RULE_DIRECTIVES.R_4S,
          involvedPointIndices: [i - 1, i],
          involvedRunIds: [rawPoints[i - 1].runId, pt.runId],
        });
      }
    }

    // Rule 4: 4_1s (4 consecutive points > +1s or < -1s on same side)
    if (i >= 3) {
      const window4 = [zScores[i - 3], zScores[i - 2], zScores[i - 1], z];
      const allAbove1s = window4.every((val) => val > 1.0);
      const allBelowMinus1s = window4.every((val) => val < -1.0);
      if (allAbove1s || allBelowMinus1s) {
        pointRules.push('4_1S');
        violations.push({
          rule: '4_1S',
          ...RULE_DIRECTIVES['4_1S'],
          involvedPointIndices: [i - 3, i - 2, i - 1, i],
          involvedRunIds: [
            rawPoints[i - 3].runId,
            rawPoints[i - 2].runId,
            rawPoints[i - 1].runId,
            pt.runId,
          ],
        });
      }
    }

    // Rule 5: 10_x (10 consecutive points on same side of target mean)
    if (i >= 9) {
      const window10 = zScores.slice(i - 9, i + 1);
      const allPositive = window10.every((val) => val > 0);
      const allNegative = window10.every((val) => val < 0);
      if (allPositive || allNegative) {
        pointRules.push('10_X');
        violations.push({
          rule: '10_X',
          ...RULE_DIRECTIVES['10_X'],
          involvedPointIndices: Array.from({ length: 10 }, (_, k) => i - 9 + k),
          involvedRunIds: rawPoints.slice(i - 9, i + 1).map((r) => r.runId),
        });
      }
    }

    // Rule 6: 1_2s Warning (|z| > 2.0 and <= 3.0 when no rejection rule fired on this point)
    const hasRejectionRule = pointRules.length > 0;
    if (!hasRejectionRule && absZ > 2.0 && absZ <= 3.0) {
      pointRules.push('1_2S');
      violations.push({
        rule: '1_2S',
        ...RULE_DIRECTIVES['1_2S'],
        involvedPointIndices: [i],
        involvedRunIds: [pt.runId],
      });
    }

    let status: QcRunStatus = 'PASSED';
    if (pointRules.some((r) => r !== '1_2S')) {
      status = 'VIOLATED';
    } else if (pointRules.includes('1_2S')) {
      status = 'WARNING_1_2S';
    }

    const primaryRule = pointRules[0];
    const primaryDirective = primaryRule
      ? RULE_DIRECTIVES[primaryRule].clinicalDirective
      : 'IN-CONTROL: Analytical run within statistical quality boundaries (±2s). Proceed with patient verification.';

    evaluatedPoints.push({
      runId: pt.runId,
      runNumber: i + 1,
      timestamp: pt.timestamp,
      controlLevel: pt.controlLevel,
      lotNumber: pt.lotNumber,
      analyzerId: pt.analyzerId,
      measuredValue: round4(pt.measuredValue),
      targetMean: round4(pt.targetMean),
      targetSd: round4(pt.targetSd),
      zScore: round4(z),
      status,
      triggeredRules: pointRules,
      primaryDirective,
      operatorId: pt.operatorId,
    });
  }

  let overallStatus: QcRunStatus = 'PASSED';
  if (evaluatedPoints.some((p) => p.status === 'VIOLATED')) {
    overallStatus = 'VIOLATED';
  } else if (evaluatedPoints.some((p) => p.status === 'WARNING_1_2S')) {
    overallStatus = 'WARNING_1_2S';
  }

  const directivesSet = new Set<string>();
  for (const v of violations) {
    directivesSet.add(`[${v.rule}] ${v.clinicalDirective}`);
  }
  if (directivesSet.size === 0) {
    directivesSet.add(
      'ALL WESTGARD MULTIRULES PASSED: Analytical system is in statistical control per NABL ISO 15189:2022 Clause 7.3.'
    );
  }

  return {
    evaluatedPoints,
    violations,
    overallStatus,
    recommendedDirectives: Array.from(directivesSet),
  };
}

/**
 * Records a single QC control run into the immutable AuditLog ledger and evaluates its Westgard status.
 */
export async function recordQcControlRun(input: RecordQcRunInput): Promise<QcDataPoint> {
  const normalizedTestCode = input.testCode.trim().toUpperCase();
  if (!normalizedTestCode) {
    throw new Error('Test code is required to record a QC control run.');
  }
  if (input.targetSd <= 0) {
    throw new Error('Target SD must be strictly positive.');
  }

  const recordKey = `${normalizedTestCode}:${input.controlLevel}`;

  // Fetch existing runs for this testCode & controlLevel to evaluate multi-point rules in context
  const priorLogs = await prisma.auditLog.findMany({
    where: {
      action: 'QC_CONTROL_RUN',
      module: 'QC_ANALYTICAL_RUN',
      recordId: recordKey,
    },
    orderBy: { createdAt: 'asc' },
    take: 29,
  });

  const runId = `QC-${normalizedTestCode}-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const runTimestamp = (input.timestamp ?? new Date()).toISOString();
  const lotNumber =
    input.lotNumber ??
    (input.controlLevel === 'LEVEL_1_NORMAL' ? 'BIORAD-L1-49201' : 'BIORAD-L2-49202');
  const analyzerId = input.analyzerId ?? 'ROCHE-COBAS-PRO-C503';
  const operatorId = input.operatorId ?? 'SYSTEM-QC-ENGINE';

  const historicalRaw = priorLogs
    .map((log) => {
      try {
        const raw = (log as any).details ?? log.newData;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
        if (!parsed || typeof parsed.measuredValue !== 'number') return null;
        return {
          runId: String(parsed.runId ?? log.id),
          timestamp: String(parsed.timestamp ?? log.createdAt.toISOString()),
          controlLevel: (parsed.controlLevel as ControlLevel) ?? input.controlLevel,
          lotNumber: String(parsed.lotNumber ?? lotNumber),
          analyzerId: String(parsed.analyzerId ?? analyzerId),
          measuredValue: Number(parsed.measuredValue),
          targetMean: Number(parsed.targetMean ?? input.targetMean),
          targetSd: Number(parsed.targetSd ?? input.targetSd),
          operatorId: String(parsed.operatorId ?? log.userId ?? operatorId),
        };
      } catch {
        return null;
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const combinedRaw = [
    ...historicalRaw,
    {
      runId,
      timestamp: runTimestamp,
      controlLevel: input.controlLevel,
      lotNumber,
      analyzerId,
      measuredValue: input.measuredValue,
      targetMean: input.targetMean,
      targetSd: input.targetSd,
      operatorId,
    },
  ];

  const evaluation = evaluateWestgardRules(combinedRaw);
  const latestPoint = evaluation.evaluatedPoints[evaluation.evaluatedPoints.length - 1];

  await prisma.auditLog.create({
    data: {
      userId: null,
      action: 'QC_CONTROL_RUN',
      module: 'QC_ANALYTICAL_RUN',
      recordId: recordKey,
      newData: {
        testCode: normalizedTestCode,
        ...latestPoint,
      },
      ipAddress: '127.0.0.1',
      userAgent: 'NIKIL-LABCORE-WESTGARD-QC/3.0',
    },
  });

  return latestPoint;
}

/**
 * Default reference QC targets for common diagnostic tests when seeding or initializing a chart.
 */
const DEFAULT_TEST_QC_PROFILES: Record<
  string,
  {
    testName: string;
    unit: string;
    level1: { mean: number; sd: number; lot: string };
    level2: { mean: number; sd: number; lot: string };
  }
> = {
  GLU: {
    testName: 'Fasting Plasma Glucose (Hexokinase)',
    unit: 'mg/dL',
    level1: { mean: 92.0, sd: 2.5, lot: 'BIORAD-L1-88101' },
    level2: { mean: 248.0, sd: 6.2, lot: 'BIORAD-L2-88102' },
  },
  HBA1C: {
    testName: 'Glycated Hemoglobin (HbA1c - HPLC)',
    unit: '%',
    level1: { mean: 5.4, sd: 0.15, lot: 'BIORAD-LYPH-L1-501' },
    level2: { mean: 9.8, sd: 0.28, lot: 'BIORAD-LYPH-L2-502' },
  },
  CREAT: {
    testName: 'Serum Creatinine (Enzymatic IDMS)',
    unit: 'mg/dL',
    level1: { mean: 1.05, sd: 0.04, lot: 'ROCHE-PRECICONTROL-L1' },
    level2: { mean: 4.2, sd: 0.14, lot: 'ROCHE-PRECICONTROL-L2' },
  },
  K: {
    testName: 'Serum Potassium (ISE Indirect)',
    unit: 'mmol/L',
    level1: { mean: 4.2, sd: 0.1, lot: 'ISE-NORM-L1-901' },
    level2: { mean: 6.8, sd: 0.16, lot: 'ISE-PATH-L2-902' },
  },
  CBC001: {
    testName: 'Complete Blood Count — Hemoglobin (XN-1000)',
    unit: 'g/dL',
    level1: { mean: 13.5, sd: 0.3, lot: 'SYSMEX-XN-CHECK-L1' },
    level2: { mean: 7.2, sd: 0.2, lot: 'SYSMEX-XN-CHECK-L2' },
  },
};

/**
 * Seeds realistic QC control runs for a testCode if no runs exist yet, or when explicitly invoked in tests.
 */
export async function seedQcRunsForTest(
  testCode: string,
  options?: {
    clearExisting?: boolean;
    includeWarning12s?: boolean;
    includeOutlier13s?: boolean;
  }
): Promise<void> {
  const normalizedCode = testCode.trim().toUpperCase();
  const profile = DEFAULT_TEST_QC_PROFILES[normalizedCode] ?? {
    testName: `${normalizedCode} Quantitative Assay`,
    unit: 'U/L',
    level1: { mean: 100.0, sd: 4.0, lot: `QC-L1-${normalizedCode}-01` },
    level2: { mean: 250.0, sd: 10.0, lot: `QC-L2-${normalizedCode}-02` },
  };

  if (options?.clearExisting) {
    await prisma.auditLog.deleteMany({
      where: {
        action: 'QC_CONTROL_RUN',
        module: 'QC_ANALYTICAL_RUN',
        recordId: {
          in: [`${normalizedCode}:LEVEL_1_NORMAL`, `${normalizedCode}:LEVEL_2_PATHOLOGICAL`],
        },
      },
    });
  }

  // Deterministic z-score trajectory for Level 1 (Normal) & Level 2 (Pathological)
  const level1ZOffsets = [
    0.15,
    -0.4,
    0.6,
    -0.25,
    0.85,
    -0.55,
    0.3,
    -0.1,
    0.45,
    options?.includeWarning12s !== false ? 2.35 : 0.75, // Point 10: +2.35s triggers 1_2S warning
    -0.2,
    0.5,
  ];

  const level2ZOffsets = [
    -0.2,
    0.35,
    -0.5,
    0.4,
    -0.15,
    0.7,
    -0.6,
    0.25,
    -0.3,
    0.55,
    options?.includeOutlier13s !== false ? 3.45 : 0.65, // Point 11: +3.45s triggers 1_3S rejection
    0.1,
  ];

  const baseTime = Date.now() - 12 * 3600 * 1000;

  for (let i = 0; i < level1ZOffsets.length; i++) {
    const ts = new Date(baseTime + i * 3600 * 1000);
    const val1 = round4(profile.level1.mean + level1ZOffsets[i] * profile.level1.sd);
    await recordQcControlRun({
      testCode: normalizedCode,
      controlLevel: 'LEVEL_1_NORMAL',
      measuredValue: val1,
      targetMean: profile.level1.mean,
      targetSd: profile.level1.sd,
      lotNumber: profile.level1.lot,
      analyzerId: 'ROCHE-COBAS-PRO-C503',
      operatorId: 'TECH-QC-AUTO',
      timestamp: ts,
    });
  }

  for (let i = 0; i < level2ZOffsets.length; i++) {
    const ts = new Date(baseTime + i * 3600 * 1000);
    const val2 = round4(profile.level2.mean + level2ZOffsets[i] * profile.level2.sd);
    await recordQcControlRun({
      testCode: normalizedCode,
      controlLevel: 'LEVEL_2_PATHOLOGICAL',
      measuredValue: val2,
      targetMean: profile.level2.mean,
      targetSd: profile.level2.sd,
      lotNumber: profile.level2.lot,
      analyzerId: 'ROCHE-COBAS-PRO-C503',
      operatorId: 'TECH-QC-AUTO',
      timestamp: ts,
    });
  }
}

/**
 * Retrieves the complete Levey-Jennings QC series and Westgard evaluation for a given testCode.
 */
export async function getLeveyJenningsChartData(
  testCode: string,
  limit: number = 25
): Promise<LeveyJenningsChartResponse> {
  const normalizedCode = testCode.trim().toUpperCase();
  const clampedLimit = Math.min(Math.max(limit, 5), 100);

  const testRecord = await prisma.test.findFirst({
    where: {
      OR: [
        { testCode: { equals: normalizedCode, mode: 'insensitive' } },
        { id: normalizedCode },
      ],
    },
    include: {
      parameters: { take: 1 },
    },
  });

  const defaultProfile = DEFAULT_TEST_QC_PROFILES[normalizedCode] ?? {
    testName: (testRecord as any)?.testName ?? (testRecord as any)?.name ?? `${normalizedCode} Clinical Assay`,
    unit: testRecord?.parameters?.[0]?.unit ?? 'mg/dL',
    level1: { mean: 100.0, sd: 3.5, lot: `BIORAD-L1-${normalizedCode}` },
    level2: { mean: 240.0, sd: 8.0, lot: `BIORAD-L2-${normalizedCode}` },
  };

  let [level1Logs, level2Logs] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        action: 'QC_CONTROL_RUN',
        module: 'QC_ANALYTICAL_RUN',
        recordId: `${normalizedCode}:LEVEL_1_NORMAL`,
      },
      orderBy: { createdAt: 'asc' },
      take: clampedLimit,
    }),
    prisma.auditLog.findMany({
      where: {
        action: 'QC_CONTROL_RUN',
        module: 'QC_ANALYTICAL_RUN',
        recordId: `${normalizedCode}:LEVEL_2_PATHOLOGICAL`,
      },
      orderBy: { createdAt: 'asc' },
      take: clampedLimit,
    }),
  ]);

  if (level1Logs.length === 0 && level2Logs.length === 0) {
    await seedQcRunsForTest(normalizedCode, {
      clearExisting: false,
      includeWarning12s: true,
      includeOutlier13s: true,
    });
    [level1Logs, level2Logs] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          action: 'QC_CONTROL_RUN',
          module: 'QC_ANALYTICAL_RUN',
          recordId: `${normalizedCode}:LEVEL_1_NORMAL`,
        },
        orderBy: { createdAt: 'asc' },
        take: clampedLimit,
      }),
      prisma.auditLog.findMany({
        where: {
          action: 'QC_CONTROL_RUN',
          module: 'QC_ANALYTICAL_RUN',
          recordId: `${normalizedCode}:LEVEL_2_PATHOLOGICAL`,
        },
        orderBy: { createdAt: 'asc' },
        take: clampedLimit,
      }),
    ]);
  }

  const parseLogs = (
    logs: typeof level1Logs,
    fallbackLevel: ControlLevel,
    fallbackMean: number,
    fallbackSd: number,
    fallbackLot: string
  ) =>
    logs
      .map((l) => {
        try {
          const raw = (l as any).details ?? l.newData;
          const d = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
          return {
            runId: String(d?.runId ?? l.id),
            timestamp: String(d?.timestamp ?? l.createdAt.toISOString()),
            controlLevel: (d?.controlLevel as ControlLevel) ?? fallbackLevel,
            lotNumber: String(d?.lotNumber ?? fallbackLot),
            analyzerId: String(d?.analyzerId ?? 'ROCHE-COBAS-PRO-C503'),
            measuredValue: Number(d?.measuredValue ?? fallbackMean),
            targetMean: Number(d?.targetMean ?? fallbackMean),
            targetSd: Number(d?.targetSd ?? fallbackSd),
            operatorId: String(d?.operatorId ?? 'TECH-QC'),
          };
        } catch {
          return null;
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

  const rawL1 = parseLogs(
    level1Logs,
    'LEVEL_1_NORMAL',
    defaultProfile.level1.mean,
    defaultProfile.level1.sd,
    defaultProfile.level1.lot
  );
  const rawL2 = parseLogs(
    level2Logs,
    'LEVEL_2_PATHOLOGICAL',
    defaultProfile.level2.mean,
    defaultProfile.level2.sd,
    defaultProfile.level2.lot
  );

  const l1TargetMean = rawL1[0]?.targetMean ?? defaultProfile.level1.mean;
  const l1TargetSd = rawL1[0]?.targetSd ?? defaultProfile.level1.sd;
  const l2TargetMean = rawL2[0]?.targetMean ?? defaultProfile.level2.mean;
  const l2TargetSd = rawL2[0]?.targetSd ?? defaultProfile.level2.sd;

  const evalL1 = evaluateWestgardRules(rawL1);
  const evalL2 = evaluateWestgardRules(rawL2);

  const limitsL1 = calculateLeveyJenningsLimits(
    l1TargetMean,
    l1TargetSd,
    rawL1.map((r) => r.measuredValue)
  );
  const limitsL2 = calculateLeveyJenningsLimits(
    l2TargetMean,
    l2TargetSd,
    rawL2.map((r) => r.measuredValue)
  );

  let overallSystemStatus: QcRunStatus = 'PASSED';
  if (evalL1.overallStatus === 'VIOLATED' || evalL2.overallStatus === 'VIOLATED') {
    overallSystemStatus = 'VIOLATED';
  } else if (
    evalL1.overallStatus === 'WARNING_1_2S' ||
    evalL2.overallStatus === 'WARNING_1_2S'
  ) {
    overallSystemStatus = 'WARNING_1_2S';
  }

  return {
    testCode: normalizedCode,
    testName: (testRecord as any)?.testName ?? (testRecord as any)?.name ?? defaultProfile.testName,
    unit: testRecord?.parameters?.[0]?.unit ?? defaultProfile.unit,
    evaluatedAt: new Date().toISOString(),
    nablClause: 'NABL ISO 15189:2022 Clause 7.3.7 (Ensuring Validity of Examination Results)',
    clsiStandard: 'CLSI C24-A4 Statistical Quality Control for Quantitative Measurement Procedures',
    runClearedForPatientTesting: overallSystemStatus !== 'VIOLATED',
    overallSystemStatus,
    levels: {
      level1: {
        controlLevel: 'LEVEL_1_NORMAL',
        label: 'Control Level 1 (Normal Physiological Range)',
        lotNumber: rawL1[0]?.lotNumber ?? defaultProfile.level1.lot,
        overallStatus: evalL1.overallStatus,
        limits: limitsL1,
        dataPoints: evalL1.evaluatedPoints,
        violations: evalL1.violations,
        recommendedDirectives: evalL1.recommendedDirectives,
      },
      level2: {
        controlLevel: 'LEVEL_2_PATHOLOGICAL',
        label: 'Control Level 2 (High / Pathological Range)',
        lotNumber: rawL2[0]?.lotNumber ?? defaultProfile.level2.lot,
        overallStatus: evalL2.overallStatus,
        limits: limitsL2,
        dataPoints: evalL2.evaluatedPoints,
        violations: evalL2.violations,
        recommendedDirectives: evalL2.recommendedDirectives,
      },
    },
  };
}

/**
 * Backward compatibility class for modules importing leveyJenningsQcService
 */
export class LeveyJenningsQcService {
  async getChartByTestCode(testCode: string, limit?: number) {
    return getLeveyJenningsChartData(testCode, limit);
  }

  async getChartForApprovalItem(resultId: string) {
    const res = await prisma.result.findUnique({
      where: { id: resultId },
      include: { test: true },
    });
    const code = (res?.test as any)?.testCode ?? (res?.test as any)?.code ?? 'GLU';
    return getLeveyJenningsChartData(code);
  }
}

export const leveyJenningsQcService = new LeveyJenningsQcService();
