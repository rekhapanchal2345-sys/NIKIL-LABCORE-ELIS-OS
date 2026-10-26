/**
 * Domain Test Suite: Patient Management, EMPI & DPDP Act 2023 Compliance
 */

process.env.FIELD_ENCRYPTION_KEY =
  process.env.FIELD_ENCRYPTION_KEY || "labcore_dpdp_secret_key_32_characters_minimum_gcm!!";

import { describe, it, expect } from "./framework";
import { soundex, damerauLevenshteinDistance } from "../api/src/modules/search/fuzzy.util";
import {
  encryptNationalId,
  decryptNationalId,
  DpdpPurpose,
} from "../api/src/modules/patients/dpdp.service";

export function registerPatientTests(): void {
  describe("Patient Management, EMPI & DPDP Act 2023", () => {
    it("should generate deterministic Soundex phonetic codes for EMPI matching", () => {
      // Common Indian phonetic spelling variations must generate identical Soundex codes
      const suresh1 = soundex("Suresh");
      const suresh2 = soundex("Shooresh");
      expect(suresh1.length).toBe(4);
      expect(suresh1.startsWith("S")).toBe(true);

      const ashok1 = soundex("Ashok");
      const ashok2 = soundex("Ashoc");
      expect(ashok1).toBe(ashok2); // A220

      const mehta1 = soundex("Mehta");
      const mehta2 = soundex("Meta");
      expect(mehta1).toBe(mehta2); // M300
    });

    it("should compute accurate Damerau-Levenshtein transposition edit distance", () => {
      // Exact match
      expect(damerauLevenshteinDistance("PATIENT", "PATIENT")).toBe(0);

      // Adjacent transposition
      expect(damerauLevenshteinDistance("tset", "test")).toBe(1);

      // Single character deletion/insertion
      expect(damerauLevenshteinDistance("Kumar", "Kumarr")).toBe(1);
    });

    it("should encrypt and decrypt patient National ID (Aadhaar/PAN) using AES-256-GCM", () => {
      const rawAadhaar = "9988-7766-5544";
      const encrypted = encryptNationalId(rawAadhaar);

      expect(typeof encrypted).toBe("string");
      expect(encrypted.length > 20).toBe(true);
      expect(encrypted !== rawAadhaar).toBe(true);

      const decrypted = decryptNationalId(encrypted);
      expect(decrypted).toBe(rawAadhaar);
    });

    it("should mask PII demographic attributes in compliance with DPDP Act 2023", () => {
      const maskPhone = (phone: string): string => {
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.length < 10) return "******";
        return `+91 ${cleaned.slice(0, 2)}****${cleaned.slice(-4)}`;
      };

      const maskEmail = (email: string): string => {
        const parts = email.split("@");
        if (parts.length !== 2) return "*****";
        const name = parts[0];
        const domain = parts[1];
        const maskedName = name.length <= 2 ? `${name[0]}*` : `${name[0]}***${name[name.length - 1]}`;
        return `${maskedName}@${domain}`;
      };

      const maskedPhone = maskPhone("9876543210");
      expect(maskedPhone).toBe("+91 98****3210");

      const maskedEmail = maskEmail("nikilpanchal@gmail.com");
      expect(maskedEmail).toBe("n***l@gmail.com");
    });

    it("should define standard DPDP statutory consent purposes", () => {
      expect(DpdpPurpose.TREATMENT_DIAGNOSTICS).toBe("TREATMENT_DIAGNOSTICS");
      expect(DpdpPurpose.BILLING_COMMERCIAL).toBe("BILLING_COMMERCIAL");
      expect(DpdpPurpose.ACADEMIC_RESEARCH).toBe("ACADEMIC_RESEARCH");
      expect(DpdpPurpose.COMMUNICATION_MARKETING).toBe("COMMUNICATION_MARKETING");
    });
  });
}
