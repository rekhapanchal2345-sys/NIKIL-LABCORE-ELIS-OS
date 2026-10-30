"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import RegisterPatientWizard from "@/components/patients/RegisterPatientWizard";
import PatientRegistrationPrintForm from "@/components/patients/PatientRegistrationPrintForm";
import { ClinicalFacilityLogo } from "@/components/patients/PatientSheetLetterhead";
import { ArrowLeft, Printer, ShieldCheck, UserPlus } from "lucide-react";

export default function NewPatientPage() {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(true);
  const [showBlankA4Sheet, setShowBlankA4Sheet] = useState(true);

  return (
    <ProtectedRoute
      requiredRoles={[
        "ADMIN",
        "SUPER_ADMIN",
        "BRANCH_ADMIN",
        "FRONT_DESK",
        "LAB_TECH",
        "DOCTOR",
        "PATHOLOGIST",
      ]}
    >
      <DashboardLayout title="Register New Patient">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/patients"
              className="inline-flex items-center gap-2 text-xs font-semibold text-sky-700 transition-colors hover:text-sky-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Clinical Patient Directory
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBlankA4Sheet((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5 text-sky-700" />
                {showBlankA4Sheet ? "Hide A4 Registration Sheet" : "Preview / Print A4 Registration Sheet"}
              </button>
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284c7] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#0369a1]"
              >
                <UserPlus className="h-3.5 w-3.5" /> Open Digital Intake Wizard
              </button>
            </div>
          </div>

          {/* Hospital / Lab / Clinic Professional Light-White Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-2xs">
            <div className="flex items-center gap-4">
              <ClinicalFacilityLogo size={48} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">
                    Clinical Patient Registration &amp; Master Intake Desk
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                    <ShieldCheck className="h-3.5 w-3.5 text-sky-600" /> NABL ISO 15189 &bull; ABDM / ABHA &bull; DPDP Act 2023
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Hospital, Diagnostic Laboratory &amp; Outpatient Clinic (OPD / IPD) standardized patient registration with instant A4 printable intake record.
                </p>
              </div>
            </div>
          </div>

          {showBlankA4Sheet && (
            <PatientRegistrationPrintForm
              isModal={false}
              patientData={{
                uhid: "UHID-2026-1001",
                consentForTreatment: true,
                dpdpDigitalCommConsent: true,
              }}
            />
          )}

          {!wizardOpen && !showBlankA4Sheet && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900">Digital Registration Form is Closed</h3>
              <p className="text-xs text-slate-500">
                Reopen the digital intake wizard or preview the printable A4 hospital registration sheet above.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWizardOpen(true)}
                  className="rounded-lg bg-[#0284c7] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#0369a1]"
                >
                  Open Digital Intake Form
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlankA4Sheet(true)}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View A4 Printable Sheet
                </button>
              </div>
            </div>
          )}

          <RegisterPatientWizard
            isOpen={wizardOpen}
            onClose={() => {
              setWizardOpen(false);
              router.push("/patients");
            }}
            onSuccess={() => {
              router.push("/patients");
            }}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
