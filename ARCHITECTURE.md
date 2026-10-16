# 🏥 NIKIL-LABCORE-ELIS-OS — Complete Enterprise Architecture Plan
> **Version:** 2.5.0-PRO  
> **Prepared by:** Senior Architecture Plan Engineer  
> **Date:** October 14, 2026 (Updated: October 16, 2026 — 100% Production & Deploy Verified)  
> **Standards Compliance:** NABL (ISO 15189:2022) | ABDM / ABHA v0.5 (M1/M2/M3) | DPDP Act 2023 | GST India

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Overview & Vision](#2-system-overview--vision)
3. [High-Level Architecture Diagram](#3-high-level-architecture-diagram)
4. [Layer-by-Layer Architecture](#4-layer-by-layer-architecture)
   - [4.1 Presentation Layer (Frontend)](#41-presentation-layer-frontend)
   - [4.2 Application Layer (Backend)](#42-application-layer-backend)
   - [4.3 Persistence Layer (Database)](#43-persistence-layer-database)
   - [4.4 AI / Bridge Services Layer](#44-ai--bridge-services-layer)
5. [Module Architecture — All 28 Backend Modules](#5-module-architecture--all-28-backend-modules)
6. [Database Schema Architecture (81 Models)](#6-database-schema-architecture-81-models)
7. [Core Clinical Workflow & Data Flow](#7-core-clinical-workflow--data-flow)
8. [Security Architecture](#8-security-architecture)
9. [API Architecture & Endpoint Catalog](#9-api-architecture--endpoint-catalog)
10. [Technology Stack — Full Inventory](#10-technology-stack--full-inventory)
11. [Infrastructure & Deployment Architecture](#11-infrastructure--deployment-architecture)
12. [Regulatory Compliance Architecture](#12-regulatory-compliance-architecture)
13. [Integration Architecture](#13-integration-architecture)
14. [Development Roadmap Progress](#14-development-roadmap-progress)
15. [Technical Debt & Risk Register (100% Resolved)](#15-technical-debt--risk-register-100-resolved)
16. [Architectural Decisions Log (ADR)](#16-architectural-decisions-log-adr)

---

## 1. Executive Summary

**LabCore ELIS OS** (Enterprise Laboratory Information System & Operating System) is an **enterprise-grade, clinical-grade, India-first** diagnostic laboratory management platform. It is purpose-built for:

- **Diagnostic Pathology Laboratories** (standalone & chain)
- **Hospital Diagnostic Networks** (multi-branch)
- **NABL-Accredited Clinical Laboratories** (ISO 15189:2022)
- **Government ABDM-Integrated Healthcare Facilities** (ABHA)

### Key Metrics at a Glance

| Attribute | Value |
|-----------|-------|
| **Backend Modules** | 28 Domain Modules |
| **Database Models** | 81 Prisma Models |
| **API Endpoints** | 200+ REST endpoints |
| **Frontend Applications** | 3 (Clinical Web App, Auth Portal, Legacy) |
| **Compliance Standards** | NABL, ABDM, DPDP Act 2023, GST India |
| **Primary Language** | TypeScript (backend + frontend) |
| **Database** | PostgreSQL 14+ (via Prisma ORM) |
| **Current Phase** | Phase 4 & 5 Operational — Sign-Off Workstation & PDF Engine |
| **Production Readiness** | 100% Verified (All 12/12 Preflight Checks Passed) |

---

## 2. System Overview & Vision

### 2.1 What is LabCore ELIS OS?

LabCore ELIS OS is a **fully integrated Laboratory Information System (LIS)** that automates the complete diagnostic laboratory workflow from patient registration to report delivery. It replaces fragmented manual processes with a unified digital platform that enforces:

- **Clinical safety** via QC rules and panic alerts
- **Regulatory compliance** via NABL, ABDM, and DPDP standards
- **Financial accuracy** via idempotent GST billing
- **Operational efficiency** via automated barcode-driven specimen tracking

### 2.2 Core Value Proposition

```
Patient walks in  →  [Receptionist registers + order]
                  →  [Phlebotomist collects specimen with barcode]
                  →  [Analyzer processes → ASTM/HL7 data on port 5005]
                  →  [QC Engine validates → Panic alerts if critical]
                  →  [Pathologist reviews + signs off]
                  →  [NABL PDF report generated + WhatsApp delivered]
                  →  [ABDM FHIR record linked to ABHA ID]
```

### 2.3 System Boundaries

**In Scope:**
- Patient demographic management (DPDP compliant with AES-256-GCM encryption)
- Diagnostic test ordering & specimen management
- Analyzer instrument interfacing (ASTM E1381 & HL7 v2.x MLLP on TCP 5005)
- Clinical quality control (Westgard rules)
- Financial POS (GST billing, payments, reconciliation)
- Report generation (NABL-compliant PDF with native vector Barcodes & QR codes)
- Government ABDM integration (ABHA v0.5 M1/M2/M3)
- Multi-channel communication (WhatsApp, SMS, Email)
- AI-assisted clinical intelligence (Gemini AI with PII sanitization)

**Out of Scope:**
- Electronic Health Records (EHR) beyond diagnostics
- Pharmacy management
- Ward management / Inpatient care
- Radiology PACS/RIS

---

## 3. High-Level Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                          NIKIL-LABCORE-ELIS-OS SYSTEM                               ║
║                    Enterprise Laboratory Information System                          ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION TIER                                        │
│                                                                                       │
│   ┌─────────────────────────────────────┐  ┌────────────────────────────────────┐   │
│   │   🖥️  Clinical Web Application       │  │   🔐 Authentication Portal          │   │
│   │   Next.js 15 / React 18             │  │   Vite 8.3 / React 19              │   │
│   │   Port: 3001                         │  │   Port: 5173 / 3002                │   │
│   │                                     │  │                                    │   │
│   │   • Patient Dossier                 │  │   • Login (Email / Employee Code)  │   │
│   │   • Phlebotomy Workstation          │  │   • TOTP MFA Setup & Verification  │   │
│   │   • Results Entry                   │  │   • Forgot Password Flow           │   │
│   │   • Pathologist Sign-Off            │  │   • Brute-Force Protection         │   │
│   │   • Billing & Cash Counter          │  │   • Device Fingerprinting          │   │
│   │   • Analytics Dashboard             │  │                                    │   │
│   │   • AI Clinical Studio              │  │   State: Zustand                   │   │
│   │   • ABDM Integration Panel          │  │   Routing: React Router v7         │   │
│   │   • WhatsApp Communications         │  │                                    │   │
│   └──────────────────┬──────────────────┘  └─────────────────┬──────────────────┘   │
└─────────────────────┼──────────────────────────────────────┼────────────────────────┘
                       │  HTTP/JSON REST + WebSocket (Socket.io)│  HTTP/JSON REST
                       ▼                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY & APPLICATION TIER                                │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │             Primary Backend: Node.js + Express 5.2 + TypeScript 5.9           │  │
│  │                     Port: 5000 (REST / Sockets) & Port: 5005 (TCP)             │  │
│  │                                                                                │  │
│  │  🔒 Security Middleware Stack:                                                 │  │
│  │  Helmet (CSP) → CORS → Rate Limiter → IP Guard → Suspicious Detector          │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    28 DOMAIN MODULES                                     │  │  │
│  │  │                                                                          │  │  │
│  │  │  CLINICAL CORE              FINANCIAL CORE          COMPLIANCE           │  │  │
│  │  │  ├─ auth                    ├─ invoices              ├─ abdm             │  │  │
│  │  │  ├─ patients (EMPI)         ├─ payments              ├─ audit            │  │  │
│  │  │  ├─ doctors                 ├─ cash-counter          └─ settings         │  │  │
│  │  │  ├─ tests/catalog           ├─ advances                                  │  │  │
│  │  │  ├─ orders                  ├─ refunds               OPERATIONS          │  │  │
│  │  │  ├─ samples                 ├─ settlements           ├─ dashboard        │  │  │
│  │  │  ├─ barcode                 └─ receivables           ├─ backup           │  │  │
│  │  │  ├─ analyzers (TCP 5005)                             ├─ notifications    │  │  │
│  │  │  ├─ results                 COMMUNICATION            └─ users            │  │  │
│  │  │  ├─ approvals               ├─ communications                            │  │  │
│  │  │  ├─ reports (Puppeteer/PDF) └─ whatsapp-advanced     INTELLIGENCE        │  │  │
│  │  │  └─ ai (Gemini)                                      └─ receipts         │  │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
│  ┌──────────────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │  🐍 Gemini Spark MCP Bridge (FastAPI)     │  │  🤖 Gemini OpenAI Proxy (FastAPI)│  │
│  │  gemini_spark_mcp_server.py               │  │  gemini_web2api.py               │  │
│  │  Python 3 + Uvicorn + httpx               │  │  Python 3 + Uvicorn + httpx      │  │
│  └──────────────────────────────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────┼────────────────────────────────────────────────────┘
                                  │  Prisma ORM 7.9 (pg adapter)
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           PERSISTENCE & DATA TIER                                     │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                     PostgreSQL 14+ Relational Database                         │  │
│  │              labcore_elis  (Primary) — Port 5432                               │  │
│  │                                                                                │  │
│  │  81 Prisma Models organized across:                                            │  │
│  │  • Identity & Auth (6 models)    • Clinical (15 models)                       │  │
│  │  • Financial (14 models)         • Communication (8 models)                   │  │
│  │  • Doctor & Commission (6 models)• QC & Analyzers (8 models)                  │  │
│  │  • ABDM & Compliance (8 models)  • Settings & Audit (6 models)                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL INTEGRATIONS & THIRD PARTIES                             │
│                                                                                       │
│  [WhatsApp Cloud API] [ABDM Gateway] [SMS Gateway] [SMTP/Gmail] [Gemini AI API]      │
│  [Aadhaar OTP Service] [ASTM Analyzers] [Thermal Label Printers] [ESC/POS Printers]  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Layer-by-Layer Architecture

### 4.1 Presentation Layer (Frontend)

#### 4.1.1 Clinical Web Application — `frontend/apps/web/`
- **Framework:** Next.js 15.5.25 (App Router)
- **UI Library:** React 18.3.1
- **Styling:** TailwindCSS 3.4.19 + tailwind-merge + clsx
- **Port:** 3001
- **Icons & Charts:** Lucide React 1.34.0, Recharts 2.15.4
- **PDF & Codes:** jsPDF 2.5.2 + html2canvas + pdf-lib, qrcode 1.5.4

#### 4.1.2 Authentication Portal — `login-portal/`
- **Framework:** Vite 8.3.0
- **UI Library:** React 19.2.8
- **State Management:** Zustand 5.0.15
- **Routing:** React Router DOM 7.18.4
- **Linting:** oxlint 1.81.0
- **Port:** 5173 (Dev) / 3002 (Production Container)

---

### 4.2 Application Layer (Backend)

#### 4.2.1 Primary Backend — `backend/api/`
- **Runtime:** Node.js v20+ / v22+
- **Framework:** Express 5.2.1
- **Language:** TypeScript 5.9.3
- **ORM:** Prisma 7.9.1
- **Ports:** 5000 (HTTP API & WebSockets), 5005 (Hardware TCP Engine)
- **Architecture:** Modular MVC (Controller → Service → Repository)

---

### 4.3 Persistence Layer (Database)
- **Database:** PostgreSQL 14+ / 15.x / 16.x
- **ORM:** Prisma 7.9.1 with `@prisma/adapter-pg`
- **Native Client:** `pg` 8.23.0 (connection pooling: `DB_POOL_MAX=30`, `DB_POOL_MIN=5`)
- **Migrations:** Prisma Migrate (tracked in version control)
- **Schema:** 81 models across 2,876 lines

---

### 4.4 AI / Bridge Services Layer
- **Gemini Spark MCP Bridge:** `gemini_spark_mcp_server.py` (FastAPI + httpx)
- **Gemini OpenAI Proxy:** `gemini_web2api.py` (FastAPI + httpx)

---

## 5. Module Architecture — All 28 Backend Modules

| # | Module | Core Functionality | Routes Mounted |
|---|--------|-------------------|----------------|
| 1 | `auth` | Enterprise Auth, HMAC-SHA256 Pepper, Bcrypt 12, TOTP MFA, SCIM 2.0, Break-Glass | `/api/auth/*`, `/api/scim/v2/*` |
| 2 | `patients` | EMPI Engine, Duplicate Search, DPDP Consent, AES-256-GCM Aadhaar/PAN Encryption | `/api/patients/*` |
| 3 | `doctors` | Referring Doctor Registry, Commissions, Payouts, Digital Signature Upload | `/api/doctors/*` |
| 4 | `tests` | Diagnostic Test Master, Parameters, Age/Gender Reference Ranges, LOINC Codes | `/api/tests/*` |
| 5 | `orders` | Diagnostic Requisitions, Package Auto-Expansion, STAT Priority, Cancellation | `/api/orders/*` |
| 6 | `samples` | 7-Stage Specimen State Machine, Vacutainer Classification, Tracking History | `/api/samples/*` |
| 7 | `barcode` | Code 128 Mod-103 Vector Barcodes, 50×25mm Thermal Label Formats | `/api/barcodes/*` |
| 8 | `analyzers` | ASTM E1381/E1394 & HL7 MLLP (TCP 5005), Westgard Multirule QC, Calibrations | `/api/analyzers/*` |
| 9 | `results` | Parameter Value Entry, 72h Delta-Checks, Panic Alarms (HH/LL), Rejection | `/api/results/*` |
| 10 | `approvals` | Pathologist Approval Queue, Non-repudiation Sign-off, Result Amendments | `/api/approvals/*` |
| 11 | `reports` | NABL ISO 15189:2022 PDF Engine, QR Code Matrix, Addendums, Public Verification | `/api/reports/*`, `/verify-report/:id` |
| 12 | `invoices` | Indian GST Billing (CGST+SGST vs IGST), Banker's Rounding, TPA Insurance | `/api/invoices/*` |
| 13 | `payments` | POS Multi-Mode Payments, Distributed Mutex Lock, Idempotency Protection | `/api/payments/*` |
| 14 | `cash-counter` | Shift Open/Close Sessions, Physical Currency Breakdown, Drawer Discrepancy Log | `/api/cash-counter/*` |
| 15 | `advances` | Patient Wallet Ledger, Pre-payment Credits, Atomic Balance Deductions | `/api/advances/*` |
| 16 | `refunds` | Refund Request & Multi-Level Approval Chain, Ledger Reversals | `/api/refunds/*` |
| 17 | `settlements` | B2B Corporate & Insurance Account Reconciliation Aliases | `/api/settlements/*` |
| 18 | `receivables` | Aging Analysis (30/60/90/120+ days), Outstanding Ledger Collections | `/api/receivables/*` |
| 19 | `receipts` | ESC/POS 80mm & 58mm Thermal Print Formatting | `/api/receipts/*` |
| 20 | `communications` | Multi-Channel Hub (SMS Bulk/Single, Email Dispatch, Delivery Logs & Stats) | `/api/communications/*` |
| 21 | `whatsapp-advanced` | WhatsApp Cloud API, Business Templates, Campaigns, Engagement Predictions | `/api/whatsapp-advanced/*` |
| 22 | `abdm` | Ayushman Bharat Health Account (M1 Aadhaar OTP, M2 HIP Context, M3 FHIR) | `/api/abdm/*`, `/v0.5/*` |
| 23 | `audit` | Tamper-Evident SHA-256 HMAC Chained Audit Stream, 7-Year NABL Retention | `/api/audit/*` |
| 24 | `dashboard` | Executive KPIs, Revenue Analytics, Workload Distribution, TAT Tracking | `/api/dashboard/*` |
| 25 | `backup` | Parameterized Automated Disaster Recovery, Encrypted DB Dump Storage | `/api/backup/*` |
| 26 | `notifications` | Cross-Channel Communication Templates & Variable Substitutions | `/api/notifications/*` |
| 27 | `users` | User Roster, Role-Based Access Control, Digital Signature Management | `/api/users/*` |
| 28 | `settings` | Lab Profile, NABL Accreditation Number, Multi-Branch Configurations | `/api/settings/*` |

---

## 6. Database Schema Architecture (81 Models)

PostgreSQL database `labcore_elis` schema structured across 8 core functional clusters:
- **Identity & Access Management:** `User`, `UserSession`, `MfaBackupCode`, `PasswordHistory`, `EmailVerificationToken`, `LoginAlert`, `RolePermission`
- **Clinical & Patient Care:** `Patient`, `PatientConsent`, `PatientHistoryEntry`, `PatientAdvance`, `Order`, `OrderTest`, `Sample`, `SampleTrackingHistory`, `Result`, `ResultAmendment`, `Approval`, `Report`
- **Diagnostic Catalog:** `Test`, `TestParameter`, `ReferenceRange`, `TestPackage`, `TestPackageItem`, `QCRule`
- **Laboratory Analyzers & QC:** `Analyzer`, `AnalyzerTestMapping`, `QCRun`, `QCResult`, `Calibration`, `Maintenance`, `CriticalValueAcknowledgment`
- **Financial & Accounting:** `Invoice`, `InvoiceItem`, `Payment`, `PaymentAuditLog`, `Refund`, `RefundApproval`, `CashCounter`, `CashCounterSession`, `CashMovement`, `ReconciliationRecord`, `Settlement`, `Receivable`, `Sequence`
- **Doctor Network & Referral:** `Doctor`, `DoctorOrganization`, `DoctorCommissionEntry`, `DoctorPayout`, `DoctorDocument`
- **Omni-Channel Communications:** `CommunicationLog`, `NotificationTemplate`, `WhatsAppTemplate`, `WhatsAppCampaign`, `WhatsAppAutoReplyRule`, `WhatsAppNotificationTrigger`, `WhatsAppScheduledMessage`
- **ABDM, Governance & Core Config:** `AbdmRegistration`, `AbdmCareContext`, `AbdmConsentArtifact`, `ReportShareLink`, `ReportAddendum`, `AuditLog`, `LaboratorySettings`, `AiInsight`

---

## 7. Core Clinical Workflow & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor R as Reception
    actor P as Phlebotomist
    actor A as Analyzer (TCP 5005)
    actor PT as Pathologist
    actor PX as Patient (WhatsApp)

    Note over R: STEP 1 — Registration & Ordering
    R->>Backend: POST /api/patients (UHID-YYYY-XXXXX + DPDP Consent)
    Backend-->>Backend: Duplicate check (phone/Aadhaar/email)
    R->>Backend: POST /api/orders (tests + package expansion)
    Backend-->>Backend: Invoice auto-generated (GST calculation)
    R->>Backend: POST /api/payments (Idempotency Key & Mutex)
    Backend-->>R: Invoice confirmed, order ORD-YYYYMMDD-XXXXX

    Note over P: STEP 2 — Phlebotomy & Specimen
    P->>Backend: POST /api/samples (order_id)
    Backend-->>P: SMP-YYYYMMDD-XXXXX barcode
    P->>Printer: Code 128 Mod-103 barcode label (50×25mm)
    P->>Backend: PATCH /api/samples/:id/status (COLLECTED)

    Note over A: STEP 3 — Analyzer Interfacing
    A->>Backend: ASTM E1381 or HL7 MLLP packet to TCP Port 5005
    Backend-->>Backend: Parse + map to test parameters
    Backend-->>Backend: Westgard QC rules evaluation
    Backend-->>Backend: 72h Delta-Check comparison
    Backend-->>Backend: Panic alert (HH/LL) → Real-time Socket.io push
    Backend-->>Backend: Status → RESULTS_ENTERED

    Note over PT: STEP 4 — Pathologist Review
    PT->>Backend: GET /api/approvals/queue (panic-prioritized)
    PT->>Backend: POST /api/results/evaluate-qc (QC review)
    PT->>Backend: POST /api/approvals/sign-off (digital signature & NABL seal)
    Backend-->>Backend: Status → APPROVED → DISPATCHED

    Note over PX: STEP 5 — Report Delivery
    Backend-->>Backend: Puppeteer NABL PDF generation (pure vector barcodes & QR)
    Backend-->>PX: WhatsApp Cloud API (PDF link + QR verification)
    Backend-->>Backend: ABDM FHIR DiagnosticReport bundle
    Backend-->>Backend: ABHA care context update
```

---

## 8. Security Architecture

- **Transport Layer:** Enforced TLS 1.3/1.2, HSTS, Helmet security headers, Gzip, reverse proxy via Nginx.
- **Application Firewalls:** Multi-tier rate limiting (100 req/15min on auth), IP allowlist/blocklist guard, SQLi/XSS suspicious pattern filter.
- **Authentication:** Bcrypt (cost factor 12) + mandatory HMAC-SHA256 password pepper, TOTP RFC 6238 with 90s replay prevention, JWT access tokens with Refresh Token Rotation (RTR).
- **Data Protection (DPDP Act 2023):** AES-256-GCM symmetric encryption (`enc:v1:`) for Aadhaar and PAN, PII automatic masking (`XXXXXXXX1234`) on GET APIs, client device fingerprinting (SHA-256).
- **Audit & Governance:** SHA-256 HMAC chained tamper-evident audit logs, dual-custody Break-Glass emergency access, RFC 7644 SCIM 2.0 user lifecycle de-provisioning.

---

## 9. Technology Stack — Full Inventory

- **Backend:** Node.js 20 LTS, Express 5.2.1, TypeScript 5.9.3, Prisma ORM 7.9.1, `pg` 8.23.0, Puppeteer 23.11.1, Socket.io 4.7.5, Zod 4.4.3.
- **Frontend Web:** Next.js 15.5.25 (App Router), React 18.3.1, TailwindCSS 3.4.19, Recharts 2.15.4, Lucide React 1.34.0.
- **Auth Portal:** Vite 8.3.0, React 19.2.8, Zustand 5.0.15, React Router DOM 7.18.4, Oxlint 1.81.0.
- **Python Bridges:** Python 3.10+, FastAPI, Uvicorn, httpx (Gemini AI & MCP).
- **Database:** PostgreSQL 16 Alpine, Redis 7 Alpine.
- **Reverse Proxy & Containers:** Nginx Alpine, Docker (multi-stage), PM2.

---

## 10. Infrastructure & Deployment Architecture

### 10.1 Production Port Matrix

| Service | Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- |
| **Nginx Reverse Proxy** | `80`, `443` | HTTP / HTTPS | Public entrypoint, SSL/TLS, static caching, gzip |
| **Web Application** | `3001` | HTTP | Next.js 15 Clinical Workstation |
| **Login Portal** | `3002` / `/portal` | HTTP | Vite React SPA authentication gateway |
| **Backend REST & Sockets**| `5000` | HTTP / WebSocket | Primary Express 5 API & Socket.io panic alerts |
| **Hardware Telemetry** | `5005` | TCP Raw Stream | ASTM E1381 & HL7 v2.x MLLP analyzer listener |
| **PostgreSQL Database** | `5432` | TCP | Relational DB with connection pooling |
| **Redis Cache** | `6379` | TCP | Session security, token blacklists, rate limits |

---

## 11. Regulatory Compliance Architecture

- **NABL (ISO 15189:2022):** Westgard multi-rules (1-3s, 2-2s, 4-1s, 10x, R-4s), 72h delta checks, critical panic values (HH/LL), non-repudiation digital signatures, A4 PDF with vector barcodes and QR code verification, 7-year audit retention.
- **ABDM / ABHA v0.5:** M1 Aadhaar OTP generation & verification, M2 HIP facility registration & care-context linking, M3 FHIR DiagnosticReport bundle generation, RSA SPKI signature-verified webhooks.
- **DPDP Act 2023:** Granular consent records with purpose specifications, AES-256-GCM encryption at rest, PII masking, data export capabilities.
- **GST India:** Dynamic CGST (9%) + SGST (9%) vs IGST (18%) tax splitting, Indian banker's rounding (round half to even), state-code comparisons.

---

## 12. Technical Debt & Risk Register (100% Resolved)

All 8 historical technical risks identified in previous audits have been completely resolved and verified in code:

| # | Risk Title | Original Severity | Remediation & Current Status |
|---|------------|-------------------|------------------------------|
| 1 | **Dual Server Confusion** | 🔴 HIGH | **RESOLVED**: Root `index.js` retired; unified on Express 5 + TypeScript in `backend/api/src/server.ts`. |
| 2 | **Database Schema Drift** | 🔴 HIGH | **RESOLVED**: Migration `20261013120000_add_accounting_sequences_prefix` added; `prisma migrate deploy` standardized. |
| 3 | **Password Hash Alignment** | 🟡 MEDIUM | **RESOLVED**: Unified bcrypt 12 + HMAC-SHA256 password pepper across all provisioning scripts (`reset-password.js`, `deploy-migrate.ts`). |
| 4 | **Communication Sub-Routes 404** | 🟡 MEDIUM | **RESOLVED**: Implemented `/logs`, `/stats`, `/sms/bulk`, `/sms/send`, `/email/send` in `communication.routes.ts`. |
| 5 | **ts-node Cold Start on Windows** | 🟢 LOW | **RESOLVED**: Production scripts pre-compile TypeScript via `tsc` to `dist/api/src/server.js` with `--max-old-space-size=8192`. |
| 6 | **Missing PII Field Encryption** | 🔴 HIGH | **RESOLVED**: AES-256-GCM symmetric field encryption (`enc:v1:`) and query masking implemented in `field-crypto.ts` and `patient.mapper.ts`. |
| 7 | **Database Connection Pool Limits** | 🟡 MEDIUM | **RESOLVED**: Pool limits (`DB_POOL_MAX=30`, `DB_POOL_MIN=5`, connection timeouts) configured in `database.ts`. |
| 8 | **WebSocket Server Lifecycle** | 🟡 MEDIUM | **RESOLVED**: Attached `WebSocketService` to active HTTP server handle in `server.ts` with real-time panic alarm event dispatch. |

---

## 13. Architectural Decisions Log (ADR)

- **ADR-001:** Unified Express 5 + TypeScript Backend (`backend/api/`) — ✅ Active
- **ADR-002:** Prisma ORM over Raw SQL — ✅ Active
- **ADR-003:** Modular Architecture (28 Domain Modules) — ✅ Active
- **ADR-004:** Standalone Auth Portal (Vite + React 19) — ✅ Active
- **ADR-005:** HMAC Pepper + Bcrypt Password Storage — ✅ Active
- **ADR-006:** Puppeteer Server-Side PDF Generation with Vector Barcodes & QR Codes — ✅ Active
- **ADR-007:** ASTM E1381 & HL7 MLLP Hardware TCP Server on Port 5005 — ✅ Active
- **ADR-008:** PostgreSQL Relational Database with Redis Distributed Caching — ✅ Active

---

*Master Architecture Document — LabCore ELIS OS (Version 2.5.0-PRO)*  
*Status: 100% Production & Deploy Verified*
