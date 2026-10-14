/**
 * HL7 FHIR R4 Service
 *
 * Converts LabCore ELIS test results into ABDM / NRCES-compliant
 * HL7 FHIR R4 DiagnosticReport Document Bundle.
 *
 * Bundle composition:
 *   1. Bundle (type: document)
 *   2. Composition (document metadata)
 *   3. Patient (ABHA-linked demographics)
 *   4. Organization (Laboratory)
 *   5. Practitioner (Signing pathologist / lab director)
 *   6. Specimen (sample type, collection datetime)
 *   7. Observation[]  (one per test parameter: value, unit, reference interval, interpretation)
 *   8. DiagnosticReport (status: final, references all observations, code, conclusion)
 */

import crypto from "crypto";
import prisma from "../../../config/database";
import abdmConfig from "./abdm.config";

// ─────────────────────────────────────────────────────────────
// FHIR Resource Builders
// ─────────────────────────────────────────────────────────────

function fhirId(): string {
  return crypto.randomUUID();
}

function buildPatientResource(patient: any): object {
  const identifier: any[] = [
    { system: "https://healthid.ndhm.gov.in", value: patient.uhid, use: "official" },
  ];
  if (patient.abhaNumber) {
    identifier.push({
      system: "https://healthid.ndhm.gov.in/abha",
      value: patient.abhaNumber,
      use: "official",
      type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "NNIND", display: "ABHA Number" }] },
    });
  }
  if (patient.abhaAddress) {
    identifier.push({
      system: "https://phr.abdm.gov.in",
      value: patient.abhaAddress,
    });
  }

  const gender =
    patient.gender === "MALE" ? "male" : patient.gender === "FEMALE" ? "female" : "other";

  return {
    resourceType: "Patient",
    id: "patient-" + patient.id,
    identifier,
    name: [{
      use: "official",
      text: [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ").trim(),
      family: patient.lastName,
      given: [patient.firstName, patient.middleName].filter(Boolean) as string[],
    }],
    gender,
    ...(patient.dateOfBirth ? { birthDate: new Date(patient.dateOfBirth).toISOString().slice(0, 10) } : {}),
    telecom: patient.phone ? [{ system: "phone", value: patient.phone }] : [],
    address: patient.address
      ? [{ text: [patient.address, patient.city, patient.state, patient.pincode].filter(Boolean).join(", "), city: patient.city, state: patient.state, postalCode: patient.pincode, country: "IN" }]
      : [],
  };
}

function buildOrganizationResource(): object {
  return {
    resourceType: "Organization",
    id: "organization-lab",
    name: abdmConfig.lab.name,
    identifier: [
      ...(abdmConfig.lab.registrationNumber ? [{ system: "https://facility.ndhm.gov.in", value: abdmConfig.lab.registrationNumber }] : []),
      ...(abdmConfig.lab.nablNumber ? [{ system: "https://www.nabl-india.org", value: abdmConfig.lab.nablNumber }] : []),
    ],
    telecom: abdmConfig.lab.phone ? [{ system: "phone", value: abdmConfig.lab.phone }] : [],
    address: abdmConfig.lab.address
      ? [{ text: abdmConfig.lab.address, country: "IN", state: abdmConfig.lab.stateCode }]
      : [],
  };
}

function buildPractitionerResource(doctor?: any): object {
  if (!doctor) {
    return {
      resourceType: "Practitioner",
      id: "practitioner-default",
      name: [{ text: abdmConfig.lab.name + " - Lab Director" }],
    };
  }
  return {
    resourceType: "Practitioner",
    id: "practitioner-" + doctor.id,
    name: [{ text: `Dr. ${doctor.fullName ?? doctor.name ?? ""}`, prefix: ["Dr."] }],
    identifier: doctor.registrationNumber
      ? [{ system: "https://doctor.ndhm.gov.in", value: doctor.registrationNumber }]
      : [],
    telecom: doctor.phone ? [{ system: "phone", value: doctor.phone }] : [],
  };
}

function buildSpecimenResource(sample: any): object {
  const sampleTypeMap: Record<string, { code: string; display: string }> = {
    BLOOD: { code: "119297000", display: "Blood specimen" },
    URINE: { code: "122575003", display: "Urine specimen" },
    STOOL: { code: "119339001", display: "Fecal specimen" },
    SERUM: { code: "119364003", display: "Serum specimen" },
    PLASMA: { code: "119361006", display: "Plasma specimen" },
    CSF: { code: "258450006", display: "Cerebrospinal fluid specimen" },
    SWAB: { code: "257261003", display: "Swab" },
  };

  const sampleType = sampleTypeMap[sample.sampleType?.toUpperCase()] ?? { code: "123038009", display: "Specimen" };

  return {
    resourceType: "Specimen",
    id: "specimen-" + sample.id,
    status: "available",
    type: {
      coding: [{ system: "http://snomed.info/sct", code: sampleType.code, display: sampleType.display }],
      text: sample.sampleType,
    },
    collection: {
      ...(sample.collectedAt ? { collectedDateTime: new Date(sample.collectedAt).toISOString() } : {}),
      collector: { reference: "#practitioner-default" },
    },
    container: sample.container ? [{ description: sample.container }] : [],
    note: sample.remarks ? [{ text: sample.remarks }] : [],
  };
}

// A ResultValue row joined with its TestParameter and (optional) reference range
// is what backs a laboratory Observation.
function buildObservationResource(
  resultValue: any,
  patientRef: string,
  specimenRef: string
): object {
  const parameter = resultValue.parameter ?? {};
  const range = parameter.referenceRanges?.[0] ?? {};

  const numericValue = parseFloat(resultValue.value);
  const isNumeric =
    parameter.dataType === "NUMERIC" && Number.isFinite(numericValue);

  const value: any = isNumeric
    ? {
        valueQuantity: {
          value: numericValue,
          unit: parameter.unit ?? "",
          system: "http://unitsofmeasure.org",
          code: parameter.unit ?? "",
        },
      }
    : { valueString: resultValue.value ?? "" };

  const low = range.normalLow ?? null;
  const high = range.normalHigh ?? null;

  const interpretation = resolveInterpretation(resultValue.flag);

  return {
    resourceType: "Observation",
    id: "obs-" + resultValue.id,
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "laboratory",
            display: "Laboratory",
          },
        ],
      },
    ],
    code: {
      coding: parameter.loincCode
        ? [
            {
              system: "http://loinc.org",
              code: parameter.loincCode,
              display: parameter.parameterName,
            },
          ]
        : [],
      text: parameter.parameterName ?? "Result",
    },
    subject: { reference: patientRef },
    specimen: { reference: specimenRef },
    effectiveDateTime: new Date(
      resultValue.updatedAt ?? Date.now()
    ).toISOString(),
    ...value,
    referenceRange:
      low !== null || high !== null
        ? [
            {
              ...(low !== null ? { low: { value: parseFloat(low), unit: parameter.unit ?? "" } } : {}),
              ...(high !== null ? { high: { value: parseFloat(high), unit: parameter.unit ?? "" } } : {}),
              text: `${low ?? ""}${low !== null && high !== null ? " - " : ""}${high ?? ""} ${parameter.unit ?? ""}`.trim(),
            },
          ]
        : [],
    interpretation: interpretation
      ? [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                code: interpretation.code,
                display: interpretation.display,
              },
            ],
            text: interpretation.display,
          },
        ]
      : [],
    note: resultValue.remark ? [{ text: resultValue.remark }] : [],
  };
}

// ResultValue.flag is the authoritative abnormality marker written at result entry.
function resolveInterpretation(flag: string | null): { code: string; display: string } | null {
  switch (flag) {
    case "HIGH":
      return { code: "H", display: "High" };
    case "LOW":
      return { code: "L", display: "Low" };
    case "CRITICAL":
      return { code: "AA", display: "Critical abnormal" };
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Main: Build FHIR Bundle for an Order
// ─────────────────────────────────────────────────────────────

export async function buildFhirBundle(orderId: string): Promise<object> {
  // Load order with patient and specimens; results hang off the Order (not the
  // Sample), so they are fetched separately and matched by testId.
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      patient: true,
      samples: true,
    },
  });

  if (!order) throw new Error(`Order ${orderId} not found`);

  const results = await prisma.result.findMany({
    where: { orderId },
    include: {
      values: {
        include: {
          parameter: { include: { referenceRanges: true } },
        },
      },
      test: { select: { testCode: true, testName: true } },
      verifiedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const resultsByTestId = new Map<string, typeof results>();
  for (const result of results) {
    const bucket = resultsByTestId.get(result.testId);
    if (bucket) {
      bucket.push(result);
    } else {
      resultsByTestId.set(result.testId, [result]);
    }
  }

  const patient = order.patient as any;
  const samples = order.samples as any[];
  const bundleId = crypto.randomUUID();
  const now = new Date().toISOString();

  const patientResource = buildPatientResource(patient);
  const patientRef = `Patient/patient-${patient.id}`;
  const orgResource = buildOrganizationResource();
  const orgRef = "Organization/organization-lab";

  // Collect all resources
  const entries: any[] = [];
  const drObsRefs: any[] = [];
  const specimenRefs: any[] = [];

  // Get first verifying doctor across all results
  const verifyingPractitioner = results.find(r => r.verifiedBy)?.verifiedBy ?? null;

  const practitionerResource = buildPractitionerResource(verifyingPractitioner);
  const practitionerRef = `Practitioner/practitioner-${verifyingPractitioner?.id ?? "default"}`;

  // Specimens: one per sample, keyed by testId so results can find their specimen.
  const specimenIdByTestId = new Map<string, string>();
  for (const sample of samples) {
    const specimenResource = buildSpecimenResource(sample);
    const specimenId = `Specimen/specimen-${sample.id}`;
    specimenRefs.push({ reference: specimenId });
    entries.push({ fullUrl: specimenId, resource: specimenResource });
    if (!specimenIdByTestId.has(sample.testId)) {
      specimenIdByTestId.set(sample.testId, specimenId);
    }
  }

  // Observations: every stored result value, regardless of sample linkage.
  const fallbackSpecimenId = specimenRefs[0]?.reference ?? "";
  for (const result of results) {
    const specimenId =
      specimenIdByTestId.get(result.testId) ?? fallbackSpecimenId;

    for (const resultValue of result.values) {
      const obsResource = buildObservationResource(
        resultValue,
        patientRef,
        specimenId
      );
      const obsId = `Observation/obs-${resultValue.id}`;
      drObsRefs.push({ reference: obsId });
      entries.push({ fullUrl: obsId, resource: obsResource });
    }
  }

  // DiagnosticReport
  const drId = `DiagnosticReport/dr-${orderId}`;
  const diagnosticReport = {
    resourceType: "DiagnosticReport",
    id: "dr-" + orderId,
    status: "final",
    category: [
      {
        coding: [
          { system: "http://terminology.hl7.org/CodeSystem/v2-0074", code: "LAB", display: "Laboratory" },
        ],
      },
    ],
    code: {
      coding: [
        { system: "http://loinc.org", code: "11502-2", display: "Laboratory report" },
      ],
      text: "Diagnostic Laboratory Report",
    },
    subject: { reference: patientRef },
    effectiveDateTime: (order as any).createdAt ? new Date((order as any).createdAt).toISOString() : now,
    issued: now,
    performer: [{ reference: orgRef }, { reference: practitionerRef }],
    specimen: specimenRefs,
    result: drObsRefs,
    conclusion: "See individual observations for details.",
    identifier: [
      {
        system: `https://hip.${abdmConfig.hipId.toLowerCase()}.in/orders`,
        value: (order as any).orderNumber ?? orderId,
      },
    ],
    presentedForm: [
      {
        contentType: "application/pdf",
        data: "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLYyMDI1MDY1MlSxjK2OBrGQDC5AgkAAK/X/PAgB1SgjBCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKMzEKZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1IDg0Ml0vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDEgMCBSPj4+Pi9Db250ZW50cyAyIDAgUi9QYXJlbnQgNSAwIFI+PgplbmRvYmoKCjEgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCgo1IDAgb2JqCjw8L1R5cGUvUGFnZXMvQ291bnQgMS9LaWRzWzQgMCBSXT4+CmVuZG9iagoKNiAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNSAwIFI+PgplbmRvYmoKCjcgMCBvYmoKPDwvUHJvZHVjZXIoZ2hvc3RzY3JpcHQpL0NyZWF0aW9uRGF0ZShEOjIwMjExMDAyMjIwMzMzWik+PgplbmRvYmoKCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI1OCAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxMzUgMDAwMDAgbiAKMDAwMDAwMDE1NCAwMDAwMCBuIAowMDAwMDAwMzQ2IDAwMDAwIG4gCjAwMDAwMDA0MDUgMDAwMDAgbiAKMDAwMDAwMDQ1NSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgOC9Sb290IDYgMCBSL0luZm8gNyAwIFIvSUQoKT4+CnN0YXJ0eHJlZgo1NTkKJSVFT0YK", // Base64 empty PDF placeholder (in production, generate from report service)
        title: "Diagnostic Report PDF",
      }
    ]
  };

  // Composition (document entry point)
  const compositionResource = {
    resourceType: "Composition",
    id: "comp-" + orderId,
    status: "final",
    type: {
      coding: [{ system: "http://loinc.org", code: "11502-2", display: "Laboratory report" }],
      text: "Diagnostic Report",
    },
    subject: { reference: patientRef },
    date: now,
    author: [{ reference: orgRef }],
    title: `Diagnostic Report – ${abdmConfig.lab.name}`,
    section: [
      {
        title: "Laboratory Results",
        code: { coding: [{ system: "http://loinc.org", code: "30954-2" }] },
        entry: [{ reference: drId }],
      },
    ],
  };

  // Assemble final Bundle
  const bundle = {
    resourceType: "Bundle",
    id: bundleId,
    meta: {
      lastUpdated: now,
      profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"],
    },
    identifier: { system: "https://hip.abdm.gov.in/bundles", value: bundleId },
    type: "document",
    timestamp: now,
    entry: [
      { fullUrl: `Composition/comp-${orderId}`, resource: compositionResource },
      { fullUrl: patientRef, resource: patientResource },
      { fullUrl: orgRef, resource: orgResource },
      { fullUrl: practitionerRef, resource: practitionerResource },
      { fullUrl: drId, resource: diagnosticReport },
      ...entries,
    ],
  };

  return bundle;
}
