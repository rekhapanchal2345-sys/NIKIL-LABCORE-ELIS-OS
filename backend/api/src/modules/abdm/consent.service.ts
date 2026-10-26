/**
 * ABDM Consent Service
 *
 * Handles:
 *  - Consent notification from ABDM Gateway (HIP notify)
 *  - Consent artefact storage and status management
 *  - Consent validation for health data requests
 */

import crypto from "crypto";
import prisma from "../../../config/database";
import { abdmPost } from "./abdm.gateway.client";
import {
  getAbdmConsentsTable,
  recordAbdmTransaction,
  updateAbdmTransaction,
} from "./abdm.transaction.helper";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ConsentNotification {
  requestId: string;
  timestamp: string;
  notification: {
    consentId: string;
    status: "GRANTED" | "DENIED" | "EXPIRED" | "REVOKED";
    consentDetail?: {
      consentId: string;
      createdAt: string;
      purpose: { code: string; text: string };
      patient: { id: string }; // ABHA address
      hip: { id: string };
      hiTypes: string[];
      permission: {
        accessMode: string;
        dateRange: { from: string; to: string };
        dataEraseAt: string;
        frequency: { unit: string; value: number; repeats: number };
      };
      consentManager: { id: string };
    };
    signature?: string;
  };
}

// ─────────────────────────────────────────────────────────────
// 1. Handle HIP Consent Notification
// ─────────────────────────────────────────────────────────────

/**
 * Processes incoming consent notification from ABDM Gateway.
 * Called by: POST /v0.5/consents/hip/notify
 */
export async function handleConsentNotification(
  notification: ConsentNotification
): Promise<void> {
  const { requestId, notification: consentNotif } = notification;

  // Log the transaction
  await recordAbdmTransaction({
    requestId,
    action: "CONSENT_NOTIFY",
    status: "CALLBACK_RECEIVED",
    requestData: notification as unknown as Record<string, unknown>,
  });

  const { consentId, status, consentDetail } = consentNotif;

  // Find associated patient by ABHA address
  let patientId: string | undefined;
  if (consentDetail?.patient?.id) {
    const patient = await (prisma.patient as any).findFirst({
      where: {
        OR: [
          { abhaAddress: consentDetail.patient.id },
          { abhaNumber: consentDetail.patient.id },
        ],
      },
    });
    patientId = patient?.id;
  }

  // Upsert consent record
  const consentsTable = getAbdmConsentsTable(prisma);
  if (consentsTable) {
    const existing = await consentsTable.findUnique({
      where: { consentId },
    });
    if (existing) {
      await consentsTable.update({
        where: { consentId },
        data: {
          status,
          consentDetail: consentDetail as unknown as Record<string, unknown>,
          updatedAt: new Date(),
          ...(consentDetail?.permission?.dateRange
            ? {
                dateFrom: new Date(consentDetail.permission.dateRange.from),
                dateTo: new Date(consentDetail.permission.dateRange.to),
              }
            : {}),
          ...(consentDetail?.permission?.dataEraseAt
            ? { expiryDate: new Date(consentDetail.permission.dataEraseAt) }
            : {}),
        },
      });
    } else {
      await consentsTable.create({
        data: {
          id: crypto.randomUUID(),
          consentId,
          patientId: patientId ?? "UNKNOWN",
          status,
          hiTypes: consentDetail?.hiTypes ?? [],
          purpose: consentDetail?.purpose?.code,
          consentDetail: consentDetail as unknown as Record<string, unknown>,
          dateFrom: consentDetail?.permission?.dateRange?.from
            ? new Date(consentDetail.permission.dateRange.from)
            : undefined,
          dateTo: consentDetail?.permission?.dateRange?.to
            ? new Date(consentDetail.permission.dateRange.to)
            : undefined,
          expiryDate: consentDetail?.permission?.dataEraseAt
            ? new Date(consentDetail.permission.dataEraseAt)
            : undefined,
        },
      });
    }
  }

  // Acknowledge back to ABDM Gateway
  const ackRequestId = crypto.randomUUID();
  await abdmPost("/v0.5/consents/hip/on-notify", {
    requestId: ackRequestId,
    timestamp: new Date().toISOString(),
    acknowledgement: {
      status: "OK",
      consentId,
    },
    error: null,
  });

  await updateAbdmTransaction(requestId, "SUCCESS");
}

// ─────────────────────────────────────────────────────────────
// 2. Validate Consent for Data Request
// ─────────────────────────────────────────────────────────────

/**
 * Validates whether a health data request is backed by a valid, unexpired, granted consent.
 */
export async function validateConsent(
  consentId: string,
  requestedHiTypes: string[],
  requestedDateRange: { from: string; to: string }
): Promise<{ valid: boolean; reason?: string }> {
  const consentsTable = getAbdmConsentsTable(prisma);
  if (!consentsTable) {
    return { valid: false, reason: "Consent table not available" };
  }

  const consent = await consentsTable.findUnique({
    where: { consentId },
  });

  if (!consent) {
    return { valid: false, reason: "Consent artefact not found" };
  }

  if (consent.status !== "GRANTED") {
    return { valid: false, reason: `Consent status is ${consent.status}` };
  }

  if (consent.expiryDate && new Date() > new Date(consent.expiryDate)) {
    // Mark as expired
    await consentsTable.update({
      where: { id: consent.id },
      data: { status: "EXPIRED" },
    });
    return { valid: false, reason: "Consent has expired" };
  }

  // Validate HI types
  const consentHiTypes: string[] = consent.hiTypes ?? [];
  const unauthorisedTypes = requestedHiTypes.filter(
    (t) => !consentHiTypes.includes(t)
  );
  if (unauthorisedTypes.length > 0) {
    return {
      valid: false,
      reason: `Requested HI types not covered: ${unauthorisedTypes.join(", ")}`,
    };
  }

  // Validate date range
  if (consent.dateFrom && consent.dateTo) {
    const reqFrom = new Date(requestedDateRange.from);
    const reqTo = new Date(requestedDateRange.to);
    const consentFrom = new Date(consent.dateFrom);
    const consentTo = new Date(consent.dateTo);

    if (reqFrom < consentFrom || reqTo > consentTo) {
      return {
        valid: false,
        reason: "Requested date range falls outside consented date range",
      };
    }
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 3. Get All Consents for a Patient
// ─────────────────────────────────────────────────────────────

export async function getPatientConsents(patientId: string) {
  const consentsTable = getAbdmConsentsTable(prisma);
  if (!consentsTable) return [];
  return consentsTable.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });
}
