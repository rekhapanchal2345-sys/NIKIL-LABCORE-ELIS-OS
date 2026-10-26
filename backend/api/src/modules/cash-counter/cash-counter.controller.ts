import {
  Request,
  Response,
  NextFunction,
} from "express";

import type { AuthenticatedRequest } from "../../../middleware/auth";
import {
  createCashCounter,
  openCashCounter,
  closeCashCounter,
  getCashCounters,
  getCashCounterById,
  addCashMovement,
} from "./cash-counter.service";
import { DaybookService } from "./daybook.service";

// =======================================================
// CREATE CASH COUNTER
// =======================================================

export const create =
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const body = (req as any).validated?.body || req.body;
      
      const counter =
        await createCashCounter(body);

      res.status(201).json({
        success: true,
        message: "Cash counter created successfully",
        data: counter,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// OPEN CASH COUNTER
// =======================================================

export const open =
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const body = (req as any).validated?.body || req.body;
      
      const result =
        await openCashCounter({
          ...body,
          userId: req.user?.id,
        });

      res.status(200).json({
        success: true,
        message: "Cash counter opened successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// CLOSE CASH COUNTER
// =======================================================

export const close =
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const body = (req as any).validated?.body || req.body;
      
      const result =
        await closeCashCounter({
          ...body,
          userId: req.user?.id,
        });

      res.status(200).json({
        success: true,
        message: "Cash counter closed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// GET ALL CASH COUNTERS
// =======================================================

export const list =
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const query = (req as any).validated?.query || req.query;
      
      const result =
        await getCashCounters(query);

      res.status(200).json({
        success: true,
        message: "Cash counters fetched successfully",
        data: result.counters,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// GET CASH COUNTER BY ID
// =======================================================

export const getOne =
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const params = (req as any).validated?.params || req.params;
      
      const counter =
        await getCashCounterById(params.id);

      res.status(200).json({
        success: true,
        message: "Cash counter fetched successfully",
        data: counter,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// ADD CASH MOVEMENT
// =======================================================

export const addMovement =
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const body = (req as any).validated?.body || req.body;
      
      const result =
        await addCashMovement({
          ...body,
          performedById: req.user?.id,
        });

      res.status(201).json({
        success: true,
        message: "Cash movement added successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// DAYBOOK & SHIFT HANDOVER
// =======================================================

export const getDaybook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawSessionId = req.params.sessionId;
    const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : String(rawSessionId);
    const daybook = await DaybookService.generateShiftDaybook(sessionId);

    res.status(200).json({
      success: true,
      message: "Shift daybook generated successfully",
      data: daybook,
    });
  } catch (error) {
    next(error);
  }
};

export const handoverShift = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawSessionId = req.params.sessionId;
    const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : String(rawSessionId);
    const { denominations, varianceReason, supervisorNotes, handoverToUserId } = req.body;

    const result = await DaybookService.executeShiftHandover({
      sessionId,
      denominations,
      varianceReason,
      supervisorNotes,
      handoverToUserId,
    });

    res.status(200).json({
      success: true,
      message: "Shift handover completed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const calculateDenominations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { denominations } = req.body;
    const result = DaybookService.calculatePhysicalTotal(denominations || {});

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
