import { PrismaClient } from '@prisma/client';
import { webcrypto } from 'crypto';

// ==============================================================================
// NIKIL-LABCORE-ELIS-OS: MODULE 3 - ENTERPRISE CLINICAL NLP & RCV DELTA SERVICE
// Tech: NABL ISO 15189:2022 SHA-256 Merkle Chaining, Fraser-Harris RCV Delta Check
// ==============================================================================

const prisma = new PrismaClient();

export interface RcvDeltaCheckOutcome {
  passed: boolean;
  previousValue: number | null;
  currentValue: number;
  variancePercentage: number;
  rcvThresholdPercentage: number;
  velocityPerHour: number;
}

export class ClinicalNlpService {
  /**
   * Computes exact Fraser-Harris Reference Change Value (RCV):
   * RCV = sqrt(2) * Z * sqrt(CV_A^2 + CV_I^2)
   * and compares against the patient's true historical analyte measurement.
   */
  static async executeDeltaCheck(
    patientId: string,
    loincCode: string,
    currentValue: number,
    analyticalCvPercent = 2.5,
    biologicalCvPercent = 6.0,
    zStatistic = 2.58
  ): Promise<RcvDeltaCheckOutcome> {
    const rcvThresholdPercentage = Number(
      (
        Math.SQRT2 *
        zStatistic *
        Math.sqrt(Math.pow(analyticalCvPercent, 2) + Math.pow(biologicalCvPercent, 2))
      ).toFixed(2)
    );

    const previousResult = await (prisma as any).clinicalInference.findFirst({
      where: {
        document: { patientId },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!previousResult || !Array.isArray(previousResult.extractedEntities)) {
      return {
        passed: true,
        previousValue: null,
        currentValue,
        variancePercentage: 0,
        rcvThresholdPercentage,
        velocityPerHour: 0,
      };
    }

    const matchingEntity = previousResult.extractedEntities.find(
      (ent: any) => ent && (ent.code === loincCode || ent.loincCode === loincCode) && typeof ent.value === 'number'
    );

    if (!matchingEntity || matchingEntity.value === 0) {
      return {
        passed: true,
        previousValue: null,
        currentValue,
        variancePercentage: 0,
        rcvThresholdPercentage,
        velocityPerHour: 0,
      };
    }

    const prevValue = Number(matchingEntity.value);
    const variancePercentage = Number(
      ((Math.abs(currentValue - prevValue) / Math.abs(prevValue)) * 100).toFixed(2)
    );

    const elapsedMs = Math.max(
      1,
      Date.now() - new Date(previousResult.createdAt || Date.now() - 3600_000).getTime()
    );
    const elapsedHours = Math.max(0.25, elapsedMs / 3600_000);
    const velocityPerHour = Number(((currentValue - prevValue) / elapsedHours).toFixed(4));

    return {
      passed: variancePercentage <= rcvThresholdPercentage,
      previousValue: prevValue,
      currentValue,
      variancePercentage,
      rcvThresholdPercentage,
      velocityPerHour,
    };
  }

  /**
   * NABL ISO 15189:2022 Cryptographic SHA-256 Merkle Hash Chaining
   */
  static async generateNablAuditHash(inferenceId: string, pathologistId: string): Promise<string> {
    const inference = await (prisma as any).clinicalInference.findUnique({
      where: { id: inferenceId },
    });
    if (!inference) throw new Error('Inference record not found for NABL seal.');

    const previousAudit = await prisma.digitalSignature.findFirst({
      orderBy: { signedAt: 'desc' },
    });

    const prevHash = previousAudit
      ? (previousAudit as any).signatureHash || (previousAudit as any).cryptographicHash
      : 'GENESIS_BLOCK';

    const canonicalPayload = JSON.stringify({
      inferenceId,
      extractedEntities: inference.extractedEntities,
      prevHash,
      pathologistId,
    });

    const hashBuffer = await webcrypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(canonicalPayload)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
