import { Router } from "express";
import { BranchController } from "./branch.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { branchContextMiddleware } from "../../middleware/branch-context";
import { UserRole } from "@prisma/client";

const router = Router();

// Cross-branch HQ analytics (Admin / Super Admin only)
router.get(
  "/analytics/cross-branch",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BranchController.getCrossBranchAnalytics
);

// Assign staff to a branch
router.post(
  "/assign-user",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BranchController.assignUser
);

// List branches
router.get(
  "/",
  authenticate,
  branchContextMiddleware,
  BranchController.getBranches
);

// Create branch
router.post(
  "/",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BranchController.createBranch
);

// Effective branch settings (for PDF/Letterhead generation)
router.get(
  "/:id/settings",
  authenticate,
  branchContextMiddleware,
  BranchController.getBranchSettings
);

// Get single branch
router.get(
  "/:id",
  authenticate,
  branchContextMiddleware,
  BranchController.getBranchById
);

// Update branch
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BranchController.updateBranch
);

export default router;
