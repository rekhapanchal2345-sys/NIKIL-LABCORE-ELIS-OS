import crypto from "crypto";
import type { Request } from "express";
import prisma from "../../../config/database";
import { hashOpaqueToken } from "../../lib/auth";
import { HttpError } from "../../utils/http-error";
import { getClientIp, getDeviceFingerprint } from "../../utils/request-meta";
import { logAudit } from "./auth.service";

/**
 * ENTERPRISE MFA BACKUP CODES SERVICE
 *
 * Implements hardened, auditable emergency recovery codes:
 * - Formatted as 8 alphanumeric characters in `xxxx-xxxx` format
 * - Stored only as SHA-256 hashes (plaintext shown once upon generation)
 * - Single-use enforcement via atomic database updates
 * - Low-code threshold alerting (warns when <= 2 codes remain)
 * - Audit trail on generation and consumption
 */

const BACKUP_CODE_COUNT = 10;
const LOW_CODE_THRESHOLD = 2;

/**
 * Generates an enterprise-format backup code `xxxx-xxxx`.
 */
export function generateSingleBackupCode(): string {
  const bytes = crypto.randomBytes(4).toString("hex"); // 8 hex characters
  return `${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`.toLowerCase();
}

/**
 * Normalizes a backup code for hashing/comparison (strips hyphens and whitespace).
 */
export function normalizeBackupCode(code: string): string {
  return code.replace(/[-\s]/g, "").trim().toLowerCase();
}

/**
 * Generates a set of 10 enterprise backup codes.
 */
export function generateEnterpriseBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () => generateSingleBackupCode());
}

/**
 * Regenerates all backup codes for a user, replacing any existing codes.
 * Returns the plaintext codes — MUST only be displayed once to the user.
 */
export const regenerateBackupCodes = async (
  userId: string,
  req: Request
): Promise<{ backupCodes: string[]; count: number }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, mfaEnabled: true },
  });

  if (!user) {
    throw new HttpError("User not found", 404);
  }

  if (!user.mfaEnabled) {
    throw new HttpError(
      "MFA must be enabled before generating backup recovery codes.",
      400,
      "MFA_NOT_ENABLED"
    );
  }

  const plainCodes = generateEnterpriseBackupCodes();

  await prisma.$transaction([
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
    action: "MFA_BACKUP_CODES_REGENERATED",
    recordId: userId,
    ipAddress: getClientIp(req),
    newData: { totalGenerated: BACKUP_CODE_COUNT },
  });

  return {
    backupCodes: plainCodes,
    count: BACKUP_CODE_COUNT,
  };
};

/**
 * Consumes a single backup code. Atomic update ensures no double-spend.
 */
export const consumeBackupCode = async (
  userId: string,
  code: string,
  req: Request
): Promise<{ ok: boolean; remaining: number; warnLowCodes: boolean }> => {
  const normalized = normalizeBackupCode(code);
  const codeHash = hashOpaqueToken(normalized);

  const consumed = await prisma.mfaBackupCode.updateMany({
    where: {
      userId,
      codeHash,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  if (consumed.count !== 1) {
    return { ok: false, remaining: 0, warnLowCodes: false };
  }

  // Count remaining unused codes
  const remaining = await prisma.mfaBackupCode.count({
    where: { userId, usedAt: null },
  });

  const warnLowCodes = remaining <= LOW_CODE_THRESHOLD;

  await logAudit({
    userId,
    action: "MFA_BACKUP_CODE_CONSUMED",
    recordId: userId,
    ipAddress: getClientIp(req),
    newData: {
      remaining,
      warnLowCodes,
      deviceFingerprint: getDeviceFingerprint(req),
    },
  });

  return {
    ok: true,
    remaining,
    warnLowCodes,
  };
};

/**
 * Retrieves the status of a user's backup codes without exposing code contents.
 */
export const getBackupCodesStatus = async (
  userId: string
): Promise<{
  total: number;
  remaining: number;
  used: number;
  warnLowCodes: boolean;
  lastUsedAt: Date | null;
  hasBackupCodes: boolean;
}> => {
  const codes = await prisma.mfaBackupCode.findMany({
    where: { userId },
    select: { usedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const total = codes.length;
  const remaining = codes.filter((c) => c.usedAt === null).length;
  const used = total - remaining;

  const usedCodesList = codes
    .filter((c) => c.usedAt !== null)
    .sort((a, b) => b.usedAt!.getTime() - a.usedAt!.getTime());

  const lastUsedAt = usedCodesList.length > 0 ? usedCodesList[0].usedAt : null;

  return {
    total,
    remaining,
    used,
    warnLowCodes: remaining <= LOW_CODE_THRESHOLD && total > 0,
    lastUsedAt,
    hasBackupCodes: total > 0,
  };
};
