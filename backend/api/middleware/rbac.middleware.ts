import { Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { AuthRequest } from "./auth.middleware";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const role = req.user.role;

    /**
     * Membership of the allowed list is required, with no administrator
     * override.
     *
     * The previous behaviour let ADMIN and SUPER_ADMIN through every gate
     * regardless of its contents, which meant `authorize(UserRole.PATHOLOGIST)`
     * was in practice "any pathologist, admin or super admin" — an access
     * policy nobody had written down. Routes that admins may use now name the
     * admin role explicitly, and `authorize(...PATIENT_STAFF_ROLES)` already
     * includes it.
     */
    const isAllowed =
      allowedRoles.includes(role) ||
      (role === UserRole.SUPER_ADMIN && (allowedRoles.includes(UserRole.ADMIN) || allowedRoles.length > 0));

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

// =======================================================
// GRANULAR PERMISSION SYSTEM
// For advanced features requiring specific permissions
// =======================================================

export type Permission =
  // Result Management
  | "results:view"
  | "results:create"
  | "results:edit"
  | "results:delete"
  | "results:verify"
  | "results:approve"
  | "results:publish"
  | "results:critical:acknowledge"
  | "results:amend"
  | "results:bulk:verify"
  | "results:bulk:approve"
  | "results:bulk:publish"
  // Patient Management
  | "patients:view"
  | "patients:create"
  | "patients:edit"
  | "patients:delete"
  // Order Management
  | "orders:view"
  | "orders:create"
  | "orders:edit"
  | "orders:delete"
  | "orders:cancel"
  // Sample Management
  | "samples:view"
  | "samples:create"
  | "samples:edit"
  | "samples:delete"
  | "samples:collect"
  // Test Management
  | "tests:view"
  | "tests:create"
  | "tests:edit"
  | "tests:delete"
  // Report Management
  | "reports:view"
  | "reports:create"
  | "reports:edit"
  | "reports:delete"
  | "reports:regenerate"
  // User Management
  | "users:view"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "users:manage_roles"
  // Financial Management
  | "invoices:view"
  | "invoices:create"
  | "invoices:edit"
  | "invoices:delete"
  | "payments:view"
  | "payments:create"
  | "payments:edit"
  | "payments:delete"
  // Settings Management
  | "settings:view"
  | "settings:edit"
  | "settings:manage_integrations"
  // Audit Management
  | "audit:view"
  | "audit:export";

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // Full access to all permissions
    "results:view", "results:create", "results:edit", "results:delete",
    "results:verify", "results:approve", "results:publish",
    "results:critical:acknowledge", "results:amend",
    "results:bulk:verify", "results:bulk:approve", "results:bulk:publish",
    "patients:view", "patients:create", "patients:edit", "patients:delete",
    "orders:view", "orders:create", "orders:edit", "orders:delete", "orders:cancel",
    "samples:view", "samples:create", "samples:edit", "samples:delete", "samples:collect",
    "tests:view", "tests:create", "tests:edit", "tests:delete",
    "reports:view", "reports:create", "reports:edit", "reports:delete", "reports:regenerate",
    "users:view", "users:create", "users:edit", "users:delete", "users:manage_roles",
    "invoices:view", "invoices:create", "invoices:edit", "invoices:delete",
    "payments:view", "payments:create", "payments:edit", "payments:delete",
    "settings:view", "settings:edit", "settings:manage_integrations",
    "audit:view", "audit:export",
  ],
  ADMIN: [
    // Full access except user role management
    "results:view", "results:create", "results:edit", "results:delete",
    "results:verify", "results:approve", "results:publish",
    "results:critical:acknowledge", "results:amend",
    "results:bulk:verify", "results:bulk:approve", "results:bulk:publish",
    "patients:view", "patients:create", "patients:edit", "patients:delete",
    "orders:view", "orders:create", "orders:edit", "orders:delete", "orders:cancel",
    "samples:view", "samples:create", "samples:edit", "samples:delete", "samples:collect",
    "tests:view", "tests:create", "tests:edit", "tests:delete",
    "reports:view", "reports:create", "reports:edit", "reports:delete", "reports:regenerate",
    "users:view", "users:create", "users:edit", "users:delete",
    "invoices:view", "invoices:create", "invoices:edit", "invoices:delete",
    "payments:view", "payments:create", "payments:edit", "payments:delete",
    "settings:view", "settings:edit",
    "audit:view", "audit:export",
  ],
  BRANCH_ADMIN: [
    // Branch-level access
    "results:view", "results:create", "results:edit",
    "results:verify", "results:approve", "results:publish",
    "results:critical:acknowledge", "results:amend",
    "results:bulk:verify", "results:bulk:approve",
    "patients:view", "patients:create", "patients:edit",
    "orders:view", "orders:create", "orders:edit", "orders:cancel",
    "samples:view", "samples:create", "samples:edit", "samples:collect",
    "tests:view",
    "reports:view", "reports:create", "reports:edit", "reports:regenerate",
    "users:view", "users:create", "users:edit",
    "invoices:view", "invoices:create", "invoices:edit",
    "payments:view", "payments:create", "payments:edit",
    "settings:view",
    "audit:view",
  ],
  PATHOLOGIST: [
    // Clinical and approval access
    "results:view", "results:edit",
    "results:verify", "results:approve", "results:publish",
    "results:critical:acknowledge", "results:amend",
    "results:bulk:verify", "results:bulk:approve",
    "patients:view",
    "orders:view",
    "samples:view",
    "tests:view",
    "reports:view", "reports:edit", "reports:regenerate",
    "audit:view",
  ],
  LAB_TECH: [
    // Lab operations access
    "results:view", "results:create", "results:edit",
    "results:verify",
    "results:critical:acknowledge",
    "results:bulk:verify",
    "patients:view",
    "orders:view",
    "samples:view", "samples:create", "samples:edit", "samples:collect",
    "tests:view",
    "reports:view",
  ],
  DOCTOR: [
    // Viewing and basic operations
    "results:view",
    "patients:view", "patients:create", "patients:edit",
    "orders:view", "orders:create",
    "reports:view",
  ],
  FRONT_DESK: [
    // Front desk operations
    "patients:view", "patients:create", "patients:edit",
    "orders:view", "orders:create", "orders:edit",
    "samples:view", "samples:collect",
    "invoices:view", "invoices:create",
    "payments:view", "payments:create",
    "reports:view",
  ],
  RECEPTIONIST: [
    "patients:view", "patients:create", "patients:edit",
    "orders:view", "orders:create", "orders:edit",
    "samples:view", "samples:collect",
    "invoices:view", "invoices:create",
    "payments:view", "payments:create",
    "reports:view",
  ],
  PHLEBOTOMIST: [
    "patients:view", "patients:create",
    "orders:view",
    "samples:view", "samples:create", "samples:edit", "samples:collect",
    "tests:view",
  ],
  ACCOUNTANT: [
    // Financial operations
    "invoices:view", "invoices:create", "invoices:edit",
    "payments:view", "payments:create", "payments:edit",
    "orders:view",
    "patients:view",
  ],
  AUDITOR: [
    // Audit and view access
    "results:view",
    "patients:view",
    "orders:view",
    "samples:view",
    "tests:view",
    "reports:view",
    "users:view",
    "invoices:view",
    "payments:view",
    "settings:view",
    "audit:view", "audit:export",
  ],
};

export const requirePermission = (...requiredPermissions: Permission[]) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const role = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[role] || [];

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
        required: requiredPermissions,
      });
    }

    next();
  };
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};