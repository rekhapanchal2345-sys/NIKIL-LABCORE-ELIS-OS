// ============================================================
// MFA SETUP PAGE — QR code + TOTP enrollment
// ============================================================

import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, ArrowLeft, Copy, Check, Loader2, AlertCircle, QrCode } from "lucide-react";
import { authApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { AuthUser } from "../types/auth";

// Dynamically import QRCode to avoid SSR issues
let QRCode: React.ComponentType<{ value: string; size: number; bgColor: string; fgColor: string }> | null = null;
import("qrcode.react").then((m) => { QRCode = (m as any).QRCodeSVG || m.QRCodeSVG; });

export default function MfaSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const state = location.state as {
    mfaToken: string;
    otpauthUrl: string;
    user: { id: string; email: string; fullName: string };
  } | null;

  const [step, setStep] = useState<"scan" | "verify" | "backup">("scan");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!state?.mfaToken) { navigate("/login"); return; }
    import("qrcode.react").then((m) => {
      QRCode = (m as any).QRCodeSVG || m.QRCodeSVG;
      setQrReady(true);
    });
  }, []);

  const handleDigitChange = (idx: number, val: string) => {
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      const arr = val.split("");
      setDigits(arr);
      inputRefs.current[5]?.focus();
      submitVerify(val);
      return;
    }
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (next.every((d) => d)) submitVerify(next.join(""));
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const submitVerify = async (code: string) => {
    if (!state?.mfaToken) return;
    setLoading(true);
    setError("");
    try {
      const res = await authApi.verifyMfa(state.mfaToken, code);
      const data = res.data;
      if (data?.backupCodes) {
        setBackupCodes(data.backupCodes);
        setStep("backup");
      }
      if (data?.accessToken && data?.user) {
        setAuth({
          user: data.user as AuthUser,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          sessionId: data.sessionId,
        });
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Invalid code. Try again.");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finish = () => navigate("/dashboard");

  if (!state) return null;

  const steps = ["scan", "verify", "backup"] as const;
  const stepIdx = steps.indexOf(step);

  return (
    <div className="auth-layout">
      <div className="auth-card fade-in" style={{ maxWidth: 480 }}>
        {step !== "backup" && (
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => navigate("/login")}
            style={{ marginBottom: 20 }}
            aria-label="Go back to login"
            title="Go back to login"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {/* Step Indicator */}
        <div className="step-indicator">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`step-dot ${i === stepIdx ? "active" : i < stepIdx ? "done" : ""}`}
            />
          ))}
        </div>

        {/* ── STEP 1: Scan QR ── */}
        {step === "scan" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 56, height: 56,
                background: "rgba(99,102,241,0.12)",
                border: "2px solid rgba(99,102,241,0.30)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <QrCode size={26} color="var(--brand-primary)" />
              </div>
              <h1 className="auth-title">Set Up Authenticator</h1>
              <p className="auth-subtitle">
                Scan this QR code with Google Authenticator or Authy
              </p>
            </div>

            {qrReady && QRCode ? (
              <div className="qr-container">
                <QRCode
                  value={state.otpauthUrl}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  Scan with your authenticator app
                </div>
              </div>
            ) : (
              <div style={{
                height: 220, display: "flex", alignItems: "center",
                justifyContent: "center", background: "var(--bg-overlay)",
                borderRadius: "var(--radius-md)", marginBottom: 20,
              }}>
                <Loader2 size={24} color="var(--brand-primary)" style={{ animation: "spin 0.7s linear infinite" }} />
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 12px",
                fontSize: 11,
                color: "var(--text-muted)",
                wordBreak: "break-all",
                fontFamily: "monospace",
              }}>
                {state.otpauthUrl}
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => { setStep("verify"); setTimeout(() => inputRefs.current[0]?.focus(), 100); }}>
              <Shield size={18} />
              I've Scanned — Continue
            </button>
          </>
        )}

        {/* ── STEP 2: Verify Code ── */}
        {step === "verify" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1 className="auth-title">Verify Code</h1>
              <p className="auth-subtitle">
                Enter the 6-digit code from your authenticator to confirm setup
              </p>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <div className="otp-group">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="otp-input"
                  placeholder="·"
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                />
              ))}
            </div>

            {loading && (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <Loader2 size={20} color="var(--brand-primary)" style={{ animation: "spin 0.7s linear infinite" }} />
              </div>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => setStep("scan")}
              style={{ marginTop: 20, width: "100%" }}
            >
              <ArrowLeft size={16} /> Back to QR code
            </button>
          </>
        )}

        {/* ── STEP 3: Backup Codes ── */}
        {step === "backup" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 56, height: 56,
                background: "rgba(16,185,129,0.12)",
                border: "2px solid rgba(16,185,129,0.30)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <Check size={28} color="var(--success)" />
              </div>
              <h1 className="auth-title">MFA Enabled! 🎉</h1>
              <p className="auth-subtitle">
                Save these backup codes in a safe place. Each can only be used once.
              </p>
            </div>

            <div className="alert alert-warning">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <strong>Store these safely!</strong> You cannot view them again.
            </div>

            <div className="backup-codes">
              {backupCodes.map((code) => (
                <div key={code} className="backup-code">{code}</div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={copyBackupCodes}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy Codes"}
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={finish}>
                <Shield size={16} />
                Enter Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
