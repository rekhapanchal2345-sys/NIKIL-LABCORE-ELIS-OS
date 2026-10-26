/**
 * ABHA Service
 *
 * Handles all ABHA (Ayushman Bharat Health Account) operations:
 *  - Aadhaar OTP based ABHA generation (M1)
 *  - Mobile OTP based ABHA generation (M1 fallback)
 *  - ABHA verification & auth (search by ABHA Number / Address)
 *  - Linking / Unlinking ABHA to LabCore Patient record
 *  - ABHA Card QR data generation
 *  - Scan & Share: Lab desk QR generation & patient profile reception
 */

import crypto from "crypto";
import prisma from "../../../config/database";
import { abdmPost } from "./abdm.gateway.client";
import { sendSMS } from "../../lib/communication-providers";
import abdmConfig from "./abdm.config";
import { recordAbdmTransaction, updateAbdmTransaction } from "./abdm.transaction.helper";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AbhaProfile {
  ABHANumber: string;
  preferredAbhaAddress: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  mobile: string;
  email?: string;
  address?: string;
  districtName?: string;
  stateName?: string;
  pincode?: string;
  photo?: string;
}

export interface AadhaarOtpResult {
  txnId: string;
  message: string;
  mockMode: boolean;
  mockOtp?: string;
}

export interface AbhaGenerateResult {
  txnId: string;
  abhaNumber: string;
  abhaAddress: string;
  profile: AbhaProfile;
  token: string;
}

export interface AbhaVerifyInitResult {
  txnId: string;
  authMode: string;
  message: string;
  mockMode: boolean;
  mockOtp?: string;
}

export interface AbhaVerifyConfirmResult {
  abhaNumber: string;
  abhaAddress: string;
  profile: AbhaProfile;
}

// ─────────────────────────────────────────────────────────────
// 1. ABHA Generation via Aadhaar OTP
// ─────────────────────────────────────────────────────────────

/**
 * Step 1 — Request OTP to be sent to the mobile linked with Aadhaar.
 * ABHA API: POST /v3/enrollment/request/otp
 */
export async function requestAadhaarOtp(
  aadhaarNumber: string
): Promise<AadhaarOtpResult> {
  await logTransaction("ABHA_AADHAAR_OTP_REQUEST", null, { aadhaarLast4: aadhaarNumber.slice(-4) });

  const resp = await abdmPost<{ txnId: string; message: string }>(
    "/v3/enrollment/request/otp",
    {
      scope: ["abha-enrol", "mobile-verify"],
      loginHint: "aadhaar",
      loginId: aadhaarNumber,
      otpSystem: "aadhaar",
    },
    { baseUrl: abdmConfig.abhaBaseUrl }
  );

  if (!resp.ok || !resp.data?.txnId) {
    throw new Error("Failed to send Aadhaar OTP. Please verify the Aadhaar number.");
  }

  await updateTransaction(resp.requestId, "SUCCESS", resp.data);

  return {
    txnId: resp.data.txnId,
    message: resp.data.message ?? "OTP sent",
    mockMode: abdmConfig.mockMode,
    mockOtp: abdmConfig.mockMode ? "123456" : undefined,
  };
}

/**
 * Step 2 — Verify OTP and enrol ABHA.
 * ABHA API: POST /v3/enrollment/enrol/byAadhaar
 */
export async function verifyAadhaarOtpAndCreateAbha(
  txnId: string,
  otp: string,
  mobile?: string
): Promise<AbhaGenerateResult> {
  await logTransaction("ABHA_AADHAAR_OTP_VERIFY", null, { txnId });

  const resp = await abdmPost<{
    txnId: string;
    tokens?: { token: string };
    message?: string;
    ABHAProfile?: AbhaProfile;
  }>(
    "/v3/enrollment/enrol/byAadhaar",
    {
      scope: ["abha-enrol", "mobile-verify"],
      consent: { code: "abha-enrollment", version: "1.4" },
      authData: {
        authMethods: ["otp"],
        otp: { timeStamp: new Date().toISOString(), txnId, otpValue: otp },
        ...(mobile ? { mobile: { mobileNumber: mobile } } : {}),
      },
    },
    { baseUrl: abdmConfig.abhaBaseUrl }
  );

  if (!resp.ok || !resp.data?.ABHAProfile) {
    throw new Error("ABHA generation failed. Please verify the OTP and try again.");
  }

  const profile = resp.data.ABHAProfile!;
  await updateTransaction(resp.requestId, "SUCCESS", { abhaNumber: profile.ABHANumber });

  return {
    txnId: resp.data.txnId,
    abhaNumber: profile.ABHANumber,
    abhaAddress: profile.preferredAbhaAddress,
    profile,
    token: resp.data.tokens?.token ?? "",
  };
}

// ─────────────────────────────────────────────────────────────
// 2. ABHA Generation via Mobile OTP (Fallback)
// ─────────────────────────────────────────────────────────────

export async function requestMobileOtp(mobile: string): Promise<AadhaarOtpResult> {
  await logTransaction("ABHA_MOBILE_OTP_REQUEST", null, { mobile: mobile.slice(-4) });

  const resp = await abdmPost<{ txnId: string; message: string }>(
    "/v3/enrollment/request/otp",
    {
      scope: ["abha-enrol"],
      loginHint: "mobile",
      loginId: mobile,
      otpSystem: "abdm",
    },
    { baseUrl: abdmConfig.abhaBaseUrl }
  );

  if (!resp.ok || !resp.data?.txnId) {
    throw new Error("Failed to send Mobile OTP.");
  }

  // If lab has SMS provider configured, attempt real telecom SMS dispatch as well
  try {
    await sendSMS({
      to: mobile.startsWith("+91") ? mobile : `+91${mobile}`,
      message: `Your LabCore ABDM ABHA verification OTP is 123456. Valid for 10 mins. (LabCore LIS)`,
    });
  } catch (smsErr) {
    // Graceful fallback if SMS gateway not configured in dev
  }

  return {
    txnId: resp.data.txnId,
    message: resp.data.message ?? "OTP sent",
    mockMode: abdmConfig.mockMode,
    mockOtp: abdmConfig.mockMode ? "123456" : undefined,
  };
}

/**
 * Step 2 (Mobile OTP) — Verify OTP and create ABHA via mobile.
 * ABHA API: POST /v3/enrollment/enrol/byAbdm
 */
export async function verifyMobileOtpAndCreateAbha(
  txnId: string,
  otp: string
): Promise<AbhaGenerateResult> {
  await logTransaction("ABHA_MOBILE_OTP_VERIFY", null, { txnId });

  const resp = await abdmPost<{
    txnId: string;
    tokens?: { token: string };
    message?: string;
    ABHAProfile?: AbhaProfile;
  }>(
    "/v3/enrollment/enrol/byAbdm",
    {
      scope: ["abha-enrol"],
      consent: { code: "abha-enrollment", version: "1.4" },
      authData: {
        authMethods: ["otp"],
        otp: { timeStamp: new Date().toISOString(), txnId, otpValue: otp },
      },
    },
    { baseUrl: abdmConfig.abhaBaseUrl }
  );

  if (!resp.ok || !resp.data?.ABHAProfile) {
    throw new Error("ABHA generation via Mobile OTP failed. Please verify the OTP and try again.");
  }

  const profile = resp.data.ABHAProfile!;
  await updateTransaction(resp.requestId, "SUCCESS", { abhaNumber: profile.ABHANumber });

  return {
    txnId: resp.data.txnId,
    abhaNumber: profile.ABHANumber,
    abhaAddress: profile.preferredAbhaAddress,
    profile,
    token: resp.data.tokens?.token ?? "",
  };
}

// ─────────────────────────────────────────────────────────────
// 3. ABHA Verification (for existing ABHA holders)
// ─────────────────────────────────────────────────────────────

/**
 * Initiate auth for existing ABHA — sends OTP.
 * ABHA API: POST /v3/profile/login/request/otp
 */
export async function initiateAbhaAuth(
  abhaAddressOrNumber: string,
  authMode: "MOBILE_OTP" | "AADHAAR_OTP" = "MOBILE_OTP"
): Promise<AbhaVerifyInitResult> {
  await logTransaction("ABHA_AUTH_INIT", null, { abhaAddressOrNumber });

  const resp = await abdmPost<{ txnId: string; message: string }>(
    "/v3/profile/login/request/otp",
    {
      scope: ["abha-login", "mobile-verify"],
      loginHint: abhaAddressOrNumber.includes("@") ? "abhaAddress" : "abhaNumber",
      loginId: abhaAddressOrNumber,
      otpSystem: authMode === "AADHAAR_OTP" ? "aadhaar" : "abdm",
    },
    { baseUrl: abdmConfig.abhaBaseUrl }
  );

  if (!resp.ok || !resp.data?.txnId) {
    throw new Error("Failed to initiate ABHA verification. Check the ABHA Address / Number.");
  }

  return {
    txnId: resp.data.txnId,
    authMode,
    message: resp.data.message ?? "OTP sent",
    mockMode: abdmConfig.mockMode,
    mockOtp: abdmConfig.mockMode ? "123456" : undefined,
  };
}

/**
 * Confirm OTP and fetch ABHA profile.
 * ABHA API: POST /v3/profile/login/verify
 */
export async function confirmAbhaAuth(
  txnId: string,
  otp: string
): Promise<AbhaVerifyConfirmResult> {
  await logTransaction("ABHA_AUTH_CONFIRM", null, { txnId });

  const resp = await abdmPost<{
    userToken?: string;
    ABHAProfile?: AbhaProfile;
    token?: string;
  }>(
    "/v3/profile/login/verify",
    {
      scope: ["abha-login", "mobile-verify"],
      authData: {
        authMethods: ["otp"],
        otp: { timeStamp: new Date().toISOString(), txnId, otpValue: otp },
      },
    },
    { baseUrl: abdmConfig.abhaBaseUrl }
  );

  if (!resp.ok || !resp.data?.ABHAProfile) {
    throw new Error("ABHA verification failed. Please check your OTP.");
  }

  const profile = resp.data.ABHAProfile!;
  await updateTransaction(resp.requestId, "SUCCESS", { abhaNumber: profile.ABHANumber });

  return {
    abhaNumber: profile.ABHANumber,
    abhaAddress: profile.preferredAbhaAddress,
    profile,
  };
}

// ─────────────────────────────────────────────────────────────
// 4. Link / Unlink ABHA to LabCore Patient
// ─────────────────────────────────────────────────────────────

export async function linkAbhaToPatient(
  patientId: string,
  abhaData: { abhaNumber: string; abhaAddress: string; status?: string }
): Promise<{ success: boolean; message: string }> {
  // Standalone ABHA generation mode — no real patient to link to.
  // The ABDM hub "Create New ABHA" flow passes a placeholder ID.
  const isStandaloneMode =
    !patientId ||
    patientId === "new-abha-registration" ||
    patientId === "standalone";

  if (isStandaloneMode) {
    await logTransaction("ABHA_STANDALONE_GENERATE", null, {
      abhaNumber: abhaData.abhaNumber,
      abhaAddress: abhaData.abhaAddress,
      note: "Standalone ABHA generation from ABDM Hub (no patient yet)",
    });
    return { success: true, message: "ABHA generated successfully. Register or link to a patient to complete." };
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new Error("Patient not found");

  await (prisma.patient as any).update({
    where: { id: patientId },
    data: {
      abhaNumber: abhaData.abhaNumber,
      abhaAddress: abhaData.abhaAddress,
      abhaStatus: abhaData.status ?? "LINKED",
      abhaLinkedAt: new Date(),
    },
  });

  await logTransaction("ABHA_PATIENT_LINK", patientId, {
    abhaNumber: abhaData.abhaNumber,
    abhaAddress: abhaData.abhaAddress,
  });

  return { success: true, message: "ABHA linked to patient successfully" };
}

export async function unlinkAbhaFromPatient(
  patientId: string
): Promise<{ success: boolean }> {
  await (prisma.patient as any).update({
    where: { id: patientId },
    data: {
      abhaNumber: null,
      abhaAddress: null,
      abhaStatus: "UNLINKED",
      abhaLinkedAt: null,
    },
  });

  await logTransaction("ABHA_PATIENT_UNLINK", patientId, {});

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// 5. ABHA Card Data
// ─────────────────────────────────────────────────────────────

export async function getAbhaCardData(patientId: string) {
  const patient = await (prisma.patient as any).findUnique({
    where: { id: patientId },
    select: {
      id: true,
      uhid: true,
      firstName: true,
      lastName: true,
      gender: true,
      dateOfBirth: true,
      phone: true,
      bloodGroup: true,
      address: true,
      city: true,
      state: true,
      abhaNumber: true,
      abhaAddress: true,
      abhaStatus: true,
      abhaLinkedAt: true,
      photoUrl: true,
    },
  });

  if (!patient) throw new Error("Patient not found");
  if (!patient.abhaNumber) throw new Error("No ABHA linked to this patient");

  return {
    abhaNumber: patient.abhaNumber,
    abhaAddress: patient.abhaAddress,
    name: [patient.title, patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ").trim() || "Patient",
    gender: patient.gender,
    dob: patient.dateOfBirth,
    mobile: patient.phone,
    bloodGroup: patient.bloodGroup,
    address: [patient.address, patient.city, patient.state].filter(Boolean).join(", "),
    linkedAt: patient.abhaLinkedAt,
    status: patient.abhaStatus,
    photo: patient.photoUrl,
    // QR data follows ABDM spec: abhaAddress encoded in QR
    qrData: JSON.stringify({
      hiType: "patient",
      abhaAddress: patient.abhaAddress,
      abhaNumber: patient.abhaNumber,
    }),
  };
}

// ─────────────────────────────────────────────────────────────
// 6. Scan & Share — Lab Reception QR
// ─────────────────────────────────────────────────────────────

/**
 * Generates a counter/desk QR for ABDM Scan & Share.
 * The patient scans this QR from their ABHA app to share their profile.
 * ABDM specification: the QR encodes HIP ID + counter ID + timestamp + nonce.
 */
export async function generateScanShareQr(
  counterId: string,
  location?: string
): Promise<{ qrData: string; qrString: string; counterToken: string; expiresAt: string }> {
  const counterToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // ABDM Scan & Share QR structure
  const qrPayload = {
    hip: abdmConfig.hipId,
    counter: counterId,
    location: location ?? abdmConfig.lab.name,
    token: counterToken,
    expiry: expiresAt.toISOString(),
    type: "scan-and-share",
    cm: abdmConfig.cmId,
  };

  const qrString = JSON.stringify(qrPayload);

  return {
    qrData: Buffer.from(qrString).toString("base64"),
    qrString,
    counterToken,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Processes a patient's shared profile received via ABDM Scan & Share.
 * Automatically finds or creates a LabCore patient and updates ABHA data.
 */
export async function processSharedProfile(payload: {
  profile: {
    abhaAddress: string;
    abhaNumber: string;
    name: string;
    gender: string;
    dateOfBirth?: string;
    mobile?: string;
    address?: string;
    districtName?: string;
    stateName?: string;
  };
  counterToken: string;
}): Promise<{ patientId: string; isNew: boolean; uhid: string }> {
  const { profile } = payload;

  await logTransaction("SCAN_SHARE_RECEIVED", null, {
    abhaAddress: profile.abhaAddress,
    abhaNumber: profile.abhaNumber,
  });

  // Try to find existing patient by ABHA number or mobile
  let patient = await (prisma.patient as any).findFirst({
    where: {
      OR: [
        { abhaNumber: profile.abhaNumber },
        { abhaAddress: profile.abhaAddress },
        ...(profile.mobile ? [{ phone: profile.mobile }] : []),
      ],
    },
  });

  const isNew = !patient;

  if (!patient) {
    // Auto-create minimal patient record from shared profile
    const nameParts = profile.name.split(" ");
    const firstName = nameParts[0] ?? profile.name;
    const lastName = nameParts.slice(1).join(" ") || "-";

    const count = await prisma.patient.count();
    const uhid = `UHID${String(count + 1).padStart(6, "0")}`;

    patient = await (prisma.patient as any).create({
      data: {
        uhid,
        firstName,
        lastName,
        gender: profile.gender === "F" ? "FEMALE" : profile.gender === "M" ? "MALE" : "OTHER",
        phone: profile.mobile ?? null,
        address: profile.address ?? null,
        city: profile.districtName ?? null,
        state: profile.stateName ?? null,
        abhaNumber: profile.abhaNumber,
        abhaAddress: profile.abhaAddress,
        abhaStatus: "LINKED",
        abhaLinkedAt: new Date(),
      },
    });
  } else {
    // Update ABHA data on existing patient
    await (prisma.patient as any).update({
      where: { id: patient.id },
      data: {
        abhaNumber: profile.abhaNumber,
        abhaAddress: profile.abhaAddress,
        abhaStatus: "LINKED",
        abhaLinkedAt: new Date(),
      },
    });
  }

  return { patientId: patient.id, isNew, uhid: patient.uhid };
}

// ─────────────────────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────────────────────

async function logTransaction(
  action: string,
  patientId: string | null,
  requestData: Record<string, unknown>
): Promise<string> {
  return recordAbdmTransaction({ action, patientId, requestData });
}

async function updateTransaction(
  requestId: string,
  status: string,
  responseData: Record<string, unknown>
) {
  return updateAbdmTransaction(requestId, status, responseData);
}
