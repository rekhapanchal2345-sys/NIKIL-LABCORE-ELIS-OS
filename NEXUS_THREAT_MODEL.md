# NEXUS_THREAT_MODEL.md
**Document Reference:** `NEXUS-THREAT-2026-PROD-01`  
**System:** NIKIL-LABCORE-ELIS-OS — Threat Model & Security Posture  
**Audit Date:** 2026-10-23  
**Standards:** ISO/IEC 27001, OWASP Top 10, CERT-In Directions 2022, India DPDP Act 2023  

---

## 1. System Architecture & Trust Boundaries

```
[ UNTRUSTED INTERNET ]
  • Patient QR Code Verification Portal (/verify-report)
  • External WhatsApp Webhook Endpoints
  • NHA ABDM Gateway
         │  TLS 1.3 / Strict Rate Limiting / WAF
         ▼
[ DMZ / API GATEWAY LAYER ]
  • Express.js API Server (Port 5000 / Reverse Proxy)
  • JWT Session Validation & Step-Up Auth Gate
         │  Strict Authenticated Context & RBAC / ABAC
         ▼
[ INTERNAL CLINICAL NETWORK ]
  • Next.js Clinical Operations Frontend (Port 3000 / 3001)
  • Omniscient Nexus Operations Deck (/nexus)
  • Instrument TCP/IP Server (Port 5001 / Lab Instrument VLAN)
         │  Internal Private Subnet / Encrypted Connection Pool
         ▼
[ PERSISTENCE & AUDIT VAULT ]
  • PostgreSQL 15 Database (Prisma ORM)
  • Immutable Append-Only Audit Log with SHA-256 Hash Chain
  • Local Encrypted Document Store (Report PDFs)
```

---

## 2. STRIDE Threat Analysis Matrix

| Threat Category | Threat Scenario | Impacted Component | CVSS | Engineered Countermeasure & Security Invariant |
|---|---|---|---|---|
| **Spoofing (S)** | Rogue device on instrument LAN injects malicious ASTM test results with normal values for critically ill patients. | `analyzer.tcp.service.ts`, `AstmFsmParser.ts` | **9.2 (Critical)** | 1. IP & MAC address allowlisting for instrument sockets.<br>2. Dedicated physical VLAN isolation for laboratory analyzers.<br>3. Validation of analyzer sender identification in ASTM `H` header field 5.<br>4. Quarantine results from unverified IP endpoints. |
| **Tampering (T)** | Unauthorized user or compromised credentials modify an approved pathology result or edit an audit entry to conceal an analytical error. | `result.service.ts`, `result-amendment.service.ts`, `audit.service.ts` | **9.0 (Critical)** | 1. Mandatory append-only database triggers on `AuditLog` table.<br>2. Cryptographic SHA-256 hash chaining (`prevHash + recordHash`) in `audit-integrity.service.ts`.<br>3. Immutable result amendment history (`ResultAmendment` table) preserving original value, reason, timestamp, and pathologist ID. |
| **Repudiation (R)** | Operator denies approving an autoverification failover proposal or overriding a critical Westgard QC alarm. | `nexus.controller.ts`, `approval.service.ts`, `digital-signature.service.ts` | **8.1 (High)** | 1. Digital signature generation binding `(proposalId, decision, reviewerId, timestamp, reviewNotes)`.<br>2. Step-up TOTP/PIN challenge required for pathologist authorization.<br>3. Non-repudiation log recorded in immutable audit journal. |
| **Information Disclosure (I)** | Multi-tenant or cross-branch data breach where User from Branch A accesses patient records from Branch B via IDOR. | `patient.service.ts`, `order.service.ts`, `abac.engine.ts` | **8.8 (High)** | 1. Server-enforced tenant and branch scoping on every database query (`organizationId` / `branchId` in where clause).<br>2. ABAC sensitivity shield (`VIP_MASKED` confidentiality policy with break-glass audit).<br>3. Removal of debugging endpoints leaking patient PII. |
| **Denial of Service (D)** | TCP message storm or malformed ASTM packet stream exhausts Node.js event loop and database connection pool. | `analyzer.tcp.service.ts`, `config/database.ts` | **7.5 (High)** | 1. Bound ASTM retries to 6 attempts max with exponential backoff.<br>2. Incoming TCP frame size capped at 64 KB.<br>3. Separate dedicated connection pool for instrument ingestion decoupled from HTTP API traffic. |
| **Elevation of Privilege (E)** | Attendant or phlebotomist sends `x-user-role: LAB_DIRECTOR` in HTTP header to approve clinical failovers. | `nexus.routes.ts`, `permissions.middleware.ts` | **9.8 (Critical)** | 1. **Immediate Patch**: Eliminate client header role override in `nexus.routes.ts`.<br>2. Enforce server-side role validation using cryptographically signed JWT tokens issued exclusively by `/api/auth/login`.<br>3. Default deny on missing permissions. |

---

## 3. Data Protection & Privacy Controls (DPDP Act 2023 Compliance)

1. **Tokenization & De-Identification**:
   Nexus real-time telemetry frames and 3D digital twin models pass only de-identified specimen tokens (`patientUhid`, `specimenBarcode`, analyte codes). Patient names, contact numbers, and national IDs are scrubbed at the gateway.
2. **Access Logging**:
   Every access to patient diagnostic records or export operations generates an immutable audit record containing user ID, IP address, timestamp, and purpose.
3. **Restricted AI Data Transmission**:
   External generative AI tools (e.g. Gemini) must only receive de-identified, non-PII diagnostic matrices. Direct submission of identifiable patient health records is blocked at the application service boundary.
