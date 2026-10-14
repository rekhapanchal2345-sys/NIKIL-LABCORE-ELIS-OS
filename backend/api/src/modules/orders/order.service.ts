import prisma from "../../../config/database";
import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import { getNextSequenceNumber } from "../../services/sequence.service";
import { HttpError } from "../../utils/http-error";

export const createOrder = async (
  data: any,
  userId?: string
) => {
  try {
    const patient =
      await prisma.patient.findUnique({
        where: {
          id: data.patientId,
        },
      });

    if (!patient) {
      throw new HttpError("Patient not found", 404);
    }

    if (data.doctorId) {
      const doctor =
        await prisma.doctor.findUnique({
          where: {
            id: data.doctorId,
          },
        });

      if (!doctor || !doctor.isActive) {
        throw new HttpError("Doctor not found or inactive", 404);
      }
    }

    const standaloneTestIds = data.items
      .filter((item: any) => item.itemType === "TEST" || (!item.itemType && item.testId))
      .map((item: any) => item.testId);

    const packageIds = data.items
      .filter((item: any) => item.itemType === "PACKAGE" || item.packageId)
      .map((item: any) => item.packageId);

    // Fetch standalone tests
    const tests = standaloneTestIds.length > 0 ? await prisma.test.findMany({
      where: { id: { in: standaloneTestIds }, isActive: true },
    }) : [];

    if (tests.length !== standaloneTestIds.length) {
      throw new HttpError("One or more tests are invalid or inactive", 400);
    }

    // Fetch user role for discount RBAC
    let userRole = "FRONT_DESK"; // Default fallback
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        userRole = user.role;
      }
    }

    // Fetch packages
    const packages = packageIds.length > 0 ? await prisma.testPackage.findMany({
      where: { id: { in: packageIds }, isActive: true },
      include: { items: { include: { test: true } } },
    }) : [];

    if (packages.length !== packageIds.length) {
      throw new HttpError("One or more packages are invalid or inactive", 400);
    }

    // Generate unique order number and barcode with collision prevention
    const timestamp = Date.now();
    const barcode = `SMP-${timestamp}`;

    let subtotal = 0;
    let totalDiscount = 0;
    
    const itemsToCreate: any[] = [];
    const testIdsInPackages = new Set<string>();

    // Process packages first
    for (const pkg of packages) {
      const requestItem = data.items.find((i: any) => i.packageId === pkg.id);
      const price = Number(pkg.totalPrice);
      const discount = Number(requestItem?.discount ?? 0);

      if (discount > price) {
        throw new HttpError(`Discount cannot exceed price for ${pkg.packageName}`, 400);
      }

      subtotal += price;
      totalDiscount += discount;

      // Add the package line item
      itemsToCreate.push({
        itemType: "PACKAGE",
        packageId: pkg.id,
        price,
        discount,
        finalPrice: price - discount,
      });

      // Expand tests
      for (const pItem of pkg.items) {
        if (!pItem.testId) continue;
        testIdsInPackages.add(pItem.testId);
        
        itemsToCreate.push({
          itemType: "TEST",
          testId: pItem.testId,
          packageId: pkg.id,
          price: 0,
          discount: 0,
          finalPrice: 0,
        });
      }
    }

    // Process standalone tests
    for (const test of tests) {
      if (testIdsInPackages.has(test.id)) {
        throw new HttpError(`Duplicate billing prevented: Test '${test.testName}' is already included in a selected package.`, 400);
      }
      
      const requestItem = data.items.find((i: any) => i.testId === test.id);
      const price = Number(test.price);
      const discount = Number(requestItem?.discount ?? 0);

      if (discount > price) {
        throw new HttpError(`Discount cannot exceed price for ${test.testName}`, 400);
      }

      subtotal += price;
      totalDiscount += discount;

      itemsToCreate.push({
        itemType: "TEST",
        testId: test.id,
        price,
        discount,
        finalPrice: price - discount,
      });
    }

    // RBAC Discount check
    if (totalDiscount > 0) {
      const isManagerOrAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(userRole);
      
      if (!isManagerOrAdmin) {
        const maxAllowedDiscount = subtotal * 0.10; // 10% max
        if (totalDiscount > maxAllowedDiscount) {
          throw new HttpError(`Unauthorized Discount: Front desk cannot exceed 10% (Max allowed: ₹${maxAllowedDiscount}). Manager override required.`, 403);
        }
      }
    }

  // Calculate GST and totals with strict 2-decimal rounding
  const gstRate = 0.18; // 18% GST
  const taxableAmount = Math.round((subtotal - totalDiscount) * 100) / 100;
  const gstAmount = Math.round((taxableAmount * gstRate) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;
  const paidAmount = Math.round(Number(data.paidAmount ?? 0) * 100) / 100;
  const dueAmount = Math.round((grandTotal - paidAmount) * 100) / 100;

  // Determine payment status
  let paymentStatus: PaymentStatus = "PENDING";
  if (paidAmount >= grandTotal) {
    paymentStatus = "PAID";
  } else if (paidAmount > 0) {
    paymentStatus = "PARTIAL";
  }

  return prisma.$transaction(async (tx) => {
    const orderNumber = await getNextSequenceNumber("ORD", "MAIN", tx);
    
    const order = await tx.order.create({
      data: {
        orderNumber,
        barcode,

        patientId: data.patientId,

        doctorId:
          data.doctorId,

        createdById:
          userId,

        orderStatus:
          "REGISTERED",

        paymentStatus,

        notes: data.notes,

        subtotal,
        discount: totalDiscount,
        discountCode: data.discountCode,
        paidAmount,
        gstAmount,
        grandTotal,
        dueAmount,

        reportDeliveryWhatsApp: data.reportDeliveryWhatsApp,
        reportDeliveryEmail: data.reportDeliveryEmail,
        reportDeliveryPrinted: data.reportDeliveryPrinted,
        reportDeliveryPortal: data.reportDeliveryPortal,

        priority: data.priority || "ROUTINE",
        collectionType: data.collectionType,
        homeCollectionAddress: data.homeCollectionAddress,

        items: {
          create: itemsToCreate,
        },
      },

      include: {
        patient: true,

        doctor: true,

        items: {
          include: {
            test: {
              include: {
                category: true,
                parameters: true,
              },
            },
          },
        },
      },
    });

    // Create samples and initial result records for each test with tracking events
    for (const item of order.items) {
      // Package rows have no individual test, so they never yield a sample.
      if (!item.testId || !item.test) continue;

      const timestamp = Date.now();
      const sample = await tx.sample.create({
        data: {
          sampleNumber: `SMP-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
          barcode: `BC-SMP-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
          patientId: order.patientId,
          orderId: order.id,
          testId: item.testId,
          sampleType: item.test.sampleType,
          status: "PENDING",
        },
      });

      // Auto-create initial Result record so patient appears immediately in tracking & pipeline
      const existingResult = await tx.result.findUnique({
        where: {
          orderId_testId: {
            orderId: order.id,
            testId: item.testId,
          },
        },
      });

      if (!existingResult) {
        await tx.result.create({
          data: {
            orderId: order.id,
            testId: item.testId,
            patientId: order.patientId,
            status: "PENDING",
            enteredAt: new Date(),
            values: {
              create: (item.test.parameters || []).map((p: any) => ({
                parameterId: p.id,
                value: "",
                flag: "NORMAL",
              })),
            },
          },
        });
      }

      // Create initial tracking event for order registration
      await tx.sampleTrackingHistory.create({
        data: {
          sampleId: sample.id,
          orderId: order.id,
          patientId: order.patientId,
          eventType: "ORDER_REGISTERED",
          status: "REGISTERED",
          notes: `Order ${orderNumber} registered for ${item.test.testName}`,
          performedById: userId,
          metadata: {
            orderNumber,
            sampleNumber: sample.sampleNumber,
            barcode: sample.barcode,
          },
        },
      });
    }

    // Auto-create Invoice for the order
    const invoiceNumber = await getNextSequenceNumber("INV", "MAIN", tx);
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        subtotal,
        discount: totalDiscount,
        taxableAmount,
        gstPercent: 18,
        cgstAmount: Math.round((gstAmount / 2) * 100) / 100,
        sgstAmount: Math.round((gstAmount / 2) * 100) / 100,
        igstAmount: 0,
        gstAmount,
        grandTotal,
        paymentStatus,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // If advance payment was recorded, register payment
    if (paidAmount > 0) {
      const validMethods: PaymentMethod[] = [
        "CASH",
        "CARD",
        "UPI",
        "NET_BANKING",
        "CHEQUE",
      ];
      const requested = data.paymentMethod as PaymentMethod | undefined;
      const method: PaymentMethod =
        requested && validMethods.includes(requested) ? requested : "CASH";
      const receiptNumber = await getNextSequenceNumber("REC", "MAIN", tx);
      await tx.payment.create({
        data: {
          receiptNumber,
          orderId: order.id,
          amount: paidAmount,
          method,
          remarks: data.paymentNotes || "Advance payment collected at registration",
        },
      });
    }

    return {
      ...order,
      invoice,
    };
  });
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
};

export const getOrders = async (
  options: any
) => {
  try {
    const {
      search,
      patientId,
      doctorId,
      orderStatus,
      paymentStatus,
      priority,
      dateFrom,
      dateTo,
      collectionType,
      page = 1,
      limit = 20,
    } = options;

    const skip =
      (page - 1) * limit;

    const andFilters: any[] = [];

    if (patientId) {
      andFilters.push({
        OR: [
          { patientId },
          { patient: { uhid: patientId } },
        ],
      });
    }

    if (doctorId) andFilters.push({ doctorId });
    if (orderStatus) andFilters.push({ orderStatus });
    if (paymentStatus) andFilters.push({ paymentStatus });
    if (priority) andFilters.push({ priority });
    if (collectionType) andFilters.push({ collectionType });
    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      andFilters.push({ createdAt: dateFilter });
    }

    if (search) {
      andFilters.push({
        OR: [
          {
            orderNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            barcode: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            patient: {
              firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          patient: {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          patient: {
            uhid: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          patient: {
            phone: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  const where: any = andFilters.length > 0 ? { AND: andFilters } : {};

    const [orders, total] =
      await Promise.all([
        prisma.order.findMany({
          where,

          skip,
          take: limit,

          include: {
            patient: {
              select: {
                id: true,
                uhid: true,
                firstName: true,
                middleName: true,
                lastName: true,
                phone: true,
                gender: true,
              },
            },

            doctor: {
              select: {
                id: true,
                doctorCode: true,
                fullName: true,
                specialization: true,
              },
            },

            items: {
              include: {
                test: {
                  select: {
                    id: true,
                    testCode: true,
                    testName: true,
                    sampleType: true,
                  },
                },
              },
            },

            invoice: true,

            payments: true,

            samples: {
              select: {
                id: true,
                sampleNumber: true,
                barcode: true,
                sampleType: true,
                status: true,
                collectedAt: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        }),

        prisma.order.count({
          where,
        }),
      ]);

    return {
      orders,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit
        ),
        hasNextPage:
          page * limit < total,
        hasPreviousPage:
          page > 1,
      },
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders from database');
  }
};

export const getOrderById =
  async (id: string) => {
    const order =
      await prisma.order.findUnique({
        where: { id },

        include: {
          patient: true,

          doctor: true,

          createdBy: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              role: true,
            },
          },

          items: {
            include: {
              test: {
                include: {
                  category: true,
                  parameters: {
                    include: {
                      referenceRanges: true,
                    },
                  },
                },
              },
            },
          },

          invoice: true,

          payments: {
            orderBy: {
              paidAt: "desc",
            },
          },

          results: {
            include: {
              test: true,
              values: {
                include: {
                  parameter: true,
                },
              },
            },
          },
        },
      });

    if (!order) {
      throw new Error(
        "Order not found"
      );
    }

    return order;
  };

export const updateOrder = async (
  id: string,
  data: any
) => {
  const order =
    await prisma.order.findUnique({
      where: { id },
      include: {
        patient: true
      }
    });

  if (!order) {
    throw new Error(
      "Order not found"
    );
  }

  if (
    order.orderStatus ===
      "COMPLETED" ||
    order.orderStatus ===
      "CANCELLED"
  ) {
    throw new Error(
      "Completed or cancelled orders cannot be modified"
    );
  }

  const updateData: any = {};
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.orderStatus !== undefined) updateData.orderStatus = data.orderStatus;
  if (data.doctorId !== undefined) updateData.doctorId = data.doctorId;
  if (data.priority !== undefined) updateData.priority = data.priority;

  const updatedOrder = await prisma.order.update({
    where: { id },

    data: updateData,

    include: {
      patient: true,
      doctor: true,
      items: {
        include: {
          test: true,
        },
      },
      samples: true,
    },
  });

  return updatedOrder;
};

export const collectSample =
  async (
    id: string,
    barcode?: string,
    userId?: string,
    metadata?: any
  ) => {
    const order =
      await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              test: true,
            },
          },
          samples: true,
          patient: true,
        },
      });

    if (!order) {
      throw new Error(
        "Order not found"
      );
    }

    if (
      order.orderStatus ===
      "CANCELLED"
    ) {
      throw new Error(
        "Cannot collect sample for cancelled order"
      );
    }

    const timestamp = Date.now();
    const finalBarcode = barcode && barcode.trim().length > 0
      ? barcode.trim()
      : (order.barcode || `ORD-BC-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`);

    const collectionTime = new Date();
    const performerId = userId || metadata?.collectedById;

    return prisma.$transaction(async (tx) => {
      // 1. Update Order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          barcode: finalBarcode,
          sampleCollected: true,
          collectedAt: collectionTime,
          orderStatus: "SAMPLE_COLLECTED",
        },
        include: {
          items: {
            include: {
              test: true,
            },
          },
          patient: true,
          samples: true,
        },
      });

      // 2. Ensure Samples exist and update them to COLLECTED
      if (order.samples && order.samples.length > 0) {
        for (const sample of order.samples) {
          const sampleBarcode = sample.barcode || `BC-SMP-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
          await tx.sample.update({
            where: { id: sample.id },
            data: {
              barcode: sampleBarcode,
              status: "COLLECTED",
              collectedAt: collectionTime,
              collectedById: performerId || null,
              collectionType: metadata?.collectionType || "WALK_IN",
              priority: metadata?.priority || "ROUTINE",
            },
          });

          // Create tracking history event
          await tx.sampleTrackingHistory.create({
            data: {
              sampleId: sample.id,
              orderId: order.id,
              patientId: order.patientId,
              eventType: "SAMPLE_COLLECTED",
              status: "COLLECTED",
              location: metadata?.location || "Phlebotomy Station",
              notes: metadata?.notes || `Sample ${sample.sampleNumber} collected (${metadata?.collectionType || 'Walk-in'})`,
              performedById: performerId || null,
              performedAt: collectionTime,
              metadata: {
                barcode: sampleBarcode,
                orderBarcode: finalBarcode,
                collectionType: metadata?.collectionType || "WALK_IN",
                priority: metadata?.priority || "ROUTINE",
                sampleQuality: metadata?.sampleQuality || "Adequate",
                sampleVolume: metadata?.sampleVolume || "Adequate",
              },
            },
          });
        }
      } else {
        // If order had no sample records created yet, create them from items
        for (const item of order.items) {
          // Package rows have no individual test, so they never yield a sample.
          if (!item.testId || !item.test) continue;

          const sampleNumber = `SMP-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
          const sampleBarcode = `BC-SMP-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

          const newSample = await tx.sample.create({
            data: {
              sampleNumber,
              barcode: sampleBarcode,
              patientId: order.patientId,
              orderId: order.id,
              testId: item.testId,
              sampleType: item.test.sampleType,
              status: "COLLECTED",
              collectedAt: collectionTime,
              collectedById: performerId || null,
              collectionType: metadata?.collectionType || "WALK_IN",
              priority: metadata?.priority || "ROUTINE",
            },
          });

          await tx.sampleTrackingHistory.create({
            data: {
              sampleId: newSample.id,
              orderId: order.id,
              patientId: order.patientId,
              eventType: "SAMPLE_COLLECTED",
              status: "COLLECTED",
              location: metadata?.location || "Phlebotomy Station",
              notes: metadata?.notes || `Sample ${sampleNumber} collected (${item.test.testName})`,
              performedById: performerId || null,
              performedAt: collectionTime,
              metadata: {
                barcode: sampleBarcode,
                orderBarcode: finalBarcode,
                collectionType: metadata?.collectionType || "WALK_IN",
                priority: metadata?.priority || "ROUTINE",
                testName: item.test.testName,
              },
            },
          });
        }
      }

      return updatedOrder;
    });
  };

export const cancelOrder =
  async (
    id: string,
    _reason?: string
  ) => {
    const order =
      await prisma.order.findUnique({
        where: { id },
      });

    if (!order) {
      throw new Error(
        "Order not found"
      );
    }

    if (
      order.orderStatus ===
      "COMPLETED"
    ) {
      throw new Error(
        "Completed order cannot be cancelled"
      );
    }

    if (
      order.orderStatus ===
      "CANCELLED"
    ) {
      throw new Error(
        "Order is already cancelled"
      );
    }

    return prisma.$transaction(async (tx) => {
      // Mark order as cancelled
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          orderStatus: "CANCELLED",
          paymentStatus: Number(order.paidAmount) > 0 ? "REFUNDED" : "PENDING",
        },
      });

      // Void the invoice
      await tx.invoice.updateMany({
        where: { orderId: id },
        data: {
          paymentStatus: Number(order.paidAmount) > 0 ? "REFUNDED" : "PENDING",
        },
      });

      // Reverse associated payments
      await tx.payment.updateMany({
        where: { orderId: id },
        data: {
          status: "REFUNDED",
          remarks: `Refunded due to order cancellation: ${_reason || "No reason provided"}`,
        },
      });

      return updatedOrder;
    });
  };