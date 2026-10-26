/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🧪 DAY 13 EMPIRICAL VERIFICATION SUITE — CLINICAL AI STUDIO & GEMINI COPILOT
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * File: backend/test-day13-clinical-ai.ts
 *
 * Verifies:
 *   [1] DPDP Act 2023 PII Sanitization & Zero Direct Identifier Leakage Assertion
 *   [2] Google Gemini / Clinical Rule Multi-Analyte Diagnostic Reasoning & ICD-10
 *   [3] Hematology CBC Morphology & Scattergram Cluster Interpretation
 *   [4] Endocrine Thyroid Multi-Class Functional Disorder Classifier (Hashimoto's)
 *   [5] Multi-Organ Clinical Risk Prediction Cards (Cardiac / Renal Risk)
 *   [6] Doctor Override Safety Protocol with Tamper-Evident SHA-256 Chained Audit Trail
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

process.env.FIELD_ENCRYPTION_KEY =
  process.env.FIELD_ENCRYPTION_KEY || "labcore_dpdp_secret_key_32_characters_minimum_gcm!!";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "labcore_default_jwt_secret_token_1234567890_test";

import assert from "assert";
import crypto from "crypto";
import { Prisma, SampleType, ParameterType } from "@prisma/client";
import prisma from "./api/src/lib/prisma";
import {
  sanitizeDemographicsForAI,
  assertZeroPiiLeakage,
  interpretOrderWithGemini,
  analyzeCbcWithGemini,
  analyzeThyroidWithGemini,
  generateClinicalRiskCard,
  recordDoctorAiOverride,
  getDoctorAiOverrides,
} from "./api/src/modules/ai/gemini.service";

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

async function runDay13ClinicalAiSuite() {
  console.log("\n=======================================================================");
  console.log("🧠 NIKIL-LABCORE-ELIS-OS — DAY 13 CLINICAL AI STUDIO & GEMINI SUITE");
  console.log("=======================================================================\n");

  const runId = Date.now().toString().slice(-6);

  // Entities for teardown
  let patientId = "";
  let doctorId = "";
  let categoryId = "";
  let testId = "";
  let paramId = "";
  let orderId = "";

  try {
    // -------------------------------------------------------------------------
    // STEP 1: DPDP Act 2023 / HIPAA PII Sanitization Guarantee
    // -------------------------------------------------------------------------
    console.log("▶ STEP 1: DPDP Act 2023 PII Sanitization Guarantee");

    const rawPatient = {
      firstName: "Vikramaditya",
      lastName: "Singhania",
      uhid: `UHID-D13-${runId}`,
      phone: "+919820011223",
      email: "vikram.singhania@heritage.org",
      age: 54,
      gender: "MALE",
    };

    const sanitized = sanitizeDemographicsForAI(rawPatient);
    expect(sanitized.ageBracket === "Middle-Aged Adult (40-64 yrs)", "Patient age 54 mapped to 'Middle-Aged Adult (40-64 yrs)'");
    expect(sanitized.biologicalSex === "MALE", "Biological sex retained as 'MALE'");
    expect(sanitized.sanitizationVerified === true, "Sanitization verification flag certified true");

    // Test zero leakage assertion
    const safePayload = `Profile: ${sanitized.ageBracket}, ${sanitized.biologicalSex}. Analytes: Glucose = 240 mg/dL`;
    expect(assertZeroPiiLeakage(safePayload, rawPatient) === true, "Sanitized payload verified free of patient name, UHID, phone & email");

    let leakDetected = false;
    try {
      const leakyPayload = `Patient ${rawPatient.firstName} has glucose 240 mg/dL`;
      assertZeroPiiLeakage(leakyPayload, rawPatient);
    } catch (err: any) {
      if (err.statusCode === 400 || err.code === "PII_SECURITY_LEAK_DETECTED") {
        leakDetected = true;
      }
    }
    expect(leakDetected === true, "DPDP Security Guard immediately blocks prompts containing patient first name");

    // -------------------------------------------------------------------------
    // STEP 2: Clinical Fixtures Setup (Cardiac & Renal derangement)
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 2: Setting Up Clinical Diagnostic Fixtures");

    const doctor = await prisma.doctor.create({
      data: {
        doctorCode: `DOC-D13-${runId}`,
        fullName: `Dr. Shailesh Mehta ${runId}`,
        specialization: "Consultant Pathologist & Intensivist",
        phone: "+919833445566",
        email: `dr.mehta.${runId}@pathology.org`,
      },
    });
    doctorId = doctor.id;
    expect(Boolean(doctorId), `Pathologist created: ${doctor.fullName} (${doctor.doctorCode})`);

    const patient = await prisma.patient.create({
      data: {
        uhid: `UHID-D13-${runId}`,
        firstName: "Meera",
        lastName: "Deshmukh",
        gender: "FEMALE",
        age: 62,
        phone: "+919811229988",
        email: `meera.deshmukh.${runId}@example.com`,
      },
    });
    patientId = patient.id;
    expect(Boolean(patientId), `Test Patient created: ${patient.firstName} ${patient.lastName} (${patient.uhid})`);

    const category = await prisma.testCategory.create({
      data: {
        code: `CAT-D13-${runId}`,
        name: `Emergency Cardiac & Critical Biochemistry ${runId}`,
      },
    });
    categoryId = category.id;

    const test = await prisma.test.create({
      data: {
        testCode: `CAR-KFT-${runId}`,
        testName: "Emergency Cardiac Injury & Renal Clearance Panel",
        category: { connect: { id: category.id } },
        sampleType: SampleType.SERUM,
        price: new Prisma.Decimal(1250.0),
        processingDepartment: "Critical Care Biochemistry",
      },
    });
    testId = test.id;

    // Parameters: hs-Troponin I and Creatinine
    const tropParam = await prisma.testParameter.create({
      data: {
        test: { connect: { id: test.id } },
        parameterName: "Troponin I",
        dataType: ParameterType.NUMERIC,
        unit: "ng/mL",
        displayOrder: 1,
      },
    });

    const creatParam = await prisma.testParameter.create({
      data: {
        test: { connect: { id: test.id } },
        parameterName: "Creatinine",
        dataType: ParameterType.NUMERIC,
        unit: "mg/dL",
        displayOrder: 2,
      },
    });
    paramId = tropParam.id;

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-D13-${runId}`,
        barcode: `BC-D13-${runId}`,
        patientId: patient.id,
        doctorId: doctor.id,
        orderStatus: "COMPLETED",
        paymentStatus: "PAID",
        priority: "STAT",
        subtotal: new Prisma.Decimal(1250.0),
        grandTotal: new Prisma.Decimal(1250.0),
        paidAmount: new Prisma.Decimal(1250.0),
      },
    });
    orderId = order.id;

    await prisma.result.create({
      data: {
        orderId: order.id,
        testId: test.id,
        patientId: patient.id,
        status: "APPROVED",
        values: {
          create: [
            {
              parameterId: tropParam.id,
              value: "0.85",
              flag: "CRITICAL",
            },
            {
              parameterId: creatParam.id,
              value: "2.8",
              flag: "HIGH",
            },
          ],
        },
      },
    });
    expect(Boolean(orderId), `Clinical Order created with Critical hs-Troponin I (0.85 ng/mL) & Creatinine (2.8 mg/dL)`);

    // -------------------------------------------------------------------------
    // STEP 3: Multi-Analyte Diagnostic Reasoning & Differential Diagnosis
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 3: Gemini / Rule-Based Diagnostic Reasoning & ICD-10");
    const aiAnalysis = await interpretOrderWithGemini(order.id);

    expect(aiAnalysis.orderId === order.id, "Order ID matched in AI diagnostic output");
    expect(Boolean(aiAnalysis.summary), "Comprehensive clinical diagnostic summary generated");
    expect(aiAnalysis.differentialDiagnosis.length >= 1, `Differential diagnosis list generated (${aiAnalysis.differentialDiagnosis.length} conditions)`);
    expect(aiAnalysis.riskCategory === "CRITICAL_EMERGENCY" || aiAnalysis.riskCategory === "HIGH_RISK", `Risk severity correctly assigned: ${aiAnalysis.riskCategory}`);
    expect(aiAnalysis.icd10Suggestions.length >= 1, `Standardized ICD-10 suggestions provided (${aiAnalysis.icd10Suggestions.map(s => s.code).join(", ")})`);
    expect(aiAnalysis.source === "GEMINI_LIVE_AI" || aiAnalysis.source === "CLINICAL_RULE_FALLBACK", `Diagnostic inference source identified: ${aiAnalysis.source}`);

    // -------------------------------------------------------------------------
    // STEP 4: CBC Auto-Analyzer & Scattergram Interpretation
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 4: Hematology CBC Auto-Analyzer & Scattergram Cluster Evaluation");
    const cbcResult = await analyzeCbcWithGemini({
      hb: 6.8, // Critical anemia
      rbc: 2.8,
      wbc: 16.5, // Leukocytosis
      platelets: 65, // Thrombocytopenia
      hematocrit: 22,
      mcv: 68, // Microcytic
      mch: 19, // Hypochromic
      mchc: 29,
      neutrophils: 82, // Left shift
      lymphocytes: 12,
      monocytes: 4,
      eosinophils: 1,
      basophils: 1,
      rdw: 18.5,
      patientGender: "FEMALE",
      patientAge: 62,
    });

    expect(Boolean(cbcResult.morphologySummary), "CBC morphological interpretation generated");
    expect(cbcResult.anemiaClassification.includes("Microcytic Hypochromic"), `Anemia classified accurately: ${cbcResult.anemiaClassification}`);
    expect(cbcResult.leukocytePattern.includes("Neutrophilic Leukocytosis"), `WBC differential classified: ${cbcResult.leukocytePattern}`);
    expect(cbcResult.criticalFlags.some(f => f.includes("Hemoglobin") || f.includes("6.8")), "Critical hemoglobin flag surfaced in alerts");
    expect(cbcResult.scattergramCluster.neutrophilCluster === "LEFT_SHIFT" || cbcResult.scattergramCluster.scattergramAnomalyDetected === true, "Scattergram detects left shift / abnormal differential clustering");

    // -------------------------------------------------------------------------
    // STEP 5: Endocrine Thyroid Disorder Classifier (Hashimoto's)
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 5: Multi-Class Thyroid AI Classifier (Hashimoto's / Primary Hypo)");
    const thyroidResult = await analyzeThyroidWithGemini({
      tsh: 18.4, // Severely elevated
      ft4: 8.5,  // Low Free T4 (Ref: 12-22)
      ft3: 2.9,  // Low Free T3 (Ref: 3.1-6.8)
      tpoAntibody: 480, // High Anti-TPO (Autoimmune marker)
      tgAntibody: 210,
      patientAge: 46,
      patientGender: "FEMALE",
    });

    expect(thyroidResult.primaryClassification.toLowerCase().includes("hypothyroid"), `Primary classification identifies Hypothyroidism: ${thyroidResult.primaryClassification}`);
    expect(thyroidResult.antibodyStatus === "POSITIVE", "Anti-TPO marked as POSITIVE (> 35 IU/mL)");
    expect(thyroidResult.subClassification.includes("Autoimmune") || thyroidResult.subClassification.includes("Hashimoto"), "Identified autoimmune etiology (Hashimoto's Thyroiditis)");
    expect(thyroidResult.riskGrade === "HIGH" || thyroidResult.riskGrade === "CRITICAL", `Endocrine risk grade evaluated: ${thyroidResult.riskGrade}`);
    expect(Boolean(thyroidResult.managementSummary), "Clinical endocrine management recommendations provided");

    // -------------------------------------------------------------------------
    // STEP 6: Multi-Organ Clinical Risk Prediction Cards
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 6: Multi-Organ Clinical Risk Prediction Cards");
    const riskCards = await generateClinicalRiskCard(order.id);

    expect(riskCards.length >= 2, `Multi-organ risk assessment produced ${riskCards.length} organ system cards`);

    const cardiacCard = riskCards.find(c => c.organSystem === "CARDIAC");
    expect(Boolean(cardiacCard), "Cardiac organ system risk card generated");
    expect(cardiacCard?.severity === "CRITICAL", "Cardiac card flags CRITICAL severity due to hs-Troponin elevation");
    expect(cardiacCard?.score! >= 90, `Cardiac risk score quantified: ${cardiacCard?.score}/100`);

    const renalCard = riskCards.find(c => c.organSystem === "RENAL");
    expect(Boolean(renalCard), "Renal organ system risk card generated");
    expect(renalCard?.severity === "HIGH" || renalCard?.severity === "CRITICAL", `Renal risk severity graded: ${renalCard?.severity}`);

    // -------------------------------------------------------------------------
    // STEP 7: Pathologist AI Override & Tamper-Evident SHA-256 Audit Trail
    // -------------------------------------------------------------------------
    console.log("\n▶ STEP 7: Doctor Override Safety Protocol & Cryptographic Hash Chaining");

    const overrideResult = await recordDoctorAiOverride({
      orderId: order.id,
      doctorId: doctor.id,
      aiSuggestedDiagnosis: ["Acute ST-Elevation Myocardial Infarction", "Type 2 Cardiorenal Syndrome"],
      doctorFinalDiagnosis: ["Type 2 Myocardial Infarction Secondary to Severe Sepsis", "Pre-existing Stage 3 CKD"],
      overrideReason: "Patient displays clinical hallmarks of septic shock with supply-demand mismatch troponin release; coronary angiography negative for acute thrombotic occlusion.",
      clinicalNotes: "Maintain pressor support and initiate nephro-protective hemodilution.",
    });

    expect(overrideResult.success === true, "Doctor clinical override recorded successfully");
    expect(Boolean(overrideResult.auditLogId), `AuditLog entry created: ${overrideResult.auditLogId}`);
    expect(Boolean(overrideResult.prevHash), `Cryptographic prevHash present: ${overrideResult.prevHash.slice(0, 16)}...`);
    expect(Boolean(overrideResult.rowHash), `Tamper-evident rowHash computed: ${overrideResult.rowHash.slice(0, 16)}...`);
    expect(overrideResult.tamperEvidentChainVerified === true, "Cryptographic hash chain certified intact");

    // Verify retrieval from AuditLog
    const overrides = await getDoctorAiOverrides(order.id);
    expect(overrides.length >= 1, `Doctor override retrieved from database audit records (${overrides.length} records)`);
    expect((overrides[0].newData as any)?.overrideReason.includes("septic shock"), "Override reason accurately reflected in audit trail");

    console.log("\n=======================================================================");
    console.log(`🎉 DAY 13 EMPIRICAL VERIFICATION COMPLETE: ${passedAssertions} / ${totalAssertions} ASSERTIONS PASSED (100%)`);
    console.log("=======================================================================\n");
  } catch (error) {
    console.error("\n❌ DAY 13 VERIFICATION FAILED WITH ERROR:", error);
    process.exit(1);
  } finally {
    // Teardown test records
    console.log("🧹 Cleaning up Day 13 test records...");
    try {
      if (orderId) {
        await prisma.auditLog.deleteMany({ where: { recordId: orderId } });
        await prisma.resultValue.deleteMany({ where: { result: { orderId } } });
        await prisma.result.deleteMany({ where: { orderId } });
        await prisma.orderItem.deleteMany({ where: { orderId } });
        await prisma.order.deleteMany({ where: { id: orderId } });
      }
      if (paramId) {
        await prisma.referenceRange.deleteMany({ where: { parameterId: paramId } });
        await prisma.testParameter.deleteMany({ where: { testId } });
      }
      if (testId) {
        await prisma.test.deleteMany({ where: { id: testId } });
      }
      if (categoryId) {
        await prisma.testCategory.deleteMany({ where: { id: categoryId } });
      }
      if (patientId) {
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

runDay13ClinicalAiSuite();
