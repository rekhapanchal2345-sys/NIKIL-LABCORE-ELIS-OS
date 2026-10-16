-- Migration: Enterprise Auth Phase 1
-- Adds:
--   1. UserSession.familyId  (refresh token rotation family)
--   2. UserSession.riskScore (session risk analytics)
--   3. AuditLog.prevHash     (hash chain tamper detection)
--   4. AuditLog.rowHash      (row hash for integrity verification)

-- UserSession: Refresh token rotation family + risk score
ALTER TABLE "user_sessions"
  ADD COLUMN IF NOT EXISTS "familyId"  TEXT,
  ADD COLUMN IF NOT EXISTS "riskScore" INTEGER NOT NULL DEFAULT 0;

-- Index on familyId for fast family-based revocation on token reuse
CREATE INDEX IF NOT EXISTS "user_sessions_familyId_idx"
  ON "user_sessions" ("familyId");

-- AuditLog: Tamper-evident hash chaining
ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "prevHash" TEXT,
  ADD COLUMN IF NOT EXISTS "rowHash"  TEXT;

-- Index on rowHash for integrity check queries
CREATE INDEX IF NOT EXISTS "audit_logs_rowHash_idx"
  ON "audit_logs" ("rowHash");
