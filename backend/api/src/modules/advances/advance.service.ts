import prisma from "../../../config/database";
import type { PaymentStatus } from "@prisma/client";
import { getNextSequenceNumber } from "../../services/sequence.service";

const roundPaise = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

// =======================================================
// CREATE PATIENT ADVANCE
// =======================================================

export const createAdvance = async (
  data: {
    patientId: string;
    amount: number;
    reason?: string;
    receivedById?: string;
  }
) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    const amount = Number(data.amount);
    if (amount <= 0) {
      throw new Error("Advance amount must be greater than zero");
    }

    const advance = await prisma.$transaction(async (tx) => {
      const advanceReceiptNo = await getNextSequenceNumber("ADV", "MAIN", tx);

      // Create advance record
      const advance = await tx.patientAdvance.create({
        data: {
          patientId: data.patientId,
          amount,
          balance: amount,
          transactionType: "CREDIT",
          referenceId: advanceReceiptNo,
          referenceType: "RECEIPT_ADVANCE",
          reason: data.reason || "Advance payment",
          receivedById: data.receivedById,
        },
        include: {
          patient: true,
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

      // Create or update wallet
      let wallet = await tx.patientWallet.findUnique({
        where: { patientId: data.patientId },
      });

      if (wallet) {
        wallet = await tx.patientWallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: amount },
          },
        });
      } else {
        wallet = await tx.patientWallet.create({
          data: {
            patientId: data.patientId,
            balance: amount,
          },
        });
      }

const roundPaise = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          transactionType: "CREDIT",
          balanceBefore: roundPaise(Number(wallet.balance) - amount),
          balanceAfter: roundPaise(Number(wallet.balance)),
          referenceId: advance.id,
          referenceType: "ADVANCE",
          description: data.reason || "Advance payment",
        },
      });

      return advance;
    });

    return advance;
  } catch (error) {
    console.error('Error in createAdvance:', error);
    throw error;
  }
};

// =======================================================
// GET PATIENT ADVANCES
// =======================================================

export const getPatientAdvances = async (patientId: string) => {
  try {
    const advances = await prisma.patientAdvance.findMany({
      where: { patientId },
      include: {
        receivedBy: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return advances;
  } catch (error) {
    console.error('Error in getPatientAdvances:', error);
    throw error;
  }
};

// =======================================================
// GET PATIENT WALLET
// =======================================================

export const getPatientWallet = async (patientId: string) => {
  try {
    const wallet = await prisma.patientWallet.findUnique({
      where: { patientId },
      include: {
        patient: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      return await prisma.patientWallet.create({
        data: {
          patientId,
          balance: 0,
        },
        include: {
          patient: true,
          transactions: true,
        },
      });
    }

    return wallet;
  } catch (error) {
    console.error('Error in getPatientWallet:', error);
    throw error;
  }
};

// =======================================================
// APPLY ADVANCE TO INVOICE
// =======================================================

export const applyAdvanceToInvoice = async (
  data: {
    patientId: string;
    orderId: string;
    amount: number;
    appliedById?: string;
  }
) => {
  try {
    const amount = Number(data.amount);
    if (amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Atomic deduct to prevent concurrent double-spending
      const updatedWallets = await tx.patientWallet.updateMany({
        where: {
          patientId: data.patientId,
          balance: { gte: amount },
        },
        data: {
          balance: { decrement: amount },
        },
      });

      if (updatedWallets.count === 0) {
        throw new Error("Insufficient wallet balance or wallet not found");
      }
      
      const wallet = await tx.patientWallet.findUnique({
        where: { patientId: data.patientId },
      });

      // Get order
      const order = await tx.order.findUnique({
        where: { id: data.orderId },
        include: { invoice: true },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      const receiptNumber = await getNextSequenceNumber("REC", "MAIN", tx);

      // Create payment from wallet
      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          orderId: data.orderId,
          amount,
          method: "WALLET",
          status: "PAID",
          receivedById: data.appliedById,
          paidAt: new Date(),
        },
        include: {
          order: {
            include: {
              patient: true,
              invoice: true,
            },
          },
        },
      });

      // Wallet already updated atomically, just use it

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          amount: -amount,
          transactionType: "DEBIT",
          balanceBefore: roundPaise(Number(wallet!.balance) + amount),
          balanceAfter: roundPaise(Number(wallet!.balance)),
          referenceId: payment.id,
          referenceType: "PAYMENT",
          description: `Payment for order ${order.orderNumber}`,
        },
      });

      // Create advance record for the debit
      await tx.patientAdvance.create({
        data: {
          patientId: data.patientId,
          amount: -amount,
          balance: roundPaise(Number(wallet!.balance)),
          transactionType: "DEBIT",
          referenceId: payment.id,
          referenceType: "PAYMENT",
          reason: `Applied to order ${order.orderNumber}`,
          receivedById: data.appliedById,
        },
      });

      // Update invoice payment status from the payments actually recorded for
      // this order (the wallet payment created above is visible inside this tx).
      if (order.invoice) {
        const paidTotal = await tx.payment.aggregate({
          where: { orderId: order.id },
          _sum: { amount: true },
        });

        const totalPaid = Number(paidTotal._sum.amount ?? 0);
        const remainingAmount =
          Number(order.invoice.grandTotal) - totalPaid;

        const paymentStatus: PaymentStatus =
          remainingAmount <= 0
            ? "PAID"
            : totalPaid > 0
              ? "PARTIAL"
              : "PENDING";

        await tx.invoice.update({
          where: { id: order.invoice.id },
          data: {
            paymentStatus,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus,
          },
        });
      }

      return { payment, wallet: wallet! };
    });

    return result;
  } catch (error) {
    console.error('Error in applyAdvanceToInvoice:', error);
    throw error;
  }
};

// =======================================================
// REFUND ADVANCE
// =======================================================

export const refundAdvance = async (
  data: {
    advanceId: string;
    amount: number;
    reason: string;
    processedById?: string;
  }
) => {
  try {
    const amount = Number(data.amount);
    if (amount <= 0) {
      throw new Error("Refund amount must be greater than zero");
    }

    const result = await prisma.$transaction(async (tx) => {
      const advance = await tx.patientAdvance.findUnique({
        where: { id: data.advanceId },
        include: { patient: true },
      });

      if (!advance) {
        throw new Error("Advance not found");
      }

      if (Number(advance.balance) < amount) {
        throw new Error("Insufficient advance balance for refund");
      }

      // Create debit advance record for refund
      const refundAdvance = await tx.patientAdvance.create({
        data: {
          patientId: advance.patientId,
          amount: -amount,
          balance: Number(advance.balance) - amount,
          transactionType: "REFUND",
          referenceId: advance.id,
          referenceType: "ADVANCE",
          reason: data.reason,
          receivedById: data.processedById,
        },
      });

      // Update wallet balance
      const wallet = await tx.patientWallet.update({
        where: { patientId: advance.patientId },
        data: {
          balance: { decrement: amount },
        },
      });

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          transactionType: "REFUND",
          balanceBefore: Number(wallet.balance) + amount,
          balanceAfter: Number(wallet.balance),
          referenceId: refundAdvance.id,
          referenceType: "ADVANCE_REFUND",
          description: data.reason,
        },
      });

      return { refundAdvance, wallet };
    });

    return result;
  } catch (error) {
    console.error('Error in refundAdvance:', error);
    throw error;
  }
};