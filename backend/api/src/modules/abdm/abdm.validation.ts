/**
 * ABDM Zod Validation Schemas
 */

import { z } from "zod";

// ─── ABHA Generation ───────────────────────────────────────────────────────
export const requestAadhaarOtpSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar number must be exactly 12 digits"),
});

export const verifyAadhaarOtpSchema = z.object({
  txnId: z.string().min(1, "Transaction ID is required"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
  mobile: z.string().regex(/^\d{10}$/).optional(),
});

export const requestMobileOtpSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
});

// ─── ABHA Auth / Verification ──────────────────────────────────────────────
export const initiateAbhaAuthSchema = z.object({
  abhaAddressOrNumber: z.string().min(3, "ABHA address or number is required"),
  authMode: z.enum(["MOBILE_OTP", "AADHAAR_OTP"]).optional().default("MOBILE_OTP"),
});

export const confirmAbhaAuthSchema = z.object({
  txnId: z.string().min(1, "Transaction ID is required"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

// ─── Patient Linking ───────────────────────────────────────────────────────
export const linkAbhaSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  abhaNumber: z.string().regex(/^\d{14}$/, "Invalid ABHA Number (must be 14 digits)"),
  abhaAddress: z.string().regex(/^[a-zA-Z0-9.\-_]+@abdm$/, "Invalid ABHA Address format"),
  status: z.enum(["LINKED", "VERIFIED"]).optional().default("LINKED"),
});

export const unlinkAbhaSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
});

// ─── Scan & Share ──────────────────────────────────────────────────────────
export const generateScanShareQrSchema = z.object({
  counterId: z.string().min(1, "Counter ID is required"),
  location: z.string().optional(),
});

export const processSharedProfileSchema = z.object({
  profile: z.object({
    abhaAddress: z.string().min(3),
    abhaNumber: z.string().min(14),
    name: z.string().min(1),
    gender: z.enum(["M", "F", "U"]),
    dateOfBirth: z.string().optional(),
    mobile: z.string().optional(),
    address: z.string().optional(),
    districtName: z.string().optional(),
    stateName: z.string().optional(),
  }),
  counterToken: z.string().min(1, "Counter token is required"),
});

// ─── ABDM Gateway Webhooks ─────────────────────────────────────────────────
export const abdmGatewayCallbackSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.string(),
  transactionId: z.string().optional(),
});

export const consentNotifySchema = abdmGatewayCallbackSchema.extend({
  notification: z.object({
    consentId: z.string(),
    status: z.enum(["GRANTED", "DENIED", "EXPIRED", "REVOKED"]),
    consentDetail: z.record(z.string(), z.unknown()).optional(),
    signature: z.string().optional(),
  }),
});

export const hiRequestSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.string(),
  transactionId: z.string(),
  hiRequest: z.object({
    consent: z.object({ id: z.string() }),
    dateRange: z.object({ from: z.string(), to: z.string() }),
    dataPushUrl: z.string().url(),
    hiTypes: z.array(z.string()),
    keyMaterial: z.object({
      cryptoAlg: z.string(),
      curve: z.string(),
      dhPublicKey: z.object({
        expiry: z.string(),
        parameters: z.string(),
        keyValue: z.string(),
      }),
      nonce: z.string(),
    }),
  }),
});

export const discoverySchema = abdmGatewayCallbackSchema.extend({
  transactionId: z.string(),
  patient: z.object({
    id: z.string(),
    verifiedIdentifiers: z.array(z.object({
      type: z.string(),
      value: z.string(),
    })),
    unverifiedIdentifiers: z.array(z.object({
      type: z.string(),
      value: z.string(),
    })).optional(),
    name: z.string().optional(),
    gender: z.string().optional(),
    yearOfBirth: z.number().optional(),
  }),
});

export const linkInitSchema = abdmGatewayCallbackSchema.extend({
  transactionId: z.string(),
  patient: z.object({
    id: z.string(),
    careContexts: z.array(z.object({ referenceNumber: z.string() })),
  }),
});

export const linkConfirmSchema = abdmGatewayCallbackSchema.extend({
  transactionId: z.string(),
  confirmation: z.object({
    linkRefNumber: z.string(),
    token: z.string(),
  }),
});
