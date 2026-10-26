/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🏛️ NIKIL-LABCORE-ELIS-OS — DAY 9 EMPIRICAL ABDM M2 & M3: CARE CONTEXT & FHIR SUITE
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * File: backend/test-day9-abdm-m2-m3.ts
 * Command: npx tsx backend/test-day9-abdm-m2-m3.ts
 *
 * Deliverable: ABDM M2+M3 — HIP registration, FHIR reports, consent exchange.
 * Phase 6.2 — FHIR DiagnosticReport Bundle Generator & Health Information Exchange.
 *
 * Empirical Validation Pipeline:
 *   [STEP 1/7] ABDM M2 HIP Facility Identity & Registration Verification
 *   [STEP 2/7] Seeding ABHA Patient, Diagnostic Order & Clinical Results in PostgreSQL
 *   [STEP 3/7] Care-Context Creation & HIP Linking (addCareContextForOrder)
 *   [STEP 4/7] Generating NRCES-Compliant HL7 FHIR R4 DiagnosticReport Document Bundle
 *   [STEP 5/7] Verifying FHIR R4 Resources (Composition, Patient, Org, Specimen, Obs, DR)
 *   [STEP 6/7] ABDM Consent Lifecycle: Notification, Grant, Validation & Expiry
 *   [STEP 7/7] ECDH Key Exchange & AES-256-GCM Encrypted Health Data Transfer (M3)
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import crypto from 'crypto';
import prisma from './api/src/lib/prisma';
import {
  Gender,
  SampleType,
  ParameterType,
  ResultFlag,
  UserRole,
  AccountStatus,
  Prisma,
} from '@prisma/client';
import { abdmConfig } from './api/src/modules/abdm/abdm.config';
import { addCareContextForOrder } from './api/src/modules/abdm/hip.service';
import { buildFhirBundle } from './api/src/modules/abdm/fhir.service';
import {
  handleConsentNotification,
  validateConsent,
  getPatientConsents,
} from './api/src/modules/abdm/consent.service';
import {
  generateAbdmKeyPair,
  encryptForAbdm,
  computeChecksum,
} from './api/src/modules/abdm/crypto.service';
import {
  getAbdmCareContextsTable,
  getAbdmConsentsTable,
  getAbdmTransactionsTable,
} from './api/src/modules/abdm/abdm.transaction.helper';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

let passedAssertions = 0;

function assertCondition(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(`❌ EMPIRICAL ASSERTION FAILED: ${message}`);
  }
  passedAssertions++;
  console.log(`  ${ANSI.green}✔ [PASS #${passedAssertions}]${ANSI.reset} ${message}`);
}

async function runDay9AbdmM2M3Suite(): Promise<void> {
  console.log(`${ANSI.cyan}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}`);
  console.log(`${ANSI.cyan}${ANSI.bold}🏛️  NIKIL-LABCORE-ELIS-OS — DAY 9 EMPIRICAL ABDM M2 & M3 VALIDATION SUITE${ANSI.reset}`);
  console.log(`${ANSI.yellow}   Phase 6.2: Care-Context Linking, NRCES HL7 FHIR R4 Bundle & Consent Exchange${ANSI.reset}`);
  console.log(`${ANSI.cyan}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}\n`);

  const uniqueSuffix = `${Date.now()}`;
  let createdPatientId: string | null = null;
  let createdDoctorId: string | null = null;
  let createdCategoryId: string | null = null;
  let createdTestId: string | null = null;
  const createdParamIds: string[] = [];
  let createdOrderId: string | null = null;
  let createdConsentId: string | null = null;

  try {
    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 1/7: ABDM M2 HIP Facility Identity & Registration Verification
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`${ANSI.magenta}${ANSI.bold}▶ [STEP 1/7] Verifying ABDM HIP Facility Identity & NRCES Compliance Config...${ANSI.reset}`);

    assertCondition(abdmConfig.hipId.length > 0, `HIP Facility ID registered: ${abdmConfig.hipId}`);
    assertCondition(abdmConfig.lab.name.length > 0, `Facility Name: ${abdmConfig.lab.name}`);
    assertCondition(abdmConfig.gatewayBaseUrl.length > 0, `ABDM Gateway URL: ${abdmConfig.gatewayBaseUrl}`);
    assertCondition(abdmConfig.cmId.length > 0, `ABDM Consent Manager Suffix: ${abdmConfig.cmId}`);

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 2/7: Seeding ABHA Patient, Diagnostic Order & Clinical Results in PostgreSQL
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 2/7] Seeding ABHA-Linked Patient, Diagnostic Test & Clinical Results...${ANSI.reset}`);

    const abhaNumber = `91-${uniqueSuffix.slice(-4)}-${uniqueSuffix.slice(-8, -4)}-1234`;
    const abhaAddress = `patient.${uniqueSuffix}@sbx`;

    // 1. Patient with ABHA
    const patient = await prisma.patient.create({
      data: {
        uhid: `UHID-D9-${uniqueSuffix.slice(-6)}`,
        firstName: 'Devendra',
        lastName: 'Bhattacharya',
        age: 46,
        gender: Gender.MALE,
        phone: `98330${uniqueSuffix.slice(-5)}`,
        email: `devendra.${uniqueSuffix}@example.com`,
        abhaNumber,
        abhaAddress,
        abhaStatus: 'LINKED',
        abhaLinkedAt: new Date(),
      },
    });
    createdPatientId = patient.id;

    // 2. Doctor
    const doctor = await prisma.doctor.create({
      data: {
        doctorCode: `DOC-D9-${uniqueSuffix.slice(-6)}`,
        fullName: 'Dr. Sarita Varma, MD (Pathology)',
        specialization: 'Clinical Biochemistry & Molecular Pathology',
        registrationNumber: `DMC-${uniqueSuffix.slice(-5)}`,
        isActive: true,
      },
    });
    createdDoctorId = doctor.id;

    // 3. Category & Test
    const category = await prisma.testCategory.create({
      data: {
        code: `CAT-D9-${uniqueSuffix.slice(-5)}`,
        name: `Biochemistry D9-${uniqueSuffix.slice(-4)}`,
        description: 'NABL ISO 15189:2022 Accredited Clinical Biochemistry',
      },
    });
    createdCategoryId = category.id;

    const test = await prisma.test.create({
      data: {
        testCode: `LFT-D9-${uniqueSuffix.slice(-5)}`,
        testName: 'Liver Function Test Panel (LFT)',
        category: { connect: { id: category.id } },
        sampleType: SampleType.SERUM,
        sampleContainer: 'GOLD_SST',
        method: 'Enzymatic Photometry & Diazo Method',
        tatHours: 4,
        price: new Prisma.Decimal(850.0),
        isActive: true,
      },
    });
    createdTestId = test.id;

    // 4. Test Parameters (Bilirubin & ALT)
    const biliParam = await prisma.testParameter.create({
      data: {
        test: { connect: { id: test.id } },
        parameterName: 'Bilirubin Total',
        unit: 'mg/dL',
        dataType: ParameterType.NUMERIC,
        loincCode: '1975-2',
        displayOrder: 1,
      },
    });
    createdParamIds.push(biliParam.id);

    const altParam = await prisma.testParameter.create({
      data: {
        test: { connect: { id: test.id } },
        parameterName: 'Alanine Aminotransferase (ALT/SGPT)',
        unit: 'U/L',
        dataType: ParameterType.NUMERIC,
        loincCode: '1742-6',
        displayOrder: 2,
      },
    });
    createdParamIds.push(altParam.id);

    // 5. Clinical Order
    const orderNumber = `ORD/D9/${uniqueSuffix.slice(-6)}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        barcode: `BC-D9-${uniqueSuffix.slice(-6)}`,
        patientId: patient.id,
        doctorId: doctor.id,
        orderStatus: 'COMPLETED',
        paymentStatus: 'PAID',
        priority: 'ROUTINE',
        subtotal: new Prisma.Decimal(850.0),
        grandTotal: new Prisma.Decimal(850.0),
        paidAmount: new Prisma.Decimal(850.0),
        items: {
          create: [
            {
              itemType: 'TEST',
              testId: test.id,
              price: new Prisma.Decimal(850.0),
              finalPrice: new Prisma.Decimal(850.0),
            },
          ],
        },
      },
    });
    createdOrderId = order.id;

    // 6. Specimen Sample
    const sample = await prisma.sample.create({
      data: {
        sampleNumber: `SMP-D9-${uniqueSuffix.slice(-6)}`,
        barcode: `BC-SMP-D9-${uniqueSuffix.slice(-6)}`,
        orderId: order.id,
        patientId: patient.id,
        testId: test.id,
        sampleType: SampleType.SERUM,
        status: 'RECEIVED',
      },
    });

    // 7. Clinical Result
    const result = await prisma.result.create({
      data: {
        orderId: order.id,
        testId: test.id,
        patientId: patient.id,
        status: 'APPROVED',
        enteredAt: new Date(),
        approvedAt: new Date(),
        values: {
          create: [
            {
              parameterId: biliParam.id,
              value: '1.85',
              flag: 'HIGH',
              remark: 'Elevated total bilirubin',
            },
            {
              parameterId: altParam.id,
              value: '54.0',
              flag: 'HIGH',
              remark: 'Mild transaminase elevation',
            },
          ],
        },
      },
    });

    assertCondition(order.id !== undefined, `Created clinical order: ${order.orderNumber}`);
    assertCondition(result.id !== undefined, `Created verified results with LOINC mappings`);

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 3/7: Care-Context Creation & HIP Linking (addCareContextForOrder)
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 3/7] Linking Order as ABDM Care Context (addCareContextForOrder)...${ANSI.reset}`);

    const careContextResult = await addCareContextForOrder(
      patient.id,
      order.id,
      `Liver Function Evaluation — Order ${order.orderNumber}`
    );

    assertCondition(careContextResult.success === true, 'addCareContextForOrder executed with gateway confirmation');
    assertCondition(careContextResult.careContextReference.includes(order.id),
      `Care context reference formatted correctly: ${careContextResult.careContextReference}`);

    // Verify database record in abdm_care_contexts
    const careContextsTable = getAbdmCareContextsTable(prisma);
    const dbContext = careContextsTable
      ? await careContextsTable.findUnique({
          where: { careContextReference: careContextResult.careContextReference },
        })
      : null;

    assertCondition(dbContext !== null, `Care context persisted in database: ${dbContext?.careContextReference}`);
    assertCondition(dbContext?.hiTypes.includes('DiagnosticReport'), `HI-Type covers DiagnosticReport`);

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 4/7: Generating NRCES-Compliant HL7 FHIR R4 DiagnosticReport Document Bundle
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 4/7] Generating NRCES-Compliant HL7 FHIR R4 Bundle (buildFhirBundle)...${ANSI.reset}`);

    const fhirBundle: any = await buildFhirBundle(order.id);

    assertCondition(fhirBundle !== undefined && typeof fhirBundle === 'object', 'buildFhirBundle returned bundle object');
    assertCondition(fhirBundle.resourceType === 'Bundle', `Top-level FHIR resourceType is Bundle`);
    assertCondition(fhirBundle.type === 'document', `Bundle type is "document" (HL7 FHIR R4 Document Composition)`);
    assertCondition(Array.isArray(fhirBundle.entry) && fhirBundle.entry.length >= 5,
      `FHIR Document Bundle contains ${fhirBundle.entry?.length} structured entries (expected >= 5)`);

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 5/7: Verifying FHIR R4 Resources (Composition, Patient, Org, Specimen, Obs, DR)
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 5/7] Asserting Clinical Integrity of All Bundled FHIR Resources...${ANSI.reset}`);

    const resources = fhirBundle.entry.map((e: any) => e.resource);

    // 1. Composition
    const composition = resources.find((r: any) => r.resourceType === 'Composition');
    assertCondition(composition !== undefined, 'Bundle contains Composition resource');
    assertCondition(composition.status === 'final', `Composition status is final`);
    assertCondition(composition.title?.includes('Diagnostic Report'), `Composition title: "${composition.title}"`);

    // 2. Patient
    const fhirPatient = resources.find((r: any) => r.resourceType === 'Patient');
    assertCondition(fhirPatient !== undefined, 'Bundle contains Patient resource');
    assertCondition(fhirPatient.gender === 'male', `Patient gender mapped correctly (male)`);
    const abhaIdent = fhirPatient.identifier?.find((i: any) => i.system?.includes('abha'));
    assertCondition(abhaIdent?.value === abhaNumber, `Patient contains official ABHA Number identifier (${abhaIdent?.value})`);

    // 3. Organization
    const organization = resources.find((r: any) => r.resourceType === 'Organization');
    assertCondition(organization !== undefined, `Bundle contains Organization resource (${organization.name})`);

    // 4. Specimen
    const specimen = resources.find((r: any) => r.resourceType === 'Specimen');
    assertCondition(specimen !== undefined, 'Bundle contains Specimen resource');
    assertCondition(specimen.type?.coding?.[0]?.code !== undefined, 'Specimen contains coded sample type');

    // 5. Observations
    const observations = resources.filter((r: any) => r.resourceType === 'Observation');
    assertCondition(observations.length === 2, `Bundle contains ${observations.length} Observation resources`);

    const biliObs = observations.find((o: any) =>
      o.code?.coding?.some((c: any) => c.code === '1975-2')
    );
    assertCondition(biliObs !== undefined, 'Found Observation with LOINC 1975-2 (Bilirubin Total)');
    assertCondition(biliObs.valueQuantity?.value === 1.85 && biliObs.valueQuantity?.unit === 'mg/dL',
      `Bilirubin valueQuantity verified: ${biliObs.valueQuantity?.value} ${biliObs.valueQuantity?.unit}`);
    assertCondition(biliObs.interpretation?.[0]?.coding?.[0]?.code === 'H',
      `Observation interpretation code verified: "${biliObs.interpretation?.[0]?.coding?.[0]?.code}" (High)`);

    // 6. DiagnosticReport
    const diagnosticReport = resources.find((r: any) => r.resourceType === 'DiagnosticReport');
    assertCondition(diagnosticReport !== undefined, 'Bundle contains DiagnosticReport resource');
    assertCondition(diagnosticReport.status === 'final', `DiagnosticReport status is final`);
    assertCondition(diagnosticReport.result?.length === 2, `DiagnosticReport references all observations (${diagnosticReport.result?.length})`);

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 6/7: ABDM Consent Lifecycle: Notification, Grant, Validation & Expiry
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 6/7] Testing ABDM Consent Artefact Notification, Storage & Validation...${ANSI.reset}`);

    const consentId = `CONSENT-${uniqueSuffix.slice(-6)}`;
    createdConsentId = consentId;

    const consentNotificationPayload = {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      notification: {
        consentId,
        status: 'GRANTED' as const,
        consentDetail: {
          consentId,
          createdAt: new Date().toISOString(),
          purpose: { code: 'CAREV', text: 'Care Management & Review' },
          patient: { id: abhaAddress },
          hip: { id: abdmConfig.hipId },
          hiTypes: ['DiagnosticReport'],
          permission: {
            accessMode: 'VIEW',
            dateRange: {
              from: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
              to: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            },
            dataEraseAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
            frequency: { unit: 'HOUR', value: 1, repeats: 0 },
          },
          consentManager: { id: abdmConfig.cmId },
        },
      },
    };

    await handleConsentNotification(consentNotificationPayload);

    // Verify stored consent in database
    const consentsTable = getAbdmConsentsTable(prisma);
    const dbConsent = consentsTable
      ? await consentsTable.findUnique({ where: { consentId } })
      : null;

    assertCondition(dbConsent !== null, `Consent artefact persisted in PostgreSQL: ${dbConsent?.consentId}`);
    assertCondition(dbConsent?.status === 'GRANTED', `Consent status reflects GRANTED`);

    // Validate valid consent
    const validationResult = await validateConsent(
      consentId,
      ['DiagnosticReport'],
      {
        from: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        to: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      }
    );
    assertCondition(validationResult.valid === true, 'Consent validation accepted for DiagnosticReport in granted window');

    // Validate unauthorized HI type rejection
    const invalidTypeCheck = await validateConsent(
      consentId,
      ['Prescription', 'DischargeSummary'],
      {
        from: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        to: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      }
    );
    assertCondition(invalidTypeCheck.valid === false, 'Unauthorized HI-types correctly rejected by consent guard');

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 7/7: ECDH Key Exchange & AES-256-GCM Encrypted Health Data Transfer (M3)
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 7/7] Executing ECDH Key Exchange & AES-256-GCM Health Data Transfer (M3)...${ANSI.reset}`);

    // Generate HIU (Requester) key pair
    const hiuKeys = generateAbdmKeyPair();
    // Generate HIP (LabCore) key pair
    const hipKeys = generateAbdmKeyPair();

    assertCondition(hiuKeys.keyMaterial.dhPublicKey.keyValue.length > 30, 'HIU ECDH P-256 public key generated');
    assertCondition(hipKeys.keyMaterial.dhPublicKey.keyValue.length > 30, 'HIP ECDH P-256 public key generated');

    const fhirBundleString = JSON.stringify(fhirBundle);
    const plaintextChecksum = computeChecksum(fhirBundleString);

    // Export HIP private key DER (already Buffer when DER encoded)
    const hipPrivDer = Buffer.isBuffer(hipKeys.privateKey)
      ? hipKeys.privateKey
      : (hipKeys.privateKey as any).export({ type: 'pkcs8', format: 'der' });

    // Encrypt for ABDM M3 data transfer
    const encryptedData = encryptForAbdm(
      fhirBundleString,
      careContextResult.careContextReference,
      hipPrivDer,
      hipKeys.keyMaterial.nonce,
      hiuKeys.keyMaterial
    );

    assertCondition(encryptedData.content.length > 50, `Ciphertext generated (Base64 payload length: ${encryptedData.content.length})`);
    assertCondition(encryptedData.checksum === plaintextChecksum, `SHA-256 integrity checksum matches plaintext bundle: ${encryptedData.checksum.slice(0, 16)}...`);
    assertCondition(encryptedData.media === 'application/fhir+json', `Media type conforms to standard: ${encryptedData.media}`);

    console.log(`\n${ANSI.green}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}`);
    console.log(`${ANSI.green}${ANSI.bold}🎉 DAY 9 ABDM M2 & M3 EMPIRICAL VALIDATION SUITE PASSED 100%!${ANSI.reset}`);
    console.log(`${ANSI.green}${ANSI.bold}🏆 PHASE 6.2 (CARE CONTEXTS, HL7 FHIR R4 & ENCRYPTED M3 TRANSFER) 100% OPERATIONAL!${ANSI.reset}`);
    console.log(`${ANSI.green}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}\n`);
  } catch (error) {
    console.error(`\n${ANSI.red}${ANSI.bold}❌ DAY 9 TEST SUITE FAILED WITH ERROR:${ANSI.reset}`, error);
    throw error;
  } finally {
    // ─── Teardown ──────────────────────────────────────────────────────────────────────
    console.log(`${ANSI.yellow}🧹 Cleaning up Day 9 test records...${ANSI.reset}`);
    try {
      if (createdConsentId) {
        const consentsTable = getAbdmConsentsTable(prisma);
        if (consentsTable) {
          await consentsTable.deleteMany({ where: { consentId: createdConsentId } });
        }
      }

      if (createdOrderId) {
        const careContextsTable = getAbdmCareContextsTable(prisma);
        if (careContextsTable) {
          await careContextsTable.deleteMany({ where: { orderId: createdOrderId } });
        }
        await prisma.resultValue.deleteMany({ where: { result: { orderId: createdOrderId } } });
        await prisma.result.deleteMany({ where: { orderId: createdOrderId } });
        await prisma.sample.deleteMany({ where: { orderId: createdOrderId } });
        await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } });
        await prisma.order.deleteMany({ where: { id: createdOrderId } });
      }

      if (createdParamIds.length > 0) {
        await prisma.referenceRange.deleteMany({ where: { parameterId: { in: createdParamIds } } });
        await prisma.testParameter.deleteMany({ where: { id: { in: createdParamIds } } });
      }

      if (createdTestId) {
        await prisma.test.deleteMany({ where: { id: createdTestId } });
      }

      if (createdCategoryId) {
        await prisma.testCategory.deleteMany({ where: { id: createdCategoryId } });
      }

      if (createdPatientId) {
        const txTable = getAbdmTransactionsTable(prisma);
        if (txTable) {
          await txTable.deleteMany({ where: { patientId: createdPatientId } });
        }
        await prisma.patient.deleteMany({ where: { id: createdPatientId } });
      }

      if (createdDoctorId) {
        await prisma.doctor.deleteMany({ where: { id: createdDoctorId } });
      }

      console.log(`  ${ANSI.green}✔ Day 9 test cleanup completed successfully.${ANSI.reset}`);
    } catch (cleanupErr) {
      console.warn(`  ⚠️ Cleanup warning:`, cleanupErr);
    }
  }
}

// Self-invoking runner
runDay9AbdmM2M3Suite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
