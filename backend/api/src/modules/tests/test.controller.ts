import { Request, Response, NextFunction } from "express";

import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  updateCategoryEnhanced,
  deleteCategory,
  createTest,
  getTests,
  getCatalogDirectory,
  getParametersByLoincCode,
  getTestById,
  updateTest,
  deleteTest,
  addParameter,
  updateParameter,
  deleteParameter,
  listParameters,
  addReferenceRange,
  updateReferenceRange,
  deleteReferenceRange,
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
  addPackageItem,
  removePackageItem,
  exportCatalog,
  importCatalog,
} from "./test.service";

import prisma from "../../../config/database";

import { successResponse, createdResponse } from "../../utils/response";

export const createCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    const category = await createCategory(body);
    return createdResponse(res, category, "Test category created successfully");
  } catch (error) {
    next(error);
  }
};

export const listCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await getCategories();
    return successResponse(
      res,
      categories,
      "Test categories fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const category = await getCategoryById(params.id as string);
    return successResponse(res, category, "Test category fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const category = await updateCategory(params.id as string, body);
    return successResponse(res, category, "Test category updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await deleteCategory(params.id as string);
    return successResponse(res, result, "Test category deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const createTestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    const test = await createTest(body);
    return createdResponse(res, test, "Test created successfully");
  } catch (error) {
    next(error);
  }
};

export const listTests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.path.endsWith("/count")) {
      const count = await prisma.test.count();
      return successResponse(
        res,
        { count },
        "Test count fetched successfully"
      );
    }

    const query = (req as any).validated?.query || req.query;

    const search =
      typeof query.search === "string"
        ? query.search
        : typeof query.query === "string"
        ? query.query
        : typeof query.q === "string"
        ? query.q
        : undefined;

    const categoryId =
      typeof query.categoryId === "string" ? query.categoryId : undefined;

    const isActive =
      typeof query.isActive === "boolean"
        ? query.isActive
        : query.isActive === "true"
        ? true
        : query.isActive === "false"
        ? false
        : undefined;

    const sampleType =
      typeof query.sampleType === "string" ? query.sampleType : undefined;

    const department =
      typeof query.department === "string" ? query.department : undefined;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await getTests(
      search,
      categoryId,
      isActive,
      sampleType,
      department,
      page,
      limit
    );

    return successResponse(res, result, "Tests fetched successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Day 6 Fast API Endpoint Controller: `GET /api/tests/catalog`
 * Paginated, searchable diagnostic test directory with department filtering,
 * parameter & LOINC inclusions, and GST/price metadata.
 */
export const listCatalogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;

    const search =
      typeof query.search === "string"
        ? query.search
        : typeof query.query === "string"
        ? query.query
        : typeof query.q === "string"
        ? query.q
        : undefined;

    const department =
      typeof query.department === "string" ? query.department : undefined;
    const categoryId =
      typeof query.categoryId === "string" ? query.categoryId : undefined;
    const categoryCode =
      typeof query.categoryCode === "string" ? query.categoryCode : undefined;
    const sampleType =
      typeof query.sampleType === "string" ? query.sampleType : undefined;

    const isActive =
      typeof query.isActive === "boolean"
        ? query.isActive
        : query.isActive === "false"
        ? false
        : true;

    const minPrice =
      query.minPrice !== undefined ? Number(query.minPrice) : undefined;
    const maxPrice =
      query.maxPrice !== undefined ? Number(query.maxPrice) : undefined;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 25;

    const catalogResult = await getCatalogDirectory({
      search,
      department,
      categoryId,
      categoryCode,
      sampleType,
      isActive,
      minPrice,
      maxPrice,
      page,
      limit,
    });

    return successResponse(
      res,
      catalogResult,
      "Diagnostic test catalog fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Day 6 Fast API Endpoint Controller: `GET /api/tests/loinc/:code`
 * Resolve test parameter metadata by international LOINC® identifier.
 */
export const getLoincParameterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const code = String(params.code || "").trim();

    const result = await getParametersByLoincCode(code);

    return successResponse(
      res,
      result,
      `LOINC parameter metadata resolved for code ${code}`
    );
  } catch (error) {
    next(error);
  }
};

export const getTest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const test = await getTestById(params.id as string);
    return successResponse(res, test, "Test fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const updateTestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const test = await updateTest(params.id as string, body);
    return successResponse(res, test, "Test updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteTestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await deleteTest(params.id as string);
    return successResponse(res, result, "Test deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const addParameterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const parameter = await addParameter(params.id as string, body);
    return createdResponse(
      res,
      parameter,
      "Test parameter created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const updateParameterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const parameter = await updateParameter(params.id as string, body);
    return successResponse(
      res,
      parameter,
      "Test parameter updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const deleteParameterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await deleteParameter(params.id as string);
    return successResponse(
      res,
      result,
      "Test parameter deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const listParametersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testId =
      typeof req.query.testId === "string" ? req.query.testId : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const parameters = await listParameters(testId, search);
    return successResponse(
      res,
      parameters,
      "Test parameters fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const createParameterDirectController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body || {};
    const testId = body.testId;
    if (!testId) {
      return res
        .status(400)
        .json({ success: false, message: "testId is required in request body" });
    }
    const parameter = await addParameter(testId, body);
    return createdResponse(
      res,
      parameter,
      "Test parameter created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const addReferenceRangeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const range = await addReferenceRange(params.id as string, body);
    return createdResponse(
      res,
      range,
      "Reference range created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const updateReferenceRangeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const range = await updateReferenceRange(params.id as string, body);
    return successResponse(
      res,
      range,
      "Reference range updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const deleteReferenceRangeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await deleteReferenceRange(params.id as string);
    return successResponse(
      res,
      result,
      "Reference range deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// TEST PACKAGES
// =======================================================

export const createPackageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    const testPackage = await createPackage(body);
    return createdResponse(
      res,
      testPackage,
      "Test package created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const listPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;

    const search =
      typeof query.search === "string" ? query.search : undefined;

    const isActive =
      typeof query.isActive === "boolean"
        ? query.isActive
        : query.isActive === "true"
        ? true
        : query.isActive === "false"
        ? false
        : undefined;

    const isPopular =
      typeof query.isPopular === "boolean"
        ? query.isPopular
        : query.isPopular === "true"
        ? true
        : query.isPopular === "false"
        ? false
        : undefined;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await getPackages(
      search,
      isActive,
      isPopular,
      page,
      limit
    );

    return successResponse(
      res,
      result,
      "Test packages fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getPackageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const testPackage = await getPackageById(params.id as string);
    return successResponse(
      res,
      testPackage,
      "Test package fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const updatePackageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const testPackage = await updatePackage(params.id as string, body);
    return successResponse(
      res,
      testPackage,
      "Test package updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const deletePackageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await deletePackage(params.id as string);
    return successResponse(
      res,
      result,
      "Test package deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const addPackageItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const item = await addPackageItem(params.id as string, body);
    return createdResponse(
      res,
      item,
      "Test added to package successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const removePackageItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await removePackageItem(
      params.id as string,
      params.testId as string
    );
    return successResponse(
      res,
      result,
      "Test removed from package successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const updateCategoryEnhancedController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const category = await updateCategoryEnhanced(params.id as string, body);
    return successResponse(
      res,
      category,
      "Test category updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// EXPORT/IMPORT CATALOG
// =======================================================

export const exportCatalogController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const catalog = await exportCatalog();
    return successResponse(
      res,
      catalog,
      "Test catalog exported successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const importCatalogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    const results = await importCatalog(body);
    return successResponse(
      res,
      results,
      "Test catalog imported successfully"
    );
  } catch (error) {
    next(error);
  }
};