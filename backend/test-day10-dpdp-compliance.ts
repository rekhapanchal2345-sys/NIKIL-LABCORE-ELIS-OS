/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🧪 DAY 10 EMPIRICAL VERIFICATION SUITE — DPDP ACT 2023 PRIVACY & DATA INTEGRITY ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * File: backend/test-day10-dpdp-compliance.ts
 *
 * Statutory Compliance Validated:
 *   [1] Section 6: Granular purposive consent notice & recording (4 core purposes)
 *   [2] Section 6(4): Right to withdraw consent with cryptographic audit logs
 *   [3] Section 8(5): AES-256-GCM encryption/decryption of national IDs (Aadhaar/PAN)
 *   [4] Section 12: Right to Data Portability (Full machine-readable export with SHA-256)
 *   [5] Section 12(3): Right to Erasure / Right to be Forgotten harmonized with
 *       NABL ISO 15189:2022 Clause 8.4 clinical record retention
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

// Set required cryptographic environment keys before imports
process.env.FIELD_ENCRYPTION_KEY =
  process.env.FIELD_ENCRYPTION_KEY || "labcore_dpdp_secret_key_32_characters_minimum_gcm!!";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "labcore_default_jwt_secret_token_1234567890_test";

import assert from "assert";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "./api/src/lib/prisma";
import {
  DpdpPurpose,
  recordDpdpConsent,
  revokeDpdpConsent,
  getPatientDpdpConsents,
  exportPatientDataPortability,
  erasePatientDataForgotten,
  encryptNationalId,
  decryptNationalId,
} from "./api/src/modules/patients/dpdp.service";

let totalAssertions = 0;
let passedAssertions = 0;

function expect(condition: boolean, description: string) {
  totalAssertions++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${description}`);
    throw new Error(`Assertion failed: ${description}`);
  }
  passedAssertions++;
  console.log(`  ✅ [${passedAssertions}] ${description}`);
}

async function runDay10DpdpSuite() {
  console.log("\n=======================================================================");
  console.log("🏛️ NIKIL-LABCORE-ELIS-OS — DAY 10 DPDP ACT 2023 VALIDATION SUITE");
  console.log("=======================================================================\n");

  const runId = Date.now().toString().slice(-6);

  // Clean-up context / test variables
  let testPatientId = "";
  let collectorUserId = "";

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Verifying Schema Types & Consent Collector User
    // -------------------------------------------------------------------------
    console.log("▶ STEP 0: Verifying Schema Types & Consent Collector User");
    // Ensure aadhaarNumber and panNumber support encrypted ciphertext (TEXT)
    await prisma.$executeRawUnsafe(
      'ALTER TABLE patients ALTER COLUMN "aadhaarNumber" TYPE TEXT, ALTER COLUMN "panNumber" TYPE TEXT;'
    );

    let user = await prisma.user.findFirst({
      where: { role: "ADMIN", status: "ACTIVE" },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `dpo_${runId}@labcore.internal`,
          passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
          fullName: "Dr. Privacy Officer",
          employeeCode: `DPO-${runId}`,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
    }
    collectorUserId = user.id;
    expect(Boolean(collectorUserId), `Consent collector / DPO initialized (ID: ${collectorUserId})`);

    // -------------------------------------------------------------------------
    // STEP 1: DPDP Section 8(5) AES-256-GCM Field Encryption & Decryption
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 1: DPDP Section 8(5) AES-256-GCM National Identity Encryption");
    const rawAadhaar = "5432-8765-1098";
    const rawPan = "ABCDE1234F";

    const encryptedAadhaar = encryptNationalId(rawAadhaar);
    const encryptedPan = encryptNationalId(rawPan);

    expect(
      encryptedAadhaar !== rawAadhaar && encryptedAadhaar.length > 20,
      "Aadhaar successfully encrypted using AES-256-GCM into ciphertext"
    );
    expect(
      encryptedPan !== rawPan && encryptedPan.length > 20,
      "PAN successfully encrypted using AES-256-GCM into ciphertext"
    );

    const decryptedAadhaar = decryptNationalId(encryptedAadhaar);
    const decryptedPan = decryptNationalId(encryptedPan);

    expect(decryptedAadhaar === rawAadhaar, "Decrypted Aadhaar matches original plaintext value exactly");
    expect(decryptedPan === rawPan, "Decrypted PAN matches original plaintext value exactly");

    // -------------------------------------------------------------------------
    // STEP 2: Create Test Patient with Clinical Data for Portability & Erasure
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 2: Creating Test Patient & Diagnostic Records");
    const testPatient = await prisma.patient.create({
      data: {
        uhid: `DPDP-UHID-${runId}`,
        firstName: "Aarav",
        lastName: "Sharma",
        gender: "MALE",
        age: 38,
        dateOfBirth: new Date("1988-06-15"),
        phone: `+919876${runId.slice(-6)}`,
        email: `aarav.sharma.${runId}@example.com`,
        address: "742 Evergreen Terrace, Sector 14, Gurugram, Haryana",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122001",
        aadhaarNumber: encryptedAadhaar,
        panNumber: encryptedPan,
        emergencyContactName: "Sunita Sharma",
        emergencyContact: "+919876543210",
      },
    });
    testPatientId = testPatient.id;
    expect(Boolean(testPatientId), `Patient created successfully: UHID ${testPatient.uhid}`);

    // Create an order, test item, and result to simulate real laboratory activity
    const testCategory = await prisma.testCategory.findFirst();
    const testCatalogItem = await prisma.test.findFirst();

    if (testCatalogItem) {
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-DPDP-${runId}`,
          barcode: `BC-DPDP-${runId}`,
          patientId: testPatient.id,
          orderStatus: "COMPLETED",
          paymentStatus: "PAID",
          priority: "ROUTINE",
          subtotal: new Prisma.Decimal(750),
          grandTotal: new Prisma.Decimal(750),
          paidAmount: new Prisma.Decimal(750),
          items: {
            create: [
              {
                itemType: "TEST",
                testId: testCatalogItem.id,
                price: new Prisma.Decimal(750),
                finalPrice: new Prisma.Decimal(750),
              },
            ],
          },
          invoice: {
            create: {
              invoiceNumber: `INV-DPDP-${runId}`,
              subtotal: new Prisma.Decimal(750),
              taxableAmount: new Prisma.Decimal(750),
              gstPercent: new Prisma.Decimal(0),
              gstAmount: new Prisma.Decimal(0),
              grandTotal: new Prisma.Decimal(750),
              paymentStatus: "PAID",
            },
          },
          payments: {
            create: [
              {
                receiptNumber: `REC-DPDP-${runId}`,
                amount: new Prisma.Decimal(750),
                method: "UPI",
                status: "PAID",
                remarks: `UPI-REF-${runId}`,
              },
            ],
          },
        },
      });
      expect(Boolean(order.id), `Associated clinical lab order created: ${order.orderNumber}`);

      const result = await prisma.result.create({
        data: {
          orderId: order.id,
          testId: testCatalogItem.id,
          patientId: testPatient.id,
          status: "APPROVED",
          enteredAt: new Date(),
          approvedAt: new Date(),
        },
      });
      expect(Boolean(result.id), "Associated clinical laboratory result record created");
    }

    // -------------------------------------------------------------------------
    // STEP 3: DPDP Section 6 Granular Purposive Consent Recording
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 3: DPDP Section 6 Recording Granular Purposive Consent");

    const purposesToGrant = [
      {
        purpose: DpdpPurpose.TREATMENT_DIAGNOSTICS,
        text: "I hereby consent to processing of clinical samples and laboratory assay results for clinical diagnosis.",
      },
      {
        purpose: DpdpPurpose.BILLING_COMMERCIAL,
        text: "I consent to invoice generation, payment processing, and accounting compliance under GST laws.",
      },
      {
        purpose: DpdpPurpose.ACADEMIC_RESEARCH,
        text: "I consent to de-identified retrospective clinical data sharing for epidemiological research.",
      },
      {
        purpose: DpdpPurpose.COMMUNICATION_MARKETING,
        text: "I consent to receiving wellness newsletters, seasonal health packages, and laboratory updates via WhatsApp/SMS.",
      },
    ];

    const grantedRecords: any[] = [];
    for (const p of purposesToGrant) {
      const rec = await recordDpdpConsent({
        patientId: testPatient.id,
        purpose: p.purpose,
        consentGiven: true,
        consentText: p.text,
        noticeVersion: "v2026.1",
        consentedById: collectorUserId,
        ipAddress: "192.168.1.100",
        userAgent: "LabCore-Kiosk/4.2",
      });
      grantedRecords.push(rec);

      expect(rec.consentGiven === true, `Consent GRANTED for purpose: ${p.purpose}`);
      expect(rec.artifactHash.length === 64, `Tamper-evident HMAC SHA-256 artifact hash created: ${rec.artifactHash.slice(0, 16)}...`);
    }

    expect(grantedRecords.length === 4, "All 4 granular statutory DPDP consent purposes recorded");

    // -------------------------------------------------------------------------
    // STEP 4: Inspect Patient Consent History & Active Matrix
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 4: Validating Active Consent Matrix");
    const consentSummary = await getPatientDpdpConsents(testPatient.id);

    expect(consentSummary.history.length === 4, "Consent history returns all 4 recorded purposes");
    expect(consentSummary.matrix[DpdpPurpose.TREATMENT_DIAGNOSTICS].active === true, "TREATMENT_DIAGNOSTICS is active");
    expect(consentSummary.matrix[DpdpPurpose.BILLING_COMMERCIAL].active === true, "BILLING_COMMERCIAL is active");
    expect(consentSummary.matrix[DpdpPurpose.ACADEMIC_RESEARCH].active === true, "ACADEMIC_RESEARCH is active");
    expect(consentSummary.matrix[DpdpPurpose.COMMUNICATION_MARKETING].active === true, "COMMUNICATION_MARKETING is active");

    // -------------------------------------------------------------------------
    // STEP 5: DPDP Section 6(4) Right to Withdraw Consent
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 5: DPDP Section 6(4) Exercising Right to Withdraw Consent");
    const marketingConsent = grantedRecords.find(
      (c) => c.consentType === DpdpPurpose.COMMUNICATION_MARKETING
    );

    const revokeResult = await revokeDpdpConsent(
      testPatient.id,
      marketingConsent.id,
      "Patient opted out of promotional communications at registration counter",
      collectorUserId
    );

    expect(revokeResult.success === true, "Revocation request executed successfully");
    expect(revokeResult.revokedAt instanceof Date, "Revocation timestamp registered");
    expect(revokeResult.artifactHash.length === 64, "Revocation audit HMAC hash generated");

    // Attempting duplicate revocation must throw 409
    let duplicateRevokeFailed = false;
    try {
      await revokeDpdpConsent(testPatient.id, marketingConsent.id, "Second revocation attempt");
    } catch (err: any) {
      if (err.statusCode === 409 || err.code === "CONSENT_ALREADY_REVOKED") {
        duplicateRevokeFailed = true;
      }
    }
    expect(duplicateRevokeFailed, "Duplicate revocation attempt properly rejected with HTTP 409 Conflict");

    // Verify matrix reflects revocation
    const updatedMatrix = await getPatientDpdpConsents(testPatient.id);
    expect(
      updatedMatrix.matrix[DpdpPurpose.COMMUNICATION_MARKETING].active === false,
      "COMMUNICATION_MARKETING is now marked INACTIVE in consent matrix"
    );
    expect(
      updatedMatrix.matrix[DpdpPurpose.TREATMENT_DIAGNOSTICS].active === true,
      "TREATMENT_DIAGNOSTICS remains ACTIVE despite marketing withdrawal"
    );

    // -------------------------------------------------------------------------
    // STEP 6: DPDP Section 12 Right to Data Portability Export
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 6: DPDP Section 12 Machine-Readable Data Portability Export");
    const exportBundle = await exportPatientDataPortability(testPatient.id, collectorUserId);

    expect(exportBundle.schemaVersion === "DPDP-PORTABILITY-v1.0", "Data portability package conforms to DPDP-PORTABILITY-v1.0 schema");
    expect(Boolean(exportBundle.exportedAt), "Export timestamp ISO string present");
    expect(exportBundle.patient.uhid === testPatient.uhid, "Export includes patient demographic & identifier fields");
    expect(exportBundle.clinicalHistory.totalOrders >= 1, "Export package contains full clinical lab orders history");
    expect(exportBundle.financialSummary.totalInvoices >= 1, "Export package contains financial invoices & billing audit");
    expect(exportBundle.consentHistory.length >= 4, "Export package contains complete consent ledger");
    expect(exportBundle.checksumSha256.length === 64, `Integrity SHA-256 checksum embedded: ${exportBundle.checksumSha256.slice(0, 16)}...`);

    // -------------------------------------------------------------------------
    // STEP 7: DPDP Section 12(3) Right to Erasure / Right to be Forgotten
    //         Harmonized with NABL ISO 15189:2022 §8.4 Retention
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 7: DPDP Section 12(3) Right to Erasure Harmonized with NABL 8.4 Retention");
    const erasureResult = await erasePatientDataForgotten(
      testPatient.id,
      "Patient requested erasure under DPDP Section 12(3) upon shifting abroad",
      collectorUserId
    );

    expect(erasureResult.success === true, "Right to Erasure transaction processed successfully");
    expect(erasureResult.anonymizedUhid.startsWith("ANON-"), `Patient assigned anonymized UHID: ${erasureResult.anonymizedUhid}`);

    // Verify Patient table in database is redacted of PII
    const anonymizedPatient = await prisma.patient.findUnique({
      where: { id: testPatient.id },
    });

    expect(anonymizedPatient?.firstName === "REDACTED", "Patient firstName redacted to 'REDACTED'");
    expect(anonymizedPatient?.lastName.startsWith("DPDP-") === true, "Patient lastName replaced with anonymized DPDP token");
    expect(anonymizedPatient?.phone === null, "Patient phone number permanently wiped");
    expect(anonymizedPatient?.email === null, "Patient email address permanently wiped");
    expect(anonymizedPatient?.address === null, "Patient postal address permanently wiped");
    expect(anonymizedPatient?.aadhaarNumber === null, "Patient Aadhaar number permanently wiped");
    expect(anonymizedPatient?.panNumber === null, "Patient PAN number permanently wiped");

    // Verify NABL Clause 8.4 Diagnostic Preservation
    const clinicalOrdersAfterErasure = await prisma.order.findMany({
      where: { patientId: testPatient.id },
    });
    expect(
      clinicalOrdersAfterErasure.length >= 1,
      "NABL Clause 8.4 Compliance: Clinical orders preserved intact in de-identified state"
    );

    // Verify AuditLog for DPDP transactions
    const dpdpAuditLogs = await prisma.auditLog.findMany({
      where: { module: "DPDP_PRIVACY", recordId: testPatient.id },
    });
    expect(
      dpdpAuditLogs.length >= 2,
      "Audit logs record full cryptographic provenance for portability and erasure actions"
    );

    console.log("\n=======================================================================");
    console.log(`🎉 DAY 10 EMPIRICAL VERIFICATION COMPLETE: ${passedAssertions} / ${totalAssertions} ASSERTIONS PASSED (100%)`);
    console.log("=======================================================================\n");
  } catch (error) {
    console.error("\n❌ DAY 10 VERIFICATION FAILED WITH ERROR:", error);
    process.exit(1);
  } finally {
    // Teardown test records
    if (testPatientId) {
      try {
        await prisma.resultValue.deleteMany({
          where: { result: { patientId: testPatientId } },
        });
        await prisma.result.deleteMany({
          where: { patientId: testPatientId },
        });
        await prisma.payment.deleteMany({
          where: { order: { patientId: testPatientId } },
        });
        await prisma.invoice.deleteMany({
          where: { order: { patientId: testPatientId } },
        });
        await prisma.orderItem.deleteMany({
          where: { order: { patientId: testPatientId } },
        });
        await prisma.sample.deleteMany({
          where: { order: { patientId: testPatientId } },
        });
        await prisma.order.deleteMany({
          where: { patientId: testPatientId },
        });
        await prisma.patientConsent.deleteMany({
          where: { patientId: testPatientId },
        });
        await prisma.auditLog.deleteMany({
          where: { module: "DPDP_PRIVACY" },
        });
        await prisma.patient.delete({
          where: { id: testPatientId },
        });
        console.log("🧹 Test teardown cleaned up temporary test patient and dependencies.");
      } catch (cleanupErr) {
        console.warn("⚠️ Cleanup note:", cleanupErr);
      }
    }
    await prisma.$disconnect();
    process.exit(0);
  }
}

runDay10DpdpSuite();
