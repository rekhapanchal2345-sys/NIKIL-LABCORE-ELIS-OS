import { Prisma } from "@prisma/client";
import { HttpError } from "../../utils/http-error";

/**
 * Single source of truth for turning a patient request payload into Prisma
 * `patients` column data. Every write path (create, update, draft, finalize)
 * goes through this so request-only aliases (postalCode, doctorId,
 * medicalConditions, notificationPreferences, ...) can never reach Prisma as
 * unknown arguments.
 */

const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;

/**
 * `patients.firstName/lastName/gender` are NOT NULL, so an in-progress draft has
 * to store something. finalizeDraft rejects these to keep the two in sync.
 */
export const DRAFT_PLACEHOLDERS = {
  firstName: "Draft",
  lastName: "Patient",
  gender: "OTHER" as const,
};
const PATIENT_TYPES = [
  "GENERAL",
  "VIP",
  "STAFF",
  "SENIOR_CITIZEN",
  "CHILD",
  "INPATIENT",
  "OUTPATIENT",
  "EMERGENCY",
] as const;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"] as const;
const MARITAL_STATUS = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"] as const;
const FASTING_STATUS = ["YES", "NO", "NOT_APPLICABLE"] as const;
const RELATIONSHIP_TO_HEAD = ["SELF", "SPOUSE", "CHILD", "PARENT", "SIBLING", "OTHER"] as const;
const EMERGENCY_RELATIONSHIP = [
  "FATHER",
  "MOTHER",
  "SPOUSE",
  "SON",
  "DAUGHTER",
  "BROTHER",
  "SISTER",
  "FRIEND",
  "OTHER",
] as const;
const REGISTRATION_SOURCES = ["WALK_IN", "ONLINE", "PHONE", "MOBILE_APP", "REFERRAL"] as const;

// VarChar limits declared for the patients table in prisma/schema.prisma.
const LENGTH_LIMITS: Record<string, number> = {
  phone: 15,
  alternatePhone: 15,
  emergencyContact: 15,
  pincode: 10,
  aadhaarNumber: 12,
  panNumber: 10,
  abhaNumber: 20,
  abhaAddress: 100,
  healthIdNumber: 20,
};

const invalid = (field: string, message: string) =>
  new HttpError(`Invalid value for ${field}: ${message}`, 400, "INVALID_FIELD");

const sanitizeText = (str: string): string => {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/onload\s*=/gi, "")
    .replace(/onerror\s*=/gi, "")
    .replace(/onclick\s*=/gi, "")
    .replace(/<iframe/gi, "")
    .replace(/<embed/gi, "")
    .trim();
};

const text = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = sanitizeText(String(value));
  return trimmed === "" ? null : trimmed;
};

const oneOf = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  fallback?: T
): T | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return fallback ?? null;

  const normalized = String(value).trim().toUpperCase();
  if ((allowed as readonly string[]).includes(normalized)) return normalized as T;
  if (fallback !== undefined) return fallback;
  throw invalid(field, `expected one of ${allowed.join(", ")}`);
};

export const sanitizePhone = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);

  return digits === "" ? null : digits;
};

const toDate = (value: unknown): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

const toNumber = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const clamp = (column: string, value: string | null | undefined) => {
  if (typeof value !== "string") return value;
  const limit = LENGTH_LIMITS[column];
  return limit && value.length > limit ? value.slice(0, limit) : value;
};

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

type Medication = { name: string; dosage?: string; frequency?: string };

const toMedicationList = (value: unknown): Medication[] => {
  const source: unknown[] = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim()
      ? value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean)
      : [];

  const medications: Medication[] = [];
  for (const item of source) {
    if (typeof item === "string") {
      const name = item.trim();
      if (name) medications.push({ name });
      continue;
    }
    if (!item || typeof item !== "object") continue;

    const record = item as Record<string, unknown>;
    const name = text(record.name);
    if (!name) continue;

    const dosage = text(record.dosage);
    const frequency = text(record.frequency);
    medications.push({
      name,
      ...(dosage ? { dosage } : {}),
      ...(frequency ? { frequency } : {}),
    });
  }
  return medications;
};

/** Derives the form's notificationPreferences array from stored JSON prefs. */
export const notificationPreferencesFrom = (preference: unknown): string[] => {
  const entries: Array<[string, string]> = [
    ["email", "Email"],
    ["sms", "SMS"],
    ["whatsapp", "WhatsApp"],
    ["call", "Phone Call"],
  ];
  const record = (preference ?? {}) as Record<string, unknown>;
  return entries.filter(([key]) => Boolean(record[key])).map(([, label]) => label);
};

const resolveCommunicationPreference = (input: Record<string, any>) => {
  const direct = input.communicationPreference;
  if (direct && typeof direct === "object" && Object.keys(direct).length > 0) {
    return {
      sms: Boolean(direct.sms),
      email: Boolean(direct.email),
      whatsapp: Boolean(direct.whatsapp),
      call: Boolean(direct.call),
      ...(direct.whatsappNumber || input.whatsappNumber
        ? { whatsappNumber: sanitizePhone(direct.whatsappNumber || input.whatsappNumber) }
        : {}),
    };
  }

  if (Array.isArray(input.notificationPreferences)) {
    const preferences = input.notificationPreferences.map((item: unknown) =>
      String(item).trim().toLowerCase()
    );
    return {
      sms: preferences.includes("sms"),
      email: preferences.includes("email"),
      whatsapp: preferences.includes("whatsapp"),
      call: preferences.includes("phone call") || preferences.includes("call"),
      ...(input.whatsappNumber
        ? { whatsappNumber: sanitizePhone(input.whatsappNumber) }
        : {}),
    };
  }

  if (input.whatsappNumber) {
    return {
      sms: true,
      email: true,
      whatsapp: true,
      call: false,
      whatsappNumber: sanitizePhone(input.whatsappNumber),
    };
  }

  return undefined;
};

const computeAgeParts = (dateOfBirth: Date | null) => {
  if (!dateOfBirth) return { age: null, ageMonth: null, ageDay: null };

  const now = new Date();
  const dob = Date.UTC(dateOfBirth.getUTCFullYear(), dateOfBirth.getUTCMonth(), dateOfBirth.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  if (dob > today) return { age: null, ageMonth: null, ageDay: null };

  const from = new Date(dob);
  const to = new Date(today);

  let years = to.getUTCFullYear() - from.getUTCFullYear();
  let months = to.getUTCMonth() - from.getUTCMonth();
  let days = to.getUTCDate() - from.getUTCDate();

  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0)).getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { age: Math.max(years, 0), ageMonth: Math.max(months, 0), ageDay: Math.max(days, 0) };
};

const computeBmi = (height?: number | null, weight?: number | null) => {
  if (height === undefined || height === null || weight === undefined || weight === null) return undefined;
  if (!Number.isFinite(height) || !Number.isFinite(weight)) return undefined;
  if (height <= 0 || weight <= 0) return undefined;
  const metres = height / 100;
  if (metres <= 0) return undefined;
  const rawBmi = weight / (metres * metres);
  if (!Number.isFinite(rawBmi) || rawBmi <= 0 || rawBmi > 500) return undefined;
  return Number(rawBmi.toFixed(2));
};

const FREE_TEXT_FIELDS = [
  "address",
  "landmark",
  "city",
  "state",
  "nationalId",
  "occupation",
  "insuranceProvider",
  "insuranceNumber",
  "insuranceGroupNumber",
  "photoUrl",
  "emergencyContactName",
  "emergencyContactAddress",
  "referralSource",
] as const;

/**
 * @param input    validated request body
 * @param existing current row, so patches keep derived values consistent
 * @param options.strict  reject bad enums instead of defaulting (drafts relax this)
 */
export const buildPatientData = (
  input: Record<string, any>,
  existing?: Record<string, any>,
  options: { strict?: boolean } = {}
): Prisma.PatientUncheckedCreateInput => {
  const { strict = true } = options;
  const data = {} as Prisma.PatientUncheckedCreateInput;

  if (input.firstName !== undefined) {
    const value = text(input.firstName);
    if (!value && strict) throw invalid("firstName", "must not be empty");
    data.firstName = value ?? DRAFT_PLACEHOLDERS.firstName;
  }
  if (input.lastName !== undefined) {
    const value = text(input.lastName);
    if (!value && strict) throw invalid("lastName", "must not be empty");
    data.lastName = value ?? DRAFT_PLACEHOLDERS.lastName;
  }
  if (input.middleName !== undefined) data.middleName = text(input.middleName) ?? null;

  if (input.gender !== undefined) {
    const gender = oneOf(input.gender, GENDERS, "gender", strict ? undefined : "OTHER");
    if (gender) data.gender = gender;
  }

  if (input.dateOfBirth !== undefined) {
    const dateOfBirth = toDate(input.dateOfBirth);
    if (dateOfBirth && dateOfBirth.getTime() > Date.now()) {
      throw invalid("dateOfBirth", "cannot be in the future");
    }
    data.dateOfBirth = dateOfBirth ?? null;
    Object.assign(data, computeAgeParts(dateOfBirth ?? null));
  }

  // Handle explicit age input (fallback or standalone when DOB is absent/approximate)
  if (input.age !== undefined && (data.age === undefined || data.age === null)) {
    const ageNum = toNumber(input.age);
    if (ageNum !== undefined && ageNum !== null) {
      if (ageNum < 0 || ageNum > 130) {
        throw invalid("age", "must be between 0 and 130");
      }
      data.age = Math.trunc(ageNum);
    }
  }
  if (input.ageMonth !== undefined && (data.ageMonth === undefined || data.ageMonth === null)) {
    const m = toNumber(input.ageMonth);
    if (m !== undefined && m !== null) data.ageMonth = Math.trunc(m);
  }
  if (input.ageDay !== undefined && (data.ageDay === undefined || data.ageDay === null)) {
    const d = toNumber(input.ageDay);
    if (d !== undefined && d !== null) data.ageDay = Math.trunc(d);
  }

  if (input.bloodGroup !== undefined) {
    data.bloodGroup = oneOf(input.bloodGroup, BLOOD_GROUPS, "bloodGroup");
  }
  if (input.patientType !== undefined) {
    data.patientType = oneOf(input.patientType, PATIENT_TYPES, "patientType", "GENERAL");
  }
  if (input.maritalStatus !== undefined) {
    data.maritalStatus = oneOf(input.maritalStatus, MARITAL_STATUS, "maritalStatus");
  }
  if (input.fastingStatus !== undefined) {
    let normalizedFasting = input.fastingStatus;
    if (typeof normalizedFasting === 'string') {
      const upper = normalizedFasting.toUpperCase();
      if (upper.startsWith('FASTING') || upper === 'YES') normalizedFasting = 'YES';
      else if (upper === 'NON_FASTING' || upper === 'RANDOM' || upper === 'NO') normalizedFasting = 'NO';
      else if (upper === 'NOT_APPLICABLE' || upper === 'NA') normalizedFasting = 'NOT_APPLICABLE';
    }
    data.fastingStatus = oneOf(normalizedFasting, FASTING_STATUS, "fastingStatus");
  }
  if (input.relationshipToHead !== undefined) {
    data.relationshipToHead = oneOf(
      input.relationshipToHead,
      RELATIONSHIP_TO_HEAD,
      "relationshipToHead"
    );
  }
  if (input.emergencyContactRelationship !== undefined) {
    data.emergencyContactRelationship = oneOf(
      input.emergencyContactRelationship,
      EMERGENCY_RELATIONSHIP,
      "emergencyContactRelationship"
    );
  }
  if (input.registrationSource !== undefined) {
    data.registrationSource = oneOf(
      input.registrationSource,
      REGISTRATION_SOURCES,
      "registrationSource",
      "WALK_IN"
    );
  }

  if (input.email !== undefined) {
    const value = text(input.email);
    data.email = value ? value.toLowerCase() : null;
  }
  if (input.aadhaarNumber !== undefined) {
    const digits = text(input.aadhaarNumber);
    data.aadhaarNumber = digits ? clamp("aadhaarNumber", digits.replace(/\D/g, "")) : null;
  }
  if (input.panNumber !== undefined) {
    const value = text(input.panNumber);
    data.panNumber = value ? clamp("panNumber", value.toUpperCase()) : null;
  }

  // ABHA (Ayushman Bharat Digital Health Account) & KYC Tokens
  if (input.abhaNumber !== undefined) {
    const value = text(input.abhaNumber);
    data.abhaNumber = value ? clamp("abhaNumber", value.replace(/\s+/g, "")) : null;
    if (data.abhaNumber) {
      data.abhaStatus = "LINKED";
      data.abhaLinkedAt = new Date();
    }
  }
  if (input.abhaAddress !== undefined) {
    const value = text(input.abhaAddress);
    data.abhaAddress = value ? clamp("abhaAddress", value) : null;
  }
  if (input.healthIdNumber !== undefined) {
    const value = text(input.healthIdNumber);
    data.healthIdNumber = value ? clamp("healthIdNumber", value) : null;
  }
  if (input.aadhaarReferenceToken !== undefined) {
    data.aadhaarReferenceToken = text(input.aadhaarReferenceToken) ?? null;
  }

  for (const field of FREE_TEXT_FIELDS) {
    if (input[field] !== undefined) data[field] = text(input[field]) ?? null;
  }

  if (input.country !== undefined) data.country = text(input.country) ?? "India";
  if (input.nationality !== undefined) data.nationality = text(input.nationality) ?? "Indian";
  if (input.preferredLanguage !== undefined) {
    data.preferredLanguage = text(input.preferredLanguage) ?? "ENGLISH";
  }
  if (input.preferredCommunicationMethod !== undefined) {
    const value = text(input.preferredCommunicationMethod);
    data.preferredCommunicationMethod = value ? value.toUpperCase() : null;
  }

  if (input.phone !== undefined) data.phone = clamp("phone", sanitizePhone(input.phone));
  if (input.alternatePhone !== undefined) {
    data.alternatePhone = clamp("alternatePhone", sanitizePhone(input.alternatePhone));
  } else if (input.whatsappNumber !== undefined) {
    data.alternatePhone = clamp("alternatePhone", sanitizePhone(input.whatsappNumber));
  }
  if (input.emergencyContactPhone !== undefined) {
    data.emergencyContact = clamp("emergencyContact", sanitizePhone(input.emergencyContactPhone));
  }
  if (input.emergencyContact !== undefined && input.emergencyContactPhone === undefined) {
    data.emergencyContact = clamp("emergencyContact", sanitizePhone(input.emergencyContact));
  }
  if (input.postalCode !== undefined) {
    const digits = text(input.postalCode);
    data.pincode = digits ? clamp("pincode", digits.replace(/\D/g, "")) : null;
  } else if (input.pincode !== undefined) {
    const digits = text(input.pincode);
    data.pincode = digits ? clamp("pincode", digits.replace(/\D/g, "")) : null;
  }

  if (input.doctorId !== undefined) data.referredById = text(input.doctorId) ?? null;
  if (input.referredById !== undefined) data.referredById = text(input.referredById) ?? null;
  if (input.familyHeadId !== undefined) data.familyHeadId = text(input.familyHeadId) ?? null;

  const height = toNumber(input.height);
  const weight = toNumber(input.weight);
  if (height !== undefined) data.height = height;
  if (weight !== undefined) data.weight = weight;
  if (height !== undefined || weight !== undefined) {
    const bmi = computeBmi(
      height ?? existing?.height ?? null,
      weight ?? existing?.weight ?? null
    );
    data.bmi = bmi ?? null;
  }

  if (input.allergies !== undefined) data.allergies = toStringList(input.allergies);
  if (input.currentMedications !== undefined) {
    data.currentMedications = toMedicationList(input.currentMedications);
  }
  if (input.chronicDiseases !== undefined || input.medicalConditions !== undefined) {
    data.chronicDiseases = Array.from(
      new Set([
        ...toStringList(input.chronicDiseases ?? existing?.chronicDiseases),
        ...toStringList(input.medicalConditions),
      ])
    );
  }

  if (input.insuranceExpiryDate !== undefined) {
    data.insuranceExpiryDate = toDate(input.insuranceExpiryDate) ?? null;
  }

  const communicationPreference = resolveCommunicationPreference(input);
  if (communicationPreference) {
    data.communicationPreference = existing?.communicationPreference
      ? { ...(existing.communicationPreference as object), ...communicationPreference }
      : communicationPreference;
  }

  // Explicit consent fields win; privacyConsent is the shorthand for the two
  // clinical consents only, never for marketing.
  const privacyConsent =
    input.privacyConsent !== undefined ? Boolean(input.privacyConsent) : undefined;
  if (input.consentForTreatment !== undefined) {
    data.consentForTreatment = Boolean(input.consentForTreatment);
  } else if (privacyConsent !== undefined) {
    data.consentForTreatment = privacyConsent;
  }
  if (input.consentForDataSharing !== undefined) {
    data.consentForDataSharing = Boolean(input.consentForDataSharing);
  } else if (privacyConsent !== undefined) {
    data.consentForDataSharing = privacyConsent;
  }
  if (input.consentForMarketing !== undefined) {
    data.consentForMarketing = Boolean(input.consentForMarketing);
  }

  if (input.notes !== undefined || input.additionalInformation !== undefined) {
    data.notes = text(input.notes ?? input.additionalInformation) ?? null;
  }

  if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);

  // isDraft is never client-controlled: each write path sets it explicitly, and a
  // PATCH that flipped it would hide a registered patient from the roster.
  if (input.formStep !== undefined) {
    const step = Number(input.formStep);
    data.formStep = Number.isFinite(step) && step >= 1 ? Math.trunc(step) : 1;
  }
  if (input.formProgress !== undefined) {
    const progress = Number(input.formProgress);
    data.formProgress = Number.isFinite(progress)
      ? Math.max(0, Math.min(100, Math.trunc(progress)))
      : 0;
  }
  if (input.lastEditedSection !== undefined) {
    data.lastEditedSection = text(input.lastEditedSection) ?? null;
  }

  // Drafts are saved from half-filled forms, but firstName/lastName/gender are
  // NOT NULL, so they need placeholders instead of a rejection.
  if (!strict) {
    if (!data.firstName) data.firstName = DRAFT_PLACEHOLDERS.firstName;
    if (!data.lastName) data.lastName = DRAFT_PLACEHOLDERS.lastName;
    if (!data.gender) data.gender = DRAFT_PLACEHOLDERS.gender;
  }

  return data;
};

/**
 * Registration rows cannot exist without these three NOT NULL columns. Drafts
 * save partial data, so only the finalize/create paths call this.
 */
export const assertPatientCreateComplete = (
  data: Prisma.PatientUncheckedCreateInput
): void => {
  const missing = (["firstName", "lastName", "gender"] as const).filter(
    (column) => !data[column]
  );
  if (missing.length > 0) {
    throw new HttpError(
      `Missing required patient field(s): ${missing.join(", ")}.`,
      400,
      "REQUIRED_FIELDS_MISSING"
    );
  }
};
