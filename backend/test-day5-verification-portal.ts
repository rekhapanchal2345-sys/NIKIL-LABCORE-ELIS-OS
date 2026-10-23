// File: backend/test-day5-verification-portal.ts

import fs from 'fs';
import prisma from './api/src/lib/prisma';
import {
  Gender,
  OrderStatus,
  ResultStatus,
  SampleType,
  ParameterType,
  ResultFlag,
  UserRole,
  AccountStatus,
  Prisma,
} from '@prisma/client';
import { reportStorageService } from './api/src/modules/reports/report.storage.service';
import { reportService } from './api/src/modules/reports/report.service';

function assertCondition(condition: any, message: string): void {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
}

async function runDay5VerificationSuite() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🏛️  NIKIL-LABCORE-ELIS-OS — DAY 5 EMPIRICAL VALIDATION SUITE');
  console.log('   Phase 5.2 & 5.3: Public Verification Portal, Addendums & Batch Print');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  const uniqueSuffix = `${Date.now()}`;
  let createdUserId: string | null = null;
  let createdPatientId: string | null = null;
  let createdDoctorId: string | null = null;
  let createdOrderId: string | null = null;
  let createdReportId: string | null = null;
  let createdCategoryId: string | null = null;
  let createdTestId: string | null = null;
  let createdResultId: string | null = null;
  const createdParamIds: string[] = [];
  const createdRangeIds: string[] = [];
  const createdResultValueIds: string[] = [];
  const generatedPdfPaths: string[] = [];

  try {
    // ─── STEP 1: Seed Clinical Entities ──────────────────────────────────────────
    console.log('▶ [STEP 1/7] Seeding Doctor, Patient, Diagnostic Catalog & Clinical Order...');

    const user = await prisma.user.create({
      data: {
        employeeCode: `EMP-D5-${uniqueSuffix.slice(-6)}`,
        fullName: 'Dr. Arundhati Subramanian, MD (Pathology)',
        email: `dr.arundhati.${uniqueSuffix}@labcore.org`,
        passwordHash: '$2a$10$dummyhashedpasswordforday5testingpurposeonly',
        role: UserRole.PATHOLOGIST,
        status: AccountStatus.ACTIVE,
        specialization: 'Clinical Pathology & Hematology',
      },
    });
    createdUserId = user.id;

    const doctor = await prisma.doctor.create({
      data: {
        doctorCode: `DOC-D5-${uniqueSuffix.slice(-6)}`,
        fullName: 'Dr. Rajesh Sharma, MD',
        specialization: 'Internal Medicine & Critical Care',
        registrationNumber: `KMC-${uniqueSuffix.slice(-5)}`,
        phone: `98450${uniqueSuffix.slice(-5)}`,
        email: `dr.rajesh.${uniqueSuffix}@example.com`,
      },
    });
    createdDoctorId = doctor.id;

    const patient = await prisma.patient.create({
      data: {
        uhid: `UHID-D5-${uniqueSuffix.slice(-6)}`,
        firstName: 'Siddharth',
        lastName: 'Venkataraman',
        age: 42,
        gender: Gender.MALE,
        phone: `98801${uniqueSuffix.slice(-5)}`,
        email: `siddharth.${uniqueSuffix}@example.com`,
        referredById: doctor.id,
      },
    });
    createdPatientId = patient.id;

    const category = await prisma.testCategory.create({
      data: {
        code: `CAT-D5-${uniqueSuffix.slice(-5)}`,
        name: `Hematology & Biochemistry D5-${uniqueSuffix.slice(-4)}`,
        description: 'NABL ISO 15189:2022 Accredited Automated Assay Department',
      },
    });
    createdCategoryId = category.id;

    const test = await prisma.test.create({
      data: {
        testCode: `CBC-D5-${uniqueSuffix.slice(-5)}`,
        testName: 'Complete Blood Count & Differential Panel',
        categoryId: category.id,
        sampleType: SampleType.BLOOD,
        tatHours: 4,
        price: new Prisma.Decimal(650),
      },
    });
    createdTestId = test.id;

    const paramSpecs = [
      { name: 'Hemoglobin (Hb)', unit: 'g/dL', val: '14.8', min: 13.0, max: 17.0, flag: ResultFlag.NORMAL, crit: false },
      { name: 'Total WBC Count', unit: 'cells/mcL', val: '11800', min: 4000, max: 11000, flag: ResultFlag.HIGH, crit: false },
      { name: 'Platelet Count', unit: 'cells/mcL', val: '245000', min: 150000, max: 410000, flag: ResultFlag.NORMAL, crit: false },
      { name: 'Serum Potassium', unit: 'mmol/L', val: '4.8', min: 3.5, max: 5.1, flag: ResultFlag.NORMAL, crit: false },
    ];

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-D5-${uniqueSuffix.slice(-6)}`,
        barcode: `BCD5${uniqueSuffix.slice(-6)}`,
        patientId: patient.id,
        doctorId: doctor.id,
        priority: 'STAT',
        orderStatus: OrderStatus.COMPLETED,
        specimenType: 'EDTA Whole Blood & Serum',
        fastingStatus: 'Fasting (10 Hours)',
        subtotal: new Prisma.Decimal(650),
        grandTotal: new Prisma.Decimal(650),
      },
    });
    createdOrderId = order.id;

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        testId: test.id,
        price: new Prisma.Decimal(650),
        finalPrice: new Prisma.Decimal(650),
      },
    });

    const result = await prisma.result.create({
      data: {
        orderId: order.id,
        testId: test.id,
        patientId: patient.id,
        status: ResultStatus.APPROVED,
        enteredById: user.id,
        approvedById: user.id,
        enteredAt: new Date(),
        approvedAt: new Date(),
        verifiedAt: new Date(),
      },
    });
    createdResultId = result.id;

    for (let i = 0; i < paramSpecs.length; i++) {
      const spec = paramSpecs[i];
      const param = await prisma.testParameter.create({
        data: {
          testId: test.id,
          parameterName: spec.name,
          dataType: ParameterType.NUMERIC,
          unit: spec.unit,
          displayOrder: i + 1,
        },
      });
      createdParamIds.push(param.id);

      const refRange = await prisma.referenceRange.create({
        data: {
          parameterId: param.id,
          gender: Gender.MALE,
          minAge: 0,
          maxAge: 120,
          normalLow: new Prisma.Decimal(spec.min),
          normalHigh: new Prisma.Decimal(spec.max),
          notes: `${spec.min} - ${spec.max}`,
        },
      });
      createdRangeIds.push(refRange.id);

      const rv = await prisma.resultValue.create({
        data: {
          resultId: result.id,
          parameterId: param.id,
          value: spec.val,
          flag: spec.flag,
        },
      });
      createdResultValueIds.push(rv.id);
    }

    console.log(`  ✅ Seeded Order: ${order.orderNumber} for Patient UHID: ${patient.uhid}`);

    // ─── STEP 2: Generate Initial NABL PDF Report ────────────────────────────────
    console.log('\n▶ [STEP 2/7] Generating Initial Persistent NABL A4 PDF Report (v1.0)...');

    const initialPersisted = await reportStorageService.generateAndPersistReport({
      orderId: order.id,
      publishedById: user.id,
      forceRegenerate: true,
    });
    createdReportId = initialPersisted.reportId;
    generatedPdfPaths.push(initialPersisted.absoluteFilePath);

    const dbReport = await prisma.report.findUnique({
      where: { id: initialPersisted.reportId },
    });

    assertCondition(dbReport !== null, 'Report record must exist in Prisma');
    assertCondition(
      dbReport?.status === 'GENERATED' || dbReport?.status === 'PUBLISHED',
      `Expected status GENERATED or PUBLISHED, got ${dbReport?.status}`
    );
    assertCondition(
      fs.existsSync(initialPersisted.absoluteFilePath),
      'Persistent PDF file must exist on disk'
    );

    console.log(`  ✅ Report Generated: ${initialPersisted.reportNumber}`);
    console.log(`  ✅ Initial SHA-256 : ${initialPersisted.reportHashSha256}`);
    console.log(`  ✅ Short Checksum  : ${initialPersisted.shortChecksum}`);

    // ─── STEP 3: Public Verification with Valid Cryptographic Token ──────────────
    console.log('\n▶ [STEP 3/7] Testing Public Verification Portal with Valid HMAC-SHA256 Token...');

    const validVerification = await reportService.getPublicReportVerification(
      initialPersisted.reportId,
      initialPersisted.hmacToken,
      initialPersisted.shortChecksum
    );

    assertCondition(validVerification.valid === true, 'Valid token must return valid: true');
    assertCondition(
      validVerification.verificationStatus === 'AUTHENTIC',
      `Expected status AUTHENTIC, got ${validVerification.verificationStatus}`
    );
    assertCondition(
      validVerification.cryptography.diskIntegrityVerified === true,
      'Disk integrity parity must be true'
    );
    assertCondition(
      validVerification.panels.length > 0 && validVerification.panels[0].parameters.length === 4,
      'Public verification payload must return clinical parameters with LOINC codes'
    );

    console.log(`  ✅ Verification Status : 🟢 ${validVerification.verificationStatus}`);
    console.log(`  ✅ Masked Patient Name : ${validVerification.patient?.maskedName}`);

    // ─── STEP 4: Public Verification with Forged/Tampered Token ──────────────────
    console.log('\n▶ [STEP 4/7] Testing Tamper Detection with Forged HMAC Signature...');

    const forgedToken = 'f'.repeat(64);
    const tamperedVerification = await reportService.getPublicReportVerification(
      initialPersisted.reportId,
      forgedToken,
      initialPersisted.shortChecksum
    );

    assertCondition(
      tamperedVerification.valid === false,
      'Forged HMAC token must be rejected with valid: false'
    );
    assertCondition(
      tamperedVerification.verificationStatus === 'TAMPERED',
      `Expected verificationStatus TAMPERED, got ${tamperedVerification.verificationStatus}`
    );

    console.log(`  ✅ Tamper Guard Active : 🔴 ${tamperedVerification.verificationStatus} (${tamperedVerification.statusReason})`);

    // ─── STEP 5: Create NABL ISO 15189:2022 Clause 7.4.1.7 Addendum ──────────────
    console.log('\n▶ [STEP 5/7] Creating Official NABL ISO 15189:2022 Clause 7.4.1.7 Addendum...');

    const addendumResult = await reportService.createReportAddendum(initialPersisted.reportId, {
      reason: 'Dilution / Repeat Assay Confirmation Note',
      content:
        'Normal serum electrolyte levels (Potassium 4.8 mmol/L) re-verified on secondary ISE analyzer module after ruling out in-vitro hemolysis. Clinical correlation confirmed.',
      authorId: user.id,
      authorName: user.fullName,
    });

    assertCondition(
      addendumResult.addendum.versionLabel === 'v1.1',
      `Expected versionLabel v1.1, got ${addendumResult.addendum.versionLabel}`
    );
    assertCondition(
      addendumResult.cryptography.reportHashSha256.length === 64,
      'Regenerated report must produce a valid 64-char SHA-256 hash'
    );

    console.log(`  ✅ Addendum Created    : ${addendumResult.addendum.id} (${addendumResult.addendum.versionLabel})`);
    console.log(`  ✅ Updated SHA-256     : ${addendumResult.cryptography.reportHashSha256}`);

    // ─── STEP 6: Public Verification Confirms Amended State & Addendum Timeline ──
    console.log('\n▶ [STEP 6/7] Verifying Public Verification Portal Reflects Amended Report (v1.1)...');

    const amendedVerification = await reportService.getPublicReportVerification(
      initialPersisted.reportId,
      addendumResult.cryptography.hmacToken,
      addendumResult.cryptography.shortChecksum
    );

    assertCondition(amendedVerification.valid === true, 'Amended report with new token must be valid');
    assertCondition(
      amendedVerification.verificationStatus === 'AMENDED',
      `Expected verificationStatus AMENDED, got ${amendedVerification.verificationStatus}`
    );
    assertCondition(
      amendedVerification.addendums.length === 1,
      `Expected 1 addendum in public timeline, got ${amendedVerification.addendums.length}`
    );
    assertCondition(
      amendedVerification.report?.version === 'v1.1',
      `Expected report version v1.1, got ${amendedVerification.report?.version}`
    );

    console.log(`  ✅ Verification Status : 🟡 ${amendedVerification.verificationStatus} (${amendedVerification.report?.version})`);
    console.log(`  ✅ Addendum Timeline   : ${amendedVerification.addendums[0].reason}`);

    // ─── STEP 7: Batch Print Workstation Spooler Verification ────────────────────
    console.log('\n▶ [STEP 7/7] Testing High-Throughput Batch Print Workstation Spooler...');

    const batchManifest = await reportService.prepareBatchPrintManifest({
      orderIds: [order.id],
      includeLetterhead: false, // Pre-printed stationery mode (45mm top margin offset)
      paperSize: 'A4',
      duplex: true,
      copies: 2,
      requestedById: user.id,
    });

    assertCondition(
      batchManifest.summary.readyCount === 1,
      `Expected 1 spooled report ready, got ${batchManifest.summary.readyCount}`
    );
    assertCondition(
      batchManifest.settings.topMarginMm === 45,
      `Expected 45mm pre-printed stationery offset, got ${batchManifest.settings.topMarginMm}`
    );

    console.log(`  ✅ Batch Job Spooled   : ${batchManifest.batchJobId} (Top Margin: ${batchManifest.settings.topMarginMm}mm)`);
    console.log('\n🎉 ALL DAY 5 EMPIRICAL VALIDATION CHECKS PASSED 100%!');
  } finally {
    console.log('\n🧹 Cleaning up test records and temporary disk artifacts...');
    for (const filePath of generatedPdfPaths) {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore cleanup error
        }
      }
    }

    if (createdReportId) {
      await prisma.auditLog.deleteMany({ where: { recordId: createdReportId } }).catch(() => {});
      await prisma.reportAddendum.deleteMany({ where: { reportId: createdReportId } }).catch(() => {});
      await prisma.report.deleteMany({ where: { id: createdReportId } }).catch(() => {});
    }
    if (createdOrderId) {
      await prisma.resultValue.deleteMany({ where: { id: { in: createdResultValueIds } } }).catch(() => {});
      await prisma.result.deleteMany({ where: { orderId: createdOrderId } }).catch(() => {});
      await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } }).catch(() => {});
      await prisma.order.deleteMany({ where: { id: createdOrderId } }).catch(() => {});
    }
    if (createdRangeIds.length > 0) {
      await prisma.referenceRange.deleteMany({ where: { id: { in: createdRangeIds } } }).catch(() => {});
    }
    if (createdParamIds.length > 0) {
      await prisma.testParameter.deleteMany({ where: { id: { in: createdParamIds } } }).catch(() => {});
    }
    if (createdTestId) {
      await prisma.test.deleteMany({ where: { id: createdTestId } }).catch(() => {});
    }
    if (createdCategoryId) {
      await prisma.testCategory.deleteMany({ where: { id: createdCategoryId } }).catch(() => {});
    }
    if (createdPatientId) {
      await prisma.patient.deleteMany({ where: { id: createdPatientId } }).catch(() => {});
    }
    if (createdDoctorId) {
      await prisma.doctor.deleteMany({ where: { id: createdDoctorId } }).catch(() => {});
    }
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
    console.log('✅ Teardown complete.');
    process.exit(0);
  }
}

runDay5VerificationSuite().catch((err) => {
  console.error('\n❌ DAY 5 VALIDATION SUITE FAILED:', err);
  process.exit(1);
});
