import prisma from "../../../config/database";
import cache from "../../utils/cache";
import { getISTDayBounds, roundHalfUp, rupeesToPaise, paiseToRupees } from "../../utils/money";
import { getNextSequenceNumber } from "../../services/sequence.service";
import { createAuditLog } from "../audit/audit.service";

async function generateReceiptNumber(tx?: any): Promise<string> {
  return getNextSequenceNumber("REC", "MAIN", tx);
}

// =======================================================
// CREATE SPLIT PAYMENT
// =======================================================

export const createSplitPayment = async (
  data: {
    orderId: string;
    payments: Array<{
      amount: number;
      method: "CASH" | "CARD" | "UPI" | "NET_BANKING" | "CHEQUE";
      transactionId?: string;
      remarks?: string;
    }>;
  },
  receivedById?: string
) => {
  try {
    const order =
      await prisma.order.findUnique({
        where: {
          id: data.orderId,
        },

        include: {
          invoice: true,
          payments: true,
          patient: true,
        },
      });

    if (!order) {
      throw new Error(
        "Order not found"
      );
    }

    if (!order.invoice) {
      throw new Error(
        "Invoice must be created before payment"
      );
    }

    if (
      order.invoice.paymentStatus ===
      "PAID"
    ) {
      throw new Error(
        "Invoice is already fully paid"
      );
    }

    const totalPaymentAmount = data.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    if (totalPaymentAmount <= 0) {
      throw new Error(
        "Total payment amount must be greater than zero"
      );
    }

    const alreadyPaid =
      order.payments
        .filter(
          (payment) =>
            payment.status === "PAID"
        )
        .reduce(
          (total, payment) =>
            total + Number(payment.amount),
          0
        );

    const grandTotal =
      Number(order.invoice.grandTotal);

    const remainingAmount = roundHalfUp(grandTotal - alreadyPaid);

    if (totalPaymentAmount > remainingAmount) {
      throw new Error(
        `Total payment cannot exceed remaining amount of ${remainingAmount}`
      );
    }

    const payments =
      await prisma.$transaction(
        async (tx) => {
          const createdPayments = [];

          for (const paymentData of data.payments) {
            const receiptNum = await generateReceiptNumber(tx);
            const txnNum = paymentData.transactionId || (await getNextSequenceNumber("TXN", "MAIN", tx));
            const payment =
              await tx.payment.create({
                data: {
                  receiptNumber: receiptNum,

                  orderId: order.id,

                  amount: Number(paymentData.amount),

                  method: paymentData.method,

                  status: "PAID",

                  transactionId: txnNum,

                  remarks: paymentData.remarks,

                  receivedById,

                  paidAt: new Date(),
                },

                include: {
                  order: {
                    include: {
                      patient: true,
                      invoice: true,
                    },
                  },

                  receivedBy: {
                    select: {
                      id: true,
                      employeeCode: true,
                      fullName: true,
                      role: true,
                    },
                  },
                },
              });

            createdPayments.push(payment);
          }

          const totalPaid =
            alreadyPaid + totalPaymentAmount;

          const paymentStatus =
            totalPaid >= grandTotal
              ? "PAID"
              : "PARTIAL";

          await tx.invoice.update({
            where: {
              id: order.invoice!.id,
            },

            data: {
              paymentStatus,
            },
          });

          await tx.order.update({
            where: {
              id: order.id,
            },

            data: {
              paymentStatus,
            },
          });

          return createdPayments;
        }
      );

    // Create Audit Log for split payment
    await createAuditLog({
      userId: receivedById || "SYSTEM",
      module: "PAYMENT",
      action: "CREATE_SPLIT_PAYMENT",
      recordId: data.orderId,
      newData: { payments: data.payments, orderId: data.orderId }
    });

    return payments;
  } catch (error) {
    console.error('Error in createSplitPayment:', error);
    throw error;
  }
};

// =======================================================
// CREATE PAYMENT
// =======================================================

export const createPayment = async (
  data: {
    orderId: string;
    amount: number;
    method:
      | "CASH"
      | "CARD"
      | "UPI"
      | "NET_BANKING"
      | "CHEQUE";
    transactionId?: string;
    remarks?: string;
  },
  receivedById?: string
) => {
  try {
    const order =
      await prisma.order.findUnique({
        where: {
          id: data.orderId,
        },

        include: {
          invoice: true,
          payments: true,
          patient: true,
        },
      });

    if (!order) {
      throw new Error(
        "Order not found"
      );
    }

    if (!order.invoice) {
      throw new Error(
        "Invoice must be created before payment"
      );
    }

    if (
      order.invoice.paymentStatus ===
      "PAID"
    ) {
      throw new Error(
        "Invoice is already fully paid"
      );
    }

    const amount = Number(data.amount);

    if (amount <= 0) {
      throw new Error(
        "Payment amount must be greater than zero"
      );
    }

    const alreadyPaid =
      order.payments
        .filter(
          (payment) =>
            payment.status === "PAID"
        )
        .reduce(
          (total, payment) =>
            total + Number(payment.amount),
          0
        );

    const grandTotal =
      Number(order.invoice.grandTotal);

    const remainingAmount = roundHalfUp(grandTotal - alreadyPaid);

    if (amount > remainingAmount) {
      throw new Error(
        `Payment cannot exceed remaining amount of ${remainingAmount}`
      );
    }

    const payment =
      await prisma.$transaction(
        async (tx) => {
          const receiptNum = await generateReceiptNumber(tx);
          const txnNum = data.transactionId || (await getNextSequenceNumber("TXN", "MAIN", tx));

          const payment =
            await tx.payment.create({
              data: {
                receiptNumber: receiptNum,

                orderId: order.id,

                amount,

                method: data.method,

                status: "PAID",

                transactionId: txnNum,

                remarks: data.remarks,

                receivedById,

                paidAt: new Date(),
              },

              include: {
                order: {
                  include: {
                    patient: true,
                    invoice: true,
                  },
                },

                receivedBy: {
                  select: {
                    id: true,
                    employeeCode: true,
                    fullName: true,
                    role: true,
                  },
                },
              },
            });

          const totalPaid =
            alreadyPaid + amount;

          const paymentStatus =
            totalPaid >= grandTotal
              ? "PAID"
              : "PARTIAL";

          await tx.invoice.update({
            where: {
              id: order.invoice!.id,
            },

            data: {
              paymentStatus,
            },
          });

          await tx.order.update({
            where: {
              id: order.id,
            },

            data: {
              paymentStatus,
            },
          });

          return payment;
        }
      );

    // Create Audit Log for payment
    await createAuditLog({
      userId: receivedById || "SYSTEM",
      module: "PAYMENT",
      action: "CREATE_PAYMENT",
      recordId: data.orderId,
      newData: { amount: data.amount, method: data.method, orderId: data.orderId }
    });

    return payment;
  } catch (error) {
    console.error('Error in createPayment:', error);
    throw error;
  }
};

// =======================================================
// GET PAYMENT
// =======================================================

export const getPaymentById =
  async (id: string) => {
    try {
      const payment =
        await prisma.payment.findUnique({
          where: {
            id,
          },

          include: {
            order: {
              include: {
                patient: true,
                doctor: true,
                invoice: true,
                payments: true,
              },
            },

            receivedBy: {
              select: {
                id: true,
                employeeCode: true,
                fullName: true,
                role: true,
              },
            },
          },
        });

      if (!payment) {
        throw new Error(
          "Payment not found"
        );
      }

      return payment;
    } catch (error) {
      console.error('Error in getPaymentById:', error);
      throw new Error('Failed to fetch payment from database');
    }
  };

// =======================================================
// LIST PAYMENTS
// =======================================================

export const getPayments =
  async (options: any) => {
    try {
      const {
        search,
        patientId,
        orderId,
        method,
        status,
        page = 1,
        limit = 20,
        startDate,
        endDate,
        receivedById,
      } = options;

      const skip =
        (page - 1) * limit;

      const where: any = {};

      if (patientId) {
        where.order = {
          ...where.order,
          patientId: patientId,
        };
      }

      if (orderId) {
        where.orderId = orderId;
      }

      if (method) {
        where.method = method;
      }

      if (status) {
        where.status = status;
      }

      if (receivedById) {
        where.receivedById = receivedById;
      }

      if (search) {
        where.OR = [
          { receiptNumber: { contains: search, mode: "insensitive" } },
          { transactionId: { contains: search, mode: "insensitive" } },
          { order: { orderNumber: { contains: search, mode: "insensitive" } } },
          { order: { patient: { firstName: { contains: search, mode: "insensitive" } } } },
          { order: { patient: { lastName: { contains: search, mode: "insensitive" } } } },
          { order: { patient: { uhid: { contains: search, mode: "insensitive" } } } },
          { order: { patient: { phone: { contains: search, mode: "insensitive" } } } },
          { order: { invoice: { invoiceNumber: { contains: search, mode: "insensitive" } } } },
        ];
      }

      // Date range filter
      if (startDate || endDate) {
        where.paidAt = {};
        if (startDate) {
          where.paidAt.gte = new Date(startDate);
        }
        if (endDate) {
          const endD = new Date(endDate);
          if (typeof endDate === "string" && !endDate.includes("T")) {
            endD.setHours(23, 59, 59, 999);
          }
          where.paidAt.lte = endD;
        }
      }

      const [
        payments,
        total,
      ] = await Promise.all([
        prisma.payment.findMany({
          where,

          skip,
          take: limit,

          include: {
            order: {
              include: {
                patient: true,
                invoice: true,
              },
            },

            receivedBy: {
              select: {
                id: true,
                employeeCode: true,
                fullName: true,
                role: true,
              },
            },
          },

          orderBy: {
            paidAt: "desc",
          },
        }),

        prisma.payment.count({
          where,
        }),
      ]);

      return {
        payments,

        pagination: {
          page,
          limit,
          total,

          totalPages:
            Math.ceil(
              total / limit
            ),

          hasNextPage:
            page * limit < total,

          hasPreviousPage:
            page > 1,
        },
      };
    } catch (error) {
      console.error('Error in getPayments:', error);
      throw error;
    }
  };

// =======================================================
// GET PAYMENT METRICS
// =======================================================

export const getPaymentMetrics = async (options: any = {}) => {
  const cacheKey = `payments:metrics:${options.startDate || 'all'}:${options.endDate || 'all'}:${options.receivedById || 'all'}`;

  return cache.getOrSet(cacheKey, 8, async () => {
    try {
      const { startDate, endDate, receivedById } = options;

      // IST Day boundaries (UTC+5:30)
      const { startUTC: today, endUTC: endOfToday } = getISTDayBounds(
        startDate ? new Date(startDate) : new Date()
      );

      const where: any = {
        status: { in: ["PAID", "PARTIALLY_PAID", "COMPLETED"] },
      };

      // Custom Date range filter override
      if (startDate || endDate) {
        where.paidAt = {};
        if (startDate) {
          where.paidAt.gte = new Date(startDate);
        }
        if (endDate) {
          const endD = new Date(endDate);
          if (typeof endDate === "string" && !endDate.includes("T")) {
            endD.setHours(23, 59, 59, 999);
          }
          where.paidAt.lte = endD;
        }
      }

      if (receivedById) {
        where.receivedById = receivedById;
      }

      // Today's payments in IST
      const todayWhere = { ...where, paidAt: { gte: today, lte: endOfToday } };

      const [
        totalCollectionAgg,
        todayCollectionAgg,
        cashCollectionAgg,
        digitalCollectionAgg,
        outstandingReceivablesAgg,
        todayRefundsAgg,
        activeShiftAgg,
      ] = await Promise.all([
        // Total collection (all time or filtered)
        prisma.payment.aggregate({
          where,
          _sum: { amount: true },
        }),

        // Today's collection
        prisma.payment.aggregate({
          where: todayWhere,
          _sum: { amount: true },
        }),

        // Cash collection (today)
        prisma.payment.aggregate({
          where: { ...todayWhere, method: "CASH" },
          _sum: { amount: true },
        }),

        // Digital payments (UPI, CARD, NET_BANKING) - today
        prisma.payment.aggregate({
          where: { 
            ...todayWhere, 
            method: { in: ["UPI", "CARD", "NET_BANKING"] } 
          },
          _sum: { amount: true },
        }),

        // Outstanding receivables (grandTotal from unpaid invoices)
        prisma.invoice.aggregate({
          where: {
            paymentStatus: { in: ["PENDING", "PARTIAL"] },
          },
          _sum: { grandTotal: true },
        }),

        // Today's Refunds in IST
        prisma.refund.aggregate({
          where: {
            status: "APPROVED",
            createdAt: { gte: today, lte: endOfToday },
          },
          _sum: { amount: true },
        }).catch(() => ({ _sum: { amount: 0 } })),

        // Active Till Shift (Opening float)
        prisma.cashCounterSession.findFirst({
          where: { closedAt: null },
          select: { openingBalance: true, closingBalance: true, expectedCash: true },
        }).catch(() => null),
      ]);

      const grossToday = Number(todayCollectionAgg._sum.amount || 0);
      const todayRefunds = Number((todayRefundsAgg as any)?._sum?.amount || 0);
      const netTodayCollection = Math.max(0, grossToday - todayRefunds);

      const cashCollected = Number(cashCollectionAgg._sum.amount || 0);
      const openingFloat = activeShiftAgg ? Number(activeShiftAgg.openingBalance || 0) : 0;
      const expectedCashDrawer = openingFloat + cashCollected;

      const outstanding = Number(outstandingReceivablesAgg._sum.grandTotal || 0);
      const digital = Number(digitalCollectionAgg._sum.amount || 0);

      return {
        totalCollection: roundHalfUp(Number(totalCollectionAgg._sum.amount || 0)),
        todayCollection: roundHalfUp(netTodayCollection),
        cashInHand: roundHalfUp(cashCollected),
        cashDrawer: roundHalfUp(expectedCashDrawer),
        digitalPayments: roundHalfUp(digital),
        pendingSettlements: roundHalfUp(digital), // Pending settlement equals active digital batch
        outstandingReceivables: roundHalfUp(outstanding),
      };
    } catch (error) {
      console.error('Error in getPaymentMetrics:', error);
      
      return {
        totalCollection: 0,
        todayCollection: 0,
        cashInHand: 0,
        cashDrawer: 0,
        digitalPayments: 0,
        pendingSettlements: 0,
        outstandingReceivables: 0,
      };
    }
  });
};

// =======================================================
// SHIFT CLOSE REPORT
// =======================================================

export const getShiftCloseReport = async (options: any = {}) => {
  try {
    const {
      startDate,
      endDate,
      receivedById,
    } = options;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const dateStart = startDate ? new Date(startDate) : today;
    const dateEnd = endDate ? new Date(endDate) : endOfToday;

    const where: any = {
      status: "PAID",
      paidAt: {
        gte: dateStart,
        lte: dateEnd,
      },
    };

    if (receivedById) {
      where.receivedById = receivedById;
    }

    const [payments, cashPayments, digitalPayments, orderCounts] = await Promise.all([
      // All payments in the period
      prisma.payment.findMany({
        where,
        include: {
          order: {
            include: {
              patient: true,
              invoice: true,
            },
          },
          receivedBy: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          paidAt: "asc",
        },
      }),

      // Cash payments
      prisma.payment.aggregate({
        where: { ...where, method: "CASH" },
        _sum: { amount: true },
        _count: true,
      }),

      // Digital payments
      prisma.payment.aggregate({
        where: { 
          ...where, 
          method: { in: ["UPI", "CARD", "NET_BANKING"] } 
        },
        _sum: { amount: true },
        _count: true,
      }),

      // Payment method breakdown
      prisma.payment.groupBy({
        by: ['method'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalCash = Number(cashPayments._sum.amount || 0);
    const totalDigital = Number(digitalPayments._sum.amount || 0);
    const totalCollection = totalCash + totalDigital;

    const methodBreakdown = orderCounts.reduce((acc, item) => {
      acc[item.method] = {
        amount: Number(item._sum.amount || 0),
        count: item._count,
      };
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    return {
      reportDate: dateStart.toISOString(),
      startDate: dateStart.toISOString(),
      endDate: dateEnd.toISOString(),
      generatedBy: receivedById || "System",
      
      summary: {
        totalCollection,
        totalCash,
        totalDigital,
        totalTransactions: payments.length,
        cashTransactions: cashPayments._count,
        digitalTransactions: digitalPayments._count,
      },

      methodBreakdown,
      
      payments: payments.map(payment => ({
        id: payment.id,
        receiptNumber: payment.receiptNumber,
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber,
        patientName: [payment.order.patient.firstName, payment.order.patient.middleName, payment.order.patient.lastName].filter(Boolean).join(" ").trim() || "Patient",
        patientUHID: payment.order.patient.uhid,
        amount: Number(payment.amount),
        method: payment.method,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        receivedBy: payment.receivedBy?.fullName || "System",
      })),
    };
  } catch (error) {
    console.error('Error in getShiftCloseReport:', error);
    throw error;
  }
};

// =======================================================
// REFUND PAYMENT
// =======================================================

export const refundPayment =
  async (id: string) => {
    try {
      const payment =
        await prisma.payment.findUnique({
          where: {
            id,
          },

          include: {
            order: {
              include: {
                invoice: true,
                payments: true,
              },
            },
          },
        });

      if (!payment) {
        throw new Error(
          "Payment not found"
        );
      }

      if (
        payment.status !== "PAID"
      ) {
        throw new Error(
          "Only paid payments can be refunded"
        );
      }

      const refunded =
        await prisma.$transaction(
          async (tx) => {
            const updated =
              await tx.payment.update({
                where: {
                  id,
                },

                data: {
                  status: "REFUNDED",
                },
              });

            const remainingPaid =
              payment.order.payments
                .filter(
                  (item) =>
                    item.id !== payment.id &&
                    item.status === "PAID"
                )
                .reduce(
                  (total, item) =>
                    total +
                    Number(item.amount),
                  0
                );

            const invoice =
              payment.order.invoice;

            if (invoice) {
              const grandTotal =
                Number(
                  invoice.grandTotal
                );

              let status:
                | "PENDING"
                | "PARTIAL"
                | "PAID";

              if (
                remainingPaid <= 0
              ) {
                status = "PENDING";
              } else if (
                remainingPaid <
                grandTotal
              ) {
                status = "PARTIAL";
              } else {
                status = "PAID";
              }

              await tx.invoice.update({
                where: {
                  id: invoice.id,
                },

                data: {
                  paymentStatus:
                    status,
                },
              });

              await tx.order.update({
                where: {
                  id: payment.orderId,
                },

                data: {
                  paymentStatus:
                    status,
                },
              });
            }

            return updated;
          }
        );

      return refunded;
    } catch (error) {
      console.error('Error in refundPayment:', error);
      throw error;
    }
  };