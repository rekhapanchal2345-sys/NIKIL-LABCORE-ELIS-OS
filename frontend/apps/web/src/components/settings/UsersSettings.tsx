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
  Sparkles,
  Stethoscope,
  Search,
  Plus,
  ShieldCheck,
  AlertCircle,
  ExternalLink
} from "lucide-react";

interface UsersSettingsProps {
  subSection?: string;
  saving?: boolean;
  initialValues?: any;
  initialRoles?: any[];
  onSave?: (data: any) => void;
}

export default function UsersSettings({
  subSection,
  saving,
  initialValues,
  initialRoles,
  onSave,
}: UsersSettingsProps = {}) {
  const getSubTabFromSubSection = (sub?: string): "directory" | "roles" | "signatures" | "roster" | "mci" => {
    if (sub === "staff-signatures") return "signatures";
    if (sub === "staff-rbac") return "roles";
    if (sub === "staff-roster") return "roster";
    if (sub === "staff-mci") return "mci";
    return "directory";
  };

  const [activeSubTab, setActiveSubTab] = useState<
    "directory" | "roles" | "signatures" | "roster" | "mci"
  >(() => getSubTabFromSubSection(subSection));

  React.useEffect(() => {
    if (subSection) {
      setActiveSubTab(getSubTabFromSubSection(subSection));
    }
  }, [subSection]);

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
          {/* Tab 5: MCI/NMC Doctor Credentials */}
          <button
            type="button"
            onClick={() => setActiveSubTab("mci")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              activeSubTab === "mci"
                ? "bg-white text-sky-800 shadow-sm border border-slate-200/90 ring-1 ring-slate-900/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Stethoscope className={`h-4 w-4 ${activeSubTab === "mci" ? "text-sky-600" : "text-slate-500"}`} />
            <span>NMC / MCI Doctor Credentials</span>
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
      {activeSubTab === "mci" && <MciCredentialVaultView />}
    </div>
  );
}

// ─── NMC / MCI Doctor Credentials & Diagnostic Authority Vault ──────────────
function MciCredentialVaultView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL");

  const DOCTORS = [
    {
      id: "doc-1",
      name: "Dr. A.K. Verma",
      designation: "Chief Pathologist and Lab Director",
      qualifications: "MBBS, MD (Pathology), DCP",
      council: "Gujarat Medical Council",
      registrationNo: "G-48291",
      yearOfReg: "2008",
      validUntil: "2028-12-31",
      status: "ACTIVE",
      signingScope: ["Biochemistry", "Hematology", "Clinical Pathology", "Histopathology"],
      digitalCertStatus: "LINKED_VALID",
      goodStanding: true,
    },
    {
      id: "doc-2",
      name: "Dr. Sneha Patel",
      designation: "Senior Consultant Pathologist",
      qualifications: "MBBS, MD (Pathology), DNB",
      council: "Gujarat Medical Council",
      registrationNo: "G-52104",
      yearOfReg: "2014",
      validUntil: "2029-06-30",
      status: "ACTIVE",
      signingScope: ["Hematology", "Immunoassay", "Cytology", "Coagulation"],
      digitalCertStatus: "LINKED_VALID",
      goodStanding: true,
    },
    {
      id: "doc-3",
      name: "Dr. Rajesh Sharma",
      designation: "Head of Clinical Microbiology",
      qualifications: "MBBS, MD (Microbiology)",
      council: "National Medical Commission (NMC)",
      registrationNo: "NMC-2016-0941",
      yearOfReg: "2016",
      validUntil: "2027-03-31",
      status: "ACTIVE",
      signingScope: ["Bacteriology", "Mycology", "Molecular Biology", "RT-PCR / NAAT"],
      digitalCertStatus: "LINKED_VALID",
      goodStanding: true,
    },
    {
      id: "doc-4",
      name: "Dr. Priya Kumar",
      designation: "Senior Radiologist",
      qualifications: "MBBS, DMRD, DNB (Radiodiagnosis)",
      council: "Gujarat Medical Council",
      registrationNo: "G-39810",
      yearOfReg: "2010",
      validUntil: "2028-09-30",
      status: "ACTIVE",
      signingScope: ["Ultrasound / Doppler", "X-Ray Reporting", "CT Scan", "MRI"],
      digitalCertStatus: "LINKED_VALID",
      goodStanding: true,
    },
  ];

  const filteredDoctors = DOCTORS.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.council.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === "ALL" ||
      doc.signingScope.some((s) => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified Signatories</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{DOCTORS.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">NMC / State Registered</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Good Standing</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">100%</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Council verified and clean</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Digital Tokens Linked</p>
          <p className="text-2xl font-black text-sky-900 mt-1">4 / 4</p>
          <p className="text-[11px] text-sky-600 mt-0.5">Class-3 DSC / PIN active</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">NABL Scope Covered</p>
          <p className="text-2xl font-black text-violet-900 mt-1">All 5</p>
          <p className="text-[11px] text-violet-600 mt-0.5">Biochem, Hem, Micro, Histo, Radio</p>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        {/* Header with Search and Filters */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Medical Practitioner Credential and Sign-off Authority Vault</h3>
                <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">
                  NMC and NABL Cl. 5.1
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Maintains immutable records of state medical council registrations, qualifications, and authorized report release scopes.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by doctor name, council reg no (e.g. G-48291), or council..."
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="ALL">All Diagnostic Scopes</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Hematology">Hematology</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Histopathology">Histopathology</option>
              <option value="Ultrasound">Radiology and Imaging</option>
            </select>
          </div>
        </div>

        {/* Doctor Credential List */}
        <div className="divide-y divide-slate-100">
          {filteredDoctors.map((doc) => (
            <div key={doc.id} className="p-5 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-700 font-bold text-sm shadow-sm">
                    {doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                      <span className="rounded bg-slate-100 text-slate-700 px-1.5 py-0.2 text-[10px] font-mono font-semibold border border-slate-200">
                        {doc.qualifications}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-extrabold uppercase">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                        Good Standing
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{doc.designation}</p>

                    {/* Council Registration Details */}
                    <div className="mt-2.5 flex items-center gap-4 flex-wrap text-[11px] text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-400 uppercase text-[9px] block">Medical Council</span>
                        <span className="font-medium text-slate-800">{doc.council}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400 uppercase text-[9px] block">Reg Number</span>
                        <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                          {doc.registrationNo}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400 uppercase text-[9px] block">Registered Since</span>
                        <span className="font-medium text-slate-700">{doc.yearOfReg}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400 uppercase text-[9px] block">Validity Until</span>
                        <span className="font-medium text-slate-700">{doc.validUntil}</span>
                      </div>
                    </div>

                    {/* Authorized Diagnostic Scope */}
                    <div className="mt-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Authorized Sign-off Disciplines
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {doc.signingScope.map((scope) => (
                          <span
                            key={scope}
                            className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-semibold border border-slate-200"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 text-[10px] font-bold">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    DSC Token Active
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    SHA-256 PIN Vault
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
