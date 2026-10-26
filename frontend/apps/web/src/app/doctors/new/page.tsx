"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import RegisterDoctorWizard from "@/components/doctors/RegisterDoctorWizard";
import { ArrowLeft, UserPlus, Stethoscope, ShieldCheck, Building2, Award } from "lucide-react";

export default function NewDoctorPage() {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(true);

  return (
    <DashboardLayout title="Register New Doctor">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          href="/doctors"
          className="inline-flex items-center gap-2 text-xs font-bold text-sky-700 hover:text-sky-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Doctor Directory
        </Link>

        {/* Hero Banner (Ultra Light White Medical Theme) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs flex-shrink-0">
                <UserPlus className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Medical Council Compliance
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Register Doctor & Clinical Partner
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1 max-w-xl">
                  Onboard referring physicians, in-house consultants, pathologists with digital signatures and NABL authorization, or partner healthcare organizations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Stethoscope className="w-4 h-4 text-white" />
                <span>Open Registration Wizard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action card if modal was closed */}
        {!wizardOpen && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Registration Wizard Ready</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                The 8-step enterprise credentialing process verifies State/National Medical Council (NMC) registration, banking details, digital signatures, and automated commission structures.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition shadow-xs cursor-pointer"
            >
              Resume Registration Wizard
            </button>
          </div>
        )}

        {/* 8-Step Enterprise Doctor Wizard Modal */}
        <RegisterDoctorWizard
          isOpen={wizardOpen}
          onClose={() => {
            setWizardOpen(false);
            router.push("/doctors");
          }}
          onSuccess={() => {
            router.push("/doctors");
          }}
        />
      </div>
    </DashboardLayout>
  );
}
