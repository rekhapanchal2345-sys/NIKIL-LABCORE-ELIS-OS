import {
    Request,
    Response,
    NextFunction,
  } from "express";

import type { AuthenticatedRequest } from "../../../middleware/auth";
import { HttpError } from "../../utils/http-error";
import { pathParam } from "../../utils/request-meta";
import prisma from "../../../config/database";

/** These routes all sit behind `authenticate`, so a missing user is a wiring bug. */
const actorId = (req: AuthenticatedRequest): string => {
  const id = req.user?.id;
  if (!id) {
    throw new HttpError("Authenticated user is required.", 401, "UNAUTHORIZED");
  }
  return id;
};
  
  import {
    createResult,
    getResultById,
    getResults,
    updateResult,
    verifyResult,
    approveResult,
    rejectResult,
    publishResult,
    getResultsMetrics,
    getResultTrend,
    acknowledgeCriticalValue,
    createResultAmendment,
    bulkVerifyResults,
  } from "./result.service";
  
  // =======================================================
  // CREATE
  // =======================================================
  
  export const create =
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const result =
          await createResult(
            req.body,
            req.user?.id
          );
  
        res.status(201).json({
          success: true,
          message:
            "Result created successfully",
          data: result,
        });
      } catch (error) {
        console.error('Error in result create controller:', error);
        next(error);
      }
    };
  
  // =======================================================
  // LIST
  // =======================================================
  
  export const list =
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        // Check if this is a count request
        if (req.path.endsWith('/count')) {
          const count = await prisma.result.count();
          res.status(200).json({
            success: true,
            message: "Result count fetched successfully",
            data: { count },
          });
          return;
        }
        
        const result =
          await getResults({
            orderId:
              req.query.orderId,

            testId:
              req.query.testId,

            status:
              req.query.status,

            search:
              req.query.search,

            dateFrom:
              req.query.dateFrom,

            dateTo:
              req.query.dateTo,

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
            "Results fetched successfully",
          data: result,
        });
      } catch (error) {
        console.error('Error in result list controller:', error);
        next(error);
      }
    };
  
  // =======================================================
  // GET ONE
  // =======================================================
  
  export const getOne =
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const result =
          await getResultById(
            req.params.id as string
          );
  
        res.status(200).json({
          success: true,
          message:
            "Result fetched successfully",
          data: result,
        });
      } catch (error) {
        console.error('Error in result getOne controller:', error);
        next(error);
      }
    };
  
  // =======================================================
  // UPDATE
  // =======================================================
  
  export const update =
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const result =
          await updateResult(
            req.params.id as string,
            req.body
          );
  
        res.status(200).json({
          success: true,
          message:
            "Result updated successfully",
          data: result,
        });
      } catch (error) {
        console.error('Error in result update controller:', error);
        next(error);
      }
    };
  
  // =======================================================
  // VERIFY
  // =======================================================
  
  export const verify =
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const result =
          await verifyResult(
            req.params.id as string,
            req.user?.id
          );
  
        res.status(200).json({
          success: true,
          message:
            "Result verified successfully",
          data: result,
        });
      } catch (error) {
        console.error('Error in result verify controller:', error);
        next(error);
      }
    };
  
  // =======================================================
  // APPROVE
  // =======================================================
  
  export const approve =
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const result =
          await approveResult(
            req.params.id as string,
            req.user?.id
          );
  
        res.status(200).json({
          success: true,
          message:
            "Result approved successfully",
          data: result,
        });
      } catch (error) {
        console.error('Error in result approve controller:', error);
        next(error);
      }
    };

  // =======================================================
  // REJECT
  // =======================================================

  export const reject = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = pathParam(req, "id");
      const body = req.body || {};
      const reason = body.reason || body.rejectionReason || body.remarks;
      const result = await rejectResult(id, reason, req.user?.id);

      res.status(200).json({
        success: true,
        message: "Result rejected successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error in result reject controller:", error);
      next(error);
    }
  };
  
  // =======================================================
  // PUBLISH
  // =======================================================
  
  export const publish =
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const result =
          await publishResult(
            req.params.id as string
          );
  
        res.status(200).json({
          success: true,
          message:
            "Result published successfully",
          data: result,
        });
      } catch (error) {
        console.error('Error in result publish controller:', error);
        next(error);
      }
    };

  // =======================================================
  // GET METRICS
  // =======================================================

  export const getMetrics =
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const metrics =
          await getResultsMetrics();

        res.status(200).json({
          success: true,
          message:
            "Results metrics fetched successfully",
          data: metrics,
        });
      } catch (error) {
        console.error('Error in result metrics controller:', error);
        next(error);
      }
    };

  // =======================================================
  // GET RESULT TREND
  // =======================================================

  export const getTrend =
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const patientId = pathParam(req, "patientId");
        const testCode = pathParam(req, "testCode");
        const limit = Number(req.query.limit) || 10;

        const trendData =
          await getResultTrend(
            patientId,
            testCode,
            limit
          );

        res.status(200).json({
          success: true,
          message:
            "Result trend fetched successfully",
          data: trendData,
        });
      } catch (error) {
        console.error('Error in result trend controller:', error);
        next(error);
      }
    };

  // =======================================================
  // ACKNOWLEDGE CRITICAL VALUE
  // =======================================================

  export const acknowledgeCritical =
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const acknowledgment =
          await acknowledgeCriticalValue(
            req.body,
            actorId(req)
          );

        res.status(201).json({
          success: true,
          message:
            "Critical value acknowledged successfully",
          data: acknowledgment,
        });
      } catch (error) {
        console.error('Error in critical acknowledgment controller:', error);
        next(error);
      }
    };

  // =======================================================
  // CREATE AMENDMENT
  // =======================================================

  export const amend =
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const amendment =
          await createResultAmendment(
            req.body,
            actorId(req)
          );

        res.status(201).json({
          success: true,
          message:
            "Result amendment created successfully",
          data: amendment,
        });
      } catch (error) {
        console.error('Error in amendment controller:', error);
        next(error);
      }
    };

  // =======================================================
  // BULK VERIFY
  // =======================================================

  export const bulkVerify =
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { resultIds } = req.body;

        if (!Array.isArray(resultIds) || resultIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: "resultIds must be a non-empty array",
          });
        }

        const results =
          await bulkVerifyResults(
            resultIds,
            actorId(req)
          );

        res.status(200).json({
          success: true,
          message:
            "Bulk verification completed",
          data: results,
        });
      } catch (error) {
        console.error('Error in bulk verify controller:', error);
        next(error);
      }
    };