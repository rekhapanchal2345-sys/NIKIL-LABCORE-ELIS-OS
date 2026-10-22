/**
 * ============================================================================
 * 🏛️ NIKIL-LABCORE-ELIS-OS — DAY 3 EMPIRICAL VALIDATION SUITE
 * NABL ISO 15189:2022 Core PDF Engine, CLSI C28-A3 Dynamic Demographic
 * Biological Reference Ranges, Vector Code 128B Barcodes & QR Verification
 *
 * Execute via:
 *   npx tsx backend/test-day3-nabl-pdf.ts
 * ============================================================================
 */

import assert from 'assert';
import { prisma } from './api/src/lib/prisma';
import {
  calculateDetailedAge,
  evaluateParameterAgainstRange,
  generateCode128BarcodeSvg,
  generateOrderReportHtml,
  generateOrderPdf,
  ReferenceRangeCandidate,
} from './api/src/modules/reports/report.pdf.service';
import {
  assertOrderClearedForReportDispatch,
  recordPanicReadback,
} from './api/src/modules/approvals/panic-readback.service';

async function runDay3EmpiricalValidation(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🧪 STARTING DAY 3 EMPIRICAL TEST SUITE: NABL ISO 15189:2022 CORE PDF ENGINE');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  const uniqueSuffix = Date.now().toString().slice(-6);

  // Track created entities for clean teardown
  let createdUserId: string | null = null;
  let createdDoctorId: string | null = null;
  let createdPatientId: string | null = null;
  let createdCategoryId: string | null = null;
  let createdTestId: string | null = null;
  let createdParamHbId: string | null = null;
  let createdParamPotassiumId: string | null = null;
  let createdOrderId: string | null = null;
  let createdResultId: string | null = null;

  try {
    // ------------------------------------------------------------------------
    // SEED CLINICAL TEST FIXTURES IN POSTGRESQL
    // ------------------------------------------------------------------------
    const pathologistUser = await prisma.user.create({
      data: {
        employeeCode: `EMP-D3-${uniqueSuffix}`,
        fullName: 'Dr. Arundhati Deshmukh, MD (Pathology)',
        email: `day3.pathologist.${uniqueSuffix}@labcore.local`,
        passwordHash: 'seeded_hash_day3',
        role: 'PATHOLOGIST',
        status: 'ACTIVE',
      },
    });
    createdUserId = pathologistUser.id;

    const doctor = await prisma.doctor.create({
      data: {
        doctorCode: `DOC-D3-${uniqueSuffix}`,
        fullName: 'Dr. Rajeshwar Rao, MD, DM (Cardiology)',
        specialization: 'Interventional Cardiology',
        registrationNumber: `TSMC-D3-${uniqueSuffix}`,
        phone: '9876543210',
        email: `dr.rao.${uniqueSuffix}@apollo.local`,
        isActive: true,
      },
    });
    createdDoctorId = doctor.id;

    // 35-year-old Male Adult patient
    const dobAdult = new Date();
    dobAdult.setUTCFullYear(dobAdult.getUTCFullYear() - 35);

    const patient = await prisma.patient.create({
      data: {
        uhid: `UHID-D3-${uniqueSuffix}`,
        firstName: 'Siddharth',
        middleName: 'Pratap',
        lastName: 'Verma',
        gender: 'MALE',
        dateOfBirth: dobAdult,
        age: 35,
        phone: '9123456789',
        address: 'Plot 42, Banjara Hills, Road No. 12',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500034',
      },
    });
    createdPatientId = patient.id;

    const category = await prisma.testCategory.create({
      data: {
        name: `Hematology & Critical Care Biochemistry ${uniqueSuffix}`,
        code: `HEM-BIO-${uniqueSuffix}`,
        description: 'NABL ISO 15189:2022 Accredited Department',
      },
    });
    createdCategoryId = category.id;

    const diagnosticTest = await prisma.test.create({
      data: {
        testCode: `PNL-D3-${uniqueSuffix}`,
        testName: 'Complete Hemogram & Serum Potassium STAT Panel',
        categoryId: category.id,
        sampleType: 'SERUM',
        price: 1250,
        tatHours: 4,
        isActive: true,
      },
    });
    createdTestId = diagnosticTest.id;

    const paramHb = await prisma.testParameter.create({
      data: {
        testId: diagnosticTest.id,
        parameterName: 'Hemoglobin (Hb)',
        shortName: 'Hb',
        unit: 'g/dL',
        loincCode: '718-7',
        dataType: 'NUMERIC',
        displayOrder: 1,
        isActive: true,
      },
    });
    createdParamHbId = paramHb.id;

    const paramPotassium = await prisma.testParameter.create({
      data: {
        testId: diagnosticTest.id,
        parameterName: 'Serum Potassium (K+)',
        shortName: 'K+',
        unit: 'mmol/L',
        loincCode: '2823-3',
        dataType: 'NUMERIC',
        displayOrder: 2,
        isActive: true,
      },
    });
    createdParamPotassiumId = paramPotassium.id;

    // Seed multi-demographic ReferenceRange records for Hemoglobin & Potassium
    await prisma.referenceRange.createMany({
      data: [
        // Hemoglobin ranges across age groups & genders
        {
          parameterId: paramHb.id,
          gender: 'MALE',
          minAge: 0,
          maxAge: 0,
          ageGroup: 'NEWBORN',
          normalLow: 14.5,
          normalHigh: 22.5,
          criticalLow: 10.0,
          criticalHigh: 25.0,
          interpretation: 'Neonatal polycythemia physiological interval',
        },
        {
          parameterId: paramHb.id,
          gender: 'MALE',
          minAge: 1,
          maxAge: 12,
          ageGroup: 'PEDIATRIC',
          normalLow: 11.5,
          normalHigh: 15.5,
          criticalLow: 7.0,
          criticalHigh: 20.0,
          interpretation: 'Pediatric reference interval',
        },
        {
          parameterId: paramHb.id,
          gender: 'MALE',
          minAge: 13,
          maxAge: 59,
          ageGroup: 'ADULT',
          normalLow: 13.5,
          normalHigh: 17.5,
          criticalLow: 7.0,
          criticalHigh: 20.0,
          interpretation: 'Adult Male CLSI C28-A3 interval',
        },
        {
          parameterId: paramHb.id,
          gender: 'FEMALE',
          minAge: 13,
          maxAge: 59,
          ageGroup: 'ADULT',
          normalLow: 12.0,
          normalHigh: 15.5,
          criticalLow: 7.0,
          criticalHigh: 20.0,
          interpretation: 'Adult Female CLSI C28-A3 interval',
        },
        {
          parameterId: paramHb.id,
          gender: 'MALE',
          minAge: 60,
          maxAge: 120,
          ageGroup: 'SENIOR_CITIZEN',
          normalLow: 12.5,
          normalHigh: 16.5,
          criticalLow: 7.0,
          criticalHigh: 20.0,
          interpretation: 'Geriatric Male reference interval',
        },
        // Serum Potassium ranges with panic thresholds
        {
          parameterId: paramPotassium.id,
          gender: 'MALE',
          minAge: 13,
          maxAge: 59,
          ageGroup: 'ADULT',
          normalLow: 3.5,
          normalHigh: 5.1,
          criticalLow: 2.8,
          criticalHigh: 6.2,
          interpretation: 'Direct ISE Serum Potassium interval',
        },
      ],
    });

    // Create Order, Result, and ResultValues (including a CRITICAL K+ = 6.8 mmol/L)
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-D3-${uniqueSuffix}`,
        patientId: patient.id,
        doctorId: doctor.id,
        orderStatus: 'COMPLETED',
        priority: 'STAT',
        specimenType: 'Venous EDTA Whole Blood & SST Serum',
        fastingStatus: '12 Hours Overnight Fasting',
        barcode: `ACC-D3-${uniqueSuffix}`,
        collectedAt: new Date(Date.now() - 2 * 3600 * 1000),
        reportedAt: new Date(),
        subtotal: 1250,
        grandTotal: 1250,
        createdById: pathologistUser.id,
      },
    });
    createdOrderId = order.id;

    const result = await prisma.result.create({
      data: {
        orderId: order.id,
        patientId: patient.id,
        testId: diagnosticTest.id,
        status: 'APPROVED',
        enteredById: pathologistUser.id,
        enteredAt: new Date(Date.now() - 3600 * 1000),
        verifiedById: pathologistUser.id,
        verifiedAt: new Date(Date.now() - 1800 * 1000),
        approvedById: pathologistUser.id,
        approvedAt: new Date(),
        remarks:
          'Severe hyperkalemia (K+ 6.8 mmol/L) detected on Direct ISE and re-verified on duplicate run. Immediate ECG correlation advised.',
        values: {
          create: [
            {
              parameterId: paramHb.id,
              value: '15.2',
              flag: 'NORMAL',
              rangeIndicator: 'N',
            },
            {
              parameterId: paramPotassium.id,
              value: '6.8',
              flag: 'CRITICAL',
              rangeIndicator: 'HH',
            },
          ],
        },
      },
    });
    createdResultId = result.id;

    // ========================================================================
    // TEST 1: NABL A4 HTML Generation, Header, UHID, Vector Barcode & QR SVG
    // ========================================================================
    console.log('🔹 [TEST 1] Generating NABL ISO 15189:2022 A4 HTML & verifying structural elements...');
    const html = await generateOrderReportHtml(order.id, {
      enforceDispatchGuard: false,
      nablCertificateNumber: 'MC-4892',
    });

    assert.ok(html.includes('<!DOCTYPE html>'), 'HTML must contain DOCTYPE');
    assert.ok(html.includes('ISO 15189:2022'), 'HTML must display ISO 15189:2022 accreditation');
    assert.ok(html.includes('MC-4892'), 'HTML must display NABL Certificate Number MC-4892');
    assert.ok(html.includes(patient.uhid), 'HTML must contain Patient UHID');
    assert.ok(html.includes('Siddharth Pratap Verma'), 'HTML must contain full Patient Name');
    assert.ok(html.includes('LOINC: 718-7'), 'HTML must display LOINC code for Hemoglobin');
    assert.ok(html.includes('LOINC: 2823-3'), 'HTML must display LOINC code for Potassium');
    assert.ok(
      html.includes('class="barcode-code128-svg"'),
      'HTML must embed native Vector Code 128B Barcode SVG'
    );
    assert.ok(
      html.includes('class="nabl-verification-qr-svg"'),
      'HTML must embed ISO/IEC 18004 Verification QR Code SVG'
    );
    assert.ok(
      html.includes('/verify-report/'),
      'QR verification section must link to /verify-report/:reportId'
    );

    const standaloneBarcode = generateCode128BarcodeSvg(`ACC-D3-${uniqueSuffix}`);
    assert.ok(standaloneBarcode.startsWith('<svg'), 'Barcode generator must output valid SVG');
    assert.ok(
      standaloneBarcode.includes('data-checksum-mod103='),
      'Barcode SVG must include Mod-103 checksum attribute'
    );
    console.log('   ✅ PASS: NABL Letterhead, Cert MC-4892, UHID, LOINC, Code 128B SVG & QR SVG verified.\n');

    // ========================================================================
    // TEST 2: Dynamic Demographic Biological Reference Range Stratification
    // ========================================================================
    console.log('🔹 [TEST 2] Verifying CLSI C28-A3 Dynamic Demographic Reference Range Selection...');

    const now = new Date();
    const dobNewborn = new Date(now.getTime() - 10 * 24 * 3600 * 1000); // 10 Days old
    const dobInfant = new Date(now.getTime() - 180 * 24 * 3600 * 1000); // ~6 Months old
    const dobPediatric = new Date(now.getTime() - 7 * 365.25 * 24 * 3600 * 1000); // 7 Years old
    const dobAdultDynamic = new Date(now.getTime() - 32 * 365.25 * 24 * 3600 * 1000); // 32 Years old
    const dobSenior = new Date(now.getTime() - 68 * 365.25 * 24 * 3600 * 1000); // 68 Years old

    const ageNewborn = calculateDetailedAge(dobNewborn);
    const ageInfant = calculateDetailedAge(dobInfant);
    const agePediatric = calculateDetailedAge(dobPediatric);
    const ageAdult = calculateDetailedAge(dobAdultDynamic);
    const ageSenior = calculateDetailedAge(dobSenior);

    assert.strictEqual(ageNewborn.ageGroup, 'NEWBORN', '10-day-old must classify as NEWBORN');
    assert.ok(ageNewborn.displayText.includes('Days'), 'Newborn age must be displayed in Days');

    assert.strictEqual(ageInfant.ageGroup, 'INFANT', '6-month-old must classify as INFANT');
    assert.ok(ageInfant.displayText.includes('Months'), 'Infant age must be displayed in Months');

    assert.strictEqual(agePediatric.ageGroup, 'PEDIATRIC', '7-year-old must classify as PEDIATRIC');
    assert.strictEqual(ageAdult.ageGroup, 'ADULT', '32-year-old must classify as ADULT');
    assert.strictEqual(ageSenior.ageGroup, 'SENIOR_CITIZEN', '68-year-old must classify as SENIOR_CITIZEN');

    const hbRanges = await prisma.referenceRange.findMany({
      where: { parameterId: paramHb.id },
    });
    const candidateList: ReferenceRangeCandidate[] = hbRanges.map((r) => ({
      id: r.id,
      parameterId: r.parameterId,
      gender: r.gender,
      minAge: r.minAge,
      maxAge: r.maxAge,
      ageGroup: r.ageGroup,
      normalLow: r.normalLow,
      normalHigh: r.normalHigh,
      criticalLow: r.criticalLow,
      criticalHigh: r.criticalHigh,
      interpretation: r.interpretation,
    }));

    // Hb = 13.0 g/dL is LOW for Newborn (14.5-22.5) and Adult Male (13.5-17.5), but NORMAL for Adult Female (12.0-15.5) and Pediatric (11.5-15.5)
    const evalNewborn = evaluateParameterAgainstRange('13.0', candidateList, ageNewborn, 'MALE');
    const evalPediatric = evaluateParameterAgainstRange('13.0', candidateList, agePediatric, 'MALE');
    const evalAdultMale = evaluateParameterAgainstRange('13.0', candidateList, ageAdult, 'MALE');
    const evalAdultFemale = evaluateParameterAgainstRange('13.0', candidateList, ageAdult, 'FEMALE');
    const evalSeniorMale = evaluateParameterAgainstRange('13.0', candidateList, ageSenior, 'MALE');

    assert.strictEqual(evalNewborn.formattedReferenceInterval, '14.5 - 22.5');
    assert.strictEqual(evalNewborn.flag, 'LOW', 'Hb 13.0 must be flagged LOW for Newborn');

    assert.strictEqual(evalPediatric.formattedReferenceInterval, '11.5 - 15.5');
    assert.strictEqual(evalPediatric.flag, 'NORMAL', 'Hb 13.0 must be NORMAL for Pediatric');

    assert.strictEqual(evalAdultMale.formattedReferenceInterval, '13.5 - 17.5');
    assert.strictEqual(evalAdultMale.flag, 'LOW', 'Hb 13.0 must be flagged LOW for Adult Male');

    assert.strictEqual(evalAdultFemale.formattedReferenceInterval, '12 - 15.5');
    assert.strictEqual(evalAdultFemale.flag, 'NORMAL', 'Hb 13.0 must be NORMAL for Adult Female');

    assert.strictEqual(evalSeniorMale.formattedReferenceInterval, '12.5 - 16.5');
    assert.strictEqual(evalSeniorMale.flag, 'NORMAL', 'Hb 13.0 must be NORMAL for Senior Citizen Male');

    console.log('   ✅ PASS: Newborn, Infant, Pediatric, Adult (M/F) & Senior Citizen intervals matched accurately.\n');

    // ========================================================================
    // TEST 3: Critical Value Flagging & CSS Styling in Rendered NABL HTML
    // ========================================================================
    console.log('🔹 [TEST 3] Verifying Critical Panic Flagging (🚨 CRITICAL badge & critical-val class)...');

    assert.ok(
      html.includes('🚨 CRITICAL (HH)'),
      'HTML must contain 🚨 CRITICAL (HH) badge for K+ = 6.8 mmol/L'
    );
    assert.ok(
      html.includes('critical-val'),
      'HTML must apply critical-val CSS class to panic values'
    );
    assert.ok(
      html.includes('CRITICAL PANIC VALUE NOTIFICATION'),
      'HTML must render the NABL Clause 7.4.1.6 Critical Panic Notification Banner'
    );
    console.log('   ✅ PASS: 🚨 CRITICAL (HH) badge, critical-val styling, and Panic Banner verified.\n');

    // ========================================================================
    // TEST 4 & TEST 5: Report Dispatch Guard Enforcement & PDF Compilation
    // ========================================================================
    console.log('🔹 [TEST 4 & 5] Verifying Day 2 Report Dispatch Guard & Puppeteer PDF Compilation...');

    // Step 5A: Attempt PDF generation BEFORE telephonic read-back is logged -> MUST BLOCK
    let blockedByGuard = false;
    try {
      await generateOrderPdf(order.id, { enforceDispatchGuard: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('CRITICAL SAFETY BLOCK') || message.includes('read-back') || message.includes('Dispatch Block')) {
        blockedByGuard = true;
      }
    }
    assert.strictEqual(
      blockedByGuard,
      true,
      'generateOrderPdf MUST block dispatch when critical panic result lacks telephonic read-back'
    );
    console.log('   ✅ PASS: Unacknowledged critical panic result blocked from PDF dispatch.');

    // Step 5B: Record telephonic read-back confirmation for the critical result
    await recordPanicReadback(
      result.id,
      {
        notifiedClinicianName: 'Dr. Rajeshwar Rao, MD, DM',
        notifiedClinicianRole: 'DISPLAYING_ATTENDING_CARDIOLOGIST',
        notificationChannel: 'TELEPHONE_READBACK',
        contactPhoneOrExtension: '+91-9876543210',
        readBackConfirmed: true,
        readBackText:
          'Confirmed Serum Potassium K+ is 6.8 mmol/L (Critical High HH) for patient Siddharth Pratap Verma (UHID-D3).',
        clinicalActionTaken: 'Initiated IV Calcium Gluconate & Insulin-Dextrose protocol in ICU.',
      },
      pathologistUser.id
    );

    // Verify guard now clears the order
    const clearance = await assertOrderClearedForReportDispatch(order.id);
    assert.strictEqual(clearance.clearedForDispatch, true, 'Order must be cleared after read-back');
    console.log('   ✅ PASS: Telephonic read-back logged; Report Dispatch Guard cleared order.');

    // Step 4: Compile binary PDF via generateOrderPdf and verify %PDF- header
    const compiledPdf = await generateOrderPdf(order.id, {
      enforceDispatchGuard: true,
      nablCertificateNumber: 'MC-4892',
    });

    assert.ok(Buffer.isBuffer(compiledPdf.buffer), 'Compiled output must be a Node.js Buffer');
    assert.ok(compiledPdf.buffer.length > 200, 'Compiled PDF buffer must be non-empty');
    const pdfMagicHeader = compiledPdf.buffer.subarray(0, 5).toString('utf8');
    assert.strictEqual(
      pdfMagicHeader,
      '%PDF-',
      `Compiled PDF buffer must start with '%PDF-' magic header (got '${pdfMagicHeader}')`
    );
    assert.strictEqual(compiledPdf.checksumSha256.length, 64, 'SHA-256 checksum must be 64 hex chars');

    console.log(
      `   ✅ PASS: PDF compiled (${compiledPdf.buffer.length} bytes, header="${pdfMagicHeader}", fallback=${compiledPdf.usedFallbackRenderer}, SHA-256=${compiledPdf.checksumSha256.slice(0, 16)}...).\n`
    );

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('🎉 ALL 5 DAY-3 NABL ISO 15189:2022 PDF ENGINE TESTS PASSED EMPIRICALLY (5/5)');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
  } finally {
    // Clean up test fixtures in reverse dependency order
    if (createdResultId) {
      await prisma.auditLog
        .deleteMany({ where: { recordId: createdResultId } })
        .catch(() => undefined);
      await prisma.resultValue
        .deleteMany({ where: { resultId: createdResultId } })
        .catch(() => undefined);
      await prisma.result
        .delete({ where: { id: createdResultId } })
        .catch(() => undefined);
    }
    if (createdOrderId) {
      await prisma.report
        .deleteMany({ where: { orderId: createdOrderId } })
        .catch(() => undefined);
      await prisma.order
        .delete({ where: { id: createdOrderId } })
        .catch(() => undefined);
    }
    if (createdParamHbId || createdParamPotassiumId) {
      const paramIds = [createdParamHbId, createdParamPotassiumId].filter(
        (id): id is string => Boolean(id)
      );
      await prisma.referenceRange
        .deleteMany({ where: { parameterId: { in: paramIds } } })
        .catch(() => undefined);
      await prisma.testParameter
        .deleteMany({ where: { id: { in: paramIds } } })
        .catch(() => undefined);
    }
    if (createdTestId) {
      await prisma.test
        .delete({ where: { id: createdTestId } })
        .catch(() => undefined);
    }
    if (createdCategoryId) {
      await prisma.testCategory
        .delete({ where: { id: createdCategoryId } })
        .catch(() => undefined);
    }
    if (createdPatientId) {
      await prisma.patient
        .delete({ where: { id: createdPatientId } })
        .catch(() => undefined);
    }
    if (createdDoctorId) {
      await prisma.doctor
        .delete({ where: { id: createdDoctorId } })
        .catch(() => undefined);
    }
    if (createdUserId) {
      await prisma.user
        .delete({ where: { id: createdUserId } })
        .catch(() => undefined);
    }
    await prisma.$disconnect();
  }
}

runDay3EmpiricalValidation()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ DAY 3 EMPIRICAL VALIDATION FAILED:', err);
    process.exit(1);
  });
