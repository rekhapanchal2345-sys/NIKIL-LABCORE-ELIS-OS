"use client";

import React from "react";
import {
  User,
  Sliders,
  Users,
  Building2,
  CreditCard,
  Bell,
  ShieldCheck,
  Cpu,
  Terminal,
  Archive,
  Palette,
  HardDriveDownload,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type SettingsTab =
  | "profile"
  | "general"
  | "users"
  | "laboratory"
  | "billing"
  | "notifications"
  | "security"
  | "integrations"
  | "advanced"
  | "data_retention"
  | "branding"
  | "backup";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

interface TabDefinition {
  id: SettingsTab;
  code: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  verified?: boolean;
}

export const SETTINGS_TAB_DEFINITIONS: TabDefinition[] = [
  {
    id: "profile",
    code: "01",
    label: "Doctor / Staff Profile",
    sublabel: "Credentials & Sign-off",
    icon: User,
    verified: true,
  },
  {
    id: "laboratory",
    code: "02",
    label: "Lab & Accreditation",
    sublabel: "NABL • NABH • Barcodes",
    icon: Building2,
    badge: "NABL",
    verified: true,
  },
  {
    id: "general",
    code: "03",
    label: "Facility & OPD Setup",
    sublabel: "Hospital • Clinic • Timings",
    icon: Sliders,
  },
  {
    id: "users",
    code: "04",
    label: "Staff, Roles & Roster",
    sublabel: "Directory • Shifts • Stamp Vault",
    icon: Users,
  },
  {
    id: "billing",
    code: "05",
    label: "Billing, Tariffs & Taxes",
    sublabel: "SAC 9993 • TPA • Discounts",
    icon: CreditCard,
  },
  {
    id: "notifications",
    code: "06",
    label: "Clinical Alerts & Dispatch",
    sublabel: "Panic SLA • WhatsApp • DLT",
    icon: Bell,
    badge: "Live",
  },
  {
    id: "security",
    code: "07",
    label: "Security, 2FA & Audit",
    sublabel: "DPDP • HIPAA • Sessions",
    icon: ShieldCheck,
    verified: true,
  },
  {
    id: "branding",
    code: "08",
    label: "Report Letterhead & Print",
    sublabel: "A4 Dossier • NABL Crest",
    icon: Palette,
  },
  {
    id: "integrations",
    code: "09",
    label: "Analyzers, HL7 & ABDM",
    sublabel: "ASTM • MLLP • PACS • HFR",
    icon: Cpu,
  },
  {
    id: "data_retention",
    code: "10",
    label: "Specimen & Record Archival",
    sublabel: "Serum • Blocks • EMR Lifecycle",
    icon: Archive,
  },
  {
    id: "backup",
    code: "11",
    label: "Disaster Recovery & Vault",
    sublabel: "AES-256 Snapshot • S3/NAS",
    icon: HardDriveDownload,
    badge: "Daily",
  },
  {
    id: "advanced",
    code: "12",
    label: "System Engine & Capacity",
    sublabel: "Session • Rate Limit • Logs",
    icon: Terminal,
  },
];

export const SETTINGS_TABS: readonly SettingsTab[] = SETTINGS_TAB_DEFINITIONS.map(
  (tab) => tab.id
);

export function isSettingsTab(value: string | null): value is SettingsTab {
  return value !== null && (SETTINGS_TABS as readonly string[]).includes(value);
}

export default function SettingsTabs({
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  const navRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (navRef.current) {
      const activeEl = navRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeTab]);

  const scroll = (direction: "left" | "right") => {
    if (navRef.current) {
      const amount = direction === "left" ? -280 : 280;
      navRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] overflow-hidden group">
      {/* Clinical Top Accent Line */}
      <div
        className="h-0.5 w-full bg-gradient-to-r from-sky-700 via-cyan-500 to-sky-700"
        aria-hidden="true"
      />

      <div className="relative px-2 py-2 bg-slate-50/60">
        {/* Scroll Left Arrow */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 cursor-pointer"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <nav
          ref={navRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-1"
          aria-label="Clinical settings navigation"
          role="tablist"
        >
          {SETTINGS_TAB_DEFINITIONS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-active={active}
                onClick={() => onTabChange(tab.id)}
                className={`group/tab relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left transition-all duration-150 cursor-pointer border ${
                  active
                    ? "bg-white text-slate-900 border-sky-700 shadow-sm ring-2 ring-sky-500/10"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {/* Icon box — 32×32 */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                    active
                      ? "bg-sky-700 text-white border-sky-700"
                      : "bg-white text-slate-500 border-slate-200 group-hover/tab:text-sky-700 group-hover/tab:border-sky-200 group-hover/tab:bg-sky-50/60"
                  }`}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {/* Code pill */}
                    <span
                      className={`text-[9px] font-bold px-1 rounded ${
                        active
                          ? "bg-sky-50 text-sky-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {tab.code}
                    </span>
                    {/* Label */}
                    <span
                      className={`text-[11px] font-bold whitespace-nowrap ${
                        active ? "text-slate-900" : "text-slate-700"
                      }`}
                    >
                      {tab.label}
                    </span>

                    {tab.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase border ${
                          active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}

                    {tab.verified && (
                      <CheckCircle2
                        className={`h-3.5 w-3.5 shrink-0 ${
                          active ? "text-emerald-600" : "text-emerald-600/70"
                        }`}
                        aria-label="Verified"
                      />
                    )}
                  </div>
                  {/* Sublabel */}
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">
                    {tab.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Scroll Right Arrow */}
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 cursor-pointer"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
