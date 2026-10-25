# Phase Four — Backend and API Audit
**NIKIL-LABCORE-ELIS-OS**  
*Unified Hospital, Diagnostic Pathology & Clinic Operating System*

---

## 1. Backend Service Architecture

The backend is built with Express 5 on Node.js v24 with TypeScript, structured around modular domain boundaries (`backend/api/src/modules/`):
- **Core HTTP Server**: `backend/api/src/server.ts` & `backend/api/src/app.ts`
- **Database Access Layer**: Prisma Client 7.9.1 (`@prisma/client`) with custom PostgreSQL connection pooling
- **Security & Perimeter Defenses**:
  - `helmet`: Strict CSP, HSTS in production, no-referrer, same-site CORP
  - `ipSecurityGuard`: IP blocking on consecutive authentication failures
  - `suspiciousRequestDetector`: Regex-based WAF filtering SQL injection, XSS, and directory traversal
  - `morgan`: Safe URL logging (query string stripped to prevent PII leakage of patient names/UHIDs in access logs)
  - `Cache-Control: no-store, no-cache, must-revalidate, private`: Enforced on all responses to prevent sensitive clinical caching on shared laboratory workstations

---

## 2. API Endpoint & Controller Inventory

A complete inspection of route files mounted in `backend/api/src/app.ts` identified 36 endpoint groups spanning 35 business modules:

| Route Mount | Module Handler | Primary Auth Guard | Validation Schemas | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth` | `auth.routes.ts` | Public / Bearer Token | Zod (`loginSchema`, `resetPasswordSchema`) | Password login, MFA setup/verify, rotating JWT sessions, OTP recovery |
| `/scim/v2` | `scim.routes.ts` | SCIM Bearer Token | RFC 7644 SCIM 2.0 | Enterprise Okta / Azure AD identity provisioning |
| `/oauth/v2/token`| `m2m-gateway.controller.ts`| Client Credentials | Basic / Bearer M2M | Machine-to-machine analyzer and hospital gateway OAuth2 tokens |
| `/api/users` | `user.routes.ts` | Authenticated (Admin) | Zod (`createUserSchema`, `updateUserSchema`) | Staff directory, role assignments, account unlock |
| `/api/patients` | `patient.routes.ts` | Authenticated | Zod (`createPatientSchema`, `mergeSchema`) | Patient MPI, Fellegi-Sunter EMPI, VIP shields, break-glass |
| `/api/doctors` | `doctor.routes.ts` | Authenticated | Zod (`createDoctorSchema`) | Referring doctors, clinic mapping, commission calculation |
| `/api/tests` | `test.routes.ts` | Authenticated | Zod (`createTestSchema`, `refRangeSchema`) | Test catalog, CLSI reference ranges, health packages |
| `/api/orders` | `order.routes.ts` | Authenticated | Zod (`createOrderSchema`, `cancelSchema`) | Order booking, priority escalation, STAT flags, sample generation |
| `/api/samples` | `sample.routes.ts` | Authenticated | Zod (`updateSampleStatusSchema`) | Sample accessioning, 7-stage state machine, rejection logging |
| `/api/invoices` | `invoice.routes.ts` | Authenticated | Zod (`createInvoiceSchema`, `refundSchema`) | GST billing, Daybook shift close, AR aging, corporate accounts |
| `/api/payments` | `payment.routes.ts` | Authenticated | Zod (`createPaymentSchema`) | Multi-tender cashier, advance wallets, POS settlements |
| `/api/advances` | `advance.routes.ts` | Authenticated | Zod | Patient wallet advances, deposit allocations |
| `/api/refunds` | `refund.routes.ts` | Authenticated (Admin/Acct) | Zod | Dual-custody refund requests and manager approval |
| `/api/cash-counter`| `cash-counter.routes.ts`| Authenticated | Zod | Physical cash drawer shift opening/closing & till variance audit |
| `/api/settlements`| `settlement.routes.ts`| Authenticated | Zod | Card terminal, UPI QR, and insurance claim batch settlements |
| `/api/receivables`| `receivable.routes.ts`| Authenticated | Zod | B2B corporate debt ledger and aging schedules |
| `/api/receipts` | `receipt.routes.ts` | Authenticated | Zod | Payment receipt printing, duplicate watermark defense |
| `/api/results` | `result.routes.ts` | Authenticated (Tech/Path) | Zod (`enterResultSchema`, `amendSchema`) | Result entry, delta check calculation, critical panic tagging |
| `/api/approvals`| `approval.routes.ts` | **DEFECT IDENTIFIED** | Controller-level check | Medical sign-off, NABL electronic seal, panic read-back |
| `/api/reports` | `report.routes.ts` | Authenticated / Public QR | Zod (`generateReportSchema`) | Diagnostic PDF rendering, SHA-256 seal, WhatsApp dispatch |
| `/api/analyzers`| `analyzer.routes.ts` | Authenticated | Zod | Analyzer registration, telemetry, ASTM/HL7 simulator |
| `/api/audit` | `audit.routes.ts` | Authenticated (Admin/Audit)| Zod (`auditQuerySchema`) | Read-only forensic audit trail, tamper-proof event logs |
| `/api/dashboard`| `dashboard.routes.ts` | Authenticated | None (Aggregated) | Role-specific KPIs, TAT monitor, department pipelines |
| `/api/communications`| `communication.routes.ts`| Authenticated | Zod (`sendCommunicationSchema`) | Omnichannel SMS, email dispatch, consultation inbox |
| `/api/whatsapp` | `whatsapp-advanced.routes.ts`| Authenticated | Zod | WhatsApp business campaigns, automated report delivery |
| `/api/settings` | `laboratory-settings.routes.ts`| Authenticated (Admin) | Zod | NABL accreditation details, lab profile, security rules |
| `/api/notifications`| `notification-template.routes.ts`| Authenticated (Admin) | Zod | Email/SMS/WhatsApp DLT template manager |
| `/api/backups` | `backup.routes.ts` | Authenticated (Super Admin)| Zod | Database snapshot creation, safe restore, deletion |
| `/api/barcodes` | `barcode.routes.ts` | Authenticated | Zod | Code128 / QR accession barcode generator |
| `/api/abdm` | `abdm.routes.ts` | Authenticated | Zod | ABDM M1-M3, ABHA creation, OTP verification, FHIR R4 |
| `/v0.5` | `abdmWebhookRouter` | Public (NHA Gateway) | NHA Webhook Schema | ABDM Gateway incoming consent and care-context notifications |
| `/api/ai` | `ai.routes.ts` | Authenticated | In-memory / Zod | Classical ML, Deep Learning risk models, Clinical NLP |
| `/api/digital-twin`| `digital-twin.routes.ts` | Authenticated | Zod (`simulationRequestSchema`) | Monte Carlo discrete event simulation, failover proposals |
| `/api/nexus` | `nexus.routes.ts` | Authenticated | Zod | Operations intelligence, Little's Law, Erlang C, 3D world model |
| `/api/enterprise`| `enterprise-workflows.routes.ts`| **DEFECT IDENTIFIED** | Controller-level check | Tube consolidation, STAT triage, CLSI AUTO10-A, Panic read-back |
| `/api/enterprise-tier2`| `enterprise-tier2.routes.ts`| **DEFECT IDENTIFIED** | Controller-level check | Microbiology AST, Reagent CPT recipes, B2B hub manifests |

---

## 3. Security Findings & Defect Analysis

### Confirmed Defect: Missing Router-Level Authentication on Clinical Workflows
- **Affected Route Files**:
  1. `backend/api/src/modules/approvals/approval.routes.ts`
  2. `backend/api/src/modules/enterprise-workflows/enterprise-workflows.routes.ts`
  3. `backend/api/src/modules/enterprise-workflows-tier2/enterprise-tier2.routes.ts`
- **Root Cause**:
  While individual controllers inspected `(req as any).user`, the route definitions failed to declare `router.use(authenticate)`. In `approval.routes.ts`, `/:id/verify-seal` and `/:id/verify-signature` correctly require public access for QR code report verification, but the rest of the file was left unguarded at the Express router level.
- **Severity**: `P1 — Major Permission & Security Guard Failure`
- **Required Fix**:
  1. In `approval.routes.ts`: Place public verification routes (`/:id/verify-seal`, `/:id/verify-signature`) at the top, then apply `router.use(authenticate);` and role-based guards on sign-off, amendment, and triage routes.
  2. In `enterprise-workflows.routes.ts`: Apply `router.use(authenticate);` and appropriate `authorize(...)` middleware.
  3. In `enterprise-tier2.routes.ts`: Apply `router.use(authenticate);` and appropriate `authorize(...)` middleware.

---

## 4. Concurrency, Idempotency & Error Handling

1. **Prisma Decimal Precision**:
   - Currency calculations across invoices, payments, doctor commissions, and B2B wallet ledgers use `Prisma.Decimal` to prevent JavaScript floating point inaccuracies.
2. **P2002 Unique Constraint Retries**:
   - High-throughput accessioning sequences (e.g. UHID and Order Number generation) feature transactional retry loops to defend against concurrent collision during peak hours.
3. **Idempotency Protection**:
   - Digital Twin and Enterprise Tier 1 endpoints implement SHA-256 idempotency hashing to prevent duplicate submission of the same batch or transaction.
4. **Error Handling Architecture**:
   - Centralized `errorMiddleware` in `backend/api/middleware/error.middleware.ts` intercepts all controller errors, distinguishes `HttpError` instances, maps Prisma database constraint errors to HTTP 400/409, and prevents stack trace leakage in production responses.
