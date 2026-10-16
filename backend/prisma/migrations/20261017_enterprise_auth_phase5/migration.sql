-- Phase 5: FDA 21 CFR Part 11 Digital Signatures, OAuth2 M2M Gateway & SIEM Threat Telemetry
-- Migration: 20261017_enterprise_auth_phase5

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: digital_signatures (FDA 21 CFR Part 11)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS digital_signatures (
  id                  TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id             TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type       TEXT         NOT NULL,
  resource_id         TEXT         NOT NULL,
  meaning             TEXT         NOT NULL,
  reason              TEXT,
  data_snapshot_hash  TEXT         NOT NULL,
  signature_hash      TEXT         NOT NULL,
  raw_payload         TEXT,
  ip_address          TEXT,
  user_agent          TEXT,
  signed_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ds_user_id ON digital_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_ds_resource ON digital_signatures(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_ds_signed_at ON digital_signatures(signed_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: api_clients (OAuth2 M2M Gateway)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_clients (
  id                  TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name                TEXT         NOT NULL,
  client_id           TEXT         NOT NULL UNIQUE,
  client_secret_hash  TEXT         NOT NULL,
  scopes              TEXT         NOT NULL,
  ip_whitelist        TEXT,
  active              BOOLEAN      NOT NULL DEFAULT TRUE,
  expires_at          TIMESTAMPTZ,
  last_used_at        TIMESTAMPTZ,
  rate_limit          INTEGER      NOT NULL DEFAULT 1000,
  created_by_id       TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ac_client_id ON api_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_ac_active ON api_clients(active);

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: security_threat_alerts (SIEM Threat Telemetry)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_threat_alerts (
  id                  TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  threat_type         TEXT         NOT NULL,
  severity            TEXT         NOT NULL,
  target_user_id      TEXT,
  source_ip           TEXT         NOT NULL,
  details             TEXT         NOT NULL,
  mitigated           BOOLEAN      NOT NULL DEFAULT FALSE,
  mitigation_action   TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sta_threat_type ON security_threat_alerts(threat_type);
CREATE INDEX IF NOT EXISTS idx_sta_severity ON security_threat_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_sta_source_ip ON security_threat_alerts(source_ip);
CREATE INDEX IF NOT EXISTS idx_sta_created_at ON security_threat_alerts(created_at);
