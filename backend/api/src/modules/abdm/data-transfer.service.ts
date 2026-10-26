/**
 * ABDM Health Data Transfer Service
 *
 * Implements the HIP side of health data sharing:
 *  1. Receives data request from ABDM Gateway (/v0.5/health-information/hip/request)
 *  2. Validates the consent for the request
 *  3. Builds HL7 FHIR R4 DiagnosticReport bundles for each requested care context
 *  4. Encrypts bundles using the HIU's public key (ECDH + AES-256-GCM)
 *  5. Pushes encrypted data to the HIU's dataPushUrl
 *  6. Sends acknowledgement to ABDM Gateway (/v0.5/health-information/notify)
 */

import crypto from "crypto";
import prisma from "../../../config/database";
import { abdmPost } from "./abdm.gateway.client";
import abdmConfig from "./abdm.config";
import { buildFhirBundle } from "./fhir.service";
import { generateAbdmKeyPair, encryptForAbdm, AbdmKeyMaterial } from "./crypto.service";
import { validateConsent } from "./consent.service";
import { recordAbdmTransaction, updateAbdmTransaction } from "./abdm.transaction.helper";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface HiRequest {
  requestId: string;
  timestamp: string;
  transactionId: string;
  hiRequest: {
    consent: { id: string };
    dateRange: { from: string; to: string };
    dataPushUrl: string;
    hiTypes: string[];
    keyMaterial: AbdmKeyMaterial;
  };
}

// ─────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────

export async function handleHealthInfoRequest(hiReq: HiRequest): Promise<void> {
  const { requestId, transactionId, hiRequest } = hiReq;

  // Log incoming request
  await recordAbdmTransaction({
    requestId,
    transactionId,
    action: "HEALTH_INFO_REQUEST",
    status: "CALLBACK_RECEIVED",
    requestData: { consentId: hiRequest.consent.id, hiTypes: hiRequest.hiTypes, dateRange: hiRequest.dateRange },
  });

  // ── Step 1: Send acknowledgement (ABDM requires this quickly) ──
  const ackRequestId = crypto.randomUUID();
  await abdmPost("/v0.5/health-information/hip/on-request", {
    requestId: ackRequestId,
    timestamp: new Date().toISOString(),
    hiRequest: { transactionId, sessionStatus: "ACKNOWLEDGED" },
    error: null,
  });

  try {
    // ── Step 2: Validate consent ──
    const consentValidation = await validateConsent(
      hiRequest.consent.id,
      hiRequest.hiTypes,
      hiRequest.dateRange
    );

    if (!consentValidation.valid) {
      await pushTransferResult(
        hiRequest.dataPushUrl,
        transactionId,
        [],
        hiRequest.consent.id
      );
      await notifyGateway(transactionId, hiRequest.consent.id, "FAILED", consentValidation.reason);
      await updateTransactionStatus(requestId, "FAILED", { reason: consentValidation.reason });
      return;
    }

    // ── Step 3: Get consent details to find which care contexts to share ──
    const consent = await (prisma as any).abdmConsent.findUnique({
      where: { consentId: hiRequest.consent.id },
    });

    const patientId = consent?.patientId;

    if (!patientId) {
      throw new Error("Patient ID not found in consent");
    }

    // ── Step 4: Find care contexts in the requested date range ──
    const careContexts = await (prisma as any).abdmCareContext.findMany({
      where: {
        patientId,
        isLinked: true,
        orderId: { not: null },
      },
    });

    // Filter care contexts by date range using associated orders - optimized with single query
    const orderIds = careContexts.map((ctx: any) => ctx.orderId).filter((id: any): id is string => id !== null);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, createdAt: true, orderStatus: true },
    });

    const orderMap = new Map(orders.map(o => [o.id, o]));

    const fromDate = new Date(hiRequest.dateRange.from);
    const toDate = new Date(hiRequest.dateRange.to);

    const inRangeContexts: any[] = [];
    for (const ctx of careContexts) {
      if (ctx.orderId) {
        const order = orderMap.get(ctx.orderId);
        if (order) {
          const orderDate = new Date(order.createdAt);
          if (orderDate >= fromDate && orderDate <= toDate) {
            inRangeContexts.push({ ...ctx, order });
          }
        }
      }
    }

    // ── Step 5: Generate FHIR bundles, encrypt, and collect entries ──
    const { privateKey: ourPrivKey, keyMaterial: ourKeyMaterial } = generateAbdmKeyPair();
    const ourPrivKeyDer = (ourPrivKey as any).export({ type: "pkcs8", format: "der" }) as Buffer;

    const entries: any[] = [];

    for (const ctx of inRangeContexts) {
      if (!ctx.orderId) continue;

      try {
        const fhirBundle = await buildFhirBundle(ctx.orderId);
        const fhirJson = JSON.stringify(fhirBundle);

        if (abdmConfig.mockMode) {
          // In mock mode: skip real encryption, send mock payload
          entries.push({
            content: Buffer.from(fhirJson).toString("base64"),
            media: "application/fhir+json",
            checksum: crypto.createHash("sha256").update(fhirJson).digest("hex"),
            careContextReference: ctx.careContextReference,
          });
        } else {
          const encryptedEntry = encryptForAbdm(
            fhirJson,
            ctx.careContextReference,
            ourPrivKeyDer,
            ourKeyMaterial.nonce,
            hiRequest.keyMaterial
          );
          entries.push(encryptedEntry);
        }
      } catch (err: any) {
        console.error(`[ABDM] Failed to build FHIR for order ${ctx.orderId}:`, err.message);
      }
    }

    // ── Step 6: Push data to HIU ──
    await pushTransferResult(
      hiRequest.dataPushUrl,
      transactionId,
      entries,
      hiRequest.consent.id,
      ourKeyMaterial
    );

    // ── Step 7: Notify ABDM Gateway ──
    await notifyGateway(transactionId, hiRequest.consent.id, "TRANSFERRED");

    await updateTransactionStatus(requestId, "SUCCESS", {
      contextsTransferred: inRangeContexts.length,
      entriesGenerated: entries.length,
    });
  } catch (err: any) {
    console.error("[ABDM] Health info transfer failed:", err.message);
    await updateTransactionStatus(requestId, "FAILED", { error: err.message });
    await notifyGateway(transactionId, hiRequest.consent.id, "FAILED", err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function pushTransferResult(
  dataPushUrl: string,
  transactionId: string,
  entries: any[],
  consentId: string,
  keyMaterial?: AbdmKeyMaterial
): Promise<void> {
  const payload = {
    pageNumber: 1,
    pageCount: 1,
    transactionId,
    entries,
    keyMaterial: keyMaterial ?? null,
  };

  if (abdmConfig.mockMode) {
    console.log(`[ABDM Mock] Would push ${entries.length} entries to: ${dataPushUrl}`);
    return;
  }

  await fetch(dataPushUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function notifyGateway(
  transactionId: string,
  consentId: string,
  sessionStatus: "TRANSFERRED" | "FAILED",
  statusDetail?: string
): Promise<void> {
  const notifyRequestId = crypto.randomUUID();
  await abdmPost("/v0.5/health-information/notify", {
    requestId: notifyRequestId,
    timestamp: new Date().toISOString(),
    notification: {
      consentId,
      transactionId,
      doneAt: new Date().toISOString(),
      notifier: { type: "HIP", id: abdmConfig.hipId },
      statusNotification: {
        sessionStatus,
        hipId: abdmConfig.hipId,
        statusResponses: [{ careContextReference: "all", hiStatus: sessionStatus, description: statusDetail ?? "" }],
      },
    },
  });
}

async function updateTransactionStatus(
  requestId: string,
  status: string,
  responseData: Record<string, unknown>
): Promise<void> {
  await updateAbdmTransaction(requestId, status, responseData);
}
