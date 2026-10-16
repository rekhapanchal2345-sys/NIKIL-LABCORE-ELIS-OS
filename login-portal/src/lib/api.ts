// ============================================================
// API CLIENT — LabCore ELIS Security Portal
// ============================================================

import type { LoginResponse, Session, SecurityEvent } from "../types/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = (): string | null => localStorage.getItem("accessToken");

const headers = (withAuth = true): Record<string, string> => ({
  "Content-Type": "application/json",
  ...(withAuth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const defaultHeaders = headers(auth);
  const customHeaders = (options.headers as Record<string, string>) || {};
  const mergedHeaders: Record<string, string> = {
    ...defaultHeaders,
    ...customHeaders,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: mergedHeaders,
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || `HTTP error ${res.status}` };
  }

  if (!res.ok) {
    throw Object.assign(new Error(data.message || "Request failed"), {
      status: res.status,
      code: data.code,
      data,
    });
  }

  return data as T;
}

// ── AUTH ──────────────────────────────────────────────────────

export const authApi = {
  login: (identifier: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }, false),

  verifyMfa: (mfaToken: string, code: string) =>
    request<LoginResponse>("/auth/login/mfa", {
      method: "POST",
      body: JSON.stringify({ mfaToken, code }),
    }, false),

  refresh: (refreshToken: string) =>
    request<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }, false),

  logout: () =>
    request("/auth/logout", { method: "POST" }),

  profile: () =>
    request<{ success: boolean; data: { id: string; employeeCode: string; fullName: string; email: string; phone: string | null; role: string; status: string; mfaEnabled: boolean; passwordChangedAt: string | null; passwordExpired: boolean; mfaRequired: boolean; } }>("/auth/me"),

  forgotPassword: (email: string) =>
    request("/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    }, false),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    }, false),

  changePassword: (currentPassword: string, newPassword: string) =>
    request("/auth/password/change", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  sessions: () =>
    request<{ success: boolean; data: Session[] }>("/auth/sessions"),

  revokeSession: (sessionId: string) =>
    request(`/auth/sessions/${sessionId}`, { method: "DELETE" }),
};

// ── AUDIT ─────────────────────────────────────────────────────

export const auditApi = {
  getMyActivity: () =>
    request<{ success: boolean; data: SecurityEvent[] }>(
      "/audit/me?module=AUTH&limit=20"
    ),
};
