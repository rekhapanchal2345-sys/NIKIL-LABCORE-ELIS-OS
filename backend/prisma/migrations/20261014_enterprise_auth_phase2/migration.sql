-- Migration: Enterprise Auth Phase 2
-- Adds:
--   1. users.lastMfaAt (timestamp of last successful MFA verification)
--   2. trusted_devices table (enterprise device trust / "remember this device")
--   3. webauthn_credentials table (FIDO2 / WebAuthn passkeys & hardware keys)

-- Alter users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastMfaAt" TIMESTAMP(3);

-- Create trusted_devices table
CREATE TABLE IF NOT EXISTS "trusted_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceFingerprint" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "trustTokenHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "trustedUntil" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trusted_devices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "trusted_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "trusted_devices_trustTokenHash_key" ON "trusted_devices"("trustTokenHash");
CREATE INDEX IF NOT EXISTS "trusted_devices_userId_idx" ON "trusted_devices"("userId");
CREATE INDEX IF NOT EXISTS "trusted_devices_deviceFingerprint_idx" ON "trusted_devices"("deviceFingerprint");
CREATE INDEX IF NOT EXISTS "trusted_devices_trustTokenHash_idx" ON "trusted_devices"("trustTokenHash");

-- Create webauthn_credentials table
CREATE TABLE IF NOT EXISTS "webauthn_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "deviceName" TEXT,
    "transports" TEXT,
    "aaguid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "webauthn_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "webauthn_credentials_credentialId_key" ON "webauthn_credentials"("credentialId");
CREATE INDEX IF NOT EXISTS "webauthn_credentials_userId_idx" ON "webauthn_credentials"("userId");
CREATE INDEX IF NOT EXISTS "webauthn_credentials_credentialId_idx" ON "webauthn_credentials"("credentialId");
