-- Migration: 20261015160000_add_digital_twin_simulation
-- Non-destructive additive migration for LabCore ELIS OS Digital Twin & Fault-Recovery Engine

CREATE TABLE IF NOT EXISTS "digital_twin_scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "horizon_hours" INTEGER NOT NULL DEFAULT 8,
    "surge_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "stat_ratio" DOUBLE PRECISION NOT NULL DEFAULT 0.18,
    "ambient_temp_celsius" DOUBLE PRECISION NOT NULL DEFAULT 23.0,
    "analyzer_Nodes_json" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "is_baseline" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_twin_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "digital_twin_runs" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "seed" INTEGER NOT NULL DEFAULT 42,
    "iterations" INTEGER NOT NULL DEFAULT 250,
    "input_snapshot_json" JSONB NOT NULL,
    "metrics_summary_json" JSONB NOT NULL,
    "department_forecasts_json" JSONB NOT NULL,
    "stability_alerts_json" JSONB NOT NULL,
    "bottleneck_score" DOUBLE PRECISION NOT NULL,
    "predicted_sla_breach_pct" DOUBLE PRECISION NOT NULL,
    "executed_by" TEXT NOT NULL,
    "execution_duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_twin_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "analyzer_failover_proposals" (
    "id" TEXT NOT NULL,
    "simulation_run_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "faulted_analyzer_id" TEXT NOT NULL,
    "fault_reason" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "affected_pending_specimens" INTEGER NOT NULL,
    "rerouting_plan_json" JSONB NOT NULL,
    "estimated_tat_saved_mins" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "proposed_by" TEXT NOT NULL,
    "reviewed_by" TEXT,
    "review_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analyzer_failover_proposals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "digital_twin_runs_idempotency_key_key"
    ON "digital_twin_runs"("idempotency_key");

CREATE INDEX IF NOT EXISTS "digital_twin_runs_created_at_idx"
    ON "digital_twin_runs"("created_at" DESC);

CREATE UNIQUE INDEX IF NOT EXISTS "analyzer_failover_proposals_idempotency_key_key"
    ON "analyzer_failover_proposals"("idempotency_key");

CREATE INDEX IF NOT EXISTS "analyzer_failover_proposals_status_idx"
    ON "analyzer_failover_proposals"("status");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'digital_twin_runs_scenario_id_fkey'
    ) THEN
        ALTER TABLE "digital_twin_runs"
        ADD CONSTRAINT "digital_twin_runs_scenario_id_fkey"
        FOREIGN KEY ("scenario_id") REFERENCES "digital_twin_scenarios"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;