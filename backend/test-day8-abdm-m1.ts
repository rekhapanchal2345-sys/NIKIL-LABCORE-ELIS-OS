/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🏛️ NIKIL-LABCORE-ELIS-OS — DAY 8 EMPIRICAL ABDM M1: ABHA VERIFICATION VALIDATION SUITE
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * File: backend/test-day8-abdm-m1.ts
 * Command: npx tsx backend/test-day8-abdm-m1.ts
 *
 * Deliverable: ABDM M1 — ABHA Patient Linking via Aadhaar OTP Operational.
 * Phase 6.1 — ABHA ID Verification & National Digital Health Mission Compliance.
 *
 * Empirical Validation Pipeline:
 *   [STEP 1/7] ABDM Configuration & Sandbox Endpoint Inspection
 *   [STEP 2/7] Aadhaar OTP Generation (POST /api/abdm/abha/generate-otp)
 *   [STEP 3/7] Aadhaar OTP Verification & ABHA Profile Minting (POST /api/abdm/abha/verify-otp)
 *   [STEP 4/7] ABHA Linking to Patient Record & Database Persistence
 *   [STEP 5/7] ABHA Authentication for Existing ABHA Holders (Init & Confirm Auth)
 *   [STEP 6/7] ABHA Digital Card QR Code & Scan-and-Share Protocol Generation
 *   [STEP 7/7] Patient ABHA Unlinking & Audit Log Chain Verification
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import prisma from './api/src/lib/prisma';
import { Gender, AccountStatus } from '@prisma/client';
import { abdmConfig } from './api/src/modules/abdm/abdm.config';
import {
  requestAadhaarOtp,
  verifyAadhaarOtpAndCreateAbha,
  linkAbhaToPatient,
  unlinkAbhaFromPatient,
  initiateAbhaAuth,
  confirmAbhaAuth,
  getAbhaCardData,
  generateScanShareQr,
} from './api/src/modules/abdm/abha.service';

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

async function runDay8AbdmM1Suite(): Promise<void> {
  console.log(`${ANSI.cyan}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}`);
  console.log(`${ANSI.cyan}${ANSI.bold}🏛️  NIKIL-LABCORE-ELIS-OS — DAY 8 ABDM M1: ABHA VERIFICATION VALIDATION SUITE${ANSI.reset}`);
  console.log(`${ANSI.yellow}   Phase 6.1: ABHA Enrolment, Aadhaar OTP Verification & Patient Dossier Linking${ANSI.reset}`);
  console.log(`${ANSI.cyan}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}\n`);

  const uniqueSuffix = `${Date.now()}`;
  let createdPatientId: string | null = null;

  try {
    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 1/7: ABDM Configuration & Sandbox Endpoint Inspection
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`${ANSI.magenta}${ANSI.bold}▶ [STEP 1/7] Inspecting ABDM Gateway & Sandbox Enrolment Endpoints...${ANSI.reset}`);

    assertCondition(abdmConfig.abhaBaseUrl.length > 0, `ABHA Base URL configured: ${abdmConfig.abhaBaseUrl}`);
    assertCondition(abdmConfig.gatewayBaseUrl.length > 0, `Gateway Base URL configured: ${abdmConfig.gatewayBaseUrl}`);
    assertCondition(abdmConfig.hipId.length > 0, `HIP Facility ID active: ${abdmConfig.hipId}`);
    assertCondition(abdmConfig.cmId.length > 0, `Consent Manager Domain active: ${abdmConfig.cmId}`);

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 2/7: Aadhaar OTP Generation
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 2/7] Generating Aadhaar OTP for ABHA Enrolment (POST /api/abdm/abha/generate-otp)...${ANSI.reset}`);

    const testAadhaar = '999988887777';
    const otpResult = await requestAadhaarOtp(testAadhaar);

    assertCondition(otpResult.txnId !== undefined && otpResult.txnId.length > 0, `Received ABDM transaction ID: ${otpResult.txnId}`);
    assertCondition(otpResult.message.length > 0, `Gateway response message: "${otpResult.message}"`);

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 3/7: Aadhaar OTP Verification & ABHA Profile Minting
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 3/7] Verifying Aadhaar OTP & Generating Official 14-Digit ABHA Number...${ANSI.reset}`);

    const otpToUse = otpResult.mockOtp || '123456';
    const abhaResult = await verifyAadhaarOtpAndCreateAbha(otpResult.txnId, otpToUse, '9880199999');

    assertCondition(abhaResult.abhaNumber !== undefined && abhaResult.abhaNumber.length >= 14,
      `Official 14-digit ABHA Number minted: ${abhaResult.abhaNumber}`);
    assertCondition(abhaResult.abhaAddress !== undefined && abhaResult.abhaAddress.includes('@'),
      `Ayushman Health Address assigned: ${abhaResult.abhaAddress}`);
    assertCondition(abhaResult.profile !== undefined && abhaResult.profile.name.length > 0,
      `ABHA Demographics extracted: ${abhaResult.profile.name} (${abhaResult.profile.gender}, DOB: ${abhaResult.profile.dateOfBirth})`);

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 4/7: ABHA Linking to Patient Record & Database Persistence
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 4/7] Linking ABHA Health ID to Patient EMPI Dossier in PostgreSQL...${ANSI.reset}`);

    const patient = await prisma.patient.create({
      data: {
        uhid: `UHID-ABHA-${uniqueSuffix.slice(-6)}`,
        firstName: 'Meenakshi',
        lastName: 'Sundaram',
        age: 34,
        gender: Gender.FEMALE,
        phone: `98440${uniqueSuffix.slice(-5)}`,
        email: `meenakshi.${uniqueSuffix}@example.com`,
      },
    });
    createdPatientId = patient.id;

    // Link ABHA to Patient
    const linkResult = await linkAbhaToPatient(patient.id, {
      abhaNumber: abhaResult.abhaNumber,
      abhaAddress: abhaResult.abhaAddress,
      status: 'LINKED',
    });
    assertCondition(linkResult.success === true, 'ABHA link service executed successfully');

    // Query database to confirm fields are written to the Patient record
    const updatedPatient = await prisma.patient.findUnique({
      where: { id: patient.id },
    });
    assertCondition(updatedPatient?.abhaNumber === abhaResult.abhaNumber, `Patient record contains verified abhaNumber: ${updatedPatient?.abhaNumber}`);
    assertCondition(updatedPatient?.abhaAddress === abhaResult.abhaAddress, `Patient record contains verified abhaAddress: ${updatedPatient?.abhaAddress}`);
    assertCondition(updatedPatient?.abhaStatus === 'LINKED', `Patient record reflects abhaStatus: ${updatedPatient?.abhaStatus}`);
    assertCondition(updatedPatient?.abhaLinkedAt !== null, `Timestamp of linkage recorded: ${updatedPatient?.abhaLinkedAt?.toISOString()}`);

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 5/7: ABHA Authentication for Existing ABHA Holders (Init & Confirm)
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 5/7] Testing ABHA Verification for Existing ABHA Holders (Auth Mode)...${ANSI.reset}`);

    const authInit = await initiateAbhaAuth(abhaResult.abhaAddress, 'AADHAAR_OTP');
    assertCondition(authInit.txnId !== undefined && authInit.txnId.length > 0, `Auth initiate transaction: ${authInit.txnId}`);

    const authConfirm = await confirmAbhaAuth(authInit.txnId, authInit.mockOtp || '123456');
    assertCondition(authConfirm.abhaNumber !== undefined && authConfirm.abhaNumber.length >= 14,
      `Auth confirmation resolved ABHA Number: ${authConfirm.abhaNumber}`);
    assertCondition(authConfirm.profile.name.length > 0, `Auth confirmation verified identity: ${authConfirm.profile.name}`);

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 6/7: ABHA Digital Card QR Code & Scan-and-Share Protocol Generation
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 6/7] Generating ABHA Digital Card QR Code & Scan-and-Share Token...${ANSI.reset}`);

    const abhaCard = await getAbhaCardData(patient.id);
    assertCondition(abhaCard.qrData !== undefined && abhaCard.qrData.length > 10, `Digital ABHA Card QR data generated: ${abhaCard.qrData}`);
    assertCondition(abhaCard.abhaNumber === abhaResult.abhaNumber, `Card QR metadata matches registered ABHA Number`);

    const scanShareQr = await generateScanShareQr('RECEPTION-DESK-01');
    assertCondition(scanShareQr.qrData !== undefined && scanShareQr.qrData.length > 10, `Scan-and-Share counter QR data generated`);
    assertCondition(scanShareQr.counterToken.length > 10, `Counter registration token verified`);

    // ─────────────────────────────────────────────────────────────────────────────────────
    // STEP 7/7: Patient ABHA Unlinking & Audit Log Chain Verification
    // ─────────────────────────────────────────────────────────────────────────────────────
    console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 7/7] Verifying Patient ABHA Unlinking & Transaction Audit Trail...${ANSI.reset}`);

    const unlinkResult = await unlinkAbhaFromPatient(patient.id);
    assertCondition(unlinkResult.success === true, 'ABHA unlink service returned success');

    const unlinkedPatient = await prisma.patient.findUnique({
      where: { id: patient.id },
    });
    assertCondition(unlinkedPatient?.abhaNumber === null, 'Patient abhaNumber cleared post-unlink');
    assertCondition(unlinkedPatient?.abhaStatus === 'UNLINKED', 'Patient abhaStatus reflects UNLINKED');

    // Verify transactions in abdm_transactions table
    const txTable = (prisma as any).abdm_transactions || (prisma as any).abdmTransaction;
    const loggedTxns = txTable ? await txTable.findMany({
      where: { patientId: patient.id },
    }) : [];
    assertCondition(loggedTxns.length >= 2, `ABDM audit trail logged ${loggedTxns.length} transaction records for patient`);

    console.log(`\n${ANSI.green}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}`);
    console.log(`${ANSI.green}${ANSI.bold}🎉 DAY 8 ABDM M1: ABHA VERIFICATION VALIDATION SUITE PASSED 100%!${ANSI.reset}`);
    console.log(`${ANSI.green}${ANSI.bold}🏆 PHASE 6.1 (ABHA MINTING, VERIFICATION & LINKING) 100% OPERATIONAL!${ANSI.reset}`);
    console.log(`${ANSI.green}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}\n`);
  } catch (error) {
    console.error(`\n${ANSI.red}${ANSI.bold}❌ DAY 8 TEST SUITE FAILED WITH ERROR:${ANSI.reset}`, error);
    throw error;
  } finally {
    // ─── Teardown ──────────────────────────────────────────────────────────────────────
    console.log(`${ANSI.yellow}🧹 Cleaning up Day 8 test records...${ANSI.reset}`);
    try {
      if (createdPatientId) {
        const txTableCleanup = (prisma as any).abdm_transactions || (prisma as any).abdmTransaction;
        if (txTableCleanup) {
          await txTableCleanup.deleteMany({ where: { patientId: createdPatientId } });
        }
        await prisma.patient.deleteMany({ where: { id: createdPatientId } });
      }
      console.log(`  ${ANSI.green}✔ Day 8 test cleanup completed successfully.${ANSI.reset}`);
    } catch (cleanupErr) {
      console.warn(`  ⚠️ Cleanup warning:`, cleanupErr);
    }
  }
}

// Self-invoking runner
runDay8AbdmM1Suite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
