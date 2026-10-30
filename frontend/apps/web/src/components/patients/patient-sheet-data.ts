import { formatClinicalBloodGroup, formatDobWithAge } from "@/lib/patient-form-utils";

/**
 * Data layer for the A4 patient registration form.
 * Rule: only real record values are shown. Anything missing prints as a dash,
 * never as an invented name, identifier, allergy or contact detail.
 */

export type PatientFormData = Record<string, any>;

export const DASH = "\u2014";

export const text = (v: unknown): string => {
  if (v === null || v === undefined) return DASH;
  if (Array.isArray(v)) {
    const joined = v
      .map((x) => (typeof x === "string" ? x : x?.name || x?.label || ""))
      .map((x) => String(x).trim())
      .filter(Boolean)
      .join(", ");
    return joined || DASH;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return String(o.name || o.label || o.title || DASH);
  }
  const s = String(v).trim();
  return s && s !== "null" && s !== "undefined" ? s : DASH;
};

const titleCase = (v: unknown): string => {
  const s = text(v);
  if (s === DASH) return DASH;
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const joinParts = (parts: unknown[]): string => {
  const out = parts.map((p) => text(p)).filter((p) => p !== DASH);
  return out.length ? out.join(", ") : DASH;
};

export interface SheetData {
  uhid: string;
  fullName: string;
  dobAge: string;
  sex: string;
  bloodGroup: string;
  patientType: string;
  maritalStatus: string;
  nationality: string;
  language: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  abha: string;
  abhaAddress: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  emergencyAddress: string;
  allergies: string;
  conditions: string;
  medications: string;
  remarks: string;
  insurer: string;
  policyNo: string;
  groupNo: string;
  expiry: string;
  schemes: string;
  referral: string;
  referringDoctor: string;
  collectionCenter: string;
  registeredOn: string;
  consents: { treatment: boolean; digitalComm: boolean; abhaExchange: boolean };
}

export function buildSheetData(p: PatientFormData = {}, patientId?: string): SheetData {
  const rawUhid = text(p.uhid);
  const idHint = patientId && /^(UHID|MRN)-/i.test(patientId) ? patientId : DASH;
  const uhid = rawUhid !== DASH ? rawUhid : idHint;

  const name = [p.title, p.firstName, p.middleName, p.lastName].map((x) => text(x)).filter((x) => x !== DASH);
  const fullName = name.length ? name.join(" ") : text(p.fullName || p.name);

  const dob = formatDobWithAge(p.dateOfBirth || null, p.age || null);
  const bg = text(p.bloodGroup);

  const schemeList: string[] = [];
  if (text(p.ayushmanBharatId) !== DASH) schemeList.push(`Ayushman Bharat (${text(p.ayushmanBharatId)})`);
  if (text(p.esicNumber) !== DASH) schemeList.push(`ESIC (${text(p.esicNumber)})`);
  if (p.cghs) schemeList.push("CGHS");
  if (p.echs) schemeList.push("ECHS");
  if (p.railwayEmployee) schemeList.push("Railway employee");

  const registered = p.createdAt ? new Date(p.createdAt) : null;

  return {
    uhid,
    fullName,
    dobAge: dob.combined,
    sex: titleCase(p.gender),
    bloodGroup: bg === DASH ? DASH : formatClinicalBloodGroup(bg),
    patientType: titleCase(p.patientType || p.category),
    maritalStatus: titleCase(p.maritalStatus),
    nationality: text(p.nationality),
    language: text(p.preferredLanguage || p.languages),
    phone: text(p.phone),
    whatsapp: text(p.whatsappNumber),
    email: text(p.email),
    address: joinParts([p.address, p.city, p.state, p.postalCode, p.country]),
    abha: text(p.abhaNumber || p.abhaId),
    abhaAddress: text(p.abhaAddress),
    emergencyName: text(p.emergencyContactName),
    emergencyRelation: titleCase(p.emergencyContactRelationship),
    emergencyPhone: text(p.emergencyContactPhone),
    emergencyAddress: text(p.emergencyContactAddress),
    allergies: text(p.allergies),
    conditions: text(p.medicalConditions || p.chronicConditions),
    medications: text(p.currentMedications),
    remarks: text(p.clinicalRemarks || p.additionalInformation || p.notes),
    insurer: text(p.insuranceProvider),
    policyNo: text(p.insuranceNumber || p.policyNumber),
    groupNo: text(p.insuranceGroupNumber),
    expiry: text(p.insuranceExpiryDate),
    schemes: schemeList.length ? schemeList.join("; ") : DASH,
    referral: titleCase(p.referralSource),
    referringDoctor: text(p.referringDoctorName || p.referringDoctor),
    collectionCenter: text(p.collectionCenter),
    registeredOn:
      registered && !Number.isNaN(registered.getTime())
        ? registered.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : DASH,
    consents: {
      treatment: Boolean(p.consentForTreatment),
      digitalComm: Boolean(p.dpdpDigitalCommConsent),
      abhaExchange: Boolean(p.dpdpAbhaExchangeConsent),
    },
  };
}
