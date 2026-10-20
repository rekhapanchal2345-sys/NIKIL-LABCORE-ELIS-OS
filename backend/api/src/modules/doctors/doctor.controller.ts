import { Request, Response, NextFunction } from "express";
import type { UserRole } from "@prisma/client";

import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
  archiveDoctor,
  restoreDoctor,
  deleteDoctor,
  getDoctorStatistics,
  getDoctorCommission,
  getDoctorsBySpecialization,
  getDoctorReferralHistory,
  getDoctorLedger,
  getDoctorPayouts,
  getDoctorTrend,
  getDoctorDocuments,
  addDoctorDocument,
  getDoctorActivity,
  processDoctorPayout,
  getPendingPayouts,
  listOrganizations,
  createOrganization,
  updateOrganization,
  searchDoctorsForReferral,
} from "./doctor.service";

import { successResponse, createdResponse } from "../../utils/response";
import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";
import {
  saveSignatureImage,
  getDoctorSealInfo,
} from "../approvals/digital-signature.service";

const actorOf = (req: Request) => ({
  userId: (req as any).user?.id as string | undefined,
  ip: req.ip,
  ua: req.get("user-agent") ?? undefined,
});

const roleOf = (req: Request): UserRole | undefined => (req as any).user?.role;

/** Bank details are unmasked for ADMIN / SUPER_ADMIN only. */
const canViewBank = (req: Request) =>
  roleOf(req) === "ADMIN" || roleOf(req) === "SUPER_ADMIN";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    const doctor = await createDoctor(body, actorOf(req));
    return createdResponse(res, doctor, "Doctor registered successfully");
  } catch (error) {
    next(error);
  }
};

export const list = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;
    const q = query as Record<string, any>;

    // Legacy /count shortcut.
    if (req.path.endsWith("/count")) {
      const result = await getDoctors({
        page: 1,
        limit: 1,
        archived: q.archived === "true",
      });
      return successResponse(
        res,
        { count: result.pagination.total },
        "Doctor count fetched successfully"
      );
    }

    const result = await getDoctors({
      search: q.search,
      specialization: q.specialization,
      doctorType: q.doctorType,
      typeGroup: q.typeGroup,
      city: q.city,
      organizationId: q.organizationId,
      isActive: q.isActive === undefined ? undefined : q.isActive === "true",
      archived: q.archived === "all" ? undefined : q.archived === "true",
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      sortBy: q.sortBy,
      sortOrder: q.sortOrder,
      page: Number(q.page) || 1,
      limit: Number(q.limit) || 20,
    });

    return successResponse(res, result, "Doctors fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const doctor = await getDoctorById(params.id as string, {
      canViewBank: canViewBank(req),
    });
    return successResponse(res, doctor, "Doctor fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const doctor = await updateDoctor(params.id as string, body, actorOf(req));
    return successResponse(res, doctor, "Doctor updated successfully");
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const doctor = await updateDoctorStatus(
      params.id as string,
      Boolean(body.isActive)
    );
    return successResponse(res, doctor, "Doctor status updated successfully");
  } catch (error) {
    next(error);
  }
};

/** Archive (soft delete). Referral history is always retained. */
export const archive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body || {};
    const result = await archiveDoctor(params.id as string, {
      reason: body.reason,
      userId: (req as any).user?.id,
    });
    return successResponse(
      res,
      result,
      "Doctor archived. Referral history has been retained."
    );
  } catch (error) {
    next(error);
  }
};

export const restore = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await restoreDoctor(params.id as string, (req as any).user?.id);
    return successResponse(res, result, "Doctor restored successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE is kept for backwards compatibility but always archives.
 * A hard delete is refused whenever history exists.
 */
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await deleteDoctor(params.id as string, (req as any).user?.id);
    return successResponse(res, result, "Doctor archived successfully");
  } catch (error) {
    next(error);
  }
};
export const statistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await getDoctorStatistics(params.id as string);
    return successResponse(res, result, "Doctor statistics fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const commission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const query = (req as any).validated?.query || req.query;
    const result = await getDoctorCommission(
      params.id as string,
      query.startDate ? new Date(query.startDate as string) : undefined,
      query.endDate ? new Date(query.endDate as string) : undefined
    );
    return successResponse(res, result, "Doctor commission fetched successfully");
  } catch (error) {
    next(error);
  }
};

// =======================================================
// 360 VIEW SUB-RESOURCES
// =======================================================

export const referralHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const query = req.query as Record<string, any>;
    const result = await getDoctorReferralHistory(params.id as string, {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      status: query.status as string | undefined,
    });
    return successResponse(res, result, "Referral history fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const ledger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const query = req.query as Record<string, any>;
    const result = await getDoctorLedger(params.id as string, {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 25,
      status: query.status as string | undefined,
      periodKey: query.periodKey as string | undefined,
    });
    return successResponse(res, result, "Commission ledger fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const payouts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await getDoctorPayouts(params.id as string);
    return successResponse(res, result, "Payout history fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const trend = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const months = Number(req.query.months) || 12;
    const result = await getDoctorTrend(params.id as string, months);
    return successResponse(res, { trend: result }, "Trend data fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const documents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await getDoctorDocuments(params.id as string);
    return successResponse(
      res,
      { documents: result },
      "Documents fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const result = await addDoctorDocument(
      params.id as string,
      body,
      (req as any).user?.id
    );
    return createdResponse(res, result, "Document uploaded successfully");
  } catch (error) {
    next(error);
  }
};

export const activity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const result = await getDoctorActivity(
      params.id as string,
      Number(req.query.limit) || 50
    );
    return successResponse(
      res,
      { activity: result },
      "Activity log fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};
// =======================================================
// PAYOUTS
// =======================================================

export const processPayout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    const result = await processDoctorPayout(params.id as string, {
      ...body,
      userId: (req as any).user?.id,
    });
    return successResponse(
      res,
      result,
      "Commission payout settled successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const pendingPayouts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getPendingPayouts({
      periodKey: req.query.periodKey as string | undefined,
    });
    return successResponse(
      res,
      result,
      "Pending payouts fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// ORGANISATIONS & SEARCH
// =======================================================

export const orgList = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await listOrganizations();
    return successResponse(
      res,
      { organizations: result },
      "Organisations fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const orgCreate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    const result = await createOrganization(body);
    return createdResponse(res, result, "Organisation created successfully");
  } catch (error) {
    next(error);
  }
};

export const orgUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    const result = await updateOrganization(req.params.id as string, body);
    return successResponse(res, result, "Organisation updated successfully");
  } catch (error) {
    next(error);
  }
};

/** Dropdown source for "Referred By" in patient / order creation. */
export const search = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await searchDoctorsForReferral(
      req.query.q as string | undefined,
      Number(req.query.limit) || 20
    );
    return successResponse(res, { doctors: result }, "Doctors searched successfully");
  } catch (error) {
    next(error);
  }
};

export const bySpecialization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getDoctorsBySpecialization(
      req.params.specialization as string
    );
    return successResponse(
      res,
      result,
      "Doctors by specialization fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/** Signature / photo upload just updates the stored URL. */
const uploadField = (field: "signatureUrl" | "photoUrl") =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = (req as any).validated?.params || req.params;
      const { [field]: value } = req.body;
      const result = await updateDoctor(params.id as string, { [field]: value });
      return successResponse(
        res,
        result,
        `Doctor ${field} updated successfully`
      );
    } catch (error) {
      next(error);
    }
  };

export const uploadPhoto = uploadField("photoUrl");

export const uploadSignature = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const { signatureUrl, signatureData, mimeType } = req.body;

    let finalUrl = signatureUrl;

    // Check if incoming payload is a base64 image or data URL
    if (signatureData || (signatureUrl && signatureUrl.startsWith("data:image/"))) {
      const dataToSave = signatureData || signatureUrl;
      const uploadRes = await saveSignatureImage(params.id as string, dataToSave, mimeType);
      finalUrl = uploadRes.signatureUrl;
    }

    if (!finalUrl) {
      throw new HttpError("No signature image data or URL provided", 400);
    }

    // Update Doctor record
    const doctor = await updateDoctor(params.id as string, { signatureUrl: finalUrl });

    // Also synchronize to linked User account if present
    if (doctor && (doctor.email || doctor.doctorCode)) {
      await prisma.user.updateMany({
        where: {
          OR: [
            { email: doctor.email || undefined },
            { employeeCode: doctor.doctorCode },
          ],
        },
        data: {
          signature: finalUrl,
        },
      });
    }

    // Generate electronic seal preview
    const sealInfo = await getDoctorSealInfo(params.id as string);

    return successResponse(
      res,
      {
        doctor,
        signatureUrl: finalUrl,
        seal: sealInfo,
      },
      "Doctor signature uploaded and NABL electronic seal generated successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getSeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const sealInfo = await getDoctorSealInfo(params.id as string);

    return successResponse(
      res,
      sealInfo,
      "Doctor electronic seal retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};
