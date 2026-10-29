import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Global rate limiter: 300 requests per 15 minutes per IP
 */
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      code: "GLOBAL_RATE_LIMIT_EXCEEDED",
      message: "Too many requests from this IP address. Please retry after 15 minutes.",
      retryAfterSeconds: Math.ceil(15 * 60),
    });
  },
});

/**
 * Strict authentication rate limiter: 10 failed/successful attempts per 15 minutes
 * Targets `/api/auth/login`, `/api/auth/mfa/verify`, and OTP issuance endpoints
 */
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown-ip";
    const identifier = String((req.body as any)?.identifier || (req.body as any)?.email || "").toLowerCase();
    return identifier ? `${ip}:${identifier}` : ip;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      message: "Too many login attempts from this credential or IP. Account access throttled for 15 minutes.",
      retryAfterSeconds: Math.ceil(15 * 60),
    });
  },
});

/**
 * Sensitive Report / Patient PHI Export rate limiter: 40 requests per 5 minutes
 */
export const reportDownloadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      code: "EXPORT_RATE_LIMIT_EXCEEDED",
      message: "Export / report download frequency cap reached. Please wait 5 minutes before batch downloading.",
      retryAfterSeconds: Math.ceil(5 * 60),
    });
  },
});

/**
 * Fast search query rate limiter: 60 queries per minute
 */
export const searchQueryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      code: "SEARCH_RATE_LIMIT_EXCEEDED",
      message: "Search query throttling threshold triggered. Please pause for 60 seconds.",
      retryAfterSeconds: 60,
    });
  },
});
