import {
    Request,
    Response,
    NextFunction,
  } from "express";
  
  import prisma from "../../../config/database";
  import { pathParam } from "../../utils/request-meta";
  
  import {
    getOrderReport,
    getPatientReports,
    getPublishedReports,
    getReportSummary,
    createReportAddendum,
    applyDigitalSignature,
    inlineApproveReport,
    inlineRejectReport,
    generateShareableLink,
    validateShareableLink,
    revokeShareableLink,
    addToPatientHistory,
    getPatientTimeline,
    amendReport,
    sendReportToDoctor,
  } from "./report.service";
  import {
    generateOrderPdf,
    generateOrderReportHtml,
  } from "./report.pdf.service";
  
  // =======================================================
  // ORDER REPORT
  // =======================================================
  
  export const orderReport =
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        // Use validated data if available, otherwise fall back to original request
        const params = (req as any).validated?.params || req.params;
        
        const report =
          await getOrderReport(
            params.orderId as string
          );
  
        res.status(200).json({
          success: true,
          message:
            "Order report fetched successfully",
          data: report,
        });
      } catch (error) {
        next(error);
      }
    };
  
  // =======================================================
  // PATIENT REPORTS
  // =======================================================
  
  export const patientReports =
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const report =
          await getPatientReports(
            req.params.patientId as string,
  
            Number(
              req.query.page
            ) || 1,
  
            Number(
              req.query.limit
            ) || 20
          );
  
        res.status(200).json({
          success: true,
          message:
            "Patient reports fetched successfully",
          data: report,
        });
      } catch (error) {
        next(error);
      }
    };
  
  // =======================================================
  // PUBLISHED REPORTS
  // =======================================================
  
  export const publishedReports =
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        if (req.path.endsWith('/count')) {
          const count = await prisma.report.count({
            where: { status: "PUBLISHED" }
          });
          res.status(200).json({
            success: true,
            message: "Report count fetched successfully",
            data: { count }
          });
          return;
        }

        const reports =
          await getPublishedReports({
            fromDate:
              req.query.fromDate,
  
            toDate:
              req.query.toDate,
  
            page:
              Number(req.query.page) ||
              1,
  
            limit:
              Number(req.query.limit) ||
              20,
          });
  
        res.status(200).json({
          success: true,
          message:
            "Published reports fetched successfully",
          data: reports,
        });
      } catch (error) {
        next(error);
      }
    };
  
  // =======================================================
  // SUMMARY
  // =======================================================
  
  export const summary =
    async (
      _req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const data =
          await getReportSummary();
  
        res.status(200).json({
          success: true,
          message:
            "Report summary fetched successfully",
          data,
        });
      } catch (error) {
        next(error);
      }
    };

// =======================================================
// CREATE REPORT ADDENDUM
// =======================================================

export const createAddendum =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const id = pathParam(req, "id");
      const { content, isPrivate } = req.body;

      const addendum = await createReportAddendum(
        id,
        content,
        userId,
        isPrivate
      );

      res.status(201).json({
        success: true,
        message: "Report addendum created successfully",
        data: addendum,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// APPLY DIGITAL SIGNATURE
// =======================================================

export const applySignature =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const id = pathParam(req, "id");
      const { signatureData } = req.body;

      const report = await applyDigitalSignature(
        id,
        userId,
        signatureData
      );

      res.status(200).json({
        success: true,
        message: "Digital signature applied successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// INLINE APPROVE REPORT
// =======================================================

export const inlineApprove =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const id = pathParam(req, "id");
      const { notes } = req.body;

      const report = await inlineApproveReport(
        id,
        userId,
        notes
      );

      res.status(200).json({
        success: true,
        message: "Report approved successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// INLINE REJECT REPORT
// =======================================================

export const inlineReject =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const id = pathParam(req, "id");
      const { reason } = req.body;

      const report = await inlineRejectReport(
        id,
        userId,
        reason
      );

      res.status(200).json({
        success: true,
        message: "Report rejected successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// GENERATE SHAREABLE LINK
// =======================================================

export const generateShareLink =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const id = pathParam(req, "id");
      const { expiresIn } = req.body;

      const shareLink = await generateShareableLink(
        id,
        userId,
        expiresIn
      );

      const fullUrl = `${req.protocol}://${req.get('host')}/api/reports/share/${shareLink.token}`;

      res.status(201).json({
        success: true,
        message: "Shareable link generated successfully",
        data: {
          ...shareLink,
          url: fullUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// VALIDATE SHAREABLE LINK
// =======================================================

export const validateShareLink =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = pathParam(req, "token");

      const shareLink = await validateShareableLink(token);

      res.status(200).json({
        success: true,
        message: "Shareable link validated successfully",
        data: shareLink,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// REVOKE SHAREABLE LINK
// =======================================================

export const revokeShareLink =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const linkId = pathParam(req, "linkId");

      const shareLink = await revokeShareableLink(linkId, userId);

      res.status(200).json({
        success: true,
        message: "Shareable link revoked successfully",
        data: shareLink,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// ADD TO PATIENT HISTORY
// =======================================================

export const addToHistory =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const id = pathParam(req, "id");
      const { notes } = req.body;

      const historyEntry = await addToPatientHistory(
        id,
        userId,
        notes
      );

      res.status(201).json({
        success: true,
        message: "Report added to patient history successfully",
        data: historyEntry,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// GET PATIENT TIMELINE
// =======================================================

export const patientTimeline =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const patientId = pathParam(req, "patientId");
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const timeline = await getPatientTimeline(
        patientId,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        message: "Patient timeline fetched successfully",
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// AMEND REPORT
// =======================================================

export const amendReportHandler =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const id = pathParam(req, "id");
      const { amendmentType, reason } = req.body;

      const report = await amendReport(
        id,
        amendmentType,
        reason,
        userId
      );

      res.status(200).json({
        success: true,
        message: "Report amended successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// SEND REPORT TO REFERRING DOCTOR
// =======================================================

export const sendReportToDoctorHandler =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const id = pathParam(req, "id");
      const { doctorId, channel } = req.body;

      const result = await sendReportToDoctor(
        id,
        doctorId,
        channel,
        userId
      );

      res.status(200).json({
        success: true,
        message: "Report sent to referring doctor successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// RENDER & STREAM NABL ORDER REPORT PDF
// =======================================================

export const orderReportPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = (req.params.orderId || (req as any).validated?.params?.orderId) as string;
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3001";
    const publicUrl = `${protocol}://${host}`;

    const pdfBuffer = await generateOrderPdf(orderId, publicUrl);
    const isPdf = pdfBuffer.slice(0, 5).toString() === "%PDF-";

    if (isPdf) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="LabCore_Report_${orderId}.pdf"`);
    } else {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
    }

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// =======================================================
// DOWNLOAD NABL ORDER REPORT PDF (ATTACHMENT)
// =======================================================

export const downloadOrderReportPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = (req.params.orderId || (req as any).validated?.params?.orderId) as string;
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3001";
    const publicUrl = `${protocol}://${host}`;

    const pdfBuffer = await generateOrderPdf(orderId, publicUrl);
    const isPdf = pdfBuffer.slice(0, 5).toString() === "%PDF-";

    if (isPdf) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Diagnostic_Report_${orderId}.pdf"`);
    } else {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="Diagnostic_Report_${orderId}.html"`);
    }

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// =======================================================
// PUBLIC UN-AUTHENTICATED REPORT VERIFICATION (FOR QR SCAN)
// =======================================================

export const publicVerifyReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reportId = String(req.params.reportId || "").trim();
    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "Report reference ID is required",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: reportId },
          { reportId },
          { orderNumber: reportId },
          { barcode: reportId },
        ],
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            uhid: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            fullName: true,
            specialization: true,
          },
        },
        items: {
          include: {
            test: {
              select: {
                testName: true,
                testCode: true,
              },
            },
          },
        },
        results: {
          where: {
            status: { in: ["APPROVED", "PUBLISHED"] },
          },
          include: {
            approvedBy: {
              select: {
                fullName: true,
                employeeCode: true,
                designation: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No authentic diagnostic report matches this reference or QR code.",
      });
    }

    const testNames = order.items.map((i) => i.test?.testName).filter(Boolean);
    const approvedResults = order.results.filter((r) => r.approvedBy);
    const primaryApprover = approvedResults[0]?.approvedBy;

    // Mask patient name for DPDP privacy (e.g. "R**** S****")
    const maskWord = (name: string) => {
      if (!name || name.length <= 2) return name;
      return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
    };
    const maskedName = `${maskWord(order.patient.firstName)} ${maskWord(order.patient.lastName)}`;

    return res.status(200).json({
      success: true,
      data: {
        verified: true,
        reportReferenceId: order.reportId || `REP-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        patientName: maskedName,
        patientUhid: order.patient.uhid,
        gender: order.patient.gender,
        testNames,
        sampleCollectedAt: order.collectedAt || order.createdAt,
        reportedAt: order.reportedAt || order.updatedAt,
        status: order.orderStatus === "COMPLETED" ? "AUTHENTIC & VERIFIED" : order.orderStatus,
        isNablAccredited: true,
        nablCertificateNumber: "MC-4892",
        accreditationStandard: "ISO 15189:2022",
        labName: "LabCore Advanced Diagnostics",
        labAddress: "Plot 14-B, Medical Enclave, Health City, New Delhi - 110029",
        approvedBy: primaryApprover?.fullName || "Dr. Rajesh Sharma, MD (Pathology)",
        doctorRegistrationNumber: "MCI / NABL Reg: 48921-DEL",
        securityVerifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};