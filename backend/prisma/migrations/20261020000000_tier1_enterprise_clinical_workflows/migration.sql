-- ============================================================================
-- NIKIL-LABCORE-ELIS-OS: Tier 1 Enterprise Clinical Workflows Migration
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "VacutainerTubeType" AS ENUM (
    'LAVENDER_EDTA', 'GOLD_SST', 'GREY_FLUORIDE', 'BLUE_CITRATE',
    'YELLOW_URINE', 'GREEN_HEPARIN', 'RED_PLAIN', 'BLACK_ESR'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TubeLifecycleStatus" AS ENUM (
    'PENDING_COLLECTION', 'COLLECTED', 'IN_TRANSIT', 'RECEIVED_AT_LAB',
    'CENTRIFUGING', 'CENTRIFUGED_DECAPPED', 'ALIQUOTED', 'ON_ANALYZER',
    'ARCHIVED_IN_RACK', 'REJECTED_QNS', 'REJECTED_HEMOLYZED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AliquotTargetDepartment" AS ENUM (
    'BIOCHEMISTRY', 'IMMUNOLOGY', 'HEMATOLOGY', 'COAGULATION',
    'CLINICAL_PATHOLOGY', 'SEROLOGY', 'MOLECULAR_BIOLOGY'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EncounterType" AS ENUM ('OPD', 'IPD', 'EMERGENCY_STAT', 'ICU', 'DAYCARE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatSlaStatus" AS ENUM (
    'ON_TRACK', 'WARNING_75_PERCENT', 'BREACHED_SLA',
    'COMPLETED_WITHIN_SLA', 'COMPLETED_BREACHED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AutoVerificationVerdict" AS ENUM ('AUTO_APPROVED', 'ROUTED_TO_PATHOLOGIST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AutoVerificationFailTag" AS ENUM (
    'DELTA_BREACH', 'PANIC_VALUE', 'QC_SUSPECT',
    'UNVERIFIED_INDEX', 'MACHINE_FLAG', 'OUT_OF_REF_RANGE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Alter existing orders table safely for EncounterType and IPD/ICU fields
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "encounter_type" "EncounterType" NOT NULL DEFAULT 'OPD',
  ADD COLUMN IF NOT EXISTS "ward_name" TEXT,
  ADD COLUMN IF NOT EXISTS "room_number" TEXT,
  ADD COLUMN IF NOT EXISTS "bed_number" TEXT,
  ADD COLUMN IF NOT EXISTS "nurse_station_id" TEXT;

-- Create specimen_tubes table
CREATE TABLE IF NOT EXISTS "specimen_tubes" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "primary_barcode" TEXT NOT NULL,
  "tube_type" "VacutainerTubeType" NOT NULL,
  "additive_name" TEXT NOT NULL,
  "cap_color_hex" TEXT NOT NULL,
  "order_of_draw_rank" INTEGER NOT NULL,
  "required_volume_ml" DECIMAL(5,2) NOT NULL,
  "collected_volume_ml" DECIMAL(5,2),
  "is_qns_flagged" BOOLEAN NOT NULL DEFAULT false,
  "qns_override_reason" TEXT,
  "status" "TubeLifecycleStatus" NOT NULL DEFAULT 'PENDING_COLLECTION',
  "collected_by_user_id" TEXT,
  "collected_at" TIMESTAMP(3),
  "received_by_user_id" TEXT,
  "received_at" TIMESTAMP(3),
  "centrifuge_speed_rpm" INTEGER,
  "centrifuge_duration_min" INTEGER,
  "centrifuged_at" TIMESTAMP(3),
  "centrifuged_by_user_id" TEXT,
  "is_decapped" BOOLEAN NOT NULL DEFAULT false,
  "decapped_at" TIMESTAMP(3),
  "hemolysis_index" DECIMAL(6,2),
  "icterus_index" DECIMAL(6,2),
  "lipemia_index" DECIMAL(6,2),
  "consolidated_test_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "consolidated_order_items" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "specimen_tubes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "specimen_tubes_primary_barcode_key" ON "specimen_tubes"("primary_barcode");
CREATE INDEX IF NOT EXISTS "specimen_tubes_order_id_idx" ON "specimen_tubes"("order_id");
CREATE INDEX IF NOT EXISTS "specimen_tubes_patient_id_idx" ON "specimen_tubes"("patient_id");
CREATE INDEX IF NOT EXISTS "specimen_tubes_status_idx" ON "specimen_tubes"("status");

-- Create specimen_aliquots table
CREATE TABLE IF NOT EXISTS "specimen_aliquots" (
  "id" TEXT NOT NULL,
  "parent_tube_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "aliquot_barcode" TEXT NOT NULL,
  "aliquot_suffix" TEXT NOT NULL,
  "target_department" "AliquotTargetDepartment" NOT NULL,
  "target_analyzer_code" TEXT,
  "allocated_volume_ml" DECIMAL(5,2) NOT NULL,
  "assigned_test_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "TubeLifecycleStatus" NOT NULL DEFAULT 'ALIQUOTED',
  "created_by_user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "specimen_aliquots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "specimen_aliquots_parent_tube_id_fkey" FOREIGN KEY ("parent_tube_id") REFERENCES "specimen_tubes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "specimen_aliquots_aliquot_barcode_key" ON "specimen_aliquots"("aliquot_barcode");
CREATE INDEX IF NOT EXISTS "specimen_aliquots_parent_tube_id_idx" ON "specimen_aliquots"("parent_tube_id");
CREATE INDEX IF NOT EXISTS "specimen_aliquots_order_id_idx" ON "specimen_aliquots"("order_id");

-- Create stat_order_trackers table
CREATE TABLE IF NOT EXISTS "stat_order_trackers" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "order_number" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "patient_name" TEXT NOT NULL,
  "encounter_type" "EncounterType" NOT NULL DEFAULT 'OPD',
  "ward_name" TEXT,
  "room_number" TEXT,
  "bed_number" TEXT,
  "nurse_station_id" TEXT,
  "attending_physician" TEXT,
  "requires_bedside_draw" BOOLEAN NOT NULL DEFAULT false,
  "assigned_phlebotomist_id" TEXT,
  "phlebotomy_dispatched_at" TIMESTAMP(3),
  "bedside_collected_at" TIMESTAMP(3),
  "biomarker_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "target_tat_minutes" INTEGER NOT NULL DEFAULT 30,
  "ordered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "warning_threshold_at" TIMESTAMP(3) NOT NULL,
  "hard_sla_deadline_at" TIMESTAMP(3) NOT NULL,
  "completed_at" TIMESTAMP(3),
  "sla_status" "StatSlaStatus" NOT NULL DEFAULT 'ON_TRACK',
  "audio_alert_acknowledged" BOOLEAN NOT NULL DEFAULT false,
  "acknowledged_by_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stat_order_trackers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stat_order_trackers_order_id_key" ON "stat_order_trackers"("order_id");
CREATE INDEX IF NOT EXISTS "stat_order_trackers_encounter_type_idx" ON "stat_order_trackers"("encounter_type");
CREATE INDEX IF NOT EXISTS "stat_order_trackers_sla_status_idx" ON "stat_order_trackers"("sla_status");

-- Create auto_verification_rules table
CREATE TABLE IF NOT EXISTS "auto_verification_rules" (
  "id" TEXT NOT NULL,
  "test_code" TEXT NOT NULL,
  "parameter_name" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "male_min_ref" DECIMAL(10,3) NOT NULL,
  "male_max_ref" DECIMAL(10,3) NOT NULL,
  "female_min_ref" DECIMAL(10,3) NOT NULL,
  "female_max_ref" DECIMAL(10,3) NOT NULL,
  "pediatric_min_ref" DECIMAL(10,3),
  "pediatric_max_ref" DECIMAL(10,3),
  "panic_low_limit" DECIMAL(10,3),
  "panic_high_limit" DECIMAL(10,3),
  "max_delta_percent_72h" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  "qc_shift_window_hours" INTEGER NOT NULL DEFAULT 8,
  "max_hemolysis_index" DECIMAL(6,2) NOT NULL DEFAULT 50.00,
  "max_icterus_index" DECIMAL(6,2) NOT NULL DEFAULT 15.00,
  "max_lipemia_index" DECIMAL(6,2) NOT NULL DEFAULT 150.00,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auto_verification_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "auto_verification_rules_test_code_key" ON "auto_verification_rules"("test_code");

-- Create analyzer_shift_qc_logs table
CREATE TABLE IF NOT EXISTS "analyzer_shift_qc_logs" (
  "id" TEXT NOT NULL,
  "analyzer_id" TEXT NOT NULL,
  "analyzer_code" TEXT NOT NULL,
  "test_code" TEXT NOT NULL,
  "qc_level" TEXT NOT NULL,
  "westgard_passed" BOOLEAN NOT NULL,
  "z_score" DECIMAL(5,2) NOT NULL,
  "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "valid_until" TIMESTAMP(3) NOT NULL,
  "operator_user_id" TEXT NOT NULL,
  CONSTRAINT "analyzer_shift_qc_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "analyzer_shift_qc_logs_lookup_idx" ON "analyzer_shift_qc_logs"("analyzer_code", "test_code", "valid_until");

-- Create auto_verification_audit_logs table
CREATE TABLE IF NOT EXISTS "auto_verification_audit_logs" (
  "id" TEXT NOT NULL,
  "result_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "test_code" TEXT NOT NULL,
  "numeric_value" DECIMAL(10,3),
  "qualitative_value" TEXT,
  "qc_passed_8h" BOOLEAN NOT NULL,
  "zero_machine_flags" BOOLEAN NOT NULL,
  "within_ref_interval" BOOLEAN NOT NULL,
  "delta_check_passed" BOOLEAN NOT NULL,
  "serum_indices_clean" BOOLEAN NOT NULL,
  "previous_value_72h" DECIMAL(10,3),
  "delta_change_percent" DECIMAL(6,2),
  "machine_error_flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "fail_reason_tags" "AutoVerificationFailTag"[] DEFAULT ARRAY[]::"AutoVerificationFailTag"[],
  "verdict" "AutoVerificationVerdict" NOT NULL,
  "nabl_pdf_generated" BOOLEAN NOT NULL DEFAULT false,
  "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auto_verification_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "auto_verification_audit_logs_order_id_idx" ON "auto_verification_audit_logs"("order_id");

-- Create panic_alert_read_back_logs table
CREATE TABLE IF NOT EXISTS "panic_alert_read_back_logs" (
  "id" TEXT NOT NULL,
  "result_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "order_number" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "patient_name" TEXT NOT NULL,
  "test_code" TEXT NOT NULL,
  "parameter_name" TEXT NOT NULL,
  "panic_value" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "critical_limit_breached" TEXT NOT NULL,
  "whatsapp_dispatched" BOOLEAN NOT NULL DEFAULT false,
  "whatsapp_message_id" TEXT,
  "sms_priority_dispatched" BOOLEAN NOT NULL DEFAULT false,
  "sms_reference_id" TEXT,
  "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notified_doctor_name" TEXT,
  "doctor_phone" TEXT,
  "notified_by_user_id" TEXT,
  "notified_by_user_name" TEXT,
  "call_timestamp" TIMESTAMP(3),
  "read_back_confirmed" BOOLEAN NOT NULL DEFAULT false,
  "clinical_action_remarks" TEXT,
  "is_resolved" BOOLEAN NOT NULL DEFAULT false,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "panic_alert_read_back_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "panic_alert_read_back_logs_order_id_idx" ON "panic_alert_read_back_logs"("order_id");
CREATE INDEX IF NOT EXISTS "panic_alert_read_back_logs_resolved_idx" ON "panic_alert_read_back_logs"("is_resolved");
