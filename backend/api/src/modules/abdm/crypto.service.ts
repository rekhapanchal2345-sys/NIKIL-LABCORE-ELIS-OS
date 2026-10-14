/**
 * ABDM Cryptography Service
 *
 * Implements the ABDM-mandated encryption for Health Data Transfer:
 *   - ECDH key pair generation (P-256 / secp256r1 as used by ABDM sandbox;
 *     production uses Curve25519 via SubtleCrypto WebCrypto API)
 *   - Shared secret derivation with HKDF-SHA-256
 *   - AES-256-GCM encryption of FHIR JSON payload
 *   - Checksum (SHA-256) generation for data integrity
 *   - Key serialisation helpers matching ABDM Gateway format
 */

import crypto from "crypto";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AbdmKeyMaterial {
  /** ECDH public key, base64-encoded */
  cryptoAlg: string;
  curve: string;
  dhPublicKey: {
    expiry: string;
    parameters: string;
    keyValue: string;
  };
  nonce: string;
}

export interface AbdmEncryptedData {
  content: string;       // Base64-encoded AES-256-GCM ciphertext
  media: string;         // "application/fhir+json"
  checksum: string;      // SHA-256 hex digest of plaintext
  careContextReference: string;
}

// ─────────────────────────────────────────────────────────────
// Key Generation
// ─────────────────────────────────────────────────────────────

/**
 * Generates an ECDH key pair on NIST P-256 (secp256r1).
 * Returns both the raw KeyObject and the ABDM-formatted key material JSON.
 */
export function generateAbdmKeyPair(): {
  privateKey: crypto.KeyObject;
  publicKey: crypto.KeyObject;
  keyMaterial: AbdmKeyMaterial;
} {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1", // P-256 / secp256r1
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  } as any);

  // Export public key as base64 DER for ABDM
  const publicKeyDer = (publicKey as unknown as { export(opts: object): Buffer }).export
    ? (publicKey as any).export({ type: "spki", format: "der" })
    : (publicKey as unknown as Buffer);

  const nonce = crypto.randomBytes(32).toString("base64");
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    privateKey: privateKey as unknown as crypto.KeyObject,
    publicKey: publicKey as unknown as crypto.KeyObject,
    keyMaterial: {
      cryptoAlg: "ECDH",
      curve: "Curve25519",  // ABDM labels it Curve25519 in the API even when P-256 DER is used
      dhPublicKey: {
        expiry,
        parameters: "Curve25519",
        keyValue: Buffer.isBuffer(publicKeyDer)
          ? publicKeyDer.toString("base64")
          : Buffer.from(publicKeyDer as unknown as string, "binary").toString("base64"),
      },
      nonce,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Shared Secret + Encryption Key Derivation
// ─────────────────────────────────────────────────────────────

/**
 * Derives a 256-bit AES key from:
 *   - ECDH shared secret between our private key and requester's public key
 *   - Salt = XOR of our nonce bytes and requester's nonce bytes
 */
export function deriveEncryptionKey(
  ourPrivateKeyDer: Buffer,
  requesterPublicKeyBase64: string,
  ourNonce: string,
  requesterNonce: string
): Buffer {
  const requesterPubDer = Buffer.from(requesterPublicKeyBase64, "base64");

  const ourPrivKey = crypto.createPrivateKey({ key: ourPrivateKeyDer, format: "der", type: "pkcs8" });
  const requesterPubKey = crypto.createPublicKey({ key: requesterPubDer, format: "der", type: "spki" });

  const sharedSecret = crypto.diffieHellman({ privateKey: ourPrivKey, publicKey: requesterPubKey });

  // Salt: XOR of both nonces (padded to 32 bytes)
  const nonce1 = Buffer.from(ourNonce, "base64").subarray(0, 32);
  const nonce2 = Buffer.from(requesterNonce, "base64").subarray(0, 32);
  const salt = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    salt[i] = (nonce1[i] ?? 0) ^ (nonce2[i] ?? 0);
  }

  // HKDF with SHA-256
  const aesKey = crypto.hkdfSync("sha256", sharedSecret, salt, Buffer.alloc(0), 32);

  return Buffer.from(aesKey);
}

// ─────────────────────────────────────────────────────────────
// Encryption
// ─────────────────────────────────────────────────────────────

/**
 * Encrypts a FHIR JSON bundle string using AES-256-GCM.
 * Returns base64-encoded ciphertext (IV prepended: first 12 bytes).
 */
export function encryptFhirPayload(
  plaintext: string,
  aesKey: Buffer
): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);

  const encrypted = Buffer.concat([
    iv,
    cipher.update(plaintext, "utf8"),
    cipher.final(),
    cipher.getAuthTag(), // 16 bytes GCM auth tag appended
  ]);

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
  };
}

// ─────────────────────────────────────────────────────────────
// Checksum
// ─────────────────────────────────────────────────────────────

export function computeChecksum(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext, "utf8").digest("hex");
}

// ─────────────────────────────────────────────────────────────
// Full Encrypt Helper
// ─────────────────────────────────────────────────────────────

/**
 * One-shot helper: given a FHIR bundle JSON and the HIU's ABDM key material,
 * returns the encrypted payload ready for the ABDM Health Information Transfer API.
 */
export function encryptForAbdm(
  fhirBundleJson: string,
  careContextReference: string,
  ourPrivateKeyDer: Buffer,
  ourNonce: string,
  hiuKeyMaterial: AbdmKeyMaterial
): AbdmEncryptedData {
  const aesKey = deriveEncryptionKey(
    ourPrivateKeyDer,
    hiuKeyMaterial.dhPublicKey.keyValue,
    ourNonce,
    hiuKeyMaterial.nonce
  );

  const { encrypted } = encryptFhirPayload(fhirBundleJson, aesKey);
  const checksum = computeChecksum(fhirBundleJson);

  return {
    content: encrypted,
    media: "application/fhir+json",
    checksum,
    careContextReference,
  };
}
