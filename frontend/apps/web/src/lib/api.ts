export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(message: string, status = 400, code?: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ============================================================================
// REALISTIC CLINICAL DEMO DATASET (In-Memory State for AI Studio Environment)
// ============================================================================

const DEMO_PATIENTS = [
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
    isCritical: true,
    isVip: true,
    totalOrders: 4,
    chronicConditions: ["Hypertension", "Type 2 Diabetes"],
    allergies: ["Penicillin"],
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
    isCritical: false,
    isVip: false,
    totalOrders: 2,
    chronicConditions: [],
    allergies: [],
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
    isCritical: false,
    isVip: true,
    totalOrders: 3,
    chronicConditions: ["Hypothyroidism"],
    allergies: [],
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

const DEMO_DOCTORS = [
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

const DEMO_TESTS = [
  {
    id: "tst-001",
    testCode: "CBC-DIFF",
    testName: "Complete Blood Count with 5-Part Differential (CBC)",
    shortName: "CBC / Hemogram",
    sampleType: "WHOLE_BLOOD",
    sampleContainer: "Lavender Top (K2 EDTA)",
    method: "Automated 5-Part Flow Cytometry",
    price: 450,
    offerPrice: 350,
    tatHours: 4,
    isActive: true,
    isNablScope: true,
    category: { id: "cat-1", categoryName: "Hematology", name: "Hematology" },
    parameters: [
      { id: "prm-1", parameterName: "Hemoglobin (Hb)", unit: "g/dL", dataType: "NUMERIC", referenceRanges: [{ minValue: 13.0, maxValue: 17.0, interpretation: "13.0 - 17.0 g/dL" }] },
      { id: "prm-2", parameterName: "Total WBC Count", unit: "/µL", dataType: "NUMERIC", referenceRanges: [{ minValue: 4000, maxValue: 11000, interpretation: "4,000 - 11,000 /µL" }] },
      { id: "prm-3", parameterName: "Platelet Count", unit: "/µL", dataType: "NUMERIC", referenceRanges: [{ minValue: 150000, maxValue: 450000, interpretation: "150,000 - 450,000 /µL" }] },
    ],
  },
  {
    id: "tst-002",
    testCode: "K-SERUM",
    testName: "Serum Potassium (K+) ISE",
    shortName: "Potassium (K+)",
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
      { id: "prm-4", parameterName: "Serum Potassium (K+)", unit: "mmol/L", dataType: "NUMERIC", referenceRanges: [{ minValue: 3.5, maxValue: 5.1, interpretation: "3.5 - 5.1 mmol/L" }] },
    ],
  },
  {
    id: "tst-003",
    testCode: "LIPID-PRO",
    testName: "Comprehensive Lipid Profile (Coronary Risk)",
    shortName: "Lipid Profile",
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
      { id: "prm-5", parameterName: "Total Cholesterol", unit: "mg/dL", dataType: "NUMERIC", referenceRanges: [{ minValue: 120, maxValue: 200, interpretation: "< 200 mg/dL" }] },
      { id: "prm-6", parameterName: "Triglycerides", unit: "mg/dL", dataType: "NUMERIC", referenceRanges: [{ minValue: 40, maxValue: 150, interpretation: "< 150 mg/dL" }] },
    ],
  },
];

const DEMO_ORDERS = [
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
    patientId: DEMO_PATIENTS[0].id,
    patient: DEMO_PATIENTS[0],
    doctorId: DEMO_DOCTORS[0].id,
    doctor: DEMO_DOCTORS[0],
    items: [
      { id: "oi-1", testId: DEMO_TESTS[0].id, test: DEMO_TESTS[0], price: 450, finalPrice: 450, quantity: 1 },
      { id: "oi-2", testId: DEMO_TESTS[1].id, test: DEMO_TESTS[1], price: 300, finalPrice: 300, quantity: 1 },
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
    patientId: DEMO_PATIENTS[1].id,
    patient: DEMO_PATIENTS[1],
    doctorId: DEMO_DOCTORS[1].id,
    doctor: DEMO_DOCTORS[1],
    items: [
      { id: "oi-3", testId: DEMO_TESTS[2].id, test: DEMO_TESTS[2], price: 850, finalPrice: 850, quantity: 1 },
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

const DEMO_SAMPLES = [
  {
    id: "smp-001",
    sampleNumber: "SMP-2026-8801",
    barcode: "BC-8801-EDTA",
    patientId: DEMO_PATIENTS[0].id,
    orderId: DEMO_ORDERS[0].id,
    testId: DEMO_TESTS[0].id,
    sampleType: "WHOLE_BLOOD",
    status: "RECEIVED",
    priority: "STAT",
    collectedAt: new Date(Date.now() - 3000000).toISOString(),
    receivedAt: new Date(Date.now() - 2400000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    order: DEMO_ORDERS[0],
    test: DEMO_TESTS[0],
  },
  {
    id: "smp-002",
    sampleNumber: "SMP-2026-8802",
    barcode: "BC-8802-SST",
    patientId: DEMO_PATIENTS[1].id,
    orderId: DEMO_ORDERS[1].id,
    testId: DEMO_TESTS[2].id,
    sampleType: "SERUM",
    status: "PROCESSING",
    priority: "ROUTINE",
    collectedAt: new Date(Date.now() - 6800000).toISOString(),
    receivedAt: new Date(Date.now() - 6000000).toISOString(),
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date().toISOString(),
    order: DEMO_ORDERS[1],
    test: DEMO_TESTS[2],
  },
];

const DEMO_RESULTS = [
  {
    id: "res-001",
    orderId: DEMO_ORDERS[0].id,
    testId: DEMO_TESTS[1].id,
    status: "VERIFIED",
    remarks: "Critical Hyperkalemia verified by repeat ISE run.",
    interpretation: "Serum K+ critically elevated above 6.5 mmol/L.",
    enteredAt: new Date(Date.now() - 1800000).toISOString(),
    verifiedAt: new Date(Date.now() - 1200000).toISOString(),
    createdAt: new Date(Date.now() - 2400000).toISOString(),
    updatedAt: new Date().toISOString(),
    test: DEMO_TESTS[1],
    order: DEMO_ORDERS[0],
    enteredBy: { id: "u-1", employeeCode: "MLT-401", fullName: "Amitabh Sen", role: "LAB_TECH" },
    approvedBy: { id: "u-2", employeeCode: "DR-8812", fullName: "Dr. Rajeshwari Swaminathan", role: "PATHOLOGIST" },
    values: [
      {
        id: "rv-1",
        parameterId: "prm-4",
        value: "6.8",
        flag: "CRITICAL",
        parameter: DEMO_TESTS[1].parameters[0],
      },
    ],
  },
  {
    id: "res-002",
    orderId: DEMO_ORDERS[1].id,
    testId: DEMO_TESTS[0].id,
    status: "APPROVED",
    remarks: "Normocytic normochromic blood picture.",
    interpretation: "All hematological parameters within biological reference intervals.",
    enteredAt: new Date(Date.now() - 5400000).toISOString(),
    verifiedAt: new Date(Date.now() - 4800000).toISOString(),
    approvedAt: new Date(Date.now() - 3600000).toISOString(),
    publishedAt: new Date(Date.now() - 3500000).toISOString(),
    createdAt: new Date(Date.now() - 6000000).toISOString(),
    updatedAt: new Date().toISOString(),
    test: DEMO_TESTS[0],
    order: DEMO_ORDERS[1],
    enteredBy: { id: "u-1", employeeCode: "MLT-401", fullName: "Amitabh Sen", role: "LAB_TECH" },
    approvedBy: { id: "u-2", employeeCode: "DR-8812", fullName: "Dr. Rajeshwari Swaminathan", role: "PATHOLOGIST" },
    values: [
      {
        id: "rv-2",
        parameterId: "prm-1",
        value: "14.6",
        flag: "NORMAL",
        parameter: DEMO_TESTS[0].parameters[0],
      },
      {
        id: "rv-3",
        parameterId: "prm-2",
        value: "7200",
        flag: "NORMAL",
        parameter: DEMO_TESTS[0].parameters[1],
      },
    ],
  },
];

const DEMO_INVOICES = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2026-8801",
    orderId: DEMO_ORDERS[0].id,
    order: DEMO_ORDERS[0],
    patientId: DEMO_PATIENTS[0].id,
    patientName: DEMO_PATIENTS[0].fullName,
    patientUhid: DEMO_PATIENTS[0].uhid,
    doctorName: DEMO_DOCTORS[0].fullName,
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
    orderId: DEMO_ORDERS[1].id,
    order: DEMO_ORDERS[1],
    patientId: DEMO_PATIENTS[1].id,
    patientName: DEMO_PATIENTS[1].fullName,
    patientUhid: DEMO_PATIENTS[1].uhid,
    doctorName: DEMO_DOCTORS[1].fullName,
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

const DEMO_ANALYZERS = [
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

function createSafeApiProxy<T extends Record<string, any>>(target: T): T {
  return new Proxy(target, {
    get(obj, prop: string) {
      if (prop in obj) {
        return obj[prop];
      }
      return async (..._args: any[]) => ({
        success: true,
        data: [],
        message: "OK",
      });
    },
  });
}

export const patientApi = createSafeApiProxy({
  getAll: async (_query?: any) => ({
    success: true,
    data: {
      patients: DEMO_PATIENTS,
      items: DEMO_PATIENTS,
      kpis: {
        totalPatients: DEMO_PATIENTS.length,
        todayCount: 2,
        criticalCount: 1,
        vipCount: 2,
        activeCount: 3,
      },
      pagination: { page: 1, limit: 20, total: DEMO_PATIENTS.length, totalPages: 1 },
    },
  }),
  getById: async (id: string) => ({
    success: true,
    data: DEMO_PATIENTS.find((p) => p.id === id || p.uhid === id) || DEMO_PATIENTS[0],
  }),
  create: async (payload: any) => {
    const created = {
      ...DEMO_PATIENTS[0],
      ...payload,
      id: `pat-${Date.now()}`,
      uhid: payload?.uhid || `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: `${payload?.firstName || ""} ${payload?.lastName || ""}`.trim() || "New Patient",
      createdAt: new Date().toISOString(),
    };
    DEMO_PATIENTS.unshift(created);
    return { success: true, data: created };
  },
  update: async (id: string, payload: any) => ({
    success: true,
    data: { ...(DEMO_PATIENTS.find((p) => p.id === id) || DEMO_PATIENTS[0]), ...payload },
  }),
  getFamily: async () => ({ success: true, data: [] }),
  addToFamily: async (data: any) => ({ success: true, data }),
  removeFromFamily: async () => ({ success: true, data: {} }),
  getConsents: async () => ({ success: true, data: [] }),
  addConsent: async (data: any) => ({ success: true, data }),
  revokeConsent: async () => ({ success: true, data: {} }),
  getHistory: async () => ({ success: true, data: [] }),
  addHistory: async (data: any) => ({ success: true, data }),
  deleteHistory: async () => ({ success: true, data: {} }),
});

export const doctorApi = createSafeApiProxy({
  getAll: async () => ({
    success: true,
    data: {
      doctors: DEMO_DOCTORS,
      items: DEMO_DOCTORS,
      pagination: { page: 1, limit: 20, total: DEMO_DOCTORS.length, totalPages: 1 },
    },
  }),
  getById: async (id: string) => ({
    success: true,
    data: DEMO_DOCTORS.find((d) => d.id === id) || DEMO_DOCTORS[0],
  }),
  create: async (payload: any) => {
    const doc = {
      ...DEMO_DOCTORS[0],
      ...payload,
      id: `doc-${Date.now()}`,
      fullName: payload?.fullName || `Dr. ${payload?.firstName || ""} ${payload?.lastName || ""}`.trim(),
    };
    DEMO_DOCTORS.unshift(doc);
    return { success: true, data: doc };
  },
  update: async (id: string, payload: any) => ({
    success: true,
    data: { ...(DEMO_DOCTORS.find((d) => d.id === id) || DEMO_DOCTORS[0]), ...payload },
  }),
  delete: async () => ({ success: true, data: {} }),
  getCommission: async () => ({ success: true, data: { totalCommission: 24500, pendingPayout: 8200, payouts: [] } }),
  getStatistics: async () => ({ success: true, data: { totalDoctors: DEMO_DOCTORS.length, activeDoctors: DEMO_DOCTORS.length, totalReferrals: 244 } }),
  settlePayout: async (data: any) => ({ success: true, data }),
});

export const testApi = createSafeApiProxy({
  getAll: async () => ({
    success: true,
    data: {
      tests: DEMO_TESTS,
      items: DEMO_TESTS,
      pagination: { page: 1, limit: 50, total: DEMO_TESTS.length, totalPages: 1 },
    },
  }),
  getById: async (id: string) => ({
    success: true,
    data: DEMO_TESTS.find((t) => t.id === id || t.testCode === id) || DEMO_TESTS[0],
  }),
  create: async (payload: any) => ({
    success: true,
    data: { ...DEMO_TESTS[0], ...payload, id: `tst-${Date.now()}` },
  }),
  update: async (id: string, payload: any) => ({
    success: true,
    data: { ...(DEMO_TESTS.find((t) => t.id === id) || DEMO_TESTS[0]), ...payload },
  }),
  delete: async () => ({ success: true, data: {} }),
  getCategories: async () => ({
    success: true,
    data: [
      { id: "cat-1", categoryName: "Hematology & Coagulation", name: "Hematology & Coagulation", code: "HEM", testCount: 24 },
      { id: "cat-2", categoryName: "Clinical Biochemistry", name: "Clinical Biochemistry", code: "BIO", testCount: 42 },
      { id: "cat-3", categoryName: "Immunoassay & Endocrinology", name: "Immunoassay & Endocrinology", code: "IMM", testCount: 31 },
      { id: "cat-4", categoryName: "Microbiology & Serology", name: "Microbiology & Serology", code: "MIC", testCount: 19 },
    ],
  }),
  createCategory: async (payload: any) => ({ success: true, data: { id: `cat-${Date.now()}`, ...payload } }),
  updateCategory: async (id: string, payload: any) => ({ success: true, data: { id, ...payload } }),
  deleteCategory: async () => ({ success: true, data: {} }),
  getPackages: async () => ({
    success: true,
    data: [
      {
        id: "pkg-001",
        packageCode: "PKG-EXEC-2026",
        packageName: "Executive Master Full Body Checkup (78 Parameters)",
        price: 2499,
        offerPrice: 1799,
        tests: DEMO_TESTS,
        isActive: true,
      },
    ],
  }),
  getPackage: async () => ({
    success: true,
    data: {
      id: "pkg-001",
      packageCode: "PKG-EXEC-2026",
      packageName: "Executive Master Full Body Checkup (78 Parameters)",
      price: 2499,
      offerPrice: 1799,
      tests: DEMO_TESTS,
      isActive: true,
    },
  }),
  createPackage: async (payload: any) => ({ success: true, data: { id: `pkg-${Date.now()}`, ...payload } }),
  updatePackage: async (id: string, payload: any) => ({ success: true, data: { id, ...payload } }),
  deletePackage: async () => ({ success: true, data: {} }),
  getParameters: async () => ({
    success: true,
    data: DEMO_TESTS.flatMap((t) => t.parameters || []),
  }),
  addParameter: async (_testId: string, payload: any) => ({ success: true, data: { id: `prm-${Date.now()}`, ...payload } }),
  updateParameter: async (id: string, payload: any) => ({ success: true, data: { id, ...payload } }),
  deleteParameter: async () => ({ success: true, data: {} }),
  addReferenceRange: async (_paramId: string, payload: any) => ({ success: true, data: { id: `rr-${Date.now()}`, ...payload } }),
  updateReferenceRange: async (id: string, payload: any) => ({ success: true, data: { id, ...payload } }),
  deleteReferenceRange: async () => ({ success: true, data: {} }),
  bulkToggleActive: async () => ({ success: true, data: {} }),
});

export const orderApi = createSafeApiProxy({
  getAll: async (_query?: any) => ({
    success: true,
    data: {
      orders: DEMO_ORDERS,
      items: DEMO_ORDERS,
      pagination: { page: 1, limit: 20, total: DEMO_ORDERS.length, totalPages: 1 },
    },
  }),
  getById: async (id: string) => ({
    success: true,
    data: DEMO_ORDERS.find((o) => o.id === id || o.orderNumber === id) || DEMO_ORDERS[0],
  }),
  create: async (payload: any) => {
    const created = {
      ...DEMO_ORDERS[0],
      ...payload,
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-20261028-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
    DEMO_ORDERS.unshift(created);
    return { success: true, data: created };
  },
  update: async (id: string, payload: any) => ({
    success: true,
    data: { ...(DEMO_ORDERS.find((o) => o.id === id) || DEMO_ORDERS[0]), ...payload },
  }),
  cancel: async () => ({ success: true, data: {} }),
  collectSample: async () => ({ success: true, data: DEMO_SAMPLES[0] }),
  bulkUpdateStatus: async () => ({ success: true, data: {} }),
  getAnalytics: async () => ({
    success: true,
    data: {
      totalOrders: 142,
      pendingOrders: 18,
      completedOrders: 124,
      statOrders: 9,
      revenueToday: 68400,
    },
  }),
  getTATAnalytics: async () => ({
    success: true,
    data: {
      meanTatMinutes: 34,
      slaCompliancePercent: 98.4,
      breachedCount: 1,
    },
  }),
});

export const sampleApi = createSafeApiProxy({
  getAll: async () => ({
    success: true,
    data: {
      samples: DEMO_SAMPLES,
      items: DEMO_SAMPLES,
      pagination: { page: 1, limit: 20, total: DEMO_SAMPLES.length, totalPages: 1 },
    },
  }),
  getById: async (id: string) => ({
    success: true,
    data: DEMO_SAMPLES.find((s) => s.id === id || s.barcode === id) || DEMO_SAMPLES[0],
  }),
  getOne: async (id: string) => ({
    success: true,
    data: DEMO_SAMPLES.find((s) => s.id === id || s.barcode === id) || DEMO_SAMPLES[0],
  }),
  collect: async (id: string, payload?: any) => ({
    success: true,
    data: { ...(DEMO_SAMPLES.find((s) => s.id === id) || DEMO_SAMPLES[0]), status: "COLLECTED", ...payload },
  }),
  collectSample: async (id: string, payload?: any) => ({
    success: true,
    data: { ...(DEMO_SAMPLES.find((s) => s.id === id) || DEMO_SAMPLES[0]), status: "COLLECTED", ...payload },
  }),
  receive: async (id: string) => ({
    success: true,
    data: { ...(DEMO_SAMPLES.find((s) => s.id === id) || DEMO_SAMPLES[0]), status: "RECEIVED" },
  }),
  process: async (id: string) => ({
    success: true,
    data: { ...(DEMO_SAMPLES.find((s) => s.id === id) || DEMO_SAMPLES[0]), status: "PROCESSING" },
  }),
  complete: async (id: string) => ({
    success: true,
    data: { ...(DEMO_SAMPLES.find((s) => s.id === id) || DEMO_SAMPLES[0]), status: "COMPLETED" },
  }),
  reject: async (id: string, payload?: any) => ({
    success: true,
    data: { ...(DEMO_SAMPLES.find((s) => s.id === id) || DEMO_SAMPLES[0]), status: "REJECTED", ...payload },
  }),
  getTracking: async () => ({
    success: true,
    data: {
      stages: [
        { stage: "ORDERED", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "COMPLETED" },
        { stage: "COLLECTED", timestamp: new Date(Date.now() - 3000000).toISOString(), status: "COMPLETED" },
        { stage: "RECEIVED", timestamp: new Date(Date.now() - 2400000).toISOString(), status: "COMPLETED" },
      ],
    },
  }),
});

export const resultApi = createSafeApiProxy({
  getAll: async () => ({
    success: true,
    data: {
      results: DEMO_RESULTS,
      items: DEMO_RESULTS,
      pagination: { page: 1, limit: 20, total: DEMO_RESULTS.length, totalPages: 1 },
    },
  }),
  getById: async (id: string) => ({
    success: true,
    data: DEMO_RESULTS.find((r) => r.id === id) || DEMO_RESULTS[0],
  }),
  create: async (payload: any) => ({
    success: true,
    data: { ...DEMO_RESULTS[0], ...payload, id: `res-${Date.now()}` },
  }),
  update: async (id: string, payload: any) => ({
    success: true,
    data: { ...(DEMO_RESULTS.find((r) => r.id === id) || DEMO_RESULTS[0]), ...payload },
  }),
  verify: async (id: string) => ({
    success: true,
    data: { ...(DEMO_RESULTS.find((r) => r.id === id) || DEMO_RESULTS[0]), status: "VERIFIED" },
  }),
  approve: async (id: string) => ({
    success: true,
    data: { ...(DEMO_RESULTS.find((r) => r.id === id) || DEMO_RESULTS[0]), status: "APPROVED" },
  }),
  publish: async (id: string) => ({
    success: true,
    data: { ...(DEMO_RESULTS.find((r) => r.id === id) || DEMO_RESULTS[0]), status: "PUBLISHED" },
  }),
});

export const resultsApi = resultApi;

export const approvalApi = createSafeApiProxy({
  getPending: async () => ({
    success: true,
    data: {
      results: DEMO_RESULTS,
      pagination: { page: 1, limit: 20, total: DEMO_RESULTS.length, totalPages: 1 },
    },
  }),
  getById: async (id: string) => ({
    success: true,
    data: DEMO_RESULTS.find((r) => r.id === id) || DEMO_RESULTS[0],
  }),
  getMetrics: async () => ({
    success: true,
    data: {
      pendingApproval: 6,
      criticalValues: 2,
      approvedToday: 84,
      rejectedRerun: 1,
    },
  }),
  approve: async (id: string, remarks?: any) => ({
    success: true,
    data: { ...(DEMO_RESULTS.find((r) => r.id === id) || DEMO_RESULTS[0]), status: "APPROVED", ...remarks },
  }),
  batchApprove: async () => ({ success: true, data: { approvedCount: 2 } }),
  reject: async (id: string, payload?: any) => ({
    success: true,
    data: { ...(DEMO_RESULTS.find((r) => r.id === id) || DEMO_RESULTS[0]), status: "ENTERED", ...payload },
  }),
  getSignature: async () => ({
    success: true,
    data: {
      signedBy: "Dr. Rajeshwari Swaminathan (MD, FRCPath)",
      registrationNumber: "MMC-2014-88219",
      signedAt: new Date().toISOString(),
      sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
  }),
  verifySignature: async () => ({ success: true, data: { verified: true } }),
  getHistory: async () => ({ success: true, data: [] }),
  getAmendments: async () => ({ success: true, data: [] }),
  getPanicReadBackLedger: async () => ({ success: true, data: [] }),
  getTriageQueue: async () => ({
    success: true,
    data: { criticalPanic: [DEMO_RESULTS[0]], abnormal: [], normal: [DEMO_RESULTS[1]] },
  }),
  recordCriticalAck: async (data: any) => ({ success: true, data }),
  recordPanicReadBack: async (data: any) => ({ success: true, data }),
});

export const invoiceApi = createSafeApiProxy({
  getAll: async () => ({
    success: true,
    data: {
      invoices: DEMO_INVOICES,
      items: DEMO_INVOICES,
      pagination: { page: 1, limit: 20, total: DEMO_INVOICES.length, totalPages: 1 },
    },
  }),
  getById: async (id: string) => ({
    success: true,
    data: DEMO_INVOICES.find((i) => i.id === id || i.invoiceNumber === id) || DEMO_INVOICES[0],
  }),
  create: async (payload: any) => ({
    success: true,
    data: { ...DEMO_INVOICES[0], ...payload, id: `inv-${Date.now()}` },
  }),
  delete: async () => ({ success: true, data: {} }),
  getBillingMetrics: async () => ({
    success: true,
    data: {
      totalRevenue: 148500,
      collectedToday: 68400,
      pendingDues: 12350,
      refundsIssued: 1200,
      invoiceCount: DEMO_INVOICES.length,
    },
  }),
  processRefund: async (data: any) => ({ success: true, data }),
});

export const paymentApi = createSafeApiProxy({
  getAll: async () => ({
    success: true,
    data: {
      payments: [
        {
          id: "pay-001",
          receiptNumber: "RCP-2026-901",
          invoiceId: DEMO_INVOICES[0].id,
          orderId: DEMO_ORDERS[0].id,
          patientName: DEMO_PATIENTS[0].fullName,
          amount: 750,
          method: "UPI",
          status: "PAID",
          paidAt: new Date().toISOString(),
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
  }),
  getById: async () => ({
    success: true,
    data: {
      id: "pay-001",
      receiptNumber: "RCP-2026-901",
      amount: 750,
      method: "UPI",
      status: "PAID",
      paidAt: new Date().toISOString(),
    },
  }),
  create: async (data: any) => ({ success: true, data: { id: `pay-${Date.now()}`, ...data } }),
  createSplit: async (data: any) => ({ success: true, data: { id: `pay-${Date.now()}`, ...data } }),
  refund: async (data: any) => ({ success: true, data }),
  getMetrics: async () => ({
    success: true,
    data: {
      totalCollected: 68400,
      cashTotal: 24200,
      upiTotal: 31800,
      cardTotal: 12400,
    },
  }),
});

export const paymentsApi = paymentApi;

export const reportApi = createSafeApiProxy({
  getPublishedReports: async () => ({
    success: true,
    data: {
      reports: DEMO_RESULTS,
      items: DEMO_RESULTS,
      pagination: { page: 1, limit: 20, total: DEMO_RESULTS.length, totalPages: 1 },
    },
  }),
  getOrderReport: async (orderId: string) => ({
    success: true,
    data: {
      order: DEMO_ORDERS.find((o) => o.id === orderId) || DEMO_ORDERS[0],
      results: DEMO_RESULTS,
    },
  }),
});

export const reportsApi = createSafeApiProxy({
  ...reportApi,
  getSummary: async () => ({
    success: true,
    data: {
      totalReports: 142,
      verifiedReports: 128,
      pendingReports: 14,
      dispatchedWhatsApp: 119,
    },
  }),
  inlineApprove: async (id: string) => ({ success: true, data: { id, status: "APPROVED" } }),
  applyDigitalSignature: async (id: string, data: any) => ({ success: true, data: { id, ...data } }),
  sendReportToDoctor: async (_id: string, data: any) => ({ success: true, data }),
  addToPatientHistory: async (_id: string, data: any) => ({ success: true, data }),
  printReport: async (id: string) => ({ success: true, data: { id } }),
});

export const analyzersApi = createSafeApiProxy({
  getAll: async () => ({
    success: true,
    data: {
      analyzers: DEMO_ANALYZERS,
      items: DEMO_ANALYZERS,
    },
  }),
  getById: async (id: string) => ({
    success: true,
    data: DEMO_ANALYZERS.find((a) => a.id === id) || DEMO_ANALYZERS[0],
  }),
  create: async (data: any) => ({ success: true, data: { id: `anz-${Date.now()}`, ...data } }),
  updateStatus: async (id: string, status: string) => ({ success: true, data: { id, status } }),
  archive: async () => ({ success: true, data: {} }),
  testConnection: async () => ({ success: true, data: { connected: true, latencyMs: 4 } }),
  heartbeat: async () => ({ success: true, data: { alive: true } }),
  getHealth: async () => ({ success: true, data: { online: 2, total: 2, uptime: 99.98 } }),
  getDemoData: async () => ({ success: true, data: DEMO_ANALYZERS }),
  getTestMappings: async () => ({ success: true, data: [] }),
  createTestMapping: async (data: any) => ({ success: true, data }),
  updateTestMapping: async (_id: string, data: any) => ({ success: true, data }),
  deleteTestMapping: async () => ({ success: true, data: {} }),
  getQCRules: async () => ({ success: true, data: [] }),
  createQCRule: async (data: any) => ({ success: true, data }),
  updateQCRule: async (_id: string, data: any) => ({ success: true, data }),
  getWorklistEntries: async () => ({ success: true, data: [] }),
  createWorklistEntry: async (data: any) => ({ success: true, data }),
  updateWorklistEntry: async (_id: string, data: any) => ({ success: true, data }),
  sendSimulatorEvent: async (data: any) => ({ success: true, data }),
});

export const dashboardApi = createSafeApiProxy({
  getStats: async () => ({
    success: true,
    data: {
      totalPatients: 1480,
      todayOrders: 68,
      pendingSamples: 14,
      pendingApprovals: 6,
      criticalAlerts: 2,
      todayRevenue: 68400,
    },
  }),
  getMetrics: async () => ({
    success: true,
    data: {
      totalPatients: 1480,
      todayOrders: 68,
      pendingSamples: 14,
      pendingApprovals: 6,
      criticalAlerts: 2,
      todayRevenue: 68400,
    },
  }),
  getApprovalQueue: async () => ({ success: true, data: DEMO_RESULTS }),
  getAttentionResults: async () => ({ success: true, data: [DEMO_RESULTS[0]] }),
  acknowledgePanic: async (id: string) => ({ success: true, data: { id, acknowledged: true } }),
});

export const aiApi = createSafeApiProxy({
  getModels: async () => ({ success: true, data: [] }),
  getAudit: async () => ({ success: true, data: [] }),
  predict: async (data: any) => ({ success: true, data: { riskScore: 0.82, confidence: 0.96, ...data } }),
  analyzeCbc: async (data: any) => ({ success: true, data }),
  analyzeCoagulation: async (data: any) => ({ success: true, data }),
  analyzeNlp: async (data: any) => ({ success: true, data }),
  checkDrugInteractions: async (data: any) => ({ success: true, data }),
  classifyThyroid: async (data: any) => ({ success: true, data }),
  deltaCheck: async (data: any) => ({ success: true, data }),
  deployModel: async (data: any) => ({ success: true, data }),
  forecastTat: async (data: any) => ({ success: true, data }),
  generateSmartReport: async (data: any) => ({ success: true, data }),
  predictAmr: async (data: any) => ({ success: true, data }),
  trainClassical: async (data: any) => ({ success: true, data }),
  trainDeepLearning: async (data: any) => ({ success: true, data }),
});

export const authApi = createSafeApiProxy({
  forgotPassword: async () => ({ success: true, message: "Verification code dispatched." }),
  resetPassword: async () => ({ success: true, message: "Password updated." }),
  verifyMfa: async () => ({ success: true, data: {} }),
  verifyOwner: async () => ({ success: true, data: {} }),
});

export const communicationApi = createSafeApiProxy({
  getHistory: async (_id?: any) => ({ success: true, data: { communications: [] } as any }),
  sendWhatsApp: async (data: any) => ({ success: true, data, message: "OK" }),
  sendSMS: async (data: any) => ({ success: true, data, message: "OK" }),
  sendEmail: async (data: any) => ({ success: true, data, message: "OK" }),
  testWhatsApp: async (_data?: any) => ({ success: true, message: "WhatsApp gateway verified." }),
  testSmtp: async (_data?: any) => ({ success: true, message: "SMTP gateway verified." }),
  updateWhatsAppSettings: async (data: any) => ({ success: true, data }),
  updateSmtpSettings: async (data: any) => ({ success: true, data }),
  uploadPdf: async (_data?: any) => ({ success: true, data: { url: "/reports.html" } }),
});

export const laboratorySettingsApi = createSafeApiProxy({
  getSettings: async (_id?: any) => ({ success: true, data: {} as any }),
  updateSettings: async (data: any) => ({ success: true, data }),
  testWhatsApp: async (_data?: any) => ({ success: true, message: "Connected" }),
  testSmtp: async (_data?: any) => ({ success: true, message: "Connected" }),
});

export const microbiologyApi = createSafeApiProxy({
  listCultures: async () => ({ success: true, data: [] }),
  getPendingOrders: async () => ({ success: true, data: [] }),
  getAnalyzers: async () => ({ success: true, data: [] }),
  listAtccQc: async () => ({ success: true, data: [] }),
  listCriticalCalls: async () => ({ success: true, data: [] }),
  listEnvironmentalSwabs: async () => ({ success: true, data: [] }),
  accessionCulture: async (data: any) => ({ success: true, data }),
  recordGramStain: async (data: any) => ({ success: true, data }),
  recordIsolateAst: async (data: any) => ({ success: true, data }),
  recordAtccQc: async (data: any) => ({ success: true, data }),
  recordEnvironmentalSwab: async (data: any) => ({ success: true, data }),
  logCriticalCall: async (data: any) => ({ success: true, data }),
});

export const nexusApi = createSafeApiProxy({
  getFleetStatus: async (_sec?: any) => ({
    success: true,
    data: {
      fleet: DEMO_ANALYZERS,
      rejectedMessages: [],
      unacknowledgedAlerts: [],
    } as any,
  }),
});

export const searchApi = createSafeApiProxy({
  globalSearch: async (q: string) => ({
    success: true,
    data: {
      patients: DEMO_PATIENTS.filter((p) => p.fullName.toLowerCase().includes((q || "").toLowerCase())),
      orders: DEMO_ORDERS,
      tests: DEMO_TESTS,
    },
  }),
});

export const userApi = createSafeApiProxy({
  getAll: async () => ({ success: true, data: [] }),
  create: async (data: any) => ({ success: true, data }),
  activate: async (id: string) => ({ success: true, data: { id } }),
  suspend: async (id: string) => ({ success: true, data: { id } }),
  delete: async () => ({ success: true, data: {} }),
});

export const whatsappApi = createSafeApiProxy({
  getDashboard: async () => ({
    success: true,
    data: {
      messagesSentToday: 312,
      deliveryRate: 99.4,
      activeCampaigns: 3,
    },
  }),
});

export const advancesApi = createSafeApiProxy({
  create: async (data: any) => ({ success: true, data }),
  apply: async (data: any) => ({ success: true, data }),
});

export const refundsApi = createSafeApiProxy({
  create: async (data: any) => ({ success: true, data }),
});

export const cashCounterApi = createSafeApiProxy({
  getStatus: async () => ({ success: true, data: { isOpen: true, balance: 24200 } }),
});

export const settlementsApi = createSafeApiProxy({
  getAll: async () => ({ success: true, data: [] }),
});

export const barcodeApi = createSafeApiProxy({
  generate: async (data: any) => ({ success: true, data }),
});
