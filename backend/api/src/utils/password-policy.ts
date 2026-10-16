import { HttpError } from "./http-error";
import crypto from "crypto";

const POLICY = {
  minLength: 12,
  historyCount: 5,
  expiryDays: 90,
  minEntropyScore: 2,      // zxcvbn score 0-4 (2 = "fair", 3 = "good", 4 = "strong")
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in ms
};

const COMPLEXITY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

/**
 * Subset of the HIBP "top 1 000 000" and most commonly seen breach passwords,
 * reduced to entries >= 12 chars so the check applies at the policy boundary.
 * In production, this is SUPPLEMENTED by the live HIBP API (assertNotPwned).
 */
const COMMON_PASSWORDS = new Set([
  "password123456",
  "Password12345!",
  "Password123456",
  "qwertyuiop123",
  "iloveyou123456",
  "letmein123456",
  "welcome123456",
  "monkey123456",
  "dragon123456",
  "master123456",
  "sunshine123456",
  "princess123456",
  "passw0rd1234",
  "Passw0rd1234",
  "abc123456789",
  "111111111111",
  "123456789012",
  "000000000000",
  "aaaaaaaaaaaa",
  "qqqqqqqqqqqq",
  "administrator",
  "administrator1",
  "1qaz2wsx3edc",
  "qazwsxedcrfv",
  "zxcvbnm12345",
  "trustno11234",
  "superman12345",
  "batman123456",
  "michael12345",
  "jessica12345",
  "Password1234!",
  "Welcome1234!",
  "Summer2024!!",
  "Winter2024!!",
  "Spring2024!!",
  "Autumn2024!!",
  "January2024!",
  "February2024!",
  "March2024!!!",
  "April2024!!!",
  "Company2024!",
  "Labcore2024!",
  "Hospital2024",
  "Clinical2024",
]);

/**
 * Throws if password appears on the known-weak/breached list.
 */
export function assertNotCommonPassword(password: string): void {
  if (COMMON_PASSWORDS.has(password)) {
    throw new HttpError(
      "This password is too common and has appeared in known data breaches. Please choose a unique password.",
      400,
      "COMMON_PASSWORD"
    );
  }
}

/**
 * Throws if password contains the user's email local-part or any word
 * from their full name (case-insensitive, minimum 3 chars per word).
 */
export function assertNoPersonalInfo(
  password: string,
  email: string,
  fullName: string
): void {
  const lower = password.toLowerCase();

  // Check email local-part (everything before @)
  const localPart = email.split("@")[0].toLowerCase();
  if (localPart.length >= 3 && lower.includes(localPart)) {
    throw new HttpError(
      "Password must not contain your email address.",
      400,
      "PASSWORD_CONTAINS_EMAIL"
    );
  }

  // Check each word in full name (skip words shorter than 3 chars)
  const nameParts = fullName
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  for (const part of nameParts) {
    if (lower.includes(part)) {
      throw new HttpError(
        "Password must not contain your name.",
        400,
        "PASSWORD_CONTAINS_NAME"
      );
    }
  }
}

export function assertStrongPassword(password: string): void {
  if (!COMPLEXITY.test(password)) {
    throw new HttpError(
      "Password must be at least 12 characters and include uppercase, lowercase, a number, and a symbol.",
      400,
      "WEAK_PASSWORD"
    );
  }
}

export function isPasswordExpired(passwordChangedAt?: Date | null): boolean {
  if (!passwordChangedAt) {
    return false;
  }

  const expiresAt = new Date(passwordChangedAt);
  expiresAt.setDate(expiresAt.getDate() + POLICY.expiryDays);
  return Date.now() > expiresAt.getTime();
}

// ─── HIBP (HaveIBeenPwned) Integration ───────────────────────────────────────
//
// k-Anonymity model: only the first 5 characters of the SHA-1 hash are sent
// to the HIBP API. The full hash NEVER leaves the server. The response is a
// list of suffix:count pairs; we check locally if the full hash is in the list.
//
// This check is skipped gracefully if the HIBP API is unavailable (timeout or
// network error), so a mail outage does not block legitimate registrations.

const HIBP_TIMEOUT_MS = Number(process.env.HIBP_TIMEOUT_MS || 3000);
const HIBP_ENABLED = process.env.HIBP_ENABLED !== "false"; // opt-out via env

/**
 * Checks the HaveIBeenPwned API for the given password.
 * Throws HttpError(400) if the password appears in known breaches.
 * Silently passes if the check cannot be completed (network error).
 */
export async function assertNotPwned(password: string): Promise<void> {
  if (!HIBP_ENABLED) return;

  let sha1: string;
  try {
    sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  } catch {
    return; // crypto failure — do not block
  }

  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS);

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "LabCore-ELIS/1.0 (security check; +https://labcore.example.com)",
          "Add-Padding": "true", // k-Anonymity padding to prevent traffic analysis
        },
      }
    );

    clearTimeout(timer);

    if (!response.ok) return; // HIBP down — allow gracefully

    const text = await response.text();
    const lines = text.split("\r\n").filter(Boolean);

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix?.toUpperCase() === suffix) {
        const count = parseInt(countStr || "0", 10);
        if (count > 0) {
          throw new HttpError(
            `This password has appeared in ${count.toLocaleString()} known data breach${count === 1 ? "" : "es"}. ` +
            "Please choose a different password.",
            400,
            "PASSWORD_PWNED"
          );
        }
      }
    }
  } catch (error) {
    // Re-throw our own HttpError (password found in breaches)
    if (error instanceof HttpError) throw error;
    // Network / timeout errors: log but do not block the user
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[HIBP] Password breach check could not be completed:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}

// ─── Entropy / Strength Estimation ───────────────────────────────────────────
//
// A lightweight entropy check that doesn't require the zxcvbn package.
// Estimates character-set size and calculates Shannon-like entropy.
// Score 0-4 matching zxcvbn's scale (for compatibility if zxcvbn is added later).

/**
 * Estimates password strength score (0-4) based on charset diversity and length.
 * This is a lightweight alternative to zxcvbn that requires no extra dependencies.
 *
 * 0 = Very Weak  (<= 28 bits)
 * 1 = Weak       (<= 36 bits)
 * 2 = Fair       (<= 45 bits)
 * 3 = Good       (<= 56 bits)
 * 4 = Strong     (> 56 bits)
 */
export function estimatePasswordStrength(password: string): {
  score: number;        // 0-4
  entropy: number;      // estimated bits
  feedback: string[];   // user-facing improvement suggestions
} {
  const feedback: string[] = [];
  let charsetSize = 0;

  const hasLower   = /[a-z]/.test(password);
  const hasUpper   = /[A-Z]/.test(password);
  const hasDigit   = /\d/.test(password);
  const hasSymbol  = /[^A-Za-z0-9]/.test(password);
  const hasExtended = /[^\x20-\x7E]/.test(password); // Unicode chars

  if (hasLower)    charsetSize += 26;
  if (hasUpper)    charsetSize += 26;
  if (hasDigit)    charsetSize += 10;
  if (hasSymbol)   charsetSize += 32;
  if (hasExtended) charsetSize += 40;

  if (!hasLower)  feedback.push("Add lowercase letters");
  if (!hasUpper)  feedback.push("Add uppercase letters");
  if (!hasDigit)  feedback.push("Add numbers");
  if (!hasSymbol) feedback.push("Add symbols (!, @, #, $, ...)");
  if (password.length < 16) feedback.push("Longer passwords are stronger");

  const entropy = password.length * Math.log2(Math.max(charsetSize, 1));

  let score: number;
  if (entropy > 56)      score = 4;
  else if (entropy > 45) score = 3;
  else if (entropy > 36) score = 2;
  else if (entropy > 28) score = 1;
  else                   score = 0;

  return { score, entropy: Math.round(entropy), feedback };
}

/**
 * Throws if password entropy is too low (score < minEntropyScore).
 * Called after assertStrongPassword so complexity rules are already enforced.
 */
export function assertSufficientEntropy(password: string): void {
  const { score, feedback } = estimatePasswordStrength(password);
  if (score < POLICY.minEntropyScore) {
    const hint = feedback.length > 0 ? ` Suggestions: ${feedback.slice(0, 2).join("; ")}.` : "";
    throw new HttpError(
      `Password is not strong enough.${hint}`,
      400,
      "PASSWORD_TOO_WEAK"
    );
  }
}

// ─── Password Age ─────────────────────────────────────────────────────────────

/**
 * Returns the number of days until the password expires.
 * Negative means already expired.
 */
export function passwordExpiresInDays(passwordChangedAt: Date): number {
  const expiresAt = new Date(passwordChangedAt);
  expiresAt.setDate(expiresAt.getDate() + POLICY.expiryDays);
  return Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export { POLICY as passwordPolicy };
