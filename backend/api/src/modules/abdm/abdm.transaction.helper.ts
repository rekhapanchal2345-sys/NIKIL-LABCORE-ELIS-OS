/**
 * ABDM Transaction & Model Access Helper
 * Resolves snake_case Prisma client bindings (abdm_transactions, abdm_care_contexts, abdm_consents)
 * and guarantees primary key IDs (UUIDv4) upon creation.
 */

import crypto from "crypto";
import defaultPrisma from "../../../config/database";

export function getAbdmTransactionsTable(prisma: any = defaultPrisma) {
  return prisma.abdm_transactions || prisma.abdmTransaction || prisma.abdm_transaction;
}

export function getAbdmCareContextsTable(prisma: any = defaultPrisma) {
  return prisma.abdm_care_contexts || prisma.abdmCareContext || prisma.abdm_care_context;
}

export function getAbdmConsentsTable(prisma: any = defaultPrisma) {
  return prisma.abdm_consents || prisma.abdmConsent || prisma.abdm_consent;
}

export async function recordAbdmTransaction(
  data: {
    requestId?: string;
    action: string;
    status?: string;
    patientId?: string | null;
    requestData?: Record<string, unknown>;
    transactionId?: string;
    apiEndpoint?: string;
  },
  prisma: any = defaultPrisma
): Promise<string> {
  const requestId = data.requestId || crypto.randomUUID();
  const table = getAbdmTransactionsTable(prisma);
  if (table) {
    try {
      await table.create({
        data: {
          id: crypto.randomUUID(),
          requestId,
          action: data.action,
          status: data.status || "INITIATED",
          patientId: data.patientId ?? undefined,
          transactionId: data.transactionId,
          apiEndpoint: data.apiEndpoint,
          requestData: data.requestData as any,
        },
      });
    } catch (err) {
      console.warn("[abdm.transaction.helper] Non-blocking transaction log write failure:", err);
    }
  }
  return requestId;
}

export async function updateAbdmTransaction(
  requestId: string,
  status: string,
  responseData?: Record<string, unknown>,
  error?: string,
  prisma: any = defaultPrisma
): Promise<void> {
  const table = getAbdmTransactionsTable(prisma);
  if (table) {
    try {
      await table.updateMany({
        where: { requestId },
        data: {
          status,
          responseData: responseData as any,
          error: error || null,
          updatedAt: new Date(),
        },
      });
    } catch (err) {
      console.warn("[abdm.transaction.helper] Non-blocking transaction update failure:", err);
    }
  }
}
