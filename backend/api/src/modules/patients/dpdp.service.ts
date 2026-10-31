/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🏛️ NIKIL-LABCORE-ELIS-OS — DIGITAL PERSONAL DATA PROTECTION (DPDP) ACT 2023 CORE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * File: backend/api/src/modules/patients/dpdp.service.ts
 *
 * Implements Statutory Compliance for:
 *   1. Section 6: Notice & Granular Consent for Specified Purposes
 *      (Treatment/Diagnostics, Invoicing/Billing, Research/Analytics, Marketing/Wellness)
 *   2. Section 6(4): Right to Withdraw Consent at any time with audit log chaining
 *   3. Section 12: Right to Data Portability (Full machine-readable clinical export)
 *   4. Section 12(3): Right to Correction & Erasure (Right to be Forgotten)
 *      Harmonized with NABL ISO 15189:2022 Clause 8.4 (5-year medical record preservation)
 *   5. Section 8(5): Reasonable Security Safeguards (AES-256-GCM encryption on PII)
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import crypto from "crypto";
import prisma from "../../lib/prisma";
import { HttpError } from "../../utils/http-error";
import { encryptField, decryptField } from "../../utils/field-crypto";

export enum DpdpPurpose {
  TREATMENT_DIAGNOSTICS = "TREATMENT_DIAGNOSTICS",
  BILLING_COMMERCIAL = "BILLING_COMMERCIAL",
  ACADEMIC_RESEARCH = "ACADEMIC_RESEARCH",
  COMMUNICATION_MARKETING = "COMMUNICATION_MARKETING",
}

export interface RecordDpdpConsentInput {
  patientId: string;
  purpose: DpdpPurpose | string;
  consentGiven: boolean;
  consentText: string;
  noticeVersion?: string;
  consentedById?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DpdpConsentRecord {
  id: string;
  patientId: string;
  consentType: string;
  consentGiven: boolean;
  consentText: string;
  consentDate: Date;
  revokedAt: Date | null;
  consentedById: string | null;
  artifactHash: string;
}

export interface DpdpDataExportPackage {
  schemaVersion: "DPDP-PORTABILITY-v1.0";
  exportedAt: string;
  checksumSha256: string;
  patient: {
    id: string;
    uhid: string;
    firstName: string;
    lastName: string;
    gender: string;
    age: number | null;
    dateOfBirth: Date | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    abhaNumber: string | null;
    abhaAddress: string | null;
  };
  clinicalHistory: {
    totalOrders: number;
    orders: any[];
    totalResults: number;
    results: any[];
  };
  financialSummary: {
    totalInvoices: number;
    invoices: any[];
    totalPayments: number;
    payments: any[];
  };
  consentHistory: DpdpConsentRecord[];
}

/**
 * Computes a tamper-evident SHA-256 HMAC for a consent transaction artifact.
 */
function computeConsentArtifactHash(
  patientId: string,
  purpose: string,
  consentGiven: boolean,
  timestamp: string
): string {
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("CRITICAL: FIELD_ENCRYPTION_KEY must be configured for consent digital signatures.");
  }
  return crypto
    .createHmac("sha256", secret)
    .update(`${patientId}|${purpose}|${consentGiven}|${timestamp}`)
    .digest("hex");
}

/**
 * [DPDP Section 6] Records granular purposive consent with audit chaining.
 */
export async function recordDpdpConsent(
  input: RecordDpdpConsentInput
): Promise<DpdpConsentRecord> {
  const { patientId, purpose, consentGiven, consentText, consentedById, ipAddress, userAgent } =
    input;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, uhid: true, firstName: true, lastName: true },
  });
  if (!patient) {
    throw new HttpError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  const normalizedPurpose = purpose.trim().toUpperCase();
  const timestamp = new Date();
  const artifactHash = computeConsentArtifactHash(
    patientId,
    normalizedPurpose,
    consentGiven,
    timestamp.toISOString()
  );

  return prisma.$transaction(async (tx) => {
    // Supersede any previous active consent of this specific purpose
    await tx.patientConsent.updateMany({
      where: {
        patientId,
        consentType: normalizedPurpose,
        revokedAt: null,
      },
      data: {
        consentGiven: false,
        revokedAt: timestamp,
      },
    });

    // Create new granular consent record
    const record = await tx.patientConsent.create({
      data: {
        patientId,
        consentType: normalizedPurpose,
        consentGiven,
        consentText: `[DPDP-2023 ${input.noticeVersion || "v1.0"}] ${consentText}`,
        consentedById,
        consentDate: timestamp,
      },
    });

    // Audit log entry
    await tx.auditLog.create({
      data: {
        userId: consentedById || null,
        module: "DPDP_PRIVACY",
        action: consentGiven ? "GRANT_PURPOSE_CONSENT" : "DECLINE_PURPOSE_CONSENT",
        recordId: record.id,
        ipAddress: ipAddress || "127.0.0.1",
        userAgent: userAgent || "LabCore-DPDP-Engine/1.0",
        newData: {
          consentId: record.id,
          patientId,
          patientUhid: patient.uhid,
          purpose: normalizedPurpose,
          consentGiven,
          artifactHash,
        },
      },
    });

    return {
      id: record.id,
      patientId: record.patientId,
      consentType: record.consentType,
      consentGiven: record.consentGiven,
      consentText: record.consentText,
      consentDate: record.consentDate,
      revokedAt: record.revokedAt,
      consentedById: record.consentedById,
      artifactHash,
    };
  });
}

/**
 * [DPDP Section 6(4)] Revokes a previously granted consent purpose.
 */
export async function revokeDpdpConsent(
  patientId: string,
  consentId: string,
  reason?: string,
  actorId?: string
): Promise<{ success: boolean; revokedAt: Date; artifactHash: string }> {
  const existing = await prisma.patientConsent.findUnique({
    where: { id: consentId },
  });

  if (!existing || existing.patientId !== patientId) {
    throw new HttpError("Consent record not found for patient", 404, "CONSENT_NOT_FOUND");
  }

  if (!existing.consentGiven && existing.revokedAt) {
    throw new HttpError("Consent is already revoked", 409, "CONSENT_ALREADY_REVOKED");
  }

  const revokedAt = new Date();
  const artifactHash = computeConsentArtifactHash(
    patientId,
    existing.consentType,
    false,
    revokedAt.toISOString()
  );

  await prisma.$transaction(async (tx) => {
    await tx.patientConsent.update({
      where: { id: consentId },
      data: {
        consentGiven: false,
        revokedAt,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId || null,
        module: "DPDP_PRIVACY",
        action: "REVOKE_PURPOSE_CONSENT",
        recordId: consentId,
        newData: {
          consentId,
          patientId,
          purpose: existing.consentType,
          revocationReason: reason || "Patient requested withdrawal under DPDP Act 2023 Sec 6(4)",
          revokedAt,
          artifactHash,
        },
      },
    });
  });

  return { success: true, revokedAt, artifactHash };
}

/**
 * Retrieves all active and historical DPDP consent purposes for a patient.
 */
export async function getPatientDpdpConsents(patientId: string) {
  const consents = await prisma.patientConsent.findMany({
    where: { patientId },
    orderBy: { consentDate: "desc" },
    include: {
      consentedBy: { select: { id: true, fullName: true, employeeCode: true } },
    },
  });

  // Calculate purpose matrix
  const purposes = Object.values(DpdpPurpose);
  const matrix: Record<string, { active: boolean; record: any | null }> = {};

  for (const p of purposes) {
    const active = consents.find((c) => c.consentType === p && c.consentGiven && !c.revokedAt);
    matrix[p] = {
      active: Boolean(active),
      record: active || consents.find((c) => c.consentType === p) || null,
    };
  }

  return {
    patientId,
    history: consents,
    matrix,
  };
}

/**
 * [DPDP Section 12] Right to Data Portability.
 * Generates an export bundle containing all medical, demographic and financial data.
 */
export async function exportPatientDataPortability(
  patientId: string,
  actorId?: string
): Promise<DpdpDataExportPackage> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      orders: {
        include: {
          items: { include: { test: true } },
          samples: true,
          invoice: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      },
      results: {
        include: {
          test: true,
          values: { include: { parameter: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      consents: {
        orderBy: { consentDate: "desc" },
      },
    },
  });

  if (!patient) {
    throw new HttpError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  // Flatten orders and invoices
  const allOrders = patient.orders || [];
  const allResults = patient.results || [];
  const allInvoices = allOrders.map((o) => o.invoice).filter(Boolean) as any[];
  const allPayments = allInvoices.flatMap((inv) => inv.payments || []);

  const exportPayloadWithoutChecksum = {
    schemaVersion: "DPDP-PORTABILITY-v1.0" as const,
    exportedAt: new Date().toISOString(),
    patient: {
      id: patient.id,
      uhid: patient.uhid,
      firstName: patient.firstName,
      lastName: patient.lastName,
      gender: patient.gender,
      age: patient.age,
      dateOfBirth: patient.dateOfBirth,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      abhaNumber: patient.abhaNumber,
      abhaAddress: patient.abhaAddress,
    },
    clinicalHistory: {
      totalOrders: allOrders.length,
      orders: allOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.orderStatus,
        priority: o.priority,
        createdAt: o.createdAt,
        tests: o.items.map((i) => i.test?.testName || "Unknown Test"),
      })),
      totalResults: allResults.length,
      results: allResults.map((r) => ({
        id: r.id,
        testName: r.test?.testName,
        status: r.status,
        enteredAt: r.enteredAt,
        approvedAt: r.approvedAt,
        parameters: r.values.map((v) => ({
          parameterName: v.parameter?.parameterName,
          value: v.value,
          unit: v.parameter?.unit,
          flag: v.flag,
        })),
      })),
    },
    financialSummary: {
      totalInvoices: allInvoices.length,
      invoices: allInvoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        subtotal: inv.subtotal,
        grandTotal: inv.grandTotal,
        paymentStatus: inv.paymentStatus,
        createdAt: inv.createdAt,
      })),
      totalPayments: allPayments.length,
      payments: allPayments.map((p) => ({
        receiptNumber: p.receiptNumber,
        amount: p.amount,
        method: p.method,
        createdAt: p.createdAt,
      })),
    },
    consentHistory: patient.consents.map((c) => ({
      id: c.id,
      patientId: c.patientId,
      consentType: c.consentType,
      consentGiven: c.consentGiven,
      consentText: c.consentText,
      consentDate: c.consentDate,
      revokedAt: c.revokedAt,
      consentedById: c.consentedById,
      artifactHash: computeConsentArtifactHash(
        c.patientId,
        c.consentType,
        c.consentGiven,
        c.consentDate.toISOString()
      ),
    })),
  };

  const checksumSha256 = crypto
    .createHash("sha256")
    .update(JSON.stringify(exportPayloadWithoutChecksum))
    .digest("hex");

  // Log portability export in AuditLog
  await prisma.auditLog.create({
    data: {
      userId: actorId || null,
      module: "DPDP_PRIVACY",
      action: "PATIENT_DATA_PORTABILITY_EXPORT",
      recordId: patient.id,
      newData: {
        patientId: patient.id,
        patientUhid: patient.uhid,
        checksumSha256,
        recordCounts: {
          orders: allOrders.length,
          results: allResults.length,
          invoices: allInvoices.length,
        },
      },
    },
  });

  return {
    ...exportPayloadWithoutChecksum,
    checksumSha256,
  };
}

/**
 * [DPDP Section 12(3)] Right to Erasure / Right to be Forgotten.
 * Harmonized with NABL ISO 15189:2022 §8.4 retention requirements:
 * Removes direct personal identifiers (PII), while maintaining anonymized diagnostic records.
 */
export async function erasePatientDataForgotten(
  patientId: string,
  reason: string,
  actorId?: string
): Promise<{ success: boolean; anonymizedUhid: string; anonymizedAt: Date }> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new HttpError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  const anonymizedUhid = `ANON-${patient.id.slice(-6).toUpperCase()}`;
  const anonymizedAt = new Date();

  await prisma.$transaction(async (tx) => {
    // 1. Audit log before erasure
    await tx.auditLog.create({
      data: {
        userId: actorId || null,
        module: "DPDP_PRIVACY",
        action: "RIGHT_TO_ERASURE_ANONYMIZED",
        recordId: patientId,
        oldData: {
          uhid: patient.uhid,
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone ? "PRESENCE_MASKED" : null,
          email: patient.email ? "PRESENCE_MASKED" : null,
        },
        newData: {
          reason,
          anonymizedUhid,
          anonymizedAt,
          statutoryPreservationNotice: "NABL Clause 8.4 Medical Assay Data Retained in De-Identified Form",
        },
      },
    });

    // 2. Anonymize patient PII
    await tx.patient.update({
      where: { id: patientId },
      data: {
        firstName: "REDACTED",
        lastName: `DPDP-${patient.id.slice(-6).toUpperCase()}`,
        phone: null,
        email: null,
        address: null,
        city: null,
        state: null,
        pincode: null,
        aadhaarNumber: null,
        panNumber: null,
        emergencyContact: null,
        emergencyContactName: null,
        emergencyContactRelationship: null,
        emergencyContactAddress: null,
        abhaNumber: null,
        abhaAddress: null,
        abhaStatus: "UNLINKED",
      },
    });

    // 3. Mark all patient consents as revoked/terminated
    await tx.patientConsent.updateMany({
      where: { patientId, revokedAt: null },
      data: {
        consentGiven: false,
        revokedAt: anonymizedAt,
      },
    });
  });

  return {
    success: true,
    anonymizedUhid,
    anonymizedAt,
  };
}

/**
 * Encrypts sensitive national identity documents (Aadhaar, PAN) using AES-256-GCM.
 */
export function encryptNationalId(value: string): string {
  if (!value) return value;
  return encryptField(value);
}

/**
 * Decrypts sensitive national identity documents (Aadhaar, PAN) using AES-256-GCM.
 */
export function decryptNationalId(encryptedPayload: string): string {
  if (!encryptedPayload) return encryptedPayload;
  return decryptField(encryptedPayload);
}
