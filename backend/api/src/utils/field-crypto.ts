import crypto from "crypto";

/**
 * Field-level encryption for values stored in the database (TOTP secrets today,
 * PHI fields in Phase 3).
 *
 * The key comes from FIELD_ENCRYPTION_KEY and NOT from JWT_SECRET. When these
 * shared a key, rotating the JWT signing key to respond to a suspected
 * compromise silently made every stored secret undecryptable, which locked staff
 * out and lost the data. Separate keys mean rotating one never harms the other.
 *
 * Ciphertext is tagged with the key version so a key can be rotated by writing
 * new values under a new version while old ones remain readable.
 */
const CURRENT_KEY_VERSION = "v1";

function getKey(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY || "";

  if (!raw) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY is not configured. Values encrypted with a fallback " +
        "key cannot be re-read once the key changes."
    );
  }

  if (raw.length < 32) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY must be at least 32 characters (generate with: " +
        "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")."
    );
  }

  return crypto.createHash("sha256").update(raw).digest();
}

/**
 * Decrypts values written before this key existed.
 *
 * Those values were encrypted with a key derived from JWT_SECRET. Reading them
 * still works so an upgrade does not orphan existing secrets; nothing new is
 * ever written under that key.
 */
function legacyJwtDerivedKey(): Buffer | null {
  const raw = process.env.JWT_SECRET || "";
  return raw ? crypto.createHash("sha256").update(raw).digest() : null;
}

function decryptWithKey(payload: string, key: Buffer): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function encryptField(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptField(payload: string): string {
  // Strip version tag if present (e.g. "enc:v1:...")
  const target = payload.startsWith("enc:v1:") ? payload.slice(7) : payload;

  // Current key first.
  try {
    return decryptWithKey(target, getKey());
  } catch (error) {
    if (error instanceof Error && error.message.includes("not configured")) {
      throw error;
    }

    // Fall back to the pre-upgrade key so existing values stay readable.
    const legacyKey = legacyJwtDerivedKey();
    if (!legacyKey) {
      throw error;
    }

    try {
      return decryptWithKey(target, legacyKey);
    } catch {
      throw new Error(
        `Decryption failed. The value was written under a different FIELD_ENCRYPTION_KEY (current: ${CURRENT_KEY_VERSION}).`
      );
    }
  }
}

/** True when the value can be read with the current key. */
export function canDecryptField(payload: string): boolean {
  try {
    decryptField(payload);
    return true;
  } catch {
    return false;
  }
}

/** Encrypts and prepends version tag enc:v1: */
export function encryptTaggedField(plain: string): string {
  return `enc:${CURRENT_KEY_VERSION}:${encryptField(plain)}`;
}

/**
 * Safely decrypts a field if encrypted with enc:v1: or base64 ciphertext.
 * If the value is null, undefined, or plaintext (cannot be decrypted), returns it as-is.
 */
export function safeDecrypt(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined || value === "") return value;
  if (typeof value !== "string") return value;

  if (value.startsWith("enc:v1:") || value.startsWith("enc:")) {
    try {
      return decryptField(value);
    } catch {
      return value;
    }
  }

  // If it's pure digits (like legacy 12-digit Aadhaar or 10-char PAN), it's plaintext
  if (/^\d{12}$/.test(value) || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
    return value;
  }

  // Attempt decryption for raw base64 payload if it appears to be ciphertext
  if (value.length >= 40 && /^[A-Za-z0-9+/=]+$/.test(value)) {
    try {
      return decryptField(value);
    } catch {
      return value;
    }
  }

  return value;
}
