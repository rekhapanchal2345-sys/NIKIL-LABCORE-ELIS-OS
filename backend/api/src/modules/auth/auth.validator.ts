import { z } from "zod";

const identifierField = z
  .string()
  .trim()
  .min(3, "Enter a valid email or employee code")
  .max(120);

export const registerSchema = z.object({
  employeeCode: z.string().trim().min(2).max(50),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^\+91[6-9]\d{9}$/, "Phone must be in +91 format with 10 digits")
    .optional(),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128),
  role: z.enum([
    "ADMIN",
    "SUPER_ADMIN",
    "BRANCH_ADMIN",
    "FRONT_DESK",
    "LAB_TECH",
    "PATHOLOGIST",
    "DOCTOR",
    "ACCOUNTANT",
    "AUDITOR",
  ]),
});

const loginBase = z.object({
  identifier: identifierField.optional(),
  email: identifierField.optional(),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required")
    .max(128),
});

export const loginSchema = loginBase
  .transform((data) => ({
    identifier: (data.identifier ?? data.email ?? "").trim(),
    password: data.password,
  }))
  .refine((data) => data.identifier.length >= 3, {
    message: "Email or employee code is required",
    path: ["identifier"],
  });

export const mfaVerifySchema = z.object({
  mfaToken: z.string().min(10, "MFA challenge is missing"),
  code: z
    .string()
    .trim()
    .min(6, "Enter the 6-digit code")
    .max(32, "Enter the 6-digit code or a backup code"),
  trustDevice: z.boolean().optional(),
  deviceName: z.string().trim().max(100).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z
    .string({ message: "Refresh token is required" })
    .min(20, "Invalid refresh token"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128),
});

export const ownerVerifySchema = z.object({
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required")
    .max(128),
});

/** Addresses are normalised before validation so Gmail variants all pass. */
const emailField = z
  .string()
  .trim()
  .min(3, "Enter a valid email address")
  .max(254)
  .email("Enter a valid email address");

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  email: emailField,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128),
});

export const verifyEmailRequestSchema = z.object({
  email: emailField,
});

export const verifyEmailConfirmSchema = z.object({
  email: emailField,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

export const sessionIdParamSchema = z.object({
  id: z.string().min(1),
});

/**
 * Step-up MFA verification schema.
 * Used before sensitive operations (PII export, bulk delete, settings change).
 */
export const stepUpVerifySchema = z.object({
  mfaCode: z
    .string()
    .trim()
    .min(6, "Enter the 6-digit authenticator code")
    .max(8, "Enter the 6-digit authenticator code"),
  scope: z
    .string()
    .trim()
    .min(1, "Scope is required")
    .max(64, "Invalid scope")
    .regex(/^[a-z_]+$/, "Scope must be lowercase letters and underscores only"),
});

/**
 * Phase 2: MFA Setup Confirmation Schema.
 */
export const mfaSetupConfirmSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Enter the 6-digit authenticator code")
    .max(8, "Enter the 6-digit authenticator code"),
});

/**
 * Phase 2: MFA Disable Schema.
 * Requires password confirmation and valid TOTP code.
 */
export const mfaDisableSchema = z.object({
  password: z.string().min(1, "Current password is required to disable MFA"),
  code: z
    .string()
    .trim()
    .min(6, "Enter the 6-digit authenticator code")
    .max(8, "Enter the 6-digit authenticator code"),
});

/**
 * Phase 2: Trusted Device ID Param Schema.
 */
export const deviceIdParamSchema = z.object({
  id: z.string().min(1, "Device ID is required"),
});

/**
 * Phase 2: WebAuthn Credential ID Param Schema.
 */
export const webauthnCredentialIdParamSchema = z.object({
  id: z.string().min(1, "Credential ID is required"),
});

/**
 * Phase 2: WebAuthn Registration Verification Schema.
 */
export const webauthnRegisterVerifySchema = z.object({
  credentialId: z.string().min(1, "credentialId is required"),
  clientDataJSON: z.string().min(1, "clientDataJSON is required"),
  publicKey: z.string().min(1, "publicKey is required"),
  deviceName: z.string().max(100).optional(),
  transports: z.array(z.string()).optional(),
});

/**
 * Phase 2: WebAuthn Authentication Verification Schema.
 */
export const webauthnLoginVerifySchema = z.object({
  credentialId: z.string().min(1, "credentialId is required"),
  clientDataJSON: z.string().min(1, "clientDataJSON is required"),
  authenticatorData: z.string().min(1, "authenticatorData is required"),
  signature: z.string().min(1, "signature is required"),
});

// ─── Phase 3: Enterprise RBAC / ABAC Schemas ──────────────────────────────────

const validPermissions = [
  "patient:read", "patient:create", "patient:update", "patient:delete", "patient:export",
  "doctor:read", "doctor:create", "doctor:update",
  "test:read", "test:create", "test:update",
  "order:read", "order:create", "order:update", "order:export",
  "sample:read", "sample:collect",
  "result:read", "result:enter", "result:approve", "result:export",
  "invoice:read", "invoice:create", "invoice:export",
  "payment:read", "payment:create", "payment:refund", "payment:refund_approve",
  "payment:verify", "payment:void", "payment:advance", "payment:counter_open",
  "payment:counter_close", "payment:settlement", "payment:reconcile",
  "payment:export", "payment:audit",
  "report:read", "report:create", "report:export",
  "analyzer:read", "analyzer:create",
  "audit:read",
  "user:read", "user:create", "user:update", "user:unlock",
  "session:revoke",
  "settings:read", "settings:update",
] as const;

const permissionField = z
  .string()
  .refine((v) => (validPermissions as readonly string[]).includes(v), {
    message: "Invalid permission",
  });

const validRoles = [
  "ADMIN", "SUPER_ADMIN", "BRANCH_ADMIN", "FRONT_DESK",
  "LAB_TECH", "PATHOLOGIST", "DOCTOR", "ACCOUNTANT", "AUDITOR",
] as const;

export const grantPermissionSchema = z.object({
  permission: permissionField,
  reason: z.string().trim().max(500).optional(),
  expiresAt: z.string().datetime({ message: "expiresAt must be ISO 8601" }).optional(),
});

export const denyPermissionSchema = z.object({
  permission: permissionField,
  reason: z.string().trim().max(500).optional(),
  expiresAt: z.string().datetime({ message: "expiresAt must be ISO 8601" }).optional(),
});

export const assignRoleOverrideSchema = z.object({
  overrideRole: z.enum(validRoles, { message: "Invalid role" }),
  reason: z.string().trim().min(1, "Reason is required").max(500),
  validFrom: z.string().datetime({ message: "validFrom must be ISO 8601" }),
  validUntil: z.string().datetime({ message: "validUntil must be ISO 8601" }),
}).refine(
  (d) => new Date(d.validUntil) > new Date(d.validFrom),
  { message: "validUntil must be after validFrom", path: ["validUntil"] }
);

export const abacEvaluateSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  userRole: z.enum(validRoles, { message: "Invalid role" }),
  resourceType: z.enum([
    "patient", "order", "result", "invoice", "payment",
    "report", "audit_log", "user",
  ]),
  resourceId: z.string().optional(),
  action: z.enum(["read", "create", "update", "delete", "export", "approve", "print"]),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

export const overrideIdParamSchema = z.object({
  id: z.string().min(1, "Override ID is required"),
});

// ─── Phase 4: SSO & Identity Federation Schemas ───────────────────────────────

export const createSsoProviderSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  protocol: z.enum(["OIDC", "SAML"], { message: "Protocol must be OIDC or SAML" }),
  issuer: z.string().trim().min(1, "Issuer is required"),
  clientId: z.string().trim().min(1, "Client ID is required"),
  clientSecret: z.string().trim().optional(),
  metadataUrl: z.string().trim().optional(),
  ssoUrl: z.string().trim().min(1, "SSO Login URL is required"),
  tokenUrl: z.string().trim().optional(),
  userInfoUrl: z.string().trim().optional(),
  certificate: z.string().trim().optional(),
  domainRestriction: z.string().trim().optional(),
  defaultRole: z.enum(validRoles, { message: "Invalid default role" }).optional(),
  roleAttribute: z.string().trim().optional(),
  jitEnabled: z.boolean().optional(),
});

export const updateSsoProviderSchema = createSsoProviderSchema.partial();

// ─── Phase 4: Break-Glass Emergency Access Schemas ────────────────────────────

export const initiateBreakGlassSchema = z.object({
  targetResourceType: z.enum(["patient", "result", "order"]),
  targetResourceId: z.string().min(1, "Target resource ID is required"),
  reason: z.string().trim().min(10, "Clinical justification must be at least 10 characters").max(1000),
  durationMinutes: z.number().int().min(15).max(240).optional(),
});

export const validateBreakGlassSchema = z.object({
  token: z.string().min(1, "Token is required"),
  resourceType: z.enum(["patient", "result", "order"]),
  resourceId: z.string().optional(),
});

export const reviewBreakGlassSchema = z.object({
  reviewNotes: z.string().trim().min(5, "Review notes must be at least 5 characters").max(1000),
  approved: z.boolean(),
});

// ─── Phase 4: SCIM Token Schema ───────────────────────────────────────────────

export const createScimTokenSchema = z.object({
  name: z.string().trim().min(2, "Token name must be at least 2 characters").max(100),
});

// ─── Phase 5: Digital Signature Schemas (FDA 21 CFR Part 11) ─────────────────

export const createDigitalSignatureSchema = z.object({
  resourceType: z.enum(["result", "report", "order", "amendment"]),
  resourceId: z.string().min(1, "Resource ID is required"),
  meaning: z.enum(["AUTHORED", "VERIFIED", "APPROVED", "AMENDED"]),
  reason: z.string().trim().max(1000).optional(),
  password: z.string().min(1).optional(),
  stepUpToken: z.string().min(1).optional(),
  payload: z.record(z.string(), z.unknown()),
}).refine((d) => d.password || d.stepUpToken, {
  message: "Either password or stepUpToken is required for digital signing (FDA 21 CFR Part 11)",
  path: ["password"],
});

export const verifyDigitalSignatureSchema = z.object({
  currentPayload: z.record(z.string(), z.unknown()).optional(),
});

// ─── Phase 5: OAuth2 M2M API Client Schemas ───────────────────────────────────

export const createApiClientSchema = z.object({
  name: z.string().trim().min(2, "Client name must be at least 2 characters").max(100),
  scopes: z.array(z.string().min(1)).min(1, "At least one scope is required"),
  ipWhitelist: z.string().trim().optional(),
  rateLimit: z.number().int().min(10).max(100000).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export const mitigateThreatSchema = z.object({
  action: z.string().trim().min(2).max(100),
});


