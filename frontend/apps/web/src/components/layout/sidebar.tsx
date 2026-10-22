"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getRoleLabel, getUserRole } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  TestTube,
  FileText,
  DollarSign,
  CheckCircle,
  FileCheck,
  FileText as ReportIcon,
  Cpu,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Award,
  Lock,
  Search,
  Activity,
  Zap,
  Radio,
  MessageSquare,
  Brain,
  X,
  Server,
  UserCircle2,
  CalendarDays,
  BarChart3,
  UsersRound,
  TrendingUp,
  Star,
  FlaskRound,
  ScrollText,
  Upload,
  GitMerge,
  Siren,
  Waypoints,
  HeartPulse,
} from "lucide-react";
import { approvalApi, invoiceApi, patientApi } from "@/lib/api";
import LabCoreLogo from "@/components/common/LabCoreLogo";
import LogoutModal from "@/components/auth/LogoutModal";
import {
  SETTINGS_VIEW_ROLES,
  SETTINGS_ADMIN_ROLES,
  SETTINGS_EDIT_ROLES,
} from "@/components/settings/settingsAccess";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface SubMenuItem {
  label: string;
  href: string;
  badge?: string;
  badgeVariant?: "red" | "blue" | "amber" | "emerald" | "purple" | "violet";
  isDivider?: boolean;       // Visual group separator
  dividerLabel?: string;     // Label for divider
  liveKey?: "criticalPatients" | "opdQueue"; // Live count key
  /** When present, the child is only rendered for these roles. */
  allowedRoles?: string[];
  children?: {
    label: string;
    href: string;
  }[];
}

interface MenuItem {
  label: string;
  name?: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: {
    bg: string;
    text: string;
    activeBorder: string;
    activeIconBg: string;
    activeText: string;
  };
  badgeKey?: "approvals" | "invoices";
  /** When present, the item is only rendered for these roles. */
  allowedRoles?: string[];
  children?: SubMenuItem[];
}

interface MenuSection {
  id: string;
  title: string;
  badge?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    id: "operations",
    title: "Operations & Patients",
    badge: "Core",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        accent: {
          bg: "bg-teal-50 text-[#0F766E] group-hover:bg-teal-100/70 group-hover:text-[#0F766E]",
          text: "text-[#0F766E]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
      },
      {
        label: "Omniscient Nexus",
        href: "/nexus",
        icon: Sparkles,
        accent: {
          bg: "bg-teal-50 text-[#0F766E] group-hover:bg-teal-100/70 group-hover:text-[#0F766E]",
          text: "text-[#0F766E]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "Nexus Command Center", href: "/nexus", badge: "Live", badgeVariant: "emerald" },
          { label: "2D/3D Floor Twin", href: "/nexus?tab=world-model", badge: "Twin", badgeVariant: "blue" },
          { label: "Queueing & Little's Law", href: "/nexus?tab=queues" },
          { label: "Quality (Levey-Jennings)", href: "/nexus?tab=quality", badge: "Westgard", badgeVariant: "amber" },
          { label: "Reagent Stockout Advisory", href: "/nexus?tab=inventory" },
          { label: "Controlled Autonomy", href: "/nexus?tab=autonomy", badge: "Gate", badgeVariant: "purple" },
          { label: "Mathematical Workbench", href: "/nexus?tab=math" },
        ],
      },
      {
        label: "Patient Hub",
        href: "/patients",
        icon: UserCircle2,
        accent: {
          bg: "bg-sky-50 text-[#0284C7] group-hover:bg-sky-100/70 group-hover:text-[#0284C7]",
          text: "text-[#0284C7]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          // ── CORE ──────────────────────────────────────────
          {
            label: "Patient Directory",
            href: "/patients",
            badge: "MPI",
            badgeVariant: "blue",
          },
          {
            label: "Register Patient",
            href: "/patients/new",
            badge: "Quick",
            badgeVariant: "emerald",
          },
          {
            label: "Active Patients",
            href: "/patients?chip=ACTIVE",
            badge: "Active",
            badgeVariant: "emerald",
          },
          // ── OPD & QUEUE ───────────────────────────────────
          {
            label: "─── OPD & Queue",
            href: "/patients?chip=TODAY",
            isDivider: true,
            dividerLabel: "OPD & QUEUE",
          },
          {
            label: "OPD Queue (Live)",
            href: "/patients/opd-queue",
            badge: "Live",
            badgeVariant: "emerald",
            liveKey: "opdQueue",
          },
          {
            label: "Today's Registrations",
            href: "/patients?chip=TODAY",
            badge: "Today",
            badgeVariant: "blue",
          },
          {
            label: "Critical Watch List",
            href: "/patients?chip=CRITICAL",
            badge: "Urgent",
            badgeVariant: "red",
            liveKey: "criticalPatients",
          },
          {
            label: "Pending Orders Roster",
            href: "/patients?chip=PENDING",
            badge: "Pending",
            badgeVariant: "amber",
          },
          // ── SPECIAL CATEGORIES ───────────────────────────
          {
            label: "─── Categories",
            href: "/patients?chip=SENIOR",
            isDivider: true,
            dividerLabel: "SPECIAL CATEGORIES",
          },
          {
            label: "Geriatric Registry (60+)",
            href: "/patients?chip=SENIOR",
            badge: "Senior",
            badgeVariant: "amber",
          },
          // ── COMPLIANCE ───────────────────────────────────
          {
            label: "─── Compliance",
            href: "/abdm",
            isDivider: true,
            dividerLabel: "COMPLIANCE & ABHA",
          },
          {
            label: "ABDM / ABHA Console",
            href: "/abdm",
            badge: "ABHA",
            badgeVariant: "purple",
          },
        ],
      },
      {
        label: "Doctors",
        href: "/doctors",
        icon: Stethoscope,
        accent: {
          bg: "bg-teal-50 text-[#0F766E] group-hover:bg-teal-100/70 group-hover:text-[#0F766E]",
          text: "text-[#0F766E]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "All Doctors", href: "/doctors" },
          { label: "Add Doctor", href: "/doctors/new" },
        ],
      },
      {
        label: "ABDM / ABHA",
        href: "/abdm",
        icon: ShieldCheck,
        accent: {
          bg: "bg-[#ECFDF5] text-[#059669] group-hover:bg-emerald-100/70 group-hover:text-[#059669]",
          text: "text-[#059669]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "Overview & Milestones", href: "/abdm" },
          { label: "Create New ABHA", href: "/abdm?action=create" },
          { label: "Scan & Share Desk", href: "/abdm#scan-share" },
          { label: "ABHA Lookup & Verify", href: "/abdm#verify" },
          { label: "FHIR R4 Inspector", href: "/abdm#fhir" },
          { label: "Gateway Webhook Simulator", href: "/abdm#simulator" },
        ],
      },
    ],
  },
  {
    id: "pipeline",
    title: "Diagnostic Pipeline",
    badge: "LIS",
    items: [
      {
        label: "Tests",
        href: "/tests",
        icon: FlaskConical,
        accent: {
          bg: "bg-sky-50 text-[#0284C7] group-hover:bg-sky-100/70 group-hover:text-[#0284C7]",
          text: "text-[#0284C7]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "All Tests", href: "/tests" },
          { label: "Add Test", href: "/tests/new" },
          { label: "Categories", href: "/tests/categories" },
          { label: "Test Parameters", href: "/tests/parameters" },
          { label: "Reference Ranges", href: "/tests/reference-ranges" },
        ],
      },
      {
        label: "Orders",
        href: "/orders",
        icon: ClipboardList,
        accent: {
          bg: "bg-sky-50 text-[#0284C7] group-hover:bg-sky-100/70 group-hover:text-[#0284C7]",
          text: "text-[#0284C7]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "All Orders", href: "/orders" },
          { label: "New Order", href: "/orders/new" },
        ],
      },
      {
        label: "Samples",
        href: "/samples",
        icon: TestTube,
        accent: {
          bg: "bg-[#FFFBEB] text-[#D97706] group-hover:bg-amber-100/70 group-hover:text-[#D97706]",
          text: "text-[#D97706]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
      },
      {
        label: "Analyzers",
        href: "/analyzers",
        icon: Cpu,
        accent: {
          bg: "bg-teal-50 text-[#0F766E] group-hover:bg-teal-100/70 group-hover:text-[#0F766E]",
          text: "text-[#0F766E]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "Fleet Dashboard", href: "/analyzers" },
          { label: "📑 DOCUMINICATION (PDF SOP)", href: "/analyzers?tab=interactive_docs", badge: "PDF SOP", badgeVariant: "emerald" },
          { label: "🚨 STAT Emergency Lane", href: "/analyzers?tab=stat_lane", badge: "15m TAT", badgeVariant: "red" },
          { label: "Reagents & Consumables", href: "/analyzers?tab=reagents" },
          { label: "Shift QC & Westgard Gate", href: "/analyzers?tab=shift_qc" },
          { label: "Bidirectional Worklists", href: "/analyzers?tab=bidirectional" },
          { label: "Live Result Stream", href: "/analyzers?tab=live_feed", badge: "Live", badgeVariant: "emerald" },
          { label: "Auto-Approval QC Matrix", href: "/analyzers?tab=qc_validation" },
          { label: "Virtual Protocol Simulator", href: "/analyzers?tab=simulator" },
          { label: "🧪 Hematology Suite", href: "/analyzers?tab=hematology" },
          { label: "Diagnostics & Error Logs", href: "/analyzers?tab=diagnostics" },
          { label: "🚀 Lab Digital Twin (DES)", href: "/digital-twin", badge: "Sim", badgeVariant: "emerald" },
        ],
      },
      {
        name: "Lab Digital Twin",
        label: "Lab Digital Twin",
        href: "/digital-twin",
        icon: Cpu,
        accent: {
          bg: "bg-teal-50 text-[#0F766E] group-hover:bg-teal-100/70 group-hover:text-[#0F766E]",
          text: "text-[#0F766E]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
      },
      {
        label: "Integration Engine",
        href: "/integrations",
        icon: Server,
        accent: {
          bg: "bg-sky-50 text-[#0284C7] group-hover:bg-sky-100/70 group-hover:text-[#0284C7]",
          text: "text-[#0284C7]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "Channel Matrix", href: "/integrations" },
          { label: "Live Message Stream", href: "/integrations", badge: "Live", badgeVariant: "emerald" },
          { label: "Protocol Simulator", href: "/integrations", badge: "Sandbox", badgeVariant: "blue" },
          { label: "Dead Letter Queue (DLQ)", href: "/integrations", badge: "Auto-Heal", badgeVariant: "red" },
          { label: "LOINC Code Crosswalk", href: "/integrations" },
          { label: "Cold-Chain IoT Telemetry", href: "/integrations" },
          { label: "Compliance & Security Audit", href: "/integrations" },
        ],
      },
    ],
  },
  {
    id: "validation",
    title: "Clinical Validation",
    badge: "Quality",
    items: [
      {
        label: "Results",
        href: "/results",
        icon: CheckCircle,
        accent: {
          bg: "bg-[#ECFDF5] text-[#059669] group-hover:bg-emerald-100/70 group-hover:text-[#059669]",
          text: "text-[#059669]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
      },
      {
        label: "Approvals",
        href: "/approvals",
        icon: FileCheck,
        badgeKey: "approvals",
        accent: {
          bg: "bg-[#FEF2F2] text-[#DC2626] group-hover:bg-red-100/70 group-hover:text-[#DC2626]",
          text: "text-[#DC2626]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "Approval Queue (Ready)", href: "/approvals" },
          { label: "Registered & Lab Pipeline", href: "/approvals?filter=pipeline" },
          { label: "Doctor Workstation", href: "/approvals?mode=workstation" },
          { label: "Critical & Panic Alerts", href: "/approvals?filter=critical" },
          { label: "Clean Fast-Track", href: "/approvals?filter=normal" },
          { label: "Returned & Reruns", href: "/approvals?status=ENTERED" },
          { label: "Signed Archive", href: "/approvals?status=APPROVED" },
          { label: "Rules & Policies", href: "/approvals?view=rules" },
        ],
      },
      {
        label: "Reports",
        href: "/reports",
        icon: ReportIcon,
        accent: {
          bg: "bg-sky-50 text-[#0284C7] group-hover:bg-sky-100/70 group-hover:text-[#0284C7]",
          text: "text-[#0284C7]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
      },
    ],
  },
  {
    id: "ai-research",
    title: "CLINICAL AI & CDSS",
    badge: "HOSPITAL",
    items: [
      {
        label: "Clinical AI Diagnostics",
        href: "/ai-studio",
        icon: Brain,
        accent: {
          bg: "bg-teal-50 text-[#0F766E] group-hover:bg-teal-100/70 group-hover:text-[#0F766E]",
          text: "text-[#0F766E]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "Clinical AI Hub", href: "/ai-studio" },
          { label: "Diagnostic Risk ML", href: "/ai-studio?tab=classical-ml" },
          { label: "Biomarker Neural Nets", href: "/ai-studio?tab=deep-learning" },
          { label: "Clinical NLP & EMR", href: "/ai-studio?tab=nlp" },
          { label: "Critical Delta-Checks", href: "/ai-studio?tab=anomalies" },
          { label: "Hospital TAT Forecaster", href: "/ai-studio?tab=forecasting" },
          { label: "Clinical Validation", href: "/ai-studio?tab=evaluation" },
          { label: "Hospital Model Registry", href: "/ai-studio?tab=registry" },
          { label: "Regulatory AI Audit", href: "/ai-studio?tab=audit" },
        ],
      },
    ],
  },
  {
    id: "finance",
    title: "REVENUE & BILLING (RCM)",
    badge: "HOSPITAL",
    items: [
      {
        label: "Invoices",
        href: "/invoices",
        icon: FileText,
        badgeKey: "invoices",
        accent: {
          bg: "bg-sky-50 text-[#0284C7] group-hover:bg-sky-100/70 group-hover:text-[#0284C7]",
          text: "text-[#0284C7]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "All Invoices (Register)", href: "/invoices" },
          { label: "Quick POS Billing Counter", href: "/invoices/new" },
          { label: "TPA & Cashless Claims", href: "/invoices?tab=tpa" },
          { label: "Sales Day Book Shift Close", href: "/invoices?tab=daybook" },
          { label: "Overdue Debt & AR Aging", href: "/invoices?tab=aging" },
          { label: "Corporate & Doctor Referrals", href: "/invoices?tab=b2b" },
          { label: "GST & Tax Audit (GSTR-1)", href: "/invoices?tab=gst" },
        ],
      },
      {
        label: "Payments",
        href: "/payments",
        icon: DollarSign,
        accent: {
          bg: "bg-[#ECFDF5] text-[#059669] group-hover:bg-emerald-100/70 group-hover:text-[#059669]",
          text: "text-[#059669]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "Cashier Command Desk", href: "/payments" },
          { label: "Transactions & Tender Ledger", href: "/payments?tab=transactions" },
          { label: "Shift Till & Cash Drawer", href: "/payments?tab=cash-counter" },
          { label: "Advances & Patient Wallet", href: "/payments?tab=advances" },
          { label: "Dual-Custody Refunds", href: "/payments?tab=refunds" },
          { label: "POS & Gateway Settlements", href: "/payments?tab=settlements" },
          { label: "Bank Reconciliation", href: "/payments?tab=reconciliation" },
          { label: "Cashier EOD Reports", href: "/payments?tab=reports" },
          { label: "Tender Audit Trail", href: "/payments?tab=audit-log" },
        ],
      },
      {
        label: "Clinical Communication",
        href: "/communication",
        icon: MessageSquare,
        accent: {
          bg: "bg-teal-50 text-[#0F766E] group-hover:bg-teal-100/70 group-hover:text-[#0F766E]",
          text: "text-[#0F766E]",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "📡 Omnichannel Command Hub", href: "/communication", badge: "KPIs", badgeVariant: "emerald" },
          { label: "🩺 Doctor Consultation Desk", href: "/communication?tab=consultation", badge: "STAT", badgeVariant: "purple" },
          { label: "🚨 Critical / Panic Escalations", href: "/communication?tab=panic", badge: "NABL", badgeVariant: "red" },
          { label: "📥 2-Way Patient Inbox", href: "/communication?tab=inbox", badge: "Live", badgeVariant: "blue" },
          { label: "📢 Hospital Emergency Paging", href: "/communication?tab=broadcast", badge: "Code Blue", badgeVariant: "red" },
          { label: "🤝 Shift Handover Huddle", href: "/communication?tab=handover", badge: "Custody", badgeVariant: "amber" },
          { label: "📄 Report & Sample Dispatch", href: "/communication?tab=dispatch", badge: "SHA-256", badgeVariant: "emerald" },
          { label: "🎯 Health Packages & Campaigns", href: "/communication?tab=campaign", badge: "Re-call", badgeVariant: "purple" },
          { label: "⚙️ Gateway & DLT Compliance", href: "/settings/communications", badge: "TRAI DLT", badgeVariant: "amber" },
        ],
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        // Mirrors `settings:view` in backend/api/middleware/rbac.middleware.ts.
        allowedRoles: SETTINGS_VIEW_ROLES,
        accent: {
          bg: "bg-slate-100 text-slate-700 group-hover:bg-slate-200/70 group-hover:text-[#0F172A]",
          text: "text-slate-700",
          activeBorder: "border-[#0F766E]",
          activeIconBg: "bg-[#0F766E] text-white shadow-xs",
          activeText: "text-[#0F766E] font-bold",
        },
        children: [
          { label: "General Settings", href: "/settings" },
          {
            label: "Users & Roles",
            href: "/settings?tab=users",
            // User/role management is admin-tier on the backend.
            allowedRoles: SETTINGS_ADMIN_ROLES,
          },
          {
            label: "Communication Providers",
            href: "/settings/communications",
            allowedRoles: SETTINGS_EDIT_ROLES,
          },
        ],
      },
    ],
  },
];

export default function Sidebar({
  isOpen = true,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [userInitials, setUserInitials] = useState('JA');
  const [userName, setUserName] = useState('Jaya Ashapurama');
  const [userRole, setUserRole] = useState('ADMIN');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    try {
      const raw = localStorage.getItem("labcore_settings_profile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.firstName || parsed.lastName) {
          const fn = `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim();
          if (fn) {
            setUserName(fn);
            const names = fn.split(" ");
            setUserInitials(names.length > 1 ? names[0][0] + names[names.length - 1][0] : names[0][0]);
          }
        }
        if (parsed.profileImage) {
          setUserAvatar(parsed.profileImage);
        }
      }
    } catch (e) {
      // ignore
    }

    if (user?.fullName) {
      const names = user.fullName.split(' ');
      setUserInitials(names.length > 1
        ? names[0][0] + names[names.length - 1][0]
        : names[0][0]);
      setUserName(user.fullName);
    } else if (user?.email) {
      setUserInitials(user.email[0].toUpperCase());
      setUserName(user.email);
    }
    if (user?.avatar) {
      setUserAvatar(user.avatar as string);
    }
    setUserRole(getRoleLabel(user?.role, "ADMIN"));

    const handleProfileUpdated = (e: any) => {
      const updated = e.detail;
      if (updated?.fullName) {
        setUserName(updated.fullName);
        const names = updated.fullName.split(" ");
        setUserInitials(names.length > 1 ? names[0][0] + names[names.length - 1][0] : names[0][0]);
      }
      if (updated?.avatar || updated?.profileImage) {
        setUserAvatar(updated.avatar || updated.profileImage);
      }
    };

    window.addEventListener("labcore:profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("labcore:profile-updated", handleProfileUpdated);
  }, [user]);

  const [approvalMetrics, setApprovalMetrics] = useState({ pending: 0, critical: 0 });

  // ── Live Patient Hub Metrics ─────────────────────────────────────────────
  const [patientHubMetrics, setPatientHubMetrics] = useState({
    criticalCount: 0,
    todayCount: 0,
    vipCount: 0,
  });

  useEffect(() => {
    let isSubscribed = true;
    const fetchPatientMetrics = async () => {
      try {
        const res = await patientApi.getAll("page=1&limit=1&activeChip=CRITICAL");
        if (isSubscribed && res?.success && res?.data?.kpis) {
          setPatientHubMetrics({
            criticalCount: res.data.kpis.criticalCount ?? 0,
            todayCount: res.data.kpis.todayCount ?? 0,
            vipCount: res.data.kpis.vipCount ?? 0,
          });
        }
      } catch {
        // quiet fallback — sidebar should never crash
      }
    };
    fetchPatientMetrics();
    const timer = setInterval(fetchPatientMetrics, 90000);
    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const fetchApprovalCounts = async () => {
      try {
        const res = await approvalApi.getMetrics();
        if (isSubscribed && res?.success && res?.data) {
          setApprovalMetrics({
            pending: res.data.pendingApproval || 0,
            critical: res.data.criticalValues || 0,
          });
        }
      } catch (err) {
        // quiet fallback
      }
    };

    fetchApprovalCounts();
    const timer = setInterval(fetchApprovalCounts, 60000);
    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, []);

  const [invoiceMetrics, setInvoiceMetrics] = useState({ pending: 0, pendingAmount: 0 });

  useEffect(() => {
    let isSubscribed = true;
    const fetchInvoiceCounts = async () => {
      try {
        const res = await invoiceApi.getBillingMetrics();
        if (isSubscribed && res?.success && res?.data) {
          setInvoiceMetrics({
            pending: res.data.pendingDueAmount > 0 ? 1 : 0,
            pendingAmount: res.data.pendingDueAmount || 0,
          });
        }
      } catch (err) {
        // quiet fallback
      }
    };

    fetchInvoiceCounts();
    const timer = setInterval(fetchInvoiceCounts, 60000);
    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, []);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const executeLogout = async () => {
    if (logout) await logout();
    router.push("/login");
  };

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "Patient Hub": pathname.startsWith("/patients"),
    Patients: pathname.startsWith("/patients"),
    Doctors: pathname.startsWith("/doctors"),
    Tests: pathname.startsWith("/tests"),
    Orders: pathname.startsWith("/orders"),
    Approvals: pathname.startsWith("/approvals"),
    Invoices: pathname.startsWith("/invoices"),
    Settings: pathname.startsWith("/settings"),
    Analyzers: pathname.startsWith("/analyzers"),
    "Clinical Communication": pathname.startsWith("/communication"),
    Communication: pathname.startsWith("/communication"),
    "Hematology Analyzers": pathname.includes("section=hematology"),
  });

  const toggleMenu = (label: string) => {
    setOpenMenus((previous) => ({
      ...previous,
      [label]: !previous[label],
    }));
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    const [hrefPath, hrefQuery] = href.split("?");

    if (hrefPath === "/dashboard") {
      return pathname === "/dashboard";
    }

    if (hrefQuery) {
      const targetParams = new URLSearchParams(hrefQuery);
      return pathname === hrefPath && Array.from(targetParams.entries()).every(([k, v]) => searchParams.get(k) === v);
    }

    if (hrefPath === "/invoices" && !hrefQuery) {
      return pathname === "/invoices" && !searchParams.get("tab");
    }

    if (hrefPath === "/communication" && !hrefQuery) {
      return pathname === "/communication" && !searchParams.get("tab");
    }

    if (hrefPath === "/analyzers") {
      return pathname === hrefPath && !searchParams.get("section") && !searchParams.get("tab");
    }

    // /settings owns its tabs through ?tab=, and /settings/communications is a
    // nested route. Match the bare entry exactly so the "General Settings" child
    // does not light up alongside a deeper settings page.
    if (hrefPath === "/settings" && !hrefQuery) {
      return pathname === "/settings" && !searchParams.get("tab");
    }

    return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  };

  const hasActiveChild = (item: MenuItem) => {
    if (!item.children) return false;

    return item.children.some((child) => {
      if (isActive(child.href)) return true;
      if (child.children) {
        return child.children.some((grandChild) => isActive(grandChild.href));
      }
      return false;
    });
  };

  // Role of the signed-in user, normalized to an upper-case string.
  const currentRole = useMemo(() => {
    const role = getUserRole(user);
    return role ? role.toUpperCase() : null;
  }, [user]);

  const isAllowedForRole = useCallback(
    (allowedRoles?: string[]) => {
      // No restriction declared, or the session has not resolved a role yet.
      if (!allowedRoles || allowedRoles.length === 0) return true;
      if (!currentRole) return false;
      return allowedRoles.includes(currentRole);
    },
    [currentRole]
  );

  // Drop items the current role cannot open, then apply the search filter.
  const filteredSections = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const roleScoped = menuSections
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => isAllowedForRole(item.allowedRoles))
          .map((item) =>
            item.children
              ? {
                ...item,
                children: item.children.filter((child) =>
                  isAllowedForRole(child.allowedRoles)
                ),
              }
              : item
          )
          // An accordion with no visible children is just a dead entry.
          .filter((item) => !item.children || item.children.length > 0),
      }))
      .filter((section) => section.items.length > 0);

    if (!query) return roleScoped;

    return roleScoped
      .map((section) => {
        const filteredItems = section.items.filter((item) => {
          const matchLabel = item.label.toLowerCase().includes(query);
          const matchChildren = item.children?.some((child) =>
            child.label.toLowerCase().includes(query)
          );
          return matchLabel || matchChildren;
        });
        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter((section) => section.items.length > 0);
  }, [searchQuery, isAllowedForRole]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[998] hidden sidebar-overlay"
        />
      )}

      <aside
        className="w-[260px] min-w-[260px] h-screen bg-white text-[#0F172A] border-r border-slate-200/90 fixed left-0 top-0 bottom-0 z-[999] flex flex-col transition-transform duration-300 ease-in-out labcore-sidebar shadow-sm select-none"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* ================================================= */}
        {/* BRAND HEADER */}
        {/* ================================================= */}
        <div className="h-[64px] min-h-[64px] px-5 flex items-center justify-between border-b border-slate-200/90 bg-white relative z-10">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center no-underline group"
          >
            <LabCoreLogo size="md" variant="full" theme="light" animated={true} sparkle={true} />
          </Link>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="hidden p-1.5 rounded-lg border border-slate-200 bg-[#F8FAFC] text-slate-500 text-lg cursor-pointer sidebar-close hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================================================= */}
        {/* EXECUTIVE CREDENTIALS & SIGNATORY PROFILE CARD */}
        {/* ================================================= */}
        <div className="px-3 pt-3 pb-2 border-b border-slate-200/80 relative z-10">
          <Link
            href="/settings"
            onClick={(event) => {
              if (!isAllowedForRole(SETTINGS_VIEW_ROLES)) {
                event.preventDefault();
              }
            }}
            aria-disabled={!isAllowedForRole(SETTINGS_VIEW_ROLES)}
            className={`block relative group overflow-hidden rounded-xl border border-slate-200/90 bg-[#F8FAFC] p-3 transition-all duration-200 no-underline ${
              isAllowedForRole(SETTINGS_VIEW_ROLES)
                ? "hover:bg-white hover:border-[#0F766E]/50 hover:shadow-sm cursor-pointer"
                : "cursor-default"
            }`}
          >
            <div className="relative z-10 flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E] font-bold text-xs text-white shadow-xs overflow-hidden">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    isMounted ? userInitials : 'JA'
                  )}
                </div>
                {/* Active Live Heartbeat Dot */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#059669] border-2 border-white"></span>
                </span>
              </div>

              {/* Identity & Accreditation */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate font-bold text-xs text-[#0F172A] group-hover:text-[#0F766E] transition-colors">
                    {isMounted ? userName : 'Jaya Ashapurama'}
                  </span>
                  <ShieldCheck className="h-3.5 w-3.5 text-[#059669] shrink-0" />
                </div>

                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-extrabold tracking-wider bg-teal-50 text-[#0F766E] border border-teal-200">
                    {isMounted ? userRole : 'ADMIN'}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-semibold bg-[#ECFDF5] text-[#059669] border border-emerald-200">
                    NABL VERIFIED
                  </span>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* Micro accreditation footer */}
            <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[9px] text-[#475569]">
              <span className="font-mono tracking-tight text-slate-500">
                NABL-2026-DIR • ISO 15189
              </span>
              <span className="text-[#0F766E] font-bold group-hover:underline">
                Manage
              </span>
            </div>
          </Link>
        </div>

        {/* ================================================= */}
        {/* QUICK JUMP / MODULE SEARCH */}
        {/* ================================================= */}
        <div className="px-3 pt-2.5 pb-1 relative z-10">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick jump to menu..."
              className="w-full bg-[#F8FAFC] border border-slate-200/90 text-xs text-[#0F172A] placeholder:text-slate-400 rounded-lg pl-8 pr-7 py-1.5 focus:outline-none focus:border-[#0F766E] focus:bg-white focus:ring-1 focus:ring-[#0F766E]/20 transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-slate-400 hover:text-slate-700 text-xs p-0.5"
              >
                ×
              </button>
            ) : (
              <kbd className="absolute right-2 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-400 bg-white rounded border border-slate-200 pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* ================================================= */}
        {/* NAVIGATION SECTIONS */}
        {/* ================================================= */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4 labcore-sidebar-scrollbar relative z-10">
          {filteredSections.map((section) => (
            <div key={section.id} className="space-y-0.5">
              {/* Section Header */}
              <div className="px-2.5 pb-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                <span>{section.title}</span>
                {section.badge && (
                  <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {section.badge}
                  </span>
                )}
              </div>

              {/* Items in Section */}
              {section.items.map((item) => {
                const active = isActive(item.href);
                const childActive = hasActiveChild(item);
                const isSelected = active || childActive;
                const hasChildren = !!item.children && item.children.length > 0;
                const isMenuOpen = searchQuery ? true : openMenus[item.label];
                const IconComponent = item.icon;

                return (
                  <div key={item.label} className="relative">
                    {hasChildren ? (
                      /* Accordion Item */
                      <button
                        type="button"
                        onClick={() => toggleMenu(item.label)}
                        className={`group relative w-full min-h-[38px] flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all duration-200 border cursor-pointer ${
                          isSelected
                            ? "bg-teal-50/80 border-teal-500/30 text-[#0F766E] shadow-2xs"
                            : "border-transparent text-[#334155] hover:text-[#0F172A] hover:bg-[#F8FAFC] hover:border-slate-200/60"
                        }`}
                      >
                        {/* Active Left Indicator Bar */}
                        {isSelected && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#0F766E]" />
                        )}

                        {/* Icon Box */}
                        <span
                          className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? item.accent.activeIconBg
                              : item.accent.bg
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </span>

                        {/* Label */}
                        <span
                          className={`flex-1 text-xs truncate ${
                            isSelected ? "font-bold text-[#0F766E]" : "font-semibold text-[#334155] group-hover:text-[#0F172A]"
                          }`}
                        >
                          {item.label}
                        </span>

                        {/* Real-time Metric Badges */}
                        {/* Patient Hub — live critical + today badges */}
                        {item.label === "Patient Hub" && (
                          <div className="flex items-center gap-1 mr-1">
                            {patientHubMetrics.criticalCount > 0 && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] animate-pulse"
                                title={`${patientHubMetrics.criticalCount} Critical patient(s) need attention`}
                              >
                                <span className="mr-0.5">!</span>{patientHubMetrics.criticalCount}
                              </span>
                            )}
                            {patientHubMetrics.todayCount > 0 && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-50 text-[#0284C7] border border-sky-200"
                                title={`${patientHubMetrics.todayCount} patients registered today`}
                              >
                                {patientHubMetrics.todayCount}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Approvals badges */}
                        {item.label === "Approvals" && (approvalMetrics.pending > 0 || approvalMetrics.critical > 0) && (
                          <div className="flex items-center gap-1 mr-1">
                            {approvalMetrics.critical > 0 && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] animate-pulse"
                                title={`${approvalMetrics.critical} Critical panic alert(s)`}
                              >
                                ! {approvalMetrics.critical}
                              </span>
                            )}
                            {approvalMetrics.pending > 0 && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-50 text-[#0284C7] border border-sky-200"
                                title={`${approvalMetrics.pending} Pending report(s)`}
                              >
                                {approvalMetrics.pending}
                              </span>
                            )}
                          </div>
                        )}

                        {item.label === "Invoices" && invoiceMetrics.pendingAmount > 0 && (
                          <div className="flex items-center gap-1 mr-1">
                            <span
                              className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#FFFBEB] text-[#D97706] border border-amber-200"
                              title={`Pending Dues: ₹${invoiceMetrics.pendingAmount.toLocaleString('en-IN')}`}
                            >
                              Due
                            </span>
                          </div>
                        )}

                        {/* Chevron Indicator */}
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 ${
                            isMenuOpen ? "rotate-180 text-[#0F766E]" : ""
                          }`}
                        />
                      </button>
                    ) : (
                      /* Single Link Item */
                      <Link
                        href={item.href || "#"}
                        onClick={onClose}
                        className={`group relative w-full min-h-[38px] flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg no-underline transition-all duration-200 border ${
                          active
                            ? "bg-teal-50/80 border-teal-500/30 text-[#0F766E] shadow-2xs"
                            : "border-transparent text-[#334155] hover:text-[#0F172A] hover:bg-[#F8FAFC] hover:border-slate-200/60"
                        }`}
                      >
                        {/* Active Left Indicator Bar */}
                        {active && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#0F766E]" />
                        )}

                        {/* Icon Box */}
                        <span
                          className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            active
                              ? item.accent.activeIconBg
                              : item.accent.bg
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </span>

                        {/* Label */}
                        <span
                          className={`flex-1 text-xs truncate ${
                            active ? "font-bold text-[#0F766E]" : "font-semibold text-[#334155] group-hover:text-[#0F172A]"
                          }`}
                        >
                          {item.label}
                        </span>

                        {/* Active Dot Indicator */}
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] mr-1" />
                        )}
                      </Link>
                    )}

                    {/* ============================================= */}
                    {/* SUBMENU ACCORDION */}
                    {/* ============================================= */}
                    {hasChildren && isMenuOpen && (
                      <div className="ml-5 pl-2.5 border-l border-slate-200 my-1 space-y-0.5">
                        {item.children?.map((child, childIdx) => {
                          // ── Divider / Section separator ────────────────────
                          if (child.isDivider) {
                            return (
                              <div
                                key={`divider-${childIdx}`}
                                className="flex items-center gap-1.5 pt-2 pb-0.5 px-1"
                              >
                                <span className="text-[8.5px] font-extrabold tracking-[0.16em] uppercase text-slate-500">
                                  {child.dividerLabel}
                                </span>
                                <div className="flex-1 h-px bg-slate-200" />
                              </div>
                            );
                          }

                          const childIsActive = isActive(child.href);
                          const hasGrandChildren = child.children && child.children.length > 0;
                          const isChildMenuOpen = openMenus[child.label];

                          // Resolve live count
                          const liveCount =
                            child.liveKey === "criticalPatients"
                              ? patientHubMetrics.criticalCount
                              : child.liveKey === "opdQueue"
                                ? patientHubMetrics.todayCount
                                : 0;

                          return (
                            <div key={`${child.href}-${childIdx}`}>
                              {hasGrandChildren ? (
                                <button
                                  type="button"
                                  onClick={() => toggleMenu(child.label)}
                                  className={`w-full min-h-[32px] flex items-center justify-between px-2.5 py-1 rounded-md cursor-pointer text-left text-xs transition-all duration-150 ${
                                    childIsActive
                                      ? "text-[#0F766E] bg-teal-50/80 font-bold"
                                      : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-100/70"
                                  }`}
                                >
                                  <span className="truncate">{child.label}</span>
                                  <ChevronDown
                                    className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                                      isChildMenuOpen ? "rotate-180 text-[#0F766E]" : ""
                                    }`}
                                  />
                                </button>
                              ) : (
                                <Link
                                  href={child.href}
                                  onClick={onClose}
                                  className={`group/sub min-h-[32px] flex items-center justify-between px-2.5 py-1 rounded-md no-underline text-xs transition-all duration-150 ${
                                    childIsActive
                                      ? "text-[#0F766E] bg-teal-50/80 font-bold border-l-2 border-[#0F766E] pl-2"
                                      : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-100/70"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${
                                        childIsActive
                                          ? "bg-[#0F766E] scale-110"
                                          : "bg-slate-300 group-hover/sub:bg-slate-500"
                                      }`}
                                    />
                                    <span className="truncate">{child.label}</span>
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {/* Live count badge (patient hub metrics) */}
                                    {child.liveKey && liveCount > 0 && (
                                      <span
                                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${
                                          child.liveKey === "criticalPatients"
                                            ? "bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5] animate-pulse"
                                            : "bg-[#ECFDF5] text-[#059669] border border-emerald-200"
                                        }`}
                                      >
                                        {liveCount}
                                      </span>
                                    )}

                                    {/* Static badge from menu data */}
                                    {child.badge && !child.liveKey && (
                                      <span
                                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${
                                          child.badgeVariant === "red"
                                            ? "bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5] animate-pulse"
                                            : child.badgeVariant === "emerald"
                                            ? "bg-[#ECFDF5] text-[#059669] border border-emerald-200"
                                            : child.badgeVariant === "amber"
                                            ? "bg-[#FFFBEB] text-[#D97706] border border-amber-200"
                                            : child.badgeVariant === "purple" || child.badgeVariant === "violet"
                                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                                            : "bg-sky-50 text-[#0284C7] border border-sky-200"
                                        }`}
                                      >
                                        {child.badge}
                                      </span>
                                    )}

                                    {/* Approval module badges */}
                                    {child.label.includes("Critical") && approvalMetrics.critical > 0 && !child.liveKey && (
                                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FEF2F2] text-[#DC2626] animate-pulse border border-[#FCA5A5]">
                                        {approvalMetrics.critical}
                                      </span>
                                    )}
                                    {child.label.includes("Queue") && approvalMetrics.pending > 0 && !child.liveKey && (
                                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-50 text-[#0284C7] border border-sky-200">
                                        {approvalMetrics.pending}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              )}

                              {/* Nested Submenu */}
                              {hasGrandChildren && isChildMenuOpen && (
                                <div className="ml-3 pl-2.5 border-l border-slate-200 my-1 space-y-0.5">
                                  {child.children?.map((grandChild) => {
                                    const grandChildIsActive = isActive(grandChild.href);

                                    return (
                                      <Link
                                        key={grandChild.href}
                                        href={grandChild.href}
                                        onClick={onClose}
                                        className={`min-h-[28px] flex items-center px-2 py-1 rounded text-xs no-underline transition-all duration-150 ${
                                          grandChildIsActive
                                            ? "text-[#0F766E] bg-teal-50/80 font-bold"
                                            : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-100/70"
                                        }`}
                                      >
                                        <span className="truncate">{grandChild.label}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ================================================= */}
        {/* BOTTOM UTILITY & TELEMETRY DOCK */}
        {/* ================================================= */}
        <div className="p-2.5 border-t border-slate-200/90 bg-white relative z-10 space-y-1">
          {/* LIS Core Telemetry Status Pill */}
          <div className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]"></span>
              </span>
              <span className="font-bold text-[#0F172A]">LIS Core Online</span>
            </div>
            <span className="text-[9px] font-mono font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-emerald-200">
              ASTM / HL7
            </span>
          </div>

          {/* Settings & Logout buttons */}
          <div className="flex items-center gap-1 pt-1">
            {isAllowedForRole(SETTINGS_VIEW_ROLES) && (
              <Link
                href="/settings"
                onClick={onClose}
                className="flex-1 min-h-[34px] flex items-center justify-center gap-1.5 px-2 rounded-lg text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 text-xs no-underline transition-colors border border-slate-200 hover:border-slate-300"
                title="System Configuration"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold">Settings</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={`${isAllowedForRole(SETTINGS_VIEW_ROLES) ? "flex-1" : "w-full"} min-h-[34px] flex items-center justify-center gap-1.5 px-2 rounded-lg text-[#DC2626] hover:text-red-700 hover:bg-red-50 text-xs border border-slate-200 hover:border-red-200 cursor-pointer transition-colors font-semibold`}
              title="Terminate Secure Session"
            >
              <LogOut className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Logout</span>
            </button>
          </div>

          <div className="px-2 pt-1 flex items-center justify-between text-[9px] text-[#475569] font-mono">
            <span>LabCore ELIS v1.3.0</span>
            <span className="text-[#0F766E] font-bold">NABL ISO 15189</span>
          </div>
        </div>
      </aside>

      {/* ================================================= */}
      {/* CUSTOM SLEEK SCROLLBAR STYLES */}
      {/* ================================================= */}
      <style jsx global>{`
        .labcore-sidebar-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .labcore-sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .labcore-sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 9999px;
        }
        .labcore-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }

        @media (max-width: 900px) {
          .labcore-sidebar {
            width: 260px !important;
            min-width: 260px !important;
          }

          .sidebar-overlay {
            display: block !important;
          }

          .sidebar-close {
            display: block !important;
          }
        }
      `}</style>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={executeLogout}
      />
    </>
  );
}
