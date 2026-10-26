/**
 * ==============================================================================
 * LabCore ELIS OS — Enterprise Structured JSON Logger
 * Formats all application logs in structured JSON for cloud observability
 * (Datadog, OpenTelemetry, ELK, CloudWatch, Loki) with correlation ID tracking.
 * Complies with DPDP Act 2023 & NABL ISO 15189:2022 privacy logging standards.
 * ==============================================================================
 */

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class StructuredLogger {
  private currentLogLevel: LogLevel = "INFO";
  private readonly levelWeights: Record<LogLevel, number> = {
    DEBUG: 10,
    INFO: 20,
    WARN: 30,
    ERROR: 40,
    FATAL: 50,
  };

  constructor() {
    const envLevel = (process.env.LOG_LEVEL || "INFO").toUpperCase() as LogLevel;
    if (this.levelWeights[envLevel]) {
      this.currentLogLevel = envLevel;
    }
  }

  public setLogLevel(level: LogLevel): void {
    if (this.levelWeights[level]) {
      this.currentLogLevel = level;
    }
  }

  public getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelWeights[level] >= this.levelWeights[this.currentLogLevel];
  }

  /**
   * Redacts sensitive medical PHI and financial credentials before logging
   */
  private sanitizeMetadata(meta?: Record<string, any>): Record<string, any> | undefined {
    if (!meta || typeof meta !== "object") return undefined;

    const SENSITIVE_KEYS = [
      "password",
      "passwordhash",
      "token",
      "accesstoken",
      "refreshtoken",
      "authorization",
      "secret",
      "aadhaar",
      "aadhaarnumber",
      "nationalid",
      "pan",
      "cvv",
      "cardnumber",
      "key",
      "fieldencryptionkey",
    ];

    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(meta)) {
      const lower = k.toLowerCase().replace(/[-_]/g, "");
      if (SENSITIVE_KEYS.includes(lower)) {
        clean[k] = "[REDACTED_BY_DPDP_POLICY]";
      } else if (v && typeof v === "object" && !Array.isArray(v)) {
        clean[k] = this.sanitizeMetadata(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }

  private emit(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const serialized = JSON.stringify(entry);
    if (entry.level === "ERROR" || entry.level === "FATAL") {
      process.stderr.write(serialized + "\n");
    } else {
      process.stdout.write(serialized + "\n");
    }
  }

  public debug(message: string, context: string = "App", metadata?: Record<string, any>, correlationId?: string): void {
    this.emit({
      timestamp: new Date().toISOString(),
      level: "DEBUG",
      context,
      message,
      correlationId,
      metadata: this.sanitizeMetadata(metadata),
    });
  }

  public info(message: string, context: string = "App", metadata?: Record<string, any>, correlationId?: string): void {
    this.emit({
      timestamp: new Date().toISOString(),
      level: "INFO",
      context,
      message,
      correlationId,
      metadata: this.sanitizeMetadata(metadata),
    });
  }

  public warn(message: string, context: string = "App", metadata?: Record<string, any>, correlationId?: string): void {
    this.emit({
      timestamp: new Date().toISOString(),
      level: "WARN",
      context,
      message,
      correlationId,
      metadata: this.sanitizeMetadata(metadata),
    });
  }

  public error(
    message: string,
    err?: any,
    context: string = "App",
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    const errorPayload = err instanceof Error ? {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    } : typeof err === "string" ? {
      name: "Error",
      message: err,
    } : undefined;

    this.emit({
      timestamp: new Date().toISOString(),
      level: "ERROR",
      context,
      message,
      correlationId,
      metadata: this.sanitizeMetadata(metadata),
      error: errorPayload,
    });
  }

  public fatal(
    message: string,
    err?: any,
    context: string = "App",
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    const errorPayload = err instanceof Error ? {
      name: err.name,
      message: err.message,
      stack: err.stack,
    } : typeof err === "string" ? {
      name: "FatalError",
      message: err,
    } : undefined;

    this.emit({
      timestamp: new Date().toISOString(),
      level: "FATAL",
      context,
      message,
      correlationId,
      metadata: this.sanitizeMetadata(metadata),
      error: errorPayload,
    });
  }
}

export const logger = new StructuredLogger();

/**
 * Express Middleware for Request Correlation Tracking & Structured Access Logging
 */
export function requestCorrelationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers["x-request-id"] as string) || `req-${crypto.randomUUID()}`;
  (req as any).correlationId = correlationId;
  res.setHeader("X-Request-ID", correlationId);

  const start = performance.now();

  res.on("finish", () => {
    // Strip query strings to protect patient search terms
    const rawPath = req.originalUrl || req.url || "";
    const safePath = rawPath.split("?")[0];
    const durationMs = Math.round((performance.now() - start) * 100) / 100;

    // Do not flood logs with health probe checks unless in debug mode
    if (safePath.startsWith("/health") || safePath.startsWith("/api/health")) {
      if (logger.getLogLevel() !== "DEBUG") return;
    }

    const msg = `${req.method} ${safePath} ${res.statusCode} in ${durationMs}ms`;
    const meta = {
      method: req.method,
      path: safePath,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    };

    if (res.statusCode >= 500) {
      logger.error(msg, undefined, "HTTP", meta, correlationId);
    } else if (res.statusCode >= 400) {
      logger.warn(msg, "HTTP", meta, correlationId);
    } else {
      logger.info(msg, "HTTP", meta, correlationId);
    }
  });

  next();
}
