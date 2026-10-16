"use client";

import {
  authApi,
  ApiError,
} from "./api";

import {
  ACCESS_TOKEN_KEY,
  AUTH_KEY,
  PRIVACY_MODE_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  clearAuthEntries,
  eraseAuth,
  getAccessToken,
  getRefreshToken,
  isRememberMe,
  readAuth,
  setRememberMe,
  writeAuth,
} from "./auth-storage";

export {
  getAccessToken,
  getRefreshToken,
  isRememberMe,
  setRememberMe,
};

/* =======================================================
   TYPES
======================================================= */

export interface AuthUser {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;

  role?:
    | string
    | {
        id?: string;
        name?: string;
        code?: string;
      };

  avatar?: string | null;
  phone?: string | null;

  isActive?: boolean;
  
  // Additional fields from backend
  employeeCode?: string;
  fullName?: string;
  status?: string;

  [key: string]: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: AuthUser;
  /** Empty while a sign-in is paused for MFA; nothing is stored until it is filled. */
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  sessionId?: string;
  expiresAt?: string;
  idleTimeoutMinutes?: number;
  backupCodes?: string[];
  requiresMfa?: boolean;
  requiresMfaSetup?: boolean;
  mfaToken?: string;
  otpauthUrl?: string;
  passwordExpired?: boolean;
}

/* =======================================================
   ROLE LABEL
======================================================= */

export type AuthRole = AuthUser["role"];

export function getRoleLabel(
  role?: AuthRole,
  fallback = "User"
): string {
  if (!role) {
    return fallback;
  }

  if (typeof role === "string") {
    return role;
  }

  return role.name || role.code || fallback;
}

/* =======================================================
   TOKEN MANAGEMENT
======================================================= */

export function setAccessToken(
  token: string
): void {
  writeAuth(ACCESS_TOKEN_KEY, token);
}

export function setRefreshToken(
  token: string
): void {
  writeAuth(REFRESH_TOKEN_KEY, token);
}

export function removeTokens(): void {
  clearAuthEntries();
}

/* =======================================================
   USER MANAGEMENT
======================================================= */

export function getStoredUser(): AuthUser | null {
  const value = readAuth(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      value
    ) as AuthUser;
  } catch {
    eraseAuth(USER_KEY);
    return null;
  }
}

export function setStoredUser(
  user: AuthUser
): void {
  writeAuth(USER_KEY, JSON.stringify(user));
}

export function removeStoredUser(): void {
  eraseAuth(USER_KEY);
}

/* =======================================================
   PRIVACY SETTINGS
======================================================= */

export function isPrivacyMode(): boolean {
  return readAuth(PRIVACY_MODE_KEY) === "true";
}

export function setPrivacyMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRIVACY_MODE_KEY, String(enabled));
  } catch {
    /* storage disabled */
  }
}

/* =======================================================
   AUTH SESSION
======================================================= */

interface StoredAuth extends AuthSession {}

export function getAuthSession(): StoredAuth | null {
  const value = readAuth(AUTH_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      value
    ) as StoredAuth;
  } catch {
    eraseAuth(AUTH_KEY);
    return null;
  }
}

export function setAuthSession(
  session: AuthSession
): void {
  if (typeof window === "undefined") return;
  if (!session.accessToken) return;

  // Replace any previous sign-in so the two stores never hold two users.
  clearAuthEntries();

  writeAuth(AUTH_KEY, JSON.stringify(session));
  setAccessToken(session.accessToken);

  if (session.refreshToken) {
    setRefreshToken(session.refreshToken);
  }

  setStoredUser(session.user);

  try {
    window.dispatchEvent(new Event("auth-changed"));
  } catch {
    /* ignore in environments without Event constructor */
  }
}

export function clearAuthSession(): void {
  clearAuthEntries();
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new Event("auth-changed"));
    } catch {
      /* ignore */
    }
  }
}

/** Privacy mode: drop every trace of the login from the browser. */
export function clearSensitiveData(): void {
  clearAuthEntries();
}


/* =======================================================
   LOGIN RESPONSE NORMALIZER
======================================================= */

function extractLoginData(response: unknown): AuthSession | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const envelope = response as Record<string, unknown>;
  const data = (envelope.data ?? envelope) as Record<string, unknown>;
  const rawUser = data.user as AuthUser | undefined;

  if (!rawUser || typeof rawUser !== "object") {
    return null;
  }

  const user: AuthUser = {
    ...rawUser,
    id: String(rawUser.id ?? ""),
    name: rawUser.name || rawUser.fullName || "",
  };

  // Sign-in paused: the account needs an authenticator code.
  if (data.requiresMfa === true) {
    return {
      user,
      accessToken: "",
      requiresMfa: true,
      mfaToken: data.mfaToken as string | undefined,
    };
  }

  // Sign-in paused: the account must enrol an authenticator first.
  if (data.requiresMfaSetup === true) {
    return {
      user,
      accessToken: "",
      requiresMfaSetup: true,
      mfaToken: data.mfaToken as string | undefined,
      otpauthUrl: data.otpauthUrl as string | undefined,
    };
  }

  const accessToken = (data.accessToken ?? data.token) as string | undefined;
  if (!accessToken) {
    return null;
  }

  return {
    user,
    accessToken,
    refreshToken: data.refreshToken as string | undefined,
    tokenType: data.tokenType as string | undefined,
    sessionId: data.sessionId as string | undefined,
    expiresAt: data.expiresAt as string | undefined,
    idleTimeoutMinutes: data.idleTimeoutMinutes as number | undefined,
    passwordExpired: data.passwordExpired === true,
    backupCodes: data.backupCodes as string[] | undefined,
  };
}

/* =======================================================
   LOGIN
======================================================= */

export async function login(
  credentials: LoginCredentials
): Promise<AuthSession> {
  const response = await authApi.login(credentials);
  const session = extractLoginData(response);

  if (!session) {
    throw new Error(
      (response as { message?: string })?.message ||
        "Login failed. The server returned an unexpected response."
    );
  }

  // MFA is not a completed login: nothing is persisted until the code passes.
  if (session.requiresMfa || session.requiresMfaSetup) {
    return session;
  }

  setAuthSession(session);
  return session;
}

/** Finish a sign-in that stopped at the MFA step. */
export async function verifyMfaLogin(
  mfaToken: string,
  code: string
): Promise<AuthSession> {
  const response = await authApi.verifyMfa(mfaToken, code);
  const session = extractLoginData(response);

  if (!session || !session.accessToken) {
    throw new Error(
      (response as { message?: string })?.message ||
        "Verification failed. Please sign in again."
    );
  }

  setAuthSession(session);
  return session;
}

/* =======================================================
   REGISTER
======================================================= */

export interface RegisterData {
  employeeCode: string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

/** Creates a staff account. The backend only lets administrators call this. */
export async function register(
  data: RegisterData
): Promise<AuthUser | null> {
  const response = await authApi.register(data);

  const payload = (response as { data?: Record<string, unknown> })?.data ??
    (response as Record<string, unknown>);

  const user = (payload as { user?: AuthUser })?.user ?? null;

  // Staff creation is not a sign-in: the caller keeps their own session.
  return user;
}

/* =======================================================
   SESSION REFRESH
======================================================= */

/**
 * Exchange the rotating refresh token for a new access token.
 * Returns null when the session is truly over and the user must sign in again.
 */
export async function refreshAuthSession(): Promise<AuthSession | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthSession();
    return null;
  }

  try {
    const response = await authApi.refresh(refreshToken);
    const session = extractLoginData(response);

    if (!session?.accessToken) {
      clearAuthSession();
      return null;
    }

    setAuthSession(session);
    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

/* =======================================================
   CURRENT USER
======================================================= */

// useAuth() runs in several components per page; collapse their simultaneous
// profile checks into one request.
let profileRequest: Promise<AuthUser | null> | null = null;

export function getCurrentUser(): Promise<AuthUser | null> {
  if (!getAccessToken()) {
    return Promise.resolve(null);
  }

  if (!profileRequest) {
    profileRequest = fetchCurrentUser().finally(() => {
      profileRequest = null;
    });
  }

  return profileRequest;
}

async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await authApi.me();

    const payload = (response as { data?: unknown })?.data ?? response;
    const user =
      ((payload as { user?: AuthUser })?.user ?? (payload as AuthUser));

    if (user && typeof user === "object" && user.email) {
      setStoredUser(user);
      return user;
    }

    clearAuthSession();
    return null;
  } catch (error) {
    // Only a rejected credential ends the session; a server blip does not.
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession();
    }
    return null;
  }
}

/* =======================================================
   LOGOUT
======================================================= */

export async function logout(): Promise<void> {
  try {
    if (getAccessToken()) {
      await authApi.logout();
    }
  } catch {
    // The local session is cleared even if the server call fails.
  } finally {
    clearAuthSession();
  }
}

/* =======================================================
   AUTH CHECK
======================================================= */

export function isAuthenticated(): boolean {
  return Boolean(
    getAccessToken()
  );
}

/* =======================================================
   ROLE HELPERS
======================================================= */

export function getUserRole(
  user?: AuthUser | null
): string | null {
  const currentUser =
    user ?? getStoredUser();

  if (!currentUser) {
    return null;
  }

  if (
    typeof currentUser.role ===
    "string"
  ) {
    return currentUser.role;
  }

  if (
    currentUser.role &&
    typeof currentUser.role ===
      "object"
  ) {
    return (
      currentUser.role.name ??
      currentUser.role.code ??
      null
    );
  }

  // If role is not in expected format, try to get from backend user data
  if (currentUser.role && typeof currentUser.role === 'string') {
    return currentUser.role;
  }

  return null;
}

export function hasRole(
  role: string,
  user?: AuthUser | null
): boolean {
  const currentRole =
    getUserRole(user);

  if (!currentRole) {
    return false;
  }

  // Handle role mapping for compatibility
  const roleMap: Record<string, string[]> = {
    // SUPER_ADMIN is an elevated administrator and must inherit admin-only
    // routes even when an older session still contains the SUPER_ADMIN role.
    'ADMIN': ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin', 'Administrator'],
    'SUPER_ADMIN': ['SUPER_ADMIN', 'super_admin', 'ADMIN', 'admin', 'Administrator'],
    'FRONT_DESK': ['FRONT_DESK', 'front_desk', 'Front Desk', 'RECEPTIONIST', 'receptionist'],
    'LAB_TECH': ['LAB_TECH', 'lab_tech', 'Lab Technician', 'TECHNICIAN', 'technician'],
    'PATHOLOGIST': ['PATHOLOGIST', 'pathologist', 'Pathologist'],
    'DOCTOR': ['DOCTOR', 'doctor', 'Doctor', 'PHYSICIAN', 'physician'],
  };

  const allowedRoles = roleMap[role.toUpperCase()] || [role];
  
  return allowedRoles.some(allowedRole => 
    currentRole.toUpperCase() === allowedRole.toUpperCase()
  );
}

export function hasAnyRole(
  roles: string[],
  user?: AuthUser | null
): boolean {
  const currentRole =
    getUserRole(user);

  if (!currentRole) {
    return false;
  }

  return roles.some((role) => hasRole(role, user));
}

/* =======================================================
   COMMON LABCORE ROLES
======================================================= */

export function isAdmin(
  user?: AuthUser | null
): boolean {
  return hasAnyRole(
    [
      "admin",
      "administrator",
      "super_admin",
      "SUPER_ADMIN",
    ],
    user
  );
}

export function isDoctor(
  user?: AuthUser | null
): boolean {
  return hasAnyRole(
    [
      "doctor",
      "physician",
    ],
    user
  );
}

export function isLabTechnician(
  user?: AuthUser | null
): boolean {
  return hasAnyRole(
    [
      "lab_technician",
      "technician",
      "lab technician",
    ],
    user
  );
}

export function isReceptionist(
  user?: AuthUser | null
): boolean {
  return hasAnyRole(
    [
      "receptionist",
      "front_desk",
    ],
    user
  );
}

export function isPathologist(
  user?: AuthUser | null
): boolean {
  return hasAnyRole(
    [
      "pathologist",
    ],
    user
  );
}

/* =======================================================
   DISPLAY HELPERS
======================================================= */

export function getUserDisplayName(
  user?: AuthUser | null
): string {
  const currentUser =
    user ?? getStoredUser();

  if (!currentUser) {
    return "User";
  }

  if (currentUser.name) {
    return currentUser.name;
  }

  const fullName = [
    currentUser.firstName,
    currentUser.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    currentUser.email ||
    "User"
  );
}

export function getUserInitials(
  user?: AuthUser | null
): string {
  const name =
    getUserDisplayName(user);

  if (!name) {
    return "U";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

/* =======================================================
   AUTH HEADER
======================================================= */

export function getAuthHeader(): Record<
  string,
  string
> {
  const token =
    getAccessToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: "Bearer " + token,
  };
}

/* =======================================================
   EXPORT
======================================================= */

const auth = {
  login,
  register,
  logout,
  verifyMfaLogin,
  refreshAuthSession,

  getCurrentUser,

  isAuthenticated,

  getAccessToken,
  getRefreshToken,

  setAccessToken,
  setRefreshToken,

  getStoredUser,
  setStoredUser,

  getAuthSession,
  setAuthSession,

  clearAuthSession,

  getUserRole,
  hasRole,
  hasAnyRole,

  isAdmin,
  isDoctor,
  isLabTechnician,
  isReceptionist,
  isPathologist,

  getUserDisplayName,
  getUserInitials,

  getAuthHeader,

  // Privacy settings
  isPrivacyMode,
  setPrivacyMode,
  isRememberMe,
  setRememberMe,
  clearSensitiveData,
};

export default auth;
