import type { Request, Response, NextFunction } from "express";
import { BranchService } from "./branch.service";
import { HttpError } from "../../utils/http-error";
import type { AuthenticatedRequest } from "../../../middleware/auth";

export class BranchController {
  /**
   * POST /api/branches
   * Super Admin / Admin only
   */
  static async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, name, address, city, state, pincode, phone, email, nablNumber, gstin, letterheadUrl, isMainBranch, isActive, settings } = req.body;

      if (!code || !name) {
        throw new HttpError(400, "Branch code and name are required.");
      }

      const branch = await BranchService.createBranch({
        code,
        name,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        nablNumber,
        gstin,
        letterheadUrl,
        isMainBranch,
        isActive,
        settings,
      });

      res.status(201).json({
        success: true,
        message: "Branch created successfully",
        data: branch,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/branches
   */
  static async getBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;

      const branches = await BranchService.getBranches({ isActive, search });

      res.status(200).json({
        success: true,
        data: branches,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/branches/:id
   */
  static async getBranchById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const branch = await BranchService.getBranchById(id);

      res.status(200).json({
        success: true,
        data: branch,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/branches/:id
   */
  static async updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const branch = await BranchService.updateBranch(id, req.body);

      res.status(200).json({
        success: true,
        message: "Branch updated successfully",
        data: branch,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/branches/assign-user
   */
  static async assignUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, branchId } = req.body;
      if (!userId) {
        throw new HttpError(400, "userId is required");
      }

      const user = await BranchService.assignUserToBranch(userId, branchId || null);

      res.status(200).json({
        success: true,
        message: "User branch assigned successfully",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/branches/analytics/cross-branch
   * HQ consolidated view
   */
  static async getCrossBranchAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const analytics = await BranchService.getCrossBranchAggregates(startDate, endDate);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/branches/:id/settings
   * Effective settings for PDF generation/report letterhead
   */
  static async getBranchSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const settings = await BranchService.getEffectiveBranchSettings(id);

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }
}
