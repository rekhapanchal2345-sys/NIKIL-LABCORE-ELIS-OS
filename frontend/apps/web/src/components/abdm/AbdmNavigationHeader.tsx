"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Activity,
  QrCode,
  Users,
  FileText,
  Link as LinkIcon,
  Database,
  Terminal,
  BadgeCheck,
  RefreshCw,
  Building2,
  Clock,
  Wifi,
  Sliders,
  Sparkles,
  ChevronRight,
  UserCheck,
  Plus,
  Printer,
  Hospital,
  Microscope,
  Stethoscope,
  Pill,
} from "lucide-react";

export type FacilityProfileType = "HOSPITAL" | "LAB" | "CLINIC" | "PHARMACY";

export type AbdmTabType =
  | "overview"
  | "scan-share"
  | "abha-m1"
  | "care-context-m2"
  | "consents-hiu"
  | "fhir-m3"
  | "bulk-verify"
  | "report-stamp"
  | "simulator";

export interface FacilityProfile {
  key?: FacilityProfileType;
  name: string;
  category: string;
  hfrId: string;
  hipId: string;
  hiuId: string;
  accreditation: string;
  counters: Array<{ id: string; name: string; dept: string }>;
  tagline?: string;
}

export interface AbdmNavigationHeaderProps {
  activeTab: AbdmTabType;
  onTabChange: (tab: AbdmTabType) => void;
  facilityProfileKey: FacilityProfileType;
  onFacilityProfileChange: (key: FacilityProfileType) => void;
  facilityProfiles: Record<FacilityProfileType, FacilityProfile>;
  currentProfile: FacilityProfile;
  gatewayPing: number;
  pinging: boolean;
  onPingGateway: () => void;
  tokenTtlSeconds: number;
  onRefreshToken: () => void;
  stats: {
    totalAbhaPatients: number;
    totalCareContexts: number;
    totalConsents: number;
    totalTransactions: number;
    gatewayStatus: string;
    lastSync: string;
    todayScanFootfall?: number;
  };
  checkedInWaitingCount?: number;
  onOpenSettings?: () => void;
  onOpenScanQrModal?: () => void;
  onOpenNewEnrollment?: () => void;
  onOpenNewConsent?: () => void;
}

export default function AbdmNavigationHeader({
  activeTab,
  onTabChange,
  facilityProfileKey,
  onFacilityProfileChange,
  facilityProfiles,
  currentProfile,
  gatewayPing,
  pinging,
  onPingGateway,
  tokenTtlSeconds,
  onRefreshToken,
  stats,
  checkedInWaitingCount = 0,
  onOpenSettings,
  onOpenScanQrModal,
  onOpenNewEnrollment,
  onOpenNewConsent,
}: AbdmNavigationHeaderProps) {
  const tabs: Array<{
    id: AbdmTabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeVariant?: "emerald" | "blue" | "purple" | "teal" | "amber" | "slate";
    shortcut: string;
  }> = [
    {
      id: "overview",
      label: "Executive Gateway Hub",
      icon: ShieldCheck,
      badge: "M1·M2·M3",
      badgeVariant: "emerald",
      shortcut: "1",
    },
    {
      id: "scan-share",
      label: "Scan & Share Token Desk",
      icon: QrCode,
      badge: checkedInWaitingCount > 0 ? `${checkedInWaitingCount} Waiting` : "FastTrack",
      badgeVariant: checkedInWaitingCount > 0 ? "amber" : "emerald",
      shortcut: "2",
    },
    {
      id: "abha-m1",
      label: "ABHA M1 Workstation",
      icon: UserCheck,
      badge: "KYC",
      badgeVariant: "purple",
      shortcut: "3",
    },
    {
      id: "care-context-m2",
      label: "Care Context Linker (M2)",
      icon: LinkIcon,
      badge: `${stats.totalCareContexts}`,
      badgeVariant: "teal",
      shortcut: "4",
    },
    {
      id: "consents-hiu",
      label: "Patient Consents & HIU (M3)",
      icon: FileText,
      badge: `${stats.totalConsents}`,
      badgeVariant: "amber",
      shortcut: "5",
    },
    {
      id: "fhir-m3",
      label: "FHIR R4 Diagnostic Bundle (M3)",
      icon: Database,
      badge: "NRCES",
      badgeVariant: "blue",
      shortcut: "6",
    },
    {
      id: "bulk-verify",
      label: "Mega-Camp & Batch Verifier",
      icon: Users,
      badge: "Bulk",
      badgeVariant: "purple",
      shortcut: "7",
    },
    {
      id: "report-stamp",
      label: "Report Stamping & ABDM Seal",
      icon: BadgeCheck,
      badge: "NABL",
      badgeVariant: "teal",
      shortcut: "8",
    },
    {
      id: "simulator",
      label: "NHA Gateway & Webhook Audit",
      icon: Terminal,
      badge: "Audit",
      badgeVariant: "slate",
      shortcut: "9",
    },
  ];

  const getProfileIcon = (key: FacilityProfileType) => {
    switch (key) {
      case "HOSPITAL":
        return <Hospital className="w-3.5 h-3.5 text-blue-600" />;
      case "LAB":
        return <Microscope className="w-3.5 h-3.5 text-emerald-600" />;
      case "CLINIC":
        return <Stethoscope className="w-3.5 h-3.5 text-teal-600" />;
      case "PHARMACY":
        return <Pill className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 md:p-6 transition-all">
      {/* ── Breadcrumb & Global System Route Context ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-800 transition-colors">
            Hospital Core
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">National Digital Health</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-900">ABDM / ADM Module</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
            {tabs.find((t) => t.id === activeTab)?.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            ABDM Version
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200">
            v0.5 HIG &amp; v3.0 Bridge
          </span>
        </div>
      </div>

      {/* ── Main Header Strip: Facility Identity & Telemetry ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Facility Identity & Classification */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/10 shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Ayushman Bharat Digital Mission (ABDM)
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Central Gateway: ONLINE
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Hospital Information Provider (HIP) &amp; Health Information User (HIU) • NHA Sandboxed Interoperability Grid
            </p>

            <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentProfile.name}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500">
                HFR ID: <strong className="text-slate-800">{currentProfile.hfrId}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500">
                HIP: <strong className="text-slate-800">{currentProfile.hipId}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-sky-50 text-sky-800 border border-sky-200">
                {currentProfile.accreditation}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Telemetry, Facility Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Facility Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            {getProfileIcon(facilityProfileKey)}
            <span className="text-xs font-bold text-slate-600">Unit:</span>
            <select
              value={facilityProfileKey}
              onChange={(e) => onFacilityProfileChange(e.target.value as FacilityProfileType)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
            >
              {Object.keys(facilityProfiles).map((k) => (
                <option key={k} value={k}>
                  {facilityProfiles[k as FacilityProfileType].name} ({k})
                </option>
              ))}
            </select>
          </div>

          {/* Gateway Ping Telemetry */}
          <button
            type="button"
            onClick={onPingGateway}
            disabled={pinging}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            title="Ping NHA Gateway API"
          >
            <Wifi className={`w-3.5 h-3.5 ${pinging ? "text-amber-500 animate-spin" : "text-emerald-600"}`} />
            <span>{gatewayPing}ms</span>
          </button>

          {/* Bearer Token TTL & Renewal */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono">
              {Math.floor(tokenTtlSeconds / 60)}:{(tokenTtlSeconds % 60).toString().padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={onRefreshToken}
              className="ml-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              Renew
            </button>
          </div>

          {/* Facility Settings Button */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Configure HFR & HIP Facility Metadata"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Config</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Operational Quick Action Bar (Light Clinical Buttons) ── */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {onOpenScanQrModal ? (
            <button
              type="button"
              onClick={onOpenScanQrModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Generate Counter Token QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-purple-600" />
              <span>Scan &amp; Share QR</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onTabChange("scan-share")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-purple-600" />
              <span>Scan &amp; Share QR</span>
            </button>
          )}

          {onOpenNewEnrollment ? (
            <button
              type="button"
              onClick={onOpenNewEnrollment}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="New ABHA Enrollment via Aadhaar / Mobile"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>New ABHA (M1)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onTabChange("abha-m1")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>New ABHA (M1)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onTabChange("care-context-m2")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5 text-teal-600" />
            <span>Care Contexts ({stats.totalCareContexts})</span>
          </button>

          {onOpenNewConsent ? (
            <button
              type="button"
              onClick={onOpenNewConsent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Request Electronic Patient Consent Artefact"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Request Consent</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onTabChange("consents-hiu")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Request Consent</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onTabChange("report-stamp")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <BadgeCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>NABL Stamping</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Today's Scan Footfall:</span>
          <strong className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
            {stats.todayScanFootfall ?? 42} Patients
          </strong>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs Bar (Light White, Crisp Medical Style) ── */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    tab.badgeVariant === "emerald"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : tab.badgeVariant === "amber"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : tab.badgeVariant === "blue"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : tab.badgeVariant === "purple"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : tab.badgeVariant === "teal"
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
