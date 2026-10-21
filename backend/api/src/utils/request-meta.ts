import type { Request } from "express";
import crypto from "crypto";

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function getDeviceFingerprint(req: Request): string {
  const header = req.headers["x-device-fingerprint"];
  if (typeof header === "string" && header.length >= 8) {
    return header.slice(0, 128);
  }
  const ua = req.headers["user-agent"] || "unknown";
  return crypto.createHash("sha256").update(`${getClientIp(req)}|${ua}`).digest("hex");
}

/**
 * Express types path/query values as `string | string[]`, but a single URL
 * segment (or a query key the client never repeats) always resolves to one string.
 */
export function pathParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

export function queryParam(req: Request, name: string): string | undefined {
  const value = (req.query as Record<string, unknown>)[name];
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? String(value[0]) : String(value);
}

export function getRequestMeta(req: Request): { ipAddress: string; userAgent: string } {
  return {
    ipAddress: getClientIp(req),
    userAgent: String(req.headers["user-agent"] || ""),
  };
}

