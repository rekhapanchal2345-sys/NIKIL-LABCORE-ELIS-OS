/**
 * Phase 3 — Enterprise RBAC Service
 * ═══════════════════════════════════════════════════════════════════════════
 * Dynamic Role-Based Access Control on top of static ROLE_PERMISSIONS.
 *
 * Resolution order (highest priority first):
 *   1. User-level DENY  → always blocks
 *   2. User-level GRANT → adds permission on top of role baseline
 *   3. Role baseline     → from ROLE_PERMISSIONS map
 *
 * All mutations are written to AuditLog.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";
import {
  PERMISSIONS,
  getPermissionsForRole,
  type Permission,
} from "../../lib/permissions";
import type { UserRole } from "../../lib/auth";
import { logAudit } from "./auth.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PermissionEffect = "GRANT" | "DENY";

export interface UserPermissionOverride {
  id: string;
  userId: string;
  permission: Permission;
  effect: PermissionEffect;
  reason: string | null;
  grantedBy: string;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface EffectivePermissions {
  userId: string;
  role: UserRole;
  roleBaseline: Permission[];
  userGrants: Permission[];
  userDenies: Permission[];
  effectivePermissions: Permission[];
  temporaryOverrides: Array<{
    permission: Permission;
    effect: PermissionEffect;
    expiresAt: Date | null;
    reason: string | null;
  }>;
}

export interface RoleOverride {
  id: string;
  userId: string;
  overrideRole: UserRole;
  reason: string;
  grantedBy: string;
  validFrom: Date;
  validUntil: Date;
  revokedAt: Date | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertValidPermission(perm: string): asserts perm is Permission {
  const valid = Object.values(PERMISSIONS) as string[];
  if (!valid.includes(perm)) {
    throw new HttpError(`Unknown permission: ${perm}`, 400, "INVALID_PERMISSION");
  }
}

// Use `any` cast until `prisma generate` output includes the new models at
// compile time. After the first `prisma generate` run this is fully type-safe.
const db = prisma as any;

// ─── Core RBAC: Effective Permission Computation ─────────────────────────────

export async function getEffectivePermissions(
  userId: string
): Promise<EffectivePermissions> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) throw new HttpError("User not found", 404, "USER_NOT_FOUND");

  const now = new Date();

  // Check active role override
  const activeRoleOverride = await db.userRoleOverride.findFirst({
    where: {
      userId,
      validFrom: { lte: now },
      validUntil: { gte: now },
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  const effectiveRole = (activeRoleOverride?.overrideRole ?? user.role) as UserRole;
  const roleBaseline = [...getPermissionsForRole(effectiveRole)] as Permission[];

  // Load active user-level overrides
  const overrides: Array<{
    permission: string;
    effect: string;
    expiresAt: Date | null;
    reason: string | null;
  }> = await db.userPermissionOverride.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  const userGrants = overrides
    .filter((o) => o.effect === "GRANT")
    .map((o) => o.permission as Permission);

  const userDenies = overrides
    .filter((o) => o.effect === "DENY")
    .map((o) => o.permission as Permission);

  // Merge: baseline ∪ grants − denies
  const merged = new Set<Permission>([...roleBaseline, ...userGrants]);
  for (const deny of userDenies) {
    merged.delete(deny);
  }

  return {
    userId,
    role: effectiveRole,
    roleBaseline,
    userGrants,
    userDenies,
    effectivePermissions: [...merged],
    temporaryOverrides: overrides
      .filter((o) => o.expiresAt !== null)
      .map((o) => ({
        permission: o.permission as Permission,
        effect: o.effect as PermissionEffect,
        expiresAt: o.expiresAt,
        reason: o.reason,
      })),
  };
}

export async function userHasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const ep = await getEffectivePermissions(userId);
  return ep.effectivePermissions.includes(permission);
}

// ─── Grant Permission ─────────────────────────────────────────────────────────

export async function grantPermission(opts: {
  adminId: string;
  targetUserId: string;
  permission: string;
  reason?: string;
  expiresAt?: Date | null;
  ipAddress?: string;
}): Promise<UserPermissionOverride> {
  const { adminId, targetUserId, permission, reason, expiresAt, ipAddress } = opts;
  assertValidPermission(permission);

  if (adminId === targetUserId) {
    throw new HttpError("Cannot grant permissions to yourself", 403, "SELF_GRANT");
  }

  const existing = await db.userPermissionOverride.findFirst({
    where: { userId: targetUserId, permission, effect: "GRANT" },
  });

  let override: any;
  if (existing) {
    override = await db.userPermissionOverride.update({
      where: { id: existing.id },
      data: {
        reason: reason ?? existing.reason,
        expiresAt: expiresAt !== undefined ? expiresAt : existing.expiresAt,
        grantedBy: adminId,
      },
    });
  } else {
    await db.userPermissionOverride.deleteMany({
      where: { userId: targetUserId, permission, effect: "DENY" },
    });

    override = await db.userPermissionOverride.create({
      data: {
        userId: targetUserId,
        permission,
        effect: "GRANT",
        reason: reason ?? null,
        grantedBy: adminId,
        expiresAt: expiresAt ?? null,
      },
    });
  }

  await logAudit({
    userId: adminId,
    action: "RBAC_PERMISSION_GRANT",
    recordId: targetUserId,
    newData: { permission, reason, expiresAt: expiresAt ?? null },
    ipAddress,
  });

  return override as UserPermissionOverride;
}

// ─── Deny Permission ──────────────────────────────────────────────────────────

export async function denyPermission(opts: {
  adminId: string;
  targetUserId: string;
  permission: string;
  reason?: string;
  expiresAt?: Date | null;
  ipAddress?: string;
}): Promise<UserPermissionOverride> {
  const { adminId, targetUserId, permission, reason, expiresAt, ipAddress } = opts;
  assertValidPermission(permission);

  if (adminId === targetUserId) {
    throw new HttpError("Cannot deny permissions for yourself", 403, "SELF_DENY");
  }

  const existing = await db.userPermissionOverride.findFirst({
    where: { userId: targetUserId, permission, effect: "DENY" },
  });

  let override: any;
  if (existing) {
    override = await db.userPermissionOverride.update({
      where: { id: existing.id },
      data: { reason: reason ?? existing.reason, grantedBy: adminId },
    });
  } else {
    await db.userPermissionOverride.deleteMany({
      where: { userId: targetUserId, permission, effect: "GRANT" },
    });

    override = await db.userPermissionOverride.create({
      data: {
        userId: targetUserId,
        permission,
        effect: "DENY",
        reason: reason ?? null,
        grantedBy: adminId,
        expiresAt: expiresAt ?? null,
      },
    });
  }

  await logAudit({
    userId: adminId,
    action: "RBAC_PERMISSION_DENY",
    recordId: targetUserId,
    newData: { permission, reason, expiresAt: expiresAt ?? null },
    ipAddress,
  });

  return override as UserPermissionOverride;
}

// ─── Revoke Override ──────────────────────────────────────────────────────────

export async function revokePermissionOverride(opts: {
  adminId: string;
  overrideId: string;
  ipAddress?: string;
}): Promise<void> {
  const { adminId, overrideId, ipAddress } = opts;

  const override = await db.userPermissionOverride.findUnique({
    where: { id: overrideId },
  });
  if (!override) {
    throw new HttpError("Permission override not found", 404, "NOT_FOUND");
  }

  await db.userPermissionOverride.delete({ where: { id: overrideId } });

  await logAudit({
    userId: adminId,
    action: "RBAC_PERMISSION_REVOKE",
    recordId: override.userId as string,
    oldData: {
      overrideId,
      permission: override.permission,
      effect: override.effect,
    },
    ipAddress,
  });
}

// ─── List Overrides For User ──────────────────────────────────────────────────

export async function listPermissionOverrides(
  userId: string
): Promise<UserPermissionOverride[]> {
  const now = new Date();
  const rows = await db.userPermissionOverride.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
  return rows as UserPermissionOverride[];
}

// ─── Role Override ────────────────────────────────────────────────────────────

export async function assignRoleOverride(opts: {
  adminId: string;
  targetUserId: string;
  overrideRole: UserRole;
  reason: string;
  validFrom: Date;
  validUntil: Date;
  ipAddress?: string;
}): Promise<RoleOverride> {
  const { adminId, targetUserId, overrideRole, reason, validFrom, validUntil, ipAddress } = opts;

  if (validUntil <= validFrom) {
    throw new HttpError("validUntil must be after validFrom", 400, "INVALID_DATES");
  }

  // Revoke any currently active role override first
  await db.userRoleOverride.updateMany({
    where: {
      userId: targetUserId,
      revokedAt: null,
      validUntil: { gte: new Date() },
    },
    data: { revokedAt: new Date() },
  });

  const override = await db.userRoleOverride.create({
    data: {
      userId: targetUserId,
      overrideRole,
      reason,
      grantedBy: adminId,
      validFrom,
      validUntil,
    },
  });

  await logAudit({
    userId: adminId,
    action: "RBAC_ROLE_OVERRIDE_ASSIGN",
    recordId: targetUserId,
    newData: {
      overrideRole,
      reason,
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
    },
    ipAddress,
  });

  return override as RoleOverride;
}

export async function revokeRoleOverride(opts: {
  adminId: string;
  overrideId: string;
  ipAddress?: string;
  reason?: string;
}): Promise<void> {
  const { adminId, overrideId, ipAddress, reason } = opts;

  const override = await db.userRoleOverride.findUnique({
    where: { id: overrideId },
  });
  if (!override) {
    throw new HttpError("Role override not found", 404, "NOT_FOUND");
  }

  await db.userRoleOverride.update({
    where: { id: overrideId },
    data: { revokedAt: new Date() },
  });

  await logAudit({
    userId: adminId,
    action: "RBAC_ROLE_OVERRIDE_REVOKE",
    recordId: override.userId as string,
    oldData: { overrideId, overrideRole: override.overrideRole, reason },
    ipAddress,
  });
}

export async function listActiveRoleOverrides(userId: string): Promise<RoleOverride[]> {
  const now = new Date();
  const rows = await db.userRoleOverride.findMany({
    where: { userId, revokedAt: null, validUntil: { gte: now } },
    orderBy: { createdAt: "desc" },
  });
  return rows as RoleOverride[];
}

// ─── Bulk Permission Matrix ───────────────────────────────────────────────────

export async function getPermissionMatrix(): Promise<
  Array<{
    userId: string;
    fullName: string;
    role: UserRole;
    effectivePermissionCount: number;
    grantCount: number;
    denyCount: number;
  }>
> {
  const now = new Date();

  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, role: true },
    where: { status: "ACTIVE" },
    orderBy: { fullName: "asc" },
  });

  const overrides: Array<{ userId: string; permission: string; effect: string }> =
    await db.userPermissionOverride.findMany({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      select: { userId: true, permission: true, effect: true },
    });

  const overridesByUser = new Map<
    string,
    { grants: Set<string>; denies: Set<string> }
  >();
  for (const o of overrides) {
    if (!overridesByUser.has(o.userId)) {
      overridesByUser.set(o.userId, { grants: new Set(), denies: new Set() });
    }
    const entry = overridesByUser.get(o.userId)!;
    if (o.effect === "GRANT") entry.grants.add(o.permission);
    else entry.denies.add(o.permission);
  }

  return users.map((u) => {
    const baseline = new Set(getPermissionsForRole(u.role as UserRole));
    const userOvr = overridesByUser.get(u.id) ?? {
      grants: new Set<string>(),
      denies: new Set<string>(),
    };
    const effective = new Set([...baseline, ...userOvr.grants]);
    for (const d of userOvr.denies) effective.delete(d);

    return {
      userId: u.id,
      fullName: u.fullName,
      role: u.role as UserRole,
      effectivePermissionCount: effective.size,
      grantCount: userOvr.grants.size,
      denyCount: userOvr.denies.size,
    };
  });
}
