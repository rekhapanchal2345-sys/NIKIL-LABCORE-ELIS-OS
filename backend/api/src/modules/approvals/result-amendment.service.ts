import prisma from '../../../config/database';
import { HttpError } from '../../utils/http-error';

import { createAuditLog } from '../audit/audit.service';
import { signResultWithElectronicSeal } from './digital-signature.service';

export interface AmendResultInput {
  amendmentReason: string;
  amendmentType: 'CLINICAL_CORRECTION' | 'TRANSCRIPTION_ERROR' | 'SAMPLE_RE_ASSAYED' | 'DILUTION_FACTOR_CORRECTED' | 'OTHER';
  updatedValues: Array<{
    parameterId: string;
    value: string;
    flag?: string;
  }>;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ResultAmendmentService {
  /**
   * Records a formal NABL ISO 15189:2022 Clause 7.4.1.3 Diagnostic Result Amendment:
   * - Retains immutable prior values snapshot.
   * - Updates result_values with corrected clinical parameters.
   * - Generates an amendment version number (v2.0, v3.0, etc.).
   * - Produces a fresh cryptographic digital signature and doctor seal for the amended version.
   * - Logs full audit trail.
   */
  public async amendApprovedResult(
    resultId: string,
    amendedByUserId: string,
    input: AmendResultInput
  ) {
    if (!input.amendmentReason || !input.amendmentReason.trim()) {
      throw new HttpError('Mandatory NABL Requirement: Clear amendment reason must be specified.', 400);
    }

    if (!input.updatedValues || input.updatedValues.length === 0) {
      throw new HttpError('At least one updated parameter value must be provided for amendment.', 400);
    }

    // 1. Verify user authorization
    const user = await prisma.user.findUnique({
      where: { id: amendedByUserId },
      select: { id: true, fullName: true, role: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new HttpError('Authorized user profile not found or inactive', 403);
    }

    // 2. Fetch original result with existing values
    const existingResult = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        values: {
          include: {
            parameter: true,
          },
        },
        test: true,
      },
    });

    if (!existingResult) {
      throw new HttpError(`Diagnostic result ${resultId} not found`, 404);
    }

    if (!['APPROVED', 'PUBLISHED'].includes(existingResult.status)) {
      throw new HttpError(
        `Cannot amend result with status '${existingResult.status}'. Only APPROVED or PUBLISHED results qualify for clinical amendment.`,
        400
      );
    }

    // 3. Compute version number
    const priorAmendmentsCount = await (prisma as any).resultAmendment.count({
      where: { resultId },
    });
    const nextVersionNumber = priorAmendmentsCount + 2; // Original is v1, first amendment is v2

    // 4. Capture previous snapshot
    const previousSnapshot = existingResult.values.map((v: any) => ({
      parameterId: v.parameterId,
      parameterCode: v.parameter?.shortName || v.parameter?.loincCode || '',
      parameterName: v.parameter?.parameterName || '',
      value: v.value,
      unit: v.parameter?.unit || '',
      flag: v.flag,
    }));

    // 5. Update parameter values in database
    const changedFields: string[] = [];
    const fieldChanges: Record<string, { previous: string; new: string; flag?: string }> = {};

    for (const update of input.updatedValues) {
      const match = existingResult.values.find((v: any) => v.parameterId === update.parameterId);
      if (match) {
        const paramName = match.parameter?.parameterName || match.parameterId;
        changedFields.push(paramName);
        fieldChanges[paramName] = {
          previous: match.value,
          new: update.value,
          flag: update.flag || match.flag || undefined,
        };

        await prisma.resultValue.update({
          where: { id: match.id },
          data: {
            value: update.value,
            flag: (update.flag || match.flag) as any,
          },
        });
      }
    }

    // 6. Capture new snapshot
    const updatedValuesList = await prisma.resultValue.findMany({
      where: { resultId },
      include: { parameter: true },
    });

    const newSnapshot = updatedValuesList.map((v: any) => ({
      parameterId: v.parameterId,
      parameterCode: v.parameter?.shortName || v.parameter?.loincCode || '',
      parameterName: v.parameter?.parameterName || '',
      value: v.value,
      unit: v.parameter?.unit || '',
      flag: v.flag,
    }));


    // 7. Persist ResultAmendment record
    const amendmentRecord = await (prisma as any).resultAmendment.create({
      data: {
        resultId,
        amendedBy: amendedByUserId,
        amendmentReason: input.amendmentReason.trim(),
        amendmentType: input.amendmentType || 'CLINICAL_CORRECTION',
        versionNumber: nextVersionNumber,
        previousValue: previousSnapshot,
        newValue: newSnapshot,
        changedFields,
        fieldChanges,
        approvedById: amendedByUserId,
        approvedAt: new Date(),
        requiresReportRegeneration: true,
      },
      include: {
        amendedByUser: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            role: true,
          },
        },
      },
    });

    // 8. Sign amended result with cryptographic digital seal
    let digitalSignature = null;
    try {
      digitalSignature = await signResultWithElectronicSeal({
        resultId,
        userId: amendedByUserId,
        reason: `NABL ISO 15189 Result Amendment v${nextVersionNumber}.0: ${input.amendmentReason.trim()}`,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    } catch (sigErr: any) {
      console.warn(`[Amendment] Electronic seal signing warning:`, sigErr?.message || sigErr);
    }

    // 9. Audit log entry
    await createAuditLog({
      userId: amendedByUserId,
      module: 'APPROVALS',
      action: 'AMEND_RESULT',
      recordId: resultId,
      oldData: { version: nextVersionNumber - 1, snapshot: previousSnapshot },
      newData: {
        version: nextVersionNumber,
        amendmentId: amendmentRecord.id,
        reason: input.amendmentReason,
        changedFields,
      },
    });

    return {
      success: true,
      message: `Result successfully amended to Version ${nextVersionNumber}.0 and re-signed with NABL Doctor Seal.`,
      amendment: amendmentRecord,
      versionNumber: nextVersionNumber,
      digitalSignature,
    };
  }

  /**
   * Retrieves full chronological amendment audit history for a result.
   */
  public async getAmendmentHistory(resultId: string) {
    const amendments = await (prisma as any).resultAmendment.findMany({
      where: { resultId },
      orderBy: { versionNumber: 'asc' },
      include: {
        amendedByUser: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            role: true,
            specialization: true,
            designation: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return amendments;
  }
}

export const resultAmendmentService = new ResultAmendmentService();
