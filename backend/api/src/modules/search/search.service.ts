import prisma from "../../../config/database";
import { fuzzyScore, FuzzyScoreResult } from "./fuzzy.util";

export type SearchCategory =
  | "ALL"
  | "PATIENTS"
  | "ORDERS"
  | "SAMPLES"
  | "TESTS"
  | "DOCTORS"
  | "ACTIONS";

export interface SearchResultItem {
  id: string;
  type: "PATIENT" | "ORDER" | "SAMPLE" | "TEST" | "DOCTOR" | "ACTION";
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  href: string;
  relevanceScore: number;
  matchType: string;
  metadata?: Record<string, any>;
}

export interface GlobalSearchParams {
  query: string;
  category?: SearchCategory;
  limit?: number;
  fuzzy?: boolean;
  branchId?: string | null;
}

export interface GlobalSearchResponse {
  query: string;
  category: SearchCategory;
  totalMatches: number;
  branchId?: string | null;
  categories: {
    patients: SearchResultItem[];
    orders: SearchResultItem[];
    samples: SearchResultItem[];
    tests: SearchResultItem[];
    doctors: SearchResultItem[];
    actions: SearchResultItem[];
  };
  results: SearchResultItem[];
}

export interface SystemActionItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  category: string;
  badge: string;
  badgeColor: string;
  shortcut?: string;
  keywords: string[];
}

export const SYSTEM_ACTIONS: SystemActionItem[] = [
  {
    id: "act-register-patient",
    title: "Register New Walk-In Patient",
    subtitle: "Rapid emergency / OPD patient demographic intake & UHID issuance",
    href: "/patients?action=new",
    category: "Quick Action",
    badge: "OPD Desk",
    badgeColor: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    shortcut: "Alt+P",
    keywords: ["patient", "register", "new", "walkin", "admission", "opd", "uhid"],
  },
  {
    id: "act-new-order",
    title: "Create Diagnostic Test Order",
    subtitle: "Book laboratory assays, assign barcode, generate patient bill",
    href: "/orders/new",
    category: "Quick Action",
    badge: "Order Entry",
    badgeColor: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    shortcut: "Alt+O",
    keywords: ["order", "book", "billing", "test", "investigation", "invoice"],
  },
  {
    id: "act-daybook",
    title: "Cash Shift Daybook & Reconciliation",
    subtitle: "Physical denomination counting, cash handover & variance alerts",
    href: "/invoices?tab=daybook",
    category: "Finance",
    badge: "Daybook",
    badgeColor: "bg-amber-50 text-amber-700 ring-amber-200",
    shortcut: "Alt+S",
    keywords: ["daybook", "cash", "counter", "shift", "reconciliation", "denomination", "handover"],
  },
  {
    id: "act-samples",
    title: "Specimen Accession & Phlebotomy",
    subtitle: "Sample barcoding, rack sorting, centrifuging & analyzer handoff",
    href: "/samples",
    category: "Laboratory",
    badge: "Accession",
    badgeColor: "bg-purple-50 text-purple-700 ring-purple-200",
    shortcut: "Alt+B",
    keywords: ["sample", "barcode", "specimen", "phlebotomy", "blood", "tube", "accession"],
  },
  {
    id: "act-results",
    title: "Technician Results Entry & QC",
    subtitle: "Direct assay parameter numerical entry & Delta check verification",
    href: "/results",
    category: "Laboratory",
    badge: "Worklist",
    badgeColor: "bg-blue-50 text-blue-700 ring-blue-200",
    shortcut: "Alt+W",
    keywords: ["results", "entry", "technician", "worklist", "qc", "delta", "parameters"],
  },
  {
    id: "act-approvals",
    title: "Pathologist Workstation & Approvals",
    subtitle: "Dual pathologist review, panic value telephonic logs & digital signature",
    href: "/approvals",
    category: "Laboratory",
    badge: "Pathologist",
    badgeColor: "bg-rose-50 text-rose-700 ring-rose-200",
    shortcut: "Alt+Q",
    keywords: ["pathologist", "approval", "doctor", "signoff", "seal", "signature", "panic", "authorize"],
  },
  {
    id: "act-reports",
    title: "Verified Reports & PDF Dispatch",
    subtitle: "Download authorized diagnostic report PDFs with NABL QR verification",
    href: "/reports",
    category: "Reports",
    badge: "PDF Reports",
    badgeColor: "bg-teal-50 text-teal-700 ring-teal-200",
    shortcut: "Alt+R",
    keywords: ["report", "pdf", "dispatch", "print", "nabl", "download", "whatsapp", "email"],
  },
  {
    id: "act-invoices",
    title: "POS Billing & Invoices Roster",
    subtitle: "Receipt generation, payment modes, GST invoices & financial ledger",
    href: "/invoices",
    category: "Finance",
    badge: "Billing",
    badgeColor: "bg-amber-50 text-amber-700 ring-amber-200",
    shortcut: "Alt+I",
    keywords: ["invoice", "receipt", "gst", "payment", "due", "refund", "billing"],
  },
  {
    id: "act-doctors",
    title: "Referring Clinicians & Doctors Directory",
    subtitle: "Directory of referring doctors, commission rates & contact details",
    href: "/doctors",
    category: "Directory",
    badge: "Clinicians",
    badgeColor: "bg-sky-50 text-sky-700 ring-sky-200",
    shortcut: "Alt+D",
    keywords: ["doctor", "referral", "clinician", "physician", "commission", "specialist"],
  },
  {
    id: "act-tests",
    title: "Master Test Catalog & Pricing",
    subtitle: "Diagnostic test directory, reference intervals, LOINC codes & sample types",
    href: "/tests",
    category: "Configuration",
    badge: "Test Master",
    badgeColor: "bg-violet-50 text-violet-700 ring-violet-200",
    shortcut: "Alt+T",
    keywords: ["test", "catalog", "panel", "profile", "loinc", "price", "reference", "tat"],
  },
  {
    id: "act-ai-studio",
    title: "Clinical AI Studio & Copilot",
    subtitle: "Gemini medical reasoning, CBC scattergram interpreter & risk cards",
    href: "/ai-studio",
    category: "AI Studio",
    badge: "Gemini AI",
    badgeColor: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    shortcut: "Alt+A",
    keywords: ["ai", "gemini", "scattergram", "copilot", "nlp", "interpretation", "risk"],
  },
  {
    id: "act-digital-twin",
    title: "Digital Twin & Real-Time Ops Workbench",
    subtitle: "3D visual world model, lab simulation, turnaround time bottleneck heatmaps",
    href: "/digital-twin",
    category: "Operations",
    badge: "Digital Twin",
    badgeColor: "bg-orange-50 text-orange-700 ring-orange-200",
    shortcut: "Alt+M",
    keywords: ["digital twin", "simulation", "3d", "operations", "tat", "bottleneck", "heatmap"],
  },
  {
    id: "act-branches",
    title: "Multi-Branch Facility Settings",
    subtitle: "Branch tenant management, satellite lab setup & NABL identifiers",
    href: "/settings/branches",
    category: "Administration",
    badge: "Tenancy",
    badgeColor: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    shortcut: "Alt+F",
    keywords: ["branch", "satellite", "center", "hub", "tenant", "multitenancy", "location"],
  },
];

export class SearchService {
  /**
   * Main unified multi-entity global search execution.
   */
  static async globalSearch(params: GlobalSearchParams): Promise<GlobalSearchResponse> {
    const rawQuery = (params.query || "").trim();
    const category: SearchCategory = params.category || "ALL";
    const limit = Math.min(Math.max(params.limit || 8, 1), 50);
    const useFuzzy = params.fuzzy !== false;
    const branchId = params.branchId || null;

    const categories: GlobalSearchResponse["categories"] = {
      patients: [],
      orders: [],
      samples: [],
      tests: [],
      doctors: [],
      actions: [],
    };

    // If query is blank, surface relevant quick actions and empty entity lists
    if (!rawQuery) {
      categories.actions = SYSTEM_ACTIONS.slice(0, limit).map((act) => ({
        id: act.id,
        type: "ACTION",
        title: act.title,
        subtitle: `${act.subtitle}${act.shortcut ? ` • Shortcut: ${act.shortcut}` : ""}`,
        tag: act.badge,
        tagColor: act.badgeColor,
        href: act.href,
        relevanceScore: 1.0,
        matchType: "DEFAULT",
        metadata: { shortcut: act.shortcut },
      }));

      return {
        query: "",
        category,
        totalMatches: categories.actions.length,
        branchId,
        categories,
        results: categories.actions,
      };
    }

    const q = rawQuery.toLowerCase();

    // -----------------------------------------------------------------------
    // 1. PATIENTS SEARCH
    // -----------------------------------------------------------------------
    if (category === "ALL" || category === "PATIENTS") {
      try {
        const patientWhere: any = {
          OR: [
            { uhid: { contains: rawQuery, mode: "insensitive" } },
            { firstName: { contains: rawQuery, mode: "insensitive" } },
            { lastName: { contains: rawQuery, mode: "insensitive" } },
            { phone: { contains: rawQuery, mode: "insensitive" } },
            { email: { contains: rawQuery, mode: "insensitive" } },
            { aadhaarNumber: { contains: rawQuery, mode: "insensitive" } },
            { abhaNumber: { contains: rawQuery, mode: "insensitive" } },
          ],
        };

        if (branchId) {
          patientWhere.AND = [
            {
              OR: [
                { branchId: branchId },
                { branchId: null },
              ],
            },
          ];
        }

        const dbPatients = await prisma.patient.findMany({
          where: patientWhere,
          take: limit * 2,
          orderBy: { createdAt: "desc" },
        });

        categories.patients = dbPatients
          .map((p) => {
            const fullName = `${p.firstName} ${p.lastName}`.trim();
            const scoreResult = fuzzyScore(`${fullName} ${p.uhid} ${p.phone || ""}`, q);
            return {
              id: p.id,
              type: "PATIENT" as const,
              title: fullName || "Patient Record",
              subtitle: `UHID: ${p.uhid} • ${p.age ? p.age + "y" : "Age N/A"} • ${p.gender || "N/A"} • Phone: ${p.phone || "N/A"}`,
              tag: p.uhid,
              tagColor: "bg-blue-50 text-blue-700 ring-blue-200",
              href: `/patients?uhid=${encodeURIComponent(p.uhid)}`,
              relevanceScore: scoreResult.score || 0.75,
              matchType: scoreResult.matchType || "SUBSTRING",
              metadata: {
                uhid: p.uhid,
                phone: p.phone,
                gender: p.gender,
                age: p.age,
                branchId: p.branchId,
              },
            };
          })
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, limit);
      } catch (err) {
        console.error("Error in Patient search:", err);
      }
    }

    // -----------------------------------------------------------------------
    // 2. ORDERS SEARCH
    // -----------------------------------------------------------------------
    if (category === "ALL" || category === "ORDERS") {
      try {
        const orderWhere: any = {
          OR: [
            { orderNumber: { contains: rawQuery, mode: "insensitive" } },
            { barcode: { contains: rawQuery, mode: "insensitive" } },
            { patient: { firstName: { contains: rawQuery, mode: "insensitive" } } },
            { patient: { lastName: { contains: rawQuery, mode: "insensitive" } } },
            { patient: { uhid: { contains: rawQuery, mode: "insensitive" } } },
          ],
        };

        if (branchId) {
          orderWhere.AND = [
            {
              OR: [
                { branchId: branchId },
                { branchId: null },
              ],
            },
          ];
        }

        const dbOrders = await prisma.order.findMany({
          where: orderWhere,
          take: limit * 2,
          include: {
            patient: { select: { firstName: true, lastName: true, uhid: true } },
            doctor: { select: { fullName: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        categories.orders = dbOrders
          .map((ord) => {
            const patientName = `${ord.patient?.firstName || ""} ${ord.patient?.lastName || ""}`.trim();
            const scoreResult = fuzzyScore(`${ord.orderNumber} ${ord.barcode} ${patientName}`, q);
            return {
              id: ord.id,
              type: "ORDER" as const,
              title: `Order ${ord.orderNumber}`,
              subtitle: `Patient: ${patientName} (${ord.patient?.uhid}) • Total: ₹${ord.grandTotal} • Status: ${ord.orderStatus}`,
              tag: ord.orderStatus,
              tagColor:
                ord.orderStatus === "COMPLETED"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : ord.orderStatus === "CANCELLED"
                  ? "bg-rose-50 text-rose-700 ring-rose-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200",
              href: `/orders/${ord.id}`,
              relevanceScore: scoreResult.score || 0.75,
              matchType: scoreResult.matchType || "SUBSTRING",
              metadata: {
                orderNumber: ord.orderNumber,
                barcode: ord.barcode,
                patientId: ord.patientId,
                status: ord.orderStatus,
                branchId: ord.branchId,
              },
            };
          })
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, limit);
      } catch (err) {
        console.error("Error in Order search:", err);
      }
    }

    // -----------------------------------------------------------------------
    // 3. SAMPLES SEARCH
    // -----------------------------------------------------------------------
    if (category === "ALL" || category === "SAMPLES") {
      try {
        const sampleWhere: any = {
          OR: [
            { barcode: { contains: rawQuery, mode: "insensitive" } },
            { sampleNumber: { contains: rawQuery, mode: "insensitive" } },
            { patient: { firstName: { contains: rawQuery, mode: "insensitive" } } },
            { patient: { lastName: { contains: rawQuery, mode: "insensitive" } } },
            { test: { testName: { contains: rawQuery, mode: "insensitive" } } },
          ],
        };

        if (branchId) {
          sampleWhere.order = {
            OR: [
              { branchId: branchId },
              { branchId: null },
            ],
          };
        }

        const dbSamples = await prisma.sample.findMany({
          where: sampleWhere,
          take: limit * 2,
          include: {
            patient: { select: { firstName: true, lastName: true, uhid: true } },
            test: { select: { testName: true, testCode: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        categories.samples = dbSamples
          .map((s) => {
            const patientName = `${s.patient?.firstName || ""} ${s.patient?.lastName || ""}`.trim();
            const scoreResult = fuzzyScore(`${s.barcode} ${s.sampleNumber} ${s.sampleType} ${patientName}`, q);
            return {
              id: s.id,
              type: "SAMPLE" as const,
              title: `Specimen ${s.barcode}`,
              subtitle: `Test: ${s.test?.testName || "Assay"} • Type: ${s.sampleType} • Patient: ${patientName}`,
              tag: s.status,
              tagColor:
                s.status === "COMPLETED"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : s.status === "REJECTED"
                  ? "bg-rose-50 text-rose-700 ring-rose-200"
                  : "bg-purple-50 text-purple-700 ring-purple-200",
              href: `/samples?barcode=${encodeURIComponent(s.barcode)}`,
              relevanceScore: scoreResult.score || 0.75,
              matchType: scoreResult.matchType || "SUBSTRING",
              metadata: {
                barcode: s.barcode,
                sampleNumber: s.sampleNumber,
                sampleType: s.sampleType,
                status: s.status,
              },
            };
          })
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, limit);
      } catch (err) {
        console.error("Error in Sample search:", err);
      }
    }

    // -----------------------------------------------------------------------
    // 4. TESTS (CATALOG) SEARCH
    // -----------------------------------------------------------------------
    if (category === "ALL" || category === "TESTS") {
      try {
        const testWhere: any = {
          OR: [
            { testName: { contains: rawQuery, mode: "insensitive" } },
            { testCode: { contains: rawQuery, mode: "insensitive" } },
            { shortName: { contains: rawQuery, mode: "insensitive" } },
            { category: { name: { contains: rawQuery, mode: "insensitive" } } },
          ],
        };

        const dbTests = await prisma.test.findMany({
          where: testWhere,
          take: limit * 2,
          include: { category: { select: { name: true } } },
          orderBy: { testName: "asc" },
        });

        categories.tests = dbTests
          .map((t) => {
            const scoreResult = fuzzyScore(`${t.testName} ${t.testCode} ${t.shortName || ""} ${t.category?.name || ""}`, q);
            return {
              id: t.id,
              type: "TEST" as const,
              title: t.testName,
              subtitle: `Code: ${t.testCode} • Dept: ${t.category?.name || "General"} • Specimen: ${t.sampleType} • TAT: ${t.tatHours}h`,
              tag: `₹${t.price}`,
              tagColor: "bg-violet-50 text-violet-700 ring-violet-200",
              href: `/orders/new?testCode=${encodeURIComponent(t.testCode)}`,
              relevanceScore: scoreResult.score || 0.75,
              matchType: scoreResult.matchType || "SUBSTRING",
              metadata: {
                testCode: t.testCode,
                price: Number(t.price),
                tatHours: t.tatHours,
                sampleType: t.sampleType,
              },
            };
          })
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, limit);
      } catch (err) {
        console.error("Error in Test search:", err);
      }
    }

    // -----------------------------------------------------------------------
    // 5. DOCTORS SEARCH
    // -----------------------------------------------------------------------
    if (category === "ALL" || category === "DOCTORS") {
      try {
        const doctorWhere: any = {
          OR: [
            { fullName: { contains: rawQuery, mode: "insensitive" } },
            { doctorCode: { contains: rawQuery, mode: "insensitive" } },
            { specialization: { contains: rawQuery, mode: "insensitive" } },
            { clinicName: { contains: rawQuery, mode: "insensitive" } },
            { registrationNumber: { contains: rawQuery, mode: "insensitive" } },
            { phone: { contains: rawQuery, mode: "insensitive" } },
          ],
        };

        const dbDoctors = await prisma.doctor.findMany({
          where: doctorWhere,
          take: limit * 2,
          orderBy: { fullName: "asc" },
        });

        categories.doctors = dbDoctors
          .map((doc) => {
            const scoreResult = fuzzyScore(`${doc.fullName} ${doc.specialization || ""} ${doc.clinicName || ""}`, q);
            return {
              id: doc.id,
              type: "DOCTOR" as const,
              title: doc.fullName.startsWith("Dr.") ? doc.fullName : `Dr. ${doc.fullName}`,
              subtitle: `${doc.specialization || "General Medicine"} • Clinic: ${doc.clinicName || "Private Practice"} • Reg: ${doc.registrationNumber || "MCI-N/A"}`,
              tag: doc.specialization || "Clinician",
              tagColor: "bg-sky-50 text-sky-700 ring-sky-200",
              href: `/doctors?id=${doc.id}`,
              relevanceScore: scoreResult.score || 0.75,
              matchType: scoreResult.matchType || "SUBSTRING",
              metadata: {
                doctorCode: doc.doctorCode,
                phone: doc.phone,
                clinicName: doc.clinicName,
                specialization: doc.specialization,
              },
            };
          })
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, limit);
      } catch (err) {
        console.error("Error in Doctor search:", err);
      }
    }

    // -----------------------------------------------------------------------
    // 6. SYSTEM QUICK ACTIONS SEARCH
    // -----------------------------------------------------------------------
    if (category === "ALL" || category === "ACTIONS") {
      categories.actions = SYSTEM_ACTIONS.map((act) => {
        const searchableText = `${act.title} ${act.subtitle} ${act.badge} ${act.shortcut || ""} ${act.keywords.join(" ")}`;
        const scoreResult = fuzzyScore(searchableText, q, 0.35);
        return {
          id: act.id,
          type: "ACTION" as const,
          title: act.title,
          subtitle: `${act.subtitle}${act.shortcut ? ` • Shortcut: ${act.shortcut}` : ""}`,
          tag: act.badge,
          tagColor: act.badgeColor,
          href: act.href,
          relevanceScore: scoreResult.isMatch ? scoreResult.score : 0,
          matchType: scoreResult.matchType,
          metadata: { shortcut: act.shortcut },
        };
      })
        .filter((act) => act.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    }

    // -----------------------------------------------------------------------
    // 7. AGGREGATE & UNIFY RANKED LIST
    // -----------------------------------------------------------------------
    const allResults: SearchResultItem[] = [
      ...categories.actions,
      ...categories.patients,
      ...categories.orders,
      ...categories.samples,
      ...categories.tests,
      ...categories.doctors,
    ];

    allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const totalMatches =
      categories.patients.length +
      categories.orders.length +
      categories.samples.length +
      categories.tests.length +
      categories.doctors.length +
      categories.actions.length;

    return {
      query: rawQuery,
      category,
      totalMatches,
      branchId,
      categories,
      results: allResults.slice(0, limit * 2),
    };
  }

  /**
   * Return full curated system actions list for keyboard commands discovery.
   */
  static getQuickActions(): SystemActionItem[] {
    return SYSTEM_ACTIONS;
  }
}
