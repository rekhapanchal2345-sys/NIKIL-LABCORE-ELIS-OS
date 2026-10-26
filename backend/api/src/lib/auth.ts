import "dotenv/config";
import jwt, {
  type SignOptions,
  type VerifyOptions,
} from "jsonwebtoken";
import crypto from "crypto";
import { HttpError } from "../utils/http-error";
import { generateJti } from "./token-blacklist";

export type UserRole =
  | "ADMIN"
  | "SUPER_ADMIN"
  | "BRANCH_ADMIN"
  | "FRONT_DESK"
  | "LAB_TECH"
  | "PATHOLOGIST"
  | "DOCTOR"
  | "ACCOUNTANT"
  | "AUDITOR";

export type AccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "LOCKED";

export interface AuthUser {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  branchId?: string | null;
}

export interface JwtPayload {
  sub: string;
  employeeCode: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  branchId?: string | null;
  sid?: string;           // Session ID
  jti?: string;           // JWT ID — used for blacklist-based revocation
  amr?: string[];         // Authentication Method References
  typ?: "access" | "mfa" | "mfa_setup" | "owner" | "step_up";
  /** Risk score at the time of issue (0–100). Logged but not re-enforced in middleware. */
  rsk?: number;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}

const VALID_ROLES: UserRole[] = [
  "ADMIN",
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "FRONT_DESK",
  "LAB_TECH",
  "PATHOLOGIST",
  "DOCTOR",
  "ACCOUNTANT",
  "AUDITOR",
];

const VALID_STATUSES: AccountStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "LOCKED",
];

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  if (secret.length < 32) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters."
    );
  }

  return secret;
};

const tokenIssuer = (): string => process.env.JWT_ISSUER ?? "labcore-api";

const tokenAudience = (): string => process.env.JWT_AUDIENCE ?? "labcore-web";

const signOptions = (): Pick<SignOptions, "issuer" | "audience"> => ({
  issuer: tokenIssuer(),
  audience: tokenAudience(),
});

const verifyOptions = (): VerifyOptions => ({
  issuer: tokenIssuer(),
  audience: tokenAudience(),
});

/** Short-lived access token; long-lived sessions are carried by the refresh token. */
export const accessTokenTtl = (): NonNullable<SignOptions["expiresIn"]> =>
  (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as NonNullable<
    SignOptions["expiresIn"]
  >;

export const sessionTtlMs = (): number =>
  Number(process.env.SESSION_TTL_DAYS || 7) * 24 * 60 * 60 * 1000;

export const generateAccessToken = (
  user: AuthUser,
  extras?: {
    sid?: string;
    amr?: string[];
    expiresIn?: SignOptions["expiresIn"];
    riskScore?: number;
  }
): string => {
  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    sub: user.id,
    jti: generateJti(),          // Unique ID — used for blacklist revocation
    employeeCode: user.employeeCode,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    branchId: user.branchId ?? null,
    sid: extras?.sid,
    amr: extras?.amr ?? ["pwd"],
    typ: "access",
    ...(extras?.riskScore !== undefined && { rsk: extras.riskScore }),
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: extras?.expiresIn ?? accessTokenTtl(),
    ...signOptions(),
  });
};

export const generateChallengeToken = (
  userId: string,
  typ: "mfa" | "mfa_setup"
): string => {
  return jwt.sign(
    { sub: userId, jti: generateJti(), typ },
    getJwtSecret(),
    {
      expiresIn: "10m",
      ...signOptions(),
    }
  );
};

/**
 * Step-up authentication token.
 *
 * Issued after a successful MFA step-up challenge for a sensitive operation
 * (e.g., bulk patient export, changing critical settings). It is short-lived
 * and bound to the current session and the specific operation scope.
 */
export const generateStepUpToken = (
  user: AuthUser,
  sessionId: string | undefined,
  scope: string   // e.g., "pii_export", "bulk_delete", "settings_change"
): string => {
  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    sub: user.id,
    jti: generateJti(),
    employeeCode: user.employeeCode,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    sid: sessionId,
    amr: ["pwd", "totp", "step_up"],
    typ: "step_up",
  };

  return jwt.sign(
    { ...payload, scope },
    getJwtSecret(),
    { expiresIn: "5m", ...signOptions() }
  );
};

/** Verifies a step-up token and returns payload if valid. */
export const verifyStepUpToken = (
  token: string,
  userId: string,
  sessionId: string | undefined,
  expectedScope?: string
): JwtPayload & { scope?: string } => {
  let decoded: jwt.JwtPayload | string;
  try {
    decoded = jwt.verify(token, getJwtSecret(), verifyOptions());
  } catch {
    throw new HttpError(
      "Step-up confirmation expired. Please re-authenticate.",
      401,
      "STEP_UP_EXPIRED"
    );
  }

  if (typeof decoded !== "object" || decoded === null) {
    throw new HttpError("Invalid step-up token.", 401, "STEP_UP_INVALID");
  }

  const p = decoded as Partial<JwtPayload> & { scope?: string };
  if (p.typ !== "step_up") throw new HttpError("Invalid step-up token.", 401, "STEP_UP_INVALID");
  if (p.sub !== userId) throw new HttpError("Step-up token belongs to different account.", 401, "STEP_UP_INVALID");
  if (sessionId && p.sid && p.sid !== sessionId) throw new HttpError("Step-up token is not valid for this session.", 401, "STEP_UP_INVALID");
  if (expectedScope && p.scope !== expectedScope) throw new HttpError(`Step-up token is not valid for scope '${expectedScope}'.`, 401, "STEP_UP_WRONG_SCOPE");

  return p as JwtPayload & { scope?: string };
};

/**
 * Owner re-authentication token.
 *
 * Privileged browser actions (registering staff, acting on a user's behalf)
 * require the operator to re-enter their own password. This token is the
 * server-side proof of that step: it is issued only after a successful password
 * check, is short-lived, and is bound to the session that requested it, so it
 * cannot be minted by anything running in the page.
 */
export const ownerTokenTtl = (): NonNullable<SignOptions["expiresIn"]> =>
  (process.env.OWNER_TOKEN_EXPIRES_IN || "5m") as NonNullable<
    SignOptions["expiresIn"]
  >;

export const generateOwnerToken = (
  user: AuthUser,
  sessionId?: string
): string => {
  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    sub: user.id,
    jti: generateJti(),
    employeeCode: user.employeeCode,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    sid: sessionId,
    amr: ["pwd", "owner"],
    typ: "owner",
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: ownerTokenTtl(),
    ...signOptions(),
  });
};

/**
 * Extracts the expiry timestamp (ms) from a raw JWT without verifying it.
 * Used to set the correct TTL when adding a token to the blacklist.
 * The token has already been verified by this point.
 */
export const getTokenExpiryMs = (token: string): number => {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (decoded?.exp) return decoded.exp * 1000;
  } catch {
    // ignore
  }
  // Fallback: 15 min from now (conservative)
  return Date.now() + 15 * 60 * 1000;
};

/** Throws unless the token is a live owner token belonging to this user and session. */
export const verifyOwnerToken = (
  token: string,
  userId: string,
  sessionId?: string
): JwtPayload => {
  let decoded: jwt.JwtPayload | string;

  try {
    decoded = jwt.verify(token, getJwtSecret(), verifyOptions());
  } catch {
    throw new HttpError(
      "Owner confirmation expired. Please enter your password again.",
      401,
      "OWNER_TOKEN_INVALID"
    );
  }

  if (typeof decoded !== "object" || decoded === null) {
    throw new HttpError("Invalid owner confirmation.", 401, "OWNER_TOKEN_INVALID");
  }

  const payload = decoded as Partial<JwtPayload>;

  if (payload.typ !== "owner") {
    throw new HttpError(
      "Invalid owner confirmation.",
      401,
      "OWNER_TOKEN_INVALID"
    );
  }

  if (payload.sub !== userId) {
    throw new HttpError(
      "This confirmation belongs to a different account.",
      401,
      "OWNER_TOKEN_INVALID"
    );
  }

  // Binding to the live session means a stolen token is useless once the
  // operator signs out, and cannot be replayed from another device.
  if (sessionId && payload.sid && payload.sid !== sessionId) {
    throw new HttpError(
      "This confirmation is no longer valid for the current session.",
      401,
      "OWNER_TOKEN_INVALID"
    );
  }

  return {
    sub: payload.sub!,
    employeeCode: String(payload.employeeCode || ""),
    email: String(payload.email || ""),
    fullName: String(payload.fullName || ""),
    role: (payload.role as UserRole) || "ADMIN",
    status: (payload.status as AccountStatus) || "ACTIVE",
    sid: payload.sid,
    amr: payload.amr,
    typ: payload.typ,
  };
};

export const verifyAccessToken = (
  token: string
): JwtPayload => {
  if (!token) {
    throw new HttpError("Access token is required.", 401, "TOKEN_MISSING");
  }

  let decoded: jwt.JwtPayload | string;

  try {
    decoded = jwt.verify(token, getJwtSecret(), verifyOptions());
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new HttpError("Access token has expired.", 401, "TOKEN_EXPIRED");
    }
    throw new HttpError("Invalid access token.", 401, "TOKEN_INVALID");
  }

  if (typeof decoded !== "object" || decoded === null) {
    throw new HttpError("Invalid access token.", 401, "TOKEN_INVALID");
  }

  const payload = decoded as Partial<JwtPayload> & { id?: string };

  const sub =
    typeof payload.sub === "string"
      ? payload.sub
      : typeof payload.id === "string"
        ? payload.id
        : null;

  if (!sub) {
    throw new HttpError("Invalid access token payload.", 401, "TOKEN_INVALID");
  }

  const role = (payload.role as UserRole) || "FRONT_DESK";
  const status = (payload.status as AccountStatus) || "ACTIVE";

  if (payload.role && !VALID_ROLES.includes(payload.role as UserRole)) {
    throw new HttpError("Invalid user role in token.", 401, "TOKEN_INVALID");
  }

  if (payload.status && !VALID_STATUSES.includes(payload.status as AccountStatus)) {
    throw new HttpError("Invalid account status in token.", 401, "TOKEN_INVALID");
  }

  return {
    sub,
    employeeCode: String(payload.employeeCode || ""),
    email: String(payload.email || ""),
    fullName: String(payload.fullName || ""),
    role: VALID_ROLES.includes(role) ? role : "FRONT_DESK",
    status: VALID_STATUSES.includes(status) ? status : "ACTIVE",
    branchId: payload.branchId ?? null,
    sid: payload.sid,
    amr: payload.amr,
    typ: payload.typ,
  };
};

export const hashOpaqueToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const randomRefreshToken = (): string =>
  crypto.randomBytes(48).toString("hex");

export const extractBearerToken = (
  authorizationHeader?: string
): string | null => {
  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith("Bearer ")
  ) {
    return null;
  }

  const token = authorizationHeader.slice(7).trim();
  return token || null;
};
