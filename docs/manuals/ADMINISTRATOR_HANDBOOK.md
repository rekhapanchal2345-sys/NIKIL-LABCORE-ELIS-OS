# 🏛️ NIKIL-LABCORE-ELIS-OS — HOSPITAL SYSTEM ADMINISTRATOR HANDBOOK
> **Standard Operating Procedure (SOP) — Document ID:** `SOP-LIS-ADM-001`  
> **Applicable Role:** `SUPER_ADMIN`, `ADMIN`, `CHIEF_INFORMATION_OFFICER`  
> **Compliance Standard:** NABL ISO 15189:2022 §5.10 | DPDP Act 2023 | OWASP Top 10  
> **System Version:** `v3.0.0-PRODUCTION`

---

## 1. System Administrator Scope & Authority

The System Administrator governs infrastructure availability, security hardening, user provisioning, regulatory compliance, multi-branch tenant data isolation, and business continuity. Key operational responsibilities:
1. **Role-Based Access Control (RBAC)**: Provisioning staff accounts across 7 canonical operational roles and managing temporary permission grants/denials.
2. **Multi-Branch Tenant Isolation**: Managing satellite laboratory branches, geographical data segregation, and HQ executive reporting.
3. **Automated Backup & Disaster Recovery (DR)**: Overseeing scheduled daily AES-256 database backups, GFS retention pruning, and recovery validation drills.
4. **Regulatory Audit & DPDP Act Compliance**: Enforcing immutable audit trail logging, PII encryption at rest (AES-256-GCM), and patient Right-to-Erasure workflows.
5. **Infrastructure Observability & Performance**: Monitoring database connection pools, Redis cache hit ratios, Docker containers, and API response latencies.

---

## 2. User & RBAC Management

Under **Settings → Users & Roles** (`/settings?tab=users`):
- **7 Canonical Roles**:
  - `SUPER_ADMIN`: Unrestricted enterprise access, system configuration, database migrations.
  - `ADMIN`: Laboratory manager, staff scheduling, inventory approvals, financial review.
  - `PATHOLOGIST`: Result approvals, digital signatures, NABL seal issuance, AI Copilot.
  - `LAB_TECH`: Sample accessioning, analyzer interface, result entry, Westgard QC.
  - `PHLEBOTOMIST`: Sample collection, vacutainer labeling, barcode printing.
  - `RECEPTIONIST`: Patient intake (EMPI), order creation, POS billing, till closure.
  - `ACCOUNTANT`: Financial daybook, GST tax audits, cashier reconciliations, refunds.
- **Account Security Controls**:
  - **Password Policy**: Minimum 12 characters, requiring uppercase, lowercase, numeric, and special symbols.
  - **Bcrypt 12 + HMAC Pepper**: Server-side secret pepper ensures hashes cannot be cracked even if database is dumped.
  - **Account Lockout**: 5 consecutive failed login attempts lock the account for 30 minutes. Super Admin can manually unlock from the user details drawer.
  - **MFA / TOTP**: Mandatory Time-based One-Time Password (RFC 6238) for all administrative and pathologist accounts.

---

## 3. Multi-Branch Architecture & Tenant Isolation

LabCore ELIS supports multi-branch hospital chains with strict tenant isolation:
- **Branch Creation**: Navigate to **Settings → Branch Management** (`/settings?tab=branches`).
  - Configure Branch Code (e.g., `BLR-01`, `MUM-01`), Local Lab Name, Address, Branch GSTIN, and Local NABL Accreditation ID.
- **Context Scoping**:
  - Users are bound to a primary branch.
  - The backend `branch-context.ts` middleware injects `branchId` into every database query.
  - Front-desk and lab staff at Branch A can never access or query patient or financial records of Branch B.
- **HQ Executive Analytics**:
  - Users with `SUPER_ADMIN` or `ADMIN` roles can toggle branch context in the header dropdown or view aggregate cross-branch KPI reports.

---

## 4. Automated Backup & Disaster Recovery (DR) Engine

The system features an automated, encrypted database backup scheduler running daily at **02:00 AM local time**:
- **Encryption**: Backups are dumped via `pg_dump` and encrypted using **AES-256-GCM** with a dedicated `BACKUP_ENCRYPTION_KEY`.
- **Grandfather-Father-Son (GFS) Retention Policy**:
  - **Daily Backups**: Retained for 7 days.
  - **Weekly Backups**: Retained for 4 weeks.
  - **Monthly Backups**: Retained for 3 months.
  - Automated pruning purges older archives to prevent storage exhaustion.
- **Storage Location**: Encrypted archives are stored in `/app/backups/` and mirrored to off-site object storage.
- **Disaster Recovery Restoration Test**:
  - Execute test restoration script: `npm run test:dr-drill`.
  - The script restores the latest encrypted backup to a temporary staging database schema and validates row count integrity across all 81 tables.

---

## 5. System Observability & Health Probes

Monitor live system health via standard REST endpoints:
- `GET /api/health`: Comprehensive system status:
  - **PostgreSQL**: Live query latency probe (`SELECT 1 AS ping`, SLA $< 5$ms).
  - **Redis Cache**: Ping check and LRU in-memory fallback hit-ratio.
  - **Disk Storage**: Write permission validation on `/app/backups` and `/app/uploads`.
  - **Node.js Memory**: Heap used, heap total, and RSS memory ceiling.
- `GET /api/health/liveness`: Kubernetes / Docker container heartbeat.
- `GET /api/health/readiness`: Traffic readiness probe (verifies database connection pool availability).

---

## 6. Regulatory & Security Compliance Checklist

| Standard | Implementation in LabCore ELIS | Verification Method |
|---|---|---|
| **NABL ISO 15189:2022** | Electronic doctor signature, dynamic biological reference ranges, Westgard QC | Daily QC Audit Logs |
| **ABDM / ABHA v0.5** | M1 ABHA ID linking, M2 care-context linking, M3 NRCES FHIR R4 bundles | ABDM Sandbox Gateway Tests |
| **DPDP Act 2023** | Granular consent ledger, client-side PII sanitization, Right to Erasure | Consent Audit View |
| **OWASP Top 10** | Helmet CSP, strict rate limiters, magic byte upload checks, SSRF guard | Security Audit Suite (`Day 19`) |
| **GST India** | SAC 999316 invoice generation, intra-state CGST/SGST, inter-state IGST | GSTR-1 Tax Export Desk |
