// ============================================================
// FORGOT PASSWORD PAGE
// ============================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle, Lock, Shield, Eye, EyeOff } from "lucide-react";
import { authApi } from "../lib/api";
import { analyzePassword } from "../lib/utils";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const strength = analyzePassword(newPassword);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Enter your email address."); return; }
    setLoading(true); setError("");
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSuccessMsg("If this email has an account, a 6-digit code has been sent.");
      setStep("reset");
    } catch (_err: unknown) {
      // Don't reveal if email exists
      setSuccessMsg("If this email has an account, a 6-digit code has been sent.");
      setStep("reset");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) { setError("Enter the 6-digit code."); return; }
    if (newPassword.length < 12) { setError("Password must be at least 12 characters."); return; }
    if (newPassword !== confirmPw) { setError("Passwords do not match."); return; }
    if (strength.score < 2) { setError("Password is too weak. " + strength.suggestions[0]); return; }

    setLoading(true); setError("");
    try {
      await authApi.resetPassword(email, code.trim(), newPassword);
      setStep("done");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Reset failed. Check your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels: Step[] = ["email", "reset", "done"];

  return (
    <div className="auth-layout">
      <div className="auth-card fade-in" style={{ maxWidth: 420 }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => navigate("/login")}
          style={{ marginBottom: 20 }}
          aria-label="Go back to login"
          title="Go back to login"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Step indicator */}
        <div className="step-indicator">
          {stepLabels.map((s, i) => (
            <div key={s} className={`step-dot ${s === step ? "active" : i < stepLabels.indexOf(step) ? "done" : ""}`} />
          ))}
        </div>

        {/* ── Email step ── */}
        {step === "email" && (
          <>
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">
              Enter your registered email. We'll send a one-time code.
            </p>
            {error && <div className="alert alert-error"><AlertCircle size={15} />{error}</div>}
            <form onSubmit={handleRequestCode}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Mail size={16} /></span>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="email@lab.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    disabled={loading}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><Loader2 size={18} style={{ animation: "spin 0.7s linear infinite" }} /> Sending…</> : <><Mail size={18} /> Send Reset Code</>}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}>
              <Link to="/login" className="link">Back to sign in</Link>
            </div>
          </>
        )}

        {/* ── Reset step ── */}
        {step === "reset" && (
          <>
            <h1 className="auth-title">Enter New Password</h1>
            {successMsg && <div className="alert alert-success"><CheckCircle size={15} />{successMsg}</div>}
            {error && <div className="alert alert-error"><AlertCircle size={15} />{error}</div>}
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label className="form-label">6-Digit Code</label>
                <input
                  type="text"
                  className="form-input no-left-icon mono"
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={16} /></span>
                  <input
                    type={showPw ? "text" : "password"}
                    className="form-input has-right-icon"
                    placeholder="Min. 12 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                {newPassword && (
                  <>
                    <div className="strength-bar" style={{ marginTop: 8 }}>
                      {[0,1,2,3,4].map((i) => (
                        <div key={i} className="strength-segment" style={{
                          background: i <= strength.score - 1 ? strength.color : undefined,
                        }} />
                      ))}
                    </div>
                    <div className="strength-label">
                      <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={16} /></span>
                  <input
                    type={showPw ? "text" : "password"}
                    className="form-input has-right-icon"
                    placeholder="Repeat password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {confirmPw && newPassword !== confirmPw && (
                  <div className="error-msg"><AlertCircle size={12} /> Passwords don't match</div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading || newPassword !== confirmPw}>
                {loading ? <><Loader2 size={18} style={{ animation: "spin 0.7s linear infinite" }} /> Resetting…</> : <><Shield size={18} /> Reset Password</>}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 14, fontSize: 12 }}>
              <button className="btn btn-ghost" onClick={() => setStep("email")} style={{ fontSize: 12 }}>
                Resend code
              </button>
            </div>
          </>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 64, height: 64,
              background: "rgba(16,185,129,0.12)",
              border: "2px solid rgba(16,185,129,0.30)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <CheckCircle size={32} color="var(--success)" />
            </div>
            <h1 className="auth-title">Password Reset!</h1>
            <p className="auth-subtitle">
              Your password has been updated. All other sessions have been signed out.
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/login")}>
              <Lock size={18} /> Sign In with New Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
