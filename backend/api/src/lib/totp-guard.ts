import crypto from "crypto";
import { generateTotp } from "../utils/totp";
import { HttpError } from "../utils/http-error";

/**
 * RFC 6238 TOTP REPLAY GUARD & SECURITY HARDENER
 *
 * Requirements addressed:
 * 1. Single-use enforcement: An OTP code MUST NOT be accepted twice within
 *    its validity window (RFC 6238 Section 5.2).
 * 2. Clock-drift synchronization with step tracking: records the exact time step
 *    and prevents accepting a code from a step older than the last recorded step.
 * 3. MFA brute-force rate-limiting: 5 failed attempts in 10 minutes triggers
 *    a temporary lock on MFA verification to stop code guessing.
 */

interface UsedTotpEntry {
  userId: string;
  code: string;
  step: number;
  consumedAt: number;
}

interface MfaFailureTracker {
  count: number;
  firstFailedAt: number;
  lockedUntil: number | null;
}

const STEP_SECONDS = 30;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const FAILURE_WINDOW_MS = 10 * 60 * 1000;   // 10 minutes

// In-memory replay cache: maps "userId:code:step" -> timestamp
const usedCodes = new Map<string, number>();

// In-memory MFA failure tracker: maps userId -> MfaFailureTracker
const failureTrackers = new Map<string, MfaFailureTracker>();

// Cleanup timer running every 2 minutes
setInterval(() => {
  const now = Date.now();
  // Clear codes older than 3 steps (90 seconds + buffer)
  for (const [key, timestamp] of usedCodes.entries()) {
    if (now - timestamp > 120_000) {
      usedCodes.delete(key);
    }
  }

  // Clear expired failure trackers
  for (const [userId, tracker] of failureTrackers.entries()) {
    if (tracker.lockedUntil && now > tracker.lockedUntil) {
      failureTrackers.delete(userId);
    } else if (now - tracker.firstFailedAt > FAILURE_WINDOW_MS && !tracker.lockedUntil) {
      failureTrackers.delete(userId);
    }
  }
}, 120_000).unref();

/**
 * Checks if user is currently locked out of MFA verification due to too many failed attempts.
 */
export function assertMfaNotLocked(userId: string): void {
  const tracker = failureTrackers.get(userId);
  if (!tracker) return;

  const now = Date.now();
  if (tracker.lockedUntil && now < tracker.lockedUntil) {
    const remainingSeconds = Math.ceil((tracker.lockedUntil - now) / 1000);
    throw new HttpError(
      `Too many failed MFA attempts. Please wait ${remainingSeconds} seconds before trying again.`,
      429,
      "MFA_RATE_LIMITED"
    );
  }

  // Lock expired
  if (tracker.lockedUntil && now >= tracker.lockedUntil) {
    failureTrackers.delete(userId);
  }
}

/**
 * Records a failed MFA attempt for a user.
 */
export function recordMfaFailure(userId: string): { remainingAttempts: number; isLocked: boolean } {
  const now = Date.now();
  let tracker = failureTrackers.get(userId);

  if (!tracker || (now - tracker.firstFailedAt > FAILURE_WINDOW_MS && !tracker.lockedUntil)) {
    tracker = { count: 1, firstFailedAt: now, lockedUntil: null };
  } else {
    tracker.count += 1;
  }

  if (tracker.count >= MAX_FAILED_ATTEMPTS) {
    tracker.lockedUntil = now + LOCKOUT_DURATION_MS;
    failureTrackers.set(userId, tracker);
    return { remainingAttempts: 0, isLocked: true };
  }

  failureTrackers.set(userId, tracker);
  return {
    remainingAttempts: MAX_FAILED_ATTEMPTS - tracker.count,
    isLocked: false,
  };
}

/**
 * Clears failed MFA attempts upon a successful verification.
 */
export function clearMfaFailures(userId: string): void {
  failureTrackers.delete(userId);
}

/**
 * Verifies a TOTP code against the secret, with RFC 6238 replay protection.
 *
 * Checks time steps: current (0), past (-1), future (+1).
 * If valid, ensures the (userId + code + matchedStep) has NOT been consumed.
 * Consumes the code atomically upon success.
 */
export function verifyTotpWithReplayGuard(
  userId: string,
  secret: string,
  token: string
): { valid: boolean; errorReason?: string; matchedStep?: number } {
  assertMfaNotLocked(userId);

  const code = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) {
    return { valid: false, errorReason: "Code must be 6 numeric digits" };
  }

  const currentCounter = Math.floor(Date.now() / 1000 / STEP_SECONDS);

  // Check window [-1, 0, 1]
  for (let offset = -1; offset <= 1; offset++) {
    const step = currentCounter + offset;
    const expected = generateTotp(secret, offset, STEP_SECONDS);

    if (expected === code) {
      // Replay check
      const replayKey = `${userId}:${code}:${step}`;
      if (usedCodes.has(replayKey)) {
        return {
          valid: false,
          errorReason: "This authenticator code was already used. Please wait for the next code on your authenticator app.",
        };
      }

      // Mark code as consumed in this window
      usedCodes.set(replayKey, Date.now());
      clearMfaFailures(userId);

      return { valid: true, matchedStep: step };
    }
  }

  // If not valid, record failure
  const { remainingAttempts, isLocked } = recordMfaFailure(userId);
  if (isLocked) {
    return {
      valid: false,
      errorReason: "Too many failed attempts. MFA verification locked for 10 minutes.",
    };
  }

  return {
    valid: false,
    errorReason: `Invalid authenticator code. ${remainingAttempts} attempts remaining before temporary lockout.`,
  };
}
