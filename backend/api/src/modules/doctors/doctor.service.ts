import prisma from "../../../config/database";
import type { Prisma } from "@prisma/client";
import { HttpError } from "../../utils/http-error";
import { createAuditLog } from "../audit/audit.service";
import {
  COMMISSION_ELIGIBLE_ORDER,
  getBulkCommissionTotals,
  getBulkMonthlyOrders,
  getBulkPaidRevenue,
  getBulkReferredPatients,
  getDoctorCommissionTotals,
  isCommissionApplicable,
  money,
  periodKeyOf,
  syncDoctorCommissionLedger,
  voidStaleCommissionEntries,
} from "./doctor.commission";

export { isCommissionApplicable, money };

// =======================================================
// DOCTOR SERVICE
//
// Data contract shared by every screen:
//   metrics.totalReferrals     distinct referred patients
//   metrics.paidOrderCount     PAID, non-cancelled orders
//   metrics.paidRevenue        sum(grandTotal) of those orders
//   metrics.commissionEarned   ledger total (earned)
//   metrics.commissionSettled  ledger total already paid out
//   metrics.commissionPending  earned - settled
//
// List, 360 view, KPI cards and the payout modal all read the
// same numbers from here, so they can no longer disagree.
// =======================================================

export type DoctorInput = Record<string, any>;

/** Doctor types that can appear as a "hospital / clinic partner". */
export const PARTNER_TYPES = ["HOSPITAL_PARTNER", "CLINIC_PARTNER"] as const;
/** Doctor types that report-sign and therefore need a signature. */
export const SIGNATURE_REQUIRED_TYPES = [
  "IN_HOUSE_PATHOLOGIST",
  "INTERNAL_PATHOLOGIST",
  "CONSULTANT_PATHOLOGIST",
] as const;

/** Mask a bank account / UPI handle for non-admin viewers. */
export const maskBankValue = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (trimmed.length <= 4) return "X".repeat(trimmed.length);
  return `XXXX${trimmed.slice(-4)}`;
};

export const resolveReportDelivery = (doctor: {
  reportDeliveryEmail?: boolean | null;
  reportDeliveryWhatsApp?: boolean | null;
  reportDeliveryHardCopy?: boolean | null;
  reportDeliveryPortal?: boolean | null;
}): string[] => {
  const modes: string[] = [];
  if (doctor.reportDeliveryEmail) modes.push("Email");
  if (doctor.reportDeliveryWhatsApp) modes.push("WhatsApp");
  if (doctor.reportDeliveryHardCopy) modes.push("Hard Copy");
  if (doctor.reportDeliveryPortal) modes.push("Portal");
  return modes;
};

const generateDoctorCode = async (): Promise<string> => {
  const existing = await prisma.doctor.findFirst({
    where: { doctorCode: { startsWith: "DOC-" } },
    orderBy: { doctorCode: "desc" },
    select: { doctorCode: true },
  });
  const lastNum = existing ? Number(existing.doctorCode.replace(/\D/g, "")) : 1000;
  let next = Number.isFinite(lastNum) && lastNum >= 1000 ? lastNum + 1 : 1001;

  // Skip any code already taken (races, manual entries).
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const code = `DOC-${next}`;
    const clash = await prisma.doctor.findUnique({
      where: { doctorCode: code },
      select: { id: true },
    });
    if (!clash) return code;
    next += 1;
  }
};

const buildFullName = (data: DoctorInput): string | undefined => {
  if (data.fullName?.trim()) return data.fullName.trim();
  const joined = [data.firstName, data.middleName, data.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return joined || undefined;
};

const buildAddress = (data: DoctorInput): string | undefined => {
  if (data.address?.trim()) return data.address.trim();
  const joined = [data.address, data.clinicAddress, data.city, data.state]
    .filter(Boolean)
    .join(", ")
    .trim();
  return joined || undefined;
};
// __PART2__

/**
 * Duplicate guard.
 *
 * The original code only checked doctorCode + email (case-sensitive),
 * which let the same practitioner in twice under a different code or
 * with different capitalisation. Phone, registration number, email and
 * doctor code are all compared now, and archived records are ignored
 * so a retired doctor never blocks a fresh registration.
 */
export const assertNoDuplicate = async (
  data: {
    phone?: string | null;
    email?: string | null;
    registrationNumber?: string | null;
    doctorCode?: string | null;
  },
  excludeId?: string
) => {
  const candidates: Array<{ field: keyof typeof data; value: string }> = [];
  if (data.phone) candidates.push({ field: "phone", value: data.phone });
  if (data.email) candidates.push({ field: "email", value: data.email.toLowerCase() });
  if (data.registrationNumber)
    candidates.push({ field: "registrationNumber", value: data.registrationNumber });
  if (data.doctorCode)
    candidates.push({ field: "doctorCode", value: data.doctorCode });

  for (const { field, value } of candidates) {
    const existing = await (prisma.doctor as any).findFirst({
      where: {
        [field]: value,
        isArchived: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: {
        id: true,
        doctorCode: true,
        fullName: true,
        phone: true,
        email: true,
        registrationNumber: true,
      },
    });

    if (!existing) continue;

    const who = `${existing.fullName} (${existing.doctorCode})`;
    const message =
      field === "phone"
        ? `Phone number is already registered to ${who}`
        : field === "email"
        ? `Email is already registered to ${who}`
        : field === "registrationNumber"
        ? `Registration number is already registered to ${who}`
        : `Doctor code ${value} is already in use by ${who}`;

    throw new HttpError(message, 409, "DOCTOR_DUPLICATE");
  }
};

const SANITISED_FIELDS = [
  "title",
  "gender",
  "dateOfBirth",
  "languages",
  "experienceYears",
  "notes",
  "city",
  "state",
  "pincode",
  "panNumber",
  "gstin",
  "registrationNumber",
  "registrationCouncil",
  "registrationExpiry",
  "registrationCertificateUrl",
  "commissionType",
  "commissionFlatAmount",
  "commissionCategoryRules",
  "payoutCycle",
  "upiId",
  "bankName",
  "cancelledChequeUrl",
  "organizationId",
  "signatureUrl",
  "photoUrl",
  "whatsappNumber",
  "phone",
  "email",
  "qualification",
  "specialization",
  "department",
  "designation",
  "clinicName",
  "clinicAddress",
  "isActive",
  "reportDeliveryEmail",
  "reportDeliveryWhatsApp",
  "reportDeliveryHardCopy",
  "reportDeliveryPortal",
  "enablePortalAccess",
  "bankAccountNumber",
  "bankIfscCode",
  "bankAccountHolderName",
  "consultationFee",
  "licenseNumber",
  "licenseExpiry",
  "availableDays",
  "availableTime",
] as const;

type SanitisedKey = (typeof SANITISED_FIELDS)[number];

/**
 * Drop undefined/null keys so Prisma never receives an explicit
 * "null" that would wipe an existing value on a partial update.
 * Only fields the caller actually sent are applied.
 */
const pickDefined = (data: DoctorInput): Partial<Record<SanitisedKey, any>> => {
  const out: Record<string, any> = {};
  for (const key of SANITISED_FIELDS) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  return out;
};

// =======================================================
// CREATE
// =======================================================

export const createDoctor = async (
  data: DoctorInput,
  actor?: { userId?: string; ip?: string; ua?: string }
) => {
  const fullName = buildFullName(data);

  if (!fullName) {
    throw new HttpError("Doctor name is required", 400, "DOCTOR_NAME_REQUIRED");
  }

  const isAutoGenerated = !data.doctorCode?.trim();
  let retries = 3;

  while (true) {
    try {
      const doctorCode = data.doctorCode?.trim() || (await generateDoctorCode());

      await assertNoDuplicate({
        phone: data.phone,
        email: data.email,
        registrationNumber: data.registrationNumber,
        doctorCode,
      });

      const doctor = await prisma.doctor.create({
        data: {
          ...pickDefined(data),
          doctorCode,
          fullName,
          address: buildAddress(data) ?? data.address,
          postalCode: data.pincode ?? data.postalCode,
          isActive: data.isActive ?? true,
          isArchived: false,
        } as Prisma.DoctorCreateInput,
      });

      await createAuditLog({
        userId: actor?.userId,
        module: "DOCTORS",
        action: "CREATE_DOCTOR",
        recordId: doctor.id,
        ipAddress: actor?.ip,
        userAgent: actor?.ua,
        newData: {
          doctorCode,
          fullName,
          doctorType: doctor.doctorType,
          phone: doctor.phone,
        },
      }).catch(() => undefined);

      return doctor;
    } catch (error: any) {
      const isDuplicateCode = 
        (error instanceof HttpError && error.code === "DOCTOR_DUPLICATE" && error.message.includes("Doctor code")) ||
        (error.code === 'P2002' && (error.meta?.target as any)?.includes?.('doctorCode'));
      
      if (isDuplicateCode && isAutoGenerated) {
        retries--;
        if (retries > 0) continue;
      }
      throw error;
    }
  }
};

// =======================================================
// LIST + KPIs  (server-side, no N+1, filters & sort applied)
// =======================================================

export type DoctorListFilters = {
  search?: string;
  specialization?: string;
  doctorType?: string;
  typeGroup?: "REFERRING_DOCTOR" | "PATHOLOGIST" | "PARTNER";
  city?: string;
  organizationId?: string;
  isActive?: boolean;
  archived?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page: number;
  limit: number;
};

export const buildDoctorWhere = (filters: DoctorListFilters): any => {
  const where: any = {};

  if (filters.search) {
    const term = filters.search.trim();
    where.OR = [
      { fullName: { contains: term, mode: "insensitive" } },
      { doctorCode: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
      { email: { contains: term, mode: "insensitive" } },
      { registrationNumber: { contains: term, mode: "insensitive" } },
      { clinicName: { contains: term, mode: "insensitive" } },
      { specialization: { contains: term, mode: "insensitive" } },
    ];
  }

  if (filters.specialization) {
    where.specialization = {
      contains: filters.specialization.trim(),
      mode: "insensitive",
    };
  }

  if (filters.city) {
    where.city = { contains: filters.city.trim(), mode: "insensitive" };
  }

  if (filters.organizationId) {
    where.organizationId = filters.organizationId;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  where.isArchived = filters.archived ?? false;

  // Type resolution: an explicit doctorType wins, otherwise the
  // grouped tab bucket. Legacy NULL types count as referring doctors.
  if (filters.doctorType) {
    where.doctorType = filters.doctorType;
  } else if (filters.typeGroup === "PATHOLOGIST") {
    where.doctorType = {
      in: ["IN_HOUSE_PATHOLOGIST", "INTERNAL_PATHOLOGIST", "CONSULTANT_PATHOLOGIST"],
    };
  } else if (filters.typeGroup === "REFERRING_DOCTOR") {
    where.OR = [
      ...(where.OR ?? []),
      { doctorType: "REFERRING_DOCTOR" },
      { doctorType: null },
    ];
  } else if (filters.typeGroup === "PARTNER") {
    where.doctorType = { in: [...PARTNER_TYPES] };
  }

  // Date range applies to referral activity, not to record creation,
  // so it is applied through the orders relation.
  if (filters.dateFrom || filters.dateTo) {
    const createdAt: any = {};
    if (filters.dateFrom) createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    where.orders = { some: { createdAt } };
  }

  return where;
};

/**
 * Metrics for a set of doctors, computed with 4 grouped queries
 * instead of 2 queries per row.
 */
const bulkMetrics = async (doctorIds: string[]) => {
  const [commission, revenue, patients, monthly] = await Promise.all([
    getBulkCommissionTotals(doctorIds),
    getBulkPaidRevenue(doctorIds),
    getBulkReferredPatients(doctorIds),
    getBulkMonthlyOrders(doctorIds),
  ]);

  const out: Record<string, any> = {};

  for (const id of doctorIds) {
    const c = commission[id];
    const r = revenue[id] ?? { revenue: 0, orderCount: 0 };
    out[id] = {
      totalReferrals: patients[id] ?? 0,
      totalOrders: c?.paidOrderCount ?? r.orderCount,
      paidOrderCount: c?.paidOrderCount ?? r.orderCount,
      paidRevenue: c?.paidRevenue ?? r.revenue,
      commissionEarned: c?.earned ?? 0,
      commissionSettled: c?.settled ?? 0,
      commissionPending: c?.pending ?? 0,
      monthlyOrders: monthly[id] ?? 0,
    };
  }
  return out;
};

const metricsFor = async (doctorId: string) => {
  const [commission, revenue, patients, monthly] = await Promise.all([
    getDoctorCommissionTotals(doctorId),
    getBulkPaidRevenue([doctorId]),
    getBulkReferredPatients([doctorId]),
    getBulkMonthlyOrders([doctorId]),
  ]);
  const c = commission;
  const r = revenue[doctorId] ?? { revenue: 0, orderCount: 0 };
  return {
    totalReferrals: patients[doctorId] ?? 0,
    totalOrders: c.paidOrderCount || r.orderCount,
    paidOrderCount: c.paidOrderCount || r.orderCount,
    paidRevenue: c.paidRevenue || r.revenue,
    commissionEarned: c.earned,
    commissionSettled: c.settled,
    commissionPending: c.pending,
    monthlyOrders: monthly[doctorId] ?? 0,
  };
};

const selectForList: any = {
  id: true,
  doctorCode: true,
  fullName: true,
  title: true,
  qualification: true,
  specialization: true,
  registrationNumber: true,
  phone: true,
  whatsappNumber: true,
  email: true,
  clinicName: true,
  clinicAddress: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  experience: true,
  experienceYears: true,
  languages: true,
  designation: true,
  department: true,
  photoUrl: true,
  signatureUrl: true,
  doctorType: true,
  commissionRate: true,
  commissionType: true,
  commissionFlatAmount: true,
  payoutCycle: true,
  isActive: true,
  isArchived: true,
  archivedAt: true,
  reportDeliveryEmail: true,
  reportDeliveryWhatsApp: true,
  reportDeliveryHardCopy: true,
  reportDeliveryPortal: true,
  enablePortalAccess: true,
  registrationExpiry: true,
  organizationId: true,
  organization: {
    select: { id: true, name: true, code: true, organizationType: true },
  },
  createdAt: true,
  consultationFee: true,
  licenseNumber: true,
  licenseExpiry: true,
  availableDays: true,
  availableTime: true,
};

export const getDoctors = async (filters: DoctorListFilters) => {
  const where = buildDoctorWhere(filters);
  const skip = (filters.page - 1) * filters.limit;
  const direction: Prisma.SortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

  const [total, rows] = await Promise.all([
    (prisma.doctor as any).count({ where }),
    (prisma.doctor as any).findMany({
      where,
      skip,
      take: filters.limit,
      select: selectForList,
      // Metric sorting (referrals / revenue / commission due) needs the
      // ledger, so it is applied after bulk aggregation, not in SQL.
      orderBy:
        filters.sortBy === "name"
          ? { fullName: direction }
          : filters.sortBy === "createdAt"
          ? { createdAt: direction }
          : { createdAt: "desc" },
    }),
  ]);

  const doctorIds = rows.map((r: any) => r.id);
  const [metrics, distincts] = await Promise.all([
    bulkMetrics(doctorIds),
    (prisma.doctor as any).findMany({
      where,
      select: { city: true, specialization: true },
      distinct: ["city", "specialization"],
    }),
  ]);

  let doctors = rows.map((row: any) => ({
    ...row,
    ...metrics[row.id],
    // Aliases kept so older table columns keep working.
    totalRevenue: metrics[row.id].paidRevenue,
    pendingPayout: metrics[row.id].commissionPending,
    reportDeliveryModes: resolveReportDelivery(row),
  }));

  if (
    filters.sortBy === "referrals" ||
    filters.sortBy === "revenue" ||
    filters.sortBy === "commissionDue"
  ) {
    const key =
      filters.sortBy === "referrals"
        ? "totalReferrals"
        : filters.sortBy === "revenue"
        ? "paidRevenue"
        : "commissionPending";
    doctors.sort((a: any, b: any) =>
      direction === "asc"
        ? a[key] - b[key]
        : b[key] - a[key]
    );
  }

  return {
    doctors,
    kpis: await buildKpis(where),
    filters: {
      cities: [...new Set(distincts.map((d: any) => d.city).filter(Boolean))].sort(),
      specializations: [
        ...new Set(distincts.map((d: any) => d.specialization).filter(Boolean)),
      ].sort(),
    },
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
      hasNextPage: filters.page * filters.limit < total,
      hasPreviousPage: filters.page > 1,
    },
  };
};

/**
 * KPI totals for the CURRENT filter set (not just the visible page).
 * The old implementation reduced the 20 rows it happened to have in
 * memory, so the cards disagreed with the list as soon as you paginated.
 */
export const buildKpis = async (where: any) => {
  const ids = (await (prisma.doctor as any).findMany({ where, select: { id: true } })).map(
    (d: any) => d.id
  );

  const [totalDoctors, activeDoctors, archivedCount, partners, metrics] =
    await Promise.all([
      (prisma.doctor as any).count({ where }),
      (prisma.doctor as any).count({ where: { ...where, isActive: true } }),
      (prisma.doctor as any).count({ where: { ...where, isArchived: true } }),
      (prisma.doctor as any).count({
        where: { ...where, doctorType: { in: [...PARTNER_TYPES] } },
      }),
      bulkMetrics(ids),
    ]);

  let paidRevenue = 0;
  let pendingCommission = 0;
  let settledCommission = 0;
  let totalReferrals = 0;
  let monthlyReferrals = 0;

  for (const id of ids) {
    const m = metrics[id];
    if (!m) continue;
    paidRevenue += m.paidRevenue;
    pendingCommission += m.commissionPending;
    settledCommission += m.commissionSettled;
    totalReferrals += m.totalReferrals;
    monthlyReferrals += m.monthlyOrders;
  }

  return {
    totalDoctors,
    activeDoctors,
    archivedDoctors: archivedCount,
    partnerOrganizations: partners,
    patientsReferredThisMonth: monthlyReferrals,
    totalReferrals,
    paidRevenue: money(paidRevenue),
    pendingCommission: money(pendingCommission),
    settledCommission: money(settledCommission),
    doctorsWithPendingPayout: ids.filter(
      (id: string) => (metrics[id]?.commissionPending ?? 0) > 0
    ).length,
  };
};
// __PART4__

// =======================================================
// GET ONE (360 view)
// =======================================================

export const getDoctorById = async (
  id: string,
  opts?: { canViewBank?: boolean }
) => {
  const doctor = await (prisma.doctor as any).findUnique({
    where: { id },
    include: {
      organization: true,
      documents: { orderBy: { createdAt: "desc" } },
      _count: { select: { orders: true, patients: true } },
    },
  });

  if (!doctor) {
    throw new HttpError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }

  // Keep the ledger in step with reality before reporting on it.
  await syncDoctorCommissionLedger(id);
  await voidStaleCommissionEntries(id);

  const metrics = await metricsFor(id);

  const canViewBank = opts?.canViewBank ?? false;
  const safeDoctor = canViewBank
    ? doctor
    : {
        ...doctor,
        bankAccountNumber: maskBankValue(doctor.bankAccountNumber),
        upiId: doctor.upiId ? maskBankValue(doctor.upiId) : null,
      };

  return {
    ...safeDoctor,
    bankDetailsMasked: !canViewBank,
    reportDeliveryModes: resolveReportDelivery(doctor),
    signatureRequired: (SIGNATURE_REQUIRED_TYPES as readonly string[]).includes(
      doctor.doctorType ?? ""
    ),
    signatureApproved: !!doctor.signatureApprovedAt,
    requiresCommission: isCommissionApplicable(doctor.doctorType),
    metrics,
    // Aliases so any older consumer keeps the same field names.
    totalRevenue: metrics.paidRevenue,
    pendingPayout: metrics.commissionPending,
    statistics: {
      totalPatients: metrics.totalReferrals,
      totalOrders: metrics.totalOrders,
      completedOrders: metrics.paidOrderCount,
      pendingOrders: 0,
      totalRevenue: metrics.paidRevenue,
      averageOrderValue: metrics.totalOrders
        ? money(metrics.paidRevenue / metrics.totalOrders)
        : 0,
      completionRate: 100,
      commissionEarned: metrics.commissionEarned,
      commissionSettled: metrics.commissionSettled,
      commissionPending: metrics.commissionPending,
    },
  };
};

// =======================================================
// UPDATE
// =======================================================

export const updateDoctor = async (
  id: string,
  data: DoctorInput,
  actor?: { userId?: string; ip?: string; ua?: string }
) => {
  const existing = await prisma.doctor.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }

  if (data.doctorCode || data.phone || data.email || data.registrationNumber) {
    await assertNoDuplicate(
      {
        phone: data.phone,
        email: data.email,
        registrationNumber: data.registrationNumber,
        doctorCode: data.doctorCode,
      },
      id
    );
  }

  // A pathologist can never be saved without a signature.
  const patch = pickDefined(data) as Record<string, any>;
  const effectiveType = data.doctorType ?? existing.doctorType ?? "";
  if (
    (SIGNATURE_REQUIRED_TYPES as readonly string[]).includes(effectiveType) &&
    patch.signatureUrl === undefined &&
    !existing.signatureUrl
  ) {
    throw new HttpError(
      "A digital signature is mandatory for pathologist / consultant records",
      400,
      "SIGNATURE_REQUIRED"
    );
  }

  if (data.fullName || data.firstName || data.lastName) {
    patch.fullName = buildFullName({ ...existing, ...data });
  }
  if (data.address || data.clinicAddress || data.city) {
    patch.address = buildAddress({ ...existing, ...data }) ?? existing.address;
  }
  if (data.pincode ?? data.postalCode) {
    patch.postalCode = data.pincode ?? data.postalCode;
  }

  const doctor = await prisma.$transaction(async (tx) => {
    const updated = await tx.doctor.update({ where: { id }, data: patch });

    // Re-rate the ledger whenever the money terms change.
    const moneyChanged =
      data.commissionRate !== undefined ||
      data.commissionType !== undefined ||
      data.commissionFlatAmount !== undefined ||
      data.commissionCategoryRules !== undefined ||
      data.doctorType !== undefined;

    if (moneyChanged) {
      await syncDoctorCommissionLedger(id, tx);
      await voidStaleCommissionEntries(id, tx);
    }
    return updated;
  });

  await createAuditLog({
    userId: actor?.userId,
    module: "DOCTORS",
    action: "UPDATE_DOCTOR",
    recordId: id,
    ipAddress: actor?.ip,
    userAgent: actor?.ua,
    oldData: {
      fullName: existing.fullName,
      phone: existing.phone,
      email: existing.email,
    },
    newData: { fullName: doctor.fullName, phone: doctor.phone, email: doctor.email },
  }).catch(() => undefined);

  return doctor;
};

export const updateDoctorStatus = async (id: string, isActive: boolean) => {
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) {
    throw new HttpError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }
  return prisma.doctor.update({ where: { id }, data: { isActive } });
};
// =======================================================
// ARCHIVE (soft delete) — referral history is never destroyed
// =======================================================

export const archiveDoctor = async (
  id: string,
  opts?: { reason?: string; userId?: string }
) => {
  const doctor: any = await (prisma.doctor as any).findUnique({ where: { id } });
  if (!doctor) {
    throw new HttpError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }
  if (doctor.isArchived) {
    throw new HttpError(
      "Doctor is already archived",
      409,
      "DOCTOR_ALREADY_ARCHIVED"
    );
  }

  const [patientCount, orderCount] = await Promise.all([
    prisma.patient.count({ where: { referredById: id } }),
    prisma.order.count({ where: { doctorId: id } }),
  ]);

  const updated = await (prisma.doctor as any).update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      archivedById: opts?.userId,
      archiveReason: opts?.reason,
      isActive: false,
    },
  });

  await createAuditLog({
    userId: opts?.userId,
    module: "DOCTORS",
    action: "ARCHIVE_DOCTOR",
    recordId: id,
    oldData: { isArchived: false, isActive: doctor.isActive },
    newData: { isArchived: true, reason: opts?.reason },
  }).catch(() => undefined);

  return {
    ...updated,
    // Surfaced so the UI can state that history was kept.
    preservedHistory: { patients: patientCount, orders: orderCount },
  };
};

export const restoreDoctor = async (id: string, userId?: string) => {
  const doctor = await (prisma.doctor as any).findUnique({ where: { id } });
  if (!doctor) {
    throw new HttpError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }
  const updated = await (prisma.doctor as any).update({
    where: { id },
    data: {
      isArchived: false,
      archivedAt: null,
      archivedById: null,
      archiveReason: null,
      isActive: true,
    },
  });
  await createAuditLog({
    userId,
    module: "DOCTORS",
    action: "RESTORE_DOCTOR",
    recordId: id,
  }).catch(() => undefined);
  return updated;
};

/**
 * Hard delete is refused when history exists. Clinical and financial
 * records must stay auditable, so "remove" always means archive.
 */
export const deleteDoctor = async (id: string, userId?: string) => {
  const doctor = await (prisma.doctor as any).findUnique({ where: { id } });
  if (!doctor) {
    throw new HttpError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }
  const [patientCount, orderCount, payoutCount] = await Promise.all([
    prisma.patient.count({ where: { referredById: id } }),
    prisma.order.count({ where: { doctorId: id } }),
    (prisma as any).doctorPayout?.count({ where: { doctorId: id } }) ?? 0,
  ]);

  if (patientCount > 0 || orderCount > 0 || payoutCount > 0) {
    throw new HttpError(
      "This doctor has referral or payout history and must be archived, not deleted. Referral records are retained for audit.",
      409,
      "DOCTOR_HAS_HISTORY"
    );
  }

  // No history at all: still archive rather than delete, so the code
  // can never be reused and the audit trail stays complete.
  return archiveDoctor(id, { reason: "Deleted (no history)", userId });
};
// =======================================================
// 360 VIEW SUB-RESOURCES
// =======================================================

/** Patient-wise referral orders table. */
export const getDoctorReferralHistory = async (
  id: string,
  opts?: { page?: number; limit?: number; status?: string }
) => {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const where: Prisma.OrderWhereInput = { doctorId: id };
  if (opts?.status === "PAID") where.paymentStatus = "PAID";
  else if (opts?.status === "PENDING") where.paymentStatus = { not: "PAID" };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        orderStatus: true,
        paymentStatus: true,
        grandTotal: true,
        paidAmount: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            uhid: true,
            firstName: true,
            middleName: true,
            lastName: true,
            gender: true,
          },
        },
        items: { select: { test: { select: { testName: true, testCode: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
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

/** Commission ledger with a per-period roll-up. */
export const getDoctorLedger = async (
  id: string,
  opts?: { status?: string; periodKey?: string; page?: number; limit?: number }
) => {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 25;
  const where: any = { doctorId: id };
  if (opts?.status && opts.status !== "ALL") {
    where.status = opts.status;
  }
  if (opts?.periodKey) where.periodKey = opts.periodKey;

  const [entries, total, byPeriod] = await Promise.all([
    (prisma as any).doctorCommissionEntry.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ referralDate: "desc" }, { createdAt: "desc" }],
      include: {
        order: {
          select: {
            orderNumber: true,
            grandTotal: true,
            paymentStatus: true,
            orderStatus: true,
            patient: { select: { uhid: true, firstName: true, lastName: true } },
          },
        },
        payout: { select: { voucherNumber: true, payoutDate: true } },
      },
    }),
    (prisma as any).doctorCommissionEntry.count({ where }),
    (prisma as any).doctorCommissionEntry.groupBy({
      by: ["periodKey", "status"],
      where: { doctorId: id },
      _sum: { commissionAmount: true, baseAmount: true },
      _count: { _all: true },
    }),
  ]);

  return {
    entries,
    periods: byPeriod
      .map((p: any) => ({
        periodKey: p.periodKey,
        status: p.status,
        orderCount: p._count._all ?? 0,
        revenue: money(Number(p._sum.baseAmount ?? 0)),
        commission: money(Number(p._sum.commissionAmount ?? 0)),
      }))
      .sort((a: any, b: any) => b.periodKey.localeCompare(a.periodKey)),
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

/** Settlement vouchers. */
export const getDoctorPayouts = async (id: string) => {
  const payouts = await (prisma as any).doctorPayout.findMany({
    where: { doctorId: id },
    orderBy: { payoutDate: "desc" },
    include: { _count: { select: { entries: true } } },
  });
  const totals = payouts.reduce(
    (acc: any, p: any) => {
      acc.gross = money(acc.gross + Number(p.grossAmount));
      acc.tds = money(acc.tds + Number(p.tdsAmount));
      acc.net = money(acc.net + Number(p.netPaid));
      return acc;
    },
    { gross: 0, tds: 0, net: 0 }
  );
  return { payouts, totals };
};
// =======================================================
// TREND / DOCUMENTS / ACTIVITY
// =======================================================

/** Monthly referral + revenue trend for the profile charts. */
export const getDoctorTrend = async (id: string, months = 12) => {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [orders, entries] = await Promise.all([
    prisma.order.findMany({
      where: { doctorId: id, createdAt: { gte: since } },
      select: {
        createdAt: true,
        grandTotal: true,
        paymentStatus: true,
        orderStatus: true,
        patientId: true,
      },
    }),
    (prisma as any).doctorCommissionEntry.findMany({
      where: { doctorId: id, referralDate: { gte: since } },
      select: { periodKey: true, commissionAmount: true, status: true },
    }),
  ]);

  const buckets: Record<
    string,
    { orders: number; revenue: number; commission: number; patients: Set<string> }
  > = {};
  const push = (key: string) => {
    buckets[key] ??= { orders: 0, revenue: 0, commission: 0, patients: new Set<string>() };
    return buckets[key];
  };

  // Pre-seed every month so the chart has no gaps.
  for (let i = 0; i < months; i += 1) {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    push(periodKeyOf(d));
  }

  for (const o of orders) {
    if (o.orderStatus === "CANCELLED") continue;
    const b = push(periodKeyOf(o.createdAt));
    b.orders += 1;
    b.patients.add(o.patientId);
    if (o.paymentStatus === "PAID") b.revenue = money(b.revenue + Number(o.grandTotal));
  }
  for (const e of entries) {
    if (e.status === "VOID") continue;
    const b = push(e.periodKey);
    b.commission = money(b.commission + Number(e.commissionAmount));
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodKey, b]) => ({
      periodKey,
      month: periodKey.slice(5),
      referrals: b.patients.size,
      orders: b.orders,
      revenue: b.revenue,
      commission: b.commission,
    }));
};

/** Documents (certificates, cancelled cheque, signature). */
export const getDoctorDocuments = async (id: string) =>
  (prisma as any).doctorDocument.findMany({
    where: { doctorId: id },
    orderBy: { createdAt: "desc" },
  });

export const addDoctorDocument = async (
  id: string,
  data: {
    documentType: string;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
    fileData: string;
  },
  userId?: string
) => {
  const doctor = await (prisma.doctor as any).findUnique({
    where: { id },
    select: { id: true },
  });
  if (!doctor) throw new HttpError("Doctor not found", 404, "DOCTOR_NOT_FOUND");

  const doc = await (prisma as any).doctorDocument.create({
    data: {
      doctorId: id,
      documentType: data.documentType,
      fileName: data.fileName,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      fileData: data.fileData,
      uploadedById: userId,
    },
  });

  // Mirror onto the doctor row so reports and the profile header can
  // show it without a second lookup.
  if (data.documentType === "REGISTRATION_CERTIFICATE") {
    await (prisma.doctor as any).update({
      where: { id },
      data: { registrationCertificateUrl: data.fileData },
    });
  }
  if (data.documentType === "CANCELLED_CHEQUE") {
    await (prisma.doctor as any).update({
      where: { id },
      data: { cancelledChequeUrl: data.fileData },
    });
  }
  if (data.documentType === "SIGNATURE") {
    await (prisma.doctor as any).update({
      where: { id },
      data: {
        signatureUrl: data.fileData,
        signatureApprovedAt: new Date(),
        signatureApprovedById: userId,
      },
    });
  }

  return doc;
};

/** Audit trail for the doctor record. */
export const getDoctorActivity = async (id: string, limit = 50) =>
  prisma.auditLog.findMany({
    where: { recordId: id, module: "DOCTORS" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, fullName: true, employeeCode: true, role: true } },
    },
  });
// =======================================================
// PAYOUT SETTLEMENT
// The previous version only RETURNED a voucher object and wrote
// nothing to the database, so "pending" never moved and a settled
// payout was invisible to the next request.
// =======================================================

let voucherCounter = 0;
const nextVoucherNumber = async () => {
  const year = new Date().getFullYear();
  const last = await (prisma as any).doctorPayout.findFirst({
    where: { voucherNumber: { startsWith: `VCH-${year}-` } },
    orderBy: { voucherNumber: "desc" },
    select: { voucherNumber: true },
  });
  const lastSeq = last ? Number(last.voucherNumber.split("-").pop()) : 0;
  voucherCounter = Math.max(
    voucherCounter,
    Number.isFinite(lastSeq) ? lastSeq : 0
  ) + 1;
  return `VCH-${year}-${String(voucherCounter).padStart(5, "0")}`;
};

export type PayoutInput = {
  amount: number;
  paymentMode: string;
  refNumber?: string;
  tdsDeduction?: number;
  remarks?: string;
  payoutDate?: string;
  periodKey?: string;
  userId?: string;
};

export const processDoctorPayout = async (id: string, payout: PayoutInput) => {
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) throw new HttpError("Doctor not found", 404, "DOCTOR_NOT_FOUND");

  if (!isCommissionApplicable(doctor.doctorType)) {
    throw new HttpError(
      "Commission payouts are only applicable for referring doctors and partners",
      400,
      "COMMISSION_NOT_APPLICABLE"
    );
  }

  if (!payout.amount || payout.amount <= 0) {
    throw new HttpError("Invalid payout amount", 400, "INVALID_PAYOUT_AMOUNT");
  }

  if (payout.refNumber) {
    const existingPayout = await (prisma as any).doctorPayout.findFirst({
      where: { doctorId: id, refNumber: payout.refNumber }
    });
    if (existingPayout) {
      throw new HttpError("A payout with this reference number already exists", 409, "DUPLICATE_PAYOUT");
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    await syncDoctorCommissionLedger(id, tx);
    await voidStaleCommissionEntries(id, tx);

    const totals = await getDoctorCommissionTotals(id, tx);

    if (totals.pending === 0) {
      throw new HttpError(
        "There is no pending commission to settle for this doctor",
        400,
        "NO_PENDING_COMMISSION"
      );
    }

    if (money(payout.amount) > totals.pending) {
      throw new HttpError(
        `Payout of ₹${money(payout.amount).toLocaleString(
          "en-IN"
        )} exceeds the pending commission of ₹${totals.pending.toLocaleString("en-IN")}`,
        400,
        "PAYOUT_EXCEEDS_PENDING"
      );
    }

    const tdsPct = payout.tdsDeduction ?? 0;
    const tdsAmount = money((payout.amount * tdsPct) / 100);
    const netPaid = money(payout.amount - tdsAmount);
    const voucherNumber = await nextVoucherNumber();
    const payoutDate = payout.payoutDate ? new Date(payout.payoutDate) : new Date();

    const voucher = await (tx as any).doctorPayout.create({
      data: {
        voucherNumber,
        doctorId: id,
        grossAmount: money(payout.amount),
        tdsPercentage: tdsPct,
        tdsAmount,
        netPaid,
        paymentMode: payout.paymentMode,
        refNumber: payout.refNumber || null,
        payoutDate,
        periodKey: payout.periodKey ?? null,
        remarks: payout.remarks ?? null,
        status: "SETTLED",
        settledById: payout.userId,
      },
    });

    const pendingEntries = await (tx as any).doctorCommissionEntry.findMany({
      where: {
        doctorId: id,
        status: "PENDING",
        ...(payout.periodKey ? { periodKey: payout.periodKey } : {}),
      },
      orderBy: { referralDate: "asc" },
    });

    const entriesToSettle: string[] = [];
    let allocated = 0;
    for (const entry of pendingEntries) {
      if (allocated >= money(payout.amount)) break;
      entriesToSettle.push(entry.id);
      allocated = money(allocated + Number(entry.commissionAmount));
    }

    if (entriesToSettle.length > 0) {
      await (tx as any).doctorCommissionEntry.updateMany({
        where: { id: { in: entriesToSettle } },
        data: { status: "SETTLED", payoutId: voucher.id },
      });
    }

    return { voucherNumber, tdsAmount, netPaid, payoutDate, entriesSettled: entriesToSettle.length };
  });

  await createAuditLog({
    userId: payout.userId,
    module: "DOCTORS",
    action: "COMMISSION_PAYOUT_SETTLED",
    recordId: id,
    newData: {
      voucherNumber: result.voucherNumber,
      grossAmount: money(payout.amount),
      tdsAmount: result.tdsAmount,
      netPaid: result.netPaid,
      paymentMode: payout.paymentMode,
      refNumber: payout.refNumber ?? null,
      payoutDate: result.payoutDate.toISOString(),
      entriesSettled: result.entriesSettled,
      doctorName: doctor.fullName,
      doctorCode: doctor.doctorCode,
    },
  }).catch(() => undefined);

  const totals = await getDoctorCommissionTotals(id);

  return {
    success: true,
    voucher: {
      voucherNumber: result.voucherNumber,
      doctorId: id,
      doctorName: doctor.fullName,
      doctorCode: doctor.doctorCode,
      clinicName: doctor.clinicName || "Clinic Affiliated",
      grossAmount: money(payout.amount),
      tdsPercentage: payout.tdsDeduction ?? 0,
      tdsAmount: result.tdsAmount,
      netPaid: result.netPaid,
      paymentMode: payout.paymentMode,
      refNumber: payout.refNumber || `UTR-${result.voucherNumber}`,
      payoutDate: result.payoutDate.toISOString().slice(0, 10),
      remarks: payout.remarks || "Referral commission settlement",
      entriesSettled: result.entriesSettled,
      timestamp: new Date().toLocaleString("en-IN"),
    },
    // Returned so the UI refreshes from the same ledger.
    commission: totals,
  };
};
/** Doctors with money still owed, for the "Pending Payouts" tab. */
export const getPendingPayouts = async (opts?: { periodKey?: string }) => {
  const grouped = await (prisma as any).doctorCommissionEntry.groupBy({
    by: ["doctorId"],
    where: {
      status: "PENDING",
      ...(opts?.periodKey ? { periodKey: opts.periodKey } : {}),
    },
    _sum: { commissionAmount: true, baseAmount: true },
    _count: { _all: true },
  });

  if (grouped.length === 0) {
    return { doctors: [], totals: { pending: 0, orders: 0 } };
  }

  const doctors = await (prisma.doctor as any).findMany({
    where: { id: { in: grouped.map((g: any) => g.doctorId) } },
    select: {
      id: true,
      doctorCode: true,
      fullName: true,
      specialization: true,
      clinicName: true,
      phone: true,
      whatsappNumber: true,
      doctorType: true,
      commissionType: true,
      commissionRate: true,
      payoutCycle: true,
      upiId: true,
      bankAccountNumber: true,
      bankIfscCode: true,
      bankAccountHolderName: true,
    },
  });

  const rows = grouped
    .map((g: any) => {
      const doctor = doctors.find((d: any) => d.id === g.doctorId);
      if (!doctor) return null;
      return {
        ...doctor,
        bankAccountNumberMasked: maskBankValue(doctor.bankAccountNumber),
        pendingAmount: money(Number(g._sum.commissionAmount ?? 0)),
        pendingRevenue: money(Number(g._sum.baseAmount ?? 0)),
        pendingOrderCount: g._count._all ?? 0,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => (b as any).pendingAmount - (a as any).pendingAmount);

  return {
    doctors: rows,
    totals: {
      pending: money(rows.reduce((s: number, r: any) => s + (r as any).pendingAmount, 0)),
      orders: rows.reduce((s: number, r: any) => s + (r as any).pendingOrderCount, 0),
    },
  };
};

// =======================================================
// ORGANISATIONS (hospital / clinic partner entity)
// =======================================================

export const listOrganizations = async () =>
  (prisma as any).doctorOrganization.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { doctors: true } } },
  });

export const createOrganization = async (data: DoctorInput) => {
  const code = data.code?.trim() || `ORG-${Date.now().toString().slice(-6)}`;

  const clash = await (prisma as any).doctorOrganization.findUnique({
    where: { code },
    select: { id: true },
  });
  if (clash) {
    throw new HttpError(
      `Organisation code ${code} is already in use`,
      409,
      "ORG_DUPLICATE"
    );
  }

  return (prisma as any).doctorOrganization.create({
    data: {
      code,
      name: data.name,
      organizationType: data.organizationType ?? "CLINIC",
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      gstin: data.gstin,
      panNumber: data.panNumber,
      commissionRate: data.commissionRate,
      payoutCycle: data.payoutCycle ?? "MONTHLY",
      bankAccountNumber: data.bankAccountNumber,
      bankIfscCode: data.bankIfscCode,
      bankAccountHolderName: data.bankAccountHolderName,
      isActive: data.isActive ?? true,
    },
  });
};

export const updateOrganization = async (id: string, data: DoctorInput) => {
  const org = await (prisma as any).doctorOrganization.findUnique({ where: { id } });
  if (!org) {
    throw new HttpError("Organisation not found", 404, "ORG_NOT_FOUND");
  }
  // Code and name are immutable so linked doctors never orphan.
  const { code: _code, name: _name, ...rest } = data;
  return (prisma as any).doctorOrganization.update({ where: { id }, data: rest });
};

/** Lightweight dropdown source for "Referred By" in order creation. */
export const searchDoctorsForReferral = async (
  search?: string,
  limit = 20
) => {
  const term = search?.trim();
  return (prisma.doctor as any).findMany({
    where: {
      isArchived: false,
      isActive: true,
      ...(term
        ? {
            OR: [
              { fullName: { contains: term, mode: "insensitive" as const } },
              { doctorCode: { contains: term, mode: "insensitive" as const } },
              { phone: { contains: term } },
              { clinicName: { contains: term, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      doctorCode: true,
      fullName: true,
      specialization: true,
      clinicName: true,
      qualification: true,
      registrationNumber: true,
      phone: true,
      doctorType: true,
    },
    orderBy: { fullName: "asc" },
    take: limit,
  });
};
// =======================================================
// COMPAT WRAPPERS (older endpoints keep working)
// =======================================================

export const getDoctorStatistics = async (id: string) => {
  const doctor = await getDoctorById(id);
  return {
    doctor,
    statistics: doctor.statistics,
    recentOrders: (await getDoctorReferralHistory(id, { limit: 10 })).orders,
  };
};

export const getDoctorCommission = async (
  id: string,
  startDate?: Date,
  endDate?: Date
) => {
  const doctor: any = await (prisma.doctor as any).findUnique({ where: { id } });
  if (!doctor) throw new HttpError("Doctor not found", 404, "DOCTOR_NOT_FOUND");

  await syncDoctorCommissionLedger(id);
  await voidStaleCommissionEntries(id);

  const where: any = { doctorId: id };
  if (startDate || endDate) {
    where.referralDate = {};
    if (startDate) where.referralDate.gte = startDate;
    if (endDate) where.referralDate.lte = endDate;
  }

  const [entries, totals] = await Promise.all([
    (prisma as any).doctorCommissionEntry.findMany({
      where,
      orderBy: { referralDate: "desc" },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            grandTotal: true,
            paymentStatus: true,
            orderStatus: true,
            createdAt: true,
            patient: {
              select: { firstName: true, middleName: true, lastName: true, uhid: true },
            },
          },
        },
      },
    }),
    getDoctorCommissionTotals(id),
  ]);

  return {
    doctor: {
      id: doctor.id,
      fullName: doctor.fullName,
      doctorCode: doctor.doctorCode,
      commissionType: doctor.commissionType,
      commissionRate: Number(doctor.commissionRate ?? 0),
      commissionFlatAmount: Number(doctor.commissionFlatAmount ?? 0),
      payoutCycle: doctor.payoutCycle,
    },
    commissionType: doctor.commissionType,
    commissionRate: Number(doctor.commissionRate ?? 0),
    totalRevenue: totals.paidRevenue,
    totalCommission: totals.earned,
    pendingCommission: totals.pending,
    settledCommission: totals.settled,
    orderCount: totals.paidOrderCount,
    orders: entries.map((e: any) => e.order),
    entries,
  };
};

export const getDoctorsBySpecialization = async (specialization: string) =>
  (prisma.doctor as any).findMany({
    where: {
      specialization: { contains: specialization, mode: "insensitive" },
      isArchived: false,
    },
    select: {
      id: true,
      doctorCode: true,
      fullName: true,
      specialization: true,
      phone: true,
      clinicName: true,
      isActive: true,
    },
    orderBy: { fullName: "asc" },
  });
