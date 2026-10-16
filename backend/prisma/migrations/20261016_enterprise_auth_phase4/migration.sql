-- Phase 4: Enterprise Identity Federation, SSO, SCIM 2.0 & Break-Glass Emergency Access
-- Migration: 20261016_enterprise_auth_phase4

DO $$
BEGIN
  -- ─────────────────────────────────────────────────────────────────────────────
  -- Table: sso_providers
  -- ─────────────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sso_providers') THEN
    CREATE TABLE sso_providers (
      id                  TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name                TEXT         NOT NULL,
      slug                TEXT         NOT NULL UNIQUE,
      protocol            TEXT         NOT NULL CHECK (protocol IN ('OIDC', 'SAML')),
      issuer              TEXT         NOT NULL,
      "clientId"          TEXT         NOT NULL,
      "clientSecret"      TEXT,
      "metadataUrl"       TEXT,
      "ssoUrl"            TEXT         NOT NULL,
      "tokenUrl"          TEXT,
      "userInfoUrl"       TEXT,
      certificate         TEXT,
      enabled             BOOLEAN      NOT NULL DEFAULT TRUE,
      "domainRestriction" TEXT,
      "defaultRole"       TEXT         NOT NULL DEFAULT 'FRONT_DESK',
      "roleAttribute"     TEXT,
      "jitEnabled"        BOOLEAN      NOT NULL DEFAULT TRUE,
      "createdAt"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
      "updatedAt"         TIMESTAMPTZ  NOT NULL DEFAULT now()
    );
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────────
  -- Table: sso_accounts
  -- ─────────────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sso_accounts') THEN
    CREATE TABLE sso_accounts (
      id                  TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "providerId"        TEXT         NOT NULL REFERENCES sso_providers(id) ON DELETE CASCADE,
      "userId"            TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "externalSubjectId" TEXT         NOT NULL,
      email               TEXT         NOT NULL,
      "profileData"       TEXT,
      "lastLoginAt"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
      "createdAt"         TIMESTAMPTZ  NOT NULL DEFAULT now(),

      CONSTRAINT uq_sso_provider_sub UNIQUE ("providerId", "externalSubjectId")
    );

    CREATE INDEX idx_sso_accounts_user_id ON sso_accounts("userId");
    CREATE INDEX idx_sso_accounts_email ON sso_accounts(email);
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────────
  -- Table: break_glass_events
  -- ─────────────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'break_glass_events') THEN
    CREATE TABLE break_glass_events (
      id                    TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"              TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "targetResourceType"  TEXT         NOT NULL CHECK ("targetResourceType" IN ('patient', 'result', 'order')),
      "targetResourceId"    TEXT         NOT NULL,
      reason                TEXT         NOT NULL,
      "tokenHash"           TEXT         NOT NULL UNIQUE,
      status                TEXT         NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
      "expiresAt"           TIMESTAMPTZ  NOT NULL,
      "reviewedAt"          TIMESTAMPTZ,
      "reviewedBy"          TEXT,
      "reviewNotes"         TEXT,
      approved              BOOLEAN,
      "ipAddress"           TEXT,
      "userAgent"           TEXT,
      "createdAt"           TIMESTAMPTZ  NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_bge_user_id ON break_glass_events("userId");
    CREATE INDEX idx_bge_resource ON break_glass_events("targetResourceType", "targetResourceId");
    CREATE INDEX idx_bge_status_expiry ON break_glass_events(status, "expiresAt");
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────────
  -- Table: scim_tokens
  -- ─────────────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scim_tokens') THEN
    CREATE TABLE scim_tokens (
      id          TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name        TEXT         NOT NULL,
      "tokenHash" TEXT         NOT NULL UNIQUE,
      active      BOOLEAN      NOT NULL DEFAULT TRUE,
      "lastUsedAt" TIMESTAMPTZ,
      "expiresAt"  TIMESTAMPTZ,
      "createdBy"  TEXT         NOT NULL,
      "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now()
    );
  END IF;
END $$;
