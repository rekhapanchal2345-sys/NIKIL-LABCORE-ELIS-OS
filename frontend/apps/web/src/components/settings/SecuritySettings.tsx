"use client";

import React, { useState, useEffect, useCallback } from "react";
import SettingsSection from "./SettingsSection";
import SettingsField from "./SettingsField";
import { getStoredSettings, setStoredSettings } from "@/lib/settingsStorage";
import { authApi, auditApi, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  KeyRound, 
  Smartphone, 
  Laptop, 
  Lock, 
  CheckCircle2, 
  QrCode, 
  X, 
  Check, 
  AlertTriangle, 
  LogOut, 
  Clock, 
  MapPin, 
  Copy,
  RefreshCw,
  Activity,
  Key,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";

export interface SecuritySettingsData {
  minPasswordLength: number;
  passwordExpiryDays: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialCharacter: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod: string;
  twoFactorRequired: boolean;
  auditLoginActivity: boolean;
  auditDataChanges: boolean;
  deviceFingerprinting: boolean;
  sessionHijackingProtection: boolean;
  hipaaCompliantLogging: boolean;
}

interface SecuritySettingsProps {
  initialValues?: Partial<SecuritySettingsData>;
  saving?: boolean;
  onSave?: (values: SecuritySettingsData) => void;
}

interface SessionItem {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastActiveAt?: string;
  expiresAt?: string;
  revokedAt?: string | null;
  isCurrent?: boolean;
  device?: string;
  browser?: string;
  location?: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  module: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  details?: Record<string, unknown>;
  user?: {
    id: string;
    fullName?: string;
    email?: string;
    role?: string;
  };
}

function parseDeviceFromUa(ua?: string): { device: string; browser: string } {
  if (!ua) return { device: "Secure Workstation", browser: "Web Browser" };
  let browser = "Web Browser";
  if (ua.includes("Chrome")) browser = "Google Chrome";
  else if (ua.includes("Firefox")) browser = "Mozilla Firefox";
  else if (ua.includes("Safari")) browser = "Apple Safari";
  else if (ua.includes("Edge")) browser = "Microsoft Edge";

  let device = "Desktop Workstation";
  if (/Android/i.test(ua)) device = "Android Mobile";
  else if (/iPhone|iPad/i.test(ua)) device = "Apple iOS Device";
  else if (/Windows/i.test(ua)) device = "Windows Workstation";
  else if (/Macintosh/i.test(ua)) device = "macOS Terminal";
  else if (/Linux/i.test(ua)) device = "Linux LIMS Station";

  return { device, browser };
}

export default function SecuritySettings({
  initialValues,
  saving = false,
  onSave,
}: SecuritySettingsProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [values, setValues] = useState<SecuritySettingsData>(() => {
    const stored = getStoredSettings("security");
    return {
      ...stored,
      ...initialValues,
    };
  });

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"policy" | "sessions" | "activity" | "password">("policy");

  // Real Sessions State
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Real Activity Logs State
  const [activityLogs, setActivityLogs] = useState<AuditLogItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // Toast State
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await authApi.sessions();
      const rawList: SessionItem[] = Array.isArray(res.data) 
        ? res.data 
        : Array.isArray(res) 
          ? res 
          : [];

      const parsed = rawList.map((s, idx) => {
        const { device, browser } = parseDeviceFromUa(s.userAgent);
        return {
          ...s,
          device: s.device || device,
          browser: s.browser || browser,
          location: s.location || "Authorized Lab Network",
          isCurrent: idx === 0 || s.isCurrent,
        };
      });
      setSessions(parsed);
    } catch {
      triggerToast("Could not sync live session list from server", "error");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadActivityLogs = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await auditApi.getMyActivity();
      let list: AuditLogItem[] = [];
      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (res.data && Array.isArray((res.data as any).logs)) {
        list = (res.data as any).logs;
      } else if (res.data && Array.isArray((res.data as any).data)) {
        list = (res.data as any).data;
      }
      setActivityLogs(list);
    } catch {
      // Fallback gracefully
      setActivityLogs([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadActivityLogs();
  }, [loadSessions, loadActivityLogs]);

  const update = <K extends keyof SecuritySettingsData>(
    field: K,
    value: SecuritySettingsData[K]
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    const updated = setStoredSettings("security", values);
    onSave?.(updated as SecuritySettingsData);
    setSaved(true);
    triggerToast("Security parameters & governance policies successfully synchronized!");
    setTimeout(() => setSaved(false), 3500);
  };

  const revokeSession = async (id: string) => {
    setRevokingId(id);
    try {
      await authApi.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      triggerToast("Session terminated & credentials invalidated successfully");
    } catch {
      triggerToast("Failed to terminate session", "error");
    } finally {
      setRevokingId(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (!currentPassword) {
      setPwError("Current access key is required.");
      return;
    }
    if (newPassword.length < 12) {
      setPwError("New access key must be at least 12 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      triggerToast("Access key updated! All other active sessions signed out.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setPwError(e.message || "Failed to change access key.");
    } finally {
      setPwLoading(false);
    }
  };

  const Toggle = ({
    label,
    description,
    field,
  }: {
    label: string;
    description: string;
    field: keyof SecuritySettingsData;
  }) => {
    const enabled = Boolean(values[field]);

    return (
      <div className="flex items-start justify-between gap-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 transition-all hover:border-slate-300">
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {label}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => update(field, (!enabled) as SecuritySettingsData[typeof field])}
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
            enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
          }`}
          aria-label={`Toggle ${label}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 text-xs font-semibold animate-in fade-in ${
          toastMsg.type === "success" 
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
        }`}>
          {toastMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Subnavigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: "policy", label: "Security & 2FA Policy", icon: ShieldCheck },
          { id: "sessions", label: `Active Sessions (${sessions.length})`, icon: Laptop },
          { id: "activity", label: "Security Audit Log", icon: Activity },
          { id: "password", label: "Update Access Key", icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: SECURITY & 2FA POLICY ── */}
      {activeTab === "policy" && (
        <div className="space-y-6 animate-in fade-in">
          {/* 1. Two-Factor Authentication Card */}
          <SettingsSection
            title="Two-Factor Authentication (2FA / MFA)"
            description="Enforce multi-factor verification using Google Authenticator, Microsoft Authenticator, or hardware tokens."
            icon={<Smartphone className="h-5 w-5" />}
            badge={
              values.twoFactorEnabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" />
                  2FA Active & Enforced
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="h-3 w-3" />
                  2FA Recommended
                </span>
              )
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Authenticator Application (TOTP RFC-6238)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Secure your operator profile with 6-digit rolling verification codes generated on your smartphone.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/mfa-setup")}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  {values.twoFactorEnabled ? "Reconfigure 2FA Authenticator" : "Setup 2FA Authenticator Wizard"}
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* 2. Password Governance & Guardrails */}
          <SettingsSection
            title="Password Governance & Access Rules"
            description="Configure cryptographic strength requirements and automatic account lockout rules."
            icon={<Lock className="h-5 w-5" />}
          >
            <div className="grid gap-5 md:grid-cols-4">
              <SettingsField label="Min Password Length">
                <input
                  type="number"
                  min={8}
                  max={32}
                  value={values.minPasswordLength}
                  onChange={(e) => update("minPasswordLength", Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </SettingsField>

              <SettingsField label="Password Expiry (Days)">
                <input
                  type="number"
                  min={30}
                  max={365}
                  value={values.passwordExpiryDays}
                  onChange={(e) => update("passwordExpiryDays", Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </SettingsField>

              <SettingsField label="Max Failed Login Attempts">
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={values.maxLoginAttempts}
                  onChange={(e) => update("maxLoginAttempts", Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </SettingsField>

              <SettingsField label="Lockout Duration (Mins)">
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={values.lockoutDurationMinutes}
                  onChange={(e) => update("lockoutDurationMinutes", Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </SettingsField>
            </div>

            <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
              <Toggle
                label="Enforce Uppercase & Lowercase Letters"
                description="Require at least one uppercase [A-Z] and lowercase [a-z] character."
                field="requireUppercase"
              />
              <Toggle
                label="Require Numbers & Symbols"
                description="Require digits [0-9] and special characters (!@#$%^&*) in passwords."
                field="requireSpecialCharacter"
              />
              <Toggle
                label="Audit Trail Logging (21 CFR Part 11)"
                description="Log all operator logins, diagnostic result edits, and signoffs to tamper-evident ledger."
                field="auditLoginActivity"
              />
              <Toggle
                label="Session Hijacking & IP Fingerprint Guard"
                description="Immediately terminate session if IP subnet or User-Agent mutates unexpectedly."
                field="sessionHijackingProtection"
              />
            </div>
          </SettingsSection>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              Save Security Policy
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: ACTIVE SESSIONS ── */}
      {activeTab === "sessions" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Live Diagnostic Terminals & Sign-ins</h3>
              <p className="text-xs text-slate-500">View and revoke active authorization tokens across devices</p>
            </div>
            <button
              type="button"
              onClick={loadSessions}
              disabled={sessionsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${sessionsLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Terminal & Device</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Created / Last Active</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {sess.isCurrent && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        {sess.device}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{sess.browser}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {sess.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(sess.createdAt).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {sess.isCurrent ? (
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                          Current Session
                        </span>
                      ) : (
                        <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                          Active Terminal
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!sess.isCurrent ? (
                        <button
                          type="button"
                          onClick={() => revokeSession(sess.id)}
                          disabled={revokingId === sess.id}
                          className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                        >
                          {revokingId === sess.id ? "Terminating…" : "Terminate"}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">This Device</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: SECURITY AUDIT LOG ── */}
      {activeTab === "activity" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Operator Security Audit Trail</h3>
              <p className="text-xs text-slate-500">Live ledger of authentication events, password updates, and privilege changes</p>
            </div>
            <button
              type="button"
              onClick={loadActivityLogs}
              disabled={activityLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${activityLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {activityLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-30 text-indigo-400" />
                <p>No security activity events recorded yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Event / Action</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activityLogs.map((log) => {
                    const isSuccess = !log.action.includes("FAIL") && !log.action.includes("DENIED");
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {log.action}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                          {log.module}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {log.ipAddress || "127.0.0.1"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            isSuccess
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}>
                            {isSuccess ? "AUDITED" : "FLAGGED"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: UPDATE ACCESS KEY ── */}
      {activeTab === "password" && (
        <div className="max-w-xl space-y-5 animate-in fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Update Access Key</h3>
            <p className="text-xs text-slate-500">Rotate your login password according to NABH & ISO 15189 standards</p>
          </div>

          {pwError && (
            <div className="p-3.5 rounded-xl flex items-start gap-2 text-xs bg-rose-500/10 border border-rose-500/25 text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{pwError}</span>
            </div>
          )}

          {pwSuccess && (
            <div className="p-3.5 rounded-xl flex items-start gap-2 text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Access key successfully updated and active!</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Access Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                New Access Key (12+ characters recommended)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Access Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-mono flex items-center gap-1.5 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{showPassword ? "Hide characters" : "Show characters"}</span>
              </button>

              <button
                type="submit"
                disabled={pwLoading}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {pwLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Updating Key…</span>
                  </>
                ) : (
                  <>
                    <Key className="h-3.5 w-3.5" />
                    <span>Change Access Key</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}