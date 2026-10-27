/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NIKIL-LABCORE-ELIS-OS — FRONTEND RBAC & ROLE GUARDS (DAY 25)
 * ═══════════════════════════════════════════════════════════════════════════
 * Frontend role definitions, aliases, and permission checking helpers.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const HOSPITAL_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  PATHOLOGIST: "PATHOLOGIST",
  LAB_TECH: "LAB_TECH",
  PHLEBOTOMIST: "PHLEBOTOMIST",
  RECEPTIONIST: "RECEPTIONIST",
  ACCOUNTANT: "ACCOUNTANT",
  // Aliases
  FRONT_DESK: "FRONT_DESK",
  BRANCH_ADMIN: "BRANCH_ADMIN",
  DOCTOR: "DOCTOR",
  AUDITOR: "AUDITOR",
} as const;

export type HospitalRole = (typeof HOSPITAL_ROLES)[keyof typeof HOSPITAL_ROLES];

/**
 * Normalizes role string to canonical uppercase representation.
 * Maps RECEPTIONIST <-> FRONT_DESK so either matches seamlessly.
 */
export function normalizeRole(role?: string | null): string {
  if (!role) return "FRONT_DESK";
  const upper = role.trim().toUpperCase();
  if (upper === "RECEPTIONIST") return "FRONT_DESK";
  if (upper === "PHLEB") return "PHLEBOTOMIST";
  if (upper === "LAB_TECHNICIAN" || upper === "TECHNICIAN") return "LAB_TECH";
  return upper;
}

/**
 * Checks if a user's role is included in allowedRoles.
 * SUPER_ADMIN is granted bypass on all role restrictions.
 */
export function isRoleAllowed(
  userRole?: string | null,
  allowedRoles?: string[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;

  const normalizedUserRole = normalizeRole(userRole);
  if (normalizedUserRole === "SUPER_ADMIN") return true;

  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
  return normalizedAllowed.includes(normalizedUserRole);
}

/**
 * Human-readable friendly role titles for clinical staff badges.
 */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Chief Medical / IT Director",
  ADMIN: "Laboratory Administrator",
  PATHOLOGIST: "Consultant Pathologist",
  LAB_TECH: "Medical Lab Technologist",
  PHLEBOTOMIST: "Phlebotomist",
  RECEPTIONIST: "Front Desk & Cashier",
  FRONT_DESK: "Front Desk & Cashier",
  ACCOUNTANT: "Accounts & Financial Controller",
  BRANCH_ADMIN: "Branch Operations Lead",
  DOCTOR: "Clinician / Referring Doctor",
  AUDITOR: "Compliance & NABL Auditor",
};

export function getRoleBadgeLabel(role?: string | null): string {
  if (!role) return "Hospital Staff";
  const norm = normalizeRole(role);
  return ROLE_LABELS[norm] || role;
}
