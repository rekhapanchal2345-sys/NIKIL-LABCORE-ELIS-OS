import type { UserRole } from "./auth";

export const PERMISSIONS = {
  PATIENT_READ: "patient:read",
  PATIENT_CREATE: "patient:create",
  PATIENT_UPDATE: "patient:update",
  PATIENT_DELETE: "patient:delete",
  PATIENT_EXPORT: "patient:export",

  DOCTOR_READ: "doctor:read",
  DOCTOR_CREATE: "doctor:create",
  DOCTOR_UPDATE: "doctor:update",

  TEST_READ: "test:read",
  TEST_CREATE: "test:create",
  TEST_UPDATE: "test:update",

  ORDER_READ: "order:read",
  ORDER_CREATE: "order:create",
  ORDER_UPDATE: "order:update",
  ORDER_EXPORT: "order:export",

  SAMPLE_READ: "sample:read",
  SAMPLE_COLLECT: "sample:collect",
  SAMPLE_ACCESSION: "sample:accession",
  SAMPLE_REJECT: "sample:reject",

  RESULT_READ: "result:read",
  RESULT_ENTER: "result:enter",
  RESULT_APPROVE: "result:approve",
  RESULT_EXPORT: "result:export",

  INVOICE_READ: "invoice:read",
  INVOICE_CREATE: "invoice:create",
  INVOICE_EXPORT: "invoice:export",

  PAYMENT_READ: "payment:read",
  PAYMENT_CREATE: "payment:create",
  PAYMENT_REFUND: "payment:refund",
  PAYMENT_REFUND_APPROVE: "payment:refund_approve",
  PAYMENT_VERIFY: "payment:verify",
  PAYMENT_VOID: "payment:void",
  PAYMENT_ADVANCE: "payment:advance",
  PAYMENT_COUNTER_OPEN: "payment:counter_open",
  PAYMENT_COUNTER_CLOSE: "payment:counter_close",
  PAYMENT_SETTLEMENT: "payment:settlement",
  PAYMENT_RECONCILE: "payment:reconcile",
  PAYMENT_EXPORT: "payment:export",
  PAYMENT_AUDIT: "payment:audit",

  REPORT_READ: "report:read",
  REPORT_CREATE: "report:create",
  REPORT_EXPORT: "report:export",
  REPORT_SIGN: "report:sign",

  ANALYZER_READ: "analyzer:read",
  ANALYZER_CREATE: "analyzer:create",
  ANALYZER_SIMULATE: "analyzer:simulate",

  QC_READ: "qc:read",
  QC_RUN: "qc:run",
  QC_APPROVE: "qc:approve",

  AI_READ: "ai:read",
  AI_OVERRIDE: "ai:override",

  AUDIT_READ: "audit:read",

  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_UNLOCK: "user:unlock",
  SESSION_REVOKE: "session:revoke",

  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",

  BRANCH_READ: "branch:read",
  BRANCH_MANAGE: "branch:manage",

  BACKUP_READ: "backup:read",
  BACKUP_CREATE: "backup:create",
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.AUDIT_READ),
  BRANCH_ADMIN: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.USER_UNLOCK),
  
  FRONT_DESK: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.DOCTOR_READ,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.SAMPLE_READ,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_EXPORT,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_VERIFY,
    PERMISSIONS.PAYMENT_ADVANCE,
    PERMISSIONS.PAYMENT_COUNTER_OPEN,
    PERMISSIONS.PAYMENT_COUNTER_CLOSE,
    PERMISSIONS.BRANCH_READ,
  ],

  RECEPTIONIST: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.DOCTOR_READ,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.SAMPLE_READ,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_EXPORT,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_VERIFY,
    PERMISSIONS.PAYMENT_ADVANCE,
    PERMISSIONS.PAYMENT_COUNTER_OPEN,
    PERMISSIONS.PAYMENT_COUNTER_CLOSE,
    PERMISSIONS.BRANCH_READ,
  ],

  PHLEBOTOMIST: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.DOCTOR_READ,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.SAMPLE_READ,
    PERMISSIONS.SAMPLE_COLLECT,
    PERMISSIONS.SAMPLE_ACCESSION,
    PERMISSIONS.SAMPLE_REJECT,
  ],

  LAB_TECH: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.DOCTOR_READ,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.SAMPLE_READ,
    PERMISSIONS.SAMPLE_COLLECT,
    PERMISSIONS.SAMPLE_ACCESSION,
    PERMISSIONS.SAMPLE_REJECT,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.RESULT_ENTER,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.ANALYZER_READ,
    PERMISSIONS.ANALYZER_SIMULATE,
    PERMISSIONS.QC_READ,
    PERMISSIONS.QC_RUN,
  ],

  PATHOLOGIST: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_EXPORT,
    PERMISSIONS.DOCTOR_READ,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.SAMPLE_READ,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.RESULT_ENTER,
    PERMISSIONS.RESULT_APPROVE,
    PERMISSIONS.RESULT_EXPORT,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_SIGN,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.ANALYZER_READ,
    PERMISSIONS.QC_READ,
    PERMISSIONS.QC_RUN,
    PERMISSIONS.QC_APPROVE,
    PERMISSIONS.AI_READ,
    PERMISSIONS.AI_OVERRIDE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.BRANCH_READ,
  ],

  DOCTOR: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.DOCTOR_READ,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.REPORT_READ,
  ],

  ACCOUNTANT: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_EXPORT,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_REFUND,
    PERMISSIONS.PAYMENT_REFUND_APPROVE,
    PERMISSIONS.PAYMENT_VERIFY,
    PERMISSIONS.PAYMENT_ADVANCE,
    PERMISSIONS.PAYMENT_COUNTER_OPEN,
    PERMISSIONS.PAYMENT_COUNTER_CLOSE,
    PERMISSIONS.PAYMENT_SETTLEMENT,
    PERMISSIONS.PAYMENT_RECONCILE,
    PERMISSIONS.PAYMENT_EXPORT,
    PERMISSIONS.PAYMENT_AUDIT,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.BRANCH_READ,
  ],

  AUDITOR: [
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.USER_READ,
  ],
};

export const normalizeRoleString = (role?: string | null): string => {
  if (!role) return "FRONT_DESK";
  const upper = role.trim().toUpperCase();
  if (upper === "RECEPTIONIST") return "RECEPTIONIST";
  if (upper === "PHLEB") return "PHLEBOTOMIST";
  if (upper === "LAB_TECHNICIAN" || upper === "TECHNICIAN") return "LAB_TECH";
  return upper;
};

export const getPermissionsForRole = (
  role: string
): readonly Permission[] => {
  const norm = normalizeRoleString(role);
  if (norm === "SUPER_ADMIN") return ALL_PERMISSIONS;
  return ROLE_PERMISSIONS[norm] ?? ROLE_PERMISSIONS.FRONT_DESK ?? [];
};

export const hasPermission = (
  role: string,
  permission: Permission
): boolean => {
  const norm = normalizeRoleString(role);
  if (norm === "SUPER_ADMIN") {
    return true;
  }
  return getPermissionsForRole(norm).includes(permission);
};

export const hasAnyPermission = (
  role: string,
  permissions: Permission[]
): boolean => {
  return permissions.some((permission) => hasPermission(role, permission));
};

export const hasAllPermissions = (
  role: string,
  permissions: Permission[]
): boolean => {
  return permissions.every((permission) => hasPermission(role, permission));
};

const MFA_REQUIRED_ROLES = new Set(
  String(process.env.MFA_REQUIRED_ROLES || "ADMIN,SUPER_ADMIN,BRANCH_ADMIN")
    .split(",")
    .map((role) => role.trim().toUpperCase())
    .filter(Boolean)
);

export const mfaRequiredForRole = (role: string): boolean => {
  if (
    process.env.MFA_ENABLED === "false" ||
    process.env.MFA_REQUIRED_ROLES === "NONE" ||
    process.env.MFA_REQUIRED_ROLES === ""
  ) {
    return false;
  }
  return MFA_REQUIRED_ROLES.has(normalizeRoleString(role));
};

export const idleTimeoutMinutesForRole = (role: string): number => {
  const norm = normalizeRoleString(role);
  if (norm === "ADMIN" || norm === "SUPER_ADMIN" || norm === "BRANCH_ADMIN") {
    return Number(process.env.IDLE_TIMEOUT_ADMIN_MINUTES || 20);
  }
  return Number(process.env.IDLE_TIMEOUT_MINUTES || 30);
};

export const maxConcurrentSessions = (): number =>
  Number(process.env.MAX_CONCURRENT_SESSIONS || 2);
