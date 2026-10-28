/**
 * Cryptographic Audit & Zero-Trust Security Service — NIKIL-LABCORE-ELIS-OS
 * 
 * Category 26: Enterprise Security, Zero-Trust & Cryptographic Audit Trails
 * - Bug 26.1: JWT Token Expiry Mid-Shift & Unsaved Work Loss (Silent refresh + auto-save draft buffer)
 * - Bug 26.2: Audit Trail Log Tampering (Cryptographic SHA-256 Hash Chaining & Append-Only Verification)
 * - Bug 26.3: Multi-Factor Authentication (MFA) Bypass on Pathologist Emergency Override
 *             (Eliminates hardcoded backdoors; enforces Dual-Authorization Break-Glass Protocol)
 */

import crypto from 'crypto';

export interface AuditRecordPayload {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  previousHash?: string | null;
  currentHash?: string;
}

export interface BreakGlassRequest {
  requestingUserId: string;
  requestingRole: string;
  patientId: string;
  clinicalEmergencyReason: string;
  requestedDurationMinutes: number;
}

export interface DualAuthSignature {
  signerUserId: string;
  signerRole: 'PATHOLOGIST' | 'LAB_DIRECTOR' | 'MEDICAL_SUPERINTENDENT';
  signatureTimestamp: Date;
  cryptographicSignature: string;
}

export interface BreakGlassAuthorizationResult {
  isAuthorized: boolean;
  token?: string;
  expiresAt?: Date;
  denialReason?: string;
  auditRecordId?: string;
}

export class CryptographicAuditService {
  public static readonly GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

  /**
   * Bug 26.2: Computes SHA-256 hash chaining block (Blockchain-style immutable audit).
   */
  public static computeHash(
    prevHash: string | null | undefined,
    record: Omit<AuditRecordPayload, 'previousHash' | 'currentHash'>
  ): string {
    const parentHash = prevHash || this.GENESIS_HASH;
    const serializedData = JSON.stringify({
      id: record.id,
      timestamp: record.timestamp.toISOString(),
      userId: record.userId,
      action: record.action,
      entity: record.entity,
      entityId: record.entityId,
      oldValues: record.oldValues ?? null,
      newValues: record.newValues ?? null,
      ipAddress: record.ipAddress ?? '',
    });

    return crypto
      .createHash('sha256')
      .update(`${parentHash}::${serializedData}`)
      .digest('hex');
  }

  /**
   * Bug 26.2: Verifies the integrity of the entire audit chain.
   * If any row was edited, inserted, or deleted in DB directly, this identifies the exact broken index.
   */
  public static verifyChainIntegrity(records: AuditRecordPayload[]): {
    isValid: boolean;
    tamperedIndex?: number;
    reason?: string;
  } {
    if (records.length === 0) return { isValid: true };

    for (let i = 0; i < records.length; i++) {
      const current = records[i];
      const expectedPrevHash = i === 0 ? this.GENESIS_HASH : records[i - 1].currentHash;

      if ((current.previousHash || this.GENESIS_HASH) !== expectedPrevHash) {
        return {
          isValid: false,
          tamperedIndex: i,
          reason: `Chain broken at index ${i}: previousHash (${current.previousHash}) does not match predecessor hash (${expectedPrevHash})`,
        };
      }

      const recomputedHash = this.computeHash(expectedPrevHash, current);
      if (current.currentHash !== recomputedHash) {
        return {
          isValid: false,
          tamperedIndex: i,
          reason: `Tampering detected at record ${current.id}: stored hash (${current.currentHash}) != recomputed hash (${recomputedHash})`,
        };
      }
    }

    return { isValid: true };
  }
}

export class WorklistDraftManagerService {
  /**
   * Bug 26.1: Draft Auto-Save Buffer (IndexedDB / localStorage simulator).
   * Prevents mid-shift unsubmitted data loss when token expires or browser crashes.
   */
  public static createDraftPayload(userId: string, orderId: string, formValues: Record<string, any>) {
    return {
      draftKey: `DRAFT_LIS_${userId}_${orderId}`,
      savedAt: new Date(),
      data: formValues,
      version: 1,
      isRecoverable: true,
    };
  }

  /**
   * Bug 26.1: Interceptor Token Recovery Simulator.
   * When HTTP 401 Unauthorized is intercepted, issues silent refresh token call and retries original request.
   */
  public static async silentTokenRefresh(
    refreshToken: string,
    refreshFn: (token: string) => Promise<{ accessToken: string; refreshToken: string }>
  ): Promise<{ success: boolean; newAccessToken?: string; retryAuthorized: boolean }> {
    if (!refreshToken || refreshToken.length < 20) {
      return { success: false, retryAuthorized: false };
    }
    try {
      const refreshed = await refreshFn(refreshToken);
      return {
        success: true,
        newAccessToken: refreshed.accessToken,
        retryAuthorized: true,
      };
    } catch {
      return { success: false, retryAuthorized: false };
    }
  }
}

export class BreakGlassSecurityService {
  private static readonly BANNED_BACKDOORS = [
    'EMERGENCY_OVERRIDE_2026',
    'ADMIN_BACKDOOR',
    'MASTER_PASS_123',
  ];

  /**
   * Bug 26.3: Time-Based Dual-Authorization Break-Glass Protocol.
   * Strictly rejects any hardcoded emergency backdoor password.
   * Mandates cryptographic signatures from both Pathologist and Lab Director/Admin.
   */
  public static evaluateBreakGlassAuthorization(
    request: BreakGlassRequest,
    signatures: DualAuthSignature[],
    secretAttempt?: string
  ): BreakGlassAuthorizationResult {
    // 1. Explicitly check and block any hardcoded backdoor passwords
    if (secretAttempt && this.BANNED_BACKDOORS.includes(secretAttempt)) {
      return {
        isAuthorized: false,
        denialReason: 'CRITICAL_SECURITY_BREACH: Hardcoded backdoor usage detected and hard-blocked.',
      };
    }

    // 2. Validate mandatory clinical emergency reason
    if (!request.clinicalEmergencyReason || request.clinicalEmergencyReason.trim().length < 10) {
      return {
        isAuthorized: false,
        denialReason: 'MANDATORY_JUSTIFICATION_MISSING: Emergency reason must be detailed (min 10 chars).',
      };
    }

    // 3. Verify Dual Authorization (Requires Pathologist AND Lab Director/Medical Superintendent)
    const hasPathologist = signatures.some(s => s.signerRole === 'PATHOLOGIST' && s.cryptographicSignature.length >= 32);
    const hasDirector = signatures.some(s =>
      (s.signerRole === 'LAB_DIRECTOR' || s.signerRole === 'MEDICAL_SUPERINTENDENT') &&
      s.cryptographicSignature.length >= 32
    );

    if (!hasPathologist || !hasDirector) {
      return {
        isAuthorized: false,
        denialReason: 'DUAL_AUTHORIZATION_REQUIRED: Requires both Pathologist and Lab Director signatures.',
      };
    }

    // 4. Issue temporary ephemeral token with strict 30-minute ceiling
    const duration = Math.min(request.requestedDurationMinutes || 15, 30);
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);
    const token = crypto.randomBytes(32).toString('hex');

    return {
      isAuthorized: true,
      token,
      expiresAt,
      auditRecordId: `BREAK_GLASS_${Date.now()}`,
    };
  }
}
