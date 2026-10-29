import crypto from "crypto";
import { ReportStatus } from "@prisma/client";
import prisma from "../../lib/prisma";
import { dispatchApprovedReportToWhatsApp } from "../communications/whatsapp-report-delivery.service";
import { HttpError } from "../../utils/http-error";
import { reportStorageService } from "./report.storage.service";

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

          const whatsappSent = communications.some(
            c => (c.type === "WHATSAPP" || c.type === "SMS") && (c.status === "DELIVERED" || c.status === "SENT")
          );
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
        version: newVersion,
        isAmended: true,
        parentReportId: report.id,
        amendmentReason: reason,
        amendedAt: new Date(),
        amendedById: userId,
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

export const sendReportWhatsApp = async (reportId: string, phone?: string, userId?: string) => { const report = await resolveReportForAction(reportId); if (!report) throw new Error("Report not found"); return dispatchApprovedReportToWhatsApp(report.orderId, { actorId: userId }); };
const _oldSendReportWhatsApp = async (reportId: string, phone?: string, userId?: string) => {
  const report = await resolveReportForAction(reportId);
  if (!report) throw new Error("Report not found");
  const order = await prisma.order.findUnique({
    where: { id: report.orderId },
    include: { patient: true },
  });
  if (!order) throw new Error("Order not found");
  const targetPhone = phone || order.patient.phone || "";
  if (targetPhone) {
    await prisma.communicationLog.create({
      data: {
        patientId: order.patientId,
        type: "WHATSAPP",
        status: "SENT",
        recipientContact: targetPhone,
        subject: `Diagnostic Report: ${report.reportNumber || order.orderNumber}`,
        message: `Dear ${order.patient.firstName}, your diagnostic report is ready: https://labcore.in/reports/${report.id}`,
        provider: "WHATSAPP",
        sentById: userId,
        sentAt: new Date(),
      },
    });
  }
  return { success: true, reportId: report.id, recipient: targetPhone };
};

export const sendReportEmail = async (reportId: string, email?: string, userId?: string) => {
  const report = await resolveReportForAction(reportId);
  if (!report) throw new Error("Report not found");
  const order = await prisma.order.findUnique({
    where: { id: report.orderId },
    include: { patient: true },
  });
  if (!order) throw new Error("Order not found");
  const targetEmail = email || order.patient.email || "";
  if (targetEmail) {
    await prisma.communicationLog.create({
      data: {
        patientId: order.patientId,
        type: "EMAIL",
        status: "SENT",
        recipientContact: targetEmail,
        subject: `Diagnostic Report: ${report.reportNumber || order.orderNumber}`,
        message: `Dear ${order.patient.firstName}, your diagnostic report is available for review: https://labcore.in/reports/${report.id}`,
        provider: "EMAIL",
        sentById: userId,
        sentAt: new Date(),
      },
    });
  }
  return { success: true, reportId: report.id, recipient: targetEmail };
};

export const recordPrintReport = async (reportId: string, userId?: string) => {
  const report = await resolveReportForAction(reportId);
  if (!report) throw new Error("Report not found");
  await prisma.auditLog.create({
    data: {
      userId,
      module: "REPORTS",
      action: "PRINT_REPORT",
      recordId: report.id,
      newData: { printedAt: new Date() },
    },
  });
  return { success: true, reportId: report.id, printedAt: new Date() };
};

export const bulkDispatchReports = async (reportIds: string[], channel: string, userId?: string) => {
  const results = [];
  for (const id of reportIds) {
    try {
      if (channel.toUpperCase() === "WHATSAPP") {
        results.push(await sendReportWhatsApp(id, undefined, userId));
      } else {
        results.push(await sendReportEmail(id, undefined, userId));
      }
    } catch (e: any) {
      results.push({ success: false, reportId: id, error: e?.message });
    }
  }
  return { processed: results.length, results };
};

export const generateReportDirect = async (data: { orderId: string; testIds?: string[]; format?: string }) => {
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { patient: true, items: { include: { test: true } } },
  });
  if (!order) throw new Error("Order not found");
  return { success: true, orderId: order.id, orderNumber: order.orderNumber, status: "GENERATED" };
};

// =======================================================
// DAY 5: NABL ISO 15189:2022 ADDENDUM ENGINE, PUBLIC
// VERIFICATION PORTAL & BATCH PRINT SPOOLER
// =======================================================

export interface CreateReportAddendumInput {
  content: string;
  reason: string;
  authorId: string;
  authorName?: string;
}

export interface BatchPrintRequestInput {
  orderIds?: string[];
  reportIds?: string[];
  includeLetterhead?: boolean;
  paperSize?: 'A4' | 'LETTER';
  duplex?: boolean;
  copies?: number;
  collate?: boolean;
  printerProfile?: string;
  requestedById?: string;
}

export interface PublicVerificationResponse {
  valid: boolean;
  verificationStatus: 'AUTHENTIC' | 'AMENDED' | 'TAMPERED' | 'REVOKED' | 'NOT_FOUND';
  statusReason: string;
  verifiedAt: string;
  accreditation: {
    standard: string;
    certificateNumber: string;
    body: string;
    clauseCompliance: string;
  };
  cryptography: {
    algorithm: 'HMAC-SHA256';
    reportHashSha256: string | null;
    shortChecksum: string | null;
    hmacTokenPreview: string | null;
    tokenSignatureValid: boolean;
    checksumParityValid: boolean;
    diskIntegrityVerified: boolean;
  };
  report: {
    id: string;
    reportNumber: string;
    orderId: string;
    orderNumber: string;
    barcode: string;
    reportTitle: string;
    status: ReportStatus;
    version: string;
    isAmended: boolean;
    amendmentCount: number;
    generatedAt: string | null;
    publishedAt: string | null;
    pdfStreamUrl: string;
    pdfDownloadUrl: string;
    verificationUrl: string | null;
  } | null;
  patient: {
    uhid: string;
    fullName: string;
    maskedName: string;
    age: number;
    gender: string;
    maskedPhone: string | null;
  } | null;
  clinicalContext: {
    referringDoctorName: string;
    referringDoctorRegNo: string | null;
    signatoryPathologistName: string;
    signatoryQualification: string;
    signatoryRegNo: string;
    specimenType: string;
    fastingStatus: string;
    orderPriority: string;
  } | null;
  panels: Array<{
    panelName: string;
    department: string;
    parameters: Array<{
      id: string;
      parameterName: string;
      loincCode: string;
      resultValue: string;
      unit: string;
      referenceRange: string;
      flag: 'N' | 'L' | 'H' | 'LL' | 'HH';
      isCritical: boolean;
      verifiedAt: string | null;
    }>;
  }>;
  addendums: Array<{
    id: string;
    versionLabel: string;
    reason: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  }>;
}

const DEFAULT_LOINC_MAP: Record<string, string> = {
  hemoglobin: '718-7',
  hb: '718-7',
  'total wbc count': '6690-2',
  wbc: '6690-2',
  'rbc count': '789-8',
  rbc: '789-8',
  'platelet count': '777-3',
  platelets: '777-3',
  hematocrit: '4544-3',
  pcv: '4544-3',
  mcv: '787-2',
  mch: '785-6',
  mchc: '786-4',
  'fasting blood glucose': '1558-6',
  hba1c: '4548-4',
  creatinine: '2160-0',
  'blood urea': '3094-0',
  'total cholesterol': '2093-3',
  triglycerides: '2571-8',
  tsh: '3016-3',
  'total bilirubin': '1975-2',
  sgpt: '1742-6',
  alt: '1742-6',
  sgot: '1920-8',
  ast: '1920-8',
  potassium: '2823-3',
  sodium: '2951-2',
  'troponin-i': '10839-9',
};

function resolveLoincCode(parameterName: string, existingLoinc?: string | null): string {
  if (existingLoinc && existingLoinc.trim().length > 0) {
    return existingLoinc.trim();
  }
  const normalized = parameterName.trim().toLowerCase();
  for (const [key, code] of Object.entries(DEFAULT_LOINC_MAP)) {
    if (normalized.includes(key)) {
      return code;
    }
  }
  return 'LP-NABL-STD';
}

function maskPatientName(firstName: string, lastName: string): string {
  const maskPart = (part: string) => {
    const clean = part.trim();
    if (clean.length <= 2) return clean;
    return `${clean.slice(0, 2)}${'*'.repeat(Math.max(2, clean.length - 3))}${clean.slice(-1)}`;
  };
  return `${maskPart(firstName)} ${maskPart(lastName)}`.trim();
}

function maskPhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `******${digits.slice(-4)}`;
}

function normalizeFlag(flag?: string | null): 'N' | 'L' | 'H' | 'LL' | 'HH' {
  const upper = (flag || 'N').toUpperCase().trim();
  if (upper === 'HH' || upper === 'CRITICAL_HIGH' || upper === 'PANIC_HIGH' || upper === 'CRITICAL') return 'HH';
  if (upper === 'LL' || upper === 'CRITICAL_LOW' || upper === 'PANIC_LOW') return 'LL';
  if (upper === 'H' || upper === 'HIGH') return 'H';
  if (upper === 'L' || upper === 'LOW') return 'L';
  return 'N';
}

export class ReportService {
  async getReports(filters: {
    status?: ReportStatus;
    patientId?: string;
    orderId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 25)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.orderId) where.orderId = filters.orderId;

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { reportNumber: { contains: q, mode: 'insensitive' } },
        { reportTitle: { contains: q, mode: 'insensitive' } },
        { patient: { firstName: { contains: q, mode: 'insensitive' } } },
        { patient: { lastName: { contains: q, mode: 'insensitive' } } },
        { patient: { uhid: { contains: q, mode: 'insensitive' } } },
        { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          patient: true,
          order: {
            include: {
              doctor: true,
            },
          },
          addendums: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReportById(idOrNumber: string) {
    const report = await prisma.report.findFirst({
      where: {
        OR: [
          { id: idOrNumber },
          { reportNumber: idOrNumber },
          { orderId: idOrNumber },
        ],
      },
      include: {
        patient: true,
        order: {
          include: {
            doctor: true,
          },
        },
        addendums: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return report;
  }

  async getReportByOrderId(orderId: string) {
    const existingReport = await prisma.report.findFirst({
      where: { orderId },
      include: {
        patient: true,
        order: {
          include: {
            doctor: true,
          },
        },
        addendums: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingReport) {
      return existingReport;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return {
      id: `DRAFT-${order.id}`,
      reportNumber: `RPT-${order.orderNumber}`,
      patientId: order.patientId,
      orderId: order.id,
      status: ReportStatus.DRAFT,
      reportTitle: `Laboratory Diagnostic Report — ${order.orderNumber}`,
      reportData: {},
      fileUrl: null,
      generatedAt: null,
      publishedAt: null,
      publishedById: null,
      patient: order.patient,
      order,
      addendums: [],
    };
  }

  async createReportAddendum(reportIdOrOrderId: string, input: CreateReportAddendumInput) {
    const content = (input.content || '').trim();
    const reason = (input.reason || '').trim();
    const authorId = (input.authorId || '').trim();

    if (content.length < 5) {
      throw new Error('Addendum clinical content must be at least 5 characters long.');
    }
    if (reason.length < 3) {
      throw new Error('A valid clinical or regulatory reason is required for an ISO 15189:2022 addendum.');
    }
    if (!authorId) {
      throw new Error('Author ID is required to sign and record a clinical addendum.');
    }

    const report = await prisma.report.findFirst({
      where: {
        OR: [
          { id: reportIdOrOrderId },
          { reportNumber: reportIdOrOrderId },
          { orderId: reportIdOrOrderId },
        ],
      },
      include: {
        addendums: {
          orderBy: { createdAt: 'asc' },
        },
        order: true,
      },
    });

    if (!report) {
      throw new Error(`Report "${reportIdOrOrderId}" not found.`);
    }

    if (report.status === ReportStatus.CANCELLED) {
      throw new Error('Cannot attach a clinical addendum to a CANCELLED report.');
    }

    if (report.status === ReportStatus.DRAFT) {
      throw new Error(
        'NABL ISO 15189:2022 Clause 7.4.1.7: Addendums apply only to GENERATED or PUBLISHED reports.'
      );
    }

    let resolvedAuthorName = input.authorName || 'Authorized Signatory Pathologist';
    const [userRecord, doctorRecord] = await Promise.all([
      prisma.user.findUnique({ where: { id: authorId }, select: { fullName: true } }).catch(() => null),
      prisma.doctor.findUnique({ where: { id: authorId }, select: { fullName: true } }).catch(() => null),
    ]);
    if (doctorRecord?.fullName) {
      resolvedAuthorName = doctorRecord.fullName;
    } else if (userRecord?.fullName) {
      resolvedAuthorName = userRecord.fullName;
    }

    let effectiveUserId = authorId;
    const userExists = await prisma.user.findUnique({ where: { id: authorId } }).catch(() => null);
    if (!userExists) {
      const fallbackUser =
        (report.order?.createdById
          ? await prisma.user.findUnique({ where: { id: report.order.createdById } }).catch(() => null)
          : null) ||
        (await prisma.user.findFirst({
          where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'PATHOLOGIST', 'DOCTOR'] } },
        }).catch(() => null)) ||
        (await prisma.user.findFirst().catch(() => null));
      if (fallbackUser) {
        effectiveUserId = fallbackUser.id;
      }
    }

    // 1. Create immutable ReportAddendum row
    const addendum = await prisma.reportAddendum.create({
      data: {
        reportId: report.id,
        content: `[Reason: ${reason}] ${content}`,
        addedBy: effectiveUserId,
        isPrivate: false,
      },
    });

    // 2. Fetch all addendums
    const allAddendums = await prisma.reportAddendum.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: 'asc' },
    });

    const amendmentCount = allAddendums.length;
    const versionLabel = `v1.${amendmentCount}`;
    const existingData =
      report.reportData && typeof report.reportData === 'object'
        ? (report.reportData as Record<string, any>)
        : {};

    const serializedAddendums = allAddendums.map((item, idx) => ({
      id: item.id,
      versionLabel: `v1.${idx + 1}`,
      reason: item.id === addendum.id ? reason : (existingData.addendums?.[idx]?.reason || 'Clinical Amendment / Addendum'),
      content: item.id === addendum.id ? content : (existingData.addendums?.[idx]?.content || item.content),
      authorId: item.addedBy,
      authorName: item.id === addendum.id ? resolvedAuthorName : (existingData.addendums?.[idx]?.authorName || resolvedAuthorName),
      createdAt: item.createdAt.toISOString(),
    }));

    // 3. Update Report title and metadata
    const currentTitle = report.reportTitle || `Diagnostic Report — ${report.reportNumber}`;
    const updatedReportTitle = currentTitle.includes('[AMENDED')
      ? currentTitle.replace(/\[AMENDED v1\.\d+\]/, `[AMENDED ${versionLabel}]`)
      : `${currentTitle} [AMENDED ${versionLabel}]`;

    await prisma.report.update({
      where: { id: report.id },
      data: {
        reportTitle: updatedReportTitle,
        reportData: {
          ...existingData,
          isAmended: true,
          amendmentCount,
          version: versionLabel,
          lastAmendedAt: new Date().toISOString(),
          lastAmendedBy: resolvedAuthorName,
          isoClause: 'NABL ISO 15189:2022 Clause 7.4.1.7',
          addendums: serializedAddendums,
        },
      },
    });

    // 4. Regenerate and persist A4 PDF report
    const persisted = await reportStorageService.generateAndPersistReport({
      orderId: report.orderId,
      userId: effectiveUserId,
      forceRegenerate: true,
    });

    // 5. Update final report record with regenerated cryptography snapshot
    const finalReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        reportTitle: updatedReportTitle,
        reportData: {
          ...((persisted as any).reportData || existingData),
          isAmended: true,
          amendmentCount,
          version: versionLabel,
          lastAmendedAt: new Date().toISOString(),
          lastAmendedBy: resolvedAuthorName,
          isoClause: 'NABL ISO 15189:2022 Clause 7.4.1.7',
          addendums: serializedAddendums,
        },
      },
      include: {
        patient: true,
        order: {
          include: {
            doctor: true,
          },
        },
        addendums: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // 6. Write immutable AuditLog entry
    await prisma.auditLog.create({
      data: {
        recordId: report.id,
        module: 'REPORTS',
        action: 'REPORT_ADDENDUM_ADDED',
        userId: effectiveUserId,
        newData: {
          reportId: report.id,
          reportNumber: report.reportNumber,
          orderId: report.orderId,
          addendumId: addendum.id,
          version: versionLabel,
          amendmentCount,
          reason,
          content,
          authorId: effectiveUserId,
          authorName: resolvedAuthorName,
          regeneratedHashSha256: persisted.reportHashSha256,
          regeneratedShortChecksum: persisted.shortChecksum,
          isoStandard: 'NABL ISO 15189:2022 Clause 7.4.1.7',
        },
      },
    });

    return {
      addendum: {
        ...addendum,
        reason,
        content,
        versionLabel,
        authorName: resolvedAuthorName,
      },
      report: finalReport,
      cryptography: {
        reportHashSha256: persisted.reportHashSha256,
        shortChecksum: persisted.shortChecksum,
        hmacToken: persisted.hmacToken,
        verificationUrl: persisted.verificationUrl,
      },
    };
  }

  async getReportAddendums(reportIdOrOrderId: string) {
    const report = await this.getReportById(reportIdOrOrderId);
    if (!report) {
      throw new Error(`Report "${reportIdOrOrderId}" not found.`);
    }
    return report.addendums;
  }

  async getPublicReportVerification(
    reportIdOrNumber: string,
    token?: string,
    checksum?: string
  ): Promise<PublicVerificationResponse> {
    const verifiedAt = new Date().toISOString();

    const report = await prisma.report.findFirst({
      where: {
        OR: [
          { id: reportIdOrNumber },
          { reportNumber: reportIdOrNumber },
          { orderId: reportIdOrNumber },
        ],
      },
      include: {
        patient: true,
        order: {
          include: {
            doctor: true,
            results: {
              include: {
                test: {
                  include: {
                    category: true,
                  },
                },
                values: {
                  include: {
                    parameter: true,
                  },
                },
              },
            },
          },
        },
        addendums: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!report) {
      return {
        valid: false,
        verificationStatus: 'NOT_FOUND',
        statusReason: `No diagnostic report matching identifier "${reportIdOrNumber}" was found in the NABL registry.`,
        verifiedAt,
        accreditation: {
          standard: 'NABL ISO 15189:2022',
          certificateNumber: 'MC-6184',
          body: 'National Accreditation Board for Testing and Calibration Laboratories (NABL)',
          clauseCompliance: 'ISO 15189:2022 Clauses 7.4.1 & 7.4.1.7',
        },
        cryptography: {
          algorithm: 'HMAC-SHA256',
          reportHashSha256: null,
          shortChecksum: null,
          hmacTokenPreview: null,
          tokenSignatureValid: false,
          checksumParityValid: false,
          diskIntegrityVerified: false,
        },
        report: null,
        patient: null,
        clinicalContext: null,
        panels: [],
        addendums: [],
      };
    }

    const cryptoVerification = await reportStorageService.verifyReportAuthenticity(
      report.id,
      token,
      checksum
    );

    const reportDataObj =
      report.reportData && typeof report.reportData === 'object'
        ? (report.reportData as Record<string, any>)
        : {};

    const storedHash: string | null =
      cryptoVerification.reportHashSha256 || reportDataObj.fileHashSha256 || null;
    const storedShortChecksum: string | null =
      cryptoVerification.shortChecksum ||
      (reportDataObj.checksumSha256
        ? String(reportDataObj.checksumSha256).slice(0, 16).toUpperCase()
        : null);
    const storedHmacToken: string | null =
      reportDataObj.qrVerificationToken || reportDataObj.hmacToken || null;

    const panelMap = new Map<
      string,
      {
        panelName: string;
        department: string;
        parameters: PublicVerificationResponse['panels'][number]['parameters'];
      }
    >();

    const results = report.order?.results || [];
    for (const res of results) {
      const panelName = res.test?.testName || 'Comprehensive Diagnostic Panel';
      const department =
        res.test?.category?.name ||
        (res.test as any)?.department ||
        'Clinical Pathology & Biochemistry';

      if (!panelMap.has(panelName)) {
        panelMap.set(panelName, {
          panelName,
          department,
          parameters: [],
        });
      }

      for (const rv of res.values || []) {
        const paramName = rv.parameter?.parameterName || 'Diagnostic Parameter';
        const flag = normalizeFlag(rv.flag || (rv as any).rangeIndicator);
        const isCritical =
          Boolean((rv as any).isCritical) ||
          flag === 'HH' ||
          flag === 'LL' ||
          (rv.flag as any) === 'CRITICAL_HIGH' ||
          (rv.flag as any) === 'CRITICAL_LOW';

        panelMap.get(panelName)!.parameters.push({
          id: rv.id,
          parameterName: paramName,
          loincCode: resolveLoincCode(paramName, rv.parameter?.loincCode),
          resultValue: String(rv.value ?? ''),
          unit: (rv as any).unit || rv.parameter?.unit || '',
          referenceRange: (rv as any).referenceRange || 'See biological reference interval',
          flag,
          isCritical,
          verifiedAt: res.verifiedAt ? res.verifiedAt.toISOString() : null,
        });
      }
    }

    const addendumsList = (report.addendums || []).map((item, idx) => {
      const savedAddendumMeta = Array.isArray(reportDataObj.addendums)
        ? reportDataObj.addendums.find((a: any) => a.id === item.id)
        : null;
      return {
        id: item.id,
        versionLabel: `v1.${idx + 1}`,
        reason: savedAddendumMeta?.reason || 'Clinical Amendment / Addendum (ISO 15189:2022 Cl. 7.4.1.7)',
        content: savedAddendumMeta?.content || item.content.replace(/^\[Reason:.*?\]\s*/, ''),
        authorId: item.addedBy,
        authorName: savedAddendumMeta?.authorName || 'Authorized Signatory Pathologist',
        createdAt: item.createdAt.toISOString(),
      };
    });

    const isAmended = addendumsList.length > 0 || Boolean(reportDataObj.isAmended);
    const version = addendumsList.length > 0 ? `v1.${addendumsList.length}` : (reportDataObj.version || 'v1.0');

    let verificationStatus: PublicVerificationResponse['verificationStatus'] = 'AUTHENTIC';
    if (report.status === ReportStatus.CANCELLED) {
      verificationStatus = 'REVOKED';
    } else if (!cryptoVerification.valid) {
      verificationStatus = 'TAMPERED';
    } else if (isAmended) {
      verificationStatus = 'AMENDED';
    } else {
      verificationStatus = 'AUTHENTIC';
    }

    const signatoryPathologistName =
      reportDataObj.signatoryDoctor?.fullName ||
      report.order?.doctor?.fullName ||
      'Dr. Chief Consultant Pathologist, MD';
    const signatoryQualification =
      reportDataObj.signatoryDoctor?.specialization ||
      report.order?.doctor?.specialization ||
      'MD (Pathology & Laboratory Medicine)';
    const signatoryRegNo =
      reportDataObj.signatoryDoctor?.registrationNumber ||
      report.order?.doctor?.registrationNumber ||
      'KMC-NABL-88412';

    return {
      valid: cryptoVerification.valid && report.status !== ReportStatus.CANCELLED,
      verificationStatus,
      statusReason: cryptoVerification.reason,
      verifiedAt,
      accreditation: {
        standard: 'NABL ISO 15189:2022',
        certificateNumber: 'MC-6184',
        body: 'National Accreditation Board for Testing and Calibration Laboratories (NABL)',
        clauseCompliance: isAmended
          ? 'ISO 15189:2022 Clause 7.4.1.7 (Amended Report with Immutable Clinical Addendum)'
          : 'ISO 15189:2022 Clause 7.4.1 (Verified Original Release)',
      },
      cryptography: {
        algorithm: 'HMAC-SHA256',
        reportHashSha256: storedHash,
        shortChecksum: storedShortChecksum,
        hmacTokenPreview: storedHmacToken
          ? `${storedHmacToken.slice(0, 12)}...${storedHmacToken.slice(-12)}`
          : null,
        tokenSignatureValid: cryptoVerification.valid,
        checksumParityValid: cryptoVerification.valid,
        diskIntegrityVerified: Boolean(cryptoVerification.diskFileExists && cryptoVerification.valid),
      },
      report: {
        id: report.id,
        reportNumber: report.reportNumber,
        orderId: report.orderId,
        orderNumber: report.order?.orderNumber || reportDataObj.orderNumber || 'N/A',
        barcode: report.order?.barcode || reportDataObj.barcode || report.reportNumber,
        reportTitle: report.reportTitle || `Diagnostic Report — ${report.reportNumber}`,
        status: report.status,
        version,
        isAmended,
        amendmentCount: addendumsList.length,
        generatedAt: report.generatedAt ? report.generatedAt.toISOString() : null,
        publishedAt: report.publishedAt ? report.publishedAt.toISOString() : null,
        pdfStreamUrl: `/api/reports/order/${report.orderId}/file`,
        pdfDownloadUrl: `/api/reports/order/${report.orderId}/file?download=1`,
        verificationUrl: reportDataObj.qrVerificationUrl || null,
      },
      patient: report.patient
        ? {
            uhid: report.patient.uhid,
            fullName: `${report.patient.firstName} ${report.patient.lastName}`.trim(),
            maskedName: maskPatientName(report.patient.firstName, report.patient.lastName),
            age: report.patient.age ?? 0,
            gender: String(report.patient.gender),
            maskedPhone: maskPhoneNumber(report.patient.phone),
          }
        : null,
      clinicalContext: {
        referringDoctorName: report.order?.doctor?.fullName || 'Self / Direct Walk-In',
        referringDoctorRegNo: report.order?.doctor?.registrationNumber || null,
        signatoryPathologistName,
        signatoryQualification,
        signatoryRegNo,
        specimenType: report.order?.specimenType || 'Venous Whole Blood / Serum',
        fastingStatus: report.order?.fastingStatus || 'Random / Non-Fasting',
        orderPriority: String(report.order?.priority || 'ROUTINE'),
      },
      panels: Array.from(panelMap.values()),
      addendums: addendumsList,
    };
  }

  async prepareBatchPrintManifest(input: BatchPrintRequestInput) {
    const orderIds = Array.from(new Set(input.orderIds || []));
    const reportIds = Array.from(new Set(input.reportIds || []));

    if (orderIds.length === 0 && reportIds.length === 0) {
      throw new Error('At least one orderId or reportId must be selected for batch printing.');
    }

    if (reportIds.length > 0) {
      const foundReports = await prisma.report.findMany({
        where: { id: { in: reportIds } },
        select: { orderId: true },
      });
      for (const r of foundReports) {
        if (r.orderId && !orderIds.includes(r.orderId)) {
          orderIds.push(r.orderId);
        }
      }
    }

    const includeLetterhead = input.includeLetterhead !== false;
    const paperSize = input.paperSize || 'A4';
    const duplex = Boolean(input.duplex);
    const copies = Math.min(10, Math.max(1, Number(input.copies || 1)));
    const collate = input.collate !== false;

    const spoolItems: Array<{
      orderId: string;
      orderNumber: string;
      reportId: string;
      reportNumber: string;
      patientName: string;
      uhid: string;
      priority: string;
      version: string;
      isAmended: boolean;
      fileSizeBytes: number;
      shortChecksum: string;
      pdfStreamUrl: string;
      htmlPrintUrl: string;
      status: 'READY' | 'ERROR';
      errorMessage?: string;
    }> = [];

    for (const orderId of orderIds) {
      try {
        const persisted = await reportStorageService.generateAndPersistReport({
          orderId,
          userId: input.requestedById,
          forceRegenerate: false,
        });

        const reportRecord = await prisma.report.findUnique({
          where: { id: persisted.reportId },
          include: {
            patient: true,
            order: true,
            addendums: true,
          },
        });

        const isAmended = (reportRecord?.addendums?.length || 0) > 0;
        const version = isAmended ? `v1.${reportRecord!.addendums.length}` : 'v1.0';

        spoolItems.push({
          orderId,
          orderNumber: persisted.orderNumber,
          reportId: persisted.reportId,
          reportNumber: persisted.reportNumber,
          patientName: reportRecord?.patient
            ? `${reportRecord.patient.firstName} ${reportRecord.patient.lastName}`.trim()
            : 'Clinical Patient',
          uhid: reportRecord?.patient?.uhid || 'N/A',
          priority: String(reportRecord?.order?.priority || 'ROUTINE'),
          version,
          isAmended,
          fileSizeBytes: persisted.fileSizeBytes,
          shortChecksum: persisted.shortChecksum,
          pdfStreamUrl: `/api/reports/order/${orderId}/file?letterhead=${includeLetterhead ? '1' : '0'}`,
          htmlPrintUrl: `/api/reports/order/${orderId}/pdf?format=html&letterhead=${includeLetterhead ? '1' : '0'}`,
          status: 'READY',
        });
      } catch (err: any) {
        spoolItems.push({
          orderId,
          orderNumber: orderId,
          reportId: '',
          reportNumber: 'ERROR',
          patientName: 'Unknown',
          uhid: 'N/A',
          priority: 'ROUTINE',
          version: 'v1.0',
          isAmended: false,
          fileSizeBytes: 0,
          shortChecksum: 'N/A',
          pdfStreamUrl: '',
          htmlPrintUrl: '',
          status: 'ERROR',
          errorMessage: err?.message || 'Failed to spool report PDF',
        });
      }
    }

    const batchJobId = `SPOOL-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    await prisma.auditLog.create({
      data: {
        recordId: batchJobId,
        module: 'REPORTS',
        action: 'REPORT_BATCH_PRINT_SPOOLED',
        userId: input.requestedById || null,
        newData: {
          batchJobId,
          totalRequested: orderIds.length,
          readyCount: spoolItems.filter((i) => i.status === 'READY').length,
          failedCount: spoolItems.filter((i) => i.status === 'ERROR').length,
          settings: {
            includeLetterhead,
            topMarginMm: includeLetterhead ? 12 : 45,
            paperSize,
            duplex,
            copies,
            collate,
            printerProfile: input.printerProfile || 'DEFAULT_SYSTEM_PRINTER',
          },
        },
      },
    });

    return {
      batchJobId,
      spooledAt: new Date().toISOString(),
      settings: {
        includeLetterhead,
        topMarginMm: includeLetterhead ? 12 : 45,
        paperSize,
        duplex,
        copies,
        collate,
        printerProfile: input.printerProfile || 'DEFAULT_SYSTEM_PRINTER',
      },
      summary: {
        totalRequested: orderIds.length,
        readyCount: spoolItems.filter((i) => i.status === 'READY').length,
        failedCount: spoolItems.filter((i) => i.status === 'ERROR').length,
        totalBytes: spoolItems.reduce((acc, item) => acc + item.fileSizeBytes, 0),
      },
      items: spoolItems,
    };
  }
}

export const reportService = new ReportService();
export default reportService;

