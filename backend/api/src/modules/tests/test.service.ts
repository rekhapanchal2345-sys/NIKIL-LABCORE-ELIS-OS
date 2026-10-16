import prisma from "../../../config/database";

export const createCategory = async (
  data: any
) => {
  const existing =
    await prisma.testCategory.findFirst({
      where: {
        OR: [
          { code: data.code },
          { name: data.name },
        ],
      },
    });

  if (existing) {
    throw new Error(
      "Test category already exists"
    );
  }

  return prisma.testCategory.create({
    data,
  });
};

export const getCategories = async () => {
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
          price: true,
          sampleType: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const getCategoryById =
  async (id: string) => {
    const category =
      await prisma.testCategory.findUnique({
        where: { id },
        include: {
          tests: {
            include: {
              parameters: {
                include: {
                  referenceRanges: true,
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
      throw new Error(
        "Test category not found"
      );
    }

    return category;
  };

export const updateCategory =
  async (
    id: string,
    data: any
  ) => {
    const category =
      await prisma.testCategory.findUnique({
        where: { id },
      });

    if (!category) {
      throw new Error(
        "Test category not found"
      );
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

  // Check if category has tests
  if (category.tests.length > 0) {
    throw new Error("Cannot delete category that has tests. Deactivate instead.");
  }

  await prisma.testCategory.delete({
    where: { id },
  });

  return { id, deleted: true };
};

export const createTest = async (
  data: any
) => {
  // Clean up empty strings and null values
  const cleanedData = Object.keys(data).reduce((acc: any, key) => {
    const value = data[key];
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  // Only check category if categoryId is provided and valid
  if (cleanedData.categoryId && cleanedData.categoryId.length > 0) {
    const category =
      await prisma.testCategory.findUnique({
        where: {
          id: cleanedData.categoryId,
        },
      });

    if (!category) {
      throw new Error(
        "Test category not found"
      );
    }
  } else {
    // Remove categoryId if it's empty or invalid
    delete cleanedData.categoryId;
  }

  const existing =
    await prisma.test.findUnique({
      where: {
        testCode: cleanedData.testCode,
      },
    });

  if (existing) {
    throw new Error(
      "Test code already exists"
    );
  }

  return prisma.test.create({
    data: {
      ...cleanedData,
      gstPercentage:
        cleanedData.gstPercentage ?? 0,
      tatHours:
        cleanedData.tatHours ?? 24,
      isActive:
        cleanedData.isActive ?? true,
    },
    include: {
      category: true,
      parameters: true,
    },
  });
};

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

  const where: any = {};

  // Only add search condition if search term is provided
  if (search) {
    where.OR = [
      {
        testName: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
      {
        testCode: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
      {
        shortName: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
    ];
  }

  // Only add categoryId if provided
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Only add isActive if explicitly set
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Only add sampleType if provided and valid
  if (sampleType && sampleType !== "") {
    where.sampleType = sampleType;
  }

  // Only add department filter if provided
  if (department && department !== "") {
    where.category = {
      department: {
        contains: department,
        mode: "insensitive" as const,
      },
    };
  }

  try {
    const [tests, total] =
      await Promise.all([
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
                },
              },
              orderBy: {
                displayOrder: "asc",
              },
            },
          },
          orderBy: [
            { displayOrder: "asc" },
            { testName: "asc" },
          ],
        }),

        prisma.test.count({
          where,
        }),
      ]);

    return {
      tests,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit
        ),
        hasNextPage:
          page * limit < total,
        hasPreviousPage:
          page > 1,
      },
    };
  } catch (error) {
    console.error('Error in getTests:', error);
    throw error;
  }
};

export const getTestById =
  async (id: string) => {
    const test =
      await prisma.test.findUnique({
        where: { id },
        include: {
          category: true,

          parameters: {
            include: {
              referenceRanges: true,
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

export const updateTest = async (
  id: string,
  data: any
) => {
  const test =
    await prisma.test.findUnique({
      where: { id },
    });

  if (!test) {
    throw new Error("Test not found");
  }

  if (data.categoryId) {
    const category =
      await prisma.testCategory.findUnique({
        where: {
          id: data.categoryId,
        },
      });

    if (!category) {
      throw new Error(
        "Test category not found"
      );
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

export const addParameter = async (
  testId: string,
  data: any
) => {
  const test =
    await prisma.test.findUnique({
      where: { id: testId },
    });

  if (!test) {
    throw new Error("Test not found");
  }

  return prisma.testParameter.create({
    data: {
      testId,
      parameterName:
        data.parameterName,
      unit: data.unit,
      dataType:
        data.dataType,
      displayOrder:
        data.displayOrder ?? 1,
      isRequired:
        data.isRequired ?? true,
    },
  });
};

export const updateParameter =
  async (
    id: string,
    data: any
  ) => {
    const parameter =
      await prisma.testParameter.findUnique({
        where: { id },
      });

    if (!parameter) {
      throw new Error(
        "Parameter not found"
      );
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
    ];
  }
  return prisma.testParameter.findMany({
    where,
    include: {
      referenceRanges: true,
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

export const addReferenceRange =
  async (
    parameterId: string,
    data: any
  ) => {
    const parameter =
      await prisma.testParameter.findUnique({
        where: { id: parameterId },
      });

    if (!parameter) {
      throw new Error(
        "Parameter not found"
      );
    }

    return prisma.referenceRange.create({
      data: {
        parameterId,
        ...data,
      },
    });
  };

export const updateReferenceRange =
  async (
    id: string,
    data: any
  ) => {
    const range =
      await prisma.referenceRange.findUnique({
        where: { id },
      });

    if (!range) {
      throw new Error(
        "Reference range not found"
      );
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

  // Check if test is used in orders
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

  // Check if parameter has result values
  if (parameter.resultValues.length > 0) {
    throw new Error("Cannot delete parameter that has result values. Deactivate instead.");
  }

  await prisma.testParameter.delete({
    where: { id },
  });

  return { id, deleted: true };
};

export const deleteReferenceRange = async (id: string) => {
  const range = await prisma.referenceRange.findUnique({
    where: { id },
  });

  if (!range) {
    throw new Error("Reference range not found");
  }

  await prisma.referenceRange.delete({
    where: { id },
  });

  return { id, deleted: true };
};

// =======================================================
// TEST PACKAGES
// =======================================================

export const createPackage = async (data: any) => {
  const existing = await prisma.testPackage.findFirst({
    where: {
      OR: [
        { packageCode: data.packageCode },
        { packageName: data.packageName },
      ],
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
          ],
        }
      : {}),

    ...(isActive !== undefined
      ? { isActive }
      : {}),

    ...(isPopular !== undefined
      ? { isPopular }
      : {}),
  };

  const [packages, total] = await Promise.all([
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
              },
            },
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
      orderBy: [
        { displayOrder: "asc" },
        { packageName: "asc" },
      ],
    }),

    prisma.testPackage.count({
      where,
    }),
  ]);

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
              parameters: true,
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

  // Update testPackage test count
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

  // Update testPackage test count
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
      orderBy: { name: 'asc' },
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
      orderBy: { testName: 'asc' },
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
      orderBy: { packageName: 'asc' },
    }),
  ]);

  return {
    categories,
    tests,
    parameters,
    referenceRanges,
    packages,
    exportedAt: new Date().toISOString(),
    version: '1.0',
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

  // Import Categories
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

  // Import Tests
  if (tests && Array.isArray(tests)) {
    for (const test of tests) {
      try {
        // Find or create category
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

  // Import Parameters
  if (parameters && Array.isArray(parameters)) {
    for (const param of parameters) {
      try {
        const test = await prisma.test.findFirst({
          where: { testCode: param.test?.testCode || param.testCode },
        });

        if (!test) {
          throw new Error('Test not found');
        }

        await prisma.testParameter.create({
          data: {
            testId: test.id,
            parameterName: param.parameterName,
            shortName: param.shortName,
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

  // Import Reference Ranges
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
          throw new Error('Parameter not found');
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

  // Import Packages
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

        // Import package items
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
              console.error('Error importing package item:', error);
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