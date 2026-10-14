---
status: resolved
trigger: "isme model chal raha he" / "mere NIKIL-LABCORE-ELIS-OS ko completely end to end debugging kar"
created: 2026-10-10T04:20:00Z
updated: 2026-10-10T05:05:00Z
---

## Current Focus
hypothesis: Live Postgres DB is out of sync with prisma/schema.prisma (9 uncommitted
  columns never migrated) + admin scripts write unpeppered password hashes.
test: Ran backend typecheck, frontend build, backend endpoint suite against a temp
  peppered admin. Confirmed P2022 ColumnNotFound on 8 endpoints.
expecting: Migration adding the 9 columns + hashing fix in scripts restores all endpoints.
next_action: Get user confirmation to (1) create migration, (2) fix script hashing,
  (3) fix snake_case raw SQL in notification-template.service.ts.

## Symptoms
expected: Login works, list/create endpoints return 200
actual: Login fails for script-created users; 8 endpoints return 500
errors: P2022 "column patients.healthIdNumber does not exist";
  P2022 "column test_parameters.loincCode does not exist";
  P2010 'column "created_at" does not exist';
  "Communication not found" on /api/communications/templates

## Eliminated
- hypothesis: TypeScript compile errors
  evidence: backend `tsc --noEmit` clean; frontend `next build` clean (66 routes)
- hypothesis: Frontend API wiring broken
  evidence: Next prod server proxies /api/* to backend (backend 404 JSON returned);
  /login and /ai-studio render 200
- hypothesis: Backend server crash
  evidence: Server starts, 16/24 endpoints pass incl. dashboard/orders/doctors

## Evidence
- checked: prisma migrate diff (live DB vs schema)
  found: 9 missing columns: patients.healthIdNumber, patients.aadhaarReferenceToken,
    test_parameters.loincCode, abdm_care_contexts.hipId+linkingStatus,
    abdm_consents.consentStatus+signature, abdm_transactions.apiEndpoint+correlationId
  implication: schema.prisma working-tree edits were never migrated (git diff confirms)
- checked: accounting_sequences table
  found: table exists in DB with 3 rows but NOT in schema — naive `db push`
    would DROP it. Must preserve.
- checked: password hashing
  found: utils/password.ts applies HMAC PASSWORD_PEPPER before bcrypt; 10 of 13
    scripts (create-admin.js/.ts, create-admin-prisma.ts, reset-admin.js/.ts,
    reset-admin-password.ts, update-user-password.ts, recreate-admin.ts,
    check-admin.js, generate-hash.js) use plain bcrypt.hash -> users cannot log in.
    Only create-users.ts, ensure-admin-user.ts, test-auth-complete.ts are correct.
  implication: every admin created/reset via scripts is locked out at login
- checked: notification-template.service.ts raw SQL
  found: uses snake_case (event_type, created_at) but DB columns are camelCase
    (eventType, createdAt) — P2010 on GET /api/notifications/templates
- checked: communication.routes.ts
  found: no /templates route; GET /api/communications/templates falls into /:id
    handler -> 500. Test script expectation stale; frontend uses /api/notifications/templates.
- checked: DB users
  found: only nikilpanchal0/1@gmail.com (ADMIN001) exist; .env ADMIN_EMAIL
    (admin@labcore.local) not in DB — create-admin.js blocked by employee-code collision.
- note: AI Studio "/model" is a rule-based simulated clinical engine
  (ai.service.ts: thresholds + Math.random jitter, registry in DB), not an external
  LLM. It runs server-side via /api/ai/* and works once auth is fixed.

## Resolution
root_cause: (1) Un-migrated schema drift breaking 8 endpoints,
  (2) PASSWORD_PEPPER mismatch between utils/password.ts and 10 provisioning
  scripts locking out every script-created user, (3) snake_case raw SQL against
  camelCase DB columns, (4) frontend /api/communication/* singular path vs
  backend /api/communications mount.
fix: |
  1. Migration prisma/migrations/20261010040000_add_missing_model_columns —
     adds exactly the 9 missing columns (patients.healthIdNumber,
     patients.aadhaarReferenceToken, test_parameters.loincCode,
     abdm_care_contexts.hipId+linkingStatus, abdm_consents.consentStatus+signature,
     abdm_transactions.apiEndpoint+correlationId). Applied via `prisma migrate deploy`.
     accounting_sequences (3 live rows) deliberately preserved — NOT in schema,
     `db push` would have dropped it.
  2. Peppered hashing in scripts: create-admin.js/.ts, create-admin-prisma.ts,
     reset-admin.js/.ts, reset-admin-password.ts, update-user-password.ts,
     recreate-admin.ts, check-admin.js, generate-hash.js. TS scripts import
     hashPassword from api/src/utils/password; JS scripts apply the identical
     inline HMAC transform.
  3. notification-template.service.ts: all snake_case columns → quoted camelCase
     ("eventType", "createdAt", "subjectTemplate", "bodyTemplate", "isActive",
     "createdBy", "updatedAt").
  4. frontend api.ts: 9 `/api/communication/*` paths → `/api/communications/*`
     to match the backend mount.
  5. test-all-endpoints.js: login creds now configurable via
     TEST_EMAIL/TEST_PASSWORD env vars; stale /communications/templates check
     replaced with /notifications/templates.
verification: |
  - Endpoint suite: 25/25 pass (Create Patient returns 409 on re-run = correct
    phone-uniqueness idempotency).
  - Login 200 via hash produced by fixed update-user-password.ts script.
  - AI Studio engines verified live: /api/ai/predict (cardiac risk 65 HIGH_RISK),
    /api/ai/models (registry), /api/ai/cbc/analyze (critical alert),
    /api/ai/thyroid/classify (hypothyroid 85), /api/ai/drug/interactions
    (warfarin+aspirin major) — all 200.
  - Backend typecheck clean, frontend typecheck clean, frontend production
    build clean (66 routes).
  - Temp test admin deleted; only the 2 original admins remain;
    accounting_sequences intact (3 rows); scratch script removed.

## Known gaps (NOT fixed — pre-existing, out of scope)
- /api/communications/{logs,stats,sms/templates,email/templates,sms/bulk,
  :id/retry,:id/read,consent/:patientId} have no backend implementation
  (frontend api.ts calls them; only retry is UI-used and the communication
  page runs on demo data). Paths now resolve to clean 404s.
- Remaining schema-vs-DB diff (pre-existing): doctors_phone_idx index,
  updatedAt default mismatches on doctor_commission_entries/
  doctor_organizations, accounting_sequences table absent from schema.
  AccountingSequence was removed from the schema in an earlier commit while
  its data stays live — recommend re-adding the model or dropping the table
  consciously.
- npm scripts invoking plain `ts-node` (create-admin-ts etc.) are extremely
  slow to start (~3 min) on this machine; --transpile-only finishes in
  seconds. Scripts importing api/config/database also leave the pg Pool
  keeping the process alive after $disconnect().

## Scratch cleanup
- DONE: backend/scratch-e2e-admin.js deleted; temp admin E2ETMP001 removed.
- KEPT: test-all-endpoints.js env-var credentials (useful improvement).
