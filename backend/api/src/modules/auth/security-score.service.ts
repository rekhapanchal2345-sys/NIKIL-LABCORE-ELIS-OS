/**
 * SECURITY SCORE SERVICE
 *
 * Computes a per-user security health score (0-100, grade A-F) based on
 * measurable security hygiene factors. Used by:
 *   - GET /api/auth/security-score  (user's own score)
 *   - GET /api/admin/users/:id/security-score (admin view)
 *   - Admin dashboard "Security Health" panel
 *
 * Score breakdown:
 *   MFA enabled              30 pts  (most important)
 *   Password fresh (<90 days) 20 pts
 *   Email verified           15 pts
 *   No active lockout        15 pts
 *   No suspicious sessions   10 pts
 *   Backup codes generated   10 pts
 *   Total:                  100 pts
 */

import prisma from "../../../config/database";
import { isPasswordExpired } from "../../utils/password-policy";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SecurityCheckItem {
  check: string;
  passed: boolean;
  weight: number;
  detail?: string;
}

export interface SecurityScore {
  score: number;       // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;       // "Excellent" | "Good" | "Fair" | "Poor" | "Critical"
  items: SecurityCheckItem[];
  computedAt: Date;
  recommendations: string[];
  advancedFeatures?: {
    hardwareKeyEnabled: boolean;
    trustedDevicesCount: number;
  };
}

// ─── Grade Map ────────────────────────────────────────────────────────────────

function toGrade(score: number): SecurityScore["grade"] {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

function toLabel(score: number): SecurityScore["label"] {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 45) return "Poor";
  return "Critical";
}

// ─── Core Computation ─────────────────────────────────────────────────────────

export async function computeSecurityScore(userId: string): Promise<SecurityScore> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mfaEnabled:       true,
      emailVerified:    true,
      status:           true,
      lockedUntil:      true,
      passwordChangedAt: true,
      mfaBackupCodes:   { where: { usedAt: null }, select: { id: true }, take: 1 },
      sessions: {
        where: {
          revokedAt:  null,
          expiresAt:  { gt: new Date() },
          riskScore:  { gte: 61 },           // "ALERT" or "BLOCK" risk level
        },
        select: { id: true },
        take:   1,
      },
      trustedDevices: {
        where: { revokedAt: null, trustedUntil: { gt: new Date() } },
        select: { id: true },
      },
      webAuthnCredentials: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const items: SecurityCheckItem[] = [];
  let totalScore = 0;

  // ── MFA Enabled (30 pts) ──────────────────────────────────────────────────
  const mfaCheck: SecurityCheckItem = {
    check:  "Two-factor authentication (MFA) enabled",
    passed: user.mfaEnabled,
    weight: 30,
    detail: user.mfaEnabled
      ? "Your account is protected with an authenticator app."
      : "Enable MFA in Account Settings to significantly increase security.",
  };
  if (mfaCheck.passed) totalScore += mfaCheck.weight;
  items.push(mfaCheck);

  // ── Password Fresh < 90 days (20 pts) ─────────────────────────────────────
  const passwordExpired = user.passwordChangedAt
    ? isPasswordExpired(user.passwordChangedAt)
    : true; // null = never changed = expired
  const passwordAgeCheck: SecurityCheckItem = {
    check:  "Password changed within the last 90 days",
    passed: !passwordExpired,
    weight: 20,
    detail: passwordExpired
      ? "Your password is expired. Change it immediately."
      : `Password is current.`,
  };
  if (passwordAgeCheck.passed) totalScore += passwordAgeCheck.weight;
  items.push(passwordAgeCheck);

  // ── Email Verified (15 pts) ───────────────────────────────────────────────
  const emailCheck: SecurityCheckItem = {
    check:  "Email address verified",
    passed: user.emailVerified,
    weight: 15,
    detail: user.emailVerified
      ? "Your email address is verified and can receive security alerts."
      : "Verify your email to enable security alerts and password recovery.",
  };
  if (emailCheck.passed) totalScore += emailCheck.weight;
  items.push(emailCheck);

  // ── No Active Lockout (15 pts) ────────────────────────────────────────────
  const notLocked = user.status !== "LOCKED" && !(user.lockedUntil && user.lockedUntil > new Date());
  const lockoutCheck: SecurityCheckItem = {
    check:  "No recent account lockout",
    passed: notLocked,
    weight: 15,
    detail: notLocked
      ? "No active lockout on your account."
      : "Your account was recently locked due to failed sign-in attempts.",
  };
  if (lockoutCheck.passed) totalScore += lockoutCheck.weight;
  items.push(lockoutCheck);

  // ── No Suspicious Sessions (10 pts) ──────────────────────────────────────
  const noSuspicious = (user.sessions ?? []).length === 0;
  const suspiciousCheck: SecurityCheckItem = {
    check:  "No suspicious active sessions",
    passed: noSuspicious,
    weight: 10,
    detail: noSuspicious
      ? "All your active sessions are from recognised locations."
      : "You have sessions flagged for suspicious activity. Review your active sessions.",
  };
  if (suspiciousCheck.passed) totalScore += suspiciousCheck.weight;
  items.push(suspiciousCheck);

  // ── MFA Backup Codes Generated (10 pts) ──────────────────────────────────
  const hasBackupCodes = (user.mfaBackupCodes ?? []).length > 0;
  const backupCheck: SecurityCheckItem = {
    check:  "MFA backup codes generated",
    passed: user.mfaEnabled ? hasBackupCodes : false,
    weight: 10,
    detail: !user.mfaEnabled
      ? "Enable MFA first, then generate backup codes."
      : hasBackupCodes
      ? "Backup codes are available for account recovery."
      : "Generate backup codes in case you lose access to your authenticator app.",
  };
  if (backupCheck.passed) totalScore += backupCheck.weight;
  items.push(backupCheck);

  // ── Recommendations ───────────────────────────────────────────────────────
  const recommendations = items
    .filter((i) => !i.passed)
    .map((i) => i.detail ?? `Complete: ${i.check}`)
    .filter(Boolean);

  const grade = toGrade(totalScore);
  const label = toLabel(totalScore);

  return {
    score: totalScore,
    grade,
    label,
    items,
    computedAt: new Date(),
    recommendations,
    advancedFeatures: {
      hardwareKeyEnabled: (user.webAuthnCredentials ?? []).length > 0,
      trustedDevicesCount: (user.trustedDevices ?? []).length,
    },
  };
}
