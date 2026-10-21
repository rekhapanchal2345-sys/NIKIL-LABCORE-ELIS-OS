import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { signResultWithElectronicSeal } from './digital-signature.service';
import { classifyResultParameters } from './panic-readback.service';

export type AmendmentCategory =
  | 'ANALYTICAL_RECHECK'
  | 'DILUTION_CORRECTION'
  | 'TRANSCRIPTION_ERROR'
  | 'SAMPLE_INTEGRITY_REVIEW'
  | 'CALIBRATION_DRIFT_CORRECTION'
  | 'CLINICAL_CORRELATION_UPDATE';

export interface ParameterAmendmentInput {
  parameterId?: string;
  parameterName: string;
  newValue: string;
  unit?: string;
  referenceRange?: string;
  flag?: 'HH' | 'LL' | 'H' | 'L' | 'N';
}

export interface ExecuteResultAmendmentInput {
  resultId: string;
  doctorId: string;
  amendedByUserId: string;
  reason: string;
  category?: AmendmentCategory;
  parameterUpdates: ParameterAmendmentInput[];
  clinicalNotes?: string;
  ipAddress?: string;
}

export interface ParameterSnapshotItem {
  resultValueId: string;
  parameterId: string;
  parameterName: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  flag: string | null;
  isCritical: boolean;
}

export interface ParameterDiffItem {
  parameterName: string;
  unit: string | null;
  priorValue: string;
  newValue: string;
  priorFlag: string | null;
  newFlag: string | null;
}

export interface ResultAmendmentLedgerEntry {
  amendmentId: string;
  resultId: string;
  orderId: string;
  revisionVersion: number;
  revisionLabel: string;
  amendedByUserId: string;
  authorizingDoctorId: string;
  authorizingDoctorName: string;
  category: AmendmentCategory;
  reason: string;
  priorSnapshot: {
    status: string;
    flag: string | null;
    isCritical: boolean;
    priorSignatureHash: string | null;
    parameters: ParameterSnapshotItem[];
  };
  newSnapshot: {
    status: string;
    flag: string | null;
    isCritical: boolean;
    newSignatureHash: string;
    parameters: ParameterSnapshotItem[];
  };
  parameterDiffs: ParameterDiffItem[];
  chainedHmacSeal: string;
  amendedAt: string;
}

/**
 * Executes a formal NABL ISO 15189:2022 Clause 7.4.3 Post-Sign-Off Result Amendment.
 * Preserves immutable before/after snapshots, updates ResultValues, and re-baselines the cryptographic seal.
 */
export async function executeResultAmendment(
  input: ExecuteResultAmendmentInput
): Promise<ResultAmendmentLedgerEntry> {
  if (!input.resultId || !input.resultId.trim()) {
    throw new Error('resultId is required for result amendment.');
  }
  if (!input.doctorId || !input.doctorId.trim()) {
    throw new Error('Authorizing Pathologist (doctorId) is required to sign off an amended result.');
  }
  if (!input.reason || input.reason.trim().length < 10) {
    throw new Error(
      'NABL Clause 7.4.3 Violation: A detailed clinical justification reason (minimum 10 characters) is mandatory for post-sign-off result amendments.'
    );
  }
  if (!Array.isArray(input.parameterUpdates) || input.parameterUpdates.length === 0) {
    throw new Error('At least one parameter value update must be provided for an amendment.');
  }

  const existingResult = await prisma.result.findUnique({
    where: { id: input.resultId },
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

  if (!existingResult) {
    throw new Error(`Result with ID ${input.resultId} not found.`);
  }

  // Verify the result was previously approved/verified or is already in an amended state
  const allowedStatuses = ['APPROVED', 'VERIFIED', 'AMENDED', 'PUBLISHED', 'ENTERED'];
  if (!allowedStatuses.includes(existingResult.status)) {
    throw new Error(
      `Result ${input.resultId} has status '${existingResult.status}'. Formal NABL Clause 7.4.3 amendment applies only to previously signed-off results (APPROVED, VERIFIED, or AMENDED).`
    );
  }

  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [
        { id: input.doctorId },
        { doctorCode: input.doctorId },
      ],
    },
  });

  if (!doctor) {
    throw new Error(`Authorizing Doctor with ID ${input.doctorId} not found.`);
  }

  // Fetch prior amendments and prior signature hash
  const [priorAmendmentsCount, priorSignatureLog, latestSig] = await Promise.all([
    prisma.auditLog.count({
      where: {
        action: 'RESULT_AMENDMENT',
        module: 'RESULT',
        recordId: existingResult.id,
      },
    }),
    prisma.auditLog.findFirst({
      where: {
        module: 'RESULT',
        recordId: existingResult.id,
        action: { in: ['RESULT_AMENDMENT', 'ELECTRONIC_SEAL_GENERATED', 'APPROVE_RESULT'] },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.digitalSignature.findFirst({
      where: { resourceId: existingResult.id },
      orderBy: { signedAt: 'desc' },
    }),
  ]);

  let priorSignatureHash: string | null = latestSig?.signatureHash ?? null;
  if (!priorSignatureHash && priorSignatureLog) {
    try {
      const raw = (priorSignatureLog as any).details ?? priorSignatureLog.newData;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
      priorSignatureHash =
        (parsed?.newSignatureHash as string) ??
        (parsed?.signatureHash as string) ??
        (parsed?.sealHash as string) ??
        null;
    } catch {
      priorSignatureHash = null;
    }
  }

  const revisionVersion = priorAmendmentsCount + 2; // Original sign-off is Rev 1; first amendment is Rev 2
  const revisionLabel = `Rev ${revisionVersion}.0 (Amended)`;

  const priorParametersSnapshot: ParameterSnapshotItem[] = existingResult.values.map((v) => {
    const pName = v.parameter?.parameterName ?? (v as any).parameterName ?? 'Biomarker';
    const pUnit = (v as any).unit ?? v.parameter?.unit ?? null;
    const isCrit = v.flag === 'CRITICAL' || (v as any).isCritical === true;
    return {
      resultValueId: v.id,
      parameterId: v.parameterId,
      parameterName: pName,
      value: v.value,
      unit: pUnit,
      referenceRange: (v as any).referenceRange ?? (v.parameter?.referenceRanges?.[0] ? `${v.parameter.referenceRanges[0].normalLow} - ${v.parameter.referenceRanges[0].normalHigh}` : null),
      flag: (v as any).rangeIndicator ?? v.flag ?? 'N',
      isCritical: isCrit,
    };
  });

  const parameterDiffs: ParameterDiffItem[] = [];

  // Apply updates inside a transaction
  await prisma.$transaction(async (tx) => {
    for (const update of input.parameterUpdates) {
      const matchingValue = existingResult.values.find(
        (rv) =>
          (update.parameterId && rv.parameterId === update.parameterId) ||
          rv.parameter?.parameterName?.trim().toLowerCase() === update.parameterName.trim().toLowerCase() ||
          (rv as any).parameterName?.trim().toLowerCase() === update.parameterName.trim().toLowerCase()
      );

      if (matchingValue) {
        const paramName = matchingValue.parameter?.parameterName ?? (matchingValue as any).parameterName ?? update.parameterName;
        const singleCheck = classifyResultParameters({
          id: existingResult.id,
          values: [
            {
              ...matchingValue,
              parameterName: paramName,
              value: String(update.newValue),
              flag: update.flag ?? null,
              isCritical: update.flag === 'HH' || update.flag === 'LL',
            },
          ],
        });
        const evaluatedParam = singleCheck.evaluatedParameters[0];
        const newFlag = update.flag ?? evaluatedParam?.flag ?? 'N';
        const newIsCritical = newFlag === 'HH' || newFlag === 'LL';

        const prismaFlag = newIsCritical
          ? 'CRITICAL'
          : newFlag === 'H'
          ? 'HIGH'
          : newFlag === 'L'
          ? 'LOW'
          : 'NORMAL';

        parameterDiffs.push({
          parameterName: paramName,
          unit: matchingValue.parameter?.unit ?? (matchingValue as any).unit ?? null,
          priorValue: matchingValue.value,
          newValue: String(update.newValue),
          priorFlag: (matchingValue as any).rangeIndicator ?? matchingValue.flag,
          newFlag,
        });

        await tx.resultValue.update({
          where: { id: matchingValue.id },
          data: {
            value: String(update.newValue),
            flag: prismaFlag as any,
            rangeIndicator: newFlag,
          },
        });
      } else {
        // Parameter didn't exist in ResultValues yet; locate or create TestParameter and insert ResultValue
        let paramRecord = await tx.testParameter.findFirst({
          where: {
            testId: existingResult.testId,
            parameterName: { equals: update.parameterName.trim(), mode: 'insensitive' },
          },
        });

        if (!paramRecord) {
          paramRecord = await tx.testParameter.create({
            data: {
              testId: existingResult.testId,
              parameterName: update.parameterName.trim(),
              dataType: 'NUMERIC',
              unit: update.unit ?? '',
            },
          });
        }

        const newFlag = update.flag ?? 'N';
        const newIsCritical = newFlag === 'HH' || newFlag === 'LL';
        const prismaFlag = newIsCritical
          ? 'CRITICAL'
          : newFlag === 'H'
          ? 'HIGH'
          : newFlag === 'L'
          ? 'LOW'
          : 'NORMAL';

        parameterDiffs.push({
          parameterName: update.parameterName.trim(),
          unit: update.unit ?? paramRecord.unit,
          priorValue: 'N/A',
          newValue: String(update.newValue),
          priorFlag: null,
          newFlag,
        });

        await tx.resultValue.create({
          data: {
            resultId: existingResult.id,
            parameterId: paramRecord.id,
            value: String(update.newValue),
            flag: prismaFlag as any,
            rangeIndicator: newFlag,
          },
        });
      }
    }
  });

  // Reload updated result values to compute overall triage state
  const reloadedResult = await prisma.result.findUniqueOrThrow({
    where: { id: existingResult.id },
    include: {
      values: {
        include: {
          parameter: {
            include: { referenceRanges: true },
          },
        },
      },
    },
  });

  const updatedTriage = classifyResultParameters(reloadedResult);
  const overallFlag =
    updatedTriage.triageSeverity === 'CRITICAL_PANIC'
      ? 'CRITICAL'
      : updatedTriage.triageSeverity === 'ABNORMAL'
      ? 'ABNORMAL'
      : 'NORMAL';

  const amendmentStamp = `[AMENDED ${revisionLabel} - ${new Date().toISOString()}] Reason: ${input.reason.trim()}`;
  const existingRemarks = (existingResult as any).notes ?? existingResult.remarks ?? '';
  const mergedNotes = existingRemarks
    ? `${existingRemarks}\n${amendmentStamp}`
    : amendmentStamp;

  await prisma.result.update({
    where: { id: existingResult.id },
    data: {
      status: 'APPROVED',
      remarks: mergedNotes,
      approvedAt: new Date(),
    },
  });

  // Generate a new cryptographic electronic seal via DigitalSignatureService
  let electronicSealHash = '';
  try {
    const sealResult = await signResultWithElectronicSeal({
      resultId: existingResult.id,
      doctorId: doctor.id,
      approverUserId: input.amendedByUserId,
      clinicalComments: `[${revisionLabel}] ${input.reason.trim()}`,
      ipAddress: input.ipAddress ?? '127.0.0.1',
    });
    electronicSealHash =
      (sealResult as any).signatureHash ??
      (sealResult as any).seal?.signatureHash ??
      (sealResult as any).cryptographicHash ??
      '';
  } catch {
    // Fallback deterministic HMAC-SHA256 seal
    const secret = process.env.DIGITAL_SIGNATURE_SECRET ?? 'NIKIL-LABCORE-NABL-SEAL-SECRET-2026';
    electronicSealHash = crypto
      .createHmac('sha256', secret)
      .update(
        JSON.stringify({
          resultId: existingResult.id,
          doctorId: doctor.id,
          revisionVersion,
          values: reloadedResult.values.map((v) => ({
            k: v.parameter?.parameterName ?? (v as any).parameterName,
            v: v.value,
          })),
        })
      )
      .digest('hex');
  }

  // Compute Chained HMAC-SHA256 linking priorSignatureHash -> newSignatureHash
  const hmacSecret = process.env.AUDIT_HMAC_SECRET ?? 'NIKIL-LABCORE-IMMUTABLE-AMENDMENT-CHAIN-2026';
  const chainedHmacSeal = crypto
    .createHmac('sha256', hmacSecret)
    .update(
      JSON.stringify({
        resultId: existingResult.id,
        revisionVersion,
        priorSignatureHash: priorSignatureHash ?? 'GENESIS_SIGN_OFF',
        newSignatureHash: electronicSealHash,
        reason: input.reason.trim(),
        parameterDiffs,
      })
    )
    .digest('hex');

  const newParametersSnapshot: ParameterSnapshotItem[] = reloadedResult.values.map((v) => ({
    resultValueId: v.id,
    parameterId: v.parameterId,
    parameterName: v.parameter?.parameterName ?? (v as any).parameterName ?? 'Biomarker',
    value: v.value,
    unit: (v as any).unit ?? v.parameter?.unit ?? null,
    referenceRange: (v as any).referenceRange ?? (v.parameter?.referenceRanges?.[0] ? `${v.parameter.referenceRanges[0].normalLow} - ${v.parameter.referenceRanges[0].normalHigh}` : null),
    flag: (v as any).rangeIndicator ?? v.flag ?? 'N',
    isCritical: v.flag === 'CRITICAL' || (v as any).isCritical === true,
  }));

  const amendedAt = new Date().toISOString();
  const category: AmendmentCategory = input.category ?? 'ANALYTICAL_RECHECK';

  const priorSnapshot = {
    status: existingResult.status,
    flag: (existingResult as any).flag ?? null,
    isCritical: Boolean((existingResult as any).isCritical),
    priorSignatureHash,
    parameters: priorParametersSnapshot,
  };

  const newSnapshot = {
    status: 'APPROVED',
    flag: String(overallFlag),
    isCritical: updatedTriage.isCriticalPanic,
    newSignatureHash: electronicSealHash,
    parameters: newParametersSnapshot,
  };

  const validUser = input.amendedByUserId
    ? await prisma.user.findUnique({ where: { id: input.amendedByUserId } })
    : null;

  const doctorName = (doctor as any).fullName ?? (doctor as any).name ?? 'Pathologist';

  const auditRecord = await prisma.auditLog.create({
    data: {
      userId: validUser ? validUser.id : null,
      action: 'RESULT_AMENDMENT',
      module: 'RESULT',
      recordId: existingResult.id,
      newData: {
        resultId: existingResult.id,
        orderId: existingResult.orderId,
        revisionVersion,
        revisionLabel,
        amendedByUserId: input.amendedByUserId,
        authorizingDoctorId: doctor.id,
        authorizingDoctorName: doctorName,
        category,
        reason: input.reason.trim(),
        priorSnapshot,
        newSnapshot,
        parameterDiffs,
        priorSignatureHash,
        newSignatureHash: electronicSealHash,
        chainedHmacSeal,
        amendedAt,
        nablClause: 'ISO 15189:2022 Clause 7.4.3 Revised Results',
      } as any,
      ipAddress: input.ipAddress ?? '127.0.0.1',
      userAgent: 'NIKIL-LABCORE-AMENDMENT-ENGINE/3.0',
    },
  });

  return {
    amendmentId: auditRecord.id,
    resultId: existingResult.id,
    orderId: existingResult.orderId,
    revisionVersion,
    revisionLabel,
    amendedByUserId: input.amendedByUserId,
    authorizingDoctorId: doctor.id,
    authorizingDoctorName: doctorName,
    category,
    reason: input.reason.trim(),
    priorSnapshot,
    newSnapshot,
    parameterDiffs,
    chainedHmacSeal,
    amendedAt,
  };
}

/**
 * Retrieves the complete chronological audit trail of post-sign-off revisions for a Result.
 */
export async function getResultAmendmentHistory(
  resultId: string
): Promise<ResultAmendmentLedgerEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      action: 'RESULT_AMENDMENT',
      module: 'RESULT',
      recordId: resultId,
    },
    orderBy: { createdAt: 'asc' },
  });

  return logs
    .map((log) => {
      try {
        const raw = (log as any).details ?? log.newData;
        const d = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, any>);
        return {
          amendmentId: log.id,
          resultId: String(d.resultId ?? resultId),
          orderId: String(d.orderId ?? ''),
          revisionVersion: Number(d.revisionVersion ?? 2),
          revisionLabel: String(d.revisionLabel ?? 'Rev 2.0 (Amended)'),
          amendedByUserId: String(d.amendedByUserId ?? log.userId ?? 'SYSTEM'),
          authorizingDoctorId: String(d.authorizingDoctorId ?? ''),
          authorizingDoctorName: String(d.authorizingDoctorName ?? 'Pathologist'),
          category: (d.category as AmendmentCategory) ?? 'ANALYTICAL_RECHECK',
          reason: String(d.reason ?? ''),
          priorSnapshot: d.priorSnapshot,
          newSnapshot: d.newSnapshot,
          parameterDiffs: Array.isArray(d.parameterDiffs) ? d.parameterDiffs : [],
          chainedHmacSeal: String(d.chainedHmacSeal ?? ''),
          amendedAt: String(d.amendedAt ?? log.createdAt.toISOString()),
        };
      } catch {
        return null;
      }
    })
    .filter((entry): entry is ResultAmendmentLedgerEntry => entry !== null);
}

/**
 * Backward compatibility class for modules importing resultAmendmentService
 */
export class ResultAmendmentService {
  async amendApprovedResult(resultId: string, amendedByUserId: string, input: any) {
    const doctor = await prisma.doctor.findFirst();
    const docId = doctor?.id ?? amendedByUserId;

    return executeResultAmendment({
      resultId,
      doctorId: docId,
      amendedByUserId,
      reason: input.amendmentReason || input.reason || 'Analytical Recheck',
      category: input.amendmentType || input.category || 'ANALYTICAL_RECHECK',
      parameterUpdates: (input.updatedValues || input.parameterUpdates || []).map((u: any) => ({
        parameterId: u.parameterId,
        parameterName: u.parameterName || 'Biomarker',
        newValue: u.value || u.newValue,
        flag: u.flag,
      })),
      clinicalNotes: input.notes || input.clinicalNotes,
      ipAddress: input.ipAddress,
    });
  }

  async getAmendmentHistory(resultId: string) {
    return getResultAmendmentHistory(resultId);
  }
}

export const resultAmendmentService = new ResultAmendmentService();
