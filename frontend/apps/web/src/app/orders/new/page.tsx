"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import RegisterOrderWizard from "@/components/orders/RegisterOrderWizard";
import {
  ArrowLeft,
  FlaskConical,
  Sparkles,
  Activity,
  Award,
  Plus,
} from "lucide-react";

export default function NewOrderWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramPatientId = searchParams.get("patientId") || undefined;
  const [wizardOpen, setWizardOpen] = useState(true);

  return (
    <ProtectedRoute>
      <DashboardLayout title="Register New Requisition">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Navigation */}
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-xs font-bold text-sky-700 hover:text-sky-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders Worklist
          </Link>

          {/* Hero Banner (Matching Patients New Page) */}
          <div className="rounded-3xl bg-gradient-to-r from-sky-700 via-indigo-800 to-sky-900 p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
                <FlaskConical className="w-8 h-8" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-sky-100 uppercase tracking-wider inline-flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3" /> NABL ISO 15189:2022 & CPOE
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Clinical Laboratory Requisition Desk
                </h1>
                <p className="text-xs text-sky-100 mt-1 max-w-xl">
                  Register doctor prescriptions, walk-in diagnostic investigations, vacutainer tube allocations, emergency STAT triage, and TPA / PMJAY billing settlement.
                </p>
              </div>
            </div>
          </div>

          {/* Re-Open Card if Modal was closed */}
          {!wizardOpen && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ready to create a clinical requisition?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  The multi-step clinical requisition wizard handles patient selection, referring doctor, prescribed assays, pre-analytical collection logistics, and NABL ledger billing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-[#0284c7] text-white text-xs font-semibold hover:bg-[#0369a1] transition shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Open Requisition Wizard
              </button>
            </div>
          )}

          {/* 6-Step Enterprise Requisition Wizard Modal (Exact RegisterPatientWizard Design, Format & Colours) */}
          <RegisterOrderWizard
            isOpen={wizardOpen}
            preselectedPatientId={paramPatientId}
            onClose={() => {
              setWizardOpen(false);
              router.push("/orders");
            }}
            onSuccess={(created) => {
              router.push("/orders");
            }}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
