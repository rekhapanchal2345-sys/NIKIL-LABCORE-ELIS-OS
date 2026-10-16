import { Request, Response, NextFunction } from "express";
import {
  changePassword,
  getProfile,
  listUserSessions,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
  revokeSessionById,
  unlockUser,
  verifyMfaLogin,
  verifyOwnerIdentity,
} from "./auth.service";
import {
  completePasswordReset,
  confirmEmailVerification,
  requestEmailVerification,
  requestPasswordReset,
} from "./password-reset.service";
import { computeSecurityScore } from "./security-score.service";
import { verifyStepUpCode } from "../../../middleware/step-up.middleware";
import { verifyAuditChain } from "../audit/audit-integrity.service";
import { getBlacklistStats } from "../../lib/token-blacklist";
import {
  getMfaStatus,
  initiateMfaSetup,
  confirmMfaSetup,
  disableMfa,
} from "./mfa.service";
import {
  regenerateBackupCodes,
  getBackupCodesStatus,
} from "./mfa-backup.service";
import {
  listTrustedDevices,
  revokeTrustedDevice,
  revokeAllTrustedDevices,
} from "./device-trust.service";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  listWebAuthnCredentials,
  deleteWebAuthnCredential,
} from "./webauthn.service";
import { issueSession } from "./auth.service";
import { successResponse, createdResponse } from "../../utils/response";
import { HttpError } from "../../utils/http-error";
import type { AuthenticatedRequest } from "../../../middleware/auth";

const bodyOf = (req: Request) =>
  ((req as any).validated?.body ?? req.body) as Record<string, any>;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await registerUser(bodyOf(req) as any);
    return createdResponse(res, result, "User registered successfully");
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { identifier, password } = bodyOf(req);
    const result = await loginUser(identifier, password, req);

    if ("accessToken" in result && result.accessToken) {
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 15 * 60 * 1000,
      });
    }
    if ("refreshToken" in result && result.refreshToken) {
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return successResponse(res, result, "Login successful");
  } catch (error) {
    next(error);
  }
};

export const verifyMfa = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mfaToken, code, trustDevice, deviceName } = bodyOf(req);
    const result = await verifyMfaLogin(mfaToken, code, req, { trustDevice, deviceName });

    if ("accessToken" in result && result.accessToken) {
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 15 * 60 * 1000,
      });
    }
    if ("refreshToken" in result && result.refreshToken) {
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    if ("trustToken" in result && result.trustToken) {
      res.cookie("deviceTrustToken", result.trustToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      res.setHeader("X-Device-Trust-Token", result.trustToken);
    }

    return successResponse(res, result, "MFA verified");
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = bodyOf(req).refreshToken || (req as any).cookies?.refreshToken;
    const result = await refreshSession(refreshToken, req);

    if ("accessToken" in result && result.accessToken) {
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 15 * 60 * 1000,
      });
    }

    return successResponse(res, result, "Session refreshed");
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new HttpError("Authentication required", 401);
    }

    // Extract the raw access token so we can blacklist it immediately.
    // This prevents replay attacks during the remaining 15-min TTL.
    const rawToken =
      req.headers.authorization?.replace(/^Bearer /i, "") ||
      (req as any).cookies?.accessToken;

    if (req.sid) {
      await logoutSession(req.sid, req.user.id, rawToken);
    }

    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/api/auth" });

    return successResponse(res, { ok: true }, "Logout successful");
  } catch (error) {
    next(error);
  }
};

export const sessions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await listUserSessions(req.user!.id);
    return successResponse(res, result, "Sessions fetched");
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new HttpError("Authentication required", 401);
    }
    const result = await revokeSessionById(String(req.params.id), req.user);
    return successResponse(res, result, "Session revoked");
  } catch (error) {
    next(error);
  }
};

export const unlock = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await unlockUser(String(req.params.id));
    return successResponse(res, result, "Account unlocked");
  } catch (error) {
    next(error);
  }
};

export const changePasswordHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = bodyOf(req);
    const result = await changePassword(
      req.user!.id,
      currentPassword,
      newPassword,
      req.sid
    );
    return successResponse(res, result, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

export const profile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await getProfile(req.user!.id);
    return successResponse(res, user, "Profile fetched successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Re-confirm the signed-in operator before a privileged action.
 * The password is checked against the database; nothing about it is trusted
 * from the client.
 */
export const verifyOwner = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password } = bodyOf(req);
    const result = await verifyOwnerIdentity(
      req.user!.id,
      String(password ?? ""),
      req.sid,
      req
    );
    return successResponse(res, result, "Owner confirmed");
  } catch (error) {
    next(error);
  }
};

/**
 * Public: request a Gmail password-reset code.
 * The response is the same whether or not the address has an account.
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = bodyOf(req);
    const result = await requestPasswordReset(String(email ?? ""), req);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, code, newPassword } = bodyOf(req);
    const result = await completePasswordReset({
      email: String(email ?? ""),
      code: String(code ?? ""),
      newPassword: String(newPassword ?? ""),
      req,
    });
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const verifyEmailRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = bodyOf(req);
    const result = await requestEmailVerification(String(email ?? ""), req);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const verifyEmailConfirm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, code } = bodyOf(req);
    const result = await confirmEmailVerification({
      email: String(email ?? ""),
      code:  String(code ?? ""),
      req,
    });
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

// ─── Enterprise Auth Handlers ───────────────────────────────────────────────

/**
 * GET /api/auth/security-score
 * Returns the signed-in user's security health score (A-F grade).
 */
export const securityScore = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const result = await computeSecurityScore(req.user.id);
    return successResponse(res, result, `Security score: ${result.grade} (${result.score}/100)`);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/step-up/verify
 * Verifies a TOTP code and issues a short-lived step-up token.
 * Required before sensitive operations like bulk export or PII access.
 */
export const verifyStepUp = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const { mfaCode, scope } = bodyOf(req);
    const result = await verifyStepUpCode({
      mfaCode: String(mfaCode ?? ""),
      scope:   String(scope ?? ""),
      userId:  req.user.id,
      sessionId: req.sid,
    });
    return successResponse(res, result, "Step-up verified. Use the token for your next request.");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/admin/audit/integrity
 * Admin-only: verifies the audit log hash chain for tampering.
 */
export const auditIntegrityCheck = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const fromDateStr = (req.query as any).from as string | undefined;
    const fromDate = fromDateStr ? new Date(fromDateStr) : undefined;
    const result = await verifyAuditChain({ fromDate });
    const message = result.ok
      ? `Audit chain intact. ${result.checked} rows verified.`
      : `⚠️ Audit chain BROKEN! ${result.broken} tampered row(s) detected out of ${result.checked}.`;
    return successResponse(res, result, message);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/admin/blacklist/stats
 * Super-admin only: returns token blacklist memory stats.
 */
export const blacklistHealthHandler = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = getBlacklistStats();
    return successResponse(res, stats, "Blacklist stats");
  } catch (error) {
    next(error);
  }
};

// ─── Phase 2: Advanced MFA & Device Trust Handlers ────────────────────────────

/**
 * GET /api/auth/mfa/status
 * Retrieves comprehensive MFA status for the authenticated user.
 */
export const mfaStatusHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const status = await getMfaStatus(req.user.id);
    return successResponse(res, status, "MFA status retrieved");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/mfa/setup
 * Initiates voluntary TOTP setup for the authenticated user.
 */
export const mfaSetupInitiateHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const setupData = await initiateMfaSetup(req.user.id, req);
    return successResponse(res, setupData, "MFA setup initiated. Scan the QR code with your authenticator app.");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/mfa/confirm
 * Confirms voluntary TOTP setup with code, activates MFA, and mints backup codes.
 */
export const mfaSetupConfirmHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const { code } = bodyOf(req);
    const result = await confirmMfaSetup(req.user.id, code, req);
    return successResponse(res, result, "MFA successfully activated! Save your backup codes in a secure place.");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/mfa/disable
 * Disables MFA (requires password confirmation + valid TOTP code).
 */
export const mfaDisableHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const { password, code } = bodyOf(req);
    const result = await disableMfa(req.user.id, password, code, req);
    return successResponse(res, result, "Two-factor authentication disabled.");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/mfa/backup-codes/regenerate
 * Regenerates backup recovery codes (replaces existing).
 */
export const backupCodesRegenerateHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const result = await regenerateBackupCodes(req.user.id, req);
    return successResponse(res, result, "New backup recovery codes generated. Store them securely.");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/mfa/backup-codes/status
 * Returns remaining count and usage summary for backup codes.
 */
export const backupCodesStatusHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const status = await getBackupCodesStatus(req.user.id);
    return successResponse(res, status, "Backup codes status");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/trusted-devices
 * Lists all active trusted devices for the authenticated user.
 */
export const trustedDevicesListHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const devices = await listTrustedDevices(req.user.id, req);
    return successResponse(res, devices, "Trusted devices listed");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/auth/trusted-devices/:id
 * Revokes a specific trusted device.
 */
export const trustedDeviceRevokeHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const deviceId = req.params.id as string;
    const result = await revokeTrustedDevice(req.user.id, deviceId, req);
    return successResponse(res, result, "Trusted device revoked");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/auth/trusted-devices
 * Revokes all trusted devices for the authenticated user.
 */
export const trustedDevicesRevokeAllHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const result = await revokeAllTrustedDevices(req.user.id, req);
    return successResponse(res, result, `Revoked ${result.revokedCount} trusted device(s)`);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/webauthn/register/options
 * Generates registration challenge for FIDO2 / WebAuthn passkey or security key.
 */
export const webauthnRegisterOptionsHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const options = await generateRegistrationOptions(req.user.id);
    return successResponse(res, options, "Registration challenge generated");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/webauthn/register/verify
 * Verifies and persists a new WebAuthn credential.
 */
export const webauthnRegisterVerifyHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const body = bodyOf(req);
    const result = await verifyRegistrationResponse(
      req.user.id,
      {
        credentialId: body.credentialId,
        clientDataJSON: body.clientDataJSON,
        publicKey: body.publicKey,
        deviceName: body.deviceName,
        transports: body.transports,
      },
      req
    );
    return successResponse(res, result, "Security key registered successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/webauthn/login/options
 * Generates authentication options for passkey sign-in.
 */
export const webauthnLoginOptionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.query.userId as string | undefined;
    const options = await generateAuthenticationOptions(userId);
    return successResponse(res, options, "Authentication challenge generated");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/webauthn/login/verify
 * Verifies WebAuthn assertion and logs in the user.
 */
export const webauthnLoginVerifyHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = bodyOf(req);
    const result = await verifyAuthenticationResponse(
      {
        credentialId: body.credentialId,
        clientDataJSON: body.clientDataJSON,
        authenticatorData: body.authenticatorData,
        signature: body.signature,
      },
      req
    );

    const session = await issueSession(
      {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        employeeCode: result.user.employeeCode,
        role: result.user.role as any,
        status: result.user.status as any,
        mfaEnabled: result.user.mfaEnabled,
        passwordChangedAt: result.user.passwordChangedAt,
      },
      req,
      ["webauthn", "fido2"]
    );

    if (session.accessToken) {
      res.cookie("accessToken", session.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 15 * 60 * 1000,
      });
    }
    if (session.refreshToken) {
      res.cookie("refreshToken", session.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return successResponse(res, session, "Signed in with security key / passkey");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/webauthn/credentials
 * Lists all registered WebAuthn keys for the user.
 */
export const webauthnListCredentialsHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const keys = await listWebAuthnCredentials(req.user.id);
    return successResponse(res, keys, "Security keys listed");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/auth/webauthn/credentials/:id
 * Removes a registered WebAuthn key.
 */
export const webauthnDeleteCredentialHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new HttpError("Authentication required", 401);
    const credentialId = req.params.id as string;
    const result = await deleteWebAuthnCredential(req.user.id, credentialId, req);
    return successResponse(res, result, "Security key removed");
  } catch (error) {
    next(error);
  }
};

