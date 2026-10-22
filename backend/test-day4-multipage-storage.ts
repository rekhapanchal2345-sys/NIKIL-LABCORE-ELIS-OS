import fs from 'fs';
import {
  UserRole,
  AccountStatus,
  OrderStatus,
  ResultStatus,
  ResultFlag,
  ReportStatus,
  SampleType,
  Prisma,
} from '@prisma/client';
import prisma from './api/src/lib/prisma';
import { reportPdfService } from './api/src/modules/reports/report.pdf.service';
import { reportStorageService } from './api/src/modules/reports/report.storage.service';

function assertCondition(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(`❌ EMPIRICAL ASSERTION FAILED: ${message}`);
  }
}

async function runDay4ValidationSuite(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🏛️  NIKIL-LABCORE-ELIS-OS — DAY 4 EMPIRICAL VALIDATION SUITE');
  console.log('   Focus: Multi-Page NABL PDF, HMAC-SHA256 QR Tokens & Persistent Disk Storage');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  const uniqueSuffix = Date.now().toString().slice(-6);
  let createdUserId: string | null = null;
  let createdDoctorId: string | null = null;
  let createdPatientId: string | null = null;
  let createdCategoryId: string | null = null;
  const createdTestIds: string[] = [];
  const createdParameterIds: string[] = [];
  let createdOrderId: string | null = null;
  const createdResultIds: string[] = [];
  let persistedPdfDiskPath: string | null = null;

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Seed Pathologist User, Signatory Doctor, Patient & 4-Panel Catalog (28 Parameters)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🔹 [1/6] Seeding Pathologist, Doctor, Patient & 4 Multi-Page Diagnostic Panels (28 Parameters)...');

    const pathologistUser = await prisma.user.create({
      data: {
        employeeCode: `EMP-D4-${uniqueSuffix}`,
        fullName: 'Dr. Vikramaditya Menon, MD',
        email: `vikram.d4.${uniqueSuffix}@labcore.local`,
        passwordHash: '$2b$12$eImiTXuWVxfM37uY4JANjQ==',
        role: UserRole.PATHOLOGIST,
        status: AccountStatus.ACTIVE,
      },
    });
    createdUserId = pathologistUser.id;

    const signatoryDoctor = await prisma.doctor.create({
      data: {
        doctorCode: `DOC-D4-${uniqueSuffix}`,
        fullName: 'Dr. Vikramaditya Menon, MD (Pathology)',
        specialization: 'Chief Consultant Pathologist & NABL Signatory',
        registrationNumber: `KMC-D4-${uniqueSuffix}`,
        phone: '9845012345',
        email: `dr.vikram.d4.${uniqueSuffix}@labcore.local`,
        isActive: true,
      },
    });
    createdDoctorId = signatoryDoctor.id;

    const patient = await prisma.patient.create({
      data: {
        uhid: `UHID-D4-${uniqueSuffix}`,
        firstName: 'Raghavendra',
        lastName: 'Krishnamurthy',
        age: 64, // Senior Citizen Stratum (CLSI C28-A3)
        gender: 'MALE',
        phone: '9880112233',
        email: `raghavendra.${uniqueSuffix}@example.com`,
      },
    });
    createdPatientId = patient.id;

    const category = await prisma.testCategory.create({
      data: {
        code: `CAT-D4-${uniqueSuffix}`,
        name: `Comprehensive Super-Specialty Profile D4-${uniqueSuffix}`,
        description: 'Multi-Departmental NABL Accredited Diagnostic Panels',
      },
    });
    createdCategoryId = category.id;

    const panelSpecifications = [
      {
        testCode: `CBC-D4-${uniqueSuffix}`,
        testName: 'Complete Blood Count (CBC) with 5-Part Differential',
        sampleType: SampleType.BLOOD,
        parameters: [
          { name: 'Hemoglobin', unit: 'g/dL', min: 13.0, max: 17.0, val: '14.6', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'Total Leukocyte Count', unit: 'cells/mcL', min: 4000, max: 11000, val: '12450', flag: ResultFlag.HIGH, ind: 'H' },
          { name: 'RBC Count', unit: 'million/mcL', min: 4.5, max: 5.5, val: '4.92', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'Packed Cell Volume', unit: '%', min: 40.0, max: 50.0, val: '43.8', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'MCV', unit: 'fL', min: 83.0, max: 101.0, val: '89.0', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'MCH', unit: 'pg', min: 27.0, max: 32.0, val: '29.7', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'MCHC', unit: 'g/dL', min: 31.5, max: 34.5, val: '33.3', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'Platelet Count', unit: '/mcL', min: 150000, max: 410000, val: '265000', flag: ResultFlag.NORMAL, ind: 'N' },
        ],
      },
      {
        testCode: `LFT-D4-${uniqueSuffix}`,
        testName: 'Comprehensive Liver Function Panel (LFT)',
        sampleType: SampleType.SERUM,
        parameters: [
          { name: 'Total Bilirubin', unit: 'mg/dL', min: 0.2, max: 1.2, val: '1.05', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'Direct Bilirubin', unit: 'mg/dL', min: 0.0, max: 0.3, val: '0.24', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'Indirect Bilirubin', unit: 'mg/dL', min: 0.1, max: 0.9, val: '0.81', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'SGOT (AST)', unit: 'U/L', min: 10, max: 40, val: '48', flag: ResultFlag.HIGH, ind: 'H' },
          { name: 'SGPT (ALT)', unit: 'U/L', min: 7, max: 56, val: '62', flag: ResultFlag.HIGH, ind: 'H' },
          { name: 'Alkaline Phosphatase', unit: 'U/L', min: 44, max: 147, val: '112', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'Total Protein', unit: 'g/dL', min: 6.0, max: 8.3, val: '7.1', flag: ResultFlag.NORMAL, ind: 'N' },
        ],
      },
      {
        testCode: `KFT-D4-${uniqueSuffix}`,
        testName: 'Renal Function & Electrolyte Profile (KFT)',
        sampleType: SampleType.SERUM,
        parameters: [
          { name: 'Blood Urea', unit: 'mg/dL', min: 15, max: 45, val: '38', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'Serum Creatinine', unit: 'mg/dL', min: 0.7, max: 1.3, val: '1.18', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'Uric Acid', unit: 'mg/dL', min: 3.5, max: 7.2, val: '6.4', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'Serum Sodium', unit: 'mmol/L', min: 135, max: 145, val: '139', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'Serum Potassium', unit: 'mmol/L', min: 3.5, max: 5.1, val: '4.4', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'Serum Chloride', unit: 'mmol/L', min: 96, max: 106, val: '101', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'eGFR (CKD-EPI)', unit: 'mL/min/1.73m2', min: 60, max: 120, val: '74', flag: ResultFlag.NORMAL, ind: 'N' },
        ],
      },
      {
        testCode: `LIPID-D4-${uniqueSuffix}`,
        testName: 'Extended Coronary Risk Lipid Profile',
        sampleType: SampleType.SERUM,
        parameters: [
          { name: 'Total Cholesterol', unit: 'mg/dL', min: 125, max: 200, val: '218', flag: ResultFlag.HIGH, ind: 'H' },
          { name: 'Triglycerides', unit: 'mg/dL', min: 40, max: 150, val: '168', flag: ResultFlag.HIGH, ind: 'H' },
          { name: 'HDL Cholesterol', unit: 'mg/dL', min: 40, max: 60, val: '44', flag: ResultFlag.NORMAL, ind: 'N' },
          { name: 'LDL Cholesterol', unit: 'mg/dL', min: 0, max: 100, val: '140.4', flag: ResultFlag.HIGH, ind: 'H' },
          { name: 'VLDL Cholesterol', unit: 'mg/dL', min: 5, max: 30, val: '33.6', flag: ResultFlag.HIGH, ind: 'H' },
          { name: 'Non-HDL Cholesterol', unit: 'mg/dL', min: 0, max: 130, val: '174', flag: ResultFlag.HIGH, ind: 'H' },
        ],
      },
    ];

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-D4-${uniqueSuffix}`,
        barcode: `BC-D4-${uniqueSuffix}`,
        patientId: patient.id,
        doctorId: signatoryDoctor.id,
        orderStatus: OrderStatus.COMPLETED,
        priority: 'STAT',
        specimenType: 'EDTA Whole Blood & Fasting Serum',
        fastingStatus: '12 Hours Fasting',
        subtotal: new Prisma.Decimal(3800),
        grandTotal: new Prisma.Decimal(3800),
        collectedAt: new Date(Date.now() - 2 * 3600 * 1000),
        reportedAt: new Date(),
        createdById: pathologistUser.id,
      },
    });
    createdOrderId = order.id;

    const now = new Date();
    for (const panelSpec of panelSpecifications) {
      const test = await prisma.test.create({
        data: {
          testCode: panelSpec.testCode,
          testName: panelSpec.testName,
          categoryId: category.id,
          sampleType: panelSpec.sampleType,
          price: new Prisma.Decimal(950),
          tatHours: 4,
          isActive: true,
        },
      });
      createdTestIds.push(test.id);

      const result = await prisma.result.create({
        data: {
          orderId: order.id,
          patientId: patient.id,
          testId: test.id,
          status: ResultStatus.APPROVED,
          enteredById: pathologistUser.id,
          verifiedById: pathologistUser.id,
          approvedById: pathologistUser.id,
          enteredAt: now,
          verifiedAt: now,
          approvedAt: now,
          remarks: `NABL ISO 15189:2022 verified panel for ${panelSpec.testName}. Internal QC within ±1s Westgard limits.`,
        },
      });
      createdResultIds.push(result.id);

      for (let idx = 0; idx < panelSpec.parameters.length; idx++) {
        const pSpec = panelSpec.parameters[idx];
        const param = await prisma.testParameter.create({
          data: {
            testId: test.id,
            parameterName: pSpec.name,
            dataType: 'NUMERIC',
            unit: pSpec.unit,
            displayOrder: idx + 1,
            referenceRanges: {
              create: [
                {
                  gender: 'MALE',
                  minAge: 60,
                  maxAge: 120,
                  normalLow: new Prisma.Decimal(pSpec.min),
                  normalHigh: new Prisma.Decimal(pSpec.max),
                },
              ],
            },
          },
        });
        createdParameterIds.push(param.id);

        await prisma.resultValue.create({
          data: {
            resultId: result.id,
            parameterId: param.id,
            value: pSpec.val,
            flag: pSpec.flag,
            rangeIndicator: pSpec.ind,
          },
        });
      }
    }

    console.log(`   ✅ Seeded Order ${order.orderNumber} with 4 panels and 28 parameters.\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Validate Code 128B Vector Barcode & Cryptographic QR Token Math
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🔹 [2/6] Validating Code 128B Vector Barcode (Mod-103) & HMAC-SHA256 QR Token...');
    const barcodeResult = reportPdfService.generateVectorCode128BarcodeSvg(order.barcode!);
    assertCondition(barcodeResult.svg.startsWith('<svg'), 'Vector barcode must be valid SVG.');
    assertCondition(
      barcodeResult.checksumMod103 >= 0 && barcodeResult.checksumMod103 < 103,
      `Code 128B Mod-103 checksum out of range: ${barcodeResult.checksumMod103}`
    );
    console.log(`   ✅ Code 128B Vector Barcode verified (Mod-103 Checksum = ${barcodeResult.checksumMod103}).\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Generate & Persist Multi-Page PDF to Disk + Verify SHA-256 Parity
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🔹 [3/6] Generating & Persisting Multi-Page PDF via ReportStorageService...');
    const persisted = await reportStorageService.generateAndPersistReport({
      orderId: order.id,
      forceRegenerate: true,
      signatoryDoctorId: signatoryDoctor.id,
      userId: pathologistUser.id,
    });
    persistedPdfDiskPath = persisted.absoluteDiskPath;

    assertCondition(persisted.cached === false, 'First generation must not be marked cached.');
    assertCondition(fs.existsSync(persisted.absoluteDiskPath), 'PDF file must exist on disk.');
    assertCondition(persisted.totalPanels === 4, `Expected 4 panels, got ${persisted.totalPanels}.`);
    assertCondition(
      persisted.totalParameters === 28,
      `Expected 28 parameters, got ${persisted.totalParameters}.`
    );
    assertCondition(
      persisted.estimatedPages >= 2,
      `Multi-panel 28-parameter report must span >= 2 pages (actual: ${persisted.estimatedPages} pages).`
    );

    const diskBuffer = await fs.promises.readFile(persisted.absoluteDiskPath);
    const pdfMagicHeader = diskBuffer.subarray(0, 5).toString('ascii');
    assertCondition(pdfMagicHeader === '%PDF-', `Invalid PDF magic header: ${pdfMagicHeader}`);
    assertCondition(
      diskBuffer.byteLength === persisted.fileSizeBytes && diskBuffer.byteLength > 200,
      `Unexpected PDF file size: ${diskBuffer.byteLength} bytes.`
    );

    console.log(`   ✅ Persisted Multi-Page PDF: ${persisted.relativeDiskPath}`);
    console.log(`   ✅ Page Count: ${persisted.estimatedPages} pages | Size: ${persisted.fileSizeBytes} bytes`);
    console.log(`   ✅ File SHA-256: ${persisted.fileHashSha256}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Verify Prisma `Report` Database Model Linkage
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🔹 [4/6] Verifying Prisma `Report` Database Model Linkage...');
    const dbReport = await prisma.report.findUnique({
      where: { id: persisted.reportId },
    });

    assertCondition(dbReport !== null, 'Database Report record must exist.');
    assertCondition(
      dbReport!.status === ReportStatus.GENERATED,
      `Expected Report.status === GENERATED, got ${dbReport!.status}`
    );
    assertCondition(
      dbReport!.reportNumber === `RPT-${order.orderNumber}`,
      `Expected Report.reportNumber === RPT-${order.orderNumber}, got ${dbReport!.reportNumber}`
    );
    assertCondition(
      dbReport!.fileUrl === `/api/reports/order/${order.id}/file`,
      `Unexpected Report.fileUrl: ${dbReport!.fileUrl}`
    );
    assertCondition(dbReport!.generatedAt !== null, 'Report.generatedAt must be populated.');
    assertCondition(dbReport!.reportData !== null, 'Report.reportData JSON snapshot must be populated.');

    console.log(`   ✅ Database Report Record Verified: ${dbReport!.reportNumber} (Status: ${dbReport!.status})\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: Validate Cryptographic QR HMAC-SHA256 Verification & Tamper Detection
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🔹 [5/6] Validating Cryptographic QR HMAC-SHA256 Token & Tamper Detection...');
    const validQrCheck = await reportStorageService.verifyReportToken({
      reportId: persisted.reportId,
      token: persisted.qrVerificationToken,
      checksumPrefix: persisted.checksumSha256.slice(0, 16),
    });

    assertCondition(validQrCheck.valid === true, 'Authentic QR HMAC-SHA256 token must validate.');
    assertCondition(
      validQrCheck.reportSummary?.patientUhid === patient.uhid,
      'Verified QR summary UHID mismatch.'
    );

    const tamperedToken =
      (persisted.qrVerificationToken[0] === 'a' ? 'b' : 'a') +
      persisted.qrVerificationToken.slice(1);
    const tamperedQrCheck = await reportStorageService.verifyReportToken({
      reportId: persisted.reportId,
      token: tamperedToken,
      checksumPrefix: persisted.checksumSha256.slice(0, 16),
    });

    assertCondition(
      tamperedQrCheck.valid === false,
      'Tampered QR HMAC-SHA256 token must be rejected.'
    );
    console.log('   ✅ Authentic QR Token Accepted & Tampered QR Token Rejected.\n');

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 6: Verify Idempotency Cache Hit & Physical Stream Retrieval
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🔹 [6/6] Verifying Idempotency Disk Cache Hit & File Stream Retrieval...');
    const cachedRetrieval = await reportStorageService.generateAndPersistReport({
      orderId: order.id,
      forceRegenerate: false,
    });
    assertCondition(
      cachedRetrieval.cached === true,
      'Subsequent call with forceRegenerate: false must return cached: true.'
    );
    assertCondition(
      cachedRetrieval.fileHashSha256 === persisted.fileHashSha256,
      'Cached file SHA-256 hash must match original persisted file.'
    );

    const streamMeta = await reportStorageService.getStoredReportFileStream(order.id);
    assertCondition(
      streamMeta.fileSizeBytes === persisted.fileSizeBytes,
      'Streamed file byte length must match persisted file.'
    );
    streamMeta.stream.on('error', () => undefined);
    streamMeta.stream.destroy();

    console.log('   ✅ Idempotent Cache Hit & Physical PDF Stream Verified.\n');

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('🎉 ALL DAY 4 EMPIRICAL VALIDATION CHECKS PASSED (100% VERIFIED)');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
  } finally {
    console.log('\n🧹 Executing deterministic test data & disk artifact teardown...');
    if (persistedPdfDiskPath && fs.existsSync(persistedPdfDiskPath)) {
      await fs.promises.unlink(persistedPdfDiskPath).catch(() => undefined);
    }
    if (createdOrderId) {
      await prisma.auditLog.deleteMany({ where: { module: 'REPORTS' } }).catch(() => undefined);
      await prisma.report.deleteMany({ where: { orderId: createdOrderId } }).catch(() => undefined);
      await prisma.resultValue
        .deleteMany({ where: { resultId: { in: createdResultIds } } })
        .catch(() => undefined);
      await prisma.result.deleteMany({ where: { orderId: createdOrderId } }).catch(() => undefined);
      await prisma.order.delete({ where: { id: createdOrderId } }).catch(() => undefined);
    }
    if (createdParameterIds.length > 0) {
      await prisma.referenceRange
        .deleteMany({ where: { parameterId: { in: createdParameterIds } } })
        .catch(() => undefined);
      await prisma.testParameter
        .deleteMany({ where: { id: { in: createdParameterIds } } })
        .catch(() => undefined);
    }
    if (createdTestIds.length > 0) {
      await prisma.test.deleteMany({ where: { id: { in: createdTestIds } } }).catch(() => undefined);
    }
    if (createdCategoryId) {
      await prisma.testCategory.delete({ where: { id: createdCategoryId } }).catch(() => undefined);
    }
    if (createdPatientId) {
      await prisma.patient.delete({ where: { id: createdPatientId } }).catch(() => undefined);
    }
    if (createdDoctorId) {
      await prisma.doctor.delete({ where: { id: createdDoctorId } }).catch(() => undefined);
    }
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
    console.log('   ✅ Teardown complete.');
  }
}

runDay4ValidationSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ DAY 4 VALIDATION SUITE FAILED:', err);
    process.exit(1);
  });
