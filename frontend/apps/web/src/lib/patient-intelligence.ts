import { calculateClinicalAge, sanitizeMedicalConditions } from "./patient-utils";

export interface PatientRiskScore {
  score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: string[];
  color: {
    badge: string;
    text: string;
    bg: string;
  };
}

export function calculatePatientRiskScore(patient?: any): PatientRiskScore {
  if (!patient) {
    return {
      score: 10,
      level: "LOW",
      factors: ["Routine outpatient baseline"],
      color: {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        text: "text-emerald-700",
        bg: "bg-emerald-50",
      },
    };
  }

  let score = 15;
  const factors: string[] = [];
  const ageInfo = calculateClinicalAge(patient.dateOfBirth, patient.age);

  if (patient.isCritical || patient.status === "Critical") {
    score += 55;
    factors.push("Active STAT / Critical Flag");
  }
  if (ageInfo.isGeriatric) {
    score += 20;
    factors.push(`Geriatric Patient (${ageInfo.formatted})`);
  } else if (ageInfo.isNeonate) {
    score += 25;
    factors.push("Neonatal High-Priority Care");
  }

  const chronic = sanitizeMedicalConditions(patient.chronicConditions);
  if (chronic.length > 0) {
    score += Math.min(25, chronic.length * 10);
    factors.push(`Comorbidities: ${chronic.slice(0, 2).join(", ")}`);
  }

  const allergies = sanitizeMedicalConditions(patient.allergies);
  if (allergies.length > 0) {
    score += 10;
    factors.push(`Documented Allergies (${allergies.length})`);
  }

  score = Math.min(99, score);
  if (factors.length === 0) factors.push("Standard clinical profile");

  if (score >= 70) {
    return {
      score,
      level: "CRITICAL",
      factors,
      color: {
        badge: "bg-rose-50 text-rose-700 border-rose-200",
        text: "text-rose-700",
        bg: "bg-rose-50",
      },
    };
  }
  if (score >= 45) {
    return {
      score,
      level: "HIGH",
      factors,
      color: {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        text: "text-amber-700",
        bg: "bg-amber-50",
      },
    };
  }
  if (score >= 25) {
    return {
      score,
      level: "MODERATE",
      factors,
      color: {
        badge: "bg-sky-50 text-sky-700 border-sky-200",
        text: "text-sky-700",
        bg: "bg-sky-50",
      },
    };
  }
  return {
    score,
    level: "LOW",
    factors,
    color: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
    },
  };
}

export function parseNaturalLanguagePatientQuery(query: string) {
  const raw = (query || "").trim();
  const lower = raw.toLowerCase();
  const tokens = lower.split(/\s+/).filter(Boolean);
  let gender: string | undefined;
  let bloodGroup: string | undefined;
  let isCritical: boolean | undefined;
  let isVip: boolean | undefined;
  let isSenior: boolean | undefined;
  let minAge: number | undefined;
  let maxAge: number | undefined;
  const explanations: string[] = [];

  if (tokens.includes("male") || tokens.includes("men")) {
    gender = "MALE";
    explanations.push("Gender: Male");
  }
  if (tokens.includes("female") || tokens.includes("women")) {
    gender = "FEMALE";
    explanations.push("Gender: Female");
  }
  if (tokens.includes("critical") || tokens.includes("stat") || tokens.includes("panic")) {
    isCritical = true;
    explanations.push("Critical / STAT cases");
  }
  if (tokens.includes("senior") || tokens.includes("elderly") || tokens.includes("geriatric")) {
    isSenior = true;
    explanations.push("Senior citizens (60+ yrs)");
  }
  if (tokens.includes("vip")) {
    isVip = true;
    explanations.push("VIP category");
  }

  const bgMatch = raw.match(/\b(A|B|AB|O)[+-]\b/i);
  if (bgMatch) {
    bloodGroup = bgMatch[0].toUpperCase();
    explanations.push(`Blood Group: ${bloodGroup}`);
  }

  const activeFilterCount = (gender ? 1 : 0) + (bloodGroup ? 1 : 0) + (isCritical ? 1 : 0) + (isVip ? 1 : 0) + (isSenior ? 1 : 0);

  return {
    raw,
    textQuery: raw,
    gender,
    bloodGroup,
    isCritical,
    isVip,
    isSenior,
    minAge,
    maxAge,
    activeFilterCount,
    explanation: explanations.join(", ") || "Filtered query",
    filters: {
      gender,
      bloodGroup,
      isCritical,
      isVip,
      isSenior,
    },
    hasStructuredFilters: activeFilterCount > 0,
  };
}
