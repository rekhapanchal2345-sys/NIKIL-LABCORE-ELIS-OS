import crypto from 'crypto';

export type SpecimenLifecycleState =
  | 'REGISTERED'
  | 'BARCODE_VERIFIED'
  | 'COLLECTED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'PROCESSING'
  | 'ANALYZER_ASSIGNED'
  | 'TESTED'
  | 'TECH_REVIEWED'
  | 'PATHOLOGIST_APPROVED'
  | 'RELEASED'
  | 'REJECTED'
  | 'RECOLLECTION_REQUESTED';

const PERMITTED_SPECIMEN_TRANSITIONS: Record<
  SpecimenLifecycleState,
  ReadonlyArray<SpecimenLifecycleState>
> = {
  REGISTERED: ['BARCODE_VERIFIED', 'REJECTED'],
  BARCODE_VERIFIED: ['COLLECTED', 'REJECTED'],
  COLLECTED: ['IN_TRANSIT', 'RECEIVED', 'REJECTED'],
  IN_TRANSIT: ['RECEIVED', 'REJECTED'],
  RECEIVED: ['PROCESSING', 'ANALYZER_ASSIGNED', 'REJECTED'],
  PROCESSING: ['ANALYZER_ASSIGNED', 'REJECTED'],
  ANALYZER_ASSIGNED: ['TESTED', 'REJECTED'],
  TESTED: ['TECH_REVIEWED', 'ANALYZER_ASSIGNED', 'REJECTED'], // ANALYZER_ASSIGNED allowed for authorized rerun
  TECH_REVIEWED: ['PATHOLOGIST_APPROVED', 'RELEASED', 'ANALYZER_ASSIGNED', 'REJECTED'],
  PATHOLOGIST_APPROVED: ['RELEASED'],
  RELEASED: [], // Terminal state; post-release changes MUST use ResultAmendment workflow
  REJECTED: ['RECOLLECTION_REQUESTED'],
  RECOLLECTION_REQUESTED: [],
};

export function assertValidSpecimenTransition(params: {
  specimenBarcode: string;
  fromState: SpecimenLifecycleState;
  toState: SpecimenLifecycleState;
  actorRole: string;
  requiresPathologistApproval: boolean;
  rejectionReason?: string;
}): void {
  const allowed = PERMITTED_SPECIMEN_TRANSITIONS[params.fromState] ?? [];
  if (!allowed.includes(params.toState)) {
    throw new Error(
      `INVALID_SPECIMEN_STATE_TRANSITION: Cannot transition specimen [${params.specimenBarcode}] from ${params.fromState} to ${params.toState}`
    );
  }

  if (
    params.toState === 'RELEASED' &&
    params.requiresPathologistApproval &&
    params.fromState !== 'PATHOLOGIST_APPROVED'
  ) {
    throw new Error(
      `CLINICAL_SAFETY_GATE_VIOLATION: Specimen [${params.specimenBarcode}] requires PATHOLOGIST_APPROVED before RELEASED`
    );
  }

  if (
    params.toState === 'PATHOLOGIST_APPROVED' &&
    !['PATHOLOGIST', 'LAB_DIRECTOR'].includes(params.actorRole)
  ) {
    throw new Error(
      `UNAUTHORIZED_APPROVAL_SCOPE: Role [${params.actorRole}] cannot perform PATHOLOGIST_APPROVED`
    );
  }

  if (params.toState === 'REJECTED' && (!params.rejectionReason || params.rejectionReason.trim().length < 5)) {
    throw new Error('SPECIMEN_REJECTION_REQUIRES_DOCUMENTED_REASON');
  }
}

/**
 * Computes deterministic idempotency hash for ASTM E1394 / HL7 v2 observation frames
 * to prevent duplicate result insertion on instrument retransmission.
 */
export function computeInstrumentResultIdempotencyHash(params: {
  organizationId: string;
  analyzerId: string;
  specimenBarcode: string;
  instrumentTestCode: string;
  measuredValueRaw: string;
  units: string;
  instrumentCompletionTimestampIso: string;
}): string {
  const canonical = [
    params.organizationId.trim(),
    params.analyzerId.trim(),
    params.specimenBarcode.trim(),
    params.instrumentTestCode.trim(),
    params.measuredValueRaw.trim(),
    params.units.trim(),
    params.instrumentCompletionTimestampIso.trim(),
  ].join('|');

  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}
