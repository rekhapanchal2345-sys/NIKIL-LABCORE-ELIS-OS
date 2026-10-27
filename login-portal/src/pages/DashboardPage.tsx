// ============================================================
// SECURITY DASHBOARD — Sessions + Activity + Password Change
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, LogOut, Monitor, Smartphone, Globe, RefreshCw,
  Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2,
  Activity, Key, Clock, Wifi, XCircle, ChevronRight,
} from "lucide-react";
import { authApi, auditApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { analyzePassword, formatRelativeTime, parseUserAgent } from "../lib/utils";
import type { Session, SecurityEvent } from "../types/auth";

type Tab = "overview" | "sessions" | "password" | "activity";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [tab, setTab] = useState<Tab>("overview");

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // Activity
  const [activity, setActivity] = useState<SecurityEvent[]>([]);
  const [actLoading, setActLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const strength = analyzePassword(newPw);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await authApi.sessions();
      setSessions(res.data || []);
    } catch {
      showToast("Failed to load sessions", "error");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    setActLoading(true);
    try {
      const res = await auditApi.getMyActivity();
      setActivity(res.data || []);
    } catch {
      // Silently fail if audit endpoint not accessible
      setActivity([]);
    } finally {
      setActLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadSessions();
  }, []);

  useEffect(() => {
    if (tab === "sessions") loadSessions();
    if (tab === "activity") loadActivity();
  }, [tab]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate("/login");
  };

  const revokeSession = async (id: string) => {
    setRevokingId(id);
    try {
      await authApi.revokeSession(id);
      setSessions((s) => s.filter((x) => x.id !== id));
      showToast("Session revoked successfully");
    } catch {
      showToast("Failed to revoke session", "error");
    } finally {
      setRevokingId(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(""); setPwSuccess(false);
    if (!currentPw) { setPwError("Current password is required."); return; }
    if (newPw.length < 12) { setPwError("New password must be at least 12 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    if (strength.score < 2) { setPwError("New password is too weak."); return; }

    setPwLoading(true);
    try {
      await authApi.changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      showToast("Password changed! Other sessions signed out.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setPwError(e.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  const getDeviceIcon = (ua: string | null) => {
    if (!ua) return <Monitor size={18} />;
    if (/mobile|android|iphone/i.test(ua)) return <Smartphone size={18} />;
    return <Monitor size={18} />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("FAILED") || action.includes("LOCKED")) return "var(--danger)";
    if (action.includes("SUCCESS") || action.includes("VERIFIED")) return "var(--success)";
    if (action.includes("LOGOUT") || action.includes("REVOK")) return "var(--warning)";
    return "var(--info)";
  };

  const activeSessions = sessions.filter((s) => !s.revokedAt);
  const revokedSessions = sessions.filter((s) => s.revokedAt);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: "badge-danger",
    ADMIN: "badge-warning",
    PATHOLOGIST: "badge-info",
    LAB_TECH: "badge-info",
    FRONT_DESK: "badge-neutral",
    DOCTOR: "badge-info",
    ACCOUNTANT: "badge-neutral",
    AUDITOR: "badge-neutral",
    BRANCH_ADMIN: "badge-warning",
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",  label: "Overview",  icon: <Shield size={16} /> },
    { id: "sessions",  label: "Sessions",  icon: <Wifi size={16} /> },
    { id: "password",  label: "Password",  icon: <Key size={16} /> },
    { id: "activity",  label: "Activity",  icon: <Activity size={16} /> },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: "var(--brand-gradient)",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Shield size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Security Center</span>
          </div>

          <nav className="dashboard-nav" style={{ marginLeft: 16 }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`nav-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="profile-chip">
            <div className="avatar">{initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.fullName}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user?.role}</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="dashboard-content">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="fade-in">
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div className="avatar-lg">{initials}</div>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800 }}>{user?.fullName}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                    <span className={`security-badge ${ROLE_COLORS[user?.role || ""] || "badge-neutral"}`}>
                      {user?.role?.replace(/_/g, " ")}
                    </span>
                    <span className="security-badge badge-success">
                      <CheckCircle size={11} /> Active
                    </span>
                    {user?.mfaEnabled ? (
                      <span className="security-badge badge-info">
                        <Shield size={11} /> MFA On
                      </span>
                    ) : (
                      <span className="security-badge badge-warning">
                        <AlertCircle size={11} /> No MFA
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="metric-row">
              <div className="metric-card">
                <div className="metric-value">{activeSessions.length || "—"}</div>
                <div className="metric-label">Active Sessions</div>
              </div>
              <div className="metric-card">
                <div className="metric-value" style={{ color: user?.mfaEnabled ? "var(--success)" : "var(--warning)" }}>
                  {user?.mfaEnabled ? "ON" : "OFF"}
                </div>
                <div className="metric-label">MFA Status</div>
              </div>
              <div className="metric-card">
                <div className="metric-value" style={{ color: user?.passwordExpired ? "var(--danger)" : "var(--success)" }}>
                  {user?.passwordExpired ? "Expired" : "OK"}
                </div>
                <div className="metric-label">Password</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { label: "Manage Active Sessions", desc: `${activeSessions.length} active`, icon: <Wifi size={18} />, action: () => setTab("sessions") },
                { label: "Change Password", desc: "Update your credentials", icon: <Key size={18} />, action: () => setTab("password") },
                { label: "View Security Activity", desc: "Login history & events", icon: <Activity size={18} />, action: () => setTab("activity") },
              ].map((item) => (
                <button
                  key={item.label}
                  className="card"
                  onClick={item.action}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 16, textAlign: "left", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
                >
                  <div className="card-icon" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.20)", color: "var(--brand-primary)" }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── SESSIONS ── */}
        {tab === "sessions" && (
          <div className="fade-in">
            <div className="card-header" style={{ marginBottom: 20 }}>
              <h2 className="card-title"><Wifi size={20} color="var(--brand-primary)" /> Active Sessions</h2>
              <button className="btn btn-secondary btn-sm" onClick={loadSessions} disabled={sessionsLoading}>
                <RefreshCw size={14} style={sessionsLoading ? { animation: "spin 1s linear infinite" } : {}} />
                Refresh
              </button>
            </div>

            {sessionsLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Loader2 size={24} color="var(--brand-primary)" style={{ animation: "spin 0.7s linear infinite" }} />
              </div>
            ) : (
              <>
                {activeSessions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                    No active sessions
                  </div>
                ) : (
                  <div>
                    {activeSessions.map((s) => (
                      <div key={s.id} className="session-item">
                        <div className="session-info">
                          <div className="session-device-icon" style={{ color: "var(--success)" }}>
                            {getDeviceIcon(s.userAgent)}
                          </div>
                          <div className="session-meta">
                            <div className="session-device">{parseUserAgent(s.userAgent)}</div>
                            <div className="session-detail">
                              {s.ipAddress || "Unknown IP"} · Last seen {formatRelativeTime(s.lastSeenAt)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="security-badge badge-success" style={{ fontSize: 10 }}>
                            Active
                          </span>
                          <button
                            className="btn btn-danger"
                            onClick={() => revokeSession(s.id)}
                            disabled={revokingId === s.id}
                          >
                            {revokingId === s.id
                              ? <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />
                              : <XCircle size={13} />
                            }
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {revokedSessions.length > 0 && (
                  <div style={{ marginTop: 28 }}>
                    <h3 style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Past Sessions
                    </h3>
                    {revokedSessions.slice(0, 5).map((s) => (
                      <div key={s.id} className="session-item" style={{ opacity: 0.5 }}>
                        <div className="session-info">
                          <div className="session-device-icon">{getDeviceIcon(s.userAgent)}</div>
                          <div className="session-meta">
                            <div className="session-device">{parseUserAgent(s.userAgent)}</div>
                            <div className="session-detail">
                              {s.ipAddress || "Unknown IP"} · {formatRelativeTime(s.lastSeenAt)}
                            </div>
                          </div>
                        </div>
                        <span className="security-badge badge-neutral" style={{ fontSize: 10 }}>
                          {s.revokeReason || "Ended"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PASSWORD ── */}
        {tab === "password" && (
          <div className="fade-in" style={{ maxWidth: 440 }}>
            <h2 className="card-title" style={{ marginBottom: 24, fontSize: 18 }}>
              <Key size={20} color="var(--brand-primary)" /> Change Password
            </h2>

            {pwSuccess && (
              <div className="alert alert-success">
                <CheckCircle size={15} />
                Password changed! All other sessions have been signed out.
              </div>
            )}
            {pwError && (
              <div className="alert alert-error">
                <AlertCircle size={15} />
                {pwError}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={16} /></span>
                  <input
                    type={showPw ? "text" : "password"}
                    className="form-input has-right-icon"
                    placeholder="Your current password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    disabled={pwLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={16} /></span>
                  <input
                    type={showPw ? "text" : "password"}
                    className="form-input has-right-icon"
                    placeholder="Min. 12 characters"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    disabled={pwLoading}
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    title={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPw && (
                  <>
                    <div className="strength-bar" style={{ marginTop: 8 }}>
                      {[0,1,2,3,4].map((i) => (
                        <div key={i} className="strength-segment" style={{
                          background: i <= strength.score - 1 ? strength.color : undefined,
                        }} />
                      ))}
                    </div>
                    <div className="strength-label">
                      <span style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{newPw.length} chars</span>
                    </div>
                    {strength.suggestions.length > 0 && (
                      <ul className="strength-suggestions" style={{ marginTop: 6 }}>
                        {strength.suggestions.map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={16} /></span>
                  <input
                    type={showPw ? "text" : "password"}
                    className="form-input"
                    placeholder="Repeat new password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    disabled={pwLoading}
                  />
                </div>
                {confirmPw && newPw !== confirmPw && (
                  <div className="error-msg"><AlertCircle size={12} /> Passwords don't match</div>
                )}
              </div>

              <div style={{
                padding: "12px 14px",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.20)",
                borderRadius: "var(--radius-sm)",
                fontSize: 12,
                color: "rgba(252,211,77,0.8)",
                marginBottom: 20,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <Clock size={13} style={{ flexShrink: 0 }} />
                All other sessions will be signed out when you change your password.
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwLoading || newPw !== confirmPw || strength.score < 2}
              >
                {pwLoading
                  ? <><Loader2 size={18} style={{ animation: "spin 0.7s linear infinite" }} /> Changing…</>
                  : <><Shield size={18} /> Change Password</>
                }
              </button>
            </form>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {tab === "activity" && (
          <div className="fade-in">
            <div className="card-header" style={{ marginBottom: 20 }}>
              <h2 className="card-title"><Activity size={20} color="var(--brand-primary)" /> Security Activity</h2>
              <button className="btn btn-secondary btn-sm" onClick={loadActivity} disabled={actLoading}>
                <RefreshCw size={14} style={actLoading ? { animation: "spin 1s linear infinite" } : {}} />
                Refresh
              </button>
            </div>

            {actLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Loader2 size={24} color="var(--brand-primary)" style={{ animation: "spin 0.7s linear infinite" }} />
              </div>
            ) : activity.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "40px 0",
                color: "var(--text-muted)", fontSize: 14,
              }}>
                <Globe size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
                No recent security events
              </div>
            ) : (
              <div className="card" style={{ padding: "8px 20px" }}>
                {activity.map((ev) => (
                  <div key={ev.id} className="audit-item">
                    <div
                      className="audit-dot"
                      style={{ background: getActionColor(ev.action) }}
                    />
                    <div>
                      <div className="audit-action">
                        {ev.action.replace(/_/g, " ")}
                      </div>
                      <div className="audit-time">
                        {ev.ipAddress && `${ev.ipAddress} · `}
                        {formatRelativeTime(ev.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success"
              ? <CheckCircle size={18} color="var(--success)" />
              : <AlertCircle size={18} color="var(--danger)" />
            }
            {toast.msg}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
