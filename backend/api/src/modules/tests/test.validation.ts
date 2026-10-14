import { z } from "zod";

export const createCategorySchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(150),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema =
  createCategorySchema.partial();

export const categoryIdSchema = z.object({
  id: z.string().cuid(),
});

export const createTestSchema = z.object({
  testCode: z.string().min(2).max(50),

  testName: z.string().min(2).max(200),
  shortName: z.string().max(100).optional(),

  categoryId: z.string().optional().transform((val) => val === "" ? undefined : val),

  sampleType: z.enum(["BLOOD", "URINE", "SERUM", "PLASMA", "STOOL", "SWAB", "SPUTUM", "CSF", "TISSUE", "OTHER"]),

  sampleContainer: z.string().max(100).optional(),
  sampleVolume: z.string().max(50).optional(),
  processingDepartment: z.string().max(100).optional(),
  method: z.string().max(200).optional(),

  description: z.string().max(1000).optional(),
  clinicalSignificance: z.string().max(2000).optional(),
  patientPreparation: z.string().max(1000).optional(),

  price: z.number().min(0),
  offerPrice: z.number().min(0).optional(),
  b2bRate: z.number().min(0).optional(),

  gstPercentage: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional(),

  tatHours: z.coerce
    .number()
    .int()
    .min(1)
    .optional(),

  tatDisplay: z.string().max(100).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),

  isActive: z.boolean().optional(),
});

export const updateTestSchema =
  createTestSchema.partial();

export const testIdSchema = z.object({
  id: z.string().cuid(),
});

export const testQuerySchema = z.object({
  search: z.string().optional().transform(val => val === "" ? undefined : val),

  categoryId: z.string().optional().transform(val => val === "" ? undefined : val),

  isActive: z.string().optional().transform(val => {
    if (val === "" || val === undefined) return undefined;
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined;
  }),

  sampleType: z.string().optional().transform(val => {
    if (val === "" || val === undefined) return undefined;
    const validTypes = ["BLOOD", "URINE", "SERUM", "PLASMA", "STOOL", "SWAB", "SPUTUM", "CSF", "TISSUE", "OTHER"];
    if (validTypes.includes(val)) return val;
    return undefined;
  }),

  department: z.string().optional().transform(val => val === "" ? undefined : val),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

export const createParameterSchema =
  z.object({
    parameterName: z.string().min(1).max(150),

    unit: z.string().max(50).optional(),

    dataType: z.enum([
      "NUMERIC",
      "TEXT",
      "BOOLEAN",
      "OPTION",
    ]),

    displayOrder: z.coerce
      .number()
      .int()
      .min(1)
      .optional(),

    isRequired: z.boolean().optional(),
  });

export const updateParameterSchema =
  createParameterSchema.partial();

export const parameterIdSchema = z.object({
  id: z.string().cuid(),
});

export const baseReferenceRangeSchema = z.object({
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  minAge: z.coerce.number().int().min(0).optional(),
  maxAge: z.coerce.number().int().min(0).optional(),
  criticalLow: z.coerce.number().optional(),
  normalLow: z.coerce.number().optional(),
  normalHigh: z.coerce.number().optional(),
  criticalHigh: z.coerce.number().optional(),
  interpretation: z.string().max(500).optional(),
  minAgeUnit: z.enum(["DAYS", "MONTHS", "YEARS"]).optional(),
  maxAgeUnit: z.enum(["DAYS", "MONTHS", "YEARS"]).optional(),
  ageGroup: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const referenceRangeRefinement = (data: any) => {
  const { criticalLow, normalLow, normalHigh, criticalHigh } = data;
  if (criticalLow !== undefined && normalLow !== undefined && criticalLow >= normalLow) return false;
  if (normalLow !== undefined && normalHigh !== undefined && normalLow > normalHigh) return false;
  if (normalHigh !== undefined && criticalHigh !== undefined && normalHigh >= criticalHigh) return false;
  return true;
};

export const createReferenceRangeSchema = baseReferenceRangeSchema.refine(referenceRangeRefinement, {
  message: "Range boundaries must satisfy: criticalLow < normalLow <= normalHigh < criticalHigh",
  path: ["normalLow"],
});

export const updateReferenceRangeSchema = baseReferenceRangeSchema.partial().refine(referenceRangeRefinement, {
  message: "Range boundaries must satisfy: criticalLow < normalLow <= normalHigh < criticalHigh",
  path: ["normalLow"],
});

export const referenceRangeIdSchema =
  z.object({
    id: z.string().cuid(),
  });

// =======================================================
// TEST PACKAGES
// =======================================================

export const createPackageSchema = z.object({
  packageCode: z.string().min(2).max(50),
  packageName: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),

  totalPrice: z.number().min(0),
  offerPrice: z.number().min(0).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  gstPercentage: z.number().min(0).max(100).optional(),

  tatHours: z.coerce.number().int().min(1).optional(),
  tatDisplay: z.string().max(100).optional(),

  targetAudience: z.string().max(100).optional(),
  recommendedFor: z.string().max(2000).optional(),

  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),

  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
});

export const updatePackageSchema = createPackageSchema.partial();

export const packageIdSchema = z.object({
  id: z.string().cuid(),
});

export const packageQuerySchema = z.object({
  search: z.string().optional().transform(val => val === "" ? undefined : val),
  isActive: z.string().optional().transform(val => {
    if (val === "" || val === undefined) return undefined;
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined;
  }),
  isPopular: z.string().optional().transform(val => {
    if (val === "" || val === undefined) return undefined;
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined;
  }),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createPackageItemSchema = z.object({
  testId: z.string().cuid(),
  testPrice: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

export const packageItemParamsSchema = z.object({
  id: z.string().cuid(),
  testId: z.string().cuid(),
});

// =======================================================
// ENHANCED CATEGORIES
// =======================================================

export const updateCategoryEnhancedSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(500).optional(),
  department: z.string().max(100).optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// =======================================================
// EXPORT/IMPORT CATALOG
// =======================================================

export const importCatalogSchema = z.object({
  categories: z.array(z.object({
    code: z.string(),
    name: z.string(),
    description: z.string().optional(),
    department: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    displayOrder: z.number().optional(),
  })).optional(),

  tests: z.array(z.object({
    testCode: z.string(),
    testName: z.string(),
    shortName: z.string().optional(),
    category: z.object({
      code: z.string().optional(),
      name: z.string().optional(),
    }).optional(),
    sampleType: z.string(),
    sampleContainer: z.string().optional(),
    sampleVolume: z.string().optional(),
    processingDepartment: z.string().optional(),
    method: z.string().optional(),
    description: z.string().optional(),
    clinicalSignificance: z.string().optional(),
    patientPreparation: z.string().optional(),
    price: z.number(),
    offerPrice: z.number().optional(),
    b2bRate: z.number().optional(),
    gstPercentage: z.number().optional(),
    tatHours: z.number().optional(),
    tatDisplay: z.string().optional(),
    displayOrder: z.number().optional(),
  })).optional(),

  parameters: z.array(z.object({
    parameterName: z.string(),
    shortName: z.string().optional(),
    unit: z.string().optional(),
    dataType: z.string(),
    measurementMethod: z.string().optional(),
    dropdownOptions: z.string().optional(),
    allowRichText: z.boolean().optional(),
    decimalPrecision: z.number().optional(),
    displayOrder: z.number().optional(),
    isRequired: z.boolean().optional(),
    test: z.object({
      testCode: z.string().optional(),
    }).optional(),
  })).optional(),

  referenceRanges: z.array(z.object({
    ageGroup: z.string().optional(),
    gender: z.string().optional(),
    minAge: z.number().optional(),
    maxAge: z.number().optional(),
    minAgeUnit: z.string().optional(),
    maxAgeUnit: z.string().optional(),
    criticalLow: z.number().optional(),
    normalLow: z.number().optional(),
    normalHigh: z.number().optional(),
    criticalHigh: z.number().optional(),
    interpretation: z.string().optional(),
    notes: z.string().optional(),
    displayOrder: z.number().optional(),
    parameter: z.object({
      parameterName: z.string().optional(),
      test: z.object({
        testCode: z.string().optional(),
      }).optional(),
    }).optional(),
  })).optional(),

  packages: z.array(z.object({
    packageCode: z.string(),
    packageName: z.string(),
    description: z.string().optional(),
    totalPrice: z.number(),
    offerPrice: z.number().optional(),
    discountPercentage: z.number().optional(),
    gstPercentage: z.number().optional(),
    tatHours: z.number().optional(),
    tatDisplay: z.string().optional(),
    targetAudience: z.string().optional(),
    recommendedFor: z.string().optional(),
    isPopular: z.boolean().optional(),
    displayOrder: z.number().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    items: z.array(z.object({
      test: z.object({
        testCode: z.string().optional(),
      }).optional(),
      testPrice: z.number().optional(),
      discount: z.number().optional(),
      displayOrder: z.number().optional(),
    })).optional(),
  })).optional(),
});