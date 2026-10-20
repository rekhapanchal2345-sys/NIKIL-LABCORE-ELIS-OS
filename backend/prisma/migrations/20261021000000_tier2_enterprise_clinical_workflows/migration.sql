-- ============================================================================
-- MIGRATION: 20261021000000_tier2_enterprise_clinical_workflows
-- Target: PostgreSQL 14+
-- ============================================================================

-- 1. Microbiology & AST Tables
CREATE TABLE IF NOT EXISTS "microbiology_cultures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accession_number" TEXT NOT NULL UNIQUE,
    "sample_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "ward_or_unit" TEXT NOT NULL DEFAULT 'OPD',
    "is_icu_patient" BOOLEAN NOT NULL DEFAULT false,
    "sample_site" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACCESSIONED',
    "gram_stain_morphology" TEXT,
    "pus_cells_count" TEXT,
    "epithelial_cells_count" TEXT,
    "preliminary_report_at" TIMESTAMP(3),
    "preliminary_reported_by" TEXT,
    "incubation_temp_celsius" NUMERIC(4,1) NOT NULL DEFAULT 37.0,
    "incubation_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "colony_count_cfu" TEXT,
    "final_clinical_notes" TEXT,
    "verified_by_user_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "microbiology_isolates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "culture_id" TEXT NOT NULL REFERENCES "microbiology_cultures"("id") ON DELETE CASCADE,
    "isolate_number" INTEGER NOT NULL,
    "organism_code" TEXT NOT NULL,
    "organism_name" TEXT NOT NULL,
    "gram_reaction" TEXT NOT NULL,
    "growth_density" TEXT NOT NULL,
    "mdro_flags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_hicc_alert_triggered" BOOLEAN NOT NULL DEFAULT false,
    "isolated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("culture_id", "isolate_number")
);

CREATE TABLE IF NOT EXISTS "antibiotic_susceptibilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isolate_id" TEXT NOT NULL REFERENCES "microbiology_isolates"("id") ON DELETE CASCADE,
    "antibiotic_code" TEXT NOT NULL,
    "antibiotic_name" TEXT NOT NULL,
    "antibiotic_class" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'VITEK2_MIC',
    "zone_diameter_mm" NUMERIC(5,1),
    "mic_value_ug_ml" NUMERIC(8,3),
    "clsi_breakpoint_s" TEXT NOT NULL,
    "clsi_breakpoint_r" TEXT NOT NULL,
    "interpretation" TEXT NOT NULL,
    "is_restricted_reserve" BOOLEAN NOT NULL DEFAULT false,
    "tested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("isolate_id", "antibiotic_code")
);

-- 2. Reagent Inventory & CPT Tables
CREATE TABLE IF NOT EXISTS "reagent_masters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reagent_code" TEXT NOT NULL UNIQUE,
    "reagent_name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "analyzer_model" TEXT NOT NULL,
    "unit_of_measure" TEXT NOT NULL DEFAULT 'mL',
    "pack_size_volume" NUMERIC(10,2) NOT NULL,
    "on_board_stability_days" INTEGER NOT NULL,
    "minimum_stock_alert_vol" NUMERIC(10,2) NOT NULL,
    "storage_temp_range" TEXT NOT NULL DEFAULT '2°C - 8°C',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "reagent_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reagent_master_id" TEXT NOT NULL REFERENCES "reagent_masters"("id") ON DELETE CASCADE,
    "lot_number" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "opened_on_carousel_at" TIMESTAMP(3),
    "calibrator_factor" NUMERIC(8,4) NOT NULL DEFAULT 1.0000,
    "initial_volume_ml" NUMERIC(10,3) NOT NULL,
    "remaining_volume_ml" NUMERIC(10,3) NOT NULL,
    "kit_purchase_cost_inr" NUMERIC(12,2) NOT NULL,
    "calibrator_cost_per_test" NUMERIC(8,2) NOT NULL DEFAULT 4.50,
    "status" TEXT NOT NULL DEFAULT 'STANDBY_REFRIGERATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("reagent_master_id", "lot_number")
);

CREATE TABLE IF NOT EXISTS "test_reagent_recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "test_id" TEXT NOT NULL,
    "test_code" TEXT NOT NULL,
    "test_name" TEXT NOT NULL,
    "reagent_master_id" TEXT NOT NULL REFERENCES "reagent_masters"("id") ON DELETE CASCADE,
    "volume_per_test_ml" NUMERIC(8,4) NOT NULL,
    "reaction_cuvettes_count" INTEGER NOT NULL DEFAULT 1,
    "pipette_tips_count" INTEGER NOT NULL DEFAULT 1,
    "consumable_overhead_inr" NUMERIC(8,2) NOT NULL DEFAULT 3.25,
    UNIQUE("test_code", "reagent_master_id")
);

CREATE TABLE IF NOT EXISTS "reagent_consumption_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reagent_lot_id" TEXT NOT NULL REFERENCES "reagent_lots"("id") ON DELETE CASCADE,
    "test_code" TEXT NOT NULL,
    "order_id" TEXT,
    "sample_barcode" TEXT,
    "volume_consumed_ml" NUMERIC(8,4) NOT NULL,
    "cuvettes_used" INTEGER NOT NULL,
    "tips_used" INTEGER NOT NULL,
    "computed_reagent_cost_inr" NUMERIC(10,2) NOT NULL,
    "consumed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_by_user_id" TEXT
);

-- 3. B2B Hub-and-Spoke Logistics & Wallet Ledger Tables
CREATE TABLE IF NOT EXISTS "b2b_partner_spokes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partner_code" TEXT NOT NULL UNIQUE,
    "center_name" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'GOLD_FRANCHISEE',
    "city" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "wallet_balance_inr" NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    "credit_limit_inr" NUMERIC(14,2) NOT NULL DEFAULT 25000.00,
    "discount_percentage" NUMERIC(5,2) NOT NULL DEFAULT 35.00,
    "is_booking_frozen" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "b2b_wallet_ledgers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partner_id" TEXT NOT NULL REFERENCES "b2b_partner_spokes"("id") ON DELETE CASCADE,
    "transaction_ref" TEXT NOT NULL UNIQUE,
    "transaction_type" TEXT NOT NULL,
    "amount_inr" NUMERIC(12,2) NOT NULL,
    "balance_before_inr" NUMERIC(14,2) NOT NULL,
    "balance_after_inr" NUMERIC(14,2) NOT NULL,
    "order_id" TEXT,
    "remarks" TEXT NOT NULL,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "consignment_manifests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manifest_barcode" TEXT NOT NULL UNIQUE,
    "partner_id" TEXT NOT NULL REFERENCES "b2b_partner_spokes"("id") ON DELETE CASCADE,
    "tamper_seal_number" TEXT NOT NULL,
    "courier_runner_name" TEXT NOT NULL,
    "courier_runner_phone" TEXT NOT NULL,
    "departure_temp_celsius" NUMERIC(4,1) NOT NULL,
    "arrival_temp_celsius" NUMERIC(4,1),
    "expected_tube_count" INTEGER NOT NULL,
    "received_tube_count" INTEGER,
    "discrepancy_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PACKED_AT_SPOKE',
    "dispatched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_at_hub_at" TIMESTAMP(3),
    "received_by_hub_user_id" TEXT,
    "discrepancy_notes" TEXT
);

CREATE TABLE IF NOT EXISTS "consignment_manifest_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manifest_id" TEXT NOT NULL REFERENCES "consignment_manifests"("id") ON DELETE CASCADE,
    "tube_barcode" TEXT NOT NULL,
    "sample_id" TEXT,
    "order_number" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "vacutainer_type" TEXT NOT NULL,
    "is_scanned_at_hub" BOOLEAN NOT NULL DEFAULT false,
    "hub_scanned_at" TIMESTAMP(3),
    "condition_status" TEXT NOT NULL DEFAULT 'INTACT',
    UNIQUE("manifest_id", "tube_barcode")
);

CREATE INDEX IF NOT EXISTS "idx_micro_cultures_sample" ON "microbiology_cultures"("sample_id");
CREATE INDEX IF NOT EXISTS "idx_micro_isolates_org" ON "microbiology_isolates"("organism_name");
CREATE INDEX IF NOT EXISTS "idx_ast_abx_interp" ON "antibiotic_susceptibilities"("antibiotic_name", "interpretation");
CREATE INDEX IF NOT EXISTS "idx_reagent_lots_expiry" ON "reagent_lots"("status", "expiry_date");
CREATE INDEX IF NOT EXISTS "idx_b2b_manifests_barcode" ON "consignment_manifests"("manifest_barcode");
