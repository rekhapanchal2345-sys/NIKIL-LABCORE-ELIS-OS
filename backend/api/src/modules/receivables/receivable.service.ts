import prisma from "../../../config/database";

// =======================================================
// CREATE RECEIVABLE FROM INVOICE
// =======================================================

export const createReceivable = async (
  data: {
    invoiceId: string;
    patientId?: string;
    corporateAccountId?: string;
    totalAmount: number;
    dueDate: Date;
  }
) => {
  try {
    const totalAmount = Number(data.totalAmount);
    if (totalAmount <= 0) {
      throw new Error("Total amount must be greater than zero");
    }

    const receivable = await prisma.receivable.create({
      data: {
        invoiceId: data.invoiceId,
        patientId: data.patientId,
        corporateAccountId: data.corporateAccountId,
        totalAmount,
        paidAmount: 0,
        outstandingAmount: totalAmount,
        dueDate: data.dueDate,
        overdueDays: 0,
        status: "PENDING",
      },
    });

    return receivable;
  } catch (error) {
    console.error('Error in createReceivable:', error);
    throw error;
  }
};

// =======================================================
// UPDATE RECEIVABLE PAYMENT
// =======================================================

const roundMoney = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

export const updateReceivablePayment = async (
  data: {
    receivableId: string;
    paymentAmount: number;
  }
) => {
  return prisma.$transaction(async (tx) => {
    const paymentAmount = roundMoney(Number(data.paymentAmount));
    if (paymentAmount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    const receivable = await tx.receivable.findUnique({
      where: { id: data.receivableId },
    });

    if (!receivable) {
      throw new Error("Receivable not found");
    }

    const currentOutstanding = roundMoney(Number(receivable.outstandingAmount));
    if (paymentAmount > currentOutstanding) {
      throw new Error(
        `Payment amount (${paymentAmount}) cannot exceed outstanding amount (${currentOutstanding})`
      );
    }

    const updatedPaidAmount = roundMoney(Number(receivable.paidAmount) + paymentAmount);
    const outstandingAmount = roundMoney(Number(receivable.totalAmount) - updatedPaidAmount);

    let status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
    if (outstandingAmount <= 0) {
      status = "PAID";
    } else if (updatedPaidAmount > 0) {
      status = "PARTIALLY_PAID";
    } else {
      // Check if overdue
      const now = new Date();
      const dueDate = new Date(receivable.dueDate);
      if (now > dueDate) {
        status = "OVERDUE";
      } else {
        status = "PENDING";
      }
    }

    const updatedReceivable = await tx.receivable.update({
      where: { id: data.receivableId },
      data: {
        paidAmount: updatedPaidAmount,
        outstandingAmount,
        status,
      },
    });

    return updatedReceivable;
  });
};

// =======================================================
// GET RECEIVABLES
// =======================================================

export const getReceivables = async (options: any = {}) => {
  try {
    const {
      patientId,
      corporateAccountId,
      status,
      agingDays,
      page = 1,
      limit = 20,
    } = options;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (corporateAccountId) {
      where.corporateAccountId = corporateAccountId;
    }

    if (status) {
      where.status = status;
    }

    if (agingDays) {
      where.overdueDays = { gte: Number(agingDays) };
    }

    const [receivables, total] = await Promise.all([
      prisma.receivable.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: "asc" },
      }),
      prisma.receivable.count({ where }),
    ]);

    return {
      receivables,
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
    console.error('Error in getReceivables:', error);
    throw error;
  }
};

// =======================================================
// GET RECEIVABLE BY ID
// =======================================================

export const getReceivableById = async (id: string) => {
  try {
    const receivable = await prisma.receivable.findUnique({
      where: { id },
    });

    if (!receivable) {
      throw new Error("Receivable not found");
    }

    return receivable;
  } catch (error) {
    console.error('Error in getReceivableById:', error);
    throw error;
  }
};

// =======================================================
// UPDATE OVERDUE STATUS
// =======================================================

export const updateOverdueStatus = async () => {
  try {
    const now = new Date();
    
    const overdueReceivables = await prisma.receivable.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ["PENDING", "PARTIALLY_PAID"] },
      },
    });

    // ⚡ Bolt: Execute updates concurrently using an interactive transaction to avoid N+1 queries sequentially
    await prisma.$transaction(async (tx) => {
      await Promise.all(
        overdueReceivables.map((receivable) => {
          const dueDate = new Date(receivable.dueDate);
          const overdueDays = Math.floor(
            (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          return tx.receivable.update({
            where: { id: receivable.id },
            data: {
              overdueDays,
              status: "OVERDUE",
            },
          });
        })
      );
    });

    return { updated: overdueReceivables.length };
  } catch (error) {
    console.error('Error in updateOverdueStatus:', error);
    throw error;
  }
};

// =======================================================
// GET RECEIVABLES SUMMARY
// =======================================================

export const getReceivablesSummary = async () => {
  try {
    const [
      totalReceivables,
      totalOutstanding,
      aging0to7,
      aging8to30,
      aging31to60,
      aging61to90,
      aging90plus,
    ] = await Promise.all([
      prisma.receivable.count(),
      prisma.receivable.aggregate({
        where: { status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] } },
        _sum: { outstandingAmount: true },
      }),
      prisma.receivable.aggregate({
        where: { overdueDays: { gte: 0, lte: 7 } },
        _sum: { outstandingAmount: true },
      }),
      prisma.receivable.aggregate({
        where: { overdueDays: { gte: 8, lte: 30 } },
        _sum: { outstandingAmount: true },
      }),
      prisma.receivable.aggregate({
        where: { overdueDays: { gte: 31, lte: 60 } },
        _sum: { outstandingAmount: true },
      }),
      prisma.receivable.aggregate({
        where: { overdueDays: { gte: 61, lte: 90 } },
        _sum: { outstandingAmount: true },
      }),
      prisma.receivable.aggregate({
        where: { overdueDays: { gt: 90 } },
        _sum: { outstandingAmount: true },
      }),
    ]);

    return {
      totalReceivables,
      totalOutstanding: Number(totalOutstanding._sum.outstandingAmount || 0),
      aging: {
        "0-7": Number(aging0to7._sum.outstandingAmount || 0),
        "8-30": Number(aging8to30._sum.outstandingAmount || 0),
        "31-60": Number(aging31to60._sum.outstandingAmount || 0),
        "61-90": Number(aging61to90._sum.outstandingAmount || 0),
        "90+": Number(aging90plus._sum.outstandingAmount || 0),
      },
    };
  } catch (error) {
    console.error('Error in getReceivablesSummary:', error);
    throw error;
  }
};

// =======================================================
// CREATE CORPORATE ACCOUNT
// =======================================================

export const createCorporateAccount = async (
  data: {
    accountNumber: string;
    accountName: string;
    organizationName: string;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    billingAddress?: string;
    creditLimit?: number;
    paymentTerms?: string;
    gstin?: string;
    panNumber?: string;
    notes?: string;
  }
) => {
  try {
    const account = await prisma.corporateAccount.create({
      data: {
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        organizationName: data.organizationName,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        billingAddress: data.billingAddress,
        creditLimit: data.creditLimit ? Number(data.creditLimit) : 0,
        paymentTerms: data.paymentTerms,
        gstin: data.gstin,
        panNumber: data.panNumber,
        notes: data.notes,
        currentBalance: 0,
        isActive: true,
      },
    });

    return account;
  } catch (error) {
    console.error('Error in createCorporateAccount:', error);
    throw error;
  }
};

// =======================================================
// GET CORPORATE ACCOUNTS
// =======================================================

export const getCorporateAccounts = async (options: any = {}) => {
  try {
    const {
      isActive,
      page = 1,
      limit = 20,
    } = options;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [accounts, total] = await Promise.all([
      prisma.corporateAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.corporateAccount.count({ where }),
    ]);

    return {
      accounts,
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
    console.error('Error in getCorporateAccounts:', error);
    throw error;
  }
};

// =======================================================
// UPDATE CORPORATE ACCOUNT BALANCE
// =======================================================

export const updateCorporateBalance = async (
  data: {
    accountId: string;
    amount: number;
  }
) => {
  try {
    const account = await prisma.corporateAccount.update({
      where: { id: data.accountId },
      data: {
        currentBalance: { increment: Number(data.amount) },
      },
    });

    return account;
  } catch (error) {
    console.error('Error in updateCorporateBalance:', error);
    throw error;
  }
};