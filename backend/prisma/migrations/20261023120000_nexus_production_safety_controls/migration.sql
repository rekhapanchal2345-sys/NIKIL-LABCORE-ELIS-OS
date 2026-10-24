-- Migration: 20261023120000_nexus_production_safety_controls
-- Purpose: Backward-compatible additive tables for explicit Operating Modes,
--          Instrument Message Idempotency/DLQ, Versioned Clinical Rules, and Approval Gates.

DO $$ BEGIN
  CREATE TYPE "NexusOperatingMode" AS ENUM ('DEMO_MODE', 'SHADOW_MODE', 'CONTROLLED_PRODUCTION_MODE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TelemetryHealthState" AS ENUM ('LIVE', 'STALE', 'SIMULATED', 'DISCONNECTED', 'DEGRADED', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ClinicalProposalStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "nexus_operating_mode_config" (
  "id" TEXT PRIMARY KEY DEFAULT 'GLOBAL_NEXUS_MODE',
  "organization_id" TEXT NOT NULL,
  "operating_mode" "NexusOperatingMode" NOT NULL DEFAULT 'DEMO_MODE',
  "emergency_stop_active" BOOLEAN NOT NULL DEFAULT FALSE,
  "enabled_capabilities" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "updated_by_user_id" TEXT NOT NULL,
  "approval_signature_hash" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "instrument_message_journal" (
  "id" TEXT PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "analyzer_id" TEXT NOT NULL,
  "correlation_id" TEXT NOT NULL,
  "idempotency_hash" TEXT NOT NULL UNIQUE,
  "protocol" TEXT NOT NULL, -- 'ASTM_E1394' | 'HL7_V251'
  "raw_payload_hash" TEXT NOT NULL,
  "specimen_barcode" TEXT,
  "processing_status" TEXT NOT NULL, -- 'PROCESSED' | 'DUPLICATE_IGNORED' | 'DEAD_LETTER' | 'SHADOW_LOGGED'
  "error_code" TEXT,
  "error_diagnostic" TEXT,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "received_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "processed_at" TIMESTAMPTZ,
  "replayed_by_user_id" TEXT,
  "replayed_at" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "idx_inst_journal_analyzer_rec"
  ON "instrument_message_journal" ("organization_id", "analyzer_id", "received_at" DESC);

CREATE TABLE IF NOT EXISTS "nexus_clinical_proposals" (
  "id" TEXT PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "operating_mode" "NexusOperatingMode" NOT NULL,
  "proposal_type" TEXT NOT NULL, -- 'REFLEX_SUGGESTION' | 'DILUTION_RERUN' | 'REDRAW_REQUEST' | 'CRITICAL_ESCALATION' | 'ANALYZER_REROUTE'
  "patient_id" TEXT,
  "specimen_barcode" TEXT NOT NULL,
  "order_id" TEXT,
  "detected_condition" TEXT NOT NULL,
  "supporting_source_data" JSONB NOT NULL,
  "validated_rule_id" TEXT NOT NULL,
  "validated_rule_version" TEXT NOT NULL,
  "confidence_interval" JSONB,
  "recommended_action" TEXT NOT NULL,
  "required_reviewer_role" TEXT NOT NULL, -- 'PATHOLOGIST' | 'LAB_DIRECTOR' | 'SENIOR_TECHNOLOGIST'
  "status" "ClinicalProposalStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "reviewed_by_user_id" TEXT,
  "review_decision_reason" TEXT,
  "reviewed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rollback SQL (Reference):
-- DROP TABLE IF EXISTS "nexus_clinical_proposals";
-- DROP TABLE IF EXISTS "instrument_message_journal";
-- DROP TABLE IF EXISTS "nexus_operating_mode_config";
