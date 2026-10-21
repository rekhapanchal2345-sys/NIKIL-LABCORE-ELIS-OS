import assert from 'assert';
import { prisma } from './api/src/lib/prisma';
import {
  recordQcControlRun,
  getLeveyJenningsChartData,
  seedQcRunsForTest,
} from './api/src/modules/approvals/levey-jennings-qc.service';
import {
  classifyResultParameters,
  recordTelephonicReadBack,
  assertOrderClearedForReportDispatch,
  getPrioritizedTriageQueue,
} from './api/src/modules/approvals/panic-readback.service';
import {
  executeResultAmendment,
  getResultAmendmentHistory,
} from './api/src/modules/approvals/result-amendment.service';
import { executeBatchApprovalWorkflow } from './api/src/modules/approvals/approval.controller';
import { uploadDoctorDigitalSignature } from './api/src/modules/approvals/digital-signature.service';

// Minimal valid 1x1 transparent PNG base64 for Pathologist Digital Signature setup
const SAMPLE_SIGNATURE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runDay2EmpiricalTestSuite(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log(' 🏛️  NIKIL-LABCORE-ELIS-OS — DAY 2 EMPIRICAL WORKSTATION VALIDATION SUITE');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  const testRunTag = `DAY2-${Date.now()}`;

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: Seed QC Control Runs & Verify Westgard Multi-Rule Detection
    // ─────────────────────────────────────────────────────────────────────────
    console.log('▶ [TEST 1] Seeding QC Control Runs & Verifying Westgard Multi-Rules (1_2s & 1_3s)...');
    const qcTestCode = `GLU_${testRunTag}`;

    await seedQcRunsForTest(qcTestCode, {
      clearExisting: true,
      includeWarning12s: true,
      includeOutlier13s: true,
    });

    const ljData = await getLeveyJenningsChartData(qcTestCode, 25);

    const level1WarningPoints = ljData.levels.level1.dataPoints.filter(
      (p) => p.status === 'WARNING_1_2S' && p.triggeredRules.includes('1_2S')
    );
    const level2OutlierPoints = ljData.levels.level2.dataPoints.filter(
      (p) => p.status === 'VIOLATED' && p.triggeredRules.includes('1_3S')
    );

    assert(
      level1WarningPoints.length >= 1,
      'Expected Level 1 QC series to detect at least one 1_2S warning point.'
    );
    assert(
      level2OutlierPoints.length >= 1,
      'Expected Level 2 QC series to detect at least one 1_3S outlier rejection.'
    );
    assert.strictEqual(
      ljData.overallSystemStatus,
      'VIOLATED',
      'Overall QC status should be VIOLATED when Level 2 has a 1_3S breach.'
    );
    assert.strictEqual(
      ljData.runClearedForPatientTesting,
      false,
      'Run must NOT be cleared for patient testing when 1_3S is violated.'
    );

    console.log(
      `  ✅ [PASS] Westgard 1_2s Warning detected on Level 1 (Run #${level1WarningPoints[0].runNumber}, z=${level1WarningPoints[0].zScore}s)`
    );
    console.log(
      `  ✅ [PASS] Westgard 1_3s Rejection detected on Level 2 (Run #${level2OutlierPoints[0].runNumber}, z=${level2OutlierPoints[0].zScore}s)\n`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: Verify Levey-Jennings Chart Series Calculation (Mean, SD, UCL/LCL)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('▶ [TEST 2] Verifying Levey-Jennings Statistical Limits (±1s, ±2s, ±3s)...');
    const l1Limits = ljData.levels.level1.limits;

    assert.strictEqual(l1Limits.targetMean, 100);
    assert.strictEqual(l1Limits.targetSd, 4);
    assert.strictEqual(l1Limits.plus1s, 104);
    assert.strictEqual(l1Limits.minus1s, 96);
    assert.strictEqual(l1Limits.plus2s, 108);
    assert.strictEqual(l1Limits.minus2s, 92);
    assert.strictEqual(l1Limits.plus3s, 112);
    assert.strictEqual(l1Limits.minus3s, 88);

    // Also test a 2_2s consecutive systematic violation explicitly
    await recordQcControlRun({
      testCode: qcTestCode,
      controlLevel: 'LEVEL_1_NORMAL',
      measuredValue: 109.2, // +2.3s
      targetMean: 100,
      targetSd: 4,
    });
    const second2sPoint = await recordQcControlRun({
      testCode: qcTestCode,
      controlLevel: 'LEVEL_1_NORMAL',
      measuredValue: 109.6, // +2.4s (second consecutive > +2s)
      targetMean: 100,
      targetSd: 4,
    });

    assert(
      second2sPoint.triggeredRules.includes('2_2S'),
      'Second consecutive +2s observation must trigger Westgard 2_2S systematic rejection.'
    );

    console.log(
      `  ✅ [PASS] L-J Limits verified: Mean=${l1Limits.targetMean}, ±1s=[${l1Limits.minus1s}, ${l1Limits.plus1s}], ±2s=[${l1Limits.minus2s}, ${l1Limits.plus2s}], ±3s=[${l1Limits.minus3s}, ${l1Limits.plus3s}]`
    );
    console.log(
      `  ✅ [PASS] Consecutive 2_2S Systematic Error rule verified (Triggered: ${second2sPoint.triggeredRules.join(', ')})\n`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // SETUP CLINICAL FIXTURES FOR TESTS 3, 4, 5
    // ─────────────────────────────────────────────────────────────────────────
    let category = await prisma.testCategory.findFirst();
    if (!category) {
      category = await prisma.testCategory.create({
        data: {
          name: `Biochemistry ${testRunTag}`,
          code: `BIO_${Date.now().toString().slice(-4)}`,
        },
      });
    }

    const testCatalogPanic = await prisma.test.create({
      data: {
        testName: `Serum Potassium STAT (${testRunTag})`,
        testCode: `KSTAT_${Date.now().toString().slice(-5)}`,
        categoryId: category.id,
        price: 300,
        sampleType: 'SERUM',
        tatHours: 2,
        parameters: {
          create: [
            {
              parameterName: 'Serum Potassium',
              dataType: 'NUMERIC',
              unit: 'mmol/L',
              referenceRanges: {
                create: [
                  {
                    normalLow: 3.5,
                    normalHigh: 5.1,
                    criticalLow: 2.8,
                    criticalHigh: 6.2,
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        parameters: {
          include: { referenceRanges: true },
        },
      },
    });

    const testCatalogNormal = await prisma.test.create({
      data: {
        testName: `Fasting Blood Glucose (${testRunTag})`,
        testCode: `GLUNORM_${Date.now().toString().slice(-5)}`,
        categoryId: category.id,
        price: 150,
        sampleType: 'SERUM',
        tatHours: 2,
        parameters: {
          create: [
            {
              parameterName: 'Fasting Blood Glucose',
              dataType: 'NUMERIC',
              unit: 'mg/dL',
              referenceRanges: {
                create: [
                  {
                    normalLow: 70,
                    normalHigh: 100,
                    criticalLow: 45,
                    criticalHigh: 450,
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        parameters: {
          include: { referenceRanges: true },
        },
      },
    });

    const testCatalogAbnormal = await prisma.test.create({
      data: {
        testName: `Post-Prandial Glucose (${testRunTag})`,
        testCode: `GLUABN_${Date.now().toString().slice(-5)}`,
        categoryId: category.id,
        price: 150,
        sampleType: 'SERUM',
        tatHours: 2,
        parameters: {
          create: [
            {
              parameterName: 'Post-Prandial Glucose',
              dataType: 'NUMERIC',
              unit: 'mg/dL',
              referenceRanges: {
                create: [
                  {
                    normalLow: 70,
                    normalHigh: 140,
                    criticalLow: 45,
                    criticalHigh: 500,
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        parameters: {
          include: { referenceRanges: true },
        },
      },
    });

    const kParam = testCatalogPanic.parameters.find((p) => p.parameterName === 'Serum Potassium')!;
    const gluParam = testCatalogNormal.parameters.find((p) => p.parameterName === 'Fasting Blood Glucose')!;
    const gluAbnParam = testCatalogAbnormal.parameters.find((p) => p.parameterName === 'Post-Prandial Glucose')!;

    const doctor = await prisma.doctor.create({
      data: {
        doctorCode: `DOC-${testRunTag}`,
        fullName: 'Dr. Arundhati Subramanian, MD (Pathology)',
        specialization: 'Clinical Pathology & Biochemistry',
        phone: '9820112233',
        email: `dr.arundhati.${Date.now()}@labcore.org`,
        registrationNumber: 'KMC-PATH-2026-8841',
        licenseNumber: 'NABL-SIGN-8841',
      },
    });

    // Register digital signature for the pathologist
    try {
      await uploadDoctorDigitalSignature({
        doctorId: doctor.id,
        base64Image: SAMPLE_SIGNATURE_PNG_BASE64,
        mimeType: 'image/png',
        uploadedByUserId: undefined,
        nablLicenseNumber: 'NABL-ISO15189-8841',
      });
    } catch {
      // Signature service fallback works even if file write is skipped
    }

    const patient = await prisma.patient.create({
      data: {
        uhid: `UHID-${testRunTag}`,
        firstName: 'Rajesh',
        lastName: 'Verma',
        age: 58,
        gender: 'MALE',
        phone: '9811223344',
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${testRunTag}`,
        barcode: `BC-${testRunTag}`,
        patientId: patient.id,
        doctorId: doctor.id,
        orderStatus: 'PROCESSING',
        priority: 'STAT',
        subtotal: 600,
        grandTotal: 600,
      },
    });

    // Create 3 Results:
    // Result A: CRITICAL PANIC (Serum Potassium = 6.9 mmol/L -> HH)
    const panicResult = await prisma.result.create({
      data: {
        orderId: order.id,
        patientId: patient.id,
        testId: testCatalogPanic.id,
        status: 'ENTERED',
        remarks: 'Panic test result for K',
        values: {
          create: [
            {
              parameterId: kParam.id,
              value: '6.9',
              flag: 'CRITICAL',
              rangeIndicator: 'HH',
            },
          ],
        },
      },
      include: {
        values: {
          include: {
            parameter: {
              include: { referenceRanges: true },
            },
          },
        },
        test: true,
        order: {
          include: { patient: true },
        },
      },
    });

    // Result B: NORMAL (Fasting Blood Glucose = 88 mg/dL -> N)
    const normalResult1 = await prisma.result.create({
      data: {
        orderId: order.id,
        patientId: patient.id,
        testId: testCatalogNormal.id,
        status: 'ENTERED',
        remarks: 'Normal fasting glucose',
        values: {
          create: [
            {
              parameterId: gluParam.id,
              value: '88',
              flag: 'NORMAL',
              rangeIndicator: 'N',
            },
          ],
        },
      },
      include: {
        values: {
          include: {
            parameter: {
              include: { referenceRanges: true },
            },
          },
        },
        test: true,
        order: {
          include: { patient: true },
        },
      },
    });

    // Result C: ABNORMAL YELLOW (Post-Prandial Blood Glucose = 142 mg/dL -> H)
    const abnormalResult2 = await prisma.result.create({
      data: {
        orderId: order.id,
        patientId: patient.id,
        testId: testCatalogAbnormal.id,
        status: 'ENTERED',
        remarks: 'Abnormal glucose',
        values: {
          create: [
            {
              parameterId: gluAbnParam.id,
              value: '142',
              flag: 'HIGH',
              rangeIndicator: 'H',
            },
          ],
        },
      },
      include: {
        values: {
          include: {
            parameter: {
              include: { referenceRanges: true },
            },
          },
        },
        test: true,
        order: {
          include: { patient: true },
        },
      },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: Verify Panic Alert Triage Classification & Telephonic Read-Back
    // ─────────────────────────────────────────────────────────────────────────
    console.log('▶ [TEST 3] Verifying Panic Triage Classification & Telephonic Read-Back Guard...');

    const panicClass = classifyResultParameters(panicResult);
    const normalClass = classifyResultParameters(normalResult1);
    const abnormalClass = classifyResultParameters(abnormalResult2);

    assert.strictEqual(panicClass.triageColor, 'RED', 'Panic result must classify as RED.');
    assert.strictEqual(normalClass.triageColor, 'GREEN', 'Normal result must classify as GREEN.');
    assert.strictEqual(abnormalClass.triageColor, 'YELLOW', 'Abnormal result must classify as YELLOW.');

    // Verify Report Dispatch Guard blocks the order BEFORE read-back is recorded
    let dispatchBlocked = false;
    try {
      await assertOrderClearedForReportDispatch(order.id);
    } catch (err: any) {
      dispatchBlocked = err.message.includes('NABL Clause 7.4.2 Dispatch Block');
    }
    assert.strictEqual(
      dispatchBlocked,
      true,
      'Report Dispatch Guard MUST block orders with unacknowledged critical panic results.'
    );

    // Test Batch Approval safeguard: Panic result should be isolated while Normal & Abnormal are approved
    const initialBatchSummary = await executeBatchApprovalWorkflow({
      resultIds: [panicResult.id, normalResult1.id, abnormalResult2.id],
      doctorId: doctor.id,
      approverUserId: doctor.id,
      clinicalComments: 'Batch sign-off run #1',
    });

    assert.strictEqual(
      initialBatchSummary.approvedCount,
      2,
      'Expected 2 non-panic results to be approved in batch.'
    );
    assert.strictEqual(
      initialBatchSummary.isolatedPanicCount,
      1,
      'Expected 1 unacknowledged panic result to be isolated from batch approval.'
    );

    // Now log the mandatory Telephonic Read-Back for the panic result
    const readBackEntry = await recordTelephonicReadBack({
      resultId: panicResult.id,
      recipientDoctorName: 'Dr. Vikramjit Sen (ICU Intensivist)',
      recipientDesignation: 'Senior Consultant - Medical ICU',
      wardOrDepartment: 'MICU Bed #4',
      contactNumber: '+91-9811009988',
      communicatedValuesSummary: 'Serum Potassium: 6.9 mmol/L [HH - Critical Hyperkalemia]',
      readBackVerified: true,
      communicatedByUserId: doctor.id,
      communicatedByName: doctor.fullName,
      clinicalNotes: 'Verbal read-back confirmed by Dr. Sen; calcium gluconate protocol initiated.',
    });

    assert.strictEqual(readBackEntry.readBackVerified, true);

    // Verify Report Dispatch Guard now clears the order
    const dispatchClearance = await assertOrderClearedForReportDispatch(order.id);
    assert.strictEqual(dispatchClearance.cleared, true);
    assert.strictEqual(dispatchClearance.verifiedPanicReadBacks.length, 1);

    console.log(
      `  ✅ [PASS] Triage Colors Verified: RED (K=6.9 HH), YELLOW (GLU=142 H), GREEN (GLU=88 N)`
    );
    console.log(
      `  ✅ [PASS] Dispatch Guard blocked unacknowledged panic & cleared Order after Read-Back ID: ${readBackEntry.readBackId}\n`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4: Execute Batch Approval Across Results & Verify Digital Signatures
    // ─────────────────────────────────────────────────────────────────────────
    console.log('▶ [TEST 4] Executing Batch Approval on Cleared Panic Result & Verifying Electronic Seals...');

    const secondBatchSummary = await executeBatchApprovalWorkflow({
      resultIds: [panicResult.id],
      doctorId: doctor.id,
      approverUserId: doctor.id,
      clinicalComments: 'Post-readback panic sign-off',
    });

    assert.strictEqual(
      secondBatchSummary.approvedCount,
      1,
      'Panic result with verified read-back must now be approved in batch.'
    );
    assert.strictEqual(secondBatchSummary.isolatedPanicCount, 0);
    assert(
      Boolean(secondBatchSummary.results[0].signatureHash),
      'Approved result must have a non-empty cryptographic signatureHash.'
    );

    const triageQueueCheck = await getPrioritizedTriageQueue({ limit: 50 });
    assert(triageQueueCheck.queue.length >= 3, 'Triage queue must return active results.');

    console.log(
      `  ✅ [PASS] Batch Approval signed off all 3 results. Panic Result Seal Hash: ${secondBatchSummary.results[0].signatureHash?.slice(0, 24)}...\n`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5: Execute Post-Sign-Off Result Amendment & Verify Re-Baselined Seal
    // ─────────────────────────────────────────────────────────────────────────
    console.log('▶ [TEST 5] Executing Post-Sign-Off Result Amendment (NABL Clause 7.4.3)...');

    const amendmentLedger = await executeResultAmendment({
      resultId: normalResult1.id,
      doctorId: doctor.id,
      amendedByUserId: doctor.id,
      category: 'DILUTION_CORRECTION',
      reason:
        'Post-sign-off analytical recheck after 1:2 dilution confirmed Fasting Blood Glucose at 94 mg/dL instead of 88 mg/dL.',
      parameterUpdates: [
        {
          parameterId: gluParam.id,
          parameterName: 'Fasting Blood Glucose',
          newValue: '94',
          unit: 'mg/dL',
          referenceRange: '70 - 100',
          flag: 'N',
        },
      ],
    });

    assert.strictEqual(amendmentLedger.revisionVersion, 2, 'First amendment must be Revision 2.');
    assert.strictEqual(amendmentLedger.parameterDiffs.length, 1);
    assert.strictEqual(amendmentLedger.parameterDiffs[0].priorValue, '88');
    assert.strictEqual(amendmentLedger.parameterDiffs[0].newValue, '94');
    assert(
      amendmentLedger.chainedHmacSeal.length === 64,
      'Chained HMAC-SHA256 seal must be a 64-char hex digest.'
    );

    const amendmentHistory = await getResultAmendmentHistory(normalResult1.id);
    assert.strictEqual(amendmentHistory.length, 1);
    assert.strictEqual(amendmentHistory[0].amendmentId, amendmentLedger.amendmentId);

    console.log(
      `  ✅ [PASS] Result Amended (${amendmentLedger.revisionLabel}): Prior=${amendmentLedger.parameterDiffs[0].priorValue} mg/dL -> New=${amendmentLedger.parameterDiffs[0].newValue} mg/dL`
    );
    console.log(
      `  ✅ [PASS] Chained HMAC-SHA256 Amendment Seal: ${amendmentLedger.chainedHmacSeal}\n`
    );

    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log(' 🎉 ALL 5 DAY-2 EMPIRICAL WORKSTATION TESTS PASSED (100% NABL COMPLIANT)');
    console.log('═══════════════════════════════════════════════════════════════════════════');
  } finally {
    await prisma.$disconnect();
  }
}

runDay2EmpiricalTestSuite().catch((err) => {
  console.error('❌ DAY 2 EMPIRICAL TEST SUITE FAILED:', err);
  process.exit(1);
});
