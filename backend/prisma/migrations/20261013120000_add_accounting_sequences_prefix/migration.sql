-- ISS-013: Ensure accounting_sequences base table exists before altering it
CREATE TABLE IF NOT EXISTS "accounting_sequences" (
    "id" VARCHAR(255) NOT NULL,
    "series_type" VARCHAR(50) NOT NULL,
    "financial_year" VARCHAR(20) NOT NULL,
    "branch_id" VARCHAR(100) NOT NULL DEFAULT 'DEFAULT',
    "current_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accounting_sequences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "unique_series_fy_branch" UNIQUE ("series_type", "financial_year", "branch_id")
);

-- Add prefix column to accounting_sequences table
ALTER TABLE "accounting_sequences" ADD COLUMN IF NOT EXISTS "prefix" VARCHAR(50);

