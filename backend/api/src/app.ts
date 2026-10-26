import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import fs from "fs";

// =======================================================
// ROUTES
// =======================================================

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import patientRoutes from "./modules/patients/patient.routes";
import doctorRoutes from "./modules/doctors/doctor.routes";
import testRoutes from "./modules/tests/test.routes";
import orderRoutes from "./modules/orders/order.routes";
import sampleRoutes from "./modules/samples/sample.routes";
import invoiceRoutes from "./modules/invoices/invoice.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import advanceRoutes from "./modules/advances/advance.routes";
import refundRoutes from "./modules/refunds/refund.routes";
import cashCounterRoutes from "./modules/cash-counter/cash-counter.routes";
import settlementRoutes from "./modules/settlements/settlement.routes";
import receivableRoutes from "./modules/receivables/receivable.routes";
import resultRoutes from "./modules/results/result.routes";
import approvalRoutes from "./modules/approvals/approval.routes";
import reportRoutes from "./modules/reports/report.routes";
import analyzerRoutes from "./modules/analyzers/analyzer.routes";
import auditRoutes from "./modules/audit/audit.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import communicationRoutes from "./modules/communications/communication.routes";
import whatsappAdvancedRoutes from "./modules/communications/whatsapp-advanced.routes";
import laboratorySettingsRoutes from "./modules/settings/laboratory-settings.routes";
import notificationTemplateRoutes from "./modules/notifications/notification-template.routes";
import backupRoutes from "./modules/backup/backup.routes";
import barcodeRoutes from "./modules/barcode/barcode.routes";
import abdmRoutes, { abdmWebhookRouter } from "./modules/abdm/abdm.routes";
import receiptRoutes from "./modules/receipts/receipt.routes";
import aiRoutes from "./modules/ai/ai.routes";
import scimRoutes from "./modules/auth/scim.routes";
import { oauthTokenHandler } from "./modules/auth/m2m-gateway.controller";
import digitalTwinRoutes from "./modules/digital-twin/digital-twin.routes";
import nexusRoutes from "./modules/nexus/nexus.routes";
import enterpriseWorkflowsRoutes from "./modules/enterprise-workflows/enterprise-workflows.routes";
import enterpriseTier2Routes from "./modules/enterprise-workflows-tier2/enterprise-tier2.routes";
import branchRoutes from "./modules/branches/branch.routes";
import searchRoutes from "./modules/search/search.routes";
import cacheRoutes from "./modules/cache/cache.routes";
import healthRoutes from "./modules/health/health.routes";
import { requestCorrelationMiddleware } from "./lib/logger.service";

// =======================================================
// MIDDLEWARE
// =======================================================

import { errorMiddleware } from "../middleware/error.middleware";
import {
  ipSecurityGuard,
  suspiciousRequestDetector,
  authEventLogger,
} from "../middleware/security.middleware";
import {
  strictAuthLimiter,
  globalApiLimiter,
  reportDownloadLimiter,
  searchQueryLimiter,
} from "./modules/security/rate-limiters";

// =======================================================
// EXPRESS APPLICATION
// =======================================================

const app = express();

// Only trust the configured number of reverse proxies (0 by default) so that
// req.ip and rate limiting cannot be spoofed with X-Forwarded-For.
app.set(
  "trust proxy",
  Number(process.env.TRUST_PROXY_HOPS || 0) || false
);

// =======================================================
// SECURITY
// =======================================================

app.use(
  helmet({
    // The API serves JSON and never a document, so a restrictive policy costs
    // nothing and removes any chance of content being rendered as a page.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    // Only meaningful over TLS, and only safe to send once TLS is guaranteed.
    // Sending it in development would pin a browser to HTTPS for localhost.
    hsts:
      process.env.NODE_ENV === "production"
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    // The bearer token travels in a header, so it must never reach a
    // third-party origin through a Referer.
    referrerPolicy: { policy: "no-referrer" },
    crossOriginResourcePolicy: { policy: "same-site" },
  }) as any
);

/**
 * No response may be stored by a browser, a proxy or the back/forward cache.
 *
 * A cached authenticated response stays readable after sign-out and can be
 * shown to the next person who opens the machine, which is the normal state of
 * a shared laboratory workstation.
 */
app.use((_req: Request, res: Response, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// =======================================================
// CORS
// =======================================================

const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, "");

const allowedOrigins = new Set(
  String(process.env.CORS_ORIGINS || "")
    .split(",")
    .filter(Boolean)
    .map(normalizeOrigin)
);

const LOCAL_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|(192\.168|10)\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d{1,5})?$/;

const isAllowedOrigin = (origin: string): boolean =>
  allowedOrigins.has(normalizeOrigin(origin)) ||
  (process.env.NODE_ENV !== "production" && LOCAL_ORIGIN.test(origin));

app.use(
  cors({
    origin(origin, callback) {
      // No origin: same-origin navigation, curl, mobile and server-to-server calls.
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      // Without CORS headers the browser blocks the call; no server error.
      return callback(null, false);
    },
    credentials: true,
  })
);

// =======================================================
// GLOBAL SECURITY GUARDS
// =======================================================

// Block IPs that have exceeded failure limits
app.use("/api/auth", ipSecurityGuard);

// Detect SQL injection, XSS and path traversal payloads
app.use("/api", suspiciousRequestDetector);

// Rate Limiting (OWASP A04/A07 Brute-Force & Denial of Service Defense)
app.use("/api/auth", strictAuthLimiter);
app.use("/api/reports/download", reportDownloadLimiter);
app.use("/api/search", searchQueryLimiter);
app.use("/api", globalApiLimiter);

// =======================================================
// REQUEST BODY
// =======================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use((req: Request, _res: Response, next) => {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      if (parts.length >= 2) {
        cookies[parts[0].trim()] = decodeURIComponent(parts.slice(1).join("=").trim());
      }
    });
    (req as any).cookies = cookies;
  } else {
    (req as any).cookies = {};
  }
  next();
});

// =======================================================
// HTTP LOGGER
// =======================================================

/**
 * The URL is logged without its query string.
 *
 * Search endpoints accept patient names, UHIDs, phone numbers and order numbers
 * as query parameters, so a default log line writes identifiers into a log file
 * that is typically kept far longer than the clinical record itself and is
 * rarely covered by the same access controls as the database.
 */
morgan.token("safe-url", (req) => {
  const path = (req as Request).originalUrl || req.url || "";
  const queryAt = path.indexOf("?");
  return queryAt === -1 ? path : path.slice(0, queryAt);
});

if (process.env.NODE_ENV !== "test") {
  // Neither format writes request headers, so the bearer token is not logged.
  app.use(
    morgan(
      process.env.NODE_ENV === "production"
        ? // No colours, and no query string.
        ":method :safe-url :status :response-time ms - :res[content-length]"
        : "dev"
    )
  );
}

// =======================================================
// STATIC FILE UPLOADS (Signatures, Documents, Reports)
// =======================================================
const uploadsPath = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));

// =======================================================
// ROOT & HEALTH CHECK
// =======================================================

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "LabCore ELIS API is running",
    service: "LabCore Enterprise Laboratory Information System",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// HEALTH & OBSERVABILITY MULTI-PROBE TELEMETRY
// =======================================================

app.use("/api/health", healthRoutes);
app.use("/health", healthRoutes);
app.use("/api/v1/health", healthRoutes);

// =======================================================
// API ROOT
// =======================================================

app.get("/api", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to LabCore ELIS API",
    version: "1.0.0",

    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      patients: "/api/patients",
      doctors: "/api/doctors",
      tests: "/api/tests",
      orders: "/api/orders",
      samples: "/api/samples",
      invoices: "/api/invoices",
      payments: "/api/payments",
      advances: "/api/advances",
      refunds: "/api/refunds",
      "cash-counter": "/api/cash-counter",
      settlements: "/api/settlements",
      receivables: "/api/receivables",
      results: "/api/results",
      approvals: "/api/approvals",
      reports: "/api/reports",
      analyzers: "/api/analyzers",
      audit: "/api/audit",
      dashboard: "/api/dashboard",
      communications: "/api/communications",
      settings: "/api/settings/laboratory",
      notifications: "/api/notifications/templates",
      backups: "/api/backups",
      barcodes: "/api/barcodes",
      ai: "/api/ai",
      receipts: "/api/receipts",
    },
  });
});

// =======================================================
// AUTH
// =======================================================

// Log every auth attempt (identifier only — never passwords/tokens)
app.use("/api/auth", authEventLogger);

app.use("/api/auth", authRoutes);
app.use("/scim/v2", scimRoutes);
app.post("/oauth/v2/token", oauthTokenHandler);

// =======================================================
// USERS
// =======================================================

app.use("/api/users", userRoutes);

// =======================================================
// PATIENTS
// =======================================================

app.use("/api/patients", patientRoutes);

// =======================================================
// DOCTORS
// =======================================================

app.use("/api/doctors", doctorRoutes);
app.use("/api/v1/doctor-module", doctorRoutes);
app.use("/api/v1/doctors", doctorRoutes);

// =======================================================
// TESTS
// =======================================================

app.use("/api/tests", testRoutes);

// =======================================================
// ORDERS
// =======================================================

app.use("/api/orders", orderRoutes);

// =======================================================
// SAMPLES
// =======================================================

app.use("/api/samples", sampleRoutes);

// =======================================================
// INVOICES
// =======================================================

app.use("/api/invoices", invoiceRoutes);

// =======================================================
// PAYMENTS
// =======================================================

app.use("/api/payments", paymentRoutes);

// =======================================================
// ADVANCES & WALLET
// =======================================================

app.use("/api/advances", advanceRoutes);

// =======================================================
// REFUNDS
// =======================================================

app.use("/api/refunds", refundRoutes);

// =======================================================
// CASH COUNTER
// =======================================================

app.use("/api/cash-counter", cashCounterRoutes);

// =======================================================
// SETTLEMENTS & RECONCILIATION
// =======================================================

app.use("/api/settlements", settlementRoutes);

// =======================================================
// RECEIVABLES & CORPORATE BILLING
// =======================================================

app.use("/api/receivables", receivableRoutes);

// =======================================================
// RESULTS
// =======================================================

app.use("/api/results", resultRoutes);

// =======================================================
// APPROVALS
// =======================================================

app.use("/api/approvals", approvalRoutes);

// =======================================================
// REPORTS
// =======================================================

app.use("/api/reports", reportRoutes);

// =======================================================
// ANALYZERS
// ASTM / HL7
// =======================================================

app.use("/api/analyzers", analyzerRoutes);

// =======================================================
// AUDIT
// =======================================================

app.use("/api/audit", auditRoutes);

// =======================================================
// DASHBOARD
// =======================================================

app.use("/api/dashboard", dashboardRoutes);


// =======================================================
// COMMUNICATIONS
// =======================================================

app.use("/api/communications", communicationRoutes);
app.use("/api/whatsapp", whatsappAdvancedRoutes);

// =======================================================
// SETTINGS
// =======================================================

app.use("/api/settings/laboratory", laboratorySettingsRoutes);
app.use("/api/laboratory-settings", laboratorySettingsRoutes);

// =======================================================
// NOTIFICATION TEMPLATES
// =======================================================

app.use("/api/notifications/templates", notificationTemplateRoutes);

// =======================================================
// BACKUP & RESTORE
// =======================================================

app.use("/api/backups", backupRoutes);

// =======================================================
// BARCODES
// =======================================================

app.use("/api/barcodes", barcodeRoutes);
app.use("/api/barcode", barcodeRoutes);

// =======================================================
// RECEIPTS
// =======================================================
// ISS-015: Receipt module was fully implemented but had no route file or mount point
app.use("/api/receipts", receiptRoutes);
app.use("/api/receipt", receiptRoutes);

// =======================================================
// ABDM (Ayushman Bharat Digital Mission)
// =======================================================

app.use("/api/abdm", abdmRoutes);
app.use("/abdm", abdmRoutes);

// ABDM Gateway Webhooks (open endpoint — ABDM Gateway posts here)
app.use("/v0.5", abdmWebhookRouter);
app.use("/api/v0.5", abdmWebhookRouter);         // for Next.js /api/* proxy (simulator)

// =======================================================
// AI STUDIO & CLINICAL MACHINE LEARNING
// =======================================================

app.use("/api/ai", aiRoutes);
app.use("/api/v1/ai-studio", aiRoutes);
app.use("/api/abdm/v0.5", abdmWebhookRouter);

// =======================================================
// =======================================================
// DIGITAL TWIN & SIMULATION ENGINE
// =======================================================

app.use("/api/v1/digital-twin", digitalTwinRoutes);
app.use("/api/digital-twin", digitalTwinRoutes);
app.use("/digital-twin", digitalTwinRoutes);

// =======================================================
// LABCORE OMNISCIENT NEXUS — ENTERPRISE OPERATIONS INTELLIGENCE
// =======================================================

app.use("/api/v1/nexus", nexusRoutes);
app.use("/api/nexus", nexusRoutes);
app.use("/nexus", nexusRoutes);

// =======================================================
// ENTERPRISE CLINICAL WORKFLOWS (TIER 1)
// Standards: NABL ISO 15189:2022, CLSI AUTO10-A, CLSI GP41
// =======================================================

app.use("/api/enterprise", enterpriseWorkflowsRoutes);
app.use("/api/v1/enterprise", enterpriseWorkflowsRoutes);
app.use("/api/enterprise-workflows", enterpriseWorkflowsRoutes);
app.use("/enterprise", enterpriseWorkflowsRoutes);

// =======================================================
// ENTERPRISE CLINICAL WORKFLOWS (TIER 2)
// Microbiology & AST, Reagent CPT Engine, B2B Logistics
// =======================================================

app.use("/api/enterprise-tier2", enterpriseTier2Routes);
app.use("/api/v1/enterprise-tier2", enterpriseTier2Routes);
app.use("/enterprise-tier2", enterpriseTier2Routes);

// =======================================================
// BRANCHES & MULTI-TENANCY
// =======================================================
app.use("/api/branches", branchRoutes);
app.use("/api/v1/branches", branchRoutes);

// =======================================================
// GLOBAL SEARCH & COMMAND PALETTE
// =======================================================
app.use("/api/search", searchRoutes);
app.use("/api/v1/search", searchRoutes);

// =======================================================
// CACHE & PERFORMANCE TELEMETRY
// =======================================================
app.use("/api/cache", cacheRoutes);
app.use("/api/v1/cache", cacheRoutes);

// =======================================================
// STATIC ASSETS & SPA FALLBACK (Consolidated Frontend)
// =======================================================
const publicDir = path.resolve(__dirname, "../../../public");
app.use(express.static(publicDir));

app.use((req: Request, res: Response, next) => {
  // Only serve index.html for GET requests that are not API or ABDM webhook routes
  if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/v0.5")) {
    const indexPath = path.join(publicDir, "index.html");
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

// =======================================================
// 404 HANDLER
// =======================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// =======================================================
// GLOBAL ERROR HANDLER
// =======================================================
/**
 * -----------------------------------------
 * GLOBAL ERROR HANDLER
 *
 * IMPORTANT:
 * This must always be the LAST middleware.
 * -----------------------------------------
 */

app.use(errorMiddleware);

// =======================================================
// EXPORT
// =======================================================

export default app;