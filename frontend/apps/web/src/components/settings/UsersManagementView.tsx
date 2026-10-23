"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Key,
  FileText,
  Award,
  Download,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  Phone,
  Mail,
  Building2,
  Check,
  Copy,
  ExternalLink,
  FileCheck,
  BadgeCheck,
  RefreshCw,
  SlidersHorizontal,
  Grid,
  List,
  AlertTriangle,
  Stethoscope,
  FlaskConical,
  Laptop,
  Fingerprint,
  Calendar,
  X,
  CreditCard,
  Building,
  FileSignature,
  Activity,
  CheckSquare
} from "lucide-react";
import { userApi } from "@/lib/api";

export interface LabUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "BRANCH_ADMIN"
    | "PATHOLOGIST"
    | "DOCTOR"
    | "LAB_TECH"
    | "FRONT_DESK"
    | "ACCOUNTANT"
    | "AUDITOR"
    | "QUALITY_MANAGER";
  employeeCode: string;
  medicalRegistrationNo?: string;
  medicalCouncil?: string;
  degrees?: string;
  department: string;
  shift: string;
  assignedTerminal?: string;
  terminalIp?: string;
  isNablSignatory: boolean;
  signatureStatus: "VERIFIED" | "PENDING_UPLOAD" | "EXPIRED";
  signatureStampId?: string;
  signatureDate?: string;
  twoFactorEnabled: boolean;
  status: "ACTIVE" | "SUSPENDED" | "INVITED" | "ON_LEAVE";
  lastActive: string;
  lastLoginIp: string;
  joinedDate: string;
}

const INITIAL_USERS: LabUser[] = [
  {
    id: "usr-001",
    name: "Dr. Jaya Ashapurama",
    email: "jayaashapurama891@gmail.com",
    phone: "+91 98765 43210",
    role: "SUPER_ADMIN",
    employeeCode: "EMP-LC-001",
    medicalRegistrationNo: "MCI-2018-88492",
    medicalCouncil: "Delhi Medical Council / MCI",
    degrees: "MD (Pathology), DCP, FICP",
    department: "Directorate & Molecular Pathology",
    shift: "General (9 AM - 6 PM)",
    assignedTerminal: "Executive Station 1",
    terminalIp: "192.168.1.10",
    isNablSignatory: true,
    signatureStatus: "VERIFIED",
    signatureStampId: "NABL-STAMP-JA-88492",
    signatureDate: "2026-01-15",
    twoFactorEnabled: true,
    status: "ACTIVE",
    lastActive: "Active Now • Terminal A1",
    lastLoginIp: "192.168.1.10 (LAN)",
    joinedDate: "2023-04-10",
  },
  {
    id: "usr-002",
    name: "Dr. Vikramaditya Sharma",
    email: "dr.vikram@labcore.com",
    phone: "+91 98234 11223",
    role: "PATHOLOGIST",
    employeeCode: "EMP-LC-002",
    medicalRegistrationNo: "MCI-2015-44910",
    medicalCouncil: "Maharashtra Medical Council",
    degrees: "MD Pathology, FICP",
    department: "Histopathology & Cytology",
    shift: "Morning (8 AM - 4 PM)",
    assignedTerminal: "Sign-Off Terminal A-04",
    terminalIp: "192.168.1.14",
    isNablSignatory: true,
    signatureStatus: "VERIFIED",
    signatureStampId: "NABL-STAMP-VS-44910",
    signatureDate: "2026-02-01",
    twoFactorEnabled: true,
    status: "ACTIVE",
    lastActive: "15 mins ago • Sign-off Station",
    lastLoginIp: "192.168.1.14 (LAN)",
    joinedDate: "2023-06-15",
  },
  {
    id: "usr-003",
    name: "Dr. Ananya Deshmukh",
    email: "ananya.d@labcore.com",
    phone: "+91 97654 88776",
    role: "PATHOLOGIST",
    employeeCode: "EMP-LC-003",
    medicalRegistrationNo: "MMC-2020-77312",
    medicalCouncil: "Maharashtra Medical Council",
    degrees: "MD Microbiology, CICP",
    department: "Microbiology & PCR",
    shift: "General (9 AM - 6 PM)",
    assignedTerminal: "Microbiology Bench PC",
    terminalIp: "192.168.1.22",
    isNablSignatory: true,
    signatureStatus: "VERIFIED",
    signatureStampId: "NABL-STAMP-AD-77312",
    signatureDate: "2026-03-01",
    twoFactorEnabled: true,
    status: "ACTIVE",
    lastActive: "1 hour ago • Culture Lab",
    lastLoginIp: "192.168.1.22 (LAN)",
    joinedDate: "2024-01-10",
  },
  {
    id: "usr-004",
    name: "Rajesh K. Patel",
    email: "rajesh.tech@labcore.com",
    phone: "+91 98450 99881",
    role: "LAB_TECH",
    employeeCode: "EMP-LC-004",
    degrees: "B.Sc MLT, ASCP Certified",
    department: "Hematology & Coagulation",
    shift: "Morning (6 AM - 2 PM)",
    assignedTerminal: "Sysmex XN-1000 Station",
    terminalIp: "192.168.1.35",
    isNablSignatory: false,
    signatureStatus: "PENDING_UPLOAD",
    twoFactorEnabled: true,
    status: "ACTIVE",
    lastActive: "Active Now • Sysmex Station",
    lastLoginIp: "192.168.1.35 (LAN)",
    joinedDate: "2023-08-01",
  },
  {
    id: "usr-005",
    name: "Pooja Sundaram",
    email: "pooja.bio@labcore.com",
    phone: "+91 99123 44556",
    role: "LAB_TECH",
    employeeCode: "EMP-LC-005",
    degrees: "M.Sc Medical Biochemistry",
    department: "Biochemistry & Immunoassay",
    shift: "Evening (2 PM - 10 PM)",
    assignedTerminal: "Cobas e411 Terminal",
    terminalIp: "192.168.1.38",
    isNablSignatory: false,
    signatureStatus: "PENDING_UPLOAD",
    twoFactorEnabled: true,
    status: "ACTIVE",
    lastActive: "35 mins ago • Cobas Analyzer",
    lastLoginIp: "192.168.1.38 (LAN)",
    joinedDate: "2024-03-15",
  },
  {
    id: "usr-006",
    name: "Amit Verma",
    email: "amit.phleb@labcore.com",
    phone: "+91 98980 12345",
    role: "LAB_TECH",
    employeeCode: "EMP-LC-006",
    degrees: "DMLT, Phlebotomy Specialist",
    department: "Phlebotomy & Sample Accessioning",
    shift: "Morning (6 AM - 2 PM)",
    assignedTerminal: "Phlebotomy Chair 1",
    terminalIp: "192.168.1.42",
    isNablSignatory: false,
    signatureStatus: "PENDING_UPLOAD",
    twoFactorEnabled: false,
    status: "ACTIVE",
    lastActive: "10 mins ago • Phlebotomy Desk",
    lastLoginIp: "192.168.1.42 (LAN)",
    joinedDate: "2024-05-20",
  },
  {
    id: "usr-007",
    name: "Dr. Suresh K. Nair",
    email: "dr.suresh@consultant.labcore.com",
    phone: "+91 94470 55667",
    role: "DOCTOR",
    employeeCode: "EMP-LC-007",
    medicalRegistrationNo: "KMC-1998-33412",
    medicalCouncil: "Kerala Medical Council",
    degrees: "MBBS, MD (General Medicine)",
    department: "Clinical Referral & Consultation",
    shift: "Consultant On-Call",
    assignedTerminal: "Doctor Remote Portal",
    terminalIp: "117.204.88.19",
    isNablSignatory: false,
    signatureStatus: "PENDING_UPLOAD",
    twoFactorEnabled: true,
    status: "ACTIVE",
    lastActive: "Yesterday • Web Portal",
    lastLoginIp: "117.204.88.19 (VPN)",
    joinedDate: "2023-11-01",
  },
  {
    id: "usr-008",
    name: "Neha Gupta",
    email: "neha.billing@labcore.com",
    phone: "+91 97110 33445",
    role: "FRONT_DESK",
    employeeCode: "EMP-LC-008",
    degrees: "B.Com, Healthcare POS Certified",
    department: "Patient Reception & POS Billing",
    shift: "General (9 AM - 6 PM)",
    assignedTerminal: "Cash Register 1",
    terminalIp: "192.168.1.50",
    isNablSignatory: false,
    signatureStatus: "PENDING_UPLOAD",
    twoFactorEnabled: true,
    status: "ACTIVE",
    lastActive: "Active Now • Counter 1",
    lastLoginIp: "192.168.1.50 (LAN)",
    joinedDate: "2024-02-14",
  },
  {
    id: "usr-009",
    name: "Sanjay Singhania, CA",
    email: "sanjay.finance@labcore.com",
    phone: "+91 98111 22334",
    role: "ACCOUNTANT",
    employeeCode: "EMP-LC-009",
    degrees: "Chartered Accountant (ICAI)",
    department: "Finance, Billing Ledger & Settlements",
    shift: "General (9 AM - 6 PM)",
    assignedTerminal: "Finance Office PC 1",
    terminalIp: "192.168.1.60",
    isNablSignatory: false,
    signatureStatus: "PENDING_UPLOAD",
    twoFactorEnabled: true,
    status: "ACTIVE",
    lastActive: "2 hours ago • Ledger Desk",
    lastLoginIp: "192.168.1.60 (LAN)",
    joinedDate: "2023-09-01",
  },
  {
    id: "usr-010",
    name: "Pradeep Joshi",
    email: "pradeep.audit@labcore.com",
    phone: "+91 98200 44556",
    role: "AUDITOR",
    employeeCode: "EMP-LC-010",
    degrees: "Lead ISO 15189 / NABL Auditor",
    department: "Forensic Quality & Compliance Audit",
    shift: "Audit Review Schedule",
    assignedTerminal: "Compliance Workstation",
    terminalIp: "192.168.1.75",
    isNablSignatory: false,
    signatureStatus: "PENDING_UPLOAD",
    twoFactorEnabled: true,
    status: "ACTIVE",
    lastActive: "Today • Audit Trail Viewer",
    lastLoginIp: "192.168.1.75 (LAN)",
    joinedDate: "2023-10-15",
  },
];

const ROLE_INFO: Record<string, { label: string; badge: string; icon: any; color: string }> = {
  SUPER_ADMIN: {
    label: "Super Administrator",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
    icon: ShieldCheck,
    color: "from-sky-600 to-blue-700",
  },
  ADMIN: {
    label: "Lab Director / Admin",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
    icon: ShieldCheck,
    color: "from-indigo-600 to-blue-700",
  },
  BRANCH_ADMIN: {
    label: "Branch Manager",
    badge: "bg-slate-100 text-slate-800 border-slate-200",
    icon: Building2,
    color: "from-slate-600 to-slate-800",
  },
  PATHOLOGIST: {
    label: "Consultant Pathologist",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: Stethoscope,
    color: "from-emerald-600 to-teal-700",
  },
  DOCTOR: {
    label: "Referring Clinician",
    badge: "bg-teal-50 text-teal-800 border-teal-200",
    icon: Stethoscope,
    color: "from-teal-600 to-cyan-700",
  },
  LAB_TECH: {
    label: "Lab Technologist",
    badge: "bg-cyan-50 text-cyan-800 border-cyan-200",
    icon: FlaskConical,
    color: "from-cyan-600 to-blue-600",
  },
  FRONT_DESK: {
    label: "Reception & Billing",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Laptop,
    color: "from-amber-600 to-orange-600",
  },
  ACCOUNTANT: {
    label: "Finance & Accounts",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: CreditCard,
    color: "from-emerald-600 to-green-700",
  },
  AUDITOR: {
    label: "Forensic Auditor",
    badge: "bg-purple-50 text-purple-800 border-purple-200",
    icon: Award,
    color: "from-purple-600 to-indigo-700",
  },
  QUALITY_MANAGER: {
    label: "ISO Quality Manager",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    icon: Award,
    color: "from-rose-600 to-pink-700",
  },
};

const DEPARTMENTS = [
  "All Departments",
  "Directorate & Molecular Pathology",
  "Histopathology & Cytology",
  "Microbiology & PCR",
  "Hematology & Coagulation",
  "Biochemistry & Immunoassay",
  "Phlebotomy & Sample Accessioning",
  "Patient Reception & POS Billing",
  "Finance, Billing Ledger & Settlements",
  "Clinical Referral & Consultation",
  "Forensic Quality & Compliance Audit",
];

export default function UsersManagementView() {
  const [users, setUsers] = useState<LabUser[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("All Departments");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [signatoryFilterOnly, setSignatoryFilterOnly] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDossierUser, setSelectedDossierUser] = useState<LabUser | null>(null);
  const [signatureStampModalUser, setSignatureStampModalUser] = useState<LabUser | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: "success" | "error" | "info" } | null>(null);

  // Load from localStorage or API
  useEffect(() => {
    try {
      const stored = localStorage.getItem("labcore_hospital_users_directory");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUsers(parsed);
          return;
        }
      }
    } catch {
      // fallback
    }

    userApi.getAll()
      .then((res: any) => {
        if (res?.success && Array.isArray(res.data?.users) && res.data.users.length > 0) {
          // Keep rich fields while incorporating server data
          const serverUsers: LabUser[] = res.data.users.map((u: any, idx: number) => ({
            id: u.id || `usr-${idx + 10}`,
            name: u.fullName || u.name || "Lab Staff",
            email: u.email || `staff${idx}@labcore.com`,
            phone: u.phone || "+91 98000 00000",
            role: (u.role || "LAB_TECH").toUpperCase() as any,
            employeeCode: u.employeeCode || `EMP-LC-${100 + idx}`,
            medicalRegistrationNo: u.medicalRegistrationNo || (u.role === "PATHOLOGIST" ? "MCI-2022-991" : undefined),
            medicalCouncil: u.medicalCouncil || "State Medical Council",
            degrees: u.degrees || (u.role === "PATHOLOGIST" ? "MD Pathology" : "B.Sc MLT"),
            department: u.department || "Core Clinical Lab",
            shift: u.shift || "General (9 AM - 6 PM)",
            assignedTerminal: u.assignedTerminal || `Terminal-${idx + 1}`,
            terminalIp: u.terminalIp || "192.168.1.50",
            isNablSignatory: u.isNablSignatory ?? (u.role === "PATHOLOGIST" || u.role === "ADMIN" || u.role === "SUPER_ADMIN"),
            signatureStatus: u.signatureStatus || (u.isNablSignatory ? "VERIFIED" : "PENDING_UPLOAD"),
            signatureStampId: u.signatureStampId || "NABL-STAMP-GEN-01",
            twoFactorEnabled: u.twoFactorEnabled ?? true,
            status: (u.status || "ACTIVE").toUpperCase() as any,
            lastActive: "Active Now • Workstation",
            lastLoginIp: "192.168.1.10",
            joinedDate: "2024-01-01",
          }));
          setUsers(serverUsers);
        }
      })
      .catch(() => {
        // Fallback to rich mock
      });
  }, []);

  const saveUsersState = (updated: LabUser[]) => {
    setUsers(updated);
    try {
      localStorage.setItem("labcore_hospital_users_directory", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const showToast = (title: string, desc: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPI Calculations
  const totalCount = users.length;
  const signatoryCount = users.filter((u) => u.isNablSignatory).length;
  const pathologistCount = users.filter((u) => u.role === "PATHOLOGIST").length;
  const techCount = users.filter((u) => u.role === "LAB_TECH").length;
  const mfaCount = users.filter((u) => u.twoFactorEnabled).length;
  const mfaPercentage = Math.round((mfaCount / (totalCount || 1)) * 100);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchCode = u.employeeCode.toLowerCase().includes(q);
        const matchReg = (u.medicalRegistrationNo || "").toLowerCase().includes(q);
        const matchPhone = u.phone.includes(q);
        if (!matchName && !matchEmail && !matchCode && !matchReg && !matchPhone) return false;
      }
      if (selectedRole !== "ALL" && u.role !== selectedRole) return false;
      if (selectedDept !== "All Departments" && u.department !== selectedDept) return false;
      if (selectedStatus !== "ALL" && u.status !== selectedStatus) return false;
      if (signatoryFilterOnly && !u.isNablSignatory) return false;
      return true;
    });
  }, [users, searchQuery, selectedRole, selectedDept, selectedStatus, signatoryFilterOnly]);

  const handleToggleSignatory = (user: LabUser) => {
    const updated = users.map((u) =>
      u.id === user.id ? { ...u, isNablSignatory: !u.isNablSignatory } : u
    );
    saveUsersState(updated);
    showToast(
      user.isNablSignatory ? "Signatory Revoked" : "Authorized as NABL Signatory",
      `${user.name} diagnostic report signing authority has been ${user.isNablSignatory ? "revoked" : "granted"}.`,
      user.isNablSignatory ? "info" : "success"
    );
  };

  const handleToggleStatus = (user: LabUser) => {
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const updated = users.map((u) => (u.id === user.id ? { ...u, status: nextStatus as any } : u));
    saveUsersState(updated);
    showToast(
      nextStatus === "ACTIVE" ? "Staff Activated" : "Staff Access Suspended",
      `User ${user.name} account is now ${nextStatus.toLowerCase()}.`,
      nextStatus === "ACTIVE" ? "success" : "error"
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "Employee Code",
      "Full Name",
      "Role",
      "Department",
      "Medical Registration No",
      "Medical Council",
      "Qualifications",
      "Duty Shift",
      "Assigned Terminal",
      "Terminal IP",
      "NABL Signatory",
      "Signature Status",
      "2FA Enabled",
      "Account Status",
      "Email",
      "Phone",
    ];

    const rows = filteredUsers.map((u) => [
      u.employeeCode,
      `"${u.name}"`,
      u.role,
      `"${u.department}"`,
      u.medicalRegistrationNo || "N/A",
      `"${u.medicalCouncil || "N/A"}"`,
      `"${u.degrees || "N/A"}"`,
      `"${u.shift}"`,
      `"${u.assignedTerminal || "N/A"}"`,
      u.terminalIp || "N/A",
      u.isNablSignatory ? "AUTHORIZED" : "NO",
      u.signatureStatus,
      u.twoFactorEnabled ? "ENABLED" : "DISABLED",
      u.status,
      u.email,
      u.phone,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LabCore_Hospital_Staff_Roster_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Staff Roster Exported", `Downloaded ${filteredUsers.length} accredited personnel records.`, "success");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl text-slate-800 animate-in slide-in-from-bottom-3">
          {toastMessage.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
          {toastMessage.type === "error" && <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />}
          {toastMessage.type === "info" && <ShieldCheck className="h-5 w-5 text-sky-600 flex-shrink-0" />}
          <div>
            <h4 className="text-xs font-bold text-slate-900">{toastMessage.title}</h4>
            <p className="text-xs text-slate-600">{toastMessage.desc}</p>
          </div>
        </div>
      )}

      {/* =========================================================
          HOSPITAL CLINICAL COMMAND HEADER & METRICS
          ========================================================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            {/* Hospital Medical Cross Emblem */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 shadow-md shadow-sky-500/20 text-white flex-shrink-0">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">
                  Clinical Staff Governance & Medical Personnel Directory
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                  NABL ISO 15189:2022 & NABH Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Central Laboratory & Diagnostic Facility • Licensed Pathologist signatories, duty rosters, NMC credentialing & workstation terminal binding.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Export Roster (CSV)
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              Add Medical Staff / Doctor
            </button>
          </div>
        </div>

        {/* 5 Real-Time Clinical KPI Cards (Hospital White & Slate Theme) */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Total Staff */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Total Personnel</span>
              <Users className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalCount}</span>
              <span className="text-[11px] font-semibold text-emerald-700">100% Active</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">All Registered Credentials</div>
          </div>

          {/* NABL Signatories */}
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 hover:bg-emerald-50/60 transition-colors">
            <div className="flex items-center justify-between text-xs text-emerald-800">
              <span className="font-semibold">NABL Signatories</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-950">{signatoryCount}</span>
              <span className="text-[11px] font-bold text-emerald-700">Digital Stamp Live</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-700">Authorized for Reports</div>
          </div>

          {/* Pathologists */}
          <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-3.5 hover:bg-sky-50/60 transition-colors">
            <div className="flex items-center justify-between text-xs text-sky-800">
              <span className="font-semibold">Consultant Pathologists</span>
              <Stethoscope className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-sky-950">{pathologistCount}</span>
              <span className="text-[11px] font-bold text-sky-700">MD Verified</span>
            </div>
            <div className="mt-1 text-[11px] text-sky-700">MCI Registered Signatories</div>
          </div>

          {/* Lab Technologists */}
          <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-3.5 hover:bg-indigo-50/60 transition-colors">
            <div className="flex items-center justify-between text-xs text-indigo-800">
              <span className="font-semibold">Medical Technologists</span>
              <FlaskConical className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-950">{techCount}</span>
              <span className="text-[11px] font-bold text-indigo-700">Bench Operations</span>
            </div>
            <div className="mt-1 text-[11px] text-indigo-700">Automated Analyzers Ops</div>
          </div>

          {/* 2FA & Workstation Security */}
          <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-3.5 hover:bg-teal-50/60 transition-colors">
            <div className="flex items-center justify-between text-xs text-teal-800">
              <span className="font-semibold">Security & 2FA</span>
              <Fingerprint className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-teal-950">{mfaPercentage}%</span>
              <span className="text-[11px] font-bold text-teal-700">{mfaCount}/{totalCount} Active</span>
            </div>
            <div className="mt-1 text-[11px] text-teal-700">Hardware & Terminal Bound</div>
          </div>
        </div>
      </div>

      {/* =========================================================
          SEARCH & CLINICAL FILTER TOOLBAR
          ========================================================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by staff name, employee code, MCI/NMC registration no, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 focus:outline-none transition-all"
            />
          </div>

          {/* Department Dropdown */}
          <div className="w-full md:w-64">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition-all"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Signatories Only Toggle */}
          <button
            type="button"
            onClick={() => setSignatoryFilterOnly(!signatoryFilterOnly)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              signatoryFilterOnly
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm"
                : "border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Award className={`h-3.5 w-3.5 ${signatoryFilterOnly ? "text-emerald-600" : "text-slate-400"}`} />
            <span>NABL Signatories Only</span>
          </button>
        </div>

        {/* Role Pills Filter (Covering All 9 Enterprise Roles) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0">
            Roles:
          </span>

          <button
            type="button"
            onClick={() => setSelectedRole("ALL")}
            className={`rounded-lg px-3 py-1 font-bold text-xs transition-all cursor-pointer flex-shrink-0 ${
              selectedRole === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            All Staff ({users.length})
          </button>

          {Object.entries(ROLE_INFO).map(([key, info]) => {
            const count = users.filter((u) => u.role === key).length;
            if (count === 0 && key !== "PATHOLOGIST" && key !== "LAB_TECH" && key !== "ADMIN") return null;
            const isSelected = selectedRole === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedRole(key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{info.label}</span>
                <span className={`text-[10px] px-1 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          HOSPITAL CLINICAL STAFF DATA TABLE (LIGHT THEME)
          ========================================================= */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Staff Member & Identity</th>
                <th className="py-3.5 px-4">Role & Department</th>
                <th className="py-3.5 px-4">Medical Credentials</th>
                <th className="py-3.5 px-4">NABL Signatory</th>
                <th className="py-3.5 px-4">Duty Shift & Workstation</th>
                <th className="py-3.5 px-4">Security (2FA)</th>
                <th className="py-3.5 px-4 text-right">Clinical Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 m-0">No medical personnel matched your query</p>
                    <p className="text-xs text-slate-400 m-0 mt-0.5">Try searching with a different name, department or role</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleMeta = ROLE_INFO[user.role] || ROLE_INFO.LAB_TECH;
                  const isDoctorOrPath = user.role === "PATHOLOGIST" || user.role === "DOCTOR" || user.role === "SUPER_ADMIN" || user.role === "ADMIN";

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${roleMeta.color} text-white font-bold text-sm shadow-sm flex-shrink-0`}>
                            {user.name.split(" ").slice(0, 2).map((n) => n[0]).join("") || "MD"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-slate-900 m-0">{user.name}</h4>
                              {user.status === "ACTIVE" && (
                                <span className="h-2 w-2 rounded-full bg-emerald-500" title="Active Account" />
                              )}
                              {user.status === "SUSPENDED" && (
                                <span className="h-2 w-2 rounded-full bg-rose-500" title="Suspended Account" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              <span className="font-mono font-semibold text-slate-700">{user.employeeCode}</span>
                              <span>•</span>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Wing */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold border ${roleMeta.badge}`}>
                          <roleMeta.icon className="h-3 w-3" />
                          {roleMeta.label}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">{user.department}</div>
                      </td>

                      {/* Medical Credentials */}
                      <td className="py-3.5 px-4">
                        {user.medicalRegistrationNo ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                                {user.medicalRegistrationNo}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(user.medicalRegistrationNo || "");
                                  showToast("Copied", `Medical registration ${user.medicalRegistrationNo} copied.`, "info");
                                }}
                                className="text-slate-400 hover:text-slate-700"
                                title="Copy MCI Reg No"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-600 font-semibold mt-1">
                              {user.degrees || "Licensed Practitioner"}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-medium text-slate-700">{user.degrees || "Technical Qualification"}</span>
                            <div className="text-[10px] text-slate-400">Staff Personnel</div>
                          </div>
                        )}
                      </td>

                      {/* NABL Signatory */}
                      <td className="py-3.5 px-4">
                        {user.isNablSignatory ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Authorized
                            </span>
                            <button
                              type="button"
                              onClick={() => setSignatureStampModalUser(user)}
                              className="text-xs text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer"
                            >
                              Seal Preview
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleSignatory(user)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            Assign Signatory
                          </button>
                        )}
                      </td>

                      {/* Shift & Workstation */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {user.shift}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Laptop className="h-3 w-3 text-slate-400" />
                          <span>{user.assignedTerminal || "Terminal A-01"} ({user.terminalIp || "LAN"})</span>
                        </div>
                      </td>

                      {/* Security / 2FA */}
                      <td className="py-3.5 px-4">
                        {user.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                            <Check className="h-3 w-3 text-emerald-600" />
                            2FA Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            2FA Pending
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">{user.lastActive}</div>
                      </td>

                      {/* Governance Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Dossier button */}
                          <button
                            type="button"
                            onClick={() => setSelectedDossierUser(user)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
                            title="View Staff Medical Dossier"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            Dossier
                          </button>

                          {/* Status toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className={`rounded-lg p-1.5 border transition-all cursor-pointer ${
                              user.status === "ACTIVE"
                                ? "border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title={user.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
                          >
                            {user.status === "ACTIVE" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          MODAL 1: FULL CLINICAL STAFF DOSSIER (LIGHT THEME)
          ========================================================= */}
      {selectedDossierUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-base shadow-sm">
                  {selectedDossierUser.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 m-0">{selectedDossierUser.name}</h3>
                  <p className="text-xs text-slate-500 m-0">
                    {selectedDossierUser.degrees || "Clinical Staff"} • {selectedDossierUser.department}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDossierUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dossier Clinical Sections */}
            <div className="space-y-4 text-xs">
              {/* Credentials Grid */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h4 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide">
                  Medical & Regulatory Credentials
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Employee Code</span>
                    <span className="font-mono font-bold text-slate-900">{selectedDossierUser.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Assigned Role</span>
                    <span className="font-bold text-sky-800">{selectedDossierUser.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Medical Council Reg No.</span>
                    <span className="font-mono font-bold text-slate-900">{selectedDossierUser.medicalRegistrationNo || "N/A (Non-Signatory)"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">State / Central Council</span>
                    <span className="font-medium">{selectedDossierUser.medicalCouncil || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Workstation & Terminal Security */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <h4 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide">
                  Shift Roster & Workstation Binding
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Active Shift</span>
                    <span className="font-bold">{selectedDossierUser.shift}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Assigned Terminal</span>
                    <span className="font-medium">{selectedDossierUser.assignedTerminal || "Terminal A-01"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Bound Workstation IP</span>
                    <span className="font-mono font-semibold">{selectedDossierUser.terminalIp || "192.168.1.10"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Multi-Factor Auth</span>
                    <span className="font-bold text-emerald-700">Hardware / TOTP Active</span>
                  </div>
                </div>
              </div>

              {/* Report Signatory Status */}
              {selectedDossierUser.isNablSignatory && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold">
                    <Award className="h-4 w-4 text-emerald-600" />
                    Authorized NABL Diagnostic Signatory Seal
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    This clinician is officially registered to sign diagnostic test reports under ISO 15189 accreditation.
                    Stamp ID: <span className="font-mono font-bold text-slate-800">{selectedDossierUser.signatureStampId}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDossierUser(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: NABL DIGITAL SIGNATURE STAMP PREVIEW
          ========================================================= */}
      {signatureStampModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 m-0">NABL Report Stamp Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setSignatureStampModalUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Diagnostic Stamp Box */}
            <div className="rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/20 p-5 text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                ISO 15189 VERIFIED
              </div>

              <div className="my-3 py-2 border-b border-slate-200">
                <div className="h-14 flex items-center justify-center">
                  <span className="font-serif italic text-2xl font-bold text-blue-900 tracking-wider rotate-[-2deg]">
                    {signatureStampModalUser.name.replace("Dr. ", "")}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  [DSC PKI Hardware Token Signed]
                </div>
              </div>

              <div className="text-left space-y-1 text-xs">
                <div className="font-bold text-slate-900">{signatureStampModalUser.name}</div>
                <div className="text-slate-600 font-medium">{signatureStampModalUser.degrees}</div>
                <div className="text-slate-700 font-semibold">{signatureStampModalUser.department}</div>
                <div className="text-slate-600 text-[11px]">
                  Council Reg: <span className="font-mono font-bold">{signatureStampModalUser.medicalRegistrationNo}</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  Stamp ID: {signatureStampModalUser.signatureStampId}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSignatureStampModalUser(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: ADD MEDICAL STAFF / DOCTOR (LIGHT THEME)
          ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900 m-0">Register Medical Staff / Clinician</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const newStaff: LabUser = {
                  id: `usr-${Date.now().toString().slice(-4)}`,
                  name: (form.elements.namedItem("name") as HTMLInputElement).value,
                  email: (form.elements.namedItem("email") as HTMLInputElement).value,
                  phone: (form.elements.namedItem("phone") as HTMLInputElement).value || "+91 98000 00000",
                  role: (form.elements.namedItem("role") as HTMLSelectElement).value as any,
                  employeeCode: (form.elements.namedItem("employeeCode") as HTMLInputElement).value,
                  medicalRegistrationNo: (form.elements.namedItem("medicalRegistrationNo") as HTMLInputElement).value || undefined,
                  degrees: (form.elements.namedItem("degrees") as HTMLInputElement).value || "Staff Practitioner",
                  department: (form.elements.namedItem("department") as HTMLSelectElement).value,
                  shift: (form.elements.namedItem("shift") as HTMLSelectElement).value,
                  assignedTerminal: "Terminal A-01",
                  terminalIp: "192.168.1.50",
                  isNablSignatory: (form.elements.namedItem("isNablSignatory") as HTMLInputElement).checked,
                  signatureStatus: "VERIFIED",
                  signatureStampId: `NABL-STAMP-${Date.now().toString().slice(-5)}`,
                  twoFactorEnabled: true,
                  status: "ACTIVE",
                  lastActive: "Just Registered",
                  lastLoginIp: "127.0.0.1",
                  joinedDate: new Date().toISOString().split("T")[0],
                };

                saveUsersState([newStaff, ...users]);
                setIsAddModalOpen(false);
                showToast("Medical Staff Registered", `${newStaff.name} has been enrolled in the laboratory roster.`, "success");
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Clinical Name *</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Dr. Rajeshwari Sengupta, MD"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Employee Code *</label>
                  <input
                    name="employeeCode"
                    required
                    placeholder="e.g. EMP-LC-011"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Hospital Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="staff@labcore.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Contact</label>
                  <input
                    name="phone"
                    placeholder="+91 98000 00000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Assigned Clinical Role *</label>
                  <select
                    name="role"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 font-bold focus:border-sky-500 focus:outline-none"
                  >
                    <option value="PATHOLOGIST">Consultant Pathologist (Signatory)</option>
                    <option value="LAB_TECH">Medical Lab Technologist</option>
                    <option value="DOCTOR">Referring Clinician</option>
                    <option value="ADMIN">Laboratory Administrator</option>
                    <option value="BRANCH_ADMIN">Branch Lab Manager</option>
                    <option value="FRONT_DESK">Patient Reception & Billing</option>
                    <option value="ACCOUNTANT">Finance & Settlements</option>
                    <option value="AUDITOR">Forensic Auditor</option>
                    <option value="QUALITY_MANAGER">ISO 15189 Quality Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Department / Lab Wing *</label>
                  <select
                    name="department"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Histopathology & Cytology">Histopathology & Cytology</option>
                    <option value="Biochemistry & Immunoassay">Biochemistry & Immunoassay</option>
                    <option value="Hematology & Coagulation">Hematology & Coagulation</option>
                    <option value="Microbiology & PCR">Microbiology & PCR</option>
                    <option value="Directorate & Molecular Pathology">Directorate & Molecular Pathology</option>
                    <option value="Phlebotomy & Sample Accessioning">Phlebotomy & Sample Accessioning</option>
                    <option value="Patient Reception & POS Billing">Patient Reception & POS Billing</option>
                    <option value="Finance, Billing Ledger & Settlements">Finance & Settlements</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">MCI / NMC Registration No.</label>
                  <input
                    name="medicalRegistrationNo"
                    placeholder="e.g. MCI-2022-1982"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Degrees & Fellowships</label>
                  <input
                    name="degrees"
                    placeholder="e.g. MD (Pathology), DNB"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Duty Shift *</label>
                  <select
                    name="shift"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Morning (8 AM - 4 PM)">Morning (8 AM - 4 PM)</option>
                    <option value="General (9 AM - 6 PM)">General (9 AM - 6 PM)</option>
                    <option value="Morning (6 AM - 2 PM)">Early Morning (6 AM - 2 PM)</option>
                    <option value="Evening (2 PM - 10 PM)">Evening (2 PM - 10 PM)</option>
                    <option value="Night Emergency (10 PM - 6 AM)">Night Emergency (10 PM - 6 AM)</option>
                    <option value="Consultant On-Call">Consultant On-Call</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isNablSignatory"
                    name="isNablSignatory"
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="isNablSignatory" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Authorize as NABL Report Signatory
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 shadow-sm"
                >
                  Enroll Medical Personnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
