/**
 * Phase 4 — Session Hijacking Prevention & Device Telemetry
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Protects active laboratory sessions against token theft, session hijacking,
 * and unauthorized workstation sharing:
 *
 *   • Subnet Binding & IP Family Tracking (detects sudden proxy/VPN hop)
 *   • User-Agent & Client Entropy Fingerprinting
 *   • Monitored Workstation Concurrency limits per Role
 *   • Anomaly Eviction: invalidates stolen refresh tokens automatically
 * ═══════════════════════════════════════════════════════════════════════════
 */

import crypto from "crypto";
import type { Request } from "express";
import prisma from "../../../config/database";
import { getClientIp, getDeviceFingerprint } from "../../utils/request-meta";
import { createAuditLog } from "../audit/audit.service";
import type { UserRole } from "../../lib/auth";

// Role-specific concurrency policy
const CONCURRENCY_LIMITS: Record<UserRole, number> = {
  FRONT_DESK: 1,
  RECEPTIONIST: 1,
  PHLEBOTOMIST: 1,   // Shared front-desk cash counter: strictly single-workstation
  LAB_TECH: 2,     // Instrument bench + sample accessioning desk
  DOCTOR: 2,       // Consultation desk + OPD terminal
  PATHOLOGIST: 2,  // Reporting station + verification workstation
  ACCOUNTANT: 1,   // Billing counter
  BRANCH_ADMIN: 2, // Admin terminal
  ADMIN: 3,        // Lab Management
  SUPER_ADMIN: 3,  // Enterprise Overseer
  AUDITOR: 1,      // Read-only compliance workstation
};

/** Extracts IPv4 /24 subnet or IPv6 /64 prefix */
export function extractSubnet(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";
  // IPv4 check
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
  }
  // IPv6 check
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 4).join(":") + "::/64";
  }
  return ip;
}

/** Computes high-entropy client fingerprint from request headers */
export function computeClientFingerprint(req: Request): string {
  const ua = String(req.headers["user-agent"] || "");
  const acceptLang = String(req.headers["accept-language"] || "");
  const secChUa = String(req.headers["sec-ch-ua"] || "");
  const secChUaPlatform = String(req.headers["sec-ch-ua-platform"] || "");
  const devFingerprint = getDeviceFingerprint(req);

  const raw = `${ua}|${acceptLang}|${secChUa}|${secChUaPlatform}|${devFingerprint}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export interface ValidateSessionSecurityResult {
  secure: boolean;
  anomalyDetected: boolean;
  reason?: string;
  actionRequired?: "NONE" | "STEP_UP" | "REVOKE";
}

/**
 * Validates session security context against current request telemetry.
 * Checks for IP subnet deviation and fingerprint alteration.
 */
export async function validateSessionSecurity(
  sessionId: string,
  req: Request
): Promise<ValidateSessionSecurityResult> {
  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      ipAddress: true,
      userAgent: true,
      deviceFingerprint: true,
      revokedAt: true,
      user: { select: { role: true, employeeCode: true } },
    },
  });

  if (!session || session.revokedAt) {
    return {
      secure: false,
      anomalyDetected: false,
      reason: "Session has expired or was revoked",
      actionRequired: "REVOKE",
    };
  }

  const currentIp = getClientIp(req);
  const currentFingerprint = getDeviceFingerprint(req);

  // Check 1: Severe device fingerprint mismatch (token exported to another machine)
  if (session.deviceFingerprint && currentFingerprint && session.deviceFingerprint !== currentFingerprint) {
    // Audit security event
    await createAuditLog({
      userId: session.userId,
      module: "SESSION_SECURITY",
      action: "FINGERPRINT_MISMATCH_DETECTED",
      recordId: session.id,
      ipAddress: currentIp,
      oldData: {
        registeredFingerprint: session.deviceFingerprint,
        registeredIp: session.ipAddress,
      },
      newData: {
        incomingFingerprint: currentFingerprint,
        incomingIp: currentIp,
      },
    });

    return {
      secure: false,
      anomalyDetected: true,
      reason: "Session device signature mismatch — possible token replay attack",
      actionRequired: "STEP_UP",
    };
  }

  // Check 2: Subnet shift
  if (session.ipAddress && currentIp && currentIp !== "unknown") {
    const sessionSubnet = extractSubnet(session.ipAddress);
    const currentSubnet = extractSubnet(currentIp);

    if (sessionSubnet !== currentSubnet) {
      return {
        secure: true,
        anomalyDetected: true,
        reason: `Subnet change detected: ${sessionSubnet} -> ${currentSubnet}`,
        actionRequired: "STEP_UP",
      };
    }
  }

  return {
    secure: true,
    anomalyDetected: false,
    actionRequired: "NONE",
  };
}

/**
 * Enforces concurrent session limits per user role.
 * Evicts oldest sessions when max limit is exceeded.
 */
export async function enforceConcurrentSessionLimit(
  userId: string,
  role: UserRole,
  currentSessionId: string
): Promise<{ evictedCount: number }> {
  const maxAllowed = CONCURRENCY_LIMITS[role] || 2;

  const activeSessions = await prisma.userSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, ipAddress: true, createdAt: true },
  });

  if (activeSessions.length <= maxAllowed) {
    return { evictedCount: 0 };
  }

  // Identify sessions to evict (keep most recent maxAllowed sessions, including current)
  const toKeep = new Set(activeSessions.slice(0, maxAllowed).map((s) => s.id));
  toKeep.add(currentSessionId);

  const toEvict = activeSessions.filter((s) => !toKeep.has(s.id));

  if (toEvict.length > 0) {
    await prisma.userSession.updateMany({
      where: { id: { in: toEvict.map((s) => s.id) } },
      data: {
        revokedAt: new Date(),
        revokeReason: `CONCURRENT_LIMIT_EXCEEDED (${role} max: ${maxAllowed})`,
      },
    });

    await createAuditLog({
      userId,
      module: "SESSION_SECURITY",
      action: "CONCURRENT_SESSIONS_EVICTED",
      newData: {
        role,
        maxAllowed,
        evictedSessionIds: toEvict.map((s) => s.id),
      },
    });
  }

  return { evictedCount: toEvict.length };
}
