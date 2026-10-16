import prisma from "../../../config/database";
import { getNextSequenceNumber } from "../../services/sequence.service";

const generateRefundNumber = async (tx?: any) => {
  return getNextSequenceNumber("CN", "MAIN", tx);
};

// =======================================================
// CREATE REFUND REQUEST
// =======================================================

export const createRefundRequest = async (
  data: {
    paymentId: string;
    amount: number;
    reason: string;
    refundMethod: string;
    refundTo?: string;
    requestedById: string;
  }
) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
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
      throw new Error("Payment not found");
    }

    if (payment.status !== "PAID") {
      throw new Error("Only paid payments can be refunded");
    }

    const roundPaise = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;
    const amount = roundPaise(Number(data.amount));
    if (amount <= 0) {
      throw new Error("Refund amount must be greater than zero");
    }

    if (amount > roundPaise(Number(payment.amount))) {
      throw new Error("Refund amount cannot exceed payment amount");
    }

    // Check if there are existing refunds for this payment
    const existingRefunds = await prisma.refund.findMany({
      where: { paymentId: data.paymentId },
    });

    const totalRefunded = roundPaise(
      existingRefunds.reduce(
        (sum, refund) => sum + Number(refund.amount),
        0
      )
    );

    const remainingRefundable = roundPaise(Number(payment.amount) - totalRefunded);

    if (amount > remainingRefundable) {
      throw new Error(
        `Refund amount cannot exceed remaining refundable amount of ${remainingRefundable}`
      );
    }

    const refundNum = await generateRefundNumber();
    const refund = await prisma.refund.create({
      data: {
        refundNumber: refundNum,
        paymentId: data.paymentId,
        amount,
        reason: data.reason,
        refundMethod: data.refundMethod as any,
        refundTo: data.refundTo,
        status: "PENDING",
        requestedById: data.requestedById,
      },
      include: {
        payment: {
          include: {
            order: {
              include: {
                patient: true,
                invoice: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return refund;
  } catch (error) {
    console.error('Error in createRefundRequest:', error);
    throw error;
  }
};

// =======================================================
// APPROVE REFUND
// =======================================================

export const approveRefund = async (
  data: {
    refundId: string;
    approverId: string;
    approvalNotes?: string;
  }
) => {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id: data.refundId },
      include: {
        payment: true,
      },
    });

    if (!refund) {
      throw new Error("Refund not found");
    }

    if (refund.status !== "PENDING") {
      throw new Error("Only pending refunds can be approved");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create approval record
      const approval = await tx.refundApproval.create({
        data: {
          refundId: data.refundId,
          approverId: data.approverId,
          approvalStatus: "APPROVED",
          approvalNotes: data.approvalNotes,
        },
      });

      // Update refund status
      const updatedRefund = await tx.refund.update({
        where: { id: data.refundId },
        data: {
          status: "APPROVED",
          approvalId: approval.id,
        },
        include: {
          payment: {
            include: {
              order: {
                include: {
                  invoice: true,
                  payments: true,
                },
              },
            },
          },
        },
      });

      return { refund: updatedRefund, approval };
    });

    return result;
  } catch (error) {
    console.error('Error in approveRefund:', error);
    throw error;
  }
};

// =======================================================
// REJECT REFUND
// =======================================================

export const rejectRefund = async (
  data: {
    refundId: string;
    approverId: string;
    rejectionReason: string;
  }
) => {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id: data.refundId },
    });

    if (!refund) {
      throw new Error("Refund not found");
    }

    if (refund.status !== "PENDING") {
      throw new Error("Only pending refunds can be rejected");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create approval record
      const approval = await tx.refundApproval.create({
        data: {
          refundId: data.refundId,
          approverId: data.approverId,
          approvalStatus: "REJECTED",
          approvalNotes: data.rejectionReason,
        },
      });

      // Update refund status
      const updatedRefund = await tx.refund.update({
        where: { id: data.refundId },
        data: {
          status: "REJECTED",
          approvalId: approval.id,
        },
      });

      return { refund: updatedRefund, approval };
    });

    return result;
  } catch (error) {
    console.error('Error in rejectRefund:', error);
    throw error;
  }
};

// =======================================================
// PROCESS REFUND
// =======================================================

export const processRefund = async (
  data: {
    refundId: string;
    processedById: string;
    transactionId?: string;
    utr?: string;
  }
) => {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id: data.refundId },
      include: {
        payment: {
          include: {
            order: {
              include: {
                invoice: true,
                payments: true,
              },
            },
          },
        },
      },
    });

    if (!refund) {
      throw new Error("Refund not found");
    }

    if (refund.status !== "APPROVED") {
      throw new Error("Only approved refunds can be processed");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update refund status
      const updatedRefund = await tx.refund.update({
        where: { id: data.refundId },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          processedById: data.processedById,
          transactionId: data.transactionId,
          utr: data.utr,
        },
      });

      // Update payment status to REFUNDED
      await tx.payment.update({
        where: { id: refund.paymentId },
        data: {
          status: "REFUNDED",
        },
      });

      // Recalculate invoice payment status
      const order = await tx.order.findUnique({
        where: { id: refund.payment.orderId },
        include: {
          invoice: true,
          payments: true,
        },
      });

      if (order && order.invoice) {
        const paidPayments = order.payments.filter(
          (p) => p.status === "PAID"
        );
        const totalPaid = paidPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );

        const paymentStatus =
          totalPaid >= Number(order.invoice.grandTotal)
            ? "PAID"
            : totalPaid > 0
            ? "PARTIAL"
            : "PENDING";

        await tx.invoice.update({
          where: { id: order.invoice.id },
          data: { paymentStatus },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus },
        });
      }

      return updatedRefund;
    });

    return result;
  } catch (error) {
    console.error('Error in processRefund:', error);
    throw error;
  }
};

// =======================================================
// GET REFUNDS
// =======================================================

export const getRefunds = async (options: any = {}) => {
  try {
    const {
      status,
      paymentId,
      requestedById,
      page = 1,
      limit = 20,
    } = options;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (paymentId) {
      where.paymentId = paymentId;
    }

    if (requestedById) {
      where.requestedById = requestedById;
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        skip,
        take: limit,
        include: {
          payment: {
            include: {
              order: {
                include: {
                  patient: true,
                  invoice: true,
                },
              },
            },
          },
          requestedBy: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.refund.count({ where }),
    ]);

    return {
      refunds,
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
    console.error('Error in getRefunds:', error);
    throw error;
  }
};

// =======================================================
// GET REFUND BY ID
// =======================================================

export const getRefundById = async (id: string) => {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        payment: {
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
        },
        approval: {
          include: {
            approver: {
              select: {
                id: true,
                employeeCode: true,
                fullName: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            role: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
          },
        },
      },
    });

    if (!refund) {
      throw new Error("Refund not found");
    }

    return refund;
  } catch (error) {
    console.error('Error in getRefundById:', error);
    throw error;
  }
};