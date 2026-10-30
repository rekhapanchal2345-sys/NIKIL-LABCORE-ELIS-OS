import { getCurrentUserEmailKey, getUserVaultStorageKey } from "./auth";

export const SEED_PATIENTS = [
  {
    id: "pat-001",
    uhid: "UHID-2026-1001",
    firstName: "Rajeshwari",
    lastName: "Devi",
    fullName: "Rajeshwari Devi",
    gender: "FEMALE",
    age: 58,
    dateOfBirth: "1968-04-12",
    phone: "+91 98250 11223",
    email: "rajeshwari.devi@example.com",
    bloodGroup: "O+",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    address: "42 Kalyani Nagar, Pune",
    abhaNumber: "91-4821-7732-9910",
    abhaAddress: "rajeshwari.devi@abdm",
    status: "Critical",
    isActive: true,
    isCritical: true,
    isVip: true,
    totalOrders: 2,
    chronicConditions: ["Hypertension", "Type 2 Diabetes"],
    allergies: ["Penicillin"],
    familyMembers: [],
    consents: [],
    clinicalHistory: [],
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "pat-002",
    uhid: "UHID-2026-1002",
    firstName: "Vikramaditya",
    lastName: "Sharma",
    fullName: "Vikramaditya Sharma",
    gender: "MALE",
    age: 42,
    dateOfBirth: "1984-08-19",
    phone: "+91 98765 43210",
    email: "vikram.sharma@example.com",
    bloodGroup: "B+",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    address: "18 Marine Drive, Mumbai",
    abhaNumber: "91-3310-8841-1204",
    abhaAddress: "vikram.sharma@abdm",
    status: "Active",
    isActive: true,
    isCritical: false,
    isVip: false,
    totalOrders: 1,
    chronicConditions: [],
    allergies: [],
    familyMembers: [],
    consents: [],
    clinicalHistory: [],
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "pat-003",
    uhid: "UHID-2026-1003",
    firstName: "Ananya",
    lastName: "Chatterjee",
    fullName: "Ananya Chatterjee",
    gender: "FEMALE",
    age: 34,
    dateOfBirth: "1992-01-25",
    phone: "+91 98111 22334",
    email: "ananya.c@example.com",
    bloodGroup: "A+",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380001",
    address: "104 Navrangpura, Ahmedabad",
    abhaNumber: "91-5520-1920-4481",
    abhaAddress: "ananya.c@abdm",
    status: "Active",
    isActive: true,
    isCritical: false,
    isVip: true,
    totalOrders: 1,
    chronicConditions: ["Hypothyroidism"],
    allergies: [],
    familyMembers: [],
    consents: [],
    clinicalHistory: [],
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

export const SEED_DOCTORS = [
  {
    id: "doc-001",
    doctorCode: "DR-PATH-8812",
    firstName: "Rajeshwari",
    lastName: "Swaminathan",
    fullName: "Dr. Rajeshwari Swaminathan",
    name: "Dr. Rajeshwari Swaminathan",
    specialization: "Clinical Pathology & Hematology",
    qualification: "MD (Pathology), FRCPath",
    department: "Clinical Pathology",
    phone: "+91 98201 11223",
    email: "pathologist@labcore.com",
    registrationNumber: "MMC-2014-88219",
    clinicName: "LabCore Reference Pathology Institute",
    commissionRate: 15,
    doctorType: "IN_HOUSE_PATHOLOGIST",
    isActive: true,
    totalReferrals: 148,
    totalRevenue: 284500,
  },
  {
    id: "doc-002",
    doctorCode: "DR-CARD-1094",
    firstName: "Siddharth",
    lastName: "Mehta",
    fullName: "Dr. Siddharth Mehta",
    name: "Dr. Siddharth Mehta",
    specialization: "Interventional Cardiology & Critical Care",
    qualification: "MD (Medicine), DM (Cardiology)",
    department: "Cardiology & ICU",
    phone: "+91 98250 44556",
    email: "dr.mehta@hospital.com",
    registrationNumber: "GMC-2012-44102",
    clinicName: "Apex Heart & Critical Care Center",
    commissionRate: 12,
    doctorType: "REFERRING_DOCTOR",
    isActive: true,
    totalReferrals: 96,
    totalRevenue: 192000,
  },
];

export const SEED_CATEGORIES = [
  { id: "cat-1", categoryName: "Hematology & Coagulation", name: "Hematology & Coagulation", code: "HEM", testCount: 24 },
  { id: "cat-2", categoryName: "Clinical Biochemistry", name: "Clinical Biochemistry", code: "BIO", testCount: 42 },
  { id: "cat-3", categoryName: "Immunoassay & Endocrinology", name: "Immunoassay & Endocrinology", code: "IMM", testCount: 31 },
  { id: "cat-4", categoryName: "Microbiology & Serology", name: "Microbiology & Serology", code: "MIC", testCount: 19 },
];

export const SEED_TESTS = [
  {
    id: "tst-001",
    testCode: "CBC-DIFF",
    code: "CBC-DIFF",
    testName: "Complete Blood Count with 5-Part Differential (CBC)",
    name: "Complete Blood Count with 5-Part Differential (CBC)",
    shortName: "CBC / Hemogram",
    hsnSacCode: "999312",
    processingDepartment: "Hematology Core",
    sampleType: "WHOLE_BLOOD",
    sampleContainer: "Lavender Top (K2 EDTA)",
    method: "Automated 5-Part Flow Cytometry",
    price: 450,
    offerPrice: 350,
    tatHours: 4,
    isActive: true,
    isNablScope: true,
    category: { id: "cat-1", categoryName: "Hematology & Coagulation", name: "Hematology & Coagulation" },
    parameters: [
      { id: "prm-1", parameterName: "Hemoglobin (Hb)", unit: "g/dL", dataType: "NUMERIC", referenceRanges: [{ minValue: 13.0, maxValue: 17.0, normalLow: 13.0, normalHigh: 17.0, criticalLow: 7.0, criticalHigh: 20.0, interpretation: "13.0 - 17.0 g/dL" }] },
      { id: "prm-2", parameterName: "Total WBC Count", unit: "/µL", dataType: "NUMERIC", referenceRanges: [{ minValue: 4000, maxValue: 11000, normalLow: 4000, normalHigh: 11000, criticalLow: 2000, criticalHigh: 30000, interpretation: "4,000 - 11,000 /µL" }] },
      { id: "prm-3", parameterName: "Platelet Count", unit: "/µL", dataType: "NUMERIC", referenceRanges: [{ minValue: 150000, maxValue: 450000, normalLow: 150000, normalHigh: 450000, criticalLow: 20000, criticalHigh: 1000000, interpretation: "150,000 - 450,000 /µL" }] },
    ],
  },
  {
    id: "tst-002",
    testCode: "K-SERUM",
    code: "K-SERUM",
    testName: "Serum Potassium (K+) ISE",
    name: "Serum Potassium (K+) ISE",
    shortName: "Potassium (K+)",
    hsnSacCode: "999312",
    processingDepartment: "Clinical Biochemistry",
    sampleType: "SERUM",
    sampleContainer: "SST Gold Gel Tube",
    method: "Ion Selective Electrode (ISE)",
    price: 300,
    offerPrice: 250,
    tatHours: 2,
    isActive: true,
    isNablScope: true,
    category: { id: "cat-2", categoryName: "Clinical Biochemistry", name: "Clinical Biochemistry" },
    parameters: [
      { id: "prm-4", parameterName: "Serum Potassium (K+)", unit: "mmol/L", dataType: "NUMERIC", referenceRanges: [{ minValue: 3.5, maxValue: 5.1, normalLow: 3.5, normalHigh: 5.1, criticalLow: 2.8, criticalHigh: 6.2, interpretation: "3.5 - 5.1 mmol/L" }] },
    ],
  },
  {
    id: "tst-003",
    testCode: "LIPID-PRO",
    code: "LIPID-PRO",
    testName: "Comprehensive Lipid Profile (Coronary Risk)",
    name: "Comprehensive Lipid Profile (Coronary Risk)",
    shortName: "Lipid Profile",
    hsnSacCode: "999312",
    processingDepartment: "Clinical Biochemistry",
    sampleType: "SERUM",
    sampleContainer: "SST Gold Gel Tube",
    method: "Enzymatic Colorimetric",
    price: 850,
    offerPrice: 650,
    tatHours: 6,
    isActive: true,
    isNablScope: true,
    category: { id: "cat-2", categoryName: "Clinical Biochemistry", name: "Clinical Biochemistry" },
    parameters: [
      { id: "prm-5", parameterName: "Total Cholesterol", unit: "mg/dL", dataType: "NUMERIC", referenceRanges: [{ minValue: 120, maxValue: 200, normalLow: 120, normalHigh: 200, criticalLow: 50, criticalHigh: 350, interpretation: "< 200 mg/dL" }] },
      { id: "prm-6", parameterName: "Triglycerides", unit: "mg/dL", dataType: "NUMERIC", referenceRanges: [{ minValue: 40, maxValue: 150, normalLow: 40, normalHigh: 150, criticalLow: 20, criticalHigh: 500, interpretation: "< 150 mg/dL" }] },
    ],
  },
];

export const SEED_ANALYZERS = [
  {
    id: "anz-001",
    name: "Sysmex XN-1000 Hematology",
    code: "SYSMEX-XN1000",
    model: "XN-1000",
    manufacturer: "Sysmex Corporation",
    category: "Hematology",
    department: "Hematology Core",
    protocol: "HL7 v2.5.1",
    connectionType: "TCP/IP",
    ipAddress: "192.168.10.21",
    port: 5001,
    status: "ONLINE",
    location: "Bay 1 - Automated Track",
    isBidirectional: true,
    testsToday: 342,
    uptimePercent: 99.98,
    reagentLevel: 86,
  },
  {
    id: "anz-002",
    name: "Roche Cobas c501 Chemistry",
    code: "ROCHE-C501",
    model: "Cobas 6000 c501",
    manufacturer: "Roche Diagnostics",
    category: "Biochemistry",
    department: "Clinical Biochemistry",
    protocol: "ASTM E1394",
    connectionType: "TCP/IP",
    ipAddress: "192.168.10.22",
    port: 5002,
    status: "ONLINE",
    location: "Bay 2 - Core Chemistry",
    isBidirectional: true,
    testsToday: 618,
    uptimePercent: 99.95,
    reagentLevel: 74,
  },
];

export function buildInitialSeedVault(ownerEmail: string) {
  const patients = JSON.parse(JSON.stringify(SEED_PATIENTS));
  const doctors = JSON.parse(JSON.stringify(SEED_DOCTORS));
  const tests = JSON.parse(JSON.stringify(SEED_TESTS));
  const categories = JSON.parse(JSON.stringify(SEED_CATEGORIES));
  const analyzers = JSON.parse(JSON.stringify(SEED_ANALYZERS));

  const orders = [
    {
      id: "ord-001",
      orderNumber: "ORD-20261028-8801",
      barcode: "BC-8801-EDTA",
      orderStatus: "PROCESSING",
      status: "PROCESSING",
      paymentStatus: "PAID",
      priority: "STAT",
      totalAmount: 750,
      finalAmount: 750,
      paidAmount: 750,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      patientId: patients[0].id,
      patient: patients[0],
      doctorId: doctors[0].id,
      doctor: doctors[0],
      items: [
        { id: "oi-1", testId: tests[0].id, test: tests[0], price: 450, finalPrice: 450, quantity: 1 },
        { id: "oi-2", testId: tests[1].id, test: tests[1], price: 300, finalPrice: 300, quantity: 1 },
      ],
      samples: [
        {
          id: "smp-001",
          sampleNumber: "SMP-2026-8801",
          barcode: "BC-8801-EDTA",
          sampleType: "WHOLE_BLOOD",
          status: "RECEIVED",
          collectedAt: new Date(Date.now() - 3000000).toISOString(),
          receivedAt: new Date(Date.now() - 2400000).toISOString(),
        },
      ],
    },
    {
      id: "ord-002",
      orderNumber: "ORD-20261028-8802",
      barcode: "BC-8802-SST",
      orderStatus: "COMPLETED",
      status: "COMPLETED",
      paymentStatus: "PAID",
      priority: "ROUTINE",
      totalAmount: 850,
      finalAmount: 850,
      paidAmount: 850,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      patientId: patients[1].id,
      patient: patients[1],
      doctorId: doctors[1].id,
      doctor: doctors[1],
      items: [
        { id: "oi-3", testId: tests[2].id, test: tests[2], price: 850, finalPrice: 850, quantity: 1 },
      ],
      samples: [
        {
          id: "smp-002",
          sampleNumber: "SMP-2026-8802",
          barcode: "BC-8802-SST",
          sampleType: "SERUM",
          status: "COMPLETED",
          collectedAt: new Date(Date.now() - 6800000).toISOString(),
          receivedAt: new Date(Date.now() - 6000000).toISOString(),
        },
      ],
    },
  ];

  const samples = [
    {
      id: "smp-001",
      sampleNumber: "SMP-2026-8801",
      barcode: "BC-8801-EDTA",
      patientId: patients[0].id,
      orderId: orders[0].id,
      testId: tests[0].id,
      sampleType: "WHOLE_BLOOD",
      status: "RECEIVED",
      priority: "STAT",
      collectedAt: new Date(Date.now() - 3000000).toISOString(),
      receivedAt: new Date(Date.now() - 2400000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      order: orders[0],
      test: tests[0],
      trackingStages: [
        { stage: "ORDERED", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "COMPLETED" },
        { stage: "COLLECTED", timestamp: new Date(Date.now() - 3000000).toISOString(), status: "COMPLETED" },
        { stage: "RECEIVED", timestamp: new Date(Date.now() - 2400000).toISOString(), status: "COMPLETED" },
      ],
    },
    {
      id: "smp-002",
      sampleNumber: "SMP-2026-8802",
      barcode: "BC-8802-SST",
      patientId: patients[1].id,
      orderId: orders[1].id,
      testId: tests[2].id,
      sampleType: "SERUM",
      status: "COMPLETED",
      priority: "ROUTINE",
      collectedAt: new Date(Date.now() - 6800000).toISOString(),
      receivedAt: new Date(Date.now() - 6000000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date().toISOString(),
      order: orders[1],
      test: tests[2],
      trackingStages: [
        { stage: "ORDERED", timestamp: new Date(Date.now() - 7200000).toISOString(), status: "COMPLETED" },
        { stage: "COLLECTED", timestamp: new Date(Date.now() - 6800000).toISOString(), status: "COMPLETED" },
        { stage: "RECEIVED", timestamp: new Date(Date.now() - 6000000).toISOString(), status: "COMPLETED" },
        { stage: "COMPLETED", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "COMPLETED" },
      ],
    },
  ];

  const results = [
    {
      id: "res-001",
      orderId: orders[0].id,
      testId: tests[1].id,
      status: "VERIFIED",
      remarks: "Critical Hyperkalemia verified by repeat ISE run.",
      interpretation: "Serum K+ critically elevated above 6.5 mmol/L.",
      enteredAt: new Date(Date.now() - 1800000).toISOString(),
      verifiedAt: new Date(Date.now() - 1200000).toISOString(),
      createdAt: new Date(Date.now() - 2400000).toISOString(),
      updatedAt: new Date().toISOString(),
      test: tests[1],
      order: orders[0],
      enteredBy: { id: "u-1", employeeCode: "MLT-401", fullName: "Amitabh Sen", role: "LAB_TECH" },
      approvedBy: { id: "u-2", employeeCode: "DR-8812", fullName: "Dr. Rajeshwari Swaminathan", role: "PATHOLOGIST" },
      values: [
        { id: "rv-1", parameterId: "prm-4", value: "6.8", flag: "CRITICAL", parameter: tests[1].parameters[0] },
      ],
    },
    {
      id: "res-002",
      orderId: orders[1].id,
      testId: tests[0].id,
      status: "APPROVED",
      remarks: "Normocytic normochromic blood picture.",
      interpretation: "All hematological parameters within biological reference intervals.",
      enteredAt: new Date(Date.now() - 5400000).toISOString(),
      verifiedAt: new Date(Date.now() - 4800000).toISOString(),
      approvedAt: new Date(Date.now() - 3600000).toISOString(),
      publishedAt: new Date(Date.now() - 3500000).toISOString(),
      createdAt: new Date(Date.now() - 6000000).toISOString(),
      updatedAt: new Date().toISOString(),
      test: tests[0],
      order: orders[1],
      enteredBy: { id: "u-1", employeeCode: "MLT-401", fullName: "Amitabh Sen", role: "LAB_TECH" },
      approvedBy: { id: "u-2", employeeCode: "DR-8812", fullName: "Dr. Rajeshwari Swaminathan", role: "PATHOLOGIST" },
      values: [
        { id: "rv-2", parameterId: "prm-1", value: "14.6", flag: "NORMAL", parameter: tests[0].parameters[0] },
        { id: "rv-3", parameterId: "prm-2", value: "7200", flag: "NORMAL", parameter: tests[0].parameters[1] },
      ],
    },
  ];

  const invoices = [
    {
      id: "inv-001",
      invoiceNumber: "INV-2026-8801",
      orderId: orders[0].id,
      order: orders[0],
      patientId: patients[0].id,
      patientName: patients[0].fullName,
      patientUhid: patients[0].uhid,
      doctorName: doctors[0].fullName,
      subtotal: 750,
      grandTotal: 750,
      totalAmount: 750,
      netPayable: 750,
      paidAmount: 750,
      pendingAmount: 0,
      discount: 0,
      gstAmount: 0,
      paymentStatus: "PAID",
      status: "PAID",
      paymentMode: "UPI",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "inv-002",
      invoiceNumber: "INV-2026-8802",
      orderId: orders[1].id,
      order: orders[1],
      patientId: patients[1].id,
      patientName: patients[1].fullName,
      patientUhid: patients[1].uhid,
      doctorName: doctors[1].fullName,
      subtotal: 850,
      grandTotal: 850,
      totalAmount: 850,
      netPayable: 850,
      paidAmount: 500,
      pendingAmount: 350,
      discount: 0,
      gstAmount: 0,
      paymentStatus: "PARTIAL",
      status: "PARTIAL",
      paymentMode: "CASH",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const payments = [
    {
      id: "pay-001",
      receiptNumber: "RCP-2026-901",
      invoiceId: invoices[0].id,
      orderId: orders[0].id,
      patientName: patients[0].fullName,
      amount: 750,
      method: "UPI",
      status: "PAID",
      paidAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "pay-002",
      receiptNumber: "RCP-2026-902",
      invoiceId: invoices[1].id,
      orderId: orders[1].id,
      patientName: patients[1].fullName,
      amount: 500,
      method: "CASH",
      status: "PAID",
      paidAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const packages = [
    {
      id: "pkg-001",
      packageCode: "PKG-EXEC-2026",
      packageName: "Executive Master Full Body Checkup (78 Parameters)",
      price: 2499,
      offerPrice: 1799,
      tests,
      isActive: true,
    },
  ];

  return {
    ownerEmail,
    version: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    patients,
    doctors,
    tests,
    categories,
    packages,
    orders,
    samples,
    results,
    invoices,
    payments,
    analyzers,
    payouts: [] as any[],
    panicLedger: [] as any[],
    amendments: [] as any[],
    archivedLedger: [] as any[],
    communications: [] as any[],
    cultures: [] as any[],
    atccQc: [] as any[],
    criticalCalls: [] as any[],
    environmentalSwabs: [] as any[],
    users: [] as any[],
    testMappings: [] as any[],
    qcRules: [] as any[],
    worklistEntries: [] as any[],
    settings: {
      facilityName: "LABCORE MEDICAL DIAGNOSTICS & HOSPITAL",
      nablCert: "MC-6042",
      nabhCert: "HOSP-2026-8841",
      ownerEmail,
    },
  };
}

let memoryVaultCache: Record<string, ReturnType<typeof buildInitialSeedVault>> = {};

export function getUserVault() {
  const emailKey = getCurrentUserEmailKey();
  const storageKey = getUserVaultStorageKey(emailKey);

  if (typeof window === "undefined") {
    if (!memoryVaultCache[emailKey]) {
      memoryVaultCache[emailKey] = buildInitialSeedVault(emailKey);
    }
    return memoryVaultCache[emailKey];
  }

  try {
    const raw = localStorage.getItem(storageKey) || localStorage.getItem(`labcore_vault_backup_v3::${emailKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.patients)) {
        memoryVaultCache[emailKey] = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Vault read fallback:", err);
  }

  const freshVault = buildInitialSeedVault(emailKey);
  memoryVaultCache[emailKey] = freshVault;
  saveUserVault(freshVault);
  return freshVault;
}

function safeSerializeVault(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        if (value.id && value.orderNumber) {
          return { id: value.id, orderNumber: value.orderNumber, barcode: value.barcode, orderStatus: value.orderStatus, paymentStatus: value.paymentStatus, patient: value.patient, doctor: value.doctor };
        }
        return undefined;
      }
      seen.add(value);
    }
    return value;
  });
}

export function saveUserVault(vaultOverride?: ReturnType<typeof buildInitialSeedVault>) {
  const emailKey = getCurrentUserEmailKey();
  const vault = vaultOverride || memoryVaultCache[emailKey] || getUserVault();
  vault.updatedAt = new Date().toISOString();
  vault.ownerEmail = emailKey;
  memoryVaultCache[emailKey] = vault;

  if (typeof window !== "undefined") {
    const storageKey = getUserVaultStorageKey(emailKey);
    try {
      const serialized = safeSerializeVault(vault);
      localStorage.setItem(storageKey, serialized);
      localStorage.setItem(`labcore_vault_backup_v3::${emailKey}`, serialized);
    } catch (err) {
      console.warn("Vault write warning:", err);
    }
  }
  return vault;
}

export function softArchiveRecord(collectionName: string, record: any, reason = "Soft-Archived (Zero-Delete Vault Protection)") {
  const vault = getUserVault();
  const archivedStamp = {
    id: `arch-${Date.now()}`,
    collectionName,
    recordId: record?.id || "unknown",
    ownerEmail: vault.ownerEmail,
    archivedAt: new Date().toISOString(),
    reason,
    snapshot: JSON.parse(JSON.stringify(record || {})),
  };
  if (!Array.isArray(vault.archivedLedger)) vault.archivedLedger = [];
  vault.archivedLedger.unshift(archivedStamp);
  if (record && typeof record === "object") {
    record.isArchived = true;
    record.archivedAt = archivedStamp.archivedAt;
  }
  saveUserVault(vault);
  return archivedStamp;
}
