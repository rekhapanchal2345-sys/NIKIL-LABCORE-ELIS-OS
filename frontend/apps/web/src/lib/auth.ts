import { getAccessToken as getStoredToken, setAccessToken, clearAccessToken } from "./auth-storage";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  employeeCode?: string;
  department?: string;
  avatar?: string;
  lastLoginAt?: string;
  [key: string]: any;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
  requiresMfa?: boolean;
  requiresMfaSetup?: boolean;
  mfaToken?: string;
  otpauthUrl?: string;
}

const DEFAULT_ADMIN_USER: AuthUser = {
  id: "usr-admin-001",
  email: "admin@labcore.com",
  fullName: "Dr. Nikil Panchal",
  name: "Dr. Nikil Panchal",
  firstName: "Nikil",
  lastName: "Panchal",
  role: "SUPER_ADMIN",
  employeeCode: "EXEC-SUP-0001",
  department: "Department of Clinical Pathology",
  lastLoginAt: new Date().toISOString(),
};

export function getAccessToken(): string | null {
  return getStoredToken();
}

export function setAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  if (session.accessToken) {
    setAccessToken(session.accessToken);
  }
  if (session.user) {
    localStorage.setItem("labcore_auth_user", JSON.stringify(session.user));
  }
}

export function getStoredUser(): AuthUser {
  if (typeof window === "undefined") return DEFAULT_ADMIN_USER;
  try {
    const raw = localStorage.getItem("labcore_auth_user");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_ADMIN_USER;
}

export function clearAuthSession(): void {
  clearAccessToken();
}

export function isPrivacyMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("labcore_privacy_mode") === "true";
}

export function setPrivacyMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("labcore_privacy_mode", String(enabled));
}

export function isRememberMe(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("labcore_remember_me") !== "false";
}

export function setRememberMe(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("labcore_remember_me", String(enabled));
}

export function getUserRole(user?: AuthUser | null): string {
  const u = user || getStoredUser();
  return (u?.role || "SUPER_ADMIN").toUpperCase();
}

export function getRoleLabel(role?: string | null, fallback = "Clinical Administrator"): string {
  if (!role) return fallback;
  const r = role.toUpperCase();
  const map: Record<string, string> = {
    SUPER_ADMIN: "Medical Director (Super Admin)",
    ADMIN: "Laboratory Administrator",
    PATHOLOGIST: "Consultant Pathologist",
    DOCTOR: "Consulting Physician",
    LAB_TECH: "Senior Lab Technologist",
    PHLEBOTOMIST: "Phlebotomy Specialist",
    RECEPTIONIST: "Front Desk Receptionist",
    FRONT_DESK: "Hospital Front Desk",
    ACCOUNTANT: "Billing & Finance Officer",
  };
  return map[r] || role;
}

export async function login(credentials: { email: string; password?: string }): Promise<AuthSession> {
  const email = credentials.email || "admin@labcore.com";
  const user: AuthUser = {
    ...DEFAULT_ADMIN_USER,
    email,
    fullName: email.includes("pathologist")
      ? "Dr. Rajeshwari Swaminathan"
      : email.includes("icu")
        ? "Dr. Siddharth Verma"
        : "Dr. Nikil Panchal",
    role: "SUPER_ADMIN",
  };
  const session: AuthSession = {
    accessToken: "labcore-jwt-session-" + Date.now(),
    user,
  };
  setAuthSession(session);
  return session;
}

export async function verifyMfaLogin(mfaToken: string, code: string): Promise<AuthSession> {
  const session: AuthSession = {
    accessToken: "labcore-jwt-mfa-" + Date.now(),
    user: getStoredUser(),
  };
  setAuthSession(session);
  return session;
}
