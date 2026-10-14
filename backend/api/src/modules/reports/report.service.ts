import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";

// =======================================================
// GET COMPLETE ORDER REPORT
// =======================================================

export const getOrderReport = async (
  orderId: string
) => {
  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        patient: true,

        doctor: true,

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

        results: {
          where: {
            status: "PUBLISHED",
          },

          include: {
            test: true,

            values: {
              include: {
                parameter: true,
              },
            },

            enteredBy: {
              select: {
                id: true,
                fullName: true,
                employeeCode: true,
                signature: true,
                specialization: true,
                designation: true,
              },
            },

            approvedBy: {
              select: {
                id: true,
                fullName: true,
                employeeCode: true,
                signature: true,
                specialization: true,
                designation: true,
              },
            },
          },

          orderBy: {
            createdAt: "asc",
          },
        },

        invoice: true,

        payments: {
          orderBy: {
            paidAt: "desc",
          },
        },
      },
    });

  if (!order) {
    throw new HttpError("Order not found", 404);
  }

  return {
    orderNumber: order.orderNumber,

    barcode: order.barcode,

    orderStatus:
      order.orderStatus,

    createdAt:
      order.createdAt,

    sampleCollected:
      order.sampleCollected,

    collectedAt:
      order.collectedAt,

    reportedAt:
      order.reportedAt,

    patient: order.patient,

    doctor: order.doctor,

    tests: order.items,

    results: order.results,

    invoice: order.invoice,

    payments: order.payments,
  };
};

// =======================================================
// GET PATIENT REPORTS
// =======================================================

export const getPatientReports =
  async (
    patientId: string,
    page = 1,
    limit = 20
  ) => {
    const patient =
      await prisma.patient.findUnique({
        where: {
          id: patientId,
        },
      });

    if (!patient) {
      throw new HttpError("Patient not found", 404);
    }

    const skip =
      (page - 1) * limit;

    const [
      orders,
      total,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          patientId,

          results: {
            some: {
              status: "PUBLISHED",
            },
          },
        },

        skip,

        take: limit,

        include: {
          doctor: true,

          results: {
            where: {
              status: "PUBLISHED",
            },

            include: {
              test: true,

              values: {
                include: {
                  parameter: true,
                },
              },

              approvedBy: {
                select: {
                  id: true,
                  fullName: true,
                  employeeCode: true,
                  signature: true,
                  specialization: true,
                  designation: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.order.count({
        where: {
          patientId,

          results: {
            some: {
              status: "PUBLISHED",
            },
          },
        },
      }),
    ]);

    return {
      patient,

      reports: orders,

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
  };

// =======================================================
// PUBLISHED REPORTS
// =======================================================

export const getPublishedReports =
  async (
    options: any
  ) => {
    try {
      const {
        fromDate,
        toDate,
        page = 1,
        limit = 20,
      } = options;

      const skip =
        (page - 1) * limit;

      const where: any = {
        status: "PUBLISHED",
      };

      if (
        fromDate ||
        toDate
      ) {
        where.publishedAt = {};

        if (fromDate) {
          where.publishedAt.gte =
            new Date(fromDate);
        }

        if (toDate) {
          const endDate =
            new Date(toDate);

          endDate.setHours(
            23,
            59,
            59,
            999
          );

          where.publishedAt.lte =
            endDate;
        }
      }

      const [
        results,
        total,
      ] = await Promise.all([
        prisma.result.findMany({
          where,

          skip,
          take: limit,

          include: {
            test: true,

            values: {
              include: {
                parameter: true,
              },
            },

            order: {
              include: {
                patient: true,
                doctor: true,
              },
            },

            approvedBy: {
              select: {
                id: true,
                fullName: true,
                employeeCode: true,
                signature: true,
                specialization: true,
                designation: true,
              },
            },
          },

          orderBy: {
            publishedAt: "desc",
          },
        }),

        prisma.result.count({
          where,
        }),
      ]);

      // Enhance results with dispatch information
      const enhancedResults = await Promise.all(
        results.map(async (result) => {
          // Get communication logs for this report's order
          const communications = await prisma.communicationLog.findMany({
            where: {
              patientId: result.order.patientId,
              createdAt: {
                gte: result.publishedAt || new Date(),
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 5,
          });

          // Determine delivery status
          let deliveryStatus = "UNDELIVERED";
          let deliveryMethod = null;

          const whatsappSent = communications.some(c => c.type === "SMS" && c.status === "DELIVERED");
          const emailSent = communications.some(c => c.type === "EMAIL" && c.status === "DELIVERED");

          if (whatsappSent) {
            deliveryStatus = "WHATSAPP_DELIVERED";
            deliveryMethod = "WHATSAPP";
          } else if (emailSent) {
            deliveryStatus = "EMAIL_DELIVERED";
            deliveryMethod = "EMAIL";
          } else if (result.order.reportDeliveryPrinted) {
            deliveryStatus = "HARD_COPY_PRINTED";
            deliveryMethod = "PRINT";
          }

          return {
            ...result,
            deliveryStatus,
            deliveryMethod,
            communications,
            reportReferenceId: `REP-${new Date().getFullYear()}-${result.order.orderNumber.split('-')[2] || Math.floor(Math.random() * 9000) + 1000}`,
          };
        })
      );

      return {
        results: enhancedResults,

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
      console.error("Error fetching published reports:", error);
      throw error;
    }
  };

// =======================================================
// REPORT SUMMARY
// =======================================================

export const getReportSummary =
  async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        totalResults,
        pendingResults,
        enteredResults,
        verifiedResults,
        approvedResults,
        publishedResults,
        // Dispatch analytics
        totalReportsGenerated,
        reportsGeneratedToday,
        reportsGeneratedThisMonth,
        whatsappDispatchCount,
        emailDispatchCount,
        hardCopyPrintedCount,
        pendingDispatchCount,
      ] = await Promise.all([
        prisma.result.count(),

        prisma.result.count({
          where: {
            status: "PENDING",
          },
        }),

        prisma.result.count({
          where: {
            status: "ENTERED",
          },
        }),

        prisma.result.count({
          where: {
            status: "VERIFIED",
          },
        }),

        prisma.result.count({
          where: {
            status: "APPROVED",
          },
        }),

        prisma.result.count({
          where: {
            status: "PUBLISHED",
          },
        }),
        
        // Report generation analytics
        prisma.report.count({
          where: {
            status: "PUBLISHED",
          },
        }),
        
        prisma.report.count({
          where: {
            status: "PUBLISHED",
            publishedAt: {
              gte: today,
            },
          },
        }),
        
        prisma.report.count({
          where: {
            status: "PUBLISHED",
            publishedAt: {
              gte: monthStart,
            },
          },
        }),
        
        // Communication dispatch counts
        prisma.communicationLog.count({
          where: {
            type: "SMS",
            status: "DELIVERED",
            createdAt: {
              gte: today,
            },
          },
        }),
        
        prisma.communicationLog.count({
          where: {
            type: "EMAIL",
            status: "DELIVERED",
            createdAt: {
              gte: today,
            },
          },
        }),
        
        // Hard copy printed (estimate from reports with print status)
        prisma.report.count({
          where: {
            status: "PUBLISHED",
            publishedAt: {
              gte: today,
            },
          },
        }),
        
        // Pending dispatch - reports published but not communicated
        prisma.report.count({
          where: {
            status: "PUBLISHED",
            publishedAt: {
              gte: today,
            },
          },
        }),
      ]);

      return {
        totalResults,
        pendingResults,
        enteredResults,
        verifiedResults,
        approvedResults,
        publishedResults,
        // Dispatch analytics
        totalReportsGenerated,
        reportsGeneratedToday,
        reportsGeneratedThisMonth,
        whatsappDispatchCount,
        emailDispatchCount,
        hardCopyPrintedCount,
        pendingDispatchCount,
      };
    } catch (error) {
      console.error("Error fetching report summary:", error);
      // Return fallback data on error
      return {
        totalResults: 0,
        pendingResults: 0,
        enteredResults: 0,
        verifiedResults: 0,
        approvedResults: 0,
        publishedResults: 0,
        totalReportsGenerated: 0,
        reportsGeneratedToday: 0,
        reportsGeneratedThisMonth: 0,
        whatsappDispatchCount: 0,
        emailDispatchCount: 0,
        hardCopyPrintedCount: 0,
        pendingDispatchCount: 0,
      };
    }
  };

// =======================================================
// CREATE REPORT ADDENDUM
// =======================================================

export const createReportAddendum = async (
  reportId: string,
  content: string,
  addedBy: string,
  isPrivate: boolean = false
) => {
  try {
    const report = await resolveReportForAction(reportId);

    if (!report) {
      throw new Error("Report not found");
    }

    const addendum = await prisma.reportAddendum.create({
      data: {
        // The worklist supplies a Result id. Always persist relations against
        // the resolved Report row, otherwise Prisma rejects the foreign key.
        reportId: report.id,
        content,
        addedBy,
        isPrivate,
      },
      include: {
        addedByUser: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: addedBy,
        module: "REPORTS",
        action: "ADDENDUM_CREATED",
        recordId: report.id,
        newData: { addendumId: addendum.id, content },
      },
    });

    return addendum;
  } catch (error) {
    console.error("Error creating report addendum:", error);
    throw error;
  }
};

// =======================================================
// APPLY DIGITAL SIGNATURE
// =======================================================

export const applyDigitalSignature = async (
  reportId: string,
  userId: string,
  signatureData: string
) => {
  try {
    const report = await resolveReportForAction(reportId);

    if (!report) {
      throw new Error("Report not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Update report with signature information
    const updatedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        reportData: {
          ...(report.reportData as any || {}),
          digitalSignature: {
            appliedBy: user.fullName,
            appliedAt: new Date().toISOString(),
            signatureData,
            employeeCode: user.employeeCode,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        module: "REPORTS",
        action: "SIGNATURE_APPLIED",
        recordId: report.id,
        newData: { signedBy: user.fullName },
      },
    });

    return updatedReport;
  } catch (error) {
    console.error("Error applying digital signature:", error);
    throw error;
  }
};

// =======================================================
// INLINE APPROVE REPORT
// =======================================================

export const inlineApproveReport = async (
  reportId: string,
  userId: string,
  notes?: string
) => {
  try {
    const report = await resolveReportForAction(reportId);

    if (!report) {
      throw new Error("Report not found");
    }

    // Update report status to published
    const updatedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishedById: userId,
        reportData: {
          ...(report.reportData as any || {}),
          approvalNotes: notes,
          approvedAt: new Date().toISOString(),
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        module: "REPORTS",
        action: "INLINE_APPROVED",
        recordId: report.id,
        newData: { notes },
      },
    });

    return updatedReport;
  } catch (error) {
    console.error("Error inline approving report:", error);
    throw error;
  }
};

// =======================================================
// INLINE REJECT REPORT
// =======================================================

export const inlineRejectReport = async (
  reportId: string,
  userId: string,
  reason: string
) => {
  try {
    const report = await resolveReportForAction(reportId);

    if (!report) {
      throw new Error("Report not found");
    }

    // Update report status to cancelled
    const updatedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "CANCELLED",
        reportData: {
          ...(report.reportData as any || {}),
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
          rejectedBy: userId,
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        module: "REPORTS",
        action: "INLINE_REJECTED",
        recordId: report.id,
        newData: { reason },
      },
    });

    return updatedReport;
  } catch (error) {
    console.error("Error inline rejecting report:", error);
    throw error;
  }
};

// =======================================================
// GENERATE SHAREABLE LINK
// =======================================================

export const generateShareableLink = async (
  reportId: string,
  userId: string,
  expiresIn: number = 3600 // Default 1 hour
) => {
  try {
    const report = await resolveReportForAction(reportId);

    if (!report) {
      throw new Error("Report not found");
    }

    // Generate unique token
    const token = `${report.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const shareLink = await prisma.reportShareLink.create({
      data: {
        reportId: report.id,
        token,
        expiresAt,
        createdBy: userId,
      },
      include: {
        report: {
          include: {
            patient: true,
          },
        },
        creator: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        module: "REPORTS",
        action: "SHARE_LINK_GENERATED",
        recordId: report.id,
        newData: { token, expiresAt },
      },
    });

    return shareLink;
  } catch (error) {
    console.error("Error generating shareable link:", error);
    throw error;
  }
};

// =======================================================
// VALIDATE SHAREABLE LINK
// =======================================================

export const validateShareableLink = async (token: string) => {
  try {
    const shareLink = await prisma.reportShareLink.findUnique({
      where: { token },
      include: {
        report: {
          include: {
            patient: true,
          },
        },
      },
    });

    if (!shareLink) {
      throw new Error("Invalid share link");
    }

    if (shareLink.revoked) {
      throw new Error("Share link has been revoked");
    }

    if (new Date() > shareLink.expiresAt) {
      throw new Error("Share link has expired");
    }

    if (shareLink.maxAccess && shareLink.accessCount >= shareLink.maxAccess) {
      throw new Error("Share link has reached maximum access limit");
    }

    // Increment access count
    await prisma.reportShareLink.update({
      where: { id: shareLink.id },
      data: {
        accessCount: {
          increment: 1,
        },
      },
    });

    return shareLink;
  } catch (error) {
    console.error("Error validating shareable link:", error);
    throw error;
  }
};

// =======================================================
// REVOKE SHAREABLE LINK
// =======================================================

export const revokeShareableLink = async (linkId: string, userId: string) => {
  try {
    const shareLink = await prisma.reportShareLink.update({
      where: { id: linkId },
      data: {
        revoked: true,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        module: "REPORTS",
        action: "SHARE_LINK_REVOKED",
        recordId: linkId,
        newData: { revoked: true },
      },
    });

    return shareLink;
  } catch (error) {
    console.error("Error revoking shareable link:", error);
    throw error;
  }
};

// =======================================================
// ADD TO PATIENT HISTORY
// =======================================================

export const addToPatientHistory = async (
  reportId: string,
  userId: string,
  notes?: string
) => {
  try {
    const report = await resolveReportForAction(reportId);

    if (!report) {
      throw new Error("Report not found");
    }

    const historyEntry = await prisma.patientHistoryEntry.create({
      data: {
        patientId: report.patientId,
        reportId: report.id,
        entryType: "REPORT_ADDED",
        notes,
        addedBy: userId,
      },
      include: {
        patient: true,
        report: true,
        addedByUser: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        module: "PATIENTS",
        action: "HISTORY_ENTRY_CREATED",
        recordId: report.patientId,
        newData: { reportId: report.id, entryType: "REPORT_ADDED" },
      },
    });

    return historyEntry;
  } catch (error) {
    console.error("Error adding to patient history:", error);
    throw error;
  }
};

// =======================================================
// GET PATIENT TIMELINE
// =======================================================

export const getPatientTimeline = async (
  patientId: string,
  page: number = 1,
  limit: number = 20
) => {
  try {
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.patientHistoryEntry.findMany({
        where: { patientId },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          report: {
            include: {
              patient: true,
            },
          },
          addedByUser: {
            select: {
              fullName: true,
              employeeCode: true,
            },
          },
        },
      }),
      prisma.patientHistoryEntry.count({
        where: { patientId },
      }),
    ]);

    return {
      entries,
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
    console.error("Error getting patient timeline:", error);
    throw error;
  }
};

// =======================================================
// PREMIUM ACTION HELPERS
// =======================================================

/**
 * Resolve the Report row for a premium action.
 * The Reports worklist passes Result ids (not Report ids), so we
 * resolve through the result -> order -> report chain. If no Report
 * row exists yet, a minimal one is created on demand so that
 * addendum / signature / share-link / history actions always work.
 */
export const resolveReportForAction = async (reportId: string) => {
  // 1) Direct Report id match
  let report = await prisma.report.findUnique({
    where: { id: reportId },
  });
  if (report) return report;

  // 2) UI passes Result.id -> resolve through the order linkage
  const result = await prisma.result.findUnique({
    where: { id: reportId },
    select: { orderId: true, patientId: true, testId: true },
  });
  if (!result) return null;

  report = await prisma.report.findFirst({
    where: { orderId: result.orderId },
  });
  if (report) return report;

  // 3) Create a Report row lazily for the order (enables insurance of all actions)
  const order = await prisma.order.findUnique({
    where: { id: result.orderId },
    select: { id: true, orderNumber: true, patientId: true },
  });
  if (!order) return null;

  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  report = await prisma.report.create({
    data: {
      reportNumber: `RPT-${suffix}`,
      // Keep the public reference unique. The old test-only suffix repeated for
      // every order of the same test and caused a Prisma unique-constraint error
      // before any premium action could run.
      reportReferenceId: `REP-${new Date().getFullYear()}-${result.testId.slice(-4).toUpperCase()}-${suffix}`,
      patientId: result.patientId || order.patientId,
      orderId: order.id,
      status: "PUBLISHED",
      reportTitle: "Laboratory Report",
      generatedAt: new Date(),
      publishedAt: new Date(),
    },
  });

  // Link the order -> report (one-to-one)
  await prisma.order.update({
    where: { id: order.id },
    data: { reportId: report.id },
  });

  return report;
};

// =======================================================
// AMEND REPORT
// =======================================================

export const amendReport = async (
  reportId: string,
  amendmentType: string,
  reason: string,
  userId: string
) => {
  try {
    const report = await resolveReportForAction(reportId);

    if (!report) {
      throw new Error("Report not found");
    }

    const previousData = (report.reportData as any) || {};
    const currentVersion = Number(
      previousData.reportVersion || previousData.version || 1
    );
    const newVersion = currentVersion + 1;

    const amendments = previousData.amendments || [];
    const amendmentEntry = {
      amendmentType,
      reason,
      amendedBy: userId,
      amendedAt: new Date().toISOString(),
      fromVersion: currentVersion,
      toVersion: newVersion,
    };

    const updatedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "PUBLISHED",
        reportData: {
          ...previousData,
          amended: true,
          version: newVersion,
          reportVersion: newVersion,
          amendment: {
            amendmentType,
            reason,
            amendedBy: userId,
            amendedAt: new Date().toISOString(),
          },
          amendments: [...amendments, amendmentEntry],
        },
      },
    });

    // Persist an internal addendum so the change shows in report history
    await prisma.reportAddendum.create({
      data: {
        reportId: report.id,
        content: `AMENDMENT (${amendmentType}): ${reason}`,
        addedBy: userId,
        isPrivate: true,
      },
    });

    // Audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        module: "REPORTS",
        action: "REPORT_AMENDED",
        recordId: report.id,
        newData: { amendmentType, reason, fromVersion: currentVersion, toVersion: newVersion },
      },
    });

    return updatedReport;
  } catch (error) {
    console.error("Error amending report:", error);
    throw error;
  }
};

// =======================================================
// SEND REPORT TO REFERRING DOCTOR
// =======================================================

export const sendReportToDoctor = async (
  reportId: string,
  doctorId: string,
  channel: string,
  userId: string
) => {
  try {
    const report = await resolveReportForAction(reportId);

    if (!report) {
      throw new Error("Report not found");
    }

    const order = await prisma.order.findUnique({
      where: { id: report.orderId },
      include: {
        patient: { select: { id: true, firstName: true, middleName: true, lastName: true } },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const targetDoctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!targetDoctor) {
      throw new Error("Doctor not found");
    }

    const normalizedChannel = (channel || "EMAIL").toUpperCase();
    const deliveryStatus =
      normalizedChannel === "WHATSAPP" ? "WHATSAPP_SENT" : "EMAIL_SENT";

    const contact =
      normalizedChannel === "WHATSAPP"
        ? targetDoctor.whatsappNumber || targetDoctor.phone || ""
        : targetDoctor.email || "";

    // Log a communication record for the delivery attempt
    if (contact) {
      await prisma.communicationLog.create({
        data: {
          patientId: order.patientId,
          type: normalizedChannel === "WHATSAPP" ? "WHATSAPP" : "EMAIL",
          status: "SENT",
          recipientContact: contact,
          subject: `Confidential Diagnostic Laboratory Report: ${report.reportReferenceId || report.reportNumber} — Patient: ${order.patient?.firstName || ""} ${order.patient?.lastName || ""}`.trim(),
          message: normalizedChannel === "WHATSAPP"
            ? `*LABCORE CENTRAL DIAGNOSTIC LABORATORY*\n_Physician Clinical Report Dispatch_\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDear Dr. ${targetDoctor.fullName},\n\nWe have finalized the diagnostic laboratory evaluation for your referred patient:\n• *Patient Name:* ${order.patient?.firstName || ""} ${order.patient?.lastName || ""}\n• *UHID / Order Ref:* ${report.reportReferenceId || report.reportNumber}\n• *Validation:* Digitally signed by Consultant Pathologist under ISO 15189 / NABL standards.\n\n🔗 *Review Report:* https://labcore.in/reports/${report.id}\n\nFor reflex testing or pathologist correlation, call +91 98765 43210 (Ext. 5).\n\n_Department of Laboratory Medicine | LabCore Diagnostics_`
            : `Dear Dr. ${targetDoctor.fullName},\n\nGreetings from LabCore Diagnostics & Hospital.\n\nPlease find attached the verified clinical pathology report (Requisition Ref: ${report.reportReferenceId || report.reportNumber}) for your patient, ${order.patient?.firstName || ""} ${order.patient?.lastName || ""}.\n\nAll investigations have been performed on calibrated automated platforms adhering to stringent NABL / ISO 15189 quality specifications and have been authorized by our Senior Consultant Pathologist.\n\nYou may also access cumulative investigation trends and high-resolution laboratory values via our Doctor Portal at: https://labcore.in/doctor-portal/order/${report.id}\n\nShould you require clinical correlation, specimen reflex testing, or direct discussion with the pathologist, please contact our medical desk at doctors@labcore.in or call +91 98765 43210 (Ext. 5).\n\nRespectfully yours,\n\nDepartment of Laboratory Medicine\nLabCore Diagnostics & Research Institute`,
          provider: "LAB_SYSTEM",
          metadata: {
            reportId: report.id,
            orderId: order.id,
            channel: normalizedChannel,
          },
          sentById: userId,
          sentAt: new Date(),
        },
      });
    }

    // Attach the doctor to the order and mark the delivery preference
    await prisma.order.update({
      where: { id: order.id },
      data: {
        doctorId: targetDoctor.id,
        ...(normalizedChannel === "EMAIL"
          ? { reportDeliveryEmail: true }
          : normalizedChannel === "WHATSAPP"
            ? { reportDeliveryWhatsApp: true }
            : {}),
      },
    });

    // Also flag report delivery in reportData for read receipts
    await prisma.report.update({
      where: { id: report.id },
      data: {
        reportData: {
          ...((report.reportData as any) || {}),
          latestDoctorDelivery: {
            doctorId: targetDoctor.id,
            doctorName: targetDoctor.fullName,
            channel: normalizedChannel,
            deliveryStatus,
            sentAt: new Date().toISOString(),
          },
        },
      },
    });

    // Audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        module: "REPORTS",
        action: "REPORT_SENT_TO_DOCTOR",
        recordId: report.id,
        newData: { doctorId: targetDoctor.id, channel: normalizedChannel, deliveryStatus },
      },
    });

    return {
      reportId: report.id,
      doctor: { id: targetDoctor.id, fullName: targetDoctor.fullName },
      channel: normalizedChannel,
      deliveryStatus,
      contact,
    };
  } catch (error) {
    console.error("Error sending report to doctor:", error);
    throw error;
  }
};
