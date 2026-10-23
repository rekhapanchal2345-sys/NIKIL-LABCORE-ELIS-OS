"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Copy,
  Download,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Sliders,
  Check,
  Sparkles,
  Info,
  Clock,
  Laptop,
  Fingerprint,
  FileCheck,
  Stethoscope,
  FlaskConical,
  CreditCard,
  Settings,
  Database,
  Eye,
  RefreshCw,
  X,
  FileText,
  Building2,
  Receipt
} from "lucide-react";

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  category: "patients" | "orders" | "laboratory" | "approvals" | "billing" | "admin";
  isCritical?: boolean;
}

export interface LabRole {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  badgeStyle: string;
  icon: any;
  userCount: number;
  isSystem: boolean;
  isNablSignatory: boolean;
  requiresMfa: boolean;
  sessionTimeoutMin: number;
  permissions: string[];
  updatedAt: string;
}

// 6 Core Clinical Permission Domains
export const CLINICAL_PERMISSIONS: PermissionItem[] = [
  // 1. Patients & Demographics
  { id: "patient.view", name: "View Patient Directory", description: "Access patient profiles, history, and medical records", category: "patients" },
  { id: "patient.create", name: "Register New Patients", description: "Create patient records and generate system UHID", category: "patients" },
  { id: "patient.edit", name: "Edit Demographics", description: "Modify patient contact, age, gender, and clinical history", category: "patients" },
  { id: "patient.delete", name: "Delete & Merge Patients", description: "Merge duplicate records or archive patient profiles", category: "patients", isCritical: true },
  { id: "patient.export", name: "Export Patient Index", description: "Download patient master directory in CSV / Excel", category: "patients" },

  // 2. Orders & Accessioning
  { id: "orders.view", name: "View Workorders Queue", description: "Inspect sample accessioning and active orders", category: "orders" },
  { id: "orders.create", name: "Create & Bill Orders", description: "Order lab tests, assign sample barcodes, and bill", category: "orders" },
  { id: "orders.cancel", name: "Cancel Orders & Reversal", description: "Cancel registered test orders and void billings", category: "orders", isCritical: true },
  { id: "orders.discount", name: "Apply Billing Discounts", description: "Grant tariff discounts, fee waivers, or credit approval", category: "orders", isCritical: true },
  { id: "samples.accession", name: "Phlebotomy & Barcoding", description: "Receive specimens, print tube barcodes, and scan", category: "orders" },
  { id: "samples.reject", name: "Reject Compromised Samples", description: "Mark specimens hemolyzed, lipemic, or insufficient volume", category: "orders" },

  // 3. Lab Pipeline & Analyzers
  { id: "results.enter", name: "Technical Result Entry", description: "Input parameter values, flags, and technical notes", category: "laboratory" },
  { id: "results.import", name: "ASTM / HL7 Analyzer Pull", description: "Directly import automated analyzer results via LIS interface", category: "laboratory" },
  { id: "analyzers.control", name: "QC Calibration & LJ Charts", description: "Run daily controls, calibrations, and plot Levey-Jennings", category: "laboratory" },
  { id: "analyzers.config", name: "Hardware Interfacing Config", description: "Configure analyzer COM ports, baud rates, and ASTM mappings", category: "laboratory", isCritical: true },
  { id: "qc.override", name: "Override Westgard QC Violations", description: "Force assay progression despite control flags (Audited)", category: "laboratory", isCritical: true },

  // 4. Clinical Verification & Sign-Off (Highest Medical Privilege)
  { id: "approvals.sign", name: "NABL Pathologist Sign-Off", description: "Digitally sign & authorize patient diagnostic test reports", category: "approvals", isCritical: true },
  { id: "approvals.critical", name: "Panic Value Release", description: "Verify life-critical abnormal values & trigger emergency alerts", category: "approvals", isCritical: true },
  { id: "approvals.delta", name: "Delta Check Override", description: "Authorize acute variance compared to patient historical baseline", category: "approvals", isCritical: true },
  { id: "approvals.batch", name: "Clean Fast-Track Batch Sign", description: "1-click auto-release of 100% normal verified tests", category: "approvals" },
  { id: "reports.dispatch", name: "Dispatch WhatsApp & Dossier", description: "Release PDF reports to patients and referring clinicians", category: "approvals" },

  // 5. Billing, Ledger & Cash Counter
  { id: "billing.pos", name: "Front Desk POS Collection", description: "Collect payments via UPI, Cash, Card, and issue receipts", category: "billing" },
  { id: "billing.daybook", name: "Shift Day Book & Ledger", description: "Inspect daily collection tallies and close register shifts", category: "billing" },
  { id: "billing.settlement", name: "B2B & Referral Settlements", description: "Reconcile physician referral and hospital billing cuts", category: "billing", isCritical: true },
  { id: "billing.credit", name: "Corporate Credit Ledger", description: "Manage insurer TPA, corporate accounts, and aging credit", category: "billing" },

  // 6. System Governance & Accreditation
  { id: "admin.users", name: "Manage Staff Personnel", description: "Create, modify, lock, and assign shifts to staff users", category: "admin", isCritical: true },
  { id: "admin.roles", name: "Edit Permissions Matrix", description: "Configure system roles, access policies, and security caps", category: "admin", isCritical: true },
  { id: "admin.audit", name: "Forensic Audit Log Trail", description: "Inspect immutable system events, logins, and overrides", category: "admin" },
  { id: "admin.backup", name: "Cloud Backup & System Sync", description: "Trigger full database snapshots and disaster recovery", category: "admin", isCritical: true },
  { id: "admin.nabl", name: "NABL Compliance Dossier", description: "Generate ISO 15189 compliance documentation and IQC audits", category: "admin" },
];

export const PERMISSION_CATEGORIES: { id: PermissionItem["category"]; label: string; icon: any; color: string }[] = [
  { id: "patients", label: "Patients & Demographics", icon: Users, color: "text-indigo-600" },
  { id: "orders", label: "Orders, Phlebotomy & Accession", icon: FlaskConical, color: "text-sky-600" },
  { id: "laboratory", label: "Lab Assays, Analyzers & QC", icon: Sliders, color: "text-teal-600" },
  { id: "approvals", label: "Clinical Verification & Sign-Off", icon: Stethoscope, color: "text-emerald-600" },
  { id: "billing", label: "Billing, POS & Cash Ledger", icon: CreditCard, color: "text-amber-600" },
  { id: "admin", label: "System Security & NABL Audit", icon: ShieldCheck, color: "text-rose-600" },
];

const ROLE_ICONS: Record<string, any> = {
  SUPER_ADMIN: ShieldCheck,
  ADMIN: ShieldCheck,
  BRANCH_ADMIN: Building2,
  PATHOLOGIST: Stethoscope,
  DOCTOR: Stethoscope,
  LAB_TECH: FlaskConical,
  FRONT_DESK: CreditCard,
  ACCOUNTANT: Receipt,
  AUDITOR: Award,
  QUALITY_MANAGER: Award,
};

function getRoleIcon(code: string) {
  return ROLE_ICONS[code] || Shield;
}

const INITIAL_ROLES: LabRole[] = [
  {
    id: "role-super-admin",
    code: "SUPER_ADMIN",
    name: "Super Administrator & Medical Director",
    description: "Global sovereign authority across multi-branch hospital network, compliance policies, database disaster recovery, and master accreditation governance.",
    color: "from-sky-600 to-indigo-700",
    badgeStyle: "bg-sky-50 text-sky-800 border-sky-200",
    icon: ShieldCheck,
    userCount: 1,
    isSystem: true,
    isNablSignatory: true,
    requiresMfa: true,
    sessionTimeoutMin: 30,
    permissions: CLINICAL_PERMISSIONS.map((p) => p.id),
    updatedAt: "2026-03-15",
  },
  {
    id: "role-admin",
    code: "ADMIN",
    name: "Laboratory Administrator & Director",
    description: "Sovereign root administrative authority over laboratory operations, staff credentials, accreditation policies, and audit governance.",
    color: "from-indigo-600 to-purple-700",
    badgeStyle: "bg-indigo-50 text-indigo-800 border-indigo-200",
    icon: ShieldCheck,
    userCount: 1,
    isSystem: true,
    isNablSignatory: true,
    requiresMfa: true,
    sessionTimeoutMin: 60,
    permissions: CLINICAL_PERMISSIONS.map((p) => p.id).filter((id) => id !== "admin.audit"),
    updatedAt: "2026-03-10",
  },
  {
    id: "role-branch-admin",
    code: "BRANCH_ADMIN",
    name: "Branch Lab Manager",
    description: "Branch-level administrative operations, staff shift coordination, local instrument maintenance, and OPD collection center governance.",
    color: "from-slate-600 to-slate-800",
    badgeStyle: "bg-slate-100 text-slate-800 border-slate-200",
    icon: Building2,
    userCount: 1,
    isSystem: true,
    isNablSignatory: false,
    requiresMfa: true,
    sessionTimeoutMin: 60,
    permissions: [
      "patient.view",
      "patient.create",
      "patient.edit",
      "orders.view",
      "orders.create",
      "samples.accession",
      "results.enter",
      "billing.pos",
      "billing.daybook",
      "admin.users",
    ],
    updatedAt: "2026-03-11",
  },
  {
    id: "role-pathologist",
    code: "PATHOLOGIST",
    name: "Consultant Pathologist (NABL Signatory)",
    description: "NABL Authorized Signatory with clinical sign-off privilege, panic value clearance, delta check overrides, and diagnostic report release.",
    color: "from-emerald-600 to-teal-700",
    badgeStyle: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: Stethoscope,
    userCount: 2,
    isSystem: true,
    isNablSignatory: true,
    requiresMfa: true,
    sessionTimeoutMin: 30,
    permissions: [
      "patient.view",
      "orders.view",
      "results.enter",
      "results.import",
      "analyzers.control",
      "qc.override",
      "approvals.sign",
      "approvals.critical",
      "approvals.delta",
      "approvals.batch",
      "reports.dispatch",
      "admin.audit",
      "admin.nabl",
    ],
    updatedAt: "2026-03-12",
  },
  {
    id: "role-labtech",
    code: "LAB_TECH",
    name: "Senior Medical Lab Technologist",
    description: "Bench operations specialist handling sample accessioning, automated analyzer runs, technical result entry, and daily calibration QC.",
    color: "from-sky-600 to-blue-700",
    badgeStyle: "bg-sky-50 text-sky-800 border-sky-200",
    icon: FlaskConical,
    userCount: 3,
    isSystem: true,
    isNablSignatory: false,
    requiresMfa: false,
    sessionTimeoutMin: 120,
    permissions: [
      "patient.view",
      "orders.view",
      "samples.accession",
      "samples.reject",
      "results.enter",
      "results.import",
      "analyzers.control",
    ],
    updatedAt: "2026-03-08",
  },
  {
    id: "role-doctor",
    code: "DOCTOR",
    name: "Referring Clinician / Consultant",
    description: "External or hospital physician portal to register patient referrals, view real-time diagnostic progress, and download signed dossiers.",
    color: "from-teal-600 to-cyan-700",
    badgeStyle: "bg-teal-50 text-teal-800 border-teal-200",
    icon: Stethoscope,
    userCount: 1,
    isSystem: true,
    isNablSignatory: false,
    requiresMfa: true,
    sessionTimeoutMin: 30,
    permissions: [
      "patient.view",
      "patient.create",
      "orders.view",
      "orders.create",
      "reports.dispatch",
    ],
    updatedAt: "2026-02-28",
  },
  {
    id: "role-frontdesk",
    code: "FRONT_DESK",
    name: "Patient Reception & POS Billing",
    description: "Front desk officer managing patient intake, barcode sticker printing, invoice generation, day book tally, and receipt settlement.",
    color: "from-amber-600 to-orange-700",
    badgeStyle: "bg-amber-50 text-amber-800 border-amber-200",
    icon: CreditCard,
    userCount: 1,
    isSystem: true,
    isNablSignatory: false,
    requiresMfa: false,
    sessionTimeoutMin: 480,
    permissions: [
      "patient.view",
      "patient.create",
      "patient.edit",
      "orders.view",
      "orders.create",
      "samples.accession",
      "billing.pos",
      "billing.daybook",
      "reports.dispatch",
    ],
    updatedAt: "2026-03-05",
  },
  {
    id: "role-accountant",
    code: "ACCOUNTANT",
    name: "Finance & Accounts Officer",
    description: "Financial ledger management, physician cut reconciliation, B2B billing settlements, refund audits, and corporate credit aging.",
    color: "from-emerald-600 to-green-700",
    badgeStyle: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: Receipt,
    userCount: 1,
    isSystem: true,
    isNablSignatory: false,
    requiresMfa: true,
    sessionTimeoutMin: 60,
    permissions: [
      "patient.view",
      "orders.view",
      "billing.pos",
      "billing.daybook",
      "billing.settlement",
      "billing.credit",
    ],
    updatedAt: "2026-03-09",
  },
  {
    id: "role-auditor",
    code: "AUDITOR",
    name: "Forensic Compliance Auditor",
    description: "Read-only access to immutable forensic audit logs, ISO 15189 accreditation records, results verification trail, and security overrides.",
    color: "from-purple-600 to-indigo-700",
    badgeStyle: "bg-purple-50 text-purple-800 border-purple-200",
    icon: Award,
    userCount: 1,
    isSystem: true,
    isNablSignatory: false,
    requiresMfa: true,
    sessionTimeoutMin: 60,
    permissions: [
      "patient.view",
      "orders.view",
      "admin.audit",
      "admin.nabl",
    ],
    updatedAt: "2026-03-12",
  },
  {
    id: "role-quality",
    code: "QUALITY_MANAGER",
    name: "ISO 15189 Quality Manager",
    description: "Dedicated officer overseeing NABL ISO accreditation compliance, analyzer IQC/EQAS records, incident investigations, and audit logs.",
    color: "from-rose-600 to-pink-700",
    badgeStyle: "bg-rose-50 text-rose-800 border-rose-200",
    icon: Award,
    userCount: 1,
    isSystem: false,
    isNablSignatory: false,
    requiresMfa: true,
    sessionTimeoutMin: 60,
    permissions: [
      "patient.view",
      "orders.view",
      "analyzers.control",
      "analyzers.config",
      "qc.override",
      "admin.audit",
      "admin.nabl",
      "admin.backup",
    ],
    updatedAt: "2026-03-11",
  },
];

export default function RolesManagementView() {
  const [roles, setRoles] = useState<LabRole[]>(INITIAL_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("role-pathologist");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("ALL");
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toast, setToast] = useState<{ title: string; desc: string; type: "success" | "info" | "error" } | null>(null);

  // Compliance policy toggles
  const [dualAuthEnabled, setDualAuthEnabled] = useState(true);
  const [breakGlassEnabled, setBreakGlassEnabled] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("labcore_hospital_roles_permissions");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hydrated = parsed.map((r: any) => ({
            ...r,
            icon: getRoleIcon(r.code),
          }));
          setRoles(hydrated);
          return;
        }
      }
    } catch {
      // fallback
    }
  }, []);

  const saveRoles = (updatedRoles: LabRole[]) => {
    setRoles(updatedRoles);
    try {
      const serializable = updatedRoles.map(({ icon, ...rest }) => rest);
      localStorage.setItem("labcore_hospital_roles_permissions", JSON.stringify(serializable));
    } catch {
      // ignore
    }
  };

  const showToast = (title: string, desc: string, type: "success" | "info" | "error" = "success") => {
    setToast({ title, desc, type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0];
  }, [roles, selectedRoleId]);

  const handleTogglePermission = (permissionId: string) => {
    if (selectedRole.code === "SUPER_ADMIN") {
      showToast("Super Administrator Policy", "Super Administrator holds global sovereignty. Core permissions cannot be revoked.", "info");
      return;
    }

    const hasPerm = selectedRole.permissions.includes(permissionId);
    const nextPerms = hasPerm
      ? selectedRole.permissions.filter((p) => p !== permissionId)
      : [...selectedRole.permissions, permissionId];

    const updated = roles.map((r) =>
      r.id === selectedRole.id ? { ...r, permissions: nextPerms, updatedAt: new Date().toISOString().split("T")[0] } : r
    );

    saveRoles(updated);
    showToast(
      hasPerm ? "Permission Revoked" : "Permission Granted",
      `${permissionId} ${hasPerm ? "removed from" : "granted to"} ${selectedRole.name}.`,
      "success"
    );
  };

  const handleExportMatrixCSV = () => {
    const header = ["Permission ID", "Permission Name", "Domain Category", "Critical Medical Privilege", ...roles.map((r) => r.name)];
    const rows = CLINICAL_PERMISSIONS.map((perm) => {
      return [
        perm.id,
        `"${perm.name}"`,
        perm.category,
        perm.isCritical ? "HIGH RISK" : "STANDARD",
        ...roles.map((r) => (r.permissions.includes(perm.id) ? "AUTHORIZED" : "RESTRICTED")),
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [header.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LabCore_Hospital_Clinical_RBAC_Matrix_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Compliance Matrix Exported", "Downloaded complete NABL ISO 15189 Role-Based Access Matrix.", "success");
  };

  const filteredPermissions = useMemo(() => {
    return CLINICAL_PERMISSIONS.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchId) return false;
      }
      if (activeCategoryFilter !== "ALL" && p.category !== activeCategoryFilter) {
        return false;
      }
      if (showCriticalOnly && !p.isCritical) {
        return false;
      }
      return true;
    });
  }, [searchQuery, activeCategoryFilter, showCriticalOnly]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl text-slate-800 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">{toast.title}</h4>
            <p className="text-xs text-slate-600">{toast.desc}</p>
          </div>
        </div>
      )}

      {/* Hospital Light Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">
                  Clinical Role Governance & Granular Permissions Matrix
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  <Award className="h-3.5 w-3.5 text-emerald-600" />
                  NABL ISO 15189:2022 Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Hospital-grade privilege segregation, four-eyes panic verification, NABL report release seals & session security caps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportMatrixCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Audit Matrix (CSV)
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Custom Role
            </button>
          </div>
        </div>

        {/* 4 Clinical Policy Cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Dual Auth Policy */}
          <div
            onClick={() => {
              setDualAuthEnabled(!dualAuthEnabled);
              showToast("Four-Eyes Policy", `Dual authorization for critical panic values is now ${!dualAuthEnabled ? "ENFORCED" : "BYPASSED"}.`, "info");
            }}
            className={`rounded-xl border p-3 cursor-pointer transition-all ${
              dualAuthEnabled
                ? "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Four-Eyes Dual Sign-off</span>
              <span className={`h-2 w-2 rounded-full ${dualAuthEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            </div>
            <div className="mt-1 text-[11px] text-slate-600">
              {dualAuthEnabled ? "Mandatory 2 Pathologists for panic reports" : "Single pathologist sign-off active"}
            </div>
          </div>

          {/* Break Glass */}
          <div
            onClick={() => {
              setBreakGlassEnabled(!breakGlassEnabled);
              showToast("Emergency Override", `Break-Glass protocol is now ${!breakGlassEnabled ? "ENABLED" : "DISABLED"}.`, "info");
            }}
            className={`rounded-xl border p-3 cursor-pointer transition-all ${
              breakGlassEnabled
                ? "border-amber-200 bg-amber-50/60 hover:bg-amber-50"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Break-Glass Emergency</span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="mt-1 text-[11px] text-slate-600">
              {breakGlassEnabled ? "Audited night-shift emergency elevation ON" : "Strict role lock only"}
            </div>
          </div>

          {/* Active Roles */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Accredited Roles</span>
              <Shield className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">{roles.length} Roles</span>
              <span className="text-[11px] text-sky-700 font-semibold">{CLINICAL_PERMISSIONS.length} Powers</span>
            </div>
          </div>

          {/* Signatory Roles */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Signatory Roles</span>
              <Award className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">{roles.filter((r) => r.isNablSignatory).length} Signatory Roles</span>
              <span className="text-[11px] text-emerald-700 font-semibold">NABL Accredited</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Role Directory Left (4 cols) + Permissions Matrix Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Role Directory */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hospital Roles Directory
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {roles.length} Active Roles
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-[750px] overflow-y-auto pr-1">
              {roles.map((role) => {
                const isSelected = selectedRoleId === role.id;
                const RoleIcon = getRoleIcon(role.code);
                const permCoverage = Math.round((role.permissions.length / CLINICAL_PERMISSIONS.length) * 100);

                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`rounded-xl p-3.5 border transition-all cursor-pointer ${
                      isSelected
                        ? "border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr ${role.color} text-white shadow-sm flex-shrink-0`}>
                          <RoleIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate text-slate-900 m-0">
                            {role.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                            {role.code}
                          </span>
                        </div>
                      </div>

                      {role.isNablSignatory && (
                        <span title="NABL Signatory">
                          <Award className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed m-0">
                      {role.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Coverage:</span>
                      <span className="font-bold text-sky-800">
                        {role.permissions.length} / {CLINICAL_PERMISSIONS.length} ({permCoverage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Permissions Matrix */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${selectedRole.color} text-white shadow-sm flex-shrink-0`}>
                  {(() => {
                    const SelIcon = getRoleIcon(selectedRole.code);
                    return <SelIcon className="h-6 w-6" />;
                  })()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 m-0">{selectedRole.name}</h2>
                    <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {selectedRole.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 m-0">{selectedRole.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  {selectedRole.permissions.length} Powers Granted
                </span>
              </div>
            </div>

            {/* Category Filter Pills & Search */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
                <button
                  type="button"
                  onClick={() => setActiveCategoryFilter("ALL")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    activeCategoryFilter === "ALL"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({CLINICAL_PERMISSIONS.length})
                </button>
                {PERMISSION_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
                      activeCategoryFilter === cat.id
                        ? "bg-sky-600 text-white"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter powers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Permissions Checkbox Grid */}
            <div className="mt-4 divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-1">
              {filteredPermissions.map((perm) => {
                const isGranted = selectedRole.permissions.includes(perm.id);

                return (
                  <div
                    key={perm.id}
                    onClick={() => handleTogglePermission(perm.id)}
                    className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-50/80 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        isGranted
                          ? "bg-sky-600 border-sky-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}>
                        {isGranted && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{perm.name}</span>
                          {perm.isCritical && (
                            <span className="rounded bg-rose-50 px-1.5 py-0.2 text-[9px] font-bold text-rose-700 border border-rose-200">
                              HIGH MEDICAL RISK
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 m-0 mt-0.5">{perm.description}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {perm.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
