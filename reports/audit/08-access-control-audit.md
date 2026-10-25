# Phase Eight — Role-Based & Attribute-Based Access Control Audit
**Repository:** `NIKIL-LABCORE-ELIS-OS`  
**Execution Environment:** Node `v24.20.0`, Express 4, Prisma `7.9.1`, PostgreSQL 16  
**Test Suite Executed:** [verify-complete-rbac-abac.ts](file:///c:/Users/nikil/Downloads/NIKIL-LABCORE-ELIS-OS/backend/scripts/verify-complete-rbac-abac.ts)  
**Audit Date:** 2026-10-24  
**Audit Status:** **VERIFIED WORKING (31/31 Test Cases Passed — 100%)**

---

## 1. Access Control Architecture Overview

The application enforces a dual-tier authorization model:
1. **Tier 1 — Static & Dynamic RBAC (Role-Based Access Control)**:
   - 9 Distinct Roles defined in `@prisma/client` (`UserRole`):
     `SUPER_ADMIN`, `ADMIN`, `BRANCH_ADMIN`, `PATHOLOGIST`, `DOCTOR`, `LAB_TECH`, `FRONT_DESK`, `ACCOUNTANT`, `AUDITOR`.
   - Granular permission registry (`PERMISSIONS`) containing 50 fine-grained capabilities across 9 domains (`patient`, `order`, `result`, `sample`, `inventory`, `billing`, `report`, `audit`, `user`).
   - Dynamic user-level permission overrides (`GRANT`, `DENY`, and temporary time-bounded role delegation) persisted in `UserPermissionOverride`.
2. **Tier 2 — Contextual ABAC (Attribute-Based Access Control)**:
   - Evaluated by `backend/api/src/modules/auth/abac.engine.ts`.
   - Policies enforce:
     - Patient confidentiality shielding (`VIP_MASKED` vs break-glass logging).
     - Clinical review guardrails (`LAB_TECH_NO_APPROVE` hard block).
     - Signatory authority (`PATHOLOGIST_RESULT_APPROVE` check).
     - Audit log read restriction (`AUDIT_LOG_READ_RESTRICTED`).

---

## 2. Role Permissions Matrix & Empirical Verification

| Role | Permitted Domains & Key Capabilities | Strict Denials & Boundaries Enforced | Test Assertion Result |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | Global unrestricted access; all 50 permissions; system bypass. | No denials; full tenant and system administration. | **PASS** (Holds 50/50 permissions) |
| **ADMIN** | User administration, patient deletion, catalog pricing, billing. | `audit:read` restricted to preserve compliance non-tampering. | **PASS** (`patient:delete=true`, `audit:read=false`) |
| **BRANCH_ADMIN** | Branch patient registration, sample intake, branch operational reports. | `user:unlock` and global role elevation forbidden. | **PASS** (`patient:read=true`, `user:unlock=false`) |
| **PATHOLOGIST** | Clinical sign-off, panic read-back, Levey-Jennings QC review, result approval. | `payment:counter_open=false`, `patient:delete=false`. | **PASS** (`result:approve=true`, `payment:counter_open=false`) |
| **LAB_TECH** | Specimen accessioning, instrument interfacing, result data entry. | `result:approve=false`, `patient:delete=false`, `audit:read=false`. | **PASS** (`result:enter=true`, `result:approve=false`) |
| **FRONT_DESK** | Patient registration, invoice creation, cash counter operations, UPI receipt. | `result:enter=false`, `result:approve=false`, `audit:read=false`. | **PASS** (`patient:create=true`, `result:enter=false`) |
| **DOCTOR** | Patient lookup, order status tracking, viewing published clinical reports. | `result:enter=false`, `result:approve=false`, financial ledger access. | **PASS** (`order:read=true`, `result:approve=false`) |
| **ACCOUNTANT** | Payment reconciliation, billing adjustments, GST settlement, cash drawers. | `result:enter=false`, `result:approve=false`, clinical sign-off. | **PASS** (`payment:settlement=true`, `result:enter=false`) |
| **AUDITOR** | Immutable audit log inspection, verification trace review, compliance read. | `order:create=false`, `patient:delete=false`, `result:approve=false`. | **PASS** (`audit:read=true`, `order:create=false`) |

---

## 3. Dynamic Override Verification

1. **User-Level `GRANT` Override**:
   - Test Scenario: Front Desk user assigned temporary operational authority `result:enter`.
   - Verification: `userHasPermission(frontDeskUser.id, 'result:enter')` evaluated to `true`, successfully elevating capability above role baseline.
   - Evidence: Verified in Phase 3 of `verify-complete-rbac-abac.ts`.

2. **User-Level `DENY` Override**:
   - Test Scenario: Administrator account assigned specific restriction `patient:export`.
   - Verification: User-level `DENY` strictly superseded the baseline `ADMIN` role permission.
   - Rule Confirmed: `DENY` always takes precedence over role inheritance.

3. **Time-Bounded Role Delegation**:
   - Test Scenario: Lab Technician delegated `PATHOLOGIST` role for a 2-hour window, then revoked.
   - Verification: Effective permissions immediately elevated to include `result:approve`, and returned to baseline upon explicit revocation.

---

## 4. Contextual ABAC Engine Verification

1. **Patient Confidentiality Shield**:
   - Non-VIP patient read: Granted to Lab Tech.
   - `VIP_MASKED` patient read: Lab Tech blocked with error:
     `PATIENT_CONFIDENTIALITY_SHIELD: Patient has VIP_MASKED confidentiality — break-glass required`.
   - Admin read: Admin permitted to view with automatic break-glass audit logging.

2. **Clinical Sign-off Gate (`LAB_TECH_NO_APPROVE`)**:
   - Lab Tech attempting approval: Policy decision `DENY`, Reason: `LAB_TECH_NO_APPROVE`.
   - Pathologist attempting approval: Policy decision `ALLOW`, Reason: `PATHOLOGIST_RESULT_APPROVE`.

3. **Compliance Audit Protection (`AUDIT_LOG_READ_RESTRICTED`)**:
   - Front Desk user attempting audit log retrieval: Policy decision `DENY`, Reason: `AUDIT_LOG_READ_RESTRICTED`.

---

## 5. HTTP Route Gate Enforcement Evidence

Live HTTP requests against Express route gates with genuine JWT bearer tokens:

```text
[AUTH] GET /admin/rbac/matrix | Role: ADMIN       -> 200 OK (Access Granted)
[AUTH] GET /admin/rbac/matrix | Role: FRONT_DESK  -> 403 Forbidden (Blocked)
[AUTH] GET /admin/rbac/matrix | Role: LAB_TECH    -> 403 Forbidden (Blocked)
[AUTH] GET /profile           | Role: ALL 9 ROLES -> 200 OK (Authenticated Sessions Validated)
```

## 6. Audit Conclusion
Authorization is strictly enforced on the backend server at both router-level and service-level. Hiding navigation items on the frontend is treated solely as a UI convenience, with zero reliance placed on client-side state for clinical or administrative security.
