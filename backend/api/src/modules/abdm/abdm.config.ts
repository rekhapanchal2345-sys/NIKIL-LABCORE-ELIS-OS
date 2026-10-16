/**
 * ABDM (Ayushman Bharat Digital Mission) Gateway Configuration
 *
 * Reads configuration from environment variables and provides typed constants
 * for all ABDM/ABHA API base URLs, credentials, and operational flags.
 */

import dotenv from "dotenv";

dotenv.config();

// ─────────────────────────────────────────────────────────────
// Mode
// ─────────────────────────────────────────────────────────────

/**
 * When ABDM_MOCK_MODE=true, all gateway calls are short-circuited and realistic
 * mock responses are returned. This MUST be explicitly enabled for local dev / CI only.
 *
 * ISS-007: Previously defaulted to true (??  "true"), which bypassed RSA SPKI
 * signature verification on all /v0.5/* webhook endpoints in production.
 * Now defaults to false (secure). Set ABDM_MOCK_MODE=true in local .env only.
 * Mock mode is ALWAYS disabled in NODE_ENV=production regardless of env var.
 */
export const ABDM_MOCK_MODE =
  process.env.NODE_ENV !== "production" &&
  (process.env.ABDM_MOCK_MODE ?? "false").toLowerCase() === "true";

// ─────────────────────────────────────────────────────────────
// Environment Selection
// ─────────────────────────────────────────────────────────────

const ABDM_ENV = (process.env.ABDM_ENV ?? "sandbox").toLowerCase();

export const IS_PRODUCTION = ABDM_ENV === "production";

// ─────────────────────────────────────────────────────────────
// Base URLs
// ─────────────────────────────────────────────────────────────

/**
 * Central ABDM Gateway base URL (M2: Care Contexts, Consents, Health Information transfer)
 */
export const GATEWAY_BASE_URL = IS_PRODUCTION
  ? "https://gateway.abdm.gov.in"
  : "https://dev.abdm.gov.in";

/**
 * ABHA (Ayushman Bharat Health Account) enrolment & profile base URL  (v3)
 */
export const ABHA_BASE_URL = IS_PRODUCTION
  ? "https://abha.abdm.gov.in"
  : "https://abhasbx.abdm.gov.in";

/**
 * ABDM HIE-CM (Health Information Exchange & Consent Manager) URL
 */
export const HIE_CM_BASE_URL = GATEWAY_BASE_URL;

// ─────────────────────────────────────────────────────────────
// HIP / Facility Identity
// ─────────────────────────────────────────────────────────────

export const ABDM_CLIENT_ID = process.env.ABDM_CLIENT_ID ?? "";
export const ABDM_CLIENT_SECRET = process.env.ABDM_CLIENT_SECRET ?? "";

/** Your NHA-issued HIP (Health Information Provider) ID */
export const ABDM_HIP_ID = process.env.ABDM_HIP_ID ?? "TEST_HIP_001";

/** HIU ID if LabCore also acts as a Health Information User (optional) */
export const ABDM_HIU_ID = process.env.ABDM_HIU_ID ?? "";

/** Consent Manager domain suffix — "sbx" for sandbox, "abdm" for production */
export const ABDM_CM_ID = IS_PRODUCTION ? "@abdm" : "@sbx";

// ─────────────────────────────────────────────────────────────
// Callback / Webhook URLs
// ─────────────────────────────────────────────────────────────

/** Public HTTPS URL where ABDM Gateway will send callback responses */
export const ABDM_CALLBACK_URL =
  process.env.ABDM_CALLBACK_URL ?? "https://your-lab-domain.com/api/abdm/v0.5";

// ─────────────────────────────────────────────────────────────
// Lab / Facility Metadata (for FHIR bundles)
// ─────────────────────────────────────────────────────────────

export const LAB_NAME = process.env.LAB_NAME ?? "LabCore Diagnostics";
export const LAB_REGISTRATION_NUMBER =
  process.env.LAB_REGISTRATION_NUMBER ?? "";
export const LAB_NABL_NUMBER = process.env.LAB_NABL_NUMBER ?? "";
export const LAB_ADDRESS = process.env.LAB_ADDRESS ?? "";
export const LAB_PHONE = process.env.LAB_PHONE ?? "";
export const LAB_STATE_CODE = process.env.LAB_STATE_CODE ?? "MH"; // ISO 3166-2:IN

// ─────────────────────────────────────────────────────────────
// Derived config object for convenient import
// ─────────────────────────────────────────────────────────────

export const abdmConfig = {
  mockMode: ABDM_MOCK_MODE,
  env: ABDM_ENV,
  isProduction: IS_PRODUCTION,
  gatewayBaseUrl: GATEWAY_BASE_URL,
  abhaBaseUrl: ABHA_BASE_URL,
  clientId: ABDM_CLIENT_ID,
  clientSecret: ABDM_CLIENT_SECRET,
  hipId: ABDM_HIP_ID,
  hiuId: ABDM_HIU_ID,
  cmId: ABDM_CM_ID,
  callbackUrl: ABDM_CALLBACK_URL,
  lab: {
    name: LAB_NAME,
    registrationNumber: LAB_REGISTRATION_NUMBER,
    nablNumber: LAB_NABL_NUMBER,
    address: LAB_ADDRESS,
    phone: LAB_PHONE,
    stateCode: LAB_STATE_CODE,
  },
} as const;

export default abdmConfig;
