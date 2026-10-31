"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Building2,
  FlaskConical,
  Users,
  CreditCard,
  Cpu,
  ShieldCheck,
  Search,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Activity,
  Clock,
  Award,
  Barcode,
  AlertCircle,
  KeyRound,
  FileSignature,
  UserCog,
  LayoutGrid,
  Zap,
  Landmark,
  Banknote,
  QrCode,
  Network,
  Wifi,
  ScanLine,
  Microscope,
  Printer,
  FileText,
  Lock,
  Database,
  CloudUpload,
  ScrollText,
  FileCheck,
  Hotel,
  Hourglass,
  Tag,
} from "lucide-react";
import type { SettingsDomain } from "@/types/settings";

// ─── Icon Map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  FlaskConical,
  Users,
  CreditCard,
  Cpu,
  ShieldCheck,
  Search,
  Stethoscope,
  Activity,
  Clock,
  Award,
  Barcode,
  AlertCircle,
  KeyRound,
  FileSignature,
  UserCog,
  LayoutGrid,
  Zap,
  Landmark,
  Banknote,
  QrCode,
  Network,
  Wifi,
  ScanLine,
  Microscope,
  Printer,
  FileText,
  Lock,
  Database,
  CloudUpload,
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Hotel,
  Hourglass,
  Tag,
};

// ─── Navigation Data ──────────────────────────────────────────────────────────
export interface NavItem {
  id: string;
  domain: SettingsDomain;
  label: string;
  sublabel: string;
  iconName: string;
  badge?: string;
  badgeVariant?: "blue" | "green" | "amber" | "red";
  verified?: boolean;
}

export interface DomainGroup {
  domain: SettingsDomain;
  domainLabel: string;
  iconName: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  items: NavItem[];
}

export const SETTINGS_DOMAIN_GROUPS: DomainGroup[] = [
  {
    domain: "facility",
    domainLabel: "Facility & Operations",
    iconName: "Building2",
    accentBg: "bg-sky-50",
    accentText: "text-sky-700",
    accentBorder: "border-sky-200",
    items: [
      {
        id: "facility-identity",
        domain: "facility",
        label: "Facility Identity",
        sublabel: "Legal name, CEA Reg, HFR ID, Geo",
        iconName: "Building2",
        verified: true,
      },
      {
        id: "facility-timings",
        domain: "facility",
        label: "OPD / IPD Timings & Shifts",
        sublabel: "Roster, Cutoffs, 24×7 Emergency",
        iconName: "Clock",
      },
      {
        id: "facility-departments",
        domain: "facility",
        label: "Departments & Physical Units",
        sublabel: "Biochem, Hematology, ICU, NICU, Beds",
        iconName: "LayoutGrid",
      },
      {
        id: "facility-branches",
        domain: "facility",
        label: "Branch & Collection Centers",
        sublabel: "Multi-branch, Satellite Labs",
        iconName: "Network",
        badge: "Multi-site",
        badgeVariant: "blue",
      },
      {
        id: "facility-consent",
        domain: "facility",
        label: "Consent & MLC Registry",
        sublabel: "Medicolegal, POCSO, Consent Forms",
        iconName: "FileCheck",
      },
      {
        id: "facility-wards",
        domain: "facility",
        label: "Ward & Bed Management",
        sublabel: "IPD Wards, ICU, NICU, Occupancy",
        iconName: "Hotel",
      },
    ],
  },
  {
    domain: "diagnostic",
    domainLabel: "Diagnostic & Lab Governance",
    iconName: "FlaskConical",
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-700",
    accentBorder: "border-emerald-200",
    items: [
      {
        id: "diagnostic-accreditation",
        domain: "diagnostic",
        label: "Accreditation & NABL/NABH",
        sublabel: "ISO 15189:2022, Scope, CAP, CLIA",
        iconName: "Award",
        badge: "NABL",
        badgeVariant: "green",
        verified: true,
      },
      {
        id: "diagnostic-iqc",
        domain: "diagnostic",
        label: "IQC & Westgard Rules",
        sublabel: "1:2s, 1:3s, 2:2s, R:4s, Levey-Jennings",
        iconName: "Activity",
      },
      {
        id: "diagnostic-eqas",
        domain: "diagnostic",
        label: "EQAS / Proficiency Testing",
        sublabel: "CMC, AIIMS, Bio-Rad EQAS enrolment",
        iconName: "Microscope",
      },
      {
        id: "diagnostic-panic",
        domain: "diagnostic",
        label: "Panic & Critical Value SLAs",
        sublabel: "Thresholds, 15-min SLA, Auto-escalation",
        iconName: "AlertCircle",
        badge: "Critical",
        badgeVariant: "red",
      },
      {
        id: "diagnostic-delta",
        domain: "diagnostic",
        label: "Delta Check Configuration",
        sublabel: "% variance, 48/72h window, Hold/Flag",
        iconName: "Zap",
      },
      {
        id: "diagnostic-barcode",
        domain: "diagnostic",
        label: "Specimen & Barcode Engine",
        sublabel: "Code128, GS1-128, Tube Colors, Prefix",
        iconName: "Barcode",
      },
      {
        id: "diagnostic-tat",
        domain: "diagnostic",
        label: "TAT & Workflow Rules",
        sublabel: "Sample to Report turnaround SLAs",
        iconName: "Hourglass",
      },
    ],
  },
  {
    domain: "staff",
    domainLabel: "Staff, Roles & Signatures",
    iconName: "Users",
    accentBg: "bg-violet-50",
    accentText: "text-violet-700",
    accentBorder: "border-violet-200",
    items: [
      {
        id: "staff-signatures",
        domain: "staff",
        label: "Digital Signature & Stamp Vault",
        sublabel: "Encrypted sign-off, PIN/Bio auth, MCI Reg",
        iconName: "FileSignature",
        verified: true,
      },
      {
        id: "staff-rbac",
        domain: "staff",
        label: "Role-Based Access Control",
        sublabel: "Permission matrix, Hierarchical RBAC",
        iconName: "KeyRound",
        badge: "RBAC",
        badgeVariant: "blue",
      },
      {
        id: "staff-roster",
        domain: "staff",
        label: "Duty Roster & Delegation",
        sublabel: "On-call, Shift handover, Leaves",
        iconName: "UserCog",
      },
      {
        id: "staff-mci",
        domain: "staff",
        label: "MCI/NMC Credential Vault",
        sublabel: "Doctor Reg, Council No., SMC/IMC",
        iconName: "Award",
      },
    ],
  },
  {
    domain: "billing",
    domainLabel: "Billing, Tariffs & Insurance",
    iconName: "CreditCard",
    accentBg: "bg-amber-50",
    accentText: "text-amber-700",
    accentBorder: "border-amber-200",
    items: [
      {
        id: "billing-tariffs",
        domain: "billing",
        label: "Tariff Schedules & Rate Lists",
        sublabel: "Walk-in, IPD, TPA, Corporate, CGHS",
        iconName: "Landmark",
      },
      {
        id: "billing-tax",
        domain: "billing",
        label: "GST / SAC Codes & Tax Rules",
        sublabel: "SAC 9993, GSTIN, PAN, TAN, FY Prefix",
        iconName: "ScrollText",
      },
      {
        id: "billing-schemes",
        domain: "billing",
        label: "Govt Schemes & TPA Insurance",
        sublabel: "CGHS, ECHS, AB-PMJAY, State Cards",
        iconName: "Stethoscope",
        badge: "PM-JAY",
        badgeVariant: "amber",
      },
      {
        id: "billing-payments",
        domain: "billing",
        label: "Payment Gateways & POS",
        sublabel: "UPI QR, PineLabs, Razorpay, Paytm",
        iconName: "QrCode",
      },
      {
        id: "billing-concession",
        domain: "billing",
        label: "Concession & Discount Rules",
        sublabel: "Staff, Senior Citizen, BPL, Bulk",
        iconName: "Tag",
      },
    ],
  },
  {
    domain: "hardware",
    domainLabel: "Hardware & Interoperability",
    iconName: "Cpu",
    accentBg: "bg-indigo-50",
    accentText: "text-indigo-700",
    accentBorder: "border-indigo-200",
    items: [
      {
        id: "hardware-analyzers",
        domain: "hardware",
        label: "Analyzer Interfacing (ASTM/HL7)",
        sublabel: "Mindray, Sysmex, Roche, Beckman, Abbott",
        iconName: "ScanLine",
      },
      {
        id: "hardware-hl7",
        domain: "hardware",
        label: "HL7 v2.5 Message Handlers",
        sublabel: "ADT, ORM, ORU — MLLP Engine",
        iconName: "Network",
      },
      {
        id: "hardware-fhir",
        domain: "hardware",
        label: "FHIR R4 & ABDM Integration",
        sublabel: "DiagnosticReport, Patient, Specimen",
        iconName: "Wifi",
      },
      {
        id: "hardware-pacs",
        domain: "hardware",
        label: "PACS / DICOM Bridge",
        sublabel: "MWL, SCU/SCP, AE Title, DICOM Store",
        iconName: "Database",
      },
      {
        id: "hardware-lrs",
        domain: "hardware",
        label: "Label & Report Printers",
        sublabel: "Zebra, TSC, HP — Tray/Bin Mapping",
        iconName: "Printer",
      },
    ],
  },
  {
    domain: "security",
    domainLabel: "Stationery, Security & Audit",
    iconName: "ShieldCheck",
    accentBg: "bg-slate-50",
    accentText: "text-slate-700",
    accentBorder: "border-slate-200",
    items: [
      {
        id: "security-report-layout",
        domain: "security",
        label: "Report Canvas & Print Setup",
        sublabel: "Header/Footer mm, QR position, Watermark",
        iconName: "Printer",
      },
      {
        id: "security-audit",
        domain: "security",
        label: "Security Policy & Session",
        sublabel: "HIPAA, DISHA, DPDP, MFA, Idle Timeout",
        iconName: "Lock",
        badge: "Compliance",
        badgeVariant: "blue",
        verified: true,
      },
      {
        id: "security-backup",
        domain: "security",
        label: "Backup & Disaster Recovery",
        sublabel: "AES-256, S3/NAS, SHA-256 Integrity",
        iconName: "CloudUpload",
        badge: "Daily",
        badgeVariant: "green",
      },
      {
        id: "security-auditlog",
        domain: "security",
        label: "Immutable Audit Log Viewer",
        sublabel: "Every change: User, IP, Before/After",
        iconName: "ScrollText",
      },
      {
        id: "security-consent-log",
        domain: "security",
        label: "Consent & eSign Audit Trail",
        sublabel: "Timestamp, IP, Witness, Version",
        iconName: "FileSignature",
      },
    ],
  },
];

// Flatten all items for search
export const ALL_NAV_ITEMS: NavItem[] = SETTINGS_DOMAIN_GROUPS.flatMap((g) =>
  g.items
);

export function isValidNavItemId(id: string): boolean {
  return ALL_NAV_ITEMS.some((item) => item.id === id);
}

// ─── Badge Component ──────────────────────────────────────────────────────────
function NavBadge({
  text,
  variant,
}: {
  text: string;
  variant: NavItem["badgeVariant"];
}) {
  const cls = {
    blue: "bg-sky-50 text-sky-700 border border-sky-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-red-50 text-red-700 border border-red-200",
  }[variant || "blue"];
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${cls}`}
    >
      {text}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SettingsNavigationProps {
  activeItemId: string;
  onItemSelect: (itemId: string, domain: SettingsDomain) => void;
  isDirty?: boolean;
  dirtySection?: string;
  facilityName?: string;
  nablStatus?: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "APPLIED";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SettingsNavigation({
  activeItemId,
  onItemSelect,
  isDirty = false,
  dirtySection,
  facilityName = "LabCore Central Lab",
  nablStatus = "ACTIVE",
}: SettingsNavigationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedDomains, setCollapsedDomains] = useState<
    Record<string, boolean>
  >({});
  const searchRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Cmd/Ctrl+K focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Keyboard navigation: arrow keys between nav items, Enter to select
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!navRef.current) return;
      const buttons = Array.from(
        navRef.current.querySelectorAll<HTMLButtonElement>("button[data-navitem]")
      );
      if (!buttons.length) return;
      const focusedIndex = buttons.findIndex((b) => b === document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = buttons[(focusedIndex + 1) % buttons.length];
        next?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = buttons[(focusedIndex - 1 + buttons.length) % buttons.length];
        prev?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleDomain = useCallback((domain: string) => {
    setCollapsedDomains((prev) => ({ ...prev, [domain]: !prev[domain] }));
  }, []);

  const clearSearch = () => setSearchQuery("");

  // Fuzzy filter
  const filteredGroups = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SETTINGS_DOMAIN_GROUPS;
    return SETTINGS_DOMAIN_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.sublabel.toLowerCase().includes(q) ||
          group.domainLabel.toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0);
  }, [searchQuery]);

  const totalItems = SETTINGS_DOMAIN_GROUPS.reduce(
    (acc, g) => acc + g.items.length,
    0
  );

  const nablBadgeClass =
    nablStatus === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : nablStatus === "EXPIRED"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <aside
      className="flex flex-col h-full w-full bg-white"
      aria-label="Settings navigation sidebar"
    >
      {/* ── Facility Header ─────────────────────────────────── */}
      <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-700 text-white"
            aria-hidden="true"
          >
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              System Settings
            </p>
            <p className="text-xs font-bold text-slate-900 truncate leading-tight">
              {facilityName}
            </p>
          </div>
        </div>

        {/* NABL Status Badge */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${nablBadgeClass}`}
            aria-label={`NABL status: ${nablStatus}`}
          >
            <CheckCircle2 className="h-3 w-3" />
            NABL {nablStatus}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {totalItems} modules
          </span>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────── */}
      <div className="px-3 py-3 border-b border-slate-100 shrink-0">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={searchRef}
            type="text"
            role="searchbox"
            aria-label="Search settings modules"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-8 text-sm text-slate-900 placeholder:text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors duration-150"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded bg-slate-100 px-1 py-0.5 text-[9px] font-mono text-slate-500 border border-slate-200">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* ── Navigation List ─────────────────────────────────── */}
      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto py-2"
        aria-label="Settings navigation"
        role="navigation"
      >
        {filteredGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Search className="h-8 w-8 text-slate-300 mb-2" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-500">
              No settings found
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Try a different search term
            </p>
          </div>
        )}

        {filteredGroups.map((group) => {
          const DomainIcon = ICON_MAP[group.iconName] || Building2;
          const isCollapsed = collapsedDomains[group.domain];
          const hasActiveItem = group.items.some(
            (item) => item.id === activeItemId
          );

          return (
            <div key={group.domain} className="mb-0.5">
              {/* Domain Group Header */}
              <button
                type="button"
                onClick={() => toggleDomain(group.domain)}
                aria-expanded={!isCollapsed}
                aria-controls={`nav-group-${group.domain}`}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50 ${hasActiveItem ? "bg-slate-50/80" : ""}`}
              >
                <DomainIcon
                  className={`h-3.5 w-3.5 shrink-0 ${hasActiveItem ? "text-sky-600" : "text-slate-400"}`}
                  aria-hidden="true"
                />
                <span
                  className={`flex-1 text-[10px] font-bold uppercase tracking-widest ${hasActiveItem ? "text-slate-700" : "text-slate-500"}`}
                >
                  {group.domainLabel}
                </span>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-100 rounded px-1 py-0.5 mr-1">
                  {group.items.length}
                </span>
                {isCollapsed ? (
                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronUp className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                )}
              </button>

              {/* Nav Items */}
              {!isCollapsed && (
                <div id={`nav-group-${group.domain}`} className="pb-1" role="group" aria-label={group.domainLabel}>
                  {group.items.map((item) => {
                    const ItemIcon = ICON_MAP[item.iconName] || FileText;
                    const isActive = item.id === activeItemId;
                    const isDirtyHere = isDirty && dirtySection === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-navitem
                        onClick={() => onItemSelect(item.id, item.domain)}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={`${item.label}: ${item.sublabel}`}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all duration-100 border-l-2 ${
                          isActive
                            ? "border-l-sky-700 bg-sky-50 text-sky-900"
                            : "border-l-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-l-slate-300"
                        }`}
                      >
                        {/* Icon box */}
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            isActive
                              ? "bg-sky-700 border-sky-700 text-white"
                              : "bg-white border-slate-200 text-slate-500"
                          }`}
                          aria-hidden="true"
                        >
                          <ItemIcon className="h-3.5 w-3.5" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-xs leading-tight font-semibold ${isActive ? "text-sky-900" : "text-slate-700"}`}
                            >
                              {item.label}
                            </span>
                            {item.badge && (
                              <NavBadge
                                text={item.badge}
                                variant={item.badgeVariant}
                              />
                            )}
                            {item.verified && (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" aria-label="Verified" />
                            )}
                            {isDirtyHere && (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"
                                aria-label="Unsaved changes"
                              />
                            )}
                          </div>
                          <p
                            className={`text-[10px] leading-tight mt-0.5 truncate ${isActive ? "text-sky-600/70" : "text-slate-400"}`}
                          >
                            {item.sublabel}
                          </p>
                        </div>

                        {isActive && (
                          <ChevronRight className="h-3.5 w-3.5 text-sky-500 shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40 shrink-0">
        <p className="text-[10px] text-slate-400 font-mono text-center">
          LabCore ELIS-OS v3.2 PRO
          <br />
          <span className="text-[9px]">ISO 15189:2022 • NABH • DPDP Act 2023</span>
        </p>
      </div>
    </aside>
  );
}
