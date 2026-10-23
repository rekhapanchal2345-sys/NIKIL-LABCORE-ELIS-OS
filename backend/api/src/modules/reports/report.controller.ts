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
    sendReportWhatsApp,
    sendReportEmail,
    recordPrintReport,
    bulkDispatchReports,
    generateReportDirect,
    reportService,
  } from "./report.service";
  import {
    generateOrderPdf,
    generateOrderReportHtml,
  } from "./report.pdf.service";
  import { assertOrderClearedForReportDispatch } from "../approvals/panic-readback.service";
  import { reportStorageService } from "./report.storage.service";
  
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
// CREATE REPORT ADDENDUM (NABL ISO 15189:2022 CLAUSE 7.4.1.7)
// =======================================================

export const createAddendum =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req as any).user?.id || req.body?.authorId;
      const id = pathParam(req, "id");
      const { content, reason, authorName } = req.body;

      const result = await reportService.createReportAddendum(id, {
        content: content || req.body.clinicalNotes || '',
        reason: reason || 'Post-Analytical Clinical Correlation / Addendum',
        authorId: userId || 'SYSTEM-PATHOLOGIST',
        authorName,
      });

      res.status(201).json({
        success: true,
        message: "Report addendum recorded under NABL ISO 15189:2022 Clause 7.4.1.7 and PDF regenerated.",
        data: result,
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

export const streamOrderReportPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawId = (req.params.orderId || req.params.id || (req as any).validated?.params?.orderId) as string;
    let orderId = rawId;
    const report = await prisma.report.findUnique({
      where: { id: rawId },
      select: { orderId: true },
    });
    if (report?.orderId) {
      orderId = report.orderId;
    }

    // Enforce Day 2 Report Dispatch Guard so unacknowledged critical panic results cannot be dispatched
    await assertOrderClearedForReportDispatch(orderId);

    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3001";
    const publicUrl = `${protocol}://${host}`;

    const compiled = await generateOrderPdf(orderId, {
      enforceDispatchGuard: false,
      baseVerificationUrl: publicUrl,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="report-${compiled.orderNumber}.pdf"`
    );
    res.setHeader("X-NABL-Report-Number", compiled.reportNumber);
    res.setHeader("X-NABL-Checksum-SHA256", compiled.checksumSha256);
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).send(compiled.buffer);
  } catch (error) {
    next(error);
  }
};

export const orderReportPdf = streamOrderReportPdf;

// =======================================================
// RENDER NABL ORDER REPORT HTML PREVIEW
// =======================================================

export const getOrderReportHtmlPreview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawId = (req.params.orderId || req.params.id || (req as any).validated?.params?.orderId) as string;
    let orderId = rawId;
    const report = await prisma.report.findUnique({
      where: { id: rawId },
      select: { orderId: true },
    });
    if (report?.orderId) {
      orderId = report.orderId;
    }

    const enforceGuard = req.query.enforceDispatchGuard === "true";
    if (enforceGuard) {
      await assertOrderClearedForReportDispatch(orderId);
    }

    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3001";
    const publicUrl = `${protocol}://${host}`;

    const html = await generateOrderReportHtml(orderId, {
      enforceDispatchGuard: false,
      baseVerificationUrl: publicUrl,
    });

    if (req.query.format === "json") {
      return res.status(200).json({
        success: true,
        data: { orderId, html },
        message: "NABL A4 HTML report generated",
      });
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).send(html);
  } catch (error) {
    next(error);
  }
};

export const orderReportHtml = getOrderReportHtmlPreview;

// =======================================================
// DOWNLOAD NABL ORDER REPORT PDF (ATTACHMENT)
// =======================================================

export const downloadOrderReportPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawId = (req.params.orderId || req.params.id || (req as any).validated?.params?.orderId) as string;
    let orderId = rawId;
    const report = await prisma.report.findUnique({
      where: { id: rawId },
      select: { orderId: true },
    });
    if (report?.orderId) {
      orderId = report.orderId;
    }

    // Enforce Day 2 Report Dispatch Guard
    await assertOrderClearedForReportDispatch(orderId);

    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3001";
    const publicUrl = `${protocol}://${host}`;

    const compiled = await generateOrderPdf(orderId, {
      enforceDispatchGuard: false,
      baseVerificationUrl: publicUrl,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-${compiled.orderNumber}.pdf"`
    );
    res.setHeader("X-NABL-Report-Number", compiled.reportNumber);
    res.setHeader("X-NABL-Checksum-SHA256", compiled.checksumSha256);
    return res.status(200).send(compiled.buffer);
  } catch (error) {
    next(error);
  }
};

// =======================================================
// REPORT DISPATCH & ACTION HANDLERS
// =======================================================

export const generateReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body || {};
    const result = await generateReportDirect(body);
    return res.status(200).json({
      success: true,
      message: "Report generated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const sendReportWhatsAppHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = pathParam(req, "id") || (req.params as any).reportId;
    const phone = req.body?.phone || req.body?.recipientPhone;
    const userId = (req as any).user?.id;
    const result = await sendReportWhatsApp(id, phone, userId);
    return res.status(200).json({
      success: true,
      message: "Report sent via WhatsApp successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const sendReportEmailHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = pathParam(req, "id") || (req.params as any).reportId;
    const email = req.body?.email || req.body?.recipientEmail;
    const userId = (req as any).user?.id;
    const result = await sendReportEmail(id, email, userId);
    return res.status(200).json({
      success: true,
      message: "Report sent via Email successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const printReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = pathParam(req, "id") || (req.params as any).reportId;
    const userId = (req as any).user?.id;
    const result = await recordPrintReport(id, userId);
    return res.status(200).json({
      success: true,
      message: "Report print recorded successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDispatchHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reportIds = req.body?.reportIds || [];
    const channel = req.body?.channel || "EMAIL";
    const userId = (req as any).user?.id;
    const result = await bulkDispatchReports(reportIds, channel, userId);
    return res.status(200).json({
      success: true,
      message: "Reports dispatched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// PUBLIC UN-AUTHENTICATED REPORT VERIFICATION (PHASE 5.2 FOR QR SCAN)
// =======================================================

export const publicVerifyReport = async (
  req: Request,
  res: Response,
  next?: NextFunction
) => {
  try {
    const rawId = req.params.reportId || req.params.id;
    const reportId = Array.isArray(rawId) ? rawId[0] : String(rawId || "").trim();
    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "Report reference ID is required",
      });
    }

    const token = req.query.token as string | undefined;
    const checksum = req.query.checksum as string | undefined;

    const verification = await reportService.getPublicReportVerification(
      reportId,
      token,
      checksum
    );

    const statusCode =
      verification.verificationStatus === 'NOT_FOUND'
        ? 404
        : verification.valid
        ? 200
        : 422;

    res.status(statusCode).json({
      success: verification.valid,
      data: verification,
    });
  } catch (error: any) {
    if (next) {
      next(error);
    } else {
      res.status(500).json({
        success: false,
        message: error?.message || 'Verification portal encountered an error',
      });
    }
  }
};

// =======================================================
// DAY 4: PERSISTENT MULTI-PAGE PDF GENERATION & STORAGE
// =======================================================

export const generateAndStoreReport = async (
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<void> => {
  try {
    const { orderId, forceRegenerate = false, signatoryDoctorId } = req.body || {};

    if (!orderId || typeof orderId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Mandatory field "orderId" is required to generate NABL PDF report.',
      });
      return;
    }

    const authUser = (req as Request & { user?: { id?: string } }).user;

    const persisted = await reportStorageService.generateAndPersistReport({
      orderId,
      forceRegenerate: Boolean(forceRegenerate),
      signatoryDoctorId,
      userId: authUser?.id,
    });

    res.status(persisted.cached ? 200 : 201).json({
      success: true,
      message: persisted.cached
        ? 'Retrieved verified NABL PDF report from persistent disk cache.'
        : 'Generated and persisted NABL ISO 15189:2022 multi-page PDF report.',
      data: persisted,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate and store report.';
    const statusCode =
      message.includes('Dispatch Guard Blocked') || message.includes('CRITICAL SAFETY BLOCK')
        ? 403
        : message.includes('not found')
        ? 404
        : 500;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

// =======================================================
// DAY 4: PHYSICAL REPORT FILE STREAMING WITH ETAG & RANGE
// =======================================================

export const streamStoredOrderReportFile = async (
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<void> => {
  try {
    const rawOrderId = req.params.orderId;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : String(rawOrderId || '');
    const download = req.query.download === 'true';

    const fileMeta = await reportStorageService.getStoredReportFileStream(orderId);
    const etagValue = `"${fileMeta.fileHashSha256}"`;

    if (req.headers['if-none-match'] === etagValue) {
      fileMeta.stream.destroy();
      res.status(304).end();
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(fileMeta.fileSizeBytes));
    res.setHeader(
      'Content-Disposition',
      `${download ? 'attachment' : 'inline'}; filename="${fileMeta.fileName}"`
    );
    res.setHeader('ETag', etagValue);
    res.setHeader('Cache-Control', 'private, max-age=3600, must-revalidate');
    res.setHeader('X-NABL-Report-Number', fileMeta.reportNumber);
    res.setHeader('X-NABL-Report-SHA256', fileMeta.fileHashSha256);

    fileMeta.stream.on('error', (streamErr) => {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: `Disk stream error: ${streamErr.message}`,
        });
      } else {
        res.end();
      }
    });

    fileMeta.stream.pipe(res);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to stream stored PDF file.';
    const statusCode =
      message.includes('Dispatch Guard Blocked') || message.includes('CRITICAL SAFETY BLOCK')
        ? 403
        : message.includes('not found')
        ? 404
        : 500;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

// =======================================================
// DAY 4: CRYPTOGRAPHIC QR TOKEN AUTHENTICITY CHECK
// =======================================================

export const verifyQrCryptographicToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const reportId = String(req.query.reportId || '').trim();
    const token = String(req.query.token || '').trim();
    const checksumPrefix = req.query.checksum ? String(req.query.checksum).trim() : undefined;

    const verification = await reportStorageService.verifyReportToken({
      reportId,
      token,
      checksumPrefix,
    });

    res.status(verification.valid ? 200 : 400).json({
      success: verification.valid,
      data: verification,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Token verification error.';
    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getAddendums = async (
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<void> => {
  try {
    const id = pathParam(req, "id");
    const addendums = await reportService.getReportAddendums(id);
    res.status(200).json({
      success: true,
      data: addendums,
    });
  } catch (error: any) {
    if (next) {
      next(error);
    } else {
      res.status(404).json({
        success: false,
        message: error?.message || 'Failed to retrieve report addendums',
      });
    }
  }
};

export const batchPrintReports = async (
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<void> => {
  try {
    const requestedById = (req as any).user?.id || req.body?.requestedById;
    const manifest = await reportService.prepareBatchPrintManifest({
      ...req.body,
      requestedById,
    });
    res.status(200).json({
      success: true,
      message: `Spooled ${manifest.summary.readyCount} of ${manifest.summary.totalRequested} reports for batch dispatch printing.`,
      data: manifest,
    });
  } catch (error: any) {
    if (next) {
      next(error);
    } else {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to spool batch print manifest',
      });
    }
  }
};

export const getReports = publishedReports;
export const getReportById = orderReport;
export const generateReportForOrder = generateAndStoreReport;
export const verifyPublicReport = publicVerifyReport;

export const reportController = {
  generateAndStoreReport,
  generateAndPersistOrderReport: generateAndStoreReport,
  streamStoredOrderReportFile,
  streamOrderReportFile: streamStoredOrderReportFile,
  verifyQrCryptographicToken,
  verifyReportByQueryToken: verifyQrCryptographicToken,
  streamOrderReportPdf,
  downloadOrderReportPdf,
  renderOrderReportPdfOrHtml: streamOrderReportPdf,
  getOrderReportHtmlPreview,
  listReports: publishedReports,
  getReports: publishedReports,
  getReportById: orderReport,
  getReportByOrderId: orderReport,
  generateReportForOrder: generateAndStoreReport,
  verifyPublicReport: publicVerifyReport,
  publicVerifyReport,
  createAddendum,
  getAddendums,
  batchPrintReports,
};
export default reportController;