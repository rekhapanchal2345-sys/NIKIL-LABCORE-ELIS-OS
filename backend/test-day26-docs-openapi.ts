/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NIKIL-LABCORE-ELIS-OS — DAY 26 EMPIRICAL VALIDATION SUITE (HOUR 26)
 * ═══════════════════════════════════════════════════════════════════════════
 * Comprehensive empirical test suite validating:
 * 1. Hospital Operational User Manuals Completeness & Content Quality
 * 2. OpenAPI 3.0.3 Specification Syntax & Architecture Integrity
 * 3. 30+ Domain Tag Coverage & Standard Alignments
 * 4. Critical Endpoint & Operation Schema Verification
 * 5. Live Express Documentation Routes & UI Rendering Simulation
 * ═══════════════════════════════════════════════════════════════════════════
 */

import fs from "fs";
import path from "path";
import { OPENAPI_SPECIFICATION } from "./api/src/docs/openapi.spec";
import docsRouter from "./api/src/docs/docs.routes";

let totalAssertions = 0;
let passedAssertions = 0;
let totalSuites = 0;
let passedSuites = 0;
let totalTests = 0;
let passedTests = 0;

function recordAssert(condition: boolean, message: string): void {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
  } else {
    console.error(`  ❌ FAILED ASSERTION: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(name: string, fn: () => Promise<void> | void): Promise<void> {
  totalTests++;
  const start = performance.now();
  try {
    await fn();
    const duration = (performance.now() - start).toFixed(2);
    console.log(`  ✓ ${name} (${duration}ms)`);
    passedTests++;
  } catch (err: any) {
    const duration = (performance.now() - start).toFixed(2);
    console.error(`  ✕ ${name} (${duration}ms)`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function runSuite(title: string, fn: () => Promise<void>): Promise<void> {
  totalSuites++;
  console.log(`\n--- ${title} ---`);
  try {
    await fn();
    passedSuites++;
  } catch (err: any) {
    console.error(`Suite failed: ${title}`, err);
    throw err;
  }
}

// ─── MOCK EXPRESS CONSTRUCTORS ──────────────────────────────────────────────

function createMockReq(url: string, method: string = "GET"): any {
  return {
    url,
    originalUrl: url,
    path: url.split("?")[0],
    method,
    headers: { host: "127.0.0.1:5000" },
    query: {},
    params: {},
    body: {},
  };
}

function createMockRes(): any {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as any,
    _resolve: null as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    json(data: any) {
      this.body = data;
      this.headers["content-type"] = "application/json";
      if (this._resolve) {
        const r = this._resolve;
        this._resolve = null;
        r();
      }
      return this;
    },
    send(content: any) {
      this.body = content;
      if (this._resolve) {
        const r = this._resolve;
        this._resolve = null;
        r();
      }
      return this;
    },
  };
  return res;
}

function dispatchRoute(router: any, req: any, res: any): Promise<void> {
  return new Promise((resolve, reject) => {
    res._resolve = resolve;
    router.handle(req, res, (err: any) => {
      if (err) return reject(err);
      if (res._resolve) {
        res._resolve = null;
        resolve();
      }
    });
  });
}

// ─── MASTER EXECUTION RUNNER ────────────────────────────────────────────────

async function runDay26DocsTestSuite(): Promise<void> {
  console.log("==============================================================================");
  console.log("📚 NIKIL-LABCORE-ELIS-OS — DAY 26 EMPIRICAL DOCS & OPENAPI SUITE (HOUR 26)");
  console.log("==============================================================================");

  const rootDir = path.resolve(__dirname, "..");
  const manualsDir = path.join(rootDir, "docs", "manuals");

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 1: Hospital Operational User Manuals Completeness & Content Audit
  // ──────────────────────────────────────────────────────────────────────────
  await runSuite("Suite 1: Hospital Operational User Manuals Completeness & Content Audit", async () => {
    await runTest("Verify Receptionist & Front Desk Handbook exists with core SOPs", () => {
      const filePath = path.join(manualsDir, "RECEPTIONIST_HANDBOOK.md");
      recordAssert(fs.existsSync(filePath), "RECEPTIONIST_HANDBOOK.md must exist on disk");
      const content = fs.readFileSync(filePath, "utf8");
      recordAssert(content.length > 2500, "Handbook must contain comprehensive detailed content (>2500 chars)");
      recordAssert(content.includes("SOP-LIS-REC-001"), "Must declare formal Document ID");
      recordAssert(content.includes("NABL ISO 15189"), "Must cite NABL ISO 15189 standard");
      recordAssert(content.includes("ABDM") && content.includes("ABHA"), "Must include ABDM ABHA linking SOP");
      recordAssert(content.includes("Soundex phonetic matching"), "Must explain patient deduplication logic");
      recordAssert(content.includes("SAC 999316"), "Must cite Indian GST SAC 999316 diagnostic billing");
      recordAssert(content.includes("₹2000, ₹500, ₹200"), "Must include currency denomination counting SOP");
    });

    await runTest("Verify Phlebotomist & Accessioning Handbook exists with CLSI Order of Draw", () => {
      const filePath = path.join(manualsDir, "PHLEBOTOMIST_HANDBOOK.md");
      recordAssert(fs.existsSync(filePath), "PHLEBOTOMIST_HANDBOOK.md must exist on disk");
      const content = fs.readFileSync(filePath, "utf8");
      recordAssert(content.length > 2500, "Handbook must contain comprehensive detailed content (>2500 chars)");
      recordAssert(content.includes("SOP-LIS-PHLEB-001"), "Must declare formal Document ID");
      recordAssert(content.includes("CLSI GP41-A6"), "Must cite CLSI GP41-A6 Order of Draw standard");
      recordAssert(content.includes("Light Blue") && content.includes("Sodium Citrate"), "Must specify Citrate tube guidelines");
      recordAssert(content.includes("Lavender / Purple") && content.includes("EDTA"), "Must specify EDTA tube guidelines");
      recordAssert(content.includes("Code 128"), "Must specify Code 128 barcode application");
      recordAssert(content.includes("REJ-01: HEMOLYZED"), "Must define specimen rejection criteria codes");
      recordAssert(content.includes("REJ-03: CLOTTED_EDTA"), "Must define micro-clot rejection criteria");
    });

    await runTest("Verify Laboratory Technician Handbook exists with Westgard QC & ASTM TCP", () => {
      const filePath = path.join(manualsDir, "LAB_TECHNICIAN_HANDBOOK.md");
      recordAssert(fs.existsSync(filePath), "LAB_TECHNICIAN_HANDBOOK.md must exist on disk");
      const content = fs.readFileSync(filePath, "utf8");
      recordAssert(content.length > 2500, "Handbook must contain comprehensive detailed content (>2500 chars)");
      recordAssert(content.includes("SOP-LIS-TECH-001"), "Must declare formal Document ID");
      recordAssert(content.includes("Westgard Rules"), "Must detail Westgard QC rules");
      recordAssert(content.includes("1_{3s}") && content.includes("2_{2s}"), "Must detail 1_3s and 2_2s rejection rules");
      recordAssert(content.includes("Port 5005") || content.includes("port 5005"), "Must document TCP port 5005 analyzer listener");
      recordAssert(content.includes("ASTM E1381 / E1394"), "Must document ASTM protocol handling");
      recordAssert(content.includes("Delta Checks"), "Must explain delta check historical validation");
      recordAssert(content.includes("FEFO"), "Must specify First-Expiry-First-Out reagent governance");
    });

    await runTest("Verify Pathologist Workstation Handbook exists with Seal & Clinical AI Copilot", () => {
      const filePath = path.join(manualsDir, "PATHOLOGIST_HANDBOOK.md");
      recordAssert(fs.existsSync(filePath), "PATHOLOGIST_HANDBOOK.md must exist on disk");
      const content = fs.readFileSync(filePath, "utf8");
      recordAssert(content.length > 2500, "Handbook must contain comprehensive detailed content (>2500 chars)");
      recordAssert(content.includes("SOP-LIS-PATH-001"), "Must declare formal Document ID");
      recordAssert(content.includes("NABL ISO 15189:2022 §5.8"), "Must cite reporting compliance section");
      recordAssert(content.includes("CRITICAL PANIC QUEUE"), "Must specify panic triage queue");
      recordAssert(content.includes("Clinical AI Copilot"), "Must detail Gemini AI copilot review");
      recordAssert(content.includes("PII Sanitization Layer"), "Must document DPDP Act PII redaction");
      recordAssert(content.includes("SHA-256 HMAC"), "Must document tamper-evident digital seal");
      recordAssert(content.includes("AMENDED REPORT"), "Must document amendment revision governance");
    });

    await runTest("Verify Administrator Handbook exists with RBAC, Multi-Branch & Automated DR", () => {
      const filePath = path.join(manualsDir, "ADMINISTRATOR_HANDBOOK.md");
      recordAssert(fs.existsSync(filePath), "ADMINISTRATOR_HANDBOOK.md must exist on disk");
      const content = fs.readFileSync(filePath, "utf8");
      recordAssert(content.length > 2500, "Handbook must contain comprehensive detailed content (>2500 chars)");
      recordAssert(content.includes("SOP-LIS-ADM-001"), "Must declare formal Document ID");
      recordAssert(content.includes("SUPER_ADMIN") && content.includes("ACCOUNTANT"), "Must enumerate 7 canonical roles");
      recordAssert(content.includes("Bcrypt 12 + HMAC Pepper"), "Must detail password security mechanism");
      recordAssert(content.includes("Multi-Branch Architecture"), "Must document tenant isolation");
      recordAssert(content.includes("AES-256-GCM") && content.includes("Grandfather-Father-Son"), "Must document GFS backup policy");
      recordAssert(content.includes("/api/health/liveness"), "Must document Kubernetes health probes");
    });

    await runTest("Verify Troubleshooting & FAQ Runbook exists with Emergency Runbooks", () => {
      const filePath = path.join(manualsDir, "TROUBLESHOOTING_FAQ.md");
      recordAssert(fs.existsSync(filePath), "TROUBLESHOOTING_FAQ.md must exist on disk");
      const content = fs.readFileSync(filePath, "utf8");
      recordAssert(content.length > 2500, "Handbook must contain comprehensive detailed content (>2500 chars)");
      recordAssert(content.includes("RUN-LIS-TS-001"), "Must declare formal Document ID");
      recordAssert(content.includes("Quick Emergency Diagnostic Matrix"), "Must include fast triage matrix");
      recordAssert(content.includes("ASTM Port 5005"), "Must troubleshoot analyzer port drops");
      recordAssert(content.includes("Gap Sensor Calibration"), "Must troubleshoot thermal printer jams");
      recordAssert(content.includes("WhatsApp Cloud API"), "Must troubleshoot message delivery failures");
      recordAssert(content.includes("Disaster Recovery: Database Restoration"), "Must provide full DB restore script");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 2: OpenAPI 3.0.3 Specification Structural Integrity
  // ──────────────────────────────────────────────────────────────────────────
  await runSuite("Suite 2: OpenAPI 3.0.3 Specification Structural Integrity", async () => {
    await runTest("Verify OpenAPI Specification Version is 3.0.3", () => {
      recordAssert(OPENAPI_SPECIFICATION.openapi === "3.0.3", "OpenAPI version must strictly be 3.0.3");
    });

    await runTest("Verify Info block metadata, title, license and version 3.0.0-PRODUCTION", () => {
      const info = OPENAPI_SPECIFICATION.info;
      recordAssert(Boolean(info.title && info.title.includes("NIKIL-LABCORE-ELIS-OS")), "Title matches enterprise branding");
      recordAssert(info.version === "3.0.0-PRODUCTION", "Version must be 3.0.0-PRODUCTION");
      recordAssert(Boolean(info.contact && info.contact.email), "Contact info must contain valid email");
      recordAssert(Boolean(info.license && info.license.name), "License must be defined");
    });

    await runTest("Verify Server Environments (Development and Production Reverse Proxy)", () => {
      const servers = OPENAPI_SPECIFICATION.servers;
      recordAssert(servers.length >= 2, "Must configure at least 2 server environments");
      const urls = servers.map((s) => s.url);
      recordAssert(urls.some((u) => u.includes("127.0.0.1:5000")), "Must include localhost dev server");
      recordAssert(urls.some((u) => u.includes("elis.yourhospital.com")), "Must include production HTTPS reverse proxy");
    });

    await runTest("Verify Security Schemes (BearerAuth JWT, ApiKeyAuth & AbdmAuth)", () => {
      const schemes = OPENAPI_SPECIFICATION.components.securitySchemes;
      recordAssert(Boolean(schemes.bearerAuth), "Must define bearerAuth security scheme");
      recordAssert(schemes.bearerAuth.scheme === "bearer", "bearerAuth scheme is 'bearer'");
      recordAssert(schemes.bearerAuth.bearerFormat === "JWT", "bearerFormat is 'JWT'");
      recordAssert(Boolean(schemes.apiKeyAuth), "Must define apiKeyAuth for M2M analyzers");
      recordAssert(Boolean(schemes.abdmGatewayAuth), "Must define abdmGatewayAuth for NHA gateway");
    });

    await runTest("Verify Core Schemas in components.schemas", () => {
      const schemas = OPENAPI_SPECIFICATION.components.schemas;
      recordAssert(Boolean(schemas.ApiResponse), "Must define ApiResponse schema");
      recordAssert(Boolean(schemas.ApiError), "Must define ApiError schema");
      recordAssert(Boolean(schemas.HospitalRole), "Must define HospitalRole enum schema");
      recordAssert(Boolean(schemas.PatientRecord), "Must define PatientRecord schema");
      recordAssert(Boolean(schemas.DiagnosticOrder), "Must define DiagnosticOrder schema");
      recordAssert(Boolean(schemas.SampleSpecimen), "Must define SampleSpecimen schema");
      recordAssert(Boolean(schemas.LaboratoryResult), "Must define LaboratoryResult schema");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 3: 30+ Domain Tag Coverage & Standard Alignments
  // ──────────────────────────────────────────────────────────────────────────
  await runSuite("Suite 3: 30+ Domain Tag Coverage & Standard Alignments", async () => {
    await runTest("Verify at least 30 domain tags are defined with descriptions", () => {
      const tags = OPENAPI_SPECIFICATION.tags;
      recordAssert(tags.length >= 30, `Must define >= 30 tags, found ${tags.length}`);
      const tagNames = tags.map((t) => t.name);

      const requiredTags = [
        "Auth & Identity",
        "Users & RBAC",
        "Patients & EMPI",
        "Doctors & Clinical Staff",
        "Test Catalog & Profiles",
        "Orders & Prioritization",
        "Samples & Phlebotomy",
        "Results Entry",
        "Approvals & Pathologist Sign-Off",
        "Reports & PDF Dispatch",
        "Invoices & POS Billing",
        "Payments & Financial Core",
        "Cash Counter & Daybook",
        "Settlements & Receivables",
        "Receipts",
        "Analyzers & QC",
        "Barcodes & Thermal Labels",
        "Audit Trail & Compliance",
        "ABDM Gateway (M1/M2/M3)",
        "DPDP Consent & Privacy",
        "WhatsApp & Omnichannel",
        "Clinical AI Studio",
        "Digital Twin & Simulation",
        "Omniscient Nexus",
        "Multi-Branch Architecture",
        "Backup & Disaster Recovery",
        "Command Palette & Search",
        "Cache & Performance",
        "System Health & Probes",
        "SCIM 2.0 Enterprise Directory",
      ];

      for (const reqTag of requiredTags) {
        recordAssert(tagNames.includes(reqTag), `Missing required tag category: '${reqTag}'`);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 4: Critical Endpoint & Operation Schema Verification
  // ──────────────────────────────────────────────────────────────────────────
  await runSuite("Suite 4: Critical Endpoint & Operation Schema Verification", async () => {
    const paths = OPENAPI_SPECIFICATION.paths;
    const pathKeys = Object.keys(paths);

    await runTest("Verify total paths count is extensive (>= 40 distinct route patterns)", () => {
      recordAssert(pathKeys.length >= 40, `Paths count (${pathKeys.length}) must be >= 40`);
    });

    let totalOps = 0;
    pathKeys.forEach((p) => {
      totalOps += Object.keys(paths[p]).length;
    });

    await runTest("Verify total operations count >= 45 across HTTP verbs", () => {
      recordAssert(totalOps >= 45, `Total operations (${totalOps}) must be >= 45`);
    });

    await runTest("Verify Authentication endpoints (/auth/login, /auth/refresh, /auth/me)", () => {
      recordAssert(Boolean(paths["/auth/login"]?.post), "POST /auth/login must exist");
      recordAssert(Boolean(paths["/auth/refresh"]?.post), "POST /auth/refresh must exist");
      recordAssert(Boolean(paths["/auth/me"]?.get), "GET /auth/me must exist");
      recordAssert(Boolean(paths["/auth/mfa/setup"]?.post), "POST /auth/mfa/setup must exist");
    });

    await runTest("Verify Clinical Patient & Order endpoints (/patients, /orders, /samples)", () => {
      recordAssert(Boolean(paths["/patients"]?.get), "GET /patients must exist");
      recordAssert(Boolean(paths["/patients"]?.post), "POST /patients must exist");
      recordAssert(Boolean(paths["/orders"]?.get), "GET /orders must exist");
      recordAssert(Boolean(paths["/orders"]?.post), "POST /orders must exist");
      recordAssert(Boolean(paths["/samples"]?.get), "GET /samples must exist");
      recordAssert(Boolean(paths["/samples/collect"]?.post), "POST /samples/collect must exist");
      recordAssert(Boolean(paths["/samples/accession"]?.post), "POST /samples/accession must exist");
      recordAssert(Boolean(paths["/samples/{id}/reject"]?.post), "POST /samples/{id}/reject must exist");
    });

    await runTest("Verify Results & Approvals endpoints (/results, /approvals, /reports/{id}/pdf)", () => {
      recordAssert(Boolean(paths["/results"]?.get), "GET /results must exist");
      recordAssert(Boolean(paths["/results"]?.post), "POST /results must exist");
      recordAssert(Boolean(paths["/approvals"]?.get), "GET /approvals must exist");
      recordAssert(Boolean(paths["/approvals/{id}/sign"]?.post), "POST /approvals/{id}/sign must exist");
      recordAssert(Boolean(paths["/approvals/batch-sign"]?.post), "POST /approvals/batch-sign must exist");
      recordAssert(Boolean(paths["/reports/{id}/pdf"]?.get), "GET /reports/{id}/pdf must exist");
      recordAssert(Boolean(paths["/reports/verify/{reportId}"]?.get), "GET /reports/verify/{reportId} must exist");
    });

    await runTest("Verify Financial & Billing endpoints (/invoices, /payments, /cash-counter/close)", () => {
      recordAssert(Boolean(paths["/invoices"]?.get), "GET /invoices must exist");
      recordAssert(Boolean(paths["/invoices"]?.post), "POST /invoices must exist");
      recordAssert(Boolean(paths["/payments"]?.get), "GET /payments must exist");
      recordAssert(Boolean(paths["/payments"]?.post), "POST /payments must exist");
      recordAssert(Boolean(paths["/cash-counter/close"]?.post), "POST /cash-counter/close must exist");
    });

    await runTest("Verify ABDM, DPDP, WhatsApp, AI & Health endpoints", () => {
      recordAssert(Boolean(paths["/abdm/abha/generate-otp"]?.post), "POST /abdm/abha/generate-otp must exist");
      recordAssert(Boolean(paths["/abdm/fhir/diagnostic-report/{id}"]?.get), "GET /abdm/fhir/diagnostic-report/{id} must exist");
      recordAssert(Boolean(paths["/dpdp/consent"]?.post), "POST /dpdp/consent must exist");
      recordAssert(Boolean(paths["/whatsapp/send-report"]?.post), "POST /whatsapp/send-report must exist");
      recordAssert(Boolean(paths["/ai/interpret"]?.post), "POST /ai/interpret must exist");
      recordAssert(Boolean(paths["/health"]?.get), "GET /health must exist");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 5: Live Express Documentation Router Simulation
  // ──────────────────────────────────────────────────────────────────────────
  await runSuite("Suite 5: Live Express Documentation Router Simulation", async () => {
    await runTest("GET /openapi.json returns HTTP 200 and valid JSON schema", async () => {
      const req = createMockReq("/openapi.json", "GET");
      const res = createMockRes();

      await dispatchRoute(docsRouter, req, res);

      recordAssert(res.statusCode === 200, "Status must be 200 OK");
      recordAssert(res.headers["content-type"] === "application/json", "Content-Type must be application/json");
      recordAssert(Boolean(res.body), "Response body must not be null");
      recordAssert(res.body.openapi === "3.0.3", "Parsed JSON openapi version must be 3.0.3");
      recordAssert(res.body.info.version === "3.0.0-PRODUCTION", "Parsed JSON version must be 3.0.0-PRODUCTION");
    });

    await runTest("GET /summary returns API health metrics and certification list", async () => {
      const req = createMockReq("/summary", "GET");
      const res = createMockRes();

      await dispatchRoute(docsRouter, req, res);

      recordAssert(res.statusCode === 200, "Status must be 200 OK");
      recordAssert(res.body.success === true, "success is true");
      recordAssert(res.body.totalPaths >= 40, "totalPaths >= 40");
      recordAssert(res.body.totalOperations >= 45, "totalOperations >= 45");
      recordAssert(res.body.certifications.includes("NABL ISO 15189:2022"), "Includes NABL certification");
      recordAssert(res.body.certifications.includes("ABDM / ABHA v0.5"), "Includes ABDM certification");
    });

    await runTest("GET / serves interactive Swagger UI HTML with CDN bundle scripts", async () => {
      const req = createMockReq("/", "GET");
      const res = createMockRes();

      await dispatchRoute(docsRouter, req, res);

      recordAssert(res.statusCode === 200, "Status must be 200 OK");
      recordAssert(res.headers["content-type"] === "text/html", "Content-Type must be text/html");
      recordAssert(typeof res.body === "string", "Response body must be HTML string");
      recordAssert(res.body.includes("swagger-ui-bundle.js"), "HTML includes Swagger UI bundle script");
      recordAssert(res.body.includes("/api/docs/openapi.json"), "HTML references OpenAPI JSON endpoint");
    });

    await runTest("GET /redoc serves clean ReDoc HTML documentation interface", async () => {
      const req = createMockReq("/redoc", "GET");
      const res = createMockRes();

      await dispatchRoute(docsRouter, req, res);

      recordAssert(res.statusCode === 200, "Status must be 200 OK");
      recordAssert(res.headers["content-type"] === "text/html", "Content-Type must be text/html");
      recordAssert(typeof res.body === "string", "Response body must be HTML string");
      recordAssert(res.body.includes("redoc.standalone.js"), "HTML includes ReDoc standalone script");
      recordAssert(res.body.includes("<redoc spec-url='/api/docs/openapi.json'></redoc>"), "HTML defines ReDoc element");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // FINAL REPORT
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n==============================================================================");
  console.log("📊 DAY 26 TEST EXECUTION SUMMARY");
  console.log("==============================================================================");
  console.log(`Total Test Suites   : ${totalSuites}`);
  console.log(`Total Unit Tests    : ${totalTests}`);
  console.log(`Passed Unit Tests   : ${passedTests}`);
  console.log(`Failed Unit Tests   : ${totalTests - passedTests}`);
  console.log(`Total Assertions    : ${totalAssertions}`);
  console.log(`Passed Assertions   : ${passedAssertions}`);
  console.log(`Success Rate        : ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log("\n✨ DAY 26 USER MANUALS & OPENAPI/SWAGGER SPEC CERTIFIED: 100% PASS (0 FAILURES)\n");
  } else {
    throw new Error(`Day 26 validation suite had failures: ${totalTests - passedTests} failed`);
  }
}

if (require.main === module) {
  runDay26DocsTestSuite()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
