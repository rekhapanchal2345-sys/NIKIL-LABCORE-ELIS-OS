"use client";

import React, { useState } from "react";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Stethoscope,
  Upload,
  Eye,
  Key,
  Calendar,
  AlertTriangle,
  Download,
  Fingerprint,
  RefreshCw,
  Search,
  Check,
  X,
  FileSignature,
  Building,
  UserCheck
} from "lucide-react";

export interface SignatoryDoctor {
  id: string;
  name: string;
  degrees: string;
  medicalRegistrationNo: string;
  medicalCouncil: string;
  role: string;
  department: string;
  isPrimarySignatory: boolean;
  signatureStampId: string;
  signatureDate: string;
  signatureValidityUntil: string;
  dscTokenStatus: "PLUGGED_IN" | "NOT_DETECTED" | "HARDWARE_HSM";
  dscTokenSerialNumber: string;
  signatureImageUrl?: string;
  authorizedCategories: string[];
  status: "ACTIVE" | "PENDING_VERIFICATION" | "REVOKED";
}

const INITIAL_SIGNATORIES: SignatoryDoctor[] = [
  {
    id: "sig-001",
    name: "Dr. Jaya Ashapurama",
    degrees: "MD (Pathology), DCP, FICP",
    medicalRegistrationNo: "MCI-2018-88492",
    medicalCouncil: "Medical Council of India / Delhi Medical Council",
    role: "Chief Pathologist & Lab Director",
    department: "Pathology & Molecular Diagnostics",
    isPrimarySignatory: true,
    signatureStampId: "NABL-STAMP-JA-88492",
    signatureDate: "2026-01-15",
    signatureValidityUntil: "2027-01-15",
    dscTokenStatus: "HARDWARE_HSM",
    dscTokenSerialNumber: "eToken-PKI-9844-01A",
    authorizedCategories: [
      "Hematology",
      "Clinical Biochemistry",
      "Histopathology",
      "Cytology",
      "Microbiology",
      "Molecular Diagnostics",
      "Immunology"
    ],
    status: "ACTIVE"
  },
  {
    id: "sig-002",
    name: "Dr. Vikramaditya Sharma",
    degrees: "MD (Pathology), DNB, Oncopathology Fellow",
    medicalRegistrationNo: "MCI-2015-44910",
    medicalCouncil: "Maharashtra Medical Council",
    role: "Senior Consultant Pathologist",
    department: "Histopathology & Immunohistochemistry",
    isPrimarySignatory: false,
    signatureStampId: "NABL-STAMP-VS-44910",
    signatureDate: "2026-02-01",
    signatureValidityUntil: "2027-02-01",
    dscTokenStatus: "PLUGGED_IN",
    dscTokenSerialNumber: "WatchData-PROXKey-7721",
    authorizedCategories: [
      "Histopathology",
      "Cytology",
      "Hematology",
      "Clinical Pathology",
      "Bone Marrow Biopsy"
    ],
    status: "ACTIVE"
  },
  {
    id: "sig-003",
    name: "Dr. Ananya Deshmukh",
    degrees: "MD (Microbiology), CICP",
    medicalRegistrationNo: "MMC-2020-77312",
    medicalCouncil: "Maharashtra Medical Council",
    role: "Consultant Microbiologist & Infection Control Lead",
    department: "Microbiology & Infectious Serology",
    isPrimarySignatory: false,
    signatureStampId: "NABL-STAMP-AD-77312",
    signatureDate: "2026-03-01",
    signatureValidityUntil: "2027-03-01",
    dscTokenStatus: "PLUGGED_IN",
    dscTokenSerialNumber: "Feitian-ePass2003-8812",
    authorizedCategories: [
      "Microbiology Culture & AST",
      "Serology & Viral Load",
      "PCR & Molecular Assays"
    ],
    status: "ACTIVE"
  }
];

export default function DigitalSignaturesVaultView() {
  const [signatories, setSignatories] = useState<SignatoryDoctor[]>(INITIAL_SIGNATORIES);
  const [selectedDoctor, setSelectedDoctor] = useState<SignatoryDoctor>(INITIAL_SIGNATORIES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [toast, setToast] = useState<{ title: string; desc: string; type: "success" | "info" } | null>(null);

  const showToast = (title: string, desc: string, type: "success" | "info" = "success") => {
    setToast({ title, desc, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredSignatories = signatories.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.medicalRegistrationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl text-slate-800 animate-in slide-in-from-bottom-3">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 shadow-md shadow-sky-500/20 text-white">
              <FileSignature className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">
                  NABL Digital Signature & Accreditation Stamp Vault
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  <Award className="h-3.5 w-3.5 text-emerald-600" />
                  ISO 15189:2022 Certified
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Authorized Pathologist digital seals, NMC/MCI registration verification, and automated report sign-off stamps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                showToast("DSC Hardware Scanned", "Checked all USB PKI tokens. 2 Hardware tokens currently detected on workstation.", "info");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              Scan DSC Hardware
            </button>

            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              Register New Signatory Seal
            </button>
          </div>
        </div>

        {/* 3 Overview Metrics */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Active NABL Signatories</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{signatories.length}</span>
              <span className="text-xs font-medium text-emerald-600">All NMC/State Verified</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">DSC PKI Hardware Token</span>
              <Key className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">2 / 3</span>
              <span className="text-xs font-medium text-sky-600">Tokens Online & Bound</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Annual Stamp Expiry SLA</span>
              <Calendar className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">350+ Days</span>
              <span className="text-xs font-medium text-indigo-600">Validity in Good Standing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Signatories List on Left + Live Diagnostic Stamp Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Signatories Directory (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-sky-600" />
                Accredited Diagnostic Signatories
              </h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctor, MCI reg..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredSignatories.map((doc) => {
                const isSelected = selectedDoctor.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? "border-sky-500 bg-sky-50/40 shadow-sm ring-1 ring-sky-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-sm flex-shrink-0">
                          {doc.name.split(" ").slice(1, 3).map((n) => n[0]).join("") || "MD"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 m-0">{doc.name}</h4>
                            {doc.isPrimarySignatory && (
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                Primary Lead
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                            {doc.degrees} • {doc.department}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
                            <span className="font-semibold text-slate-800">
                              Reg: <span className="font-mono text-sky-700 font-bold">{doc.medicalRegistrationNo}</span>
                            </span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Stamp ID: {doc.signatureStampId}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          Active Signatory
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Valid till {doc.signatureValidityUntil}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live NABL Official Diagnostic Stamp Preview (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 m-0">Live Diagnostic Report Stamp</h3>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 font-bold">
                PREVIEW AS RELEASED
              </span>
            </div>

            {/* Simulated Official Report Stamp Box */}
            <div className="rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/20 p-5 text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                NABL ISO 15189 VERIFIED
              </div>

              {/* Simulated Digital Signature Script */}
              <div className="my-4 py-2 border-b border-slate-200">
                <div className="h-16 flex items-center justify-center">
                  <span className="font-serif italic text-2xl font-bold text-blue-900 tracking-wider rotate-[-3deg] select-none">
                    {selectedDoctor.name.replace("Dr. ", "")}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  [Cryptographically Signed via PKI Token]
                </div>
              </div>

              {/* Doctor Details formatted as appears on print/PDF reports */}
              <div className="text-left space-y-1 text-xs">
                <div className="font-bold text-slate-900 text-sm">
                  {selectedDoctor.name}
                </div>
                <div className="text-slate-600 font-medium">
                  {selectedDoctor.degrees}
                </div>
                <div className="text-slate-700 font-semibold">
                  {selectedDoctor.role}
                </div>
                <div className="text-slate-600">
                  Council Reg: <span className="font-mono font-bold text-slate-800">{selectedDoctor.medicalRegistrationNo}</span> ({selectedDoctor.medicalCouncil})
                </div>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/80 mt-2 flex justify-between">
                  <span>Stamp ID: {selectedDoctor.signatureStampId}</span>
                  <span className="text-emerald-700 font-bold">Valid Diagnostic Signatory</span>
                </div>
              </div>
            </div>

            {/* Specimen Category Authorization */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 m-0">Authorized Assay Categories for Sign-Off:</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedDoctor.authorizedCategories.map((cat, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  showToast("Stamp Audit Downloaded", `Diagnostic seal audit dossier for ${selectedDoctor.name} exported.`, "success");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                Audit Dossier
              </button>

              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 transition-all cursor-pointer shadow-sm"
              >
                <Upload className="h-3.5 w-3.5" />
                Update Signature Seal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload / Register Signature Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900 m-0">Upload Doctor Digital Signature</h3>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <p>
                Upload high-resolution transparent PNG of the licensed pathologist handwritten signature.
                The system will automatically generate the NABL-compliant doctor seal block for all laboratory reports.
              </p>

              <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center bg-slate-50 hover:bg-slate-100/60 transition-all cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-sky-600 mb-2" />
                <span className="font-bold text-slate-800 block text-xs">Click to browse signature file</span>
                <span className="text-[11px] text-slate-400">PNG or SVG with transparent background (Max 2MB)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">MCI / NMC Registration Number</label>
                  <input
                    type="text"
                    defaultValue={selectedDoctor.medicalRegistrationNo}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State Medical Council</label>
                  <input
                    type="text"
                    defaultValue={selectedDoctor.medicalCouncil}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadModalOpen(false);
                  showToast("Signature Seal Verified", "New digital report signature saved and accredited.", "success");
                }}
                className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 transition-all cursor-pointer shadow-sm"
              >
                Save & Accredit Stamp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
