"use client";

import React, { useState } from "react";
import UsersManagementView from "./UsersManagementView";
import RolesManagementView from "./RolesManagementView";
import DigitalSignaturesVaultView from "./DigitalSignaturesVaultView";
import DutyRosterDelegationView from "./DutyRosterDelegationView";
import {
  Users,
  Shield,
  Award,
  FileSignature,
  Clock,
  Building,
  CheckCircle2,
  Sparkles
} from "lucide-react";

interface UsersSettingsProps {
  saving?: boolean;
  initialValues?: any;
  initialRoles?: any[];
  onSave?: (data: any) => void;
}

export default function UsersSettings({
  saving,
  initialValues,
  initialRoles,
  onSave,
}: UsersSettingsProps = {}) {
  const [activeSubTab, setActiveSubTab] = useState<
    "directory" | "roles" | "signatures" | "roster"
  >("directory");

  return (
    <div className="space-y-6">
      {/* =========================================================
          HOSPITAL / CLINIC INSTITUTIONAL BANNER
          ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-700 shadow-sm">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-slate-900 tracking-tight">
                LabCore Clinical Diagnostic Laboratories
              </span>
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                Central Hospital Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-500 m-0">
              Licensed Clinical Diagnostic Laboratory • Hospital Information System & Digital LIS Integration
            </p>
          </div>
        </div>

        {/* Institutional Accreditation Seals */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
            <Award className="h-3.5 w-3.5 text-emerald-600" />
            <span>NABL ISO 15189:2022 Verified</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-800 border border-indigo-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
            <span>NABH Hospital Lab Standards</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          4-TAB CLINICAL SUB-NAVIGATION SWITCHER (LIGHT THEME)
          ========================================================= */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
          {/* Tab 1: Staff Directory */}
          <button
            type="button"
            onClick={() => setActiveSubTab("directory")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              activeSubTab === "directory"
                ? "bg-white text-sky-800 shadow-sm border border-slate-200/90 ring-1 ring-slate-900/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Users className={`h-4 w-4 ${activeSubTab === "directory" ? "text-sky-600" : "text-slate-500"}`} />
            <span>Staff & Signatories Directory</span>
          </button>

          {/* Tab 2: Roles Matrix */}
          <button
            type="button"
            onClick={() => setActiveSubTab("roles")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              activeSubTab === "roles"
                ? "bg-white text-sky-800 shadow-sm border border-slate-200/90 ring-1 ring-slate-900/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Shield className={`h-4 w-4 ${activeSubTab === "roles" ? "text-sky-600" : "text-slate-500"}`} />
            <span>Clinical Roles & ABAC Matrix</span>
          </button>

          {/* Tab 3: Digital Signatures Vault */}
          <button
            type="button"
            onClick={() => setActiveSubTab("signatures")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              activeSubTab === "signatures"
                ? "bg-white text-sky-800 shadow-sm border border-slate-200/90 ring-1 ring-slate-900/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <FileSignature className={`h-4 w-4 ${activeSubTab === "signatures" ? "text-sky-600" : "text-slate-500"}`} />
            <span>Digital Signatures & NABL Stamp Vault</span>
          </button>

          {/* Tab 4: 24x7 Duty Roster */}
          <button
            type="button"
            onClick={() => setActiveSubTab("roster")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              activeSubTab === "roster"
                ? "bg-white text-sky-800 shadow-sm border border-slate-200/90 ring-1 ring-slate-900/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Clock className={`h-4 w-4 ${activeSubTab === "roster" ? "text-sky-600" : "text-slate-500"}`} />
            <span>24x7 Duty Rosters & Handover</span>
          </button>
        </div>

        {/* Live Active Shift Indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Shift: Morning (8 AM – 4 PM)</span>
          </span>
        </div>
      </div>

      {/* =========================================================
          SUB-TAB CONTENT RENDERING
          ========================================================= */}
      {activeSubTab === "directory" && <UsersManagementView />}
      {activeSubTab === "roles" && <RolesManagementView />}
      {activeSubTab === "signatures" && <DigitalSignaturesVaultView />}
      {activeSubTab === "roster" && <DutyRosterDelegationView />}
    </div>
  );
}