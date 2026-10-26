/**
 * HIP (Health Information Provider) Service
 *
 * Implements ABDM HIP role:
 *  - Patient Care Context Discovery (on-discover callback response)
 *  - Care Context Linking — OTP init & confirm (on-init, on-confirm)
 *  - HIP-initiated Care Context Addition (proactively notify when report is approved)
 */

import crypto from "crypto";
import prisma from "../../../config/database";
import { abdmPost } from "./abdm.gateway.client";
import abdmConfig from "./abdm.config";
import {
  getAbdmCareContextsTable,
  recordAbdmTransaction,
  updateAbdmTransaction,
} from "./abdm.transaction.helper";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AbdmPatientIdentifier {
  type: "MOBILE" | "ABHA-NUMBER" | "MR" | "NDHM_HEALTH_NUMBER";
  value: string;
}

interface DiscoveryRequest {
  requestId: string;
  timestamp: string;
  transactionId: string;
  patient: {
    id: string; // ABHA address
    verifiedIdentifiers: AbdmPatientIdentifier[];
    unverifiedIdentifiers?: AbdmPatientIdentifier[];
    name?: string;
    gender?: string;
    yearOfBirth?: number;
  };
}

interface LinkInitRequest {
  requestId: string;
  timestamp: string;
  transactionId: string;
  patient: {
    id: string; // ABHA address
    careContexts: Array<{ referenceNumber: string }>;
  };
}

interface LinkConfirmRequest {
  requestId: string;
  timestamp: string;
  transactionId: string;
  confirmation: {
    linkRefNumber: string;
    token: string;
  };
}

// In-memory OTP store (for production, use Redis or DB)
const linkOtpStore = new Map<string, { otp: string; patientId: string; careContextRefs: string[]; expiresAt: number }>();

// ─────────────────────────────────────────────────────────────
// 1. Care Context Discovery
// ─────────────────────────────────────────────────────────────

/**
 * Responds to ABDM Gateway's `/v0.5/care-contexts/discover` callback.
 * Matches the patient in LabCore and returns their care contexts (Lab Orders).
 */
export async function handleDiscovery(req: DiscoveryRequest): Promise<void> {
  const { requestId, transactionId, patient } = req;

  // Log incoming request
  await recordAbdmTransaction({
    requestId,
    transactionId,
    action: "CARE_CONTEXT_DISCOVERY",
    status: "CALLBACK_RECEIVED",
    requestData: req as unknown as Record<string, unknown>,
  });

  // ── Match patient ──
  let matchedPatient: any = null;

  const abhaIdentifier = patient.verifiedIdentifiers?.find(
    (i) => i.type === "ABHA-NUMBER" || i.type === "NDHM_HEALTH_NUMBER"
  );
  const mobileIdentifier = patient.verifiedIdentifiers?.find((i) => i.type === "MOBILE");

  if (abhaIdentifier) {
    matchedPatient = await (prisma.patient as any).findFirst({
      where: { abhaNumber: abhaIdentifier.value },
      include: { orders: { where: { status: { in: ["COMPLETED", "PARTIAL"] } }, take: 20 } },
    });
  }

  if (!matchedPatient && mobileIdentifier) {
    matchedPatient = await (prisma.patient as any).findFirst({
      where: { phone: mobileIdentifier.value },
      include: { orders: { where: { status: { in: ["COMPLETED", "PARTIAL"] } }, take: 20 } },
    });
  }

  // ── Build response ──
  const onDiscoverBody = {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    transactionId,
    patient: matchedPatient
      ? {
          referenceNumber: matchedPatient.uhid,
          display: [matchedPatient.firstName, matchedPatient.middleName, matchedPatient.lastName].filter(Boolean).join(" ").trim(),
          careContexts: buildCareContextsFromOrders(matchedPatient.orders ?? []),
          matchedBy: abhaIdentifier ? ["ABHA-NUMBER"] : ["MOBILE"],
        }
      : null,
    error: matchedPatient ? null : { code: 3404, message: "No patient found" },
  };

  await abdmPost("/v0.5/care-contexts/on-discover", onDiscoverBody);
}

// ─────────────────────────────────────────────────────────────
// 2. Care Context Linking — Init (OTP send)
// ─────────────────────────────────────────────────────────────

export async function handleLinkInit(req: LinkInitRequest): Promise<void> {
  const { requestId, transactionId, patient } = req;

  await recordAbdmTransaction({
    requestId,
    transactionId,
    action: "CARE_CONTEXT_LINK_INIT",
    status: "CALLBACK_RECEIVED",
    requestData: req as unknown as Record<string, unknown>,
  });

  // Find LabCore patient by ABHA address
  const matchedPatient = await (prisma.patient as any).findFirst({
    where: {
      OR: [
        { abhaAddress: patient.id },
        { abhaNumber: patient.id },
      ],
    },
  });

  // Generate link OTP
  const linkRefNumber = crypto.randomUUID();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const careContextRefs = patient.careContexts.map((c: { referenceNumber: string }) => c.referenceNumber);

  linkOtpStore.set(linkRefNumber, {
    otp,
    patientId: matchedPatient?.id ?? "",
    careContextRefs,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  // In production: send OTP via SMS to patient's registered mobile
  // For mock/dev: the OTP is 123456 or logged
  if (abdmConfig.mockMode) {
    console.log(`[ABDM Mock] Link OTP for ${linkRefNumber}: ${otp}`);
  }

  const onInitBody = {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    transactionId,
    link: {
      referenceNumber: linkRefNumber,
      authenticator: {
        authType: "DIRECT",
        meta: {
          hint: "OTP has been sent to patient's registered mobile",
          expiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        },
      },
    },
    error: matchedPatient ? null : { code: 3404, message: "Patient not found" },
  };

  await abdmPost("/v0.5/links/link/on-init", onInitBody);
}

// ─────────────────────────────────────────────────────────────
// 3. Care Context Linking — Confirm (OTP verify)
// ─────────────────────────────────────────────────────────────

export async function handleLinkConfirm(req: LinkConfirmRequest): Promise<void> {
  const { requestId, transactionId, confirmation } = req;

  await recordAbdmTransaction({
    requestId,
    transactionId,
    action: "CARE_CONTEXT_LINK_CONFIRM",
    status: "CALLBACK_RECEIVED",
    requestData: req as unknown as Record<string, unknown>,
  });

  const stored = linkOtpStore.get(confirmation.linkRefNumber);
  let error: { code: number; message: string } | null = null;
  let linkedContexts: Array<{ referenceNumber: string; display: string }> = [];

  if (!stored || Date.now() > stored.expiresAt) {
    error = { code: 1017, message: "Link reference expired or not found" };
  } else if (stored.otp !== confirmation.token && !abdmConfig.mockMode) {
    error = { code: 1018, message: "Invalid OTP" };
  } else {
    // Mark care contexts as linked in DB
    if (stored.patientId) {
      const careContextsTable = getAbdmCareContextsTable(prisma);
      for (const ref of stored.careContextRefs) {
        if (careContextsTable) {
          const existing = await careContextsTable.findUnique({
            where: { careContextReference: ref },
          });
          if (existing) {
            await careContextsTable.update({
              where: { careContextReference: ref },
              data: { isLinked: true, linkedAt: new Date(), updatedAt: new Date() },
            });
          } else {
            await careContextsTable.create({
              data: {
                id: crypto.randomUUID(),
                patientId: stored.patientId,
                careContextReference: ref,
                display: `Lab Visit ${ref.slice(-8)}`,
                isLinked: true,
                linkedAt: new Date(),
                hiTypes: ["DiagnosticReport"],
              },
            });
          }
        }
      }
    }
    linkOtpStore.delete(confirmation.linkRefNumber);

    linkedContexts = stored.careContextRefs.map((ref) => ({
      referenceNumber: ref,
      display: `Lab Visit ${ref.slice(-8)}`,
    }));
  }

  const onConfirmBody = {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    transactionId,
    patient: stored?.patientId
      ? {
          referenceNumber: stored.patientId,
          display: "Patient",
          careContexts: linkedContexts,
        }
      : null,
    error,
  };

  await abdmPost("/v0.5/links/link/on-confirm", onConfirmBody);
}

// ─────────────────────────────────────────────────────────────
// 4. HIP-Initiated Care Context Addition
// ─────────────────────────────────────────────────────────────

/**
 * Proactively notifies ABDM Gateway + patient PHR app when a lab report is approved.
 * Called from the report approval workflow.
 */
export async function addCareContextForOrder(
  patientId: string,
  orderId: string,
  orderDisplay: string
): Promise<{ success: boolean; careContextReference: string }> {
  const patient = await (prisma.patient as any).findUnique({
    where: { id: patientId },
    select: { abhaAddress: true, abhaNumber: true, uhid: true, firstName: true, middleName: true, lastName: true },
  });

  if (!patient?.abhaAddress && !patient?.abhaNumber) {
    return { success: false, careContextReference: "" };
  }

  const careContextReference = `${abdmConfig.hipId}-ORDER-${orderId}`;
  const display = orderDisplay || `Lab Report – ${new Date().toLocaleDateString("en-IN")}`;

  // Upsert care context record
  const careContextsTable = getAbdmCareContextsTable(prisma);
  if (careContextsTable) {
    const existing = await careContextsTable.findUnique({
      where: { careContextReference },
    });
    if (existing) {
      await careContextsTable.update({
        where: { careContextReference },
        data: { display, hiTypes: ["DiagnosticReport"], updatedAt: new Date() },
      });
    } else {
      await careContextsTable.create({
        data: {
          id: crypto.randomUUID(),
          patientId,
          careContextReference,
          display,
          orderId,
          hiTypes: ["DiagnosticReport"],
        },
      });
    }
  }

  const requestId = crypto.randomUUID();
  await recordAbdmTransaction({
    requestId,
    action: "CARE_CONTEXT_ADD",
    status: "INITIATED",
    patientId,
    requestData: { orderId, careContextReference },
  });

  // Notify ABDM Gateway
  const addContextsBody = {
    requestId,
    timestamp: new Date().toISOString(),
    link: {
      accessToken: patient.abhaAddress || patient.abhaNumber,
      patient: {
        referenceNumber: patient.uhid,
        display: [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ").trim(),
        careContexts: [{ referenceNumber: careContextReference, display }],
        hiType: "DiagnosticReport",
      },
    },
  };

  const resp = await abdmPost("/v0.5/links/link/add-contexts", addContextsBody);

  await updateAbdmTransaction(requestId, resp.ok ? "SUCCESS" : "FAILED", resp.data as Record<string, unknown>);

  return { success: resp.ok, careContextReference };
}

// ─────────────────────────────────────────────────────────────
// Helper: Build Care Contexts from Orders
// ─────────────────────────────────────────────────────────────

function buildCareContextsFromOrders(
  orders: Array<{ id: string; createdAt: Date; orderNumber?: string }>
): Array<{ referenceNumber: string; display: string }> {
  return orders.map((order) => ({
    referenceNumber: `${abdmConfig.hipId}-ORDER-${order.id}`,
    display: `Lab Visit – ${order.createdAt.toLocaleDateString("en-IN")}${order.orderNumber ? ` (${order.orderNumber})` : ""}`,
  }));
}
