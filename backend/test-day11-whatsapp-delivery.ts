/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🧪 DAY 11 EMPIRICAL VERIFICATION SUITE — WHATSAPP CLOUD API AUTOMATED REPORT DELIVERY
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * File: backend/test-day11-whatsapp-delivery.ts
 *
 * Verifies:
 *   [1] Meta WhatsApp Business API Template Registration (NABL Utility Template)
 *   [2] Auto-Dispatch Trigger on Pathologist Sign-Off / Approval
 *   [3] NABL Clause 7.4.2 Critical Panic Dispatch Guard Enforcement
 *   [4] DPDP Act 2023 Consent & Opt-Out Guard Enforcement
 *   [5] Delivery Status Webhook Lifecycle (SENT -> DELIVERED -> READ -> FAILED)
 *   [6] Real-time Delivery Audit Reporting in CommunicationLog & Order State
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

// Cryptographic and runtime environment variables
process.env.FIELD_ENCRYPTION_KEY =
  process.env.FIELD_ENCRYPTION_KEY || "labcore_dpdp_secret_key_32_characters_minimum_gcm!!";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "labcore_default_jwt_secret_token_1234567890_test";

import assert from "assert";
import { Prisma, SampleType, ParameterType } from "@prisma/client";
import prisma from "./api/src/lib/prisma";
import {
  ensureReportTemplateRegistered,
  dispatchApprovedReportToWhatsApp,
  updateWhatsAppDeliveryStatus,
  getReportWhatsAppDeliveryStatus,
  NABL_REPORT_TEMPLATE_NAME,
} from "./api/src/modules/communications/whatsapp-report-delivery.service";
import { recordTelephonicReadBack } from "./api/src/modules/approvals/panic-readback.service";

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

async function runDay11WhatsAppDeliverySuite() {
  console.log("\n=======================================================================");
  console.log("💬 NIKIL-LABCORE-ELIS-OS — DAY 11 WHATSAPP CLOUD API DISPATCH SUITE");
  console.log("=======================================================================\n");

  const runId = Date.now().toString().slice(-6);

  // Entities for teardown
  let patientId = "";
  let orderId = "";
  let criticalOrderId = "";
  let doctorId = "";
  let testId = "";
  let categoryId = "";
  let paramId = "";
  let criticalParamId = "";

  try {
    // -------------------------------------------------------------------------
    // STEP 1: WhatsApp Template Registration
    // -------------------------------------------------------------------------
    console.log("▶ STEP 1: Verifying Meta WhatsApp Template Registration");
    const template = await ensureReportTemplateRegistered();

    expect(Boolean(template && template.id), "Template record initialized");
    expect(template.name === NABL_REPORT_TEMPLATE_NAME, `Template name matches: ${NABL_REPORT_TEMPLATE_NAME}`);
    expect(template.category === "UTILITY", "Template category is UTILITY (NABL diagnostic delivery)");
    expect(template.templateStatus === "APPROVED", "Template status is marked APPROVED for dispatch");
    expect(
      Boolean((template.components as any)?.header && (template.components as any)?.body),
      "Template components include Document header and parameter-substituted body"
    );

    // -------------------------------------------------------------------------
    // STEP 2: Seed Clinical Patient, Doctor, Catalog and Orders
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 2: Setting Up Clinical Fixtures (Patient, Doctor, Test Catalog)");
    const doctor = await prisma.doctor.create({
      data: {
        doctorCode: `DOC-${runId}`,
        fullName: `Dr. Neha Verma ${runId}`,
        specialization: "General Physician",
        phone: "+919811002233",
        email: `dr.verma.${runId}@hospital.org`,
      },
    });
    doctorId = doctor.id;
    expect(Boolean(doctorId), `Referring Doctor created (ID: ${doctorId})`);

    const patient = await prisma.patient.create({
      data: {
        uhid: `WA-PAT-${runId}`,
        firstName: "Vikram",
        lastName: "Mehta",
        gender: "MALE",
        age: 42,
        phone: "+919876501234",
        email: `vikram.mehta.${runId}@example.com`,
        address: "Flat 402, Lotus Towers, Gurugram, HR",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122002",
      },
    });
    patientId = patient.id;
    expect(Boolean(patientId), `Test Patient created with mobile: ${patient.phone}`);

    const category = await prisma.testCategory.create({
      data: {
        code: `BIO-${runId}`,
        name: `Biochemistry D11 ${runId}`,
      },
    });
    categoryId = category.id;

    const clinicalTest = await prisma.test.create({
      data: {
        testCode: `LFT-${runId}`,
        testName: "Comprehensive Liver Function Panel",
        category: { connect: { id: category.id } },
        sampleType: SampleType.SERUM,
        price: new Prisma.Decimal(850.0),
        processingDepartment: "Biochemistry",
        tatHours: 4,
      },
    });
    testId = clinicalTest.id;

    // Normal Parameter (Albumin)
    const normalParam = await prisma.testParameter.create({
      data: {
        testId: clinicalTest.id,
        parameterName: "Serum Albumin",
        dataType: ParameterType.NUMERIC,
        unit: "g/dL",
        displayOrder: 1,
        referenceRanges: {
          create: [
            {
              gender: "MALE",
              normalLow: 3.5,
              normalHigh: 5.2,
              criticalLow: 2.0,
              criticalHigh: 6.5,
            },
          ],
        },
      },
    });
    paramId = normalParam.id;

    // Routine Order (All Normal Analytes)
    const routineOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-WA-ROUTINE-${runId}`,
        barcode: `BC-WA-ROUTINE-${runId}`,
        patientId: patient.id,
        doctorId: doctor.id,
        orderStatus: "COMPLETED",
        paymentStatus: "PAID",
        priority: "ROUTINE",
        subtotal: new Prisma.Decimal(850.0),
        grandTotal: new Prisma.Decimal(850.0),
        paidAmount: new Prisma.Decimal(850.0),
        items: {
          create: [
            {
              itemType: "TEST",
              testId: clinicalTest.id,
              price: new Prisma.Decimal(850.0),
              finalPrice: new Prisma.Decimal(850.0),
            },
          ],
        },
      },
    });
    orderId = routineOrder.id;
    expect(Boolean(orderId), `Routine lab order created: ${routineOrder.orderNumber}`);

    // Create Approved Result for Routine Order
    const routineResult = await prisma.result.create({
      data: {
        orderId: routineOrder.id,
        testId: clinicalTest.id,
        patientId: patient.id,
        status: "APPROVED",
        enteredAt: new Date(),
        approvedAt: new Date(),
        values: {
          create: [
            {
              parameterId: normalParam.id,
              value: "4.2",
              flag: "NORMAL",
            },
          ],
        },
      },
    });
    expect(Boolean(routineResult.id), "Approved result recorded with normal analyte values");

    // -------------------------------------------------------------------------
    // STEP 3: Automated WhatsApp Dispatch Execution
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 3: Automated WhatsApp Dispatch Execution");
    const dispatchResult = await dispatchApprovedReportToWhatsApp(routineOrder.id, {
      publicHostUrl: "https://reports.labcore.internal",
    });

    expect(dispatchResult.success === true, "Report successfully dispatched via WhatsApp Cloud API");
    expect(dispatchResult.deliveryStatus === "SENT", "Initial delivery status registered as 'SENT'");
    expect(dispatchResult.recipientPhone === "919876501234", "Recipient phone properly formatted to E.164");
    expect(dispatchResult.reportUrl.includes("/verify-report?token="), "Dispatch payload includes tamper-evident report verification link");
    expect(Boolean(dispatchResult.providerMessageId), `Provider message ID generated: ${dispatchResult.providerMessageId}`);

    // Verify CommunicationLog record
    const commLog = await prisma.communicationLog.findUnique({
      where: { id: dispatchResult.communicationLogId },
    });
    expect(commLog?.type === "WHATSAPP", "CommunicationLog type is WHATSAPP");
    expect(commLog?.status === "SENT", "CommunicationLog status is SENT");
    expect(commLog?.recipientContact === "919876501234", "CommunicationLog recipientContact matches");
    expect(commLog?.providerMessageId === dispatchResult.providerMessageId, "CommunicationLog providerMessageId mapped");

    // Verify Order WhatsApp flag updated
    const updatedOrder = await prisma.order.findUnique({
      where: { id: routineOrder.id },
      select: { reportDeliveryWhatsApp: true },
    });
    expect(updatedOrder?.reportDeliveryWhatsApp === true, "Order flag 'reportDeliveryWhatsApp' flipped to TRUE");

    // -------------------------------------------------------------------------
    // STEP 4: NABL Clause 7.4.2 Critical Panic Dispatch Guard
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 4: NABL Clause 7.4.2 Critical Safety Dispatch Guard");

    // Create parameter with critical range (Serum Potassium)
    const criticalParam = await prisma.testParameter.create({
      data: {
        testId: clinicalTest.id,
        parameterName: "Serum Potassium",
        dataType: ParameterType.NUMERIC,
        unit: "mEq/L",
        displayOrder: 2,
        referenceRanges: {
          create: [
            {
              gender: "MALE",
              normalLow: 3.5,
              normalHigh: 5.0,
              criticalLow: 2.5,
              criticalHigh: 6.5,
            },
          ],
        },
      },
    });
    criticalParamId = criticalParam.id;

    // Create Critical Order with Potassium = 6.9 (Critical High Panic)
    const panicOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-WA-PANIC-${runId}`,
        barcode: `BC-WA-PANIC-${runId}`,
        patientId: patient.id,
        doctorId: doctor.id,
        orderStatus: "COMPLETED",
        paymentStatus: "PAID",
        priority: "STAT",
        subtotal: new Prisma.Decimal(850.0),
        grandTotal: new Prisma.Decimal(850.0),
        paidAmount: new Prisma.Decimal(850.0),
        items: {
          create: [
            {
              itemType: "TEST",
              testId: clinicalTest.id,
              price: new Prisma.Decimal(850.0),
              finalPrice: new Prisma.Decimal(850.0),
            },
          ],
        },
      },
    });
    criticalOrderId = panicOrder.id;

    const panicResult = await prisma.result.create({
      data: {
        orderId: panicOrder.id,
        testId: clinicalTest.id,
        patientId: patient.id,
        status: "APPROVED",
        enteredAt: new Date(),
        approvedAt: new Date(),
        values: {
          create: [
            {
              parameterId: criticalParam.id,
              value: "6.9",
              flag: "CRITICAL",
            },
          ],
        },
      },
    });

    // Attempt dispatch without telephonic readback -> MUST BE BLOCKED
    let panicBlocked = false;
    try {
      await dispatchApprovedReportToWhatsApp(panicOrder.id);
    } catch (err: any) {
      if (err.statusCode === 422 || err.code === "NABL_CRITICAL_DISPATCH_BLOCKED") {
        panicBlocked = true;
      }
    }
    expect(panicBlocked, "NABL Clause 7.4.2 Block: Dispatch blocked when critical panic values lack telephonic readback");

    // Perform telephonic readback
    await recordTelephonicReadBack({
      resultId: panicResult.id,
      recipientDoctorName: doctor.fullName,
      contactNumber: "+919811002233",
      readBackVerified: true,
      communicatedValuesSummary: "Serum Potassium = 6.9 mEq/L (Critical High)",
      clinicalNotes: "Telephonic readback confirmed by treating physician.",
    });

    // Now dispatch again -> MUST SUCCEED
    const panicDispatch = await dispatchApprovedReportToWhatsApp(panicOrder.id);
    expect(panicDispatch.success === true, "Dispatch succeeds once NABL 7.4.2 telephonic read-back is confirmed");

    // -------------------------------------------------------------------------
    // STEP 5: DPDP Act 2023 Consent Guard
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 5: DPDP Act 2023 Consent & Opt-Out Guard");

    // Mark patient with whatsappOptOut = true
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        communicationPreference: { whatsappOptOut: true },
      },
    });
    await prisma.patientConsent.create({
      data: {
        patientId: patient.id,
        consentType: "COMMUNICATION_MARKETING",
        consentGiven: false,
        consentText: "Patient opted out of automated WhatsApp communications.",
      },
    });

    let dpdpBlocked = false;
    try {
      await dispatchApprovedReportToWhatsApp(routineOrder.id);
    } catch (err: any) {
      if (err.statusCode === 403 || err.code === "DPDP_OPTED_OUT") {
        dpdpBlocked = true;
      }
    }
    expect(dpdpBlocked, "DPDP Act 2023 Block: Report dispatch blocked when patient has opted out of WhatsApp");

    // Reset preference
    await prisma.patient.update({
      where: { id: patient.id },
      data: { communicationPreference: {} },
    });

    // -------------------------------------------------------------------------
    // STEP 6: Delivery Status Reconciliation (Webhook Lifecycle)
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 6: WhatsApp Delivery Webhook Reconciliation Lifecycle");

    const testMsgId = dispatchResult.providerMessageId;

    // Simulate "delivered" callback from Meta
    const deliveredUpdate = await updateWhatsAppDeliveryStatus(testMsgId, "delivered", new Date());
    expect(deliveredUpdate.updated === true, "Webhook 'delivered' callback processed successfully");
    expect(deliveredUpdate.communicationLog?.status === "DELIVERED", "CommunicationLog transitioned to 'DELIVERED'");
    expect(Boolean(deliveredUpdate.communicationLog?.deliveredAt), "deliveredAt timestamp recorded");

    // Simulate "read" callback from Meta
    const readUpdate = await updateWhatsAppDeliveryStatus(testMsgId, "read", new Date());
    expect(readUpdate.updated === true, "Webhook 'read' callback processed successfully");
    expect(Boolean((readUpdate.communicationLog?.metadata as any)?.readAt), "Read status documented in metadata");

    // Simulate "failed" callback on dummy ID
    const failedLog = await prisma.communicationLog.create({
      data: {
        patientId: patient.id,
        type: "WHATSAPP",
        status: "PENDING",
        recipientContact: "919999999999",
        subject: "Failed Message Test",
        message: "Test payload",
        providerMessageId: `meta_fail_${runId}`,
      },
    });
    const failedUpdate = await updateWhatsAppDeliveryStatus(
      `meta_fail_${runId}`,
      "failed",
      new Date(),
      { code: "131026", message: "Receiver phone number is not registered on WhatsApp" }
    );
    expect(failedUpdate.updated === true, "Webhook 'failed' callback processed successfully");
    expect(failedUpdate.communicationLog?.status === "FAILED", "CommunicationLog transitioned to 'FAILED'");
    expect(failedUpdate.communicationLog?.errorReason === "131026", "Error code accurately captured");

    // -------------------------------------------------------------------------
    // STEP 7: Status Audit Query for Frontend Report List
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 7: Real-Time Report Delivery Audit Query");
    const statusAudit = await getReportWhatsAppDeliveryStatus(routineOrder.id);

    expect(statusAudit.orderId === routineOrder.id, "Status audit matches order ID");
    expect(statusAudit.isDeliveredToWhatsApp === true, "Delivery flag confirms report was sent");
    expect(statusAudit.latestStatus === "DELIVERED", "Latest delivery status reported as 'DELIVERED'");
    expect(statusAudit.history.length >= 1, "Full WhatsApp dispatch history retrieved for audit log");

    console.log("\n=======================================================================");
    console.log(`🎉 DAY 11 EMPIRICAL VERIFICATION COMPLETE: ${passedAssertions} / ${totalAssertions} ASSERTIONS PASSED (100%)`);
    console.log("=======================================================================\n");
  } catch (error) {
    console.error("\n❌ DAY 11 VERIFICATION FAILED WITH ERROR:", error);
    process.exit(1);
  } finally {
    // Teardown test records
    console.log("🧹 Cleaning up Day 11 test records...");
    try {
      const orderIds = [orderId, criticalOrderId].filter(Boolean);
      for (const oid of orderIds) {
        await prisma.resultValue.deleteMany({ where: { result: { orderId: oid } } });
        await prisma.result.deleteMany({ where: { orderId: oid } });
        await prisma.orderItem.deleteMany({ where: { orderId: oid } });
        await prisma.order.deleteMany({ where: { id: oid } });
      }
      if (paramId || criticalParamId) {
        const paramIds = [paramId, criticalParamId].filter(Boolean);
        await prisma.referenceRange.deleteMany({ where: { parameterId: { in: paramIds } } });
        await prisma.testParameter.deleteMany({ where: { id: { in: paramIds } } });
      }
      if (testId) {
        await prisma.test.deleteMany({ where: { id: testId } });
      }
      if (categoryId) {
        await prisma.testCategory.deleteMany({ where: { id: categoryId } });
      }
      if (patientId) {
        await prisma.communicationLog.deleteMany({ where: { patientId } });
        await prisma.patientConsent.deleteMany({ where: { patientId } });
        await prisma.patient.deleteMany({ where: { id: patientId } });
      }
      if (doctorId) {
        await prisma.doctor.deleteMany({ where: { id: doctorId } });
      }
      console.log("🧹 Teardown completed successfully.");
    } catch (err) {
      console.warn("⚠️ Teardown warning:", err);
    }
    await prisma.$disconnect();
    process.exit(0);
  }
}

runDay11WhatsAppDeliverySuite();
