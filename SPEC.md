# SPEC.md — LabCore ELIS OS Specification

> **Status**: `FINALIZED`
>
> 🔒 **Planning Lock**: Requirements frozen through interactive audit (`/grill-me`) on 2026-10-13.

---

## 1. Vision
LabCore ELIS OS is an enterprise-grade Laboratory Information System (LIS) and diagnostic operating system engineered for Indian clinical pathology and diagnostic healthcare facilities. It provides end-to-end automation spanning patient registration (DPDP Act 2023 & ABDM/ABHA compliant), requisition order processing, phlebotomy specimen labeling, ASTM/HL7 analyzer packet ingestion, Westgard quality control evaluation, panic alerts, pathologist sign-offs, NABL-compliant A4 PDF report generation, and automated WhatsApp delivery.

---

## 2. Locked Architecture Decisions (from /grill-me)

1. **Unified Backend Architecture**:
   - Primary and sole runtime is `backend/` powered by Express 5.2.1, TypeScript 5.9, and Prisma ORM 7.9 connected to PostgreSQL 14+.
   - Port 5000 is the dedicated API port.
   - Root `index.js` (Express 4 + Mongoose) is formally retired; remaining doctor module endpoints reside in `backend/api/src/modules/doctors/`.

2. **Strict 7-Stage Specimen State Machine**:
   - Requisition (`REGISTERED`) $\rightarrow$ Phlebotomy (`COLLECTED`) $\rightarrow$ Lab Check-In (`RECEIVED`) $\rightarrow$ Analyzer Worklist (`PROCESSING`) $\rightarrow$ Value Capture (`RESULTS_ENTERED`) $\rightarrow$ Pathologist Sign-Off (`APPROVED`) $\rightarrow$ Patient Dispatch (`DISPATCHED`).
   - Phlebotomy produces 50mm $\times$ 25mm Code 128 (Modulo 103 checksum) thermal barcode labels with automated vacutainer tube classification (EDTA Lavender, SST Gold, Fluoride Grey, Heparin Green).
   - Ingestion supports ASTM E1381/E1394 stream parsing (`\r\n` delimited with `P`, `O`, `R` records).
   - Quality engine runs Westgard multi-rules (`1-3s`, `2-2s`, `4-1s`), 72-hour historical delta-checks, and automatic Panic alerts (`HH`/`LL`).

3. **NABL ISO 15189 Compliant Report Format**:
   - Server-side headless Chrome (Puppeteer) engine generates clean A4 multi-page diagnostic PDFs.
   - Features digital doctor signature seal, reference ranges segmented by clinical age/gender, and verification QR code linking to `/verify-report`.

4. **Unified Authentication Architecture**:
   - `login-portal` (Vite + React 19 + TypeScript) acts as the central authentication gateway handling credentials, brute-force protection, and TOTP 2-Factor Authentication (MFA).
   - Secure HTTP-only cookies / JWT bearer tokens authenticate the user and redirect smoothly into the clinical workstation (`frontend/apps/web/` Next.js).

---

## 3. Goals
1. **Single Source of Truth**: Eliminate dual-backend discrepancies and consolidate all database access through Prisma schema (81 models).
2. **Clinical Safety & Zero Diagnostic Drift**: Enforce Westgard QC, delta-checks, and panic alerts before any report authorization.
3. **Regulatory Compliance**: Complete alignment with NABL (ISO 15189:2022), ABDM (ABHA v0.5 M1/M2/M3), and India DPDP Act 2023.
4. **Seamless Financial POS Pipeline**: Zero floating-point rounding errors in GST, payment idempotency (`x-idempotency-key`), and cash counter shift reconciliation.

---

## 4. Non-Goals (Out of Scope)
- Retaining Mongoose or secondary MongoDB databases.
- Unverified client-side only report generation for final diagnostic sign-offs.
- Insecure direct database pushes that bypass Prisma migration versioning.

---

## 5. Technical Requirements

| Module | Requirement | Priority | Implementation Status |
|--------|-------------|----------|-----------------------|
| **Auth** | Unified Vite Auth Portal + TOTP MFA + Peppered Bcrypt | Must-have | Complete in `login-portal` and `backend/api/src/modules/auth` |
| **Patients** | UHID-YYYY-XXXXX format, DPDP Consent, PII Masking | Must-have | Complete in `backend/api/src/modules/patients` |
| **Billing** | GST exact rounding, package expansion, Idempotency | Must-have | Verified in Phase 2 Audit |
| **Samples** | 7-stage state machine, 50x25mm Code 128 labels | Must-have | Verified in Phase 3 Audit |
| **Analyzers**| ASTM E1381/E1394 parser, Westgard rules, Delta-check | Must-have | Verified in Phase 3 Audit |
| **Reports** | Puppeteer NABL A4 PDF with QR verification | Must-have | Implemented in `backend/api/src/modules/reports` |
| **ABDM** | ABHA OTP linking and cryptographic RSA webhooks | Must-have | Implemented in `backend/api/src/modules/abdm` |

---

*Last updated: 2026-10-13*
