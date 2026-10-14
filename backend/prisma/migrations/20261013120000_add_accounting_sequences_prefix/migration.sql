-- Add prefix column to accounting_sequences table
ALTER TABLE "accounting_sequences" ADD COLUMN IF NOT EXISTS "prefix" VARCHAR(50);
