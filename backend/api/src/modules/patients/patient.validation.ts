import { z } from "zod";

// Aadhaar validation regex (12 digits)
const aadhaarRegex = /^[2-9][0-9]{11}$/;

// PAN card validation
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/**
 * Phone values are sanitised to bare digits before this runs. An Indian mobile
 * is 10 digits; landlines with an area code run to 11-12. `undefined`/empty means
 * "not supplied", which is allowed for every phone column.
 */
const isOptionalPhone = (val: string | undefined) => !val || /^\d{10,12}$/.test(val);

// Robust phone sanitization: strips non-digits, trims leading 91 or 0
export const sanitizePhone = (val: string | null | undefined): string | undefined => {
  if (!val || typeof val !== 'string') return undefined;
  let digits = val.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits || undefined;
};

const MARITAL_STATUS_VALUES = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"] as const;

export const normalizeMaritalStatus = (val: unknown) => {
  if (val === undefined) return undefined;
  if (val === null || val === '') return null;
  if (typeof val === 'string') {
    const upper = val.trim().toUpperCase();
    if ((MARITAL_STATUS_VALUES as readonly string[]).includes(upper)) {
      return upper;
    }
  }
  return val;
};

export const createPatientSchema = {
  body: z.object({
    // Basic Information (Required)
    firstName: z.string().min(1, "First name is required").max(100)
      .transform(val => val.trim()),
    middleName: z.string().max(100).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),
    lastName: z.string().min(1, "Last name is required").max(100)
      .transform(val => val.trim()),
    
    dateOfBirth: z.string().optional().or(z.literal('')).or(z.null())
      .transform(val => val || undefined)
      .refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        const today = new Date();
        return date <= today && date.getFullYear() >= 1900;
      }, "Date of birth cannot be in the future and must be valid"),

    gender: z.enum(["MALE", "FEMALE", "OTHER"]),

    // Contact Information with Enhanced Validation
    phone: z.string()
      .max(30)
      .optional()
      .or(z.literal(''))
      .or(z.null())
      .transform(val => sanitizePhone(val))
      .refine((val) => {
        // Sanitised to bare digits: an Indian mobile is 10, landlines with an
        // area code run to 11-12. Anything shorter than 10 is a typo.
        if (!val) return true;
        return /^\d{10,12}$/.test(val);
      }, "Invalid phone number format (must be 10-12 digits)"),

    alternatePhone: z.string().max(30).optional().or(z.literal('')).or(z.null())
      .transform(val => sanitizePhone(val))
      .refine(isOptionalPhone, "Invalid alternate phone number format (must be 10-12 digits)"),

    email: z.string()
      .email("Invalid email format")
      .max(255)
      .optional()
      .or(z.literal(''))
      .or(z.null())
      .transform(val => {
        if (!val || val === '') return undefined;
        return val.toLowerCase().trim();
      }),

    // Address Information (Enhanced)
    address: z.string().max(500).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),
    
    landmark: z.string().max(200).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),

    city: z.string().max(100).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),

    state: z.string().max(100).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),

    postalCode: z.string()
      .max(20)
      .optional()
      .or(z.literal(''))
      .or(z.null())
      .transform(val => val ? val.replace(/\D/g, '').trim() : undefined)
      .refine((val) => {
        if (!val || val === '') return true; // Allow empty/null
        return /^\d{6}$/.test(val);
      }, "Invalid PIN code format (exact 6 digits required)"),

    country: z.string().max(100).default("India"),

    // Medical Information
    bloodGroup: z
      .enum([
        "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"
      ])
      .optional()
      .or(z.literal(''))
      .or(z.null())
      .transform(val => (val as any) || undefined),

    // Emergency Contact (Enhanced)
    emergencyContactName: z.string().max(100).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),

    emergencyContactPhone: z.string()
      .max(30)
      .optional()
      .or(z.literal(''))
      .or(z.null())
      .transform(val => sanitizePhone(val))
      .refine(isOptionalPhone, "Invalid emergency contact phone format (must be 10-12 digits)"),

    emergencyContactRelationship: z.preprocess((val) => {
      if (!val || typeof val !== 'string') return undefined;
      const upper = val.trim().toUpperCase();
      if (["FATHER", "MOTHER", "SPOUSE", "SON", "DAUGHTER", "BROTHER", "SISTER", "FRIEND", "OTHER"].includes(upper)) {
        return upper;
      }
      if (["WIFE", "HUSBAND", "PARTNER"].includes(upper)) return "SPOUSE";
      if (["DAD", "PARENT"].includes(upper)) return "FATHER";
      if (["MOM"].includes(upper)) return "MOTHER";
      return "OTHER";
    }, z.enum([
      "FATHER", "MOTHER", "SPOUSE", "SON", "DAUGHTER", "BROTHER", "SISTER", "FRIEND", "OTHER"
    ]).optional().or(z.null())),

    emergencyContactAddress: z.string().max(500).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),

    // Identity Documents (KYC)
    aadhaarNumber: z.string()
      .optional()
      .or(z.literal(''))
      .or(z.null())
      .transform(val => val?.replace(/\s/g, '') || undefined)
      .refine((val) => {
        if (!val) return true;
        return aadhaarRegex.test(val);
      }, "Invalid Aadhaar number format (12 digits)"),

    panNumber: z.string()
      .max(10)
      .optional()
      .or(z.literal(''))
      .or(z.null())
      .transform(val => val?.toUpperCase().trim() || undefined)
      .refine((val) => {
        if (!val) return true;
        return panRegex.test(val);
      }, "Invalid PAN card format"),

    nationalId: z.string().max(50).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),

    // Patient Type & Status
    patientType: z.preprocess((val) => {
      if (!val || typeof val !== 'string') return "GENERAL";
      const upper = val.trim().toUpperCase();
      if (["GENERAL", "VIP", "STAFF", "SENIOR_CITIZEN", "CHILD", "INPATIENT", "OUTPATIENT", "EMERGENCY"].includes(upper)) {
        return upper;
      }
      return "GENERAL";
    }, z.enum(["GENERAL", "VIP", "STAFF", "SENIOR_CITIZEN", "CHILD", "INPATIENT", "OUTPATIENT", "EMERGENCY"]).default("GENERAL")),

    isActive: z.boolean().optional().default(true),
    
    maritalStatus: z.preprocess(
      normalizeMaritalStatus,
      z.enum(MARITAL_STATUS_VALUES).optional().nullable()
    ).transform(val => val || undefined),

    occupation: z.string().max(100).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),

    nationality: z.string().max(50).default("Indian"),

    // Medical History
    allergies: z.preprocess((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) {
        return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }
      return [];
    }, z.array(z.string()).optional().default([])),
    
    chronicDiseases: z.preprocess((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) {
        return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }
      return [];
    }, z.array(z.string()).optional().default([])),

    medicalConditions: z.preprocess((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) {
        return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }
      return undefined;
    }, z.array(z.string()).optional()),
    
    currentMedications: z.preprocess((val) => {
      if (Array.isArray(val)) {
        return val.map(item => {
          if (typeof item === 'string') return { name: item };
          return item;
        });
      }
      if (typeof val === 'string' && val.trim()) {
        return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).map(name => ({ name }));
      }
      return [];
    }, z.array(z.object({
      name: z.string(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
    })).optional().default([])),

    // Clinical Information
    fastingStatus: z.enum(["YES", "NO", "NOT_APPLICABLE"])
      .optional()
      .or(z.literal(''))
      .or(z.null())
      .transform(val => (val as any) || undefined),

    height: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isFinite(num) ? num : undefined;
    }, z.number().min(1, "Height must be greater than 0").max(300, "Height cannot exceed 300 cm").optional()),
    
    weight: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isFinite(num) ? num : undefined;
    }, z.number().min(0.5, "Weight must be at least 0.5 kg").max(500, "Weight cannot exceed 500 kg").optional()),

    // Doctor & Insurance
    doctorId: z.string().optional().or(z.literal('')).or(z.null())
      .transform(val => val || undefined),

    insuranceProvider: z.string().max(100).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),

    insuranceNumber: z.string().max(50).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),

    insuranceGroupNumber: z.string().max(50).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),
    
    insuranceExpiryDate: z.string().optional().or(z.literal('')).or(z.null())
      .transform(val => val || undefined),

    // Photo & Documents
    photoUrl: z.string().url().optional().or(z.literal('')).or(z.null())
      .transform(val => val || undefined),

    // Preferences
    preferredLanguage: z.preprocess((val) => {
      if (!val || typeof val !== 'string') return "ENGLISH";
      const upper = val.trim().toUpperCase();
      if (["ENGLISH", "HINDI", "BENGALI", "TAMIL", "TELUGU", "MARATHI", "GUJARATI", "KANNADA", "MALAYALAM", "PUNJABI", "SPANISH", "OTHER"].includes(upper)) {
        return upper;
      }
      return "OTHER";
    }, z.enum(["ENGLISH", "HINDI", "BENGALI", "TAMIL", "TELUGU", "MARATHI", "GUJARATI", "KANNADA", "MALAYALAM", "PUNJABI", "SPANISH", "OTHER"])
      .default("ENGLISH")),

    preferredCommunicationMethod: z.string().max(50).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.toUpperCase().trim() || undefined),

    notificationPreferences: z.array(z.string()).optional(),

    communicationPreference: z.object({
      sms: z.boolean().optional(),
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional(),
      call: z.boolean().optional(),
    }).optional(),

    // Consent & Privacy (Informed Explicit Consent)
    consentForTreatment: z.boolean().default(false),
    consentForDataSharing: z.boolean().default(false),
    consentForMarketing: z.boolean().default(false),
    privacyConsent: z.boolean().optional(),

    // Family/Relationship
    familyHeadId: z.string().optional().or(z.literal('')).or(z.null())
      .transform(val => val || undefined), // Link to primary family member

    relationshipToHead: z.enum(["SELF", "SPOUSE", "CHILD", "PARENT", "SIBLING", "OTHER"])
      .optional().or(z.literal('')).or(z.null())
      .transform(val => (val as any) || undefined),

    // Additional Notes & Clinical Vitals Payload
    notes: z.string().max(10000).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),
    additionalInformation: z.string().max(2000).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),

    // Draft support
    isDraft: z.boolean().default(false),
    
    // Registration metadata
    registrationSource: z.enum(["WALK_IN", "ONLINE", "PHONE", "MOBILE_APP", "REFERRAL"])
      .default("WALK_IN"),

    referralSource: z.string().max(200).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.trim() || undefined),

  }).passthrough(),
};

export const updatePatientSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    // All fields optional for updates
    firstName: z.string().min(1).max(100).optional().transform(val => val?.trim()),
    middleName: z.string().max(100).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    lastName: z.string().min(1).max(100).optional().transform(val => val?.trim()),
    
    dateOfBirth: z.string().optional().or(z.literal('')).or(z.null())
      .transform(val => {
        if (!val || val === '') return undefined;
        const date = new Date(val);
        if (isNaN(date.getTime())) return undefined;
        return val; // Return string, service layer will convert to Date
      }),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

    phone: z.string().max(30).optional().or(z.literal('')).or(z.null())
      .transform(val => sanitizePhone(val))
      .refine(isOptionalPhone, "Invalid phone number format (must be 10-12 digits)"),
    alternatePhone: z.string().max(30).optional().or(z.literal('')).or(z.null())
      .transform(val => sanitizePhone(val))
      .refine(isOptionalPhone, "Invalid alternate phone number format (must be 10-12 digits)"),

    email: z.string().email().optional().or(z.literal('')).or(z.null())
      .transform(val => val?.toLowerCase().trim() || undefined),

    address: z.string().max(500).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    landmark: z.string().max(200).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    city: z.string().max(100).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    state: z.string().max(100).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    postalCode: z.string().max(20).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    country: z.string().max(100).optional(),

    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"])
      .optional().or(z.literal('')).or(z.null()).transform(val => (val as any) || undefined),

    emergencyContactName: z.string().max(100).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    emergencyContactPhone: z.string().max(30).optional().or(z.literal('')).or(z.null())
      .transform(val => sanitizePhone(val))
      .refine(isOptionalPhone, "Invalid emergency contact phone format (must be 10-12 digits)"),
    emergencyContactRelationship: z.preprocess((val) => {
      if (!val || typeof val !== 'string') return undefined;
      const upper = val.trim().toUpperCase();
      if (["FATHER", "MOTHER", "SPOUSE", "SON", "DAUGHTER", "BROTHER", "SISTER", "FRIEND", "OTHER"].includes(upper)) {
        return upper;
      }
      if (["WIFE", "HUSBAND", "PARTNER"].includes(upper)) return "SPOUSE";
      if (["DAD", "FATHER", "PARENT"].includes(upper)) return "FATHER";
      if (["MOM", "MOTHER"].includes(upper)) return "MOTHER";
      if (["BROTHER", "SIBLING"].includes(upper)) return "BROTHER";
      if (["SISTER"].includes(upper)) return "SISTER";
      if (["SON", "CHILD"].includes(upper)) return "SON";
      if (["DAUGHTER"].includes(upper)) return "DAUGHTER";
      if (["FRIEND"].includes(upper)) return "FRIEND";
      return "OTHER";
    }, z.enum(["FATHER", "MOTHER", "SPOUSE", "SON", "DAUGHTER", "BROTHER", "SISTER", "FRIEND", "OTHER"]).optional().or(z.null())),

    emergencyContactAddress: z.string().max(500).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),

    aadhaarNumber: z.string().optional().or(z.literal('')).or(z.null())
      .transform(val => val?.replace(/\s/g, '') || undefined)
      .refine((val) => !val || aadhaarRegex.test(val), "Invalid Aadhaar number format (12 digits)"),
    panNumber: z.string().max(10).optional().or(z.literal('')).or(z.null())
      .transform(val => val?.toUpperCase().trim() || undefined)
      .refine((val) => !val || panRegex.test(val), "Invalid PAN card format"),
    nationalId: z.string().max(50).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),

    patientType: z.preprocess((val) => {
      if (!val || typeof val !== 'string') return undefined;
      const upper = val.trim().toUpperCase();
      if (["GENERAL", "VIP", "STAFF", "SENIOR_CITIZEN", "CHILD", "INPATIENT", "OUTPATIENT", "EMERGENCY"].includes(upper)) {
        return upper;
      }
      return "GENERAL";
    }, z.enum(["GENERAL", "VIP", "STAFF", "SENIOR_CITIZEN", "CHILD", "INPATIENT", "OUTPATIENT", "EMERGENCY"]).optional()),
    isActive: z.boolean().optional(),
    maritalStatus: z.preprocess(
      normalizeMaritalStatus,
      z.enum(MARITAL_STATUS_VALUES).optional().nullable()
    ).transform(val => val ?? undefined),
    occupation: z.string().max(100).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    nationality: z.string().max(50).optional(),

    allergies: z.preprocess((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) {
        return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }
      return undefined;
    }, z.array(z.string()).optional()),

    medicalConditions: z.preprocess((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) {
        return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }
      return undefined;
    }, z.array(z.string()).optional()),

    chronicDiseases: z.preprocess((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) {
        return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }
      return undefined;
    }, z.array(z.string()).optional()),

    currentMedications: z.preprocess((val) => {
      if (Array.isArray(val)) {
        return val.map(item => {
          if (typeof item === 'string') return { name: item };
          return item;
        });
      }
      if (typeof val === 'string' && val.trim()) {
        return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).map(name => ({ name }));
      }
      return undefined;
    }, z.array(z.object({
      name: z.string(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
    })).optional()),

    fastingStatus: z.preprocess((val) => {
      if (!val || typeof val !== 'string') return undefined;
      const upper = val.trim().toUpperCase();
      if (upper === 'YES' || upper.startsWith('FASTING')) return 'YES';
      if (upper === 'NO' || upper === 'NON_FASTING' || upper === 'RANDOM') return 'NO';
      if (upper === 'NOT_APPLICABLE' || upper === 'NA') return 'NOT_APPLICABLE';
      return 'NOT_APPLICABLE';
    }, z.enum(["YES", "NO", "NOT_APPLICABLE"]).optional().or(z.literal('')).or(z.null()).transform(val => (val as any) || undefined)),
    height: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isFinite(num) ? num : undefined;
    }, z.number().min(1, "Height must be greater than 0").max(300, "Height cannot exceed 300 cm").optional()),
    weight: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isFinite(num) ? num : undefined;
    }, z.number().min(0.5, "Weight must be at least 0.5 kg").max(500, "Weight cannot exceed 500 kg").optional()),

    doctorId: z.string().optional().or(z.literal('')).or(z.null()).transform(val => val || undefined),
    insuranceProvider: z.string().max(100).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    insuranceNumber: z.string().max(50).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    insuranceGroupNumber: z.string().max(50).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    insuranceExpiryDate: z.string().optional().or(z.literal('')).or(z.null()).transform(val => val || undefined),

    photoUrl: z.string().url().optional().or(z.literal('')).or(z.null()).transform(val => val || undefined),

    preferredLanguage: z.preprocess((val) => {
      if (!val || typeof val !== 'string') return undefined;
      const upper = val.trim().toUpperCase();
      if (["ENGLISH", "HINDI", "BENGALI", "TAMIL", "TELUGU", "MARATHI", "GUJARATI", "KANNADA", "MALAYALAM", "PUNJABI", "SPANISH", "OTHER"].includes(upper)) {
        return upper;
      }
      return "OTHER";
    }, z.enum(["ENGLISH", "HINDI", "BENGALI", "TAMIL", "TELUGU", "MARATHI", "GUJARATI", "KANNADA", "MALAYALAM", "PUNJABI", "SPANISH", "OTHER"]).optional()),
    
    preferredCommunicationMethod: z.string().max(50).optional().or(z.literal('')).or(z.null()).transform(val => val?.toUpperCase().trim() || undefined),
    notificationPreferences: z.array(z.string()).optional(),

    communicationPreference: z.object({
      sms: z.boolean().optional(),
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional(),
      call: z.boolean().optional(),
    }).optional(),

    consentForTreatment: z.boolean().optional(),
    consentForDataSharing: z.boolean().optional(),
    consentForMarketing: z.boolean().optional(),
    privacyConsent: z.boolean().optional(),

    familyHeadId: z.string().optional().or(z.literal('')).or(z.null()).transform(val => val || undefined),
    relationshipToHead: z.enum(["SELF", "SPOUSE", "CHILD", "PARENT", "SIBLING", "OTHER"]).optional().or(z.literal('')).or(z.null()).transform(val => (val as any) || undefined),

    notes: z.string().max(10000).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
    additionalInformation: z.string().max(2000).optional().or(z.literal('')).or(z.null()).transform(val => val?.trim() || undefined),
  }).passthrough(),
};

export const patientIdSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
};

export const patientHistoryParamsSchema = {
  params: z.object({
    id: z.string().min(1),
    historyId: z.string().min(1),
  }),
};

export const patientConsentParamsSchema = {
  params: z.object({
    id: z.string().min(1),
    consentId: z.string().min(1),
  }),
};

/** Query strings arrive as strings, and repeated keys arrive as arrays. */
const single = (value: unknown): string | undefined => {
  const raw = Array.isArray(value) ? value[value.length - 1] : value;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
};

const optionalText = (max: number, label: string) =>
  z
    .unknown()
    .transform((value) => single(value))
    .refine((value) => value === undefined || value.length <= max, {
      message: `${label} is too long`,
    })
    // Without this the key itself becomes required, so any query that omits one
    // of these filters fails validation instead of being ignored.
    .optional();

/** Numeric query parameters, tolerating repeated keys like ?page=1&page=2. */
const intParam = (label: string, max = 9007199254740991) =>
  z
    .unknown()
    .transform((value) => {
      const raw = single(value);
      if (raw === undefined) return undefined;
      const parsed = Number(raw);
      return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : Number.NaN;
    })
    .refine((value) => value === undefined || Number.isInteger(value), {
      message: `${label} must be a whole number between 1 and ${max}`,
    })
    .optional();

export const patientQuerySchema = {
  query: z.object({
    search: optionalText(120, "Search term"),
    page: intParam("page"),
    limit: intParam("limit", 100),
    gender: optionalText(10, "Gender filter"),
    patientType: optionalText(30, "Patient type filter"),
    activeChip: optionalText(20, "Status filter"),
    includeDrafts: z
      .unknown()
      .transform((value) => single(value))
      .optional(),
  }),
};

export const patientCountQuerySchema = {
  query: z.object({
    search: optionalText(120, "Search term"),
  }),
};

export const topPatientsQuerySchema = {
  query: z.object({
    limit: intParam("limit", 100),
  }),
};

export const linkFamilySchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    familyHeadId: z.string().min(1, "familyHeadId is required"),
    relationship: z
      .string()
      .trim()
      .toUpperCase()
      .refine(
        (value) => ["SELF", "SPOUSE", "CHILD", "PARENT", "SIBLING", "OTHER"].includes(value),
        "Invalid relationship"
      )
      .optional(),
  }),
};

export const medicalHistoryCreateSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    condition: z.string().trim().min(1, "Condition is required").max(255),
    diagnosedDate: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(2000).optional(),
    severity: z.enum(["MILD", "MODERATE", "SEVERE"]).optional(),
    status: z.enum(["ACTIVE", "RESOLVED", "CHRONIC", "MONITORING"]).optional(),
  }),
};

export const medicalHistoryUpdateSchema = {
  params: patientHistoryParamsSchema.params,
  body: z
    .object({
      condition: z.string().trim().min(1).max(255).optional(),
      diagnosedDate: z.string().trim().max(40).nullable().optional(),
      notes: z.string().trim().max(2000).nullable().optional(),
      severity: z.enum(["MILD", "MODERATE", "SEVERE"]).optional(),
      status: z.enum(["ACTIVE", "RESOLVED", "CHRONIC", "MONITORING"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, "At least one field is required"),
};

export const consentCreateSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    consentType: z.string().trim().min(1, "consentType is required").max(60),
    consentGiven: z.boolean(),
    consentText: z.string().trim().min(1, "consentText is required").max(5000),
  }),
};

export const createPatientWithOrderSchema = {
  body: z.object({
    patient: z.object({
      firstName: z.string().min(1).max(100).transform(val => val.trim()),
      middleName: z.string().max(100).optional(),
      lastName: z.string().min(1).max(100).transform(val => val.trim()),
      dateOfBirth: z.string().optional().or(z.literal('')).or(z.null())
        .transform(val => val || undefined)
        .refine((val) => !val || !Number.isNaN(new Date(val).getTime()), "Date of birth must be a valid date"),
      gender: z.enum(["MALE", "FEMALE", "OTHER"]),
      phone: z.string().max(30).optional().or(z.literal('')).or(z.null())
        .transform(val => sanitizePhone(val))
        .refine(isOptionalPhone, "Invalid phone number format (must be 10-12 digits)"),
      alternatePhone: z.string().max(30).optional().or(z.literal('')).or(z.null())
        .transform(val => sanitizePhone(val))
        .refine(isOptionalPhone, "Invalid alternate phone number format (must be 10-12 digits)"),
      email: z.string().email().optional().or(z.literal('')).or(z.null())
        .transform(val => {
          if (!val || val === '') return undefined;
          return val.toLowerCase().trim();
        }),
      address: z.string().max(500).optional(),
      landmark: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      postalCode: z.string().max(20).optional().or(z.literal('')).or(z.null())
        .transform(val => val ? val.replace(/\D/g, '').trim() : undefined)
        .refine((val) => !val || /^\d{6}$/.test(val), "Invalid PIN code format (exact 6 digits required)"),
      country: z.string().max(100).default("India"),
      bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"]).optional(),
      emergencyContactName: z.string().max(100).optional(),
      emergencyContactPhone: z.string().max(30).optional().or(z.literal('')).or(z.null())
        .transform(val => sanitizePhone(val))
        .refine(isOptionalPhone, "Invalid emergency contact phone format (must be 10-12 digits)"),
      emergencyContactRelationship: z.enum(["FATHER", "MOTHER", "SPOUSE", "SON", "DAUGHTER", "BROTHER", "SISTER", "FRIEND", "OTHER"]).optional(),
      emergencyContactAddress: z.string().max(500).optional(),
      aadhaarNumber: z.string().optional().or(z.literal('')).or(z.null())
        .transform(val => val?.replace(/\s/g, '') || undefined)
        .refine((val) => !val || aadhaarRegex.test(val), "Invalid Aadhaar number format (12 digits)"),
      panNumber: z.string().max(10).optional().or(z.literal('')).or(z.null())
        .transform(val => val?.toUpperCase().trim() || undefined)
        .refine((val) => !val || panRegex.test(val), "Invalid PAN card format"),
      nationalId: z.string().max(50).optional(),
      patientType: z.enum(["GENERAL", "VIP", "STAFF", "SENIOR_CITIZEN", "CHILD", "INPATIENT", "OUTPATIENT", "EMERGENCY"]).default("GENERAL"),
      maritalStatus: z.preprocess(
        normalizeMaritalStatus,
        z.enum(MARITAL_STATUS_VALUES).optional().nullable()
      ).transform(val => val || undefined),
      occupation: z.string().max(100).optional(),
      nationality: z.string().max(50).default("Indian"),
      allergies: z.array(z.string()).optional().default([]),
      chronicDiseases: z.array(z.string()).optional().default([]),
      medicalConditions: z.array(z.string()).optional(),
      fastingStatus: z.enum(["YES", "NO", "NOT_APPLICABLE"]).optional(),
      height: z.number().min(1, "Height must be greater than 0").max(300).optional(),
      weight: z.number().min(1, "Weight must be greater than 0").max(500).optional(),
      doctorId: z.string().optional(),
      insuranceProvider: z.string().max(100).optional(),
      insuranceNumber: z.string().max(50).optional(),
      insuranceGroupNumber: z.string().max(50).optional(),
      insuranceExpiryDate: z.string().optional(),
      photoUrl: z.string().url().optional(),
      preferredLanguage: z.preprocess((val) => {
        if (!val || typeof val !== 'string') return "ENGLISH";
        const upper = val.trim().toUpperCase();
        if (["ENGLISH", "HINDI", "BENGALI", "TAMIL", "TELUGU", "MARATHI", "GUJARATI", "KANNADA", "MALAYALAM", "PUNJABI", "SPANISH", "OTHER"].includes(upper)) {
          return upper;
        }
        return "OTHER";
      }, z.enum(["ENGLISH", "HINDI", "BENGALI", "TAMIL", "TELUGU", "MARATHI", "GUJARATI", "KANNADA", "MALAYALAM", "PUNJABI", "SPANISH", "OTHER"]).default("ENGLISH")),
      preferredCommunicationMethod: z.string().max(50).optional(),
      notificationPreferences: z.array(z.string()).optional(),
      communicationPreference: z.object({
        sms: z.boolean().optional(),
        email: z.boolean().optional(),
        whatsapp: z.boolean().optional(),
        call: z.boolean().optional(),
      }).optional(),
      consentForTreatment: z.boolean().default(false),
      consentForDataSharing: z.boolean().default(false),
      consentForMarketing: z.boolean().default(false),
      privacyConsent: z.boolean().optional(),
      registrationSource: z.enum(["WALK_IN", "ONLINE", "PHONE", "MOBILE_APP", "REFERRAL"]).default("WALK_IN"),
      referralSource: z.string().max(200).optional(),
      notes: z.string().max(10000).optional(),
      additionalInformation: z.string().max(2000).optional(),
    }),
    order: z.object({
      doctorId: z.string().optional(),
      notes: z.string().max(1000).optional(),
      clinicalNotes: z.string().max(2000).optional(),
      fastingStatus: z.enum(["YES", "NO", "NOT_APPLICABLE"]).optional(),
      homeCollectionAddress: z.string().max(500).optional(),
      discount: z.number().min(0).default(0),
      discountCode: z.string().max(50).optional(),
      paidAmount: z.number().min(0).default(0),
      collectionType: z.enum(["WALK_IN", "HOME_COLLECTION"]).optional(),
      priority: z.enum(["ROUTINE", "URGENT", "STAT", "CRITICAL"]).optional().default("ROUTINE"),
      collectedById: z.string().optional(),
      reportDeliveryWhatsApp: z.boolean().optional().default(false),
      reportDeliveryEmail: z.boolean().optional().default(false),
      reportDeliveryPrinted: z.boolean().optional().default(false),
      reportDeliveryPortal: z.boolean().optional().default(false),
      items: z.array(z.object({
        testId: z.string().min(1, "testId is required"),
        discount: z.number().min(0).default(0),
      })).min(1, "At least one test is required"),
    }),
  }).passthrough(),
};

// Additional validation schemas for advanced features
export const verifyPatientPhoneSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    otp: z
      .string()
      .transform((value) => value.trim())
      .refine((value) => /^\d{6}$/.test(value), "OTP must be exactly 6 digits"),
  }),
};

/**
 * POST /verify/email is reached from the link in the patient's inbox, so there is
 * no :id in the path — the token itself identifies the patient.
 */
export const verifyPatientEmailSchema = {
  body: z.object({
    verificationCode: z
      .string()
      .trim()
      .min(16, "Verification token is invalid")
      .max(200, "Verification token is invalid"),
  }),
};

export const uploadPatientPhotoSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
};

export const checkDuplicateSchema = {
  query: z.object({
    phone: optionalText(30, "Phone"),
    email: optionalText(255, "Email"),
    aadhaarNumber: optionalText(20, "Aadhaar number"),
    panNumber: optionalText(10, "PAN"),
    excludeId: optionalText(64, "excludeId"),
  }).refine(
    (data) => data.phone || data.email || data.aadhaarNumber || data.panNumber,
    "At least one field is required for duplicate check"
  ),
};

export const patientAnalyticsSchema = {
  query: z.object({
    startDate: optionalText(40, "Start date"),
    endDate: optionalText(40, "End date"),
    groupBy: z.preprocess((value) => single(value) ?? "month",
      z.enum(["day", "week", "month", "year"]).default("month")),
  }),
};

// ====================
// Draft management
// ====================

export const draftIdSchema = {
  params: z.object({ id: z.string().min(1, "Draft id is required") }),
};

export const draftQuerySchema = {
  query: z.object({
    page: intParam("page"),
    limit: intParam("limit", 100),
  }),
};

/**
 * Draft payloads come straight from a half-filled form, so the patient fields are
 * deliberately not validated here — the draft mapper relaxes enums and clamps
 * lengths. Only the keys the draft service reads directly are declared, and
 * `passthrough()` keeps the rest of the form intact.
 */
export const saveDraftSchema = {
  body: z.object({
    draftId: z.string().trim().min(1).max(64).optional(),
    formStep: z.coerce.number().int().min(1).max(50).optional(),
    formProgress: z.coerce.number().min(0).max(100).optional(),
    lastEditedSection: z.string().trim().max(100).optional(),
  }).passthrough(),
};

/**
 * Finalizing merges the submitted fields over the stored draft and validates them
 * strictly in the mapper, so the body only has to be an object.
 */
export const finalizeDraftSchema = {
  params: z.object({ id: z.string().min(1, "Draft id is required") }),
  body: z.object({}).passthrough(),
};
