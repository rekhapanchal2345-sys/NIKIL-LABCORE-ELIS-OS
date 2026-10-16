/**
 * RISK ENGINE — Adaptive / Risk-based Authentication
 *
 * Every login attempt is scored 0-100. The score drives whether the session
 * is issued, a step-up MFA challenge is required, or the attempt is blocked.
 *
 * Signal weights are calibrated for a clinical laboratory environment where:
 *  - Shared workstations (same IP, different user) are normal
 *  - Off-hours access by PATHOLOGIST is normal (urgent cases)
 *  - ADMIN logins from new devices are high-risk
 *
 * Score thresholds (configurable via env):
 *   0 – 30  → ALLOW   (issue session normally)
 *   31 – 60 → STEP_UP (require MFA or block if MFA not enabled)
 *   61 – 80 → ALERT   (issue session + notify admin)
 *   81+     → BLOCK   (reject login + notify admin)
 */

import type { Request } from "express";
import type { UserRole } from "./auth";
import { getClientIp, getDeviceFingerprint } from "../utils/request-meta";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskAction = "ALLOW" | "STEP_UP" | "ALERT" | "BLOCK";

export interface RiskSignals {
  /** Device fingerprint has not been seen before for this user */
  newDevice: boolean;
  /** IP address not seen before for this user */
  newIp: boolean;
  /** Login hour is outside 06:00–22:00 IST */
  unusualHour: boolean;
  /** Previous failed login attempts in this session */
  failedAttempts: number;
  /** Role-based inherent risk (ADMIN/SUPER_ADMIN are higher value targets) */
  isHighPrivRole: boolean;
  /** MFA was successfully verified in this flow */
  mfaVerified: boolean;
  /** Known/trusted device registered by user or admin */
  trustedDevice: boolean;
  /** Account was locked in the past 24h */
  recentLockout: boolean;
  /** Two active sessions from different countries simultaneously */
  impossibleTravel: boolean;
}

export interface RiskAssessment {
  score: number;           // 0–100
  level: RiskLevel;
  action: RiskAction;
  signals: RiskSignals;
  reasons: string[];       // Human-readable reasons for logging
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLD_STEP_UP = Number(process.env.RISK_THRESHOLD_STEP_UP || 31);
const THRESHOLD_ALERT   = Number(process.env.RISK_THRESHOLD_ALERT   || 61);
const THRESHOLD_BLOCK   = Number(process.env.RISK_THRESHOLD_BLOCK   || 81);

// ─── Signal Weights ───────────────────────────────────────────────────────────

const WEIGHTS = {
  newDevice:       18,  // Seen at 50% of enterprise breaches
  newIp:           10,  // Less alarming — labs share IPs via NAT
  unusualHour:     10,  // Context-dependent (pathologist at 3am is normal)
  failedAttempt:   8,   // Per-attempt additive
  highPrivRole:    12,  // ADMIN/SUPER_ADMIN — higher value target
  recentLockout:   15,  // Account was just brute-forced
  impossibleTravel: 40, // Physical impossibility
  // Negative signals (reduce score)
  mfaVerified:    -25,  // Proven second factor
  trustedDevice:  -15,  // Explicitly registered by user
} as const;

const HIGH_PRIV_ROLES: UserRole[] = ["ADMIN", "SUPER_ADMIN", "BRANCH_ADMIN"];

// ─── Core Scoring ─────────────────────────────────────────────────────────────

export function scoreRisk(signals: RiskSignals): number {
  let score = 0;
  const reasons: string[] = [];

  if (signals.newDevice) {
    score += WEIGHTS.newDevice;
    reasons.push("new_device");
  }
  if (signals.newIp) {
    score += WEIGHTS.newIp;
    reasons.push("new_ip");
  }
  if (signals.unusualHour) {
    score += WEIGHTS.unusualHour;
    reasons.push("unusual_hour");
  }
  if (signals.isHighPrivRole) {
    score += WEIGHTS.highPrivRole;
    reasons.push("high_privilege_role");
  }
  if (signals.recentLockout) {
    score += WEIGHTS.recentLockout;
    reasons.push("recent_account_lockout");
  }
  if (signals.impossibleTravel) {
    score += WEIGHTS.impossibleTravel;
    reasons.push("impossible_travel_detected");
  }
  // Per-attempt penalty (max 3 counted to prevent overflow)
  const attempts = Math.min(signals.failedAttempts, 3);
  score += attempts * WEIGHTS.failedAttempt;
  if (attempts > 0) reasons.push(`failed_attempts_${attempts}`);

  // Negative signals
  if (signals.mfaVerified) {
    score += WEIGHTS.mfaVerified; // negative
    reasons.push("mfa_verified");
  }
  if (signals.trustedDevice) {
    score += WEIGHTS.trustedDevice; // negative
    reasons.push("trusted_device");
  }

  return Math.max(0, Math.min(100, score));
}

function levelFromScore(score: number): RiskLevel {
  if (score >= THRESHOLD_BLOCK)   return "CRITICAL";
  if (score >= THRESHOLD_ALERT)   return "HIGH";
  if (score >= THRESHOLD_STEP_UP) return "MEDIUM";
  return "LOW";
}

function actionFromScore(score: number): RiskAction {
  if (score >= THRESHOLD_BLOCK)   return "BLOCK";
  if (score >= THRESHOLD_ALERT)   return "ALERT";
  if (score >= THRESHOLD_STEP_UP) return "STEP_UP";
  return "ALLOW";
}

// ─── Request-aware Assessment ────────────────────────────────────────────────

export function assessRisk(
  signals: RiskSignals
): RiskAssessment {
  const reasons: string[] = [];

  // Recompute with reasons
  let score = 0;

  if (signals.newDevice)        { score += WEIGHTS.newDevice;      reasons.push("new_device"); }
  if (signals.newIp)            { score += WEIGHTS.newIp;          reasons.push("new_ip"); }
  if (signals.unusualHour)      { score += WEIGHTS.unusualHour;    reasons.push("unusual_hour"); }
  if (signals.isHighPrivRole)   { score += WEIGHTS.highPrivRole;   reasons.push("high_privilege_role"); }
  if (signals.recentLockout)    { score += WEIGHTS.recentLockout;  reasons.push("recent_lockout"); }
  if (signals.impossibleTravel) { score += WEIGHTS.impossibleTravel; reasons.push("impossible_travel"); }
  if (signals.mfaVerified)      { score += WEIGHTS.mfaVerified;    reasons.push("mfa_ok"); }
  if (signals.trustedDevice)    { score += WEIGHTS.trustedDevice;  reasons.push("trusted_device"); }

  const attempts = Math.min(signals.failedAttempts, 3);
  score += attempts * WEIGHTS.failedAttempt;
  if (attempts > 0) reasons.push(`failed_x${attempts}`);

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    level: levelFromScore(score),
    action: actionFromScore(score),
    signals,
    reasons,
  };
}

// ─── Signal Builders ─────────────────────────────────────────────────────────

/**
 * Detect "unusual hour" in IST (UTC+5:30).
 * Returns true if current IST hour is before 06:00 or after 22:00.
 */
export function isUnusualHour(): boolean {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(Date.now() + istOffsetMs);
  const hour = istNow.getUTCHours();
  return hour < 6 || hour >= 22;
}

/**
 * Check if a device fingerprint or IP was previously seen for this user.
 */
export function buildDeviceSignals(
  req: Request,
  user: {
    lastAlertedDeviceFingerprint?: string | null;
    lastAlertedIpAddress?: string | null;
  }
): { newDevice: boolean; newIp: boolean } {
  const fingerprint = getDeviceFingerprint(req);
  const ip = getClientIp(req);

  return {
    newDevice: user.lastAlertedDeviceFingerprint !== fingerprint,
    newIp:     user.lastAlertedIpAddress !== ip,
  };
}

/**
 * Detect impossible travel between last session and current login.
 *
 * We use a simple heuristic: if the last session's IP is from a completely
 * different Class-A subnet AND the time delta is < 30 minutes, flag it.
 * A full GeoIP implementation would replace this with coordinate distance.
 */
export function detectImpossibleTravel(
  currentIp: string,
  lastIp: string | null | undefined,
  lastSeenAt: Date | null | undefined
): boolean {
  if (!lastIp || !lastSeenAt) return false;

  const timeDeltaMs = Date.now() - lastSeenAt.getTime();
  const thirtyMinutes = 30 * 60 * 1000;

  if (timeDeltaMs > thirtyMinutes) return false; // Enough time to travel

  // Compare Class-A octets (first 8 bits of the IP address)
  const currentOctet = currentIp.split(".")[0];
  const lastOctet    = lastIp.split(".")[0];

  // If first octets differ dramatically (e.g., 192.x vs 103.x), flag as suspicious
  // Real impl: use geoip-lite for country-level comparison
  if (currentOctet && lastOctet && currentOctet !== lastOctet) {
    const diff = Math.abs(Number(currentOctet) - Number(lastOctet));
    if (diff > 50) return true; // Very different IP ranges within 30min
  }

  return false;
}

/**
 * Determine whether this role is high-privilege (a higher-value attack target).
 */
export function isHighPrivilegeRole(role: UserRole): boolean {
  return HIGH_PRIV_ROLES.includes(role);
}
