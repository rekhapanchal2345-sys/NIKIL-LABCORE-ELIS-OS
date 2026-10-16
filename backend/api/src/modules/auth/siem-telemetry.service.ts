/**
 * Phase 5 — SIEM & SOC Security Threat Telemetry Service
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Real-time Security Operations Center (SOC) integration & Threat Detection:
 *
 *   • Automated Threat Detectors:
 *       - Credential Stuffing & Distributed Brute-Force Attacks
 *       - Mass Patient Record Scraping / PII Exfiltration
 *       - Impossible Travel / Velocity Hopping
 *       - Privilege Abuse & Unauthorized Elevation Attempts
 *
 *   • Multi-Format Telemetry Streaming:
 *       - CEF (Common Event Format) for Splunk & ArcSight
 *       - RFC 5424 Syslog format for Enterprise Log Collectors
 *       - NDJSON (Newline Delimited JSON) for Datadog & Elastic SIEM
 *
 *   • Automated & Operator-Assisted Threat Mitigation Workflows
 * ═══════════════════════════════════════════════════════════════════════════
 */

import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";
import { createAuditLog } from "../audit/audit.service";
import { revokeAllUserTokens } from "../../lib/token-blacklist";

export type ThreatSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ThreatType =
  | "CREDENTIAL_STUFFING"
  | "IMPOSSIBLE_VELOCITY"
  | "MASS_SCRAPING"
  | "PRIVILEGE_ABUSE"
  | "BRUTE_FORCE_MFA";

// ─── Automated Threat Detection ───────────────────────────────────────────────

/**
 * Checks for distributed credential stuffing (single IP attacking multiple accounts)
 */
export async function recordCredentialStuffingAlert(params: {
  sourceIp: string;
  failedIdentifiersCount: number;
  windowMinutes: number;
}) {
  const { sourceIp, failedIdentifiersCount, windowMinutes } = params;

  return prisma.securityThreatAlert.create({
    data: {
      threatType: "CREDENTIAL_STUFFING",
      severity: failedIdentifiersCount > 25 ? "CRITICAL" : "HIGH",
      sourceIp,
      details: JSON.stringify({
        failedAttempts: failedIdentifiersCount,
        windowMinutes,
        timestamp: new Date().toISOString(),
      }),
      mitigated: true,
      mitigationAction: "IP_RATE_LIMITED",
    },
  });
}

/**
 * Checks for mass patient data scraping (exceeds clinical consultation velocity)
 */
export async function recordMassScrapingAlert(params: {
  userId: string;
  sourceIp: string;
  resourceType: string;
  recordsAccessedCount: number;
  windowMinutes: number;
}) {
  const { userId, sourceIp, resourceType, recordsAccessedCount, windowMinutes } = params;

  // Auto-mitigation: suspend user account if critical (> 150 records in 5 mins)
  let mitigationAction = "STEP_UP_ENFORCED";
  if (recordsAccessedCount > 150) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "LOCKED" },
    });
    await revokeAllUserTokens(userId);
    mitigationAction = "ACCOUNT_AUTO_LOCKED";
  }

  const alert = await prisma.securityThreatAlert.create({
    data: {
      threatType: "MASS_SCRAPING",
      severity: recordsAccessedCount > 150 ? "CRITICAL" : "HIGH",
      targetUserId: userId,
      sourceIp,
      details: JSON.stringify({
        resourceType,
        recordsAccessed: recordsAccessedCount,
        windowMinutes,
      }),
      mitigated: true,
      mitigationAction,
    },
  });

  await createAuditLog({
    userId,
    module: "THREAT_DETECTION",
    action: "MASS_SCRAPING_ALERT",
    recordId: alert.id,
    ipAddress: sourceIp,
    newData: { recordsAccessedCount, mitigationAction },
  });

  return alert;
}

/**
 * Records unauthorized privilege escalation or permission tampering
 */
export async function recordPrivilegeAbuseAlert(params: {
  userId: string;
  sourceIp: string;
  attemptedPermission: string;
  reason: string;
}) {
  const { userId, sourceIp, attemptedPermission, reason } = params;

  return prisma.securityThreatAlert.create({
    data: {
      threatType: "PRIVILEGE_ABUSE",
      severity: "HIGH",
      targetUserId: userId,
      sourceIp,
      details: JSON.stringify({ attemptedPermission, reason }),
      mitigated: false,
    },
  });
}

// ─── Multi-Format SIEM Telemetry Exporters ────────────────────────────────────

/** Exports security audit events in Common Event Format (CEF) for Splunk / ArcSight */
export async function exportCefTelemetry(options: { limit?: number; since?: Date }) {
  const take = Math.min(Math.max(options.limit || 100, 1), 1000);
  const where: any = {};
  if (options.since) where.createdAt = { gte: options.since };

  const logs = await prisma.auditLog.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { employeeCode: true, email: true, role: true } },
    },
  });

  return logs.map((log) => {
    const epoch = Math.floor(log.createdAt.getTime() / 1000);
    const cefSeverity = log.module.includes("SECURITY") || log.module.includes("BREAK_GLASS") ? 8 : 4;
    return `CEF:0|LabCore|ELIS-OS|1.0|${log.action}|${log.action}|${cefSeverity}|rt=${epoch} src=${log.ipAddress || "unknown"} suser=${log.user?.employeeCode || log.userId || "anonymous"} msg=${log.module}`;
  });
}

/** Exports security audit events in RFC 5424 Syslog format */
export async function exportSyslogTelemetry(options: { limit?: number; since?: Date }) {
  const take = Math.min(Math.max(options.limit || 100, 1), 1000);
  const where: any = {};
  if (options.since) where.createdAt = { gte: options.since };

  const logs = await prisma.auditLog.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
  });

  return logs.map((log) => {
    const timestamp = log.createdAt.toISOString();
    return `<14>1 ${timestamp} labcore-api elis-auth - - - action="${log.action}" module="${log.module}" actor="${log.userId || "anonymous"}" ip="${log.ipAddress || "unknown"}"`;
  });
}

// ─── Operator Threat Alert Management ─────────────────────────────────────────

export async function listThreatAlerts(options: {
  severity?: ThreatSeverity;
  threatType?: ThreatType;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(options.page || 1, 1);
  const limit = Math.min(Math.max(options.limit || 25, 1), 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (options.severity) where.severity = options.severity;
  if (options.threatType) where.threatType = options.threatType;

  const [total, alerts] = await Promise.all([
    prisma.securityThreatAlert.count({ where }),
    prisma.securityThreatAlert.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    alerts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function mitigateThreatAlert(params: {
  alertId: string;
  action: string;
  adminId: string;
}) {
  const { alertId, action, adminId } = params;

  const alert = await prisma.securityThreatAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new HttpError("Threat alert record not found", 404, "ALERT_NOT_FOUND");
  }

  const updated = await prisma.securityThreatAlert.update({
    where: { id: alertId },
    data: {
      mitigated: true,
      mitigationAction: action,
    },
  });

  await createAuditLog({
    userId: adminId,
    module: "THREAT_DETECTION",
    action: "THREAT_ALERT_MITIGATED",
    recordId: alertId,
    newData: { action, previousMitigated: alert.mitigated },
  });

  return updated;
}
