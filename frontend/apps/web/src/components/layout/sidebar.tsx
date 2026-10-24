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
  badgeVariant?: "red" | "blue" | "amber" | "emerald" | "purple" | "violet" | "teal";
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
  id?: string;
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

// ────────────────────────────────────────────────────────────────────────────
// CLINICAL MEDICAL COLOR PALETTE (Ultra-Clean, High-Precision Hospital Theme)
// ────────────────────────────────────────────────────────────────────────────
const ACCENTS = {
  // Medical Sapphire Blue (Diagnostic Core, Orders, Directory, LIS)
  sapphire: {
    bg: "bg-sky-50/80 text-[#0284C7] border border-sky-100/80 group-hover:bg-sky-100 group-hover:text-[#0369A1] group-hover:border-sky-200",
    text: "text-[#0284C7]",
    activeBorder: "border-[#0284C7]",
    activeIconBg: "bg-[#0284C7] text-white shadow-xs",
    activeText: "text-[#0284C7] font-bold",
  },
  // Clinical Teal (NABL ISO, Verification, Interfacing, Live KPIs)
  teal: {
    bg: "bg-teal-50/80 text-[#0F766E] border border-teal-100/80 group-hover:bg-teal-100 group-hover:text-[#0F766E] group-hover:border-teal-200",
    text: "text-[#0F766E]",
    activeBorder: "border-[#0F766E]",
    activeIconBg: "bg-[#0F766E] text-white shadow-xs",
    activeText: "text-[#0F766E] font-bold",
  },
  // Diagnostic Emerald (Normal Ranges, Verified, Cashier, ABDM)
  emerald: {
    bg: "bg-[#ECFDF5] text-[#059669] border border-emerald-100/80 group-hover:bg-emerald-100 group-hover:text-[#047857] group-hover:border-emerald-200",
    text: "text-[#059669]",
    activeBorder: "border-[#059669]",
    activeIconBg: "bg-[#059669] text-white shadow-xs",
    activeText: "text-[#059669] font-bold",
  },
  // Clinical Caution Amber (Accessioning, Incubation, Westgard, Review)
  amber: {
    bg: "bg-[#FFFBEB] text-[#D97706] border border-amber-100/80 group-hover:bg-amber-100 group-hover:text-[#B45309] group-hover:border-amber-200",
    text: "text-[#D97706]",
    activeBorder: "border-[#D97706]",
    activeIconBg: "bg-[#D97706] text-white shadow-xs",
    activeText: "text-[#B45309] font-bold",
  },
  // Critical / STAT / Pathologist Rose-Red (Emergency, Panic Values, Sign-off)
  rose: {
    bg: "bg-[#FEF2F2] text-[#DC2626] border border-rose-100/80 group-hover:bg-rose-100 group-hover:text-[#B91C1C] group-hover:border-rose-200",
    text: "text-[#DC2626]",
    activeBorder: "border-[#DC2626]",
    activeIconBg: "bg-[#DC2626] text-white shadow-xs",
    activeText: "text-[#DC2626] font-bold",
  },
  // Microbiology & Genomics Indigo (Cultures, Antibiogram, AMR, CDSS)
  indigo: {
    bg: "bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/80 group-hover:bg-indigo-100 group-hover:text-[#4338CA] group-hover:border-indigo-200",
    text: "text-[#4F46E5]",
    activeBorder: "border-[#4F46E5]",
    activeIconBg: "bg-[#4F46E5] text-white shadow-xs",
    activeText: "text-[#4F46E5] font-bold",
  },
  // System Administration Slate (Configuration, Security, Logs)
  slate: {
    bg: "bg-slate-100/80 text-[#475569] border border-slate-200/80 group-hover:bg-slate-200 group-hover:text-[#1E293B] group-hover:border-slate-300",
    text: "text-[#475569]",
    activeBorder: "border-[#0284C7]",
    activeIconBg: "bg-[#0284C7] text-white shadow-xs",
    activeText: "text-[#0F172A] font-bold",
  },
};

const menuSections: MenuSection[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — COMMAND CENTER (Entry Point)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "command",
    title: "Command Center",
    badge: "Live",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        name: "dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        accent: ACCENTS.teal,
        children: [
          { label: "Lab Operations KPI", href: "/dashboard", badge: "Live", badgeVariant: "emerald" },
          { label: "Critical Alerts Triage", href: "/dashboard?view=critical", badge: "Panic", badgeVariant: "red" },
          { label: "Department Pipeline Matrix", href: "/dashboard?view=pipeline" },
          { label: "TAT Performance Monitor", href: "/dashboard?view=tat", badge: "SLA", badgeVariant: "amber" },
          { label: "Ward STAT Queue", href: "/dashboard?view=ward" },
          { label: "Shift Handover Summary", href: "/dashboard?view=shift" },
        ],
      },
      {
        id: "nexus",
        label: "Omniscient Nexus",
        name: "nexus",
        href: "/nexus",
        icon: Sparkles,
        accent: ACCENTS.indigo,
        children: [
          { label: "Nexus Command Center", href: "/nexus", badge: "Live", badgeVariant: "emerald" },
          { label: "2D/3D Floor Digital Twin", href: "/nexus?tab=world-model", badge: "Twin", badgeVariant: "blue" },
          { label: "Queueing & Little's Law", href: "/nexus?tab=queues" },
          { label: "Quality (Levey-Jennings)", href: "/nexus?tab=quality", badge: "Westgard", badgeVariant: "amber" },
          { label: "Reagent Stockout Advisory", href: "/nexus?tab=inventory" },
          { label: "Controlled Autonomy Gate", href: "/nexus?tab=autonomy", badge: "Gate", badgeVariant: "purple" },
          { label: "Mathematical Workbench", href: "/nexus?tab=math" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — PATIENT MANAGEMENT (Step 1 of Clinical Pipeline)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "patients",
    title: "① Patient Management",
    badge: "Registration",
    items: [
      {
        id: "patients",
        label: "Patient Hub",
        name: "patients",
        href: "/patients",
        icon: UserCircle2,
        accent: ACCENTS.sapphire,
        children: [
          { label: "Patient Directory (MPI)", href: "/patients", badge: "MPI", badgeVariant: "blue" },
          { label: "Register New Patient", href: "/patients/new", badge: "Quick", badgeVariant: "emerald" },
          { label: "Active Patients", href: "/patients?chip=ACTIVE", badge: "Live", badgeVariant: "emerald" },
          { isDivider: true, dividerLabel: "OPD & QUEUE", label: "", href: "#" },
          { label: "OPD Queue (Live)", href: "/patients/opd-queue", badge: "Live", badgeVariant: "emerald", liveKey: "opdQueue" },
          { label: "Today's Registrations", href: "/patients?chip=TODAY", badge: "Today", badgeVariant: "blue" },
          { label: "Critical Watch List", href: "/patients?chip=CRITICAL", badge: "Urgent", badgeVariant: "red", liveKey: "criticalPatients" },
          { label: "Pending Orders Roster", href: "/patients?chip=PENDING", badge: "Pending", badgeVariant: "amber" },
          { isDivider: true, dividerLabel: "COMPLIANCE & ABHA", label: "", href: "#" },
          { label: "ABDM / ABHA Console", href: "/abdm", badge: "ABHA", badgeVariant: "purple" },
        ],
      },
      {
        id: "doctors",
        label: "Doctors",
        name: "doctors",
        href: "/doctors",
        icon: Stethoscope,
        accent: ACCENTS.teal,
        children: [
          { label: "All Doctors", href: "/doctors" },
          { label: "Add Doctor / Pathologist", href: "/doctors/new" },
          { label: "Referral Commission Report", href: "/invoices?tab=b2b" },
        ],
      },
      {
        id: "abdm",
        label: "ABDM / ABHA",
        name: "abdm",
        href: "/abdm",
        icon: ShieldCheck,
        accent: ACCENTS.emerald,
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

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — ORDER & BILLING (Step 2: Order Booking + GST Invoice)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "orders-billing",
    title: "② Order & Billing",
    badge: "RCM",
    items: [
      {
        id: "tests",
        label: "Test Catalog",
        name: "tests",
        href: "/tests",
        icon: FlaskConical,
        accent: ACCENTS.sapphire,
        children: [
          { label: "All Tests", href: "/tests" },
          { label: "Add / Edit Test", href: "/tests/new" },
          { label: "Test Categories", href: "/tests/categories" },
          { label: "Parameters & Units", href: "/tests/parameters" },
          { label: "Reference Ranges (CLSI)", href: "/tests/reference-ranges" },
        ],
      },
      {
        id: "orders",
        label: "Orders",
        name: "orders",
        href: "/orders",
        icon: ClipboardList,
        accent: ACCENTS.sapphire,
        children: [
          { label: "All Orders", href: "/orders" },
          { label: "New Lab Order", href: "/orders/new", badge: "Quick", badgeVariant: "emerald" },
          { label: "STAT Orders (Priority)", href: "/orders?priority=STAT", badge: "STAT", badgeVariant: "red" },
          { label: "Home Collection Orders", href: "/orders?type=HOME", badge: "Home", badgeVariant: "blue" },
          { label: "Corporate / TPA Orders", href: "/orders?type=TPA", badge: "TPA", badgeVariant: "purple" },
        ],
      },
      {
        id: "invoices",
        label: "Invoices",
        name: "invoices",
        href: "/invoices",
        icon: FileText,
        badgeKey: "invoices",
        accent: ACCENTS.sapphire,
        children: [
          { label: "All Invoices (Register)", href: "/invoices" },
          { label: "Quick POS Billing Counter", href: "/invoices/new", badge: "POS", badgeVariant: "emerald" },
          { label: "TPA & Cashless Claims", href: "/invoices?tab=tpa" },
          { label: "Sales Day Book / Shift Close", href: "/invoices?tab=daybook" },
          { label: "Overdue Debt & AR Aging", href: "/invoices?tab=aging" },
          { label: "Corporate & Doctor Referrals", href: "/invoices?tab=b2b" },
          { label: "GST & Tax Audit (GSTR-1)", href: "/invoices?tab=gst", badge: "GST", badgeVariant: "amber" },
        ],
      },
      {
        id: "payments",
        label: "Payments",
        name: "payments",
        href: "/payments",
        icon: DollarSign,
        accent: ACCENTS.emerald,
        children: [
          { label: "Cashier Command Desk", href: "/payments" },
          { label: "Transactions & Tender Ledger", href: "/payments?tab=transactions" },
          { label: "Shift Till & Cash Drawer", href: "/payments?tab=cash-counter" },
          { label: "Advances & Patient Wallet", href: "/payments?tab=advances" },
          { label: "Dual-Custody Refunds", href: "/payments?tab=refunds" },
          { label: "POS & Gateway Settlements", href: "/payments?tab=settlements" },
          { label: "Bank Reconciliation", href: "/payments?tab=reconciliation" },
          { label: "Cashier EOD Reports", href: "/payments?tab=reports" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — SPECIMEN PIPELINE (Step 3: Sample → Analyzer → QC)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "specimen",
    title: "③ Specimen Pipeline",
    badge: "LIS",
    items: [
      {
        id: "samples",
        label: "Samples",
        name: "samples",
        href: "/samples",
        icon: TestTube,
        accent: ACCENTS.amber,
        children: [
          { label: "Sample Worklist", href: "/samples", badge: "Live", badgeVariant: "emerald" },
          { label: "Barcode Print Station", href: "/samples?view=barcode", badge: "Print", badgeVariant: "blue" },
          { label: "Collection Desk (Phlebotomy)", href: "/samples?view=collection" },
          { label: "Lab Receipt & Accessioning", href: "/samples?view=received" },
          { label: "Processing & Centrifuge", href: "/samples?view=processing" },
          { label: "Rejected Samples", href: "/samples?view=rejected", badge: "QC", badgeVariant: "red" },
          { label: "7-Stage State Tracker", href: "/samples?view=tracker" },
        ],
      },
      {
        id: "analyzers",
        label: "Analyzers & QC",
        name: "analyzers",
        href: "/analyzers",
        icon: Cpu,
        accent: ACCENTS.teal,
        children: [
          { label: "Fleet Dashboard", href: "/analyzers", badge: "Live", badgeVariant: "emerald" },
          { label: "🚨 STAT Emergency Lane", href: "/analyzers?tab=stat_lane", badge: "15m TAT", badgeVariant: "red" },
          { label: "Bidirectional Worklists", href: "/analyzers?tab=bidirectional" },
          { label: "Live Result Stream", href: "/analyzers?tab=live_feed", badge: "Live", badgeVariant: "emerald" },
          { label: "Shift QC & Westgard Gate", href: "/analyzers?tab=shift_qc", badge: "Westgard", badgeVariant: "amber" },
          { label: "Auto-Approval QC Matrix", href: "/analyzers?tab=qc_validation" },
          { label: "🧪 Hematology Suite (CBC)", href: "/analyzers?tab=hematology" },
          { label: "Reagents & Consumables", href: "/analyzers?tab=reagents" },
          { label: "Diagnostics & Error Logs", href: "/analyzers?tab=diagnostics" },
          { label: "Virtual Protocol Simulator", href: "/analyzers?tab=simulator" },
          { label: "🚀 Lab Digital Twin (DES)", href: "/digital-twin", badge: "Sim", badgeVariant: "emerald" },
        ],
      },
      {
        id: "microbiology",
        label: "Microbiology & AMR",
        name: "microbiology",
        href: "/microbiology",
        icon: FlaskRound,
        accent: ACCENTS.indigo,
        children: [
          { label: "Culture Worklist", href: "/microbiology", badge: "Live", badgeVariant: "emerald" },
          { label: "Blood Culture (BacT/ALERT)", href: "/microbiology?tab=blood", badge: "STAT", badgeVariant: "red" },
          { label: "Urine Culture Bench", href: "/microbiology?tab=urine" },
          { label: "Wound / Swab Culture", href: "/microbiology?tab=wound" },
          { label: "AFB & Sputum Culture", href: "/microbiology?tab=afb" },
          { label: "AST & MIC Workstation", href: "/microbiology?tab=ast", badge: "VITEK-2", badgeVariant: "purple" },
          { label: "Antibiogram Matrix (HICC)", href: "/microbiology?tab=antibiogram", badge: "EUCAST", badgeVariant: "blue" },
          { label: "AMR & Superbug Surveillance", href: "/microbiology?tab=amr", badge: "CLSI", badgeVariant: "amber" },
        ],
      },
      {
        id: "integrations",
        label: "Integration Engine",
        name: "integrations",
        href: "/integrations",
        icon: Server,
        accent: ACCENTS.sapphire,
        children: [
          { label: "Channel Matrix (HL7/ASTM)", href: "/integrations", badge: "Live", badgeVariant: "emerald" },
          { label: "Live Message Stream", href: "/integrations?tab=stream", badge: "Live", badgeVariant: "emerald" },
          { label: "Protocol Simulator", href: "/integrations?tab=simulator", badge: "Sandbox", badgeVariant: "blue" },
          { label: "Dead Letter Queue (DLQ)", href: "/integrations?tab=dlq", badge: "Auto-Heal", badgeVariant: "red" },
          { label: "LOINC Code Crosswalk", href: "/integrations?tab=loinc" },
          { label: "Cold-Chain IoT Telemetry", href: "/integrations?tab=iot" },
          { label: "Compliance & Security Audit", href: "/integrations?tab=audit", badge: "HIPAA", badgeVariant: "amber" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — CLINICAL VALIDATION (Step 4: Results → Approval → Report)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "validation",
    title: "④ Clinical Validation",
    badge: "NABL",
    items: [
      {
        id: "results",
        label: "Results Entry",
        name: "results",
        href: "/results",
        icon: CheckCircle,
        accent: ACCENTS.emerald,
        children: [
          { label: "Result Entry Worklist", href: "/results", badge: "Pending", badgeVariant: "amber" },
          { label: "Critical / Panic Values", href: "/results?filter=critical", badge: "🚨 HH/LL", badgeVariant: "red" },
          { label: "Abnormal Results", href: "/results?filter=abnormal", badge: "Flag", badgeVariant: "amber" },
          { label: "Auto-Verified (QC Pass)", href: "/results?status=VERIFIED", badge: "Auto", badgeVariant: "emerald" },
          { label: "Delta Check Alerts", href: "/results?filter=delta", badge: "Δ", badgeVariant: "amber" },
        ],
      },
      {
        id: "approvals",
        label: "Pathologist Approvals",
        name: "approvals",
        href: "/approvals",
        icon: FileCheck,
        badgeKey: "approvals",
        accent: ACCENTS.rose,
        children: [
          { label: "Approval Queue (Ready)", href: "/approvals", badge: "Sign", badgeVariant: "red" },
          { label: "Doctor Workstation", href: "/approvals?mode=workstation", badge: "Desk", badgeVariant: "purple" },
          { label: "Critical & Panic Alerts", href: "/approvals?filter=critical", badge: "🚨", badgeVariant: "red" },
          { label: "Lab Pipeline (Registered)", href: "/approvals?filter=pipeline" },
          { label: "Clean Fast-Track", href: "/approvals?filter=normal" },
          { label: "Returned & Reruns", href: "/approvals?status=ENTERED" },
          { label: "Signed Archive", href: "/approvals?status=APPROVED" },
          { label: "Rules & Policies", href: "/approvals?view=rules" },
        ],
      },
      {
        id: "reports",
        label: "Reports",
        name: "reports",
        href: "/reports",
        icon: ReportIcon,
        accent: ACCENTS.sapphire,
        children: [
          { label: "Report Gallery", href: "/reports" },
          { label: "Generate / Print PDF", href: "/reports?action=generate", badge: "NABL PDF", badgeVariant: "emerald" },
          { label: "QR Verify Portal", href: "/verify-report", badge: "Public", badgeVariant: "blue" },
          { label: "WhatsApp Dispatch Log", href: "/reports?tab=whatsapp" },
          { label: "Email Delivery Log", href: "/reports?tab=email" },
          { label: "Signed Archive", href: "/reports?tab=archive" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — SUPPLY CHAIN (Step 5: Inventory + Logistics)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "supply-chain",
    title: "⑤ Supply Chain",
    badge: "Ops",
    items: [
      {
        id: "inventory",
        label: "Inventory & Reagents",
        name: "inventory",
        href: "/inventory",
        icon: ScrollText,
        accent: ACCENTS.sapphire,
        children: [
          { label: "Reagent Register", href: "/inventory", badge: "Stock", badgeVariant: "blue" },
          { label: "Critical Stock Alerts", href: "/inventory?filter=CRITICAL", badge: "Reorder", badgeVariant: "red" },
          { label: "Low Stock Items", href: "/inventory?filter=LOW", badge: "Low", badgeVariant: "amber" },
          { label: "Expiry Tracking (FEFO)", href: "/inventory?filter=EXPIRING", badge: "Expiry", badgeVariant: "amber" },
          { label: "Cold Chain Monitor (IoT)", href: "/inventory?tab=coldchain", badge: "2-8°C", badgeVariant: "teal" },
          { label: "Raise Purchase Order", href: "/inventory?action=po", badge: "PO", badgeVariant: "emerald" },
          { label: "Vendor Catalog", href: "/inventory?tab=vendors" },
        ],
      },
      {
        id: "logistics",
        label: "Sample Logistics",
        name: "logistics",
        href: "/logistics",
        icon: Waypoints,
        accent: ACCENTS.sapphire,
        children: [
          { label: "Live Trip Tracker", href: "/logistics", badge: "GPS", badgeVariant: "emerald" },
          { label: "Sample Pickup Runs", href: "/logistics?type=SAMPLE_PICKUP", badge: "STAT", badgeVariant: "red" },
          { label: "Home Collection Fleet", href: "/logistics?type=HOME", badge: "Home", badgeVariant: "blue" },
          { label: "Report Courier", href: "/logistics?type=REPORT_COURIER" },
          { label: "Inter-Lab Referrals", href: "/logistics?type=INTER_LAB", badge: "Referral", badgeVariant: "purple" },
          { label: "Supply Deliveries", href: "/logistics?type=SUPPLY_DELIVERY" },
          { label: "Fleet Management", href: "/logistics?tab=fleet" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 7 — CLINICAL AI & CDSS (Intelligence Layer)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "ai-research",
    title: "⑥ Clinical AI & CDSS",
    badge: "Intelligence",
    items: [
      {
        id: "ai-studio",
        label: "Clinical AI Diagnostics",
        name: "ai-studio",
        href: "/ai-studio",
        icon: Brain,
        accent: ACCENTS.teal,
        children: [
          { isDivider: true, dividerLabel: "DIAGNOSTIC & RISK ENGINES", label: "", href: "#" },
          { label: "Clinical AI Hub", href: "/ai-studio" },
          { label: "Emergency Command Center", href: "/ai-studio?tab=clinical-command", badge: "LIVE", badgeVariant: "red" },
          { label: "Diagnostic Risk ML", href: "/ai-studio?tab=classical-ml", badge: "CARDIAC", badgeVariant: "emerald" },
          { label: "Hematology CBC AI", href: "/ai-studio?tab=cbc-analyzer", badge: "14-PARAM", badgeVariant: "teal" },
          { label: "Sepsis Watch & SOFA", href: "/ai-studio?tab=sepsis-watch", badge: "ICU", badgeVariant: "red" },
          { label: "Coagulation Risk AI", href: "/ai-studio?tab=coagulation-risk" },
          { label: "Thyroid Classifier", href: "/ai-studio?tab=thyroid-classifier" },
          { label: "12-Lead ECG AI", href: "/ai-studio?tab=ecg-interpreter" },
          { isDivider: true, dividerLabel: "CLINICAL DECISION SUPPORT", label: "", href: "#" },
          { label: "Pharmacovigilance & DDI", href: "/ai-studio?tab=drug-interactions", badge: "SAFETY", badgeVariant: "amber" },
          { label: "AMR & Antibiogram AI", href: "/ai-studio?tab=amr-susceptibility", badge: "CLSI", badgeVariant: "purple" },
          { label: "Smart Diagnostic Report", href: "/ai-studio?tab=smart-report", badge: "AUTO", badgeVariant: "teal" },
          { label: "Clinical NLP & EMR", href: "/ai-studio?tab=nlp" },
          { isDivider: true, dividerLabel: "LAB MLOPS & REGULATORY", label: "", href: "#" },
          { label: "Critical Delta-Checks", href: "/ai-studio?tab=anomalies", badge: "WESTGARD", badgeVariant: "red" },
          { label: "Hospital TAT Forecaster", href: "/ai-studio?tab=forecasting" },
          { label: "Biomarker Neural Nets", href: "/ai-studio?tab=deep-learning" },
          { label: "Hospital Model Registry", href: "/ai-studio?tab=registry" },
          { label: "Regulatory AI Audit", href: "/ai-studio?tab=audit", badge: "HIPAA", badgeVariant: "emerald" },
        ],
      },
      {
        id: "digital-twin",
        label: "Lab Digital Twin",
        name: "digital-twin",
        href: "/digital-twin",
        icon: Cpu,
        accent: ACCENTS.teal,
        children: [
          { label: "DES Simulation Engine", href: "/digital-twin", badge: "Sim", badgeVariant: "emerald" },
          { label: "Resource Optimization", href: "/digital-twin?tab=resources" },
          { label: "Bottleneck Analysis", href: "/digital-twin?tab=bottleneck" },
          { label: "Shift Scenario Planner", href: "/digital-twin?tab=scenarios" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 8 — COMMUNICATION & DISPATCH (Step 6: Delivery)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "communication",
    title: "⑦ Communication",
    badge: "Omnichannel",
    items: [
      {
        id: "communication",
        label: "Clinical Communication",
        name: "communication",
        href: "/communication",
        icon: MessageSquare,
        accent: ACCENTS.teal,
        children: [
          { label: "📡 Omnichannel Command Hub", href: "/communication", badge: "Live", badgeVariant: "emerald" },
          { label: "🩺 Doctor Consultation Desk", href: "/communication?tab=consultation", badge: "STAT", badgeVariant: "purple" },
          { label: "🚨 Critical / Panic Escalations", href: "/communication?tab=panic", badge: "NABL", badgeVariant: "red" },
          { label: "📥 2-Way Patient Inbox", href: "/communication?tab=inbox", badge: "Live", badgeVariant: "blue" },
          { label: "📢 Hospital Emergency Paging", href: "/communication?tab=broadcast", badge: "Code Blue", badgeVariant: "red" },
          { label: "🤝 Shift Handover Huddle", href: "/communication?tab=handover", badge: "Custody", badgeVariant: "amber" },
          { label: "📄 Report & Sample Dispatch", href: "/communication?tab=dispatch", badge: "SHA-256", badgeVariant: "emerald" },
          { label: "🎯 Health Packages & Campaigns", href: "/communication?tab=campaign", badge: "Re-call", badgeVariant: "purple" },
        ],
      },
      {
        id: "whatsapp",
        label: "WhatsApp Engine",
        name: "whatsapp",
        href: "/whatsapp",
        icon: Radio,
        accent: ACCENTS.emerald,
        children: [
          { label: "WhatsApp Broadcast Hub", href: "/whatsapp" },
          { label: "Report Auto-Send", href: "/whatsapp?tab=reports" },
          { label: "Appointment Reminders", href: "/whatsapp?tab=appointments" },
          { label: "Critical Alert Notify", href: "/whatsapp?tab=alerts", badge: "Auto", badgeVariant: "red" },
          { label: "Template Manager", href: "/whatsapp?tab=templates" },
          { label: "DLT Compliance", href: "/settings/communications", badge: "TRAI", badgeVariant: "amber" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 9 — SYSTEM ADMINISTRATION
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "administration",
    title: "⑧ Administration",
    badge: "System",
    items: [
      {
        id: "settings",
        label: "Settings",
        name: "settings",
        href: "/settings",
        icon: Settings,
        allowedRoles: SETTINGS_VIEW_ROLES,
        accent: ACCENTS.slate,
        children: [
          { label: "General Settings", href: "/settings" },
          { label: "Users & Roles", href: "/settings?tab=users", allowedRoles: SETTINGS_ADMIN_ROLES },
          { label: "Lab Profile & NABL", href: "/settings?tab=lab" },
          { label: "Branch Management", href: "/settings?tab=branches" },
          { label: "Communication Providers", href: "/settings/communications", allowedRoles: SETTINGS_EDIT_ROLES },
          { label: "Security & 2FA", href: "/settings?tab=security" },
          { label: "Audit Log Viewer", href: "/settings?tab=audit" },
          { label: "System Health", href: "/settings?tab=health", badge: "API", badgeVariant: "emerald" },
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
  const [userInitials, setUserInitials] = useState('NP');
  const [userName, setUserName] = useState('Nikil Panchal');
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
    "Operations Dashboard": pathname.startsWith("/dashboard"),
    "Diagnostic Intelligence (Nexus)": pathname.startsWith("/nexus"),
    "Patient Master Index (MPI)": pathname.startsWith("/patients"),
    "Patient Hub": pathname.startsWith("/patients"),
    Patients: pathname.startsWith("/patients"),
    "Consultants & Clinicians": pathname.startsWith("/doctors"),
    Doctors: pathname.startsWith("/doctors"),
    "Investigation Catalog (LOINC)": pathname.startsWith("/tests"),
    Tests: pathname.startsWith("/tests"),
    "Lab Requisitions & Orders": pathname.startsWith("/orders"),
    Orders: pathname.startsWith("/orders"),
    "Invoices & Billing Register": pathname.startsWith("/invoices"),
    Invoices: pathname.startsWith("/invoices"),
    "Cashier Counter & Tender": pathname.startsWith("/payments"),
    Payments: pathname.startsWith("/payments"),
    "Sample Accessioning & Tracking": pathname.startsWith("/samples"),
    Samples: pathname.startsWith("/samples"),
    "Analyzer Fleet & Westgard QC": pathname.startsWith("/analyzers"),
    Analyzers: pathname.startsWith("/analyzers"),
    "Microbiology & Antibiogram (AMR)": pathname.startsWith("/microbiology"),
    "HL7 / ASTM Interfacing Engine": pathname.startsWith("/integrations"),
    "Technical Result Entry": pathname.startsWith("/results"),
    "Pathologist Verification Desk": pathname.startsWith("/approvals"),
    Approvals: pathname.startsWith("/approvals"),
    "Diagnostic Reports (NABL / ISO)": pathname.startsWith("/reports"),
    Reports: pathname.startsWith("/reports"),
    "Reagents & Cold-Chain Inventory": pathname.startsWith("/inventory"),
    "Phlebotomy & Sample Logistics": pathname.startsWith("/logistics"),
    "Diagnostic AI Assistant (CDSS)": pathname.startsWith("/ai-studio"),
    "Laboratory Digital Twin (DES)": pathname.startsWith("/digital-twin"),
    "Critical Alerts & Call Log": pathname.startsWith("/communication"),
    "Clinical Communication": pathname.startsWith("/communication"),
    "WhatsApp & SMS Delivery": pathname.startsWith("/whatsapp"),
    "System Configuration & SOPs": pathname.startsWith("/settings"),
    Settings: pathname.startsWith("/settings"),
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

    if (hrefPath === "/ai-studio" && !hrefQuery) {
      const tab = searchParams.get("tab");
      return pathname === "/ai-studio" && (!tab || tab === "overview");
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
            className={`block relative group overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]/60 p-3 transition-all duration-200 no-underline ${
              isAllowedForRole(SETTINGS_VIEW_ROLES)
                ? "hover:bg-white hover:border-[#0284C7]/50 hover:shadow-xs cursor-pointer"
                : "cursor-default"
            }`}
          >
            <div className="relative z-10 flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] font-bold text-xs text-white shadow-xs overflow-hidden">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    isMounted ? userInitials : 'NP'
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
                  <span className="truncate font-bold text-xs text-[#0F172A] group-hover:text-[#0284C7] transition-colors">
                    {isMounted ? userName : 'Nikil Panchal'}
                  </span>
                  <ShieldCheck className="h-3.5 w-3.5 text-[#059669] shrink-0" />
                </div>

                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-extrabold tracking-wider bg-sky-50 text-[#0284C7] border border-sky-200">
                    {isMounted ? userRole : 'ADMIN'}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-[#ECFDF5] text-[#059669] border border-emerald-200">
                    NABL VERIFIED
                  </span>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#0284C7] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* Micro accreditation footer */}
            <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[9px] text-[#475569]">
              <span className="font-mono tracking-tight text-slate-500">
                NABL-2026-DIR • ISO 15189:2022
              </span>
              <span className="text-[#0284C7] font-bold group-hover:underline">
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
              placeholder="Search clinical modules, tests (⌘K)..."
              className="w-full bg-[#F8FAFC] border border-slate-200/90 text-xs text-[#0F172A] placeholder:text-slate-400 rounded-lg pl-8 pr-7 py-2 focus:outline-none focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/20 transition-all"
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
              <div className="px-2.5 pb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                <span>{section.title}</span>
                {section.badge && (
                  <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
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
                const isMenuOpen = searchQuery ? true : (openMenus[item.label] ?? openMenus[item.name ?? ""] ?? false);
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
                            ? "bg-sky-50/80 border-sky-200/90 text-sky-950 shadow-2xs font-bold"
                            : "border-transparent text-slate-700 hover:text-slate-950 hover:bg-[#F8FAFC] hover:border-slate-200/80 font-medium"
                        }`}
                      >
                        {/* Active Left Indicator Bar */}
                        {isSelected && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#0284C7]" />
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
                            isSelected ? "font-bold text-sky-950" : "font-medium text-slate-700 group-hover:text-slate-900"
                          }`}
                        >
                          {item.label}
                        </span>

                        {/* Real-time Metric Badges */}
                        {/* Patient Hub — live critical + today badges */}
                        {(item.label.includes("Patient") || item.id === "patients") && (
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
                        {(item.label.includes("Approval") || item.label.includes("Pathologist") || item.id === "approvals") && (approvalMetrics.pending > 0 || approvalMetrics.critical > 0) && (
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

                        {(item.label.includes("Invoice") || item.label.includes("Billing") || item.id === "invoices") && invoiceMetrics.pendingAmount > 0 && (
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
                            isMenuOpen ? "rotate-180 text-[#0284C7]" : ""
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
                            ? "bg-sky-50/80 border-sky-200/90 text-sky-950 shadow-2xs font-bold"
                            : "border-transparent text-slate-700 hover:text-slate-950 hover:bg-[#F8FAFC] hover:border-slate-200/80 font-medium"
                        }`}
                      >
                        {/* Active Left Indicator Bar */}
                        {active && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#0284C7]" />
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
                            active ? "font-bold text-sky-950" : "font-medium text-slate-700 group-hover:text-slate-900"
                          }`}
                        >
                          {item.label}
                        </span>

                        {/* Active Dot Indicator */}
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] mr-1" />
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
                                <span className="text-[8.5px] font-extrabold tracking-[0.16em] uppercase text-slate-400">
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
                                      ? "text-[#0284C7] bg-sky-50/90 font-bold"
                                      : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-100/70"
                                  }`}
                                >
                                  <span className="truncate">{child.label}</span>
                                  <ChevronDown
                                    className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                                      isChildMenuOpen ? "rotate-180 text-[#0284C7]" : ""
                                    }`}
                                  />
                                </button>
                              ) : (
                                <Link
                                  href={child.href}
                                  onClick={onClose}
                                  className={`group/sub min-h-[32px] flex items-center justify-between px-2.5 py-1 rounded-md no-underline text-xs transition-all duration-150 ${
                                    childIsActive
                                      ? "text-[#0284C7] bg-sky-50/90 font-bold border-l-2 border-[#0284C7] pl-2"
                                      : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-100/70"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${
                                        childIsActive
                                          ? "bg-[#0284C7] scale-110"
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
                                            : child.badgeVariant === "teal"
                                            ? "bg-teal-50 text-[#0F766E] border border-teal-200"
                                            : "bg-sky-50 text-[#0284C7] border border-sky-200"
                                        }`}
                                      >
                                        {child.badge}
                                      </span>
                                    )}

                                    {/* Approval module badges */}
                                    {(child.label.includes("Critical") || child.label.includes("Panic")) && approvalMetrics.critical > 0 && !child.liveKey && (
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
                                            ? "text-[#0284C7] bg-sky-50/80 font-bold"
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
        <div className="p-3 border-t border-slate-200/90 bg-white relative z-10 space-y-2">
          {/* LIS Core Telemetry Status Pill */}
          <div className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]"></span>
              </span>
              <span className="font-bold text-[#0F172A]">LIS Core Engine</span>
            </div>
            <span className="text-[9px] font-mono font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-emerald-200">
              ASTM / HL7 ONLINE
            </span>
          </div>

          {/* Settings & Logout buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            {isAllowedForRole(SETTINGS_VIEW_ROLES) && (
              <Link
                href="/settings"
                onClick={onClose}
                className="flex-1 min-h-[36px] flex items-center justify-center gap-1.5 px-2.5 rounded-lg text-slate-700 hover:text-[#0284C7] bg-[#F8FAFC] hover:bg-sky-50 text-xs no-underline transition-all border border-slate-200/90 hover:border-sky-300 shadow-2xs font-semibold"
                title="System Configuration & SOPs"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#0284C7]" />
                <span>Settings</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={`${isAllowedForRole(SETTINGS_VIEW_ROLES) ? "flex-1" : "w-full"} min-h-[36px] flex items-center justify-center gap-1.5 px-2.5 rounded-lg text-rose-600 hover:text-rose-700 bg-[#F8FAFC] hover:bg-rose-50 text-xs border border-slate-200/90 hover:border-rose-300 cursor-pointer transition-all font-semibold shadow-2xs`}
              title="Terminate Secure Session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Logout</span>
            </button>
          </div>

          <div className="px-1 pt-1 flex items-center justify-between text-[9px] text-[#475569] font-mono">
            <span>LabCore ELIS v2.4</span>
            <span className="text-[#0284C7] font-bold">NABL ISO 15189</span>
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
