import { prisma } from '../../lib/prisma';

export type TriageColor = 'RED' | 'YELLOW' | 'GREEN';
export type TriageSeverity = 'CRITICAL_PANIC' | 'ABNORMAL' | 'NORMAL';

export interface EvaluatedParameterTriage {
  resultValueId: string;
  parameterId: string;
  parameterName: string;
  value: string;
  numericValue: number | null;
  unit: string | null;
  referenceRange: string | null;
  flag: 'HH' | 'LL' | 'H' | 'L' | 'N';
  severity: TriageSeverity;
  panicThresholdBreached: string | null;
}

export interface TelephonicReadBackRecord {
  readBackId: string;
  resultId: string;
  orderId: string;
  recipientDoctorName: string;
  recipientDesignation: string;
  wardOrDepartment: string;
  contactNumber: string;
  communicatedValuesSummary: string;
  readBackVerified: boolean;
  communicatedByUserId: string;
  communicatedByName: string;
  recordedAt: string;
  clinicalNotes?: string;
}

export interface TriageQueueItem {
  resultId: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientAgeGender: string;
  testId: string;
  testName: string;
  testCode: string;
  status: string;
  triageColor: TriageColor;
  triagePriorityRank: 1 | 2 | 3;
  triageSeverity: TriageSeverity;
  isCriticalPanic: boolean;
  requiresTelephonicReadBack: boolean;
  readBackCompleted: boolean;
  latestReadBack: TelephonicReadBackRecord | null;
  evaluatedParameters: EvaluatedParameterTriage[];
  enteredAt: string;
}

export interface RecordTelephonicReadBackInput {
  resultId?: string;
  panicLogId?: string;
  recipientDoctorName?: string;
  notifiedDoctorName?: string;
  recipientDesignation?: string;
  wardOrDepartment?: string;
  contactNumber?: string;
  doctorPhone?: string;
  communicatedValuesSummary?: string;
  readBackVerified?: boolean;
  readBackConfirmed?: boolean;
  communicatedByUserId?: string;
  notifiedByUserId?: string;
  communicatedByName?: string;
  notifiedByUserName?: string;
  clinicalNotes?: string;
  clinicalActionRemarks?: string;
}

// Built-in physiological critical panic boundaries fallback per NABL/ICMR guidelines
export const CRITICAL_PANIC_FALLBACKS: Record<
  string,
  { criticalLow?: number; criticalHigh?: number; minNormal?: number; maxNormal?: number }
> = {
  POTASSIUM: { criticalLow: 2.8, minNormal: 3.5, maxNormal: 5.1, criticalHigh: 6.2 },
  'SERUM POTASSIUM': { criticalLow: 2.8, minNormal: 3.5, maxNormal: 5.1, criticalHigh: 6.2 },
  SODIUM: { criticalLow: 120, minNormal: 135, maxNormal: 145, criticalHigh: 160 },
  'SERUM SODIUM': { criticalLow: 120, minNormal: 135, maxNormal: 145, criticalHigh: 160 },
  GLUCOSE: { criticalLow: 45, minNormal: 70, maxNormal: 100, criticalHigh: 450 },
  'FASTING BLOOD GLUCOSE': { criticalLow: 45, minNormal: 70, maxNormal: 100, criticalHigh: 450 },
  HEMOGLOBIN: { criticalLow: 6.5, minNormal: 12.0, maxNormal: 17.0, criticalHigh: 20.0 },
  HB: { criticalLow: 6.5, minNormal: 12.0, maxNormal: 17.0, criticalHigh: 20.0 },
  PLATELETS: { criticalLow: 30000, minNormal: 150000, maxNormal: 450000, criticalHigh: 1000000 },
  'PLATELET COUNT': { criticalLow: 30000, minNormal: 150000, maxNormal: 450000, criticalHigh: 1000000 },
  CREATININE: { criticalLow: 0.2, minNormal: 0.6, maxNormal: 1.3, criticalHigh: 6.0 },
  'SERUM CREATININE': { criticalLow: 0.2, minNormal: 0.6, maxNormal: 1.3, criticalHigh: 6.0 },
  TROPONIN: { minNormal: 0, maxNormal: 0.04, criticalHigh: 0.4 },
  CALCIUM: { criticalLow: 6.5, minNormal: 8.5, maxNormal: 10.5, criticalHigh: 13.0 },
};

/**
 * Parses a referenceRange string like "3.5 - 5.1" or "70-110" into [min, max].
 */
export function parseReferenceRangeBounds(rangeStr?: string | null): { min?: number; max?: number } {
  if (!rangeStr) return {};
  const match = rangeStr.match(/(-?\d+(?:\.\d+)?)\s*[-–—to]+\s*(-?\d+(?:\.\d+)?)/i);
  if (match) {
    return {
      min: parseFloat(match[1]),
      max: parseFloat(match[2]),
    };
  }
  return {};
}

/**
 * Evaluates a single Result and its ResultValues into NABL Clause 7.4.2 Triage Classification.
 */
export function classifyResultParameters(
  result: {
    id: string;
    isCritical?: boolean;
    flag?: string | null;
    values: Array<{
      id: string;
      parameterId: string;
      parameterName?: string;
      value: string;
      unit?: string | null;
      referenceRange?: string | null;
      flag?: string | null;
      isCritical?: boolean;
      parameter?: {
        parameterName?: string;
        unit?: string | null;
        minNormal?: number | null;
        maxNormal?: number | null;
        criticalLow?: number | null;
        criticalHigh?: number | null;
        referenceRanges?: Array<{
          criticalLow?: any;
          criticalHigh?: any;
          normalLow?: any;
          normalHigh?: any;
        }>;
      } | null;
    }>;
  }
): {
  triageColor: TriageColor;
  triagePriorityRank: 1 | 2 | 3;
  triageSeverity: TriageSeverity;
  isCriticalPanic: boolean;
  evaluatedParameters: EvaluatedParameterTriage[];
} {
  const evaluatedParameters: EvaluatedParameterTriage[] = [];

  for (const rv of result.values) {
    const rawFlag = String(rv.flag ?? '').trim().toUpperCase();
    const parsedNum = Number(rv.value);
    const numericValue = !Number.isNaN(parsedNum) && String(rv.value).trim() !== '' ? parsedNum : null;

    const paramName = rv.parameterName ?? rv.parameter?.parameterName ?? 'Biomarker';
    const paramUpper = paramName.trim().toUpperCase();
    const fallback = CRITICAL_PANIC_FALLBACKS[paramUpper] ?? {};
    const parsedRange = parseReferenceRangeBounds(rv.referenceRange);

    let critLow = (rv.parameter as any)?.criticalLow ?? fallback.criticalLow ?? null;
    let critHigh = (rv.parameter as any)?.criticalHigh ?? fallback.criticalHigh ?? null;
    let minNorm = (rv.parameter as any)?.minNormal ?? parsedRange.min ?? fallback.minNormal ?? null;
    let maxNorm = (rv.parameter as any)?.maxNormal ?? parsedRange.max ?? fallback.maxNormal ?? null;

    if (rv.parameter?.referenceRanges && rv.parameter.referenceRanges.length > 0) {
      const rr = rv.parameter.referenceRanges[0];
      if (rr.criticalLow != null) critLow = Number(rr.criticalLow);
      if (rr.criticalHigh != null) critHigh = Number(rr.criticalHigh);
      if (rr.normalLow != null) minNorm = Number(rr.normalLow);
      if (rr.normalHigh != null) maxNorm = Number(rr.normalHigh);
    }

    let computedFlag: 'HH' | 'LL' | 'H' | 'L' | 'N' = 'N';
    let severity: TriageSeverity = 'NORMAL';
    let panicThresholdBreached: string | null = null;

    const unitStr = rv.unit ?? rv.parameter?.unit ?? '';

    if (rawFlag === 'HH' || rawFlag === 'CRITICAL_HIGH') {
      computedFlag = 'HH';
      severity = 'CRITICAL_PANIC';
      panicThresholdBreached = critHigh !== null ? `> ${critHigh}` : 'Critical High Flag (HH)';
    } else if (rawFlag === 'LL' || rawFlag === 'CRITICAL_LOW') {
      computedFlag = 'LL';
      severity = 'CRITICAL_PANIC';
      panicThresholdBreached = critLow !== null ? `< ${critLow}` : 'Critical Low Flag (LL)';
    } else if (numericValue !== null && critHigh !== null && numericValue >= critHigh) {
      computedFlag = 'HH';
      severity = 'CRITICAL_PANIC';
      panicThresholdBreached = `>= ${critHigh} ${unitStr}`.trim();
    } else if (numericValue !== null && critLow !== null && numericValue <= critLow) {
      computedFlag = 'LL';
      severity = 'CRITICAL_PANIC';
      panicThresholdBreached = `<= ${critLow} ${unitStr}`.trim();
    } else if (rv.isCritical || rawFlag === 'CRITICAL' || rawFlag === 'PANIC') {
      computedFlag = numericValue !== null && minNorm !== null && numericValue < minNorm ? 'LL' : 'HH';
      severity = 'CRITICAL_PANIC';
      panicThresholdBreached = 'Critical Panic Threshold Breached';
    } else if (rawFlag === 'H' || rawFlag === 'HIGH' || rawFlag === 'ABNORMAL') {
      computedFlag = 'H';
      severity = 'ABNORMAL';
    } else if (rawFlag === 'L' || rawFlag === 'LOW') {
      computedFlag = 'L';
      severity = 'ABNORMAL';
    } else if (numericValue !== null && maxNorm !== null && numericValue > maxNorm) {
      computedFlag = 'H';
      severity = 'ABNORMAL';
    } else if (numericValue !== null && minNorm !== null && numericValue < minNorm) {
      computedFlag = 'L';
      severity = 'ABNORMAL';
    }

    evaluatedParameters.push({
      resultValueId: rv.id,
      parameterId: rv.parameterId,
      parameterName: paramName,
      value: rv.value,
      numericValue,
      unit: unitStr || null,
      referenceRange: rv.referenceRange ?? (minNorm !== null && maxNorm !== null ? `${minNorm} - ${maxNorm}` : null),
      flag: computedFlag,
      severity,
      panicThresholdBreached,
    });
  }

  const hasCriticalParam =
    Boolean(result.isCritical) ||
    result.flag === 'CRITICAL' ||
    result.flag === 'HH' ||
    result.flag === 'LL' ||
    evaluatedParameters.some((p) => p.severity === 'CRITICAL_PANIC');

  const hasAbnormalParam =
    result.flag === 'ABNORMAL' ||
    result.flag === 'H' ||
    result.flag === 'L' ||
    evaluatedParameters.some((p) => p.severity === 'ABNORMAL');

  if (hasCriticalParam) {
    return {
      triageColor: 'RED',
      triagePriorityRank: 1,
      triageSeverity: 'CRITICAL_PANIC',
      isCriticalPanic: true,
      evaluatedParameters,
    };
  }

  if (hasAbnormalParam) {
    return {
      triageColor: 'YELLOW',
      triagePriorityRank: 2,
      triageSeverity: 'ABNORMAL',
      isCriticalPanic: false,
      evaluatedParameters,
    };
  }

  return {
    triageColor: 'GREEN',
    triagePriorityRank: 3,
    triageSeverity: 'NORMAL',
    isCriticalPanic: false,
    evaluatedParameters,
  };
}

/**
 * Fetches the latest verified telephonic read-back record for a given resultId from the AuditLog ledger.
 */
export async function getLatestTelephonicReadBack(
  resultId: string
): Promise<TelephonicReadBackRecord | null> {
  const log = await prisma.auditLog.findFirst({
    where: {
      action: 'PANIC_TELEPHONIC_READBACK',
      module: 'RESULT',
      recordId: resultId,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!log) return null;
  const rawDetails = (log as any).details ?? log.newData;
  if (!rawDetails) return null;

  try {
    const parsed = typeof rawDetails === 'string' ? JSON.parse(rawDetails) : (rawDetails as Record<string, unknown>);
    if (!parsed.readBackVerified) return null;
    return {
      readBackId: log.id,
      resultId: String(parsed.resultId ?? resultId),
      orderId: String(parsed.orderId ?? ''),
      recipientDoctorName: String(parsed.recipientDoctorName ?? ''),
      recipientDesignation: String(parsed.recipientDesignation ?? 'Attending Physician'),
      wardOrDepartment: String(parsed.wardOrDepartment ?? ''),
      contactNumber: String(parsed.contactNumber ?? ''),
      communicatedValuesSummary: String(parsed.communicatedValuesSummary ?? ''),
      readBackVerified: Boolean(parsed.readBackVerified),
      communicatedByUserId: String(parsed.communicatedByUserId ?? log.userId ?? 'SYSTEM'),
      communicatedByName: String(parsed.communicatedByName ?? 'Clinical Pathologist'),
      recordedAt: String(parsed.recordedAt ?? log.createdAt.toISOString()),
      clinicalNotes: parsed.clinicalNotes ? String(parsed.clinicalNotes) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Logs a mandatory NABL Clause 7.4.2 & NABH telephonic read-back confirmation for a critical panic result.
 */
export async function recordTelephonicReadBack(
  input: RecordTelephonicReadBackInput
): Promise<TelephonicReadBackRecord> {
  const effectiveResultId = (input.resultId || input.panicLogId || '').trim();
  const doctorName = (input.recipientDoctorName || input.notifiedDoctorName || '').trim();
  const ward = (input.wardOrDepartment || 'Clinical Ward / Department').trim();
  const contact = (input.contactNumber || input.doctorPhone || '').trim();
  const verified = input.readBackVerified === true || input.readBackConfirmed === true;

  if (!effectiveResultId) {
    throw new Error('resultId is required to log telephonic read-back.');
  }
  if (!doctorName || doctorName.length < 2) {
    throw new Error('Recipient Doctor / Clinician Name is mandatory for NABL panic read-back.');
  }
  if (!ward || ward.length < 2) {
    throw new Error('Hospital Ward / Clinical Department is mandatory for NABL panic read-back.');
  }
  if (!contact || contact.length < 6) {
    throw new Error('Valid recipient contact number / extension is mandatory.');
  }
  if (!verified) {
    throw new Error(
      'NABH / NABL Clause 7.4.2 Violation: Verbal Read-Back Verification checkbox must be explicitly confirmed (readBackVerified = true).'
    );
  }

  const result = await prisma.result.findUnique({
    where: { id: effectiveResultId },
    include: {
      values: {
        include: {
          parameter: {
            include: { referenceRanges: true },
          },
        },
      },
      test: true,
      order: {
        include: { patient: true },
      },
    },
  });

  if (!result) {
    throw new Error(`Result with ID ${input.resultId} not found.`);
  }

  const triage = classifyResultParameters(result);
  const testDisplayName = (result.test as any)?.testName ?? (result.test as any)?.name ?? 'Biochemistry Test';

  const panicParamsSummary =
    input.communicatedValuesSummary?.trim() ||
    triage.evaluatedParameters
      .filter((p) => p.severity === 'CRITICAL_PANIC' || p.severity === 'ABNORMAL')
      .map((p) => `${p.parameterName}: ${p.value} ${p.unit ?? ''} [${p.flag}]`.trim())
      .join('; ') ||
    `${testDisplayName}: Critical Alert Communicated`;

  const recordedAt = new Date().toISOString();
  const patientFullName = result.order?.patient
    ? `${result.order.patient.firstName} ${result.order.patient.lastName}`.trim()
    : 'Unknown Patient';

  const payload = {
    resultId: result.id,
    orderId: result.orderId,
    patientId: result.patientId,
    patientName: patientFullName,
    testName: testDisplayName,
    recipientDoctorName: doctorName,
    recipientDesignation: (input.recipientDesignation ?? 'Attending Physician').trim(),
    wardOrDepartment: ward,
    contactNumber: contact,
    communicatedValuesSummary: panicParamsSummary,
    readBackVerified: true,
    communicatedByUserId: input.communicatedByUserId ?? input.notifiedByUserId ?? 'PATHOLOGIST-DESK',
    communicatedByName: input.communicatedByName ?? input.notifiedByUserName ?? 'Duty Pathologist',
    recordedAt,
    clinicalNotes: (input.clinicalNotes || input.clinicalActionRemarks)?.trim(),
    nablStandard: 'ISO 15189:2022 Clause 7.4.2 Critical Alert Notification',
  };

  const commUserId = input.communicatedByUserId ?? input.notifiedByUserId;
  const validUser = commUserId
    ? await prisma.user.findUnique({ where: { id: commUserId } })
    : null;

  const auditEntry = await prisma.auditLog.create({
    data: {
      userId: validUser ? validUser.id : null,
      action: 'PANIC_TELEPHONIC_READBACK',
      module: 'RESULT',
      recordId: result.id,
      newData: payload as any,
      ipAddress: '127.0.0.1',
      userAgent: 'NIKIL-LABCORE-PANIC-TRIAGE/3.0',
    },
  });

  // Append read-back confirmation stamp to Result remarks/notes for immediate visibility on reports
  const readBackNote = `[NABL READ-BACK VERIFIED ${recordedAt}] Dr. ${payload.recipientDoctorName} (${payload.wardOrDepartment}, Ph: ${payload.contactNumber}) - Values: ${panicParamsSummary}`;
  const existingNotes = (result as any).notes ?? result.remarks ?? '';
  const updatedNotes = existingNotes ? `${existingNotes}\n${readBackNote}` : readBackNote;

  await prisma.result.update({
    where: { id: result.id },
    data: {
      remarks: updatedNotes,
    },
  });

  return {
    readBackId: auditEntry.id,
    resultId: result.id,
    orderId: result.orderId,
    recipientDoctorName: payload.recipientDoctorName,
    recipientDesignation: payload.recipientDesignation,
    wardOrDepartment: payload.wardOrDepartment,
    contactNumber: payload.contactNumber,
    communicatedValuesSummary: payload.communicatedValuesSummary,
    readBackVerified: true,
    communicatedByUserId: payload.communicatedByUserId,
    communicatedByName: payload.communicatedByName,
    recordedAt,
    clinicalNotes: payload.clinicalNotes,
  };
}

/**
 * Returns the color-sorted Triage Queue (RED Panic -> YELLOW Abnormal -> GREEN Normal).
 */
export async function getPrioritizedTriageQueue(options?: {
  status?: string;
  limit?: number;
}): Promise<{
  summary: {
    total: number;
    redPanicCount: number;
    unacknowledgedPanicCount: number;
    yellowAbnormalCount: number;
    greenNormalCount: number;
  };
  queue: TriageQueueItem[];
}> {
  const takeLimit = Math.min(Math.max(options?.limit ?? 100, 1), 250);
  const statusFilter = options?.status
    ? { status: options.status as any }
    : { status: { in: ['ENTERED', 'VERIFIED', 'PENDING', 'APPROVED', 'PUBLISHED'] as any } };

  const results = await prisma.result.findMany({
    where: statusFilter,
    include: {
      values: {
        include: {
          parameter: {
            include: { referenceRanges: true },
          },
        },
      },
      test: true,
      order: {
        include: { patient: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: takeLimit,
  });

  const resultIds = results.map((r) => r.id);
  const readBackLogs = await prisma.auditLog.findMany({
    where: {
      action: 'PANIC_TELEPHONIC_READBACK',
      module: 'RESULT',
      recordId: { in: resultIds },
    },
    orderBy: { createdAt: 'desc' },
  });

  const readBackMap = new Map<string, TelephonicReadBackRecord>();
  for (const log of readBackLogs) {
    const key = log.recordId ?? (log as any).entityId;
    if (!key || readBackMap.has(key)) continue;
    const rawDetails = (log as any).details ?? log.newData;
    if (!rawDetails) continue;
    try {
      const parsed = typeof rawDetails === 'string' ? JSON.parse(rawDetails) : (rawDetails as Record<string, unknown>);
      if (parsed.readBackVerified) {
        readBackMap.set(key, {
          readBackId: log.id,
          resultId: key,
          orderId: String(parsed.orderId ?? ''),
          recipientDoctorName: String(parsed.recipientDoctorName ?? ''),
          recipientDesignation: String(parsed.recipientDesignation ?? 'Attending Physician'),
          wardOrDepartment: String(parsed.wardOrDepartment ?? ''),
          contactNumber: String(parsed.contactNumber ?? ''),
          communicatedValuesSummary: String(parsed.communicatedValuesSummary ?? ''),
          readBackVerified: true,
          communicatedByUserId: String(parsed.communicatedByUserId ?? 'SYSTEM'),
          communicatedByName: String(parsed.communicatedByName ?? 'Pathologist'),
          recordedAt: String(parsed.recordedAt ?? log.createdAt.toISOString()),
          clinicalNotes: parsed.clinicalNotes ? String(parsed.clinicalNotes) : undefined,
        });
      }
    } catch {
      // Ignore malformed log
    }
  }

  const queue: TriageQueueItem[] = results.map((r) => {
    const classification = classifyResultParameters(r);
    const latestReadBack = readBackMap.get(r.id) ?? null;
    const readBackCompleted = Boolean(latestReadBack?.readBackVerified);

    const patient = r.order?.patient;
    const patientName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : 'Unknown Patient';
    const patientUhid = (patient as any)?.uhid ?? (patient as any)?.patientId ?? 'UHID-NA';
    const patientAgeGender = patient ? `${patient.age ?? 0}Y / ${patient.gender}` : 'NA';

    const testName = (r.test as any)?.testName ?? (r.test as any)?.name ?? 'Test';
    const testCode = (r.test as any)?.testCode ?? (r.test as any)?.code ?? 'TEST';

    return {
      resultId: r.id,
      orderId: r.orderId,
      orderNumber: r.order?.orderNumber ?? 'ORD-UNKNOWN',
      patientId: r.patientId ?? '',
      patientName,
      patientUhid,
      patientAgeGender,
      testId: r.testId,
      testName,
      testCode,
      status: r.status,
      triageColor: classification.triageColor,
      triagePriorityRank: classification.triagePriorityRank,
      triageSeverity: classification.triageSeverity,
      isCriticalPanic: classification.isCriticalPanic,
      requiresTelephonicReadBack: classification.isCriticalPanic,
      readBackCompleted,
      latestReadBack,
      evaluatedParameters: classification.evaluatedParameters,
      enteredAt: (r.enteredAt ?? r.createdAt).toISOString(),
    };
  });

  // Sort strictly by priority: RED (1) -> YELLOW (2) -> GREEN (3), with unacknowledged panics first
  queue.sort((a, b) => {
    if (a.triagePriorityRank !== b.triagePriorityRank) {
      return a.triagePriorityRank - b.triagePriorityRank;
    }
    if (a.isCriticalPanic && b.isCriticalPanic && a.readBackCompleted !== b.readBackCompleted) {
      return a.readBackCompleted ? 1 : -1;
    }
    return new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime();
  });

  const redPanicCount = queue.filter((q) => q.triageColor === 'RED').length;
  const unacknowledgedPanicCount = queue.filter(
    (q) => q.triageColor === 'RED' && !q.readBackCompleted
  ).length;
  const yellowAbnormalCount = queue.filter((q) => q.triageColor === 'YELLOW').length;
  const greenNormalCount = queue.filter((q) => q.triageColor === 'GREEN').length;

  return {
    summary: {
      total: queue.length,
      redPanicCount,
      unacknowledgedPanicCount,
      yellowAbnormalCount,
      greenNormalCount,
    },
    queue,
  };
}

/**
 * Report Dispatch Guard: Asserts that all critical panic results in an Order have documented telephonic read-backs.
 * Blocks PDF dispatch or final release if any panic value lacks a verified read-back.
 */
export async function assertOrderClearedForReportDispatch(orderId: string): Promise<{
  cleared: true;
  orderId: string;
  checkedResultsCount: number;
  verifiedPanicReadBacks: TelephonicReadBackRecord[];
}> {
  const results = await prisma.result.findMany({
    where: { orderId },
    include: {
      values: {
        include: {
          parameter: {
            include: { referenceRanges: true },
          },
        },
      },
      test: true,
    },
  });

  if (results.length === 0) {
    throw new Error(`No results found for Order ID ${orderId}.`);
  }

  const verifiedPanicReadBacks: TelephonicReadBackRecord[] = [];
  const blockedResults: Array<{ resultId: string; testName: string; panicParameters: string[] }> = [];

  for (const res of results) {
    const classification = classifyResultParameters(res);
    const testTitle = (res.test as any)?.testName ?? (res.test as any)?.name ?? 'Test';

    if (classification.isCriticalPanic) {
      const readBack = await getLatestTelephonicReadBack(res.id);
      if (!readBack || !readBack.readBackVerified) {
        blockedResults.push({
          resultId: res.id,
          testName: testTitle,
          panicParameters: classification.evaluatedParameters
            .filter((p) => p.severity === 'CRITICAL_PANIC')
            .map((p) => `${p.parameterName} (${p.value} ${p.unit ?? ''})`.trim()),
        });
      } else {
        verifiedPanicReadBacks.push(readBack);
      }
    }
  }

  if (blockedResults.length > 0) {
    const details = blockedResults
      .map((b) => `${b.testName} [${b.panicParameters.join(', ')}]`)
      .join('; ');
    throw new Error(
      `NABL Clause 7.4.2 Dispatch Block: Order ${orderId} has critical panic results lacking mandatory telephonic read-back confirmation: ${details}`
    );
  }

  return {
    cleared: true,
    orderId,
    checkedResultsCount: results.length,
    verifiedPanicReadBacks,
  };
}

/**
 * Backward compatibility class for modules importing panicReadBackService
 */
export class PanicReadBackService {
  public detectLifeThreateningPanic(
    testCode: string,
    numericValue?: number,
    qualitativeValue?: string
  ) {
    const code = (testCode || '').toUpperCase();
    if ((code === 'K' || code === 'POTASSIUM') && typeof numericValue === 'number') {
      if (numericValue > 6.5) return { isPanic: true, ruleDescription: 'Hyperkalemia Panic: Potassium > 6.5 mmol/L' };
      if (numericValue < 2.5) return { isPanic: true, ruleDescription: 'Hypokalemia Panic: Potassium < 2.5 mmol/L' };
    }
    if ((code === 'PLT' || code === 'PLATELETS') && typeof numericValue === 'number') {
      if (numericValue < 20000) return { isPanic: true, ruleDescription: 'Severe Thrombocytopenia Panic: Platelets < 20,000 /µL' };
    }
    return { isPanic: false, ruleDescription: 'Normal / Non-Panic' };
  }

  public async triggerCriticalPanicAlert(input: any) {
    return {
      id: `PANIC-${Date.now()}`,
      resultId: input.resultId,
      parameterName: input.parameterName,
      panicValue: input.panicValue,
      status: 'UNACKNOWLEDGED',
    };
  }

  public async listPanicReadBackLedger(onlyUnresolved: boolean = false) {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'PANIC_TELEPHONIC_READBACK',
        module: 'RESULT',
      },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((l) => {
      const raw = (l as any).details ?? l.newData;
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    });
  }

  public async recordTelephonicReadBack(input: RecordTelephonicReadBackInput) {
    return recordTelephonicReadBack(input);
  }

  public async assertOrderClearedForReportDispatch(orderId: string) {
    return assertOrderClearedForReportDispatch(orderId);
  }
}

export const panicReadBackService = new PanicReadBackService();
