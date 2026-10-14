import prisma from "../../../config/database";
import { getNextSequenceNumber } from "../../services/sequence.service";
import { getISTDayBounds, roundHalfUp } from "../../utils/money";
import { HttpError } from "../../utils/http-error";

// =======================================================
// CREATE INVOICE
// =======================================================

export const createInvoice = async (
  data: {
    orderId: string;
    gstPercent?: number;
    discount?: number;
    isInterState?: boolean;
    seriesType?: "INV" | "B2B";
  }
) => {
  try {
    // Validate input data
    if (!data.orderId) {
      throw new HttpError("Order ID is required", 400);
    }

    const order =
      await prisma.order.findUnique({
        where: {
          id: data.orderId,
        },

        include: {
          items: true,
          invoice: true,
          patient: true,
        },
      });

    if (!order) {
      throw new HttpError("Order not found", 404);
    }

    if (order.invoice) {
      throw new HttpError("Invoice already exists for this order", 409);
    }

    if (!order.items || order.items.length === 0) {
      throw new HttpError("Cannot create invoice without order items", 400);
    }

    const subtotal = order.items.reduce(
      (total, item) => {
        return total + (Number(item.price) || 0);
      },
      0
    );

    if (subtotal <= 0) {
      throw new HttpError("Invalid subtotal amount", 400);
    }

    const discount = Math.max(
      0,
      data.discount ?? 0
    );

    if (discount > subtotal) {
      throw new HttpError("Discount cannot be greater than subtotal", 400);
    }

    if (discount > 0 && order.createdById) {
      const user = await prisma.user.findUnique({ where: { id: order.createdById } });
      const isManagerOrAdmin = user && ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role);
      
      if (!isManagerOrAdmin) {
        const maxAllowedDiscount = subtotal * 0.10;
        if (discount > maxAllowedDiscount) {
          throw new HttpError(`Unauthorized Discount: Front desk cannot exceed 10% (Max allowed: ₹${maxAllowedDiscount}). Manager override required.`, 403);
        }
      }
    }

    const taxableAmount = roundHalfUp(subtotal - discount);

    // Configurable GST rate (default 18% or 0% for clinical exemption)
    const gstPercent = data.gstPercent !== undefined ? data.gstPercent : 18;

    if (gstPercent < 0 || gstPercent > 100) {
      throw new HttpError("GST percentage must be between 0 and 100", 400);
    }

    const gstAmount = roundHalfUp((taxableAmount * gstPercent) / 100);

    // Bifurcate tax based on Place of Supply (Intra-state CGST+SGST vs Inter-state IGST)
    const isInterState = Boolean(data.isInterState);
    const cgstAmount = isInterState ? 0 : roundHalfUp(gstAmount / 2);
    const sgstAmount = isInterState ? 0 : roundHalfUp(gstAmount - cgstAmount);
    const igstAmount = isInterState ? gstAmount : 0;

    const grandTotal = roundHalfUp(taxableAmount + gstAmount);

    const invoice = await prisma.$transaction(async (tx) => {
      const series = data.seriesType || "INV";
      const invoiceNumber = await getNextSequenceNumber(series, "MAIN", tx);

      return tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          subtotal,
          discount,
          taxableAmount,
          gstPercent,
          cgstAmount,
          sgstAmount,
          igstAmount,
          gstAmount,
          grandTotal,
          paymentStatus: "PENDING",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },

        include: {
          order: {
            include: {
              patient: true,
              doctor: true,
              items: {
                include: {
                  test: true,
                },
              },
            },
          },
        },
      });
    });

    return invoice;
  } catch (error) {
    console.error("Error in createInvoice:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create invoice");
  }
};

// =======================================================
// GET INVOICE BY ID
// =======================================================

export const getInvoiceById =
  async (id: string) => {
    try {
      if (!id) {
        throw new Error("Invoice ID is required");
      }

      const invoice =
        await prisma.invoice.findUnique({
          where: {
            id,
          },

          include: {
            order: {
              include: {
                patient: true,
                doctor: true,

                items: {
                  include: {
                    test: true,
                  },
                },

                payments: {
                  orderBy: {
                    paidAt: "desc",
                  },
                },

                samples: {
                  include: {
                    test: true,
                  },
                },
              },
            },
          },
        });

      if (!invoice) {
        throw new Error(
          "Invoice not found"
        );
      }

      return invoice;
    } catch (error) {
      console.error("Error in getInvoiceById:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to retrieve invoice");
    }
  };

// =======================================================
// LIST INVOICES
// =======================================================

export const getInvoices =
  async (options: any) => {
    try {
      const {
        search,
        patientId,
        orderId,
        paymentStatus,
        doctorId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
      } = options;

      // Validate pagination parameters
      const validPage = Math.max(1, Number(page) || 1);
      const validLimit = Math.min(100, Math.max(1, Number(limit) || 20));

      const skip =
        (validPage - 1) * validLimit;

      const where: any = {};

      if (orderId) {
        where.orderId = orderId;
      }

      if (patientId) {
        where.order = {
          ...where.order,
          patientId: patientId,
        };
      }

      if (paymentStatus) {
        where.paymentStatus =
          paymentStatus;
      }

      if (doctorId) {
        where.order = {
          ...where.order,
          doctorId: doctorId,
        };
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        try {
          if (dateFrom) {
            const fromDate = new Date(dateFrom);
            if (!isNaN(fromDate.getTime())) {
              where.createdAt.gte = fromDate;
            }
          }
          if (dateTo) {
            const endDate = new Date(dateTo);
            if (!isNaN(endDate.getTime())) {
              endDate.setHours(23, 59, 59, 999);
              where.createdAt.lte = endDate;
            }
          }
        } catch (dateError) {
          console.error("Date parsing error in getInvoices:", dateError);
          // Continue without date filters if parsing fails
        }
      }

      if (search) {
        where.OR = [
          {
            invoiceNumber: {
              contains: search,
              mode: "insensitive",
            },
          },

          {
            order: {
              orderNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
          },

          {
            order: {
              patient: {
                firstName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },

          {
            order: {
              patient: {
                lastName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },

          {
            order: {
              patient: {
                phone: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },

          {
            order: {
              patient: {
                uhid: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },

          {
            order: {
              patientId: {
                equals: search,
              },
            },
          },
        ];
      }

      let invoices, total;
      try {
        const results = await Promise.all([
          prisma.invoice.findMany({
            where,

            skip,
            take: validLimit,

            include: {
              order: {
                include: {
                  patient: true,
                  doctor: true,
                  payments: {
                    orderBy: {
                      paidAt: "desc",
                    },
                  },
                  items: {
                    include: {
                      test: true,
                    },
                  },
                },
              },
            },

            orderBy: {
              createdAt: "desc",
            },
          }),

          prisma.invoice.count({
            where,
          }),
        ]);
        invoices = results[0];
        total = results[1];
      } catch (dbError) {
        console.error("Database error in getInvoices:", dbError);
        // Return empty result instead of throwing error
        return {
          invoices: [],
          pagination: {
            page: validPage,
            limit: validLimit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      return {
        invoices,

        pagination: {
          page: validPage,
          limit: validLimit,
          total,

          totalPages:
            Math.ceil(
              total / validLimit
            ),

          hasNextPage:
            validPage * validLimit < total,

          hasPreviousPage:
            validPage > 1,
        },
      };
    } catch (error) {
      console.error("Error in getInvoices:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to retrieve invoices");
    }
  };

// =======================================================
// UPDATE PAYMENT STATUS
// =======================================================

export const updatePaymentStatus =
  async (
    id: string
  ) => {
    try {
      if (!id) {
        throw new Error("Invoice ID is required");
      }

      const invoice =
        await prisma.invoice.findUnique({
          where: {
            id,
          },

          include: {
            order: {
              include: {
                payments: true,
              },
            },
          },
        });

      if (!invoice) {
        throw new Error(
          "Invoice not found"
        );
      }

      const totalPaid =
        invoice.order?.payments
          ?.filter(
            (payment) =>
              payment.status === "PAID"
          )
          ?.reduce(
            (total, payment) =>
              total +
              (Number(payment.amount) || 0),
            0
          ) || 0;

      const grandTotal =
        Number(invoice.grandTotal) || 0;

      let paymentStatus:
        | "PENDING"
        | "PARTIAL"
        | "PAID";

      if (totalPaid <= 0) {
        paymentStatus = "PENDING";
      } else if (
        totalPaid < grandTotal
      ) {
        paymentStatus = "PARTIAL";
      } else {
        paymentStatus = "PAID";
      }

      const updatedInvoice =
        await prisma.invoice.update({
          where: {
            id,
          },

          data: {
            paymentStatus,
          },
        });

      await prisma.order.update({
        where: {
          id: invoice.orderId,
        },

        data: {
          paymentStatus,
        },
      });

      return updatedInvoice;
    } catch (error) {
      console.error("Error in updatePaymentStatus:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to update payment status");
    }
  };

// =======================================================
// DELETE INVOICE
// =======================================================

export const deleteInvoice = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Invoice ID is required");
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Check if there are any payments
    if (invoice.order?.payments && invoice.order.payments.length > 0) {
      throw new Error(
        "Cannot delete invoice with existing payments. Please refund payments first."
      );
    }

    // Delete invoice (order relationship will cascade)
    await prisma.invoice.delete({
      where: { id },
    });

    // Update order payment status back to pending
    await prisma.order.update({
      where: { id: invoice.orderId },
      data: { paymentStatus: "PENDING" },
    });

    return { success: true, message: "Invoice deleted successfully" };
  } catch (error) {
    console.error("Error in deleteInvoice:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete invoice");
  }
};

// =======================================================
// GET BILLING METRICS
// =======================================================

export const getBillingMetrics = async (options: any = {}) => {
  try {
    const { startDate, endDate } = options;

    let startOfDay: Date;
    let endOfDay: Date;

    if (startDate && endDate) {
      startOfDay = new Date(startDate);
      endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
    } else if (startDate) {
      startOfDay = new Date(startDate);
      endOfDay = new Date(startDate);
      endOfDay.setHours(23, 59, 59, 999);
    } else {
      const bounds = getISTDayBounds(new Date());
      startOfDay = bounds.startUTC;
      endOfDay = bounds.endUTC;
    }

    // Get all invoices within the date range
    let invoices: any[] = [];
    try {
      invoices = await prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          order: {
            include: {
              payments: true,
            },
          },
        },
      });
    } catch (dbError) {
      console.error("Database error in getBillingMetrics:", dbError);
      invoices = [];
    }

    let totalTaxableRevenue = 0;
    let totalGstAmount = 0;
    let totalBilledTurnover = 0;
    let totalCollections = 0;
    let paidInvoicesCount = 0;
    let paidInvoicesAmount = 0;
    let partialInvoicesCount = 0;
    let partialInvoicesPaid = 0;
    let partialInvoicesDue = 0;
    let unpaidInvoicesCount = 0;
    let unpaidInvoicesDue = 0;
    let pendingDueAmount = 0;
    let totalDiscounts = 0;
    let totalRefunds = 0;

    invoices.forEach((invoice) => {
      try {
        const grandTotal = Number(invoice.grandTotal) || 0;
        const taxable = Number(invoice.taxableAmount || (grandTotal - Number(invoice.gstAmount || 0))) || 0;
        const gst = Number(invoice.gstAmount) || 0;
        const discount = Number(invoice.discount) || 0;
        const paidAmount = invoice.order?.payments
          ?.filter((p: any) => p.status === "PAID")
          ?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
        const refundedAmount = invoice.order?.payments
          ?.filter((p: any) => p.status === "REFUNDED")
          ?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;

        totalTaxableRevenue += taxable;
        totalGstAmount += gst;
        totalBilledTurnover += grandTotal;
        totalCollections += paidAmount;
        totalDiscounts += discount;
        totalRefunds += refundedAmount;

        const due = Math.max(0, grandTotal - paidAmount);

        if (invoice.paymentStatus === "PAID" || due <= 0) {
          paidInvoicesCount++;
          paidInvoicesAmount += grandTotal;
        } else if (paidAmount > 0) {
          partialInvoicesCount++;
          partialInvoicesPaid += paidAmount;
          partialInvoicesDue += due;
          pendingDueAmount += due;
        } else {
          unpaidInvoicesCount++;
          unpaidInvoicesDue += due;
          pendingDueAmount += due;
        }
      } catch (calcError) {
        console.error("Error calculating metrics for invoice:", invoice.id, calcError);
      }
    });

    return {
      totalRevenue: roundHalfUp(totalCollections), // Gross collections realized
      totalTaxableRevenue: roundHalfUp(totalTaxableRevenue),
      totalGstAmount: roundHalfUp(totalGstAmount),
      totalBilledTurnover: roundHalfUp(totalBilledTurnover),
      paidInvoices: {
        count: paidInvoicesCount,
        amount: roundHalfUp(paidInvoicesAmount),
      },
      partialInvoices: {
        count: partialInvoicesCount,
        paidAmount: roundHalfUp(partialInvoicesPaid),
        dueAmount: roundHalfUp(partialInvoicesDue),
      },
      unpaidInvoices: {
        count: unpaidInvoicesCount,
        dueAmount: roundHalfUp(unpaidInvoicesDue),
      },
      pendingDueAmount: roundHalfUp(pendingDueAmount),
      discountsAndRefunds: {
        discounts: roundHalfUp(totalDiscounts),
        refunds: roundHalfUp(totalRefunds),
        total: roundHalfUp(totalDiscounts + totalRefunds),
      },
      dateRange: {
        startDate: startOfDay,
        endDate: endOfDay,
      },
      totalInvoices: invoices.length,
    };
  } catch (error) {
    console.error("Error in getBillingMetrics:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to load billing metrics");
  }
};

// =======================================================
// PROCESS REFUND
// =======================================================

export const processRefund = async (data: {
  invoiceId: string;
  amount: number;
  reason: string;
  refundMethod: string;
  transactionId?: string;
  userId?: string;
}) => {
  try {
    // Validate input data
    if (!data.invoiceId) {
      throw new Error("Invoice ID is required");
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error("Refund amount must be greater than 0");
    }
    if (!data.reason) {
      throw new Error("Refund reason is required");
    }
    if (!data.refundMethod) {
      throw new Error("Refund method is required");
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: {
        order: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const refundAmount = Number(data.amount);
    const grandTotal = Number(invoice.grandTotal) || 0;

    // Calculate total refunded amount
    const totalRefunded = invoice.order?.payments
      ?.filter((p) => p.status === "REFUNDED")
      ?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    // Check if refund amount is valid
    if (refundAmount <= 0) {
      throw new Error("Refund amount must be greater than 0");
    }

    if (totalRefunded + refundAmount > grandTotal) {
      throw new Error("Total refund amount cannot exceed invoice total");
    }

    // Generate receipt number for refund
    const receiptNumber = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create refund payment record
    const refundPayment = await prisma.payment.create({
      data: {
        receiptNumber,
        orderId: invoice.orderId,
        amount: -refundAmount, // Negative amount for refund
        method: data.refundMethod as any,
        status: "REFUNDED",
        transactionId: data.transactionId,
        remarks: `Refund: ${data.reason}`,
        receivedById: data.userId,
      },
    });

    // Update invoice payment status
    const totalPaid = invoice.order?.payments
      ?.filter((p) => p.status === "PAID")
      ?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    const newTotalRefunded = totalRefunded + refundAmount;
    let newPaymentStatus: "PENDING" | "PARTIAL" | "PAID" | "REFUNDED";

    if (newTotalRefunded >= grandTotal) {
      newPaymentStatus = "REFUNDED";
    } else if (totalPaid - newTotalRefunded <= 0) {
      newPaymentStatus = "PENDING";
    } else if (totalPaid - newTotalRefunded < grandTotal) {
      newPaymentStatus = "PARTIAL";
    } else {
      newPaymentStatus = "PAID";
    }

    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: { paymentStatus: newPaymentStatus },
    });

    await prisma.order.update({
      where: { id: invoice.orderId },
      data: { paymentStatus: newPaymentStatus },
    });

    return {
      success: true,
      refundPayment,
      newPaymentStatus,
      refundAmount,
      totalRefunded: newTotalRefunded,
    };
  } catch (error) {
    console.error("Error in processRefund:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to process refund");
  }
};