"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Stethoscope,
  Bed,
  FileSignature,
  Microscope,
  Activity,
  CreditCard,
  CalendarDays,
  BarChart3,
  Plus,
  Bike,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export type DoctorModuleTab =
  | "directory"
  | "opd-queue"
  | "ipd-rounds"
  | "prescriptions"
  | "verification"
  | "emr"
  | "referrals"
  | "roster"
  | "analytics";

interface DoctorNavigationHeaderProps {
  activeTab: DoctorModuleTab;
  onTabChange: (tab: DoctorModuleTab) => void;
  kpis: {
    totalDoctors: number;
    activeDoctors: number;
    opdQueueCount: number;
    ipdCount?: number;
    pendingVerifications: number;
    criticalPanics: number;
    monthlyRevenue?: number;
    pendingPayouts?: number;
  };
  onOpenSamplePickup?: () => void;
  onOpenTariffSheet?: () => void;
  onOpenNewRx?: () => void;
  onAddNewDoctor?: () => void;
  onExportCSV?: () => void;
  canAddDoctor?: boolean;
}

export default function DoctorNavigationHeader({
  activeTab,
  onTabChange,
  kpis,
  onOpenSamplePickup,
  onOpenTariffSheet,
  onOpenNewRx,
  onAddNewDoctor,
  onExportCSV,
  canAddDoctor = true,
}: DoctorNavigationHeaderProps) {
  const tabs: Array<{
    id: DoctorModuleTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeVariant?: "red" | "amber" | "emerald" | "blue" | "slate";
  }> = [
    {
      id: "directory",
      label: "Doctor Directory",
      icon: Users,
      badge: kpis.totalDoctors,
      badgeVariant: "blue",
    },
    {
      id: "opd-queue",
      label: "OPD Consultation Queue",
      icon: Stethoscope,
      badge: kpis.opdQueueCount > 0 ? `${kpis.opdQueueCount} Waiting` : undefined,
      badgeVariant: "emerald",
    },
    {
      id: "ipd-rounds",
      label: "IPD Bed Rounds",
      icon: Bed,
      badge: kpis.ipdCount !== undefined && kpis.ipdCount > 0 ? `${kpis.ipdCount} Beds` : "Active",
      badgeVariant: "blue",
    },
    {
      id: "prescriptions",
      label: "E-Prescription & CPOE",
      icon: FileSignature,
      badge: "Rx",
      badgeVariant: "blue",
    },
    {
      id: "verification",
      label: "Pathologist Sign-Off",
      icon: Microscope,
      badge: kpis.criticalPanics > 0 ? `🚨 ${kpis.criticalPanics} Panic` : kpis.pendingVerifications > 0 ? `${kpis.pendingVerifications} Pending` : undefined,
      badgeVariant: kpis.criticalPanics > 0 ? "red" : "amber",
    },
    {
      id: "emr",
      label: "Longitudinal EMR",
      icon: Activity,
      badge: "Trends",
      badgeVariant: "slate",
    },
    {
      id: "referrals",
      label: "Referral Ledger",
      icon: CreditCard,
      badge: kpis.pendingPayouts && kpis.pendingPayouts > 0 ? `₹${(kpis.pendingPayouts / 1000).toFixed(0)}k Due` : undefined,
      badgeVariant: "amber",
    },
    {
      id: "roster",
      label: "Duty Roster & Shifts",
      icon: CalendarDays,
      badge: "Weekly",
      badgeVariant: "slate",
    },
    {
      id: "analytics",
      label: "Practice Analytics",
      icon: BarChart3,
      badge: "KPIs",
      badgeVariant: "slate",
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── Top Clinical Header (Ultra Light White Theme) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 transition-all">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          
          {/* Clinical Title & Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0 text-sky-600 shadow-xs">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Doctor Module & Clinical Operations
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Enterprise Hospital & LIS Suite
                </span>
                {kpis.criticalPanics > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-black border border-rose-200 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    {kpis.criticalPanics} STAT Panic Results Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium max-w-2xl">
                Integrated medical suite for OPD consultations, inpatient rounds, computerized test orders, pathologist authorizations, and B2B referring physician settlements.
              </p>
            </div>
          </div>

          {/* Quick Real-World Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenSamplePickup && (
              <button
                type="button"
                onClick={onOpenSamplePickup}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Schedule Phlebotomy Specimen Pickup"
              >
                <Bike className="w-4 h-4 text-rose-600" />
                <span>Sample Pickup</span>
              </button>
            )}

            {onOpenTariffSheet && (
              <button
                type="button"
                onClick={onOpenTariffSheet}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Diagnostic Rate Master & B2B Tariff Directory"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <span>Rate Master</span>
              </button>
            )}

            {onExportCSV && (
              <button
                type="button"
                onClick={onExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Export Doctor Data"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export CSV</span>
              </button>
            )}

            {onOpenNewRx && (
              <button
                type="button"
                onClick={onOpenNewRx}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Write Electronic Prescription & Order Diagnostics"
              >
                <FileSignature className="w-4 h-4 text-teal-600" />
                <span>New Prescription (Rx)</span>
              </button>
            )}

            {canAddDoctor && onAddNewDoctor && (
              <button
                type="button"
                onClick={onAddNewDoctor}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Register New Doctor or Pathologist"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Register Doctor</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Sub-Navigation Tabs Bar (Light White, Crisp Medical Style) ── */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
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
                      tab.badgeVariant === "red"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : tab.badgeVariant === "amber"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : tab.badgeVariant === "emerald"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : tab.badgeVariant === "blue"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
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
    </div>
  );
}
