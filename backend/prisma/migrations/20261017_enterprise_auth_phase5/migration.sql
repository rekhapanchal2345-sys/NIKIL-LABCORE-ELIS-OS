-- Phase 5: FDA 21 CFR Part 11 Digital Signatures, OAuth2 M2M Gateway & SIEM Threat Telemetry
-- Migration: 20261017_enterprise_auth_phase5

DO $$
BEGIN
  -- ─────────────────────────────────────────────────────────────────────────────
  -- Table: digital_signatures (FDA 21 CFR Part 11)
  -- ─────────────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'digital_signatures') THEN
    CREATE TABLE digital_signatures (
      id                  TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"            TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "resourceType"      TEXT         NOT NULL,
      "resourceId"        TEXT         NOT NULL,
      meaning             TEXT         NOT NULL,
      reason              TEXT,
      "dataSnapshotHash"  TEXT         NOT NULL,
      "signatureHash"     TEXT         NOT NULL,
      "rawPayload"        TEXT,
      "ipAddress"         TEXT,
      "userAgent"         TEXT,
      "signedAt"          TIMESTAMPTZ  NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_ds_user_id ON digital_signatures("userId");
    CREATE INDEX idx_ds_resource ON digital_signatures("resourceType", "resourceId");
    CREATE INDEX idx_ds_signed_at ON digital_signatures("signedAt");
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────────
  -- Table: api_clients (OAuth2 M2M Gateway)
  -- ─────────────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_clients') THEN
    CREATE TABLE api_clients (
      id                  TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name                TEXT         NOT NULL,
      "clientId"          TEXT         NOT NULL UNIQUE,
      "clientSecretHash"  TEXT         NOT NULL,
      scopes              TEXT         NOT NULL,
      "ipWhitelist"       TEXT,
      active              BOOLEAN      NOT NULL DEFAULT TRUE,
      "expiresAt"         TIMESTAMPTZ,
      "lastUsedAt"        TIMESTAMPTZ,
      "rateLimit"         INTEGER      NOT NULL DEFAULT 1000,
      "createdById"       TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
      "updatedAt"         TIMESTAMPTZ  NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_ac_client_id ON api_clients("clientId");
    CREATE INDEX idx_ac_active ON api_clients(active);
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────────
  -- Table: security_threat_alerts (SIEM Threat Telemetry)
  -- ─────────────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_threat_alerts') THEN
    CREATE TABLE security_threat_alerts (
      id                  TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "threatType"        TEXT         NOT NULL,
      severity            TEXT         NOT NULL,
      "targetUserId"      TEXT,
      "sourceIp"          TEXT         NOT NULL,
      details             TEXT         NOT NULL,
      mitigated           BOOLEAN      NOT NULL DEFAULT FALSE,
      "mitigationAction"  TEXT,
      "createdAt"         TIMESTAMPTZ  NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_sta_threat_type ON security_threat_alerts("threatType");
    CREATE INDEX idx_sta_severity ON security_threat_alerts(severity);
    CREATE INDEX idx_sta_source_ip ON security_threat_alerts("sourceIp");
    CREATE INDEX idx_sta_created_at ON security_threat_alerts("createdAt");
  END IF;
END $$;
