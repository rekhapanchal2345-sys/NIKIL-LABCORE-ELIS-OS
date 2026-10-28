import { Gender, ReferenceRange, TestParameter } from "@prisma/client";

export interface PatientAgeBreakdown {
  ageInHours: number;
  ageInDays: number;
  ageInMonths: number;
  ageInYears: number;
  ageDisplay: string;
}

/**
 * Accurately calculates patient age down to exact hours and days.
 * Crucial for Neonates (0-28 days) whose bilirubin and hematology ranges change daily/hourly.
 * Solves Bug 1.3.
 */
export function calculateExactPatientAge(dobInput?: Date | string | null): PatientAgeBreakdown {
  if (!dobInput) {
    return {
      ageInHours: 24 * 365 * 30,
      ageInDays: 365 * 30,
      ageInMonths: 12 * 30,
      ageInYears: 30,
      ageDisplay: "Adult (30 Years)",
    };
  }

  const dob = dobInput instanceof Date ? dobInput : new Date(dobInput);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - dob.getTime());

  const ageInHours = Math.floor(diffMs / (1000 * 60 * 60));
  const ageInDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const ageInMonths = Math.floor(ageInDays / 30.4375);

  let ageInYears = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    ageInYears--;
  }
  ageInYears = Math.max(0, ageInYears);

  let ageDisplay = "";
  if (ageInHours < 48) {
    ageDisplay = `${ageInHours} Hours`;
  } else if (ageInDays < 30) {
    ageDisplay = `${ageInDays} Days`;
  } else if (ageInMonths < 24) {
    ageDisplay = `${ageInMonths} Months`;
  } else {
    ageDisplay = `${ageInYears} Years`;
  }

  return {
    ageInHours,
    ageInDays,
    ageInMonths,
    ageInYears,
    ageDisplay,
  };
}

/**
 * Matches dynamic reference range against patient age and sex.
 * Prioritizes Hours -> Days -> Years to properly support Neonates.
 */
export function matchApplicableReferenceRange(
  ranges: ReferenceRange[],
  patientAge: PatientAgeBreakdown,
  patientGender?: Gender | string | null
): ReferenceRange | null {
  if (!ranges || ranges.length === 0) return null;

  const activeRanges = ranges.filter((r) => r.isActive !== false);
  const candidates = activeRanges.length > 0 ? activeRanges : ranges;

  // 1. First priority: Match Hours-based range (Neonates < 48h)
  const hourMatches = candidates.filter((r) => {
    if (r.minAgeInHours != null || r.maxAgeInHours != null) {
      const minH = r.minAgeInHours ?? 0;
      const maxH = r.maxAgeInHours ?? 999999;
      return patientAge.ageInHours >= minH && patientAge.ageInHours <= maxH;
    }
    return false;
  });

  if (hourMatches.length > 0) {
    const genderMatch = hourMatches.find((r) => r.gender === patientGender);
    return genderMatch || hourMatches.find((r) => !r.gender) || hourMatches[0];
  }

  // 2. Second priority: Match Days-based range (Neonates 2 - 28 days)
  const dayMatches = candidates.filter((r) => {
    if (r.minAgeInDays != null || r.maxAgeInDays != null) {
      const minD = r.minAgeInDays ?? 0;
      const maxD = r.maxAgeInDays ?? 999999;
      return patientAge.ageInDays >= minD && patientAge.ageInDays <= maxD;
    }
    return false;
  });

  if (dayMatches.length > 0) {
    const genderMatch = dayMatches.find((r) => r.gender === patientGender);
    return genderMatch || dayMatches.find((r) => !r.gender) || dayMatches[0];
  }

  // 3. Third priority: Match standard Years-based range
  const yearMatches = candidates.filter((r) => {
    const min = r.minAge ?? 0;
    const max = r.maxAge ?? 150;
    return patientAge.ageInYears >= min && patientAge.ageInYears <= max;
  });

  if (yearMatches.length > 0) {
    const genderMatch = yearMatches.find((r) => r.gender === patientGender);
    return genderMatch || yearMatches.find((r) => !r.gender) || yearMatches[0];
  }

  // Default fallback to first available range
  const genderFallback = candidates.find((r) => r.gender === patientGender);
  return genderFallback || candidates[0];
}

export interface ParsedValueWithFlags {
  rawResult: string;
  numericResult: number | null;
  operator: string | null;
  instrumentFlags: string | null;
}

/**
 * Extracts operators (<, >, <=, >=) and isolates non-numeric machine flags.
 * Prevents NaN crashes on analyzer results like `>1000`, `<0.05`, `CLOTTED`, `HEMOLYZED`.
 * Solves Bug 2.4.
 */
export function parseResultValueAndFlags(input: string | number | null | undefined): ParsedValueWithFlags {
  const str = input != null ? String(input).trim() : "";
  if (!str) {
    return {
      rawResult: "",
      numericResult: null,
      operator: null,
      instrumentFlags: null,
    };
  }

  // 1. Match operator followed by numeric value: e.g. ">1000", "< 0.05", ">= 14.2"
  const opMatch = str.match(/^([<>]=?)\s*(-?\d+(?:\.\d+)?)$/);
  if (opMatch) {
    const num = parseFloat(opMatch[2]);
    return {
      rawResult: str,
      numericResult: isNaN(num) ? null : num,
      operator: opMatch[1],
      instrumentFlags: null,
    };
  }

  // 2. Pure numeric value
  const numMatch = str.match(/^-?\d+(?:\.\d+)?$/);
  if (numMatch) {
    const num = parseFloat(str);
    return {
      rawResult: str,
      numericResult: isNaN(num) ? null : num,
      operator: null,
      instrumentFlags: null,
    };
  }

  // 3. Known machine interference or qualitative flags: e.g. "CLOTTED", "HEMOLYZED", "---", ">Linearity"
  return {
    rawResult: str,
    numericResult: null,
    operator: null,
    instrumentFlags: str,
  };
}

export interface ResultValueSnapshotData {
  parameterId: string;
  value: string;
  flag?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | null;
  remark?: string | null;
  snapshotReferenceMin?: number | null;
  snapshotReferenceMax?: number | null;
  snapshotUnit?: string | null;
  snapshotAgeText?: string | null;
  snapshotGender?: string | null;
  rawResult?: string | null;
  numericResult?: number | null;
  operator?: string | null;
  instrumentFlags?: string | null;
}

/**
 * Freezes (denormalizes) reference ranges, unit, and patient demographics directly onto the ResultValue row.
 * Solves Bug 1.1, Bug 1.2, Bug 1.3, and Bug 2.4.
 */
export function buildResultValueSnapshot(
  paramInput: {
    parameterId: string;
    value: string;
    flag?: any;
    remark?: string;
  },
  parameter: TestParameter & { referenceRanges?: ReferenceRange[] },
  patientDemographics?: {
    dateOfBirth?: Date | string | null;
    gender?: Gender | string | null;
  }
): ResultValueSnapshotData {
  const age = calculateExactPatientAge(patientDemographics?.dateOfBirth);
  const matchedRange = matchApplicableReferenceRange(
    parameter.referenceRanges || [],
    age,
    patientDemographics?.gender
  );

  const parsed = parseResultValueAndFlags(paramInput.value);

  let calculatedFlag = paramInput.flag || "NORMAL";

  // Auto-flag numeric values if not already flagged
  if (parsed.numericResult !== null && matchedRange) {
    const num = parsed.numericResult;
    const critLow = matchedRange.criticalLow != null ? Number(matchedRange.criticalLow) : null;
    const critHigh = matchedRange.criticalHigh != null ? Number(matchedRange.criticalHigh) : null;
    const normLow = matchedRange.normalLow != null ? Number(matchedRange.normalLow) : null;
    const normHigh = matchedRange.normalHigh != null ? Number(matchedRange.normalHigh) : null;

    if (critLow !== null && num < critLow) {
      calculatedFlag = "CRITICAL";
    } else if (critHigh !== null && num > critHigh) {
      calculatedFlag = "CRITICAL";
    } else if (normLow !== null && num < normLow) {
      calculatedFlag = "LOW";
    } else if (normHigh !== null && num > normHigh) {
      calculatedFlag = "HIGH";
    } else {
      calculatedFlag = "NORMAL";
    }
  }

  return {
    parameterId: paramInput.parameterId,
    value: paramInput.value,
    flag: calculatedFlag,
    remark: paramInput.remark,
    snapshotReferenceMin: matchedRange?.normalLow != null ? Number(matchedRange.normalLow) : null,
    snapshotReferenceMax: matchedRange?.normalHigh != null ? Number(matchedRange.normalHigh) : null,
    snapshotUnit: parameter.unit || null,
    snapshotAgeText: age.ageDisplay,
    snapshotGender: patientDemographics?.gender ? String(patientDemographics.gender) : null,
    rawResult: parsed.rawResult,
    numericResult: parsed.numericResult,
    operator: parsed.operator,
    instrumentFlags: parsed.instrumentFlags,
  };
}
