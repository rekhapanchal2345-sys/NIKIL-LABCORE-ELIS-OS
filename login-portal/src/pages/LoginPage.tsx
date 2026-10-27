// ============================================================
// LOGIN PAGE — Ultra-Secure Login with brute-force feedback
// ============================================================

import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye, EyeOff, Lock, User, Shield, AlertCircle,
  ChevronRight, Loader2, Fingerprint
} from "lucide-react";
import { authApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { AuthUser } from "../types/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockoutMsg, setLockoutMsg] = useState("");
  const [shake, setShake] = useState(false);

  const identifierRef = useRef<HTMLInputElement>(null);

  useEffect(() => { identifierRef.current?.focus(); }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your email/employee code and password.");
      triggerShake();
      return;
    }

    setLoading(true);
    setError("");
    setLockoutMsg("");
    setAttemptsLeft(null);

    try {
      const res = await authApi.login(identifier.trim(), password);
      const data = res.data;

      if (!data) throw new Error("Empty response from server.");

      // ── MFA Setup Required ──
      if (data.requiresMfaSetup) {
        navigate("/mfa-setup", {
          state: {
            mfaToken: data.mfaToken,
            otpauthUrl: data.otpauthUrl,
            user: data.user,
          },
        });
        return;
      }

      // ── MFA Verify Required ──
      if (data.requiresMfa) {
        navigate("/mfa-verify", {
          state: {
            mfaToken: data.mfaToken,
            user: data.user,
          },
        });
        return;
      }

      // ── Successful Login ──
      if (data.accessToken && data.user) {
        setAuth({
          user: data.user as AuthUser,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          sessionId: data.sessionId,
        });
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const e = err as { status?: number; code?: string; message?: string };
      triggerShake();

      if (e.status === 423) {
        // Account locked
        setLockoutMsg(e.message || "Account locked. Contact an administrator.");
        setError("");
      } else if (e.status === 401) {
        // Check if message contains "N attempts left"
        const msg = e.message || "Invalid credentials.";
        const match = msg.match(/(\d+) attempt/);
        if (match) setAttemptsLeft(Number(match[1]));
        setError(msg);
      } else if (e.status === 403) {
        setError(e.message || "Account is suspended or inactive.");
      } else {
        setError(e.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className={`auth-card fade-in ${shake ? "animate-shake" : ""}`}
        style={shake ? { animation: "shake 0.5s ease" } : {}}>

        {/* Brand */}
        <div className="brand-logo">
          <div className="brand-icon">
            <Shield size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-name">LabCore ELIS</div>
            <div className="brand-sub">Enterprise LIS</div>
          </div>
        </div>

        <h1 className="auth-title">Secure Sign In</h1>
        <p className="auth-subtitle">
          Access your laboratory information system
        </p>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              {error}
              {attemptsLeft !== null && (
                <div style={{
                  marginTop: 6,
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 11, color: "rgba(252,165,165,0.8)"
                }}>
                  <div style={{
                    display: "flex", gap: 3
                  }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} style={{
                        width: 16, height: 4,
                        borderRadius: 2,
                        background: i < (5 - attemptsLeft) ? "#ef4444" : "rgba(255,255,255,0.15)"
                      }} />
                    ))}
                  </div>
                  {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} remaining
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lockout Alert */}
        {lockoutMsg && (
          <div className="alert alert-warning">
            <Lock size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Account Locked</strong>
              <div style={{ marginTop: 3 }}>{lockoutMsg}</div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email or Employee Code</label>
            <div className="input-wrapper">
              <span className="input-icon"><User size={16} /></span>
              <input
                ref={identifierRef}
                type="text"
                className="form-input"
                placeholder="email@lab.com or EMP001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" className="link" style={{ fontSize: 12 }}>
                Forgot password?
              </Link>
            </div>
            <div className="input-wrapper">
              <span className="input-icon"><Lock size={16} /></span>
              <input
                type={showPw ? "text" : "password"}
                className="form-input has-right-icon"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
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
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !!lockoutMsg}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" style={{ animation: "spin 0.7s linear infinite" }} />
                Authenticating…
              </>
            ) : (
              <>
                <Fingerprint size={18} />
                Sign In Securely
                <ChevronRight size={16} style={{ marginLeft: "auto" }} />
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div className="security-badge badge-success">
            <Shield size={11} />
            256-bit TLS
          </div>
          <div className="security-badge badge-info">
            <Lock size={11} />
            JWT Auth
          </div>
          <div className="security-badge badge-neutral">
            <Fingerprint size={11} />
            TOTP MFA
          </div>
        </div>
      </div>

      {/* Shake animation style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
