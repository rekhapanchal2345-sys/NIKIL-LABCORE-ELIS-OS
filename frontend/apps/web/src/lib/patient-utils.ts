export function formatPatientFullName(patient?: any): string {
  if (!patient) return "Unknown Patient";
  if (typeof patient === "string") return patient;
  if (patient.fullName && String(patient.fullName).trim()) {
    return String(patient.fullName).trim();
  }
  const parts = [patient.title, patient.firstName, patient.middleName, patient.lastName]
    .map((p) => (p ? String(p).trim() : ""))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : patient.name || "Unknown Patient";
}

export interface ClinicalAgeResult {
  years: number;
  months: number;
  days: number;
  formatted: string;
  shortFormatted: string;
  category: "NEONATE" | "INFANT" | "PEDIATRIC" | "ADULT" | "GERIATRIC";
  isPediatric: boolean;
  isGeriatric: boolean;
  isNeonate: boolean;
  toString(): string;
}

export function calculateClinicalAge(
  dateOfBirth?: string | Date | null,
  fallbackAge?: number | string | null
): ClinicalAgeResult {
  let years = Number(fallbackAge) || 35;
  let months = 0;
  let days = 0;

  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (!Number.isNaN(dob.getTime())) {
      const now = new Date();
      years = now.getFullYear() - dob.getFullYear();
      months = now.getMonth() - dob.getMonth();
      days = now.getDate() - dob.getDate();
      if (days < 0) {
        months -= 1;
        days += 30;
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      years = Math.max(0, years);
    }
  }

  const formatted =
    years === 0 && months === 0
      ? `${Math.max(1, days)}d`
      : years === 0
        ? `${months}m ${days}d`
        : `${years}y`;

  const category: ClinicalAgeResult["category"] =
    years === 0 && months < 1
      ? "NEONATE"
      : years < 1
        ? "INFANT"
        : years < 18
          ? "PEDIATRIC"
          : years >= 65
            ? "GERIATRIC"
            : "ADULT";

  return {
    years,
    months,
    days,
    formatted,
    shortFormatted: formatted,
    category,
    isPediatric: years < 18,
    isGeriatric: years >= 65,
    isNeonate: category === "NEONATE",
    toString() {
      return formatted;
    },
  };
}

export interface FormattedIndianPhone {
  raw: string;
  digits: string;
  rawDigits?: string;
  e164?: string;
  display: string;
  formatted: string;
  whatsappNumber: string;
  isValid: boolean;
  toString(): string;
}

export function formatIndianPhone(phone?: string | null): FormattedIndianPhone {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length >= 10 ? digits.slice(-10) : digits;
  const display =
    ten.length === 10 ? `+91 ${ten.slice(0, 5)} ${ten.slice(5)}` : raw || "Not recorded";
  return {
    raw,
    digits: ten,
    rawDigits: ten,
    e164: ten.length === 10 ? `+91${ten}` : raw,
    display,
    formatted: display,
    whatsappNumber: ten.length === 10 ? `91${ten}` : digits,
    isValid: ten.length === 10,
    toString() {
      return display;
    },
  };
}

export function formatBloodGroup(bloodGroup?: string | null): string {
  if (!bloodGroup) return "O+";
  const map: Record<string, string> = {
    A_POSITIVE: "A+",
    A_NEGATIVE: "A-",
    B_POSITIVE: "B+",
    B_NEGATIVE: "B-",
    AB_POSITIVE: "AB+",
    AB_NEGATIVE: "AB-",
    O_POSITIVE: "O+",
    O_NEGATIVE: "O-",
  };
  const key = String(bloodGroup).toUpperCase().trim();
  return map[key] || String(bloodGroup);
}

export function formatAbhaNumber(abha?: string | null): string {
  if (!abha) return "—";
  const digits = String(abha).replace(/\D/g, "");
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
  }
  return String(abha);
}

export function sanitizeMedicalConditions(input?: string[] | string | null): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(input)
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
