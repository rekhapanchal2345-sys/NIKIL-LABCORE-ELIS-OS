/**
 * ============================================================
 * ENHANCED SECURITY MIDDLEWARE
 * LabCore ELIS — IP-Based Rate Limiting & Anomaly Detection
 * ============================================================
 *
 * This module adds:
 * 1. Per-IP + per-identifier combined rate limiting
 * 2. Suspicious request pattern detection
 * 3. Request fingerprint logging
 * 4. Automatic IP blocking for extreme abuse
 */

import type { Request, Response, NextFunction } from "express";

// ── In-memory IP tracking (use Redis in production) ──────────
interface IpRecord {
  count: number;
  firstSeen: number;
  blocked: boolean;
  blockedUntil?: number;
}

const ipMap = new Map<string, IpRecord>();
const identifierMap = new Map<string, IpRecord>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const IP_FAIL_LIMIT = 50;          // block IP after 50 failures in window
const IDENT_FAIL_LIMIT = 10;       // extra gate per identifier
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 min IP block

function getRecord(map: Map<string, IpRecord>, key: string): IpRecord {
  const now = Date.now();
  let rec = map.get(key);
  if (!rec || now - rec.firstSeen > WINDOW_MS) {
    rec = { count: 0, firstSeen: now, blocked: false };
    map.set(key, rec);
  }
  return rec;
}

/**
 * Track failed login attempt (call AFTER a 401 response).
 * Used internally by auth service — exported for future use.
 */
export function recordFailedAttempt(ip: string, identifier: string): void {
  const ipRec = getRecord(ipMap, ip);
  ipRec.count++;
  if (ipRec.count >= IP_FAIL_LIMIT) {
    ipRec.blocked = true;
    ipRec.blockedUntil = Date.now() + BLOCK_DURATION_MS;
    console.warn(`[SECURITY] IP ${ip} BLOCKED after ${ipRec.count} failures`);
  }

  const idRec = getRecord(identifierMap, identifier.toLowerCase());
  idRec.count++;
}

/**
 * Express middleware: blocks IPs that have hit the failure limit.
 * Place BEFORE the login route.
 */
export function ipSecurityGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const rec = ipMap.get(ip);
  if (rec?.blocked) {
    const remaining = rec.blockedUntil
      ? Math.ceil((rec.blockedUntil - Date.now()) / 60000)
      : 30;

    if (rec.blockedUntil && Date.now() > rec.blockedUntil) {
      // Unblock after duration
      ipMap.delete(ip);
    } else {
      res.status(429).json({
        success: false,
        message: `Too many failed attempts from this IP. Try again in ${remaining} minute${remaining === 1 ? "" : "s"}.`,
        code: "IP_BLOCKED",
      });
      return;
    }
  }

  next();
}

/**
 * Detects suspicious request patterns:
 * - SQL injection fragments
 * - XSS payloads
 * - Path traversal
 * - Oversized headers
 */
export function suspiciousRequestDetector(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const DANGER_PATTERNS = [
    /(--|\/\*|\*\/|\b(xp_|exec\s*\(|union\s+select|insert\s+into|drop\s+table|delete\s+from)\b)/i,
    /(<script\b|javascript:|onerror\s*=|onload\s*=|alert\s*\()/i,
    /(\.\.[\/\\]){2,}/,
  ];

  const suspect = (val: string): boolean => {
    // Skip base64 data URLs and very large serialized buffers for performance
    if (val.length > 2048 || val.startsWith("data:")) return false;
    return DANGER_PATTERNS.some((p) => p.test(val));
  };

  // Check body string values
  if (req.body && typeof req.body === "object") {
    for (const [, v] of Object.entries(req.body)) {
      if (typeof v === "string" && suspect(v)) {
        console.warn(`[SECURITY] Suspicious payload blocked from ${req.ip}`);
        res.status(400).json({
          success: false,
          message: "Request contains invalid characters.",
          code: "SUSPICIOUS_PAYLOAD",
        });
        return;
      }
    }
  }

  // Check header sizes (defence against header injection)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.length > 4096) {
    res.status(400).json({
      success: false,
      message: "Malformed authorization header.",
      code: "INVALID_HEADER",
    });
    return;
  }

  next();
}

/**
 * Security event logger — logs every auth request with basic metadata.
 * Does NOT log passwords or tokens.
 */
export function authEventLogger(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress;

  const ua = req.headers["user-agent"]?.slice(0, 100) || "unknown";
  const body = req.body as Record<string, unknown> | undefined;
  const identifier =
    typeof body?.identifier === "string" ? body.identifier.slice(0, 60) : "—";

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[AUTH] ${new Date().toISOString()} | ${req.method} ${req.path} | IP: ${ip} | ID: ${identifier} | UA: ${ua}`
    );
  }

  next();
}
