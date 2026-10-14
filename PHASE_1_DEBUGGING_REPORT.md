# Phase 1 Deep Audit & Bug Fixes Report

## 1. Type Safety & Zod Validation (`users`, `auth`, `abdm`, `patients`)
- **Bug**: Weak phone number regex causing non-E.164 phone numbers to pass validation.
  **Fix**: Enforced strict `+91` followed by 10 digits regex (`/^\+91[6-9]\d{9}$/`) in `user.schema.ts` and `auth.validator.ts`.
- **Bug**: Missing validation for ABHA ID formats.
  **Fix**: Added strict regex for `abhaNumber` (14 digits) and `abhaAddress` (`@abdm` suffix) in `abdm.validation.ts`.
- **Bug**: UHID regex mismatched with the business requirement.
  **Fix**: Updated `patient.service.ts` to implement the `UHID-YYYY-XXXXX` format sequence logic, ensuring it correctly checks and maintains the count based on the current year prefix.

## 2. Concurrency & Transaction Safety (`patients`, `doctors`)
- **Bug**: Potential race conditions during sequential identifier generation (`generateUHID`, `createDoctor`). Multiple concurrent requests could resolve the same highest sequence number and try to insert it, failing with `P2002` Prisma unique constraint violations.
  **Fix**: Wrapped `createPatient`, `createPatientWithOrder`, and `createDoctor` inside robust retry loops (up to 3 retries). If a `P2002` error specific to the sequential identifier (`uhid` or `doctorCode`) is encountered, the code will now seamlessly recalculate the identifier and retry the transaction, guaranteeing race condition safety without sacrificing application flow.

## 3. Precision in Commission Calculation (`doctors`)
- **Bug**: Javascript's floating point arithmetic was being used to aggregate `commissionAmount` over `DoctorCommissionEntry`, which led to rounding errors and fractional discrepancies.
  **Fix**: Refactored `getDoctorCommissionTotals` and `getBulkCommissionTotals` in `doctor.commission.ts` to utilize `Prisma.Decimal` instances for all intermediate math operations, ensuring absolute financial accuracy.

## 4. Dual-Identifier Resolution (`patients`)
- **Bug**: `updatePatient` and `deletePatient` hardcoded lookups strictly by UUID (`id`), causing failures when `uhid` was provided by the frontend.
  **Fix**: Upgraded both functions in `patient.service.ts` to resolve patients by either their UUID (`id`) or clinical ID (`uhid`) through `OR: [{ id }, { uhid: id }]`.

## 5. Security & Session Integrity (Level 3)
- **Bug**: Missing brute-force lockout for MFA TOTP endpoints.
  **Fix**: Updated `auth.service.ts` so that failed MFA verification attempts now correctly increment the `failedLoginCount` and lock out attackers after the threshold, mitigating brute-force attacks against MFA codes.
- **Bug**: Role-Based Access Control logic granted the `ADMIN` role global bypass permissions, improperly granting them sensitive `AUDIT_READ` privileges.
  **Fix**: Adjusted `permissions.ts` to ensure `ADMIN` permissions correctly enforce `ROLE_PERMISSIONS` filtering without the generic bypass.
- **Bug**: PII (Aadhaar, PAN, Phone numbers) was exposed in bulk patient roster API queries.
  **Fix**: Added a `maskPii` option to `formatPatientResponse` in `patient.service.ts` and enabled it for `getPatients`, which safely obfuscates Aadhaar, PAN, and Phone numbers for non-essential bulk read queries.
- **Bug**: ABDM webhooks lacked cryptographic signature verification against the ABDM gateway (previously it only used structural decoding without true PEM validation).
  **Fix**: Enhanced `abdm.middleware.ts` to implement true cryptographic verification using Node's native `crypto` module. The middleware now converts the ABDM Gateway's JWK public keys from `/v0.5/certs` into SPKI PEM format, rigorously validating the JWT RSA signature against the official gateway keys to prevent forged webhooks.
- **Bug**: The strict RBAC role enforcement (`authorize`) was explicitly checking `UserRole.ADMIN` on multiple analytics endpoints (like `/analytics/registrations` and `/analytics/top-patients`), which inadvertently locked out `SUPER_ADMIN` and `BRANCH_ADMIN` after the global RBAC override was removed.
  **Fix**: Added `SUPER_ADMIN` and `BRANCH_ADMIN` explicit permissions across `patient.routes.ts`, `test.routes.ts`, `order.routes.ts`, and `analyzer.routes.ts` via an automated AST/Node script to safely restore global admin visibility.

## 6. Frontend UX & State (Level 4)
  **Fix**: Refactored `updateUrlParams` in `PixelPerfectPatientsPage.tsx` to utilize Next.js App Router's `router.replace` mechanism, ensuring `useSearchParams` hydration correctly retains UI state across re-renders and refreshes.
- **Bug**: `RegisterOrderWizard.tsx` properly cached multi-step forms using `localStorage` (`ORDER_DRAFT_KEY`), but failed to clear the cache upon successful order submission, causing subsequent new orders to be pre-filled with the old order's data.
  **Fix**: Added `localStorage.removeItem(ORDER_DRAFT_KEY)` inside the `submitRequisition` success path in `RegisterOrderWizard.tsx` to ensure a clean slate after every successful requisition.
- **Bug**: Multi-step requisition workflows were vulnerable to wiping data entirely if submission failed or the user accidentally refreshed midway through patient selection or testing steps.
  **Fix**: Enforced `ORDER_DRAFT_KEY` localStorage caching across the 5-step `RegisterOrderWizard.tsx` (mirroring `RegisterPatientWizard`), preserving progress and values seamlessly if Step 2 or any subsequent step encounters an error or network drop.
