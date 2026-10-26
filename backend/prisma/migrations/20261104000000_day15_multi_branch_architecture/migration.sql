-- Migration: 20261104000000_day15_multi_branch_architecture
-- Purpose: Add multi-branch capability with tenant data segregation and branch relations

CREATE TABLE IF NOT EXISTS "branches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "nabl_number" TEXT,
    "gstin" TEXT,
    "letterhead_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_main_branch" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "branches_code_idx" ON "branches"("code");
CREATE INDEX IF NOT EXISTS "branches_city_idx" ON "branches"("city");
CREATE INDEX IF NOT EXISTS "branches_is_active_idx" ON "branches"("is_active");

-- Add branch_id to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
CREATE INDEX IF NOT EXISTS "users_branch_id_idx" ON "users"("branch_id");
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add branch_id to patients
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
CREATE INDEX IF NOT EXISTS "patients_branch_id_idx" ON "patients"("branch_id");
DO $$ BEGIN
  ALTER TABLE "patients" ADD CONSTRAINT "patients_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add branch_id to orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
CREATE INDEX IF NOT EXISTS "orders_branch_id_idx" ON "orders"("branch_id");
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
