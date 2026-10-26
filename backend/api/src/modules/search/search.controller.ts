import { Request, Response } from "express";
import { SearchService, SearchCategory } from "./search.service";

export class SearchController {
  /**
   * GET /api/search
   * Unified global search across Patients, Orders, Samples, Tests, Doctors, and Actions.
   */
  static async globalSearch(req: Request, res: Response) {
    try {
      const query = (req.query.q as string) || (req.query.query as string) || "";
      const rawCategory = ((req.query.category as string) || "ALL").toUpperCase();
      const validCategories: SearchCategory[] = [
        "ALL",
        "PATIENTS",
        "ORDERS",
        "SAMPLES",
        "TESTS",
        "DOCTORS",
        "ACTIONS",
      ];
      const category: SearchCategory = validCategories.includes(rawCategory as SearchCategory)
        ? (rawCategory as SearchCategory)
        : "ALL";

      const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 8, 1), 50);
      const fuzzy = req.query.fuzzy !== "false";

      // Context-aware branch filtering (extracted from query or authenticated token or request header)
      const branchId =
        (req.query.branchId as string) ||
        (req.headers["x-branch-id"] as string) ||
        (req as any).user?.branchId ||
        null;

      const searchResult = await SearchService.globalSearch({
        query,
        category,
        limit,
        fuzzy,
        branchId,
      });

      return res.status(200).json({
        success: true,
        data: searchResult,
      });
    } catch (error: any) {
      console.error("Global search controller error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during search execution",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/search/quick-actions
   * Returns list of registered global keyboard actions and workflow shortcuts.
   */
  static async getQuickActions(req: Request, res: Response) {
    try {
      const actions = SearchService.getQuickActions();
      return res.status(200).json({
        success: true,
        data: actions,
      });
    } catch (error: any) {
      console.error("Quick actions controller error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve system quick actions",
      });
    }
  }
}
