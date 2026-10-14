import prisma from "../../../config/database";
import { Prisma } from "@prisma/client";

export type CommissionType =
  | "PERCENTAGE"
  | "FLAT_PER_PATIENT"
  | "CATEGORY_WISE"
  | "NONE";

// =======================================================
// DOCTOR COMMISSION ENGINE
//
// This module is the SINGLE SOURCE OF TRUTH for how much
// commission a doctor earns.
//
// Rules that used to be scattered (and disagreed with each
// other) across getDoctors / getDoctorStatistics /
// getDoctorCommission / processDoctorPayout now live here:
//
//  * Commission is earned ONLY on orders that are
//    paymentStatus = PAID and not CANCELLED.
//  * PERCENTAGE        -> revenue x rate%
//  * FLAT_PER_PATIENT  -> fixed amount x paid order count
//  * CATEGORY_WISE     -> per test-category rate rules
//  * NONE              -> zero
//  * "Pending" is ledger-derived (earned but not paid out),
//    never a re-multiplication of revenue. That was the bug:
//    every screen recomputed it and the numbers drifted apart.
// =======================================================

export type DoctorCommissionProfile = {
  doctorId: string;
  doctorType: string | null;
  commissionType: CommissionType;
  commissionRate: number;
  commissionFlatAmount: number;
  commissionCategoryRules: unknown;
  payoutCycle: "WEEKLY" | "MONTHLY";
  organizationId: string | null;
};

type OrderRow = {
  id: string;
  grandTotal: unknown;
  createdAt: Date;
  items?: Array<{
    finalPrice?: unknown;
    test?: { categoryId?: string | null; category?: { id?: string } | null } | null;
  }>;
};

/** Round to 2 decimals using Prisma.Decimal to avoid float math bugs. */
export const money = (value: number | string | Prisma.Decimal): number =>
  Number(new Prisma.Decimal(value || 0).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toNumber());

/** Orders that are financially settled and therefore commission-bearing. */
export const COMMISSION_ELIGIBLE_ORDER = {
  paymentStatus: "PAID" as const,
  orderStatus: { notIn: ["CANCELLED" as const] },
};

export const periodKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const isCommissionApplicable = (doctorType?: string | null): boolean => {
  // Pathologists sign reports; they are salaried and never earn
  // referral commission.
  if (!doctorType) return true;
  return !(
    doctorType === "INTERNAL_PATHOLOGIST" ||
    doctorType === "IN_HOUSE_PATHOLOGIST" ||
    doctorType === "CONSULTANT_PATHOLOGIST" ||
    doctorType === "CONSULTANT"
  );
};

export const readCommissionProfile = (doctor: {
  id: string;
  doctorType?: string | null;
  commissionType?: CommissionType | null;
  commissionRate?: unknown;
  commissionFlatAmount?: unknown;
  commissionCategoryRules?: unknown;
  payoutCycle?: "WEEKLY" | "MONTHLY" | null;
  organizationId?: string | null;
}): DoctorCommissionProfile => ({
  doctorId: doctor.id,
  doctorType: doctor.doctorType ?? "REFERRING_DOCTOR",
  commissionType: doctor.commissionType ?? "PERCENTAGE",
  commissionRate: Number(doctor.commissionRate ?? 0),
  commissionFlatAmount: Number(doctor.commissionFlatAmount ?? 0),
  commissionCategoryRules: doctor.commissionCategoryRules ?? null,
  payoutCycle: doctor.payoutCycle ?? "MONTHLY",
  organizationId: doctor.organizationId ?? null,
});

type CategoryRule = {
  categoryId?: string;
  categoryName?: string;
  rate?: number;
  flatAmount?: number;
};

/**
 * Category-wise rules arrive as JSON:
 *   [{ "categoryId": "...", "categoryName": "Haematology", "rate": 12 }, ...]
 * The first rule whose category matches wins; anything unmatched
 * falls back to the doctor's headline percentage.
 */
const resolveCategoryRate = (
  rules: unknown,
  categoryIds: Array<string | null | undefined>
): { rate: number; matched: boolean } => {
  if (!Array.isArray(rules) || rules.length === 0) {
    return { rate: 0, matched: false };
  }
  const cleaned = categoryIds.filter(Boolean) as string[];
  if (cleaned.length === 0) return { rate: 0, matched: false };

  const rule = (rules as CategoryRule[]).find(
    (r) => !!r?.categoryId && cleaned.includes(r.categoryId)
  );

  if (!rule) return { rate: 0, matched: false };
  const rate = Number(rule.rate ?? 0);
  return { rate: Number.isFinite(rate) ? rate : 0, matched: true };
};
/**
 * Commission for ONE order, given the doctor's profile.
 * Pure function — same inputs always produce the same paise.
 */
export const computeCommissionForOrder = (
  profile: DoctorCommissionProfile,
  order: OrderRow
): { amount: number; rateUsed: number; typeUsed: CommissionType } => {
  const revenue = money(Number(order.grandTotal ?? 0));

  if (!isCommissionApplicable(profile.doctorType)) {
    return { amount: 0, rateUsed: 0, typeUsed: "NONE" };
  }

  switch (profile.commissionType) {
    case "NONE":
      return { amount: 0, rateUsed: 0, typeUsed: "NONE" };

    case "FLAT_PER_PATIENT":
      return {
        amount: money(profile.commissionFlatAmount),
        rateUsed: 0,
        typeUsed: "FLAT_PER_PATIENT",
      };

    case "CATEGORY_WISE": {
      const categoryIds = (order.items ?? []).map(
        (i) => i.test?.categoryId ?? i.test?.category?.id
      );
      const { rate, matched } = resolveCategoryRate(
        profile.commissionCategoryRules,
        categoryIds
      );
      // Unmatched categories use the headline percentage so no
      // revenue silently loses its incentive.
      const effectiveRate = matched ? rate : profile.commissionRate;
      return {
        amount: money((revenue * effectiveRate) / 100),
        rateUsed: effectiveRate,
        typeUsed: "CATEGORY_WISE",
      };
    }

    case "PERCENTAGE":
    default: {
      const rate = profile.commissionRate;
      return {
        amount: money((revenue * rate) / 100),
        rateUsed: rate,
        typeUsed: "PERCENTAGE",
      };
    }
  }
};

/**
 * Upsert the ledger row for every paid order of a doctor.
 * Idempotent: re-running it never duplicates commission, it only
 * corrects a stale amount (e.g. after a rate change or a refund).
 */
export const syncDoctorCommissionLedger = async (
  doctorId: string,
  client: any = prisma
) => {
  const doctor = await (client as any).doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      doctorType: true,
      commissionType: true,
      commissionRate: true,
      commissionFlatAmount: true,
      commissionCategoryRules: true,
      payoutCycle: true,
      organizationId: true,
    },
  });

  if (!doctor) return [];

  const profile = readCommissionProfile(doctor);

  if (!isCommissionApplicable(doctor.doctorType)) {
    // A pathologist must never accumulate referral commission.
    await (client as any).doctorCommissionEntry.deleteMany({
      where: { doctorId, status: "PENDING" },
    });
    return [];
  }

  const orders = await client.order.findMany({
    where: { doctorId, ...COMMISSION_ELIGIBLE_ORDER },
    select: {
      id: true,
      grandTotal: true,
      createdAt: true,
      items: {
        select: {
          finalPrice: true,
          test: { select: { categoryId: true, category: { select: { id: true } } } },
        },
      },
    },
  });

  const existing = await (client as any).doctorCommissionEntry.findMany({
    where: { doctorId },
    select: { id: true, orderId: true, status: true, commissionAmount: true },
  });
  const existingByOrder = new Map(existing.map((e: any) => [e.orderId, e]));

  return Promise.all(
    orders.map((order: any) => {
      const { amount, rateUsed, typeUsed } = computeCommissionForOrder(profile, order);
      const prior: any = existingByOrder.get(order.id);

      // Never rewrite a settled row: a payout voucher already
      // references it and must stay reproducible.
      if (prior && prior.status !== "PENDING") return Promise.resolve(prior);

      return (client as any).doctorCommissionEntry.upsert({
        where: { orderId: order.id },
        create: {
          doctorId,
          orderId: order.id,
          referralDate: order.createdAt,
          periodKey: periodKeyOf(order.createdAt),
          baseAmount: money(Number(order.grandTotal ?? 0)),
          commissionRate: rateUsed,
          commissionType: typeUsed,
          commissionAmount: amount,
          status: "PENDING",
        },
        update: {
          baseAmount: money(Number(order.grandTotal ?? 0)),
          commissionRate: rateUsed,
          commissionType: typeUsed,
          commissionAmount: amount,
          periodKey: periodKeyOf(order.createdAt),
        },
      });
    })
  );
};

/** Void (never delete) ledger rows for orders that stopped qualifying. */
export const voidStaleCommissionEntries = async (
  doctorId: string,
  client: any = prisma
) => {
  const eligible = await client.order.findMany({
    where: { doctorId, ...COMMISSION_ELIGIBLE_ORDER },
    select: { id: true },
  });
  const eligibleIds = eligible.map((o: any) => o.id);

  await (client as any).doctorCommissionEntry.updateMany({
    where: {
      doctorId,
      status: "PENDING",
      ...(eligibleIds.length ? { orderId: { notIn: eligibleIds } } : {}),
    },
    data: { status: "VOID" },
  });
};
export type DoctorCommissionTotals = {
  earned: number;
  settled: number;
  pending: number;
  paidRevenue: number;
  pendingRevenue: number;
  pendingOrderCount: number;
  paidOrderCount: number;
};

const emptyTotals = (): DoctorCommissionTotals => ({
  earned: 0,
  settled: 0,
  pending: 0,
  paidRevenue: 0,
  pendingRevenue: 0,
  pendingOrderCount: 0,
  paidOrderCount: 0,
});

/**
 * Ledger-derived totals. `pending` is earned-minus-settled, so a
 * payout genuinely reduces what is owed instead of being cosmetic.
 */
export const getDoctorCommissionTotals = async (
  doctorId: string,
  client: any = prisma
): Promise<DoctorCommissionTotals> => {
  try {
    const [grouped, payouts] = await Promise.all([
      (client as any).doctorCommissionEntry.groupBy({
        by: ["status"],
        where: { doctorId },
        _sum: { commissionAmount: true, baseAmount: true },
        _count: { _all: true },
      }),
      (client as any).doctorPayout.aggregate({
        where: { doctorId, status: "SETTLED" },
        _sum: { grossAmount: true },
      })
    ]);

    const totals = emptyTotals();

    let earned = new Prisma.Decimal(0);
    let paidRevenue = new Prisma.Decimal(0);
    let pendingRevenue = new Prisma.Decimal(0);
    let paidOrderCount = 0;
    let pendingOrderCount = 0;

    for (const row of grouped) {
      const amount = new Prisma.Decimal(row._sum.commissionAmount ?? 0);
      const base = new Prisma.Decimal(row._sum.baseAmount ?? 0);
      const count = row._count._all ?? 0;

      earned = earned.plus(amount);
      paidRevenue = paidRevenue.plus(base);
      paidOrderCount += count;

      if (row.status === "PENDING") {
        pendingRevenue = pendingRevenue.plus(base);
        pendingOrderCount += count;
      }
    }

    const settled = new Prisma.Decimal(payouts._sum.grossAmount ?? 0);
    let pending = earned.minus(settled);
    if (pending.isNegative()) pending = new Prisma.Decimal(0);

    totals.earned = money(earned);
    totals.paidRevenue = money(paidRevenue);
    totals.pendingRevenue = money(pendingRevenue);
    totals.paidOrderCount = paidOrderCount;
    totals.pendingOrderCount = pendingOrderCount;
    totals.settled = money(settled);
    totals.pending = money(pending);

    return totals;
  } catch (err) {
    console.warn(`[DoctorCommission] getDoctorCommissionTotals fallback for doctor ${doctorId}:`, err);
    return emptyTotals();
  }
};

/**
 * Aggregate commission totals for a whole set of doctors in ONE
 * grouped query. Replaces the previous N+1 loop that issued two
 * extra queries per doctor row.
 */
export const getBulkCommissionTotals = async (
  doctorIds: string[]
): Promise<Record<string, DoctorCommissionTotals>> => {
  const out: Record<string, DoctorCommissionTotals> = {};
  for (const id of doctorIds) out[id] = emptyTotals();
  if (doctorIds.length === 0) return out;

  try {
    const [grouped, payouts] = await Promise.all([
      (prisma as any).doctorCommissionEntry.groupBy({
        by: ["doctorId", "status"],
        where: { doctorId: { in: doctorIds } },
        _sum: { commissionAmount: true, baseAmount: true },
        _count: { _all: true },
      }),
      (prisma as any).doctorPayout.groupBy({
        by: ["doctorId"],
        where: { doctorId: { in: doctorIds }, status: "SETTLED" },
        _sum: { grossAmount: true },
      }),
    ]);

    const decimalSums: Record<string, { earned: Prisma.Decimal; paidRevenue: Prisma.Decimal; pendingRevenue: Prisma.Decimal; settled: Prisma.Decimal }> = {};
    for (const id of doctorIds) {
      decimalSums[id] = {
        earned: new Prisma.Decimal(0),
        paidRevenue: new Prisma.Decimal(0),
        pendingRevenue: new Prisma.Decimal(0),
        settled: new Prisma.Decimal(0),
      };
    }

    for (const row of grouped) {
      const acc = out[row.doctorId];
      const sums = decimalSums[row.doctorId];
      if (!acc || !sums) continue;
      
      const amount = new Prisma.Decimal(row._sum.commissionAmount ?? 0);
      const base = new Prisma.Decimal(row._sum.baseAmount ?? 0);
      const count = row._count._all ?? 0;

      sums.earned = sums.earned.plus(amount);
      sums.paidRevenue = sums.paidRevenue.plus(base);
      acc.paidOrderCount += count;

      if (row.status === "PENDING") {
        sums.pendingRevenue = sums.pendingRevenue.plus(base);
        acc.pendingOrderCount += count;
      }
    }

    for (const row of payouts) {
      const sums = decimalSums[row.doctorId];
      if (!sums) continue;
      sums.settled = new Prisma.Decimal(row._sum.grossAmount ?? 0);
    }

    for (const id of doctorIds) {
      const acc = out[id];
      const sums = decimalSums[id];
      
      let pending = sums.earned.minus(sums.settled);
      if (pending.isNegative()) pending = new Prisma.Decimal(0);
      
      acc.earned = money(sums.earned);
      acc.paidRevenue = money(sums.paidRevenue);
      acc.pendingRevenue = money(sums.pendingRevenue);
      acc.settled = money(sums.settled);
      acc.pending = money(pending);
    }
  } catch (err) {
    console.warn("[DoctorCommission] getBulkCommissionTotals fallback:", err);
  }

  return out;
};

/**
 * Paid revenue straight from the orders table.
 * Used for the "Referrals & Revenue" KPI and for revenue filters.
 * One grouped query for the whole page of doctors.
 */
export const getBulkPaidRevenue = async (
  doctorIds: string[]
): Promise<Record<string, { revenue: number; orderCount: number }>> => {
  if (doctorIds.length === 0) return {};

  const grouped = await prisma.order.groupBy({
    by: ["doctorId"],
    where: { doctorId: { in: doctorIds }, ...COMMISSION_ELIGIBLE_ORDER },
    _sum: { grandTotal: true },
    _count: { _all: true },
  });

  const out: Record<string, { revenue: number; orderCount: number }> = {};
  for (const id of doctorIds) out[id] = { revenue: 0, orderCount: 0 };
  for (const row of grouped) {
    if (!row.doctorId) continue;
    out[row.doctorId] = {
      revenue: money(Number(row._sum.grandTotal ?? 0)),
      orderCount: row._count._all ?? 0,
    };
  }
  return out;
};

/** Distinct referred-patient count for a set of doctors (dedup by UHID). */
export const getBulkReferredPatients = async (
  doctorIds: string[]
): Promise<Record<string, number>> => {
  if (doctorIds.length === 0) return {};

  const rows = await prisma.order.findMany({
    where: { doctorId: { in: doctorIds } },
    select: { doctorId: true, patientId: true },
    distinct: ["doctorId", "patientId"],
  });

  const out: Record<string, number> = {};
  for (const id of doctorIds) out[id] = 0;
  for (const row of rows) {
    if (!row.doctorId) continue;
    out[row.doctorId] = (out[row.doctorId] ?? 0) + 1;
  }
  return out;
};

/** Number of orders created this calendar month, per doctor. */
export const getBulkMonthlyOrders = async (
  doctorIds: string[]
): Promise<Record<string, number>> => {
  if (doctorIds.length === 0) return {};

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const grouped = await prisma.order.groupBy({
    by: ["doctorId"],
    where: {
      doctorId: { in: doctorIds },
      createdAt: { gte: startOfMonth },
      orderStatus: { notIn: ["CANCELLED"] },
    },
    _count: { _all: true },
  });

  const out: Record<string, number> = {};
  for (const id of doctorIds) out[id] = 0;
  for (const row of grouped) {
    if (!row.doctorId) continue;
    out[row.doctorId] = row._count._all ?? 0;
  }
  return out;
};