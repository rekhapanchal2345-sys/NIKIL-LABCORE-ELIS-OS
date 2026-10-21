import {
  Request,
  Response,
  NextFunction,
} from "express";

import type { AuthenticatedRequest } from "../../../middleware/auth";

import {
  getPendingApprovals,
  getApprovalById,
  approve,
  reject,
  publish,
  getApprovalMetrics,
  batchApprove,
  recordCriticalAck,
  getHistoricalTrend,
  getApprovalSignature,
  verifyApprovalSignature,
} from "./approval.service";
import { leveyJenningsQcService } from "./levey-jennings-qc.service";
import { resultAmendmentService } from "./result-amendment.service";
import { panicReadBackService } from "./panic-readback.service";
import prisma from "../../../config/database";



// =======================================================
// APPROVAL METRICS
// =======================================================

export const getMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getApprovalMetrics();

    res.status(200).json({
      success: true,
      message: "Approval metrics fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// PENDING APPROVALS
// =======================================================

export const pending = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;

    const result = await getPendingApprovals({
      orderId: query.orderId,
      search: query.search,
      status: query.status,
      filter: query.filter,
      hasCritical: query.hasCritical,
      department: query.department,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    });

    res.status(200).json({
      success: true,
      message: "Pending approvals fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// GET APPROVAL
// =======================================================

export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;

    const result = await getApprovalById(params.id as string);

    res.status(200).json({
      success: true,
      message: "Approval details fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// APPROVE
// =======================================================

export const approveResult = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;

    const result = await approve(params.id as string, req.user!.id, {
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers["user-agent"],
      reason: req.body?.remarks || req.body?.reason,
    });

    res.status(200).json({
      success: true,
      message: "Result approved successfully with digital seal",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// BATCH APPROVE
// =======================================================

export const batchApproveResults = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;

    const result = await batchApprove(
      body.ids,
      req.user!.id,
      body.remarks,
      {
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers["user-agent"],
      }
    );

    res.status(200).json({
      success: true,
      message: `Batch approval completed: ${result.approvedCount} approved with digital seal`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// CRITICAL / PANIC CALL ACKNOWLEDGMENT
// =======================================================

export const saveCriticalAck = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;

    const result = await recordCriticalAck(
      params.id as string,
      body,
      req.user!.id
    );

    res.status(201).json({
      success: true,
      message: "Critical value verbal notification logged successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// HISTORICAL DELTA CHECK TREND
// =======================================================

export const getHistoryTrend = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;

    const result = await getHistoricalTrend(params.id as string);

    res.status(200).json({
      success: true,
      message: "Historical trend fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// REJECT / SEND BACK
// =======================================================

export const rejectResult = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;

    const result = await reject(
      params.id as string,
      body.remarks,
      req.user!.id
    );

    res.status(200).json({
      success: true,
      message: "Result sent back for correction",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// PUBLISH
// =======================================================

export const publishResult = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;

    const result = await publish(params.id as string);

    res.status(200).json({
      success: true,
      message: "Result published successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// DIGITAL SIGNATURE & VERIFICATION
// =======================================================

export const getSignature = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await getApprovalSignature(params.id as string);

    res.status(200).json({
      success: true,
      message: result.isAuthentic
        ? "Digital signature verified successfully"
        : "Digital signature verification issue detected",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const verifySignature = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await verifyApprovalSignature(params.id as string);

    res.status(200).json({
      success: true,
      message: result.isAuthentic
        ? "Digital signature verified authentic and untampered"
        : "Digital signature integrity check failed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// LEVEY-JENNINGS QC & WESTGARD RULES
// =======================================================

export const getApprovalQcChart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const approval = await getApprovalById(params.id as string);
    const testCode = (approval as any).test?.testCode || (approval as any).test?.code || "K";
    const parameterCode = req.query.parameter as string | undefined;
    const data = await leveyJenningsQcService.getLeveyJenningsData(testCode, parameterCode);

    res.status(200).json({
      success: true,
      message: "Levey-Jennings QC data retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getTestQcChart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testCode = req.params.testCode as string;
    const parameterCode = req.query.parameter as string | undefined;
    const data = await leveyJenningsQcService.getLeveyJenningsData(testCode, parameterCode);

    res.status(200).json({
      success: true,
      message: "Levey-Jennings QC data retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// RESULT AMENDMENT (NABL ISO 15189:2022)
// =======================================================

export const amendResult = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const userId = (req as any).user?.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await resultAmendmentService.amendApprovedResult(
      params.id as string,
      userId,
      {
        ...body,
        ipAddress,
        userAgent,
      }
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAmendments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const amendments = await resultAmendmentService.getAmendmentHistory(params.id as string);

    res.status(200).json({
      success: true,
      message: "Result amendment history retrieved successfully",
      data: amendments,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// PANIC ALERT & TRIAGE QUEUE (3-LANE DESK)
// =======================================================

export const getTriageQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pendingResults = await prisma.result.findMany({
      where: {
        status: { in: ["VERIFIED", "ENTERED"] },
      },
      include: {
        test: true,
        values: {
          include: {
            parameter: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            patient: {
              select: {
                id: true,
                uhid: true,
                firstName: true,
                lastName: true,
                gender: true,
                phone: true,
              },
            },
            doctor: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
        criticalAcknowledgments: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const criticalPanic: any[] = [];
    const abnormal: any[] = [];
    const normal: any[] = [];

    for (const resItem of pendingResults) {
      const hasCritical = resItem.values.some((v: any) => v.flag === "CRITICAL");
      const hasAbnormal = resItem.values.some((v: any) => v.flag === "HIGH" || v.flag === "LOW");
      const hasDeltaCheck = resItem.values.some((v: any) => v.notes && v.notes.includes("DELTA"));

      if (hasCritical) {
        criticalPanic.push(resItem);
      } else if (hasAbnormal || hasDeltaCheck) {
        abnormal.push(resItem);
      } else {
        normal.push(resItem);
      }
    }

    res.status(200).json({
      success: true,
      message: "Triage queue fetched successfully",
      data: {
        counts: {
          criticalPanic: criticalPanic.length,
          abnormal: abnormal.length,
          normal: normal.length,
          total: pendingResults.length,
        },
        criticalPanic,
        abnormal,
        normal,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPanicReadBackLedger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const onlyUnresolved = req.query.unresolved === "true";
    const ledger = await panicReadBackService.listPanicReadBackLedger(onlyUnresolved);

    res.status(200).json({
      success: true,
      message: "Panic read-back ledger fetched successfully",
      data: ledger,
    });
  } catch (error) {
    next(error);
  }
};

export const recordPanicReadBack = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    const user = (req as any).user;

    const result = await panicReadBackService.recordTelephonicReadBack({
      ...body,
      notifiedByUserId: user?.id || "SYSTEM",
      notifiedByUserName: user?.fullName || "Pathologist",
    });

    res.status(200).json({
      success: true,
      message: "Telephonic read-back successfully recorded and report dispatch unlocked",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const checkOrderDispatchStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.orderId as string;
    const status = await panicReadBackService.assertOrderClearedForReportDispatch(orderId);

    res.status(200).json({
      success: true,
      message: "Order dispatch clearance verified",
      data: status,
    });
  } catch (error) {
    next(error);
  }
};