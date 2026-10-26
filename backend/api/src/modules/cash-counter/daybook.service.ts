import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";

export interface CurrencyDenominations {
  notes_2000?: number;
  notes_500?: number;
  notes_200?: number;
  notes_100?: number;
  notes_50?: number;
  notes_20?: number;
  notes_10?: number;
  coins_5?: number;
  coins_2?: number;
  coins_1?: number;
}

export interface ShiftHandoverInput {
  sessionId: string;
  denominations: CurrencyDenominations;
  varianceReason?: string;
  supervisorNotes?: string;
  handoverToUserId?: string;
}

export interface DiscrepancyAlert {
  hasDiscrepancy: boolean;
  type: "BALANCED" | "SHORTAGE" | "SURPLUS";
  discrepancyAmount: number;
  alertLevel: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  requiresSupervisorApproval: boolean;
}

export class DaybookService {
  /**
   * Calculate total amount from physical currency denomination counts
   */
  static calculatePhysicalTotal(d: CurrencyDenominations): {
    total: number;
    breakdown: Array<{ denomination: number; count: number; subtotal: number; type: "NOTE" | "COIN" }>;
  } {
    const DENOM_CONFIG = [
      { key: "notes_2000", value: 2000, type: "NOTE" as const },
      { key: "notes_500", value: 500, type: "NOTE" as const },
      { key: "notes_200", value: 200, type: "NOTE" as const },
      { key: "notes_100", value: 100, type: "NOTE" as const },
      { key: "notes_50", value: 50, type: "NOTE" as const },
      { key: "notes_20", value: 20, type: "NOTE" as const },
      { key: "notes_10", value: 10, type: "NOTE" as const },
      { key: "coins_5", value: 5, type: "COIN" as const },
      { key: "coins_2", value: 2, type: "COIN" as const },
      { key: "coins_1", value: 1, type: "COIN" as const },
    ];

    let total = 0;
    const breakdown = DENOM_CONFIG.map(({ key, value, type }) => {
      const count = Math.max(0, Math.floor(Number((d as any)[key] || 0)));
      const subtotal = count * value;
      total += subtotal;
      return {
        denomination: value,
        count,
        subtotal,
        type,
      };
    });

    return {
      total: Math.round(total * 100) / 100,
      breakdown,
    };
  }

  /**
   * Evaluate variance between physical cash and expected cash
   */
  static evaluateDiscrepancy(physicalCash: number, expectedCash: number): DiscrepancyAlert {
    const diff = Math.round((physicalCash - expectedCash) * 100) / 100;

    if (Math.abs(diff) < 0.01) {
      return {
        hasDiscrepancy: false,
        type: "BALANCED",
        discrepancyAmount: 0,
        alertLevel: "INFO",
        message: "Shift cash reconciled perfectly. Zero variance.",
        requiresSupervisorApproval: false,
      };
    }

    if (diff < 0) {
      const shortage = Math.abs(diff);
      const isCritical = shortage >= 500;
      return {
        hasDiscrepancy: true,
        type: "SHORTAGE",
        discrepancyAmount: shortage,
        alertLevel: isCritical ? "CRITICAL" : "WARNING",
        message: `Cash Shortage Alert: Physical cash is ₹${shortage.toFixed(2)} less than expected digital ledger balance.`,
        requiresSupervisorApproval: true,
      };
    }

    return {
      hasDiscrepancy: true,
      type: "SURPLUS",
      discrepancyAmount: diff,
      alertLevel: diff >= 500 ? "WARNING" : "INFO",
      message: `Cash Surplus Alert: Physical cash is ₹${diff.toFixed(2)} more than expected digital ledger balance.`,
      requiresSupervisorApproval: true,
    };
  }

  /**
   * Generate comprehensive End-of-Shift Daybook
   */
  static async generateShiftDaybook(sessionId: string) {
    const session = await prisma.cashCounterSession.findUnique({
      where: { id: sessionId },
      include: {
        counter: true,
        user: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!session) {
      throw new HttpError(404, `Shift session "${sessionId}" not found.`);
    }

    const startTime = session.openedAt;
    const endTime = session.closedAt || new Date();

    // Fetch all payments recorded during this shift for this counter
    const payments = await prisma.payment.findMany({
      where: {
        counterId: session.counterId,
        paidAt: {
          gte: startTime,
          lte: endTime,
        },
      },
    });

    // Breakdown collections by payment method
    let cashCollections = 0;
    let upiCollections = 0;
    let cardCollections = 0;
    let netBankingCollections = 0;
    let otherCollections = 0;

    for (const p of payments) {
      const amount = Number(p.amount) || 0;
      const method = (p.method || "").toString().toUpperCase();

      if (method === "CASH") cashCollections += amount;
      else if (method === "UPI" || method.includes("QR") || method.includes("GPAY")) upiCollections += amount;
      else if (method === "CARD" || method.includes("CREDIT") || method.includes("DEBIT")) cardCollections += amount;
      else if (method.includes("NET") || method.includes("BANK")) netBankingCollections += amount;
      else otherCollections += amount;
    }

    const totalDigitalCollections = cashCollections + upiCollections + cardCollections + netBankingCollections + otherCollections;
    const openingBalance = Number(session.openingBalance) || 0;
    const expectedClosingCash = Math.round((openingBalance + cashCollections) * 100) / 100;

    const actualCash = session.actualCash !== null ? Number(session.actualCash) : null;
    const variance = session.variance !== null ? Number(session.variance) : null;

    let discrepancy: DiscrepancyAlert | null = null;
    if (actualCash !== null) {
      discrepancy = this.evaluateDiscrepancy(actualCash, expectedClosingCash);
    }

    return {
      session: {
        id: session.id,
        counterNumber: session.counter.counterNumber,
        counterName: session.counter.counterName,
        cashier: session.user.fullName,
        employeeCode: session.user.employeeCode,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        isClosed: !!session.closedAt,
        openingBalance,
      },
      collections: {
        totalCollections: Math.round(totalDigitalCollections * 100) / 100,
        paymentCount: payments.length,
        breakdown: {
          cash: Math.round(cashCollections * 100) / 100,
          upi: Math.round(upiCollections * 100) / 100,
          card: Math.round(cardCollections * 100) / 100,
          netBanking: Math.round(netBankingCollections * 100) / 100,
          other: Math.round(otherCollections * 100) / 100,
        },
      },
      reconciliation: {
        openingCash: openingBalance,
        cashCollected: Math.round(cashCollections * 100) / 100,
        expectedClosingCash,
        actualCash,
        variance,
        varianceReason: session.varianceReason,
        discrepancy,
      },
    };
  }

  /**
   * Execute End-of-Shift Handover with physical denomination counting and discrepancy checks
   */
  static async executeShiftHandover(input: ShiftHandoverInput) {
    const { total: physicalTotal, breakdown } = this.calculatePhysicalTotal(input.denominations);

    const session = await prisma.cashCounterSession.findUnique({
      where: { id: input.sessionId },
      include: { counter: true },
    });

    if (!session) {
      throw new HttpError(404, `Cash session "${input.sessionId}" not found.`);
    }

    if (session.closedAt) {
      throw new HttpError(400, "Shift session is already closed and handed over.");
    }

    // Calculate current expected cash
    const payments = await prisma.payment.findMany({
      where: {
        counterId: session.counterId,
        paidAt: { gte: session.openedAt },
        method: "CASH",
      },
    });

    const cashCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const expectedCash = Math.round((Number(session.openingBalance) + cashCollected) * 100) / 100;
    const variance = Math.round((physicalTotal - expectedCash) * 100) / 100;

    const discrepancy = this.evaluateDiscrepancy(physicalTotal, expectedCash);

    if (discrepancy.hasDiscrepancy && !input.varianceReason?.trim()) {
      throw new HttpError(
        400,
        `Reconciliation Discrepancy: Difference of ₹${Math.abs(variance).toFixed(2)} detected. A mandatory varianceReason is required to handover this shift.`,
        "VARIANCE_REASON_REQUIRED"
      );
    }

    const denominationRecord = {
      counts: input.denominations,
      breakdown,
      calculatedTotal: physicalTotal,
      handoverTimestamp: new Date().toISOString(),
      handoverToUserId: input.handoverToUserId || null,
      supervisorNotes: input.supervisorNotes || null,
    };

    return await prisma.$transaction(async (tx) => {
      // 1. Update session
      const updatedSession = await tx.cashCounterSession.update({
        where: { id: session.id },
        data: {
          closingBalance: physicalTotal,
          expectedCash,
          actualCash: physicalTotal,
          variance,
          varianceReason: input.varianceReason?.trim() || null,
          closedAt: new Date(),
          notes: input.supervisorNotes?.trim() || null,
        },
      });

      // 2. Update counter status
      const updatedCounter = await tx.cashCounter.update({
        where: { id: session.counterId },
        data: {
          status: "CLOSED",
          currentBalance: physicalTotal,
          expectedCash,
          actualCash: physicalTotal,
          variance,
          varianceReason: input.varianceReason?.trim() || null,
          closedAt: new Date(),
          denominationData: denominationRecord as any,
        },
      });

      return {
        session: updatedSession,
        counter: updatedCounter,
        reconciliation: {
          physicalTotal,
          expectedCash,
          variance,
          discrepancy,
          denominationBreakdown: breakdown,
        },
      };
    });
  }
}
