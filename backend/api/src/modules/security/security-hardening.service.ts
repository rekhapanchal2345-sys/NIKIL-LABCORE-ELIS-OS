/**
 * 🛡️ PRODUCTION SECURITY HARDENING & OWASP COMPLIANCE SERVICE
 * 
 * Comprehensive defensive security controls:
 * - Magic bytes file signature inspection (PNG, JPEG, PDF)
 * - Safe path resolution & directory traversal prevention
 * - SSRF egress protection & private IP range blocking
 * - In-memory O(1) JWT revocation & blacklist engine
 * - Enterprise password policy enforcement
 * - Recursive input sanitization & XSS/SQLi payload detection
 */

import path from "path";
import crypto from "crypto";
import { URL } from "url";

// ============================================================================
// 1. FILE UPLOAD & MAGIC BYTES SIGNATURE VALIDATOR
// ============================================================================

export type SupportedMimeType = "image/png" | "image/jpeg" | "application/pdf";

export class MagicBytesValidator {
  /**
   * Verify buffer contents against canonical file signatures (magic numbers).
   * Prevents malicious executables disguised with fake image/PDF extensions.
   */
  static validate(buffer: Buffer, expectedType: SupportedMimeType): boolean {
    if (!buffer || buffer.length < 4) return false;

    // Check for obvious dangerous file headers regardless of expected type
    if (this.isExecutableOrScript(buffer)) {
      return false;
    }

    switch (expectedType) {
      case "image/png":
        // PNG Magic Bytes: 89 50 4E 47 0D 0A 1A 0A
        if (buffer.length < 8) return false;
        return (
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 && // P
          buffer[2] === 0x4e && // N
          buffer[3] === 0x47 && // G
          buffer[4] === 0x0d &&
          buffer[5] === 0x0a &&
          buffer[6] === 0x1a &&
          buffer[7] === 0x0a
        );

      case "image/jpeg":
        // JPEG Magic Bytes: FF D8 FF
        return (
          buffer[0] === 0xff &&
          buffer[1] === 0xd8 &&
          buffer[2] === 0xff
        );

      case "application/pdf":
        // PDF Magic Bytes: 25 50 44 46 (%PDF)
        return (
          buffer[0] === 0x25 && // %
          buffer[1] === 0x50 && // P
          buffer[2] === 0x44 && // D
          buffer[3] === 0x46    // F
        );

      default:
        return false;
    }
  }

  /**
   * Detects Windows PE / Linux ELF executables or raw script tags
   */
  static isExecutableOrScript(buffer: Buffer): boolean {
    if (buffer.length < 2) return false;

    // Windows PE executable (MZ)
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return true;
    }

    // Linux ELF binary (0x7F 'E' 'L' 'F')
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x7f &&
      buffer[1] === 0x45 &&
      buffer[2] === 0x4c &&
      buffer[3] === 0x46
    ) {
      return true;
    }

    // Java / Mach-O class magic (CA FE BA BE)
    if (
      buffer.length >= 4 &&
      buffer[0] === 0xca &&
      buffer[1] === 0xfe &&
      buffer[2] === 0xba &&
      buffer[3] === 0xbe
    ) {
      return true;
    }

    // Check header slice for script tags
    const headerString = buffer.slice(0, 128).toString("utf8").toLowerCase();
    if (headerString.includes("<script") || headerString.includes("<?php")) {
      return true;
    }

    return false;
  }
}

// ============================================================================
// 2. PATH TRAVERSAL DEFENSE & SAFE RESOLUTION
// ============================================================================

export class PathTraversalSanitizer {
  /**
   * Sanitizes a user-supplied filename, stripping dangerous characters,
   * directory traversal sequences (`..`), null bytes, and path separators.
   */
  static sanitizeFileName(fileName: string): string {
    if (!fileName) return `file_${Date.now()}`;

    let clean = fileName.trim();

    // Remove null bytes
    clean = clean.replace(/\0/g, "");

    // Strip directory traversal patterns
    clean = clean.replace(/\.\.[\/\\]/g, "");

    // Extract only basename
    clean = path.basename(clean);

    // Remove non-alphanumeric characters except safe dots, dashes, underscores
    clean = clean.replace(/[^a-zA-Z0-9.\-_]/g, "_");

    // Prevent hidden files starting with dot
    clean = clean.replace(/^\.+/, "");

    return clean || `file_${Date.now()}`;
  }

  /**
   * Validates whether user-requested target path is strictly confined within baseDir.
   */
  static isSafePath(baseDir: string, userPath: string): boolean {
    const resolvedBase = path.resolve(baseDir);
    const resolvedTarget = path.resolve(baseDir, userPath);

    return (
      resolvedTarget === resolvedBase ||
      resolvedTarget.startsWith(resolvedBase + path.sep)
    );
  }

  /**
   * Safely resolves a path or throws an error if traversal is attempted.
   */
  static safePathResolve(baseDir: string, userPath: string): string {
    if (!this.isSafePath(baseDir, userPath)) {
      throw new Error(`SECURITY EXCEPTION: Path traversal attempt detected outside base directory.`);
    }
    return path.resolve(baseDir, userPath);
  }
}

// ============================================================================
// 3. SSRF (SERVER-SIDE REQUEST FORGERY) EGRESS GUARD
// ============================================================================

export class SsrfGuard {
  private static PRIVATE_IP_PATTERNS = [
    /^127\./,                          // Loopback (127.0.0.0/8)
    /^10\./,                           // Private Class A (10.0.0.0/8)
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B (172.16.0.0/12)
    /^192\.168\./,                     // Private Class C (192.168.0.0/16)
    /^169\.254\./,                     // Link-Local / Cloud Metadata (169.254.0.0/16)
    /^0\./,                            // Current network
    /^fc00:/i,                         // IPv6 Unique Local
    /^fe80:/i,                         // IPv6 Link-Local
    /^::1$/,                           // IPv6 Loopback
  ];

  /**
   * Evaluates whether an IP address belongs to internal / reserved IP space.
   */
  static isPrivateOrReservedIp(ip: string): boolean {
    const cleanIp = (ip || "").trim().toLowerCase();
    if (cleanIp === "localhost" || cleanIp === "127.0.0.1" || cleanIp === "::1") {
      return true;
    }
    return this.PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(cleanIp));
  }

  /**
   * Validates external webhook URLs (for WhatsApp Cloud API, SMS gateways, ABDM).
   * Rejects loopback, private ranges, file:// schemes, and cloud metadata IPs.
   */
  static isSafeWebhookUrl(urlStr: string): { isSafe: boolean; reason?: string } {
    try {
      const parsed = new URL(urlStr);

      // Only HTTP and HTTPS permitted
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return { isSafe: false, reason: `Disallowed protocol: ${parsed.protocol}` };
      }

      const hostname = parsed.hostname.toLowerCase();

      // Block localhost by name
      if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
        return { isSafe: false, reason: "Localhost and internal hostnames are prohibited." };
      }

      // Check for private / link-local / metadata IP addresses
      if (this.isPrivateOrReservedIp(hostname)) {
        return { isSafe: false, reason: "Target resolves to private or metadata IP range." };
      }

      // In production, force HTTPS for external webhooks
      if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
        return { isSafe: false, reason: "HTTPS is strictly required for production webhooks." };
      }

      return { isSafe: true };
    } catch {
      return { isSafe: false, reason: "Malformed URL syntax." };
    }
  }
}

// ============================================================================
// 4. JWT TOKEN REVOCATION & BLACKLIST ENGINE (O(1) Memory Index)
// ============================================================================

interface RevokedTokenEntry {
  revokedAt: number;
  expiresAt: number;
}

export class TokenBlacklistService {
  private static blacklist: Map<string, RevokedTokenEntry> = new Map();

  /**
   * Computes a uniform token fingerprint (SHA-256) so we don't store raw JWTs.
   */
  private static hashToken(tokenOrJti: string): string {
    return crypto.createHash("sha256").update(tokenOrJti).digest("hex");
  }

  /**
   * Revoke a token (on user sign-out, session invalidation, or security alert).
   */
  static revokeToken(tokenOrJti: string, expiresAtMs: number): void {
    if (!tokenOrJti) return;
    const tokenHash = this.hashToken(tokenOrJti);
    this.blacklist.set(tokenHash, {
      revokedAt: Date.now(),
      expiresAt: expiresAtMs,
    });
  }

  /**
   * Checks whether a token or JTI is blacklisted.
   */
  static isTokenRevoked(tokenOrJti: string): boolean {
    if (!tokenOrJti) return false;
    const tokenHash = this.hashToken(tokenOrJti);
    const entry = this.blacklist.get(tokenHash);
    if (!entry) return false;

    // If token has naturally expired past its TTL, it can be considered pruned
    if (Date.now() > entry.expiresAt) {
      this.blacklist.delete(tokenHash);
      return false;
    }

    return true;
  }

  /**
   * Prunes naturally expired tokens from memory to prevent memory leaks.
   */
  static pruneExpiredTokens(): number {
    const now = Date.now();
    let prunedCount = 0;
    for (const [hash, entry] of this.blacklist.entries()) {
      if (now > entry.expiresAt) {
        this.blacklist.delete(hash);
        prunedCount++;
      }
    }
    return prunedCount;
  }

  /**
   * Returns current active blacklist size.
   */
  static getRevokedCount(): number {
    this.pruneExpiredTokens();
    return this.blacklist.size;
  }

  /**
   * Clears blacklist (for testing suites).
   */
  static clear(): void {
    this.blacklist.clear();
  }
}

// ============================================================================
// 5. ENTERPRISE PASSWORD COMPLEXITY POLICY
// ============================================================================

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  errors: string[];
}

export class PasswordSecurityPolicy {
  private static COMMON_PASSWORDS = new Set([
    "password", "password123", "admin123", "12345678", "qwerty123",
    "hospital123", "labcore123", "welcome1", "doctor123",
  ]);

  static validate(password: string, isPrivilegedRole: boolean = false): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    const minLength = isPrivilegedRole ? 12 : 8;

    if (!password || password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters in length.`);
    } else {
      score++;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter (A-Z).");
    } else {
      score++;
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter (a-z).");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one digit (0-9).");
    } else {
      score++;
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push("Password must contain at least one special character (!@#$%^&*...).");
    } else {
      score++;
    }

    if (this.COMMON_PASSWORDS.has(password.toLowerCase())) {
      errors.push("Password is too common and easily guessable.");
      score = Math.max(0, score - 2);
    }

    return {
      isValid: errors.length === 0,
      score,
      errors,
    };
  }
}

// ============================================================================
// 6. DEEP INPUT SANITIZATION & ANOMALY DETECTION
// ============================================================================

export class InputSanitizer {
  private static DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript\s*:/gi,
    /onerror\s*=/gi,
    /onload\s*=/gi,
    /onclick\s*=/gi,
    /\b(union\s+select|insert\s+into|drop\s+table|delete\s+from|update\s+\w+\s+set)\b/gi,
  ];

  /**
   * Recursively audits any object, string, or array for malicious script or SQL fragments.
   */
  static auditPayload(input: any): { isClean: boolean; violations: string[] } {
    const violations: string[] = [];

    const inspect = (val: any, currentPath: string) => {
      if (typeof val === "string") {
        for (const pattern of this.DANGEROUS_PATTERNS) {
          if (pattern.test(val)) {
            violations.push(`Malicious injection pattern detected at property '${currentPath}': "${val.slice(0, 40)}..."`);
          }
        }
      } else if (Array.isArray(val)) {
        val.forEach((item, idx) => inspect(item, `${currentPath}[${idx}]`));
      } else if (val && typeof val === "object") {
        for (const [key, nested] of Object.entries(val)) {
          // Detect MongoDB-style operator injection (e.g. { "$gt": "" })
          if (key.startsWith("$")) {
            violations.push(`Forbidden operator key injection: '${key}' at '${currentPath}'`);
          }
          inspect(nested, currentPath ? `${currentPath}.${key}` : key);
        }
      }
    };

    inspect(input, "");
    return {
      isClean: violations.length === 0,
      violations,
    };
  }
}
