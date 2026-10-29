import { createAuditLog } from "../../utils/compliance";
import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";
import { cacheService, CacheKeys, CacheTags, CacheTTL } from "../cache/cache.service";

const toNumeric = (val: unknown): number => {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
};

export const createCategory = async (data: any) => {
  const existing = await prisma.testCategory.findFirst({
    where: {
      OR: [{ code: data.code }, { name: data.name }],
    },
  });

  if (existing) {
    throw new Error("Test category already exists");
  }

  const created = await prisma.testCategory.create({
    data,
  });
  await cacheService.invalidateTag(CacheTags.CATALOG);
  return created;
};

export const getCategories = async () => {
  return cacheService.remember(
    CacheKeys.testCategories(),
    CacheTTL.ONE_HOUR,
    async () => {
      return prisma.testCategory.findMany({
        where: {
          isActive: true,
        },
        include: {
          tests: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              testCode: true,
              testName: true,
              shortName: true,
              price: true,
              offerPrice: true,
              b2bRate: true,
              sampleType: true,
              tatHours: true,
            },
          },
        },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      });
    },
    [CacheTags.CATALOG]
  );
};

export const getCategoryById = async (id: string) => {
  const category = await prisma.testCategory.findUnique({
    where: { id },
    include: {
      tests: {
        include: {
          parameters: {
            include: {
              referenceRanges: {
                orderBy: { displayOrder: "asc" },
              },
            },
            orderBy: {
              displayOrder: "asc",
            },
          },
        },
      },
    },
  });

  if (!category) {
    throw new Error("Test category not found");
  }

  return category;
};

export const updateCategory = async (id: string, data: any) => {
  const category = await prisma.testCategory.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error("Test category not found");
  }

  return prisma.testCategory.update({
    where: { id },
    data,
  });
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.testCategory.findUnique({
    where: { id },
    include: {
      tests: true,
    },
  });

  if (!category) {
    throw new Error("Test category not found");
  }

  if (category.tests.length > 0) {
    throw new Error("Cannot delete category that has tests. Deactivate instead.");
  }

  await prisma.testCategory.delete({
    where: { id },
  });

  return { id, deleted: true };
};

export const createTest = async (data: any) => {
  const cleanedData = Object.keys(data).reduce((acc: any, key) => {
    const value = data[key];
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  if (cleanedData.categoryId && cleanedData.categoryId.length > 0) {
    const category = await prisma.testCategory.findUnique({
      where: {
        id: cleanedData.categoryId,
      },
    });

    if (!category) {
      throw new Error("Test category not found");
    }
  } else {
    delete cleanedData.categoryId;
  }

  const existing = await prisma.test.findUnique({
    where: {
      testCode: cleanedData.testCode,
    },
  });

  if (existing) {
    throw new Error("Test code already exists");
  }

  const newTest = await prisma.test.create({
    data: {
      ...cleanedData,
      gstPercentage: cleanedData.gstPercentage ?? 0,
      tatHours: cleanedData.tatHours ?? 24,
      isActive: cleanedData.isActive ?? true,
    },
    include: {
      category: true,
      parameters: true,
    },
  });
  await cacheService.invalidateTag(CacheTags.CATALOG);
  return newTest;
};

/**
 * Builds the Prisma `where` clause for diagnostic test & catalog queries.
 * Supports multi-field text search (testName, testCode, shortName, parameterName, loincCode),
 * department filtering (processingDepartment or category code/name/department),
 * sampleType, categoryId, categoryCode, and price range filtering.
 */
function buildTestCatalogWhereClause(opts: {
  search?: string;
  categoryId?: string;
  categoryCode?: string;
  isActive?: boolean;
  sampleType?: string;
  department?: string;
  minPrice?: number;
  maxPrice?: number;
}): any {
  const andConditions: any[] = [];

  if (opts.search && opts.search.trim().length > 0) {
    const term = opts.search.trim();
    andConditions.push({
      OR: [
        { testName: { contains: term, mode: "insensitive" as const } },
        { testCode: { contains: term, mode: "insensitive" as const } },
        { shortName: { contains: term, mode: "insensitive" as const } },
        { processingDepartment: { contains: term, mode: "insensitive" as const } },
        {
          parameters: {
            some: {
              OR: [
                { parameterName: { contains: term, mode: "insensitive" as const } },
                { shortName: { contains: term, mode: "insensitive" as const } },
                { loincCode: { equals: term, mode: "insensitive" as const } },
              ],
            },
          },
        },
      ],
    });
  }

  if (opts.categoryId) {
    andConditions.push({ categoryId: opts.categoryId });
  }

  if (opts.categoryCode) {
    andConditions.push({
      category: {
        code: { equals: opts.categoryCode, mode: "insensitive" as const },
      },
    });
  }

  if (opts.isActive !== undefined) {
    andConditions.push({ isActive: opts.isActive });
  }

  if (opts.sampleType && opts.sampleType !== "") {
    andConditions.push({ sampleType: opts.sampleType });
  }

  if (opts.department && opts.department.trim() !== "") {
    const dept = opts.department.trim();
    andConditions.push({
      OR: [
        { processingDepartment: { contains: dept, mode: "insensitive" as const } },
        {
          category: {
            OR: [
              { department: { contains: dept, mode: "insensitive" as const } },
              { code: { contains: dept, mode: "insensitive" as const } },
              { name: { contains: dept, mode: "insensitive" as const } },
            ],
          },
        },
      ],
    });
  }

  if (opts.minPrice !== undefined || opts.maxPrice !== undefined) {
    const priceCond: any = {};
    if (opts.minPrice !== undefined) priceCond.gte = opts.minPrice;
    if (opts.maxPrice !== undefined) priceCond.lte = opts.maxPrice;
    andConditions.push({ price: priceCond });
  }

  return andConditions.length > 0 ? { AND: andConditions } : {};
}

export const getTests = async (
  search?: string,
  categoryId?: string,
  isActive?: boolean,
  sampleType?: string,
  department?: string,
  page = 1,
  limit = 20
) => {
  const skip = (page - 1) * limit;
  const where = buildTestCatalogWhereClause({
    search,
    categoryId,
    isActive,
    sampleType,
    department,
  });

  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        parameters: {
          where: {
            isActive: true,
          },
          include: {
            referenceRanges: {
              where: {
                isActive: true,
              },
              orderBy: {
                displayOrder: "asc",
              },
            },
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { testName: "asc" }],
    }),
    prisma.test.count({ where }),
  ]);

  return {
    tests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

/**
 * Day 6 Fast API Endpoint Service: `GET /api/tests/catalog`
 * Paginated, searchable diagnostic test directory with department filtering,
 * parameter & LOINC inclusions, CLSI C28-A3 reference ranges, and GST/price metadata.
 */
export const getCatalogDirectory = async (opts: {
  search?: string;
  department?: string;
  categoryId?: string;
  categoryCode?: string;
  sampleType?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}) => {
  const startTime = performance.now();
  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(250, Math.max(1, Number(opts.limit) || 25));
  const skip = (page - 1) * limit;

  const where = buildTestCatalogWhereClause({
    search: opts.search,
    department: opts.department,
    categoryId: opts.categoryId,
    categoryCode: opts.categoryCode,
    sampleType: opts.sampleType,
    isActive: opts.isActive ?? true,
    minPrice: opts.minPrice,
    maxPrice: opts.maxPrice,
  });

  const [rawTests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            code: true,
            name: true,
            department: true,
            color: true,
            icon: true,
          },
        },
        parameters: {
          where: { isActive: true },
          include: {
            referenceRanges: {
              where: { isActive: true },
              orderBy: { displayOrder: "asc" },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { testName: "asc" }],
    }),
    prisma.test.count({ where }),
  ]);

  const enrichedTests = rawTests.map((test) => {
    const mrpPrice = toNumeric(test.price);
    const offerPrice = test.offerPrice !== null ? toNumeric(test.offerPrice) : mrpPrice;
    const b2bRate = test.b2bRate !== null ? toNumeric(test.b2bRate) : null;
    const gstPercentage = toNumeric(test.gstPercentage);
    const savingsAmount = Math.max(0, Number((mrpPrice - offerPrice).toFixed(2)));
    const discountPercentage =
      mrpPrice > 0 ? Number(((savingsAmount / mrpPrice) * 100).toFixed(2)) : 0;

    return {
      ...test,
      parameterCount: test.parameters.length,
      priceMetadata: {
        mrpPrice,
        offerPrice,
        b2bRate,
        gstPercentage,
        gstSacCode: "999316",
        gstExemptHealthcare: gstPercentage === 0,
        savingsAmount,
        discountPercentage,
        currency: "INR",
      },
    };
  });

  const queryTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    tests: enrichedTests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
    telemetry: {
      queryTimeMs,
      returnedCount: enrichedTests.length,
      filters: {
        search: opts.search ?? null,
        department: opts.department ?? null,
        categoryId: opts.categoryId ?? null,
        categoryCode: opts.categoryCode ?? null,
        sampleType: opts.sampleType ?? null,
        isActive: opts.isActive ?? true,
      },
    },
  };
};

/**
 * Day 6 Fast API Endpoint Service: `GET /api/tests/loinc/:code`
 * Resolves test parameter metadata, parent diagnostic test(s), and CLSI C28-A3
 * stratified reference ranges by international LOINC® identifier.
 */
export const getParametersByLoincCode = async (loincCode: string) => {
  const normalizedCode = loincCode.trim();
  const startTime = performance.now();

  const parameters = await prisma.testParameter.findMany({
    where: {
      loincCode: {
        equals: normalizedCode,
        mode: "insensitive",
      },
      isActive: true,
    },
    include: {
      test: {
        include: {
          category: true,
        },
      },
      referenceRanges: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { parameterName: "asc" }],
  });

  if (parameters.length === 0) {
    throw new HttpError(
      `No test parameter found for LOINC code '${normalizedCode}'`,
      404,
      "LOINC_CODE_NOT_FOUND"
    );
  }

  const queryTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    loincCode: parameters[0].loincCode ?? normalizedCode,
    matchCount: parameters.length,
    primaryParameter: parameters[0],
    parameters,
    associatedTests: parameters.map((p) => ({
      testId: p.test.id,
      testCode: p.test.testCode,
      testName: p.test.testName,
      shortName: p.test.shortName,
      sampleType: p.test.sampleType,
      sampleContainer: p.test.sampleContainer,
      processingDepartment: p.test.processingDepartment,
      categoryName: p.test.category?.name ?? null,
      price: toNumeric(p.test.price),
      offerPrice: p.test.offerPrice !== null ? toNumeric(p.test.offerPrice) : toNumeric(p.test.price),
      parameterId: p.id,
      parameterName: p.parameterName,
      unit: p.unit,
      dataType: p.dataType,
      referenceRangesCount: p.referenceRanges.length,
    })),
    telemetry: {
      queryTimeMs,
    },
  };
};

export const getTestById = async (id: string) => {
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      category: true,
      parameters: {
        include: {
          referenceRanges: {
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: {
          displayOrder: "asc",
        },
      },
    },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  return test;
};

export const updateTest = async (id: string, data: any) => {
  const test = await prisma.test.findUnique({
    where: { id },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  if (data.categoryId) {
    const category = await prisma.testCategory.findUnique({
      where: {
        id: data.categoryId,
      },
    });

    if (!category) {
      throw new Error("Test category not found");
    }
  }

  return prisma.test.update({
    where: { id },
    data,
    include: {
      category: true,
      parameters: true,
    },
  });
};

export const addParameter = async (testId: string, data: any) => {
  const test = await prisma.test.findUnique({
    where: { id: testId },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  return prisma.testParameter.create({
    data: {
      testId,
      parameterName: data.parameterName,
      shortName: data.shortName,
      loincCode: data.loincCode,
      unit: data.unit,
      dataType: data.dataType,
      measurementMethod: data.measurementMethod,
      dropdownOptions: data.dropdownOptions,
      allowRichText: data.allowRichText ?? false,
      decimalPrecision: data.decimalPrecision,
      displayOrder: data.displayOrder ?? 1,
      isRequired: data.isRequired ?? true,
      isActive: data.isActive ?? true,
    },
  });
};

export const updateParameter = async (id: string, data: any) => {
  const parameter = await prisma.testParameter.findUnique({
    where: { id },
  });

  if (!parameter) {
    throw new Error("Parameter not found");
  }

  return prisma.testParameter.update({
    where: { id },
    data,
  });
};

export const listParameters = async (testId?: string, search?: string) => {
  const where: any = {};
  if (testId) where.testId = testId;
  if (search) {
    where.OR = [
      { parameterName: { contains: search, mode: "insensitive" } },
      { shortName: { contains: search, mode: "insensitive" } },
      { loincCode: { contains: search, mode: "insensitive" } },
    ];
  }
  return prisma.testParameter.findMany({
    where,
    include: {
      referenceRanges: {
        orderBy: { displayOrder: "asc" },
      },
      test: {
        select: {
          id: true,
          testName: true,
          testCode: true,
        },
      },
    },
    orderBy: { displayOrder: "asc" },
  });
};

export const addReferenceRange = async (parameterId: string, data: any) => {
  const parameter = await prisma.testParameter.findUnique({
    where: { id: parameterId },
  });

  if (!parameter) {
    throw new Error("Parameter not found");
  }

  return prisma.referenceRange.create({
    data: {
      parameterId,
      ...data,
    },
  });
};

export const updateReferenceRange = async (id: string, data: any) => {
  const range = await prisma.referenceRange.findUnique({
    where: { id },
  });

  if (!range) {
    throw new Error("Reference range not found");
  }

  return prisma.referenceRange.update({
    where: { id },
    data,
  });
};

export const deleteTest = async (id: string) => {
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      orderItems: true,
      results: true,
      samples: true,
    },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  if (test.orderItems.length > 0 || test.results.length > 0 || test.samples.length > 0) {
    throw new Error("Cannot delete test that is used in orders, results, or samples. Deactivate instead.");
  }

  await prisma.test.delete({
    where: { id },
  });

  return { id, deleted: true };
};

export const deleteParameter = async (id: string) => {
  const parameter = await prisma.testParameter.findUnique({
    where: { id },
    include: {
      resultValues: true,
    },
  });

  if (!parameter) {
    throw new Error("Parameter not found");
  }

  if (parameter.resultValues.length > 0) {
    throw new Error("Cannot delete parameter that has result values. Deactivate instead.");
  }

  await prisma.testParameter.delete({
    where: { id },
  });

  return { id, deleted: true };
};

export const deleteReferenceRange = async (id: string, userId?: string) => {
  const range = await prisma.referenceRange.findUnique({
    where: { id },
  });

  if (!range) {
    throw new Error("Reference range not found");
  }

  // Soft delete to protect NABL audit trail and avoid corrupting historical reports (Bug 7.2)
  const updatedRange = await (prisma.referenceRange as any).update({
    where: { id },
    data: {
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: userId || "SYSTEM",
    module: "REFERENCE_RANGE_MASTER",
    action: "SOFT_DELETE",
    recordId: id,
    oldData: range,
    newData: { isActive: false, isDeleted: true, deletedAt: updatedRange.deletedAt },
  });

  return { id, deleted: true, softDeleted: true };
};

// =======================================================
// TEST PACKAGES (WITH BUNDLED TEST COUNTS & SAVINGS METADATA)
// =======================================================

export const createPackage = async (data: any) => {
  const existing = await prisma.testPackage.findFirst({
    where: {
      OR: [{ packageCode: data.packageCode }, { packageName: data.packageName }],
    },
  });

  if (existing) {
    throw new Error("Test package already exists");
  }

  return prisma.testPackage.create({
    data: {
      ...data,
      includesTestsCount: data.tests?.length || 0,
    },
  });
};

export const getPackages = async (
  search?: string,
  isActive?: boolean,
  isPopular?: boolean,
  page = 1,
  limit = 20
) => {
  const skip = (page - 1) * limit;

  const where: any = {
    ...(search
      ? {
          OR: [
            {
              packageName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              packageCode: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(isPopular !== undefined ? { isPopular } : {}),
  };

  const [rawPackages, total] = await Promise.all([
    prisma.testPackage.findMany({
      where,
      skip,
      take: limit,
      include: {
        items: {
          include: {
            test: {
              include: {
                category: true,
                parameters: {
                  where: { isActive: true },
                  select: {
                    id: true,
                    parameterName: true,
                    shortName: true,
                    loincCode: true,
                    unit: true,
                  },
                  orderBy: { displayOrder: "asc" },
                },
              },
            },
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { packageName: "asc" }],
    }),
    prisma.testPackage.count({ where }),
  ]);

  const packages = rawPackages.map((pkg) => {
    const sumOfTestPrices = pkg.items.reduce(
      (sum, item) => sum + toNumeric(item.testPrice ?? item.test?.price),
      0
    );
    const totalPrice = toNumeric(pkg.totalPrice) || sumOfTestPrices;
    const offerPrice = pkg.offerPrice !== null ? toNumeric(pkg.offerPrice) : totalPrice;
    const totalSavings = Math.max(0, Number((totalPrice - offerPrice).toFixed(2)));
    const savingsPercentage =
      totalPrice > 0
        ? Number(((totalSavings / totalPrice) * 100).toFixed(2))
        : toNumeric(pkg.discountPercentage);
    const bundledTestsCount = pkg.items.length || pkg.includesTestsCount;
    const totalParametersCount = pkg.items.reduce(
      (acc, item) => acc + (item.test?.parameters?.length ?? 0),
      0
    );

    return {
      ...pkg,
      bundledTestsCount,
      totalParametersCount,
      totalSavings,
      savingsPercentage,
      pricingSummary: {
        sumOfIndividualTests: Number(sumOfTestPrices.toFixed(2)),
        totalPrice: Number(totalPrice.toFixed(2)),
        offerPrice: Number(offerPrice.toFixed(2)),
        totalSavings,
        savingsPercentage,
        gstPercentage: toNumeric(pkg.gstPercentage),
        currency: "INR",
      },
    };
  });

  return {
    packages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

export const getPackageById = async (id: string) => {
  const testPackage = await prisma.testPackage.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          test: {
            include: {
              category: true,
              parameters: {
                include: {
                  referenceRanges: true,
                },
                orderBy: { displayOrder: "asc" },
              },
            },
          },
        },
        orderBy: {
          displayOrder: "asc",
        },
      },
    },
  });

  if (!testPackage) {
    throw new Error("Test package not found");
  }

  return testPackage;
};

export const updatePackage = async (id: string, data: any) => {
  const testPackage = await prisma.testPackage.findUnique({
    where: { id },
  });

  if (!testPackage) {
    throw new Error("Test package not found");
  }

  return prisma.testPackage.update({
    where: { id },
    data: {
      ...data,
      includesTestsCount: data.tests?.length || testPackage.includesTestsCount,
    },
  });
};

export const deletePackage = async (id: string) => {
  const testPackage = await prisma.testPackage.findUnique({
    where: { id },
    include: {
      orderItems: true,
    },
  });

  if (!testPackage) {
    throw new Error("Test package not found");
  }

  if (testPackage.orderItems.length > 0) {
    throw new Error("Cannot delete package that is used in orders. Deactivate instead.");
  }

  await prisma.testPackage.delete({
    where: { id },
  });

  return { id, deleted: true };
};

export const addPackageItem = async (packageId: string, data: any) => {
  const testPackage = await prisma.testPackage.findUnique({
    where: { id: packageId },
  });

  if (!testPackage) {
    throw new Error("Test package not found");
  }

  const test = await prisma.test.findUnique({
    where: { id: data.testId },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  const existing = await prisma.testPackageItem.findFirst({
    where: {
      packageId,
      testId: data.testId,
    },
  });

  if (existing) {
    throw new Error("Test already exists in package");
  }

  const item = await prisma.testPackageItem.create({
    data: {
      packageId,
      testId: data.testId,
      testPrice: data.testPrice || test.price,
      discount: data.discount || 0,
      displayOrder: data.displayOrder || 0,
    },
  });

  await prisma.testPackage.update({
    where: { id: packageId },
    data: {
      includesTestsCount: {
        increment: 1,
      },
    },
  });

  return item;
};

export const removePackageItem = async (packageId: string, testId: string) => {
  const item = await prisma.testPackageItem.findFirst({
    where: {
      packageId,
      testId,
    },
  });

  if (!item) {
    throw new Error("Package item not found");
  }

  await prisma.testPackageItem.delete({
    where: { id: item.id },
  });

  await prisma.testPackage.update({
    where: { id: packageId },
    data: {
      includesTestsCount: {
        decrement: 1,
      },
    },
  });

  return { packageId, testId, deleted: true };
};

// =======================================================
// ENHANCED CATEGORIES
// =======================================================

export const updateCategoryEnhanced = async (id: string, data: any) => {
  const category = await prisma.testCategory.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error("Test category not found");
  }

  return prisma.testCategory.update({
    where: { id },
    data,
  });
};

// =======================================================
// EXPORT/IMPORT CATALOG
// =======================================================

export const exportCatalog = async () => {
  const [categories, tests, parameters, referenceRanges, packages] = await Promise.all([
    prisma.testCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.test.findMany({
      where: { isActive: true },
      include: {
        category: true,
        parameters: {
          where: { isActive: true },
          include: {
            referenceRanges: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { testName: "asc" },
    }),
    prisma.testParameter.findMany({
      where: { isActive: true },
      include: {
        test: true,
        referenceRanges: {
          where: { isActive: true },
        },
      },
    }),
    prisma.referenceRange.findMany({
      where: { isActive: true },
      include: {
        parameter: {
          include: {
            test: true,
          },
        },
      },
    }),
    prisma.testPackage.findMany({
      where: { isActive: true },
      include: {
        items: {
          include: {
            test: true,
          },
        },
      },
      orderBy: { packageName: "asc" },
    }),
  ]);

  return {
    categories,
    tests,
    parameters,
    referenceRanges,
    packages,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };
};

export const importCatalog = async (data: any) => {
  const { categories, tests, parameters, referenceRanges, packages } = data;

  const results = {
    categories: { created: 0, errors: [] as string[] },
    tests: { created: 0, errors: [] as string[] },
    parameters: { created: 0, errors: [] as string[] },
    referenceRanges: { created: 0, errors: [] as string[] },
    packages: { created: 0, errors: [] as string[] },
  };

  if (categories && Array.isArray(categories)) {
    for (const category of categories) {
      try {
        await prisma.testCategory.create({
          data: {
            code: category.code,
            name: category.name,
            description: category.description,
            department: category.department,
            color: category.color,
            icon: category.icon,
            displayOrder: category.displayOrder,
            isActive: true,
          },
        });
        results.categories.created++;
      } catch (error: any) {
        results.categories.errors.push(`${category.name}: ${error.message}`);
      }
    }
  }

  if (tests && Array.isArray(tests)) {
    for (const test of tests) {
      try {
        let categoryId = null;
        if (test.category) {
          const category = await prisma.testCategory.findFirst({
            where: { code: test.category.code || test.category.name },
          });
          if (category) {
            categoryId = category.id;
          }
        }

        await prisma.test.create({
          data: {
            testCode: test.testCode,
            testName: test.testName,
            shortName: test.shortName,
            categoryId,
            sampleType: test.sampleType,
            sampleContainer: test.sampleContainer,
            sampleVolume: test.sampleVolume,
            processingDepartment: test.processingDepartment,
            method: test.method,
            description: test.description,
            clinicalSignificance: test.clinicalSignificance,
            patientPreparation: test.patientPreparation,
            price: test.price,
            offerPrice: test.offerPrice,
            b2bRate: test.b2bRate,
            gstPercentage: test.gstPercentage,
            tatHours: test.tatHours,
            tatDisplay: test.tatDisplay,
            displayOrder: test.displayOrder,
            isActive: true,
          },
        });
        results.tests.created++;
      } catch (error: any) {
        results.tests.errors.push(`${test.testName}: ${error.message}`);
      }
    }
  }

  if (parameters && Array.isArray(parameters)) {
    for (const param of parameters) {
      try {
        const test = await prisma.test.findFirst({
          where: { testCode: param.test?.testCode || param.testCode },
        });

        if (!test) {
          throw new Error("Test not found");
        }

        await prisma.testParameter.create({
          data: {
            testId: test.id,
            parameterName: param.parameterName,
            shortName: param.shortName,
            loincCode: param.loincCode,
            unit: param.unit,
            dataType: param.dataType,
            measurementMethod: param.measurementMethod,
            dropdownOptions: param.dropdownOptions,
            allowRichText: param.allowRichText,
            decimalPrecision: param.decimalPrecision,
            displayOrder: param.displayOrder,
            isRequired: param.isRequired,
            isActive: true,
          },
        });
        results.parameters.created++;
      } catch (error: any) {
        results.parameters.errors.push(`${param.parameterName}: ${error.message}`);
      }
    }
  }

  if (referenceRanges && Array.isArray(referenceRanges)) {
    for (const range of referenceRanges) {
      try {
        const parameter = await prisma.testParameter.findFirst({
          where: {
            parameterName: range.parameter?.parameterName,
            test: {
              testCode: range.parameter?.test?.testCode,
            },
          },
        });

        if (!parameter) {
          throw new Error("Parameter not found");
        }

        await prisma.referenceRange.create({
          data: {
            parameterId: parameter.id,
            ageGroup: range.ageGroup,
            gender: range.gender,
            minAge: range.minAge,
            maxAge: range.maxAge,
            minAgeUnit: range.minAgeUnit,
            maxAgeUnit: range.maxAgeUnit,
            criticalLow: range.criticalLow,
            normalLow: range.normalLow,
            normalHigh: range.normalHigh,
            criticalHigh: range.criticalHigh,
            interpretation: range.interpretation,
            notes: range.notes,
            displayOrder: range.displayOrder,
            isActive: true,
          },
        });
        results.referenceRanges.created++;
      } catch (error: any) {
        results.referenceRanges.errors.push(`${range.parameter?.parameterName}: ${error.message}`);
      }
    }
  }

  if (packages && Array.isArray(packages)) {
    for (const pkg of packages) {
      try {
        const createdPackage = await prisma.testPackage.create({
          data: {
            packageCode: pkg.packageCode,
            packageName: pkg.packageName,
            description: pkg.description,
            totalPrice: pkg.totalPrice,
            offerPrice: pkg.offerPrice,
            discountPercentage: pkg.discountPercentage,
            gstPercentage: pkg.gstPercentage,
            tatHours: pkg.tatHours,
            tatDisplay: pkg.tatDisplay,
            targetAudience: pkg.targetAudience,
            recommendedFor: pkg.recommendedFor,
            isActive: true,
            isPopular: pkg.isPopular,
            displayOrder: pkg.displayOrder,
            color: pkg.color,
            icon: pkg.icon,
          },
        });

        if (pkg.items && Array.isArray(pkg.items)) {
          for (const item of pkg.items) {
            try {
              const test = await prisma.test.findFirst({
                where: { testCode: item.test?.testCode },
              });

              if (test) {
                await prisma.testPackageItem.create({
                  data: {
                    packageId: createdPackage.id,
                    testId: test.id,
                    testPrice: item.testPrice,
                    discount: item.discount,
                    displayOrder: item.displayOrder,
                  },
                });
              }
            } catch (error: any) {
              console.error("Error importing package item:", error);
            }
          }
        }

        results.packages.created++;
      } catch (error: any) {
        results.packages.errors.push(`${pkg.packageName}: ${error.message}`);
      }
    }
  }

  return results;
};