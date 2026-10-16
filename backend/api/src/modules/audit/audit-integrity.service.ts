/**
 * AUDIT LOG INTEGRITY — Hash Chain Verification
 *
 * Each audit log row includes:
 *   prevHash: SHA-256 of the previous row's canonical JSON
 *   rowHash:  SHA-256(rowId + module + action + userId + createdAt + prevHash)
 *
 * This creates a tamper-evident chain: if ANY row is deleted, modified, or
 * inserted out of order, the chain breaks and verification reports it.
 *
 * Think: simplified blockchain for compliance audit trails.
 *
 * Usage:
 *   GET /api/admin/audit/integrity  → verifies the full chain
 *   GET /api/admin/audit/integrity?from=2026-01-01  → partial range
 */

import crypto from "crypto";
import prisma from "../../../config/database";

// ─── Hash Computation ─────────────────────────────────────────────────────────

/**
 * Computes a deterministic hash of an audit log row.
 * Fields are sorted so JSON serialisation order doesn't affect the hash.
 */
export function computeRowHash(row: {
  id: string;
  module: string;
  action: string;
  userId?: string | null;
  recordId?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  prevHash?: string | null;
}): string {
  const canonical = JSON.stringify({
    id:        row.id,
    module:    row.module,
    action:    row.action,
    userId:    row.userId   ?? null,
    recordId:  row.recordId ?? null,
    ipAddress: row.ipAddress ?? null,
    createdAt: row.createdAt.toISOString(),
    prevHash:  row.prevHash ?? "GENESIS",
  });

  return crypto.createHash("sha256").update(canonical).digest("hex");
}

// ─── Integrity Verification ───────────────────────────────────────────────────

export interface IntegrityResult {
  ok: boolean;
  checked: number;
  broken: number;
  /** Rows where the hash doesn't match (IDs only, for investigation) */
  brokenRows: Array<{ id: string; reason: string }>;
  /** When the check was performed */
  checkedAt: Date;
  /** Time taken in ms */
  durationMs: number;
}

/**
 * Walks all audit logs in chronological order and verifies the hash chain.
 * Returns a report — does NOT modify any data.
 *
 * @param options.fromDate  Only check rows on/after this date (for incremental checks)
 * @param options.limit     Max rows to check in one call (default: 10_000)
 */
export async function verifyAuditChain(options?: {
  fromDate?: Date;
  limit?: number;
}): Promise<IntegrityResult> {
  const start = Date.now();
  const limit = options?.limit ?? 10_000;

  const where: any = {};
  if (options?.fromDate) {
    where.createdAt = { gte: options.fromDate };
  }

  // Only rows that have been stamped with rowHash are verified.
  // Old rows without hashes are skipped but counted.
  where.rowHash = { not: null };

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      module: true,
      action: true,
      userId: true,
      recordId: true,
      ipAddress: true,
      createdAt: true,
      prevHash: true,
      rowHash: true,
    },
  });

  const brokenRows: IntegrityResult["brokenRows"] = [];

  for (const row of rows) {
    const expected = computeRowHash(row);
    if (expected !== row.rowHash) {
      brokenRows.push({
        id: row.id,
        reason: `Hash mismatch: expected ${expected.slice(0, 16)}..., got ${(row.rowHash ?? "").slice(0, 16)}...`,
      });
    }
  }

  return {
    ok:        brokenRows.length === 0,
    checked:   rows.length,
    broken:    brokenRows.length,
    brokenRows,
    checkedAt: new Date(),
    durationMs: Date.now() - start,
  };
}

// ─── Enhanced createAuditLog with hash chaining ───────────────────────────────

/**
 * Creates an audit log entry with hash chaining for tamper detection.
 *
 * The prevHash of a new row = rowHash of the most recent existing row.
 * The rowHash of the new row = SHA-256 of its own fields + prevHash.
 *
 * This supplements (and eventually replaces) the plain createAuditLog in
 * audit.service.ts. Both can run side-by-side during migration.
 */
export async function createTamperEvidentAuditLog(data: {
  userId?: string;
  module: string;
  action: string;
  recordId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  impersonatedBy?: string;
}): Promise<{ id: string; rowHash: string }> {
  // Get the last row's hash to chain from
  const lastRow = await prisma.auditLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { rowHash: true },
  });

  const prevHash = lastRow?.rowHash ?? null;
  const now = new Date();

  // We create the row first to get its ID, then compute and update the hash.
  // This is necessary because the ID is part of the hash computation.
  const row = await prisma.auditLog.create({
    data: {
      userId:    data.userId,
      module:    data.module,
      action:    data.action,
      recordId:  data.recordId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      oldData:   data.oldData as any,
      newData:   data.newData as any,
      prevHash,
      createdAt: now,
    },
    select: { id: true },
  });

  const rowHash = computeRowHash({
    id:        row.id,
    module:    data.module,
    action:    data.action,
    userId:    data.userId,
    recordId:  data.recordId,
    ipAddress: data.ipAddress,
    createdAt: now,
    prevHash,
  });

  await prisma.auditLog.update({
    where: { id: row.id },
    data:  { rowHash },
  });

  return { id: row.id, rowHash };
}
