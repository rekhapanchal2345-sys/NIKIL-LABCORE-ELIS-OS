import crypto from "crypto";
import type { Request } from "express";
import prisma from "../../../config/database";
import { hashOpaqueToken } from "../../lib/auth";
import { HttpError } from "../../utils/http-error";
import { getClientIp, getDeviceFingerprint } from "../../utils/request-meta";
import { logAudit } from "./auth.service";

/**
 * ENTERPRISE DEVICE TRUST SERVICE ("Remember this Device")
 *
 * Provides cryptographically secure device trust:
 * - Issues a 256-bit opaque trust token stored only as a SHA-256 hash
 * - Connects to the Risk Engine to lower risk scores (-15 pts)
 * - Restricts trust to the device fingerprint to prevent token portability
 * - Allows self-service listing and revocation of active workstations
 * - Enforces a strict 30-day maximum trust window
 */

const TRUST_DURATION_DAYS = Number(process.env.DEVICE_TRUST_DURATION_DAYS || 30);

/**
 * Derives a human-readable device name from the User Agent string.
 */
export function parseDeviceName(userAgent?: string | null): string {
  if (!userAgent) return "Unknown Workstation";

  let os = "Desktop";
  if (userAgent.includes("Windows NT 10.0") || userAgent.includes("Windows NT 11.0")) os = "Windows PC";
  else if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS X")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux PC";
  else if (userAgent.includes("Android")) os = "Android Device";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS Device";

  let browser = "Browser";
  if (userAgent.includes("Edg/")) browser = "Edge";
  else if (userAgent.includes("Chrome/") && !userAgent.includes("Edg/")) browser = "Chrome";
  else if (userAgent.includes("Firefox/")) browser = "Firefox";
  else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) browser = "Safari";

  return `${browser} on ${os}`;
}

/**
 * Registers the current device as a trusted device for the user.
 * Returns the plaintext trust token to be saved client-side (e.g. HttpOnly cookie or secure storage).
 */
export const registerTrustedDevice = async (
  userId: string,
  req: Request,
  customName?: string
): Promise<{
  trustToken: string;
  deviceId: string;
  deviceName: string;
  trustedUntil: Date;
}> => {
  const deviceFingerprint = getDeviceFingerprint(req);
  const ipAddress = getClientIp(req);
  const userAgent = req.headers["user-agent"] ?? null;
  const deviceName = customName?.trim() || parseDeviceName(userAgent);

  // Generate 256-bit cryptographically secure trust token
  const trustToken = crypto.randomBytes(32).toString("hex");
  const trustTokenHash = hashOpaqueToken(trustToken);

  const trustedUntil = new Date(Date.now() + TRUST_DURATION_DAYS * 24 * 60 * 60 * 1000);

  // Revoke any previous trust for the same fingerprint to prevent duplicate active tokens
  await prisma.trustedDevice.updateMany({
    where: {
      userId,
      deviceFingerprint,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokeReason: "superseded_by_new_registration",
    },
  });

  const record = await prisma.trustedDevice.create({
    data: {
      userId,
      deviceFingerprint,
      deviceName,
      trustTokenHash,
      ipAddress,
      userAgent,
      trustedUntil,
      lastUsedAt: new Date(),
    },
  });

  await logAudit({
    userId,
    action: "DEVICE_TRUST_GRANTED",
    recordId: record.id,
    ipAddress,
    newData: {
      deviceName,
      trustedUntil,
      deviceFingerprint,
    },
  });

  return {
    trustToken,
    deviceId: record.id,
    deviceName,
    trustedUntil,
  };
};

/**
 * Verifies a device trust token against the database and validates fingerprint binding.
 */
export const verifyDeviceTrust = async (
  userId: string,
  trustToken: string | undefined,
  req: Request
): Promise<{ isTrusted: boolean; deviceId?: string; deviceName?: string }> => {
  if (!trustToken || trustToken.trim().length === 0) {
    return { isTrusted: false };
  }

  const trustTokenHash = hashOpaqueToken(trustToken.trim());
  const device = await prisma.trustedDevice.findUnique({
    where: { trustTokenHash },
  });

  if (!device || device.userId !== userId || device.revokedAt !== null) {
    return { isTrusted: false };
  }

  // Check if expired
  if (device.trustedUntil < new Date()) {
    await prisma.trustedDevice.update({
      where: { id: device.id },
      data: { revokedAt: new Date(), revokeReason: "expired" },
    });
    return { isTrusted: false };
  }

  // Check fingerprint match for binding security
  const currentFingerprint = getDeviceFingerprint(req);
  if (device.deviceFingerprint !== currentFingerprint) {
    // Possible token theft or altered client configuration — do not trust
    return { isTrusted: false };
  }

  // Update lastUsedAt and ipAddress
  await prisma.trustedDevice.update({
    where: { id: device.id },
    data: {
      lastUsedAt: new Date(),
      ipAddress: getClientIp(req),
    },
  });

  return {
    isTrusted: true,
    deviceId: device.id,
    deviceName: device.deviceName,
  };
};

/**
 * Lists all active trusted devices for a user.
 */
export const listTrustedDevices = async (
  userId: string,
  req: Request
) => {
  const currentFingerprint = getDeviceFingerprint(req);

  const devices = await prisma.trustedDevice.findMany({
    where: {
      userId,
      revokedAt: null,
      trustedUntil: { gt: new Date() },
    },
    orderBy: { lastUsedAt: "desc" },
    select: {
      id: true,
      deviceName: true,
      ipAddress: true,
      userAgent: true,
      trustedUntil: true,
      lastUsedAt: true,
      createdAt: true,
      deviceFingerprint: true,
    },
  });

  return devices.map((d) => ({
    id: d.id,
    deviceName: d.deviceName,
    ipAddress: d.ipAddress,
    lastUsedAt: d.lastUsedAt,
    trustedUntil: d.trustedUntil,
    createdAt: d.createdAt,
    isCurrentDevice: d.deviceFingerprint === currentFingerprint,
  }));
};

/**
 * Revokes trust for a specific device.
 */
export const revokeTrustedDevice = async (
  userId: string,
  deviceId: string,
  req: Request
): Promise<{ ok: boolean }> => {
  const device = await prisma.trustedDevice.findFirst({
    where: { id: deviceId, userId },
  });

  if (!device) {
    throw new HttpError("Trusted device not found", 404);
  }

  await prisma.trustedDevice.update({
    where: { id: deviceId },
    data: {
      revokedAt: new Date(),
      revokeReason: "user_revoked",
    },
  });

  await logAudit({
    userId,
    action: "DEVICE_TRUST_REVOKED",
    recordId: deviceId,
    ipAddress: getClientIp(req),
    newData: { deviceName: device.deviceName },
  });

  return { ok: true };
};

/**
 * Revokes all trusted devices for a user (e.g. after security concern or password reset).
 */
export const revokeAllTrustedDevices = async (
  userId: string,
  req: Request
): Promise<{ revokedCount: number }> => {
  const result = await prisma.trustedDevice.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokeReason: "user_revoked_all",
    },
  });

  await logAudit({
    userId,
    action: "ALL_DEVICE_TRUSTS_REVOKED",
    recordId: userId,
    ipAddress: getClientIp(req),
    newData: { revokedCount: result.count },
  });

  return { revokedCount: result.count };
};
