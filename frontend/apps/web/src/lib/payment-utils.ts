export const PAYMENT_TABS = [
  "Overview",
  "Transactions",
  "Pending Dues",
  "Cash Counter",
  "Advances & Wallet",
  "Refunds",
  "Settlements",
  "Reconciliation",
  "Reports",
  "Audit Log",
] as const;

export type PaymentTab = (typeof PAYMENT_TABS)[number];

export type HealthcareFacilityScale = "ALL" | "HOSPITAL" | "LAB" | "CLINIC";

export const TAB_SLUG_MAP: Record<string, PaymentTab> = {
  overview: "Overview",
  transactions: "Transactions",
  ledger: "Transactions",
  dues: "Pending Dues",
  "pending-dues": "Pending Dues",
  receivables: "Pending Dues",
  due: "Pending Dues",
  "cash-counter": "Cash Counter",
  cashcounter: "Cash Counter",
  counter: "Cash Counter",
  till: "Cash Counter",
  advances: "Advances & Wallet",
  wallet: "Advances & Wallet",
  refunds: "Refunds",
  "credit-notes": "Refunds",
  settlements: "Settlements",
  edc: "Settlements",
  reconciliation: "Reconciliation",
  reconcile: "Reconciliation",
  reports: "Reports",
  "day-book": "Reports",
  "audit-log": "Audit Log",
  audit: "Audit Log",
};

export const TAB_TO_SLUG: Record<PaymentTab, string> = {
  Overview: "",
  Transactions: "transactions",
  "Pending Dues": "dues",
  "Cash Counter": "cash-counter",
  "Advances & Wallet": "advances",
  Refunds: "refunds",
  Settlements: "settlements",
  Reconciliation: "reconciliation",
  Reports: "reports",
  "Audit Log": "audit-log",
};

export function resolvePaymentTabFromSlug(slug: string | null | undefined): PaymentTab {
  if (!slug) return "Overview";
  const trimmed = slug.trim();
  if (!trimmed) return "Overview";
  const lower = trimmed.toLowerCase();
  if (TAB_SLUG_MAP[lower]) {
    return TAB_SLUG_MAP[lower];
  }
  if ((PAYMENT_TABS as readonly string[]).includes(trimmed)) {
    return trimmed as PaymentTab;
  }
  return "Overview";
}

export function calculateDenominationTotal(denominations: Record<string, number>): number {
  const notes = [500, 200, 100, 50, 20, 10, 5];
  const noteSum = notes.reduce((sum, note) => {
    const count = Math.max(0, Number(denominations[String(note)] || 0));
    return sum + count * note;
  }, 0);
  const coins = Math.max(0, Number(denominations.coins || 0));
  return Math.round((noteSum + coins) * 100) / 100;
}

export interface ShiftTillReconciliationInput {
  openingFloat: number;
  cashCollections: number;
  cashRefunds: number;
  pettyIn: number;
  pettyOut: number;
  physicalCounted: number;
  retainFloat?: number;
}

export interface ShiftTillReconciliationResult {
  expectedDrawer: number;
  physicalCounted: number;
  variance: number;
  status: "BALANCED" | "SURPLUS" | "SHORTAGE";
  recommendedSafeDrop: number;
  retainedNextShiftFloat: number;
}

export function calculateShiftTillReconciliation(
  input: ShiftTillReconciliationInput
): ShiftTillReconciliationResult {
  const retain = input.retainFloat ?? 5000;
  const expectedDrawer =
    Math.round(
      (Number(input.openingFloat || 0) +
        Number(input.cashCollections || 0) +
        Number(input.pettyIn || 0) -
        Number(input.cashRefunds || 0) -
        Number(input.pettyOut || 0)) *
        100
    ) / 100;
  const physicalCounted = Math.round(Number(input.physicalCounted || 0) * 100) / 100;
  const variance = Math.round((physicalCounted - expectedDrawer) * 100) / 100;

  let status: "BALANCED" | "SURPLUS" | "SHORTAGE" = "BALANCED";
  if (variance > 0) status = "SURPLUS";
  else if (variance < 0) status = "SHORTAGE";

  const recommendedSafeDrop = Math.max(0, Math.round((expectedDrawer - retain) * 100) / 100);
  const retainedNextShiftFloat = Math.min(expectedDrawer, retain);

  return {
    expectedDrawer,
    physicalCounted,
    variance,
    status,
    recommendedSafeDrop,
    retainedNextShiftFloat,
  };
}

export type AgingBucketCode = "CURRENT" | "8-15" | "16-30" | "30+";

export interface ReceivableAgingClassification {
  bucket: AgingBucketCode;
  label: string;
  priority: "ROUTINE" | "FOLLOW_UP" | "ESCALATED" | "CRITICAL_HOLD";
}

export function classifyReceivableAgingBucket(daysOverdue: number): ReceivableAgingClassification {
  const days = Math.max(0, Math.floor(Number(daysOverdue || 0)));
  if (days > 30) {
    return {
      bucket: "30+",
      label: "30+ Days Overdue",
      priority: "CRITICAL_HOLD",
    };
  }
  if (days >= 16) {
    return {
      bucket: "16-30",
      label: "16–30 Days Due",
      priority: "ESCALATED",
    };
  }
  if (days >= 8) {
    return {
      bucket: "8-15",
      label: "8–15 Days Due",
      priority: "FOLLOW_UP",
    };
  }
  return {
    bucket: "CURRENT",
    label: "0–7 Days (Current)",
    priority: "ROUTINE",
  };
}

export interface FacilityScaleMeta {
  id: HealthcareFacilityScale;
  title: string;
  shortLabel: string;
  subtitle: string;
  counters: string[];
  encounterTypes: Array<"OPD" | "IPD" | "STAT" | "HOME" | "CORP">;
  badgeText: string;
  badge: string;
  departments: string[];
}

export function getFacilityScaleMeta(scale: HealthcareFacilityScale): FacilityScaleMeta {
  switch (scale) {
    case "HOSPITAL":
      return {
        id: "HOSPITAL",
        title: "Multi-Specialty Hospital & Inpatient Billing",
        shortLabel: "Hospital (OPD / IPD / ER)",
        subtitle:
          "Central OPD/IPD cashier desks, 24x7 emergency casualty billing, inpatient deposit ledgers, and TPA co-pay settlements",
        counters: ["Counter 01", "Counter 02"],
        encounterTypes: ["OPD", "IPD", "STAT", "CORP"],
        badgeText: "NABH & NABL Accredited Hospital",
        badge: "Multi-Specialty Hospital Cashier Desk (OPD • IPD • Emergency)",
        departments: ["Outpatient (OPD)", "Inpatient (IPD) Wards", "24x7 Casualty & ER", "TPA & Corporate Desk"],
      };
    case "LAB":
      return {
        id: "LAB",
        title: "Diagnostic Reference Laboratory & Phlebotomy Desk",
        shortLabel: "Diagnostic Lab & Sample Desk",
        subtitle:
          "Walk-in specimen accessioning receipts, home phlebotomy UPI/QR collections, report-release balance dues, and B2B lab settlements",
        counters: ["Counter 01", "Counter 03", "Counter 04"],
        encounterTypes: ["OPD", "HOME", "STAT", "CORP"],
        badgeText: "NABL ISO 15189:2022 Diagnostic Lab",
        badge: "NABL ISO 15189:2022 Reference Lab & Sample Reception Desk",
        departments: ["Clinical Pathology", "Biochemistry & Immunoassay", "Microbiology & Molecular", "Home Phlebotomy"],
      };
    case "CLINIC":
      return {
        id: "CLINIC",
        title: "Outpatient Polyclinic, Consultation & Daycare Center",
        shortLabel: "Polyclinic & Medical Center",
        subtitle:
          "Single-window doctor consultation & diagnostic billing, daycare procedure advances, quick 80mm thermal receipts, and daily shift cash book",
        counters: ["Counter 01", "Counter 03"],
        encounterTypes: ["OPD", "HOME"],
        badgeText: "Clinical Establishment Act Registered",
        badge: "Outpatient Polyclinic & Specialist Consultation Billing Desk",
        departments: ["Specialist Consultation", "Daycare Procedures", "Point-of-Care Diagnostics", "Pharmacy & Vaccination"],
      };
    default:
      return {
        id: "ALL",
        title: "Enterprise Healthcare Billing & Cashier Operations",
        shortLabel: "All Units (Hospital • Lab • Clinic)",
        subtitle:
          "Unified multi-counter cash registers, EDC card & UPI settlements, patient advance wallets, pending dues collection, bank reconciliation & statutory audit",
        counters: ["Counter 01", "Counter 02", "Counter 03", "Counter 04"],
        encounterTypes: ["OPD", "IPD", "STAT", "HOME", "CORP"],
        badgeText: "SAC 999312 Healthcare Exempt • ISO 15189:2022",
        badge: "ELIS Hospital, Diagnostic Lab & Polyclinic Cashier Command Desk",
        departments: ["OPD & Specialist Clinic", "Inpatient (IPD) Billing", "NABL Diagnostic Lab", "Corporate & TPA Credit"],
      };
  }
}

