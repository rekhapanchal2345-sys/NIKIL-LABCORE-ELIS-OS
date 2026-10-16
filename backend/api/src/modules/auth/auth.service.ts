import type { Request } from "express";
import crypto from "crypto";
import prisma from "../../../config/database";
import { hashPassword, comparePassword } from "../../utils/password";
import {
  accessTokenTtl,
  generateAccessToken,
  generateChallengeToken,
  generateOwnerToken,
  getTokenExpiryMs,
  hashOpaqueToken,
  randomRefreshToken,
  sessionTtlMs,
  verifyAccessToken,
  verifyOwnerToken,
  type AuthUser,
  type JwtPayload,
  type UserRole,
} from "../../lib/auth";
import {
  idleTimeoutMinutesForRole,
  maxConcurrentSessions,
  mfaRequiredForRole,
} from "../../lib/permissions";
import { HttpError } from "../../utils/http-error";
import { createAuditLog } from "../audit/audit.service";
import {
  assertStrongPassword,
  assertNotCommonPassword,
  assertNoPersonalInfo,
  assertNotPwned,
  assertSufficientEntropy,
  isPasswordExpired,
  passwordPolicy,
} from "../../utils/password-policy";
import { decryptField, encryptField } from "../../utils/field-crypto";
import {
  generateTotpSecret,
  totpOtpauthUrl,
  verifyTotp,
} from "../../utils/totp";
import { verifyTotpWithReplayGuard } from "../../lib/totp-guard";
import {
  consumeBackupCode,
  generateEnterpriseBackupCodes,
  normalizeBackupCode,
} from "./mfa-backup.service";
import {
  registerTrustedDevice,
  verifyDeviceTrust,
} from "./device-trust.service";
import { getClientIp, getDeviceFingerprint } from "../../utils/request-meta";
import { emailBlindIndex, normaliseEmail } from "../../utils/gmail";
import { recordLoginAlert } from "./login-alert.service";
import {
  blacklistToken,
  revokeAllUserTokens,
  clearUserRevoke,
} from "../../lib/token-blacklist";
import {
  assessRisk,
  buildDeviceSignals,
  detectImpossibleTravel,
  isHighPrivilegeRole,
  isUnusualHour,
  type RiskAction,
} from "../../lib/risk-engine";

const LOCKOUT_ATTEMPTS = Number(process.env.LOGIN_LOCKOUT_ATTEMPTS || 5);
const LOCKOUT_MINUTES = Number(process.env.LOGIN_LOCKOUT_MINUTES || 15);

/** Same message for unknown user and wrong password, so accounts cannot be enumerated. */
const INVALID_CREDENTIALS = "Invalid email, employee code or password";

/** Compared against so an unknown account costs the same time as a wrong password. */
let dummyHashPromise: Promise<string> | null = null;
const getDummyHash = (): Promise<string> =>
  (dummyHashPromise ??= hashPassword(crypto.randomBytes(32).toString("hex")));

export type AuditPayload = Omit<Parameters<typeof createAuditLog>[0], "module">;

export const logAudit = (payload: AuditPayload) =>
  createAuditLog({ ...payload, module: "AUTH" }).catch((error) =>
    console.error("Audit log failed for auth module:", error)
  );

type PublicUser = {
  id: string;
  employeeCode: string;
  fullName: string;
  name: string;
  email: string;
  role: UserRole;
  mfaEnabled: boolean;
  passwordExpired: boolean;
};

function toAuthUser(user: {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: AuthUser["status"];
}): AuthUser {
  return {
    id: user.id,
    employeeCode: user.employeeCode,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
  };
}

function toPublicUser(user: {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  role: UserRole;
  mfaEnabled: boolean;
  passwordChangedAt?: Date | null;
}): PublicUser {
  return {
    id: user.id,
    employeeCode: user.employeeCode,
    fullName: user.fullName,
    name: user.fullName,
    email: user.email,
    role: user.role,
    mfaEnabled: user.mfaEnabled,
    passwordExpired: user.passwordChangedAt ? isPasswordExpired(user.passwordChangedAt) : false,
  };
}

function backupCodes(): string[] {
  return Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString("hex")
  );
}

export const registerUser = async (data: {
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
}) => {
  assertStrongPassword(data.password);
  assertNotCommonPassword(data.password);
  assertNoPersonalInfo(data.password, data.email, data.fullName);
  assertSufficientEntropy(data.password);
  // HIBP check — async, fails open on network error
  await assertNotPwned(data.password);

  // Gmail variants of one mailbox collapse to a single stored address, so a
  // person cannot hold two staff accounts for the same inbox.
  const canonicalEmail = normaliseEmail(data.email);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: canonicalEmail }, { employeeCode: data.employeeCode }],
    },
  });

  if (existingUser) {
    throw new HttpError(
      "User with this email or employee code already exists",
      409
    );
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      employeeCode: data.employeeCode,
      fullName: data.fullName,
      email: canonicalEmail,
      phone: data.phone,
      passwordHash,
      role: data.role,
      passwordChangedAt: new Date(),
      emailBlindIndex: emailBlindIndex(canonicalEmail),
    },
  });

  await prisma.passwordHistory.create({
    data: { userId: user.id, passwordHash },
  });

  await logAudit({
    action: "USER_REGISTERED",
    recordId: user.id,
    newData: { email: user.email, role: user.role },
  });

  return {
    user: toPublicUser({
      ...user,
      mfaEnabled: false,
      passwordChangedAt: new Date(),
    }),
  };
};

async function registerFailedLogin(
  userId: string,
  req: Request,
  customMessage?: string
): Promise<never> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: { increment: 1 } },
    select: { failedLoginCount: true },
  });

  await logAudit({
    action: "LOGIN_FAILED",
    recordId: userId,
    newData: { attempt: user.failedLoginCount, limit: LOCKOUT_ATTEMPTS },
  });

  // Halfway to the lockout threshold, tell the owner someone is guessing.
  // recordLoginAlert suppresses the email once this device is already known.
  if (
    user.failedLoginCount === Math.max(2, Math.ceil(LOCKOUT_ATTEMPTS / 2))
  ) {
    await recordLoginAlert({
      userId,
      type: "REPEATED_FAILED_SIGNIN",
      req,
    }).catch((error) =>
      console.error("Failed-login alert could not be recorded:", error)
    );
  }

  if (user.failedLoginCount >= LOCKOUT_ATTEMPTS) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "LOCKED",
        lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
        failedLoginCount: 0,
      },
    });

    await logAudit({
      action: "ACCOUNT_LOCKED",
      recordId: userId,
      newData: { lockMinutes: LOCKOUT_MINUTES },
    });

    throw new HttpError(
      `Account locked after ${LOCKOUT_ATTEMPTS} failed sign-in attempts. It unlocks automatically in ${LOCKOUT_MINUTES} minutes or an administrator can unlock it now.`,
      423,
      "ACCOUNT_LOCKED"
    );
  }

  const remaining = LOCKOUT_ATTEMPTS - user.failedLoginCount;

  throw new HttpError(
    remaining <= 2
      ? `${customMessage || INVALID_CREDENTIALS}. ${remaining} attempt${remaining === 1 ? "" : "s"} left before the account is locked.`
      : (customMessage || INVALID_CREDENTIALS),
    401,
    "INVALID_CREDENTIALS"
  );
}

export async function issueSession(
  user: AuthUser & {
    mfaEnabled: boolean;
    passwordChangedAt?: Date | null;
    fullName: string;
    email: string;
    employeeCode: string;
    role: UserRole;
  },
  req: Request,
  amr: string[],
  options?: {
    riskScore?: number;
    /** Skip risk-based alert for this session (used when MFA already triggered alert) */
    skipRiskAlert?: boolean;
  }
) {
  const refreshToken = randomRefreshToken();
  const refreshTokenHash = hashOpaqueToken(refreshToken);
  const idleMinutes = idleTimeoutMinutesForRole(user.role);
  const expiresAt = new Date(Date.now() + sessionTtlMs());
  const familyId = crypto.randomBytes(16).toString("hex"); // Refresh token rotation family

  const active = await prisma.userSession.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "asc" },
  });

  const overflow = active.length + 1 - maxConcurrentSessions();
  if (overflow > 0) {
    const toRevoke = active.slice(0, overflow);
    await prisma.userSession.updateMany({
      where: { id: { in: toRevoke.map((s) => s.id) } },
      data: { revokedAt: new Date(), revokeReason: "session_limit" },
    });
  }

  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      familyId,
      deviceFingerprint: getDeviceFingerprint(req),
      userAgent: String(req.headers["user-agent"] || "").slice(0, 500),
      ipAddress: getClientIp(req),
      expiresAt,
      riskScore: options?.riskScore ?? 0,
    },
  });

  const token = generateAccessToken(toAuthUser(user), {
    sid: session.id,
    amr,
    expiresIn: accessTokenTtl(),
    riskScore: options?.riskScore,
  });

  // Clear any blanket revoke that was set (e.g., on password change)
  await clearUserRevoke(user.id);

  await logAudit({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    recordId: session.id,
    newData: { amr, role: user.role, riskScore: options?.riskScore ?? 0 },
  });

  // The account owner is emailed when this device and network have not been
  // seen before. Recording the new values so the next sign-in stays quiet is
  // handled inside recordLoginAlert; a failure here must not deny the sign-in.
  await recordLoginAlert({
    userId: user.id,
    type: "NEW_DEVICE_SIGNIN",
    req,
  }).catch((error) =>
    console.error("Login alert could not be recorded:", error)
  );

  return {
    user: toPublicUser(user),
    token,
    accessToken: token,
    tokenType: "Bearer",
    refreshToken,
    sessionId: session.id,
    expiresAt,
    idleTimeoutMinutes: idleMinutes,
    riskScore: options?.riskScore ?? 0,
  };
}

export const loginUser = async (
  rawIdentifier: string,
  password: string,
  req: Request
) => {
  const identifier = String(rawIdentifier ?? "").trim();

  if (!identifier || !password) {
    throw new HttpError(
      "Email or employee code and password are required",
      400
    );
  }

  // Login accepts an email address or an employee code, in any letter case.
  // For Gmail the address is canonicalised first, so j.o.h.n+elis@gmail.com and
  // john@gmail.com both reach the same account.
  const canonicalEmail = normaliseEmail(identifier);
  const looksLikeEmail = canonicalEmail.includes("@");

  const user = await prisma.user.findFirst({
    where: {
      OR: looksLikeEmail
        ? [
            { email: canonicalEmail },
            // Fall back to a case-insensitive match so addresses stored before
            // normalisation (mixed case) are still reachable.
            { email: { equals: identifier, mode: "insensitive" } },
          ]
        : [{ employeeCode: { equals: identifier, mode: "insensitive" } }],
    },
  });

  if (!user) {
    // Spend the same bcrypt time as a real comparison to hide which accounts exist.
    await comparePassword(password, await getDummyHash());
    throw new HttpError(INVALID_CREDENTIALS, 401, "INVALID_CREDENTIALS");
  }

  if (user.status === "LOCKED") {
    if (user.lockedUntil && user.lockedUntil.getTime() < Date.now()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE", lockedUntil: null, failedLoginCount: 0 },
      });
    } else {
      const minutesLeft = user.lockedUntil
        ? Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000))
        : LOCKOUT_MINUTES;
      throw new HttpError(
        `Account is locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"} or contact an administrator.`,
        423,
        "ACCOUNT_LOCKED"
      );
    }
  }

  if (user.status !== "ACTIVE") {
    throw new HttpError(
      `Account is ${user.status.toLowerCase()}. Contact an administrator to activate it.`,
      403,
      "ACCOUNT_INACTIVE"
    );
  }

  const passwordValid = await comparePassword(password, user.passwordHash);

  if (!passwordValid) {
    await registerFailedLogin(user.id, req);
  }

  // Password is valid - reset failed login count if user had any
  if (user.failedLoginCount > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  // ─── Risk Assessment ──────────────────────────────────────────────────────
  const deviceSignals = buildDeviceSignals(req, user);
  const lastSession = await prisma.userSession.findFirst({
    where: { userId: user.id, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
  });

  // Enterprise Device Trust Check (Phase 2)
  const trustTokenHeader = req.headers["x-device-trust-token"] as string | undefined;
  const trustToken = trustTokenHeader || (req.body && typeof req.body.trustToken === "string" ? req.body.trustToken : undefined);
  const deviceTrust = await verifyDeviceTrust(user.id, trustToken, req);

  const riskAssessment = assessRisk({
    ...deviceSignals,
    unusualHour:      isUnusualHour(),
    failedAttempts:   user.failedLoginCount,
    isHighPrivRole:   isHighPrivilegeRole(user.role as UserRole),
    mfaVerified:      false, // not yet — updated after MFA if needed
    trustedDevice:    deviceTrust.isTrusted,
    recentLockout:    !!(user.lockedUntil && Date.now() - user.lockedUntil.getTime() < 24 * 60 * 60 * 1000),
    impossibleTravel: detectImpossibleTravel(
      getClientIp(req),
      lastSession?.ipAddress,
      lastSession?.lastSeenAt
    ),
  });

  // BLOCK: very high risk — refuse the login entirely
  if (riskAssessment.action === "BLOCK") {
    await logAudit({
      userId: user.id,
      action: "LOGIN_BLOCKED_HIGH_RISK",
      recordId: user.id,
      newData: { riskScore: riskAssessment.score, reasons: riskAssessment.reasons },
      ipAddress: getClientIp(req),
    });
    throw new HttpError(
      "Sign-in was blocked due to suspicious activity. Contact your administrator.",
      403,
      "LOGIN_RISK_BLOCKED"
    );
  }

  // STEP_UP or ALERT with no MFA enabled — still require MFA setup
  const needsMfa = mfaRequiredForRole(user.role) || user.mfaEnabled;

  if (needsMfa && user.mfaEnabled) {
    return {
      requiresMfa: true,
      mfaToken: generateChallengeToken(user.id, "mfa"),
      user: { id: user.id, email: user.email, fullName: user.fullName },
      riskLevel: riskAssessment.level,
    };
  }

  if (needsMfa && !user.mfaEnabled) {
    const secret = generateTotpSecret();
    await prisma.user.update({
      where: { id: user.id },
      data: { totpPendingEnc: encryptField(secret) },
    });

    return {
      requiresMfaSetup: true,
      mfaToken: generateChallengeToken(user.id, "mfa_setup"),
      otpauthUrl: totpOtpauthUrl(secret, user.email),
      user: { id: user.id, email: user.email, fullName: user.fullName },
      riskLevel: riskAssessment.level,
    };
  }

  // STEP_UP without MFA: if risk demands step-up but user has no MFA, alert admin
  if (riskAssessment.action === "STEP_UP" || riskAssessment.action === "ALERT") {
    await logAudit({
      userId: user.id,
      action: "LOGIN_RISK_ELEVATED",
      recordId: user.id,
      newData: { riskScore: riskAssessment.score, reasons: riskAssessment.reasons, action: riskAssessment.action },
      ipAddress: getClientIp(req),
    });
  }

  return issueSession(user, req, ["pwd"], { riskScore: riskAssessment.score });
};

export const verifyMfaLogin = async (
  mfaToken: string,
  code: string,
  req: Request,
  options?: {
    trustDevice?: boolean;
    deviceName?: string;
  }
) => {
  let payload: JwtPayload;
  try {
    payload = verifyAccessToken(mfaToken);
  } catch {
    throw new HttpError(
      "MFA challenge is invalid or expired. Please sign in again.",
      401,
      "MFA_CHALLENGE_EXPIRED"
    );
  }

  if (payload.typ !== "mfa" && payload.typ !== "mfa_setup") {
    throw new HttpError("Invalid MFA challenge", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== "ACTIVE") {
    throw new HttpError("User not found or inactive", 401);
  }

  const now = new Date();

  if (payload.typ === "mfa_setup") {
    if (!user.totpPendingEnc) {
      throw new HttpError("MFA setup is not in progress", 400);
    }

    const secret = decryptField(user.totpPendingEnc);
    const totpVerification = verifyTotpWithReplayGuard(user.id, secret, code);
    if (!totpVerification.valid) {
      return registerFailedLogin(
        user.id,
        req,
        totpVerification.errorReason || "Invalid authenticator code"
      );
    }

    const codes = generateEnterpriseBackupCodes();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          mfaEnabled: true,
          totpSecretEnc: encryptField(secret),
          totpPendingEnc: null,
          lastMfaAt: now,
        },
      }),
      prisma.mfaBackupCode.deleteMany({ where: { userId: user.id } }),
      ...codes.map((plain) =>
        prisma.mfaBackupCode.create({
          data: {
            userId: user.id,
            codeHash: hashOpaqueToken(normalizeBackupCode(plain)),
          },
        })
      ),
    ]);

    const session = await issueSession({ ...user, mfaEnabled: true }, req, [
      "pwd",
      "totp",
    ]);

    let trustInfo: { trustToken?: string; deviceName?: string } = {};
    if (options?.trustDevice) {
      const trusted = await registerTrustedDevice(user.id, req, options.deviceName);
      trustInfo = { trustToken: trusted.trustToken, deviceName: trusted.deviceName };
    }

    return { ...session, backupCodes: codes, ...trustInfo };
  }

  if (!user.totpSecretEnc) {
    throw new HttpError(
      "MFA is not configured for this account. Contact an administrator.",
      400
    );
  }

  const secret = decryptField(user.totpSecretEnc);
  const totpVerification = verifyTotpWithReplayGuard(user.id, secret, code);
  let passedWith: "totp" | "backup" | null = null;
  let warnLowBackupCodes = false;
  let remainingBackupCodes: number | undefined;

  if (totpVerification.valid) {
    passedWith = "totp";
  } else {
    // Try backup code
    const backupResult = await consumeBackupCode(user.id, code, req);
    if (backupResult.ok) {
      passedWith = "backup";
      warnLowBackupCodes = backupResult.warnLowCodes;
      remainingBackupCodes = backupResult.remaining;
    } else {
      return registerFailedLogin(
        user.id,
        req,
        totpVerification.errorReason || "Invalid authenticator or backup code"
      );
    }
  }

  // Update lastMfaAt timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastMfaAt: now },
  });

  const session = await issueSession(user, req, ["pwd", passedWith]);

  let trustInfo: { trustToken?: string; deviceName?: string; trustedUntil?: Date } = {};
  if (options?.trustDevice) {
    const trusted = await registerTrustedDevice(user.id, req, options.deviceName);
    trustInfo = {
      trustToken: trusted.trustToken,
      deviceName: trusted.deviceName,
      trustedUntil: trusted.trustedUntil,
    };
  }

  return {
    ...session,
    passedWith,
    warnLowBackupCodes,
    remainingBackupCodes,
    ...trustInfo,
  };
};

export const refreshSession = async (refreshToken: string, req: Request) => {
  const hash = hashOpaqueToken(refreshToken);
  const session = await prisma.userSession.findUnique({
    where: { refreshTokenHash: hash },
    include: { user: true },
  });

  // ─── Anti-Replay: Detect Refresh Token Reuse ──────────────────────────────
  // If the token is already revoked, this might be a reuse attack.
  // Revoke the entire session family if reuse detected.
  if (session && session.revokedAt && session.familyId) {
    // Revoke ALL sessions in the same family (stolen token scenario)
    await prisma.userSession.updateMany({
      where: {
        familyId: session.familyId,
        revokedAt: null,
      },
      data: { revokedAt: new Date(), revokeReason: "refresh_token_reuse" },
    });

    await logAudit({
      userId: session.userId,
      action: "REFRESH_TOKEN_REUSE_DETECTED",
      recordId: session.id,
      newData: { familyId: session.familyId },
      ipAddress: getClientIp(req),
    });

    // Blanket-revoke all tokens for this user (force re-login everywhere)
    await revokeAllUserTokens(session.userId);

    // Alert the account owner
    await recordLoginAlert({
      userId: session.userId,
      type: "REPEATED_FAILED_SIGNIN",
      req,
      force: true,
      detail: "refresh_token_reuse_detected",
    }).catch(console.error);

    throw new HttpError(
      "A security anomaly was detected. All your sessions have been ended for your protection. Please sign in again.",
      401,
      "TOKEN_REUSE_DETECTED"
    );
  }

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new HttpError(
      "Your session has ended. Please sign in again.",
      401,
      "SESSION_EXPIRED"
    );
  }

  const user = session.user;
  if (user.status !== "ACTIVE") {
    throw new HttpError(
      `Account is ${user.status.toLowerCase()}. Please contact an administrator.`,
      401,
      "ACCOUNT_INACTIVE"
    );
  }

  const idleMs = idleTimeoutMinutesForRole(user.role) * 60 * 1000;
  if (Date.now() - session.lastSeenAt.getTime() > idleMs) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), revokeReason: "idle_timeout" },
    });
    throw new HttpError(
      "Session expired due to inactivity. Please sign in again.",
      401,
      "IDLE_TIMEOUT"
    );
  }

  const nextRefresh = randomRefreshToken();
  const lastSeenAt = new Date();

  // Rotate: revoke old token, issue new one in same family
  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashOpaqueToken(nextRefresh),
      lastSeenAt,
      ipAddress: getClientIp(req),
    },
  });

  const token = generateAccessToken(toAuthUser(user), {
    sid: session.id,
    expiresIn: accessTokenTtl(),
  });

  return {
    token,
    accessToken: token,
    tokenType: "Bearer",
    refreshToken: nextRefresh,
    sessionId: session.id,
    user: toPublicUser(user),
    lastSeenAt,
  };
};

export const logoutSession = async (
  sessionId: string,
  userId: string,
  accessToken?: string   // if provided, blacklist immediately
) => {
  await prisma.userSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: "logout" },
  });

  // Immediately invalidate the access token so it cannot be replayed
  // for the remaining 15 minutes of its TTL.
  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      if (payload.jti) {
        await blacklistToken(payload.jti, getTokenExpiryMs(accessToken));
      }
    } catch {
      // Token already expired or invalid — no need to blacklist
    }
  }

  await logAudit({
    userId,
    action: "LOGOUT",
    recordId: sessionId,
  });

  return { ok: true };
};

export const listUserSessions = async (userId: string) => {
  return prisma.userSession.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      lastSeenAt: true,
      createdAt: true,
      revokedAt: true,
      revokeReason: true,
    },
  });
};

export const revokeSessionById = async (
  sessionId: string,
  requestingUser: AuthUser
) => {
  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    throw new HttpError("Session not found", 404);
  }

  const isAdmin =
    requestingUser.role === "ADMIN" || requestingUser.role === "SUPER_ADMIN";

  if (!isAdmin && session.userId !== requestingUser.id) {
    throw new HttpError(
      "You do not have permission to revoke this session",
      403
    );
  }

  await prisma.userSession.update({
    where: { id: sessionId },
    data: {
      revokedAt: new Date(),
      revokeReason:
        isAdmin && session.userId !== requestingUser.id
          ? "admin_force_logout"
          : "user_revoked",
    },
  });

  await logAudit({
    userId: requestingUser.id,
    action: "SESSION_REVOKED",
    recordId: sessionId,
    newData: { targetUserId: session.userId, byAdmin: isAdmin },
  });

  return { ok: true };
};

export const revokeSessionAsAdmin = async (sessionId: string) => {
  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    throw new HttpError("Session not found", 404);
  }
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date(), revokeReason: "admin_force_logout" },
  });
  return { ok: true };
};

export const unlockUser = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError("User not found", 404);
  }
  await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE", lockedUntil: null, failedLoginCount: 0 },
  });
  return { ok: true };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  nextPassword: string,
  currentSessionId?: string
) => {
  assertStrongPassword(nextPassword);
  assertSufficientEntropy(nextPassword);
  // Resolve user first so we can check contextual password rules.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError("User not found", 404);
  }
  assertNotCommonPassword(nextPassword);
  assertNoPersonalInfo(nextPassword, user.email, user.fullName);
  // HIBP check on password change — async, fail-open
  await assertNotPwned(nextPassword);

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) {
    throw new HttpError("Current password is incorrect", 401);
  }

  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: passwordPolicy.historyCount,
  });

  for (const row of history) {
    if (await comparePassword(nextPassword, row.passwordHash)) {
      throw new HttpError(
        `You cannot reuse any of your last ${passwordPolicy.historyCount} passwords.`,
        400
      );
    }
  }

  const passwordHash = await hashPassword(nextPassword);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    }),
    prisma.passwordHistory.create({
      data: { userId, passwordHash },
    }),
    // The current session stays signed in; every other device is signed out.
    prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
      },
      data: { revokedAt: new Date(), revokeReason: "password_changed" },
    }),
  ]);

  // Blanket-revoke all JWTs for this user (in-memory blacklist)
  await revokeAllUserTokens(userId);

  await logAudit({
    userId,
    action: "PASSWORD_CHANGED",
    recordId: userId,
  });

  return { ok: true, otherSessionsRevoked: true };
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      specialization: true,
      mfaEnabled: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new HttpError("User not found", 404);
  }

  return {
    ...user,
    name: user.fullName,
    passwordExpired: user.passwordChangedAt ? isPasswordExpired(user.passwordChangedAt) : false,
    mfaRequired: mfaRequiredForRole(user.role),
  };
};

/**
 * OWNER RE-AUTHENTICATION
 *
 * Replaces the client-side "master key" that previously guarded the staff
 * registration panel. That key was hardcoded in the JavaScript bundle, so
 * anyone who loaded the page possessed it. Here the operator's own password is
 * verified against the database and exchanged for a short-lived token that only
 * the server can mint.
 */
export const verifyOwnerIdentity = async (
  userId: string,
  password: string,
  sessionId: string | undefined,
  req: Request
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      employeeCode: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      passwordHash: true,
      mfaEnabled: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    // Spend a bcrypt comparison so a missing account costs the same as a wrong
    // password and cannot be distinguished by timing.
    await comparePassword(password, await getDummyHash());
    throw new HttpError("Owner confirmation failed", 401, "OWNER_VERIFY_FAILED");
  }

  const valid = await comparePassword(password, user.passwordHash);

  if (!valid) {
    await logAudit({
      userId,
      action: "OWNER_VERIFY_FAILED",
      recordId: sessionId,
      ipAddress: getClientIp(req),
    });

    throw new HttpError(
      "Owner confirmation failed. Please check your password.",
      401,
      "OWNER_VERIFY_FAILED"
    );
  }

  const token = generateOwnerToken(toAuthUser(user), sessionId);

  await logAudit({
    userId,
    action: "OWNER_VERIFIED",
    recordId: sessionId,
    ipAddress: getClientIp(req),
  });

  return { ownerToken: token, verified: true };
};

/** Guards a privileged operation: the caller must hold a live owner token. */
export const assertOwnerToken = (
  ownerToken: string | undefined,
  userId: string,
  sessionId: string | undefined
) => {
  if (!ownerToken) {
    throw new HttpError(
      "Owner confirmation is required for this action.",
      401,
      "OWNER_TOKEN_REQUIRED"
    );
  }

  verifyOwnerToken(ownerToken, userId, sessionId);
  return true;
};
