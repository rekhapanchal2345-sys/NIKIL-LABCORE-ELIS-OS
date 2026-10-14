"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import RegisterPatientWizard from "@/components/patients/RegisterPatientWizard";
import { ArrowLeft, UserPlus, Sparkles, Heart, ShieldCheck, Activity } from "lucide-react";

export default function NewPatientPage() {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(true);

  return (
    <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN", "BRANCH_ADMIN", "FRONT_DESK", "LAB_TECH", "DOCTOR", "PATHOLOGIST"]}>
      <DashboardLayout title="Register New Patient">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Link */}
          <Link
            href="/patients"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Patient Directory
          </Link>

          {/* Hero Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-sky-700 to-indigo-900 p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <UserPlus className="w-8 h-8" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-sky-100 uppercase tracking-wider inline-flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3" /> NABL & ABDM Enterprise LIS
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Register New Diagnostic Subject</h1>
                <p className="text-xs text-sky-100 mt-1 max-w-xl">
                  Register patients with NABL demographics, ABHA health records, emergency contacts, clinical allergies, and statutory DPDP Act 2023 consents.
                </p>
              </div>
            </div>
          </div>

          {/* Action card if modal was closed */}
          {!wizardOpen && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ready to register a new patient?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  The 7-step wizard handles personal demographics, contact, emergency kin, clinical allergies, insurance, and ABDM/DPDP consents.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-md"
              >
                Open Registration Wizard
              </button>
            </div>
          )}

          {/* 7-Step Enterprise Patient Wizard Modal (Exact styling of Doctor Wizard) */}
          <RegisterPatientWizard
            isOpen={wizardOpen}
            onClose={() => {
              setWizardOpen(false);
              router.push("/patients");
            }}
            onSuccess={(createdPatient) => {
              router.push("/patients");
            }}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
