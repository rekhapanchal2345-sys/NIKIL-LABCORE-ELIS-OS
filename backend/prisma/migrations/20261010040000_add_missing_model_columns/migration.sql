-- Additive migration only: schema.prisma gained these columns but they were
-- never applied to the database, causing P2022 ColumnNotFound errors on
-- patient, test, result, report, invoice, payment and ABDM endpoints.
-- NOTE: accounting_sequences (3 live rows) is intentionally NOT touched.

-- Patient: ABDM / health-ID fields
ALTER TABLE "patients" ADD COLUMN     "healthIdNumber" VARCHAR(20),
ADD COLUMN     "aadhaarReferenceToken" TEXT;

-- TestParameter: LOINC coding
ALTER TABLE "test_parameters" ADD COLUMN     "loincCode" TEXT;

-- ABDM care contexts
ALTER TABLE "abdm_care_contexts" ADD COLUMN     "hipId" TEXT,
ADD COLUMN     "linkingStatus" TEXT NOT NULL DEFAULT 'DISCOVERED';

-- ABDM consents
ALTER TABLE "abdm_consents" ADD COLUMN     "consentStatus" TEXT NOT NULL DEFAULT 'REQUESTED',
ADD COLUMN     "signature" TEXT;

-- ABDM transactions
ALTER TABLE "abdm_transactions" ADD COLUMN     "apiEndpoint" TEXT,
ADD COLUMN     "correlationId" TEXT;
