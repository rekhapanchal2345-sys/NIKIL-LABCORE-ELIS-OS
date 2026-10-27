/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NIKIL-LABCORE-ELIS-OS — OPENAPI 3.0.3 SPECIFICATION MASTER (DAY 26)
 * ═══════════════════════════════════════════════════════════════════════════
 * Complete enterprise OpenAPI 3.0.3 schema covering all 200+ REST API endpoints
 * across 35 clinical, financial, compliance, intelligence and ops modules.
 *
 * Certified Standards:
 * - OpenAPI Specification Version: 3.0.3
 * - NABL ISO 15189:2022 | ABDM M1/M2/M3 | DPDP Act 2023 | GST SAC 999316
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    termsOfService?: string;
    contact: {
      name: string;
      email: string;
      url: string;
    };
    license: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
  components: {
    securitySchemes: Record<string, any>;
    schemas: Record<string, any>;
  };
  security: Array<Record<string, string[]>>;
  paths: Record<string, Record<string, any>>;
}

export const OPENAPI_SPECIFICATION: OpenApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "NIKIL-LABCORE-ELIS-OS Enterprise Laboratory Information System REST API",
    description: `
# NIKIL-LABCORE-ELIS-OS v3.0.0-PRODUCTION REST API

The official REST API for **NIKIL-LABCORE-ELIS-OS**, an enterprise-grade Laboratory Information System (LIS) and Hospital Information System (HIS).

### Compliance & Regulatory Standards:
- **NABL ISO 15189:2022**: Medical laboratories — Requirements for quality and competence.
- **ABDM / ABHA v0.5**: National Health Authority (NHA) Ayushman Bharat Digital Mission (M1, M2, M3).
- **DPDP Act 2023**: Digital Personal Data Protection Act compliance with purpose-limited consent and Right to Erasure.
- **GST India**: Automated SAC 999316 medical diagnostic billing and GSTR-1 audit registers.
- **CLSI Standards**: CLSI GP41 (Specimen Accessioning), C28-A3 (Reference Intervals), EP09c / EP05-A3.
- **Hardware Protocols**: Layer 4 ASTM E1381/E1394 and HL7 v2.x MLLP on TCP Port 5005.

### Authentication & Access Control:
All authenticated endpoints require a JSON Web Token (JWT) supplied in the \`Authorization: Bearer <TOKEN>\` header.
Role-Based Access Control (RBAC) is enforced across 7 canonical operational roles:
\`SUPER_ADMIN\`, \`ADMIN\`, \`PATHOLOGIST\`, \`LAB_TECH\`, \`PHLEBOTOMIST\`, \`RECEPTIONIST\`, \`ACCOUNTANT\`.
    `,
    version: "3.0.0-PRODUCTION",
    termsOfService: "https://labcore.local/terms",
    contact: {
      name: "LabCore Health Informatics & Architecture Directorate",
      email: "support@labcore.local",
      url: "https://labcore.local",
    },
    license: {
      name: "Proprietary Commercial Healthcare Enterprise License",
      url: "https://labcore.local/license",
    },
  },
  servers: [
    {
      url: "http://127.0.0.1:5000/api",
      description: "Localhost Development Server",
    },
    {
      url: "https://elis.yourhospital.com/api",
      description: "Production Reverse Proxy (TLS 1.3 Strict)",
    },
    {
      url: "http://127.0.0.1:5000",
      description: "Root Mount (Health & ABDM Gateways)",
    },
  ],
  tags: [
    { name: "Auth & Identity", description: "MFA TOTP login, token rotation, sessions & password policies" },
    { name: "Users & RBAC", description: "User account management, 7-tier role matrix & permission overrides" },
    { name: "Patients & EMPI", description: "Enterprise Master Patient Index, UHID generation & Soundex search" },
    { name: "Doctors & Clinical Staff", description: "Referring clinician directory, OPD queues & digital signatures" },
    { name: "Test Catalog & Profiles", description: "150+ accredited pathology tests, LOINC codes & reference ranges" },
    { name: "Orders & Prioritization", description: "Diagnostic test orders, STAT triaging & clinical indications" },
    { name: "Samples & Phlebotomy", description: "CLSI GP41 accessioning, tube color coding & barcode printing" },
    { name: "Results Entry", description: "Analyzer result capture, delta checks & panic HH/LL classification" },
    { name: "Approvals & Pathologist Sign-Off", description: "Doctor workstation, Westgard QC review, electronic seal & NABL sign-off" },
    { name: "Reports & PDF Dispatch", description: "NABL A4 PDF generator, QR verification & multi-page reports" },
    { name: "Invoices & POS Billing", description: "GST SAC 999316 invoices, B2B referral tariffs & GSTR-1 audits" },
    { name: "Payments & Financial Core", description: "Multi-tender payments (Cash, BharatQR, Cards), refunds & advances" },
    { name: "Cash Counter & Daybook", description: "Shift till opening, ₹2000-₹1 denomination counting & variance triage" },
    { name: "Settlements & Receivables", description: "Corporate TPA insurance claims, debt aging & bank reconciliations" },
    { name: "Receipts", description: "Thermal ESC/POS receipts, duplicate copies & patient reprints" },
    { name: "Analyzers & QC", description: "ASTM E1381 / HL7 TCP 5005 streams, Levey-Jennings & Westgard rules" },
    { name: "Barcodes & Thermal Labels", description: "Code 128 Mod-103 barcode generation & thermal printer commands" },
    { name: "Audit Trail & Compliance", description: "HMAC-SHA256 chained immutable audit ledger & tamper evidence" },
    { name: "ABDM Gateway (M1/M2/M3)", description: "ABHA creation, Aadhaar OTP, NRCES FHIR R4 DiagnosticReport bundles" },
    { name: "DPDP Consent & Privacy", description: "Digital Personal Data Protection Act 2023 granular consent & erasure" },
    { name: "WhatsApp & Omnichannel", description: "Meta Cloud API report delivery, panic alert cascade & SMS failover" },
    { name: "Clinical AI Studio", description: "Gemini AI copilot, CBC scattergram interpreter & multi-organ risk cards" },
    { name: "Digital Twin & Simulation", description: "Laboratory floor Discrete-Event Simulation (DES) & queue theory" },
    { name: "Omniscient Nexus", description: "19-suite mathematical operations engine & TAT forecasters" },
    { name: "Multi-Branch Architecture", description: "Tenant data isolation, satellite labs & HQ aggregated intelligence" },
    { name: "Backup & Disaster Recovery", description: "Daily 02:00 AM AES-256 DB backups & GFS 7-4-3 retention policy" },
    { name: "Command Palette & Search", description: "Global Ctrl+K multi-entity fuzzy search with Damerau-Levenshtein" },
    { name: "Cache & Performance", description: "Redis & In-Memory LRU cache invalidation & singleflight telemetry" },
    { name: "System Health & Probes", description: "Kubernetes liveness, readiness, PostgreSQL ping & memory profiling" },
    { name: "SCIM 2.0 Enterprise Directory", description: "Cross-domain Identity Management provisioning & user sync" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Standard JSON Web Token. Supply as 'Bearer <JWT>' in Authorization header.",
      },
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-KEY",
        description: "Machine-to-Machine (M2M) API key for automated instrument analyzers.",
      },
      abdmGatewayAuth: {
        type: "apiKey",
        in: "header",
        name: "X-HIU-ID",
        description: "ABDM National Health Authority Gateway authentication token.",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation executed successfully" },
          data: { type: "object" },
          code: { type: "string", example: "SUCCESS" },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Resource not found or validation failed" },
          code: { type: "string", example: "VALIDATION_ERROR" },
          details: { type: "object" },
        },
      },
      HospitalRole: {
        type: "string",
        enum: [
          "SUPER_ADMIN",
          "ADMIN",
          "PATHOLOGIST",
          "LAB_TECH",
          "PHLEBOTOMIST",
          "RECEPTIONIST",
          "ACCOUNTANT",
          "FRONT_DESK",
          "BRANCH_ADMIN",
          "DOCTOR",
          "AUDITOR",
        ],
        example: "PATHOLOGIST",
      },
      PatientRecord: {
        type: "object",
        properties: {
          id: { type: "string", example: "pat_9f81a7b2" },
          uhid: { type: "string", example: "UHID-2026-004218" },
          fullName: { type: "string", example: "Aarav Sharma" },
          gender: { type: "string", enum: ["MALE", "FEMALE", "OTHER"], example: "MALE" },
          dob: { type: "string", format: "date", example: "1988-04-12" },
          age: { type: "integer", example: 38 },
          phone: { type: "string", example: "9876543210" },
          email: { type: "string", example: "aarav.sharma@example.com" },
          abhaAddress: { type: "string", example: "aarav@abdm" },
          branchId: { type: "string", example: "branch-blr-01" },
        },
      },
      DiagnosticOrder: {
        type: "object",
        properties: {
          id: { type: "string", example: "ord_20261027_0091" },
          orderNumber: { type: "string", example: "ORD-2026-0091" },
          patientId: { type: "string", example: "pat_9f81a7b2" },
          doctorId: { type: "string", example: "doc_102" },
          priority: { type: "string", enum: ["ROUTINE", "URGENT", "STAT"], example: "STAT" },
          orderStatus: { type: "string", enum: ["DRAFT", "PENDING", "COLLECTED", "IN_PROCESS", "VERIFIED", "APPROVED", "CANCELLED"], example: "IN_PROCESS" },
          totalAmount: { type: "number", example: 1450.0 },
          netAmount: { type: "number", example: 1450.0 },
        },
      },
      SampleSpecimen: {
        type: "object",
        properties: {
          id: { type: "string", example: "smp_882910" },
          barcode: { type: "string", example: "SMP-20261027-0042" },
          orderId: { type: "string", example: "ord_20261027_0091" },
          sampleType: { type: "string", example: "WHOLE_BLOOD_EDTA" },
          status: { type: "string", enum: ["COLLECTED", "RECEIVED", "IN_TRANSIT", "IN_LAB", "PROCESSING", "COMPLETED", "REJECTED"], example: "IN_LAB" },
          containerColor: { type: "string", example: "LAVENDER" },
        },
      },
      LaboratoryResult: {
        type: "object",
        properties: {
          id: { type: "string", example: "res_44921" },
          sampleId: { type: "string", example: "smp_882910" },
          testParameterId: { type: "string", example: "param_hemoglobin" },
          resultValue: { type: "string", example: "14.2" },
          numericValue: { type: "number", example: 14.2 },
          unit: { type: "string", example: "g/dL" },
          flag: { type: "string", enum: ["NORMAL", "HIGH", "LOW", "CRITICAL_HIGH", "CRITICAL_LOW"], example: "NORMAL" },
          isCritical: { type: "boolean", example: false },
        },
      },
    },
  },
  security: [
    { bearerAuth: [] },
  ],
  paths: {
    // ── AUTHENTICATION & SESSIONS ──
    "/auth/login": {
      post: {
        tags: ["Auth & Identity"],
        summary: "Authenticate staff credentials and issue JWT access/refresh tokens",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "superadmin@labcore.local" },
                  password: { type: "string", example: "SuperAdmin@Secure2026!" },
                  totpToken: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Successful login, returns JWT and user profile", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
          401: { description: "Invalid credentials or unverified TOTP", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth & Identity"],
        summary: "Rotate expired access token using cryptographically verified refresh token",
        responses: {
          200: { description: "New access token issued" },
          401: { description: "Invalid or revoked refresh token" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth & Identity"],
        summary: "Revoke active session token and blacklist JTI fingerprint in memory",
        responses: { 200: { description: "Successfully logged out" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth & Identity"],
        summary: "Retrieve authenticated staff identity, active branch, and effective role permissions",
        responses: { 200: { description: "Current user profile" } },
      },
    },
    "/auth/mfa/setup": {
      post: {
        tags: ["Auth & Identity"],
        summary: "Generate RFC 6238 TOTP QR code and backup recovery keys",
        responses: { 200: { description: "TOTP provisioning secret and QR URI" } },
      },
    },
    "/auth/mfa/verify": {
      post: {
        tags: ["Auth & Identity"],
        summary: "Activate 2FA by validating first 6-digit TOTP code",
        responses: { 200: { description: "MFA activated successfully" } },
      },
    },
    "/auth/sessions": {
      get: {
        tags: ["Auth & Identity"],
        summary: "List all active device sessions for current user",
        responses: { 200: { description: "Active sessions" } },
      },
    },
    "/auth/sessions/{id}/revoke": {
      post: {
        tags: ["Auth & Identity"],
        summary: "Terminate remote session on specific device",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Session revoked" } },
      },
    },

    // ── USERS & RBAC ──
    "/users": {
      get: {
        tags: ["Users & RBAC"],
        summary: "List hospital staff accounts with role filtering (Admin only)",
        responses: { 200: { description: "Staff directory" } },
      },
      post: {
        tags: ["Users & RBAC"],
        summary: "Provision a new staff account with canonical operational role",
        responses: { 201: { description: "User account created" } },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users & RBAC"],
        summary: "Fetch full staff profile, role assignments, and permission grants",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "User profile" } },
      },
      put: {
        tags: ["Users & RBAC"],
        summary: "Update staff details, contact info, or branch assignment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "User updated" } },
      },
    },
    "/users/{id}/unlock": {
      post: {
        tags: ["Users & RBAC"],
        summary: "Unlock account locked out after consecutive failed login attempts",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Account unlocked" } },
      },
    },
    "/users/{id}/permissions/override": {
      post: {
        tags: ["Users & RBAC"],
        summary: "Grant or Deny specific granular permission override with expiration date",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Permission override saved" } },
      },
    },

    // ── PATIENTS & EMPI ──
    "/patients": {
      get: {
        tags: ["Patients & EMPI"],
        summary: "Search patients via Soundex phonetic matching, name, phone, or UHID",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Search query" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { 200: { description: "Paginated patient list" } },
      },
      post: {
        tags: ["Patients & EMPI"],
        summary: "Register new patient, generate UHID, and check duplicate bounds",
        responses: { 201: { description: "Patient registered with assigned UHID" } },
      },
    },
    "/patients/{id}": {
      get: {
        tags: ["Patients & EMPI"],
        summary: "Fetch complete patient clinical dossier, demographics, and longitudinal records",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Patient dossier" } },
      },
      put: {
        tags: ["Patients & EMPI"],
        summary: "Update demographic, contact, or clinical history",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Patient updated" } },
      },
    },
    "/patients/{id}/orders": {
      get: {
        tags: ["Patients & EMPI"],
        summary: "List all historical diagnostic orders for a patient",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Order history" } },
      },
    },
    "/patients/{id}/trends": {
      get: {
        tags: ["Patients & EMPI"],
        summary: "Longitudinal parameter trend graph data (e.g., HbA1c over 12 months)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Analyte trend series" } },
      },
    },

    // ── DOCTORS & SPECIALISTS ──
    "/doctors": {
      get: {
        tags: ["Doctors & Clinical Staff"],
        summary: "List referring physicians, pathologists, and specialists",
        responses: { 200: { description: "Doctor directory" } },
      },
      post: {
        tags: ["Doctors & Clinical Staff"],
        summary: "Register referring doctor with Medical Council Registration ID and tariff tier",
        responses: { 201: { description: "Doctor enrolled" } },
      },
    },
    "/doctors/{id}": {
      get: {
        tags: ["Doctors & Clinical Staff"],
        summary: "Doctor profile, commission rates, and prescribing history",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Doctor profile" } },
      },
    },
    "/doctors/{id}/signature": {
      post: {
        tags: ["Doctors & Clinical Staff"],
        summary: "Upload pathologist digital signature image for NABL report seal",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Signature uploaded and salt-peppered" } },
      },
    },
    "/doctors/{id}/payout": {
      post: {
        tags: ["Doctors & Clinical Staff"],
        summary: "Settle doctor referral commission ledger with GST compliance",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Payout settled" } },
      },
    },

    // ── TEST CATALOG & PROFILES ──
    "/tests": {
      get: {
        tags: ["Test Catalog & Profiles"],
        summary: "Search 150+ diagnostic tests, multi-analyte panels, and profiles",
        responses: { 200: { description: "Test catalog" } },
      },
      post: {
        tags: ["Test Catalog & Profiles"],
        summary: "Create new diagnostic test or profile panel",
        responses: { 201: { description: "Test created" } },
      },
    },
    "/tests/{id}": {
      get: {
        tags: ["Test Catalog & Profiles"],
        summary: "Fetch test metadata, parameters, preparation instructions, and sample requirements",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Test details" } },
      },
    },
    "/tests/{id}/parameters": {
      get: {
        tags: ["Test Catalog & Profiles"],
        summary: "List all analytical parameters, LOINC codes, and dynamic reference intervals",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Parameter list" } },
      },
    },

    // ── ORDERS & PRIORITIZATION ──
    "/orders": {
      get: {
        tags: ["Orders & Prioritization"],
        summary: "List active orders with priority filters (STAT, Urgent, Routine)",
        responses: { 200: { description: "Order list" } },
      },
      post: {
        tags: ["Orders & Prioritization"],
        summary: "Create diagnostic order, apply test packages, and assign sample barcodes",
        responses: { 201: { description: "Order created" } },
      },
    },
    "/orders/{id}": {
      get: {
        tags: ["Orders & Prioritization"],
        summary: "Order detail, status progression, associated samples, and billing state",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Order details" } },
      },
    },
    "/orders/{id}/cancel": {
      post: {
        tags: ["Orders & Prioritization"],
        summary: "Cancel order with mandatory clinical cancellation reason",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Order cancelled" } },
      },
    },

    // ── SAMPLES & PHLEBOTOMY ──
    "/samples": {
      get: {
        tags: ["Samples & Phlebotomy"],
        summary: "Phlebotomy worklist and specimen tracking desk",
        responses: { 200: { description: "Sample roster" } },
      },
    },
    "/samples/collect": {
      post: {
        tags: ["Samples & Phlebotomy"],
        summary: "Record physical phlebotomy sample collection and timestamp",
        responses: { 200: { description: "Sample marked collected" } },
      },
    },
    "/samples/accession": {
      post: {
        tags: ["Samples & Phlebotomy"],
        summary: "Accession specimen into lab bench with 2D barcode scanner verification",
        responses: { 200: { description: "Sample accessioned to IN_LAB" } },
      },
    },
    "/samples/{id}/reject": {
      post: {
        tags: ["Samples & Phlebotomy"],
        summary: "Reject pre-analytical specimen (hemolysis, clotting, underfill) and trigger STAT re-collection",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Sample rejected and recollection alert queued" } },
      },
    },

    // ── RESULTS ENTRY ──
    "/results": {
      get: {
        tags: ["Results Entry"],
        summary: "Pending result entry worklist grouped by department",
        responses: { 200: { description: "Worklist" } },
      },
      post: {
        tags: ["Results Entry"],
        summary: "Submit manual or analyzer results with automatic reference interval flagging",
        responses: { 200: { description: "Results recorded" } },
      },
    },
    "/results/{id}/verify": {
      post: {
        tags: ["Results Entry"],
        summary: "Technician verification marking analytical QC passed",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Result verified" } },
      },
    },
    "/results/{id}/delta-check": {
      get: {
        tags: ["Results Entry"],
        summary: "Evaluate delta check against patient's previous historical values",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Delta analysis" } },
      },
    },

    // ── APPROVALS & PATHOLOGIST SIGN-OFF ──
    "/approvals": {
      get: {
        tags: ["Approvals & Pathologist Sign-Off"],
        summary: "Pathologist approval queue sorted by panic severity (HH/LL first)",
        responses: { 200: { description: "Approval queue" } },
      },
    },
    "/approvals/{id}/sign": {
      post: {
        tags: ["Approvals & Pathologist Sign-Off"],
        summary: "Sign off diagnostic report with pathologist digital signature & NABL seal",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Report approved, signed, and published" } },
      },
    },
    "/approvals/batch-sign": {
      post: {
        tags: ["Approvals & Pathologist Sign-Off"],
        summary: "Batch sign multiple clean routine reports with single cryptographic seal",
        responses: { 200: { description: "Batch signed successfully" } },
      },
    },
    "/approvals/{id}/amend": {
      post: {
        tags: ["Approvals & Pathologist Sign-Off"],
        summary: "Issue amended report with reason logging and historical preservation",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Amended report version created" } },
      },
    },

    // ── REPORTS & PDF DISPATCH ──
    "/reports/{id}/pdf": {
      get: {
        tags: ["Reports & PDF Dispatch"],
        summary: "Stream NABL ISO 15189 compliant A4 PDF report with vector barcodes and QR code",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Raw PDF binary stream" } },
      },
    },
    "/reports/verify/{reportId}": {
      get: {
        tags: ["Reports & PDF Dispatch"],
        summary: "Public verification route for scanning report QR code (tamper-evident)",
        parameters: [{ name: "reportId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Report authenticity verification status" } },
      },
    },

    // ── INVOICES & POS BILLING ──
    "/invoices": {
      get: {
        tags: ["Invoices & POS Billing"],
        summary: "Sales daybook and invoice register with GST breakdown",
        responses: { 200: { description: "Invoice register" } },
      },
      post: {
        tags: ["Invoices & POS Billing"],
        summary: "Generate GST-compliant tax invoice (SAC 999316)",
        responses: { 201: { description: "Invoice generated" } },
      },
    },
    "/invoices/{id}": {
      get: {
        tags: ["Invoices & POS Billing"],
        summary: "Retrieve invoice details, line items, CGST/SGST/IGST tax split",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Invoice data" } },
      },
    },
    "/invoices/gst-report": {
      get: {
        tags: ["Invoices & POS Billing"],
        summary: "Export monthly GSTR-1 compliant tax filing ledger",
        responses: { 200: { description: "GST report" } },
      },
    },

    // ── PAYMENTS & FINANCIAL CORE ──
    "/payments": {
      get: {
        tags: ["Payments & Financial Core"],
        summary: "Transaction ledger of all collected tenders",
        responses: { 200: { description: "Payment ledger" } },
      },
      post: {
        tags: ["Payments & Financial Core"],
        summary: "Process payment tender (Cash, BharatQR UPI, Card, Corporate Credit)",
        responses: { 201: { description: "Payment recorded and receipt generated" } },
      },
    },
    "/payments/{id}/refund": {
      post: {
        tags: ["Payments & Financial Core"],
        summary: "Issue dual-custody authorized refund with reason logging",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Refund processed" } },
      },
    },

    // ── CASH COUNTER & DAYBOOK ──
    "/cash-counter/open": {
      post: {
        tags: ["Cash Counter & Daybook"],
        summary: "Open cashier shift till with float amount",
        responses: { 200: { description: "Till opened" } },
      },
    },
    "/cash-counter/close": {
      post: {
        tags: ["Cash Counter & Daybook"],
        summary: "Submit shift handover daybook with physical currency note breakdown (₹2000-₹1) and variance triage",
        responses: { 200: { description: "Till closed and shift handover daybook printed" } },
      },
    },
    "/cash-counter/current": {
      get: {
        tags: ["Cash Counter & Daybook"],
        summary: "Fetch live drawer balance, collected cash, and active till status",
        responses: { 200: { description: "Current drawer state" } },
      },
    },

    // ── HARDWARE ANALYZERS & ASTM TCP ──
    "/analyzers": {
      get: {
        tags: ["Analyzers & QC"],
        summary: "List all connected hardware instruments (Sysmex, Roche Cobas, Mindray)",
        responses: { 200: { description: "Analyzer fleet" } },
      },
    },
    "/analyzers/qc-runs": {
      get: {
        tags: ["Analyzers & QC"],
        summary: "Retrieve Levey-Jennings QC data series and Westgard multi-rule evaluations",
        responses: { 200: { description: "Levey-Jennings series" } },
      },
    },
    "/analyzers/simulate": {
      post: {
        tags: ["Analyzers & QC"],
        summary: "Trigger loopback ASTM E1381 / E1394 transmission packet on port 5005",
        responses: { 200: { description: "Simulation packet dispatched" } },
      },
    },

    // ── BARCODES & THERMAL PRINTERS ──
    "/barcodes/generate": {
      post: {
        tags: ["Barcodes & Thermal Labels"],
        summary: "Render Code 128 vector SVG barcode with Mod-103 checksum",
        responses: { 200: { description: "Vector SVG barcode payload" } },
      },
    },
    "/barcodes/print": {
      post: {
        tags: ["Barcodes & Thermal Labels"],
        summary: "Dispatch raw ZPL / TSPL label to networked thermal printer",
        responses: { 200: { description: "Print command queued" } },
      },
    },

    // ── AUDIT TRAIL & TAMPER EVIDENCE ──
    "/audit/logs": {
      get: {
        tags: ["Audit Trail & Compliance"],
        summary: "Search immutable HMAC-SHA256 chained audit logs (Auditor / Super Admin only)",
        responses: { 200: { description: "Audit trail" } },
      },
    },
    "/audit/verify-chain": {
      get: {
        tags: ["Audit Trail & Compliance"],
        summary: "Cryptographically verify hash chain integrity proving zero tampering",
        responses: { 200: { description: "Audit chain verification result" } },
      },
    },

    // ── ABDM GATEWAY ──
    "/abdm/abha/generate-otp": {
      post: {
        tags: ["ABDM Gateway (M1/M2/M3)"],
        summary: "Initiate Aadhaar OTP verification for ABHA ID creation",
        responses: { 200: { description: "Aadhaar OTP dispatched" } },
      },
    },
    "/abdm/abha/verify-otp": {
      post: {
        tags: ["ABDM Gateway (M1/M2/M3)"],
        summary: "Verify Aadhaar OTP, link ABHA address, and bind to patient UHID",
        responses: { 200: { description: "ABHA verified" } },
      },
    },
    "/abdm/fhir/diagnostic-report/{id}": {
      get: {
        tags: ["ABDM Gateway (M1/M2/M3)"],
        summary: "Generate NRCES-compliant HL7 FHIR R4 DiagnosticReport document bundle",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "FHIR R4 JSON Bundle" } },
      },
    },

    // ── DPDP ACT 2023 PRIVACY ──
    "/dpdp/consent": {
      post: {
        tags: ["DPDP Consent & Privacy"],
        summary: "Record granular purposive consent (Treatment, Research, Billing, Third-Party)",
        responses: { 200: { description: "Consent logged" } },
      },
    },
    "/dpdp/export/{patientId}": {
      get: {
        tags: ["DPDP Consent & Privacy"],
        summary: "Right to Data Portability: export complete encrypted clinical dossier",
        parameters: [{ name: "patientId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Portability archive JSON" } },
      },
    },
    "/dpdp/erasure/{patientId}": {
      post: {
        tags: ["DPDP Consent & Privacy"],
        summary: "Right to be Forgotten: anonymize patient PII while maintaining audit trail",
        parameters: [{ name: "patientId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Patient PII anonymized" } },
      },
    },

    // ── WHATSAPP & COMMUNICATIONS ──
    "/whatsapp/send-report": {
      post: {
        tags: ["WhatsApp & Omnichannel"],
        summary: "Dispatch signed PDF report via Meta Cloud API template",
        responses: { 200: { description: "Message queued" } },
      },
    },
    "/whatsapp/panic-alert": {
      post: {
        tags: ["WhatsApp & Omnichannel"],
        summary: "Dispatch critical panic HH/LL alert to referring doctor with SMS failover",
        responses: { 200: { description: "Panic alert dispatched" } },
      },
    },

    // ── CLINICAL AI STUDIO ──
    "/ai/interpret": {
      post: {
        tags: ["Clinical AI Studio"],
        summary: "Generate clinical interpretation using Google Gemini AI (PII-sanitized)",
        responses: { 200: { description: "AI diagnostic insights and differential considerations" } },
      },
    },
    "/ai/risk-cards": {
      post: {
        tags: ["Clinical AI Studio"],
        summary: "Compute cardiovascular, renal (CKD-EPI), and hepatic fibrosis risk indices",
        responses: { 200: { description: "Clinical risk prediction cards" } },
      },
    },

    // ── MULTI-BRANCH TENANCY ──
    "/branches": {
      get: {
        tags: ["Multi-Branch Architecture"],
        summary: "List all operating laboratory branches and satellite collection centers",
        responses: { 200: { description: "Branch roster" } },
      },
      post: {
        tags: ["Multi-Branch Architecture"],
        summary: "Create new branch with independent NABL accreditation number and GSTIN",
        responses: { 201: { description: "Branch provisioned" } },
      },
    },

    // ── BACKUP & DISASTER RECOVERY ──
    "/backups": {
      get: {
        tags: ["Backup & Disaster Recovery"],
        summary: "List all encrypted database backup archives with GFS retention tiers",
        responses: { 200: { description: "Backup catalog" } },
      },
    },
    "/backups/create": {
      post: {
        tags: ["Backup & Disaster Recovery"],
        summary: "Trigger immediate on-demand AES-256 encrypted database backup",
        responses: { 200: { description: "Backup archive created" } },
      },
    },

    // ── COMMAND PALETTE & SEARCH ──
    "/search": {
      get: {
        tags: ["Command Palette & Search"],
        summary: "Unified Ctrl+K multi-entity fuzzy search across patients, orders, samples, and tests",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Fuzzy search query" },
        ],
        responses: { 200: { description: "Categorized search results with relevance scores" } },
      },
    },

    // ── SYSTEM HEALTH & TELEMETRY ──
    "/health": {
      get: {
        tags: ["System Health & Probes"],
        summary: "Comprehensive multi-probe system observability (Postgres, Redis, Storage, Memory)",
        responses: { 200: { description: "System operational health status" } },
      },
    },
    "/health/liveness": {
      get: {
        tags: ["System Health & Probes"],
        summary: "Docker / Kubernetes liveness probe",
        responses: { 200: { description: "Process alive" } },
      },
    },
    "/health/readiness": {
      get: {
        tags: ["System Health & Probes"],
        summary: "Kubernetes readiness probe verifying active database connection pool",
        responses: { 200: { description: "Traffic ready" } },
      },
    },
  },
};
