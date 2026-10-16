-- Phase 3: Enterprise RBAC, ABAC & Permissions Matrix
-- Migration: 20261015_enterprise_auth_phase3
-- Adds per-user permission overrides and temporary role override tables.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_permission_overrides') THEN
    CREATE TABLE user_permission_overrides (
      id           TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"     TEXT         NOT NULL,
      permission   TEXT         NOT NULL,
      effect       TEXT         NOT NULL CHECK (effect IN ('GRANT', 'DENY')),
      reason       TEXT,
      "grantedBy"  TEXT         NOT NULL,
      "expiresAt"  TIMESTAMPTZ,
      "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now(),

      CONSTRAINT fk_upo_user FOREIGN KEY ("userId")
        REFERENCES users(id) ON DELETE CASCADE,

      CONSTRAINT uq_upo_user_perm_effect UNIQUE ("userId", permission, effect)
    );

    CREATE INDEX idx_upo_user_id      ON user_permission_overrides ("userId");
    CREATE INDEX idx_upo_permission   ON user_permission_overrides (permission);
    CREATE INDEX idx_upo_expires_at   ON user_permission_overrides ("expiresAt")
      WHERE "expiresAt" IS NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_role_overrides') THEN
    CREATE TABLE user_role_overrides (
      id             TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"       TEXT         NOT NULL,
      "overrideRole" TEXT         NOT NULL,
      reason         TEXT         NOT NULL,
      "grantedBy"    TEXT         NOT NULL,
      "validFrom"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
      "validUntil"   TIMESTAMPTZ  NOT NULL,
      "revokedAt"    TIMESTAMPTZ,
      "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT now(),

      CONSTRAINT fk_uro_user FOREIGN KEY ("userId")
        REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_uro_user_id    ON user_role_overrides ("userId");
    CREATE INDEX idx_uro_active     ON user_role_overrides ("userId", "revokedAt", "validUntil")
      WHERE "revokedAt" IS NULL;
  END IF;
END $$;
