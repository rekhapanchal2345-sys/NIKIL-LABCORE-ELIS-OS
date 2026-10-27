import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";
import { createAuditLog } from "../audit/audit.service";
import { sendSMS } from "../../lib/communication-providers";

/**
 * Advanced Patient Service
 * Verification, family relationships, analytics, medical history and consents.
 */

export interface Actor {
  id?: string;
  role?: string;
}

const OTP_TTL_MS = 10 * 60 * 1000;
const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

const hash = (code: string) => crypto.createHash("sha256").update(code).digest("hex");
const timingSafeEqual = (a: string, b: string) =>
  a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "BRANCH_ADMIN"];

const notFound = (what: string) =>
  new HttpError(`${what} not found`, 404, `${what.toUpperCase().replace(/\s+/g, "_")}_NOT_FOUND`);

const requirePatient = async (patientId: string) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw notFound("Patient");
  return patient;
};

/** VerificationStatus is a free-text column; keep one vocabulary everywhere. */
const nextVerificationStatus = (flags: {
  phoneVerified: boolean;
  emailVerified: boolean;
  kycVerified: boolean;
}) => {
  if (flags.kycVerified) return "KYC_VERIFIED";
  if (flags.phoneVerified && flags.emailVerified) return "VERIFIED";
  if (flags.phoneVerified) return "PHONE_VERIFIED";
  if (flags.emailVerified) return "EMAIL_VERIFIED";
  return "UNVERIFIED";
};

/**
 * Discard any outstanding codes for this channel so only the newest one works,
 * then persist the hash of the new code (the plain code never touches the DB).
 */
const issueCode = async (patientId: string, type: "PHONE" | "EMAIL", ttlMs: number) => {
  const code =
    type === "PHONE"
      ? crypto.randomInt(100000, 1000000).toString()
      : crypto.randomBytes(32).toString("hex");

  await prisma.$transaction([
    prisma.patientVerification.deleteMany({
      where: { patientId, type, verified: false },
    }),
    prisma.patientVerification.create({
      data: {
        patientId,
        type,
        codeHash: hash(code),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    }),
  ]);

  return code;
};

const maskedPhone = (phone: string) => phone.replace(/.(?=.{4})/g, "*");
const maskedEmail = (email: string) => email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

// ====================
// Verification Services
// ====================

export const sendPhoneVerificationOTP = async (patientId: string) => {
  const patient = await requirePatient(patientId);

  if (!patient.phone) throw new HttpError("Patient phone number not available", 400, "PHONE_MISSING");
  if (patient.phoneVerified)
    throw new HttpError("Phone number already verified", 409, "PHONE_ALREADY_VERIFIED");

  const code = await issueCode(patientId, "PHONE", OTP_TTL_MS);

  const expiresInMinutes = Math.floor(OTP_TTL_MS / 60000);

  const smsResult = await sendSMS({
    to: patient.phone,
    message: `Your verification code is ${code}. It expires in ${expiresInMinutes} minutes.`
  });

  if (!smsResult.success) {
    console.error(`[PATIENT_VERIFICATION] Failed to send OTP SMS to patient ${patient.id}: ${smsResult.error}`);
    // Decide whether to throw or not based on project conventions.
    // Typically throwing is better if delivery fails, but some systems might fall back or just log.
    // Let's throw so the frontend knows it failed.
    throw new HttpError(`Failed to send SMS: ${smsResult.error || 'Unknown error'}`, 500, "SMS_SEND_FAILED");
  }

  console.log(`[PATIENT_VERIFICATION] OTP sent via SMS to patient ${patient.id}`);

  return {
    message: "OTP sent successfully",
    phone: maskedPhone(patient.phone),
    expiresInMinutes: OTP_TTL_MS / 60000,
    devOtp: process.env.NODE_ENV === "production" ? undefined : code,
  };
};

export const verifyPhoneOTP = async (patientId: string, otp: string) => {
  if (!otp || typeof otp !== "string")
    throw new HttpError("OTP is required", 400, "OTP_REQUIRED");

  const patient = await requirePatient(patientId);

  if (patient.phoneVerified)
    throw new HttpError("Phone number already verified", 409, "PHONE_ALREADY_VERIFIED");

  const verification = await prisma.patientVerification.findFirst({
    where: { patientId, type: "PHONE", verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!verification || verification.expiresAt.getTime() < Date.now()) {
    throw new HttpError("Invalid or expired OTP", 400, "OTP_INVALID");
  }

  if (verification.attempts >= MAX_CODE_ATTEMPTS) {
    throw new HttpError("Too many incorrect attempts. Request a new OTP.", 429, "OTP_LOCKED");
  }

  if (!timingSafeEqual(verification.codeHash, hash(otp))) {
    await prisma.patientVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    throw new HttpError("Invalid or expired OTP", 400, "OTP_INVALID");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.patientVerification.update({
      where: { id: verification.id },
      data: { verified: true, attempts: verification.attempts + 1 },
    });

    return tx.patient.update({
      where: { id: patientId },
      data: {
        phoneVerified: true,
        verificationStatus: nextVerificationStatus({
          phoneVerified: true,
          emailVerified: patient.emailVerified,
          kycVerified: patient.kycVerified,
        }),
      },
      select: { id: true, uhid: true, verificationStatus: true, phoneVerified: true },
    });
  });

  await createAuditLog({
    module: "PATIENTS",
    action: "VERIFY_PHONE",
    recordId: patientId,
    newData: { verificationStatus: updated.verificationStatus },
  }).catch((error) => console.error("Audit log failed for phone verification:", error));

  return {
    message: "Phone verified successfully",
    verificationStatus: updated.verificationStatus,
  };
};

export const sendEmailVerification = async (patientId: string) => {
  const patient = await requirePatient(patientId);

  if (!patient.email) throw new HttpError("Patient email not available", 400, "EMAIL_MISSING");
  if (patient.emailVerified)
    throw new HttpError("Email already verified", 409, "EMAIL_ALREADY_VERIFIED");

  const token = await issueCode(patientId, "EMAIL", EMAIL_TOKEN_TTL_MS);

  const frontendUrl = process.env.FRONTEND_URL;
  const verificationLink = frontendUrl
    ? `${frontendUrl.replace(/\/+$/, "")}/verify-email?token=${token}`
    : null;

  // TODO: send the link through the email provider instead of logging it.
  if (verificationLink && process.env.NODE_ENV !== "production") {
    console.log(`Email verification link for ${patient.firstName}: ${verificationLink}`);
  }

  return {
    message: "Verification email sent successfully",
    email: maskedEmail(patient.email),
    expiresInHours: EMAIL_TOKEN_TTL_MS / 3600000,
    devVerificationLink: verificationLink,
    // No FRONTEND_URL means there is no link to click, so outside production the
    // raw token is returned to keep POST /verify/email reachable.
    devVerificationToken: process.env.NODE_ENV !== "production" ? token : undefined,
  };
};

export const verifyEmailToken = async (token: string) => {
  if (!token || typeof token !== "string" || token.length < 16) {
    throw new HttpError("Invalid or expired verification token", 400, "TOKEN_INVALID");
  }

  const verification = await prisma.patientVerification.findFirst({
    where: { type: "EMAIL", codeHash: hash(token), verified: false },
    orderBy: { createdAt: "desc" },
    include: { patient: true },
  });

  if (!verification) {
    throw new HttpError("Invalid or expired verification token", 400, "TOKEN_INVALID");
  }
  if (verification.expiresAt.getTime() < Date.now()) {
    throw new HttpError("Invalid or expired verification token", 400, "TOKEN_EXPIRED");
  }

  const { patient, ...code } = verification;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.patientVerification.update({
      where: { id: code.id },
      data: { verified: true },
    });

    return tx.patient.update({
      where: { id: verification.patientId },
      data: {
        emailVerified: true,
        verificationStatus: nextVerificationStatus({
          phoneVerified: patient.phoneVerified,
          emailVerified: true,
          kycVerified: patient.kycVerified,
        }),
      },
    });
  });

  await createAuditLog({
    module: "PATIENTS",
    action: "VERIFY_EMAIL",
    recordId: updated.id,
    newData: { verificationStatus: updated.verificationStatus },
  }).catch((error) => console.error("Audit log failed for email verification:", error));

  return {
    message: "Email verified successfully",
    patient: {
      id: updated.id,
      uhid: updated.uhid,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      verificationStatus: updated.verificationStatus,
    },
  };
};

export const markKYCVerified = async (patientId: string, verifiedById?: string) => {
  const patient = await requirePatient(patientId);

  if (!verifiedById) {
    throw new HttpError("A signed-in administrator is required", 401, "AUTHENTICATION_REQUIRED");
  }

  const verifier = await prisma.user.findUnique({
    where: { id: verifiedById },
    select: { id: true, role: true, status: true },
  });

  if (!verifier) throw new HttpError("Verifying user not found", 401, "USER_NOT_FOUND");
  if (verifier.status !== "ACTIVE")
    throw new HttpError("User account is not active", 403, "USER_INACTIVE");
  if (!ADMIN_ROLES.includes(verifier.role)) {
    throw new HttpError("Only administrators can complete KYC", 403, "KYC_FORBIDDEN");
  }

  const updated = await prisma.patient.update({
    where: { id: patientId },
    data: {
      kycVerified: true,
      kycVerifiedAt: new Date(),
      kycVerifiedById: verifier.id,
      verificationStatus: nextVerificationStatus({
        phoneVerified: patient.phoneVerified,
        emailVerified: patient.emailVerified,
        kycVerified: true,
      }),
    },
    select: {
      id: true,
      uhid: true,
      kycVerified: true,
      kycVerifiedAt: true,
      verificationStatus: true,
    },
  });

  await createAuditLog({
    userId: verifier.id,
    module: "PATIENTS",
    action: "VERIFY_KYC",
    recordId: patientId,
    oldData: { kycVerified: patient.kycVerified },
    newData: { kycVerified: true, verificationStatus: updated.verificationStatus },
  }).catch((error) => console.error("Audit log failed for KYC verification:", error));

  return {
    message: "KYC verification completed successfully",
    ...updated,
  };
};

// ====================
// Family Relationship Services
// ====================

const familyMemberSelect = {
  id: true,
  uhid: true,
  firstName: true,
  middleName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  age: true,
  phone: true,
  email: true,
  relationshipToHead: true,
  photoUrl: true,
  isActive: true,
  isDraft: true,
};

export const getFamilyMembers = async (patientId: string) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, uhid: true, firstName: true, middleName: true, lastName: true, familyHeadId: true },
  });

  if (!patient) throw notFound("Patient");

  const isHead = !patient.familyHeadId;

  if (isHead) {
    const dependents = await prisma.patient.findMany({
      where: { familyHeadId: patientId },
      select: familyMemberSelect,
      orderBy: { createdAt: "asc" },
    });

    return {
      isFamilyHead: true,
      familyHead: patient,
      members: dependents,
      totalMembers: dependents.length,
    };
  }

  const [familyHead, members] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: patient.familyHeadId! },
      select: familyMemberSelect,
    }),
    prisma.patient.findMany({
      where: { familyHeadId: patient.familyHeadId! },
      select: familyMemberSelect,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    isFamilyHead: false,
    familyHead: familyHead?.id ?? patient.familyHeadId,
    familyHeadDetails: familyHead,
    members,
    totalMembers: members.length,
  };
};

export const linkToFamily = async (
  patientId: string,
  familyHeadId: string,
  relationship?: string
) => {
  if (!familyHeadId) throw new HttpError("familyHeadId is required", 400, "FAMILY_HEAD_REQUIRED");
  if (familyHeadId === patientId) {
    throw new HttpError("A patient cannot be linked to themselves", 400, "SELF_FAMILY_LINK");
  }

  const allowedRelationships = [
    "SELF",
    "SPOUSE",
    "CHILD",
    "PARENT",
    "SIBLING",
    "OTHER",
  ];
  const normalizedRelationship = relationship?.trim().toUpperCase();
  if (normalizedRelationship && !allowedRelationships.includes(normalizedRelationship)) {
    throw new HttpError(
      `Invalid relationship. Use one of: ${allowedRelationships.join(", ")}`,
      400,
      "INVALID_RELATIONSHIP"
    );
  }

  const [patient, familyHead] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.patient.findUnique({
      where: { id: familyHeadId },
      select: { id: true, isDraft: true, familyHeadId: true },
    }),
  ]);

  if (!patient) throw notFound("Patient");
  if (!familyHead) throw notFound("Family head");
  if (familyHead.isDraft) {
    throw new HttpError(
      "Family head must be a finalized patient",
      400,
      "FAMILY_HEAD_IS_DRAFT"
    );
  }
  if (familyHead.familyHeadId) {
    throw new HttpError(
      "Cannot link to a patient who is already a dependent",
      409,
      "FAMILY_HEAD_IS_DEPENDENT"
    );
  }

  // A head with dependents cannot be demoted to a dependent.
  const dependents = await prisma.patient.count({ where: { familyHeadId: patientId } });
  if (dependents > 0) {
    throw new HttpError(
      "This patient already has family members linked. Unlink them first.",
      409,
      "FAMILY_HEAD_HAS_DEPENDENTS"
    );
  }

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      familyHeadId,
      relationshipToHead: normalizedRelationship ?? patient.relationshipToHead ?? "OTHER",
    },
  });

  await createAuditLog({
    module: "PATIENTS",
    action: "LINK_FAMILY",
    recordId: patientId,
    oldData: { familyHeadId: patient.familyHeadId },
    newData: { familyHeadId, relationship: normalizedRelationship },
  }).catch((error) => console.error("Audit log failed for family link:", error));

  return {
    message: "Patient linked to family successfully",
    patientId,
    familyHeadId,
    relationship: normalizedRelationship ?? null,
  };
};

export const unlinkFromFamily = async (patientId: string) => {
  const patient = await requirePatient(patientId);

  if (!patient.familyHeadId) {
    throw new HttpError("Patient is not linked to any family", 409, "NOT_FAMILY_LINKED");
  }

  const previousHeadId = patient.familyHeadId;

  await prisma.patient.update({
    where: { id: patientId },
    data: { familyHeadId: null, relationshipToHead: null },
  });

  await createAuditLog({
    module: "PATIENTS",
    action: "UNLINK_FAMILY",
    recordId: patientId,
    oldData: { familyHeadId: previousHeadId },
    newData: { familyHeadId: null },
  }).catch((error) => console.error("Audit log failed for family unlink:", error));

  return { message: "Patient unlinked from family successfully", patientId };
};

// ====================
// Analytics Services
// ====================

const GROUP_PRECISION = ["day", "week", "month", "year"] as const;
type GroupPrecision = (typeof GROUP_PRECISION)[number];

const toDateOnly = (value: unknown, fallback: Date, label: string) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(`Invalid ${label} date`, 400, "INVALID_DATE");
  }
  return parsed;
};

const trendFor = (date: Date, precision: GroupPrecision) => {
  const iso = date.toISOString();
  if (precision === "day") return iso.slice(0, 10);
  if (precision === "year") return iso.slice(0, 4);
  if (precision === "month") return iso.slice(0, 7);
  // ISO week label, e.g. 2026-W40
  const thursday = new Date(date.getTime() + 4 * 86400000);
  const week = Math.ceil(
    ((thursday.getTime() - Date.UTC(thursday.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7
  );
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const toCountMap = (
  rows: Array<Record<string, any>>,
  key: string
): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const label = row[key] == null ? "UNKNOWN" : String(row[key]);
    map[label] = (map[label] || 0) + Number(row._count ?? 0);
  }
  return map;
};

export const getRegistrationAnalytics = async (
  startDate?: string,
  endDate?: string,
  groupBy: GroupPrecision = "month"
) => {
  const precision = GROUP_PRECISION.includes(groupBy) ? groupBy : "month";
  const start = toDateOnly(startDate, new Date(Date.now() - 90 * 86400000), "startDate");
  const end = toDateOnly(endDate, new Date(), "endDate");

  if (start.getTime() > end.getTime()) {
    throw new HttpError("startDate cannot be after endDate", 400, "INVALID_DATE_RANGE");
  }

  // Drafts are unfinished registrations, not patients — keep them out of analytics.
  const where: Prisma.PatientWhereInput = {
    isDraft: false,
    createdAt: { gte: start, lte: end },
  };

  const [rows, genderRows, typeRows, sourceRows, verificationRows] = await Promise.all([
    prisma.patient.findMany({ where, select: { createdAt: true } }),
    prisma.patient.groupBy({ by: ["gender"], where, _count: true }),
    prisma.patient.groupBy({ by: ["patientType"], where, _count: true }),
    prisma.patient.groupBy({ by: ["registrationSource"], where, _count: true }),
    prisma.patient.groupBy({ by: ["verificationStatus"], where, _count: true }),
  ]);

  const registrationTrends: Record<string, number> = {};
  for (const row of rows) {
    const period = trendFor(row.createdAt, precision);
    registrationTrends[period] = (registrationTrends[period] || 0) + 1;
  }

  return {
    summary: {
      totalPatients: rows.length,
      dateRange: { start, end },
      groupBy: precision,
    },
    registrationTrends,
    genderDistribution: toCountMap(genderRows as any[], "gender"),
    patientTypeDistribution: toCountMap(typeRows as any[], "patientType"),
    sourceDistribution: toCountMap(sourceRows as any[], "registrationSource"),
    verificationDistribution: toCountMap(verificationRows as any[], "verificationStatus"),
  };
};

interface AgeGroupRow {
  age_group: string | null;
  count: number | bigint;
}

export const getPatientDemographics = async () => {
  const [total, genderRows, ageRows, bloodGroupRows, verificationRows] = await Promise.all([
    prisma.patient.count({ where: { isDraft: false } }),
    prisma.patient.groupBy({ by: ["gender"], where: { isDraft: false }, _count: true }),
    // Ageing from dateOfBirth needs SQL; ::int keeps COUNT() JSON-serialisable.
    prisma.$queryRaw<AgeGroupRow[]>`
      SELECT age_group, COUNT(*)::int AS count
      FROM (
        SELECT CASE
          WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) < 18 THEN '01 Under 18'
          WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) <= 30 THEN '02 18-30'
          WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) <= 50 THEN '03 31-50'
          WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) <= 70 THEN '04 51-70'
          ELSE '05 Over 70'
        END AS age_group
        FROM "patients"
        WHERE "isDraft" = false AND "dateOfBirth" IS NOT NULL
      ) grouped
      GROUP BY age_group
      ORDER BY age_group
    `,
    prisma.patient.groupBy({
      by: ["bloodGroup"],
      where: { isDraft: false, bloodGroup: { not: null } },
      _count: true,
    }),
    prisma.patient.groupBy({ by: ["verificationStatus"], where: { isDraft: false }, _count: true }),
  ]);

  return {
    total,
    byGender: toCountMap(genderRows as any[], "gender"),
    byAgeGroup: Object.fromEntries(
      ageRows.map((row) => [String(row.age_group ?? "Unknown").replace(/^\d+\s/, ""), Number(row.count)])
    ),
    byBloodGroup: toCountMap(bloodGroupRows as any[], "bloodGroup"),
    byVerificationStatus: toCountMap(verificationRows as any[], "verificationStatus"),
  };
};

export const getTopPatientsByVisits = async (limit = 10) => {
  const take = Math.min(100, Math.max(1, Math.trunc(Number(limit) || 10)));

  const patients = await prisma.patient.findMany({
    take,
    where: { isDraft: false, orders: { some: {} } },
    select: {
      id: true,
      uhid: true,
      firstName: true,
      middleName: true,
      lastName: true,
      phone: true,
      email: true,
      patientType: true,
      isActive: true,
      _count: { select: { orders: true } },
    },
    orderBy: { orders: { _count: "desc" } },
  });

  return patients.map((patient) => ({
    ...patient,
    visitCount: patient._count.orders,
  }));
};

// ====================
// Medical History Services
// ====================

const SEVERITIES = ["MILD", "MODERATE", "SEVERE"];
const HISTORY_STATUSES = ["ACTIVE", "RESOLVED", "CHRONIC", "MONITORING"];

const parseOptionalDate = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(`Invalid ${field} date`, 400, "INVALID_DATE");
  }
  return parsed;
};

const assertChoice = (value: string | undefined, allowed: string[], field: string) => {
  if (value === undefined) return undefined;
  if (!allowed.includes(value)) {
    throw new HttpError(
      `Invalid value for ${field}: expected one of ${allowed.join(", ")}`,
      400,
      "INVALID_FIELD"
    );
  }
  return value;
};

export const addMedicalHistory = async (
  patientId: string,
  data: {
    condition: string;
    diagnosedDate?: string;
    notes?: string;
    severity?: string;
    status?: string;
  }
) => {
  await requirePatient(patientId);

  const condition = typeof data?.condition === "string" ? data.condition.trim() : "";
  if (!condition) throw new HttpError("Condition is required", 400, "CONDITION_REQUIRED");
  if (condition.length > 255) throw new HttpError("Condition is too long", 400, "CONDITION_TOO_LONG");

  const severity = assertChoice(data.severity?.trim().toUpperCase(), SEVERITIES, "severity");
  const status = assertChoice(data.status?.trim().toUpperCase(), HISTORY_STATUSES, "status");

  const history = await prisma.patientMedicalHistory.create({
    data: {
      patientId,
      condition,
      diagnosedDate: parseOptionalDate(data.diagnosedDate, "diagnosedDate") ?? null,
      notes: data.notes?.trim() || null,
      severity: severity ?? "MODERATE",
      status: status ?? "ACTIVE",
    },
  });

  return history;
};

export const getMedicalHistory = async (patientId: string) => {
  await requirePatient(patientId);

  return prisma.patientMedicalHistory.findMany({
    where: { patientId },
    orderBy: [{ diagnosedDate: "desc" }, { createdAt: "desc" }],
  });
};

export const updateMedicalHistory = async (
  patientId: string,
  historyId: string,
  data: {
    condition?: string;
    diagnosedDate?: string;
    notes?: string;
    severity?: string;
    status?: string;
  }
) => {
  const existing = await prisma.patientMedicalHistory.findUnique({ where: { id: historyId } });
  if (!existing || existing.patientId !== patientId) {
    throw notFound("Medical history entry");
  }

  const patch: Prisma.PatientMedicalHistoryUpdateInput = {};

  if (data.condition !== undefined) {
    const condition = String(data.condition).trim();
    if (!condition) throw new HttpError("Condition cannot be empty", 400, "CONDITION_REQUIRED");
    patch.condition = condition.slice(0, 255);
  }
  if (data.diagnosedDate !== undefined) {
    patch.diagnosedDate = parseOptionalDate(data.diagnosedDate, "diagnosedDate") ?? null;
  }
  if (data.notes !== undefined) patch.notes = data.notes?.trim() || null;
  if (data.severity !== undefined) {
    patch.severity = assertChoice(data.severity?.trim().toUpperCase(), SEVERITIES, "severity")!;
  }
  if (data.status !== undefined) {
    patch.status = assertChoice(data.status?.trim().toUpperCase(), HISTORY_STATUSES, "status")!;
  }

  return prisma.patientMedicalHistory.update({ where: { id: historyId }, data: patch });
};

export const deleteMedicalHistory = async (patientId: string, historyId: string) => {
  const existing = await prisma.patientMedicalHistory.findUnique({ where: { id: historyId } });
  if (!existing || existing.patientId !== patientId) {
    throw notFound("Medical history entry");
  }

  await prisma.patientMedicalHistory.delete({ where: { id: historyId } });

  return { message: "Medical history entry deleted successfully", id: historyId };
};

// ====================
// Consent Management
// ====================

export const recordConsent = async (
  patientId: string,
  data: {
    consentType: string;
    consentGiven: boolean;
    consentText: string;
    consentedById?: string;
  }
) => {
  await requirePatient(patientId);

  const consentType = typeof data?.consentType === "string" ? data.consentType.trim().toUpperCase() : "";
  if (!consentType) throw new HttpError("consentType is required", 400, "CONSENT_TYPE_REQUIRED");

  const consentText = typeof data?.consentText === "string" ? data.consentText.trim() : "";
  if (!consentText) throw new HttpError("consentText is required", 400, "CONSENT_TEXT_REQUIRED");

  let consentedById: string | null = null;
  if (data.consentedById) {
    const collector = await prisma.user.findUnique({
      where: { id: data.consentedById },
      select: { id: true, status: true },
    });
    if (!collector) throw new HttpError("Consent collector not found", 400, "USER_NOT_FOUND");
    if (collector.status !== "ACTIVE") {
      throw new HttpError("Consent collector is not active", 403, "USER_INACTIVE");
    }
    consentedById = collector.id;
  }

  // A new consent record supersedes any open consent of the same type.
  const consent = await prisma.$transaction(async (tx) => {
    await tx.patientConsent.updateMany({
      where: { patientId, consentType, revokedAt: null, consentGiven: true },
      data: { consentGiven: false, revokedAt: new Date() },
    });

    return tx.patientConsent.create({
      data: {
        patientId,
        consentType,
        consentGiven: Boolean(data.consentGiven),
        consentText,
        consentedById,
        consentDate: new Date(),
      },
    });
  });

  await createAuditLog({
    userId: consentedById ?? undefined,
    module: "PATIENTS",
    action: data.consentGiven ? "GRANT_CONSENT" : "DECLINE_CONSENT",
    recordId: patientId,
    newData: { consentId: consent.id, consentType: consent.consentType },
  }).catch((error) => console.error("Audit log failed for consent recording:", error));

  return consent;
};

export const getPatientConsents = async (patientId: string) => {
  await requirePatient(patientId);

  return prisma.patientConsent.findMany({
    where: { patientId },
    orderBy: { consentDate: "desc" },
    include: {
      consentedBy: { select: { id: true, fullName: true, employeeCode: true } },
    },
  });
};

export const revokeConsent = async (patientId: string, consentId: string) => {
  const existing = await prisma.patientConsent.findUnique({ where: { id: consentId } });
  if (!existing || existing.patientId !== patientId) throw notFound("Consent");

  if (!existing.consentGiven && existing.revokedAt) {
    throw new HttpError("Consent is already revoked", 409, "CONSENT_ALREADY_REVOKED");
  }

  const consent = await prisma.patientConsent.update({
    where: { id: consentId },
    data: { consentGiven: false, revokedAt: new Date() },
  });

  await createAuditLog({
    module: "PATIENTS",
    action: "REVOKE_CONSENT",
    recordId: patientId,
    oldData: { consentId, consentGiven: existing.consentGiven },
    newData: { consentId, consentGiven: false },
  }).catch((error) => console.error("Audit log failed for consent revocation:", error));

  return { message: "Consent revoked successfully", id: consent.id, consentType: consent.consentType };
};
