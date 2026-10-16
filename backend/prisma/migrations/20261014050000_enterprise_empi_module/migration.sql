-- Enterprise EMPI Module Migration
-- Includes: PostgreSQL extensions (pg_trgm, fuzzystrmatch), 7 Core Capabilities schema & tables

-- 1. Enable required extensions for Phonetic and Trigram matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- 2. Create Enums if they do not exist
DO $$ BEGIN
    CREATE TYPE "FamilyRelation" AS ENUM ('HEAD', 'SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER', 'SELF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ConfidentialityLevel" AS ENUM ('STANDARD', 'VIP_MASKED', 'RESTRICTED_SENSITIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EmpiDecision" AS ENUM ('AUTO_BLOCK_DUPLICATE', 'POTENTIAL_DUPLICATE_QUEUE', 'DISTINCT_PATIENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PregnancyStatus" AS ENUM ('NOT_APPLICABLE', 'NOT_PREGNANT', 'TRIMESTER_1', 'TRIMESTER_2', 'TRIMESTER_3', 'POSTPARTUM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReviewResolution" AS ENUM ('MERGE', 'DISMISS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Add EMPI columns to patients table
ALTER TABLE "patients"
ADD COLUMN IF NOT EXISTS "phoneHash" VARCHAR(64),
ADD COLUMN IF NOT EXISTS "phoneticPrimary" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "phoneticAlternate" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "householdGroupId" TEXT,
ADD COLUMN IF NOT EXISTS "familyRelation" "FamilyRelation" DEFAULT 'SELF',
ADD COLUMN IF NOT EXISTS "allowFamilyWalletDrawdown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "confidentialityLevel" "ConfidentialityLevel" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN IF NOT EXISTS "confidentialAlias" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "encryptionKeyVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "abhaToken" TEXT;

-- 4. Create Household Groups Table
CREATE TABLE IF NOT EXISTS "household_groups" (
    "id" TEXT NOT NULL,
    "groupName" VARCHAR(100),
    "primaryPhone" VARCHAR(20) NOT NULL,
    "primaryPhoneHash" VARCHAR(64) NOT NULL,
    "primaryAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "household_groups_primaryPhoneHash_key" ON "household_groups"("primaryPhoneHash");

-- 5. Create EMPI Review Queue Table
CREATE TABLE IF NOT EXISTS "empi_review_queue" (
    "id" TEXT NOT NULL,
    "incomingPatientId" TEXT NOT NULL,
    "candidatePatientId" TEXT NOT NULL,
    "empiScore" DECIMAL(5,2) NOT NULL,
    "empiDecision" "EmpiDecision" NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolution" "ReviewResolution",
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empi_review_queue_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "empi_review_queue" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
ALTER TABLE "empi_review_queue" ADD COLUMN IF NOT EXISTS "resolvedById" TEXT;
ALTER TABLE "empi_review_queue" ADD COLUMN IF NOT EXISTS "resolution" "ReviewResolution";

CREATE INDEX IF NOT EXISTS "empi_review_queue_resolvedAt_idx" ON "empi_review_queue"("resolvedAt");
CREATE INDEX IF NOT EXISTS "empi_review_queue_incomingPatientId_idx" ON "empi_review_queue"("incomingPatientId");
CREATE INDEX IF NOT EXISTS "empi_review_queue_candidatePatientId_idx" ON "empi_review_queue"("candidatePatientId");

-- 6. Create Patient Clinical Profiles Table (NABL ISO 15189:2022)
CREATE TABLE IF NOT EXISTS "patient_clinical_profiles" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "pregnancyStatus" "PregnancyStatus" NOT NULL DEFAULT 'NOT_PREGNANT',
    "gestationalWeeks" INTEGER,
    "edd" TIMESTAMP(3),
    "isNicuPatient" BOOLEAN NOT NULL DEFAULT false,
    "birthWeightGrams" INTEGER,
    "gestationalAgeWeeks" INTEGER,
    "isDialysisPatient" BOOLEAN NOT NULL DEFAULT false,
    "dialysisSchedule" VARCHAR(50),
    "onWarfarin" BOOLEAN NOT NULL DEFAULT false,
    "onHeparin" BOOLEAN NOT NULL DEFAULT false,
    "onLmwHeparin" BOOLEAN NOT NULL DEFAULT false,
    "onDirectFactorXa" BOOLEAN NOT NULL DEFAULT false,
    "fastingStatusHours" DECIMAL(4,1),
    "lastMenstrualPeriod" TIMESTAMP(3),
    "activeClinicalTrials" TEXT[],
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_clinical_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "patient_clinical_profiles_patientId_key" ON "patient_clinical_profiles"("patientId");

-- 7. Create Patient Merge Logs & Snapshots
CREATE TABLE IF NOT EXISTS "patient_merge_logs" (
    "id" TEXT NOT NULL,
    "sourcePatientId" TEXT NOT NULL,
    "targetPatientId" TEXT NOT NULL,
    "mergedByUserId" TEXT NOT NULL,
    "mergedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mergeReason" TEXT,

    CONSTRAINT "patient_merge_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "patient_merge_logs_sourcePatientId_idx" ON "patient_merge_logs"("sourcePatientId");
CREATE INDEX IF NOT EXISTS "patient_merge_logs_targetPatientId_idx" ON "patient_merge_logs"("targetPatientId");

CREATE TABLE IF NOT EXISTS "patient_merge_snapshots" (
    "id" TEXT NOT NULL,
    "mergeLogId" TEXT NOT NULL,
    "sourcePatientBackup" JSONB NOT NULL,
    "migratedOrderIds" TEXT[],
    "migratedSampleIds" TEXT[],
    "migratedInvoiceIds" TEXT[],
    "migratedReceiptIds" TEXT[],
    "transferredWalletAmt" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isReverted" BOOLEAN NOT NULL DEFAULT false,
    "revertedAt" TIMESTAMP(3),
    "revertedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_merge_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "patient_merge_snapshots_mergeLogId_key" ON "patient_merge_snapshots"("mergeLogId");

-- 8. Create Break-Glass Access Logs Table
CREATE TABLE IF NOT EXISTS "break_glass_access_logs" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "accessedById" TEXT NOT NULL,
    "clinicalReason" TEXT NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "break_glass_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "break_glass_access_logs_patientId_idx" ON "break_glass_access_logs"("patientId");
CREATE INDEX IF NOT EXISTS "break_glass_access_logs_accessedById_idx" ON "break_glass_access_logs"("accessedById");
CREATE INDEX IF NOT EXISTS "break_glass_access_logs_expiresAt_idx" ON "break_glass_access_logs"("expiresAt");

-- 9. Add Foreign Keys
DO $$ BEGIN
    ALTER TABLE "patients" ADD CONSTRAINT "patients_householdGroupId_fkey" FOREIGN KEY ("householdGroupId") REFERENCES "household_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "empi_review_queue" ADD CONSTRAINT "empi_review_queue_incomingPatientId_fkey" FOREIGN KEY ("incomingPatientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "empi_review_queue" ADD CONSTRAINT "empi_review_queue_candidatePatientId_fkey" FOREIGN KEY ("candidatePatientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "patient_clinical_profiles" ADD CONSTRAINT "patient_clinical_profiles_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "patient_merge_snapshots" ADD CONSTRAINT "patient_merge_snapshots_mergeLogId_fkey" FOREIGN KEY ("mergeLogId") REFERENCES "patient_merge_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "break_glass_access_logs" ADD CONSTRAINT "break_glass_access_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 10. Performance & EMPI Indexes
CREATE INDEX IF NOT EXISTS "idx_patients_phone_hash" ON "patients"("phoneHash");
CREATE INDEX IF NOT EXISTS "idx_patients_phonetic_primary" ON "patients"("phoneticPrimary");
CREATE INDEX IF NOT EXISTS "idx_patients_household_group_id" ON "patients"("householdGroupId");
CREATE INDEX IF NOT EXISTS "idx_patients_confidentiality_level" ON "patients"("confidentialityLevel");
CREATE INDEX IF NOT EXISTS "idx_patients_name_trgm" ON "patients" USING gin (("firstName" || ' ' || "lastName") gin_trgm_ops);
