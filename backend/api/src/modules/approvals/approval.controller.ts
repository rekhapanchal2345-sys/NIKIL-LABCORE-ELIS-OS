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