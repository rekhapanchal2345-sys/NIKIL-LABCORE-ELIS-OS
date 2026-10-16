import { Router, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import {
  changePasswordHandler,
  forgotPassword,
  login,
  logout,
  profile,
  refresh,
  register,
  resetPassword,
  revokeSession,
  sessions,
  unlock,
  verifyEmailConfirm,
  verifyEmailRequest,
  verifyMfa,
  verifyOwner,
  securityScore,
  verifyStepUp,
  auditIntegrityCheck,
  blacklistHealthHandler,
  mfaStatusHandler,
  mfaSetupInitiateHandler,
  mfaSetupConfirmHandler,
  mfaDisableHandler,
  backupCodesRegenerateHandler,
  backupCodesStatusHandler,
  trustedDevicesListHandler,
  trustedDeviceRevokeHandler,
  trustedDevicesRevokeAllHandler,
  webauthnRegisterOptionsHandler,
  webauthnRegisterVerifyHandler,
  webauthnLoginOptionsHandler,
  webauthnLoginVerifyHandler,
  webauthnListCredentialsHandler,
  webauthnDeleteCredentialHandler,
} from "./auth.controller";
import { authenticate, requireRoles } from "../../../middleware/auth";
import { validate } from "../../../middleware/validate.middleware";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  mfaVerifySchema,
  ownerVerifySchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailConfirmSchema,
  verifyEmailRequestSchema,
  mfaSetupConfirmSchema,
  mfaDisableSchema,
  deviceIdParamSchema,
  webauthnRegisterVerifySchema,
  webauthnLoginVerifySchema,
  webauthnCredentialIdParamSchema,
} from "./auth.validator";

const authLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Covers routine token refreshes for a shared workstation IP.
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please wait a few minutes.",
    code: "RATE_LIMITED",
  },
});

/**
 * A laboratory shares one egress IP across many workstations, so this limits
 * failed attempts per network rather than blocking legitimate sign-ins.
 * Per-account lockout handles targeted brute force.
 */
const loginLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many sign-in attempts from this network. Please try later.",
    code: "RATE_LIMITED",
  },
});

/**
 * Tighter limiter for the endpoints that send email.
 *
 * These trigger an outbound message, so an unbounded caller could both mail-bomb
 * an address and use the SMTP connection for denial of service.
 */
const emailCodeLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.EMAIL_CODE_RATE_LIMIT_MAX || 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many codes requested. Please wait before trying again.",
    code: "RATE_LIMITED",
  },
});

/** Limiter for code verification, which must resist guessing. */
const codeVerifyLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.EMAIL_CODE_VERIFY_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please request a new code.",
    code: "RATE_LIMITED",
  },
});

const router = Router();

router.post(
  "/login",
  loginLimiter,
  validate({ body: loginSchema }),
  login
);

router.post(
  "/login/mfa",
  authLimiter,
  validate({ body: mfaVerifySchema }),
  verifyMfa
);

router.post(
  "/refresh",
  authLimiter,
  validate({ body: refreshSchema }),
  refresh
);

/**
 * Password recovery over Gmail.
 *
 * Both endpoints answer identically for known and unknown addresses so they
 * cannot be used to discover which emails have staff accounts.
 */
router.post(
  "/password/forgot",
  emailCodeLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPassword
);

router.post(
  "/password/reset",
  codeVerifyLimiter,
  validate({ body: resetPasswordSchema }),
  resetPassword
);

/** Confirms that a Gmail address can receive mail before it is trusted. */
router.post(
  "/verify-email/request",
  emailCodeLimiter,
  validate({ body: verifyEmailRequestSchema }),
  verifyEmailRequest
);

router.post(
  "/verify-email/confirm",
  codeVerifyLimiter,
  validate({ body: verifyEmailConfirmSchema }),
  verifyEmailConfirm
);

/**
 * Staff registration is restricted to administrators and now also requires a
 * fresh owner confirmation (POST /api/auth/owner/verify).
 */
router.post(
  "/register",
  authLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate({ body: registerSchema }),
  register
);

/**
 * Re-confirm the signed-in operator with their own password.
 * Returns a short-lived token required by privileged browser actions.
 */
router.post(
  "/owner/verify",
  authLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN", "BRANCH_ADMIN"),
  validate({ body: ownerVerifySchema }),
  verifyOwner
);

router.get("/profile", authenticate, profile);

router.get("/me", authenticate, profile);

router.post("/logout", authenticate, logout);

router.get("/sessions", authenticate, sessions);

router.delete("/sessions/:id", authenticate, revokeSession);

router.post(
  "/password/change",
  authenticate,
  validate({ body: changePasswordSchema }),
  changePasswordHandler
);

/**
 * Unlock an account locked by failed sign-in attempts.
 */
router.patch(
  "/:id/unlock",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  unlock
);

// ─── Enterprise Security Endpoints ───────────────────────────────────────────

/**
 * Security health score for the signed-in user.
 * Returns grade (A-F), score (0-100), and improvement recommendations.
 */
router.get("/security-score", authenticate, securityScore);

/**
 * Step-up MFA verification.
 * Call this before performing a sensitive action that requires re-authentication.
 * Returns a short-lived step-up token to include in subsequent requests.
 */
router.post(
  "/step-up/verify",
  authLimiter,
  authenticate,
  validate({ body: require("./auth.validator").stepUpVerifySchema }),
  verifyStepUp
);

/**
 * Audit log integrity check (admin only).
 * Walks the audit chain and verifies no rows have been tampered with.
 */
router.get(
  "/admin/audit/integrity",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  auditIntegrityCheck
);

/**
 * Token blacklist health stats (admin only).
 * Shows in-memory blacklist size for monitoring.
 */
router.get(
  "/admin/blacklist/stats",
  authenticate,
  requireRoles("SUPER_ADMIN"),
  blacklistHealthHandler
);

// ─── Phase 2: Advanced MFA & Device Trust Routes ─────────────────────────────

/** Full MFA status & configuration report for current user */
router.get("/mfa/status", authenticate, mfaStatusHandler);

/** Initiate voluntary TOTP setup (returns secret, otpauth url, and QR code) */
router.post("/mfa/setup", authLimiter, authenticate, mfaSetupInitiateHandler);

/** Confirm voluntary TOTP setup with 6-digit code, activates MFA */
router.post(
  "/mfa/confirm",
  authLimiter,
  authenticate,
  validate({ body: mfaSetupConfirmSchema }),
  mfaSetupConfirmHandler
);

/** Disable MFA (requires password confirmation + valid TOTP code) */
router.post(
  "/mfa/disable",
  authLimiter,
  authenticate,
  validate({ body: mfaDisableSchema }),
  mfaDisableHandler
);

/** Regenerate backup recovery codes (replaces all existing) */
router.post(
  "/mfa/backup-codes/regenerate",
  authLimiter,
  authenticate,
  backupCodesRegenerateHandler
);

/** View status of backup recovery codes */
router.get("/mfa/backup-codes/status", authenticate, backupCodesStatusHandler);

/** List active trusted devices for current user */
router.get("/trusted-devices", authenticate, trustedDevicesListHandler);

/** Revoke a specific trusted device */
router.delete(
  "/trusted-devices/:id",
  authenticate,
  validate({ params: deviceIdParamSchema }),
  trustedDeviceRevokeHandler
);

/** Revoke all trusted devices for current user */
router.delete("/trusted-devices", authenticate, trustedDevicesRevokeAllHandler);

/** FIDO2 / WebAuthn passkey registration challenge */
router.post(
  "/webauthn/register/options",
  authLimiter,
  authenticate,
  webauthnRegisterOptionsHandler
);

/** FIDO2 / WebAuthn verify & save passkey */
router.post(
  "/webauthn/register/verify",
  authLimiter,
  authenticate,
  validate({ body: webauthnRegisterVerifySchema }),
  webauthnRegisterVerifyHandler
);

/** FIDO2 / WebAuthn authentication challenge */
router.get("/webauthn/login/options", authLimiter, webauthnLoginOptionsHandler);

/** FIDO2 / WebAuthn verify assertion and sign in */
router.post(
  "/webauthn/login/verify",
  authLimiter,
  validate({ body: webauthnLoginVerifySchema }),
  webauthnLoginVerifyHandler
);

/** List registered WebAuthn / FIDO2 security keys */
router.get("/webauthn/credentials", authenticate, webauthnListCredentialsHandler);

/** Delete a registered WebAuthn / FIDO2 security key */
router.delete(
  "/webauthn/credentials/:id",
  authenticate,
  validate({ params: webauthnCredentialIdParamSchema }),
  webauthnDeleteCredentialHandler
);

// ─── Phase 3: Enterprise RBAC / ABAC Admin Routes ─────────────────────────────
import {
  permissionMatrixHandler,
  effectivePermissionsHandler,
  listOverridesHandler,
  grantPermissionHandler,
  denyPermissionHandler,
  revokeOverrideHandler,
  listRoleOverridesHandler,
  assignRoleOverrideHandler,
  revokeRoleOverrideHandler,
  abacPoliciesHandler,
  abacEvaluateHandler,
} from "./rbac.controller";
import {
  grantPermissionSchema,
  denyPermissionSchema,
  assignRoleOverrideSchema,
  abacEvaluateSchema,
  userIdParamSchema,
  overrideIdParamSchema,
} from "./auth.validator";

const rbacLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "RBAC admin rate limit exceeded", code: "RATE_LIMITED" },
});

/**
 * GET /auth/admin/rbac/matrix
 * Full user × permission matrix for the Admin UI permission grid.
 */
router.get(
  "/admin/rbac/matrix",
  rbacLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  permissionMatrixHandler
);

/**
 * GET /auth/admin/rbac/users/:id/permissions
 * Effective permission set for a specific user (role + overrides).
 */
router.get(
  "/admin/rbac/users/:id/permissions",
  rbacLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate({ params: userIdParamSchema }),
  effectivePermissionsHandler
);

/**
 * GET /auth/admin/rbac/users/:id/overrides
 * List all active permission overrides for a user.
 */
router.get(
  "/admin/rbac/users/:id/overrides",
  rbacLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate({ params: userIdParamSchema }),
  listOverridesHandler
);

/**
 * POST /auth/admin/rbac/users/:id/grant
 * Grant an extra permission to a user (ADMIN + step-up required).
 */
router.post(
  "/admin/rbac/users/:id/grant",
  rbacLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate({ params: userIdParamSchema, body: grantPermissionSchema }),
  grantPermissionHandler
);

/**
 * POST /auth/admin/rbac/users/:id/deny
 * Explicitly deny a permission for a user, overriding role baseline.
 */
router.post(
  "/admin/rbac/users/:id/deny",
  rbacLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate({ params: userIdParamSchema, body: denyPermissionSchema }),
  denyPermissionHandler
);

/**
 * DELETE /auth/admin/rbac/overrides/:id
 * Revoke a specific permission override by its ID.
 */
router.delete(
  "/admin/rbac/overrides/:id",
  rbacLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate({ params: overrideIdParamSchema }),
  revokeOverrideHandler
);

/**
 * GET /auth/admin/rbac/users/:id/role-overrides
 * List active temporary role overrides for a user.
 */
router.get(
  "/admin/rbac/users/:id/role-overrides",
  rbacLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate({ params: userIdParamSchema }),
  listRoleOverridesHandler
);

/**
 * POST /auth/admin/rbac/users/:id/role-overrides
 * Assign a temporary role override (e.g. Pathologist cover for a day).
 */
router.post(
  "/admin/rbac/users/:id/role-overrides",
  rbacLimiter,
  authenticate,
  requireRoles("SUPER_ADMIN"),
  validate({ params: userIdParamSchema, body: assignRoleOverrideSchema }),
  assignRoleOverrideHandler
);

/**
 * DELETE /auth/admin/rbac/role-overrides/:id
 * Revoke a temporary role override before it expires.
 */
router.delete(
  "/admin/rbac/role-overrides/:id",
  rbacLimiter,
  authenticate,
  requireRoles("SUPER_ADMIN"),
  validate({ params: overrideIdParamSchema }),
  revokeRoleOverrideHandler
);

/**
 * GET /auth/admin/abac/policies
 * List all registered ABAC policies and their priorities.
 */
router.get(
  "/admin/abac/policies",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  abacPoliciesHandler
);

/**
 * POST /auth/admin/abac/evaluate
 * Dry-run ABAC evaluation — simulates a policy decision without side effects.
 * Useful for testing policies before deploying a role/permission change.
 */
router.post(
  "/admin/abac/evaluate",
  rbacLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate({ body: abacEvaluateSchema }),
  abacEvaluateHandler
);

// ─── Phase 4: Enterprise Identity Federation & SSO (OIDC & SAML 2.0) ──────────

import {
  listPublicProvidersHandler,
  oidcLoginHandler,
  oidcCallbackHandler,
  samlMetadataHandler,
  samlLoginHandler,
  samlAcsHandler,
  adminListProvidersHandler,
  adminCreateProviderHandler,
  adminUpdateProviderHandler,
  adminDeleteProviderHandler,
} from "./sso.controller";

import {
  initiateBreakGlassHandler,
  validateBreakGlassHandler,
  reviewBreakGlassHandler,
  revokeBreakGlassHandler,
  listActiveBreakGlassHandler,
  listBreakGlassHistoryHandler,
} from "./break-glass.controller";

import {
  authenticateScim,
  scimListUsersHandler,
  scimGetUserHandler,
  scimCreateUserHandler,
  scimUpdateUserHandler,
  scimPatchUserHandler,
  scimDeleteUserHandler,
  scimConfigHandler,
  adminCreateScimTokenHandler,
  adminListScimTokensHandler,
  adminRevokeScimTokenHandler,
} from "./scim.controller";

import {
  createSsoProviderSchema,
  updateSsoProviderSchema,
  initiateBreakGlassSchema,
  validateBreakGlassSchema,
  reviewBreakGlassSchema,
  createScimTokenSchema,
} from "./auth.validator";

// Public SSO Handlers
router.get("/sso/providers", listPublicProvidersHandler);
router.get("/sso/:slug/login", oidcLoginHandler);
router.get("/sso/:slug/callback", oidcCallbackHandler);
router.post("/sso/:slug/callback", oidcCallbackHandler);
router.get("/sso/:slug/saml/metadata", samlMetadataHandler);
router.get("/sso/:slug/saml/login", samlLoginHandler);
router.post("/sso/:slug/saml/acs", samlAcsHandler);

// Admin SSO Provider Management
router.get(
  "/admin/sso/providers",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  adminListProvidersHandler
);
router.post(
  "/admin/sso/providers",
  authenticate,
  requireRoles("SUPER_ADMIN"),
  validate({ body: createSsoProviderSchema }),
  adminCreateProviderHandler
);
router.put(
  "/admin/sso/providers/:id",
  authenticate,
  requireRoles("SUPER_ADMIN"),
  validate({ params: userIdParamSchema, body: updateSsoProviderSchema }),
  adminUpdateProviderHandler
);
router.delete(
  "/admin/sso/providers/:id",
  authenticate,
  requireRoles("SUPER_ADMIN"),
  validate({ params: userIdParamSchema }),
  adminDeleteProviderHandler
);

// ─── Phase 4: Clinical Break-Glass Emergency Access ───────────────────────────

router.post(
  "/break-glass/initiate",
  authenticate,
  validate({ body: initiateBreakGlassSchema }),
  initiateBreakGlassHandler
);
router.post(
  "/break-glass/validate",
  validate({ body: validateBreakGlassSchema }),
  validateBreakGlassHandler
);
router.post(
  "/break-glass/review/:id",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN", "AUDITOR"),
  validate({ params: userIdParamSchema, body: reviewBreakGlassSchema }),
  reviewBreakGlassHandler
);
router.post(
  "/break-glass/revoke/:id",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate({ params: userIdParamSchema }),
  revokeBreakGlassHandler
);
router.get(
  "/break-glass/active",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN", "AUDITOR"),
  listActiveBreakGlassHandler
);
router.get(
  "/break-glass/history",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN", "AUDITOR"),
  listBreakGlassHistoryHandler
);

// ─── Phase 4: SCIM 2.0 Directory Sync Protocol ────────────────────────────────

router.get("/scim/v2/Users", authenticateScim, scimListUsersHandler);
router.get("/scim/v2/Users/:id", authenticateScim, scimGetUserHandler);
router.post("/scim/v2/Users", authenticateScim, scimCreateUserHandler);
router.put("/scim/v2/Users/:id", authenticateScim, scimUpdateUserHandler);
router.patch("/scim/v2/Users/:id", authenticateScim, scimPatchUserHandler);
router.delete("/scim/v2/Users/:id", authenticateScim, scimDeleteUserHandler);
router.get("/scim/v2/ServiceProviderConfig", scimConfigHandler);

// Admin SCIM Token Management
router.post(
  "/admin/scim/tokens",
  authenticate,
  requireRoles("SUPER_ADMIN"),
  validate({ body: createScimTokenSchema }),
  adminCreateScimTokenHandler
);
router.get(
  "/admin/scim/tokens",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  adminListScimTokensHandler
);
router.delete(
  "/admin/scim/tokens/:id",
  authenticate,
  requireRoles("SUPER_ADMIN"),
  validate({ params: userIdParamSchema }),
  adminRevokeScimTokenHandler
);

// ─── Phase 5: Digital Signatures (FDA 21 CFR Part 11) ─────────────────────────

import {
  createSignatureHandler,
  verifySignatureHandler,
  listResourceSignaturesHandler,
} from "./digital-signature.controller";

import {
  oauthTokenHandler,
  createApiClientHandler,
  listApiClientsHandler,
  rotateClientSecretHandler,
  deleteApiClientHandler,
} from "./m2m-gateway.controller";

import {
  exportCefHandler,
  exportSyslogHandler,
  listThreatAlertsHandler,
  mitigateThreatHandler,
} from "./siem-telemetry.controller";

import {
  createDigitalSignatureSchema,
  verifyDigitalSignatureSchema,
  createApiClientSchema,
  mitigateThreatSchema,
} from "./auth.validator";

// Digital Signatures
router.post(
  "/signatures/sign",
  authenticate,
  validate({ body: createDigitalSignatureSchema }),
  createSignatureHandler
);
router.post(
  "/signatures/verify/:id",
  validate({ params: userIdParamSchema, body: verifyDigitalSignatureSchema }),
  verifySignatureHandler
);
router.get(
  "/signatures/resource/:type/:id",
  authenticate,
  listResourceSignaturesHandler
);

// OAuth2 M2M Gateway Token Endpoint
router.post("/oauth/v2/token", oauthTokenHandler);

// Admin M2M Client Management
router.post(
  "/admin/m2m/clients",
  authenticate,
  requireRoles("SUPER_ADMIN"),
  validate({ body: createApiClientSchema }),
  createApiClientHandler
);
router.get(
  "/admin/m2m/clients",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  listApiClientsHandler
);
router.post(
  "/admin/m2m/clients/:clientId/rotate",
  authenticate,
  requireRoles("SUPER_ADMIN"),
  rotateClientSecretHandler
);
router.delete(
  "/admin/m2m/clients/:id",
  authenticate,
  requireRoles("SUPER_ADMIN"),
  validate({ params: userIdParamSchema }),
  deleteApiClientHandler
);

// SIEM & SOC Security Telemetry
router.get(
  "/admin/siem/cef",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN", "AUDITOR"),
  exportCefHandler
);
router.get(
  "/admin/siem/syslog",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN", "AUDITOR"),
  exportSyslogHandler
);
router.get(
  "/admin/siem/threats",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN", "AUDITOR"),
  listThreatAlertsHandler
);
router.post(
  "/admin/siem/threats/:id/mitigate",
  authenticate,
  requireRoles("SUPER_ADMIN"),
  validate({ params: userIdParamSchema, body: mitigateThreatSchema }),
  mitigateThreatHandler
);

export default router;


