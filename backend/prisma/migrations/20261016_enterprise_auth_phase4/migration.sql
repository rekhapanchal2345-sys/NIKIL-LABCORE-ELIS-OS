-- Phase 4: Enterprise Identity Federation, SSO, SCIM 2.0 & Break-Glass Emergency Access
-- Migration: 20261016_enterprise_auth_phase4

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: sso_providers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sso_providers (
  id                  TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name                TEXT         NOT NULL,
  slug                TEXT         NOT NULL UNIQUE,
  protocol            TEXT         NOT NULL CHECK (protocol IN ('OIDC', 'SAML')),
  issuer              TEXT         NOT NULL,
  client_id           TEXT         NOT NULL,
  client_secret       TEXT,
  metadata_url        TEXT,
  sso_url             TEXT         NOT NULL,
  token_url           TEXT,
  user_info_url       TEXT,
  certificate         TEXT,
  enabled             BOOLEAN      NOT NULL DEFAULT TRUE,
  domain_restriction  TEXT,
  default_role        TEXT         NOT NULL DEFAULT 'FRONT_DESK',
  role_attribute      TEXT,
  jit_enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: sso_accounts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sso_accounts (
  id                  TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider_id         TEXT         NOT NULL REFERENCES sso_providers(id) ON DELETE CASCADE,
  user_id             TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_subject_id TEXT         NOT NULL,
  email               TEXT         NOT NULL,
  profile_data        TEXT,
  last_login_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT uq_sso_provider_sub UNIQUE (provider_id, external_subject_id)
);

CREATE INDEX IF NOT EXISTS idx_sso_accounts_user_id ON sso_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_accounts_email ON sso_accounts(email);

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: break_glass_events
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS break_glass_events (
  id                    TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id               TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_resource_type  TEXT         NOT NULL CHECK (target_resource_type IN ('patient', 'result', 'order')),
  target_resource_id    TEXT         NOT NULL,
  reason                TEXT         NOT NULL,
  token_hash            TEXT         NOT NULL UNIQUE,
  status                TEXT         NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
  expires_at            TIMESTAMPTZ  NOT NULL,
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           TEXT,
  review_notes          TEXT,
  approved              BOOLEAN,
  ip_address            TEXT,
  user_agent            TEXT,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bge_user_id ON break_glass_events(user_id);
CREATE INDEX IF NOT EXISTS idx_bge_resource ON break_glass_events(target_resource_type, target_resource_id);
CREATE INDEX IF NOT EXISTS idx_bge_status_expiry ON break_glass_events(status, expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: scim_tokens
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scim_tokens (
  id          TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT         NOT NULL,
  token_hash  TEXT         NOT NULL UNIQUE,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_by  TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
