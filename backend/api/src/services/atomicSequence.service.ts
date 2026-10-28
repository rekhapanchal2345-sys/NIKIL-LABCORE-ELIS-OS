import prisma from "../../config/database";

let dailySequenceTableEnsured = false;

export async function ensureDailySequenceTable(client: any = prisma): Promise<void> {
  if (dailySequenceTableEnsured) return;
  try {
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS daily_sequences (
        seq_date VARCHAR(20) NOT NULL,
        series_name VARCHAR(50) NOT NULL DEFAULT 'SMP',
        current_val INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (seq_date, series_name)
      );
    `);
    dailySequenceTableEnsured = true;
  } catch (err: any) {
    console.warn("[AtomicSequence] Table ensure note:", err?.message);
  }
}

/**
 * ============================================================================
 * ATOMIC DAILY SEQUENCE GENERATOR (POSTGRESQL UPSERT)
 * ============================================================================
 * Solves Bug 5.1: Sample ID / Barcode Collision Under High Concurrency.
 * Eliminates application-level `findFirst + 1` and `count() + 1` race conditions.
 * Uses atomic row-level lock on (seq_date, series_name) in PostgreSQL.
 */
export async function getNextDailySequence(
  seriesName: string = "SMP",
  targetDate: Date = new Date(),
  txClient?: any
): Promise<{ seqDate: string; seqNumber: number; formattedCode: string }> {
  const client = txClient || prisma;
  await ensureDailySequenceTable(client);

  const istFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const seqDate = istFormatter.format(targetDate).replace(/-/g, ""); // e.g. "20261028"

  let currentVal = 1;
  try {
    const rows: any = await client.$queryRawUnsafe(`
      INSERT INTO daily_sequences (seq_date, series_name, current_val, updated_at)
      VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (seq_date, series_name)
      DO UPDATE SET current_val = daily_sequences.current_val + 1, updated_at = CURRENT_TIMESTAMP
      RETURNING current_val;
    `, seqDate, seriesName);
    currentVal = Array.isArray(rows) && rows[0]?.current_val ? Number(rows[0].current_val) : 1;
  } catch (err: any) {
    if (client.dailySequence) {
      const rec = await client.dailySequence.upsert({
        where: {
          seqDate_seriesName: {
            seqDate,
            seriesName,
          },
        },
        create: {
          seqDate,
          seriesName,
          currentVal: 1,
        },
        update: {
          currentVal: { increment: 1 },
        },
      });
      currentVal = rec.currentVal;
    }
  }

  const padded = String(currentVal).padStart(5, "0");
  const formattedCode = `${seriesName}-${seqDate}-${padded}`;

  return {
    seqDate,
    seqNumber: currentVal,
    formattedCode,
  };
}
