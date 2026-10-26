import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  getDashboardStats,
  getOrderAnalytics,
  getSampleStats,
  getResultsRequiringAttention,
  getApprovalQueue,
  getRecentActivity,
  getPaymentAnalytics,
  getTestAnalytics,
  getHospitalMetrics,
  recordDashboardPanicAck,
} from "./dashboard.service";

import {
  successResponse,
} from "../../utils/response";

/**
 * Get comprehensive dashboard statistics
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query;
    
    const dateFrom = query.dateFrom 
      ? new Date(query.dateFrom as string) 
      : undefined;
    
    const dateTo = query.dateTo 
      ? new Date(query.dateTo as string) 
      : undefined;

    const stats = await getDashboardStats({
      dateFrom,
      dateTo,
    });

    return successResponse(
      res,
      stats,
      "Dashboard statistics fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get order analytics
 */
export const getOrderStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query;
    
    const dateFrom = query.dateFrom 
      ? new Date(query.dateFrom as string) 
      : undefined;
    
    const dateTo = query.dateTo 
      ? new Date(query.dateTo as string) 
      : undefined;

    const analytics = await getOrderAnalytics({
      dateFrom,
      dateTo,
    });

    return successResponse(
      res,
      analytics,
      "Order analytics fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get sample statistics
 */
export const getSampleStatsData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await getSampleStats();

    return successResponse(
      res,
      stats,
      "Sample statistics fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get results requiring attention
 */
export const getAttentionResults = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const results = await getResultsRequiringAttention(limit);

    return successResponse(
      res,
      results,
      "Results requiring attention fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get approval queue
 */
export const getApprovalsQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const queue = await getApprovalQueue(limit);

    return successResponse(
      res,
      queue,
      "Approval queue fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activity
 */
export const getActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = Number(req.query.limit) || 20;

    const activity = await getRecentActivity(limit);

    return successResponse(
      res,
      activity,
      "Recent activity fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment analytics
 */
export const getPaymentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query;
    
    const dateFrom = query.dateFrom 
      ? new Date(query.dateFrom as string) 
      : undefined;
    
    const dateTo = query.dateTo 
      ? new Date(query.dateTo as string) 
      : undefined;

    const analytics = await getPaymentAnalytics({
      dateFrom,
      dateTo,
    });

    return successResponse(
      res,
      analytics,
      "Payment analytics fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get test analytics
 */
export const getTestStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query;
    
    const dateFrom = query.dateFrom 
      ? new Date(query.dateFrom as string) 
      : undefined;
    
    const dateTo = query.dateTo 
      ? new Date(query.dateTo as string) 
      : undefined;

    const analytics = await getTestAnalytics({
      dateFrom,
      dateTo,
    });

    return successResponse(
      res,
      analytics,
      "Test analytics fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get unified real-time hospital telemetry metrics
 */
export const getMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const metrics = await getHospitalMetrics();
    return successResponse(
      res,
      metrics,
      "Hospital telemetry metrics fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Record critical value panic telephonic read-back from Dashboard
 */
export const acknowledgePanic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { resultValueId, orderId, recipientName, recipientContact, readBackNote } = req.body;
    const actorId = (req as any).user?.id || (req as any).user?.userId;

    const result = await recordDashboardPanicAck({
      resultValueId,
      orderId,
      recipientName,
      recipientContact,
      readBackNote,
      actorId,
    });

    return successResponse(
      res,
      result,
      "Critical panic read-back recorded successfully"
    );
  } catch (error) {
    next(error);
  }
};