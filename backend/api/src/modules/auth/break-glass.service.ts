/**
 * Phase 4 — Clinical Break-Glass Emergency Access Service
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Provides regulated, audited emergency elevation protocol for critical
 * clinical scenarios (ICU, Trauma, Emergency Surgery, Night Shifts).
 *
 * Complies with HIPAA § 164.312(a)(2)(ii) Emergency Access Procedures
 * and ISO 27799 / NABH healthcare data governance:
 *
 *   • Mandatory clinical justification (minimum 10 characters)
 *   • Time-bounded emergency token (default 2h, maximum 4h)
 *   • Instant high-severity audit logging on the SHA-256 chain
 *   • Direct integration with ABAC Policy 1 (PATIENT_CONFIDENTIALITY_SHIELD)
 *   • Formal compliance review & approval lifecycle by Chief Medical Officer
 * ═══════════════════════════════════════════════════════════════════════════
 */

import crypto from "crypto";
import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";
import { createAuditLog } from "../audit/audit.service";
import type { UserRole } from "../../lib/auth";

export interface InitiateBreakGlassParams {
  userId: string;
  targetResourceType: "patient" | "result" | "order";
  targetResourceId: string;
  reason: string;
  durationMinutes?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface ReviewBreakGlassParams {
  eventId: string;
  reviewerId: string;
  reviewNotes: string;
  approved: boolean;
  ipAddress?: string;
}

const ALLOWED_ROLES: UserRole[] = [
  "DOCTOR",
  "PATHOLOGIST",
  "LAB_TECH",
  "SUPER_ADMIN",
  "ADMIN",
];

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

// ─── Initiate Emergency Break-Glass ──────────────────────────────────────────

export async function initiateBreakGlass(params: InitiateBreakGlassParams) {
  const {
    userId,
    targetResourceType,
    targetResourceId,
    reason,
    durationMinutes = 120,
    ipAddress,
    userAgent,
  } = params;

  if (!reason || reason.trim().length < 10) {
    throw new HttpError(
      "A clinical justification of at least 10 characters is mandatory for break-glass emergency access",
      400,
      "INVALID_JUSTIFICATION"
    );
  }

  // Verify user exists and has a clinical or administrative role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, role: true, status: true, employeeCode: true },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new HttpError("Active user account required for emergency access", 401, "UNAUTHORIZED");
  }

  if (!ALLOWED_ROLES.includes(user.role as UserRole)) {
    throw new HttpError(
      `Role ${user.role} is not authorized to invoke clinical break-glass protocol`,
      403,
      "BREAK_GLASS_UNAUTHORIZED"
    );
  }

  // Cap duration between 15 minutes and 240 minutes (4 hours)
  const safeDuration = Math.min(Math.max(durationMinutes, 15), 240);
  const expiresAt = new Date(Date.now() + safeDuration * 60 * 1000);

  // Mint cryptographically secure 256-bit emergency token
  const rawToken = `bg_${crypto.randomBytes(32).toString("hex")}`;
  const tokenHash = hashToken(rawToken);

  const event = await prisma.breakGlassEvent.create({
    data: {
      userId,
      targetResourceType,
      targetResourceId,
      reason: reason.trim(),
      tokenHash,
      status: "ACTIVE",
      expiresAt,
      ipAddress,
      userAgent,
    },
    select: {
      id: true,
      targetResourceType: true,
      targetResourceId: true,
      reason: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  // Audit event with high severity
  await createAuditLog({
    userId,
    module: "CLINICAL_BREAK_GLASS",
    action: "BREAK_GLASS_INITIATED",
    recordId: event.id,
    ipAddress,
    userAgent,
    newData: {
      targetResourceType,
      targetResourceId,
      reason: reason.trim(),
      expiresAt: expiresAt.toISOString(),
      userRole: user.role,
      employeeCode: user.employeeCode,
    },
  });

  return {
    eventId: event.id,
    token: rawToken, // Returned ONLY once
    targetResourceType: event.targetResourceType,
    targetResourceId: event.targetResourceId,
    expiresAt: event.expiresAt,
    safeDurationMinutes: safeDuration,
    message: "Emergency access granted. This session is monitored and subject to clinical audit review.",
  };
}

// ─── Validate Break-Glass Token (Called by ABAC Engine) ────────────────────────

export async function validateBreakGlassToken(
  token: string,
  resourceType: string,
  resourceId?: string
): Promise<{ valid: boolean; eventId?: string; userId?: string; reason?: string }> {
  if (!token || !token.startsWith("bg_")) {
    return { valid: false, reason: "Malformed break-glass token" };
  }

  const tokenHash = hashToken(token);
  const event = await prisma.breakGlassEvent.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      targetResourceType: true,
      targetResourceId: true,
      status: true,
      expiresAt: true,
      reason: true,
    },
  });

  if (!event) {
    return { valid: false, reason: "Break-glass token not found" };
  }

  if (event.status !== "ACTIVE") {
    return { valid: false, reason: `Break-glass token is ${event.status}` };
  }

  if (new Date() > event.expiresAt) {
    // Lazy expire
    await prisma.breakGlassEvent.update({
      where: { id: event.id },
      data: { status: "EXPIRED" },
    });
    return { valid: false, reason: "Break-glass token has expired" };
  }

  if (event.targetResourceType !== resourceType) {
    return {
      valid: false,
      reason: `Token is bound to resource type ${event.targetResourceType}, not ${resourceType}`,
    };
  }

  if (resourceId && event.targetResourceId !== resourceId && event.targetResourceId !== "*") {
    return {
      valid: false,
      reason: "Token is bound to a different clinical resource ID",
    };
  }

  return {
    valid: true,
    eventId: event.id,
    userId: event.userId,
    reason: event.reason,
  };
}

// ─── Review Break-Glass Event (Compliance Review Workflow) ────────────────────

export async function reviewBreakGlassEvent(params: ReviewBreakGlassParams) {
  const { eventId, reviewerId, reviewNotes, approved, ipAddress } = params;

  const event = await prisma.breakGlassEvent.findUnique({
    where: { id: eventId },
    include: {
      user: {
        select: { id: true, fullName: true, employeeCode: true, role: true },
      },
    },
  });

  if (!event) {
    throw new HttpError("Break-glass event not found", 404, "EVENT_NOT_FOUND");
  }

  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { id: true, role: true, fullName: true },
  });

  if (!reviewer || !["SUPER_ADMIN", "ADMIN", "AUDITOR"].includes(reviewer.role)) {
    throw new HttpError("Only Admin or Compliance Auditor can review break-glass events", 403, "FORBIDDEN");
  }

  const updated = await prisma.breakGlassEvent.update({
    where: { id: eventId },
    data: {
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      reviewNotes: reviewNotes.trim(),
      approved,
      status: approved ? event.status : "REVOKED",
    },
  });

  await createAuditLog({
    userId: reviewerId,
    module: "CLINICAL_BREAK_GLASS",
    action: approved ? "BREAK_GLASS_APPROVED" : "BREAK_GLASS_REJECTED",
    recordId: eventId,
    ipAddress,
    oldData: { status: event.status },
    newData: {
      approved,
      reviewNotes: reviewNotes.trim(),
      reviewedBy: reviewer.fullName,
      finalStatus: updated.status,
    },
  });

  return updated;
}

// ─── Revoke Active Break-Glass Immediately ────────────────────────────────────

export async function revokeBreakGlassEvent(
  eventId: string,
  revokerId: string,
  reason: string,
  ipAddress?: string
) {
  const event = await prisma.breakGlassEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new HttpError("Break-glass event not found", 404, "EVENT_NOT_FOUND");
  }

  const updated = await prisma.breakGlassEvent.update({
    where: { id: eventId },
    data: {
      status: "REVOKED",
      reviewNotes: `Revoked early: ${reason}`,
      reviewedAt: new Date(),
      reviewedBy: revokerId,
      approved: false,
    },
  });

  await createAuditLog({
    userId: revokerId,
    module: "CLINICAL_BREAK_GLASS",
    action: "BREAK_GLASS_REVOKED",
    recordId: eventId,
    ipAddress,
    newData: { reason },
  });

  return updated;
}

// ─── List Active Break-Glass Events ───────────────────────────────────────────

export async function listActiveBreakGlassEvents() {
  const now = new Date();
  return prisma.breakGlassEvent.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
    include: {
      user: {
        select: { id: true, fullName: true, employeeCode: true, role: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── List Break-Glass Audit History ───────────────────────────────────────────

export async function listBreakGlassHistory(options: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const page = Math.max(options.page || 1, 1);
  const limit = Math.min(Math.max(options.limit || 20, 1), 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (options.status) {
    where.status = options.status;
  }

  const [total, events] = await Promise.all([
    prisma.breakGlassEvent.count({ where }),
    prisma.breakGlassEvent.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, fullName: true, employeeCode: true, role: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
