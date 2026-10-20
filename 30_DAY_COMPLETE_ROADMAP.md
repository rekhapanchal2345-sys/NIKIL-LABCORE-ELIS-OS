# 🏥 NIKIL-LABCORE-ELIS-OS — COMPLETE 30-DAY ARCHITECTURE ROADMAP
> **Version:** 3.0.0-PRODUCTION  
> **Start Date:** 21 October 2026  
> **End Date:** 19 November 2026  
> **Goal:** 100% Production-Ready Enterprise LIS for Hospital, Lab, Clinic & Medical Deployment  
> **Author:** Principal Architecture Engineer  

---

## 📊 CURRENT STATE ANALYSIS (As of Day 0 — 20 Oct 2026)

### What's DONE ✅
| # | Module | Status | Completion |
|---|--------|--------|------------|
| 1 | Patient Registration & EMPI (UHID) | ✅ Complete | 100% |
| 2 | POS Billing & GST Financial Core | ✅ Complete | 100% |
| 3 | Specimen Barcode & ASTM/HL7 QC Engine | ✅ Complete | 100% |
| 4 | Auth Portal (Login, MFA, TOTP) | ✅ Complete | 100% |
| 5 | Omniscient Nexus Math Engine (19 Suites) | ✅ Complete | 100% |
| 6 | Digital Twin & 3D World Model | ✅ Complete | 100% |
| 7 | Docker Compose + Nginx Deployment Config | ✅ Complete | 100% |

### What's INCOMPLETE / GAPS 🔴
| # | Gap | Current % | Required Work |
|---|-----|-----------|---------------|
| 1 | Pathologist Sign-Off & Approvals Workstation | 75% | Digital signature & seal done ✅; Levey-Jennings & batch workflow pending (Day 2) |
| 2 | NABL PDF Engine (Puppeteer) | 0% | Server-side PDF, A4 templates, LOINC, QR verification |
| 3 | Public Report Verification Portal | 0% | `/verify-report/:id` with cryptographic QR |
| 4 | ABDM M1/M2/M3 Full Integration | 50% | Live Aadhaar OTP, FHIR bundle, consent exchange |
| 5 | WhatsApp Cloud API (Live) | 40% | Real template delivery, panic alerts, chatbot |
| 6 | Clinical AI Studio (Gemini Live) | 40% | Real API integration, CBC analyzer, risk cards |
| 7 | Multi-Branch Architecture | 50% | Tenant isolation, branch context switching |
| 8 | Cash Shift Daybook Reconciliation | 50% | Handover reports, difference alerts |
| 9 | Automated Backup & DR | 50% | Scheduled backups, restore validation |
| 10 | Enterprise UI/UX & Command Palette | 30% | Ctrl+K search, dark/light theme, WebSocket notifications |
| 11 | Comprehensive Test Suite | 20% | Unit tests, integration tests, E2E tests |
| 12 | Production Security Hardening | 60% | Penetration testing, OWASP, CSP policies |
| 13 | Performance Optimization | 40% | Database indexing, query optimization, caching |
| 14 | Real-World Data Seeding | 30% | Realistic test catalogs, reference ranges, doctors |
| 15 | User Documentation & Training | 20% | User manual, video guides, onboarding |

---

## 🗓️ 30-DAY ROADMAP — WEEK-BY-WEEK BREAKDOWN

---

## ═══════════════════════════════════════════════
## 📅 WEEK 1 (Days 1–7): CRITICAL CORE COMPLETION
## ═══════════════════════════════════════════════

> **Theme:** Complete all Phase 4 & 5 — the clinical backbone that makes the system usable

---

### 🔷 DAY 1 (21 Oct) — Pathologist Sign-Off: Digital Signature Engine ✅ COMPLETED (100% VERIFIED)

**Focus:** Complete Phase 4.2 — Digital Signature & Electronic Doctor Seal

| Task | Details | Priority | Status |
|------|---------|----------|--------|
| Implement `digital-signature.service.ts` | Upload digital signature image, store in `uploads/signatures/`, link to Doctor model | 🔴 CRITICAL | ✅ COMPLETED |
| Add signature seal rendering | Embed doctor's registered signature into approval flow with timestamp & NABL seal | 🔴 CRITICAL | ✅ COMPLETED |
| Tamper-evident audit logging | Every sign-off creates SHA-256 HMAC chained audit entry | 🔴 CRITICAL | ✅ COMPLETED |
| Frontend: Signature upload & preview UI | Doctor profile → upload/manage digital signature image & live seal preview | 🟡 HIGH | ✅ COMPLETED |
| API: `POST /api/doctors/:id/signature` | Upload endpoint with file validation (PNG/JPEG, max 500KB) | 🟡 HIGH | ✅ COMPLETED |
| API: `GET /api/doctors/:id/seal` | Return official NABL ISO 15189:2022 vector SVG seal | 🟡 HIGH | ✅ COMPLETED |
| API: `GET /api/approvals/:id/verify-signature` | Cryptographic tamper-detection verification endpoint | 🔴 CRITICAL | ✅ COMPLETED |

**Deliverable:** Pathologists can upload digital signatures and sign off diagnostic results with NABL ISO 15189:2022 electronic seals and HMAC-SHA256 blockchain-grade tamper-detection (Empirical suite: 5/5 tests passed).

---

### 🔷 DAY 2 (22 Oct) — Pathologist Sign-Off: Batch Approval & Levey-Jennings

**Focus:** Complete Phase 4.3 — Visual QC Charts & Batch Workflow

| Task | Details | Priority |
|------|---------|----------|
| Levey-Jennings chart component | Interactive Recharts-based L-J chart showing QC data with ±1s/±2s/±3s zones | 🔴 CRITICAL |
| Batch approval workflow | Multi-select results → batch approve with single signature | 🟡 HIGH |
| Panic alert triage desk | Color-coded priority queue: RED (panic HH/LL), YELLOW (abnormal), GREEN (normal) | 🟡 HIGH |
| Amendment workflow | Post-sign-off result amendments with audit trail and reason logging | 🟡 HIGH |
| Frontend: Approval workstation page polish | Complete `/approvals` page with queue, charts, and batch actions | 🟡 HIGH |

**Deliverable:** Phase 4 — 100% Complete. Pathologist workstation fully operational.

---

### 🔷 DAY 3 (23 Oct) — NABL PDF Engine: Core Generator

**Focus:** Begin Phase 5.1 — Puppeteer Server-Side PDF Generator

| Task | Details | Priority |
|------|---------|----------|
| Create `report.pdf.service.ts` | Puppeteer headless Chrome PDF generator with A4 page setup | 🔴 CRITICAL |
| NABL A4 header template | Lab letterhead, NABL accreditation number, NABH logo area, lab address | 🔴 CRITICAL |
| NABL A4 footer template | "Report generated by LabCore ELIS OS", page numbers, disclaimer text | 🔴 CRITICAL |
| Patient demographics section | UHID, Name, Age/Gender, Referring Doctor, Sample ID, Collection Date | 🔴 CRITICAL |
| Test results table | Parameter name, Result value, Unit, Reference Range, Flag (H/L/HH/LL) | 🔴 CRITICAL |
| Age/Gender dynamic reference ranges | Segmented ranges: Newborn, Infant, Pediatric, Adult, Senior Citizen | 🟡 HIGH |

**Deliverable:** Basic NABL-compliant PDF report generation working

---

### 🔷 DAY 4 (24 Oct) — NABL PDF Engine: QR, Barcodes & Multi-Page

**Focus:** Complete Phase 5.1 — Advanced PDF Features

| Task | Details | Priority |
|------|---------|----------|
| Vector barcode embedding | Code 128 barcode on PDF (Sample ID) using native vector rendering | 🔴 CRITICAL |
| QR code generation | Cryptographic QR code linking to `/verify-report/:reportId` | 🔴 CRITICAL |
| Doctor signature seal on PDF | Embed pathologist's digital signature and NABL seal image | 🔴 CRITICAL |
| Multi-page support | Automatic page breaks for reports with many tests, consistent headers/footers | 🟡 HIGH |
| LOINC code display | Show LOINC codes alongside test parameters for international standardization | 🟡 HIGH |
| PDF storage & retrieval | Store generated PDFs, link to Report model, serve via API | 🟡 HIGH |

**Deliverable:** Production-quality NABL ISO 15189:2022 PDFs with QR verification

---

### 🔷 DAY 5 (25 Oct) — Report Verification Portal & PDF Preview

**Focus:** Complete Phase 5.2 & 5.3

| Task | Details | Priority |
|------|---------|----------|
| Public verification route | `GET /verify-report/:reportId` — public page showing report authenticity | 🔴 CRITICAL |
| QR code cryptographic checksum | HMAC-SHA256 signed verification token embedded in QR | 🔴 CRITICAL |
| Verification page UI | Clean, public-facing page: "✅ This report is authentic" / "❌ Invalid" | 🟡 HIGH |
| PDF preview modal in web app | In-app PDF viewer with zoom, print, and download | 🟡 HIGH |
| PDF print workstation | Batch print multiple reports, select printer, paper size confirmation | 🟡 HIGH |
| Report addendum support | Add addendum notes to existing reports with version tracking | 🟡 HIGH |

**Deliverable:** Phase 5 — 100% Complete. NABL PDF + Public Verification Portal operational.

---

### 🔷 DAY 6 (26 Oct) — Real-World Test Catalog Seeding & Data

**Focus:** Populate realistic medical test data

| Task | Details | Priority |
|------|---------|----------|
| Seed 150+ diagnostic tests | CBC, LFT, KFT, Lipid Profile, Thyroid, HbA1c, Urine R/M, Cardiac Markers, etc. | 🔴 CRITICAL |
| Seed all parameters per test | e.g., CBC = 22 parameters (Hb, WBC, RBC, MCV, MCH, MCHC, Platelets, etc.) | 🔴 CRITICAL |
| Seed reference ranges | Age-segmented and gender-specific reference ranges for all parameters | 🔴 CRITICAL |
| Seed test packages | Health Checkup, Diabetes Panel, Thyroid Panel, Cardiac Risk Panel, etc. | 🟡 HIGH |
| Seed sample doctors | 20+ referring doctors with specialties, commission rates, contact details | 🟡 HIGH |
| Seed lab settings | Lab name, address, NABL number, GST number, logo, header/footer text | 🟡 HIGH |

**Deliverable:** Database populated with realistic Indian diagnostic laboratory data

---

### 🔷 DAY 7 (27 Oct) — End-to-End Clinical Workflow Testing

**Focus:** Test the complete Patient → Report journey

| Task | Details | Priority |
|------|---------|----------|
| Manual E2E walkthrough | Register patient → Create order → Collect sample → Enter results → Approve → Generate PDF | 🔴 CRITICAL |
| Debug all workflow blockers | Fix any broken API calls, missing validations, UI crashes in the flow | 🔴 CRITICAL |
| Verify barcode generation | Print test barcodes, verify Code 128 Mod-103 checksum | 🟡 HIGH |
| Verify GST invoice generation | Create order → auto-invoice → verify CGST/SGST/IGST calculations | 🟡 HIGH |
| Verify QC alerts fire correctly | Enter panic values (HH/LL) → verify WebSocket alert triggers | 🟡 HIGH |
| Week 1 Bug Fixes | Fix all bugs discovered during testing | 🔴 CRITICAL |

**Deliverable:** Complete clinical workflow proven end-to-end. Phase 4+5 verified.

> [!IMPORTANT]
> **WEEK 1 MILESTONE:** Core clinical workflow is 100% functional — Patient Registration → Billing → Sample Collection → Result Entry → Pathologist Approval → NABL PDF Report → Public QR Verification

---

## ═══════════════════════════════════════════════
## 📅 WEEK 2 (Days 8–14): COMPLIANCE & INTEGRATIONS
## ═══════════════════════════════════════════════

> **Theme:** ABDM compliance, WhatsApp delivery, and communication channels

---

### 🔷 DAY 8 (28 Oct) — ABDM M1: ABHA Verification

**Focus:** Phase 6.1 — ABHA ID Verification via Aadhaar OTP

| Task | Details | Priority |
|------|---------|----------|
| ABDM M1 Aadhaar OTP flow | `POST /api/abdm/abha/generate-otp` → Aadhaar OTP → `POST /api/abdm/abha/verify-otp` | 🔴 CRITICAL |
| ABHA address creation | Create ABHA health ID linked to patient UHID | 🔴 CRITICAL |
| Frontend: ABDM panel in patient form | ABHA ID input field with "Verify via Aadhaar" button | 🟡 HIGH |
| ABDM sandbox testing | Test against ABDM Sandbox environment (`https://abha.abdm.gov.in/sandbox`) | 🟡 HIGH |
| Store ABHA mapping | Link ABHA ID to Patient model, display on patient dossier | 🟡 HIGH |

**Deliverable:** ABDM M1 — ABHA patient linking via Aadhaar OTP operational

---

### 🔷 DAY 9 (29 Oct) — ABDM M2 & M3: Care Context & FHIR

**Focus:** Phase 6.2 — FHIR DiagnosticReport Bundle Generator

| Task | Details | Priority |
|------|---------|----------|
| ABDM M2 HIP registration | Register lab as Health Information Provider (HIP) in ABDM network | 🔴 CRITICAL |
| Care-context linking | Link each diagnostic order as a care context to patient's ABHA | 🔴 CRITICAL |
| FHIR DiagnosticReport bundle | Generate ABDM NRCES-compliant FHIR R4 DiagnosticReport resource | 🔴 CRITICAL |
| RSA webhook signature verification | Verify ABDM gateway callback webhooks using RSA SPKI public key | 🟡 HIGH |
| ABDM consent flow | Consent request → consent artifact → data sharing workflow | 🟡 HIGH |

**Deliverable:** ABDM M2+M3 — HIP registration, FHIR reports, consent exchange

---

### 🔷 DAY 10 (30 Oct) — DPDP Act 2023: Consent & Privacy

**Focus:** Phase 6.3 — Granular Consent & Data Protection

| Task | Details | Priority |
|------|---------|----------|
| Granular consent logging | Record consent for each purpose: treatment, billing, research, marketing | 🔴 CRITICAL |
| Consent withdrawal workflow | Patient can revoke specific consent types with audit trail | 🔴 CRITICAL |
| Data export capability | Patient can request full data export (Right to Data Portability) | 🟡 HIGH |
| Data erasure workflow | Right to be forgotten — anonymize PII with audit logging | 🟡 HIGH |
| Frontend: Consent management UI | Patient dossier → Consent tab showing all active/revoked consents | 🟡 HIGH |
| PII field audit | Verify AES-256-GCM encryption on all Aadhaar, PAN, and biometric fields | 🟡 HIGH |

**Deliverable:** Phase 6 — 100% Complete. Full ABDM + DPDP compliance.

---

### 🔷 DAY 11 (31 Oct) — WhatsApp Cloud API: Automated Report Delivery

**Focus:** Phase 7.1 — Automated Report Dispatch on Sign-Off

| Task | Details | Priority |
|------|---------|----------|
| WhatsApp Cloud API integration | Configure Meta Business API, verify business phone number | 🔴 CRITICAL |
| Message template registration | Register NABL report delivery template in WhatsApp Business Manager | 🔴 CRITICAL |
| Auto-dispatch hook | On pathologist sign-off → trigger WhatsApp PDF report to patient mobile | 🔴 CRITICAL |
| Delivery status tracking | Track message status (sent, delivered, read, failed) in `CommunicationLog` | 🟡 HIGH |
| Frontend: WhatsApp status in reports | Show delivery status icon on report list page | 🟡 HIGH |

**Deliverable:** Automatic WhatsApp report delivery on pathologist sign-off

---

### 🔷 DAY 12 (1 Nov) — WhatsApp Panic Alerts & Patient Chatbot

**Focus:** Phase 7.2 & 7.3

| Task | Details | Priority |
|------|---------|----------|
| Panic alert WhatsApp push | Critical values (HH/LL) → immediate WhatsApp alert to referring doctor | 🔴 CRITICAL |
| SMS panic fallback | If WhatsApp fails, send SMS alert as fallback | 🟡 HIGH |
| Patient inquiry chatbot | Two-way WhatsApp: patient sends UHID → receives report PDF link | 🟡 HIGH |
| Broadcast campaigns | WhatsApp campaign manager for health awareness, package promotions | 🟢 MEDIUM |
| Frontend: Communication hub page | Unified view of all WhatsApp/SMS/Email communications | 🟡 HIGH |

**Deliverable:** Phase 7 — 100% Complete. Omnichannel communication operational.

---

### 🔷 DAY 13 (2 Nov) — Clinical AI Studio: Gemini Integration

**Focus:** Phase 8.1 — Real Gemini AI Clinical Copilot

| Task | Details | Priority |
|------|---------|----------|
| Gemini API live integration | Replace mock AI with real Google Gemini API calls | 🔴 CRITICAL |
| PII sanitization layer | Strip all patient PII before sending to Gemini API (DPDP compliance) | 🔴 CRITICAL |
| Clinical report interpretation | AI generates summary interpretation of lab results | 🟡 HIGH |
| CBC scattergram analysis | AI pattern recognition on CBC differential counts | 🟡 HIGH |
| Thyroid profile differential diagnosis | AI-assisted thyroid function interpretation | 🟡 HIGH |
| Frontend: AI Studio polish | Conversational UI with medical result context cards | 🟡 HIGH |

**Deliverable:** Gemini AI clinical copilot with PII-safe diagnostic insights

---

### 🔷 DAY 14 (3 Nov) — AI Risk Cards & Week 2 Integration Testing

**Focus:** Phase 8.2/8.3 + Comprehensive Integration Testing

| Task | Details | Priority |
|------|---------|----------|
| Clinical risk prediction cards | AI-generated risk assessment cards with color-coded severity | 🟡 HIGH |
| Doctor override safety flags | Doctor can acknowledge/override AI suggestions with audit trail | 🟡 HIGH |
| Drug-drug interaction alerts | Basic interaction checking for common medications | 🟢 MEDIUM |
| Integration test: ABDM → FHIR → WhatsApp | End-to-end: result approved → FHIR bundle → WhatsApp delivery | 🔴 CRITICAL |
| Integration test: Panic flow | Panic result → WebSocket alert → WhatsApp to doctor → SMS fallback | 🔴 CRITICAL |
| Week 2 Bug Fixes | Fix all bugs discovered during integration testing | 🔴 CRITICAL |

**Deliverable:** Phase 8 — 100% Complete. All integrations verified end-to-end.

> [!IMPORTANT]
> **WEEK 2 MILESTONE:** All compliance integrations operational — ABDM M1/M2/M3, DPDP Act, WhatsApp Cloud API, SMS alerts, Gemini AI Clinical Studio

---

## ═══════════════════════════════════════════════
## 📅 WEEK 3 (Days 15–21): ENTERPRISE OPS & HARDENING
## ═══════════════════════════════════════════════

> **Theme:** Multi-branch, security hardening, performance, testing

---

### 🔷 DAY 15 (4 Nov) — Multi-Branch Architecture

**Focus:** Phase 9.1 — Branch Tenant Isolation

| Task | Details | Priority |
|------|---------|----------|
| Branch model & context | Add `Branch` model with `branchId` column on all transactional tables | 🔴 CRITICAL |
| Middleware: branch context injection | JWT token carries `branchId`, middleware auto-filters all queries | 🔴 CRITICAL |
| Branch switching UI | Header dropdown to switch between branches (for multi-branch users) | 🟡 HIGH |
| Data isolation verification | Ensure Branch A cannot see Branch B's patients, orders, or financial data | 🔴 CRITICAL |
| Branch-level settings | Each branch has own lab name, address, NABL number, letterhead | 🟡 HIGH |
| Cross-branch reporting | Admin/HQ can see aggregate reports across all branches | 🟡 HIGH |

**Deliverable:** Multi-branch tenant isolation with data segregation

---

### 🔷 DAY 16 (5 Nov) — Cash Shift Daybook & Backup/DR

**Focus:** Phase 9.2 & 9.3

| Task | Details | Priority |
|------|---------|----------|
| Shift handover daybook | End-of-shift report: total collections, payment mode breakdown, discrepancies | 🔴 CRITICAL |
| Physical currency breakdown | Rs. 2000, 500, 200, 100, 50, 20, 10, 5, 2, 1 denomination counting | 🟡 HIGH |
| Automated difference alerts | Flag if physical cash count doesn't match digital total | 🟡 HIGH |
| Automated database backup | Cron job: daily `pg_dump` with AES-256 encryption at 2 AM | 🔴 CRITICAL |
| Backup restore validation | Test restore from backup to verify data integrity | 🔴 CRITICAL |
| Backup retention policy | Keep 7 daily + 4 weekly + 3 monthly backups, auto-cleanup old ones | 🟡 HIGH |

**Deliverable:** Phase 9 — 100% Complete. Multi-branch + financial reconciliation + DR.

---

### 🔷 DAY 17 (6 Nov) — Enterprise UI: Command Palette

**Focus:** Phase 10.1 — `Ctrl+K` Command Palette

| Task | Details | Priority |
|------|---------|----------|
| Command palette component | Global `Ctrl+K` / `Cmd+K` overlay for instant search | 🔴 CRITICAL |
| Multi-entity search | Search patients (UHID, name, phone), orders, samples, tests, doctors | 🔴 CRITICAL |
| Quick actions | "New Patient", "New Order", "Open Cash Counter", "Generate Report" shortcuts | 🟡 HIGH |
| Keyboard navigation | Arrow keys, Enter to select, Escape to close | 🟡 HIGH |
| Recent searches | Show last 10 searches for quick re-access | 🟢 MEDIUM |
| Fuzzy search algorithm | Approximate matching for misspelled names | 🟡 HIGH |

**Deliverable:** Enterprise Command Palette with global multi-entity search

---

### 🔷 DAY 18 (7 Nov) — Enterprise UI: Theme & Notifications

**Focus:** Phase 10.2 & 10.3

| Task | Details | Priority |
|------|---------|----------|
| Dark/Light theme system | CSS custom properties, localStorage persistence, smooth transitions | 🟡 HIGH |
| Real-time WebSocket notifications | Socket.io notification desk: new orders, panic alerts, shift alerts | 🔴 CRITICAL |
| Sound alerts for panic values | Audio notification (chime/alarm) when HH/LL panic values arrive | 🟡 HIGH |
| Toast notification system | Dismissible toast notifications for all CRUD operations | 🟡 HIGH |
| Responsive data grids | All table pages responsive on tablet/mobile with horizontal scroll | 🟡 HIGH |
| Design system polish | Consistent spacing, typography, color palette, micro-animations | 🟡 HIGH |

**Deliverable:** Phase 10 — 100% Complete. Premium enterprise UI/UX.

---

### 🔷 DAY 19 (8 Nov) — Security Hardening & OWASP

**Focus:** Production Security Audit

| Task | Details | Priority |
|------|---------|----------|
| OWASP Top 10 review | SQL injection, XSS, CSRF, broken auth, sensitive data exposure | 🔴 CRITICAL |
| CSP headers hardening | Tighten Content-Security-Policy via Helmet to block inline scripts | 🔴 CRITICAL |
| Rate limiting review | Verify rate limits on all auth endpoints (login, OTP, MFA) | 🔴 CRITICAL |
| Input sanitization audit | Verify Zod validation on every API endpoint's body/params/query | 🟡 HIGH |
| JWT token security | Verify token expiry (15min access, 7d refresh), rotation, blacklisting | 🟡 HIGH |
| CORS policy tightening | Restrict to exact production domains only | 🟡 HIGH |
| File upload security | Verify MIME type checks, file size limits, path traversal prevention | 🟡 HIGH |
| SQL injection sweep | Parameterized queries verification across all Prisma queries | 🟡 HIGH |

**Deliverable:** OWASP-compliant security hardening complete

---

### 🔷 DAY 20 (9 Nov) — Performance Optimization

**Focus:** Database & API Performance

| Task | Details | Priority |
|------|---------|----------|
| Database index audit | Add missing indexes on foreign keys, frequently queried columns | 🔴 CRITICAL |
| Query optimization | Identify N+1 queries using Prisma query logging, fix with `include`/`select` | 🔴 CRITICAL |
| Redis caching layer | Cache frequently accessed data: test catalog, reference ranges, lab settings | 🟡 HIGH |
| API response time benchmarking | Measure P50/P95/P99 response times for all critical endpoints | 🟡 HIGH |
| Connection pool tuning | Optimize `DB_POOL_MAX`/`DB_POOL_MIN` based on load testing | 🟡 HIGH |
| Frontend bundle optimization | Next.js bundle analysis, code splitting, lazy loading of heavy components | 🟡 HIGH |
| Image optimization | Compress logo/signature images, use WebP format | 🟢 MEDIUM |

**Deliverable:** All critical APIs respond under 200ms at P95

---

### 🔷 DAY 21 (10 Nov) — Comprehensive Test Suite

**Focus:** Automated Testing Framework

| Task | Details | Priority |
|------|---------|----------|
| Unit test framework setup | Vitest/Jest configuration for backend services | 🔴 CRITICAL |
| Auth module unit tests | Login, register, MFA, token refresh, password reset | 🔴 CRITICAL |
| Patient module unit tests | CRUD, duplicate detection, PII encryption/masking | 🟡 HIGH |
| Billing module unit tests | GST calculation, payment idempotency, refund flow | 🟡 HIGH |
| Sample lifecycle unit tests | 7-stage state machine transitions, barcode generation | 🟡 HIGH |
| Report generation unit tests | PDF generation, QR verification, addendum flow | 🟡 HIGH |
| API integration test suite | HTTP-level tests for all 200+ endpoints | 🟡 HIGH |

**Deliverable:** 70%+ code coverage with automated test suite

> [!IMPORTANT]
> **WEEK 3 MILESTONE:** Enterprise features complete — Multi-branch, Command Palette, Dark/Light theme, Security hardened, Performance optimized, Test coverage at 70%+

---

## ═══════════════════════════════════════════════
## 📅 WEEK 4 (Days 22–28): PRODUCTION DEPLOYMENT
## ═══════════════════════════════════════════════

> **Theme:** Deploy to production, documentation, training, real-world validation

---

### 🔷 DAY 22 (11 Nov) — Production Environment Setup

**Focus:** Server Infrastructure

| Task | Details | Priority |
|------|---------|----------|
| Production server provisioning | Ubuntu 24.04 LTS VPS (min 4 vCPU, 8GB RAM, 100GB SSD) | 🔴 CRITICAL |
| Domain & SSL setup | `elis.yourhospital.com` with Certbot Let's Encrypt TLS 1.3 | 🔴 CRITICAL |
| Docker Compose production deploy | `docker compose -f docker-compose.prod.yml up -d --build` | 🔴 CRITICAL |
| Environment variables configuration | All production secrets, API keys, database credentials | 🔴 CRITICAL |
| Nginx production config | Reverse proxy, SSL termination, WebSocket upgrade, gzip compression | 🔴 CRITICAL |
| Firewall rules | UFW: allow 80, 443, 5005 (analyzer) only | 🟡 HIGH |

**Deliverable:** Production server running with SSL and all services healthy

---

### 🔷 DAY 23 (12 Nov) — Production Database & Monitoring

**Focus:** Database Migration & Observability

| Task | Details | Priority |
|------|---------|----------|
| Production database migration | `prisma migrate deploy` on production PostgreSQL | 🔴 CRITICAL |
| Super admin user creation | `admin@labcore.local` with HMAC-peppered password | 🔴 CRITICAL |
| Seed production test catalog | All 150+ diagnostic tests, parameters, reference ranges | 🔴 CRITICAL |
| PM2 process monitoring | PM2 process table with auto-restart, memory limits | 🟡 HIGH |
| Application logging | Structured JSON logging with log rotation (Winston/Pino) | 🟡 HIGH |
| Health check endpoints | `GET /api/health` → DB ping, Redis ping, disk space, memory usage | 🟡 HIGH |
| Uptime monitoring | External uptime monitor (UptimeRobot/Better Uptime) | 🟡 HIGH |

**Deliverable:** Production database seeded, monitoring active, health checks passing

---

### 🔷 DAY 24 (13 Nov) — Production Smoke Testing

**Focus:** Real-World Production Validation

| Task | Details | Priority |
|------|---------|----------|
| Smoke test: User registration & login | Create admin, receptionist, pathologist, phlebotomist users | 🔴 CRITICAL |
| Smoke test: Complete clinical workflow | Register patient → Order → Sample → Results → Approve → PDF → WhatsApp | 🔴 CRITICAL |
| Smoke test: Billing flow | Create order → Generate invoice → Accept payment → Print receipt | 🔴 CRITICAL |
| Smoke test: Multi-user concurrency | Multiple users working simultaneously on different modules | 🟡 HIGH |
| Smoke test: Mobile responsiveness | Test all pages on mobile Chrome/Safari | 🟡 HIGH |
| Smoke test: Analyzer connection (TCP 5005) | Connect ASTM/HL7 test simulator to production port 5005 | 🟡 HIGH |
| Fix all production bugs | Address any issues found during smoke testing | 🔴 CRITICAL |

**Deliverable:** All production smoke tests passing

---

### 🔷 DAY 25 (14 Nov) — User Roles & RBAC Configuration

**Focus:** Real-World Access Control

| Task | Details | Priority |
|------|---------|----------|
| Define role permissions matrix | SUPER_ADMIN, ADMIN, PATHOLOGIST, LAB_TECH, PHLEBOTOMIST, RECEPTIONIST, ACCOUNTANT | 🔴 CRITICAL |
| Implement granular permissions | Module-level: view/create/edit/delete per role | 🔴 CRITICAL |
| Frontend route guards | Redirect unauthorized users to `/unauthorized` page | 🔴 CRITICAL |
| API endpoint authorization | Middleware checks role before allowing access to each endpoint | 🔴 CRITICAL |
| Create default users per role | One sample user per role for training purposes | 🟡 HIGH |
| Role-based sidebar menu | Show only relevant menu items per user role | 🟡 HIGH |

**Deliverable:** Complete RBAC with real-world role definitions

---

### 🔷 DAY 26 (15 Nov) — User Documentation & Manuals

**Focus:** Documentation for Hospital Staff

| Task | Details | Priority |
|------|---------|----------|
| User Manual: Receptionist guide | Patient registration, order creation, billing, receipt printing | 🔴 CRITICAL |
| User Manual: Phlebotomist guide | Sample collection, barcode printing, specimen tracking | 🔴 CRITICAL |
| User Manual: Lab technician guide | Result entry, QC evaluation, analyzer interface | 🔴 CRITICAL |
| User Manual: Pathologist guide | Approval queue, sign-off, PDF review, amendments | 🔴 CRITICAL |
| User Manual: Admin guide | Settings, user management, branch management, backups | 🟡 HIGH |
| API Documentation | Swagger/OpenAPI spec for all 200+ endpoints | 🟡 HIGH |
| Troubleshooting FAQ | Common issues and solutions | 🟡 HIGH |

**Deliverable:** Complete user documentation for all hospital roles

---

### 🔷 DAY 27 (16 Nov) — Load Testing & Stress Testing

**Focus:** Production Capacity Validation

| Task | Details | Priority |
|------|---------|----------|
| Load test tool setup | k6/Artillery for API load testing | 🟡 HIGH |
| Concurrent user simulation | 50 concurrent users performing typical operations | 🔴 CRITICAL |
| API throughput benchmarks | Target: 1000+ requests/minute for read endpoints | 🟡 HIGH |
| Database connection stress | Verify pool handles 30 concurrent connections without errors | 🟡 HIGH |
| WebSocket stress test | 100 simultaneous WebSocket connections for real-time updates | 🟡 HIGH |
| Memory leak detection | Monitor Node.js heap usage over 24-hour run | 🟡 HIGH |
| Performance optimization fixes | Fix any bottlenecks found during load testing | 🔴 CRITICAL |

**Deliverable:** System validated for 50+ concurrent users, 1000+ req/min

---

### 🔷 DAY 28 (17 Nov) — Disaster Recovery Drill & Backup Verification

**Focus:** Business Continuity

| Task | Details | Priority |
|------|---------|----------|
| Automated backup verification | Trigger backup → verify backup file → test restore to staging | 🔴 CRITICAL |
| Point-in-time recovery test | Restore database to specific timestamp | 🟡 HIGH |
| Failover simulation | Stop backend container → verify auto-restart via PM2/Docker | 🟡 HIGH |
| Data integrity audit | Compare production data counts with backup data counts | 🟡 HIGH |
| Incident response runbook | Document steps for: server down, database corrupt, security breach | 🟡 HIGH |
| Backup monitoring alerts | Email alert if daily backup fails | 🟡 HIGH |

**Deliverable:** Disaster recovery validated, incident runbook created

> [!IMPORTANT]
> **WEEK 4 MILESTONE:** System deployed to production, smoke tested, load tested, documented, DR validated, RBAC configured, ready for hospital staff

---

## ═══════════════════════════════════════════════
## 📅 WEEK 5 (Days 29–30): FINAL POLISH & GO-LIVE
## ═══════════════════════════════════════════════

> **Theme:** Final validation, real-world pilot, go-live sign-off

---

### 🔷 DAY 29 (18 Nov) — Final Quality Audit & Bug Bash

**Focus:** Comprehensive Quality Check

| Task | Details | Priority |
|------|---------|----------|
| Full E2E regression test | Run complete test suite: unit + integration + E2E | 🔴 CRITICAL |
| Cross-browser testing | Chrome, Firefox, Edge, Safari on Desktop & Mobile | 🟡 HIGH |
| Accessibility audit | Screen reader compatibility, keyboard navigation, color contrast | 🟡 HIGH |
| Data validation audit | Verify all Zod schemas validate correctly for edge cases | 🟡 HIGH |
| Security final scan | Run OWASP ZAP scan against production URL | 🟡 HIGH |
| Performance final check | Verify all critical APIs < 200ms P95 | 🟡 HIGH |
| Fix ALL remaining bugs | Zero known critical/high bugs before go-live | 🔴 CRITICAL |
| Update VERSION to `3.0.0` | Bump version, update ARCHITECTURE.md, update ROADMAP.md | 🟡 HIGH |

**Deliverable:** Zero critical bugs, all tests passing, production-quality verified

---

### 🔷 DAY 30 (19 Nov) — GO-LIVE & Production Sign-Off

**Focus:** Official Launch

| Task | Details | Priority |
|------|---------|----------|
| Production readiness checklist | Run `npm run verify:prod` — ALL 12/12 checks must pass | 🔴 CRITICAL |
| Create hospital staff accounts | Real users: receptionist, phlebotomist, lab tech, pathologist, admin | 🔴 CRITICAL |
| Staff training session | 2-hour walkthrough of each role's workflow using real system | 🔴 CRITICAL |
| First real patient registration | Register first patient with real UHID in production | 🔴 CRITICAL |
| First real diagnostic order | Create first order, collect sample, enter results, approve, generate PDF | 🔴 CRITICAL |
| WhatsApp delivery verification | Verify PDF report delivered to patient's WhatsApp | 🟡 HIGH |
| Go-Live sign-off document | Formal sign-off from lab director/hospital admin | 🔴 CRITICAL |
| Post-go-live monitoring plan | Define 48-hour monitoring plan with on-call schedule | 🟡 HIGH |

**Deliverable:** 🎉 **NIKIL-LABCORE-ELIS-OS v3.0.0 — LIVE IN PRODUCTION!**

---

## 📊 30-DAY PROGRESS TRACKER

| Week | Days | Theme | Key Deliverables |
|------|------|-------|-----------------|
| **Week 1** | 1–7 | Core Clinical Completion | ✅ Pathologist Sign-Off, NABL PDF Engine, QR Verification, Test Catalog Seed, E2E Workflow |
| **Week 2** | 8–14 | Compliance & Integrations | ✅ ABDM M1/M2/M3, DPDP Act, WhatsApp Cloud API, Gemini AI Studio |
| **Week 3** | 15–21 | Enterprise Ops & Hardening | ✅ Multi-Branch, Command Palette, Security, Performance, Testing |
| **Week 4** | 22–28 | Production Deployment | ✅ Server Setup, Database, Smoke Tests, RBAC, Documentation, Load Test, DR |
| **Week 5** | 29–30 | Final Polish & Go-Live | ✅ Quality Audit, Bug Bash, Staff Training, Go-Live Sign-Off |

---

## 🏗️ ARCHITECTURE AT END OF 30 DAYS

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                  NIKIL-LABCORE-ELIS-OS v3.0.0 — PRODUCTION                 ║
║                Complete Enterprise Laboratory Information System            ║
╚══════════════════════════════════════════════════════════════════════════════╝

 ┌─── PRESENTATION TIER ────────────────────────────────────────────────────┐
 │  🖥️  Clinical Web App (Next.js 15) — Port 3001                          │
 │  🔐 Auth Portal (Vite + React 19) — Port 3002                           │
 │  🌐 Public Verification Portal — /verify-report/:id                     │
 │  🎨 Enterprise UI: Command Palette, Dark/Light Theme, WebSocket Alerts  │
 └──────────────────────────────────┬───────────────────────────────────────┘
                                    │ HTTPS / WSS (TLS 1.3)
 ┌─── NGINX REVERSE PROXY ─────────┼───────────────────────────────────────┐
 │  SSL/TLS Termination → Gzip → WebSocket Upgrade → Load Balancing       │
 │  Ports: 80 (HTTP→HTTPS) / 443 (HTTPS)                                  │
 └──────────────────────────────────┼───────────────────────────────────────┘
                                    │
 ┌─── APPLICATION TIER ─────────────┼───────────────────────────────────────┐
 │  Node.js + Express 5 + TypeScript 5.9 — Port 5000                      │
 │                                                                          │
 │  35 DOMAIN MODULES (28 Original + 7 New)                                │
 │  ┌─────────────────────┬──────────────────┬────────────────────────┐    │
 │  │  CLINICAL CORE      │  FINANCIAL       │  COMPLIANCE            │    │
 │  │  • auth             │  • invoices      │  • abdm (M1/M2/M3) ✅ │    │
 │  │  • patients (EMPI)  │  • payments      │  • audit              │    │
 │  │  • doctors          │  • cash-counter  │  • settings           │    │
 │  │  • tests/catalog    │  • advances      │  • dpdp-consent ✅    │    │
 │  │  • orders           │  • refunds       │                        │    │
 │  │  • samples          │  • settlements   │  OPERATIONS            │    │
 │  │  • barcode          │  • receivables   │  • dashboard          │    │
 │  │  • analyzers (5005) │  • receipts      │  • backup (auto-DR)✅ │    │
 │  │  • results          │                  │  • notifications      │    │
 │  │  • approvals ✅     │  COMMUNICATION   │  • users              │    │
 │  │  • reports (PDF) ✅ │  • whatsapp ✅   │  • branch-mgmt ✅    │    │
 │  │  • ai (Gemini) ✅   │  • communications│                        │    │
 │  │  • digital-twin     │  • sms           │  INTELLIGENCE          │    │
 │  │  • nexus            │                  │  • nexus-math-engine  │    │
 │  │  • microbiology     │                  │  • command-palette ✅ │    │
 │  │  • inventory        │                  │                        │    │
 │  └─────────────────────┴──────────────────┴────────────────────────┘    │
 │                                                                          │
 │  🐍 Gemini Spark MCP Bridge (FastAPI) — AI clinical insights            │
 │  🤖 Gemini OpenAI Proxy (FastAPI) — AI compatibility layer              │
 └──────────────────────────────────┼───────────────────────────────────────┘
                                    │ Prisma ORM 7.9 (pg adapter)
 ┌─── PERSISTENCE TIER ─────────────┼───────────────────────────────────────┐
 │  PostgreSQL 16 — Port 5432 (Primary, Connection Pool: 30)               │
 │  Redis 7 — Port 6379 (Sessions, Rate Limits, Cache)                     │
 │  81+ Prisma Models | Multi-Branch Tenant Isolation                      │
 └──────────────────────────────────────────────────────────────────────────┘

 ┌─── EXTERNAL INTEGRATIONS ────────────────────────────────────────────────┐
 │  ✅ ABDM Gateway (ABHA M1/M2/M3)     ✅ WhatsApp Cloud API             │
 │  ✅ Gemini AI API                      ✅ SMS Gateway                    │
 │  ✅ SMTP/Gmail (Nodemailer)            ✅ ASTM/HL7 Analyzers (TCP 5005) │
 │  ✅ Thermal Label Printers             ✅ ESC/POS Receipt Printers      │
 └──────────────────────────────────────────────────────────────────────────┘

 ┌─── SECURITY & COMPLIANCE ────────────────────────────────────────────────┐
 │  ✅ NABL ISO 15189:2022     ✅ ABDM / ABHA v0.5                        │
 │  ✅ DPDP Act 2023           ✅ GST India                                │
 │  ✅ OWASP Top 10            ✅ TLS 1.3                                  │
 │  ✅ AES-256-GCM Encryption  ✅ HMAC-SHA256 Audit Chain                  │
 │  ✅ Bcrypt 12 + HMAC Pepper ✅ TOTP MFA (RFC 6238)                     │
 └──────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ FINAL CHECKLIST — PRODUCTION READINESS

| # | Check | Target |
|---|-------|--------|
| 1 | All 10 Phases Complete | ✅ 100% |
| 2 | All 200+ API Endpoints Working | ✅ 100% |
| 3 | NABL PDF Engine Generating Reports | ✅ 100% |
| 4 | Public QR Verification Portal Live | ✅ 100% |
| 5 | ABDM M1/M2/M3 Integration | ✅ 100% |
| 6 | WhatsApp Report Delivery | ✅ 100% |
| 7 | Gemini AI Clinical Copilot | ✅ 100% |
| 8 | Multi-Branch Architecture | ✅ 100% |
| 9 | Automated Backup & DR Verified | ✅ 100% |
| 10 | Enterprise UI (Ctrl+K, Themes, WebSocket) | ✅ 100% |
| 11 | RBAC with 7 Role Types | ✅ 100% |
| 12 | Test Coverage > 70% | ✅ 100% |
| 13 | Security Hardened (OWASP) | ✅ 100% |
| 14 | Performance: P95 < 200ms | ✅ 100% |
| 15 | Load: 50+ Concurrent Users | ✅ 100% |
| 16 | User Documentation for All Roles | ✅ 100% |
| 17 | Staff Training Complete | ✅ 100% |
| 18 | Production Deployed with SSL | ✅ 100% |
| 19 | 150+ Test Catalog Seeded | ✅ 100% |
| 20 | Go-Live Sign-Off | ✅ 100% |

---

## 📋 DAILY EXECUTION COMMANDS (Quick Reference)

```bash
# Development
npm run dev                          # Start backend in development
npm --prefix frontend/apps/web run dev  # Start frontend in development
npm --prefix login-portal run dev    # Start auth portal in development

# Build & Deploy
npm run build:all                    # Build all services
npm run deploy:migrate               # Run database migrations
npm run verify:prod                  # Verify production readiness

# Docker Production
npm run docker:prod:up               # Start all production containers
npm run docker:prod:down             # Stop all production containers
docker compose -f docker-compose.prod.yml logs -f  # View logs

# PM2 (Bare-Metal)
npm run pm2:start                    # Start with PM2
npm run pm2:restart                  # Graceful restart
pm2 logs                             # View all logs
pm2 status                           # Process health

# Testing
npm test                             # Run test suite
npm --prefix backend run typecheck   # TypeScript type checking

# Database
npm run prisma:generate              # Generate Prisma client
npm run prisma:migrate               # Create new migration
```

---

> **Document Status:** ACTIVE EXECUTION ROADMAP  
> **Created:** 20 October 2026  
> **Target Completion:** 19 November 2026  
> **Current Version:** 2.5.0 → Target Version: 3.0.0-PRODUCTION  

---

*This 30-day roadmap transforms NIKIL-LABCORE-ELIS-OS from a development project into a production-grade enterprise system ready for deployment in hospitals, diagnostic labs, clinics, and medical facilities across India.*
