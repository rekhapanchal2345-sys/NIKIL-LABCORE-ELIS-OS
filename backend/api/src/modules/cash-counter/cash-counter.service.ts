import prisma from "../../../config/database";
import type { CashMovementType } from "@prisma/client";

// =======================================================
// CREATE CASH COUNTER
// =======================================================

export const createCashCounter = async (
  data: {
    counterNumber: string;
    counterName: string;
    branchId?: string;
    location?: string;
    assignedUserId?: string;
  }
) => {
  try {
    const counter = await prisma.cashCounter.create({
      data: {
        counterNumber: data.counterNumber,
        counterName: data.counterName,
        branchId: data.branchId,
        location: data.location,
        assignedUserId: data.assignedUserId,
        status: "CLOSED",
        openingBalance: 0,
        currentBalance: 0,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return counter;
  } catch (error) {
    console.error('Error in createCashCounter:', error);
    throw error;
  }
};

// =======================================================
// OPEN CASH COUNTER
// =======================================================

export const openCashCounter = async (
  data: {
    counterId: string;
    openingBalance: number;
    denominationData?: any;
    userId: string;
  }
) => {
  try {
    const openingBalance = Number(data.openingBalance);
    if (openingBalance < 0) {
      throw new Error("Opening balance cannot be negative");
    }

    const result = await prisma.$transaction(async (tx) => {
      const counter = await tx.cashCounter.findUnique({
        where: { id: data.counterId },
      });

      if (!counter) {
        throw new Error("Counter not found");
      }

      if (counter.status === "OPEN") {
        throw new Error("Counter is already open");
      }

      // Enforce: A user can only operate ONE open CashCounterSession at a time.
      const existingUserSession = await tx.cashCounterSession.findFirst({
        where: {
          userId: data.userId,
          closedAt: null,
        },
      });

      if (existingUserSession) {
        throw new Error("User already has an open cash counter session");
      }

      // Update counter
      const updatedCounter = await tx.cashCounter.update({
        where: { id: data.counterId },
        data: {
          status: "OPEN",
          openingBalance,
          currentBalance: openingBalance,
          assignedUserId: data.userId,
          openedAt: new Date(),
          denominationData: data.denominationData,
        },
      });

      // Create session
      const session = await tx.cashCounterSession.create({
        data: {
          counterId: data.counterId,
          userId: data.userId,
          openingBalance,
          openedAt: new Date(),
        },
      });

      return { counter: updatedCounter, session };
    });

    return result;
  } catch (error) {
    console.error('Error in openCashCounter:', error);
    throw error;
  }
};

// =======================================================
// CLOSE CASH COUNTER
// =======================================================

export const closeCashCounter = async (
  data: {
    counterId: string;
    actualCash: number;
    denominationData?: any;
    varianceReason?: string;
    userId: string;
  }
) => {
  try {
    const actualCash = Number(data.actualCash);
    if (actualCash < 0) {
      throw new Error("Actual cash cannot be negative");
    }

    const result = await prisma.$transaction(async (tx) => {
      const counter = await tx.cashCounter.findUnique({
        where: { id: data.counterId },
        include: {
          sessions: {
            where: { closedAt: null },
            orderBy: { openedAt: "desc" },
            take: 1,
          },
        },
      });

      if (!counter) {
        throw new Error("Counter not found");
      }

      if (counter.status !== "OPEN") {
        throw new Error("Counter is not open");
      }

      const currentSession = counter.sessions[0];
      if (!currentSession) {
        throw new Error("No active session found");
      }

      const expectedCash = Number(counter.currentBalance);
      const variance = actualCash - expectedCash;

      // Update counter
      const updatedCounter = await tx.cashCounter.update({
        where: { id: data.counterId },
        data: {
          status: "CLOSED",
          currentBalance: actualCash,
          expectedCash,
          actualCash,
          variance,
          varianceReason: data.varianceReason,
          closedAt: new Date(),
          denominationData: data.denominationData,
        },
      });

      // Update session
      const updatedSession = await tx.cashCounterSession.update({
        where: { id: currentSession.id },
        data: {
          closingBalance: actualCash,
          expectedCash,
          actualCash,
          variance,
          varianceReason: data.varianceReason,
          closedAt: new Date(),
        },
      });

      return { counter: updatedCounter, session: updatedSession };
    });

    return result;
  } catch (error) {
    console.error('Error in closeCashCounter:', error);
    throw error;
  }
};

// =======================================================
// GET CASH COUNTERS
// =======================================================

export const getCashCounters = async (options: any = {}) => {
  try {
    const {
      status,
      branchId,
      assignedUserId,
      page = 1,
      limit = 20,
    } = options;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    const [counters, total] = await Promise.all([
      prisma.cashCounter.findMany({
        where,
        skip,
        take: limit,
        include: {
          assignedUser: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              role: true,
            },
          },
          drawers: {
            where: { status: "ACTIVE" },
          },
          sessions: {
            orderBy: { openedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cashCounter.count({ where }),
    ]);

    return {
      counters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  } catch (error) {
    console.error('Error in getCashCounters:', error);
    throw error;
  }
};

// =======================================================
// GET CASH COUNTER BY ID
// =======================================================

export const getCashCounterById = async (id: string) => {
  try {
    const counter = await prisma.cashCounter.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            role: true,
          },
        },
        drawers: true,
        sessions: {
          orderBy: { openedAt: "desc" },
          take: 10,
        },
        payments: {
          where: { method: "CASH" },
          orderBy: { paidAt: "desc" },
          take: 20,
        },
      },
    });

    if (!counter) {
      throw new Error("Counter not found");
    }

    return counter;
  } catch (error) {
    console.error('Error in getCashCounterById:', error);
    throw error;
  }
};

// =======================================================
// ADD CASH MOVEMENT
// =======================================================

export const addCashMovement = async (
  data: {
    drawerId: string;
    movementType: CashMovementType;
    amount: number;
    reason: string;
    referenceId?: string;
    referenceType?: string;
    performedById: string;
  }
) => {
  try {
    const amount = Number(data.amount);
    if (amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    if (!data.reason || data.reason.trim().length === 0) {
      throw new Error("A valid clinical/operational reason must be provided for cash movements");
    }

    const result = await prisma.$transaction(async (tx) => {
      const drawer = await tx.cashDrawer.findUnique({
        where: { id: data.drawerId },
        include: { counter: true },
      });

      if (!drawer) {
        throw new Error("Drawer not found");
      }

      // Create movement
      const movement = await tx.cashMovement.create({
        data: {
          drawerId: data.drawerId,
          movementType: data.movementType,
          amount,
          reason: data.reason,
          referenceId: data.referenceId,
          referenceType: data.referenceType,
          performedById: data.performedById,
        },
      });

      // Update drawer balance based on movement type
      let balanceChange = 0;
      switch (data.movementType) {
        case "DEPOSIT":
        case "TRANSFER_IN":
          balanceChange = amount;
          break;
        case "WITHDRAWAL":
        case "TRANSFER_OUT":
        case "REFUND":
          balanceChange = -amount;
          break;
        case "ADJUSTMENT":
          // Adjustments can be positive or negative
          balanceChange = amount;
          break;
      }

      const updatedDrawer = await tx.cashDrawer.update({
        where: { id: data.drawerId },
        data: {
          currentBalance: { increment: balanceChange },
        },
      });

      // Update counter balance if drawer is active
      if (drawer.counter && drawer.counter.status === "OPEN") {
        await tx.cashCounter.update({
          where: { id: drawer.counterId },
          data: {
            currentBalance: { increment: balanceChange },
          },
        });
      }

      return { movement, drawer: updatedDrawer };
    });

    return result;
  } catch (error) {
    console.error('Error in addCashMovement:', error);
    throw error;
  }
};