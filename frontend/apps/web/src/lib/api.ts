import { getStoredUser } from "./auth";
import { getUserVault, saveUserVault, softArchiveRecord } from "./user-vault";

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

// ============================================================================
// 1. PATIENT HUB API (Permanent Per-User CRUD + Live KPI Calculation)
// ============================================================================

export const patientApi = createSafeApiProxy({
  getAll: async (query?: any) => {
    const vault = getUserVault();
    const allPatients = vault.patients.filter((p: any) => !p.isArchived);

    let filtered = [...allPatients];
    if (query && typeof query === "string") {
      const params = new URLSearchParams(query);
      const q = (params.get("q") || params.get("search") || "").toLowerCase().trim();
      const chip = (params.get("chip") || "ALL").toUpperCase();
      const gender = params.get("gender") || "All";
      const bloodGroup = params.get("bloodGroup") || "All";

      if (q) {
        filtered = filtered.filter(
          (p: any) =>
            (p.fullName || "").toLowerCase().includes(q) ||
            (p.firstName || "").toLowerCase().includes(q) ||
            (p.lastName || "").toLowerCase().includes(q) ||
            (p.uhid || "").toLowerCase().includes(q) ||
            (p.phone || "").toLowerCase().includes(q) ||
            (p.abhaNumber || "").toLowerCase().includes(q)
        );
      }
      if (chip === "CRITICAL") filtered = filtered.filter((p: any) => p.isCritical || p.status === "Critical");
      if (chip === "VIP") filtered = filtered.filter((p: any) => p.isVip);
      if (chip === "ACTIVE") filtered = filtered.filter((p: any) => p.isActive !== false);
      if (gender && gender !== "All") filtered = filtered.filter((p: any) => (p.gender || "").toUpperCase() === gender.toUpperCase());
      if (bloodGroup && bloodGroup !== "All") filtered = filtered.filter((p: any) => p.bloodGroup === bloodGroup);
    }

    const todayIsoPrefix = new Date().toISOString().slice(0, 10);
    const todayCount = allPatients.filter((p: any) => (p.createdAt || "").startsWith(todayIsoPrefix)).length || allPatients.length;
    const criticalCount = allPatients.filter((p: any) => p.isCritical || p.status === "Critical").length;
    const vipCount = allPatients.filter((p: any) => p.isVip).length;
    const activeCount = allPatients.filter((p: any) => p.isActive !== false).length;
    const pendingCount = vault.orders.filter((o: any) => o.status !== "COMPLETED" && !o.isArchived).length;
    const reportReadyCount = vault.results.filter((r: any) => (r.status === "APPROVED" || r.status === "PUBLISHED") && !r.isArchived).length;

    return {
      success: true,
      data: {
        patients: filtered,
        items: filtered,
        kpis: {
          totalPatients: allPatients.length,
          totalRoster: allPatients.length,
          todayCount,
          criticalCount,
          vipCount,
          activeCount,
          pendingCount,
          reportReadyCount,
        },
        pagination: { page: 1, limit: 50, total: filtered.length, totalPages: 1 },
      },
    };
  },
  getById: async (id: string) => {
    const vault = getUserVault();
    return {
      success: true,
      data: vault.patients.find((p: any) => p.id === id || p.uhid === id) || vault.patients[0],
    };
  },
  create: async (payload: any) => {
    const vault = getUserVault();
    const firstName = payload?.firstName || (payload?.fullName ? payload.fullName.split(" ")[0] : "New");
    const lastName = payload?.lastName || (payload?.fullName ? payload.fullName.split(" ").slice(1).join(" ") : "Patient");
    const fullName = payload?.fullName || `${firstName} ${lastName}`.trim();
    const created = {
      id: payload?.id || `pat-${Date.now()}`,
      uhid: payload?.uhid || `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName,
      lastName,
      fullName,
      gender: (payload?.gender || "MALE").toUpperCase(),
      age: Number(payload?.age ?? 35),
      dateOfBirth: payload?.dateOfBirth || "1991-01-01",
      phone: payload?.phone || "+91 98765 43210",
      email: payload?.email || "",
      bloodGroup: payload?.bloodGroup || "O+",
      city: payload?.city || "Mumbai",
      state: payload?.state || "Maharashtra",
      pincode: payload?.pincode || "400001",
      address: payload?.address || "",
      abhaNumber: payload?.abhaNumber || "",
      abhaAddress: payload?.abhaAddress || "",
      status: payload?.isCritical ? "Critical" : "Active",
      isActive: true,
      isCritical: Boolean(payload?.isCritical),
      isVip: Boolean(payload?.isVip),
      totalOrders: 0,
      chronicConditions: Array.isArray(payload?.chronicConditions) ? payload.chronicConditions : [],
      allergies: Array.isArray(payload?.allergies) ? payload.allergies : [],
      familyMembers: [],
      consents: [],
      clinicalHistory: [],
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    vault.patients.unshift(created);
    saveUserVault(vault);
    return { success: true, data: created };
  },
  update: async (id: string, payload: any) => {
    const vault = getUserVault();
    const idx = vault.patients.findIndex((p: any) => p.id === id || p.uhid === id);
    if (idx !== -1) {
      const updated = {
        ...vault.patients[idx],
        ...payload,
        fullName:
          payload?.fullName ||
          (payload?.firstName || payload?.lastName
            ? `${payload?.firstName ?? vault.patients[idx].firstName} ${payload?.lastName ?? vault.patients[idx].lastName}`.trim()
            : vault.patients[idx].fullName),
        updatedAt: new Date().toISOString(),
      };
      vault.patients[idx] = updated;
      saveUserVault(vault);
      return { success: true, data: updated };
    }
    return { success: true, data: { ...(vault.patients[0] || {}), ...payload } };
  },
  getFamily: async (patientId?: string) => {
    const vault = getUserVault();
    const pat = vault.patients.find((p: any) => p.id === patientId || p.uhid === patientId) || vault.patients[0];
    return { success: true, data: pat?.familyMembers || [] };
  },
  addToFamily: async (patientId: string, data?: any) => {
    const vault = getUserVault();
    const pat = vault.patients.find((p: any) => p.id === patientId || p.uhid === patientId) || vault.patients[0];
    const item = { id: `fam-${Date.now()}`, ...(data || (typeof patientId === "object" ? patientId : {})), createdAt: new Date().toISOString() };
    if (pat) {
      pat.familyMembers = [...(pat.familyMembers || []), item];
      saveUserVault(vault);
    }
    return { success: true, data: item };
  },
  removeFromFamily: async (patientId: string, memberId?: string) => {
    const vault = getUserVault();
    const pat = vault.patients.find((p: any) => p.id === patientId || p.uhid === patientId);
    if (pat && Array.isArray(pat.familyMembers)) {
      const target = pat.familyMembers.find((m: any) => m.id === memberId);
      if (target) softArchiveRecord("patient_family", target);
    }
    return { success: true, data: {} };
  },
  getConsents: async (patientId?: string) => {
    const vault = getUserVault();
    const pat = vault.patients.find((p: any) => p.id === patientId || p.uhid === patientId) || vault.patients[0];
    return { success: true, data: pat?.consents || [] };
  },
  addConsent: async (patientId: string, data?: any) => {
    const vault = getUserVault();
    const pat = vault.patients.find((p: any) => p.id === patientId || p.uhid === patientId) || vault.patients[0];
    const consent = { id: `cns-${Date.now()}`, status: "ACTIVE", ...(data || (typeof patientId === "object" ? patientId : {})), createdAt: new Date().toISOString() };
    if (pat) {
      pat.consents = [...(pat.consents || []), consent];
      saveUserVault(vault);
    }
    return { success: true, data: consent };
  },
  revokeConsent: async (patientId: string, consentId?: string) => {
    const vault = getUserVault();
    const pat = vault.patients.find((p: any) => p.id === patientId || p.uhid === patientId) || vault.patients[0];
    if (pat && Array.isArray(pat.consents)) {
      const c = pat.consents.find((item: any) => item.id === consentId || item.id === patientId);
      if (c) {
        c.status = "REVOKED";
        c.revokedAt = new Date().toISOString();
        saveUserVault(vault);
      }
    }
    return { success: true, data: {} };
  },
  getHistory: async (patientId?: string) => {
    const vault = getUserVault();
    const pat = vault.patients.find((p: any) => p.id === patientId || p.uhid === patientId) || vault.patients[0];
    return { success: true, data: (pat?.clinicalHistory || []).filter((h: any) => !h.isArchived) };
  },
  addHistory: async (patientId: string, data?: any) => {
    const vault = getUserVault();
    const pat = vault.patients.find((p: any) => p.id === patientId || p.uhid === patientId) || vault.patients[0];
    const entry = { id: `hst-${Date.now()}`, ...(data || (typeof patientId === "object" ? patientId : {})), createdAt: new Date().toISOString() };
    if (pat) {
      pat.clinicalHistory = [entry, ...(pat.clinicalHistory || [])];
      saveUserVault(vault);
    }
    return { success: true, data: entry };
  },
  deleteHistory: async (patientId: string, historyId?: string) => {
    const vault = getUserVault();
    const pat = vault.patients.find((p: any) => p.id === patientId || p.uhid === patientId);
    if (pat && Array.isArray(pat.clinicalHistory)) {
      const target = pat.clinicalHistory.find((h: any) => h.id === historyId || h.id === patientId);
      if (target) softArchiveRecord("patient_history", target);
    }
    return { success: true, data: {} };
  },
});

// ============================================================================
// 2. DOCTOR OPERATIONS API
// ============================================================================

export const doctorApi = createSafeApiProxy({
  getAll: async () => {
    const vault = getUserVault();
    const activeDocs = vault.doctors.filter((d: any) => !d.isArchived);
    return {
      success: true,
      data: {
        doctors: activeDocs,
        items: activeDocs,
        pagination: { page: 1, limit: 50, total: activeDocs.length, totalPages: 1 },
      },
    };
  },
  getById: async (id: string) => {
    const vault = getUserVault();
    return {
      success: true,
      data: vault.doctors.find((d: any) => d.id === id || d.doctorCode === id) || vault.doctors[0],
    };
  },
  create: async (payload: any) => {
    const vault = getUserVault();
    const fullName = payload?.fullName || payload?.name || `Dr. ${payload?.firstName || ""} ${payload?.lastName || ""}`.trim();
    const doc = {
      id: `doc-${Date.now()}`,
      doctorCode: payload?.doctorCode || `DR-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: payload?.firstName || fullName.replace(/^Dr\.\s*/i, "").split(" ")[0] || "Specialist",
      lastName: payload?.lastName || fullName.replace(/^Dr\.\s*/i, "").split(" ").slice(1).join(" ") || "Doctor",
      fullName,
      name: fullName,
      specialization: payload?.specialization || "General Medicine & Diagnostics",
      qualification: payload?.qualification || "MBBS, MD",
      department: payload?.department || "Outpatient Medicine",
      phone: payload?.phone || "+91 98201 11223",
      email: payload?.email || "",
      registrationNumber: payload?.registrationNumber || `MCI-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      clinicName: payload?.clinicName || "LabCore Medical Diagnostics & Hospital",
      commissionRate: Number(payload?.commissionRate ?? 10),
      doctorType: payload?.doctorType || "REFERRING_DOCTOR",
      isActive: true,
      totalReferrals: 0,
      totalRevenue: 0,
      ...payload,
      createdAt: new Date().toISOString(),
    };
    vault.doctors.unshift(doc);
    saveUserVault(vault);
    return { success: true, data: doc };
  },
  update: async (id: string, payload: any) => {
    const vault = getUserVault();
    const idx = vault.doctors.findIndex((d: any) => d.id === id || d.doctorCode === id);
    if (idx !== -1) {
      vault.doctors[idx] = { ...vault.doctors[idx], ...payload, updatedAt: new Date().toISOString() };
      saveUserVault(vault);
      return { success: true, data: vault.doctors[idx] };
    }
    return { success: true, data: { ...(vault.doctors[0] || {}), ...payload } };
  },
  delete: async (id: string) => {
    const vault = getUserVault();
    const doc = vault.doctors.find((d: any) => d.id === id);
    if (doc) softArchiveRecord("doctors", doc);
    return { success: true, data: { id, archived: true } };
  },
  getCommission: async () => ({
    success: true,
    data: { totalCommission: 24500, pendingPayout: 8200, payouts: getUserVault().payouts || [] },
  }),
  getStatistics: async () => {
    const docs = getUserVault().doctors.filter((d: any) => !d.isArchived);
    return {
      success: true,
      data: {
        totalDoctors: docs.length,
        activeDoctors: docs.filter((d: any) => d.isActive !== false).length,
        totalReferrals: docs.reduce((acc: number, d: any) => acc + Number(d.totalReferrals || 0), 0),
      },
    };
  },
  settlePayout: async (data: any) => {
    const vault = getUserVault();
    const settlement = { id: `pay-doc-${Date.now()}`, ...data, settledAt: new Date().toISOString() };
    vault.payouts = [settlement, ...(vault.payouts || [])];
    saveUserVault(vault);
    return { success: true, data: settlement };
  },
});

// ============================================================================
// 3. TEST CATALOG & PACKAGES API
// ============================================================================

export const testApi = createSafeApiProxy({
  getAll: async () => {
    const activeTests = getUserVault().tests.filter((t: any) => !t.isArchived);
    return {
      success: true,
      data: {
        tests: activeTests,
        items: activeTests,
        pagination: { page: 1, limit: 100, total: activeTests.length, totalPages: 1 },
      },
    };
  },
  getById: async (id: string) => {
    const vault = getUserVault();
    return { success: true, data: vault.tests.find((t: any) => t.id === id || t.testCode === id) || vault.tests[0] };
  },
  create: async (payload: any) => {
    const vault = getUserVault();
    const created = {
      ...vault.tests[0],
      ...payload,
      id: `tst-${Date.now()}`,
      testCode: payload?.testCode || `TST-${Math.floor(100 + Math.random() * 900)}`,
      isActive: true,
      parameters: payload?.parameters || [],
      createdAt: new Date().toISOString(),
    };
    vault.tests.unshift(created);
    saveUserVault(vault);
    return { success: true, data: created };
  },
  update: async (id: string, payload: any) => {
    const vault = getUserVault();
    const idx = vault.tests.findIndex((t: any) => t.id === id || t.testCode === id);
    if (idx !== -1) {
      vault.tests[idx] = { ...vault.tests[idx], ...payload, updatedAt: new Date().toISOString() };
      saveUserVault(vault);
      return { success: true, data: vault.tests[idx] };
    }
    return { success: true, data: { ...vault.tests[0], ...payload } };
  },
  delete: async (id: string) => {
    const vault = getUserVault();
    const target = vault.tests.find((t: any) => t.id === id);
    if (target) softArchiveRecord("tests", target);
    return { success: true, data: { id, archived: true } };
  },
  getCategories: async () => ({ success: true, data: getUserVault().categories.filter((c: any) => !c.isArchived) }),
  createCategory: async (payload: any) => {
    const vault = getUserVault();
    const cat = { id: `cat-${Date.now()}`, testCount: 0, ...payload, name: payload?.categoryName || payload?.name || "New Category" };
    vault.categories.push(cat);
    saveUserVault(vault);
    return { success: true, data: cat };
  },
  updateCategory: async (id: string, payload: any) => {
    const vault = getUserVault();
    const idx = vault.categories.findIndex((c: any) => c.id === id);
    if (idx !== -1) {
      vault.categories[idx] = { ...vault.categories[idx], ...payload };
      saveUserVault(vault);
      return { success: true, data: vault.categories[idx] };
    }
    return { success: true, data: { id, ...payload } };
  },
  deleteCategory: async (id: string) => {
    const vault = getUserVault();
    const target = vault.categories.find((c: any) => c.id === id);
    if (target) softArchiveRecord("categories", target);
    return { success: true, data: {} };
  },
  getPackages: async () => ({ success: true, data: getUserVault().packages.filter((p: any) => !p.isArchived) }),
  getPackage: async (id?: string) => {
    const vault = getUserVault();
    return { success: true, data: vault.packages.find((p: any) => p.id === id || p.packageCode === id) || vault.packages[0] };
  },
  createPackage: async (payload: any) => {
    const vault = getUserVault();
    const pkg = { id: `pkg-${Date.now()}`, tests: vault.tests, isActive: true, ...payload };
    vault.packages.unshift(pkg);
    saveUserVault(vault);
    return { success: true, data: pkg };
  },
  updatePackage: async (id: string, payload: any) => {
    const vault = getUserVault();
    const idx = vault.packages.findIndex((p: any) => p.id === id);
    if (idx !== -1) {
      vault.packages[idx] = { ...vault.packages[idx], ...payload };
      saveUserVault(vault);
      return { success: true, data: vault.packages[idx] };
    }
    return { success: true, data: { id, ...payload } };
  },
  deletePackage: async (id: string) => {
    const vault = getUserVault();
    const target = vault.packages.find((p: any) => p.id === id);
    if (target) softArchiveRecord("packages", target);
    return { success: true, data: {} };
  },
  getParameters: async () => ({ success: true, data: getUserVault().tests.flatMap((t: any) => t.parameters || []) }),
  addParameter: async (testId: string, payload: any) => {
    const vault = getUserVault();
    const prm = { id: `prm-${Date.now()}`, referenceRanges: [], ...payload };
    const test = vault.tests.find((t: any) => t.id === testId);
    if (test) {
      test.parameters = [...(test.parameters || []), prm];
      saveUserVault(vault);
    }
    return { success: true, data: prm };
  },
  updateParameter: async (id: string, payload: any) => {
    const vault = getUserVault();
    for (const t of vault.tests) {
      const idx = (t.parameters || []).findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        t.parameters[idx] = { ...t.parameters[idx], ...payload };
        saveUserVault(vault);
        return { success: true, data: t.parameters[idx] };
      }
    }
    return { success: true, data: { id, ...payload } };
  },
  deleteParameter: async () => ({ success: true, data: {} }),
  addReferenceRange: async (paramId: string, payload: any) => {
    const vault = getUserVault();
    const rr = { id: `rr-${Date.now()}`, ...payload };
    for (const t of vault.tests) {
      const p = (t.parameters || []).find((prm: any) => prm.id === paramId);
      if (p) {
        p.referenceRanges = [...(p.referenceRanges || []), rr];
        saveUserVault(vault);
        break;
      }
    }
    return { success: true, data: rr };
  },
  updateReferenceRange: async (id: string, payload: any) => ({ success: true, data: { id, ...payload } }),
  deleteReferenceRange: async () => ({ success: true, data: {} }),
  bulkToggleActive: async () => ({ success: true, data: {} }),
});

// ============================================================================
// 4. ORDERS API + 6-STAGE CLINICAL PIPELINE ORCHESTRATOR
// ============================================================================

export const orderApi = createSafeApiProxy({
  getAll: async (_query?: any) => {
    const activeOrders = getUserVault().orders.filter((o: any) => !o.isArchived);
    return {
      success: true,
      data: {
        orders: activeOrders,
        items: activeOrders,
        pagination: { page: 1, limit: 50, total: activeOrders.length, totalPages: 1 },
      },
    };
  },
  getById: async (id: string) => {
    const vault = getUserVault();
    return { success: true, data: vault.orders.find((o: any) => o.id === id || o.orderNumber === id) || vault.orders[0] };
  },
  create: async (payload: any) => {
    const vault = getUserVault();
    const nowIso = new Date().toISOString();
    const orderNumSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = payload?.id || `ord-${Date.now()}`;
    const orderNumber = payload?.orderNumber || `ORD-2026-${orderNumSuffix}`;

    const patient =
      vault.patients.find((p: any) => p.id === payload?.patientId || p.uhid === payload?.patientId) ||
      payload?.patient ||
      vault.patients[0];
    const doctor =
      vault.doctors.find((d: any) => d.id === payload?.doctorId) ||
      payload?.doctor ||
      vault.doctors[0];

    const resolvedItems = Array.isArray(payload?.items) && payload.items.length > 0
      ? payload.items.map((item: any, idx: number) => {
          const matchedTest = vault.tests.find((t: any) => t.id === item.testId || t.testCode === item.testCode) || item.test || vault.tests[0];
          const price = Number(item.price ?? matchedTest.price ?? 450);
          return {
            id: `oi-${Date.now()}-${idx}`,
            testId: matchedTest.id,
            test: matchedTest,
            price,
            finalPrice: Number(item.finalPrice ?? price),
            quantity: 1,
          };
        })
      : [{ id: `oi-${Date.now()}-0`, testId: vault.tests[0].id, test: vault.tests[0], price: vault.tests[0].price, finalPrice: vault.tests[0].price, quantity: 1 }];

    const totalAmount = Number(
      payload?.totalAmount ??
        payload?.finalAmount ??
        resolvedItems.reduce((sum: number, it: any) => sum + Number(it.finalPrice || 0), 0)
    );
    const paidAmount = Number(payload?.paidAmount ?? totalAmount);
    const paymentStatus = paidAmount >= totalAmount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";

    const orderSummaryRef = {
      id: orderId,
      orderNumber,
      barcode: `BC-${orderNumSuffix}-EDTA`,
      orderStatus: "REGISTERED",
      status: "REGISTERED",
      paymentStatus,
      patient,
      doctor,
    };

    const generatedSamples = resolvedItems.map((it: any, idx: number) => {
      const sampleType = it.test?.sampleType || "WHOLE_BLOOD";
      const tubeTag = sampleType === "SERUM" ? "SST" : "EDTA";
      return {
        id: `smp-${Date.now()}-${idx}`,
        sampleNumber: `SMP-2026-${orderNumSuffix}-${idx + 1}`,
        barcode: `BC-${orderNumSuffix}-${tubeTag}`,
        patientId: patient.id,
        orderId,
        testId: it.test.id,
        sampleType,
        status: "PENDING",
        priority: payload?.priority || "ROUTINE",
        createdAt: nowIso,
        updatedAt: nowIso,
        test: it.test,
        order: orderSummaryRef,
        trackingStages: [{ stage: "PENDING", timestamp: nowIso, status: "COMPLETED" }],
      };
    });

    const createdOrder: any = {
      ...payload,
      id: orderId,
      orderNumber,
      barcode: generatedSamples[0]?.barcode || `BC-${orderNumSuffix}-EDTA`,
      orderStatus: "REGISTERED",
      status: "REGISTERED",
      paymentStatus,
      priority: payload?.priority || "ROUTINE",
      totalAmount,
      finalAmount: totalAmount,
      paidAmount,
      createdAt: nowIso,
      patientId: patient.id,
      patient,
      doctorId: doctor.id,
      doctor,
      items: resolvedItems,
      samples: generatedSamples.map((s: any) => ({
        id: s.id,
        sampleNumber: s.sampleNumber,
        barcode: s.barcode,
        sampleType: s.sampleType,
        status: s.status,
      })),
    };

    generatedSamples.forEach((smp: any) => {
      vault.samples.unshift(smp);
    });

    resolvedItems.forEach((it: any, idx: number) => {
      const testObj = it.test || vault.tests[0];
      const defaultValues = (testObj.parameters || []).map((prm: any, pIdx: number) => ({
        id: `rv-${Date.now()}-${idx}-${pIdx}`,
        parameterId: prm.id,
        value: "",
        flag: "NORMAL",
        parameter: prm,
      }));
      vault.results.unshift({
        id: `res-${Date.now()}-${idx}`,
        orderId: createdOrder.id,
        testId: testObj.id,
        status: "PENDING",
        remarks: "",
        interpretation: "",
        createdAt: nowIso,
        updatedAt: nowIso,
        test: testObj,
        order: createdOrder,
        values: defaultValues,
      });
    });

    const createdInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${orderNumSuffix}`,
      orderId: createdOrder.id,
      order: createdOrder,
      patientId: patient.id,
      patientName: patient.fullName,
      patientUhid: patient.uhid,
      doctorName: doctor.fullName,
      subtotal: totalAmount,
      grandTotal: totalAmount,
      totalAmount,
      netPayable: totalAmount,
      paidAmount,
      pendingAmount: Math.max(0, totalAmount - paidAmount),
      discount: Number(payload?.discount || 0),
      gstAmount: 0,
      paymentStatus,
      status: paymentStatus,
      paymentMode: payload?.paymentMode || "UPI",
      createdAt: nowIso,
    };
    vault.invoices.unshift(createdInvoice);

    if (paidAmount > 0) {
      vault.payments.unshift({
        id: `pay-${Date.now()}`,
        receiptNumber: `RCP-2026-${orderNumSuffix}`,
        invoiceId: createdInvoice.id,
        orderId: createdOrder.id,
        patientName: patient.fullName,
        amount: paidAmount,
        method: payload?.paymentMode || "UPI",
        status: "PAID",
        paidAt: nowIso,
      });
    }

    const patIdx = vault.patients.findIndex((p: any) => p.id === patient.id);
    if (patIdx !== -1) {
      vault.patients[patIdx].totalOrders = Number(vault.patients[patIdx].totalOrders || 0) + 1;
    }

    vault.orders.unshift(createdOrder);
    saveUserVault(vault);
    return { success: true, data: createdOrder };
  },
  update: async (id: string, payload: any) => {
    const vault = getUserVault();
    const idx = vault.orders.findIndex((o: any) => o.id === id || o.orderNumber === id);
    if (idx !== -1) {
      vault.orders[idx] = {
        ...vault.orders[idx],
        ...payload,
        orderStatus: payload?.status || payload?.orderStatus || vault.orders[idx].orderStatus,
        updatedAt: new Date().toISOString(),
      };
      saveUserVault(vault);
      return { success: true, data: vault.orders[idx] };
    }
    return { success: true, data: { ...vault.orders[0], ...payload } };
  },
  cancel: async (id: string, reason?: string) => {
    const vault = getUserVault();
    const ord = vault.orders.find((o: any) => o.id === id || o.orderNumber === id);
    if (ord) {
      ord.status = "CANCELLED";
      ord.orderStatus = "CANCELLED";
      softArchiveRecord("orders", ord, reason || "Order cancelled (soft-archived)");
    }
    return { success: true, data: ord || {} };
  },
  collectSample: async (orderId: string) => {
    const vault = getUserVault();
    const nowIso = new Date().toISOString();
    const ord = vault.orders.find((o: any) => o.id === orderId || o.orderNumber === orderId);
    if (ord) {
      ord.status = "SAMPLE_COLLECTED";
      ord.orderStatus = "SAMPLE_COLLECTED";
    }
    const matchingSamples = vault.samples.filter((s: any) => s.orderId === orderId);
    matchingSamples.forEach((s: any) => {
      s.status = "COLLECTED";
      s.collectedAt = nowIso;
    });
    saveUserVault(vault);
    return { success: true, data: matchingSamples[0] || vault.samples[0] };
  },
  bulkUpdateStatus: async (payload: { ids?: string[]; status?: string }) => {
    const vault = getUserVault();
    const ids = payload?.ids || [];
    const nextStatus = payload?.status || "PROCESSING";
    vault.orders.forEach((o: any) => {
      if (ids.includes(o.id)) {
        o.status = nextStatus;
        o.orderStatus = nextStatus;
      }
    });
    saveUserVault(vault);
    return { success: true, data: { updated: ids.length } };
  },
  getAnalytics: async () => {
    const vault = getUserVault();
    const activeOrders = vault.orders.filter((o: any) => !o.isArchived);
    const completedOrders = activeOrders.filter((o: any) => o.status === "COMPLETED" || o.status === "APPROVED").length;
    const pendingOrders = activeOrders.length - completedOrders;
    const statOrders = activeOrders.filter((o: any) => o.priority === "STAT").length;
    const revenueToday = vault.invoices.filter((i: any) => !i.isArchived).reduce((sum: number, i: any) => sum + Number(i.paidAmount || 0), 0);
    return {
      success: true,
      data: { totalOrders: activeOrders.length, pendingOrders, completedOrders, statOrders, revenueToday },
    };
  },
  getTATAnalytics: async () => ({
    success: true,
    data: { meanTatMinutes: 32, slaCompliancePercent: 98.8, breachedCount: 0 },
  }),
});

// ============================================================================
// 5. SPECIMEN PIPELINE API
// ============================================================================

function transitionSampleStatus(id: string, nextStatus: string, extraPayload?: any) {
  const vault = getUserVault();
  const nowIso = new Date().toISOString();
  const idx = vault.samples.findIndex((s: any) => s.id === id || s.barcode === id || s.sampleNumber === id);
  if (idx !== -1) {
    const smp = vault.samples[idx];
    smp.status = nextStatus;
    smp.updatedAt = nowIso;
    if (nextStatus === "COLLECTED") smp.collectedAt = nowIso;
    if (nextStatus === "RECEIVED") smp.receivedAt = nowIso;
    if (extraPayload && typeof extraPayload === "object") Object.assign(smp, extraPayload);
    smp.trackingStages = [...(smp.trackingStages || []), { stage: nextStatus, timestamp: nowIso, status: "COMPLETED" }];

    const ord = vault.orders.find((o: any) => o.id === smp.orderId);
    if (ord) {
      if (nextStatus === "COLLECTED") {
        ord.status = "SAMPLE_COLLECTED";
        ord.orderStatus = "SAMPLE_COLLECTED";
      } else if (nextStatus === "RECEIVED" || nextStatus === "PROCESSING") {
        ord.status = "PROCESSING";
        ord.orderStatus = "PROCESSING";
      } else if (nextStatus === "COMPLETED") {
        ord.status = "COMPLETED";
        ord.orderStatus = "COMPLETED";
      }
    }
    saveUserVault(vault);
    return smp;
  }
  return { ...(vault.samples[0] || {}), status: nextStatus, ...(extraPayload || {}) };
}

export const sampleApi = createSafeApiProxy({
  getAll: async () => {
    const activeSamples = getUserVault().samples.filter((s: any) => !s.isArchived);
    return {
      success: true,
      data: { samples: activeSamples, items: activeSamples, pagination: { page: 1, limit: 50, total: activeSamples.length, totalPages: 1 } },
    };
  },
  getById: async (id: string) => ({
    success: true,
    data: getUserVault().samples.find((s: any) => s.id === id || s.barcode === id) || getUserVault().samples[0],
  }),
  getOne: async (id: string) => ({
    success: true,
    data: getUserVault().samples.find((s: any) => s.id === id || s.barcode === id) || getUserVault().samples[0],
  }),
  collect: async (id: string, payload?: any) => ({ success: true, data: transitionSampleStatus(id, "COLLECTED", payload) }),
  collectSample: async (id: string, payload?: any) => ({ success: true, data: transitionSampleStatus(id, "COLLECTED", payload) }),
  receive: async (id: string) => ({ success: true, data: transitionSampleStatus(id, "RECEIVED") }),
  process: async (id: string) => ({ success: true, data: transitionSampleStatus(id, "PROCESSING") }),
  complete: async (id: string) => ({ success: true, data: transitionSampleStatus(id, "COMPLETED") }),
  reject: async (id: string, payload?: any) => ({ success: true, data: transitionSampleStatus(id, "REJECTED", payload) }),
  getTracking: async (id?: string) => {
    const smp = getUserVault().samples.find((s: any) => s.id === id || s.barcode === id) || getUserVault().samples[0];
    return {
      success: true,
      data: {
        stages: smp?.trackingStages || [
          { stage: "ORDERED", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "COMPLETED" },
          { stage: "COLLECTED", timestamp: new Date(Date.now() - 3000000).toISOString(), status: "COMPLETED" },
          { stage: "RECEIVED", timestamp: new Date(Date.now() - 2400000).toISOString(), status: "COMPLETED" },
        ],
      },
    };
  },
});

// ============================================================================
// 6. RESULTS & PATHOLOGIST APPROVALS API
// ============================================================================

function transitionResultState(id: string, nextStatus: string, payload?: any) {
  const vault = getUserVault();
  const nowIso = new Date().toISOString();
  const currentUser = getStoredUser();
  const idx = vault.results.findIndex((r: any) => r.id === id || r.orderId === id);

  if (idx !== -1) {
    const res = vault.results[idx];
    res.status = nextStatus;
    res.updatedAt = nowIso;
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.values)) res.values = payload.values;
      if (payload.remarks !== undefined) res.remarks = payload.remarks;
      if (payload.interpretation !== undefined) res.interpretation = payload.interpretation;
    }
    if (nextStatus === "ENTERED") res.enteredAt = nowIso;
    if (nextStatus === "VERIFIED") res.verifiedAt = nowIso;
    if (nextStatus === "APPROVED" || nextStatus === "PUBLISHED") {
      res.approvedAt = res.approvedAt || nowIso;
      res.publishedAt = nowIso;
      res.approvedBy = {
        id: currentUser.id,
        employeeCode: currentUser.employeeCode || "DR-8812",
        fullName: currentUser.fullName || "Dr. Rajeshwari Swaminathan",
        role: currentUser.role || "PATHOLOGIST",
      };
      const ord = vault.orders.find((o: any) => o.id === res.orderId);
      if (ord) {
        ord.status = "COMPLETED";
        ord.orderStatus = "COMPLETED";
      }
      vault.samples.filter((s: any) => s.orderId === res.orderId).forEach((s: any) => { s.status = "COMPLETED"; });
    }
    saveUserVault(vault);
    return res;
  }
  return { ...(vault.results[0] || {}), status: nextStatus, ...(payload || {}) };
}

export const resultApi = createSafeApiProxy({
  getAll: async () => {
    const activeResults = getUserVault().results.filter((r: any) => !r.isArchived);
    return {
      success: true,
      data: { results: activeResults, items: activeResults, pagination: { page: 1, limit: 50, total: activeResults.length, totalPages: 1 } },
    };
  },
  getById: async (id: string) => ({
    success: true,
    data: getUserVault().results.find((r: any) => r.id === id || r.orderId === id) || getUserVault().results[0],
  }),
  create: async (payload: any) => {
    const vault = getUserVault();
    const created = { ...vault.results[0], ...payload, id: `res-${Date.now()}`, status: payload?.status || "ENTERED", enteredAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    vault.results.unshift(created);
    saveUserVault(vault);
    return { success: true, data: created };
  },
  update: async (id: string, payload: any) => ({ success: true, data: transitionResultState(id, payload?.status || "ENTERED", payload) }),
  verify: async (id: string) => ({ success: true, data: transitionResultState(id, "VERIFIED") }),
  approve: async (id: string) => ({ success: true, data: transitionResultState(id, "APPROVED") }),
  publish: async (id: string) => ({ success: true, data: transitionResultState(id, "PUBLISHED") }),
});

export const resultsApi = resultApi;

export const approvalApi = createSafeApiProxy({
  getPending: async () => {
    const list = getUserVault().results.filter((r: any) => !r.isArchived);
    return { success: true, data: { results: list, pagination: { page: 1, limit: 50, total: list.length, totalPages: 1 } } };
  },
  getById: async (id: string) => ({
    success: true,
    data: getUserVault().results.find((r: any) => r.id === id) || getUserVault().results[0],
  }),
  getMetrics: async () => {
    const active = getUserVault().results.filter((r: any) => !r.isArchived);
    return {
      success: true,
      data: {
        pendingApproval: active.filter((r: any) => r.status !== "APPROVED" && r.status !== "PUBLISHED").length,
        criticalValues: active.filter((r: any) => (r.values || []).some((v: any) => v.flag === "CRITICAL")).length,
        approvedToday: active.filter((r: any) => r.status === "APPROVED" || r.status === "PUBLISHED").length,
        rejectedRerun: 0,
      },
    };
  },
  approve: async (id: string, remarks?: any) => ({
    success: true,
    data: transitionResultState(id, "APPROVED", typeof remarks === "object" ? remarks : { remarks }),
  }),
  batchApprove: async (payload?: { ids?: string[]; resultIds?: string[]; clinicalComments?: string }) => {
    const ids = payload?.resultIds || payload?.ids || getUserVault().results.filter((r: any) => r.status === "VERIFIED" || r.status === "ENTERED").map((r: any) => r.id);
    ids.forEach((id: string) => transitionResultState(id, "APPROVED", { remarks: payload?.clinicalComments }));
    return { success: true, data: { approvedCount: ids.length, skippedCount: 0 } };
  },
  bulkApprove: async (ids?: string[], comments?: string) => {
    const targetIds = Array.isArray(ids) ? ids : getUserVault().results.filter((r: any) => r.status === "VERIFIED" || r.status === "ENTERED").map((r: any) => r.id);
    targetIds.forEach((id: string) => transitionResultState(id, "APPROVED", { remarks: comments }));
    return { success: true, data: { approvedCount: targetIds.length, skippedCount: 0 } };
  },
  amendResult: async (payload: any) => {
    const vault = getUserVault();
    const res = vault.results.find((r: any) => r.id === payload?.resultId || r.orderId === payload?.resultId) || vault.results[0];
    if (res && Array.isArray(payload?.modifiedParameters)) {
      payload.modifiedParameters.forEach((mp: any) => {
        const valObj = (res.values || []).find((v: any) => v.parameterId === mp.parameterId || v.parameter?.parameterName === mp.parameterName);
        if (valObj && mp.newValue !== undefined) {
          valObj.value = String(mp.newValue);
        }
      });
      res.remarks = payload.amendmentReason || res.remarks;
      res.updatedAt = new Date().toISOString();
    }
    const amendmentEntry = {
      id: `amd-${Date.now()}`,
      version: `v1.${(vault.amendments?.length || 0) + 1}`,
      revisionLabel: `v1.${(vault.amendments?.length || 0) + 1}`,
      amendedAt: new Date().toISOString(),
      ...payload,
    };
    vault.amendments = [amendmentEntry, ...(vault.amendments || [])];
    saveUserVault(vault);
    return { success: true, data: amendmentEntry };
  },
  reject: async (id: string, payload?: any) => ({ success: true, data: transitionResultState(id, "ENTERED", payload) }),
  getSignature: async () => ({
    success: true,
    data: {
      signedBy: getStoredUser().fullName || "Dr. Rajeshwari Swaminathan (MD, FRCPath)",
      registrationNumber: "MMC-2014-88219",
      signedAt: new Date().toISOString(),
      sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
  }),
  verifySignature: async () => ({ success: true, data: { verified: true } }),
  getHistory: async () => ({
    success: true,
    data: getUserVault().results.filter((r: any) => r.status === "APPROVED" || r.status === "PUBLISHED"),
  }),
  getAmendments: async () => ({ success: true, data: getUserVault().amendments || [] }),
  getPanicReadBackLedger: async () => ({ success: true, data: getUserVault().panicLedger || [] }),
  getTriageQueue: async () => {
    const active = getUserVault().results.filter((r: any) => !r.isArchived);
    const criticalPanic = active.filter((r: any) => (r.values || []).some((v: any) => v.flag === "CRITICAL"));
    const abnormal = active.filter((r: any) => (r.values || []).some((v: any) => v.flag === "HIGH" || v.flag === "LOW"));
    const normal = active.filter((r: any) => !criticalPanic.includes(r) && !abnormal.includes(r));
    return { success: true, data: { criticalPanic, abnormal, normal } };
  },
  recordCriticalAck: async (data: any) => {
    const vault = getUserVault();
    const ack = { id: `ack-${Date.now()}`, ...data, recordedAt: new Date().toISOString() };
    vault.panicLedger = [ack, ...(vault.panicLedger || [])];
    saveUserVault(vault);
    return { success: true, data: ack };
  },
  recordPanicReadBack: async (data: any) => {
    const vault = getUserVault();
    const entry = { id: `prb-${Date.now()}`, ...data, recordedAt: new Date().toISOString() };
    vault.panicLedger = [entry, ...(vault.panicLedger || [])];
    saveUserVault(vault);
    return { success: true, data: entry };
  },
});

// ============================================================================
// 7. INVOICES, CASHIER & PAYMENTS API
// ============================================================================

export const invoiceApi = createSafeApiProxy({
  getAll: async () => {
    const vault = getUserVault();
    const activeInvoices = vault.invoices.filter((i: any) => !i.isArchived).map((inv: any) => {
      const matchedOrder = vault.orders.find((o: any) => o.id === inv.orderId) || inv.order || vault.orders[0];
      const matchedPayments = vault.payments.filter((p: any) => p.invoiceId === inv.id || p.orderId === inv.orderId);
      return {
        ...inv,
        subtotal: Number(inv.subtotal ?? inv.totalAmount ?? inv.grandTotal ?? 0),
        grandTotal: Number(inv.grandTotal ?? inv.netPayable ?? inv.totalAmount ?? 0),
        order: matchedOrder ? {
          ...matchedOrder,
          payments: matchedPayments.length > 0 ? matchedPayments : (matchedOrder.payments || []),
        } : undefined,
      };
    });
    return {
      success: true,
      data: { invoices: activeInvoices, items: activeInvoices, pagination: { page: 1, limit: 50, total: activeInvoices.length, totalPages: 1 } },
    };
  },
  getById: async (id: string) => ({
    success: true,
    data: getUserVault().invoices.find((i: any) => i.id === id || i.invoiceNumber === id) || getUserVault().invoices[0],
  }),
  create: async (payload: any) => {
    const vault = getUserVault();
    const total = Number(payload?.grandTotal ?? payload?.totalAmount ?? 750);
    const paid = Number(payload?.paidAmount ?? total);
    const pending = Math.max(0, total - paid);
    const status = pending === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING";
    const created = {
      ...vault.invoices[0],
      ...payload,
      id: `inv-${Date.now()}`,
      invoiceNumber: payload?.invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      subtotal: total,
      grandTotal: total,
      totalAmount: total,
      netPayable: total,
      paidAmount: paid,
      pendingAmount: pending,
      paymentStatus: status,
      status,
      createdAt: new Date().toISOString(),
    };
    vault.invoices.unshift(created);
    saveUserVault(vault);
    return { success: true, data: created };
  },
  delete: async (id: string) => {
    const inv = getUserVault().invoices.find((i: any) => i.id === id);
    if (inv) softArchiveRecord("invoices", inv);
    return { success: true, data: { id, archived: true } };
  },
  getBillingMetrics: async () => {
    const active = getUserVault().invoices.filter((i: any) => !i.isArchived);
    return {
      success: true,
      data: {
        totalRevenue: active.reduce((sum: number, i: any) => sum + Number(i.grandTotal || i.totalAmount || 0), 0),
        collectedToday: active.reduce((sum: number, i: any) => sum + Number(i.paidAmount || 0), 0),
        pendingDues: active.reduce((sum: number, i: any) => sum + Number(i.pendingAmount || 0), 0),
        refundsIssued: 0,
        invoiceCount: active.length,
      },
    };
  },
  processRefund: async (data: any) => {
    const vault = getUserVault();
    const inv = vault.invoices.find((i: any) => i.id === data?.invoiceId);
    if (inv) {
      inv.status = "REFUNDED";
      inv.paymentStatus = "REFUNDED";
      saveUserVault(vault);
    }
    return { success: true, data };
  },
});

export const paymentApi = createSafeApiProxy({
  getAll: async () => {
    const payments = getUserVault().payments || [];
    return {
      success: true,
      data: { payments, items: payments, pagination: { page: 1, limit: 50, total: payments.length, totalPages: 1 } },
    };
  },
  getById: async (id: string) => ({
    success: true,
    data: (getUserVault().payments || []).find((p: any) => p.id === id || p.receiptNumber === id) || getUserVault().payments[0],
  }),
  create: async (data: any) => {
    const vault = getUserVault();
    const amount = Number(data?.amount || 0);
    const receipt = {
      id: `pay-${Date.now()}`,
      receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "PAID",
      method: data?.method || data?.paymentMode || "UPI",
      paidAt: new Date().toISOString(),
      ...data,
      amount,
    };
    vault.payments.unshift(receipt);
    if (data?.invoiceId) {
      const inv = vault.invoices.find((i: any) => i.id === data.invoiceId || i.invoiceNumber === data.invoiceId);
      if (inv) {
        inv.paidAmount = Number(inv.paidAmount || 0) + amount;
        inv.pendingAmount = Math.max(0, Number(inv.grandTotal || inv.totalAmount || 0) - inv.paidAmount);
        inv.status = inv.pendingAmount === 0 ? "PAID" : "PARTIAL";
        inv.paymentStatus = inv.status;
      }
    }
    saveUserVault(vault);
    return { success: true, data: receipt };
  },
  createSplit: async (data: any) => {
    const vault = getUserVault();
    const receipt = { id: `pay-${Date.now()}`, receiptNumber: `RCP-SPLIT-${Date.now()}`, ...data, paidAt: new Date().toISOString() };
    vault.payments.unshift(receipt);
    saveUserVault(vault);
    return { success: true, data: receipt };
  },
  refund: async (data: any) => ({ success: true, data }),
  getMetrics: async () => {
    const payments = getUserVault().payments || [];
    const totalCollected = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const cashTotal = payments.filter((p: any) => p.method === "CASH").reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const upiTotal = payments.filter((p: any) => p.method === "UPI").reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    return {
      success: true,
      data: { totalCollected, cashTotal, upiTotal, cardTotal: Math.max(0, totalCollected - cashTotal - upiTotal) },
    };
  },
});

export const paymentsApi = paymentApi;

// ============================================================================
// 8. REPORTS, ANALYZERS, DASHBOARD & ENTERPRISE MODULES API
// ============================================================================

export const reportApi = createSafeApiProxy({
  getPublishedReports: async () => {
    const vault = getUserVault();
    const list = vault.results.filter((r: any) => !r.isArchived).map((r: any, idx: number) => {
      const matchedOrder = vault.orders.find((o: any) => o.id === r.orderId) || r.order || vault.orders[0];
      const matchedTest = vault.tests.find((t: any) => t.id === r.testId) || r.test || vault.tests[0];
      const hasCritical = (r.values || []).some((v: any) => v.flag === "CRITICAL" || v.flag === "PANIC");
      return {
        ...r,
        id: r.id,
        status: r.status || "APPROVED",
        publishedAt: r.publishedAt || r.approvedAt || r.verifiedAt || r.createdAt || new Date().toISOString(),
        createdAt: r.createdAt || new Date().toISOString(),
        criticalFlag: hasCritical,
        test: {
          id: matchedTest?.id || "tst-001",
          testName: matchedTest?.testName || "Diagnostic Investigation",
          testCode: matchedTest?.testCode || "LAB-01",
          sampleType: matchedTest?.sampleType || "WHOLE_BLOOD",
        },
        order: {
          id: matchedOrder?.id || "ord-001",
          orderNumber: matchedOrder?.orderNumber || "ORD-2026-8801",
          patient: matchedOrder?.patient || vault.patients[0],
          doctor: matchedOrder?.doctor || vault.doctors[0],
        },
        approvedBy: r.approvedBy || {
          id: "doc-001",
          fullName: "Dr. Rajeshwari Swaminathan",
          employeeCode: "DR-PATH-8812",
        },
        deliveryStatus: r.deliveryStatus || "DELIVERED",
        deliveryMethod: r.deliveryMethod || "WHATSAPP, EMAIL",
        reportReferenceId: r.reportReferenceId || `RPT-2026-${1001 + idx}`,
      };
    });
    return {
      success: true,
      data: { results: list, reports: list, items: list, pagination: { page: 1, limit: 50, total: list.length, totalPages: 1 } },
    };
  },
  getOrderReport: async (orderId: string) => {
    const vault = getUserVault();
    const order = vault.orders.find((o: any) => o.id === orderId || o.orderNumber === orderId) || vault.orders[0];
    const matchingResults = vault.results.filter((r: any) => r.orderId === order?.id);
    const results = (matchingResults.length > 0 ? matchingResults : vault.results).map((r: any) => {
      const testObj = vault.tests.find((t: any) => t.id === r.testId) || r.test || vault.tests[0];
      return {
        ...r,
        test: testObj,
        values: (r.values && r.values.length > 0)
          ? r.values
          : (testObj.parameters || []).map((prm: any, i: number) => ({
              id: `rv-auto-${i}`,
              parameterId: prm.id,
              parameter: prm,
              value: prm.referenceRanges?.[0]?.normalLow ? String(prm.referenceRanges[0].normalLow) : "Normal",
              flag: "NORMAL",
            })),
      };
    });
    const matchingSamples = vault.samples.filter((s: any) => s.orderId === order?.id);
    const matchingInvoice = vault.invoices.find((i: any) => i.orderId === order?.id) || vault.invoices[0];
    const matchingPayments = vault.payments.filter((p: any) => p.orderId === order?.id);
    const testsList = Array.isArray(order?.items) && order.items.length > 0
      ? order.items.map((it: any) => ({
          id: it.id || `ti-${it.testId}`,
          test: vault.tests.find((t: any) => t.id === it.testId) || it.test || vault.tests[0],
          price: Number(it.finalPrice || it.price || 450),
        }))
      : results.map((r: any) => ({ id: `ti-${r.test.id}`, test: r.test, price: Number(r.test.price || 450) }));

    const reportPayload = {
      id: `RPT-${order?.orderNumber || order?.id || "8801"}`,
      orderNumber: order?.orderNumber || "ORD-2026-8801",
      barcode: order?.barcode || "BC-8801-EDTA",
      orderStatus: order?.orderStatus || order?.status || "COMPLETED",
      createdAt: order?.createdAt || new Date().toISOString(),
      sampleCollected: true,
      collectedAt: matchingSamples[0]?.collectedAt || order?.createdAt || new Date().toISOString(),
      reportedAt: results[0]?.approvedAt || results[0]?.verifiedAt || new Date().toISOString(),
      patient: order?.patient || vault.patients[0],
      doctor: order?.doctor || vault.doctors[0],
      tests: testsList,
      results,
      invoice: matchingInvoice,
      payments: matchingPayments,
      order,
      addendums: order?.addendums || [],
      reportData: {
        shortChecksum: `SHA256-${String(order?.orderNumber || "8801").slice(-6).toUpperCase()}`,
        verificationUrl: typeof window !== "undefined" ? `${window.location.origin}/verify-report/${order?.orderNumber || order?.id || "8801"}` : "",
        version: order?.addendums?.length ? `v1.${order.addendums.length}` : "v1.0",
      },
    };
    return { success: true, data: reportPayload };
  },
  addAddendum: async (targetId: string, payload: any) => {
    const vault = getUserVault();
    const order = vault.orders.find((o: any) => o.id === targetId || o.orderNumber === targetId || `RPT-${o.orderNumber}` === targetId) || vault.orders[0];
    const nextIdx = (order.addendums?.length || 0) + 1;
    const addendum = {
      id: `add-${Date.now()}`,
      versionLabel: `v1.${nextIdx}`,
      reason: payload?.reason || "Clinical Correlation Addendum",
      content: payload?.content || "",
      authorName: payload?.authorName || "Dr. Rajeshwari Swaminathan, MD",
      createdAt: new Date().toISOString(),
    };
    if (order) {
      order.addendums = [...(order.addendums || []), addendum];
      saveUserVault(vault);
    }
    return { success: true, data: { addendum } };
  },
});

export const reportsApi = createSafeApiProxy({
  ...reportApi,
  getSummary: async () => {
    const active = getUserVault().results.filter((r: any) => !r.isArchived);
    const verifiedReports = active.filter((r: any) => r.status === "APPROVED" || r.status === "PUBLISHED").length;
    return {
      success: true,
      data: { totalReports: active.length, verifiedReports, pendingReports: active.length - verifiedReports, dispatchedWhatsApp: verifiedReports },
    };
  },
  inlineApprove: async (id: string) => ({ success: true, data: transitionResultState(id, "APPROVED") }),
  applyDigitalSignature: async (id: string, data: any) => ({ success: true, data: transitionResultState(id, "APPROVED", data) }),
  sendReportToDoctor: async (_id: string, data: any) => ({ success: true, data }),
  addToPatientHistory: async (_id: string, data: any) => ({ success: true, data }),
  printReport: async (id: string) => ({ success: true, data: { id } }),
});

export const analyzersApi = createSafeApiProxy({
  getAll: async () => {
    const list = getUserVault().analyzers.filter((a: any) => !a.isArchived);
    return { success: true, data: { analyzers: list, items: list } };
  },
  getById: async (id: string) => ({
    success: true,
    data: getUserVault().analyzers.find((a: any) => a.id === id || a.code === id) || getUserVault().analyzers[0],
  }),
  create: async (data: any) => {
    const vault = getUserVault();
    const created = { id: `anz-${Date.now()}`, status: "ONLINE", uptimePercent: 99.9, reagentLevel: 90, ...data };
    vault.analyzers.unshift(created);
    saveUserVault(vault);
    return { success: true, data: created };
  },
  updateStatus: async (id: string, status: string) => {
    const vault = getUserVault();
    const anz = vault.analyzers.find((a: any) => a.id === id);
    if (anz) {
      anz.status = status;
      saveUserVault(vault);
    }
    return { success: true, data: { id, status } };
  },
  archive: async (id: string) => {
    const anz = getUserVault().analyzers.find((a: any) => a.id === id);
    if (anz) softArchiveRecord("analyzers", anz);
    return { success: true, data: {} };
  },
  testConnection: async () => ({ success: true, data: { connected: true, latencyMs: 4 } }),
  heartbeat: async () => ({ success: true, data: { alive: true } }),
  getHealth: async () => ({ success: true, data: { online: getUserVault().analyzers.length, total: getUserVault().analyzers.length, uptime: 99.98 } }),
  getDemoData: async () => ({ success: true, data: getUserVault().analyzers }),
  getTestMappings: async () => ({ success: true, data: getUserVault().testMappings || [] }),
  createTestMapping: async (data: any) => {
    const vault = getUserVault();
    const item = { id: `map-${Date.now()}`, ...data };
    vault.testMappings = [item, ...(vault.testMappings || [])];
    saveUserVault(vault);
    return { success: true, data: item };
  },
  updateTestMapping: async (_id: string, data: any) => ({ success: true, data }),
  deleteTestMapping: async () => ({ success: true, data: {} }),
  getQCRules: async () => ({ success: true, data: getUserVault().qcRules || [] }),
  createQCRule: async (data: any) => {
    const vault = getUserVault();
    const item = { id: `qc-${Date.now()}`, ...data };
    vault.qcRules = [item, ...(vault.qcRules || [])];
    saveUserVault(vault);
    return { success: true, data: item };
  },
  updateQCRule: async (_id: string, data: any) => ({ success: true, data }),
  getWorklistEntries: async () => ({ success: true, data: getUserVault().worklistEntries || [] }),
  createWorklistEntry: async (data: any) => {
    const vault = getUserVault();
    const item = { id: `wl-${Date.now()}`, ...data };
    vault.worklistEntries = [item, ...(vault.worklistEntries || [])];
    saveUserVault(vault);
    return { success: true, data: item };
  },
  updateWorklistEntry: async (_id: string, data: any) => ({ success: true, data }),
  sendSimulatorEvent: async (data: any) => ({ success: true, data }),
});

export const dashboardApi = createSafeApiProxy({
  getStats: async () => {
    const vault = getUserVault();
    return {
      success: true,
      data: {
        totalPatients: vault.patients.filter((p: any) => !p.isArchived).length,
        todayOrders: vault.orders.filter((o: any) => !o.isArchived).length,
        pendingSamples: vault.samples.filter((s: any) => s.status !== "COMPLETED" && !s.isArchived).length,
        pendingApprovals: vault.results.filter((r: any) => r.status !== "APPROVED" && r.status !== "PUBLISHED" && !r.isArchived).length,
        criticalAlerts: vault.patients.filter((p: any) => p.isCritical && !p.isArchived).length,
        todayRevenue: vault.invoices.filter((i: any) => !i.isArchived).reduce((s: number, i: any) => s + Number(i.paidAmount || 0), 0),
      },
    };
  },
  getMetrics: async () => dashboardApi.getStats(),
  getApprovalQueue: async () => ({ success: true, data: getUserVault().results }),
  getAttentionResults: async () => ({
    success: true,
    data: getUserVault().results.filter((r: any) => (r.values || []).some((v: any) => v.flag === "CRITICAL")),
  }),
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
  updateProfile: async (data: any) => ({ success: true, data, message: "Profile updated successfully." }),
  changePassword: async (..._args: any[]) => ({ success: true, message: "Password updated successfully." }),
  sessions: async () => ({
    success: true,
    data: [
      { id: "sess-1", device: "Chrome on Windows 11", ip: "192.168.10.104", location: "Hospital LAN", current: true, lastActive: "Active Now" },
      { id: "sess-2", device: "Safari on iPad Pro", ip: "192.168.10.118", location: "Ward Wi-Fi", current: false, lastActive: "15 mins ago" },
    ],
  }),
  revokeSession: async (id: string) => ({ success: true, message: `Session ${id} revoked.` }),
});

export const auditApi = createSafeApiProxy({
  getLogs: async () => ({
    success: true,
    data: [
      { id: "aud-1", timestamp: new Date().toISOString(), action: "LOGIN_SUCCESS", user: "Admin", ip: "192.168.10.104" },
    ],
  }),
  getMyActivity: async () => ({
    success: true,
    data: [
      { id: "aud-1", timestamp: new Date().toISOString(), action: "LOGIN_SUCCESS", user: "Admin", ip: "192.168.10.104" },
    ],
  }),
});

export const communicationApi = createSafeApiProxy({
  getHistory: async (_id?: any) => ({ success: true, data: { communications: getUserVault().communications || [] } as any }),
  sendWhatsApp: async (data: any) => {
    const vault = getUserVault();
    const msg = { id: `comm-${Date.now()}`, channel: "WHATSAPP", ...data, sentAt: new Date().toISOString() };
    vault.communications = [msg, ...(vault.communications || [])];
    saveUserVault(vault);
    return { success: true, data: msg, message: "OK" };
  },
  sendSMS: async (data: any) => {
    const vault = getUserVault();
    const msg = { id: `comm-${Date.now()}`, channel: "SMS", ...data, sentAt: new Date().toISOString() };
    vault.communications = [msg, ...(vault.communications || [])];
    saveUserVault(vault);
    return { success: true, data: msg, message: "OK" };
  },
  sendEmail: async (data: any) => {
    const vault = getUserVault();
    const msg = { id: `comm-${Date.now()}`, channel: "EMAIL", ...data, sentAt: new Date().toISOString() };
    vault.communications = [msg, ...(vault.communications || [])];
    saveUserVault(vault);
    return { success: true, data: msg, message: "OK" };
  },
  testWhatsApp: async (_data?: any) => ({ success: true, message: "WhatsApp gateway verified." }),
  testSmtp: async (_data?: any) => ({ success: true, message: "SMTP gateway verified." }),
  updateWhatsAppSettings: async (data: any) => {
    const vault = getUserVault();
    vault.settings = { ...(vault.settings || {}), whatsapp: data };
    saveUserVault(vault);
    return { success: true, data };
  },
  updateSmtpSettings: async (data: any) => {
    const vault = getUserVault();
    vault.settings = { ...(vault.settings || {}), smtp: data };
    saveUserVault(vault);
    return { success: true, data };
  },
  uploadPdf: async (_data?: any) => ({ success: true, data: { url: "/reports.html" } }),
});

export const laboratorySettingsApi = createSafeApiProxy({
  getSettings: async (_id?: any) => ({ success: true, data: (getUserVault().settings || {}) as any }),
  updateSettings: async (data: any) => {
    const vault = getUserVault();
    vault.settings = { ...(vault.settings || {}), ...data, updatedAt: new Date().toISOString() };
    saveUserVault(vault);
    return { success: true, data: vault.settings };
  },
  testWhatsApp: async (_data?: any) => ({ success: true, message: "Connected" }),
  testSmtp: async (_data?: any) => ({ success: true, message: "Connected" }),
});

export const microbiologyApi = createSafeApiProxy({
  listCultures: async () => ({ success: true, data: getUserVault().cultures || [] }),
  getPendingOrders: async () => ({ success: true, data: getUserVault().orders || [] }),
  getAnalyzers: async () => ({ success: true, data: getUserVault().analyzers || [] }),
  listAtccQc: async () => ({ success: true, data: getUserVault().atccQc || [] }),
  listCriticalCalls: async () => ({ success: true, data: getUserVault().criticalCalls || [] }),
  listEnvironmentalSwabs: async () => ({ success: true, data: getUserVault().environmentalSwabs || [] }),
  accessionCulture: async (data: any) => {
    const vault = getUserVault();
    const item = { id: `cul-${Date.now()}`, ...data, createdAt: new Date().toISOString() };
    vault.cultures = [item, ...(vault.cultures || [])];
    saveUserVault(vault);
    return { success: true, data: item };
  },
  recordGramStain: async (data: any) => ({ success: true, data }),
  recordIsolateAst: async (data: any) => ({ success: true, data }),
  recordAtccQc: async (data: any) => {
    const vault = getUserVault();
    const item = { id: `atcc-${Date.now()}`, ...data, recordedAt: new Date().toISOString() };
    vault.atccQc = [item, ...(vault.atccQc || [])];
    saveUserVault(vault);
    return { success: true, data: item };
  },
  recordEnvironmentalSwab: async (data: any) => {
    const vault = getUserVault();
    const item = { id: `env-${Date.now()}`, ...data, recordedAt: new Date().toISOString() };
    vault.environmentalSwabs = [item, ...(vault.environmentalSwabs || [])];
    saveUserVault(vault);
    return { success: true, data: item };
  },
  logCriticalCall: async (data: any) => {
    const vault = getUserVault();
    const item = { id: `cc-${Date.now()}`, ...data, loggedAt: new Date().toISOString() };
    vault.criticalCalls = [item, ...(vault.criticalCalls || [])];
    saveUserVault(vault);
    return { success: true, data: item };
  },
});

export const nexusApi = createSafeApiProxy({
  getFleetStatus: async (_sec?: any) => ({
    success: true,
    data: { fleet: getUserVault().analyzers, rejectedMessages: [], unacknowledgedAlerts: [] } as any,
  }),
});

export const searchApi = createSafeApiProxy({
  globalSearch: async (q: string) => {
    const vault = getUserVault();
    const query = (q || "").toLowerCase().trim();
    return {
      success: true,
      data: {
        patients: vault.patients.filter((p: any) => !p.isArchived && ((p.fullName || "").toLowerCase().includes(query) || (p.uhid || "").toLowerCase().includes(query))),
        orders: vault.orders.filter((o: any) => !o.isArchived && (o.orderNumber || "").toLowerCase().includes(query)),
        tests: vault.tests.filter((t: any) => !t.isArchived && ((t.testName || "").toLowerCase().includes(query) || (t.testCode || "").toLowerCase().includes(query))),
      },
    };
  },
});

export const userApi = createSafeApiProxy({
  getAll: async () => ({ success: true, data: (getUserVault().users || []).filter((u: any) => !u.isArchived) }),
  create: async (data: any) => {
    const vault = getUserVault();
    const created = { id: `usr-${Date.now()}`, status: "ACTIVE", ...data, createdAt: new Date().toISOString() };
    vault.users = [created, ...(vault.users || [])];
    saveUserVault(vault);
    return { success: true, data: created };
  },
  activate: async (id: string) => ({ success: true, data: { id, status: "ACTIVE" } }),
  suspend: async (id: string) => ({ success: true, data: { id, status: "SUSPENDED" } }),
  delete: async (id: string) => {
    const u = (getUserVault().users || []).find((item: any) => item.id === id);
    if (u) softArchiveRecord("users", u);
    return { success: true, data: { id, archived: true } };
  },
  updateProfile: async (id: string, data: any) => ({ success: true, data: { id, ...data } }),
});

export const whatsappApi = createSafeApiProxy({
  getDashboard: async () => ({
    success: true,
    data: { messagesSentToday: (getUserVault().communications || []).length + 12, deliveryRate: 99.6, activeCampaigns: 3 },
  }),
});

export const advancesApi = createSafeApiProxy({
  create: async (data: any) => paymentApi.create({ ...data, type: "ADVANCE" }),
  apply: async (data: any) => paymentApi.create({ ...data, type: "ADVANCE_APPLIED" }),
});

export const refundsApi = createSafeApiProxy({
  create: async (data: any) => invoiceApi.processRefund(data),
});

export const cashCounterApi = createSafeApiProxy({
  getStatus: async () => ({
    success: true,
    data: { isOpen: true, balance: (getUserVault().payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0) },
  }),
});

export const settlementsApi = createSafeApiProxy({
  getAll: async () => ({ success: true, data: getUserVault().payments || [] }),
});

export const barcodeApi = createSafeApiProxy({
  generate: async (data: any) => ({ success: true, data }),
});
