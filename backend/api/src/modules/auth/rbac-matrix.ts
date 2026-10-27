/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NIKIL-LABCORE-ELIS-OS — ENTERPRISE RBAC & PERMISSION MATRIX ENGINE (DAY 25)
 * ═══════════════════════════════════════════════════════════════════════════
 * Standardized 7-Tier Healthcare Role Matrix compliant with:
 * - NABL ISO 15189:2022 (Pathologist electronic sign-off & technical competency)
 * - ABDM M1/M2/M3 (Care-context & consent access boundaries)
 * - DPDP Act 2023 (PII data protection & least-privilege enforcement)
 * - OWASP Top 10 Broken Access Control Prevention
 *
 * Certified 7 Hospital Operational Roles:
 * 1. SUPER_ADMIN   — Unrestricted Enterprise Executive Control & System Master
 * 2. ADMIN         — Laboratory Administrator & Operational Directorate
 * 3. PATHOLOGIST   — Certified Pathologist / Clinical Director (Approval & Seals)
 * 4. LAB_TECH      — Medical Laboratory Technologist (Accession, Entry & Analyzers)
 * 5. PHLEBOTOMIST  — Certified Phlebotomy Technician (Sample Collection & Barcodes)
 * 6. RECEPTIONIST  — Front Desk & Cashier (Patient Registration, Orders & POS)
 * 7. ACCOUNTANT    — Financial Controller (Daybook Reconciliation, GST & Audits)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { PERMISSIONS, type Permission } from "../../lib/permissions";
import type { UserRole } from "../../lib/auth";

// ─── CANONICAL 7 HOSPITAL ROLES ─────────────────────────────────────────────

export const HOSPITAL_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN" as const,
  ADMIN: "ADMIN" as const,
  PATHOLOGIST: "PATHOLOGIST" as const,
  LAB_TECH: "LAB_TECH" as const,
  PHLEBOTOMIST: "PHLEBOTOMIST" as const,
  RECEPTIONIST: "RECEPTIONIST" as const,
  ACCOUNTANT: "ACCOUNTANT" as const,
  // Backward compatibility aliases
  FRONT_DESK: "FRONT_DESK" as const,
  BRANCH_ADMIN: "BRANCH_ADMIN" as const,
  DOCTOR: "DOCTOR" as const,
  AUDITOR: "AUDITOR" as const,
};

export type HospitalRole = (typeof HOSPITAL_ROLES)[keyof typeof HOSPITAL_ROLES];

/**
 * Normalizes role string to canonical uppercase representation,
 * resolving interchangeable aliases (e.g. RECEPTIONIST <-> FRONT_DESK).
 */
export function normalizeRole(role?: string | null): UserRole {
  if (!role) return "FRONT_DESK";
  const upper = role.trim().toUpperCase();
  if (upper === "RECEPTIONIST") return "FRONT_DESK";
  if (upper === "PHLEB") return "PHLEBOTOMIST";
  if (upper === "LAB_TECHNICIAN" || upper === "TECHNICIAN") return "LAB_TECH";
  if (upper === "PATH") return "PATHOLOGIST";
  if (upper === "FINANCE") return "ACCOUNTANT";
  return upper as UserRole;
}

/**
 * Checks if a given user role matches any allowed role, considering aliases.
 */
export function isRoleAuthorized(
  userRole: string | undefined | null,
  allowedRoles?: string[]
): boolean {
  if (!userRole) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));

  // SUPER_ADMIN always has access
  if (normalizedUserRole === "SUPER_ADMIN") return true;

  return normalizedAllowed.includes(normalizedUserRole);
}

// ─── ROLE HIERARCHY TIER LEVELS ─────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  BRANCH_ADMIN: 75,
  PATHOLOGIST: 60,
  DOCTOR: 50,
  ACCOUNTANT: 45,
  AUDITOR: 40,
  LAB_TECH: 30,
  PHLEBOTOMIST: 20,
  RECEPTIONIST: 10,
  FRONT_DESK: 10,
};

// ─── GRANULAR MODULE-ACTION MATRIX ──────────────────────────────────────────

export type SystemModule =
  | "patients"
  | "doctors"
  | "tests"
  | "orders"
  | "samples"
  | "results"
  | "reports"
  | "billing"
  | "cash_counter"
  | "analyzers"
  | "quality_control"
  | "ai_studio"
  | "audit_logs"
  | "users"
  | "settings"
  | "branches"
  | "backups";

export type ModuleAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "approve"
  | "collect"
  | "accession"
  | "reject"
  | "sign"
  | "refund"
  | "reconcile"
  | "open"
  | "close"
  | "tally"
  | "handover"
  | "simulate"
  | "log_run"
  | "westgard_review"
  | "run_copilot"
  | "override"
  | "unlock"
  | "revoke"
  | "restore";

type RoleModulePermissions = Partial<Record<SystemModule, ModuleAction[]>>;

export const GRANULAR_ROLE_MATRIX: Record<string, RoleModulePermissions> = {
  SUPER_ADMIN: {
    patients: ["view", "create", "edit", "delete", "export"],
    doctors: ["view", "create", "edit", "delete", "export"],
    tests: ["view", "create", "edit", "delete", "export"],
    orders: ["view", "create", "edit", "delete", "export"],
    samples: ["view", "collect", "accession", "reject", "export"],
    results: ["view", "create", "edit", "delete", "approve", "export"],
    reports: ["view", "create", "sign", "delete", "export"],
    billing: ["view", "create", "edit", "delete", "refund", "reconcile", "export"],
    cash_counter: ["view", "open", "close", "tally", "handover", "export"],
    analyzers: ["view", "create", "edit", "delete", "simulate"],
    quality_control: ["view", "create", "edit", "log_run", "westgard_review", "export"],
    ai_studio: ["view", "run_copilot", "override", "export"],
    audit_logs: ["view", "export"],
    users: ["view", "create", "edit", "delete", "unlock", "revoke", "export"],
    settings: ["view", "edit"],
    branches: ["view", "create", "edit", "delete"],
    backups: ["view", "create", "restore", "delete", "export"],
  },

  ADMIN: {
    patients: ["view", "create", "edit", "export"],
    doctors: ["view", "create", "edit", "export"],
    tests: ["view", "create", "edit", "export"],
    orders: ["view", "create", "edit", "export"],
    samples: ["view", "collect", "accession", "reject", "export"],
    results: ["view", "create", "edit", "export"],
    reports: ["view", "create", "export"],
    billing: ["view", "create", "edit", "refund", "reconcile", "export"],
    cash_counter: ["view", "open", "close", "tally", "handover", "export"],
    analyzers: ["view", "create", "edit", "simulate"],
    quality_control: ["view", "log_run", "westgard_review", "export"],
    ai_studio: ["view", "run_copilot", "export"],
    audit_logs: ["view", "export"],
    users: ["view", "create", "edit", "unlock", "export"],
    settings: ["view", "edit"],
    branches: ["view", "edit"],
    backups: ["view", "create"],
  },

  PATHOLOGIST: {
    patients: ["view", "export"],
    doctors: ["view"],
    tests: ["view"],
    orders: ["view"],
    samples: ["view"],
    results: ["view", "create", "edit", "approve", "export"],
    reports: ["view", "create", "sign", "export"],
    billing: ["view"],
    cash_counter: [],
    analyzers: ["view"],
    quality_control: ["view", "create", "log_run", "westgard_review", "export"],
    ai_studio: ["view", "run_copilot", "override"],
    audit_logs: [],
    users: [],
    settings: ["view"],
    branches: ["view"],
    backups: [],
  },

  LAB_TECH: {
    patients: ["view"],
    doctors: ["view"],
    tests: ["view"],
    orders: ["view"],
    samples: ["view", "accession", "reject"],
    results: ["view", "create", "edit"],
    reports: ["view"],
    billing: [],
    cash_counter: [],
    analyzers: ["view", "simulate"],
    quality_control: ["view", "create", "log_run"],
    ai_studio: [],
    audit_logs: [],
    users: [],
    settings: [],
    branches: [],
    backups: [],
  },

  PHLEBOTOMIST: {
    patients: ["view", "create"],
    doctors: ["view"],
    tests: ["view"],
    orders: ["view"],
    samples: ["view", "collect", "accession", "reject"],
    results: [],
    reports: [],
    billing: [],
    cash_counter: [],
    analyzers: [],
    quality_control: [],
    ai_studio: [],
    audit_logs: [],
    users: [],
    settings: [],
    branches: [],
    backups: [],
  },

  RECEPTIONIST: {
    patients: ["view", "create", "edit"],
    doctors: ["view"],
    tests: ["view"],
    orders: ["view", "create", "edit"],
    samples: ["view"],
    results: ["view"],
    reports: ["view", "export"],
    billing: ["view", "create", "export"],
    cash_counter: ["view", "open", "close", "tally", "handover"],
    analyzers: [],
    quality_control: [],
    ai_studio: [],
    audit_logs: [],
    users: [],
    settings: [],
    branches: ["view"],
    backups: [],
  },

  FRONT_DESK: {
    patients: ["view", "create", "edit"],
    doctors: ["view"],
    tests: ["view"],
    orders: ["view", "create", "edit"],
    samples: ["view"],
    results: ["view"],
    reports: ["view", "export"],
    billing: ["view", "create", "export"],
    cash_counter: ["view", "open", "close", "tally", "handover"],
    analyzers: [],
    quality_control: [],
    ai_studio: [],
    audit_logs: [],
    users: [],
    settings: [],
    branches: ["view"],
    backups: [],
  },

  ACCOUNTANT: {
    patients: ["view"],
    doctors: ["view"],
    tests: ["view"],
    orders: ["view"],
    samples: [],
    results: [],
    reports: [],
    billing: ["view", "create", "edit", "refund", "reconcile", "export"],
    cash_counter: ["view", "open", "close", "tally", "handover", "export"],
    analyzers: [],
    quality_control: [],
    ai_studio: [],
    audit_logs: [],
    users: [],
    settings: ["view"],
    branches: ["view"],
    backups: [],
  },
};

/**
 * Evaluates whether a given role has permission to execute an action on a module.
 */
export function canRolePerform(
  role: string | undefined | null,
  module: SystemModule,
  action: ModuleAction
): boolean {
  if (!role) return false;
  const normalized = normalizeRole(role);

  // SUPER_ADMIN has unrestricted permission across all modules
  if (normalized === "SUPER_ADMIN") return true;

  const rolePerms = GRANULAR_ROLE_MATRIX[normalized];
  if (!rolePerms) return false;

  const moduleActions = rolePerms[module];
  if (!moduleActions) return false;

  return moduleActions.includes(action);
}

/**
 * Retrieves all permitted actions for a role grouped by module.
 */
export function getModulePermissionsForRole(
  role: string
): Record<string, string[]> {
  const normalized = normalizeRole(role);
  if (normalized === "SUPER_ADMIN") {
    return GRANULAR_ROLE_MATRIX.SUPER_ADMIN as Record<string, string[]>;
  }
  return (GRANULAR_ROLE_MATRIX[normalized] ?? {}) as Record<string, string[]>;
}

/**
 * Returns all active recognized roles in the system.
 */
export function getAllHospitalRoles(): string[] {
  return [
    "SUPER_ADMIN",
    "ADMIN",
    "PATHOLOGIST",
    "LAB_TECH",
    "PHLEBOTOMIST",
    "RECEPTIONIST",
    "ACCOUNTANT",
  ];
}
