/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🧪 DAY 12 EMPIRICAL VERIFICATION SUITE — WHATSAPP PANIC ALERTS & PATIENT CHATBOT
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * File: backend/test-day12-panic-chatbot.ts
 *
 * Verifies:
 *   [1] Critical Panic Value (HH/LL) WhatsApp Push to Referring Doctor
 *   [2] Automatic Failover to SMS Panic Alert when WhatsApp Delivery is Unavailable
 *   [3] Two-Way Patient Chatbot: UHID Report Inquiry with Signed PDF Verification Link
 *   [4] DPDP Act 2023 Security Guard: Block report retrieval from unauthorized phone numbers
 *   [5] Two-Way Patient Chatbot: Order Progress / In-flight Status Inquiry
 *   [6] Two-Way Patient Chatbot: Operating Hours & Phlebotomy Directory
 *   [7] Broadcast Campaign Manager: Preventive Health Package Dispatch & Ledger Tracking
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
  dispatchDoctorPanicAlert,
  handleInboundPatientChatbotMessage,
  executeCampaignBroadcast,
} from "./api/src/modules/communications/whatsapp-panic-bot.service";
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

async function runDay12PanicChatbotSuite() {
  console.log("\n=======================================================================");
  console.log("🚨 NIKIL-LABCORE-ELIS-OS — DAY 12 PANIC ALERTS & CHATBOT SUITE");
  console.log("=======================================================================\n");

  const runId = Date.now().toString().slice(-6);

  // Entities for teardown
  let patientId = "";
  let unauthPatientId = "";
  let doctorId = "";
  let categoryId = "";
  let testId = "";
  let paramId = "";
  let completedOrderId = "";
  let pendingOrderId = "";
  let campaignId = "";

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Fixtures Setup (Doctor, Patient, Completed Order, Pending Order)
    // -------------------------------------------------------------------------
    console.log("▶ STEP 1: Setting Up Clinical Fixtures");

    const doctor = await prisma.doctor.create({
      data: {
        doctorCode: `DOC-D12-${runId}`,
        fullName: `Dr. Rajesh Kulkarni ${runId}`,
        specialization: "Critical Care Specialist",
        phone: "+919822334455",
        email: `dr.kulkarni.${runId}@icu.hospital.org`,
      },
    });
    doctorId = doctor.id;
    expect(Boolean(doctorId), `Referring Doctor created (Code: ${doctor.doctorCode})`);

    const patient = await prisma.patient.create({
      data: {
        uhid: `UHID-D12-${runId}`,
        firstName: "Ananya",
        lastName: "Iyer",
        gender: "FEMALE",
        age: 29,
        phone: "+919876541234",
        email: `ananya.iyer.${runId}@example.com`,
      },
    });
    patientId = patient.id;
    expect(Boolean(patientId), `Test Patient created: ${patient.firstName} ${patient.lastName} (${patient.uhid})`);

    const category = await prisma.testCategory.create({
      data: {
        code: `CAT-D12-${runId}`,
        name: `Emergency Toxicology & Electrolytes ${runId}`,
      },
    });
    categoryId = category.id;

    const clinicalTest = await prisma.test.create({
      data: {
        testCode: `K-STAT-${runId}`,
        testName: "Serum Potassium (Rapid ISE)",
        category: { connect: { id: category.id } },
        sampleType: SampleType.SERUM,
        price: new Prisma.Decimal(450.0),
        processingDepartment: "Critical Care Lab",
        tatHours: 1,
      },
    });
    testId = clinicalTest.id;

    const potassiumParam = await prisma.testParameter.create({
      data: {
        test: { connect: { id: clinicalTest.id } },
        parameterName: "Potassium (K+)",
        dataType: ParameterType.NUMERIC,
        unit: "mmol/L",
        displayOrder: 1,
        referenceRanges: {
          create: [
            {
              gender: "FEMALE",
              normalLow: 3.5,
              normalHigh: 5.1,
              criticalLow: 2.5,
              criticalHigh: 6.5,
            },
          ],
        },
      },
    });
    paramId = potassiumParam.id;

    // Completed Order with Approved Critical Panic Result
    const completedOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-D12-CRIT-${runId}`,
        barcode: `BC-D12-CRIT-${runId}`,
        patientId: patient.id,
        doctorId: doctor.id,
        orderStatus: "COMPLETED",
        paymentStatus: "PAID",
        priority: "STAT",
        subtotal: new Prisma.Decimal(450.0),
        grandTotal: new Prisma.Decimal(450.0),
        paidAmount: new Prisma.Decimal(450.0),
        items: {
          create: [
            {
              itemType: "TEST",
              testId: clinicalTest.id,
              price: new Prisma.Decimal(450.0),
              finalPrice: new Prisma.Decimal(450.0),
            },
          ],
        },
      },
    });
    completedOrderId = completedOrder.id;

    const criticalResult = await prisma.result.create({
      data: {
        orderId: completedOrder.id,
        testId: clinicalTest.id,
        patientId: patient.id,
        status: "APPROVED",
        enteredAt: new Date(),
        approvedAt: new Date(),
        values: {
          create: [
            {
              parameterId: potassiumParam.id,
              value: "7.1",
              flag: "CRITICAL",
            },
          ],
        },
      },
    });
    expect(Boolean(criticalResult.id), "Critical panic result created (Potassium = 7.1 mmol/L)");

    // Pending Order (Samples Collected, in-progress)
    const pendingOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-D12-PEND-${runId}`,
        barcode: `BC-D12-PEND-${runId}`,
        patientId: patient.id,
        doctorId: doctor.id,
        orderStatus: "REGISTERED",
        sampleCollected: true,
        priority: "ROUTINE",
        subtotal: new Prisma.Decimal(450.0),
        grandTotal: new Prisma.Decimal(450.0),
        paidAmount: new Prisma.Decimal(450.0),
      },
    });
    pendingOrderId = pendingOrder.id;
    expect(Boolean(pendingOrderId), `Pending in-flight order created: ${pendingOrder.orderNumber}`);

    // -------------------------------------------------------------------------
    // STEP 2: Doctor Panic Alert WhatsApp Push
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 2: Doctor Critical Panic WhatsApp Push Notification");
    const panicAlertResult = await dispatchDoctorPanicAlert({
      orderId: completedOrder.id,
      resultId: criticalResult.id,
      parameterName: "Potassium (K+)",
      value: "7.1",
      unit: "mmol/L",
      flag: "CRITICAL",
      criticalLow: 2.5,
      criticalHigh: 6.5,
    });

    expect(panicAlertResult.success === true, "Doctor panic alert successfully dispatched");
    expect(panicAlertResult.channelUsed === "WHATSAPP", "Primary channel utilized was WHATSAPP");
    expect(panicAlertResult.doctorPhone === "919822334455", "Doctor phone formatted to E.164");
    expect(panicAlertResult.alertText.includes("CRITICAL PANIC ALERT"), "Alert payload includes emergency header");
    expect(panicAlertResult.alertText.includes("Potassium (K+)"), "Alert payload mentions critical analyte name");
    expect(panicAlertResult.alertText.includes("7.1 mmol/L"), "Alert payload reflects measured panic value");
    expect(panicAlertResult.alertText.includes("telephonic read-back"), "Alert payload includes NABL mandatory read-back protocol");

    // Verify database communication log
    const waPanicLog = await prisma.communicationLog.findFirst({
      where: {
        providerMessageId: panicAlertResult.messageId,
        type: "WHATSAPP",
      },
    });
    expect(Boolean(waPanicLog), "WhatsApp panic communication log recorded in database");
    expect(waPanicLog?.status === "SENT", "WhatsApp panic log status is 'SENT'");

    // -------------------------------------------------------------------------
    // STEP 3: SMS Panic Alert Fallback Mechanism
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 3: Automatic Failover to SMS Panic Alert");
    const smsFallbackResult = await dispatchDoctorPanicAlert({
      orderId: completedOrder.id,
      resultId: criticalResult.id,
      parameterName: "Potassium (K+)",
      value: "7.1",
      unit: "mmol/L",
      flag: "CRITICAL",
      criticalLow: 2.5,
      criticalHigh: 6.5,
      forceSmsFallback: true, // Simulate WhatsApp channel outage
    });

    expect(smsFallbackResult.success === true, "SMS panic fallback successfully dispatched");
    expect(smsFallbackResult.channelUsed === "SMS_FALLBACK", "Failover channel is SMS_FALLBACK");
    expect(Boolean(smsFallbackResult.messageId), `SMS message ID generated: ${smsFallbackResult.messageId}`);

    const smsPanicLog = await prisma.communicationLog.findFirst({
      where: {
        providerMessageId: smsFallbackResult.messageId,
        type: "SMS",
      },
    });
    expect(Boolean(smsPanicLog), "SMS panic communication log recorded in database");
    expect(smsPanicLog?.status === "SENT", "SMS fallback log status is 'SENT'");
    expect(
      (smsPanicLog?.metadata as any)?.fallbackFrom === "WHATSAPP",
      "Log metadata tracks fallback provenance: fallbackFrom='WHATSAPP'"
    );

    // -------------------------------------------------------------------------
    // STEP 4: Two-Way Patient Chatbot — Report Inquiry with Signed PDF Link
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 4: Inbound Patient Chatbot (UHID Report Inquiry)");

    // Fulfill mandatory NABL ISO 15189:2022 Clause 7.4.2 telephonic read-back for critical panic results
    await recordTelephonicReadBack({
      resultId: criticalResult.id,
      recipientDoctorName: doctor.fullName,
      contactNumber: doctor.phone,
      readBackVerified: true,
      communicatedValuesSummary: "Serum Potassium = 7.1 mmol/L (Critical High)",
      clinicalNotes: "Emergency telephonic read-back verified and acknowledged by treating clinician.",
    });

    const reportInquiry = await handleInboundPatientChatbotMessage({
      senderPhone: "+919876541234", // Matching registered patient phone
      messageText: `Hi, please send my report for ${patient.uhid}`,
      externalMessageId: `msg_in_rep_${runId}`,
    });

    expect(reportInquiry.success === true, "Chatbot report inquiry processed successfully");
    expect(reportInquiry.intent === "REPORT_INQUIRY", "Chatbot intent classified as REPORT_INQUIRY");
    expect(reportInquiry.patientUhid === patient.uhid, "Patient UHID correctly resolved");
    expect(Boolean(reportInquiry.reportUrl), "Tamper-evident signed PDF report URL provided");
    expect(reportInquiry.reportUrl?.includes("/verify-report?token="), "Verification token embedded in report URL");
    expect(reportInquiry.responseText.includes("Ananya"), "Personalized greeting returned to verified patient");

    // -------------------------------------------------------------------------
    // STEP 5: DPDP Act 2023 Identity Matching Guard (Unauthorized Phone)
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 5: DPDP Act 2023 Security Guard (Unauthorized Phone Number)");
    const unauthorizedInquiry = await handleInboundPatientChatbotMessage({
      senderPhone: "+919999900000", // UNRECOGNIZED / UNREGISTERED PHONE
      messageText: `Send report for ${patient.uhid}`,
      externalMessageId: `msg_in_unauth_${runId}`,
    });

    expect(unauthorizedInquiry.success === true, "Chatbot processed security check");
    expect(unauthorizedInquiry.intent === "SECURITY_BLOCKED", "Inquiry blocked with SECURITY_BLOCKED intent");
    expect(unauthorizedInquiry.reportUrl === undefined, "Report URL strictly withheld from unverified phone number");
    expect(
      unauthorizedInquiry.responseText.includes("DPDP Act 2023"),
      "Response explicitly cites DPDP Act 2023 privacy safeguarding"
    );

    // -------------------------------------------------------------------------
    // STEP 6: Inbound Patient Chatbot — In-Flight Status Inquiry
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 6: Inbound Patient Chatbot (In-Flight Turnaround Status)");

    // Create secondary patient for in-flight status testing
    const pendingPatient = await prisma.patient.create({
      data: {
        uhid: `UHID-PEND-${runId}`,
        firstName: "Rohan",
        lastName: "Gupta",
        gender: "MALE",
        age: 34,
        phone: "+919811223344",
      },
    });
    unauthPatientId = pendingPatient.id;

    await prisma.order.create({
      data: {
        orderNumber: `ORD-D12-INFLIGHT-${runId}`,
        barcode: `BC-D12-INFLIGHT-${runId}`,
        patientId: pendingPatient.id,
        orderStatus: "REGISTERED",
        sampleCollected: true,
        priority: "ROUTINE",
      },
    });

    const statusInquiry = await handleInboundPatientChatbotMessage({
      senderPhone: "+919811223344",
      messageText: `STATUS ${pendingPatient.uhid}`,
      externalMessageId: `msg_in_stat_${runId}`,
    });

    expect(statusInquiry.success === true, "Status inquiry processed successfully");
    expect(statusInquiry.intent === "STATUS_INQUIRY", "Chatbot intent classified as STATUS_INQUIRY");
    expect(statusInquiry.responseText.includes("in progress"), "Response informs patient order is in progress");
    expect(statusInquiry.responseText.includes("Automated Analyzer Processing"), "Specimen processing stage communicated");

    // -------------------------------------------------------------------------
    // STEP 7: Inbound Patient Chatbot — Operating Hours Inquiry
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 7: Inbound Patient Chatbot (Operating Hours & Locations)");
    const hoursInquiry = await handleInboundPatientChatbotMessage({
      senderPhone: "+919876541234",
      messageText: "What are your lab hours and collection center locations?",
      externalMessageId: `msg_in_hrs_${runId}`,
    });

    expect(hoursInquiry.success === true, "Hours inquiry processed successfully");
    expect(hoursInquiry.intent === "LAB_HOURS", "Chatbot intent classified as LAB_HOURS");
    expect(hoursInquiry.responseText.includes("06:30 AM – 09:30 PM"), "Operating hours returned accurately");
    expect(hoursInquiry.responseText.includes("Home Collection"), "Phlebotomy helpline surfaced");

    // -------------------------------------------------------------------------
    // STEP 8: Broadcast Campaign Manager
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 8: Broadcast Health Campaign Batch Execution");
    const campaign = await prisma.whatsAppCampaign.create({
      data: {
        name: `Monsoon Wellness Screening ${runId}`,
        campaignType: "HEALTH_AWARENESS",
        messageContent: "🌿 LabCore Seasonal Wellness: Comprehensive Health Checkup at 40% privilege discount this week. Reply 'BOOK' to schedule home collection.",
        targetAudience: { category: "ALL_ACTIVE_PATIENTS" },
        status: "DRAFT",
      },
    });
    campaignId = campaign.id;
    expect(Boolean(campaignId), `Health campaign created: ${campaign.name}`);

    const broadcastResult = await executeCampaignBroadcast(campaign.id);
    expect(broadcastResult.success === true, "Campaign broadcast executed successfully");
    expect(broadcastResult.dispatchedCount >= 1, `Messages dispatched to ${broadcastResult.dispatchedCount} active patient contacts`);
    expect(broadcastResult.campaignStatus === "COMPLETED", "Campaign status transitioned to 'COMPLETED'");

    // Verify campaign in database
    const updatedCampaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: campaign.id },
    });
    expect(updatedCampaign?.status === "COMPLETED", "Database campaign record reflects COMPLETED status");
    expect(updatedCampaign?.sentCount === broadcastResult.dispatchedCount, "Database sentCount matches dispatchedCount");

    console.log("\n=======================================================================");
    console.log(`🎉 DAY 12 EMPIRICAL VERIFICATION COMPLETE: ${passedAssertions} / ${totalAssertions} ASSERTIONS PASSED (100%)`);
    console.log("=======================================================================\n");
  } catch (error) {
    console.error("\n❌ DAY 12 VERIFICATION FAILED WITH ERROR:", error);
    process.exit(1);
  } finally {
    // Teardown test records
    console.log("🧹 Cleaning up Day 12 test records...");
    try {
      if (campaignId) {
        await prisma.whatsAppCampaign.deleteMany({ where: { id: campaignId } });
      }
      const orderIds = [completedOrderId, pendingOrderId].filter(Boolean);
      for (const oid of orderIds) {
        await prisma.resultValue.deleteMany({ where: { result: { orderId: oid } } });
        await prisma.result.deleteMany({ where: { orderId: oid } });
        await prisma.orderItem.deleteMany({ where: { orderId: oid } });
        await prisma.order.deleteMany({ where: { id: oid } });
      }
      if (paramId) {
        await prisma.referenceRange.deleteMany({ where: { parameterId: paramId } });
        await prisma.testParameter.deleteMany({ where: { id: paramId } });
      }
      if (testId) {
        await prisma.test.deleteMany({ where: { id: testId } });
      }
      if (categoryId) {
        await prisma.testCategory.deleteMany({ where: { id: categoryId } });
      }
      const pids = [patientId, unauthPatientId].filter(Boolean);
      for (const pid of pids) {
        await prisma.order.deleteMany({ where: { patientId: pid } });
        await prisma.communicationLog.deleteMany({ where: { patientId: pid } });
        await prisma.whatsAppIncomingMessage.deleteMany({ where: { patientId: pid } });
        await prisma.patient.deleteMany({ where: { id: pid } });
      }
      if (doctorId) {
        await prisma.doctor.deleteMany({ where: { id: doctorId } });
      }
      // Clean up orphaned incoming test messages
      await prisma.whatsAppIncomingMessage.deleteMany({
        where: { externalMessageId: { contains: runId } },
      });
      console.log("🧹 Teardown completed successfully.");
    } catch (err) {
      console.warn("⚠️ Teardown warning:", err);
    }
    await prisma.$disconnect();
    process.exit(0);
  }
}

runDay12PanicChatbotSuite();
