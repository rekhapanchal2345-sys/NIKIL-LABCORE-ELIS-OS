import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  createCategoryController,
  listCategories,
  getCategory,
  updateCategoryController,
  updateCategoryEnhancedController,
  deleteCategoryController,

  createTestController,
  listTests,
  listCatalogController,
  getLoincParameterController,
  getTest,
  updateTestController,
  deleteTestController,

  addParameterController,
  updateParameterController,
  deleteParameterController,
  listParametersController,
  createParameterDirectController,

  addReferenceRangeController,
  updateReferenceRangeController,
  deleteReferenceRangeController,

  createPackageController,
  listPackages,
  getPackageController,
  updatePackageController,
  deletePackageController,
  addPackageItemController,
  removePackageItemController,

  exportCatalogController,
  importCatalogController,
} from "./test.controller";

import {
  checkDuplicateController,
  cloneTestController,
  bulkUpdatePricesController,
  bulkToggleActiveController,
  bulkDeleteController,
  reorderTestsController,
  getTestAnalyticsController,
  recalculatePackagePricingController,
} from "./test.advanced.controller";

import {
  createCategorySchema,
  updateCategoryEnhancedSchema,
  categoryIdSchema,

  createTestSchema,
  updateTestSchema,
  testIdSchema,
  testQuerySchema,
  catalogQuerySchema,
  loincCodeParamsSchema,

  createParameterSchema,
  updateParameterSchema,
  parameterIdSchema,

  createReferenceRangeSchema,
  updateReferenceRangeSchema,
  referenceRangeIdSchema,

  createPackageSchema,
  updatePackageSchema,
  packageIdSchema,
  packageQuerySchema,
  createPackageItemSchema,
  packageItemParamsSchema,

  importCatalogSchema,
} from "./test.validation";

import {
  checkDuplicateSchema,
  cloneTestSchema,
  bulkPriceUpdateSchema,
  bulkToggleActiveSchema,
  bulkDeleteSchema,
  reorderTestsSchema,
  testAnalyticsQuerySchema,
  recalculatePackagePricingSchema,
} from "./test.advanced.validation";

const router = Router();

const ALL_CLINICAL_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.FRONT_DESK,
  UserRole.LAB_TECH,
  UserRole.PATHOLOGIST,
  UserRole.DOCTOR,
  UserRole.BRANCH_ADMIN,
  UserRole.ACCOUNTANT,
  UserRole.AUDITOR,
] as const;

// All test routes require authentication
router.use(authenticate);

// =======================================================
// TEST CATEGORIES
// =======================================================

router.post(
  "/categories",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    body: createCategorySchema,
  }),
  createCategoryController
);

router.get(
  "/categories",
  authorize(...ALL_CLINICAL_ROLES),
  listCategories
);

router.get(
  "/categories/:id",
  authorize(...ALL_CLINICAL_ROLES),
  validate({
    params: categoryIdSchema,
  }),
  getCategory
);

router.patch(
  "/categories/:id",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: categoryIdSchema,
    body: updateCategoryEnhancedSchema,
  }),
  updateCategoryEnhancedController
);

router.delete(
  "/categories/:id",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: categoryIdSchema,
  }),
  deleteCategoryController
);

// =======================================================
// DAY 6: DIAGNOSTIC CATALOG DIRECTORY & LOINC LOOKUP
// (Registered BEFORE /:id wildcard)
// =======================================================

router.get(
  "/catalog",
  authorize(...ALL_CLINICAL_ROLES),
  validate({
    query: catalogQuerySchema,
  }),
  listCatalogController
);

router.get(
  "/catalog/export",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  exportCatalogController
);

router.post(
  "/catalog/import",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    body: importCatalogSchema,
  }),
  importCatalogController
);

router.get(
  "/loinc/:code",
  authorize(...ALL_CLINICAL_ROLES),
  validate({
    params: loincCodeParamsSchema,
  }),
  getLoincParameterController
);

// =======================================================
// TEST PACKAGES (MUST BE REGISTERED BEFORE /:id WILDCARD!)
// =======================================================

router.post(
  "/packages",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    body: createPackageSchema,
  }),
  createPackageController
);

router.get(
  "/packages",
  authorize(...ALL_CLINICAL_ROLES),
  validate({
    query: packageQuerySchema,
  }),
  listPackages
);

router.get(
  "/packages/:id",
  authorize(...ALL_CLINICAL_ROLES),
  validate({
    params: packageIdSchema,
  }),
  getPackageController
);

router.patch(
  "/packages/:id",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: packageIdSchema,
    body: updatePackageSchema,
  }),
  updatePackageController
);

router.delete(
  "/packages/:id",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: packageIdSchema,
  }),
  deletePackageController
);

router.post(
  "/packages/:id/items",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: packageIdSchema,
    body: createPackageItemSchema,
  }),
  addPackageItemController
);

router.delete(
  "/packages/:id/items/:testId",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: packageItemParamsSchema,
  }),
  removePackageItemController
);

// =======================================================
// PARAMETERS (COLLECTION & BY PARAMETER ID)
// =======================================================

router.get(
  "/parameters",
  authorize(...ALL_CLINICAL_ROLES),
  listParametersController
);

router.post(
  "/parameters",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  createParameterDirectController
);

router.patch(
  "/parameters/:id",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: parameterIdSchema,
    body: updateParameterSchema,
  }),
  updateParameterController
);

router.delete(
  "/parameters/:id",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: parameterIdSchema,
  }),
  deleteParameterController
);

// =======================================================
// REFERENCE RANGES
// =======================================================

router.post(
  "/parameters/:id/reference-ranges",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: parameterIdSchema,
    body: createReferenceRangeSchema,
  }),
  addReferenceRangeController
);

router.patch(
  "/reference-ranges/:id",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: referenceRangeIdSchema,
    body: updateReferenceRangeSchema,
  }),
  updateReferenceRangeController
);

router.delete(
  "/reference-ranges/:id",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: referenceRangeIdSchema,
  }),
  deleteReferenceRangeController
);

// =======================================================
// PREMIUM FEATURES (BEFORE /:id WILDCARD)
// =======================================================

router.post(
  "/premium/check-duplicate",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATHOLOGIST),
  validate({ body: checkDuplicateSchema }),
  checkDuplicateController
);

router.post(
  "/premium/bulk-price-update",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: bulkPriceUpdateSchema }),
  bulkUpdatePricesController
);

router.post(
  "/premium/bulk-toggle-active",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: bulkToggleActiveSchema }),
  bulkToggleActiveController
);

router.post(
  "/premium/bulk-delete",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: bulkDeleteSchema }),
  bulkDeleteController
);

router.post(
  "/premium/reorder",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: reorderTestsSchema }),
  reorderTestsController
);

router.get(
  "/premium/analytics",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATHOLOGIST),
  validate({ query: testAnalyticsQuerySchema }),
  getTestAnalyticsController
);

router.post(
  "/packages/:id/recalculate-pricing",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: packageIdSchema,
    body: recalculatePackagePricingSchema,
  }),
  recalculatePackagePricingController
);

router.post(
  "/:id/clone",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATHOLOGIST),
  validate({
    params: testIdSchema,
    body: cloneTestSchema,
  }),
  cloneTestController
);

// =======================================================
// TESTS ROOT & COUNT
// =======================================================

router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    body: createTestSchema,
  }),
  createTestController
);

router.get(
  "/",
  authorize(...ALL_CLINICAL_ROLES),
  validate({
    query: testQuerySchema,
  }),
  listTests
);

router.get(
  "/count",
  authorize(...ALL_CLINICAL_ROLES),
  listTests
);

// =======================================================
// TESTS BY ID (WILDCARDS - MUST BE AT THE VERY END!)
// =======================================================

router.post(
  "/:id/parameters",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: testIdSchema,
    body: createParameterSchema,
  }),
  addParameterController
);

router.get(
  "/:id",
  authorize(...ALL_CLINICAL_ROLES),
  validate({
    params: testIdSchema,
  }),
  getTest
);

router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: testIdSchema,
    body: updateTestSchema,
  }),
  updateTestController
);

router.delete(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({
    params: testIdSchema,
  }),
  deleteTestController
);

export default router;