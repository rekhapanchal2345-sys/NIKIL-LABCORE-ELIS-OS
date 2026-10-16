import type { Request } from "express";
import prisma from "../../../config/database";
import { comparePassword } from "../../utils/password";
import { decryptField, encryptField } from "../../utils/field-crypto";
import {
  generateTotpSecret,
  totpOtpauthUrl,
} from "../../utils/totp";
import { verifyTotpWithReplayGuard } from "../../lib/totp-guard";
import { mfaRequiredForRole } from "../../lib/permissions";
import { HttpError } from "../../utils/http-error";
import { getClientIp } from "../../utils/request-meta";
import { logAudit } from "./auth.service";
import {
  generateEnterpriseBackupCodes,
  getBackupCodesStatus,
  normalizeBackupCode,
} from "./mfa-backup.service";
import { hashOpaqueToken } from "../../lib/auth";

/**
 * UNIFIED ENTERPRISE MFA LIFECYCLE SERVICE
 *
 * Coordinates:
 * - Voluntary & mandatory TOTP enrollment
 * - RFC 6238 Replay-protected setup verification
 * - Automatic generation of single-use backup recovery codes
 * - High-security MFA disabling guarded by password + TOTP confirmation
 * - Aggregated MFA status reporting (TOTP, backup codes, passkeys, trusted devices)
 */

export interface MfaStatusReport {
  mfaEnabled: boolean;
  mfaRequired: boolean;
  lastMfaAt: Date | null;
  methods: {
    totp: boolean;
    backupCodes: {
      hasCodes: boolean;
      total: number;
      remaining: number;
      warnLow: boolean;
      lastUsedAt: Date | null;
    };
    webauthn: {
      count: number;
    };
    trustedDevices: {
      count: number;
    };
  };
}

/**
 * Retrieves full MFA status and health summary for a user.
 */
export const getMfaStatus = async (userId: string): Promise<MfaStatusReport> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      mfaEnabled: true,
      lastMfaAt: true,
      totpSecretEnc: true,
    },
  });

  if (!user) {
    throw new HttpError("User not found", 404);
  }

  const [backupStatus, webAuthnCount, trustedDeviceCount] = await Promise.all([
    getBackupCodesStatus(userId),
    prisma.webAuthnCredential.count({ where: { userId } }),
    prisma.trustedDevice.count({
      where: {
        userId,
        revokedAt: null,
        trustedUntil: { gt: new Date() },
      },
    }),
  ]);

  return {
    mfaEnabled: user.mfaEnabled,
    mfaRequired: mfaRequiredForRole(user.role),
    lastMfaAt: user.lastMfaAt,
    methods: {
      totp: Boolean(user.totpSecretEnc),
      backupCodes: {
        hasCodes: backupStatus.hasBackupCodes,
        total: backupStatus.total,
        remaining: backupStatus.remaining,
        warnLow: backupStatus.warnLowCodes,
        lastUsedAt: backupStatus.lastUsedAt,
      },
      webauthn: {
        count: webAuthnCount,
      },
      trustedDevices: {
        count: trustedDeviceCount,
      },
    },
  };
};

/**
 * Initiates TOTP setup for a user.
 * Generates an ephemeral secret and stores it encrypted in totpPendingEnc.
 */
export const initiateMfaSetup = async (
  userId: string,
  req: Request
): Promise<{
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new HttpError("User not found", 404);
  }

  const secret = generateTotpSecret();
  const encryptedSecret = encryptField(secret);

  await prisma.user.update({
    where: { id: userId },
    data: { totpPendingEnc: encryptedSecret },
  });

  const otpauthUrl = totpOtpauthUrl(secret, user.email);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    otpauthUrl
  )}`;

  await logAudit({
    userId,
    action: "MFA_SETUP_INITIATED",
    recordId: userId,
    ipAddress: getClientIp(req),
  });

  return {
    secret,
    otpauthUrl,
    qrCodeUrl,
  };
};

/**
 * Confirms TOTP setup by verifying the first code with replay protection.
 * Activates MFA, clears pending secret, and generates 10 backup codes.
 */
export const confirmMfaSetup = async (
  userId: string,
  code: string,
  req: Request
): Promise<{ ok: boolean; backupCodes: string[] }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, totpPendingEnc: true },
  });

  if (!user || !user.totpPendingEnc) {
    throw new HttpError("MFA setup is not in progress. Please start setup again.", 400, "MFA_NOT_IN_PROGRESS");
  }

  const secret = decryptField(user.totpPendingEnc);
  const verification = verifyTotpWithReplayGuard(userId, secret, code);

  if (!verification.valid) {
    throw new HttpError(
      verification.errorReason || "Invalid authenticator code. Check your clock or app.",
      400,
      "INVALID_TOTP_CODE"
    );
  }

  const plainCodes = generateEnterpriseBackupCodes();
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        totpSecretEnc: encryptField(secret),
        totpPendingEnc: null,
        lastMfaAt: now,
      },
    }),
    prisma.mfaBackupCode.deleteMany({ where: { userId } }),
    ...plainCodes.map((plain) =>
      prisma.mfaBackupCode.create({
        data: {
          userId,
          codeHash: hashOpaqueToken(normalizeBackupCode(plain)),
        },
      })
    ),
  ]);

  await logAudit({
    userId,
    action: "MFA_ACTIVATED",
    recordId: userId,
    ipAddress: getClientIp(req),
    newData: { backupCodesCount: plainCodes.length },
  });

  return {
    ok: true,
    backupCodes: plainCodes,
  };
};

/**
 * Disables MFA for an account.
 * Highly sensitive action: requires both current password and a fresh TOTP code.
 * Rejects if user's role has mandatory MFA.
 */
export const disableMfa = async (
  userId: string,
  passwordConfirm: string,
  code: string,
  req: Request
): Promise<{ ok: boolean }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      passwordHash: true,
      mfaEnabled: true,
      totpSecretEnc: true,
    },
  });

  if (!user) {
    throw new HttpError("User not found", 404);
  }

  // Mandatory role check
  if (mfaRequiredForRole(user.role)) {
    throw new HttpError(
      "Two-factor authentication is mandatory for your role and cannot be disabled.",
      403,
      "MFA_MANDATORY_FOR_ROLE"
    );
  }

  if (!user.mfaEnabled || !user.totpSecretEnc) {
    throw new HttpError("MFA is not currently enabled on this account.", 400);
  }

  // 1. Password verification
  const passwordOk = await comparePassword(passwordConfirm, user.passwordHash);
  if (!passwordOk) {
    throw new HttpError("Incorrect password.", 401, "INVALID_PASSWORD");
  }

  // 2. TOTP code verification with replay guard
  const secret = decryptField(user.totpSecretEnc);
  const totpOk = verifyTotpWithReplayGuard(userId, secret, code);
  if (!totpOk.valid) {
    throw new HttpError(
      totpOk.errorReason || "Invalid authenticator code.",
      401,
      "INVALID_TOTP_CODE"
    );
  }

  // Transaction: disable MFA, purge backup codes and trusted devices
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        totpSecretEnc: null,
        totpPendingEnc: null,
      },
    }),
    prisma.mfaBackupCode.deleteMany({ where: { userId } }),
    prisma.trustedDevice.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: "mfa_disabled" },
    }),
  ]);

  await logAudit({
    userId,
    action: "MFA_DISABLED",
    recordId: userId,
    ipAddress: getClientIp(req),
  });

  return { ok: true };
};
