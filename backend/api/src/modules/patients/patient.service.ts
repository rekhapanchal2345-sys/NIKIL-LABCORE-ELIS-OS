import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";
import { createAuditLog } from "../audit/audit.service";
import { encryptField, decryptField, canDecryptField } from "../../utils/field-crypto";
import {
  assertPatientCreateComplete,
  buildPatientData,
  notificationPreferencesFrom,
  sanitizePhone,
} from "./patient.mapper";

type Tx = Prisma.TransactionClient;

interface PatientInput {
  [key: string]: unknown;
}

/** Columns used by the duplicate lookup, all trimmed/normalised the same way. */
const duplicateSelect = {
  id: true,
  uhid: true,
  firstName: true,
  middleName: true,
  lastName: true,
  phone: true,
  email: true,
  aadhaarNumber: true,
  panNumber: true,
} satisfies Prisma.PatientSelect;

const UHID_SEQUENCE = /^UHID-\d{4}-(\d+)$/;

export const generateUHID = async (tx: Tx | typeof prisma = prisma): Promise<string> => {
  const currentYear = new Date().getUTCFullYear();
  const prefix = `UHID-${currentYear}-`;

  // Use raw sql for atomic sequence increment specifically for patient UHID to match the format.
  await tx.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS accounting_sequences (
      id VARCHAR(255) PRIMARY KEY,
      series_type VARCHAR(50) NOT NULL,
      financial_year VARCHAR(20) NOT NULL,
      branch_id VARCHAR(100) NOT NULL DEFAULT 'DEFAULT',
      current_value INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_series_fy_branch UNIQUE (series_type, financial_year, branch_id)
    );
  `);

  const seriesKey = `UHID-${currentYear}`;
  const rows: any = await tx.$queryRawUnsafe(`
    INSERT INTO accounting_sequences (id, series_type, financial_year, branch_id, current_value, updated_at)
    VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (series_type, financial_year, branch_id)
    DO UPDATE SET
      current_value = accounting_sequences.current_value + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING current_value;
  `, seriesKey, "UHID", currentYear.toString(), "DEFAULT");

  const nextVal = Array.isArray(rows) && rows[0]?.current_value ? Number(rows[0].current_value) : 1;
  return `${prefix}${String(nextVal).padStart(5, "0")}`;
};

export const checkDuplicatePatient = async (
  phone?: unknown,
  email?: unknown,
  aadhaarNumber?: unknown,
  panNumber?: unknown,
  excludePatientId?: string,
  tx: Tx | typeof prisma = prisma
) => {
  const asString = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null;
    const text = String(value).trim();
    return text === "" ? null : text;
  };

  const normalisedPhone = asString(sanitizePhone(phone));
  const normalisedEmail = asString(email)?.toLowerCase() ?? null;

  const candidates: Array<{
    field: string;
    column: keyof Prisma.PatientWhereInput;
    value: string | null;
  }> = [
    { field: "phone", column: "phone", value: normalisedPhone },
    { field: "email", column: "email", value: normalisedEmail },
  ];

  for (const { field, column, value } of candidates) {
    if (!value) continue;

    const existing = await tx.patient.findFirst({
      where: {
        [column]: value,
        isDraft: false,
        ...(excludePatientId ? { id: { not: excludePatientId } } : {}),
      } as Prisma.PatientWhereInput,
      select: duplicateSelect,
    });

    if (existing) return { ...existing, matchedField: field };
  }

  return null;
};

export const generatePatientQRData = (patientId: string, uhid: string) =>
  JSON.stringify({
    type: "PATIENT",
    id: patientId,
    uhid,
    timestamp: new Date().toISOString(),
  });

/**
 * Shapes a patient row for the registration/roster screens: exposes the request
 * field names the forms use (postalCode, emergencyContactPhone, doctorId,
 * medicalConditions) alongside the stored column names.
 */
export const formatPatientResponse = (patient: any, maskPii = false) => {
  if (!patient) return patient;

  const chronic = Array.isArray(patient.chronicDiseases) ? patient.chronicDiseases : [];
  const allergies = Array.isArray(patient.allergies) ? patient.allergies : [];
  const medications = Array.isArray(patient.currentMedications)
    ? patient.currentMedications
    : [];

  const orders: any[] = Array.isArray(patient.orders) ? patient.orders : [];
  const activeOrders = orders.filter(
    (order) => order.orderStatus !== "COMPLETED" && order.orderStatus !== "CANCELLED"
  );

  const isCritical = Boolean(
    patient.patientType === "EMERGENCY" ||
      orders.some(
        (order) =>
          (order.priority === "STAT" || order.priority === "CRITICAL") &&
          order.orderStatus !== "CANCELLED" &&
          order.orderStatus !== "COMPLETED"
      )
  );

  const emergencyPhone = patient.emergencyContact ?? null;
  const pincode = patient.pincode ?? null;

  let phone = patient.phone;
  let aadhaarNumber = patient.aadhaarNumber;
  let panNumber = patient.panNumber;

  if (aadhaarNumber && canDecryptField(aadhaarNumber)) {
    aadhaarNumber = decryptField(aadhaarNumber);
  }
  if (panNumber && canDecryptField(panNumber)) {
    panNumber = decryptField(panNumber);
  }

  if (maskPii) {
    if (phone && phone.length >= 4) phone = phone.slice(0, 3) + "******" + phone.slice(-4);
    if (aadhaarNumber && aadhaarNumber.length >= 4) aadhaarNumber = "********" + aadhaarNumber.slice(-4);
    if (panNumber && panNumber.length >= 4) panNumber = panNumber.slice(0, 2) + "******" + panNumber.slice(-2);
  }

  return {
    ...patient,
    phone,
    aadhaarNumber,
    panNumber,
    isActive: patient.isActive !== false,
    isCritical,
    isVip: Boolean(patient.patientType === "VIP"),
    emergencyContact: emergencyPhone,
    emergencyContactPhone: emergencyPhone,
    pincode,
    postalCode: pincode,
    doctorId: patient.referredById ?? null,
    medicalConditions: chronic,
    chronicDiseases: chronic,
    allergies,
    currentMedications: medications,
    totalOrders: patient._count?.orders ?? orders.length,
    pendingOrders: activeOrders.length,
    lastVisitDate: orders.length > 0 ? orders[0]?.createdAt ?? null : null,
    additionalInformation: patient.notes ?? "",
    notificationPreferences: notificationPreferencesFrom(patient.communicationPreference),
  };
};

const assertRelationsExist = async (
  data: Record<string, any>,
  tx: Tx | typeof prisma = prisma
) => {
  if (data.referredById) {
    const doctor = await tx.doctor.findUnique({
      where: { id: data.referredById },
      select: { id: true, isActive: true },
    });
    if (!doctor) throw new HttpError("Referring doctor not found.", 400, "DOCTOR_NOT_FOUND");
    if (!doctor.isActive) {
      throw new HttpError("Referring doctor is inactive.", 400, "DOCTOR_INACTIVE");
    }
  }

  if (data.familyHeadId) {
    if (data.familyHeadId === data.id) {
      throw new HttpError("A patient cannot be their own family head.", 400, "SELF_FAMILY_LINK");
    }
    const head = await tx.patient.findUnique({
      where: { id: data.familyHeadId },
      select: { id: true, isDraft: true, familyHeadId: true },
    });
    if (!head) throw new HttpError("Family head not found.", 400, "FAMILY_HEAD_NOT_FOUND");
    if (head.isDraft) {
      throw new HttpError(
        "Family head must be a finalized patient.",
        400,
        "FAMILY_HEAD_IS_DRAFT"
      );
    }
    if (head.familyHeadId) {
      throw new HttpError(
        "Selected family head is already linked to another family.",
        400,
        "FAMILY_HEAD_IS_DEPENDENT"
      );
    }
  }
};

export const createPatient = async (data: PatientInput, createdById?: string) => {
  const payload = buildPatientData(data as Record<string, any>, undefined, { strict: true });
  assertPatientCreateComplete(payload);

  await assertRelationsExist(payload);

  const duplicate = await checkDuplicatePatient(
    payload.phone,
    payload.email,
    payload.aadhaarNumber,
    payload.panNumber
  );

  if (duplicate) {
    throw new HttpError(
      `Patient already exists with this ${duplicate.matchedField}. UHID: ${duplicate.uhid}`,
      409,
      "DUPLICATE_PATIENT"
    );
  }

  let validCreatedById: string | null = null;
  if (createdById) {
    const user = await prisma.user.findUnique({
      where: { id: createdById },
      select: { id: true, status: true },
    });
    if (!user) throw new HttpError("Creating user account not found.", 401, "USER_NOT_FOUND");
    if (user.status !== "ACTIVE") {
      throw new HttpError("User account is not active.", 403, "USER_INACTIVE");
    }
    validCreatedById = user.id;
  }

  let retries = 5;
  let patient;
  
  while (true) {
    try {
      patient = await prisma.$transaction(async (tx) => {
        const uhid = await generateUHID(tx);
        const patientId = crypto.randomUUID();
        const qrCode = generatePatientQRData(patientId, uhid);

        const created = await tx.patient.create({
          data: {
            ...payload,
            id: patientId,
            uhid,
            createdById: validCreatedById,
            verificationStatus: "UNVERIFIED",
            phoneVerified: false,
            emailVerified: false,
            kycVerified: false,
            qrCode,
          },
        });

        return created;
      });
      break; // Success
    } catch (error: any) {
      if (error.code === 'P2002' && (error.meta?.target?.includes('uhid') || String(error.message).includes('uhid'))) {
        retries--;
        if (retries <= 0) {
          throw new HttpError("Failed to generate unique UHID after multiple attempts. Please try again.", 500, "UHID_GENERATION_FAILED");
        }
        // Jitter delay between 15ms and 60ms to let competing transactions clear
        await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 45));
        continue;
      }
      throw error;
    }
  }

  await createAuditLog({
    userId: validCreatedById ?? undefined,
    module: "PATIENTS",
    action: "CREATE_PATIENT",
    recordId: patient.id,
    newData: {
      uhid: patient.uhid,
      patientType: patient.patientType,
      gender: patient.gender,
      registrationSource: patient.registrationSource,
    },
  }).catch((error) =>
    console.error("Failed to create audit log for patient creation:", error)
  );

  return formatPatientResponse(patient);
};

export const getPatients = async (options: {
  search?: string;
  page?: number;
  limit?: number;
  gender?: string;
  patientType?: string;
  activeChip?: string;
  createdById?: string;
  includeDrafts?: boolean;
}) => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  const filters: Prisma.PatientWhereInput[] = [];

  if (!options.includeDrafts) filters.push({ isDraft: false });
  if (options.createdById) filters.push({ createdById: options.createdById });

  const search = options.search?.trim();
  if (search) {
    const isDigitsOnly = /^\d+$/.test(search);
    const isUhidPattern = /^UHID/i.test(search);
    const hasEmailSign = search.includes("@");

    if (isUhidPattern) {
      filters.push({ uhid: { contains: search, mode: "insensitive" } });
    } else if (hasEmailSign) {
      filters.push({ email: { contains: search, mode: "insensitive" } });
    } else if (isDigitsOnly) {
      // Numeric query: check indexed phone, aadhaarNumber, or UHID fragment
      filters.push({
        OR: [
          { phone: { contains: search } },
          { aadhaarNumber: { contains: search } },
          { uhid: { contains: search, mode: "insensitive" } },
        ],
      });
    } else {
      // Name and textual identifiers
      filters.push({
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { middleName: { contains: search, mode: "insensitive" } },
          { uhid: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      });
    }
  }

  const gender = options.gender?.trim();
  if (gender && gender.toUpperCase() !== "ALL") {
    const normalized = gender.toUpperCase();
    if (!["MALE", "FEMALE", "OTHER"].includes(normalized)) {
      throw new HttpError("Invalid gender filter.", 400, "INVALID_GENDER_FILTER");
    }
    filters.push({ gender: normalized as "MALE" | "FEMALE" | "OTHER" });
  }

  if (options.patientType?.trim()) {
    filters.push({ patientType: options.patientType.trim().toUpperCase() });
  }

  const criticalWhere: Prisma.PatientWhereInput = {
    OR: [
      { patientType: "EMERGENCY" },
      {
        orders: {
          some: {
            priority: { in: ["STAT", "CRITICAL"] },
            orderStatus: { notIn: ["COMPLETED", "CANCELLED"] },
          },
        },
      },
    ],
  };

  // Roster KPIs are computed on the IST calendar day, not UTC.
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(Date.now() + istOffsetMs);
  const startOfTodayIst = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - istOffsetMs
  );

  const sixtyYearsAgoIst = new Date(startOfTodayIst);
  sixtyYearsAgoIst.setFullYear(sixtyYearsAgoIst.getFullYear() - 60);

  const seniorWhere: Prisma.PatientWhereInput = {
    OR: [
      { age: { gte: 60 } },
      { dateOfBirth: { lte: sixtyYearsAgoIst } },
    ],
  };

  const pendingWhere: Prisma.PatientWhereInput = {
    orders: { some: { orderStatus: { notIn: ["COMPLETED", "CANCELLED"] } } },
  };

  const todayWhere: Prisma.PatientWhereInput = {
    createdAt: { gte: startOfTodayIst },
  };

  const chip = options.activeChip?.trim().toUpperCase();
  if (chip === "ACTIVE") filters.push({ isActive: true });
  else if (chip === "INACTIVE") filters.push({ isActive: false });
  else if (chip === "CRITICAL") filters.push(criticalWhere);
  else if (chip === "PENDING") filters.push(pendingWhere);
  else if (chip === "TODAY") filters.push(todayWhere);
  else if (chip === "SENIOR") filters.push(seniorWhere);
  else if (chip && chip !== "ALL") {
    throw new HttpError(
      "Invalid activeChip filter. Use ALL, ACTIVE, INACTIVE, CRITICAL, PENDING, TODAY or SENIOR.",
      400,
      "INVALID_CHIP_FILTER"
    );
  }

  const where: Prisma.PatientWhereInput = filters.length > 0 ? { AND: filters } : {};
  const rosterWhere: Prisma.PatientWhereInput = { isDraft: false };

  const [patients, total, totalRoster, activeCount, todayCount, criticalCount, pendingCount, seniorCount] =
    await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { orders: true } },
          orders: {
            take: 10,
            orderBy: { createdAt: "desc" },
            select: { id: true, createdAt: true, priority: true, orderStatus: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
      prisma.patient.count({ where: rosterWhere }),
      prisma.patient.count({ where: { ...rosterWhere, isActive: true } }),
      prisma.patient.count({ where: { ...rosterWhere, createdAt: { gte: startOfTodayIst } } }),
      prisma.patient.count({ where: { AND: [rosterWhere, criticalWhere] } }),
      prisma.patient.count({ where: { AND: [rosterWhere, pendingWhere] } }),
      prisma.patient.count({ where: { AND: [rosterWhere, seniorWhere] } }),
    ]);

  return {
    patients: patients.map((p) => formatPatientResponse(p, true)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
    kpis: {
      totalRoster,
      activeCount,
      todayCount,
      criticalCount,
      pendingCount,
      seniorCount,
    },
  };
};

export const countPatients = async (search?: string) => {
  const trimmed = search?.trim();
  const where: Prisma.PatientWhereInput = trimmed
    ? {
        isDraft: false,
        OR: [
          { firstName: { contains: trimmed, mode: "insensitive" } },
          { middleName: { contains: trimmed, mode: "insensitive" } },
          { lastName: { contains: trimmed, mode: "insensitive" } },
          { uhid: { contains: trimmed, mode: "insensitive" } },
          { phone: { contains: trimmed, mode: "insensitive" } },
          { email: { contains: trimmed, mode: "insensitive" } },
        ],
      }
    : { isDraft: false };

  return prisma.patient.count({ where });
};

export const getPatientById = async (id: string) => {
  const patient = await prisma.patient.findFirst({
    where: {
      OR: [
        { id },
        { uhid: id },
      ],
    },
    include: {
      referredBy: true,
      createdBy: { select: { id: true, fullName: true, employeeCode: true } },
      familyHead: {
        select: {
          id: true,
          uhid: true,
          firstName: true,
          middleName: true,
          lastName: true,
          phone: true,
        },
      },
      familyMembers: {
        select: {
          id: true,
          uhid: true,
          firstName: true,
          middleName: true,
          lastName: true,
          gender: true,
          age: true,
          relationshipToHead: true,
          phone: true,
          bloodGroup: true,
          createdAt: true,
        },
      },
      medicalHistories: {
        orderBy: { createdAt: "desc" },
      },
      consents: {
        orderBy: { consentDate: "desc" },
      },
      _count: { select: { orders: true } },
      orders: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true, priority: true, orderStatus: true },
      },
    },
  });

  if (!patient) throw new HttpError("Patient not found", 404, "PATIENT_NOT_FOUND");

  return formatPatientResponse(patient);
};

export const updatePatient = async (idOrUhid: string, data: PatientInput) => {
  const existing = await prisma.patient.findFirst({ 
    where: { OR: [{ id: idOrUhid }, { uhid: idOrUhid }] } 
  });
  if (!existing) throw new HttpError("Patient not found", 404, "PATIENT_NOT_FOUND");
  const id = existing.id;

  const payload = buildPatientData(data as Record<string, any>, existing, { strict: true });

  if (payload.familyHeadId && payload.familyHeadId !== existing.familyHeadId) {
    payload.familyHeadId =
      payload.familyHeadId === id ? null : payload.familyHeadId;
  }

  await assertRelationsExist({ ...payload, id }, prisma);

  const duplicate = await checkDuplicatePatient(
    payload.phone,
    payload.email,
    payload.aadhaarNumber,
    payload.panNumber,
    id
  );

  if (duplicate) {
    throw new HttpError(
      `Another patient already exists with this ${duplicate.matchedField}. UHID: ${duplicate.uhid}`,
      409,
      "DUPLICATE_PATIENT"
    );
  }

  // A patient who already has dependents must not become a dependent themselves.
  const incomingHeadId = payload.familyHeadId ?? existing.familyHeadId;
  if (incomingHeadId) {
    const dependents = await prisma.patient.count({ where: { familyHeadId: id } });
    if (dependents > 0) {
      throw new HttpError(
        "This patient already has family members linked. Unlink them first.",
        409,
        "FAMILY_HEAD_HAS_DEPENDENTS"
      );
    }
  }

  const updatedPatient = await prisma.patient.update({
    where: { id },
    data: payload,
  });

  await createAuditLog({
    module: "PATIENTS",
    action: "UPDATE_PATIENT",
    recordId: id,
    newData: { updatedFields: Object.keys(payload), uhid: updatedPatient.uhid },
  }).catch((error) =>
    console.error("Failed to create audit log for patient update:", error)
  );

  return formatPatientResponse(updatedPatient);
};

/**
 * Patients are never hard-deleted once they have clinical or financial history,
 * because Order/Sample/Invoice relations are ON DELETE RESTRICT. Drafts have no
 * such dependents and are removed outright.
 */
export const deletePatient = async (idOrUhid: string, deletedById?: string) => {
  const patient = await prisma.patient.findFirst({
    where: { OR: [{ id: idOrUhid }, { uhid: idOrUhid }] },
    include: {
      _count: {
        select: {
          orders: true,
          samples: true,
          results: true,
          reports: true,
          advances: true,
        },
      },
    },
  });

  if (!patient) throw new HttpError("Patient not found", 404, "PATIENT_NOT_FOUND");
  const id = patient.id;

  if (patient.isDraft) {
    await prisma.patient.delete({ where: { id } });
    return { id, uhid: patient.uhid, deleted: true, deactivated: false };
  }

  const dependents = Object.entries(patient._count).reduce(
    (total, [, count]) => total + Number(count ?? 0),
    0
  );

  if (!patient.isActive && dependents === 0) {
    await prisma.patient.delete({ where: { id } });
    return { id, uhid: patient.uhid, deleted: true, deactivated: false };
  }

  await prisma.patient.update({ where: { id }, data: { isActive: false } });

  await createAuditLog({
    userId: deletedById,
    module: "PATIENTS",
    action: "DEACTIVATE_PATIENT",
    recordId: id,
    oldData: { isActive: true, uhid: patient.uhid },
    newData: { isActive: false, relatedRecords: dependents },
  }).catch((error) =>
    console.error("Failed to create audit log for patient deactivation:", error)
  );

  return {
    id,
    uhid: patient.uhid,
    deleted: false,
    deactivated: true,
    relatedRecords: dependents,
  };
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const createPatientWithOrder = async (
  patientData: PatientInput,
  orderData: any,
  createdById?: string
) => {
  const items: Array<{ testId: string; discount?: number }> = orderData?.items ?? [];

  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError("At least one test is required.", 400, "ORDER_ITEMS_REQUIRED");
  }

  let retries = 3;
  while (true) {
    try {
      const result = await prisma.$transaction(async (tx) => {
      const payload = buildPatientData(patientData as Record<string, any>, undefined, {
        strict: true,
      });
      assertPatientCreateComplete(payload);

      if (payload.phone || payload.email || payload.aadhaarNumber || payload.panNumber) {
        const duplicate = await checkDuplicatePatient(
          payload.phone,
          payload.email,
          payload.aadhaarNumber,
          payload.panNumber,
          undefined,
          tx
        );
        if (duplicate) {
          throw new HttpError(
            `Patient already exists with this ${duplicate.matchedField}. UHID: ${duplicate.uhid}`,
            409,
            "DUPLICATE_PATIENT"
          );
        }
      }

      let validCreatedById: string | null = null;
      if (createdById) {
        const user = await tx.user.findUnique({
          where: { id: createdById },
          select: { id: true, status: true },
        });
        if (!user) throw new HttpError("Creating user account not found.", 401, "USER_NOT_FOUND");
        if (user.status !== "ACTIVE") {
          throw new HttpError("User account is not active.", 403, "USER_INACTIVE");
        }
        validCreatedById = user.id;
      }

      await assertRelationsExist(payload, tx);

      const uhid = await generateUHID(tx);
      const patientId = crypto.randomUUID();
      const qrCode = generatePatientQRData(patientId, uhid);

      const patient = await tx.patient.create({
        data: {
          ...payload,
          id: patientId,
          uhid,
          createdById: validCreatedById,
          verificationStatus: "UNVERIFIED",
          qrCode,
        },
      });

      // Order-level referral doctor overrides the patient's standing referral.
      let orderDoctorId: string | null = null;
      if (orderData.doctorId) {
        const doctor = await tx.doctor.findUnique({
          where: { id: orderData.doctorId },
          select: { id: true, isActive: true },
        });
        if (!doctor) throw new HttpError("Referring doctor not found.", 400, "DOCTOR_NOT_FOUND");
        if (!doctor.isActive) {
          throw new HttpError("Referring doctor is inactive.", 400, "DOCTOR_INACTIVE");
        }
        orderDoctorId = doctor.id;
      } else {
        orderDoctorId = payload.referredById ?? null;
      }

      let validCollectedById: string | null = null;
      if (orderData.collectedById) {
        const collector = await tx.user.findUnique({
          where: { id: orderData.collectedById },
          select: { id: true, status: true, role: true },
        });
        if (!collector || collector.status !== "ACTIVE") {
          throw new HttpError("Sample collector not found or inactive.", 400, "COLLECTOR_INVALID");
        }
        if (!["LAB_TECH", "ADMIN", "SUPER_ADMIN", "BRANCH_ADMIN"].includes(collector.role)) {
          throw new HttpError(
            "Sample collector must be a lab technician or administrator.",
            400,
            "COLLECTOR_ROLE"
          );
        }
        validCollectedById = collector.id;
      }

      const testIds = Array.from(new Set(items.map((item) => item.testId)));
      const tests = await tx.test.findMany({
        where: { id: { in: testIds }, isActive: true },
        select: {
          id: true,
          testName: true,
          price: true,
          gstPercentage: true,
          sampleType: true,
        },
      });

      if (tests.length !== testIds.length) {
        throw new HttpError("One or more tests are invalid or inactive.", 400, "TESTS_INVALID");
      }

      let subtotal = 0;
      let totalDiscount = 0;
      let gstAmount = 0;

      const orderItems = items.map((item) => {
        const test = tests.find((candidate) => candidate.id === item.testId)!;
        const price = Number(test.price);
        const discount = round2(Number(item.discount ?? 0));

        if (discount < 0 || discount > price) {
          throw new HttpError(
            `Discount for ${test.testName} must be between 0 and ${price}.`,
            400,
            "INVALID_ITEM_DISCOUNT"
          );
        }

        const taxable = price - discount;
        const gstPercentage = Number(test.gstPercentage ?? 0);
        const itemGst = round2((taxable * gstPercentage) / 100);

        subtotal += price;
        totalDiscount += discount;
        gstAmount += itemGst;

        return {
          testId: test.id,
          itemType: "TEST",
          price,
          discount,
          gstPercentage,
          gstAmount: itemGst,
          finalPrice: round2(taxable + itemGst),
        };
      });

      subtotal = round2(subtotal);
      totalDiscount = round2(totalDiscount);
      gstAmount = round2(gstAmount);

      const orderDiscount = round2(Number(orderData.discount ?? 0));
      if (orderDiscount < 0 || orderDiscount > subtotal) {
        throw new HttpError(
          "Order discount cannot be negative or exceed the subtotal.",
          400,
          "INVALID_ORDER_DISCOUNT"
        );
      }

      const taxableAmount = round2(subtotal - totalDiscount - orderDiscount);
      const grandTotal = round2(taxableAmount + gstAmount);

      const paidAmount = round2(Math.max(0, Number(orderData.paidAmount ?? 0)));
      if (paidAmount > grandTotal) {
        throw new HttpError(
          `Paid amount cannot exceed the grand total of ${grandTotal}.`,
          400,
          "PAID_AMOUNT_EXCEEDS_TOTAL"
        );
      }
      const dueAmount = round2(grandTotal - paidAmount);
      const paymentStatus =
        paidAmount >= grandTotal && grandTotal > 0
          ? "PAID"
          : paidAmount > 0
            ? "PARTIAL"
            : "PENDING";

      const stamp = Date.now();
      const orderSuffix = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0");
      const orderNumber = `ORD-${stamp}-${orderSuffix}`;
      const barcode = `BC-${stamp}-${orderSuffix}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          barcode,
          patientId: patient.id,
          doctorId: orderDoctorId,
          createdById: validCreatedById,
          orderStatus: "REGISTERED",
          paymentStatus,
          notes: orderData.notes ?? null,
          clinicalNotes: orderData.clinicalNotes ?? null,
          fastingStatus: orderData.fastingStatus ?? null,
          collectionType: orderData.collectionType ?? null,
          priority: orderData.priority ?? "ROUTINE",
          homeCollectionAddress: orderData.homeCollectionAddress ?? null,
          subtotal,
          discount: round2(totalDiscount + orderDiscount),
          discountCode: orderData.discountCode ?? null,
          paidAmount,
          gstAmount,
          grandTotal,
          dueAmount,
          reportDeliveryWhatsApp: Boolean(orderData.reportDeliveryWhatsApp),
          reportDeliveryEmail: Boolean(orderData.reportDeliveryEmail),
          reportDeliveryPrinted: Boolean(orderData.reportDeliveryPrinted),
          reportDeliveryPortal: Boolean(orderData.reportDeliveryPortal),
          items: { create: orderItems },
        },
        include: {
          patient: true,
          doctor: true,
          items: { include: { test: { include: { category: true } } } },
        },
      });

      for (const [index, item] of order.items.entries()) {
        const sampleSuffix = `${orderSuffix}${String(index).padStart(2, "0")}`;
        const sample = await tx.sample.create({
          data: {
            sampleNumber: `SMP-${stamp}-${sampleSuffix}`,
            barcode: `BC-SMP-${stamp}-${sampleSuffix}`,
            patientId: patient.id,
            orderId: order.id,
            testId: item.testId!,
            sampleType: item.test?.sampleType ?? "BLOOD",
            status: "PENDING",
            collectionType: orderData.collectionType ?? null,
            priority: orderData.priority ?? "ROUTINE",
            collectedById: validCollectedById,
          },
        });

        await tx.sampleTrackingHistory.create({
          data: {
            sampleId: sample.id,
            orderId: order.id,
            patientId: patient.id,
            eventType: "ORDER_REGISTERED",
            status: "REGISTERED",
            notes: `Order ${orderNumber} registered for ${item.test?.testName ?? "Test"}`,
            performedById: validCreatedById,
            metadata: {
              orderNumber,
              sampleNumber: sample.sampleNumber,
              barcode: sample.barcode,
            },
          },
        });
      }

      await createAuditLog({
        userId: validCreatedById ?? undefined,
        module: "PATIENTS",
        action: "CREATE_PATIENT_WITH_ORDER",
        recordId: patient.id,
        newData: { uhid: patient.uhid, orderId: order.id, orderNumber: order.orderNumber },
      }).catch((error) =>
        console.error("Failed to create audit log for patient order creation:", error)
      );

      const finalizedPatient = await tx.patient.findUniqueOrThrow({
        where: { id: patient.id },
      });

      return { patient: formatPatientResponse(finalizedPatient), order };
    });
    return result;
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && (error.meta?.target as any)?.includes?.('uhid')) {
      retries--;
      if (retries <= 0) {
        throw new HttpError("Failed to generate unique UHID after multiple attempts. Please try again.", 500, "UHID_GENERATION_FAILED");
      }
      continue;
    }
    if (error instanceof HttpError || error instanceof Prisma.PrismaClientKnownRequestError) {
      throw error;
    }
    console.error("Transaction error in createPatientWithOrder:", error);
    throw error;
  }
}
};
