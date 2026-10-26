/**
 * Domain Test Suite: Authentication, Security & Cryptography
 */

import { describe, it, expect } from "./framework";
import { hashPassword, comparePassword } from "../api/src/utils/password";
import {
  PasswordSecurityPolicy,
  TokenBlacklistService,
  MagicBytesValidator,
  PathTraversalSanitizer,
  SsrfGuard,
} from "../api/src/modules/security/security-hardening.service";

export function registerAuthTests(): void {
  describe("Authentication, Cryptography & OWASP Security", () => {
    it("should hash and verify passwords using Bcrypt with correct salt rounds", async () => {
      const rawPassword = "HospitalSecure@2026!";
      const hash = await hashPassword(rawPassword);

      expect(typeof hash).toBe("string");
      expect(hash.startsWith("$2")).toBeTruthy();

      const isValid = await comparePassword(rawPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword("WrongPassword123!", hash);
      expect(isInvalid).toBe(false);
    });

    it("should enforce enterprise password security policy (12+ chars, complexity)", () => {
      // Short password rejected for privileged role
      const shortRes = PasswordSecurityPolicy.validate("Short1!", true);
      expect(shortRes.isValid).toBe(false);
      expect(shortRes.errors.some((e) => e.includes("at least 12 characters"))).toBe(true);

      // Common dictionary password rejected
      const dictRes = PasswordSecurityPolicy.validate("password123", false);
      expect(dictRes.isValid).toBe(false);

      // Strong compliant password accepted
      const strongRes = PasswordSecurityPolicy.validate("NablLabSecure#2026", true);
      expect(strongRes.isValid).toBe(true);
      expect(strongRes.errors.length).toBe(0);
    });

    it("should revoke and blacklist JWTs in O(1) time by fingerprint", () => {
      const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-day21-payload";

      expect(TokenBlacklistService.isTokenRevoked(testToken)).toBe(false);

      TokenBlacklistService.revokeToken(testToken, Date.now() + 3600000);
      expect(TokenBlacklistService.isTokenRevoked(testToken)).toBe(true);

      expect(TokenBlacklistService.getRevokedCount() >= 1).toBe(true);
    });

    it("should validate magic bytes binary signatures and reject disguised executables", () => {
      // Valid PNG signature (89 50 4E 47 0D 0A 1A 0A)
      const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const pngValid = MagicBytesValidator.validate(validPng, "image/png");
      expect(pngValid).toBe(true);

      // Valid PDF signature (%PDF)
      const validPdf = Buffer.from("%PDF-1.7\n%Report Data");
      const pdfValid = MagicBytesValidator.validate(validPdf, "application/pdf");
      expect(pdfValid).toBe(true);

      // Disguised Windows PE Executable (MZ header)
      const malwarePe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
      expect(MagicBytesValidator.isExecutableOrScript(malwarePe)).toBe(true);
      expect(MagicBytesValidator.validate(malwarePe, "image/png")).toBe(false);
    });

    it("should sanitize path traversal attempts and neutralize null bytes", () => {
      const dangerousInput = "../../../etc/passwd\0.png";
      const sanitized = PathTraversalSanitizer.sanitizeFileName(dangerousInput);

      expect(sanitized.includes("..")).toBe(false);
      expect(sanitized.includes("\0")).toBe(false);
      expect(sanitized.includes("/")).toBe(false);
    });

    it("should block SSRF egress to loopback, private networks and cloud metadata", () => {
      // Loopback is private/reserved
      expect(SsrfGuard.isPrivateOrReservedIp("127.0.0.1")).toBe(true);
      expect(SsrfGuard.isPrivateOrReservedIp("127.0.0.2")).toBe(true);

      // AWS/GCP Metadata IP is private/reserved
      expect(SsrfGuard.isPrivateOrReservedIp("169.254.169.254")).toBe(true);

      // RFC 1918 Private networks are private/reserved
      expect(SsrfGuard.isPrivateOrReservedIp("10.0.1.5")).toBe(true);
      expect(SsrfGuard.isPrivateOrReservedIp("192.168.1.1")).toBe(true);
      expect(SsrfGuard.isPrivateOrReservedIp("172.16.0.1")).toBe(true);

      // Public external IP is NOT private/reserved
      expect(SsrfGuard.isPrivateOrReservedIp("8.8.8.8")).toBe(false);
    });
  });
}
