export interface RawPatientInput {
  id?: string | null;
  uhid?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  age?: number | string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  patientType?: string | null;
  additionalInformation?: string | null;
  notes?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  pincode?: string | null;
  country?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactAddress?: string | null;
  allergies?: string[] | string | null;
  medicalConditions?: string[] | string | null;
  chronicConditions?: string[] | string | null;
  currentMedications?: unknown[] | string | null;
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
  policyNumber?: string | null;
  insuranceGroupNumber?: string | null;
  insuranceExpiryDate?: string | null;
  preferredLanguage?: string | null;
  preferredCommunicationMethod?: string | null;
  notificationPreferences?: string[] | null;
  privacyConsent?: boolean | null;
  corporateId?: string | null;
  abhaNumber?: string | null;
  abhaAddress?: string | null;
  referringDoctor?: string | null;
  department?: string | null;
  fastingStatus?: string | null;
}

/**
 * Normalizes a patient ID or UHID into a clean hospital/lab UHID string.
 * Prevents double-prefix bugs like "PAT-pat-001".
 */
export function formatCleanUhid(rawId?: string | null, fallbackUhid?: string | null): string {
  const candidate = (fallbackUhid || rawId || "").trim();
  if (!candidate) return "UHID-2026-1001";

  if (/^UHID-/i.test(candidate)) {
    return candidate.toUpperCase();
  }
  if (/^MRN-/i.test(candidate)) {
    return candidate.toUpperCase();
  }
  // If rawId is like "pat-001" or "PAT-pat-001"
  const stripped = candidate.replace(/^(PAT-)+/i, "");
  if (/^pat-(\d+)$/i.test(stripped)) {
    const digits = stripped.replace(/\D/g, "");
    return `UHID-2026-${digits.padStart(4, "0")}`;
  }
  if (/^\d+$/.test(stripped)) {
    return `UHID-2026-${stripped.padStart(4, "0")}`;
  }
  return `UHID-${stripped.slice(0, 10).toUpperCase()}`;
}

/**
 * Formats blood group codes (e.g., O_POSITIVE -> O+ (Rh Positive))
 */
export function formatClinicalBloodGroup(bloodGroup?: string | null): string {
  if (!bloodGroup) return "—";
  const normalized = bloodGroup.trim().toUpperCase();
  const map: Record<string, string> = {
    A_POSITIVE: "A+ (Rh Positive)",
    "A+": "A+ (Rh Positive)",
    A_NEGATIVE: "A- (Rh Negative)",
    "A-": "A- (Rh Negative)",
    B_POSITIVE: "B+ (Rh Positive)",
    "B+": "B+ (Rh Positive)",
    B_NEGATIVE: "B- (Rh Negative)",
    "B-": "B- (Rh Negative)",
    AB_POSITIVE: "AB+ (Rh Positive)",
    "AB+": "AB+ (Rh Positive)",
    AB_NEGATIVE: "AB- (Rh Negative)",
    "AB-": "AB- (Rh Negative)",
    O_POSITIVE: "O+ (Rh Positive)",
    "O+": "O+ (Rh Positive)",
    O_NEGATIVE: "O- (Rh Negative)",
    "O-": "O- (Rh Negative)",
  };
  return map[normalized] || bloodGroup;
}

/**
 * Formats date of birth along with calculated clinical age in years.
 */
export function formatDobWithAge(dateOfBirth?: string | null, explicitAge?: number | string | null): {
  formattedDate: string;
  ageLabel: string;
  combined: string;
} {
  if (!dateOfBirth) {
    const ageStr = explicitAge ? `${explicitAge} Yrs` : "—";
    return { formattedDate: "—", ageLabel: ageStr, combined: explicitAge ? `${explicitAge} Yrs` : "—" };
  }
  const parsed = new Date(dateOfBirth);
  if (Number.isNaN(parsed.getTime())) {
    const ageStr = explicitAge ? `${explicitAge} Yrs` : "—";
    return { formattedDate: dateOfBirth, ageLabel: ageStr, combined: dateOfBirth };
  }
  const formattedDate = parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  let years = typeof explicitAge === "number" ? explicitAge : Number(explicitAge);
  if (!years || Number.isNaN(years)) {
    const now = new Date();
    years = now.getFullYear() - parsed.getFullYear();
    const m = now.getMonth() - parsed.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < parsed.getDate())) {
      years--;
    }
  }
  const ageLabel = years >= 0 ? `${years} Yrs` : "—";
  return {
    formattedDate,
    ageLabel,
    combined: years >= 0 ? `${formattedDate} (${years} Yrs)` : formattedDate,
  };
}

/**
 * Normalizes array or string fields into a clean display string.
 */
export function normalizeListField(value: unknown, fallback = "None Reported"): string {
  if (!value) return fallback;
  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item.trim();
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          return String(obj.name || obj.condition || obj.label || "").trim();
        }
        return String(item).trim();
      })
      .filter(Boolean);
    return items.length > 0 ? items.join(", ") : fallback;
  }
  const str = String(value).trim();
  if (!str || str === "null" || str === "undefined") return fallback;
  return str;
}
