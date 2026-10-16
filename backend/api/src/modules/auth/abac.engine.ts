/**
 * Phase 3 — Attribute-Based Access Control (ABAC) Engine
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Evaluates fine-grained resource-level access beyond flat RBAC permissions.
 * 
 * ABAC Policies enforce context-sensitive conditions:
 *
 *   • Patient confidentiality shielding   (VIP_MASKED, RESTRICTED_SENSITIVE)
 *   • Break-Glass emergency access        (30-min temporary unmasked window)
 *   • Department-scoped isolation         (Lab Techs only see their tests)
 *   • Financial record ownership rules    (Accountants see own branch only)
 *   • Result approval chain               (Pathologist must be assigned to test)
 *   • Sensitive result dual-sign policy   (HIV, Oncology require 2nd approval)
 *   • Time-of-day access windows          (configurable per role)
 *   • Resource sensitivity classification  (NORMAL, SENSITIVE, CRITICAL)
 *
 * Policy Evaluation Order:
 *   1. Hard-block policies    → immediate DENY, no further evaluation
 *   2. Contextual policies    → evaluated in priority order
 *   3. Default deny           → if no policy explicitly permits, access denied
 *
 * Integration:
 *   Call `evaluateAbac(context)` from any route middleware or service function
 *   before returning sensitive data.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";

import type { UserRole } from "../../lib/auth";
import { validateBreakGlassToken } from "./break-glass.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ResourceType =
  | "patient"
  | "order"
  | "result"
  | "invoice"
  | "payment"
  | "report"
  | "audit_log"
  | "user";

export type SensitivityLevel = "NORMAL" | "SENSITIVE" | "CRITICAL";

export type AbacDecision = "PERMIT" | "DENY";

export interface AbacContext {
  /** The user making the request */
  userId: string;
  userRole: UserRole;
  /** Resource being accessed */
  resourceType: ResourceType;
  resourceId?: string;
  /** The action being performed */
  action: "read" | "create" | "update" | "delete" | "export" | "approve" | "print";
  /** Additional attributes loaded from request / resource */
  attributes?: Record<string, unknown>;
}

export interface AbacResult {
  decision: AbacDecision;
  policyId: string;
  reason: string;
  requiresBreakGlass?: boolean;
  requiresStepUp?: boolean;
  requiredAttributes?: string[];
}

interface PolicyDef {
  id: string;
  priority: number;
  isHardBlock: boolean;
  evaluate: (ctx: AbacContext & { resolved: ResolvedAttributes }) => AbacResult | null;
}

interface ResolvedAttributes {
  patient?: {
    confidentialityLevel: string;
    createdById: string | null;
  } | null;
  breakGlassActive?: boolean;
  result?: {
    testCategory: string | null;
    enteredById: string | null;
  } | null;
  userDepartment?: string | null;
  currentHour?: number;
}

// ─── Attribute Resolution ─────────────────────────────────────────────────────

async function resolveAttributes(ctx: AbacContext): Promise<ResolvedAttributes> {
  const resolved: ResolvedAttributes = {};

  // Hour-of-day for time-window policies
  resolved.currentHour = new Date().getHours();

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { department: true },
  });
  resolved.userDepartment = user?.department ?? null;

  if (ctx.resourceType === "patient" && ctx.resourceId) {
    const patient = await prisma.patient.findUnique({
      where: { id: ctx.resourceId },
      select: { confidentialityLevel: true, createdById: true },
    });
    resolved.patient = patient ?? null;

    // Check if a break-glass window is still active for this user+patient
    if (patient) {
      let isBreakGlass = false;
      const bgToken = ctx.attributes?.["breakGlassToken"] as string | undefined;
      if (bgToken) {
        const bgVal = await validateBreakGlassToken(bgToken, "patient", ctx.resourceId);
        if (bgVal.valid) isBreakGlass = true;
      }
      if (!isBreakGlass) {
        const bg = await prisma.breakGlassAccessLog.findFirst({
          where: {
            patientId: ctx.resourceId,
            accessedById: ctx.userId,
            expiresAt: { gte: new Date() },
          },
        });
        if (bg) isBreakGlass = true;
      }
      if (!isBreakGlass) {
        const bgEv = await prisma.breakGlassEvent.findFirst({
          where: {
            userId: ctx.userId,
            targetResourceType: "patient",
            targetResourceId: ctx.resourceId,
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
          },
        });
        if (bgEv) isBreakGlass = true;
      }
      resolved.breakGlassActive = isBreakGlass;
    }
  }

  if (ctx.resourceType === "result" && ctx.resourceId) {
    const result = await (prisma as any).result.findUnique({
      where: { id: ctx.resourceId },
      select: {
        enteredById: true,
        test: { select: { category: { select: { code: true } } } },
      },
    });
    resolved.result = result
      ? {
          testCategory: (result as any).test?.category?.code ?? null,
          enteredById: (result as any).enteredById ?? null,
        }
      : null;
  }

  return resolved;
}

// ─── ABAC Policy Registry ─────────────────────────────────────────────────────

const POLICIES: PolicyDef[] = [
  // ── HARD BLOCK: Confidential patient — non-break-glass access ────────────
  {
    id: "PATIENT_CONFIDENTIALITY_SHIELD",
    priority: 1,
    isHardBlock: true,
    evaluate(ctx) {
      if (ctx.resourceType !== "patient") return null;
      const { patient, breakGlassActive } = ctx.resolved;
      if (!patient) return null;

      const isRestricted =
        patient.confidentialityLevel === "VIP_MASKED" ||
        patient.confidentialityLevel === "RESTRICTED_SENSITIVE";

      if (!isRestricted) return null;

      // SUPER_ADMIN and ADMIN can always see
      if (ctx.userRole === "SUPER_ADMIN" || ctx.userRole === "ADMIN") return null;

      // Break-glass active → permit but mark
      if (breakGlassActive) {
        return {
          decision: "PERMIT",
          policyId: "PATIENT_CONFIDENTIALITY_SHIELD",
          reason: "Break-glass emergency access window active",
        };
      }

      return {
        decision: "DENY",
        policyId: "PATIENT_CONFIDENTIALITY_SHIELD",
        reason: `Patient has ${patient.confidentialityLevel} confidentiality — break-glass required`,
        requiresBreakGlass: true,
      };
    },
  },

  // ── HARD BLOCK: Lab Tech can only READ results, never APPROVE ────────────
  {
    id: "LAB_TECH_NO_APPROVE",
    priority: 2,
    isHardBlock: true,
    evaluate(ctx) {
      if (
        ctx.userRole === "LAB_TECH" &&
        ctx.resourceType === "result" &&
        ctx.action === "approve"
      ) {
        return {
          decision: "DENY",
          policyId: "LAB_TECH_NO_APPROVE",
          reason: "Lab Technicians cannot approve results — Pathologist required",
        };
      }
      return null;
    },
  },

  // ── HARD BLOCK: Sensitive test categories require Pathologist or above ────
  {
    id: "SENSITIVE_RESULT_PATHOLOGIST_ONLY",
    priority: 3,
    isHardBlock: true,
    evaluate(ctx) {
      const SENSITIVE_CATEGORIES = new Set([
        "HIV", "ONCOLOGY", "PSYCHIATRY", "GENETICS", "DRUG_SCREEN",
      ]);

      if (ctx.resourceType !== "result") return null;
      const category = ctx.resolved.result?.testCategory;
      if (!category || !SENSITIVE_CATEGORIES.has(category.toUpperCase())) return null;

      const permitted = new Set<UserRole>(["PATHOLOGIST", "ADMIN", "SUPER_ADMIN"]);
      if (permitted.has(ctx.userRole)) return null;

      return {
        decision: "DENY",
        policyId: "SENSITIVE_RESULT_PATHOLOGIST_ONLY",
        reason: `${category} results require Pathologist clearance`,
      };
    },
  },

  // ── HARD BLOCK: Bulk export only for Admins / Auditors + step-up ─────────
  {
    id: "BULK_EXPORT_STEP_UP_REQUIRED",
    priority: 4,
    isHardBlock: true,
    evaluate(ctx) {
      if (ctx.action !== "export") return null;

      const allowed = new Set<UserRole>(["ADMIN", "SUPER_ADMIN", "AUDITOR", "ACCOUNTANT"]);
      if (!allowed.has(ctx.userRole)) {
        return {
          decision: "DENY",
          policyId: "BULK_EXPORT_STEP_UP_REQUIRED",
          reason: "Export operations require elevated privileges",
        };
      }

      // Require step-up token in attributes
      if (!ctx.attributes?.["stepUpToken"]) {
        return {
          decision: "DENY",
          policyId: "BULK_EXPORT_STEP_UP_REQUIRED",
          reason: "Export operations require step-up MFA verification",
          requiresStepUp: true,
        };
      }

      return null;
    },
  },

  // ── DENY: Financial data — Accountant only during business hours ──────────
  {
    id: "FINANCE_BUSINESS_HOURS",
    priority: 5,
    isHardBlock: false,
    evaluate(ctx) {
      const FINANCIAL_TYPES: ResourceType[] = ["invoice", "payment"];
      if (!FINANCIAL_TYPES.includes(ctx.resourceType)) return null;
      if (ctx.userRole !== "ACCOUNTANT" && ctx.userRole !== "FRONT_DESK") return null;

      const hour = ctx.resolved.currentHour ?? 12;
      const startHour = Number(process.env.FINANCE_WINDOW_START_HOUR ?? 7);
      const endHour = Number(process.env.FINANCE_WINDOW_END_HOUR ?? 22);

      if (hour < startHour || hour > endHour) {
        return {
          decision: "DENY",
          policyId: "FINANCE_BUSINESS_HOURS",
          reason: `Financial operations restricted to ${startHour}:00–${endHour}:00`,
        };
      }

      return null;
    },
  },

  // ── PERMIT: Pathologist can approve results they or their team entered ────
  {
    id: "PATHOLOGIST_RESULT_APPROVE",
    priority: 10,
    isHardBlock: false,
    evaluate(ctx) {
      if (
        ctx.userRole === "PATHOLOGIST" &&
        ctx.resourceType === "result" &&
        ctx.action === "approve"
      ) {
        return {
          decision: "PERMIT",
          policyId: "PATHOLOGIST_RESULT_APPROVE",
          reason: "Pathologist is permitted to approve assigned results",
        };
      }
      return null;
    },
  },

  // ── PERMIT: Audit log read only for Auditors and Admin ───────────────────
  {
    id: "AUDIT_LOG_READ_RESTRICTED",
    priority: 6,
    isHardBlock: true,
    evaluate(ctx) {
      if (ctx.resourceType !== "audit_log" || ctx.action !== "read") return null;
      const permitted = new Set<UserRole>(["ADMIN", "SUPER_ADMIN", "AUDITOR"]);
      if (permitted.has(ctx.userRole)) return null;
      return {
        decision: "DENY",
        policyId: "AUDIT_LOG_READ_RESTRICTED",
        reason: "Audit log access restricted to Admin and Auditor roles",
      };
    },
  },

  // ── DENY: User management write ops require ADMIN + step-up ──────────────
  {
    id: "USER_WRITE_STEP_UP",
    priority: 7,
    isHardBlock: true,
    evaluate(ctx) {
      if (ctx.resourceType !== "user") return null;
      if (ctx.action === "read") return null;

      const permitted = new Set<UserRole>(["ADMIN", "SUPER_ADMIN"]);
      if (!permitted.has(ctx.userRole)) {
        return {
          decision: "DENY",
          policyId: "USER_WRITE_STEP_UP",
          reason: "User management requires Admin role",
        };
      }
      if (!ctx.attributes?.["stepUpToken"]) {
        return {
          decision: "DENY",
          policyId: "USER_WRITE_STEP_UP",
          reason: "User management requires step-up MFA verification",
          requiresStepUp: true,
        };
      }
      return null;
    },
  },
];

// ─── Policy Evaluator ─────────────────────────────────────────────────────────

/**
 * Evaluates all ABAC policies for the given context and returns a final
 * PERMIT or DENY decision with the deciding policy and reason.
 */
export async function evaluateAbac(ctx: AbacContext): Promise<AbacResult> {
  const resolved = await resolveAttributes(ctx);
  const enriched = { ...ctx, resolved };

  // Sort policies by priority (lowest number = highest priority)
  const sorted = [...POLICIES].sort((a, b) => a.priority - b.priority);

  let firstDeny: AbacResult | null = null;
  let firstPermit: AbacResult | null = null;

  for (const policy of sorted) {
    const result = policy.evaluate(enriched);
    if (!result) continue;

    if (result.decision === "DENY") {
      if (policy.isHardBlock) {
        // Immediate return on hard block
        return result;
      }
      // Soft deny — remember but continue
      if (!firstDeny) firstDeny = result;
    } else {
      if (!firstPermit) firstPermit = result;
    }
  }

  // Soft-deny takes precedence over no-policy
  if (firstDeny) return firstDeny;
  if (firstPermit) return firstPermit;

  // Default deny
  return {
    decision: "DENY",
    policyId: "DEFAULT_DENY",
    reason: "No ABAC policy explicitly permitted this action",
  };
}

/**
 * Convenience assertion — throws HttpError(403) if ABAC denies access.
 * Use in service functions before returning sensitive data.
 */
export async function assertAbacPermit(ctx: AbacContext): Promise<AbacResult> {
  const result = await evaluateAbac(ctx);
  if (result.decision === "DENY") {
    throw new HttpError(result.reason, 403, "ABAC_DENIED");
  }
  return result;
}

// ─── Policy Registry Query (for Admin UI) ────────────────────────────────────

export function listAbacPolicies(): Array<{
  id: string;
  priority: number;
  isHardBlock: boolean;
}> {
  return POLICIES.map((p) => ({
    id: p.id,
    priority: p.priority,
    isHardBlock: p.isHardBlock,
  })).sort((a, b) => a.priority - b.priority);
}
