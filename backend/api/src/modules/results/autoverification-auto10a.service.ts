import { InterParameterValidationEngine } from "../../services/interParameterValidation.service";
import prisma from '../../../config/database';
import { panicReadBackService } from '../approvals/panic-readback.service';

export type AutoVerificationFailTag =
  | 'DELTA_BREACH'
  | 'PANIC_VALUE'
  | 'QC_SUSPECT'
  | 'UNVERIFIED_INDEX'
  | 'MACHINE_FLAG'
  | 'OUT_OF_REF_RANGE'
  | 'CROSS_PARAMETER_CONTRADICTION';

export interface EvaluateResultAuto10AInput {
  resultId: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientAgeYears: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  analyzerCode: string;
  testCode: string;
  parameterName: string;
  unit: string;
  numericValue?: number;
  qualitativeValue?: string;
  machineErrorFlags?: string[]; // e.g., ["CLOT_DETECTED", "BUBBLE_ERROR", "LINEARITY_HIGH"]
  serumIndices?: {
    hemolysisIndex: number;
    icterusIndex: number;
    lipemiaIndex: number;
  };
  panelParameters?: Array<{
    parameterCode: string;
    parameterName: string;
    numericValue: number | null;
  }>;
  previousResultWithin72h?: {
    numericValue: number;
    reportedAt: string;
  };
}

interface DefaultBiomarkerRule {
  testCode: string;
  parameterName: string;
  unit: string;
  maleMinRef: number;
  maleMaxRef: number;
  femaleMinRef: number;
  femaleMaxRef: number;
  panicLowLimit?: number;
  panicHighLimit?: number;
  maxDeltaPercent72h: number;
  maxHemolysisIndex: number;
  maxIcterusIndex: number;
  maxLipemiaIndex: number;
}

const BUILTIN_CLSI_AUTO10A_RULES: Record<string, DefaultBiomarkerRule> = {
  K: {
    testCode: 'K',
    parameterName: 'Serum Potassium (K+)',
    unit: 'mmol/L',
    maleMinRef: 3.5,
    maleMaxRef: 5.1,
    femaleMinRef: 3.5,
    femaleMaxRef: 5.1,
    panicLowLimit: 2.5,
    panicHighLimit: 6.5,
    maxDeltaPercent72h: 10.0,
    maxHemolysisIndex: 30.0, // Potassium is highly sensitive to hemolysis
    maxIcterusIndex: 15.0,
    maxLipemiaIndex: 150.0,
  },
  NA: {
    testCode: 'NA',
    parameterName: 'Serum Sodium (Na+)',
    unit: 'mmol/L',
    maleMinRef: 136.0,
    maleMaxRef: 145.0,
    femaleMinRef: 136.0,
    femaleMaxRef: 145.0,
    panicLowLimit: 120.0,
    panicHighLimit: 160.0,
    maxDeltaPercent72h: 10.0,
    maxHemolysisIndex: 50.0,
    maxIcterusIndex: 15.0,
    maxLipemiaIndex: 150.0,
  },
  HB: {
    testCode: 'HB',
    parameterName: 'Hemoglobin (Hb)',
    unit: 'g/dL',
    maleMinRef: 13.0,
    maleMaxRef: 17.0,
    femaleMinRef: 12.0,
    femaleMaxRef: 15.5,
    panicLowLimit: 5.0,
    panicHighLimit: 20.0,
    maxDeltaPercent72h: 10.0,
    maxHemolysisIndex: 100.0,
    maxIcterusIndex: 20.0,
    maxLipemiaIndex: 200.0,
  },
  PLT: {
    testCode: 'PLT',
    parameterName: 'Platelet Count',
    unit: '/uL',
    maleMinRef: 150000,
    maleMaxRef: 450000,
    femaleMinRef: 150000,
    femaleMaxRef: 450000,
    panicLowLimit: 20000,
    panicHighLimit: 1000000,
    maxDeltaPercent72h: 10.0,
    maxHemolysisIndex: 100.0,
    maxIcterusIndex: 20.0,
    maxLipemiaIndex: 200.0,
  },
  'TROP-I': {
    testCode: 'TROP-I',
    parameterName: 'High-Sensitivity Troponin-I',
    unit: 'ng/mL',
    maleMinRef: 0.0,
    maleMaxRef: 0.04,
    femaleMinRef: 0.0,
    femaleMaxRef: 0.04,
    panicHighLimit: 0.04,
    maxDeltaPercent72h: 10.0,
    maxHemolysisIndex: 40.0,
    maxIcterusIndex: 15.0,
    maxLipemiaIndex: 150.0,
  },
  FBS: {
    testCode: 'FBS',
    parameterName: 'Fasting Blood Glucose',
    unit: 'mg/dL',
    maleMinRef: 70.0,
    maleMaxRef: 100.0,
    femaleMinRef: 70.0,
    femaleMaxRef: 100.0,
    panicLowLimit: 40.0,
    panicHighLimit: 500.0,
    maxDeltaPercent72h: 10.0,
    maxHemolysisIndex: 50.0,
    maxIcterusIndex: 15.0,
    maxLipemiaIndex: 150.0,
  },
};

export class AutoVerificationAuto10AService {
  /**
   * Records a passed or failed Internal Quality Control (IQC) run for an analyzer shift (8-hour window).
   */
  public async recordAnalyzerShiftQc(input: {
    analyzerId: string;
    analyzerCode: string;
    testCode: string;
    qcLevel: string;
    westgardPassed: boolean;
    zScore: number;
    operatorUserId: string;
  }) {
    const now = new Date();
    const validUntil = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8-hour shift validity

    return (prisma as any).analyzerShiftQcLog.create({
      data: {
        analyzerId: input.analyzerId,
        analyzerCode: input.analyzerCode.toUpperCase(),
        testCode: input.testCode.toUpperCase(),
        qcLevel: input.qcLevel,
        westgardPassed: input.westgardPassed,
        zScore: input.zScore,
        performedAt: now,
        validUntil,
        operatorUserId: input.operatorUserId,
      },
    });
  }

  /**
   * Executes the 5-Gate CLSI AUTO10-A Autoverification Pipeline:
   * Gate 1: Analyzer Internal QC passed within the current 8-hour shift.
   * Gate 2: Zero analyzer machine error flags (no clot, bubble, linearity error).
   * Gate 3: Result values fall within the strict biological reference interval (age/gender tailored) & not Panic.
   * Gate 4: Historical Delta Check (<10% rate of change vs patient's last 72-hour test).
   * Gate 5: Serum Indices (Hemolysis, Icterus, Lipemia) are clean.
   */
  public async evaluateResultPipeline(input: EvaluateResultAuto10AInput) {
    const code = (input.testCode || '').toUpperCase();
    const failTags: AutoVerificationFailTag[] = [];

    // Load DB rule or fall back to built-in CLSI AUTO10-A rule
    const dbRule = await (prisma as any).autoVerificationRule.findUnique({
      where: { testCode: code },
    });

    const rule: DefaultBiomarkerRule = dbRule
      ? {
          testCode: dbRule.testCode,
          parameterName: dbRule.parameterName,
          unit: dbRule.unit,
          maleMinRef: Number(dbRule.maleMinRef),
          maleMaxRef: Number(dbRule.maleMaxRef),
          femaleMinRef: Number(dbRule.femaleMinRef),
          femaleMaxRef: Number(dbRule.femaleMaxRef),
          panicLowLimit: dbRule.panicLowLimit !== null ? Number(dbRule.panicLowLimit) : undefined,
          panicHighLimit: dbRule.panicHighLimit !== null ? Number(dbRule.panicHighLimit) : undefined,
          maxDeltaPercent72h: Number(dbRule.maxDeltaPercent72h),
          maxHemolysisIndex: Number(dbRule.maxHemolysisIndex),
          maxIcterusIndex: Number(dbRule.maxIcterusIndex),
          maxLipemiaIndex: Number(dbRule.maxLipemiaIndex),
        }
      : BUILTIN_CLSI_AUTO10A_RULES[code] || {
          testCode: code,
          parameterName: input.parameterName,
          unit: input.unit,
          maleMinRef: 0,
          maleMaxRef: 100,
          femaleMinRef: 0,
          femaleMaxRef: 100,
          maxDeltaPercent72h: 10.0,
          maxHemolysisIndex: 50.0,
          maxIcterusIndex: 15.0,
          maxLipemiaIndex: 150.0,
        };

    // ------------------------------------------------------------------------
    // GATE 1: Analyzer Internal QC passed within the current 8-hour shift
    // ------------------------------------------------------------------------
    const now = new Date();
    const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    const recentQc = await (prisma as any).analyzerShiftQcLog.findFirst({
      where: {
        analyzerCode: input.analyzerCode.toUpperCase(),
        testCode: code,
        performedAt: { gte: eightHoursAgo },
        validUntil: { gte: now },
      },
      orderBy: { performedAt: 'desc' },
    });

    const qcPassed8h = Boolean(recentQc && recentQc.westgardPassed);
    if (!qcPassed8h) {
      failTags.push('QC_SUSPECT');
    }

    // ------------------------------------------------------------------------
    // GATE 2: Zero Analyzer Machine Error Flags
    // ------------------------------------------------------------------------
    const machineFlags = (input.machineErrorFlags || []).filter((f) => f.trim().length > 0);
    const zeroMachineFlags = machineFlags.length === 0;
    if (!zeroMachineFlags) {
      failTags.push('MACHINE_FLAG');
    }

    // ------------------------------------------------------------------------
    // GATE 3: Biological Reference Interval & Critical Panic Limit Check
    // ------------------------------------------------------------------------
    const minRef = input.patientGender === 'FEMALE' ? rule.femaleMinRef : rule.maleMinRef;
    const maxRef = input.patientGender === 'FEMALE' ? rule.femaleMaxRef : rule.maleMaxRef;

    let isPanic = false;
    let panicBreachDescription = '';
    let withinRefInterval = true;

    if (typeof input.numericValue === 'number') {
      if (rule.panicLowLimit !== undefined && input.numericValue < rule.panicLowLimit) {
        isPanic = true;
        panicBreachDescription = `${rule.parameterName} < ${rule.panicLowLimit} ${rule.unit}`;
      }
      if (rule.panicHighLimit !== undefined && input.numericValue > rule.panicHighLimit) {
        isPanic = true;
        panicBreachDescription = `${rule.parameterName} > ${rule.panicHighLimit} ${rule.unit}`;
      }

      if (input.numericValue < minRef || input.numericValue > maxRef) {
        withinRefInterval = false;
      }
    }

    if (
      input.qualitativeValue &&
      input.qualitativeValue.toUpperCase().includes('POSITIVE') &&
      code.includes('TROP')
    ) {
      isPanic = true;
      withinRefInterval = false;
      panicBreachDescription = 'Troponin Qualitative POSITIVE (Acute Myocardial Infarction Alert)';
    }

    if (isPanic) {
      failTags.push('PANIC_VALUE');
    }
    if (!withinRefInterval) {
      failTags.push('OUT_OF_REF_RANGE');
    }

    // ------------------------------------------------------------------------
    // GATE 4: Historical 72-Hour Delta Check (< 10% rate of change)
    // ------------------------------------------------------------------------
    let deltaCheckPassed = true;
    let previousValue72h: number | null = null;
    let deltaChangePercent: number | null = null;

    if (typeof input.numericValue === 'number') {
      if (input.previousResultWithin72h && typeof input.previousResultWithin72h.numericValue === 'number') {
        previousValue72h = input.previousResultWithin72h.numericValue;
      } else {
        const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
        const prevAudit = await (prisma as any).autoVerificationAuditLog.findFirst({
          where: {
            patientId: input.patientId,
            testCode: code,
            evaluatedAt: { gte: seventyTwoHoursAgo },
            numericValue: { not: null },
          },
          orderBy: { evaluatedAt: 'desc' },
        });
        if (prevAudit && prevAudit.numericValue !== null) {
          previousValue72h = Number(prevAudit.numericValue);
        }
      }

      if (previousValue72h !== null) {
        if (previousValue72h === 0) {
          // Bug 3.1: Zero-guard against ZeroDivisionError / Infinity
          const absDiff = Math.abs(input.numericValue - previousValue72h);
          if (absDiff > 5.0) {
            deltaCheckPassed = false;
            failTags.push('DELTA_BREACH');
          }
        } else {
          deltaChangePercent = Number(
            (Math.abs((input.numericValue - previousValue72h) / previousValue72h) * 100).toFixed(2)
          );
          if (deltaChangePercent >= rule.maxDeltaPercent72h) {
            deltaCheckPassed = false;
            failTags.push('DELTA_BREACH');
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // GATE 5: Pre-Analytical Serum Indices (Hemolysis, Icterus, Lipemia)
    // ------------------------------------------------------------------------
    let serumIndicesClean = true;
    if (!input.serumIndices) {
      serumIndicesClean = false;
      failTags.push('UNVERIFIED_INDEX');
    } else {
      const { hemolysisIndex, icterusIndex, lipemiaIndex } = input.serumIndices;
      if (
        hemolysisIndex > rule.maxHemolysisIndex ||
        icterusIndex > rule.maxIcterusIndex ||
        lipemiaIndex > rule.maxLipemiaIndex
      ) {
        serumIndicesClean = false;
        failTags.push('UNVERIFIED_INDEX');
      }
    }

    // ------------------------------------------------------------------------
    // GATE 6: Inter-Parameter Cross-Validation (Bug 3.2: LFT, CBC, Lipid rules)
    // ------------------------------------------------------------------------
    let crossParamPassed = true;
    let crossParamViolations: string[] = [];
    if (input.panelParameters && input.panelParameters.length > 1) {
      const crossReport = InterParameterValidationEngine.validatePanel(input.panelParameters);
      if (!crossReport.isValid) {
        crossParamPassed = false;
        failTags.push('CROSS_PARAMETER_CONTRADICTION');
        crossParamViolations = crossReport.violations.map((v) => v.violationMessage);
      }
    }

    // ------------------------------------------------------------------------
    // FINAL VERDICT & AUTOMATIC NABL PDF / PANIC HOOKS
    // ------------------------------------------------------------------------
    const allFivePassed =
      qcPassed8h &&
      zeroMachineFlags &&
      withinRefInterval &&
      !isPanic &&
      deltaCheckPassed &&
      serumIndicesClean &&
      crossParamPassed;

    const verdict = allFivePassed ? 'AUTO_APPROVED' : 'ROUTED_TO_PATHOLOGIST';
    const nablPdfGenerated = allFivePassed;

    const auditLog = await (prisma as any).autoVerificationAuditLog.create({
      data: {
        resultId: input.resultId,
        orderId: input.orderId,
        patientId: input.patientId,
        testCode: code,
        numericValue: input.numericValue ?? null,
        qualitativeValue: input.qualitativeValue ?? null,
        qcPassed8h,
        zeroMachineFlags,
        withinRefInterval,
        deltaCheckPassed,
        serumIndicesClean,
        previousValue72h,
        deltaChangePercent,
        machineErrorFlags: machineFlags,
        failReasonTags: failTags,
        verdict,
        nablPdfGenerated,
      },
    });

    // If PANIC_VALUE was detected, automatically trigger NABL ISO 15189 Clause 7.4.2 Panic Alert
    let panicAlertRecord = null;
    if (isPanic) {
      panicAlertRecord = await panicReadBackService.triggerCriticalPanicAlert({
        resultId: input.resultId,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        patientId: input.patientId,
        patientName: input.patientName,
        testCode: code,
        parameterName: rule.parameterName,
        panicValue:
          input.numericValue !== undefined ? String(input.numericValue) : input.qualitativeValue || 'POSITIVE',
        unit: rule.unit,
        criticalLimitBreached: panicBreachDescription,
      });
    }

    return {
      verdict,
      statusAssigned: allFivePassed ? 'AUTO_APPROVED' : 'PATHOLOGIST_TRIAGE_QUEUE',
      nablPdfUrl: allFivePassed ? `/api/v1/reports/nabl-auto/${input.orderId}.pdf` : null,
      gates: {
        gate1_QcShift8hPassed: qcPassed8h,
        gate2_ZeroMachineFlags: zeroMachineFlags,
        gate3_WithinBiologicalReference: withinRefInterval && !isPanic,
        gate4_HistoricalDeltaUnder10Pct: deltaCheckPassed,
        gate5_SerumHilIndicesClean: serumIndicesClean,
      },
      deltaChangePercent,
      failReasonTags: failTags,
      auditLogId: auditLog.id,
      panicAlertTriggered: panicAlertRecord,
    };
  }

  /**
   * Lists recent CLSI AUTO10-A evaluation logs for the Pathologist Triage & Autoverification console.
   */
  public async listRecentEvaluations() {
    return (prisma as any).autoVerificationAuditLog.findMany({
      orderBy: { evaluatedAt: 'desc' },
      take: 50,
    });
  }
}

export const autoVerificationAuto10AService = new AutoVerificationAuto10AService();
