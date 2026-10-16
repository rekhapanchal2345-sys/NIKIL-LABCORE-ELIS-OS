-- Phase 3: Enterprise RBAC, ABAC & Permissions Matrix
-- Migration: 20261015_enterprise_auth_phase3
-- Adds per-user permission overrides and temporary role override tables.

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: user_permission_overrides
-- Stores individual GRANT or DENY overrides per user+permission.
-- Resolution order: DENY > GRANT > role baseline.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE user_permission_overrides (
  id           TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      TEXT         NOT NULL,
  permission   TEXT         NOT NULL,
  effect       TEXT         NOT NULL CHECK (effect IN ('GRANT', 'DENY')),
  reason       TEXT,
  granted_by   TEXT         NOT NULL,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT fk_upo_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,

  -- At most one active record per (user, permission, effect)
  CONSTRAINT uq_upo_user_perm_effect UNIQUE (user_id, permission, effect)
);

CREATE INDEX idx_upo_user_id      ON user_permission_overrides (user_id);
CREATE INDEX idx_upo_permission   ON user_permission_overrides (permission);
CREATE INDEX idx_upo_expires_at   ON user_permission_overrides (expires_at)
  WHERE expires_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: user_role_overrides
-- Temporarily elevates or changes a user's effective role.
-- Active when: revokedAt IS NULL AND validFrom <= now() <= validUntil.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE user_role_overrides (
  id             TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id        TEXT         NOT NULL,
  override_role  TEXT         NOT NULL,
  reason         TEXT         NOT NULL,
  granted_by     TEXT         NOT NULL,
  valid_from     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  valid_until    TIMESTAMPTZ  NOT NULL,
  revoked_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT fk_uro_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_uro_user_id    ON user_role_overrides (user_id);
CREATE INDEX idx_uro_active     ON user_role_overrides (user_id, revoked_at, valid_until)
  WHERE revoked_at IS NULL;
