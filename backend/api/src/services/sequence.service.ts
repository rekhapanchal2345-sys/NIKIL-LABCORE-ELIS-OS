import prisma from "../../config/database";
import { getIndianFinancialYear } from "../utils/money";

type SequenceType = "REC" | "INV" | "TXN" | "CN" | "DN" | "B2B" | "ORD" | "SET" | "ADV";

let sequenceTableEnsured = false;

async function ensureSequenceTable(txPrisma: any) {
  if (sequenceTableEnsured) return;
  try {
    await txPrisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS accounting_sequences (
        id VARCHAR(255) PRIMARY KEY,
        series_type VARCHAR(50) NOT NULL,
        financial_year VARCHAR(20) NOT NULL,
        branch_id VARCHAR(100) NOT NULL DEFAULT 'DEFAULT',
        prefix VARCHAR(50),
        current_value INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_series_fy_branch UNIQUE (series_type, financial_year, branch_id)
      );
    `);
    sequenceTableEnsured = true;
  } catch (err) {
    console.warn("Notice: accounting_sequences table check:", err);
  }
}

/**
 * Atomically generates a gap-free, sequential number scoped to Financial Year & Branch inside a DB transaction.
 * Compliant with GST Rule 46 (max 16 characters).
 * Examples:
 *   - INV/26-27/000123 (16 chars)
 *   - B2B/26-27/000012 (16 chars)
 *   - CN/26-27/000045  (15 chars)
 *   - REC/26-27/000123 (16 chars)
 *   - ADV/26-27/000034 (16 chars)
 */
export async function getNextSequenceNumber(
  seriesType: SequenceType,
  branchId: string = "MAIN",
  txClient?: any,
  date: Date = new Date()
): Promise<string> {
  const fy = getIndianFinancialYear(date); // e.g. "2026-27"
  const fyShort = fy.length === 7 ? `${fy.slice(2, 4)}-${fy.slice(5, 7)}` : fy; // e.g. "26-27"
  const client = txClient || prisma;

  await ensureSequenceTable(client);

  const seriesKey = `${seriesType}-${fy}-${branchId}`;

  // Atomic upsert & increment inside SQL transaction
  const rows: any = await client.$queryRawUnsafe(`
    INSERT INTO accounting_sequences (id, series_type, financial_year, branch_id, current_value, updated_at)
    VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (series_type, financial_year, branch_id)
    DO UPDATE SET 
      current_value = accounting_sequences.current_value + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING current_value;
  `, seriesKey, seriesType, fy, branchId);

  const nextVal = Array.isArray(rows) && rows[0]?.current_value ? Number(rows[0].current_value) : 1;
  const padded = String(nextVal).padStart(6, "0");

  return `${seriesType}/${fyShort}/${padded}`;
}
