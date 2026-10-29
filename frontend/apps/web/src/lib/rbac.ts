import { getRoleLabel } from "./auth";

export function normalizeRole(role?: string | null): string {
  if (!role) return "SUPER_ADMIN";
  return role.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

export function isRoleAllowed(userRole?: string | null, allowedRoles?: string[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const norm = normalizeRole(userRole);
  if (norm === "SUPER_ADMIN" || norm === "ADMIN") return true;
  return allowedRoles.map((r) => normalizeRole(r)).includes(norm);
}

export function getRoleBadgeLabel(role?: string | null): string {
  return getRoleLabel(role, "Administrator");
}
